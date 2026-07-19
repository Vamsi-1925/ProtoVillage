"""Graamam Connect — Dashboard (graamam_v2 pgDashboard parity).

Six live KPIs (orders + inventory), Recent Orders, and Recent Activity
(from the append-only audit log). No hardcoded numbers, no producer/
village content, no weather advisory — those belonged to an earlier,
unrelated placeholder dashboard and are removed entirely.
"""
from __future__ import annotations

from fastapi import APIRouter
from ._shared import get_db

router = APIRouter(prefix="/graamam/dashboard", tags=["graamam-dashboard"])

OPEN_EXCLUDED = {"dispatched", "closed", "cancelled"}


@router.get("/kpis")
async def kpis():
    db = get_db()
    total_orders = await db.graamam_orders.count_documents({})
    open_orders = await db.graamam_orders.count_documents({"status": {"$nin": list(OPEN_EXCLUDED)}})
    in_production = await db.graamam_orders.count_documents({"status": {"$in": ["production_active", "production_pending"]}})
    pending_procurement = await db.graamam_orders.count_documents({"status": "procurement_pending"})
    dispatched = await db.graamam_orders.count_documents({"status": "dispatched"})
    low_stock = await db.graamam_inventory.count_documents({
        "item_type": "raw_material",
        "$expr": {"$lte": ["$qty_on_hand", "$reorder_level"]},
    })
    return {
        "total_orders": total_orders,
        "open_orders": open_orders,
        "in_production": in_production,
        "pending_procurement": pending_procurement,
        "dispatched": dispatched,
        "low_stock_items": low_stock,
    }


@router.get("/recent-orders")
async def recent_orders(limit: int = 6):
    db = get_db()
    docs = await db.graamam_orders.find({}, {"_id": 0}).sort("created_at", -1).to_list(int(limit))
    return [{
        "order_id": d.get("order_id"),
        "order_type": d.get("order_type"),
        "customer": d.get("customer"),
        "items_summary": d.get("items_summary") or f"{d.get('items_count', 1)} items",
        "status": d.get("status"),
        "date": d.get("date"),
    } for d in docs]


@router.get("/activity")
async def recent_activity(limit: int = 10):
    db = get_db()
    docs = await db.graamam_audit_logs.find({}, {"_id": 0}).sort("ts", -1).to_list(int(limit))
    return docs
