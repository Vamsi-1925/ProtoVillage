"""Approvals + Discussions + Accounts + Admin (skeleton persistence).

These are the 5 remaining modules from the v2 sidebar. Backend surface is
minimal but real — the UI is expected to consume these endpoints once
built out fully.
"""
from __future__ import annotations

from datetime import datetime
from typing import Optional, List
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, ConfigDict, Field

from ._shared import get_db, gen_id, serialize, now_ist

app_router = APIRouter(prefix="/graamam", tags=["graamam-extra"])


# ---------- APPROVALS ----------
class ApprovalDecision(BaseModel):
    approved_by: str
    note: Optional[str] = None
    decision: str  # 'approved' | 'rejected'


@app_router.get("/approvals")
async def list_approvals(status: Optional[str] = None):
    db = get_db()
    q = {"status": "pending_approval"} if status is None else ({} if status == "all" else {"status": status})
    docs = await db.graamam_procurement.find(q, {"_id": 0}).sort("created_at", -1).to_list(500)
    return [serialize(d) for d in docs]


@app_router.post("/approvals/{request_id}/decide")
async def decide_approval(request_id: str, payload: ApprovalDecision):
    db = get_db()
    if payload.decision not in ("approved", "rejected"):
        raise HTTPException(400, "decision must be approved|rejected")
    new_status = "po_raised" if payload.decision == "approved" else "closed"
    r = await db.graamam_procurement.update_one(
        {"request_id": request_id},
        {"$set": {"status": new_status, "approved_by": payload.approved_by,
                  "approval_note": payload.note, "approved_at": now_ist().isoformat()}},
    )
    if not r.matched_count:
        raise HTTPException(404, f"request {request_id} not found")
    doc = await db.graamam_procurement.find_one({"request_id": request_id}, {"_id": 0})
    return serialize(doc)


# ---------- DISCUSSIONS ----------
class ThreadCreate(BaseModel):
    title: str
    link_type: str = "order"  # order | batch | token | procurement | general
    link_id: Optional[str] = None
    created_by: str = "Aditi R."


class MessageCreate(BaseModel):
    thread_id: str
    body: str
    author: str = "Aditi R."


@app_router.get("/threads")
async def list_threads(status: Optional[str] = None):
    db = get_db()
    q = {} if not status else {"status": status}
    docs = await db.graamam_threads.find(q, {"_id": 0}).sort("updated_at", -1).to_list(200)
    # last message preview
    for d in docs:
        last = await db.graamam_thread_messages.find_one({"thread_id": d["thread_id"]}, {"_id": 0}, sort=[("created_at", -1)])
        d["last_message"] = last
    return [serialize(d) for d in docs]


@app_router.post("/threads", status_code=201)
async def create_thread(payload: ThreadCreate):
    db = get_db()
    tid = f"TH-{now_ist().year}-{await db.graamam_threads.count_documents({}) + 1:04d}"
    now = now_ist().isoformat()
    doc = {
        "id": gen_id(), "thread_id": tid, "title": payload.title.strip(),
        "link_type": payload.link_type, "link_id": payload.link_id,
        "status": "open", "created_by": payload.created_by,
        "created_at": now, "updated_at": now,
    }
    await db.graamam_threads.insert_one(doc)
    return {k: v for k, v in doc.items() if k != "_id"}


@app_router.get("/threads/{thread_id}/messages")
async def list_messages(thread_id: str):
    db = get_db()
    return [serialize(d) async for d in db.graamam_thread_messages.find({"thread_id": thread_id}, {"_id": 0}).sort("created_at", 1)]


@app_router.post("/threads/messages", status_code=201)
async def post_message(payload: MessageCreate):
    db = get_db()
    if not await db.graamam_threads.find_one({"thread_id": payload.thread_id}):
        raise HTTPException(404, "thread not found")
    now = now_ist().isoformat()
    msg = {"id": gen_id(), "thread_id": payload.thread_id, "author": payload.author, "body": payload.body, "created_at": now}
    await db.graamam_thread_messages.insert_one(msg)
    await db.graamam_threads.update_one({"thread_id": payload.thread_id}, {"$set": {"updated_at": now}})
    return msg


