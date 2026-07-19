"""Graamam Connect — Procurement (LEAN, order-pipeline-linked).

Not the full graamam_v2 pgProcurement (no 2-stage Lead approval, no
per-category PO printing, no vendor master/ratings, no per-item QC — those
are explicitly out of scope for this cut). Just 3 stages:

  pending -> approved -> received

A PROC token is raised by Production's "Create Slip" when raw materials
are short. "Approve & Purchase" clears it to buy. "Receive & Enter Cost"
records the unit cost per short material (vendor optional), ADDS the
received quantities back into the SAME shared `graamam_inventory`
collection, writes a price-history entry, and sets the linked order back
to 'production_pending' so it reappears in Production ready to Start.
"""
from __future__ import annotations

from typing import List, Optional
from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel, ConfigDict

from ._shared import get_db, gen_id, serialize, now_ist

router = APIRouter(prefix="/graamam/proc-tokens", tags=["graamam-proc-tokens"])

PROC_STATUSES = {"pending", "approved", "received"}


class ReceiveItem(BaseModel):
    model_config = ConfigDict(extra="ignore")
    mat_name: str
    unit_cost: float = 0.0


class ReceivePayload(BaseModel):
    model_config = ConfigDict(extra="ignore")
    items: List[ReceiveItem]
    vendor_name: Optional[str] = None


async def _order_summary(db, order_id: Optional[str]) -> Optional[dict]:
    if not order_id:
        return None
    order = await db.graamam_orders.find_one({"order_id": order_id}, {"_id": 0})
    if not order:
        return None
    return {
        "order_id": order.get("order_id"),
        "order_type": order.get("order_type"),
        "customer": order.get("customer"),
        "items_summary": order.get("items_summary"),
    }


@router.get("")
async def list_proc_tokens(status: Optional[str] = Query(default=None)):
    db = get_db()
    q: dict = {}
    if status and status.lower() != "all":
        q["status"] = status.lower()
    docs = await db.graamam_proc_tokens.find(q, {"_id": 0}).sort("created_at", -1).to_list(500)
    out = []
    for d in docs:
        out.append({**serialize(d), "order": await _order_summary(db, d.get("order_id"))})
    return out


@router.post("/{proc_id}/approve")
async def approve_and_purchase(proc_id: str):
    db = get_db()
    p = await db.graamam_proc_tokens.find_one({"proc_id": proc_id}, {"_id": 0})
    if not p:
        raise HTTPException(404, f"procurement token {proc_id} not found")
    if p.get("status") != "pending":
        raise HTTPException(400, f"token is not pending (status={p.get('status')})")
    now = now_ist().isoformat()
    await db.graamam_proc_tokens.update_one({"proc_id": proc_id}, {"$set": {"status": "approved", "approved_at": now, "approved_by": "Procurement"}})
    try:
        from .graamam_audit import log_action
        await log_action(p.get("order_id"), f"Procurement {proc_id} approved for purchase", None, sub_token=proc_id)
    except Exception:
        pass
    doc = await db.graamam_proc_tokens.find_one({"proc_id": proc_id}, {"_id": 0})
    return serialize(doc)


@router.post("/{proc_id}/receive")
async def receive_and_enter_cost(proc_id: str, payload: ReceivePayload):
    db = get_db()
    p = await db.graamam_proc_tokens.find_one({"proc_id": proc_id}, {"_id": 0})
    if not p:
        raise HTTPException(404, f"procurement token {proc_id} not found")
    if p.get("status") != "approved":
        raise HTTPException(400, f"token is not approved (status={p.get('status')})")

    cost_by_mat = {i.mat_name: float(i.unit_cost or 0) for i in payload.items}
    now = now_ist().isoformat()
    total_cost = 0.0
    updated_items = []
    for it in p.get("items") or []:
        mat_name = it.get("mat_name")
        qty = float(it.get("required") or it.get("shortfall") or 0)
        unit_cost = cost_by_mat.get(mat_name, 0.0)
        total = round(qty * unit_cost, 2)
        total_cost += total
        updated_items.append({**it, "unit_cost": unit_cost, "received_qty": qty, "total_cost": total})

        mat = await db.graamam_inventory.find_one({"item_type": "raw_material", "name": mat_name}, {"_id": 0})
        if mat:
            await db.graamam_inventory.update_one({"item_type": "raw_material", "name": mat_name}, {"$inc": {"qty_on_hand": qty}})
            if unit_cost > 0:
                await db.graamam_inventory.update_one({"item_type": "raw_material", "name": mat_name}, {"$set": {"unit_price_inr": unit_cost}})
                await db.graamam_price_history.insert_one({
                    "id": gen_id(), "sku": mat.get("sku"), "name": mat_name, "date": now,
                    "qty": qty, "unit_price": unit_cost, "total": total,
                    "order_id": p.get("order_id"), "proc_id": proc_id,
                    "recorded_by": "Procurement", "note": payload.vendor_name or "",
                })

    await db.graamam_proc_tokens.update_one(
        {"proc_id": proc_id},
        {"$set": {
            "status": "received", "received_at": now, "received_by": "Procurement",
            "vendor_name": payload.vendor_name, "total_cost": round(total_cost, 2), "items": updated_items,
        }},
    )

    # Refresh the linked slip's live availability (so it reflects the restock).
    slip_id = p.get("slip_id")
    if slip_id:
        slip = await db.graamam_prod_slips.find_one({"slip_id": slip_id}, {"_id": 0})
        if slip:
            live = []
            for r in slip.get("recipe") or []:
                mat = await db.graamam_inventory.find_one({"item_type": "raw_material", "name": r["mat_name"]}, {"_id": 0})
                avail = float(mat.get("qty_on_hand", 0)) if mat else 0.0
                live.append({**r, "available": avail, "sufficient": avail >= r["required"]})
            all_ok = bool(live) and all(r["sufficient"] for r in live)
            await db.graamam_prod_slips.update_one({"slip_id": slip_id}, {"$set": {"recipe": live, "all_ok": all_ok, "status": "ready" if all_ok else "material_shortage"}})

    # Order goes back to production_pending — ready to Start in Production.
    if p.get("order_id"):
        await db.graamam_orders.update_one({"order_id": p["order_id"]}, {"$set": {"status": "production_pending"}})

    try:
        from .graamam_audit import log_action
        vendor_note = f" (vendor: {payload.vendor_name})" if payload.vendor_name else ""
        await log_action(p.get("order_id"), f"Procurement {proc_id} received — ₹{round(total_cost, 2)} recorded{vendor_note}. Order back to Production.", None, sub_token=proc_id)
    except Exception:
        pass

    doc = await db.graamam_proc_tokens.find_one({"proc_id": proc_id}, {"_id": 0})
    return serialize(doc)
