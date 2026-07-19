"""Graamam Connect — Dispatch operations.

v2 parity (pgDispatch / dispatchOrder): orders sitting at status
'ready_dispatch' (confirmed by the Warehouse stock-check) show up here.
"Dispatch Order" re-verifies finished stock, deducts it, flips the order
to 'dispatched', records who/when, and auto-generates the tax invoice —
there is no manual "Raise Invoice" step anymore.
"""
from __future__ import annotations

from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, ConfigDict, Field

from ._shared import get_db, gen_id, serialize, now_ist, order_availability

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


class DispatchOrderPayload(BaseModel):
    model_config = ConfigDict(extra="ignore")
    dispatched_by: Optional[str] = None


@router.get("/queue")
async def dispatch_queue():
    """§ Ready for Dispatch — orders at status 'ready_dispatch', each with
    per-line qty + current finished stock (v2: `${it.product} × ${it.qty}
    (stock ${finishedQty(it.productId)})`)."""
    db = get_db()
    docs = await db.graamam_orders.find({"status": "ready_dispatch"}, {"_id": 0}).sort("created_at", 1).to_list(200)
    out = []
    for d in docs:
        availability = await order_availability(db, d)
        out.append({
            "order_id": d.get("order_id"),
            "order_type": d.get("order_type"),
            "customer": d.get("customer", {}),
            "wh_token": d.get("wh_token"),
            "items_summary": d.get("items_summary") or f"{d.get('items_count', 1)} items",
            "items_count": d.get("items_count", 1),
            "items": availability,
            "total": d.get("total", 0),
            "date": d.get("date"),
            "address": d.get("delivery_address") or "",
        })
    return out


@router.get("/dispatched")
async def dispatched_orders(limit: int = 200):
    """§ Dispatched — orders that have actually been dispatched, with the
    auto-generated invoice # attached."""
    db = get_db()
    docs = await db.graamam_orders.find({"status": "dispatched"}, {"_id": 0}).sort("dispatched_at", -1).to_list(int(limit))
    return [{
        "order_id": d.get("order_id"),
        "customer": d.get("customer", {}),
        "items_summary": d.get("items_summary") or f"{d.get('items_count', 1)} items",
        "items_count": d.get("items_count", 1),
        "invoice_id": d.get("invoice_id"),
        "dispatched_by": d.get("dispatched_by"),
        "dispatched_at": d.get("dispatched_at"),
    } for d in docs]


@router.post("/{order_id}/dispatch", status_code=201)
async def dispatch_order(order_id: str, payload: DispatchOrderPayload = DispatchOrderPayload()):
    """dispatchOrder(orderId) replica:
    1) order must be 'ready_dispatch'
    2) re-verify finished stock is STILL sufficient (it may have moved)
    3) deduct finished stock for every line
    4) status -> dispatched, record dispatchedBy/dispatchedAt
    5) auto-generate the tax invoice (GST-correct, B2B/B2C aware) — invoiceId stored on the order
    """
    db = get_db()
    order = await db.graamam_orders.find_one({"order_id": order_id}, {"_id": 0})
    if not order:
        raise HTTPException(404, f"order {order_id} not found")
    if order.get("status") != "ready_dispatch":
        raise HTTPException(400, f"order is not ready for dispatch (status={order.get('status')})")

    availability = await order_availability(db, order)
    if not availability or not all(a["ok"] for a in availability):
        raise HTTPException(400, "Finished stock is no longer sufficient for this order.")

    # Deduct finished stock for every real product line.
    for it in availability:
        pid = it.get("product_id")
        if pid:
            await db.graamam_inventory.update_one({"sku": pid}, {"$inc": {"qty_on_hand": -it["qty"]}})

    now = now_ist().isoformat()
    dispatched_by = (payload.dispatched_by or "Dispatch Team").strip() or "Dispatch Team"
    await db.graamam_orders.update_one(
        {"order_id": order_id},
        {"$set": {"status": "dispatched", "dispatched_by": dispatched_by, "dispatched_at": now}},
    )

    # Auto-generate the tax invoice — no manual "Raise Invoice" step anymore.
    invoice_id = None
    try:
        from .graamam_extras import create_invoice_from_order
        inv = await create_invoice_from_order(order_id)
        invoice_id = inv.get("invoice_id")
    except Exception:
        pass  # invoice may already exist for this order; not fatal

    # Also record a shipment for courier/box tracking continuity.
    try:
        n = await db.graamam_shipments.count_documents({}) + 1
        ship_doc = {
            "id": gen_id(), "shipment_id": f"SHP-{now_ist().year}-{n:04d}", "order_id": order_id,
            "customer_name": (order.get("customer") or {}).get("name", "Unknown"),
            "address": order.get("delivery_address") or "",
            "items_count": int(order.get("items_count", 1)), "box_count": 1,
            "courier": "Delhivery", "speed": order.get("speed") or "standard",
            "dispatched_at": now,
        }
        await db.graamam_shipments.insert_one(ship_doc)
    except Exception:
        pass

    # Auto-close discussion threads linked to this order.
    await db.graamam_threads.update_many(
        {"$or": [
            {"link_id": order_id, "status": "open"},
            {"link_type": "order", "link_id": order_id, "status": "open"},
        ]},
        {"$set": {"status": "closed", "closed_reason": "order_dispatched", "closed_at": now}},
    )

    from .graamam_audit import log_action
    inv_note = f" {order.get('order_type', 'b2b').upper()} Tax Invoice {invoice_id} auto-generated." if invoice_id else ""
    await log_action(
        order_id,
        f"Order dispatched to {(order.get('customer') or {}).get('name', '?')} by {dispatched_by}.{inv_note} Finished stock reduced.",
        None, sub_token=invoice_id,
    )

    doc = await db.graamam_orders.find_one({"order_id": order_id}, {"_id": 0})
    return serialize(doc)


@router.get("/recent")
async def recent_dispatches(limit: int = 10):
    db = get_db()
    docs = await db.graamam_shipments.find({}, {"_id": 0}).sort("dispatched_at", -1).to_list(int(limit))
    return [serialize(d) for d in docs]


@router.post("/mark", status_code=201)
async def mark_dispatched(payload: MarkDispatchedPayload):
    """Legacy manual-courier dispatch path — kept for backward
    compatibility. New UI uses POST /{order_id}/dispatch instead, which
    also verifies + deducts finished stock."""
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

    # §7.9 auto-generate invoice at dispatch (best-effort — inline import to
    # avoid cycles). B2C would auto-mark paid; here we treat as B2B by default.
    try:
        from .graamam_extras import create_invoice_from_order
        await create_invoice_from_order(payload.order_id)
    except Exception:
        pass  # invoice may already exist for this order; not fatal

    # §7.19 auto-close discussion threads linked to this order.
    now = now_ist().isoformat()
    await db.graamam_threads.update_many(
        {"$or": [
            {"link_id": payload.order_id, "status": "open"},
            {"link_type": "order", "link_id": payload.order_id, "status": "open"},
        ]},
        {"$set": {"status": "closed", "closed_reason": "order_dispatched", "closed_at": now}},
    )

    # §10 audit
    from .graamam_audit import log_action
    await log_action(
        payload.order_id,
        f"Order dispatched via {payload.courier} ({payload.speed}), shipment {ship.shipment_id} to {order.get('customer',{}).get('name','?')}",
        None, sub_token=ship.shipment_id,
    )

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
