"""Graamam Connect — Orders API.

Acts as the Firestore stand-in for Phase 1. The document shape mirrors the
planned Firestore contract so we can later swap in real Firebase without
touching the UI components.

Collection: `graamam_orders` (namespaced to graamam / *).
"""
from __future__ import annotations

import logging
import os
import uuid
from datetime import datetime, timezone
from typing import List, Optional

from fastapi import APIRouter, HTTPException, Query
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel, ConfigDict, Field, field_validator

logger = logging.getLogger(__name__)

# Reuse the app-wide Mongo client via env; the main app opens the connection.
_mongo_client: Optional[AsyncIOMotorClient] = None
_db = None


def _get_db():
    global _mongo_client, _db
    if _db is None:
        _mongo_client = AsyncIOMotorClient(os.environ["MONGO_URL"])
        _db = _mongo_client[os.environ["DB_NAME"]]
    return _db


ORDER_STATUSES = {
    "received",
    "warehouse_check",
    "ready_dispatch",
    "production_pending",
    "production_active",
    "procurement_pending",
    "dispatched",
    "closed",
}


class Customer(BaseModel):
    model_config = ConfigDict(extra="ignore")

    name: str
    initials: Optional[str] = None
    avatar_url: Optional[str] = None


class Order(BaseModel):
    model_config = ConfigDict(extra="ignore")

    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    order_id: str  # human-readable e.g., GC-8902
    customer: Customer
    items_count: int = 1
    items_summary: Optional[str] = None  # "3 items" or a specific description
    date: str  # ISO date (yyyy-mm-dd)
    total: float = 0.0
    status: str = "received"
    delivery_address: Optional[str] = None
    producer: Optional[str] = None
    speed: Optional[str] = "standard"
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    @field_validator("status")
    @classmethod
    def _status_ok(cls, v: str) -> str:
        v = (v or "").lower().strip()
        if v not in ORDER_STATUSES:
            raise ValueError(f"status must be one of {sorted(ORDER_STATUSES)}")
        return v


class OrderCreate(BaseModel):
    model_config = ConfigDict(extra="ignore")

    order_id: Optional[str] = None  # auto-generated if omitted
    customer_name: str
    customer_initials: Optional[str] = None
    customer_avatar_url: Optional[str] = None
    items_count: int = 1
    items_summary: Optional[str] = None
    date: Optional[str] = None  # defaults to today
    total: float = 0.0
    status: str = "received"
    delivery_address: Optional[str] = None
    producer: Optional[str] = None
    speed: Optional[str] = "standard"


class OrderStatusUpdate(BaseModel):
    status: str


router = APIRouter(prefix="/graamam/orders", tags=["graamam-orders"])


def _serialize(doc: dict) -> dict:
    doc = dict(doc)
    doc.pop("_id", None)
    if isinstance(doc.get("created_at"), str):
        try:
            doc["created_at"] = datetime.fromisoformat(doc["created_at"])
        except Exception:
            pass
    return doc


def _next_order_id_seed(existing: List[dict]) -> str:
    numeric = []
    for o in existing:
        oid = (o.get("order_id") or "").split("-")[-1]
        try:
            numeric.append(int(oid))
        except Exception:
            continue
    n = max(numeric) + 1 if numeric else 8900
    return f"GC-{n}"


@router.get("", response_model=List[Order])
async def list_orders(status: Optional[str] = Query(default=None)):
    db = _get_db()
    q: dict = {}
    if status:
        s = status.lower().strip()
        if s not in ORDER_STATUSES and s != "all":
            raise HTTPException(400, f"status must be one of {sorted(ORDER_STATUSES)} or 'all'")
        if s != "all":
            q["status"] = s
    docs = (
        await db.graamam_orders.find(q, {"_id": 0})
        .sort("created_at", -1)
        .to_list(length=1000)
    )
    return [_serialize(d) for d in docs]


@router.get("/counts")
async def status_counts():
    """Return counts per status for badge rendering."""
    db = _get_db()
    counts = {s: 0 for s in ORDER_STATUSES}
    counts["all"] = 0
    pipeline = [{"$group": {"_id": "$status", "n": {"$sum": 1}}}]
    async for row in db.graamam_orders.aggregate(pipeline):
        s = (row.get("_id") or "").lower()
        counts["all"] += row["n"]
        if s in counts:
            counts[s] = row["n"]
    return counts


