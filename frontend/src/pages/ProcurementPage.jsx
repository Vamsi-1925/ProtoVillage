import React, { useEffect, useMemo, useState } from "react";
import AppShell from "@/components/graamam/AppShell";
import PageHeader from "@/components/graamam/PageHeader";
import Icon from "@/components/graamam/Icon";
import StatusPill from "@/components/graamam/StatusPill";
import SlideOver from "@/components/graamam/SlideOver";
import { procurementRepository, ordersRepository } from "@/lib/firestoreClient";
import { GRAAMAM_PROCUREMENT } from "@/constants/testIds";
import { formatOrderDate, formatCurrency } from "@/lib/formatters";

const COLS = [
  { key: "pending_approval", title: "Pending Approval" },
  { key: "po_raised", title: "PO Raised" },
  { key: "received_qc", title: "Received & QC" },
];

export default function ProcurementPage() {
  const [items, setItems] = useState([]);
  const [drawer, setDrawer] = useState(false);
  const [saving, setSaving] = useState(false);
  const [ordersCounts, setOrdersCounts] = useState({});

  const load = () => procurementRepository.list().then(setItems);
  useEffect(() => { load(); }, []);
  useEffect(() => { ordersRepository.counts().then(setOrdersCounts).catch(() => {}); }, []);

  const grouped = useMemo(() => {
    const g = { pending_approval: [], po_raised: [], received_qc: [], closed: [] };
    items.forEach((r) => { (g[r.status] || (g[r.status] = [])).push(r); });
    return g;
  }, [items]);

  const approve = async (r) => {
    const supplier = window.prompt("Supplier name?", "Sourcing Partner") || "Sourcing Partner";
    await procurementRepository.update(r.request_id, {
      status: "po_raised", supplier_name: supplier,
      po_number: `PO-${String(Math.floor(Math.random() * 9000) + 1000)}`,
      ordered_qty: r.quantity, est_delivery: r.required_by,
    });
    load();
  };
  const markPurchased = async (r) => {
    await procurementRepository.update(r.request_id, {
      status: "received_qc", received_qty: r.ordered_qty || r.quantity,
      quality_check: "passed",
    });
    load();
  };
  const finalize = async (r) => {
    const cost = Number(window.prompt("Final cost in ₹ INR?", String(r.cost_inr || 0)) || 0);
    await procurementRepository.update(r.request_id, { status: "closed", cost_inr: cost });
    load();
  };

  return (
    <AppShell badges={{ orders: ordersCounts.new || 0 }} topBarTitle="Procurement Management">
      <div data-testid={GRAAMAM_PROCUREMENT.page}>
        <PageHeader
          title="Material Shortages"
          subtitle="Review and manage pending procurement requests to restock inventory. All costs in ₹ INR."
          actionLabel="New Request"
          actionIcon="add"
          actionTestId={GRAAMAM_PROCUREMENT.newRequest}
          onAction={() => setDrawer(true)}
        />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {COLS.map((col) => (
            <div key={col.key} data-testid={GRAAMAM_PROCUREMENT.column(col.key)}>
              <div className="flex items-center justify-between mb-4 border-b border-surface-variant dark:border-white/10 pb-2">
                <h3 className="font-headline font-semibold text-headline-sm text-on-surface dark:text-white">{col.title}</h3>
                <span className="font-label text-body-sm px-2.5 py-0.5 rounded-full bg-tertiary-fixed/50 text-on-tertiary-fixed">{grouped[col.key]?.length || 0}</span>
              </div>
              <div className="flex flex-col gap-4 min-h-[120px]">
                {(grouped[col.key] || []).length === 0 ? (
                  <div className="text-outline text-body-sm text-center py-6">Nothing here yet.</div>
                ) : (grouped[col.key] || []).map((r) => (
                  <article key={r.request_id} data-testid={GRAAMAM_PROCUREMENT.card(r.request_id)} className="rounded-2xl bg-surface-container-lowest dark:bg-[#121212] border border-surface-variant/70 dark:border-white/5 shadow-warm-sm p-5">
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div>
                        <div className="font-label font-bold text-body-md text-on-surface dark:text-white">{r.material_name}</div>
                        <div className="text-body-sm text-outline">Req ID: #{r.request_id}{r.po_number ? ` · PO: #${r.po_number}` : ""}</div>
                      </div>
                      <StatusPill status={r.status} />
                    </div>
                    <div className="bg-surface-container dark:bg-white/5 rounded-xl px-4 py-3 space-y-1.5 text-body-sm">
                      {col.key === "pending_approval" ? <>
                        <div className="flex justify-between"><span className="text-on-surface-variant dark:text-outline-variant">Quantity Needed</span><span className="font-bold text-on-surface dark:text-white">{r.quantity} {r.unit}</span></div>
                        <div className="flex justify-between"><span className="text-on-surface-variant dark:text-outline-variant">Required By</span><span className="font-bold text-on-surface dark:text-white">{formatOrderDate(r.required_by)}</span></div>
                      </> : col.key === "po_raised" ? <>
                        <div className="flex justify-between"><span className="text-on-surface-variant dark:text-outline-variant">Supplier</span><span className="font-bold text-on-surface dark:text-white">{r.supplier_name}</span></div>
                        <div className="flex justify-between"><span className="text-on-surface-variant dark:text-outline-variant">Ordered</span><span className="font-bold text-on-surface dark:text-white">{r.ordered_qty} {r.unit}</span></div>
                        <div className="flex justify-between"><span className="text-on-surface-variant dark:text-outline-variant">Est. Delivery</span><span className="font-bold text-on-surface dark:text-white">{formatOrderDate(r.est_delivery)}</span></div>
                      </> : <>
                        <div className="flex justify-between"><span className="text-on-surface-variant dark:text-outline-variant">Received</span><span className="font-bold text-on-surface dark:text-white">{r.received_qty} {r.unit}</span></div>
                        <div className="flex justify-between"><span className="text-on-surface-variant dark:text-outline-variant">Quality Check</span><span className="font-bold text-olive-success">{r.quality_check?.toUpperCase() || "PENDING"}</span></div>
                        {r.cost_inr ? <div className="flex justify-between"><span className="text-on-surface-variant dark:text-outline-variant">Cost</span><span className="font-bold text-on-surface dark:text-white">{formatCurrency(r.cost_inr)}</span></div> : null}
                      </>}
                    </div>
                    <div className="mt-3">
                      {col.key === "pending_approval" ? (
                        <button data-testid={GRAAMAM_PROCUREMENT.approve(r.request_id)} onClick={() => approve(r)} className="w-full font-label font-bold text-body-md px-4 py-2.5 rounded-lg bg-primary-container text-on-primary hover:shadow-warm shadow-warm-sm">Approve & Raise PO</button>
                      ) : col.key === "po_raised" ? (
                        <button data-testid={GRAAMAM_PROCUREMENT.markPurchased(r.request_id)} onClick={() => markPurchased(r)} className="w-full font-label font-bold text-body-md px-4 py-2.5 rounded-lg bg-surface-container dark:bg-white/10 text-on-surface dark:text-white border border-outline-variant/70 hover:bg-surface-container-high">Mark Purchased</button>
                      ) : (
                        <button data-testid={GRAAMAM_PROCUREMENT.finalize(r.request_id)} onClick={() => finalize(r)} className="w-full font-label font-bold text-body-md px-4 py-2.5 rounded-lg bg-primary-container text-on-primary hover:shadow-warm shadow-warm-sm">Enter Cost & Finalize</button>
                      )}
                    </div>
                  </article>
                ))}
              </div>
            </div>
          ))}
        </div>

        <NewRequestDrawer
          open={drawer}
          onClose={() => (saving ? null : setDrawer(false))}
          saving={saving}
          onSubmit={async (payload) => {
            setSaving(true);
            try { await procurementRepository.create(payload); setDrawer(false); load(); } finally { setSaving(false); }
          }}
        />
      </div>
    </AppShell>
  );
}

