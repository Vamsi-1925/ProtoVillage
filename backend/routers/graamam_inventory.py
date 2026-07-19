"""Graamam Connect — Inventory (finished goods + raw-material stock).

ONE shared inventory collection (`graamam_inventory`) holds both:
  - finished goods (item_type absent/"finished_good", keyed by sku == product_id)
  - raw materials across 5 groups (item_type="raw_material", keyed by a
    synthetic sku, grouped: raw | pack_primary | pack_secondary | labels | other)

This is the same collection Production deducts (raw materials, on Start)
and Warehouse/Dispatch already deduct (finished goods, on Dispatch), and
that Procurement restocks (raw materials, on Receive) — one source of
truth for Production/Procurement/Inventory/Dashboard (graamam_v2 parity).
"""
from __future__ import annotations

from typing import List, Optional
from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel, ConfigDict, Field

from ._shared import get_db, gen_id, serialize, now_ist

router = APIRouter(prefix="/graamam/inventory", tags=["graamam-inventory"])

CATEGORIES = ["Spices", "Oils", "Grains", "Preserves", "Herbs", "Textiles"]

RAW_GROUPS = ["raw", "pack_primary", "pack_secondary", "labels", "other"]
GROUP_META = {
    "raw": {"label": "Raw Materials", "icon": "grass", "desc": "Ingredients used directly in food production"},
    "pack_primary": {"label": "Primary Packing", "icon": "inventory_2", "desc": "Touches the product — pouches, bottles, jars"},
    "pack_secondary": {"label": "Secondary Packing", "icon": "package_2", "desc": "Outer packing — cartons, boxes"},
    "labels": {"label": "Labels", "icon": "sell", "desc": "Product and shipping labels"},
    "other": {"label": "Other", "icon": "category", "desc": "Consumables — tape, sheets, etc."},
}
FINISHED_META = {"label": "Finished Goods (Warehouse)", "icon": "warehouse", "desc": "Manufactured products ready to dispatch or move to store"}


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


class UpdateStockPayload(BaseModel):
    model_config = ConfigDict(extra="ignore")
    sku: str
    qty: float
    unit_price: Optional[float] = 0.0
    note: Optional[str] = ""


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
    {"sku": "SP-TUR-001", "name": "Demo Powder - Alpha", "category": "Spices", "unit": "kg", "qty_on_hand": 12, "reorder_level": 25, "unit_price_inr": 320, "icon": "eco"},
    {"sku": "OL-MUS-100", "name": "Cold Pressed Mustard Oil", "category": "Oils", "unit": "L", "qty_on_hand": 145, "reorder_level": 50, "unit_price_inr": 280, "icon": "water_drop"},
    {"sku": "GR-BLK-050", "name": "Black Rice (Kala Namak)", "category": "Grains", "unit": "kg", "qty_on_hand": 55, "reorder_level": 50, "unit_price_inr": 240, "icon": "grain"},
    {"sku": "PR-HON-002", "name": "Wild Forest Honey", "category": "Preserves", "unit": "jars", "qty_on_hand": 80, "reorder_level": 30, "unit_price_inr": 420, "icon": "local_florist"},
    {"sku": "SP-CUM-003", "name": "Cumin Seeds (Jeera)", "category": "Spices", "unit": "kg", "qty_on_hand": 2, "reorder_level": 15, "unit_price_inr": 480, "icon": "eco"},
    {"sku": "OL-COC-500", "name": "Coconut Oil 500ml", "category": "Oils", "unit": "bottles", "qty_on_hand": 210, "reorder_level": 60, "unit_price_inr": 240, "icon": "water_drop"},
    {"sku": "HR-MOR-200", "name": "Demo Herb Powder - Beta", "category": "Herbs", "unit": "kg", "qty_on_hand": 42, "reorder_level": 40, "unit_price_inr": 360, "icon": "eco"},
    {"sku": "SP-COR-004", "name": "Demo Spice Powder", "category": "Spices", "unit": "kg", "qty_on_hand": 6, "reorder_level": 20, "unit_price_inr": 260, "icon": "eco"},
    {"sku": "GR-MIL-060", "name": "Demo Grain - Millet Mix", "category": "Grains", "unit": "kg", "qty_on_hand": 130, "reorder_level": 70, "unit_price_inr": 180, "icon": "grain"},
    {"sku": "PR-JAG-050", "name": "Organic Jaggery (Bellam)", "category": "Preserves", "unit": "kg", "qty_on_hand": 48, "reorder_level": 40, "unit_price_inr": 160, "icon": "cake"},
    {"sku": "OL-GRO-500", "name": "Cold Pressed Groundnut Oil", "category": "Oils", "unit": "L", "qty_on_hand": 34, "reorder_level": 40, "unit_price_inr": 320, "icon": "water_drop"},
    {"sku": "HR-NEE-100", "name": "Neem Leaf Powder", "category": "Herbs", "unit": "kg", "qty_on_hand": 9, "reorder_level": 20, "unit_price_inr": 220, "icon": "eco"},
]