@router.post("", response_model=Order, status_code=201)
async def create_order(payload: OrderCreate):
    db = _get_db()

    if not payload.customer_name or not payload.customer_name.strip():
        raise HTTPException(400, "customer_name is required")
    status_l = (payload.status or "received").lower().strip()
    if status_l not in ORDER_STATUSES:
        raise HTTPException(400, f"status must be one of {sorted(ORDER_STATUSES)}")

    order_id = (payload.order_id or "").strip()
    if not order_id:
        existing = await db.graamam_orders.find({}, {"_id": 0, "order_id": 1}).to_list(length=5000)
        order_id = _next_order_id_seed(existing)

    # de-dupe by order_id
    if await db.graamam_orders.find_one({"order_id": order_id}, {"_id": 1}):
        raise HTTPException(409, f"Order {order_id} already exists")

    name = payload.customer_name.strip()
    initials = (payload.customer_initials or "").strip()
    if not initials:
        parts = [p for p in name.split() if p]
        initials = "".join(p[0] for p in parts[:2]).upper() or name[:2].upper()

    order = Order(
        order_id=order_id,
        customer=Customer(
            name=name,
            initials=initials,
            avatar_url=payload.customer_avatar_url or None,
        ),
        items_count=max(1, int(payload.items_count or 1)),
        items_summary=payload.items_summary
        or (f"{max(1, int(payload.items_count or 1))} items"),
        date=payload.date or datetime.now(timezone.utc).date().isoformat(),
        total=float(payload.total or 0.0),
        status=status_l,
        delivery_address=payload.delivery_address,
        producer=payload.producer,
        speed=payload.speed or "standard",
    )
    doc = order.model_dump()
    doc["created_at"] = doc["created_at"].isoformat()
    await db.graamam_orders.insert_one(doc)
    try:
        from .graamam_audit import log_action
        await log_action(
            order.order_id,
            f"Order {order.order_id} created for {name} — {order.items_count} items, \u20b9{order.total} ({status_l})",
            None,
        )
    except Exception:
        pass
    return order


@router.post("/{order_id}/cancel")
async def cancel_order(order_id: str, reason: Optional[str] = None):
    """§7.3 cancellation (basic form): flip to cancelled, auto-close threads."""
    db = _get_db()
    order = await db.graamam_orders.find_one({"order_id": order_id}, {"_id": 0})
    if not order:
        raise HTTPException(404, f"order {order_id} not found")
    if order.get("status") in ("dispatched", "closed", "cancelled"):
        raise HTTPException(400, f"order already terminal: {order.get('status')}")
    prev = order.get("status")
    await db.graamam_orders.update_one({"order_id": order_id}, {"$set": {"status": "cancelled", "cancelled_at_stage": prev, "cancel_reason": reason}})
    now = datetime.now(timezone.utc).isoformat()
    await db.graamam_orders.database.graamam_threads.update_many(
        {"$or": [{"link_id": order_id, "status": "open"}, {"link_type": "order", "link_id": order_id, "status": "open"}]},
        {"$set": {"status": "closed", "closed_reason": "order_cancelled", "closed_at": now}},
    )
    try:
        from .graamam_audit import log_action
        await log_action(order_id, f"Order {order_id} cancelled at stage '{prev}'" + (f" — reason: {reason}" if reason else ""), None)
    except Exception:
        pass
    return {"ok": True, "cancelled_at_stage": prev}


@router.post("/{order_id}/status", response_model=Order)
async def update_order_status(order_id: str, payload: OrderStatusUpdate):
    db = _get_db()
    status_l = (payload.status or "").lower().strip()
    if status_l not in ORDER_STATUSES:
        raise HTTPException(400, f"status must be one of {sorted(ORDER_STATUSES)}")
    r = await db.graamam_orders.update_one({"order_id": order_id}, {"$set": {"status": status_l}})
    if not r.matched_count:
        raise HTTPException(404, f"order {order_id} not found")
    doc = await db.graamam_orders.find_one({"order_id": order_id}, {"_id": 0})
    return _serialize(doc)


