import React, { useEffect, useState } from "react";
import AppShell from "@/components/graamam/AppShell";
import KPICard from "@/components/graamam/KPICard";
import Icon from "@/components/graamam/Icon";
import { useNavigate } from "react-router-dom";
import { dashboardRepository, batchesRepository, ordersRepository } from "@/lib/firestoreClient";
import { GRAAMAM_WAREHOUSE } from "@/constants/testIds";
import StatusPill from "@/components/graamam/StatusPill";
import { formatOrderDate } from "@/lib/formatters";

export default function WarehousePage() {
  const [summary, setSummary] = useState({});
  const [batches, setBatches] = useState([]);
  const [ordersCounts, setOrdersCounts] = useState({});
  const nav = useNavigate();

  useEffect(() => {
    dashboardRepository.warehouse().then(setSummary).catch(() => {});
    batchesRepository.list().then(setBatches).catch(() => {});
    ordersRepository.counts().then(setOrdersCounts).catch(() => {});
  }, []);

  return (
    <AppShell badges={{ orders: ordersCounts.new || 0 }} topBarTitle="Warehouse Overview">
      <div data-testid={GRAAMAM_WAREHOUSE.page}>
        <div className="flex items-end justify-between mb-8 gap-4 flex-wrap">
          <div>
            <h2 className="font-headline font-bold text-display-lg text-on-surface dark:text-white">Warehouse Overview</h2>
            <p className="text-body-md text-on-surface-variant dark:text-outline-variant mt-1">Bengaluru main godown · Coimbatore hub · Ernakulam depot.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          <div className="rounded-2xl bg-surface-container-lowest dark:bg-[#121212] border border-surface-variant/70 dark:border-white/5 shadow-warm-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-body-md text-on-surface-variant dark:text-outline-variant">Total Finished Goods</p>
                <p className="font-display font-bold text-headline-lg text-on-surface dark:text-white mt-2">{summary.total_finished_goods?.toLocaleString("en-IN") || "1,432"}</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-primary-fixed text-primary-container flex items-center justify-center"><Icon name="inventory_2" className="text-[24px]" /></div>
            </div>
            <div className="mt-4 pt-4 border-t border-surface-variant dark:border-white/10 flex justify-between">
              <div><div className="text-label-sm text-outline uppercase tracking-wider">Warehouse</div><div className="font-bold text-on-surface dark:text-white">{summary.warehouse_units?.toLocaleString("en-IN") || "980"}</div></div>
              <div><div className="text-label-sm text-outline uppercase tracking-wider">Store</div><div className="font-bold text-on-surface dark:text-white">{summary.store_units?.toLocaleString("en-IN") || "452"}</div></div>
            </div>
          </div>
          <div className="rounded-2xl bg-surface-container-lowest dark:bg-[#121212] border border-surface-variant/70 dark:border-white/5 shadow-warm-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-body-md text-on-surface-variant dark:text-outline-variant">Pending QC Checks</p>
                <p className="font-display font-bold text-headline-lg text-on-surface dark:text-white mt-2">{summary.pending_checks || 24}</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-tertiary-fixed-dim text-on-tertiary-fixed flex items-center justify-center"><Icon name="fact_check" className="text-[24px]" /></div>
            </div>
            <div className="mt-4 inline-flex items-center gap-2 bg-tertiary-fixed/60 text-on-tertiary-fixed font-label text-body-sm px-3 py-1 rounded-full"><span className="w-1.5 h-1.5 rounded-full bg-on-tertiary-fixed" /> Action Required</div>
          </div>
          <div className="rounded-2xl bg-surface-container-lowest dark:bg-[#121212] border border-surface-variant/70 dark:border-white/5 shadow-warm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-body-md text-on-surface-variant dark:text-outline-variant">Ready for Dispatch</p>
                <p className="font-display font-bold text-headline-lg text-on-surface dark:text-white mt-2">{summary.ready_for_dispatch || 0}</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-olive-success/15 text-olive-success flex items-center justify-center"><Icon name="local_shipping" className="text-[24px]" /></div>
            </div>
            <button
              data-testid={GRAAMAM_WAREHOUSE.processDispatches}
              onClick={() => nav("/dispatch")}
              className="mt-4 w-full font-label font-bold text-body-md px-4 py-2.5 rounded-lg bg-primary-container text-on-primary hover:shadow-warm shadow-warm-sm inline-flex items-center justify-center gap-2"
            ><Icon name="local_shipping" className="text-[18px]" /> Process Dispatches</button>
          </div>
        </div>

        <h3 className="font-headline font-semibold text-headline-sm text-on-surface dark:text-white mb-4">Latest Batches in Warehouse</h3>
        <div className="bg-surface-container-lowest dark:bg-[#121212] rounded-2xl border border-surface-variant/70 dark:border-white/5 shadow-warm overflow-hidden">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-surface-variant dark:border-white/10 text-outline uppercase text-label-sm tracking-wider">
                <th className="py-4 px-6">Batch</th><th className="py-4 px-6">Product</th><th className="py-4 px-6">Producer</th><th className="py-4 px-6">Qty</th><th className="py-4 px-6">Collected</th><th className="py-4 px-6">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-variant/70 dark:divide-white/5">
              {batches.slice(0, 8).map((b) => (
                <tr key={b.batch_id} className="hover:bg-surface-container-low dark:hover:bg-white/5 transition-colors">
                  <td className="py-4 px-6"><span className="font-mono text-sm bg-surface-container dark:bg-white/5 px-3 py-1 rounded-md border border-outline-variant/30 text-on-surface dark:text-white font-semibold">{b.batch_id}</span></td>
                  <td className="py-4 px-6 font-semibold text-on-surface dark:text-white">{b.product_name}</td>
                  <td className="py-4 px-6 text-on-surface-variant dark:text-outline-variant">{b.producer_name} <span className="text-outline">· {b.village}</span></td>
                  <td className="py-4 px-6 text-on-surface-variant dark:text-outline-variant">{b.quantity} {b.unit}</td>
                  <td className="py-4 px-6 text-on-surface-variant dark:text-outline-variant">{formatOrderDate(b.collection_date)}</td>
                  <td className="py-4 px-6"><StatusPill status={b.status} /></td>
                </tr>
              ))}
              {batches.length === 0 ? (<tr><td colSpan={6} className="py-12 text-center text-outline">No batches in warehouse yet.</td></tr>) : null}
            </tbody>
          </table>
        </div>
      </div>
    </AppShell>
  );
}
