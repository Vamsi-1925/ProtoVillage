import React, { useEffect, useState } from "react";
import AppShell from "@/components/graamam/AppShell";
import KPICard from "@/components/graamam/KPICard";
import ActivityFeed from "@/components/graamam/ActivityFeed";
import StatusPill from "@/components/graamam/StatusPill";
import { dashboardRepository, ordersRepository } from "@/lib/firestoreClient";
import { useAuth } from "@/context/AuthContext";
import { GRAAMAM_DASHBOARD } from "@/constants/testIds";
import { formatOrderDate } from "@/lib/formatters";

/**
 * DashboardPage — graamam_v2 pgDashboard parity: greets the actual logged
 * in user, six live KPIs computed from orders + inventory, Recent Orders,
 * and Recent Activity from the append-only audit log. No hardcoded
 * numbers, no producer/village content, no weather advisory.
 */
function activityIcon(action = "") {
  const a = action.toLowerCase();
  if (a.includes("cancel")) return "cancel";
  if (a.includes("dispatch")) return "local_shipping";
  if (a.includes("invoice")) return "receipt_long";
  if (a.includes("production") && a.includes("complete")) return "check_circle";
  if (a.includes("production")) return "settings";
  if (a.includes("procurement")) return "shopping_cart";
  if (a.includes("ready for dispatch")) return "task_alt";
  if (a.includes("order") && a.includes("created")) return "add_box";
  if (a.includes("edited") || a.includes("updated")) return "edit";
  return "info";
}

function activityAccent(action = "") {
  const a = action.toLowerCase();
  if (a.includes("cancel") || a.includes("shortage") || a.includes("insufficient")) return "tertiary";
  if (a.includes("complete") || a.includes("dispatch") || a.includes("received")) return "success";
  return "primary";
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [kpis, setKpis] = useState({ total_orders: 0, open_orders: 0, in_production: 0, pending_procurement: 0, dispatched: 0, low_stock_items: 0 });
  const [recentOrders, setRecentOrders] = useState([]);
  const [activity, setActivity] = useState([]);
  const [ordersCounts, setOrdersCounts] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const [k, ro, ac] = await Promise.all([
          dashboardRepository.kpis(),
          dashboardRepository.recentOrders(6),
          dashboardRepository.activity(10),
        ]);
        if (!mounted) return;
        setKpis(k);
        setRecentOrders(Array.isArray(ro) ? ro : []);
        setActivity((Array.isArray(ac) ? ac : []).map((a) => ({
          icon: activityIcon(a.action), accent: activityAccent(a.action),
          headline: a.action, details: a.order_id ? `Order ${a.order_id}` : null,
          when: a.ts,
        })));
        try { setOrdersCounts(await ordersRepository.counts()); } catch { /* ignore */ }
      } catch (e) {
        console.error("dashboard load failed", e);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  return (
    <AppShell badges={{ orders: ordersCounts.received || 0 }}>
      <div data-testid={GRAAMAM_DASHBOARD.page}>
        <div className="flex items-end justify-between mb-8 gap-4 flex-wrap">
          <div>
            <h2 data-testid={GRAAMAM_DASHBOARD.greeting} className="font-headline font-bold text-display-lg text-on-surface dark:text-white tracking-tight">
              Welcome back, {user?.name || "there"}
            </h2>
            <p className="text-body-md text-on-surface-variant dark:text-outline-variant mt-1">{"Here's what's moving through Graamam today."}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6 gap-5 mb-10">
          <KPICard icon="receipt_long" accent="primary" testId={GRAAMAM_DASHBOARD.kpiCard("total_orders")} label="Total Orders" value={loading ? "…" : kpis.total_orders} hint="All time" />
          <KPICard icon="pending_actions" accent="secondary" testId={GRAAMAM_DASHBOARD.kpiCard("open_orders")} label="Open Orders" value={loading ? "…" : kpis.open_orders} hint="Not dispatched/closed/cancelled" />
          <KPICard icon="settings" accent="tertiary" testId={GRAAMAM_DASHBOARD.kpiCard("in_production")} label="In Production" value={loading ? "…" : kpis.in_production} hint="Active + pending" />
          <KPICard icon="shopping_cart" accent="tertiary" testId={GRAAMAM_DASHBOARD.kpiCard("pending_procurement")} label="Pending Procurement" value={loading ? "…" : kpis.pending_procurement} hint="Awaiting purchase/receipt" />
          <KPICard icon="local_shipping" accent="success" testId={GRAAMAM_DASHBOARD.kpiCard("dispatched")} label="Dispatched" value={loading ? "…" : kpis.dispatched} hint="Delivered to customer" />
          <KPICard icon="warning" accent="secondary" testId={GRAAMAM_DASHBOARD.kpiCard("low_stock_items")} label="Low Stock Items" value={loading ? "…" : kpis.low_stock_items} hint="Raw materials at/below min" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <section className="lg:col-span-2" data-testid={GRAAMAM_DASHBOARD.recentOrders}>
            <h3 className="font-headline font-semibold text-headline-sm text-on-surface dark:text-white mb-4">Recent Orders</h3>
            <div className="bg-surface-container-lowest dark:bg-[#121212] rounded-2xl border border-surface-variant/70 dark:border-white/5 shadow-warm-sm overflow-hidden">
              <table className="w-full text-left">
                <thead>
                  <tr className="text-outline uppercase text-label-sm tracking-wider">
                    <th className="py-4 px-6">Order</th>
                    <th className="py-4 px-6">Customer</th>
                    <th className="py-4 px-6">Items</th>
                    <th className="py-4 px-6">Status</th>
                    <th className="py-4 px-6">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-variant/70 dark:divide-white/5">
                  {recentOrders.length === 0 ? (
                    <tr><td colSpan={5} className="py-10 text-center text-outline">No orders yet</td></tr>
                  ) : recentOrders.map((o) => (
                    <tr key={o.order_id} data-testid={GRAAMAM_DASHBOARD.recentOrderRow(o.order_id)} className="hover:bg-surface-container-low dark:hover:bg-white/5 transition-colors">
                      <td className="py-3 px-6"><span className="font-mono text-sm bg-surface-container dark:bg-white/5 px-3 py-1 rounded-md border border-outline-variant/30 text-on-surface dark:text-white font-semibold">{o.order_id}</span></td>
                      <td className="py-3 px-6 font-semibold text-on-surface dark:text-white">{o.customer?.name || "-"}</td>
                      <td className="py-3 px-6 text-on-surface-variant dark:text-outline-variant">{o.items_summary}</td>
                      <td className="py-3 px-6"><StatusPill status={o.status} /></td>
                      <td className="py-3 px-6 text-on-surface-variant dark:text-outline-variant whitespace-nowrap">{formatOrderDate(o.date)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="px-6 py-3 border-t border-surface-variant/70 dark:border-white/5 text-right">
                <a href="/orders" className="font-label text-body-sm text-primary-container dark:text-primary-fixed-dim hover:underline">View all orders →</a>
              </div>
            </div>
          </section>

          <section data-testid={GRAAMAM_DASHBOARD.activityFeed}>
            <ActivityFeed items={activity} loading={loading} />
          </section>
        </div>
      </div>
    </AppShell>
  );
}
