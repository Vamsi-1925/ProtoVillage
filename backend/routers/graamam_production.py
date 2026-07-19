"""Graamam Connect — Production tokens & slips (graamam_v2 parity).

pgProduction / openCreateSlip / createSlip / startProduction /
completeProduction / viewSlip / ensureProcurement.

A PROD token is raised by the Warehouse stock-check (raise-production)
when finished-goods stock can't cover an order. Here the team:
  1. Create Slip — aggregates raw-material requirement from the linked
     order's line items (via each product's recipe, ÷ conversion), against
     live raw-material stock (same shared `graamam_inventory` collection).
     All sufficient -> slip "ready". Any short -> slip "material_shortage"
     AND a PROC token is raised, order -> procurement_pending.
  2. Start Production — guarded on live availability; DEDUCTS raw
     materials; order -> production_active.
  3. Mark Complete — ADDS produced quantities to finished-goods stock;
     order -> ready_dispatch.
"""
from __future__ import annotations

from typing import List, Optional
from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel, ConfigDict

from ._shared import get_db, gen_id, serialize, now_ist, next_fy_token

router = APIRouter(prefix="/graamam/production", tags=["graamam-production"])

TOKEN_STATUSES = {"open", "in_progress", "complete", "cancelled"}


class TokenStatusUpdate(BaseModel):
    model_config = ConfigDict(extra="ignore")
    status: str


# ---------- Shared raw-material requirement aggregation ----------
async def order_raw_needs(db, order: dict) -> List[dict]:
    """Recipe -> product auto-link, by NAME. Mirrors v2's orderRawNeeds():
    for every line item, look up its recipe, scale ingredient qty by
    (order qty ÷ batchOutput) ÷ conversion, and aggregate across items that
    share a raw material."""
    items = order.get("items") or []
    need: dict = {}
    for it in items:
        recipe = await db.graamam_recipes.find_one({"name": it.get("product")}, {"_id": 0})
        if not recipe:
            continue
        batch_output = float(recipe.get("batch_output") or 1) or 1
        conversion = float(recipe.get("conversion") or 1) or 1
        qty = float(it.get("qty") or 0)
        for ing in recipe.get("ingredients", []):
            mat_name = ing.get("item")
            if not mat_name:
                continue
            per_batch_qty = float(ing.get("qty") or 0)
            required = (qty / batch_output) * per_batch_qty / conversion
            row = need.setdefault(mat_name, {"mat_name": mat_name, "unit": "kg", "required": 0.0})
            row["required"] += required
    return [{**r, "required": round(r["required"], 3)} for r in need.values()]


async def raw_needs_with_availability(db, order: dict) -> List[dict]:
    needs = await order_raw_needs(db, order)
    out = []
    for r in needs:
        mat = await db.graamam_inventory.find_one({"item_type": "raw_material", "name": r["mat_name"]}, {"_id": 0})
        available = float(mat.get("qty_on_hand", 0)) if mat else 0.0
        unit = mat.get("unit") if mat else r["unit"]
        out.append({**r, "unit": unit, "available": available, "sufficient": available >= r["required"]})
    return out


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
        "items": order.get("items"),
        "items_summary": order.get("items_summary"),
        "items_count": order.get("items_count"),
    }


@router.get("")
async def list_tokens(status: Optional[str] = Query(default=None)):
    db = get_db()
    q: dict = {}
    if status and status.lower() != "all":
        q["status"] = status.lower()
    docs = await db.graamam_production.find(q, {"_id": 0}).sort("created_at", -1).to_list(1000)
    out = []
    for d in docs:
        slip = await db.graamam_prod_slips.find_one({"slip_id": d.get("slip_id")}, {"_id": 0}) if d.get("slip_id") else None
        out.append({
            **serialize(d),
            "order": await _order_summary(db, d.get("order_id")),
            "slip_status": slip.get("status") if slip else None,
            "shortage": bool(slip) and slip.get("status") == "material_shortage",
        })
    return out


@router.get("/{token_id}/slip")
async def view_slip(token_id: str):
    """Always show LIVE stock, so a slip reflects materials procured after
    it was created (v2's viewSlip)."""
    db = get_db()
    t = await db.graamam_production.find_one({"token_id": token_id}, {"_id": 0})
    if not t or not t.get("slip_id"):
        raise HTTPException(404, "No production slip for this token yet.")
    slip = await db.graamam_prod_slips.find_one({"slip_id": t["slip_id"]}, {"_id": 0})
    if not slip:
        raise HTTPException(404, "slip not found")
    live = []
    for r in slip.get("recipe") or []:
        mat = await db.graamam_inventory.find_one({"item_type": "raw_material", "name": r["mat_name"]}, {"_id": 0})
        avail = float(mat.get("qty_on_hand", 0)) if mat else 0.0
        live.append({**r, "available": avail, "sufficient": avail >= r["required"]})
    slip["recipe"] = live
    slip["all_ok"] = all(r["sufficient"] for r in live)
    return serialize(slip)


