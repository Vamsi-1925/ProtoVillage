"""Graamam Connect — Orders API.

Acts as the Firestore stand-in for Phase 1. The document shape mirrors the
planned Firestore contract so we can later swap in real Firebase without
touching the UI components.

Collection: `graamam_orders` (namespaced to graamam / *).
"""
from __future__ import annotations

import logging
import os
import uuid
from datetime import datetime, timezone
from typing import List, Optional

from fastapi import APIRouter, HTTPException, Query
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel, ConfigDict, Field, field_validator
from pymongo import ReturnDocument

from ._shared import now_ist, gen_id

logger = logging.getLogger(__name__)

# Reuse the app-wide Mongo client via env; the main app opens the connection.
_mongo_client: Optional[AsyncIOMotorClient] = None
_db = None


def _get_db():
    global _mongo_client, _db
    if _db is None:
        _mongo_client = AsyncIOMotorClient(os.environ["MONGO_URL"])
        _db = _mongo_client[os.environ["DB_NAME"]]
    return _db


ORDER_STATUSES = {
    "received",
    "warehouse_check",
    "ready_dispatch",
    "production_pending",
    "production_active",
    "procurement_pending",
    "dispatched",
    "closed",
    "cancelled",
}


# ---------- §"New Order" (graamam_v2 pgOrders/openNewOrder replica) ----------
def _fy_code(dt: datetime) -> str:
    """Indian financial year code, e.g. Jul-2026 -> '2627' (FY2026-27)."""
    start = dt.year if dt.month >= 4 else dt.year - 1
    return f"{start % 100:02d}{(start + 1) % 100:02d}"


async def _next_fy_token(db, kind: str, pad: int = 4) -> str:
    """FY-stamped, per-kind sequence — mirrors v2's fyId(type)."""
    fy = _fy_code(now_ist())
    doc = await db.graamam_counters.find_one_and_update(
        {"_id": f"{kind}_{fy}"},
        {"$inc": {"seq": 1}},
        upsert=True,
        return_document=ReturnDocument.AFTER,
    )
    seq = doc["seq"]
    return f"{kind.upper()}-{fy}-{str(seq).zfill(pad)}"


class Customer(BaseModel):
    model_config = ConfigDict(extra="ignore")

    name: str
    initials: Optional[str] = None
    avatar_url: Optional[str] = None


class PartyInfo(BaseModel):
    """Bill-to / Ship-to party snapshot on a B2B order."""
    model_config = ConfigDict(extra="ignore")
    address: Optional[str] = ""
    city: Optional[str] = ""
    pin: Optional[str] = ""
    state_code: Optional[str] = ""
    state_name: Optional[str] = ""
    gstin: Optional[str] = ""
    attn: Optional[str] = ""
    phone: Optional[str] = ""
    contact: Optional[str] = ""


class CustInfo(BaseModel):
    """B2C customer snapshot on an order."""
    model_config = ConfigDict(extra="ignore")
    mobile: Optional[str] = ""
    city: Optional[str] = ""
    state_code: Optional[str] = ""
    state_name: Optional[str] = ""


class Order(BaseModel):
    model_config = ConfigDict(extra="ignore")

    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    order_id: str  # human-readable e.g., ORD-2627-0001 (legacy: GC-8902)
    order_type: Optional[str] = None  # 'b2b' | 'b2c' | None (legacy orders)
    customer: Customer
    customer_id: Optional[str] = None
    bill_to: Optional[dict] = None
    ship_to: Optional[dict] = None
    pan: Optional[str] = None
    cust_info: Optional[dict] = None
    items: List[dict] = Field(default_factory=list)
    items_count: int = 1
    items_summary: Optional[str] = None  # "3 items" or a specific description
    notes: Optional[str] = None
    advance_paid: float = 0.0
    payment_term_days: Optional[int] = None
    date: str  # ISO date (yyyy-mm-dd)
    total: float = 0.0
    status: str = "received"
    delivery_address: Optional[str] = None
    producer: Optional[str] = None
    speed: Optional[str] = "standard"
    wh_token: Optional[str] = None
    prod_token: Optional[str] = None
    proc_token: Optional[str] = None
    invoice_id: Optional[str] = None
    cancelled_at_stage: Optional[str] = None
    cancel_reason: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    @field_validator("status")
    @classmethod
    def _status_ok(cls, v: str) -> str:
        v = (v or "").lower().strip()
        if v not in ORDER_STATUSES:
            raise ValueError(f"status must be one of {sorted(ORDER_STATUSES)}")
        return v


