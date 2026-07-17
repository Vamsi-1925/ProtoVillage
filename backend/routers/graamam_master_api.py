"""Master Data API — read/write for Products, B2B/B2C Customers, Costing."""
from __future__ import annotations

from typing import Optional
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, ConfigDict

from ._shared import get_db, serialize, gen_id
from .graamam_master import COMPANY

router = APIRouter(prefix="/graamam/master", tags=["graamam-master"])


@router.get("/company")
async def get_company():
    return COMPANY


@router.get("/products")
async def list_products(category: Optional[str] = None, q: Optional[str] = None):
    db = get_db()
    query = {}
    if category and category.lower() != "all":
        query["category"] = category
    if q:
        query["$or"] = [
            {"name": {"$regex": q, "$options": "i"}},
            {"product_id": {"$regex": q, "$options": "i"}},
        ]
    docs = await db.graamam_products.find(query, {"_id": 0}).sort("product_id", 1).to_list(1000)
    return [serialize(d) for d in docs]


@router.get("/customers/b2b")
async def list_b2b_customers():
    db = get_db()
    return [serialize(d) async for d in db.graamam_customers_b2b.find({}, {"_id": 0}).sort("name", 1)]


@router.get("/customers/b2c")
async def list_b2c_customers(q: Optional[str] = None):
    db = get_db()
    query = {}
    if q:
        query["$or"] = [
            {"name": {"$regex": q, "$options": "i"}},
            {"mobile": {"$regex": q, "$options": "i"}},
            {"city": {"$regex": q, "$options": "i"}},
        ]
    return [serialize(d) async for d in db.graamam_customers_b2c.find(query, {"_id": 0}).limit(200)]


@router.get("/costing")
async def list_costing():
    db = get_db()
    return [serialize(d) async for d in db.graamam_costing.find({}, {"_id": 0}).sort("mainProduct", 1)]


@router.get("/summary")
async def summary():
    db = get_db()
    return {
        "products": await db.graamam_products.count_documents({}),
        "b2b_customers": await db.graamam_customers_b2b.count_documents({}),
        "b2c_customers": await db.graamam_customers_b2c.count_documents({}),
        "costing": await db.graamam_costing.count_documents({}),
    }


class ProductPayload(BaseModel):
    model_config = ConfigDict(extra="ignore")
    product_id: Optional[str] = None
    name: str
    category: str = "Other"
    pack: str = ""
    hsn: str = "2106"
    gst_rate: float = 5
    shelf_life: str = ""
    mrp_inr: float = 0
    discount_pct: float = 0


@router.post("/products", status_code=201)
async def create_product(payload: ProductPayload):
    db = get_db()
    if not payload.name.strip():
        raise HTTPException(400, "name is required")
    docs = await db.graamam_products.find({}, {"_id": 0, "product_id": 1}).to_list(5000)
    nums = []
    for d in docs:
        pid = (d.get("product_id") or "").replace("P", "")
        if pid.isdigit():
            nums.append(int(pid))
    pid = payload.product_id or f"P{(max(nums) + 1 if nums else 200):03d}"
    doc = {"id": gen_id(), "product_id": pid, **payload.model_dump(exclude={"product_id"})}
    doc["icon"] = "eco"
    await db.graamam_products.insert_one(doc)
    return {k: v for k, v in doc.items() if k != "_id"}
