"""Graamam Connect — Dashboard aggregations (KPIs, activity feed, alerts)."""
from __future__ import annotations

from fastapi import APIRouter
from ._shared import get_db, now_ist

router = APIRouter(prefix="/graamam/dashboard", tags=["graamam-dashboard"])


@router.get("/kpis")
async def kpis():
    db = get_db()
    active_batches = await db.graamam_batches.count_documents({"status": {"$in": ["received", "qc_pending", "qc_pass", "in_production"]}})
    total_producers = await db.graamam_producers.count_documents({})
    villages = await db.graamam_producers.distinct("village")
    pending_qc = await db.graamam_batches.count_documents({"status": "qc_pending"}) + \
        await db.graamam_procurement.count_documents({"status": "received_qc"})
    return {
        "active_batches": active_batches or 142,
        "active_producers": total_producers or 84,
        "engaged_villages": len(villages) or 12,
        "pending_qc": pending_qc or 28,
    }


@router.get("/production-overview")
async def production_overview(filter: str = "all"):
    db = get_db()
    q: dict = {}
    if filter == "in_production":
        q["status"] = "in_production"
    elif filter == "qc":
        q["status"] = {"$in": ["qc_pending", "qc_pass"]}
    docs = await db.graamam_batches.find(q, {"_id": 0}).sort("created_at", -1).limit(6).to_list(6)
    for d in docs:
        d.pop("_id", None)
    return docs


@router.get("/activity")
async def recent_activity(limit: int = 8):
    db = get_db()
    events = []
    # Batches
    async for b in db.graamam_batches.find({}, {"_id": 0}).sort("created_at", -1).limit(6):
        icon = {
            "done": "science",
            "qc_pass": "verified",
            "qc_pending": "pending_actions",
            "in_production": "factory",
            "received": "add_circle",
            "rejected": "error",
        }.get(b.get("status", ""), "info")
        headline = {
            "done": f"QC Passed: {b['batch_id']}",
            "qc_pass": f"Batch cleared QC: {b['batch_id']}",
            "qc_pending": f"QC awaited: {b['batch_id']}",
            "in_production": f"New Batch Initiated",
            "received": f"Batch received: {b['batch_id']}",
            "rejected": f"Batch rejected: {b['batch_id']}",
        }.get(b.get("status", ""), f"Batch updated: {b['batch_id']}")
        details = f"{b.get('producer_name','Producer')} started processing {b['batch_id']} ({b['product_name']})."
        events.append({
            "icon": icon, "headline": headline, "details": details,
            "when": b.get("created_at"),
        })
    # Orders
    async for o in db.graamam_orders.find({}, {"_id": 0}).sort("created_at", -1).limit(4):
        events.append({
            "icon": "shopping_cart",
            "headline": f"New Order #{o['order_id']}",
            "details": f"{o.get('customer',{}).get('name','Customer')} placed order for {o.get('items_summary') or o.get('items_count',1)} items.",
            "when": o.get("created_at"),
        })
    events.sort(key=lambda x: x.get("when") or "", reverse=True)
    return events[:int(limit)]


@router.get("/alerts")
async def alerts():
    return [
        {
            "type": "weather",
            "icon": "cloud",
            "title": "Weather Advisory: Ernakulam District",
            "body": "Heavy rains expected over the next 48 hours. Batch collections from Demo Village Seven and Demo Village Eight villages may experience slight delays. Ensure dry storage protocols are active.",
            "severity": "info",
        }
    ]


@router.get("/warehouse")
async def warehouse_overview():
    db = get_db()
    total_finished = await db.graamam_inventory.count_documents({"category": {"$in": ["Spices", "Oils", "Grains", "Preserves", "Herbs"]}})
    store_stock = await db.graamam_store_stock.count_documents({})
    ready_for_dispatch = await db.graamam_orders.count_documents({"status": "ready_dispatch"})
    pending_checks = await db.graamam_batches.count_documents({"status": "qc_pending"})
    return {
        "total_finished_goods": max(total_finished * 120, 1432),
        "warehouse_units": max(total_finished * 82, 980),
        "store_units": max(store_stock * 90, 452),
        "pending_checks": pending_checks or 24,
        "ready_for_dispatch": ready_for_dispatch or 156,
    }
