import React, { useCallback, useEffect, useMemo, useState } from "react";
import AppShell from "@/components/graamam/AppShell";
import PageHeader from "@/components/graamam/PageHeader";
import Icon from "@/components/graamam/Icon";
import { procTokensRepository } from "@/lib/firestoreClient";
import { GRAAMAM_PROCUREMENT } from "@/constants/testIds";
import { formatCurrency, formatDateTimeIST, formatQty } from "@/lib/formatters";

/**
 * ProcurementPage — LEAN version (not full graamam_v2 pgProcurement): just
 * pending -> approved -> received for PROC tokens raised by Production
 * when raw materials are short. No 2-stage Lead approval, no per-category
 * PO printing, no vendor master/ratings, no per-item QC in this cut.
 */
const COLS = [
  { key: "pending", title: "Pending" },
  { key: "approved", title: "Approved" },
  { key: "received", title: "Received" },
];

function TokenCard({ token, onApprove, onReceive, busy }) {
  return (
    <article data-testid={GRAAMAM_PROCUREMENT.card(token.proc_id)} className="rounded-2xl bg-surface-container-lowest dark:bg-[#121212] border border-surface-variant/70 dark:border-white/5 shadow-warm-sm p-5">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div>
          <div className="font-mono text-sm bg-surface-container dark:bg-white/10 px-2.5 py-1 rounded-md text-on-surface dark:text-white font-semibold border border-outline-variant/30 dark:border-white/10 inline-block mb-1">
            {token.proc_id}
          </div>
          <div className="text-body-sm text-outline">
            Order <span className="font-mono">{token.order_id}</span>{token.order?.customer?.name ? ` · ${token.order.customer.name}` : ""}
          </div>
        </div>
      </div>
      <div className="bg-surface-container dark:bg-white/5 rounded-xl px-4 py-3 flex flex-col gap-1.5 text-body-sm">
        {(token.items || []).map((it, i) => (
          <div key={i} className="flex justify-between">
            <span className="text-on-surface-variant dark:text-outline-variant">{it.mat_name}</span>
            <span className="font-bold text-on-surface dark:text-white">
              {token.status === "received" ? formatQty(it.received_qty ?? it.required, it.unit) : formatQty(it.shortfall ?? it.required, it.unit)}
            </span>
          </div>
        ))}
        {token.status === "received" ? (
          <div className="flex justify-between pt-1.5 mt-1 border-t border-outline-variant/30 dark:border-white/10">
            <span className="text-on-surface-variant dark:text-outline-variant">Total Cost</span>
            <span className="font-bold text-on-surface dark:text-white">{formatCurrency(token.total_cost)}</span>
          </div>
        ) : null}
        {token.vendor_name ? (
          <div className="flex justify-between"><span className="text-on-surface-variant dark:text-outline-variant">Vendor</span><span className="font-bold text-on-surface dark:text-white">{token.vendor_name}</span></div>
        ) : null}
      </div>
      <div className="mt-3">
        {token.status === "pending" ? (
          <button type="button" disabled={busy} data-testid={GRAAMAM_PROCUREMENT.approve(token.proc_id)} onClick={() => onApprove(token.proc_id)}
            className="w-full font-label font-bold text-body-md px-4 py-2.5 rounded-lg bg-primary-container text-on-primary hover:shadow-warm shadow-warm-sm disabled:opacity-60">
            Approve & Purchase
          </button>
        ) : token.status === "approved" ? (
          <button type="button" data-testid={GRAAMAM_PROCUREMENT.receiveButton(token.proc_id)} onClick={() => onReceive(token)}
            className="w-full font-label font-bold text-body-md px-4 py-2.5 rounded-lg bg-olive-success text-white hover:shadow-warm shadow-warm-sm">
            Receive & Enter Cost
          </button>
        ) : (
          <div className="text-body-sm text-outline text-center">Received {formatDateTimeIST(token.received_at)}</div>
        )}
      </div>
    </article>
  );
}

