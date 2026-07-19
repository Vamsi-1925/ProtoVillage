import React, { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import AppShell from "@/components/graamam/AppShell";
import PageHeader from "@/components/graamam/PageHeader";
import Icon from "@/components/graamam/Icon";
import { dispatchRepository } from "@/lib/firestoreClient";
import { useAuth } from "@/context/AuthContext";
import { formatOrderDate, formatQty } from "@/lib/formatters";
import { GRAAMAM_DISPATCH } from "@/constants/testIds";

/**
 * DispatchPage — v2 parity (pgDispatch / dispatchOrder): orders confirmed
 * by the Warehouse stock-check (status ready_dispatch) land here. "Dispatch
 * Order" re-verifies finished stock, deducts it, flips the order to
 * dispatched, and auto-generates the tax invoice — there's no manual
 * "Raise Invoice" step. "Dispatch Form" prints the A5 shipping label.
 */
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

function ItemStockRow({ item }) {
  return (
    <div className="text-body-sm text-on-surface-variant dark:text-outline-variant">
      {item.product} × {formatQty(item.qty, item.unit)}{" "}
      <span className={item.ok ? "text-olive-success" : "text-terracotta-error"}>
        (stock {formatQty(item.available)})
      </span>
    </div>
  );
}

function QueueCard({ order, onPrintForm, onDispatch, busy }) {
  return (
    <article data-testid={GRAAMAM_DISPATCH.queueCard(order.order_id)} className="rounded-2xl bg-surface-container-lowest dark:bg-[#121212] border border-surface-variant/70 dark:border-white/5 shadow-warm-sm p-6">
      <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="font-mono text-sm bg-surface-container dark:bg-white/10 px-2.5 py-1 rounded-md text-on-surface dark:text-white font-semibold border border-outline-variant/30 dark:border-white/10">
              {order.order_id}
            </span>
            <TypeBadge type={order.order_type} />
          </div>
          <h4 className="font-headline font-bold text-headline-sm text-on-surface dark:text-white">{order.customer?.name}</h4>
          <div className="mt-1.5 flex flex-col gap-0.5">
            {(order.items || []).map((it, i) => <ItemStockRow key={i} item={it} />)}
          </div>
        </div>
      </div>
      <div className="mt-4 flex items-center justify-end gap-3">
        <button
          type="button"
          data-testid={GRAAMAM_DISPATCH.dispatchFormButton(order.order_id)}
          onClick={() => onPrintForm(order.order_id)}
          className="font-label font-bold text-body-md px-4 py-2 rounded-lg bg-surface-container dark:bg-white/5 border border-outline-variant/70 dark:border-white/10 text-on-surface dark:text-white hover:bg-surface-container-high inline-flex items-center gap-2"
        >
          <Icon name="print" className="text-[16px]" /> Dispatch Form
        </button>
        <button
          type="button"
          data-testid={GRAAMAM_DISPATCH.dispatchOrderButton(order.order_id)}
          disabled={busy}
          onClick={() => onDispatch(order.order_id)}
          className="font-label font-bold text-body-md px-4 py-2 rounded-lg bg-primary-container text-on-primary shadow-warm-sm inline-flex items-center gap-2 disabled:opacity-60"
        >
          <Icon name={busy ? "progress_activity" : "local_shipping"} className={"text-[16px] " + (busy ? "animate-spin" : "")} />
          {busy ? "Dispatching…" : "Dispatch Order"}
        </button>
      </div>
    </article>
  );
}

export default function DispatchPage() {
  const [queue, setQueue] = useState([]);
  const [dispatched, setDispatched] = useState([]);
  const [busyId, setBusyId] = useState(null);
  const [loading, setLoading] = useState(true);
  const nav = useNavigate();
  const { user } = useAuth();

  const load = useCallback(async () => {
    try {
      const [q, d] = await Promise.all([dispatchRepository.queue(), dispatchRepository.dispatched()]);
      setQueue(Array.isArray(q) ? q : []);
      setDispatched(Array.isArray(d) ? d : []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handlePrintForm = (orderId) => nav(`/dispatch-form/${orderId}`);
  const handlePrintInvoice = (invoiceId) => invoiceId && nav(`/invoice/${invoiceId}`);

  const handleDispatch = async (orderId) => {
    setBusyId(orderId);
    try {
      await dispatchRepository.dispatchOrder(orderId, user?.name || "Dispatch Team");
      await load();
    } catch (e) {
      alert(`Could not dispatch order: ${e.message}`);
    } finally {
      setBusyId(null);
    }
  };

  return (
    <AppShell topBarTitle="Dispatch">
      <div data-testid={GRAAMAM_DISPATCH.page}>
        <PageHeader title="Dispatch" subtitle="Orders confirmed ready — dispatch to customer. Amounts in ₹ INR." />

        <div data-testid={GRAAMAM_DISPATCH.queueSection} className="rounded-2xl bg-surface-container-lowest dark:bg-[#121212] border border-surface-variant/70 dark:border-white/5 shadow-warm p-6 mb-8">
          <h3 className="font-headline font-semibold text-headline-sm text-on-surface dark:text-white mb-4">
            Ready for Dispatch ({queue.length})
          </h3>
          {loading ? (
            <div className="py-10 text-center text-on-surface-variant dark:text-outline-variant font-body text-body-md">Loading…</div>
          ) : queue.length === 0 ? (
            <div data-testid={GRAAMAM_DISPATCH.queueEmpty} className="py-10 text-center text-outline flex flex-col items-center gap-2">
              <Icon name="local_shipping" className="text-[28px]" />
              <span className="font-body text-body-md">Nothing waiting. Orders appear here once the warehouse confirms stock.</span>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {queue.map((o) => (
                <QueueCard key={o.order_id} order={o} onPrintForm={handlePrintForm} onDispatch={handleDispatch} busy={busyId === o.order_id} />
              ))}
            </div>
          )}
        </div>

        <div data-testid={GRAAMAM_DISPATCH.dispatchedSection} className="rounded-2xl bg-surface-container-lowest dark:bg-[#121212] border border-surface-variant/70 dark:border-white/5 shadow-warm overflow-hidden">
          <div className="px-6 py-4 border-b border-surface-variant dark:border-white/10">
            <h3 className="font-headline font-semibold text-headline-sm text-on-surface dark:text-white">Dispatched ({dispatched.length})</h3>
          </div>
          <table className="w-full text-left">
            <thead>
              <tr className="text-outline uppercase text-label-sm tracking-wider">
                <th className="py-3 px-6">Order</th>
                <th className="py-3 px-6">Customer</th>
                <th className="py-3 px-6">Items</th>
                <th className="py-3 px-6">Qty</th>
                <th className="py-3 px-6">Invoice #</th>
                <th className="py-3 px-6">Dispatched By</th>
                <th className="py-3 px-6">Date</th>
                <th className="py-3 px-6 text-right">Documents</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-variant/70 dark:divide-white/5">
              {dispatched.length === 0 ? (
                <tr><td colSpan={8} className="py-12 text-center text-outline">No dispatched orders yet</td></tr>
              ) : dispatched.map((o) => (
                <tr key={o.order_id} data-testid={GRAAMAM_DISPATCH.dispatchedRow(o.order_id)}>
                  <td className="py-3 px-6 font-mono text-sm text-on-surface dark:text-white">{o.order_id}</td>
                  <td className="py-3 px-6 font-semibold text-on-surface dark:text-white">{o.customer?.name || "-"}</td>
                  <td className="py-3 px-6 text-on-surface-variant dark:text-outline-variant">{o.items_summary || "-"}</td>
                  <td className="py-3 px-6 text-on-surface-variant dark:text-outline-variant">{formatQty(o.items_count)}</td>
                  <td className="py-3 px-6 font-mono text-sm text-on-surface-variant dark:text-outline-variant">{o.invoice_id || "-"}</td>
                  <td className="py-3 px-6 text-on-surface-variant dark:text-outline-variant">{o.dispatched_by || "-"}</td>
                  <td className="py-3 px-6 text-on-surface-variant dark:text-outline-variant whitespace-nowrap">{formatOrderDate(o.dispatched_at)}</td>
                  <td className="py-3 px-6 text-right whitespace-nowrap">
                    {o.invoice_id ? (
                      <button
                        type="button"
                        data-testid={GRAAMAM_DISPATCH.printInvoiceButton(o.order_id)}
                        onClick={() => handlePrintInvoice(o.invoice_id)}
                        className="font-label font-bold text-[12px] px-2.5 py-1.5 rounded-lg text-primary-container dark:text-primary-fixed-dim hover:bg-primary-fixed/40 dark:hover:bg-white/10 transition-colors inline-flex items-center gap-1"
                      >
                        <Icon name="receipt_long" className="text-[15px]" /> Invoice
                      </button>
                    ) : null}
                    <button
                      type="button"
                      data-testid={GRAAMAM_DISPATCH.printFormButton(o.order_id)}
                      onClick={() => handlePrintForm(o.order_id)}
                      className="font-label font-bold text-[12px] px-2.5 py-1.5 rounded-lg text-on-surface-variant dark:text-outline-variant hover:bg-surface-container dark:hover:bg-white/10 transition-colors inline-flex items-center gap-1 ml-1"
                    >
                      <Icon name="print" className="text-[15px]" /> Form
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AppShell>
  );
}
