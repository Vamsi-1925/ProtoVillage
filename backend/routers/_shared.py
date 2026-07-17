"""Shared helpers for Graamam Connect routers.

Keeps a single Mongo client / DB accessor and IST-aware timestamp helpers so
every collection uses the same conventions (Indian context: INR, IST).
"""
from __future__ import annotations

import os
import uuid
from datetime import datetime, timedelta, timezone
from typing import Any, Optional

from motor.motor_asyncio import AsyncIOMotorClient

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