@router.post("/{token_id}/create-slip")
async def create_slip(token_id: str):
    db = get_db()
    t = await db.graamam_production.find_one({"token_id": token_id}, {"_id": 0})
    if not t:
        raise HTTPException(404, f"token {token_id} not found")
    order = await db.graamam_orders.find_one({"order_id": t.get("order_id")}, {"_id": 0})
    if not order:
        raise HTTPException(404, "linked order not found")

    needs = await raw_needs_with_availability(db, order)
    all_ok = all(r["sufficient"] for r in needs)  # no matching recipe -> nothing to check -> ready
    slip_id = await next_fy_token(db, "SLIP")
    now = now_ist().isoformat()
    slip_doc = {
        "id": gen_id(), "slip_id": slip_id, "prod_token_id": token_id, "order_id": t.get("order_id"),
        "products": order.get("items") or [],
        "recipe": needs,
        "all_ok": all_ok,
        "status": "ready" if all_ok else "material_shortage",
        "created_at": now, "created_by_name": "Production Team",
    }
    await db.graamam_prod_slips.insert_one(slip_doc)
    await db.graamam_production.update_one({"token_id": token_id}, {"$set": {"slip_id": slip_id}})
    try:
        from .graamam_audit import log_action
        await log_action(t.get("order_id"), f"Production Slip {slip_id} created", None, sub_token=token_id)
    except Exception:
        pass

    proc_id = None
    if not all_ok:
        short_items = [r for r in needs if not r["sufficient"]]
        proc_id = await next_fy_token(db, "PROC")
        proc_doc = {
            "id": gen_id(), "proc_id": proc_id, "order_id": t.get("order_id"),
            "prod_token_id": token_id, "slip_id": slip_id,
            "items": [{
                "mat_name": r["mat_name"], "unit": r["unit"],
                "required": r["required"], "available": r["available"],
                "shortfall": round(max(0.0, r["required"] - r["available"]), 3),
            } for r in short_items],
            "total_cost": 0.0, "status": "pending", "vendor_name": None,
            "created_at": now, "created_by_name": "Production Team",
        }
        await db.graamam_proc_tokens.insert_one(proc_doc)
        await db.graamam_orders.update_one({"order_id": t.get("order_id")}, {"$set": {"proc_token": proc_id, "status": "procurement_pending"}})
        try:
            from .graamam_audit import log_action
            await log_action(t.get("order_id"), f"Material shortage — Procurement Token {proc_id} raised", None, sub_token=proc_id)
        except Exception:
            pass

    doc = await db.graamam_production.find_one({"token_id": token_id}, {"_id": 0})
    return {**serialize(doc), "slip_status": slip_doc["status"], "proc_token": proc_id}


@router.post("/{token_id}/start")
async def start_production(token_id: str):
    db = get_db()
    t = await db.graamam_production.find_one({"token_id": token_id}, {"_id": 0})
    if not t:
        raise HTTPException(404, f"token {token_id} not found")
    if t.get("status") != "open":
        raise HTTPException(400, f"token is not open (status={t.get('status')})")
    if not t.get("slip_id"):
        raise HTTPException(400, "Create a production slip first.")
    slip = await db.graamam_prod_slips.find_one({"slip_id": t["slip_id"]}, {"_id": 0})
    if not slip:
        raise HTTPException(404, "slip not found")

    # GUARD: re-check LIVE availability — never start without enough raw material.
    live = []
    for r in slip.get("recipe") or []:
        mat = await db.graamam_inventory.find_one({"item_type": "raw_material", "name": r["mat_name"]}, {"_id": 0})
        avail = float(mat.get("qty_on_hand", 0)) if mat else 0.0
        live.append({**r, "available": avail, "sufficient": avail >= r["required"]})
    if not all(r["sufficient"] for r in live):
        raise HTTPException(400, "Cannot start production — raw materials are insufficient. Send this to Procurement instead.")

    for r in live:
        await db.graamam_inventory.update_one({"item_type": "raw_material", "name": r["mat_name"]}, {"$inc": {"qty_on_hand": -r["required"]}})

    now = now_ist().isoformat()
    await db.graamam_production.update_one({"token_id": token_id}, {"$set": {"status": "in_progress", "started_at": now, "started_by": "Production Team"}})
    await db.graamam_orders.update_one({"order_id": t.get("order_id")}, {"$set": {"status": "production_active"}})
    try:
        from .graamam_audit import log_action
        await log_action(t.get("order_id"), "Production started", None, sub_token=token_id)
    except Exception:
        pass
    doc = await db.graamam_production.find_one({"token_id": token_id}, {"_id": 0})
    return serialize(doc)


@router.post("/{token_id}/complete")
async def complete_production(token_id: str):
    db = get_db()
    t = await db.graamam_production.find_one({"token_id": token_id}, {"_id": 0})
    if not t:
        raise HTTPException(404, f"token {token_id} not found")
    if t.get("status") != "in_progress":
        raise HTTPException(400, f"token is not in progress (status={t.get('status')})")

    order = await db.graamam_orders.find_one({"order_id": t.get("order_id")}, {"_id": 0}) or {}
    items = order.get("items") or []
    for it in items:
        pid = it.get("product_id")
        qty = float(it.get("qty") or 0)
        if pid:
            await db.graamam_inventory.update_one({"sku": pid}, {"$inc": {"qty_on_hand": qty}})

    now = now_ist().isoformat()
    await db.graamam_production.update_one({"token_id": token_id}, {"$set": {"status": "complete", "completed_at": now, "completed_by": "Production Team"}})
    await db.graamam_orders.update_one({"order_id": t.get("order_id")}, {"$set": {"status": "ready_dispatch"}})
    try:
        from .graamam_audit import log_action
        item_desc = ", ".join(f"{it.get('product')} x{it.get('qty'):g}" for it in items) if items else (order.get("items_summary") or "")
        await log_action(t.get("order_id"), f"Production complete — {item_desc} added to finished stock. Order ready for dispatch.", None, sub_token=token_id)
    except Exception:
        pass
    doc = await db.graamam_production.find_one({"token_id": token_id}, {"_id": 0})
    return serialize(doc)


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
    return serialize(doc)
