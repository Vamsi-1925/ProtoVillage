"""Graamam Connect — Procurement (material shortage requests → PO → QC).

Kanban stages: pending_approval | po_raised | received_qc | closed.
"""
from __future__ import annotations

from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel, ConfigDict, Field

from ._shared import get_db, gen_id, serialize, now_ist, today_ist_iso

router = APIRouter(prefix="/graamam/procurement", tags=["graamam-procurement"])

PROC_STATUSES = {"pending_approval", "po_raised", "received_qc", "closed"}


class ProcurementRequest(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=gen_id)
    request_id: str  # PR-0042
    material_name: str
    quantity: float
    unit: str = "kg"
    required_by: Optional[str] = None
    status: str = "pending_approval"
    supplier_name: Optional[str] = None
    po_number: Optional[str] = None
    ordered_qty: Optional[float] = None
    est_delivery: Optional[str] = None
    received_qty: Optional[float] = None
    quality_check: Optional[str] = None  # passed/failed/pending
    cost_inr: Optional[float] = None
    created_at: datetime = Field(default_factory=now_ist)


SEEDS: List[dict] = [
    {"request_id": "PR-0042", "material_name": "Organic Cotton Yarn", "quantity": 50, "unit": "kg", "required_by": "2024-11-30", "status": "pending_approval"},
    {"request_id": "PR-0043", "material_name": "Natural Indigo Dye", "quantity": 10, "unit": "L", "required_by": "2024-12-02", "status": "pending_approval"},
    {"request_id": "PR-0044", "material_name": "Custom Labels", "quantity": 500, "unit": "units", "required_by": "2024-11-29", "status": "pending_approval"},
    {"request_id": "PR-0041", "material_name": "Beeswax Blocks", "quantity": 20, "unit": "kg", "required_by": "2024-12-05", "status": "po_raised", "supplier_name": "Demo Village Seven Apiary Co.", "po_number": "PO-0891", "ordered_qty": 20, "est_delivery": "2024-12-04"},
    {"request_id": "PR-0040", "material_name": "Terracotta Clay", "quantity": 100, "unit": "kg", "required_by": "2024-11-28", "status": "received_qc", "supplier_name": "Demo Village Three Ceramics", "po_number": "PO-0885", "ordered_qty": 100, "est_delivery": "2024-11-25", "received_qty": 100, "quality_check": "passed"},
    {"request_id": "PR-0039", "material_name": "Glass Bottles (1L)", "quantity": 300, "unit": "units", "required_by": "2024-11-25", "status": "closed", "supplier_name": "Bengaluru Packaging Ltd.", "po_number": "PO-0880", "ordered_qty": 300, "est_delivery": "2024-11-22", "received_qty": 300, "quality_check": "passed", "cost_inr": 21000},
]


class RequestCreate(BaseModel):
    material_name: str
    quantity: float
    unit: str = "kg"
    required_by: Optional[str] = None


class RequestUpdate(BaseModel):
    status: Optional[str] = None
    supplier_name: Optional[str] = None
    po_number: Optional[str] = None
    ordered_qty: Optional[float] = None
    est_delivery: Optional[str] = None
    received_qty: Optional[float] = None
    quality_check: Optional[str] = None
    cost_inr: Optional[float] = None


@router.get("", response_model=List[ProcurementRequest])
async def list_requests(status: Optional[str] = Query(default=None)):
    db = get_db()
    q: dict = {}
    if status and status.lower() != "all":
        q["status"] = status.lower()
    docs = await db.graamam_procurement.find(q, {"_id": 0}).sort("created_at", -1).to_list(1000)
    return [serialize(d) for d in docs]


@router.post("", response_model=ProcurementRequest, status_code=201)
async def create_request(payload: RequestCreate):
    db = get_db()
    docs = await db.graamam_procurement.find({}, {"_id": 0, "request_id": 1}).to_list(5000)
    nums = []
    for d in docs:
        try:
            nums.append(int(d["request_id"].split("-")[-1]))
        except Exception:
            pass
    rid = f"PR-{max(nums) + 1 if nums else 42:04d}"
    pr = ProcurementRequest(
        request_id=rid,
        material_name=payload.material_name.strip(),
        quantity=payload.quantity, unit=payload.unit,
        required_by=payload.required_by or today_ist_iso(),
    )
    doc = pr.model_dump()
    doc["created_at"] = doc["created_at"].isoformat()
    await db.graamam_procurement.insert_one(doc)
    return pr


@router.post("/{request_id}")
async def update_request(request_id: str, payload: RequestUpdate):
    db = get_db()
    update: dict = {}
    if payload.status:
        if payload.status not in PROC_STATUSES:
            raise HTTPException(400, f"status must be one of {sorted(PROC_STATUSES)}")
        update["status"] = payload.status
    for f in ("supplier_name", "po_number", "ordered_qty", "est_delivery", "received_qty", "quality_check", "cost_inr"):
        v = getattr(payload, f)
        if v is not None:
            update[f] = v
    if not update:
        raise HTTPException(400, "no fields to update")
    r = await db.graamam_procurement.update_one({"request_id": request_id}, {"$set": update})
    if not r.matched_count:
        raise HTTPException(404, f"request {request_id} not found")
    doc = await db.graamam_procurement.find_one({"request_id": request_id}, {"_id": 0})
    return serialize(doc)


@router.get("/summary")
async def summary():
    db = get_db()
    counts = {s: 0 for s in PROC_STATUSES}
    async for row in db.graamam_procurement.aggregate([{"$group": {"_id": "$status", "n": {"$sum": 1}}}]):
        counts[row["_id"]] = row["n"]
    return {"counts": counts}


async def seed_procurement_if_empty():
    db = get_db()
    existing = {d["request_id"] async for d in db.graamam_procurement.find({}, {"_id": 0, "request_id": 1})}
    inserted = 0
    for i, s in enumerate(SEEDS):
        if s["request_id"] in existing:
            continue
        doc = {"id": gen_id(), **s, "created_at": now_ist().replace(hour=max(0, 20 - i)).isoformat()}
        await db.graamam_procurement.insert_one(doc)
        inserted += 1
    return inserted
