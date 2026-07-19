import React, { useCallback, useEffect, useState } from "react";
import AppShell from "@/components/graamam/AppShell";
import PageHeader from "@/components/graamam/PageHeader";
import Icon from "@/components/graamam/Icon";
import StatusPill from "@/components/graamam/StatusPill";
import { warehouseRepository } from "@/lib/firestoreClient";
import { formatOrderDate, formatQty } from "@/lib/formatters";
import { GRAAMAM_WAREHOUSE } from "@/constants/testIds";

/**
 * WarehousePage — the stock-check gate, functional replica of graamam_v2's
 * pgWarehouse(): every order created at status "warehouse_check" lands
 * here. Per line item we show a ✓/✗ against finished-goods stock; if every
 * line is available the warehouse can mark the order Ready for Dispatch,
 * otherwise it raises a Production token instead.
 */
const OUTCOME_STATUS = {
  ready_for_dispatch: "ready_dispatch",
  production_raised: "production_pending",
};
const OUTCOME_LABEL = {
  ready_for_dispatch: "Ready for Dispatch",
  production_raised: "Production Raised",
};

function TypeBadge({ type }) {
  if (!type) return null;
  const isB2B = type === "b2b";
  return (
    <span className={["inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-label font-bold uppercase tracking-wide",
      isB2B ? "bg-secondary-container text-on-secondary-container" : "bg-tertiary-fixed-dim text-on-tertiary-fixed"].join(" ")}>
      {type.toUpperCase()}
    </span>
  );
}

function AvailabilityRow({ item }) {
  return (
    <div className="flex items-center gap-2 text-body-sm">
      {item.ok ? (
        <Icon name="check_circle" className="text-[16px] text-olive-success shrink-0" />
      ) : (
        <Icon name="cancel" className="text-[16px] text-terracotta-error shrink-0" />
      )}
      <span className="text-on-surface-variant dark:text-outline-variant">
        {item.product} — need {formatQty(item.qty, item.unit)}, {formatQty(item.available)} in stock
      </span>
    </div>
  );
}

function PendingCard({ order, onReady, onRaiseProduction, busy }) {
  return (
    <div data-testid={GRAAMAM_WAREHOUSE.pendingCard(order.order_id)} className="rounded-xl border border-outline-variant/50 dark:border-white/10 bg-surface-container-lowest dark:bg-[#161616] p-5 flex flex-col md:flex-row md:items-start justify-between gap-4">
      <div className="min-w-[260px] flex-1">
        <div className="flex items-center gap-2 flex-wrap mb-1.5">
          <span className="font-mono text-sm bg-surface-container dark:bg-white/10 px-2.5 py-1 rounded-md text-on-surface dark:text-white font-semibold border border-outline-variant/30 dark:border-white/10">
            {order.wh_token || "—"}
          </span>
          <span className="text-outline text-[11px]">linked to</span>
          <span className="font-mono text-sm text-on-surface-variant dark:text-outline-variant">{order.order_id}</span>
          <TypeBadge type={order.order_type} />
        </div>
        <div className="font-label font-bold text-body-md text-on-surface dark:text-white">{order.customer?.name || "Unknown"}</div>
        <div className="mt-2.5 flex flex-col gap-1.5">
          {(order.availability || []).map((it, i) => (
            <AvailabilityRow key={i} item={it} />
          ))}
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        {order.all_available ? (
          <button
            type="button"
            disabled={busy}
            onClick={() => onReady(order.order_id)}
            data-testid={GRAAMAM_WAREHOUSE.readyButton(order.order_id)}
            className="font-label font-bold text-body-sm px-4 py-2.5 rounded-lg bg-olive-success text-white shadow-warm-sm hover:shadow-warm disabled:opacity-60 inline-flex items-center gap-2 transition-all"
          >
            <Icon name="check_circle" className="text-[18px]" /> Mark Ready for Dispatch
          </button>
        ) : (
          <button
            type="button"
            disabled={busy}
            onClick={() => onRaiseProduction(order.order_id)}
            data-testid={GRAAMAM_WAREHOUSE.raiseProdButton(order.order_id)}
            className="font-label font-bold text-body-sm px-4 py-2.5 rounded-lg bg-tertiary-fixed-dim text-on-tertiary-fixed shadow-warm-sm hover:shadow-warm disabled:opacity-60 inline-flex items-center gap-2 transition-all"
          >
            <Icon name="settings" className="text-[18px]" /> Raise Production
          </button>
        )}
      </div>
    </div>
  );
}