function NewRequestDrawer({ open, onClose, onSubmit, saving }) {
  const [material, setMaterial] = useState("");
  const [qty, setQty] = useState("");
  const [unit, setUnit] = useState("kg");
  const [reqBy, setReqBy] = useState("");
  const submit = async (e) => {
    e.preventDefault();
    await onSubmit({ material_name: material, quantity: Number(qty || 0), unit, required_by: reqBy || undefined });
  };
  useEffect(() => { if (open) { setMaterial(""); setQty(""); setUnit("kg"); setReqBy(""); } }, [open]);
  return (
    <SlideOver open={open} onClose={onClose} title="New Procurement Request" subtitle="Signal a material shortage to the sourcing team."
      footer={<>
        <button type="button" onClick={onClose} className="font-label font-bold text-body-md px-5 py-2.5 rounded-lg text-on-surface-variant dark:text-outline-variant hover:bg-surface-container dark:hover:bg-white/10">Cancel</button>
        <button type="submit" form="proc-form" disabled={saving} className="font-label font-bold text-body-md px-6 py-2.5 rounded-lg bg-primary-container text-on-primary shadow-warm-sm inline-flex items-center gap-2"><Icon name="add" className="text-[18px]" /> {saving ? "Saving…" : "Create Request"}</button>
      </>}
    >
      <form id="proc-form" onSubmit={submit} className="flex flex-col gap-5">
        <label className="flex flex-col gap-1"><span className="font-label text-label-sm text-on-surface dark:text-outline-variant uppercase tracking-wider">Material</span>
          <input value={material} onChange={(e) => setMaterial(e.target.value)} required placeholder="e.g. Organic Cotton Yarn" className="font-body text-body-md rounded-lg border border-outline-variant/70 dark:border-white/10 bg-white dark:bg-black text-on-surface dark:text-white px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary" /></label>
        <div className="grid grid-cols-2 gap-3">
          <label className="flex flex-col gap-1"><span className="font-label text-label-sm text-on-surface dark:text-outline-variant uppercase tracking-wider">Quantity</span>
            <input type="number" min="0" step="0.01" value={qty} onChange={(e) => setQty(e.target.value)} required className="font-body text-body-md rounded-lg border border-outline-variant/70 dark:border-white/10 bg-white dark:bg-black text-on-surface dark:text-white px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary" /></label>
          <label className="flex flex-col gap-1"><span className="font-label text-label-sm text-on-surface dark:text-outline-variant uppercase tracking-wider">Unit</span>
            <select value={unit} onChange={(e) => setUnit(e.target.value)} className="font-body text-body-md rounded-lg border border-outline-variant/70 dark:border-white/10 bg-white dark:bg-black text-on-surface dark:text-white px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary">{["kg", "g", "L", "units"].map((u) => <option key={u} value={u}>{u}</option>)}</select></label>
        </div>
        <label className="flex flex-col gap-1"><span className="font-label text-label-sm text-on-surface dark:text-outline-variant uppercase tracking-wider">Required By (IST)</span>
          <input type="date" value={reqBy} onChange={(e) => setReqBy(e.target.value)} className="font-body text-body-md rounded-lg border border-outline-variant/70 dark:border-white/10 bg-white dark:bg-black text-on-surface dark:text-white px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary" /></label>
      </form>
    </SlideOver>
  );
}
