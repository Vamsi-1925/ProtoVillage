"""ProtoVillage / Graamam company constants + master-data importer.

Source of truth: `/app/backend/data/graamam_master.json` extracted from
`graamam_v2.html` (window.GRAAMAM_MASTER).
"""
from __future__ import annotations

import json
import logging
import os
from pathlib import Path
from typing import Any

from ._shared import get_db, gen_id

logger = logging.getLogger(__name__)

COMPANY = {
    "legal": "Graamam Foods Private Limited",
    "brand": "Graamam",
    "address": "Plot 12, Demo Industrial Layout, Sample Town, 515001, Andhra Pradesh",
    "state_code": "37",
    "gstin": "37AAAAA0000A1Z5",
    "pan": "AAAAA0000A",
    "email": "info@graamam.example",
    "web": "www.graamam.example",
    "poc_b2b": {"name": "Demo Contact", "phone": "9000000010"},
    "poc_b2c": {"name": "Demo Contact Two"},
    "bank": {
        "name": "Demo Bank, Sample Branch",
        "account_no": "0000111122223333",
        "account_type": "CURRENT",
        "ifsc": "DEMO0000000",
    },
}

MASTER_JSON_PATH = Path("/app/backend/data/graamam_master.json")


def _read_master() -> dict:
    if not MASTER_JSON_PATH.exists():
        logger.warning("[master] %s missing; skipping import", MASTER_JSON_PATH)
        return {}
    return json.loads(MASTER_JSON_PATH.read_text())


def _price_for(p: dict) -> float:
    if p.get("price") is not None:
        return float(p["price"])
    return 0.0


def _icon_for(category: str) -> str:
    c = (category or "").lower()
    if "oil" in c:
        return "water_drop"
    if "pickle" in c:
        return "local_dining"
    if "snack" in c or "crispies" in c or "papad" in c:
        return "lunch_dining"
    if "spice" in c or "powder" in c:
        return "eco"
    if "soup" in c or "instant" in c:
        return "soup_kitchen"
    if "handloom" in c or "fabric" in c or "saree" in c:
        return "checkroom"
    if "cosmetic" in c:
        return "spa"
    if "jam" in c or "pulp" in c or "sweet" in c:
        return "cake"
    return "eco"


