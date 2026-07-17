import React, { useEffect, useState } from "react";
import AppShell from "@/components/graamam/AppShell";
import PageHeader from "@/components/graamam/PageHeader";
import SearchInput from "@/components/graamam/SearchInput";
import Icon from "@/components/graamam/Icon";
import { formatCurrency } from "@/lib/formatters";

const API = ((typeof process !== "undefined" && process.env && process.env.REACT_APP_BACKEND_URL) || "") + "/api";
const TABS = [
  { key: "products",   label: "Products",     icon: "inventory_2" },
  { key: "b2b",        label: "B2B Customers", icon: "business" },
  { key: "b2c",        label: "B2C Customers", icon: "person" },
  { key: "costing",    label: "Costing",       icon: "calculate" },
];

export default function MasterDataPage() {
  const [tab, setTab] = useState("products");
  const [q, setQ] = useState("");
  const [data, setData] = useState([]);
  const [company, setCompany] = useState(null);
  const [summary, setSummary] = useState({});

  useEffect(() => { fetch(`${API}/graamam/master/company`).then(r => r.json()).then(setCompany); fetch(`${API}/graamam/master/summary`).then(r => r.json()).then(setSummary); }, []);
  useEffect(() => {
    const url = tab === "products" ? `${API}/graamam/master/products${q ? `?q=${encodeURIComponent(q)}` : ""}` :
                tab === "b2b"      ? `${API}/graamam/master/customers/b2b` :
                tab === "b2c"      ? `${API}/graamam/master/customers/b2c${q ? `?q=${encodeURIComponent(q)}` : ""}` :
                                     `${API}/graamam/master/costing`;
    fetch(url).then(r => r.json()).then(setData);
  }, [tab, q]);

  return (
    <AppShell topBarTitle="Master Data">
      <div data-testid="graamam-masterdata-page">
        <PageHeader title="Master Data" subtitle="Source-of-truth catalog: Products, Customers, Rate Cards, Costing." />

        {company ? (
          <div className="mb-6 rounded-2xl bg-primary-fixed/30 dark:bg-white/5 border border-primary-container/20 dark:border-white/10 p-5 flex flex-col md:flex-row md:items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-primary-container text-on-primary flex items-center justify-center"><Icon name="business" className="text-[26px]" /></div>
            <div className="flex-1">
              <div className="font-headline font-bold text-headline-sm text-on-surface dark:text-white">{company.legal}</div>
              <div className="text-body-sm text-on-surface-variant dark:text-outline-variant">Brand: {company.brand} · GSTIN {company.gstin} · PAN {company.pan}</div>
              <div className="text-body-sm text-outline mt-1">{company.address} · {company.email} · {company.web}</div>
            </div>
            <div className="text-right">
              <div className="text-body-sm text-outline">B2B POC</div>
              <div className="font-label font-bold text-on-surface dark:text-white">{company.poc_b2b?.name}</div>
              <div className="text-body-sm text-outline">+91 {company.poc_b2b?.phone}</div>
            </div>
          </div>
        ) : null}

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          {TABS.map((t) => (
            <button key={t.key} onClick={() => { setTab(t.key); setQ(""); }} className={[
              "rounded-2xl p-4 border transition-all flex items-center gap-3",
              tab === t.key ? "bg-primary-container text-on-primary border-primary-container shadow-warm-sm" : "bg-surface-container-lowest dark:bg-[#121212] border-surface-variant/70 dark:border-white/5 text-on-surface dark:text-white hover:shadow-warm-sm",
            ].join(" ")}>
              <Icon name={t.icon} className="text-[20px]" />
              <div className="text-left">
                <div className="font-label font-bold text-body-md">{t.label}</div>
                <div className="text-[11px] opacity-80">{t.key === "products" ? `${summary.products || 0} SKUs` : t.key === "b2b" ? `${summary.b2b_customers || 0} B2B` : t.key === "b2c" ? `${summary.b2c_customers || 0} B2C` : `${summary.costing || 0} recipes`}</div>
              </div>
            </button>
          ))}
        </div>

        {(tab === "products" || tab === "b2c") ? (
          <SearchInput value={q} onChange={setQ} placeholder={tab === "products" ? "Search product name or ID…" : "Search customer name, mobile, or city…"} className="mb-4" />
        ) : null}

        <div className="bg-surface-container-lowest dark:bg-[#121212] rounded-2xl border border-surface-variant/70 dark:border-white/5 shadow-warm overflow-hidden">
          <div className="overflow-x-auto">
            {tab === "products" ? (
              <table className="w-full text-left">
                <thead><tr className="text-outline uppercase text-label-sm tracking-wider border-b border-surface-variant dark:border-white/10">
                  <th className="py-3 px-6">ID</th><th className="py-3 px-6">Name</th><th className="py-3 px-6">Category</th><th className="py-3 px-6">Pack</th><th className="py-3 px-6">HSN</th><th className="py-3 px-6">GST</th><th className="py-3 px-6">MRP</th>
                </tr></thead>
                <tbody className="divide-y divide-surface-variant/70 dark:divide-white/5">
                  {(data || []).map((p) => (
                    <tr key={p.product_id}>
                      <td className="py-2.5 px-6 font-mono text-sm text-on-surface dark:text-white">{p.product_id}</td>
                      <td className="py-2.5 px-6 font-semibold text-on-surface dark:text-white">{p.name}</td>
                      <td className="py-2.5 px-6 text-on-surface-variant dark:text-outline-variant">{p.category || "—"}</td>
                      <td className="py-2.5 px-6 text-on-surface-variant dark:text-outline-variant">{p.pack || "—"}</td>
                      <td className="py-2.5 px-6 font-mono text-sm text-outline">{p.hsn || "—"}</td>
                      <td className="py-2.5 px-6 text-on-surface-variant dark:text-outline-variant">{p.gst_rate ?? 5}%</td>
                      <td className="py-2.5 px-6 font-bold text-on-surface dark:text-white">{p.mrp_inr ? formatCurrency(p.mrp_inr) : "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : tab === "b2b" ? (
              <table className="w-full text-left">
                <thead><tr className="text-outline uppercase text-label-sm tracking-wider border-b border-surface-variant dark:border-white/10">
                  <th className="py-3 px-6">Customer</th><th className="py-3 px-6">City / State</th><th className="py-3 px-6">GSTIN</th><th className="py-3 px-6">Contact</th><th className="py-3 px-6">Rate Card</th>
                </tr></thead>
                <tbody className="divide-y divide-surface-variant/70 dark:divide-white/5">
                  {(data || []).map((c) => (
                    <tr key={c.customer_id}>
                      <td className="py-3 px-6 font-semibold text-on-surface dark:text-white max-w-[280px]">{c.name}</td>
                      <td className="py-3 px-6 text-on-surface-variant dark:text-outline-variant">{[c.city, c.state].filter(Boolean).join(", ")}</td>
                      <td className="py-3 px-6 font-mono text-sm text-outline">{c.gstin || "—"}</td>
                      <td className="py-3 px-6 text-body-sm">{c.contact_person}{c.mobile ? ` · ${c.mobile}` : ""}</td>
                      <td className="py-3 px-6 text-body-sm text-outline">{c.rate_card?.length || 0} SKUs mapped</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : tab === "b2c" ? (
              <table className="w-full text-left">
                <thead><tr className="text-outline uppercase text-label-sm tracking-wider border-b border-surface-variant dark:border-white/10">
                  <th className="py-3 px-6">Customer</th><th className="py-3 px-6">Mobile</th><th className="py-3 px-6">City</th>
                </tr></thead>
                <tbody className="divide-y divide-surface-variant/70 dark:divide-white/5">
                  {(data || []).map((c) => (
                    <tr key={c.customer_id}><td className="py-2.5 px-6 font-semibold text-on-surface dark:text-white">{c.name}</td><td className="py-2.5 px-6 text-on-surface-variant dark:text-outline-variant">{c.mobile || "—"}</td><td className="py-2.5 px-6 text-on-surface-variant dark:text-outline-variant">{c.city || "—"}</td></tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <table className="w-full text-left">
                <thead><tr className="text-outline uppercase text-label-sm tracking-wider border-b border-surface-variant dark:border-white/10">
                  <th className="py-3 px-6">Main Product</th><th className="py-3 px-6">Variant</th><th className="py-3 px-6">RM / Kg</th><th className="py-3 px-6">COGS / Kg</th><th className="py-3 px-6">COGS / SKU</th><th className="py-3 px-6">MRP</th>
                </tr></thead>
                <tbody className="divide-y divide-surface-variant/70 dark:divide-white/5">
                  {(data || []).map((c, i) => (
                    <tr key={i}>
                      <td className="py-2.5 px-6 font-semibold text-on-surface dark:text-white">{c.mainProduct}</td>
                      <td className="py-2.5 px-6 text-on-surface-variant dark:text-outline-variant">{c.variant}</td>
                      <td className="py-2.5 px-6">{formatCurrency(c.rmCostKg || 0)}</td>
                      <td className="py-2.5 px-6">{formatCurrency(c.cogsKg || 0)}</td>
                      <td className="py-2.5 px-6 font-bold">{formatCurrency(c.cogsSku || 0)}</td>
                      <td className="py-2.5 px-6">{c.mrp ? formatCurrency(c.mrp) : "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
