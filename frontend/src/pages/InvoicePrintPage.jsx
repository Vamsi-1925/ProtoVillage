import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Icon from "@/components/graamam/Icon";
import { formatCurrency, formatOrderDate } from "@/lib/formatters";

const API = ((typeof process !== "undefined" && process.env && process.env.REACT_APP_BACKEND_URL) || "") + "/api";

function numToInrWords(num) {
  // Simple Indian numbering conversion for grand totals (up to lakhs).
  const a = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"];
  const b = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];
  const two = (n) => (n < 20 ? a[n] : `${b[Math.floor(n / 10)]}${n % 10 ? " " + a[n % 10] : ""}`);
  const three = (n) => (n >= 100 ? `${a[Math.floor(n / 100)]} Hundred${n % 100 ? " " + two(n % 100) : ""}` : two(n));
  const parts = [];
  const cr = Math.floor(num / 10000000); num %= 10000000;
  const la = Math.floor(num / 100000); num %= 100000;
  const th = Math.floor(num / 1000); num %= 1000;
  const hu = num;
  if (cr) parts.push(`${three(cr)} Crore`);
  if (la) parts.push(`${three(la)} Lakh`);
  if (th) parts.push(`${three(th)} Thousand`);
  if (hu) parts.push(`${three(hu)}`);
  return (parts.join(" ") || "Zero") + " Rupees Only";
}

