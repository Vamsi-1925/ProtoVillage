import React, { useEffect, useState } from "react";
import AppShell from "@/components/graamam/AppShell";
import PageHeader from "@/components/graamam/PageHeader";
import Icon from "@/components/graamam/Icon";
import StatusPill from "@/components/graamam/StatusPill";
import { formatCurrency, formatOrderDate, formatDateTimeIST } from "@/lib/formatters";

const API = ((typeof process !== "undefined" && process.env && process.env.REACT_APP_BACKEND_URL) || "") + "/api";

export default function AccountsPage() {
  const [invoices, setInvoices] = useState([]);
  const [summary, setSummary] = useState({});
  const load = async () => {
    const [inv, s] = await Promise.all([
      fetch(`${API}/graamam/invoices`).then(r => r.json()),
      fetch(`${API}/graamam/accounts/summary`).then(r => r.json()),
    ]);
    setInvoices(inv || []); setSummary(s || {});
  };
  useEffect(() => { load(); }, []);

  return (
    <AppShell topBarTitle="Accounts">
      <div data-testid="graamam-accounts-page">
        <PageHeader title="Accounts" subtitle="Raise B2B invoices, track payments, and reconcile the ledger. All amounts in ₹ INR." />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <SummaryCard icon="receipt_long" label="Total Billed" value={formatCurrency(summary.total_billed_inr || 0)} accent="primary" />
          <SummaryCard icon="paid" label="Received" value={formatCurrency(summary.total_paid_inr || 0)} accent="success" />
          <SummaryCard icon="pending_actions" label="Outstanding" value={formatCurrency(summary.outstanding_inr || 0)} accent="tertiary" />
        </div>

        <div className="rounded-2xl bg-surface-container-lowest dark:bg-[#121212] border border-surface-variant/70 dark:border-white/5 shadow-warm overflow-hidden">
          <div className="px-6 py-4 border-b border-surface-variant dark:border-white/10">
            <h3 className="font-headline font-semibold text-headline-sm text-on-surface dark:text-white">Invoices</h3>
          </div>
          <table className="w-full text-left">
            <thead>
              <tr className="text-outline uppercase text-label-sm tracking-wider">
                <th className="py-3 px-6">Invoice</th><th className="py-3 px-6">Customer</th><th className="py-3 px-6">Taxable</th><th className="py-3 px-6">GST</th><th className="py-3 px-6">Total</th><th className="py-3 px-6">Status</th><th className="py-3 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-variant/70 dark:divide-white/5">
              {invoices.length === 0 ? (
                <tr><td colSpan={7} className="py-14 text-center text-outline">No invoices raised yet. Raise one from an Order.</td></tr>
              ) : invoices.map((inv) => (
                <tr key={inv.invoice_id}>
                  <td className="py-3 px-6 font-mono text-sm text-on-surface dark:text-white">{inv.invoice_id}</td>
                  <td className="py-3 px-6">
                    <div className="font-semibold text-on-surface dark:text-white">{inv.customer_name}</div>
                    <div className="text-body-sm text-outline">{inv.customer_state || ""}{inv.customer_gstin ? ` · GSTIN ${inv.customer_gstin}` : ""}</div>
                  </td>
                  <td className="py-3 px-6">{formatCurrency(inv.totals?.taxable || 0)}</td>
                  <td className="py-3 px-6 text-body-sm">{inv.tax_type === "intra"
                    ? <>CGST {formatCurrency(inv.totals?.cgst || 0)} + SGST {formatCurrency(inv.totals?.sgst || 0)}</>
                    : <>IGST {formatCurrency(inv.totals?.igst || 0)}</>}</td>
                  <td className="py-3 px-6 font-bold">{formatCurrency(inv.totals?.final || inv.totals?.grand_total || 0)}</td>
                  <td className="py-3 px-6"><StatusPill status={inv.status === "paid" ? "delivered" : "new"} /></td>
                  <td className="py-3 px-6 text-right">
                    {inv.status !== "paid" ? (
                      <div className="inline-flex items-center gap-2">
                        <span className="text-body-sm text-outline">o/s {formatCurrency(inv.outstanding ?? (inv.totals?.final || 0))}</span>
                        <button onClick={async () => {
                          const amt = Number(window.prompt(`Record payment for ${inv.invoice_id}. Outstanding: ₹${inv.outstanding ?? inv.totals?.final ?? 0}. Amount received (₹):`, String(inv.outstanding ?? inv.totals?.final ?? 0)) || 0);
                          if (!amt) return;
                          await fetch(`${API}/graamam/invoices/${inv.invoice_id}/pay`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ amount: amt, recorded_by: "Accounts" }) });
                          load();
                        }} className="font-label font-bold text-body-sm px-3 py-2 rounded-lg bg-secondary-container text-on-secondary-container">Record Payment</button>
                        <button onClick={async () => { await fetch(`${API}/graamam/invoices/${inv.invoice_id}/mark-paid`, { method: "POST" }); load(); }} className="font-label font-bold text-body-sm px-3 py-2 rounded-lg bg-olive-success text-white shadow-warm-sm">Mark Fully Paid</button>
                      </div>
                    ) : <span className="text-body-sm text-outline">{formatDateTimeIST(inv.paid_at)}</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p className="mt-6 text-body-sm text-outline">Invoices follow PROTOVILLAGE LIVELIHOOD SYSTEMS PVT LTD template (GSTIN 37AAPCP6519D1Z5, HDFC Bank Hindupur). Intra-state supply → CGST+SGST; inter-state → IGST.</p>
      </div>
    </AppShell>
  );
}

function SummaryCard({ icon, label, value, accent = "primary" }) {
  const bg = { primary: "bg-primary-fixed text-primary-container", success: "bg-olive-success/15 text-olive-success", tertiary: "bg-tertiary-fixed-dim text-on-tertiary-fixed" }[accent];
  return (
    <div className="rounded-2xl bg-surface-container-lowest dark:bg-[#121212] border border-surface-variant/70 dark:border-white/5 shadow-warm-sm p-6 flex items-center gap-4">
      <div className={`w-12 h-12 rounded-full flex items-center justify-center ${bg}`}><Icon name={icon} className="text-[22px]" /></div>
      <div>
        <div className="text-body-sm text-on-surface-variant dark:text-outline-variant">{label}</div>
        <div className="font-display font-bold text-headline-md text-on-surface dark:text-white">{value}</div>
      </div>
    </div>
  );
}
