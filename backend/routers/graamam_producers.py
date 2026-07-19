"""Graamam Connect — Producers.

India-first sample data: villages across Karnataka, Odisha, Kerala, etc.,
traditional crafts (hand-loom, cold-press, apiary, pottery, spice) with
quality scores and active batch counts.
"""
from __future__ import annotations

from typing import List, Optional
from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel, ConfigDict, Field

from ._shared import get_db, gen_id, serialize, now_ist

router = APIRouter(prefix="/graamam/producers", tags=["graamam-producers"])

PRODUCER_STATUSES = {"on_track", "growing", "review_required", "processing", "paused"}


class Producer(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=gen_id)
    producer_id: str  # e.g. PRD-1042
    name: str
    village: str
    state: str = "Karnataka"
    photo_url: Optional[str] = None
    tags: List[str] = Field(default_factory=list)
    quality_score: float = 0.0
    active_batches: int = 0
    unit: str = "kg"
    status: str = "on_track"
    craft: str = ""
    phone: Optional[str] = None


class ProducerCreate(BaseModel):
    model_config = ConfigDict(extra="ignore")
    name: str
    village: str
    state: Optional[str] = "Karnataka"
    craft: Optional[str] = ""
    tags: Optional[List[str]] = None
    photo_url: Optional[str] = None
    phone: Optional[str] = None


SEEDS: List[dict] = [
    {
        "producer_id": "PRD-1042",
        "name": "Demo Producer One",
        "village": "Demo Village One",
        "state": "Karnataka",
        "photo_url": "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=200&h=200&fit=crop&crop=faces",
        "tags": ["Textiles", "Hand-loom"],
        "quality_score": 98.4,
        "active_batches": 12,
        "unit": "units",
        "status": "on_track",
        "craft": "Handloom weaving",
        "phone": "+91 90080 12345",
    },
    {
        "producer_id": "PRD-1043",
        "name": "Demo Producer Two",
        "village": "Demo Village Two",
        "state": "Karnataka",
        "photo_url": "https://images.unsplash.com/photo-1556157382-97eda2d62296?w=200&h=200&fit=crop&crop=faces",
        "tags": ["Food", "Organic"],
        "quality_score": 92.1,
        "active_batches": 450,
        "unit": "kg",
        "status": "growing",
        "craft": "Organic coffee & spice",
        "phone": "+91 96632 78421",
    },
    {
        "producer_id": "PRD-1044",
        "name": "Demo Producer Three",
        "village": "Demo Village Three",
        "state": "Karnataka",
        "photo_url": "https://images.unsplash.com/photo-1531891437562-4301cf35b7e4?w=200&h=200&fit=crop&crop=faces",
        "tags": ["Pottery", "Artisanal"],
        "quality_score": 88.5,
        "active_batches": 84,
        "unit": "units",
        "status": "review_required",
        "craft": "Terracotta pottery",
        "phone": "+91 94487 55221",
    },
    {
        "producer_id": "PRD-1045",
        "name": "Demo Producer Four",
        "village": "Demo Village Four",
        "state": "Karnataka",
        "photo_url": "https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=200&h=200&fit=crop&crop=faces",
        "tags": ["Craft", "Embroidery"],
        "quality_score": 95.0,
        "active_batches": 32,
        "unit": "units",
        "status": "on_track",
        "craft": "Traditional embroidery",
        "phone": "+91 90080 44112",
    },
    {
        "producer_id": "PRD-1046",
        "name": "Demo Producer Five",
        "village": "Demo Village Five",
        "state": "Karnataka",
        "photo_url": "https://images.unsplash.com/photo-1552058544-f2b08422138a?w=200&h=200&fit=crop&crop=faces",
        "tags": ["Food", "Traditional"],
        "quality_score": 91.8,
        "active_batches": 120,
        "unit": "L",
        "status": "processing",
        "craft": "Cold-pressed coconut oil",
        "phone": "+91 94488 90210",
    },
    {
        "producer_id": "PRD-1047",
        "name": "Demo Producer Six",
        "village": "Demo Village Six",
        "state": "Odisha",
        "photo_url": "https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=200&h=200&fit=crop&crop=faces",
        "tags": ["Spices", "Organic"],
        "quality_score": 96.2,
        "active_batches": 220,
        "unit": "kg",
        "status": "on_track",
        "craft": "Organic turmeric",
        "phone": "+91 95679 33021",
    },
    {
        "producer_id": "PRD-1048",
        "name": "Demo Producer Seven",
        "village": "Demo Village Seven",
        "state": "Kerala",
        "photo_url": "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&h=200&fit=crop&crop=faces",
        "tags": ["Preserves", "Apiary"],
        "quality_score": 93.7,
        "active_batches": 80,
        "unit": "jars",
        "status": "processing",
        "craft": "Wild forest honey",
        "phone": "+91 90080 88712",
    },
    {
        "producer_id": "PRD-1049",
        "name": "Demo Producer Eight",
        "village": "Demo Village Eight",
        "state": "Kerala",
        "photo_url": "https://images.unsplash.com/photo-1602004437057-7d64b1c6a0e8?w=200&h=200&fit=crop&crop=faces",
        "tags": ["Herbs", "Traditional"],
        "quality_score": 90.4,
        "active_batches": 60,
        "unit": "kg",
        "status": "on_track",
        "craft": "Herbal powders",
        "phone": "+91 94001 22331",
    },
]