class OrderLineIn(BaseModel):
    model_config = ConfigDict(extra="ignore")
    product_id: str
    qty: float = 0
    rate: Optional[float] = None
    disc: Optional[float] = 0


class OrderCreate(BaseModel):
    """New Order form payload — mirrors graamam_v2 createOrder()."""
    model_config = ConfigDict(extra="ignore")

    order_type: str = "b2b"  # 'b2b' | 'b2c'
    customer_id: Optional[str] = None  # existing customer picked from dropdown
    name: str  # customer / company name
    bill_to: Optional[PartyInfo] = None
    ship_to: Optional[PartyInfo] = None
    pan: Optional[str] = ""
    cust_info: Optional[CustInfo] = None
    items: List[OrderLineIn] = Field(default_factory=list)
    notes: Optional[str] = ""
    advance_paid: float = 0.0
    payment_term_days: Optional[int] = None


class OrderEditPayload(BaseModel):
    """Edit form payload — order_type cannot change on edit (matches v2)."""
    model_config = ConfigDict(extra="ignore")
    name: str
    bill_to: Optional[PartyInfo] = None
    ship_to: Optional[PartyInfo] = None
    pan: Optional[str] = ""
    cust_info: Optional[CustInfo] = None
    items: List[OrderLineIn] = Field(default_factory=list)
    notes: Optional[str] = ""
    advance_paid: Optional[float] = None
    payment_term_days: Optional[int] = None


class OrderStatusUpdate(BaseModel):
    status: str


async def _upsert_customer(db, order_type: str, payload) -> dict:
    """Create-or-update the B2B/B2C master customer record (mirrors v2's
    createOrder(): 'cust=selId?customers.find(...):null; ... else create')."""
    name = (payload.name or "").strip()
    if order_type == "b2b":
        coll = db.graamam_customers_b2b
        bill = payload.bill_to or PartyInfo()
        fields = {
            "name": name,
            "type": "b2b",
            "contact_person": bill.attn or "",
            "mobile": bill.phone or "",
            "address": bill.address or "",
            "city": bill.city or "",
            "pincode": bill.pin or "",
            "state": bill.state_name or "",
            "gstin": bill.gstin or "",
        }
    else:
        coll = db.graamam_customers_b2c
        ci = payload.cust_info or CustInfo()
        fields = {
            "name": name,
            "type": "b2c",
            "mobile": ci.mobile or "",
            "city": ci.city or "",
        }
    if payload.customer_id:
        existing = await coll.find_one({"customer_id": payload.customer_id}, {"_id": 0})
        if existing:
            await coll.update_one({"customer_id": payload.customer_id}, {"$set": fields})
            existing.update(fields)
            return existing
    prefix = "CB" if order_type == "b2b" else "CC"
    pad = 3 if order_type == "b2b" else 4
    n = await coll.count_documents({}) + 1
    cust_id = f"{prefix}{str(n).zfill(pad)}"
    doc = {"id": gen_id(), "customer_id": cust_id, **fields}
    if order_type == "b2b":
        doc["rate_card"] = []
    await coll.insert_one(doc)
    return doc