async def import_master_data(force: bool = False) -> dict:
    db = get_db()
    master = _read_master()
    if not master:
        return {}

    stats = {}

    # ---------- PRODUCTS ----------
    if force:
        await db.graamam_products.delete_many({})
    if await db.graamam_products.count_documents({}) == 0:
        docs = []
        for p in master.get("products", []):
            docs.append({
                "id": gen_id(),
                "product_id": p.get("id"),
                "name": p.get("name"),
                "category": p.get("category") or "Other",
                "pack": p.get("pack") or "",
                "hsn": str(p.get("hsn") or ""),
                "gst_rate": p.get("gst") if p.get("gst") is not None else 5,
                "shelf_life": p.get("shelfLife") or "",
                "mrp_inr": _price_for(p),
                "discount_pct": p.get("discount") or 0,
                "icon": _icon_for(p.get("category") or ""),
            })
        if docs:
            await db.graamam_products.insert_many(docs)
        stats["products"] = len(docs)

    # ---------- INVENTORY (finished-goods stock, derived from Products) ----------
    # NOTE: this collection is shared with raw-material stock (item_type
    # "raw_material", seeded separately by graamam_inventory.py) — only
    # touch FINISHED-GOODS docs here, never delete_many({}) unscoped.
    fg_filter = {"item_type": {"$ne": "raw_material"}}
    if force:
        await db.graamam_inventory.delete_many(fg_filter)
    if await db.graamam_inventory.count_documents(fg_filter) < 40:  # was fake-seeded before
        await db.graamam_inventory.delete_many(fg_filter)  # wipe fictional seeds
        docs = []
        for i, p in enumerate(master.get("products", [])):
            price = _price_for(p)
            if price <= 0:
                continue  # skip products without MRP set
            unit = _guess_unit(p)
            # give categories reasonable stock levels for demo
            qty = _seed_qty(p)
            reorder = max(20, int(qty * 0.4))
            docs.append({
                "id": gen_id(),
                "sku": p.get("id"),  # use P001..P132 as SKU (matches Products)
                "name": p.get("name"),
                "category": p.get("category") or "Other",
                "unit": unit,
                "qty_on_hand": qty,
                "reorder_level": reorder,
                "unit_price_inr": price,
                "icon": _icon_for(p.get("category") or ""),
                "hsn": str(p.get("hsn") or ""),
                "gst_rate": p.get("gst") if p.get("gst") is not None else 5,
            })
        if docs:
            await db.graamam_inventory.insert_many(docs)
        stats["inventory"] = len(docs)

    # ---------- B2B CUSTOMERS ----------
    if force:
        await db.graamam_customers_b2b.delete_many({})
    if await db.graamam_customers_b2b.count_documents({}) == 0:
        docs = []
        for c in master.get("b2bCustomers", []):
            docs.append({
                "id": gen_id(),
                "customer_id": f"CB{(len(docs) + 1):03d}",
                "name": c.get("name"),
                "contact_person": (c.get("contact") or "").strip(),
                "mobile": c.get("mobile") or "",
                "email": c.get("email") or "",
                "address": c.get("address") or "",
                "city": c.get("city") or "",
                "pincode": str(c.get("pincode") or ""),
                "state": c.get("state") or "",
                "gstin": c.get("gstin") or "",
                "rate_card": c.get("rateCard") or [],
                "type": "b2b",
            })
        if docs:
            await db.graamam_customers_b2b.insert_many(docs)
        stats["b2b_customers"] = len(docs)

    # ---------- B2C CUSTOMERS ----------
    if force:
        await db.graamam_customers_b2c.delete_many({})
    if await db.graamam_customers_b2c.count_documents({}) == 0:
        docs = []
        for c in master.get("b2cCustomers", []):
            if not (c.get("name") or "").strip():
                continue
            docs.append({
                "id": gen_id(),
                "customer_id": f"CC{(len(docs) + 1):04d}",
                "name": c.get("name"),
                "mobile": str(c.get("mobile") or ""),
                "email": c.get("email") or "",
                "city": c.get("city") or "",
                "type": "b2c",
            })
        if docs:
            await db.graamam_customers_b2c.insert_many(docs)
        stats["b2c_customers"] = len(docs)

    # ---------- COSTING ----------
    if force:
        await db.graamam_costing.delete_many({})
    if await db.graamam_costing.count_documents({}) == 0:
        docs = []
        for c in master.get("costing", []):
            docs.append({"id": gen_id(), **c})
        if docs:
            await db.graamam_costing.insert_many(docs)
        stats["costing"] = len(docs)

    # ---------- RECIPES (recipe -> product auto-link, by name) ----------
    # Upserted by name on EVERY startup (not a one-time "if empty" seed) so
    # newly added sample recipes always load, even if graamam_recipes
    # already has rows from an earlier partial seed. force=True still
    # allows a full reset first.
    if force:
        await db.graamam_recipes.delete_many({})
    recipe_docs = master.get("recipes", [])
    upserted = 0
    for r in recipe_docs:
        name = r.get("name")
        if not name:
            continue
        doc = {
            "name": name,
            "category": r.get("category") or "",
            "conversion": float(r.get("conversion") or 1.0),
            "batch_output": float(r.get("batchOutput") or 1),
            "ingredients": [
                {"item": i.get("item"), "qty": float(i.get("qty") or 0), "cost_per_kg": float(i.get("costPerKg") or 0)}
                for i in r.get("ingredients", [])
            ],
        }
        await db.graamam_recipes.update_one(
            {"name": name},
            {"$set": doc, "$setOnInsert": {"id": gen_id()}},
            upsert=True,
        )
        upserted += 1
    stats["recipes"] = upserted

    logger.info("[master] imported %s", stats)
    return stats


def _guess_unit(p: dict) -> str:
    pack = (p.get("pack") or "").lower()
    cat = (p.get("category") or "").lower()
    if "litre" in pack or "ml" in pack or "oil" in cat:
        return "bottles"
    if "kg" in pack or "gm" in pack or "g" in pack:
        return "packs"
    if "saree" in cat or "fabric" in cat or "handloom" in cat or "handicraft" in cat:
        return "units"
    return "packs"


def _seed_qty(p: dict) -> int:
    """Warehouse stock-check demo: finished-goods stock is intentionally
    scarce — only 2 SKUs (P001, P006) carry a small balance so that, out
    of the box, one order can pass "Ready for Dispatch" (stock sufficient)
    and another must "Raise Production" (stock short/zero), matching
    graamam_v2's Warehouse page demo scenario. Everything else starts at 0
    until Production/Procurement stocks it via the pipeline."""
    pid = p.get("id")
    if pid == "P001":
        return 10
    if pid == "P006":
        return 15
    return 0
