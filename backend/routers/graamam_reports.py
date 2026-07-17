"""Graamam Connect — Reports (aggregations for the Report Builder)."""
from __future__ import annotations

from datetime import datetime, timedelta
from typing import Optional
from fastapi import APIRouter, Query

from ._shared import get_db, now_ist, IST

router = APIRouter(prefix="/graamam/reports", tags=["graamam-reports"])


def _parse_range(start: Optional[str], end: Optional[str]):
    def _p(d):
        if not d:
            return None
        return datetime.fromisoformat(d).replace(tzinfo=IST)

    s = _p(start)
    e = _p(end)
    return s, e


@router.get("/orders")
async def orders_report(
    start: Optional[str] = Query(default=None),
    end: Optional[str] = Query(default=None),
    status: Optional[str] = Query(default=None),
):
    db = get_db()
    q: dict = {}
    if status and status != "all":
        q["status"] = status
    if start:
        q.setdefault("date", {})["$gte"] = start
    if end:
        q.setdefault("date", {})["$lte"] = end
    docs = await db.graamam_orders.find(q, {"_id": 0}).sort("date", -1).to_list(2000)
    rows = []
    total_value = 0.0
    for d in docs:
        d.pop("_id", None)
        rows.append({
            "order_id": d["order_id"],
            "date": d.get("date"),
            "producer": d.get("producer") or d.get("customer", {}).get("name") or "",
            "items": d.get("items_count", 1),
            "total_inr": d.get("total", 0),
            "status": d.get("status"),
        })
        total_value += float(d.get("total", 0))
    return {"rows": rows, "total_orders": len(rows), "total_value_inr": total_value}


@router.get("/inventory")
async def inventory_report():
    db = get_db()
    docs = await db.graamam_inventory.find({}, {"_id": 0}).to_list(2000)
    return {
        "rows": [
            {
                "sku": d["sku"], "name": d["name"],
                "category": d.get("category"), "qty_on_hand": d.get("qty_on_hand", 0),
                "reorder_level": d.get("reorder_level", 0),
                "unit_price_inr": d.get("unit_price_inr", 0),
                "stock_value_inr": float(d.get("qty_on_hand", 0)) * float(d.get("unit_price_inr", 0)),
            }
            for d in docs
        ]
    }


@router.get("/producers")
async def producers_report():
    db = get_db()
    docs = await db.graamam_producers.find({}, {"_id": 0}).to_list(2000)
    return {
        "rows": [
            {
                "producer_id": d["producer_id"], "name": d["name"],
                "village": d.get("village"), "state": d.get("state"),
                "active_batches": d.get("active_batches", 0),
                "quality_score": d.get("quality_score", 0),
                "status": d.get("status"),
            }
            for d in docs
        ]
    }


@router.get("/sales")
async def sales_report(start: Optional[str] = None, end: Optional[str] = None):
    db = get_db()
    q: dict = {}
    if start:
        q.setdefault("sold_at", {})["$gte"] = start
    if end:
        q.setdefault("sold_at", {})["$lte"] = end + "T23:59:59+05:30"
    docs = await db.graamam_store_sales.find(q, {"_id": 0}).sort("sold_at", -1).to_list(2000)
    total = sum(float(d.get("total_inr", 0)) for d in docs)
    return {"rows": docs, "total_revenue_inr": total, "count": len(docs)}