export default function InvoicePrintPage() {
  const { invoiceId } = useParams();
  const nav = useNavigate();
  const [inv, setInv] = useState(null);
  const [company, setCompany] = useState(null);
  const [err, setErr] = useState(null);

  useEffect(() => {
    fetch(`${API}/graamam/invoices/${invoiceId}`).then(async (r) => {
      if (!r.ok) throw new Error(await r.text());
      return r.json();
    }).then(setInv).catch((e) => setErr(e.message));
    fetch(`${API}/graamam/master/company`).then((r) => r.json()).then(setCompany).catch(() => {});
  }, [invoiceId]);

  if (err) return <div className="p-10 text-error">Could not load invoice: {err}</div>;
  if (!inv || !company) return <div className="p-10 text-outline">Loading invoice…</div>;

  const T = inv.totals || {};
  const isIntra = inv.tax_type === "intra";

  return (
    <div className="min-h-screen bg-surface dark:bg-black text-on-surface dark:text-white">
      {/* Screen-only toolbar */}
      <div className="print:hidden sticky top-0 z-10 bg-inverse-surface text-inverse-on-surface">
        <div className="max-w-[900px] mx-auto flex items-center justify-between px-6 py-3">
          <button onClick={() => nav(-1)} className="text-outline-variant hover:text-white inline-flex items-center gap-2"><Icon name="arrow_back" className="text-[20px]" /> Back</button>
          <div className="text-body-sm text-outline-variant">Tax Invoice · {inv.invoice_id}</div>
          <button onClick={() => window.print()} className="font-label font-bold text-body-sm px-4 py-2 rounded-lg bg-primary-container text-on-primary inline-flex items-center gap-2"><Icon name="print" className="text-[18px]" /> Print / Save PDF</button>
        </div>
      </div>

      <div className="max-w-[900px] mx-auto bg-white text-black shadow-warm my-8 border border-outline-variant/40 print:border-0 print:shadow-none print:my-0">
        <div className="p-8">
          <div className="flex items-start justify-between border-b-2 border-black/80 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-full bg-primary-container text-on-primary flex items-center justify-center"><Icon name="eco" className="text-[22px]" /></div>
                <div className="font-headline font-bold text-2xl">{company.brand} <span className="text-outline">· Tax Invoice</span></div>
              </div>
              <div className="mt-2 text-sm leading-relaxed">
                <div className="font-bold">{company.legal}</div>
                <div>{company.address}</div>
                <div>GSTIN: <b>{company.gstin}</b> · PAN: <b>{company.pan}</b> · State Code: {company.state_code}</div>
                <div>{company.email} · {company.web}</div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-outline text-[11px] uppercase tracking-wider">Invoice</div>
              <div className="font-mono font-bold text-lg">{inv.invoice_id}</div>
              <div className="text-outline text-[11px] uppercase tracking-wider mt-2">Order Ref</div>
              <div className="font-mono">{inv.order_id}</div>
              <div className="text-outline text-[11px] uppercase tracking-wider mt-2">Date</div>
              <div>{formatOrderDate(inv.created_at)}</div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6 mt-4">
            <div>
              <div className="text-outline text-[11px] uppercase tracking-wider">Bill To</div>
              <div className="font-bold text-lg">{inv.customer_name}</div>
              {inv.customer_gstin ? <div>GSTIN: <b>{inv.customer_gstin}</b></div> : null}
              {inv.customer_state ? <div>State: {inv.customer_state}</div> : null}
            </div>
            <div className="text-right">
              <div className="text-outline text-[11px] uppercase tracking-wider">Place of Supply</div>
              <div className="font-bold">{inv.place_of_supply}</div>
              <div className="mt-2 text-outline text-[11px] uppercase tracking-wider">Supply Type</div>
              <div className="font-bold">{isIntra ? "Intra-state (CGST + SGST)" : "Inter-state (IGST)"}</div>
            </div>
          </div>

          <table className="w-full text-left mt-6 border-t border-b border-black/70">
            <thead>
              <tr className="border-b border-black/70 text-[12px] uppercase tracking-wider">
                <th className="py-2 pr-2">#</th>
                <th className="py-2 pr-2">Description</th>
                <th className="py-2 pr-2">HSN</th>
                <th className="py-2 pr-2 text-right">Qty</th>
                <th className="py-2 pr-2 text-right">Rate</th>
                <th className="py-2 pr-2 text-right">Taxable</th>
                <th className="py-2 pr-2 text-right">{isIntra ? "CGST" : "IGST"}</th>
                {isIntra ? <th className="py-2 pr-2 text-right">SGST</th> : null}
                <th className="py-2 text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              {(inv.line_items || []).map((li, i) => (
                <tr key={i} className="border-b border-black/10">
                  <td className="py-2 pr-2">{i + 1}</td>
                  <td className="py-2 pr-2">{li.name}</td>
                  <td className="py-2 pr-2">{li.hsn || "2106"}</td>
                  <td className="py-2 pr-2 text-right">{li.qty}</td>
                  <td className="py-2 pr-2 text-right">{formatCurrency(li.rate)}</td>
                  <td className="py-2 pr-2 text-right">{formatCurrency(li.taxable)}</td>
                  <td className="py-2 pr-2 text-right">{formatCurrency(isIntra ? li.cgst : li.igst)}<div className="text-[10px] text-outline">{(li.gst || 5) / (isIntra ? 2 : 1)}%</div></td>
                  {isIntra ? <td className="py-2 pr-2 text-right">{formatCurrency(li.sgst)}<div className="text-[10px] text-outline">{(li.gst || 5) / 2}%</div></td> : null}
                  <td className="py-2 text-right font-bold">{formatCurrency((li.taxable || 0) + (li.gst_amt || 0))}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="mt-4 flex justify-end">
            <table className="text-right text-sm">
              <tbody>
                <tr><td className="pr-4 py-1 text-outline">Taxable Value</td><td className="font-bold py-1">{formatCurrency(T.taxable || 0)}</td></tr>
                {isIntra ? (<>
                  <tr><td className="pr-4 py-1 text-outline">CGST</td><td className="font-bold py-1">{formatCurrency(T.cgst || 0)}</td></tr>
                  <tr><td className="pr-4 py-1 text-outline">SGST</td><td className="font-bold py-1">{formatCurrency(T.sgst || 0)}</td></tr>
                </>) : (
                  <tr><td className="pr-4 py-1 text-outline">IGST</td><td className="font-bold py-1">{formatCurrency(T.igst || 0)}</td></tr>
                )}
                <tr><td className="pr-4 py-1 text-outline">Round Off</td><td className="font-bold py-1">{formatCurrency(T.round_off || 0)}</td></tr>
                <tr className="text-lg"><td className="pr-4 py-2 border-t border-black/60">Grand Total</td><td className="font-bold py-2 border-t border-black/60">{formatCurrency(T.final || T.grand_total || 0)}</td></tr>
              </tbody>
            </table>
          </div>

          <div className="mt-6 border border-black/20 rounded-md p-3 text-sm">
            <div className="text-outline text-[11px] uppercase tracking-wider">Amount in words</div>
            <div className="font-semibold mt-1">{numToInrWords(Math.round(T.final || T.grand_total || 0))}</div>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-6 text-sm">
            <div>
              <div className="text-outline text-[11px] uppercase tracking-wider">Bank Details</div>
              <div className="mt-1"><b>{company.bank?.name}</b></div>
              <div>A/c No: <b>{company.bank?.account_no}</b> ({company.bank?.account_type})</div>
              <div>IFSC: <b>{company.bank?.ifsc}</b></div>
              <div className="mt-2 text-outline text-[11px] uppercase tracking-wider">B2B POC</div>
              <div>{company.poc_b2b?.name} · +91 {company.poc_b2b?.phone}</div>
            </div>
            <div className="text-right">
              <div className="text-outline text-[11px] uppercase tracking-wider">For {company.legal}</div>
              <div className="mt-16 border-t border-black/60 inline-block pt-1 px-6">Authorised Signatory</div>
            </div>
          </div>

          <p className="mt-6 text-[11px] text-outline text-center">This is a system-generated tax invoice. Subject to Sample Town jurisdiction. Goods once sold will not be taken back.</p>
        </div>
      </div>

      <style>{`@media print { body { background: #fff !important; } .print\:hidden { display: none !important; } }`}</style>
    </div>
  );
}