# ---------- Seeding ----------
SEED_ORDERS: List[dict] = [
    {
        "order_id": "GC-8902",
        "customer": {
            "name": "Priya Sharma",
            "initials": "PS",
            "avatar_url": "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=96&h=96&fit=crop&crop=faces",
        },
        "items_count": 3,
        "items_summary": "3 items",
        "date": "2024-11-24",
        "total": 14250.0,
        "status": "received",
        "delivery_address": "12, Indira Nagar 1st Stage, Bengaluru 560038",
        "producer": "Demo Village Two Estates",
    },
    {
        "order_id": "GC-8901",
        "customer": {"name": "Rajesh Iyer", "initials": "RI", "avatar_url": None},
        "items_count": 1,
        "items_summary": "1 item",
        "date": "2024-11-24",
        "total": 4500.0,
        "status": "received",
        "delivery_address": "Flat 3B, Adyar, Chennai 600020",
        "producer": "Demo Village Six Turmeric Co-op",
    },
    {
        "order_id": "GC-8900",
        "customer": {
            "name": "Ananya Reddy",
            "initials": "AR",
            "avatar_url": "https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=96&h=96&fit=crop&crop=faces",
        },
        "items_count": 2,
        "items_summary": "2 items",
        "date": "2024-11-24",
        "total": 8800.0,
        "status": "received",
        "delivery_address": "18 Jubilee Hills, Hyderabad 500033",
        "producer": "Demo Village Four Weavers Collective",
    },
    {
        "order_id": "GC-8899",
        "customer": {
            "name": "Arjun Menon",
            "initials": "AM",
            "avatar_url": "https://images.unsplash.com/photo-1552058544-f2b08422138a?w=96&h=96&fit=crop&crop=faces",
        },
        "items_count": 5,
        "items_summary": "5 items",
        "date": "2024-11-23",
        "total": 28000.0,
        "status": "warehouse_check",
        "delivery_address": "Ravi Villa, Panampilly Nagar, Kochi 682036",
        "producer": "Demo Village Seven Apiary",
    },
    {
        "order_id": "GC-8898",
        "customer": {
            "name": "Sana Krishnan",
            "initials": "SK",
            "avatar_url": "https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=96&h=96&fit=crop&crop=faces",
        },
        "items_count": 4,
        "items_summary": "4 items",
        "date": "2024-11-23",
        "total": 19575.0,
        "status": "warehouse_check",
        "delivery_address": "42 Sample Nagar, Pune 411006",
        "producer": "Coastal Artisans",
    },
    {
        "order_id": "GC-8897",
        "customer": {
            "name": "Rohit Deshpande",
            "initials": "RD",
            "avatar_url": None,
        },
        "items_count": 6,
        "items_summary": "6 items",
        "date": "2024-11-22",
        "total": 31200.0,
        "status": "ready_dispatch",
        "delivery_address": "Marine Drive, Kochi 682011",
        "producer": "Demo Village Six Turmeric Co-op",
    },
    {
        "order_id": "GC-8896",
        "customer": {
            "name": "Leela Fernandes",
            "initials": "LF",
            "avatar_url": "https://images.unsplash.com/photo-1607746882042-944635dfe10e?w=96&h=96&fit=crop&crop=faces",
        },
        "items_count": 2,
        "items_summary": "2 items",
        "date": "2024-11-21",
        "total": 7450.0,
        "status": "closed",
        "delivery_address": "Bandra West, Mumbai 400050",
        "producer": "Demo Village Eight Herbal Co-op",
    },
    {
        "order_id": "GC-8895",
        "customer": {
            "name": "Devraj Oberoi",
            "initials": "DO",
            "avatar_url": None,
        },
        "items_count": 3,
        "items_summary": "3 items",
        "date": "2024-11-20",
        "total": 12890.0,
        "status": "closed",
        "delivery_address": "Vasant Vihar, New Delhi 110057",
        "producer": "Demo Village One Weavers",
    },
]


async def seed_orders_if_empty():
    """Idempotent seed: adds any missing seed order by `order_id`."""
    db = _get_db()
    existing_ids = {
        d["order_id"]
        async for d in db.graamam_orders.find({}, {"_id": 0, "order_id": 1})
    }
    inserted = 0
    for i, seed in enumerate(SEED_ORDERS):
        if seed["order_id"] in existing_ids:
            continue
        doc = {
            "id": str(uuid.uuid4()),
            **seed,
            # older orders further in the past by index for stable sort
            "created_at": datetime(2023, 10, 24, 12, 0, tzinfo=timezone.utc)
            .replace(hour=max(0, 12 - i))
            .isoformat(),
        }
        await db.graamam_orders.insert_one(doc)
        inserted += 1
    if inserted:
        logger.info("[graamam.orders] seeded %d order(s)", inserted)
