import React, { useEffect, useState } from "react";
import AppShell from "@/components/graamam/AppShell";
import PageHeader from "@/components/graamam/PageHeader";
import Icon from "@/components/graamam/Icon";
import SlideOver from "@/components/graamam/SlideOver";
import { storeRepository, ordersRepository } from "@/lib/firestoreClient";
import { GRAAMAM_STORE } from "@/constants/testIds";
import { formatCurrency, formatOrderDate, formatDateTimeIST } from "@/lib/formatters";

export default function StorePage() {
  const [stock, setStock] = useState([]);
  const [sales, setSales] = useState([]);
  const [summary, setSummary] = useState({});
  const [saleFor, setSaleFor] = useState(null);
  const [saving, setSaving] = useState(false);
  const [ordersCounts, setOrdersCounts] = useState({});

  const load = async () => {
    const [s, sa, sm] = await Promise.all([storeRepository.list(), storeRepository.sales(6), storeRepository.summary()]);
    setStock(s); setSales(sa); setSummary(sm);
  };
  useEffect(() => { load(); }, []);
  useEffect(() => { ordersRepository.counts().then(setOrdersCounts).catch(() => {}); }, []);

  return (
    <AppShell badges={{ orders: ordersCounts.received || 0 }} topBarTitle="Experience Store">
      <div data-testid={GRAAMAM_STORE.page}>
        <PageHeader
          title="Store Overview"
          subtitle="Manage experience center inventory and record immediate sales. Prices in ₹ INR."
          actionLabel="Receive Stock"
          actionIcon="input"
          onAction={() => alert("Receive Stock flow: pick SKU + qty. (Wired to /api/graamam/store/receive)")}
        />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
          <SummaryCard icon="inventory" label="Units in Store" value={summary.total_units?.toLocaleString("en-IN") || "—"} hint="Ready for walk-in sale" />
          <SummaryCard icon="payments" label="Revenue Today" value={formatCurrency(summary.revenue_inr || 0)} hint="Cash + UPI + Card" />
          <SummaryCard icon="receipt" label="Sales Recorded" value={String(summary.sales_count || 0)} hint="Since launch" />
        </div>

        <div className="bg-surface-container-lowest dark:bg-[#121212] rounded-2xl border border-surface-variant/70 dark:border-white/5 shadow-warm overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-surface-variant dark:border-white/10">
            <h3 className="font-headline font-semibold text-headline-sm text-on-surface dark:text-white">Store Stock</h3>
            <button data-testid={GRAAMAM_STORE.receive} className="inline-flex items-center gap-2 bg-secondary-container text-on-secondary-container font-label font-bold text-body-sm px-4 py-2 rounded-full shadow-warm-sm"><Icon name="add" className="text-[16px]" /> Receive Stock</button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="text-outline uppercase text-label-sm tracking-wider">
                  <th className="py-4 px-6">Product</th><th className="py-4 px-6">In Store</th><th className="py-4 px-6">Nearest Expiry</th><th className="py-4 px-6">Price</th><th className="py-4 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-variant/70 dark:divide-white/5">
                {stock.map((s) => (
                  <tr key={s.sku} data-testid={GRAAMAM_STORE.row(s.sku)} className="hover:bg-surface-container-low dark:hover:bg-white/5 transition-colors">
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-lg bg-surface-variant dark:bg-white/10 overflow-hidden shrink-0">{s.image_url ? <img alt={s.name} src={s.image_url} className="w-full h-full object-cover" onError={(e) => { e.currentTarget.style.display = "none"; }} /> : <div className="w-full h-full flex items-center justify-center text-outline"><Icon name="eco" className="text-[22px]" /></div>}</div>
                        <div>
                          <div className="font-semibold text-on-surface dark:text-white">{s.name}</div>
                          <div className="text-body-sm text-outline">SKU: {s.sku}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6 font-bold text-on-surface dark:text-white">{s.qty_in_store} <span className="text-outline text-body-sm font-normal">{s.unit}</span></td>
                    <td className="py-4 px-6 text-on-surface-variant dark:text-outline-variant">{formatOrderDate(s.nearest_expiry)}</td>
                    <td className="py-4 px-6 font-bold text-on-surface dark:text-white">{formatCurrency(s.unit_price_inr)}</td>
                    <td className="py-4 px-6 text-right">
                      <button
                        data-testid={GRAAMAM_STORE.recordSale(s.sku)}
                        onClick={() => setSaleFor(s)}
                        className="font-label font-bold text-body-sm px-4 py-2 rounded-lg bg-primary-container text-on-primary shadow-warm-sm hover:shadow-warm"
                      >Record Sale</button>
                    </td>
                  </tr>
                ))}
                {stock.length === 0 ? <tr><td colSpan={5} className="py-16 text-center text-outline">No items in store yet.</td></tr> : null}
              </tbody>
            </table>
          </div>
        </div>

        <div className="mt-8">
          <h3 className="font-headline font-semibold text-headline-sm text-on-surface dark:text-white mb-3">Recent Sales</h3>
          <div className="bg-surface-container-lowest dark:bg-[#121212] rounded-2xl border border-surface-variant/70 dark:border-white/5 shadow-warm overflow-hidden">
            <table className="w-full text-left">
              <thead>
                <tr className="text-outline uppercase text-label-sm tracking-wider border-b border-surface-variant dark:border-white/10">
                  <th className="py-3 px-6">Sale ID</th><th className="py-3 px-6">Product</th><th className="py-3 px-6">Qty</th><th className="py-3 px-6">Customer</th><th className="py-3 px-6">Payment</th><th className="py-3 px-6">Total</th><th className="py-3 px-6">When</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-variant/70 dark:divide-white/5">
                {sales.length === 0 ? <tr><td colSpan={7} className="py-8 text-center text-outline">Sales you record here will appear.</td></tr> : sales.map((s) => (
                  <tr key={s.sale_id}>
                    <td className="py-3 px-6 font-mono text-sm text-on-surface dark:text-white">{s.sale_id}</td>
                    <td className="py-3 px-6 text-on-surface dark:text-white">{s.name}</td>
                    <td className="py-3 px-6 text-on-surface-variant dark:text-outline-variant">{s.qty}</td>
                    <td className="py-3 px-6 text-on-surface-variant dark:text-outline-variant">{s.customer_name}</td>
                    <td className="py-3 px-6 text-on-surface-variant dark:text-outline-variant uppercase text-body-sm">{s.payment_mode}</td>
                    <td className="py-3 px-6 font-semibold text-on-surface dark:text-white">{formatCurrency(s.total_inr)}</td>
                    <td className="py-3 px-6 text-outline text-body-sm">{formatDateTimeIST(s.sold_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <RecordSaleDrawer
          open={!!saleFor}
          onClose={() => saving ? null : setSaleFor(null)}
          item={saleFor}
          saving={saving}
          onSubmit={async (payload) => {
            setSaving(true);
            try { await storeRepository.sale(payload); setSaleFor(null); await load(); } finally { setSaving(false); }
          }}
        />
      </div>
    </AppShell>
  );
}

function SummaryCard({ icon, label, value, hint }) {
  return (
    <div className="rounded-2xl bg-surface-container-lowest dark:bg-[#121212] border border-surface-variant/70 dark:border-white/5 shadow-warm-sm p-6">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-11 h-11 rounded-full bg-primary-fixed text-primary-container flex items-center justify-center"><Icon name={icon} className="text-[22px]" /></div>
        <div className="text-body-sm text-on-surface-variant dark:text-outline-variant">{label}</div>
      </div>
      <div className="font-display font-bold text-headline-md text-on-surface dark:text-white">{value}</div>
      <div className="text-body-sm text-outline mt-1">{hint}</div>
    </div>
  );
}

function RecordSaleDrawer({ open, onClose, onSubmit, item, saving }) {
  const [qty, setQty] = useState(1);
  const [customer, setCustomer] = useState("Walk-in Customer");
  const [mode, setMode] = useState("upi");
  useEffect(() => { if (open) { setQty(1); setCustomer("Walk-in Customer"); setMode("upi"); } }, [open]);
  const submit = (e) => { e.preventDefault(); onSubmit({ sku: item.sku, qty: Number(qty), customer_name: customer, payment_mode: mode }); };
  return (
    <SlideOver open={open} onClose={onClose} title="Record Sale" subtitle={item ? `${item.name} · ${formatCurrency(item.unit_price_inr)} each` : ""}
      footer={<>
        <button type="button" onClick={onClose} className="font-label font-bold text-body-md px-5 py-2.5 rounded-lg text-on-surface-variant dark:text-outline-variant hover:bg-surface-container dark:hover:bg-white/10">Cancel</button>
        <button type="submit" form="sale-form" disabled={saving} className="font-label font-bold text-body-md px-6 py-2.5 rounded-lg bg-primary-container text-on-primary shadow-warm-sm inline-flex items-center gap-2"><Icon name="point_of_sale" className="text-[18px]" /> {saving ? "Recording…" : "Record Sale"}</button>
      </>}
    >
      <form id="sale-form" onSubmit={submit} className="flex flex-col gap-5">
        <div className="grid grid-cols-2 gap-3">
          <label className="flex flex-col gap-1"><span className="font-label text-label-sm text-on-surface dark:text-outline-variant uppercase tracking-wider">Quantity</span>
            <input type="number" min="1" value={qty} onChange={(e) => setQty(e.target.value)} className="font-body text-body-md rounded-lg border border-outline-variant/70 dark:border-white/10 bg-white dark:bg-black text-on-surface dark:text-white px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary" /></label>
          <div className="flex flex-col gap-1">
            <span className="font-label text-label-sm text-on-surface dark:text-outline-variant uppercase tracking-wider">Total</span>
            <div className="font-body text-body-md rounded-lg border border-outline-variant/70 dark:border-white/10 bg-surface-container dark:bg-white/5 text-on-surface dark:text-white px-4 py-2.5 font-bold">{formatCurrency((item?.unit_price_inr || 0) * Number(qty || 0))}</div>
          </div>
        </div>
        <label className="flex flex-col gap-1"><span className="font-label text-label-sm text-on-surface dark:text-outline-variant uppercase tracking-wider">Customer</span>
          <input value={customer} onChange={(e) => setCustomer(e.target.value)} className="font-body text-body-md rounded-lg border border-outline-variant/70 dark:border-white/10 bg-white dark:bg-black text-on-surface dark:text-white px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary" /></label>
        <div className="flex flex-col gap-1">
          <span className="font-label text-label-sm text-on-surface dark:text-outline-variant uppercase tracking-wider">Payment Mode</span>
          <div className="inline-flex items-center gap-1 rounded-lg bg-surface-container dark:bg-white/5 p-1 border border-outline-variant/60 dark:border-white/10 self-start">
            {["upi", "cash", "card"].map((m) => (
              <button key={m} type="button" onClick={() => setMode(m)} className={["px-4 py-1.5 rounded-md text-body-sm font-label font-bold uppercase", mode === m ? "bg-primary-container text-on-primary" : "text-on-surface-variant dark:text-outline-variant"].join(" ")}>{m}</button>
            ))}
          </div>
        </div>
      </form>
    </SlideOver>
  );
}