# Raw-material inventory (Part 0 shared dummy data). Deliberately scarce on
# Groundnut so recipes using it (Demo Crispies - One, Demo Powder - Gamma)
# go to Procurement, while recipes that don't (Two/Three, Alpha) can Start
# Production directly. A couple of packaging items sit at/below minStock so
# "Low Stock" shows up on Dashboard + Inventory out of the box.
RAW_MATERIAL_SEEDS: List[dict] = [
    {"sku": "RM-GRN", "name": "Groundnut", "group": "raw", "unit": "kg", "qty_on_hand": 1, "reorder_level": 30, "unit_price_inr": 160},
    {"sku": "RM-SLT", "name": "Salt", "group": "raw", "unit": "kg", "qty_on_hand": 100, "reorder_level": 20, "unit_price_inr": 10},
    {"sku": "RM-CHL", "name": "Green Chilli", "group": "raw", "unit": "kg", "qty_on_hand": 50, "reorder_level": 15, "unit_price_inr": 60},
    {"sku": "RM-MIL", "name": "Millet", "group": "raw", "unit": "kg", "qty_on_hand": 200, "reorder_level": 50, "unit_price_inr": 50},
    {"sku": "RM-SES", "name": "Sesame", "group": "raw", "unit": "kg", "qty_on_hand": 100, "reorder_level": 30, "unit_price_inr": 210},
    {"sku": "PK-POU-100", "name": "Pouch - 100gm", "group": "pack_primary", "unit": "pcs", "qty_on_hand": 500, "reorder_level": 100, "unit_price_inr": 2.5},
    {"sku": "PK-POU-200", "name": "Pouch - 200gm", "group": "pack_primary", "unit": "pcs", "qty_on_hand": 300, "reorder_level": 100, "unit_price_inr": 3.5},
    {"sku": "PK-CTN-MED", "name": "Carton Box - Medium", "group": "pack_secondary", "unit": "pcs", "qty_on_hand": 15, "reorder_level": 20, "unit_price_inr": 25},
    {"sku": "PK-CTN-LRG", "name": "Carton Box - Large", "group": "pack_secondary", "unit": "pcs", "qty_on_hand": 40, "reorder_level": 20, "unit_price_inr": 35},
    {"sku": "LBL-CRISP", "name": "Product Label - Crispies", "group": "labels", "unit": "pcs", "qty_on_hand": 600, "reorder_level": 150, "unit_price_inr": 1.2},
    {"sku": "LBL-PWDR", "name": "Product Label - Powder", "group": "labels", "unit": "pcs", "qty_on_hand": 400, "reorder_level": 150, "unit_price_inr": 1.2},
    {"sku": "OTH-TAPE", "name": "BOPP Tape", "group": "other", "unit": "rolls", "qty_on_hand": 8, "reorder_level": 10, "unit_price_inr": 45},
    {"sku": "OTH-A4", "name": "A4 Sheets", "group": "other", "unit": "reams", "qty_on_hand": 50, "reorder_level": 20, "unit_price_inr": 280},
]


def _with_status(doc: dict) -> dict:
    d = serialize(doc)
    d["status"] = status_of(float(d.get("qty_on_hand", 0)), float(d.get("reorder_level", 0)))
    return d


def _status_label(qty: float, reorder: float) -> str:
    if qty <= 0:
        return "Out of Stock"
    if reorder > 0 and qty <= reorder:
        return "Low Stock"
    return "OK"


# ---------- legacy finished-goods listing (kept for backward compat) ----------
@router.get("")
async def list_inventory(
    status: Optional[str] = Query(default=None),
    category: Optional[str] = Query(default=None),
    q: Optional[str] = Query(default=None),
):
    db = get_db()
    query: dict = {"item_type": {"$ne": "raw_material"}}
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
    docs = [_with_status(d) async for d in db.graamam_inventory.find({"item_type": {"$ne": "raw_material"}}, {"_id": 0})]
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