function ReceiveDialog({ token, onClose, onSubmit, saving }) {
  const [costs, setCosts] = useState({});
  const [vendor, setVendor] = useState("");

  useEffect(() => {
    if (token) { setCosts({}); setVendor(""); }
  }, [token]);

  if (!token) return null;

  const totalPreview = (token.items || []).reduce((sum, it) => {
    const qty = it.shortfall ?? it.required ?? 0;
    return sum + qty * Number(costs[it.mat_name] || 0);
  }, 0);

  const submit = async (e) => {
    e.preventDefault();
    const items = (token.items || []).map((it) => ({ mat_name: it.mat_name, unit_cost: Number(costs[it.mat_name] || 0) }));
    await onSubmit({ items, vendor_name: vendor.trim() || null });
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" data-testid={GRAAMAM_PROCUREMENT.receiveDialog} role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-inverse-surface/60 dark:bg-black/70 backdrop-blur-sm" onClick={() => (saving ? null : onClose())} />
      <form onSubmit={submit} className="relative w-full max-w-lg rounded-2xl bg-surface-container-lowest dark:bg-[#121212] border border-outline-variant/60 dark:border-white/10 shadow-warm-lg p-8">
        <div className="flex items-start justify-between mb-6 gap-4">
          <div>
            <h3 className="font-headline font-bold text-headline-md text-on-surface dark:text-white">Receive &amp; Enter Cost</h3>
            <p className="font-mono text-body-sm text-on-surface-variant dark:text-outline-variant mt-1">{token.proc_id}</p>
          </div>
          <button type="button" aria-label="Close" onClick={onClose} className="text-outline hover:text-primary-container dark:hover:text-white p-2 -m-2 rounded-full transition-colors">
            <Icon name="close" className="text-[22px]" />
          </button>
        </div>

        <div className="flex flex-col gap-4">
          <label className="flex flex-col gap-1.5">
            <span className="font-label text-label-sm text-on-surface dark:text-outline-variant uppercase tracking-wider">Vendor Name (optional)</span>
            <input data-testid={GRAAMAM_PROCUREMENT.receiveVendor} value={vendor} onChange={(e) => setVendor(e.target.value)} placeholder="e.g. Anantapur Agro Traders"
              className="font-body text-body-md rounded-lg border border-outline-variant/70 dark:border-white/10 bg-white dark:bg-black text-on-surface dark:text-white px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary" />
          </label>

          <div className="grid grid-cols-[2fr_1fr_1fr] gap-2 text-[10px] font-label font-bold uppercase tracking-wider text-outline">
            <div>Material</div><div>Qty to Receive</div><div>Unit Cost ₹</div>
          </div>
          {(token.items || []).map((it) => (
            <div key={it.mat_name} className="grid grid-cols-[2fr_1fr_1fr] gap-2 items-center">
              <span className="font-semibold text-on-surface dark:text-white">{it.mat_name}</span>
              <span className="text-on-surface-variant dark:text-outline-variant text-body-sm">{formatQty(it.shortfall ?? it.required, it.unit)}</span>
              <input
                type="number" min="0" step="0.01" data-testid={GRAAMAM_PROCUREMENT.receiveCostInput(it.mat_name)}
                value={costs[it.mat_name] || ""} onChange={(e) => setCosts({ ...costs, [it.mat_name]: e.target.value })}
                placeholder="0.00" required
                className="font-body text-body-md rounded-lg border border-outline-variant/70 dark:border-white/10 bg-white dark:bg-black text-on-surface dark:text-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          ))}

          <div className="flex justify-between text-body-lg font-bold pt-3 mt-1 border-t border-outline-variant/40 dark:border-white/10 text-on-surface dark:text-white">
            <span>Total Cost</span><span>{formatCurrency(totalPreview)}</span>
          </div>

          <button type="submit" disabled={saving} data-testid={GRAAMAM_PROCUREMENT.receiveSubmit}
            className="w-full font-label font-bold text-label-md px-6 py-3 rounded-lg bg-primary-container text-on-primary hover:shadow-warm shadow-warm-sm disabled:opacity-70 inline-flex items-center justify-center gap-2">
            <Icon name={saving ? "progress_activity" : "inventory_2"} className={`text-[18px] ${saving ? "animate-spin" : ""}`} />
            {saving ? "Recording…" : "Confirm Receipt"}
          </button>
        </div>
      </form>
    </div>
  );
}

export default function ProcurementPage() {
  const [tokens, setTokens] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);
  const [receiveToken, setReceiveToken] = useState(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      const list = await procTokensRepository.list();
      setTokens(Array.isArray(list) ? list : []);
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => { load(); }, [load]);

  const grouped = useMemo(() => {
    const g = { pending: [], approved: [], received: [] };
    tokens.forEach((t) => { (g[t.status] || (g[t.status] = [])).push(t); });
    return g;
  }, [tokens]);

  const handleApprove = async (procId) => {
    setBusyId(procId);
    try { await procTokensRepository.approve(procId); await load(); }
    catch (e) { alert(`Could not approve: ${e.message}`); }
    finally { setBusyId(null); }
  };

  const handleReceiveSubmit = async (payload) => {
    setSaving(true);
    try {
      await procTokensRepository.receive(receiveToken.proc_id, payload);
      setReceiveToken(null);
      await load();
    } catch (e) {
      alert(`Could not record receipt: ${e.message}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <AppShell topBarTitle="Procurement">
      <div data-testid={GRAAMAM_PROCUREMENT.page}>
        <PageHeader title="Procurement" subtitle="Raw-material shortages raised by Production. Approve to purchase, then receive and record cost." />

        {loading ? (
          <div className="py-16 text-center text-on-surface-variant dark:text-outline-variant font-body text-body-md">Loading…</div>
        ) : (
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
                  ) : (grouped[col.key] || []).map((t) => (
                    <TokenCard key={t.proc_id} token={t} busy={busyId === t.proc_id} onApprove={handleApprove} onReceive={setReceiveToken} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      <ReceiveDialog token={receiveToken} onClose={() => setReceiveToken(null)} onSubmit={handleReceiveSubmit} saving={saving} />
    </AppShell>
  );
}