@router.get("", response_model=List[Producer])
async def list_producers(
    village: Optional[str] = Query(default=None),
    tag: Optional[str] = Query(default=None),
    q: Optional[str] = Query(default=None),
):
    db = get_db()
    query: dict = {}
    if village and village.lower() != "all":
        query["village"] = village
    if tag:
        query["tags"] = tag
    if q:
        query["$or"] = [
            {"name": {"$regex": q, "$options": "i"}},
            {"village": {"$regex": q, "$options": "i"}},
            {"craft": {"$regex": q, "$options": "i"}},
        ]
    docs = await db.graamam_producers.find(query, {"_id": 0}).sort("quality_score", -1).to_list(500)
    return [serialize(d) for d in docs]


@router.get("/villages")
async def list_villages():
    db = get_db()
    villages = await db.graamam_producers.distinct("village")
    return sorted(villages)


@router.get("/counts")
async def producer_counts():
    db = get_db()
    total = await db.graamam_producers.count_documents({})
    villages = await db.graamam_producers.distinct("village")
    return {"total_producers": total, "engaged_villages": len(villages)}


@router.post("", response_model=Producer, status_code=201)
async def create_producer(payload: ProducerCreate):
    db = get_db()
    if not payload.name.strip():
        raise HTTPException(400, "name is required")
    existing = await db.graamam_producers.find({}, {"_id": 0, "producer_id": 1}).to_list(5000)
    nums = []
    for d in existing:
        try:
            nums.append(int(d["producer_id"].split("-")[-1]))
        except Exception:
            pass
    next_id = f"PRD-{max(nums) + 1 if nums else 1050}"
    p = Producer(
        producer_id=next_id,
        name=payload.name.strip(),
        village=payload.village.strip() or "Unknown",
        state=(payload.state or "Karnataka").strip(),
        craft=(payload.craft or "").strip(),
        tags=payload.tags or [],
        photo_url=payload.photo_url,
        phone=payload.phone,
    )
    await db.graamam_producers.insert_one(p.model_dump())
    return p


async def seed_producers_if_empty():
    db = get_db()
    existing = {d["producer_id"] async for d in db.graamam_producers.find({}, {"_id": 0, "producer_id": 1})}
    inserted = 0
    for s in SEEDS:
        if s["producer_id"] in existing:
            continue
        doc = {"id": gen_id(), **s}
        await db.graamam_producers.insert_one(doc)
        inserted += 1
    return inserted
