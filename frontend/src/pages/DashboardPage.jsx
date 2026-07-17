import React, { useEffect, useState } from "react";
import AppShell from "@/components/graamam/AppShell";
import KPICard from "@/components/graamam/KPICard";
import ActivityFeed from "@/components/graamam/ActivityFeed";
import Icon from "@/components/graamam/Icon";
import StatusPill from "@/components/graamam/StatusPill";
import { dashboardRepository, ordersRepository } from "@/lib/firestoreClient";
import { GRAAMAM_DASHBOARD } from "@/constants/testIds";
import { formatTimeAgo } from "@/lib/formatters";

const OVERVIEW_TABS = [
  { key: "all", label: "All" },
  { key: "in_production", label: "In Production" },
  { key: "qc", label: "QC" },
];

function ProductIcon({ name }) {
  const n = (name || "").toLowerCase();
  if (n.includes("oil")) return "water_drop";
  if (n.includes("honey")) return "local_florist";
  if (n.includes("rice") || n.includes("millet")) return "grain";
  return "eco";
}

export default function DashboardPage() {
  const [kpis, setKpis] = useState({ active_batches: 0, active_producers: 0, engaged_villages: 0, pending_qc: 0 });
  const [alerts, setAlerts] = useState([]);
  const [rows, setRows] = useState([]);
  const [tab, setTab] = useState("all");
  const [activity, setActivity] = useState([]);
  const [ordersCounts, setOrdersCounts] = useState({ new: 0 });

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const [k, a, ac, ov] = await Promise.all([
          dashboardRepository.kpis(),
          dashboardRepository.alerts(),
          dashboardRepository.activity(6),
          dashboardRepository.productionOverview("all"),
        ]);
        if (!mounted) return;
        setKpis(k); setAlerts(a); setActivity(ac); setRows(ov);
        try { setOrdersCounts(await ordersRepository.counts()); } catch { /* ignore */ }
      } catch (e) {
        console.error("dashboard load failed", e);
      }
    })();
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    let mounted = true;
    dashboardRepository.productionOverview(tab).then((d) => mounted && setRows(d)).catch(() => {});
    return () => { mounted = false; };
  }, [tab]);

  return (
    <AppShell badges={{ orders: ordersCounts.received || 0 }}>
      <div data-testid={GRAAMAM_DASHBOARD.page}>
        <div className="flex items-end justify-between mb-8 gap-4 flex-wrap">
          <div>
            <h2 className="font-headline font-bold text-display-lg text-on-surface dark:text-white tracking-tight">Dashboard</h2>
            <p className="text-body-md text-on-surface-variant dark:text-outline-variant mt-1">Namaste, Aditi. Here’s what’s moving through Graamam today.</p>
          </div>
          <div className="flex items-center gap-3 rounded-full bg-surface-container-lowest dark:bg-white/5 border border-outline-variant/70 dark:border-white/10 px-3 py-1.5 pr-4">
            <img alt="Aditi" className="w-9 h-9 rounded-full object-cover" src="https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=100&h=100&fit=crop&crop=faces" />
            <div className="leading-tight">
              <div className="font-label font-bold text-body-sm text-on-surface dark:text-white">Aditi R.</div>
              <div className="text-[11px] text-outline">Coordinator · Bengaluru HQ</div>
            </div>
          </div>
        </div>

        {alerts.map((a, i) => (
          <div
            key={i}
            data-testid={GRAAMAM_DASHBOARD.weatherAdvisory}
            className="mb-8 rounded-2xl border border-olive-success/30 bg-olive-success/10 dark:bg-olive-success/15 p-4 flex items-start gap-3"
          >
            <Icon name="info" className="text-olive-success text-[22px] mt-0.5" />
            <div>
              <div className="font-label font-bold text-body-md text-on-surface dark:text-white">{a.title}</div>
              <p className="text-body-sm text-on-surface-variant dark:text-outline-variant mt-1 max-w-4xl">{a.body}</p>
            </div>
          </div>
        ))}

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5 mb-10">
          <KPICard icon="track_changes" accent="primary" testId={GRAAMAM_DASHBOARD.kpiCard("active_batches")} label="Active Batches" value={kpis.active_batches} trend="12%" trendPositive hint="Across all producer villages" />
          <KPICard icon="group" accent="secondary" testId={GRAAMAM_DASHBOARD.kpiCard("active_producers")} label="Active Producers" value={kpis.active_producers} hint="Verified & onboarded" />
          <KPICard icon="apartment" accent="tertiary" testId={GRAAMAM_DASHBOARD.kpiCard("engaged_villages")} label="Engaged Villages" value={kpis.engaged_villages} hint="Karnataka, Kerala, Odisha…" />
          <KPICard icon="fact_check" accent="success" testId={GRAAMAM_DASHBOARD.kpiCard("pending_qc")} label="Pending QC" value={kpis.pending_qc} hint="Awaiting quality checks" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <section className="lg:col-span-2" data-testid={GRAAMAM_DASHBOARD.productionOverview}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-headline font-semibold text-headline-sm text-on-surface dark:text-white">Production Overview</h3>
              <div className="inline-flex items-center gap-1 rounded-full bg-surface-container-lowest dark:bg-white/5 p-1 border border-outline-variant/60 dark:border-white/10">
                {OVERVIEW_TABS.map((t) => (
                  <button
                    key={t.key}
                    type="button"
                    data-testid={GRAAMAM_DASHBOARD.overviewTab(t.key)}
                    onClick={() => setTab(t.key)}
                    className={[
                      "px-4 py-1.5 text-body-sm font-label font-bold rounded-full transition-colors",
                      tab === t.key ? "bg-primary-container text-on-primary" : "text-on-surface-variant dark:text-outline-variant hover:text-primary",
                    ].join(" ")}
                  >{t.label}</button>
                ))}
              </div>
            </div>
            <div className="bg-surface-container-lowest dark:bg-[#121212] rounded-2xl border border-surface-variant/70 dark:border-white/5 shadow-warm-sm overflow-hidden">
              <table className="w-full text-left">
                <thead>
                  <tr className="text-outline uppercase text-label-sm tracking-wider">
                    <th className="py-4 px-6">Batch ID</th>
                    <th className="py-4 px-6">Product</th>
                    <th className="py-4 px-6">Quantity</th>
                    <th className="py-4 px-6">Status</th>
                    <th className="py-4 px-6">Updated</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-variant/70 dark:divide-white/5">
                  {rows.length === 0 ? (
                    <tr><td colSpan={5} className="py-10 text-center text-outline">No batches yet</td></tr>
                  ) : rows.map((b) => (
                    <tr key={b.batch_id} className="hover:bg-surface-container-low dark:hover:bg-white/5 transition-colors">
                      <td className="py-3 px-6"><span className="font-mono text-sm bg-surface-container dark:bg-white/5 px-3 py-1 rounded-md border border-outline-variant/30 text-on-surface dark:text-white font-semibold">{b.batch_id}</span></td>
                      <td className="py-3 px-6">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-surface-variant dark:bg-white/10 flex items-center justify-center text-primary-container dark:text-primary-fixed-dim">
                            <Icon name={ProductIcon({ name: b.product_name })} className="text-[18px]" />
                          </div>
                          <span className="font-semibold text-on-surface dark:text-white">{b.product_name}</span>
                        </div>
                      </td>
                      <td className="py-3 px-6 text-on-surface-variant dark:text-outline-variant">{b.quantity} {b.unit}</td>
                      <td className="py-3 px-6"><StatusPill status={b.status} /></td>
                      <td className="py-3 px-6 text-on-surface-variant dark:text-outline-variant">{formatTimeAgo(b.created_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="px-6 py-3 border-t border-surface-variant/70 dark:border-white/5 text-right">
                <a href="/production" className="font-label text-body-sm text-primary-container dark:text-primary-fixed-dim hover:underline">View all batches →</a>
              </div>
            </div>
          </section>

          <section data-testid={GRAAMAM_DASHBOARD.activityFeed}>
            <ActivityFeed items={activity} />
          </section>
        </div>
      </div>
    </AppShell>
  );
}