async def _price_line_items(db, items: List[OrderLineIn], order_type: str):
    """Snapshot product name/unit/GST% + compute gross/disc/gst — mirrors
    v2's updateOrderTotals() per-line math (gross, disc%, taxable, GST)."""
    valid = [it for it in items if it.product_id and it.qty and it.qty > 0]
    if not valid:
        return [], 0.0, 0.0, 0.0
    products = await db.graamam_products.find({}, {"_id": 0}).to_list(1000)
    prod_map = {p.get("product_id"): p for p in products}
    line_items = []
    gross = disc_total = gst_total = 0.0
    for it in valid:
        p = prod_map.get(it.product_id)
        if not p:
            continue
        rate = float(it.rate) if it.rate is not None else float(p.get("mrp_inr") or 0)
        qty = float(it.qty)
        disc_pct = float(it.disc or 0)
        g = rate * qty
        d = g * disc_pct / 100
        taxable = max(0.0, g - d)
        gst_pct = float(p.get("gst_rate") if p.get("gst_rate") is not None else 5)
        gst = taxable * gst_pct / 100
        gross += g
        disc_total += d
        gst_total += gst
        line_items.append({
            "product_id": it.product_id, "product": p.get("name"), "unit": p.get("pack") or "",
            "qty": qty, "rate": rate, "disc": disc_pct, "gst": gst_pct,
        })
    return line_items, gross, disc_total, gst_total


router = APIRouter(prefix="/graamam/orders", tags=["graamam-orders"])


def _serialize(doc: dict) -> dict:
    doc = dict(doc)
    doc.pop("_id", None)
    if isinstance(doc.get("created_at"), str):
        try:
            doc["created_at"] = datetime.fromisoformat(doc["created_at"])
        except Exception:
            pass
    return doc


@router.get("", response_model=List[Order])
async def list_orders(status: Optional[str] = Query(default=None)):
    db = _get_db()
    q: dict = {}
    if status:
        s = status.lower().strip()
        if s not in ORDER_STATUSES and s != "all":
            raise HTTPException(400, f"status must be one of {sorted(ORDER_STATUSES)} or 'all'")
        if s != "all":
            q["status"] = s
    docs = (
        await db.graamam_orders.find(q, {"_id": 0})
        .sort("created_at", -1)
        .to_list(length=1000)
    )
    return [_serialize(d) for d in docs]


@router.get("/counts")
async def status_counts():
    """Return counts per status for badge rendering."""
    db = _get_db()
    counts = {s: 0 for s in ORDER_STATUSES}
    counts["all"] = 0
    pipeline = [{"$group": {"_id": "$status", "n": {"$sum": 1}}}]
    async for row in db.graamam_orders.aggregate(pipeline):
        s = (row.get("_id") or "").lower()
        counts["all"] += row["n"]
        if s in counts:
            counts[s] = row["n"]
    return counts


