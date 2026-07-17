"""Graamam Connect — Dispatch operations.

Drives from orders that are ready for dispatch (status = 'packing' or
'ready_dispatch'). Marking dispatched flips the order status to 'dispatched'
and records a shipment document.
"""
from __future__ import annotations

from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, ConfigDict, Field

from ._shared import get_db, gen_id, serialize, now_ist

router = APIRouter(prefix="/graamam/dispatch", tags=["graamam-dispatch"])

COURIERS = [
    "Delhivery", "Blue Dart", "DTDC", "Ecom Express", "Shiprocket",
    "India Post Speed Post", "XpressBees",
]


class Shipment(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=gen_id)
    shipment_id: str  # SHP-…
    order_id: str
    customer_name: str
    address: str
    items_count: int = 1
    box_count: int = 1
    courier: str = "Delhivery"
    speed: str = "standard"  # standard | express
    dispatched_at: datetime = Field(default_factory=now_ist)


class MarkDispatchedPayload(BaseModel):
    order_id: str
    courier: str = "Delhivery"
    box_count: int = 1
    address: Optional[str] = None
    speed: str = "standard"


@router.get("/queue")
async def dispatch_queue():
    """Orders currently in 'packing' status, ready to be dispatched."""
    db = get_db()
    docs = await db.graamam_orders.find({"status": "packing"}, {"_id": 0}).sort("created_at", -1).to_list(200)
    out = []
    for d in docs:
        d.pop("_id", None)
        out.append({
            "order_id": d["order_id"],
            "customer": d.get("customer", {}),
            "items_count": d.get("items_count", 1),
            "items_summary": d.get("items_summary") or f"{d.get('items_count', 1)} items",
            "total": d.get("total", 0),
            "date": d.get("date"),
            "address": d.get("delivery_address") or "Village Co-op Grocery, MG Road, Bengaluru",
            "speed": d.get("speed") or "standard",
        })
    return out


@router.get("/recent")
async def recent_dispatches(limit: int = 10):
    db = get_db()
    docs = await db.graamam_shipments.find({}, {"_id": 0}).sort("dispatched_at", -1).to_list(int(limit))
    return [serialize(d) for d in docs]


@router.post("/mark", status_code=201)
async def mark_dispatched(payload: MarkDispatchedPayload):
    db = get_db()
    order = await db.graamam_orders.find_one({"order_id": payload.order_id}, {"_id": 0})
    if not order:
        raise HTTPException(404, f"order {payload.order_id} not found")
    # generate shipment id
    n = await db.graamam_shipments.count_documents({}) + 1
    ship = Shipment(
        shipment_id=f"SHP-{now_ist().year}-{n:04d}",
        order_id=payload.order_id,
        customer_name=order.get("customer", {}).get("name", "Unknown"),
        address=payload.address or order.get("delivery_address") or "MG Road, Bengaluru",
        items_count=int(order.get("items_count", 1)),
        box_count=int(payload.box_count),
        courier=payload.courier,
        speed=payload.speed,
    )
    doc = ship.model_dump()
    doc["dispatched_at"] = doc["dispatched_at"].isoformat()
    await db.graamam_shipments.insert_one(doc)
    await db.graamam_orders.update_one({"order_id": payload.order_id}, {"$set": {"status": "dispatched"}})
    return ship


@router.get("/history")
async def dispatch_history():
    return await recent_dispatches(limit=100)


SEED_SHIPMENTS = [
    {"shipment_id": "SHP-2024-0019", "order_id": "ORD-8819", "customer_name": "Heritage Markets", "address": "88 Brigade Road, Bengaluru 560025", "items_count": 7, "box_count": 2, "courier": "Delhivery", "speed": "standard"},
    {"shipment_id": "SHP-2024-0018", "order_id": "ORD-8818", "customer_name": "Local Pantry Inc.", "address": "14 Anna Nagar, Chennai 600040", "items_count": 5, "box_count": 1, "courier": "Blue Dart", "speed": "express"},
    {"shipment_id": "SHP-2024-0015", "order_id": "ORD-8815", "customer_name": "Green Roots Cafe", "address": "Andheri West, Mumbai 400058", "items_count": 3, "box_count": 1, "courier": "DTDC", "speed": "standard"},
]


async def seed_shipments_if_empty():
    db = get_db()
    existing = {d["shipment_id"] async for d in db.graamam_shipments.find({}, {"_id": 0, "shipment_id": 1})}
    inserted = 0
    for i, s in enumerate(SEED_SHIPMENTS):
        if s["shipment_id"] in existing:
            continue
        doc = {"id": gen_id(), **s, "dispatched_at": now_ist().replace(hour=max(0, 18 - i)).isoformat()}
        await db.graamam_shipments.insert_one(doc)
        inserted += 1
    return inserted