@app_router.post("/threads/{thread_id}/close")
async def close_thread(thread_id: str, reason: Optional[str] = None):
    db = get_db()
    r = await db.graamam_threads.update_one({"thread_id": thread_id}, {"$set": {"status": "closed", "closed_reason": reason, "closed_at": now_ist().isoformat()}})
    if not r.matched_count:
        raise HTTPException(404, "thread not found")
    return {"ok": True}


# ---------- ACCOUNTS (invoices, ledger) ----------
class InvoicePayload(BaseModel):
    model_config = ConfigDict(extra="ignore")
    order_id: str
    customer_name: str
    customer_gstin: Optional[str] = ""
    customer_state: Optional[str] = ""
    line_items: List[dict]  # [{name, hsn, qty, rate, gst}]
    place_of_supply: Optional[str] = "Andhra Pradesh"


def _compute_invoice(pl: InvoicePayload) -> dict:
    intra = (pl.customer_state or "").strip().lower() in ("andhra pradesh", "ap")
    lines = []
    total_taxable = total_cgst = total_sgst = total_igst = 0.0
    for li in pl.line_items:
        qty = float(li.get("qty") or 0)
        rate = float(li.get("rate") or 0)
        gst = float(li.get("gst") or 5)
        taxable = round(qty * rate, 2)
        gst_amt = round(taxable * gst / 100, 2)
        cgst = sgst = igst = 0.0
        if intra:
            cgst = sgst = round(gst_amt / 2, 2)
        else:
            igst = gst_amt
        lines.append({**li, "taxable": taxable, "gst_amt": gst_amt, "cgst": cgst, "sgst": sgst, "igst": igst})
        total_taxable += taxable
        total_cgst += cgst
        total_sgst += sgst
        total_igst += igst
    grand_total = round(total_taxable + total_cgst + total_sgst + total_igst, 2)
    return {
        "line_items": lines,
        "totals": {
            "taxable": round(total_taxable, 2),
            "cgst": round(total_cgst, 2), "sgst": round(total_sgst, 2),
            "igst": round(total_igst, 2),
            "grand_total": grand_total,
            "round_off": round(round(grand_total) - grand_total, 2),
            "final": round(grand_total),
        },
        "tax_type": "intra" if intra else "inter",
    }


@app_router.post("/invoices", status_code=201)
async def create_invoice(payload: InvoicePayload):
    db = get_db()
    fy = _fy_prefix(now_ist())
    n = await db.graamam_invoices.count_documents({}) + 1
    inv_id = f"B2B{fy}{n:04d}-{now_ist().strftime('%d-%b-%Y')}"
    calc = _compute_invoice(payload)
    doc = {
        "id": gen_id(), "invoice_id": inv_id, "order_id": payload.order_id,
        "customer_name": payload.customer_name, "customer_gstin": payload.customer_gstin,
        "customer_state": payload.customer_state, "place_of_supply": payload.place_of_supply,
        **calc, "status": "raised", "created_at": now_ist().isoformat(),
    }
    await db.graamam_invoices.insert_one(doc)
    return {k: v for k, v in doc.items() if k != "_id"}