@router.post("", response_model=Order, status_code=201)
async def create_order(payload: OrderCreate):
    """New Order — replica of graamam_v2's createOrder(): validates name +
    at least one priced line item, creates/updates the customer record,
    generates FY-stamped ORD/WH tokens, and starts the order at
    'warehouse_check'."""
    db = _get_db()

    order_type = (payload.order_type or "b2b").lower().strip()
    if order_type not in ("b2b", "b2c"):
        raise HTTPException(400, "order_type must be 'b2b' or 'b2c'")

    name = (payload.name or "").strip()
    if not name:
        raise HTTPException(400, "Customer name is required.")

    line_items, gross, disc_total, gst_total = await _price_line_items(db, payload.items, order_type)
    if not line_items:
        raise HTTPException(400, "Add at least one item with a product and quantity.")

    cust = await _upsert_customer(db, order_type, payload)

    order_id = await _next_fy_token(db, "ORD")
    wh_token = await _next_fy_token(db, "WH")

    initials = "".join(p[0] for p in name.split()[:2]).upper() or name[:2].upper()
    taxable_total = gross - disc_total
    grand_total = taxable_total + gst_total
    items_qty_total = sum(li["qty"] for li in line_items)
    items_summary = (
        line_items[0]["product"] if len(line_items) == 1
        else f"{line_items[0]['product']} +{len(line_items) - 1} more"
    )

    bill_to = payload.bill_to.model_dump() if (order_type == "b2b" and payload.bill_to) else None
    ship_to = payload.ship_to.model_dump() if (order_type == "b2b" and payload.ship_to) else None
    cust_info = payload.cust_info.model_dump() if (order_type == "b2c" and payload.cust_info) else None
    delivery_address = None
    if order_type == "b2b":
        sa = ship_to or bill_to or {}
        delivery_address = sa.get("address")

    order = Order(
        order_id=order_id,
        order_type=order_type,
        customer=Customer(name=name, initials=initials),
        customer_id=cust.get("customer_id"),
        bill_to=bill_to,
        ship_to=ship_to,
        pan=(payload.pan or "").strip() if order_type == "b2b" else None,
        cust_info=cust_info,
        items=line_items,
        items_count=int(items_qty_total) or 1,
        items_summary=items_summary,
        notes=(payload.notes or "").strip() or None,
        advance_paid=float(payload.advance_paid or 0),
        payment_term_days=(int(payload.payment_term_days) if (order_type == "b2b" and payload.payment_term_days) else None),
        date=datetime.now(timezone.utc).date().isoformat(),
        total=round(grand_total, 2),
        status="warehouse_check",
        delivery_address=delivery_address,
        wh_token=wh_token,
    )
    doc = order.model_dump()
    doc["created_at"] = doc["created_at"].isoformat()
    await db.graamam_orders.insert_one(doc)
    try:
        from .graamam_audit import log_action
        item_desc = ", ".join(f"{li['product']} x{li['qty']:g}" for li in line_items)
        await log_action(
            order_id,
            f"{order_type.upper()} order created for {name} — {len(line_items)} item(s): {item_desc}",
            None, sub_token=wh_token,
        )
        await log_action(order_id, f"Warehouse Token {wh_token} raised", None, sub_token=wh_token)
    except Exception:
        pass
    return order


@router.post("/{order_id}/edit", response_model=Order)
async def edit_order(order_id: str, payload: OrderEditPayload):
    """Edit an existing order — order type can't change (matches v2).
    Direct save (no admin-approval routing in this cut)."""
    db = _get_db()
    order = await db.graamam_orders.find_one({"order_id": order_id}, {"_id": 0})
    if not order:
        raise HTTPException(404, f"order {order_id} not found")
    if order.get("status") in ("dispatched", "closed", "cancelled"):
        raise HTTPException(400, f"This order can no longer be edited (already {order.get('status')}).")

    order_type = order.get("order_type") or "b2b"
    name = (payload.name or "").strip()
    if not name:
        raise HTTPException(400, "Customer name is required.")

    line_items, gross, disc_total, gst_total = await _price_line_items(db, payload.items, order_type)
    if not line_items:
        raise HTTPException(400, "Add at least one item with a product and quantity.")

    grand_total = (gross - disc_total) + gst_total
    items_qty_total = sum(li["qty"] for li in line_items)
    items_summary = (
        line_items[0]["product"] if len(line_items) == 1
        else f"{line_items[0]['product']} +{len(line_items) - 1} more"
    )

    prev_customer = order.get("customer") or {}
    update = {
        "customer": {"name": name, "initials": prev_customer.get("initials"), "avatar_url": prev_customer.get("avatar_url")},
        "items": line_items,
        "items_count": int(items_qty_total) or 1,
        "items_summary": items_summary,
        "notes": (payload.notes or "").strip() or None,
        "total": round(grand_total, 2),
    }
    if order_type == "b2b":
        update["bill_to"] = payload.bill_to.model_dump() if payload.bill_to else order.get("bill_to")
        update["ship_to"] = payload.ship_to.model_dump() if payload.ship_to else order.get("ship_to")
        update["pan"] = (payload.pan or "").strip()
        if payload.advance_paid is not None:
            update["advance_paid"] = float(payload.advance_paid)
        if payload.payment_term_days is not None:
            update["payment_term_days"] = int(payload.payment_term_days)
        sa = update.get("ship_to") or update.get("bill_to") or {}
        update["delivery_address"] = sa.get("address")
    else:
        update["cust_info"] = payload.cust_info.model_dump() if payload.cust_info else order.get("cust_info")

    await db.graamam_orders.update_one({"order_id": order_id}, {"$set": update})
    try:
        from .graamam_audit import log_action
        await log_action(order_id, f"Order {order_id} updated — {name}, {len(line_items)} item(s)", None)
    except Exception:
        pass
    doc = await db.graamam_orders.find_one({"order_id": order_id}, {"_id": 0})
    return _serialize(doc)


