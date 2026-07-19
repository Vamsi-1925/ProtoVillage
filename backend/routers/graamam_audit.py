"""§10 audit log. Rolling capped log (3000 entries), append-only.

`log_action(order_id, action, actor, sub_token=None)` is the single entry point
used by every mutation that changes data.
"""
from __future__ import annotations

import logging
from typing import Optional
from fastapi import APIRouter, Query

from ._shared import get_db, gen_id, serialize, now_ist

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/graamam/audit", tags=["graamam-audit"])

MAX_ENTRIES = 3000


async def log_action(order_id: Optional[str], action: str, actor: Optional[dict] = None, sub_token: Optional[str] = None):
    """Append an audit entry. actor = {'id','name','role'} or None."""
    db = get_db()
    a = actor or {"id": None, "name": "system", "role": "system"}
    doc = {
        "id": gen_id(),
        "order_id": order_id,
        "action": action,
        "actor_id": a.get("id"),
        "actor_name": a.get("name") or "system",
        "actor_role": a.get("role") or "system",
        "sub_token": sub_token,
        "ts": now_ist().isoformat(),
    }
    await db.graamam_audit_logs.insert_one(doc)
    # Enforce rolling cap: drop oldest above MAX_ENTRIES.
    n = await db.graamam_audit_logs.count_documents({})
    if n > MAX_ENTRIES:
        overflow = n - MAX_ENTRIES
        oldest = db.graamam_audit_logs.find({}, {"_id": 1}).sort("ts", 1).limit(overflow)
        ids = [d["_id"] async for d in oldest]
        if ids:
            await db.graamam_audit_logs.delete_many({"_id": {"$in": ids}})
    return doc


@router.get("")
async def list_audit(order_id: Optional[str] = Query(default=None), limit: int = 200):
    db = get_db()
    q = {"order_id": order_id} if order_id else {}
    docs = await db.graamam_audit_logs.find(q, {"_id": 0}).sort("ts", -1).to_list(int(limit))
    return [serialize(d) for d in docs]


@router.get("/order/{order_id}/trail")
async def order_trail(order_id: str):
    """§8 hub view: chronological audit trail for one order."""
    db = get_db()
    docs = await db.graamam_audit_logs.find({"order_id": order_id}, {"_id": 0}).sort("ts", 1).to_list(1000)
    order = await db.graamam_orders.find_one({"order_id": order_id}, {"_id": 0})
    return {
        "order": serialize(order) if order else None,
        "trail": [serialize(d) for d in docs],
    }
