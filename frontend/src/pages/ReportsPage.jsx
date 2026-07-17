import React, { useEffect, useState } from "react";
import AppShell from "@/components/graamam/AppShell";
import PageHeader from "@/components/graamam/PageHeader";
import Icon from "@/components/graamam/Icon";
import StatusPill from "@/components/graamam/StatusPill";
import { reportsRepository, ordersRepository } from "@/lib/firestoreClient";
import { GRAAMAM_REPORTS } from "@/constants/testIds";
import { formatCurrency, formatOrderDate } from "@/lib/formatters";

const REPORT_TYPES = [
  { key: "orders", label: "Orders" },
  { key: "inventory", label: "Inventory" },
  { key: "producers", label: "Producers" },
  { key: "sales", label: "Store Sales" },
];

const RANGES = [
  { key: "7", label: "Last 7 Days" },
  { key: "30", label: "Last 30 Days" },
  { key: "90", label: "Last 90 Days" },
  { key: "custom", label: "Custom Range" },
];

function daysAgo(n) {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - n);
  return d.toISOString().slice(0, 10);
}

export default function ReportsPage() {
  const [type, setType] = useState("orders");
  const [range, setRange] = useState("30");
  const [start, setStart] = useState(daysAgo(30));
  const [end, setEnd] = useState(daysAgo(0));
  const [data, setData] = useState({ rows: [] });
  const [loading, setLoading] = useState(false);
  const [ordersCounts, setOrdersCounts] = useState({});

  useEffect(() => { ordersRepository.counts().then(setOrdersCounts).catch(() => {}); }, []);
  useEffect(() => {
    if (range !== "custom") {
      const n = Number(range);
      setStart(daysAgo(n));
      setEnd(daysAgo(0));
    }
  }, [range]);

  const generate = async () => {
    setLoading(true);
    try {
      let res;
      if (type === "orders") res = await reportsRepository.orders({ start, end });
      else if (type === "inventory") res = await reportsRepository.inventory();
      else if (type === "producers") res = await reportsRepository.producers();
      else res = await reportsRepository.sales({ start, end });
      setData(res || { rows: [] });
    } finally { setLoading(false); }
  };
  useEffect(() => { generate(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [type, start, end]);

  const exportCsv = () => {
    const rows = data.rows || [];
    if (!rows.length) return;
    const headers = Object.keys(rows[0]);
    const csv = [headers.join(","), ...rows.map((r) => headers.map((h) => JSON.stringify(r[h] ?? "")).join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `graamam-${type}-${start}-${end}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <AppShell badges={{ orders: ordersCounts.new || 0 }} topBarTitle="Reports & Analytics">
      <div data-testid={GRAAMAM_REPORTS.page}>
        <PageHeader
          title="Operational Reports"
          subtitle="Slice orders, inventory, producers and store sales by date range. All values in ₹ INR / IST."
        />

        <div className="rounded-2xl bg-surface-container-lowest dark:bg-[#121212] border border-surface-variant/70 dark:border-white/5 shadow-warm-sm p-6 mb-8">
          <div className="flex items-center gap-2 mb-6">
            <Icon name="tune" className="text-outline text-[22px]" />
            <h3 className="font-headline font-semibold text-headline-sm text-on-surface dark:text-white">Report Builder</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <label className="flex flex-col gap-1">
              <span className="font-label text-label-sm text-on-surface dark:text-outline-variant uppercase tracking-wider">Report Type</span>
              <select data-testid={GRAAMAM_REPORTS.reportType} value={type} onChange={(e) => setType(e.target.value)} className="font-body text-body-md rounded-lg border border-outline-variant/70 dark:border-white/10 bg-white dark:bg-black text-on-surface dark:text-white px-4 py-2.5">
                {REPORT_TYPES.map((r) => <option key={r.key} value={r.key}>{r.label}</option>)}
              </select>
            </label>
            <label className="flex flex-col gap-1">
              <span className="font-label text-label-sm text-on-surface dark:text-outline-variant uppercase tracking-wider">Quick Range</span>
              <select data-testid={GRAAMAM_REPORTS.quickRange} value={range} onChange={(e) => setRange(e.target.value)} className="font-body text-body-md rounded-lg border border-outline-variant/70 dark:border-white/10 bg-white dark:bg-black text-on-surface dark:text-white px-4 py-2.5">
                {RANGES.map((r) => <option key={r.key} value={r.key}>{r.label}</option>)}
              </select>
            </label>
            <label className="flex flex-col gap-1">
              <span className="font-label text-label-sm text-on-surface dark:text-outline-variant uppercase tracking-wider">Start Date</span>
              <input type="date" value={start} onChange={(e) => { setRange("custom"); setStart(e.target.value); }} data-testid={GRAAMAM_REPORTS.start} className="font-body text-body-md rounded-lg border border-outline-variant/70 dark:border-white/10 bg-white dark:bg-black text-on-surface dark:text-white px-4 py-2.5" />
            </label>
            <label className="flex flex-col gap-1">
              <span className="font-label text-label-sm text-on-surface dark:text-outline-variant uppercase tracking-wider">End Date</span>
              <input type="date" value={end} onChange={(e) => { setRange("custom"); setEnd(e.target.value); }} data-testid={GRAAMAM_REPORTS.end} className="font-body text-body-md rounded-lg border border-outline-variant/70 dark:border-white/10 bg-white dark:bg-black text-on-surface dark:text-white px-4 py-2.5" />
            </label>
          </div>
          <div className="mt-6 flex items-center justify-end gap-3">
            <button data-testid={GRAAMAM_REPORTS.generate} onClick={generate} className="font-label font-bold text-body-md px-6 py-2.5 rounded-lg bg-primary-container text-on-primary shadow-warm-sm inline-flex items-center gap-2"><Icon name="bolt" className="text-[18px]" /> Generate Report</button>
          </div>
        </div>

        <div className="rounded-2xl bg-surface-container-lowest dark:bg-[#121212] border border-surface-variant/70 dark:border-white/5 shadow-warm overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-surface-variant dark:border-white/10">
            <div>
              <h3 className="font-headline font-semibold text-headline-sm text-on-surface dark:text-white">{REPORT_TYPES.find((r) => r.key === type)?.label} Report</h3>
              <p className="text-body-sm text-outline">{formatOrderDate(start)} — {formatOrderDate(end)}</p>
            </div>
            <div className="flex items-center gap-2">
              <button data-testid={GRAAMAM_REPORTS.exportCsv} onClick={exportCsv} className="font-label font-bold text-body-sm px-4 py-2 rounded-lg bg-surface-container dark:bg-white/5 border border-outline-variant/70 dark:border-white/10 text-on-surface dark:text-white inline-flex items-center gap-2"><Icon name="download" className="text-[16px]" /> CSV</button>
              <button data-testid={GRAAMAM_REPORTS.exportPdf} onClick={() => window.print()} className="font-label font-bold text-body-sm px-4 py-2 rounded-lg bg-surface-container dark:bg-white/5 border border-outline-variant/70 dark:border-white/10 text-on-surface dark:text-white inline-flex items-center gap-2"><Icon name="picture_as_pdf" className="text-[16px]" /> PDF</button>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="text-outline uppercase text-label-sm tracking-wider">
                  {(type === "orders" ? [
                    "Order ID", "Date", "Producer/Customer", "Items", "Total", "Status",
                  ] : type === "inventory" ? [
                    "SKU", "Name", "Category", "Qty on Hand", "Reorder", "Unit Price", "Stock Value",
                  ] : type === "producers" ? [
                    "Producer ID", "Name", "Village", "State", "Active Batches", "Quality", "Status",
                  ] : [
                    "Sale ID", "Product", "Qty", "Customer", "Total", "When",
                  ]).map((h) => <th key={h} className="py-4 px-6">{h}</th>)}
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-variant/70 dark:divide-white/5">
                {loading ? <tr><td colSpan={8} className="py-16 text-center text-outline">Generating report…</td></tr>
                : !(data.rows || []).length ? <tr><td colSpan={8} className="py-16 text-center text-outline">No data for this range.</td></tr>
                : type === "orders" ? data.rows.map((r) => (
                  <tr key={r.order_id}><td className="py-3 px-6 font-mono">#{r.order_id}</td><td className="py-3 px-6">{formatOrderDate(r.date)}</td><td className="py-3 px-6">{r.producer}</td><td className="py-3 px-6">{r.items}</td><td className="py-3 px-6 font-bold">{formatCurrency(r.total_inr)}</td><td className="py-3 px-6"><StatusPill status={r.status} /></td></tr>
                )) : type === "inventory" ? data.rows.map((r) => (
                  <tr key={r.sku}><td className="py-3 px-6 font-mono">{r.sku}</td><td className="py-3 px-6">{r.name}</td><td className="py-3 px-6">{r.category}</td><td className="py-3 px-6">{r.qty_on_hand}</td><td className="py-3 px-6">{r.reorder_level}</td><td className="py-3 px-6">{formatCurrency(r.unit_price_inr)}</td><td className="py-3 px-6 font-bold">{formatCurrency(r.stock_value_inr)}</td></tr>
                )) : type === "producers" ? data.rows.map((r) => (
                  <tr key={r.producer_id}><td className="py-3 px-6 font-mono">{r.producer_id}</td><td className="py-3 px-6 font-semibold">{r.name}</td><td className="py-3 px-6">{r.village}</td><td className="py-3 px-6">{r.state}</td><td className="py-3 px-6">{r.active_batches}</td><td className="py-3 px-6 font-bold">{Number(r.quality_score).toFixed(1)}</td><td className="py-3 px-6"><StatusPill status={r.status} /></td></tr>
                )) : data.rows.map((r) => (
                  <tr key={r.sale_id}><td className="py-3 px-6 font-mono">{r.sale_id}</td><td className="py-3 px-6">{r.name}</td><td className="py-3 px-6">{r.qty}</td><td className="py-3 px-6">{r.customer_name}</td><td className="py-3 px-6 font-bold">{formatCurrency(r.total_inr)}</td><td className="py-3 px-6 text-outline">{formatOrderDate(r.sold_at)}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="px-6 py-3 border-t border-surface-variant dark:border-white/10 text-body-sm text-on-surface-variant dark:text-outline-variant flex justify-between">
            <span>Showing {data.rows?.length || 0} entries</span>
            {type === "orders" ? <span className="font-bold">Total value: {formatCurrency(data.total_value_inr || 0)}</span>
              : type === "sales" ? <span className="font-bold">Total revenue: {formatCurrency(data.total_revenue_inr || 0)}</span>
              : null}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
