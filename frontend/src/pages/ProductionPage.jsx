import React, { useEffect, useMemo, useState } from "react";
import AppShell from "@/components/graamam/AppShell";
import PageHeader from "@/components/graamam/PageHeader";
import Icon from "@/components/graamam/Icon";
import StatusPill from "@/components/graamam/StatusPill";
import { productionRepository, ordersRepository } from "@/lib/firestoreClient";
import { GRAAMAM_PRODUCTION } from "@/constants/testIds";
import { formatOrderDate, formatQty } from "@/lib/formatters";

export default function ProductionPage() {
  const [tokens, setTokens] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [busy, setBusy] = useState(false);
  const [ordersCounts, setOrdersCounts] = useState({});

  const load = async () => {
    const list = await productionRepository.list();
    setTokens(list);
    if (!selectedId && list[0]) setSelectedId(list.find((t) => t.status === "active")?.token_id || list[0].token_id);
  };
  useEffect(() => { load(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, []);
  useEffect(() => { ordersRepository.counts().then(setOrdersCounts).catch(() => {}); }, []);

  const selected = useMemo(() => tokens.find((t) => t.token_id === selectedId), [tokens, selectedId]);

  const updateStatus = async (status) => {
    if (!selected) return;
    setBusy(true);
    try {
      const updated = await productionRepository.updateStatus(selected.token_id, status);
      setTokens((prev) => prev.map((t) => (t.token_id === updated.token_id ? updated : t)));
    } finally { setBusy(false); }
  };

  return (
    <AppShell badges={{ orders: ordersCounts.new || 0 }} topBarTitle="Production Management">
      <div data-testid={GRAAMAM_PRODUCTION.page}>
        <PageHeader
          title="Production Management"
          subtitle="Manage active production tokens and raw material requirements."
          actionLabel="Create Slip"
          actionIcon="add"
          actionTestId={GRAAMAM_PRODUCTION.createSlip}
          onAction={() => alert("Create Slip form coming next: pick order + product + due date")}
        />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <aside className="lg:col-span-1 rounded-2xl bg-surface-container-lowest dark:bg-[#121212] border border-surface-variant/70 dark:border-white/5 shadow-warm-sm p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-headline font-semibold text-headline-sm text-on-surface dark:text-white">Active Tokens</h3>
              <span className="text-body-sm bg-secondary-container text-on-secondary-container px-2.5 py-0.5 rounded-full font-label">{tokens.length} Active</span>
            </div>
            <ul className="flex flex-col gap-3">
              {tokens.map((t) => {
                const isSelected = t.token_id === selectedId;
                return (
                  <li key={t.token_id}>
                    <button
                      data-testid={GRAAMAM_PRODUCTION.tokenCard(t.token_id)}
                      onClick={() => setSelectedId(t.token_id)}
                      className={[
                        "w-full text-left rounded-xl p-4 border-2 transition-colors",
                        isSelected ? "border-primary-container bg-primary-fixed/30 dark:bg-white/5" : "border-transparent bg-surface-container-low dark:bg-white/5 hover:border-outline-variant/60",
                      ].join(" ")}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-body-sm font-semibold text-on-surface dark:text-white">{t.token_id}</span>
                        <StatusPill status={t.status} />
                      </div>
                      <div className="mt-2 font-label font-bold text-body-md text-on-surface dark:text-white">{t.product_name} ({formatQty(t.product_qty, t.product_unit)})</div>
                      <div className="text-body-sm text-outline mt-1">Order: {t.order_id || "—"}</div>
                    </button>
                  </li>
                );
              })}
            </ul>
          </aside>

          <section className="lg:col-span-2 rounded-2xl bg-surface-container-lowest dark:bg-[#121212] border border-surface-variant/70 dark:border-white/5 shadow-warm p-6">
            {!selected ? (
              <div className="text-center text-outline py-16">Select a token to view its slip.</div>
            ) : (
              <>
                <div className="flex items-start justify-between gap-4 mb-6">
                  <div>
                    <h3 className="font-headline font-bold text-headline-md text-on-surface dark:text-white">Production Slip: {selected.token_id}</h3>
                    <p className="text-body-md text-on-surface-variant dark:text-outline-variant mt-1">{selected.product_name} ({formatQty(selected.product_qty, selected.product_unit)})</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusPill status={selected.status} />
                    <button className="font-label font-bold text-body-sm px-4 py-2 rounded-lg bg-surface-container dark:bg-white/5 border border-outline-variant/70 dark:border-white/10 text-on-surface dark:text-white hover:bg-surface-container-high"><Icon name="print" className="text-[16px] mr-1" />Print Slip</button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border-y border-surface-variant/70 dark:border-white/10 py-4 mb-6">
                  <div className="flex items-center gap-2 text-body-sm"><Icon name="event" className="text-outline text-[18px]" /> Due: <span className="font-semibold text-on-surface dark:text-white">{formatOrderDate(selected.due_date)}</span></div>
                  <div className="flex items-center gap-2 text-body-sm"><Icon name="receipt_long" className="text-outline text-[18px]" /> Order: <span className="font-semibold text-on-surface dark:text-white">{selected.order_id || "—"}</span></div>
                  <div className="flex items-center gap-2 text-body-sm"><Icon name="group" className="text-outline text-[18px]" /> Producer Group: <span className="font-semibold text-on-surface dark:text-white">{selected.producer_group || "—"}</span></div>
                </div>

                <h4 className="font-headline font-semibold text-headline-sm text-on-surface dark:text-white mb-3">Raw Material Requirements</h4>
                <table className="w-full text-left">
                  <thead>
                    <tr className="text-outline uppercase text-label-sm tracking-wider border-b border-surface-variant/70 dark:border-white/10">
                      <th className="py-3 pr-4">Material</th>
                      <th className="py-3 pr-4">Required</th>
                      <th className="py-3 pr-4">Available</th>
                      <th className="py-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-surface-variant/70 dark:divide-white/10">
                    {(selected.materials || []).map((m, i) => (
                      <tr key={i} className={m.status === "shortage" ? "bg-terracotta-error/10" : ""}>
                        <td className="py-3 pr-4">
                          <div className="flex items-center gap-2">
                            {m.status === "shortage" ? <Icon name="warning" className="text-terracotta-error text-[18px]" /> : null}
                            <span className={`font-semibold ${m.status === "shortage" ? "text-terracotta-error" : "text-on-surface dark:text-white"}`}>{m.name}</span>
                          </div>
                        </td>
                        <td className="py-3 pr-4 text-on-surface-variant dark:text-outline-variant">{m.required} {m.unit}</td>
                        <td className={`py-3 pr-4 font-semibold ${m.status === "shortage" ? "text-terracotta-error" : "text-on-surface dark:text-white"}`}>{m.available} {m.unit}</td>
                        <td className="py-3">
                          <div className="flex items-center gap-3">
                            <StatusPill status={m.status} />
                            {m.status === "shortage" ? <a href="/procurement" className="text-body-sm text-primary-container dark:text-primary-fixed-dim underline">Procure</a> : null}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <div className="mt-8 flex flex-wrap items-center justify-end gap-3 border-t border-surface-variant/70 dark:border-white/10 pt-6">
                  <button data-testid={GRAAMAM_PRODUCTION.cancelButton} onClick={() => updateStatus("cancelled")} disabled={busy} className="font-label font-bold text-body-md px-5 py-2.5 rounded-lg bg-surface-container dark:bg-white/5 text-on-surface dark:text-white border border-outline-variant/70 dark:border-white/10 hover:bg-surface-container-high">Cancel Production</button>
                  {selected.status === "pending" ? (
                    <button data-testid={GRAAMAM_PRODUCTION.startButton} onClick={() => updateStatus("active")} disabled={busy} className="font-label font-bold text-body-md px-6 py-2.5 rounded-lg bg-primary-container text-on-primary hover:shadow-warm shadow-warm-sm inline-flex items-center gap-2"><Icon name="play_arrow" className="text-[18px]" /> Start Production</button>
                  ) : selected.status === "active" ? (
                    <button data-testid={GRAAMAM_PRODUCTION.completeButton} onClick={() => updateStatus("complete")} disabled={busy} className="font-label font-bold text-body-md px-6 py-2.5 rounded-lg bg-olive-success text-white hover:shadow-warm shadow-warm-sm inline-flex items-center gap-2"><Icon name="check_circle" className="text-[18px]" /> Mark Complete</button>
                  ) : null}
                </div>
              </>
            )}
          </section>
        </div>
      </div>
    </AppShell>
  );
}
