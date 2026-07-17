"""Graamam Connect — Store (experience center point-of-sale).

Keeps store-side stock separate from warehouse. Records sales in
`graamam_store_sales`.
"""
from __future__ import annotations

from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, ConfigDict, Field

from ._shared import get_db, gen_id, serialize, now_ist

router = APIRouter(prefix="/graamam/store", tags=["graamam-store"])


class StoreStock(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=gen_id)
    sku: str
    name: str
    unit: str = "units"
    qty_in_store: float = 0
    nearest_expiry: Optional[str] = None  # ISO date
    unit_price_inr: float = 0.0
    image_url: Optional[str] = None


class SaleCreate(BaseModel):
    sku: str
    qty: float
    customer_name: Optional[str] = "Walk-in Customer"
    payment_mode: str = "upi"  # upi | cash | card


SEEDS: List[dict] = [
    {"sku": "OL-COC-500", "name": "Coconut Oil 500ml", "unit": "bottles", "qty_in_store": 24, "nearest_expiry": "2025-08-12", "unit_price_inr": 240, "image_url": "https://images.unsplash.com/photo-1622467742256-97a1a3b6f79a?w=200&h=200&fit=crop"},
    {"sku": "SP-GRN-004", "name": "Spicy Groundnut Powder", "unit": "packs", "qty_in_store": 15, "nearest_expiry": "2025-09-05", "unit_price_inr": 180, "image_url": "https://images.unsplash.com/photo-1596797038530-2c107229654b?w=200&h=200&fit=crop"},
    {"sku": "PR-HON-002", "name": "Wild Forest Honey 500g", "unit": "jars", "qty_in_store": 18, "nearest_expiry": "2026-02-01", "unit_price_inr": 420, "image_url": "https://images.unsplash.com/photo-1587049352846-4a222e784cb1?w=200&h=200&fit=crop"},
    {"sku": "PR-JAG-050", "name": "Organic Jaggery 500g", "unit": "packs", "qty_in_store": 30, "nearest_expiry": "2025-12-31", "unit_price_inr": 160, "image_url": "https://images.unsplash.com/photo-1544376664-80b17f09d399?w=200&h=200&fit=crop"},
    {"sku": "SP-TUR-001", "name": "Turmeric Powder 250g", "unit": "packs", "qty_in_store": 12, "nearest_expiry": "2025-11-15", "unit_price_inr": 220, "image_url": "https://images.unsplash.com/photo-1615485500704-8e990f9900f7?w=200&h=200&fit=crop"},
]


@router.get("")
async def list_store_stock():
    db = get_db()
    docs = await db.graamam_store_stock.find({}, {"_id": 0}).sort("name", 1).to_list(500)
    return [serialize(d) for d in docs]


@router.post("/receive")
async def receive_stock(sku: str, qty: float):
    db = get_db()
    doc = await db.graamam_store_stock.find_one({"sku": sku}, {"_id": 0})
    if not doc:
        raise HTTPException(404, f"SKU {sku} not in store")
    new_q = float(doc.get("qty_in_store", 0)) + float(qty)
    await db.graamam_store_stock.update_one({"sku": sku}, {"$set": {"qty_in_store": new_q}})
    return {"sku": sku, "qty_in_store": new_q}


@router.post("/sale", status_code=201)
async def record_sale(payload: SaleCreate):
    db = get_db()
    doc = await db.graamam_store_stock.find_one({"sku": payload.sku}, {"_id": 0})
    if not doc:
        raise HTTPException(404, f"SKU {payload.sku} not in store")
    if float(doc.get("qty_in_store", 0)) < float(payload.qty):
        raise HTTPException(400, "Insufficient stock in store")
    total = float(doc.get("unit_price_inr", 0)) * float(payload.qty)
    await db.graamam_store_stock.update_one({"sku": payload.sku}, {"$inc": {"qty_in_store": -float(payload.qty)}})
    sale = {
        "id": gen_id(),
        "sale_id": f"SL-{now_ist().year}-{await db.graamam_store_sales.count_documents({}) + 1:04d}",
        "sku": payload.sku,
        "name": doc["name"],
        "qty": payload.qty,
        "unit_price_inr": doc.get("unit_price_inr", 0),
        "total_inr": total,
        "customer_name": payload.customer_name or "Walk-in Customer",
        "payment_mode": payload.payment_mode,
        "sold_at": now_ist().isoformat(),
    }
    await db.graamam_store_sales.insert_one(sale)
    sale.pop("_id", None)
    return sale


@router.get("/sales")
async def list_sales(limit: int = 50):
    db = get_db()
    docs = await db.graamam_store_sales.find({}, {"_id": 0}).sort("sold_at", -1).to_list(int(limit))
    return [serialize(d) for d in docs]


@router.get("/summary")
async def store_summary():
    db = get_db()
    stock = await db.graamam_store_stock.find({}, {"_id": 0}).to_list(500)
    total_units = sum(float(d.get("qty_in_store", 0)) for d in stock)
    sales = await db.graamam_store_sales.find({}, {"_id": 0}).to_list(1000)
    revenue = sum(float(s.get("total_inr", 0)) for s in sales)
    return {"total_units": total_units, "revenue_inr": revenue, "sales_count": len(sales)}


async def seed_store_if_empty():
    db = get_db()
    existing = {d["sku"] async for d in db.graamam_store_stock.find({}, {"_id": 0, "sku": 1})}
    inserted = 0
    for s in SEEDS:
        if s["sku"] in existing:
            continue
        doc = {"id": gen_id(), **s}
        await db.graamam_store_stock.insert_one(doc)
        inserted += 1
    return inserted
