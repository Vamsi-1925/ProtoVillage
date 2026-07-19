import React, { useCallback, useEffect, useState } from "react";
import AppShell from "@/components/graamam/AppShell";
import PageHeader from "@/components/graamam/PageHeader";
import Icon from "@/components/graamam/Icon";
import { inventoryRepository } from "@/lib/firestoreClient";
import { useAuth } from "@/context/AuthContext";
import { GRAAMAM_INVENTORY } from "@/constants/testIds";
import { formatCurrency, formatDateTimeIST, formatQty } from "@/lib/formatters";

/**
 * InventoryPage — graamam_v2 pgInventory / pgInventoryGroup parity.
 * Landing = category blocks (5 raw-material groups + Finished Goods).
 * Click a block to drill into that group's table. Reads the SAME shared
 * `graamam_inventory` collection Production deducts and Procurement
 * restocks — one source of truth.
 */
const STATUS_STYLE = {
  OK: "bg-olive-success/15 text-olive-success",
  "Low Stock": "bg-tertiary-fixed-dim/60 text-on-tertiary-fixed",
  "Out of Stock": "bg-terracotta-error/15 text-terracotta-error",
};

function StatusBadge({ label }) {
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-label-sm font-label font-bold ${STATUS_STYLE[label] || STATUS_STYLE.OK}`}>
      {label}
    </span>
  );
}

function GroupBlock({ block, onClick }) {
  return (
    <button
      type="button"
      data-testid={GRAAMAM_INVENTORY.groupBlock(block.group)}
      onClick={() => onClick(block.group)}
      className="text-left rounded-2xl bg-surface-container-lowest dark:bg-[#121212] border border-surface-variant/70 dark:border-white/5 shadow-warm-sm p-6 hover:shadow-warm hover:border-primary-container/50 transition-all"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="w-12 h-12 rounded-full bg-primary-fixed/40 dark:bg-white/10 flex items-center justify-center text-primary-container dark:text-primary-fixed-dim">
          <Icon name={block.icon} className="text-[24px]" />
        </div>
        {block.low_count > 0 ? (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-1 rounded-full bg-terracotta-error/15 text-terracotta-error">
            <Icon name="warning" className="text-[13px]" /> {block.low_count} low
          </span>
        ) : null}
      </div>
      <h3 className="font-headline font-bold text-headline-sm text-on-surface dark:text-white">{block.label}</h3>
      <p className="text-body-sm text-on-surface-variant dark:text-outline-variant mt-1">{block.desc}</p>
      <p className="mt-4 font-display font-bold text-headline-md text-on-surface dark:text-white">{block.item_count}<span className="text-body-sm font-body text-outline ml-1.5">items</span></p>
    </button>
  );
}

function UpdateStockDialog({ open, items, onClose, onSubmit, saving, title, submitLabel, requirePrice }) {
  const [sku, setSku] = useState("");
  const [qty, setQty] = useState("");
  const [price, setPrice] = useState("");
  const [note, setNote] = useState("");

  useEffect(() => { if (open) { setSku(items[0]?.sku || ""); setQty(""); setPrice(""); setNote(""); } }, [open, items]);

  if (!open) return null;
  const current = items.find((i) => i.sku === sku);

  const submit = async (e) => {
    e.preventDefault();
    await onSubmit({ sku, qty: Number(qty || 0), unit_price: Number(price || 0), note, current });
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" data-testid={GRAAMAM_INVENTORY.updateStockDialog} role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-inverse-surface/60 dark:bg-black/70 backdrop-blur-sm" onClick={() => (saving ? null : onClose())} />
      <form onSubmit={submit} className="relative w-full max-w-md rounded-2xl bg-surface-container-lowest dark:bg-[#121212] border border-outline-variant/60 dark:border-white/10 shadow-warm-lg p-8">
        <div className="flex items-start justify-between mb-6 gap-4">
          <h3 className="font-headline font-bold text-headline-md text-on-surface dark:text-white">{title}</h3>
          <button type="button" aria-label="Close" onClick={onClose} className="text-outline hover:text-primary-container dark:hover:text-white p-2 -m-2 rounded-full transition-colors">
            <Icon name="close" className="text-[22px]" />
          </button>
        </div>
        <div className="flex flex-col gap-4">
          <label className="flex flex-col gap-1.5">
            <span className="font-label text-label-sm text-on-surface dark:text-outline-variant uppercase tracking-wider">Item</span>
            <select data-testid={GRAAMAM_INVENTORY.updateStockSku} value={sku} onChange={(e) => setSku(e.target.value)}
              className="font-body text-body-md rounded-lg border border-outline-variant/70 dark:border-white/10 bg-white dark:bg-black text-on-surface dark:text-white px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary">
              {items.map((i) => <option key={i.sku} value={i.sku}>{i.name} (current: {i.qty_on_hand} {i.unit})</option>)}
            </select>
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="font-label text-label-sm text-on-surface dark:text-outline-variant uppercase tracking-wider">{requirePrice ? "Quantity to add" : "New counted quantity"}</span>
            <input data-testid={GRAAMAM_INVENTORY.updateStockQty} type="number" min="0" step="0.01" value={qty} onChange={(e) => setQty(e.target.value)} required
              placeholder={current ? `${requirePrice ? "e.g. 50" : `currently ${current.qty_on_hand}`}` : "0"}
              className="font-body text-body-md rounded-lg border border-outline-variant/70 dark:border-white/10 bg-white dark:bg-black text-on-surface dark:text-white px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary" />
          </label>
          {requirePrice ? (
            <label className="flex flex-col gap-1.5">
              <span className="font-label text-label-sm text-on-surface dark:text-outline-variant uppercase tracking-wider">Unit Price ₹ (optional — records price history)</span>
              <input data-testid={GRAAMAM_INVENTORY.updateStockPrice} type="number" min="0" step="0.01" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="0.00"
                className="font-body text-body-md rounded-lg border border-outline-variant/70 dark:border-white/10 bg-white dark:bg-black text-on-surface dark:text-white px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary" />
            </label>
          ) : null}
          <label className="flex flex-col gap-1.5">
            <span className="font-label text-label-sm text-on-surface dark:text-outline-variant uppercase tracking-wider">Note (optional)</span>
            <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Reason for adjustment"
              className="font-body text-body-md rounded-lg border border-outline-variant/70 dark:border-white/10 bg-white dark:bg-black text-on-surface dark:text-white px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary" />
          </label>
          <button type="submit" disabled={saving} data-testid={GRAAMAM_INVENTORY.updateStockSubmit}
            className="w-full font-label font-bold text-label-md px-6 py-3 rounded-lg bg-primary-container text-on-primary hover:shadow-warm shadow-warm-sm disabled:opacity-70">
            {saving ? "Saving…" : submitLabel}
          </button>
        </div>
      </form>
    </div>
  );
}

export default function InventoryPage() {
  const { user } = useAuth();
  const [groups, setGroups] = useState([]);
  const [priceHistory, setPriceHistory] = useState([]);
  const [activeGroup, setActiveGroup] = useState(null);
  const [groupItems, setGroupItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialog, setDialog] = useState(null); // 'update' | 'reconcile' | null
  const [saving, setSaving] = useState(false);

  const canManageStock = user?.role === "admin" || user?.role === "stock";

  const loadGroups = useCallback(async () => {
    setLoading(true);
    try {
      const [g, ph] = await Promise.all([inventoryRepository.groups(), inventoryRepository.priceHistory()]);
      setGroups(Array.isArray(g) ? g : []);
      setPriceHistory(Array.isArray(ph) ? ph : []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadGroups(); }, [loadGroups]);

  const openGroup = async (group) => {
    setActiveGroup(group);
    const items = await inventoryRepository.groupItems(group);
    setGroupItems(Array.isArray(items) ? items : []);
  };

  const backToGroups = () => { setActiveGroup(null); setGroupItems([]); loadGroups(); };

  const activeMeta = groups.find((g) => g.group === activeGroup);

  const handleUpdateStock = async ({ sku, qty, unit_price, note }) => {
    setSaving(true);
    try {
      await inventoryRepository.updateStock({ sku, qty, unit_price, note });
      setDialog(null);
      await openGroup(activeGroup);
    } catch (e) {
      alert(`Could not update stock: ${e.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleReconcile = async ({ sku, qty, current }) => {
    setSaving(true);
    try {
      const delta = qty - (current?.qty_on_hand ?? 0);
      await inventoryRepository.adjust(sku, delta);
      setDialog(null);
      await openGroup(activeGroup);
    } catch (e) {
      alert(`Could not reconcile stock: ${e.message}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <AppShell topBarTitle="Inventory">
      <div data-testid={GRAAMAM_INVENTORY.page}>
        <PageHeader title="Inventory" subtitle="Finished goods and raw materials — one shared stock ledger. Amounts in ₹ INR." />

        {!activeGroup ? (
          <>
            {loading ? (
              <div className="py-16 text-center text-on-surface-variant dark:text-outline-variant font-body text-body-md">Loading…</div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-10">
                {groups.map((b) => <GroupBlock key={b.group} block={b} onClick={openGroup} />)}
              </div>
            )}

            <div className="rounded-2xl bg-surface-container-lowest dark:bg-[#121212] border border-surface-variant/70 dark:border-white/5 shadow-warm overflow-hidden">
              <div className="px-6 py-4 border-b border-surface-variant dark:border-white/10">
                <h3 className="font-headline font-semibold text-headline-sm text-on-surface dark:text-white">Recent Price Records</h3>
              </div>
              <table className="w-full text-left">
                <thead>
                  <tr className="text-outline uppercase text-label-sm tracking-wider">
                    <th className="py-3 px-6">Material</th>
                    <th className="py-3 px-6">Qty Received</th>
                    <th className="py-3 px-6">Unit Price</th>
                    <th className="py-3 px-6">Total</th>
                    <th className="py-3 px-6">Vendor</th>
                    <th className="py-3 px-6">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-variant/70 dark:divide-white/5">
                  {priceHistory.length === 0 ? (
                    <tr><td colSpan={6} className="py-10 text-center text-outline">No price records yet — appears here once Procurement receives a purchase.</td></tr>
                  ) : priceHistory.map((p) => (
                    <tr key={p.id}>
                      <td className="py-3 px-6 font-semibold text-on-surface dark:text-white">{p.name}</td>
                      <td className="py-3 px-6 text-on-surface-variant dark:text-outline-variant">{formatQty(p.qty)}</td>
                      <td className="py-3 px-6 text-on-surface-variant dark:text-outline-variant">{formatCurrency(p.unit_price)}</td>
                      <td className="py-3 px-6 font-semibold text-on-surface dark:text-white">{formatCurrency(p.total)}</td>
                      <td className="py-3 px-6 text-on-surface-variant dark:text-outline-variant">{p.note || "-"}</td>
                      <td className="py-3 px-6 text-on-surface-variant dark:text-outline-variant whitespace-nowrap">{formatDateTimeIST(p.date)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        ) : (
          <>
            <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
              <button type="button" data-testid={GRAAMAM_INVENTORY.backToGroups} onClick={backToGroups}
                className="font-label font-bold text-body-sm text-on-surface-variant dark:text-outline-variant hover:text-primary-container dark:hover:text-white inline-flex items-center gap-1.5">
                <Icon name="arrow_back" className="text-[18px]" /> All Categories
              </button>
              <div className="flex items-center gap-2">
                {canManageStock ? (
                  <>
                    <button type="button" data-testid={GRAAMAM_INVENTORY.updateStockButton} onClick={() => setDialog("update")}
                      className="font-label font-bold text-body-sm px-4 py-2 rounded-lg bg-primary-container text-on-primary shadow-warm-sm inline-flex items-center gap-2">
                      <Icon name="add" className="text-[16px]" /> Update Stock
                    </button>
                    <button type="button" data-testid={GRAAMAM_INVENTORY.reconcileButton} onClick={() => setDialog("reconcile")}
                      className="font-label font-bold text-body-sm px-4 py-2 rounded-lg bg-surface-container dark:bg-white/5 border border-outline-variant/70 dark:border-white/10 text-on-surface dark:text-white hover:bg-surface-container-high inline-flex items-center gap-2">
                      <Icon name="fact_check" className="text-[16px]" /> Stock Reconciliation
                    </button>
                  </>
                ) : null}
              </div>
            </div>
            <h3 className="font-headline font-bold text-headline-md text-on-surface dark:text-white mb-1">{activeMeta?.label || activeGroup}</h3>
            <p className="text-body-sm text-on-surface-variant dark:text-outline-variant mb-5">{activeMeta?.desc}</p>

            <div data-testid={GRAAMAM_INVENTORY.groupTable} className="rounded-2xl bg-surface-container-lowest dark:bg-[#121212] border border-surface-variant/70 dark:border-white/5 shadow-warm overflow-hidden">
              <table className="w-full text-left">
                <thead>
                  <tr className="text-outline uppercase text-label-sm tracking-wider border-b border-surface-variant dark:border-white/10">
                    <th className="py-4 px-6">Item</th>
                    <th className="py-4 px-6">Qty</th>
                    <th className="py-4 px-6">Unit</th>
                    <th className="py-4 px-6">Min Stock</th>
                    <th className="py-4 px-6">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-variant/70 dark:divide-white/5">
                  {groupItems.length === 0 ? (
                    <tr><td colSpan={5} className="py-12 text-center text-outline">No items in this category.</td></tr>
                  ) : groupItems.map((it) => (
                    <tr key={it.sku} data-testid={GRAAMAM_INVENTORY.groupRow(it.sku)} className="hover:bg-surface-container-low dark:hover:bg-white/5 transition-colors">
                      <td className="py-4 px-6 font-semibold text-on-surface dark:text-white">{it.name}</td>
                      <td className={`py-4 px-6 font-bold ${it.status_label !== "OK" ? "text-terracotta-error" : "text-on-surface dark:text-white"}`}>{formatQty(it.qty_on_hand)}</td>
                      <td className="py-4 px-6 text-on-surface-variant dark:text-outline-variant">{it.unit}</td>
                      <td className="py-4 px-6 text-on-surface-variant dark:text-outline-variant">{formatQty(it.reorder_level)}</td>
                      <td className="py-4 px-6"><StatusBadge label={it.status_label} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      <UpdateStockDialog
        open={dialog === "update"} items={groupItems} onClose={() => setDialog(null)} onSubmit={handleUpdateStock} saving={saving}
        title="+ Update Stock" submitLabel="Add Stock" requirePrice
      />
      <UpdateStockDialog
        open={dialog === "reconcile"} items={groupItems} onClose={() => setDialog(null)} onSubmit={handleReconcile} saving={saving}
        title="Stock Reconciliation" submitLabel="Save Corrected Count" requirePrice={false}
      />
    </AppShell>
  );
}