@router.post("/{order_id}/cancel")
async def cancel_order(order_id: str, reason: Optional[str] = None):
    """§7.3 cancellation (basic form): flip to cancelled, auto-close threads."""
    db = _get_db()
    order = await db.graamam_orders.find_one({"order_id": order_id}, {"_id": 0})
    if not order:
        raise HTTPException(404, f"order {order_id} not found")
    if order.get("status") in ("dispatched", "closed", "cancelled"):
        raise HTTPException(400, f"order already terminal: {order.get('status')}")
    prev = order.get("status")
    await db.graamam_orders.update_one({"order_id": order_id}, {"$set": {"status": "cancelled", "cancelled_at_stage": prev, "cancel_reason": reason}})
    now = datetime.now(timezone.utc).isoformat()
    await db.graamam_orders.database.graamam_threads.update_many(
        {"$or": [{"link_id": order_id, "status": "open"}, {"link_type": "order", "link_id": order_id, "status": "open"}]},
        {"$set": {"status": "closed", "closed_reason": "order_cancelled", "closed_at": now}},
    )
    try:
        from .graamam_audit import log_action
        await log_action(order_id, f"Order {order_id} cancelled at stage '{prev}'" + (f" — reason: {reason}" if reason else ""), None)
    except Exception:
        pass
    return {"ok": True, "cancelled_at_stage": prev}


@router.post("/{order_id}/status", response_model=Order)
async def update_order_status(order_id: str, payload: OrderStatusUpdate):
    db = _get_db()
    status_l = (payload.status or "").lower().strip()
    if status_l not in ORDER_STATUSES:
        raise HTTPException(400, f"status must be one of {sorted(ORDER_STATUSES)}")
    r = await db.graamam_orders.update_one({"order_id": order_id}, {"$set": {"status": status_l}})
    if not r.matched_count:
        raise HTTPException(404, f"order {order_id} not found")
    doc = await db.graamam_orders.find_one({"order_id": order_id}, {"_id": 0})
    return _serialize(doc)


