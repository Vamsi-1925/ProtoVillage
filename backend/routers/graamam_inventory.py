"""Graamam Connect — Inventory (finished goods + raw material stock).

Holds SKUs, on-hand quantities, reorder levels, categories, unit prices in INR,
and computed status pills (In Stock / Adequate / Low Stock / Critical).
"""
from __future__ import annotations

from typing import List, Optional
from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel, ConfigDict, Field

from ._shared import get_db, gen_id, serialize

router = APIRouter(prefix="/graamam/inventory", tags=["graamam-inventory"])

CATEGORIES = ["Spices", "Oils", "Grains", "Preserves", "Herbs", "Textiles"]


class InventoryItem(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=gen_id)
    sku: str
    name: str
    category: str = "Spices"
    unit: str = "kg"
    qty_on_hand: float = 0.0
    reorder_level: float = 0.0
    unit_price_inr: float = 0.0
    icon: str = "eco"


class InventoryCreate(BaseModel):
    model_config = ConfigDict(extra="ignore")
    sku: Optional[str] = None
    name: str
    category: str = "Spices"
    unit: str = "kg"
    qty_on_hand: float = 0.0
    reorder_level: float = 0.0
    unit_price_inr: float = 0.0
    icon: Optional[str] = None


class StockAdjust(BaseModel):
    delta: float


def status_of(qty: float, reorder: float) -> str:
    if reorder <= 0:
        return "in_stock"
    if qty <= 0:
        return "critical"
    if qty <= reorder * 0.3:
        return "critical"
    if qty <= reorder:
        return "low_stock"
    if qty <= reorder * 1.5:
        return "adequate"
    return "in_stock"


SEEDS: List[dict] = [
    {"sku": "SP-TUR-001", "name": "Turmeric Powder (Kandhamal)", "category": "Spices", "unit": "kg", "qty_on_hand": 12, "reorder_level": 25, "unit_price_inr": 320, "icon": "eco"},
    {"sku": "OL-MUS-100", "name": "Cold Pressed Mustard Oil", "category": "Oils", "unit": "L", "qty_on_hand": 145, "reorder_level": 50, "unit_price_inr": 280, "icon": "water_drop"},
    {"sku": "GR-BLK-050", "name": "Black Rice (Kala Namak)", "category": "Grains", "unit": "kg", "qty_on_hand": 55, "reorder_level": 50, "unit_price_inr": 240, "icon": "grain"},
    {"sku": "PR-HON-002", "name": "Wild Forest Honey", "category": "Preserves", "unit": "jars", "qty_on_hand": 80, "reorder_level": 30, "unit_price_inr": 420, "icon": "local_florist"},
    {"sku": "SP-CUM-003", "name": "Cumin Seeds (Jeera)", "category": "Spices", "unit": "kg", "qty_on_hand": 2, "reorder_level": 15, "unit_price_inr": 480, "icon": "eco"},
    {"sku": "OL-COC-500", "name": "Coconut Oil 500ml", "category": "Oils", "unit": "bottles", "qty_on_hand": 210, "reorder_level": 60, "unit_price_inr": 240, "icon": "water_drop"},
    {"sku": "HR-MOR-200", "name": "Moringa Leaf Powder", "category": "Herbs", "unit": "kg", "qty_on_hand": 42, "reorder_level": 40, "unit_price_inr": 360, "icon": "eco"},
    {"sku": "SP-COR-004", "name": "Coriander Powder", "category": "Spices", "unit": "kg", "qty_on_hand": 6, "reorder_level": 20, "unit_price_inr": 260, "icon": "eco"},
    {"sku": "GR-MIL-060", "name": "Foxtail Millet", "category": "Grains", "unit": "kg", "qty_on_hand": 130, "reorder_level": 70, "unit_price_inr": 180, "icon": "grain"},
    {"sku": "PR-JAG-050", "name": "Organic Jaggery (Bellam)", "category": "Preserves", "unit": "kg", "qty_on_hand": 48, "reorder_level": 40, "unit_price_inr": 160, "icon": "cake"},
    {"sku": "OL-GRO-500", "name": "Cold Pressed Groundnut Oil", "category": "Oils", "unit": "L", "qty_on_hand": 34, "reorder_level": 40, "unit_price_inr": 320, "icon": "water_drop"},
    {"sku": "HR-NEE-100", "name": "Neem Leaf Powder", "category": "Herbs", "unit": "kg", "qty_on_hand": 9, "reorder_level": 20, "unit_price_inr": 220, "icon": "eco"},
]


