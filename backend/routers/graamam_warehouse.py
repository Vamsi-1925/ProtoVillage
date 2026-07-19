"""Graamam Connect — Warehouse (stock-check gate).

Replica of graamam_v2's pgWarehouse / warehouseReady / warehouseRaiseProd.
Every order created via the New Order form starts at status
'warehouse_check' with a WH-<FY>-#### token. This module lists those
orders with per-line finished-goods availability (reusing
`graamam_inventory.qty_on_hand`, keyed by SKU == product_id), and lets the
warehouse team either mark the order Ready for Dispatch (stock is
sufficient for every line) or Raise Production (stock is short) —
generating a PROD-<FY>-#### token in the latter case.
"""
from __future__ import annotations

from typing import Optional
from fastapi import APIRouter, HTTPException

from ._shared import get_db, gen_id, serialize, now_ist
from .graamam_orders import _next_fy_token

router = APIRouter(prefix="/graamam/warehouse", tags=["graamam-warehouse"])

# Statuses an order can be in once it has cleared (or been routed out of)
# the warehouse stock-check stage.
PROCESSED_STATUSES = [
    "ready_dispatch", "production_pending", "production_active",
    "procurement_pending", "dispatched", "closed",
]


async def _finished_qty(db, product_id: Optional[str]) -> float:
    if not product_id:
        return 0.0
    doc = await db.graamam_inventory.find_one({"sku": product_id}, {"_id": 0, "qty_on_hand": 1})
    return float(doc.get("qty_on_hand") or 0) if doc else 0.0


async def _order_availability(db, order: dict) -> list:
    """Mirrors v2's orderItemsAvailability(): [{...it, available, ok}]."""
    items = order.get("items") or []
    if not items:
        # Legacy / lump-sum order with no real product lines — stock can't
        # be verified, so route it to production rather than risk a false
        # "Ready for Dispatch".
        return [{
            "product_id": None,
            "product": order.get("items_summary") or "Unspecified items",
            "unit": "",
            "qty": float(order.get("items_count") or 1),
            "available": 0.0,
            "ok": False,
        }]
    out = []
    for it in items:
        qty = float(it.get("qty") or 0)
        avail = await _finished_qty(db, it.get("product_id"))
        out.append({
            "product_id": it.get("product_id"),
            "product": it.get("product") or "Item",
            "unit": it.get("unit") or "",
            "qty": qty,
            "available": avail,
            "ok": avail >= qty,
        })
    return out


@router.get("/pending")
async def list_pending():
    """§ Pending Stock Check — every order at status 'warehouse_check'."""
    db = get_db()
    docs = await db.graamam_orders.find({"status": "warehouse_check"}, {"_id": 0}).sort("created_at", 1).to_list(500)
    out = []
    for o in docs:
        availability = await _order_availability(db, o)
        out.append({
            "order_id": o.get("order_id"),
            "order_type": o.get("order_type"),
            "customer": o.get("customer"),
            "wh_token": o.get("wh_token"),
            "items_summary": o.get("items_summary"),
            "items_count": o.get("items_count"),
            "created_at": o.get("created_at"),
            "availability": availability,
            "all_available": all(a["ok"] for a in availability) if availability else False,
        })
    return out


@router.get("/processed")
async def list_processed():
    """§ Processed — orders that have cleared the warehouse stage."""
    db = get_db()
    docs = await db.graamam_orders.find(
        {"status": {"$in": PROCESSED_STATUSES}, "wh_outcome": {"$in": ["ready_for_dispatch", "production_raised"]}},
        {"_id": 0},
    ).sort("wh_processed_at", -1).to_list(500)
    return [{
        "order_id": o.get("order_id"),
        "wh_token": o.get("wh_token"),
        "customer": o.get("customer"),
        "items_summary": o.get("items_summary"),
        "outcome": o.get("wh_outcome"),
        "processed_by": o.get("wh_processed_by"),
        "processed_at": o.get("wh_processed_at"),
    } for o in docs]