@app_router.post("/invoices/from-order/{order_id}", status_code=201)
async def create_invoice_from_order(order_id: str):
    db = get_db()
    order = await db.graamam_orders.find_one({"order_id": order_id}, {"_id": 0})
    if not order:
        raise HTTPException(404, f"order {order_id} not found")

    # Try to match the customer against B2B master to pull GSTIN + state + rate card.
    cust_name = (order.get("customer") or {}).get("name") or ""
    match = None
    if cust_name:
        # loose match on trimmed lowercase
        async for c in db.graamam_customers_b2b.find({}, {"_id": 0}):
            if (c.get("name") or "").strip().lower() == cust_name.strip().lower():
                match = c
                break

    customer_state = (match or {}).get("state") or ""
    customer_gstin = (match or {}).get("gstin") or ""
    line_items = []
    total = float(order.get("total") or 0)
    items_count = int(order.get("items_count") or 1)
    items_summary = order.get("items_summary") or f"{items_count} items"
    # If rate card present + we can identify a product, build proper lines. Else, one lump line.
    rate_card = (match or {}).get("rate_card") or []
    if rate_card and items_count == 1:
        # single-line B2B order — best effort: use first rate-card row as anchor
        entry = rate_card[0]
        line_items = [{
            "name": entry.get("product") or items_summary,
            "hsn": "2106",
            "qty": items_count,
            "rate": float(entry.get("rate") or (total / items_count if items_count else total)),
            "gst": 5,
        }]
    else:
        # Split total across items evenly
        rate = round(total / max(items_count, 1), 2)
        line_items = [{
            "name": items_summary,
            "hsn": "2106",
            "qty": items_count,
            "rate": rate,
            "gst": 5,
        }]

    payload = InvoicePayload(
        order_id=order_id,
        customer_name=cust_name,
        customer_gstin=customer_gstin,
        customer_state=customer_state,
        line_items=line_items,
        place_of_supply=customer_state or "Andhra Pradesh",
    )
    return await create_invoice(payload)


@app_router.get("/invoices/{invoice_id}")
async def get_invoice(invoice_id: str):
    db = get_db()
    doc = await db.graamam_invoices.find_one({"invoice_id": invoice_id}, {"_id": 0})
    if not doc:
        raise HTTPException(404, "invoice not found")
    return serialize(doc)


@app_router.get("/invoices")
async def list_invoices(status: Optional[str] = None):
    db = get_db()
    q = {} if not status or status == "all" else {"status": status}
    return [serialize(d) async for d in db.graamam_invoices.find(q, {"_id": 0}).sort("created_at", -1).limit(500)]


@app_router.post("/invoices/{invoice_id}/mark-paid")
async def mark_invoice_paid(invoice_id: str):
    db = get_db()
    r = await db.graamam_invoices.update_one({"invoice_id": invoice_id}, {"$set": {"status": "paid", "paid_at": now_ist().isoformat()}})
    if not r.matched_count:
        raise HTTPException(404, "invoice not found")
    return {"ok": True}


@app_router.get("/accounts/summary")
async def accounts_summary():
    db = get_db()
    total = 0.0
    paid = 0.0
    async for inv in db.graamam_invoices.find({}, {"_id": 0, "status": 1, "totals": 1}):
        f = float(inv.get("totals", {}).get("final") or 0)
        total += f
        if inv.get("status") == "paid":
            paid += f
    return {"total_billed_inr": total, "total_paid_inr": paid, "outstanding_inr": round(total - paid, 2)}


def _fy_prefix(dt: datetime) -> str:
    # Indian FY: Apr–Mar. FY2026-27 -> code 2627
    y = dt.year
    m = dt.month
    start = y if m >= 4 else y - 1
    end = start + 1
    return f"{str(start)[-2:]}{str(end)[-2:]}"


# ---------- ADMIN ----------
@app_router.get("/admin/users")
async def list_users():
    # v2 demo users — later swap to real auth
    return [
        {"username": "admin",     "name": "Admin",             "role": "admin"},
        {"username": "lead",      "name": "Graamam Lead",      "role": "lead"},
        {"username": "suresh",    "name": "Suresh",             "role": "stock"},
        {"username": "divya",     "name": "Divya",              "role": "accounts"},
        {"username": "krishna",   "name": "Krishna",            "role": "procurement"},
        {"username": "warehouse", "name": "Warehouse Lead",    "role": "warehouse"},
        {"username": "production","name": "Production Lead",   "role": "production"},
    ]


@app_router.get("/admin/delete-requests")
async def list_delete_requests():
    db = get_db()
    return [serialize(d) async for d in db.graamam_delete_requests.find({}, {"_id": 0}).sort("created_at", -1).limit(200)]