# ---------- Seeding ----------
SEED_ORDERS: List[dict] = [
    {
        "order_id": "GC-8902",
        "customer": {
            "name": "Priya Sharma",
            "initials": "PS",
            "avatar_url": "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=96&h=96&fit=crop&crop=faces",
        },
        "items_count": 3,
        "items_summary": "3 items",
        "date": "2024-11-24",
        "total": 14250.0,
        "status": "received",
        "delivery_address": "12, Indira Nagar 1st Stage, Bengaluru 560038",
        "producer": "Demo Village Two Estates",
    },
    {
        "order_id": "GC-8901",
        "customer": {"name": "Rajesh Iyer", "initials": "RI", "avatar_url": None},
        "items_count": 1,
        "items_summary": "1 item",
        "date": "2024-11-24",
        "total": 4500.0,
        "status": "received",
        "delivery_address": "Flat 3B, Adyar, Chennai 600020",
        "producer": "Demo Village Six Turmeric Co-op",
    },
    {
        "order_id": "GC-8900",
        "customer": {
            "name": "Ananya Reddy",
            "initials": "AR",
            "avatar_url": "https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=96&h=96&fit=crop&crop=faces",
        },
        "items_count": 2,
        "items_summary": "2 items",
        "date": "2024-11-24",
        "total": 8800.0,
        "status": "received",
        "delivery_address": "18 Jubilee Hills, Hyderabad 500033",
        "producer": "Demo Village Four Weavers Collective",
    },
    {
        "order_id": "GC-8899",
        "customer": {
            "name": "Arjun Menon",
            "initials": "AM",
            "avatar_url": "https://images.unsplash.com/photo-1552058544-f2b08422138a?w=96&h=96&fit=crop&crop=faces",
        },
        "items_count": 5,
        "items_summary": "5 items",
        "date": "2024-11-23",
        "total": 28000.0,
        "status": "warehouse_check",
        "delivery_address": "Ravi Villa, Panampilly Nagar, Kochi 682036",
        "producer": "Demo Village Seven Apiary",
    },
    {
        "order_id": "GC-8898",
        "customer": {
            "name": "Sana Krishnan",
            "initials": "SK",
            "avatar_url": "https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=96&h=96&fit=crop&crop=faces",
        },
        "items_count": 4,
        "items_summary": "4 items",
        "date": "2024-11-23",
        "total": 19575.0,
        "status": "warehouse_check",
        "delivery_address": "42 Sample Nagar, Pune 411006",
        "producer": "Coastal Artisans",
    },
    {
        "order_id": "GC-8897",
        "customer": {
            "name": "Rohit Deshpande",
            "initials": "RD",
            "avatar_url": None,
        },
        "items_count": 6,
        "items_summary": "6 items",
        "date": "2024-11-22",
        "total": 31200.0,
        "status": "ready_dispatch",
        "delivery_address": "Marine Drive, Kochi 682011",
        "producer": "Demo Village Six Turmeric Co-op",
    },
    {
        "order_id": "GC-8896",
        "customer": {
            "name": "Leela Fernandes",
            "initials": "LF",
            "avatar_url": "https://images.unsplash.com/photo-1607746882042-944635dfe10e?w=96&h=96&fit=crop&crop=faces",
        },
        "items_count": 2,
        "items_summary": "2 items",
        "date": "2024-11-21",
        "total": 7450.0,
        "status": "closed",
        "delivery_address": "Bandra West, Mumbai 400050",
        "producer": "Demo Village Eight Herbal Co-op",
    },
    {
        "order_id": "GC-8895",
        "customer": {
            "name": "Devraj Oberoi",
            "initials": "DO",
            "avatar_url": None,
        },
        "items_count": 3,
        "items_summary": "3 items",
        "date": "2024-11-20",
        "total": 12890.0,
        "status": "closed",
        "delivery_address": "Vasant Vihar, New Delhi 110057",
        "producer": "Demo Village One Weavers",
    },
]


async def seed_orders_if_empty():
    """Idempotent seed: adds any missing seed order by `order_id`."""
    db = _get_db()
    existing_ids = {
        d["order_id"]
        async for d in db.graamam_orders.find({}, {"_id": 0, "order_id": 1})
    }
    inserted = 0
    for i, seed in enumerate(SEED_ORDERS):
        if seed["order_id"] in existing_ids:
            continue
        doc = {
            "id": str(uuid.uuid4()),
            **seed,
            # older orders further in the past by index for stable sort
            "created_at": datetime(2023, 10, 24, 12, 0, tzinfo=timezone.utc)
            .replace(hour=max(0, 12 - i))
            .isoformat(),
        }
        await db.graamam_orders.insert_one(doc)
        inserted += 1
    if inserted:
        logger.info("[graamam.orders] seeded %d order(s)", inserted)
