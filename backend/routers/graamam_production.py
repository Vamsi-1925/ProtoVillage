"""Graamam Connect — Production tokens & slips.

Each token represents a production run tied to a customer order + product.
Each slip lists required raw materials with availability + status.
"""
from __future__ import annotations

from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel, ConfigDict, Field

from ._shared import get_db, gen_id, serialize, now_ist, today_ist_iso

router = APIRouter(prefix="/graamam/production", tags=["graamam-production"])

TOKEN_STATUSES = {"pending", "active", "complete", "cancelled"}


class Material(BaseModel):
    model_config = ConfigDict(extra="ignore")
    name: str
    required: float
    available: float
    unit: str = "kg"

    @property
    def status(self) -> str:
        return "sufficient" if self.available >= self.required else "shortage"


class ProductionToken(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=gen_id)
    token_id: str  # e.g. TK-2024-11B
    product_name: str
    product_qty: float
    product_unit: str = "kg"
    order_id: Optional[str] = None
    due_date: Optional[str] = None
    producer_group: Optional[str] = None
    materials: List[Material] = Field(default_factory=list)
    status: str = "pending"
    created_at: datetime = Field(default_factory=now_ist)


SEEDS: List[dict] = [
    {
        "token_id": "TK-2024-11A",
        "product_name": "Organic Turmeric Powder",
        "product_qty": 50,
        "product_unit": "kg",
        "order_id": "GC-9921",
        "due_date": "2024-11-28",
        "producer_group": "Coastal Artisans",
        "status": "pending",
        "materials": [
            {"name": "Dried Turmeric Roots", "required": 60, "available": 65, "unit": "kg"},
            {"name": "Ziplock Pouches (200g)", "required": 250, "available": 280, "unit": "units"},
            {"name": "Custom Labels", "required": 250, "available": 45, "unit": "units"},
        ],
    },
    {
        "token_id": "TK-2024-11B",
        "product_name": "Cold Pressed Coconut Oil",
        "product_qty": 200,
        "product_unit": "L",
        "order_id": "GC-9925",
        "due_date": "2024-11-28",
        "producer_group": "Coastal Artisans",
        "status": "active",
        "materials": [
            {"name": "Dried Coconuts (Copra)", "required": 450, "available": 500, "unit": "kg"},
            {"name": "Glass Bottles (1L)", "required": 200, "available": 215, "unit": "units"},
            {"name": "Custom Labels", "required": 200, "available": 45, "unit": "units"},
            {"name": "Packaging Boxes", "required": 20, "available": 50, "unit": "units"},
        ],
    },
    {
        "token_id": "TK-2024-10X",
        "product_name": "Handwoven Cotton Throws",
        "product_qty": 50,
        "product_unit": "units",
        "order_id": "GC-9910",
        "due_date": "2024-11-05",
        "producer_group": "Hampi Weavers",
        "status": "complete",
        "materials": [
            {"name": "Organic Cotton Yarn", "required": 80, "available": 90, "unit": "kg"},
            {"name": "Natural Indigo Dye", "required": 6, "available": 8, "unit": "L"},
        ],
    },
]


def _serialize_token(doc: dict) -> dict:
    d = serialize(doc)
    mats = d.get("materials") or []
    d["materials"] = [
        {**m, "status": "sufficient" if float(m.get("available", 0)) >= float(m.get("required", 0)) else "shortage"}
        for m in mats
    ]
    return d


@router.get("")
async def list_tokens(status: Optional[str] = Query(default=None)):
    db = get_db()
    q: dict = {}
    if status and status.lower() != "all":
        q["status"] = status.lower()
    docs = await db.graamam_production.find(q, {"_id": 0}).sort("created_at", -1).to_list(1000)
    return [_serialize_token(d) for d in docs]


class TokenCreate(BaseModel):
    model_config = ConfigDict(extra="ignore")
    product_name: str
    product_qty: float
    product_unit: str = "kg"
    order_id: Optional[str] = None
    due_date: Optional[str] = None
    producer_group: Optional[str] = None
    materials: List[dict] = Field(default_factory=list)
    status: str = "pending"


class TokenStatusUpdate(BaseModel):
    status: str


@router.post("", status_code=201)
async def create_token(payload: TokenCreate):
    db = get_db()
    if not payload.product_name.strip():
        raise HTTPException(400, "product_name is required")
    docs = await db.graamam_production.find({}, {"_id": 0, "token_id": 1}).to_list(5000)
    nums = []
    for d in docs:
        try:
            nums.append(int("".join(c for c in d["token_id"].split("-")[-1] if c.isdigit()) or 0))
        except Exception:
            pass
    year = now_ist().year
    n = max(nums) + 1 if nums else 1
    letter = chr(ord("A") + (n - 1) % 26)
    tk_id = f"TK-{year}-{n:02d}{letter}"
    status = (payload.status or "pending").lower()
    if status not in TOKEN_STATUSES:
        raise HTTPException(400, f"status must be one of {sorted(TOKEN_STATUSES)}")
    token = ProductionToken(
        token_id=tk_id, product_name=payload.product_name.strip(),
        product_qty=payload.product_qty, product_unit=payload.product_unit,
        order_id=payload.order_id, due_date=payload.due_date or today_ist_iso(),
        producer_group=payload.producer_group, status=status,
        materials=[Material(**m) for m in (payload.materials or [])],
    )
    d = token.model_dump()
    d["created_at"] = d["created_at"].isoformat()
    await db.graamam_production.insert_one(d)
    return _serialize_token(d)


@router.post("/{token_id}/status")
async def update_token_status(token_id: str, payload: TokenStatusUpdate):
    db = get_db()
    status = payload.status.lower()
    if status not in TOKEN_STATUSES:
        raise HTTPException(400, f"status must be one of {sorted(TOKEN_STATUSES)}")
    r = await db.graamam_production.update_one({"token_id": token_id}, {"$set": {"status": status}})
    if not r.matched_count:
        raise HTTPException(404, f"token {token_id} not found")
    doc = await db.graamam_production.find_one({"token_id": token_id}, {"_id": 0})
    return _serialize_token(doc)


async def seed_production_if_empty():
    db = get_db()
    existing = {d["token_id"] async for d in db.graamam_production.find({}, {"_id": 0, "token_id": 1})}
    inserted = 0
    for i, s in enumerate(SEEDS):
        if s["token_id"] in existing:
            continue
        doc = {"id": gen_id(), **s, "created_at": now_ist().replace(hour=max(0, 22 - i)).isoformat()}
        await db.graamam_production.insert_one(doc)
        inserted += 1
    return inserted
