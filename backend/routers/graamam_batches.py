"""Graamam Connect — Batches (raw produce collected from producers).

A "batch" is the shipment received from a producer. It flows from Received
→ QC → Production. New Batch form (slide-over) creates one of these.
"""
from __future__ import annotations

from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel, ConfigDict, Field

from ._shared import get_db, gen_id, serialize, now_ist, today_ist_iso

router = APIRouter(prefix="/graamam/batches", tags=["graamam-batches"])

BATCH_STATUSES = {"received", "qc_pending", "qc_pass", "in_production", "done", "rejected"}


class Batch(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=gen_id)
    batch_id: str  # e.g. B-4920
    product_name: str
    product_sku: Optional[str] = None
    producer_id: Optional[str] = None
    producer_name: Optional[str] = None
    village: Optional[str] = None
    quantity: float = 0.0
    unit: str = "kg"
    collection_date: str  # ISO date IST
    status: str = "received"
    photo_url: Optional[str] = None
    notes: Optional[str] = None
    created_at: datetime = Field(default_factory=now_ist)


class BatchCreate(BaseModel):
    model_config = ConfigDict(extra="ignore")
    product_name: str
    product_sku: Optional[str] = None
    producer_id: Optional[str] = None
    producer_name: Optional[str] = None
    village: Optional[str] = None
    quantity: float = 0.0
    unit: str = "kg"
    collection_date: Optional[str] = None
    status: Optional[str] = "received"
    photo_url: Optional[str] = None
    notes: Optional[str] = None


SEEDS: List[dict] = [
    {"batch_id": "B-4920", "product_name": "Demo Powder - Alpha", "product_sku": "SP-TUR-001", "producer_id": "PRD-1047", "producer_name": "Demo Producer Six", "village": "Demo Village Six", "quantity": 250, "unit": "kg", "collection_date": "2024-11-27", "status": "in_production", "notes": "First harvest of the season, colour vibrant."},
    {"batch_id": "B-4918", "product_name": "Cold Pressed Coconut Oil", "product_sku": "OL-COC-500", "producer_id": "PRD-1046", "producer_name": "Demo Producer Five", "village": "Demo Village Five", "quantity": 120, "unit": "L", "collection_date": "2024-11-26", "status": "qc_pending", "notes": ""},
    {"batch_id": "B-4915", "product_name": "Dried Lemongrass", "product_sku": "HR-NEE-100", "producer_id": "PRD-1049", "producer_name": "Demo Producer Eight", "village": "Demo Village Eight", "quantity": 45, "unit": "kg", "collection_date": "2024-11-24", "status": "done", "notes": "QC passed. Ready for packaging."},
    {"batch_id": "B-4912", "product_name": "Demo Herb Powder - Beta", "product_sku": "HR-MOR-200", "producer_id": "PRD-1049", "producer_name": "Demo Producer Eight", "village": "Demo Village Eight", "quantity": 80, "unit": "kg", "collection_date": "2024-11-23", "status": "in_production", "notes": ""},
    {"batch_id": "B-4910", "product_name": "Demo Grain - Millet Mix", "product_sku": "GR-MIL-060", "producer_id": "PRD-1043", "producer_name": "Demo Producer Two", "village": "Demo Village Two", "quantity": 320, "unit": "kg", "collection_date": "2024-11-22", "status": "qc_pass", "notes": "Grade A."},
    {"batch_id": "B-4908", "product_name": "Wild Forest Honey", "product_sku": "PR-HON-002", "producer_id": "PRD-1048", "producer_name": "Demo Producer Seven", "village": "Demo Village Seven", "quantity": 90, "unit": "jars", "collection_date": "2024-11-20", "status": "done", "notes": ""},
]


@router.get("", response_model=List[Batch])
async def list_batches(status: Optional[str] = Query(default=None)):
    db = get_db()
    q: dict = {}
    if status and status.lower() != "all":
        q["status"] = status.lower()
    docs = await db.graamam_batches.find(q, {"_id": 0}).sort("collection_date", -1).to_list(1000)
    return [serialize(d) for d in docs]


@router.get("/summary")
async def batches_summary():
    db = get_db()
    counts = {s: 0 for s in BATCH_STATUSES}
    async for row in db.graamam_batches.aggregate([{"$group": {"_id": "$status", "n": {"$sum": 1}}}]):
        s = row["_id"]
        counts[s] = row["n"]
    return {"counts": counts, "active_batches": sum(counts[s] for s in ("received", "qc_pending", "qc_pass", "in_production"))}


@router.post("", response_model=Batch, status_code=201)
async def create_batch(payload: BatchCreate):
    db = get_db()
    if not payload.product_name.strip():
        raise HTTPException(400, "product_name is required")
    # auto batch id
    docs = await db.graamam_batches.find({}, {"_id": 0, "batch_id": 1}).to_list(5000)
    nums = []
    for d in docs:
        try:
            nums.append(int(d["batch_id"].split("-")[-1]))
        except Exception:
            pass
    next_id = f"B-{max(nums) + 1 if nums else 4920}"
    status = (payload.status or "received").lower()
    if status not in BATCH_STATUSES:
        raise HTTPException(400, f"status must be one of {sorted(BATCH_STATUSES)}")
    b = Batch(
        batch_id=next_id,
        product_name=payload.product_name.strip(),
        product_sku=payload.product_sku,
        producer_id=payload.producer_id,
        producer_name=payload.producer_name,
        village=payload.village,
        quantity=float(payload.quantity or 0),
        unit=payload.unit or "kg",
        collection_date=payload.collection_date or today_ist_iso(),
        status=status,
        photo_url=payload.photo_url,
        notes=payload.notes,
    )
    doc = b.model_dump()
    doc["created_at"] = doc["created_at"].isoformat()
    await db.graamam_batches.insert_one(doc)
    return b


async def seed_batches_if_empty():
    db = get_db()
    existing = {d["batch_id"] async for d in db.graamam_batches.find({}, {"_id": 0, "batch_id": 1})}
    inserted = 0
    for i, s in enumerate(SEEDS):
        if s["batch_id"] in existing:
            continue
        doc = {"id": gen_id(), **s, "created_at": now_ist().replace(hour=max(0, 20 - i)).isoformat()}
        await db.graamam_batches.insert_one(doc)
        inserted += 1
    return inserted
