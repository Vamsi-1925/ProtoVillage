import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Icon from "@/components/graamam/Icon";
import { ordersRepository, masterRepository } from "@/lib/firestoreClient";
import { formatOrderDate } from "@/lib/formatters";

/**
 * DispatchFormPrintPage — the A5 shipping label (graamam_v2's
 * dispatchFormDoc/printDispatchForm), restyled with our design system.
 * Per explicit requirement: NO personal phone numbers anywhere on this
 * document (neither the customer's nor Graamam's) — only the delivery
 * address, order/invoice references, and Graamam's return address.
 */
function Cell({ label, value }) {
  return (
    <div className="border border-outline-variant/60 dark:border-white/20 rounded-md px-3 py-2">
      <div className="text-[9px] font-label font-bold uppercase tracking-wider text-outline">{label}</div>
      <div className="text-sm font-bold text-on-surface dark:text-white">{value}</div>
    </div>
  );
}

export default function DispatchFormPrintPage() {
  const { orderId } = useParams();
  const nav = useNavigate();
  const [order, setOrder] = useState(null);
  const [company, setCompany] = useState(null);
  const [err, setErr] = useState(null);

  useEffect(() => {
    ordersRepository.get(orderId).then(setOrder).catch((e) => setErr(e.message));
    masterRepository.company().then(setCompany).catch(() => {});
  }, [orderId]);

  if (err) return <div className="p-10 text-error">Could not load order: {err}</div>;
  if (!order || !company) return <div className="p-10 text-outline">Loading dispatch form…</div>;

  const isB2C = order.order_type === "b2c";
  const shipTo = order.ship_to || order.bill_to || {};
  const custInfo = order.cust_info || {};
  const attn = isB2C ? "" : (shipTo.contact || shipTo.attn || "");
  const addressLines = isB2C
    ? [custInfo.city, custInfo.state_name].filter(Boolean)
    : [shipTo.address, [shipTo.city, shipTo.state_name, shipTo.pin].filter(Boolean).join(", ")].filter(Boolean);

  return (
    <div className="min-h-screen bg-surface dark:bg-black text-on-surface dark:text-white">
      <div className="print:hidden sticky top-0 z-10 bg-inverse-surface text-inverse-on-surface">
        <div className="max-w-[600px] mx-auto flex items-center justify-between px-6 py-3">
          <button onClick={() => nav(-1)} className="text-outline-variant hover:text-white inline-flex items-center gap-2"><Icon name="arrow_back" className="text-[20px]" /> Back</button>
          <div className="text-body-sm text-outline-variant">Shipping Label · {order.order_id}</div>
          <button onClick={() => window.print()} className="font-label font-bold text-body-sm px-4 py-2 rounded-lg bg-primary-container text-on-primary inline-flex items-center gap-2"><Icon name="print" className="text-[18px]" /> Print</button>
        </div>
      </div>

      <div className="max-w-[420px] mx-auto bg-white text-black shadow-warm my-8 print:my-0 print:shadow-none">
        <div className="border-2 border-black/85 rounded-2xl p-5 m-4 print:m-0">
          <div className="flex items-center justify-between border-b-2 border-olive-success pb-3 mb-4">
            <div>
              <div className="font-display font-bold text-2xl text-olive-success">{company.brand}</div>
              <div className="text-[10px] font-bold">{company.legal}</div>
            </div>
            <div className="text-right text-sm font-bold tracking-wider leading-tight">SHIPPING<br />LABEL</div>
          </div>

          <div className="grid grid-cols-2 gap-2 mb-4">
            <Cell label="Order ID" value={<span className="font-mono">{order.order_id}</span>} />
            <Cell label="Invoice #" value={order.invoice_id || "—"} />
            <Cell label="Order Date" value={formatOrderDate(order.date)} />
            <Cell label="Dispatch Date" value={formatOrderDate(order.dispatched_at) || formatOrderDate(order.date)} />
          </div>

          <div className="border-2 border-black/85 rounded-xl p-4 mb-4 min-h-[160px]">
            <div className="text-[10px] font-bold uppercase tracking-wider text-gray-600 mb-1.5">Deliver To</div>
            <div className="text-lg font-bold leading-snug">{order.customer?.name}</div>
            {attn ? <div className="text-sm font-semibold mt-0.5">Attn: {attn}</div> : null}
            <div className="text-sm leading-relaxed mt-1.5">
              {addressLines.length ? addressLines.map((l, i) => <div key={i}>{l}</div>) : <div className="text-gray-500">(no address on record)</div>}
            </div>
          </div>

          <div className="text-[10px] text-gray-600 leading-relaxed border-t border-gray-300 pt-2">
            <strong>From / If undelivered, return to:</strong><br />
            {company.legal} · {company.address}<br />
            {company.email} · {company.web}
          </div>
        </div>
      </div>

      <style>{`@media print { @page { size: A5 portrait; margin: 7mm; } body { background: #fff !important; } .print\\:hidden { display: none !important; } }`}</style>
    </div>
  );
}
