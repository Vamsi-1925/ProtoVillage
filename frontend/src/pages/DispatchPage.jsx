import React, { useEffect, useState } from "react";
import AppShell from "@/components/graamam/AppShell";
import PageHeader from "@/components/graamam/PageHeader";
import Icon from "@/components/graamam/Icon";
import { dispatchRepository, ordersRepository } from "@/lib/firestoreClient";
import { GRAAMAM_DISPATCH } from "@/constants/testIds";
import { formatCurrency, formatTimeAgo, formatOrderDate } from "@/lib/formatters";

const COURIERS = ["Delhivery", "Blue Dart", "DTDC", "Ecom Express", "Shiprocket", "India Post Speed Post", "XpressBees"];

export default function DispatchPage() {
  const [queue, setQueue] = useState([]);
  const [recent, setRecent] = useState([]);
  const [busy, setBusy] = useState(null);
  const [ordersCounts, setOrdersCounts] = useState({});

  const load = async () => {
    const [q, r] = await Promise.all([dispatchRepository.queue(), dispatchRepository.recent(5)]);
    setQueue(q); setRecent(r);
  };
  useEffect(() => { load(); }, []);
  useEffect(() => { ordersRepository.counts().then(setOrdersCounts).catch(() => {}); }, []);

  const dispatchOne = async (o, courier) => {
    setBusy(o.order_id);
    try {
      await dispatchRepository.mark({ order_id: o.order_id, courier, box_count: Math.max(1, Math.round((o.items_count || 1) / 6)) });
      await load();
      try { setOrdersCounts(await ordersRepository.counts()); } catch { /* ignore */ }
    } finally { setBusy(null); }
  };

  return (
    <AppShell badges={{ orders: ordersCounts.received || 0 }} topBarTitle="Dispatch Operations">
      <div data-testid={GRAAMAM_DISPATCH.page}>
        <PageHeader
          title="Dispatch Operations"
          subtitle="Pack, courier, and ship orders across India. Amounts in ₹ INR."
        />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <section className="lg:col-span-2">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-headline font-semibold text-headline-sm text-on-surface dark:text-white">Ready for Dispatch</h3>
              <span className="font-label text-body-sm px-3 py-1 rounded-full bg-tertiary-fixed-dim text-on-tertiary-fixed">{queue.length} Orders Pending</span>
            </div>
            <div className="flex flex-col gap-4">
              {queue.length === 0 ? (
                <div className="rounded-2xl border border-surface-variant/70 dark:border-white/5 bg-surface-container-lowest dark:bg-[#121212] p-6 text-outline text-center">No orders currently in packing.</div>
              ) : queue.map((o) => (
                <article key={o.order_id} data-testid={GRAAMAM_DISPATCH.queueCard(o.order_id)} className="rounded-2xl bg-surface-container-lowest dark:bg-[#121212] border border-surface-variant/70 dark:border-white/5 shadow-warm-sm p-6">
                  <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-label text-outline uppercase tracking-wider">Order #{o.order_id}</span>
                        <span className={`font-label text-label-sm px-2 py-0.5 rounded-md ${o.speed === "express" ? "bg-tertiary-container text-white" : "bg-surface-container dark:bg-white/10 text-on-surface-variant dark:text-outline-variant"}`}>{o.speed === "express" ? "Express" : "Standard"}</span>
                      </div>
                      <h4 className="font-headline font-bold text-headline-sm text-on-surface dark:text-white">{o.customer?.name}</h4>
                      <div className="flex items-center gap-1.5 text-body-sm text-on-surface-variant dark:text-outline-variant mt-1"><Icon name="location_on" className="text-[16px]" /> {o.address}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-on-surface dark:text-white">{o.items_count} items</div>
                      <div className="text-body-sm text-outline">{formatCurrency(o.total)}</div>
                    </div>
                  </div>
                  <div className="bg-surface-container-low dark:bg-white/5 rounded-xl px-4 py-3 flex items-center gap-3">
                    <Icon name="local_shipping" className="text-primary-container dark:text-primary-fixed-dim text-[22px]" />
                    <div className="flex-1 flex items-center gap-2 flex-wrap">
                      <span className="font-label text-body-sm text-on-surface-variant dark:text-outline-variant">Courier:</span>
                      <select id={`courier-${o.order_id}`} defaultValue={"Delhivery"} className="font-body text-body-sm rounded-md bg-surface-container-lowest dark:bg-black border border-outline-variant/70 dark:border-white/10 text-on-surface dark:text-white px-3 py-1.5 focus:outline-none">
                        {COURIERS.map((c) => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                  </div>
                  <div className="mt-4 flex items-center justify-end gap-3">
                    <button className="font-label font-bold text-body-md px-4 py-2 rounded-lg bg-surface-container dark:bg-white/5 border border-outline-variant/70 dark:border-white/10 text-on-surface dark:text-white hover:bg-surface-container-high inline-flex items-center gap-2"><Icon name="print" className="text-[16px]" /> Print Form</button>
                    <button
                      data-testid={GRAAMAM_DISPATCH.markDispatched(o.order_id)}
                      disabled={busy === o.order_id}
                      onClick={() => {
                        const sel = document.getElementById(`courier-${o.order_id}`);
                        dispatchOne(o, sel?.value || "Delhivery");
                      }}
                      className="font-label font-bold text-body-md px-4 py-2 rounded-lg bg-primary-container text-on-primary shadow-warm-sm inline-flex items-center gap-2"
                    >
                      <Icon name={busy === o.order_id ? "progress_activity" : "check_circle"} className={"text-[16px] " + (busy === o.order_id ? "animate-spin" : "")} />
                      {busy === o.order_id ? "Dispatching…" : "Mark Dispatched"}
                    </button>
                  </div>
                </article>
              ))}
            </div>
          </section>

          <aside className="rounded-2xl bg-surface-container-lowest dark:bg-[#121212] border border-surface-variant/70 dark:border-white/5 shadow-warm-sm p-6">
            <h3 className="font-headline font-semibold text-headline-sm text-on-surface dark:text-white mb-4">Recent Dispatches</h3>
            <ul className="flex flex-col gap-4 relative">
              <span className="absolute left-3 top-2 bottom-2 w-px bg-surface-variant dark:bg-white/10" />
              {recent.length === 0 ? <div className="text-outline text-body-sm">No dispatches recorded yet.</div> : recent.map((s) => (
                <li key={s.shipment_id} data-testid={GRAAMAM_DISPATCH.recentCard(s.shipment_id)} className="relative pl-8">
                  <span className="absolute left-0 top-1 w-6 h-6 rounded-full bg-olive-success/15 text-olive-success flex items-center justify-center"><Icon name="done_all" className="text-[16px]" /></span>
                  <div className="flex items-baseline justify-between">
                    <span className="font-label font-bold text-body-md text-on-surface dark:text-white">#{s.order_id}</span>
                    <span className="text-[11px] text-outline">{formatTimeAgo(s.dispatched_at)}</span>
                  </div>
                  <div className="text-body-sm text-on-surface-variant dark:text-outline-variant">{s.customer_name}</div>
                  <div className="text-body-sm text-primary-container dark:text-primary-fixed-dim mt-1 inline-flex items-center gap-1"><Icon name="description" className="text-[14px]" /> View Invoice</div>
                </li>
              ))}
            </ul>
            <button className="mt-6 w-full font-label font-bold text-body-md px-4 py-2.5 rounded-lg bg-surface-container dark:bg-white/5 border border-outline-variant/70 dark:border-white/10 text-on-surface dark:text-white hover:bg-surface-container-high">View Full History</button>
          </aside>
        </div>
      </div>
    </AppShell>
  );
}
