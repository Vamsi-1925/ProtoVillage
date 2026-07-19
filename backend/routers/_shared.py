"""Shared helpers for Graamam Connect routers.

Keeps a single Mongo client / DB accessor and IST-aware timestamp helpers so
every collection uses the same conventions (Indian context: INR, IST).
"""
from __future__ import annotations

import os
import uuid
from datetime import datetime, timedelta, timezone
from typing import Any, List, Optional

from motor.motor_asyncio import AsyncIOMotorClient
from pymongo import ReturnDocument

IST = timezone(timedelta(hours=5, minutes=30))

_mongo_client: Optional[AsyncIOMotorClient] = None
_db = None


def get_db():
    global _mongo_client, _db
    if _db is None:
        _mongo_client = AsyncIOMotorClient(os.environ["MONGO_URL"])
        _db = _mongo_client[os.environ["DB_NAME"]]
    return _db


def now_ist() -> datetime:
    return datetime.now(IST)


def today_ist_iso() -> str:
    return now_ist().date().isoformat()


def gen_id() -> str:
    return str(uuid.uuid4())


def serialize(doc: dict) -> dict:
    if not doc:
        return {}
    doc = dict(doc)
    doc.pop("_id", None)
    return doc


def parse_dt(value: Any) -> Optional[datetime]:
    if not value:
        return None
    if isinstance(value, datetime):
        return value
    try:
        return datetime.fromisoformat(str(value).replace("Z", "+00:00"))
    except Exception:
        return None


# ---------- Atomic, per-financial-year token generator ----------
# Used for ORD / WH / PROD / PROC pipeline tokens and B2B/POS invoice
# numbers. NEVER derive the next number from count()/max() scans — those
# race under concurrent writes and can silently repeat a number. A single
# `graamam_counters` document per (kind, FY), incremented atomically via
# find_one_and_update($inc, upsert=True), guarantees a unique sequence.
def fy_code(dt: datetime) -> str:
    """Indian financial year code, e.g. Jul-2026 -> '2627' (FY2026-27)."""
    start = dt.year if dt.month >= 4 else dt.year - 1
    return f"{start % 100:02d}{(start + 1) % 100:02d}"


async def next_fy_token(db, kind: str, pad: int = 4) -> str:
    """Atomically mint the next '<KIND>-<FY>-####' token for `kind`."""
    fy = fy_code(now_ist())
    doc = await db.graamam_counters.find_one_and_update(
        {"_id": f"{kind}_{fy}"},
        {"$inc": {"seq": 1}},
        upsert=True,
        return_document=ReturnDocument.AFTER,
    )
    seq = doc["seq"]
    return f"{kind.upper()}-{fy}-{str(seq).zfill(pad)}"


# ---------- Finished-goods availability (shared by Warehouse + Dispatch) ----------
async def finished_qty(db, product_id: Optional[str]) -> float:
    if not product_id:
        return 0.0
    doc = await db.graamam_inventory.find_one({"sku": product_id}, {"_id": 0, "qty_on_hand": 1})
    return float(doc.get("qty_on_hand") or 0) if doc else 0.0


async def order_availability(db, order: dict) -> List[dict]:
    """Per-line ✓/✗ availability against finished-goods stock. Mirrors
    graamam_v2's orderItemsAvailability()."""
    items = order.get("items") or []
    if not items:
        # Legacy / lump-sum order with no real product lines — stock can't
        # be verified, so treat as unavailable rather than risk a false
        # "Ready for Dispatch"/"Dispatch Order".
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
        avail = await finished_qty(db, it.get("product_id"))
        out.append({
            "product_id": it.get("product_id"),
            "product": it.get("product") or "Item",
            "unit": it.get("unit") or "",
            "qty": qty,
            "available": avail,
            "ok": avail >= qty,
        })
    return out


def order_all_available(availability: List[dict]) -> bool:
    return bool(availability) and all(a["ok"] for a in availability)


async def ensure_unique_indexes(db) -> None:
    """Defense-in-depth: guarantee pipeline-token uniqueness at the
    database level, on top of the atomic counter above. Safe/idempotent
    to call on every startup."""
    await db.graamam_orders.create_index("order_id", unique=True)
    await db.graamam_orders.create_index(
        "wh_token", unique=True,
        partialFilterExpression={"wh_token": {"$type": "string"}},
    )
    await db.graamam_orders.create_index(
        "prod_token", unique=True,
        partialFilterExpression={"prod_token": {"$type": "string"}},
    )
    await db.graamam_invoices.create_index("invoice_id", unique=True)