@router.get("/finished-goods")
async def finished_goods():
    """§ Collapsible Finished Goods stock reference."""
    db = get_db()
    products = await db.graamam_products.find({}, {"_id": 0}).sort("product_id", 1).to_list(1000)
    out = []
    for p in products:
        qty = await _finished_qty(db, p.get("product_id"))
        out.append({
            "product_id": p.get("product_id"),
            "name": p.get("name"),
            "unit": p.get("pack") or "",
            "available": qty,
            "in_stock": qty > 0,
        })
    return out


@router.post("/{order_id}/ready")
async def mark_ready(order_id: str):
    """warehouseReady(whId) replica: stock sufficient -> ready_dispatch."""
    db = get_db()
    order = await db.graamam_orders.find_one({"order_id": order_id}, {"_id": 0})
    if not order:
        raise HTTPException(404, f"order {order_id} not found")
    if order.get("status") != "warehouse_check":
        raise HTTPException(400, f"order is not pending stock check (status={order.get('status')})")
    availability = await _order_availability(db, order)
    if not availability or not all(a["ok"] for a in availability):
        raise HTTPException(400, "Stock is no longer sufficient. Please raise production instead.")

    now = now_ist().isoformat()
    await db.graamam_orders.update_one(
        {"order_id": order_id},
        {"$set": {
            "status": "ready_dispatch",
            "wh_outcome": "ready_for_dispatch",
            "wh_processed_by": "Warehouse",
            "wh_processed_at": now,
        }},
    )
    try:
        from .graamam_audit import log_action
        await log_action(order_id, "Stock available — order marked Ready for Dispatch", None, sub_token=order.get("wh_token"))
    except Exception:
        pass
    doc = await db.graamam_orders.find_one({"order_id": order_id}, {"_id": 0})
    return serialize(doc)


@router.post("/{order_id}/raise-production")
async def raise_production(order_id: str):
    """warehouseRaiseProd(whId) replica: stock short -> production_pending
    + a new PROD-<FY>-#### token."""
    db = get_db()
    order = await db.graamam_orders.find_one({"order_id": order_id}, {"_id": 0})
    if not order:
        raise HTTPException(404, f"order {order_id} not found")
    if order.get("status") != "warehouse_check":
        raise HTTPException(400, f"order is not pending stock check (status={order.get('status')})")

    prod_token = await _next_fy_token(db, "PROD")
    now = now_ist().isoformat()
    await db.graamam_orders.update_one(
        {"order_id": order_id},
        {"$set": {
            "status": "production_pending",
            "prod_token": prod_token,
            "wh_outcome": "production_raised",
            "wh_processed_by": "Warehouse",
            "wh_processed_at": now,
        }},
    )

    items = order.get("items") or []
    if items:
        product_name = items[0].get("product") or "Item"
        if len(items) > 1:
            product_name = f"{product_name} +{len(items) - 1} more"
        product_unit = items[0].get("unit") or ""
        product_qty = sum(float(it.get("qty") or 0) for it in items)
    else:
        product_name = order.get("items_summary") or "Unspecified items"
        product_unit = ""
        product_qty = float(order.get("items_count") or 1)

    await db.graamam_production.insert_one({
        "id": gen_id(),
        "token_id": prod_token,
        "product_name": product_name,
        "product_qty": product_qty,
        "product_unit": product_unit,
        "order_id": order_id,
        "due_date": None,
        "producer_group": None,
        "materials": [],
        "status": "pending",
        "created_at": now,
    })
    try:
        from .graamam_audit import log_action
        await log_action(order_id, f"Stock insufficient — Production Token {prod_token} raised", None, sub_token=prod_token)
    except Exception:
        pass
    doc = await db.graamam_orders.find_one({"order_id": order_id}, {"_id": 0})
    return serialize(doc)
