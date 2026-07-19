from fastapi import FastAPI, APIRouter
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List
import uuid
from datetime import datetime, timezone

from routers.graamam_orders import router as graamam_orders_router, seed_orders_if_empty
from routers.graamam_producers import router as graamam_producers_router, seed_producers_if_empty
from routers.graamam_inventory import router as graamam_inventory_router, seed_inventory_if_empty, seed_raw_materials_if_empty
from routers.graamam_batches import router as graamam_batches_router, seed_batches_if_empty
from routers.graamam_production import router as graamam_production_router
from routers.graamam_procurement import router as graamam_procurement_router, seed_procurement_if_empty
from routers.graamam_proc_tokens import router as graamam_proc_tokens_router
from routers.graamam_dispatch import router as graamam_dispatch_router, seed_shipments_if_empty
from routers.graamam_warehouse import router as graamam_warehouse_router
from routers.graamam_store import router as graamam_store_router, seed_store_if_empty
from routers.graamam_reports import router as graamam_reports_router
from routers.graamam_dashboard import router as graamam_dashboard_router
from routers.graamam_master_api import router as graamam_master_router
from routers.graamam_extras import app_router as graamam_extras_router
from routers.graamam_auth import router as graamam_auth_router
from routers.graamam_audit import router as graamam_audit_router, log_action as _audit_log
from routers.graamam_master import import_master_data
from routers._shared import ensure_unique_indexes


ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app without a prefix
app = FastAPI(title="ProtoVillage API", version="0.1.0")

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")


# Define Models
class StatusCheck(BaseModel):
    model_config = ConfigDict(extra="ignore")  # Ignore MongoDB's _id field
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    client_name: str
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class StatusCheckCreate(BaseModel):
    client_name: str

# Add your routes to the router instead of directly to app
@api_router.get("/")
async def root():
    return {"message": "Hello World"}

@api_router.post("/status", response_model=StatusCheck)
async def create_status_check(input: StatusCheckCreate):
    status_dict = input.model_dump()
    status_obj = StatusCheck(**status_dict)
    
    # Convert to dict and serialize datetime to ISO string for MongoDB
    doc = status_obj.model_dump()
    doc['timestamp'] = doc['timestamp'].isoformat()
    
    _ = await db.status_checks.insert_one(doc)
    return status_obj

@api_router.get("/status", response_model=List[StatusCheck])
async def get_status_checks():
    # Exclude MongoDB's _id field from the query results
    status_checks = await db.status_checks.find({}, {"_id": 0}).to_list(1000)
    
    # Convert ISO string timestamps back to datetime objects
    for check in status_checks:
        if isinstance(check['timestamp'], str):
            check['timestamp'] = datetime.fromisoformat(check['timestamp'])
    
    return status_checks

# Include the router in the main app
api_router.include_router(graamam_orders_router)
api_router.include_router(graamam_producers_router)
api_router.include_router(graamam_inventory_router)
api_router.include_router(graamam_batches_router)
api_router.include_router(graamam_production_router)
api_router.include_router(graamam_procurement_router)
api_router.include_router(graamam_dispatch_router)
api_router.include_router(graamam_warehouse_router)
api_router.include_router(graamam_proc_tokens_router)
api_router.include_router(graamam_store_router)
api_router.include_router(graamam_reports_router)
api_router.include_router(graamam_dashboard_router)
api_router.include_router(graamam_master_router)
api_router.include_router(graamam_extras_router)
api_router.include_router(graamam_auth_router)
api_router.include_router(graamam_audit_router)
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


@app.on_event("startup")
async def seed_startup():
    try:
        # Clear old $-priced order seed set if it exists (one-time migration to INR)
        try:
            from motor.motor_asyncio import AsyncIOMotorClient
            _c = AsyncIOMotorClient(os.environ["MONGO_URL"])
            _db = _c[os.environ["DB_NAME"]]
            has_old = await _db.graamam_orders.find_one({"order_id": "GC-8902", "total": {"$lt": 1000}}, {"_id": 1})
            if has_old:
                await _db.graamam_orders.delete_many({"order_id": {"$in": ["GC-8902","GC-8901","GC-8900","GC-8899","GC-8898","GC-8897","GC-8896","GC-8895"]}})
                logger.info("[startup] cleared legacy dollar-priced order seeds")

            # ---- One-time migration: 4-status -> 8-status flow ----
            legacy_map = {
                "new":        "received",
                "packing":    "warehouse_check",
                "delivered":  "closed",
                # 'dispatched' stays as-is (both maps allow it)
            }
            for old, new in legacy_map.items():
                r = await _db.graamam_orders.update_many({"status": old}, {"$set": {"status": new}})
                if r.modified_count:
                    logger.info("[startup] migrated %d orders %s -> %s", r.modified_count, old, new)
        except Exception:
            pass

        await seed_orders_if_empty()
        await seed_producers_if_empty()
        await seed_inventory_if_empty()
        # Import ProtoVillage / Graamam master data (replaces fake inventory
        # with real Products + brings in B2B/B2C customers + Costing + Recipes).
        await import_master_data()
        await seed_batches_if_empty()
        await seed_raw_materials_if_empty()
        await seed_procurement_if_empty()
        await seed_shipments_if_empty()
        await seed_store_if_empty()
        # FIX 1: unique-index guarantee on top of the atomic FY counter —
        # order_id/wh_token/prod_token/invoice_id can never collide.
        await ensure_unique_indexes(db)
    except Exception as e:  # pragma: no cover
        logger.exception("[startup] seeding graamam collections failed: %s", e)


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()