export default function WarehousePage() {
  const [pending, setPending] = useState([]);
  const [processed, setProcessed] = useState([]);
  const [finishedGoods, setFinishedGoods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [busyId, setBusyId] = useState(null);
  const [fgOpen, setFgOpen] = useState(false);

  const load = useCallback(async () => {
    setError(null);
    try {
      const [p, d, fg] = await Promise.all([
        warehouseRepository.pending(),
        warehouseRepository.processed(),
        warehouseRepository.finishedGoods(),
      ]);
      setPending(Array.isArray(p) ? p : []);
      setProcessed(Array.isArray(d) ? d : []);
      setFinishedGoods(Array.isArray(fg) ? fg : []);
    } catch (e) {
      setError(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleReady = async (orderId) => {
    setBusyId(orderId);
    try {
      await warehouseRepository.markReady(orderId);
      await load();
    } catch (e) {
      alert(`Could not mark ready: ${e.message}`);
    } finally {
      setBusyId(null);
    }
  };

  const handleRaiseProduction = async (orderId) => {
    setBusyId(orderId);
    try {
      await warehouseRepository.raiseProduction(orderId);
      await load();
    } catch (e) {
      alert(`Could not raise production: ${e.message}`);
    } finally {
      setBusyId(null);
    }
  };

  return (
    <AppShell badges={{ warehouse: pending.length }} topBarTitle="Warehouse">
      <div data-testid={GRAAMAM_WAREHOUSE.page}>
        <PageHeader title="Warehouse" subtitle="Stock is checked automatically — confirm dispatch or raise production." />

        {error ? (
          <div className="mb-6 rounded-xl border border-error/30 bg-error-container/30 px-4 py-3 text-body-sm text-error">
            Could not load warehouse data. {error.message}
          </div>
        ) : null}

        {/* Pending Stock Check */}
        <div data-testid={GRAAMAM_WAREHOUSE.pendingSection} className="rounded-2xl bg-surface-container-lowest dark:bg-[#121212] border border-surface-variant/70 dark:border-white/5 shadow-warm p-6 mb-8">
          <h3 className="font-headline font-semibold text-headline-sm text-on-surface dark:text-white mb-4">
            Pending Stock Check ({pending.length})
          </h3>
          {loading ? (
            <div className="py-10 text-center text-on-surface-variant dark:text-outline-variant font-body text-body-md">Loading…</div>
          ) : pending.length === 0 ? (
            <div data-testid={GRAAMAM_WAREHOUSE.pendingEmpty} className="py-10 text-center text-outline flex flex-col items-center gap-2">
              <Icon name="task_alt" className="text-[28px]" />
              <span className="font-body text-body-md">No warehouse tokens pending</span>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {pending.map((o) => (
                <PendingCard key={o.order_id} order={o} onReady={handleReady} onRaiseProduction={handleRaiseProduction} busy={busyId === o.order_id} />
              ))}
            </div>
          )}
        </div>

        {/* Processed */}
        <div data-testid={GRAAMAM_WAREHOUSE.processedSection} className="rounded-2xl bg-surface-container-lowest dark:bg-[#121212] border border-surface-variant/70 dark:border-white/5 shadow-warm overflow-hidden mb-8">
          <div className="px-6 py-4 border-b border-surface-variant dark:border-white/10">
            <h3 className="font-headline font-semibold text-headline-sm text-on-surface dark:text-white">Processed ({processed.length})</h3>
          </div>
          <table className="w-full text-left">
            <thead>
              <tr className="text-outline uppercase text-label-sm tracking-wider">
                <th className="py-3 px-6">WH Token</th>
                <th className="py-3 px-6">Order Token</th>
                <th className="py-3 px-6">Customer</th>
                <th className="py-3 px-6">Product</th>
                <th className="py-3 px-6">Outcome</th>
                <th className="py-3 px-6">Processed By</th>
                <th className="py-3 px-6">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-variant/70 dark:divide-white/5">
              {processed.length === 0 ? (
                <tr><td colSpan={7} className="py-12 text-center text-outline">No processed tokens yet.</td></tr>
              ) : processed.map((w) => (
                <tr key={w.order_id} data-testid={GRAAMAM_WAREHOUSE.processedRow(w.order_id)}>
                  <td className="py-3 px-6 font-mono text-sm text-on-surface dark:text-white">{w.wh_token || "—"}</td>
                  <td className="py-3 px-6 font-mono text-sm text-on-surface-variant dark:text-outline-variant">{w.order_id}</td>
                  <td className="py-3 px-6 font-semibold text-on-surface dark:text-white">{w.customer?.name || "-"}</td>
                  <td className="py-3 px-6 text-on-surface-variant dark:text-outline-variant">{w.items_summary || "-"}</td>
                  <td className="py-3 px-6"><StatusPill status={OUTCOME_STATUS[w.outcome] || "pending"} /></td>
                  <td className="py-3 px-6 text-on-surface-variant dark:text-outline-variant">{w.processed_by || "-"}</td>
                  <td className="py-3 px-6 text-on-surface-variant dark:text-outline-variant whitespace-nowrap">{formatOrderDate(w.processed_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Finished Goods — collapsible, closed by default */}
        <div className="rounded-2xl bg-surface-container-lowest dark:bg-[#121212] border border-surface-variant/70 dark:border-white/5 shadow-warm-sm overflow-hidden">
          <button
            type="button"
            data-testid={GRAAMAM_WAREHOUSE.finishedGoodsToggle}
            onClick={() => setFgOpen((v) => !v)}
            className="w-full flex items-center justify-between px-6 py-4 text-left hover:bg-surface-container-low dark:hover:bg-white/5 transition-colors"
          >
            <span className="font-label font-bold text-body-md text-on-surface dark:text-white inline-flex items-center gap-2">
              <Icon name="inventory_2" className="text-[18px]" /> Finished Goods
              <span className="text-outline text-body-sm font-normal">({finishedGoods.length})</span>
            </span>
            <Icon name={fgOpen ? "expand_less" : "expand_more"} className="text-[20px] text-outline" />
          </button>
          {fgOpen ? (
            <table className="w-full text-left border-t border-surface-variant dark:border-white/10">
              <thead>
                <tr className="text-outline uppercase text-label-sm tracking-wider">
                  <th className="py-3 px-6">Product</th>
                  <th className="py-3 px-6">Available</th>
                  <th className="py-3 px-6">Unit</th>
                  <th className="py-3 px-6">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-variant/70 dark:divide-white/5">
                {finishedGoods.map((p) => (
                  <tr key={p.product_id} data-testid={GRAAMAM_WAREHOUSE.finishedGoodsRow(p.product_id)}>
                    <td className="py-3 px-6 font-semibold text-on-surface dark:text-white">{p.name}</td>
                    <td className={`py-3 px-6 font-bold ${p.in_stock ? "text-olive-success" : "text-terracotta-error"}`}>{formatQty(p.available)}</td>
                    <td className="py-3 px-6 text-on-surface-variant dark:text-outline-variant">{p.unit}</td>
                    <td className="py-3 px-6">
                      {p.in_stock ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-label-sm font-label bg-olive-success/15 text-olive-success">
                          <span className="w-1.5 h-1.5 rounded-full bg-olive-success" /> In Stock
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-label-sm font-label bg-terracotta-error/15 text-terracotta-error">
                          <span className="w-1.5 h-1.5 rounded-full bg-terracotta-error" /> Out of Stock
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : null}
        </div>
      </div>
    </AppShell>
  );
}