# ---------- Part C: category-block Inventory (v2 parity) ----------
@router.get("/groups")
async def list_groups():
    """Landing page blocks: 5 raw-material groups + Finished Goods."""
    db = get_db()
    out = []
    for g in RAW_GROUPS:
        items = await db.graamam_inventory.find({"item_type": "raw_material", "group": g}, {"_id": 0}).to_list(1000)
        low = sum(1 for i in items if float(i.get("qty_on_hand", 0)) <= float(i.get("reorder_level", 0)))
        meta = GROUP_META[g]
        out.append({"group": g, "label": meta["label"], "icon": meta["icon"], "desc": meta["desc"], "item_count": len(items), "low_count": low})
    fg_items = await db.graamam_inventory.find({"item_type": {"$ne": "raw_material"}}, {"_id": 0}).to_list(1000)
    fg_low = sum(1 for i in fg_items if float(i.get("qty_on_hand", 0)) <= float(i.get("reorder_level", 0)))
    out.append({"group": "finished", "label": FINISHED_META["label"], "icon": FINISHED_META["icon"], "desc": FINISHED_META["desc"], "item_count": len(fg_items), "low_count": fg_low})
    return out


@router.get("/groups/{group}")
async def group_items(group: str):
    """Drill-in table for a raw-material group, or 'finished' for finished goods."""
    db = get_db()
    if group == "finished":
        docs = await db.graamam_inventory.find({"item_type": {"$ne": "raw_material"}}, {"_id": 0}).sort("name", 1).to_list(1000)
    elif group in RAW_GROUPS:
        docs = await db.graamam_inventory.find({"item_type": "raw_material", "group": group}, {"_id": 0}).sort("name", 1).to_list(1000)
    else:
        raise HTTPException(404, f"unknown group '{group}'")
    out = []
    for d in docs:
        qty = float(d.get("qty_on_hand", 0))
        reorder = float(d.get("reorder_level", 0))
        out.append({
            "sku": d.get("sku"), "name": d.get("name"), "unit": d.get("unit"),
            "qty_on_hand": qty, "reorder_level": reorder,
            "status_label": _status_label(qty, reorder),
            "unit_price_inr": d.get("unit_price_inr", 0),
        })
    return out


@router.get("/price-history")
async def price_history(sku: Optional[str] = Query(default=None), limit: int = 20):
    db = get_db()
    q = {"sku": sku} if sku else {}
    docs = await db.graamam_price_history.find(q, {"_id": 0}).sort("date", -1).to_list(int(limit))
    return docs


@router.post("/update-stock")
async def update_stock(payload: UpdateStockPayload):
    """+ Update Stock (manual restock, e.g. from Master Data or a walk-in
    purchase) — mirrors v2's addStock()."""
    db = get_db()
    doc = await db.graamam_inventory.find_one({"sku": payload.sku}, {"_id": 0})
    if not doc:
        raise HTTPException(404, f"SKU {payload.sku} not found")
    if payload.qty < 1:
        raise HTTPException(400, "qty must be at least 1")
    new_qty = float(doc.get("qty_on_hand", 0)) + float(payload.qty)
    await db.graamam_inventory.update_one({"sku": payload.sku}, {"$set": {"qty_on_hand": new_qty}})
    if payload.unit_price and payload.unit_price > 0:
        await db.graamam_price_history.insert_one({
            "id": gen_id(), "sku": payload.sku, "name": doc.get("name"),
            "date": now_ist().isoformat(), "qty": payload.qty, "unit_price": payload.unit_price,
            "total": round(payload.qty * payload.unit_price, 2),
            "order_id": None, "proc_id": None, "recorded_by": "Stock Team", "note": payload.note or "",
        })
    try:
        from .graamam_audit import log_action
        await log_action(None, f"Stock updated: {doc.get('name')} +{payload.qty} {doc.get('unit')}" + (f" @ ₹{payload.unit_price}" if payload.unit_price else ""), None)
    except Exception:
        pass
    updated = await db.graamam_inventory.find_one({"sku": payload.sku}, {"_id": 0})
    return _with_status(updated)


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


async def seed_raw_materials_if_empty():
    db = get_db()
    existing = {d["sku"] async for d in db.graamam_inventory.find({"item_type": "raw_material"}, {"_id": 0, "sku": 1})}
    inserted = 0
    for s in RAW_MATERIAL_SEEDS:
        if s["sku"] in existing:
            continue
        doc = {"id": gen_id(), "item_type": "raw_material", "icon": "grass", **s}
        await db.graamam_inventory.insert_one(doc)
        inserted += 1
    return inserted
