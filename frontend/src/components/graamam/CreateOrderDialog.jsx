import React, { useEffect, useMemo, useState } from "react";
import Icon from "@/components/graamam/Icon";
import { formatCurrency } from "@/lib/formatters";
import { INDIAN_STATES, stateNameFromCode } from "@/lib/indianStates";
import { masterRepository } from "@/lib/firestoreClient";
import { GRAAMAM_ORDERS } from "@/constants/testIds";

/**
 * CreateOrderDialog — functional replica of graamam_v2's New/Edit Order
 * modal (openNewOrder / openEditOrder), restyled with our Modern-Humanist
 * design system. Handles both B2B and B2C order types, existing-customer
 * autofill, a repeatable priced item grid (one product per row, B2C
 * auto-fills MRP), and live ₹ totals.
 */
const inputCls =
  "font-body text-body-md rounded-lg border border-outline-variant/70 dark:border-white/10 bg-white dark:bg-black text-on-surface dark:text-white placeholder:text-outline px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary w-full disabled:opacity-60";
const selectCls = inputCls + " appearance-none";
const labelCls = "font-label text-label-sm text-on-surface dark:text-outline-variant uppercase tracking-wider";
const sectionLabelCls =
  "font-label font-bold text-label-sm text-primary-container dark:text-primary-fixed-dim uppercase tracking-wider pb-1 border-b border-outline-variant/40 dark:border-white/10 mt-2";

const emptyItem = () => ({ productId: "", qty: "", rate: "", disc: "" });
const emptyBill = () => ({ address: "", city: "", pin: "", stateCode: "", stateName: "", gstin: "", attn: "", phone: "" });
const emptyShip = () => ({ address: "", city: "", pin: "", stateCode: "", stateName: "", gstin: "", contact: "", phone: "" });

function num(n) {
  const v = parseFloat(n);
  return Number.isFinite(v) ? v : 0;
}

function StateSelect({ id, value, onChange, testId }) {
  return (
    <select id={id} data-testid={testId} value={value || ""} onChange={(e) => onChange(e.target.value)} className={selectCls}>
      <option value="">Select state</option>
      {INDIAN_STATES.map(([code, nm]) => (
        <option key={code} value={code}>
          {nm} ({code})
        </option>
      ))}
      <option value="OTHER">Other / Export (outside India)</option>
    </select>
  );
}