def _with_status(doc: dict) -> dict:
    d = serialize(doc)
    d["status"] = status_of(float(d.get("qty_on_hand", 0)), float(d.get("reorder_level", 0)))
    return d


@router.get("")
async def list_inventory(
    status: Optional[str] = Query(default=None),
    category: Optional[str] = Query(default=None),
    q: Optional[str] = Query(default=None),
):
    db = get_db()
    query: dict = {}
    if category and category.lower() != "all":
        query["category"] = category
    if q:
        query["$or"] = [
            {"name": {"$regex": q, "$options": "i"}},
            {"sku": {"$regex": q, "$options": "i"}},
        ]
    docs = await db.graamam_inventory.find(query, {"_id": 0}).sort("name", 1).to_list(1000)
    items = [_with_status(d) for d in docs]
    if status and status.lower() != "all":
        s = status.lower()
        if s == "low_stock":
            items = [i for i in items if i["status"] in ("low_stock", "critical")]
        else:
            items = [i for i in items if i["status"] == s]
    return items


@router.get("/summary")
async def inventory_summary():
    db = get_db()
    docs = [_with_status(d) async for d in db.graamam_inventory.find({}, {"_id": 0})]
    by_status = {"in_stock": 0, "adequate": 0, "low_stock": 0, "critical": 0}
    for d in docs:
        by_status[d["status"]] = by_status.get(d["status"], 0) + 1
    by_category = {}
    for d in docs:
        c = d.get("category", "Other")
        by_category[c] = by_category.get(c, 0) + 1
    return {
        "total_skus": len(docs),
        "by_status": by_status,
        "by_category": by_category,
        "low_or_critical": by_status.get("low_stock", 0) + by_status.get("critical", 0),
    }


@router.post("", status_code=201)
async def create_item(payload: InventoryCreate):
    db = get_db()
    if not payload.name.strip():
        raise HTTPException(400, "name is required")
    sku = (payload.sku or "").strip()
    if not sku:
        n = await db.graamam_inventory.count_documents({}) + 1
        prefix = {"Spices": "SP", "Oils": "OL", "Grains": "GR", "Preserves": "PR", "Herbs": "HR", "Textiles": "TX"}.get(payload.category, "IT")
        sku = f"{prefix}-NEW-{n:03d}"
    if await db.graamam_inventory.find_one({"sku": sku}, {"_id": 1}):
        raise HTTPException(409, f"SKU {sku} already exists")
    item = InventoryItem(
        sku=sku, name=payload.name.strip(), category=payload.category,
        unit=payload.unit, qty_on_hand=payload.qty_on_hand,
        reorder_level=payload.reorder_level, unit_price_inr=payload.unit_price_inr,
        icon=payload.icon or "eco",
    )
    await db.graamam_inventory.insert_one(item.model_dump())
    return _with_status(item.model_dump())


@router.post("/{sku}/adjust")
async def adjust_stock(sku: str, payload: StockAdjust):
    db = get_db()
    doc = await db.graamam_inventory.find_one({"sku": sku}, {"_id": 0})
    if not doc:
        raise HTTPException(404, f"SKU {sku} not found")
    new_qty = max(0.0, float(doc.get("qty_on_hand", 0)) + float(payload.delta))
    await db.graamam_inventory.update_one({"sku": sku}, {"$set": {"qty_on_hand": new_qty}})
    doc["qty_on_hand"] = new_qty
    return _with_status(doc)


async def seed_inventory_if_empty():
    db = get_db()
    existing = {d["sku"] async for d in db.graamam_inventory.find({}, {"_id": 0, "sku": 1})}
    inserted = 0
    for s in SEEDS:
        if s["sku"] in existing:
            continue
        doc = {"id": gen_id(), **s}
        await db.graamam_inventory.insert_one(doc)
        inserted += 1
    return inserted