export default function CreateOrderDialog({ open, onClose, onSubmit, submitting, editOrder }) {
  const isEdit = !!editOrder;
  const [orderType, setOrderTypeState] = useState("b2b");
  const [customerId, setCustomerId] = useState("");
  const [name, setName] = useState("");

  // B2C fields
  const [mobile, setMobile] = useState("");
  const [city, setCity] = useState("");
  const [stateCode, setStateCode] = useState("");

  // B2B fields
  const [bill, setBill] = useState(emptyBill());
  const [pan, setPan] = useState("");
  const [shipSame, setShipSame] = useState(true);
  const [ship, setShip] = useState(emptyShip());
  const [termDays, setTermDays] = useState(30);
  const [advance, setAdvance] = useState("");

  const [items, setItems] = useState([emptyItem()]);
  const [notes, setNotes] = useState("");
  const [error, setError] = useState(null);

  const [products, setProducts] = useState([]);
  const [b2bCustomers, setB2bCustomers] = useState([]);
  const [b2cCustomers, setB2cCustomers] = useState([]);

  // Load master data + reset form each time the dialog opens.
  useEffect(() => {
    if (!open) return;
    setError(null);
    Promise.all([
      masterRepository.products().catch(() => []),
      masterRepository.b2bCustomers().catch(() => []),
      masterRepository.b2cCustomers().catch(() => []),
    ]).then(([p, b2b, b2c]) => {
      setProducts(Array.isArray(p) ? p : []);
      setB2bCustomers(Array.isArray(b2b) ? b2b : []);
      setB2cCustomers(Array.isArray(b2c) ? b2c : []);
    });

    if (editOrder) {
      const t = editOrder.order_type || "b2b";
      setOrderTypeState(t);
      setCustomerId(editOrder.customer_id || "");
      setName(editOrder.customer?.name || "");
      if (t === "b2b") {
        const b = editOrder.bill_to || {};
        const s = editOrder.ship_to || {};
        setBill({ address: b.address || "", city: b.city || "", pin: b.pin || "", stateCode: b.state_code || "", stateName: b.state_name || "", gstin: b.gstin || "", attn: b.attn || "", phone: b.phone || "" });
        setPan(editOrder.pan || "");
        setShip({ address: s.address || "", city: s.city || "", pin: s.pin || "", stateCode: s.state_code || "", stateName: s.state_name || "", gstin: s.gstin || "", contact: s.contact || "", phone: s.phone || "" });
        setShipSame(false);
        setTermDays(editOrder.payment_term_days != null ? editOrder.payment_term_days : 30);
        setAdvance(editOrder.advance_paid || "");
      } else {
        const ci = editOrder.cust_info || {};
        setMobile(ci.mobile || "");
        setCity(ci.city || "");
        setStateCode(ci.state_code || "");
      }
      const its = (editOrder.items || []).map((it) => ({ productId: it.product_id, qty: it.qty ?? "", rate: it.rate ?? "", disc: it.disc ?? "" }));
      setItems(its.length ? its : [emptyItem()]);
      setNotes(editOrder.notes || "");
    } else {
      setOrderTypeState("b2b");
      setCustomerId("");
      setName("");
      setMobile(""); setCity(""); setStateCode("");
      setBill(emptyBill()); setPan(""); setShipSame(true); setShip(emptyShip());
      setTermDays(30); setAdvance("");
      setItems([emptyItem()]);
      setNotes("");
    }
  }, [open, editOrder]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === "Escape" && !submitting && onClose && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose, submitting]);

  // ---------- Live totals (mirrors v2's updateOrderTotals) ----------
  const totals = useMemo(() => {
    let gross = 0, discTot = 0, gstTot = 0, lines = 0;
    items.forEach((it) => {
      if (!it.productId || !num(it.qty)) return;
      lines += 1;
      const p = products.find((x) => x.product_id === it.productId);
      const rate = num(it.rate), qty = num(it.qty), disc = num(it.disc);
      const g = rate * qty;
      const d = (g * disc) / 100;
      const taxable = Math.max(0, g - d);
      const gstPct = p && p.gst_rate != null ? p.gst_rate : 5;
      gstTot += taxable * (gstPct / 100);
      gross += g;
      discTot += d;
    });
    const taxable = gross - discTot;
    const grand = taxable + gstTot;
    return { lines, gross, discTot, taxable, gstTot, grand };
  }, [items, products]);

  if (!open) return null;

  const isB2C = orderType === "b2c";
  const customerList = isB2C ? b2cCustomers : b2bCustomers;

  const setOrderType = (t) => {
    if (isEdit) return; // order type can't be changed on edit (matches v2)
    setOrderTypeState(t);
    setCustomerId("");
    setName("");
    setMobile(""); setCity(""); setStateCode("");
    setBill(emptyBill()); setPan(""); setShipSame(true); setShip(emptyShip());
    setTermDays(30); setAdvance("");
  };

  // Autofills name/address/GSTIN/PAN/mobile/city/state/payment-terms from
  // the selected existing customer — mirrors v2's custSelect().
  const onCustomerSelect = (id) => {
    setCustomerId(id);
    if (!id) return;
    const c = customerList.find((x) => (x.customer_id || x.id) === id);
    if (!c) return;
    setName(c.name || "");
    if (isB2C) {
      setMobile(c.mobile || "");
      setCity(c.city || "");
      setStateCode(c.state_code || "");
    } else {
      setBill({
        address: c.address || "", city: c.city || "", pin: c.pincode || "",
        stateCode: c.state_code || "", stateName: c.state || "",
        gstin: c.gstin || "", attn: c.contact_person || "", phone: c.mobile || "",
      });
      setPan(c.pan || "");
      setTermDays(c.payment_term_days != null ? c.payment_term_days : 30);
    }
  };

  // ---------- Items ----------
  const chosenIds = new Set(items.map((it) => it.productId).filter(Boolean));
  const allProductsUsed = products.length > 0 && chosenIds.size >= products.length;

  const updateItem = (i, patch) => {
    setItems((prev) => prev.map((it, idx) => (idx === i ? { ...it, ...patch } : it)));
  };

  const onProductChange = (i, productId) => {
    const p = products.find((x) => x.product_id === productId);
    updateItem(i, {
      productId,
      // B2C auto-fills the rate with the product MRP; B2B stays manual.
      rate: isB2C && p && p.mrp_inr != null ? String(p.mrp_inr) : items[i].rate,
    });
  };

  const addItemRow = () => setItems((prev) => [...prev, emptyItem()]);
  const removeItemRow = (i) => setItems((prev) => (prev.length <= 1 ? prev : prev.filter((_, idx) => idx !== i)));

  const validate = () => {
    if (!name.trim()) return "Customer name is required.";
    const hasLine = items.some((it) => it.productId && num(it.qty) > 0);
    if (!hasLine) return "Add at least one item with a product and quantity.";
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const err = validate();
    if (err) {
      setError(err);
      return;
    }
    setError(null);
    const lineItems = items
      .filter((it) => it.productId && num(it.qty) > 0)
      .map((it) => ({ product_id: it.productId, qty: num(it.qty), rate: it.rate === "" ? null : num(it.rate), disc: it.disc === "" ? 0 : num(it.disc) }));

    const payload = { name: name.trim(), items: lineItems, notes: notes.trim() };
    if (!isEdit) {
      payload.order_type = orderType;
      payload.customer_id = customerId || null;
    }
    if (orderType === "b2b") {
      payload.bill_to = { address: bill.address, city: bill.city, pin: bill.pin, state_code: bill.stateCode, state_name: bill.stateCode ? stateNameFromCode(bill.stateCode) : bill.stateName, gstin: bill.gstin, attn: bill.attn, phone: bill.phone };
      payload.ship_to = shipSame
        ? { ...payload.bill_to, contact: bill.attn }
        : { address: ship.address, city: ship.city, pin: ship.pin, state_code: ship.stateCode, state_name: ship.stateCode ? stateNameFromCode(ship.stateCode) : ship.stateName, gstin: ship.gstin, contact: ship.contact, phone: ship.phone };
      payload.pan = pan.trim();
      payload.payment_term_days = num(termDays) || 30;
      payload.advance_paid = num(advance);
    } else {
      payload.cust_info = { mobile: mobile.trim(), city: city.trim(), state_code: stateCode, state_name: stateCode ? stateNameFromCode(stateCode) : "" };
    }

    try {
      await onSubmit(payload);
    } catch (e2) {
      setError(e2?.message || "Could not save order.");
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" data-testid={GRAAMAM_ORDERS.createOrderDialog} role="dialog" aria-modal="true">
      <div data-modal-overlay="true" className="absolute inset-0 bg-inverse-surface/60 dark:bg-black/70 backdrop-blur-sm" onClick={() => (submitting ? null : onClose && onClose())} />
      <form
        data-modal-content="true"
        onSubmit={handleSubmit}
        className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl bg-surface-container-lowest dark:bg-[#121212] border border-outline-variant/60 dark:border-white/10 shadow-warm-lg p-8"
      >
        <div className="flex items-start justify-between mb-6 gap-4">
          <div>
            <h3 className="font-headline font-bold text-headline-md text-on-surface dark:text-white">
              {isEdit ? `Edit Order — ${editOrder.order_id}` : "New Order"}
            </h3>
            <p className="font-body text-body-sm text-on-surface-variant dark:text-outline-variant mt-1">
              {isEdit ? "Order type can't be changed on edit." : "Write a new order to the Graamam producer queue. Amounts in ₹ INR."}
            </p>
          </div>
          <button type="button" aria-label="Close" onClick={() => onClose && onClose()} className="text-outline hover:text-primary-container dark:hover:text-white p-2 -m-2 rounded-full transition-colors">
            <Icon name="close" className="text-[22px]" />
          </button>
        </div>

        <div className="flex flex-col gap-5">
          {/* Order Type segmented toggle */}
          <div className="flex flex-col gap-1.5">
            <span className={labelCls}>Order Type *</span>
            {isEdit ? (
              <span className={`inline-flex w-fit items-center gap-1.5 px-3 py-1 rounded-full text-label-sm font-label ${orderType === "b2b" ? "bg-secondary-container text-on-secondary-container" : "bg-tertiary-fixed-dim text-on-tertiary-fixed"}`}>
                {orderType.toUpperCase()}
              </span>
            ) : (
              <div className="grid grid-cols-2 rounded-lg border border-outline-variant/70 dark:border-white/10 overflow-hidden">
                <button
                  type="button"
                  data-testid={GRAAMAM_ORDERS.orderTypeToggleB2B}
                  onClick={() => setOrderType("b2b")}
                  className={`font-label font-bold text-body-sm px-4 py-2.5 transition-colors ${orderType === "b2b" ? "bg-primary-container text-on-primary" : "bg-white dark:bg-black text-on-surface-variant dark:text-outline-variant hover:bg-surface-container dark:hover:bg-white/5"}`}
                >
                  B2B — Business
                </button>
                <button
                  type="button"
                  data-testid={GRAAMAM_ORDERS.orderTypeToggleB2C}
                  onClick={() => setOrderType("b2c")}
                  className={`font-label font-bold text-body-sm px-4 py-2.5 transition-colors border-l border-outline-variant/70 dark:border-white/10 ${orderType === "b2c" ? "bg-primary-container text-on-primary" : "bg-white dark:bg-black text-on-surface-variant dark:text-outline-variant hover:bg-surface-container dark:hover:bg-white/5"}`}
                >
                  B2C — Retail / POS
                </button>
              </div>
            )}
          </div>

          {/* Customer picker */}
          <div className="flex flex-col gap-1.5">
            <span className={labelCls}>Customer</span>
            <select
              data-testid={GRAAMAM_ORDERS.orderCustomerSelect}
              value={customerId}
              onChange={(e) => onCustomerSelect(e.target.value)}
              disabled={isEdit}
              className={selectCls}
            >
              <option value="">➕ New customer</option>
              {customerList.map((c) => (
                <option key={c.customer_id || c.id} value={c.customer_id || c.id}>
                  {c.name}{c.mobile ? ` · ${c.mobile}` : ""}
                </option>
              ))}
            </select>
          </div>

          {isB2C ? (
            <>
              <label className="flex flex-col gap-1.5">
                <span className={labelCls}>Customer Name *</span>
                <input data-testid={GRAAMAM_ORDERS.orderCustomerName} value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Anji Reddy" className={inputCls} autoFocus />
              </label>
              <div className="grid grid-cols-2 gap-4">
                <label className="flex flex-col gap-1.5">
                  <span className={labelCls}>Mobile #</span>
                  <input value={mobile} onChange={(e) => setMobile(e.target.value)} className={inputCls} />
                </label>
                <label className="flex flex-col gap-1.5">
                  <span className={labelCls}>City</span>
                  <input value={city} onChange={(e) => setCity(e.target.value)} className={inputCls} />
                </label>
              </div>
              <label className="flex flex-col gap-1.5">
                <span className={labelCls}>State</span>
                <StateSelect id="o-c-state" value={stateCode} onChange={setStateCode} />
              </label>
            </>
          ) : (
            <>
              <label className="flex flex-col gap-1.5">
                <span className={labelCls}>Customer / Company Name *</span>
                <input data-testid={GRAAMAM_ORDERS.orderCustomerName} value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Indigowares Ltd" className={inputCls} autoFocus />
              </label>

              <div className={sectionLabelCls}>Bill To Party</div>
              <label className="flex flex-col gap-1.5">
                <span className={labelCls}>Address</span>
                <textarea rows={2} value={bill.address} onChange={(e) => setBill({ ...bill, address: e.target.value })} placeholder="Street, area" className={inputCls} />
              </label>
              <div className="grid grid-cols-2 gap-4">
                <label className="flex flex-col gap-1.5">
                  <span className={labelCls}>City / Town</span>
                  <input value={bill.city} onChange={(e) => setBill({ ...bill, city: e.target.value })} className={inputCls} />
                </label>
                <label className="flex flex-col gap-1.5">
                  <span className={labelCls}>PIN</span>
                  <input value={bill.pin} onChange={(e) => setBill({ ...bill, pin: e.target.value })} className={inputCls} />
                </label>
              </div>
              <label className="flex flex-col gap-1.5">
                <span className={labelCls}>State</span>
                <StateSelect value={bill.stateCode} onChange={(v) => setBill({ ...bill, stateCode: v })} />
              </label>
              <div className="grid grid-cols-2 gap-4">
                <label className="flex flex-col gap-1.5">
                  <span className={labelCls}>GSTIN</span>
                  <input value={bill.gstin} onChange={(e) => setBill({ ...bill, gstin: e.target.value })} placeholder="e.g. 36ABCDE1234F1Z5" className={inputCls} />
                </label>
                <label className="flex flex-col gap-1.5">
                  <span className={labelCls}>PAN</span>
                  <input value={pan} onChange={(e) => setPan(e.target.value)} className={inputCls} />
                </label>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <label className="flex flex-col gap-1.5">
                  <span className={labelCls}>Kind Attn (contact)</span>
                  <input value={bill.attn} onChange={(e) => setBill({ ...bill, attn: e.target.value })} className={inputCls} />
                </label>
                <label className="flex flex-col gap-1.5">
                  <span className={labelCls}>Phone</span>
                  <input value={bill.phone} onChange={(e) => setBill({ ...bill, phone: e.target.value })} className={inputCls} />
                </label>
              </div>

              <div className={`${sectionLabelCls} flex items-center justify-between border-none`}>
                <span>Ship To Party</span>
                <label className="flex items-center gap-1.5 text-body-sm font-body font-normal text-on-surface-variant dark:text-outline-variant normal-case tracking-normal">
                  <input type="checkbox" data-testid={GRAAMAM_ORDERS.orderShipSameCheckbox} checked={shipSame} onChange={(e) => setShipSame(e.target.checked)} className="w-4 h-4 accent-primary-container" />
                  Same as billing
                </label>
              </div>
              {!shipSame ? (
                <>
                  <label className="flex flex-col gap-1.5">
                    <span className={labelCls}>Address</span>
                    <textarea rows={2} value={ship.address} onChange={(e) => setShip({ ...ship, address: e.target.value })} placeholder="Delivery address" className={inputCls} />
                  </label>
                  <div className="grid grid-cols-2 gap-4">
                    <label className="flex flex-col gap-1.5">
                      <span className={labelCls}>City / Town</span>
                      <input value={ship.city} onChange={(e) => setShip({ ...ship, city: e.target.value })} className={inputCls} />
                    </label>
                    <label className="flex flex-col gap-1.5">
                      <span className={labelCls}>PIN</span>
                      <input value={ship.pin} onChange={(e) => setShip({ ...ship, pin: e.target.value })} className={inputCls} />
                    </label>
                  </div>
                  <label className="flex flex-col gap-1.5">
                    <span className={labelCls}>State</span>
                    <StateSelect value={ship.stateCode} onChange={(v) => setShip({ ...ship, stateCode: v })} />
                  </label>
                  <div className="grid grid-cols-2 gap-4">
                    <label className="flex flex-col gap-1.5">
                      <span className={labelCls}>GSTIN</span>
                      <input value={ship.gstin} onChange={(e) => setShip({ ...ship, gstin: e.target.value })} className={inputCls} />
                    </label>
                    <label className="flex flex-col gap-1.5">
                      <span className={labelCls}>Delivery contact</span>
                      <input value={ship.contact} onChange={(e) => setShip({ ...ship, contact: e.target.value })} className={inputCls} />
                    </label>
                  </div>
                  <label className="flex flex-col gap-1.5">
                    <span className={labelCls}>Delivery contact phone</span>
                    <input value={ship.phone} onChange={(e) => setShip({ ...ship, phone: e.target.value })} className={inputCls} />
                  </label>
                </>
              ) : null}

              <div className={sectionLabelCls}>Payment Terms</div>
              <div className="grid grid-cols-2 gap-4">
                <label className="flex flex-col gap-1.5">
                  <span className={labelCls}>Credit period (days)</span>
                  <input type="number" min="0" value={termDays} onChange={(e) => setTermDays(e.target.value)} placeholder="e.g. 30 / 45" className={inputCls} />
                </label>
                <label className="flex flex-col gap-1.5">
                  <span className={labelCls}>Advance paid now (₹)</span>
                  <input type="number" min="0" step="0.01" value={advance} onChange={(e) => setAdvance(e.target.value)} placeholder="0.00" className={inputCls} />
                </label>
              </div>
            </>
          )}

          {/* Items */}
          <div className="flex items-center justify-between mt-2 pb-1 border-b border-outline-variant/40 dark:border-white/10">
            <span className="font-label font-bold text-label-sm text-primary-container dark:text-primary-fixed-dim uppercase tracking-wider">Items</span>
            {!allProductsUsed ? (
              <button type="button" data-testid={GRAAMAM_ORDERS.orderAddItemButton} onClick={addItemRow} className="font-label font-bold text-body-sm px-3 py-1.5 rounded-lg bg-surface-container dark:bg-white/10 text-on-surface dark:text-white hover:bg-surface-container-high dark:hover:bg-white/20 transition-colors inline-flex items-center gap-1.5">
                <Icon name="add" className="text-[16px]" /> Add Item
              </button>
            ) : null}
          </div>

          <div className="grid grid-cols-[minmax(0,2.2fr)_minmax(0,0.8fr)_minmax(0,1fr)_minmax(0,0.8fr)_36px] gap-2 text-[10px] font-label font-bold uppercase tracking-wider text-outline">
            <div>Product</div>
            <div>Qty</div>
            <div>Rate ₹{isB2C ? " (MRP)" : ""}</div>
            <div>Disc %</div>
            <div />
          </div>
          <div className="flex flex-col gap-2">
            {items.map((it, i) => {
              const opts = products.filter((p) => p.product_id === it.productId || !items.some((o, j) => j !== i && o.productId === p.product_id));
              return (
                <div key={i} data-testid={GRAAMAM_ORDERS.orderItemRow(i)} className="grid grid-cols-[minmax(0,2.2fr)_minmax(0,0.8fr)_minmax(0,1fr)_minmax(0,0.8fr)_36px] gap-2 items-center">
                  <select data-testid={GRAAMAM_ORDERS.orderItemProduct(i)} value={it.productId} onChange={(e) => onProductChange(i, e.target.value)} className={selectCls}>
                    <option value="">Select product</option>
                    {opts.map((p) => (
                      <option key={p.product_id} value={p.product_id}>{p.name}</option>
                    ))}
                  </select>
                  <input data-testid={GRAAMAM_ORDERS.orderItemQty(i)} type="number" min="1" placeholder="0" value={it.qty} onChange={(e) => updateItem(i, { qty: e.target.value })} className={inputCls} />
                  <input data-testid={GRAAMAM_ORDERS.orderItemRate(i)} type="number" step="0.01" placeholder="rate" value={it.rate} onChange={(e) => updateItem(i, { rate: e.target.value })} disabled={isB2C && !it.productId} className={inputCls} />
                  <input data-testid={GRAAMAM_ORDERS.orderItemDisc(i)} type="number" step="0.01" min="0" placeholder="0" value={it.disc} onChange={(e) => updateItem(i, { disc: e.target.value })} className={inputCls} />
                  <button type="button" data-testid={GRAAMAM_ORDERS.orderItemRemove(i)} onClick={() => removeItemRow(i)} disabled={items.length <= 1} className="h-[42px] rounded-lg text-outline hover:text-error hover:bg-error-container/40 disabled:opacity-40 disabled:hover:bg-transparent flex items-center justify-center transition-colors">
                    <Icon name="close" className="text-[16px]" />
                  </button>
                </div>
              );
            })}
          </div>

          {/* Live totals */}
          {totals.lines > 0 ? (
            <div data-testid={GRAAMAM_ORDERS.orderTotalsBox} className="rounded-xl bg-surface-container dark:bg-white/5 border border-outline-variant/40 dark:border-white/10 p-4 flex flex-col gap-1.5">
              <div className="flex justify-between text-body-sm text-on-surface-variant dark:text-outline-variant">
                <span>Subtotal</span><span className="text-on-surface dark:text-white font-semibold">{formatCurrency(totals.gross)}</span>
              </div>
              {totals.discTot > 0 ? (
                <div className="flex justify-between text-body-sm text-on-surface-variant dark:text-outline-variant">
                  <span>Discount</span><span className="text-on-surface dark:text-white font-semibold">− {formatCurrency(totals.discTot)}</span>
                </div>
              ) : null}
              <div className="flex justify-between text-body-sm text-on-surface-variant dark:text-outline-variant">
                <span>Taxable value</span><span className="text-on-surface dark:text-white font-semibold">{formatCurrency(totals.taxable)}</span>
              </div>
              <div className="flex justify-between text-body-sm text-on-surface-variant dark:text-outline-variant">
                <span>GST</span><span className="text-on-surface dark:text-white font-semibold">{formatCurrency(totals.gstTot)}</span>
              </div>
              <div className="flex justify-between text-body-lg font-bold pt-2 mt-1 border-t border-outline-variant/40 dark:border-white/10 text-on-surface dark:text-white">
                <span>Grand Total</span><span>{formatCurrency(totals.grand)}</span>
              </div>
            </div>
          ) : null}

          {/* Notes */}
          <label className="flex flex-col gap-1.5">
            <span className={labelCls}>Notes (optional)</span>
            <textarea data-testid={GRAAMAM_ORDERS.orderNotesInput} rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} className={inputCls} />
          </label>

          {error ? (
            <div data-testid={GRAAMAM_ORDERS.orderFormError} className="text-body-sm text-error font-body">{error}</div>
          ) : null}

          <button
            type="submit"
            disabled={submitting}
            data-testid={GRAAMAM_ORDERS.createOrderSubmit}
            className="w-full font-label font-bold text-label-md px-6 py-3 rounded-lg bg-primary-container text-on-primary hover:shadow-warm shadow-warm-sm disabled:opacity-70 transition-all inline-flex items-center justify-center gap-2"
          >
            {submitting ? (
              <>
                <Icon name="progress_activity" className="animate-spin text-[18px]" />
                {isEdit ? "Updating…" : "Creating…"}
              </>
            ) : (
              <>
                <Icon name={isEdit ? "save" : "add"} className="text-[18px]" />
                {isEdit ? "Update Order" : "Create Order & Generate Token"}
              </>
            )}
          </button>
          <button
            type="button"
            onClick={() => onClose && onClose()}
            disabled={submitting}
            data-testid={GRAAMAM_ORDERS.createOrderCancel}
            className="w-full font-label font-bold text-label-md px-5 py-2.5 rounded-lg text-on-surface-variant dark:text-outline-variant hover:bg-surface-container dark:hover:bg-white/10 transition-colors"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
