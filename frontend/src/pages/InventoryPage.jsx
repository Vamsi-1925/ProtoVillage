import React, { useEffect, useMemo, useState } from "react";
import AppShell from "@/components/graamam/AppShell";
import PageHeader from "@/components/graamam/PageHeader";
import SearchInput from "@/components/graamam/SearchInput";
import SlideOver from "@/components/graamam/SlideOver";
import StatusPill from "@/components/graamam/StatusPill";
import Icon from "@/components/graamam/Icon";
import { inventoryRepository, batchesRepository, producersRepository, ordersRepository } from "@/lib/firestoreClient";
import { GRAAMAM_INVENTORY } from "@/constants/testIds";
import { formatCurrency, formatOrderDate } from "@/lib/formatters";

const STATUS_FILTERS = [
  { key: "all", label: "All" },
  { key: "in_stock", label: "In Stock" },
  { key: "adequate", label: "Adequate" },
  { key: "low_stock", label: "Low Stock" },
];

const CATEGORIES = ["Spices", "Oils", "Grains", "Preserves", "Herbs"];

export default function InventoryPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeStatus, setActiveStatus] = useState("all");
  const [activeCats, setActiveCats] = useState(new Set(CATEGORIES));
  const [query, setQuery] = useState("");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [producers, setProducers] = useState([]);
  const [ordersCounts, setOrdersCounts] = useState({});

  const load = () => {
    setLoading(true);
    inventoryRepository.list().then((data) => setItems(Array.isArray(data) ? data : [])).finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, []);
  useEffect(() => {
    producersRepository.list().then(setProducers).catch(() => {});
    ordersRepository.counts().then(setOrdersCounts).catch(() => {});
  }, []);  const filtered = useMemo(() => {
    return items.filter((it) => {
      if (activeStatus !== "all") {
        if (activeStatus === "low_stock" && !(it.status === "low_stock" || it.status === "critical")) return false;
        if (activeStatus !== "low_stock" && it.status !== activeStatus) return false;
      }
      if (activeCats.size > 0 && !activeCats.has(it.category)) return false;
      if (query) {
        const q = query.toLowerCase();
        if (!it.name.toLowerCase().includes(q) && !it.sku.toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [items, activeStatus, activeCats, query]);

  const toggleCat = (c) => {
    setActiveCats((prev) => {
      const next = new Set(prev);
      if (next.has(c)) next.delete(c); else next.add(c);
      return next;
    });
  };

  return (
    <AppShell badges={{ orders: ordersCounts.received || 0 }}>
      <div data-testid={GRAAMAM_INVENTORY.page}>
        <PageHeader
          title="Inventory Management"
          subtitle="Manage current stock levels, categories, and reorder alerts. Prices in ₹ INR."
          actionLabel="Add item / New batch"
          actionIcon="add"
          actionTestId={GRAAMAM_INVENTORY.addItemButton}
          onAction={() => setDrawerOpen(true)}
        />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-8">
          <div className="rounded-2xl bg-surface-container-lowest dark:bg-[#121212] border border-surface-variant/70 dark:border-white/5 shadow-warm-sm p-5">
            <div className="text-label-sm text-outline uppercase tracking-wider mb-3">Status</div>
            <div className="flex flex-wrap gap-2">
              {STATUS_FILTERS.map((s) => (
                <button
                  key={s.key}
                  data-testid={GRAAMAM_INVENTORY.statusPill(s.key)}
                  onClick={() => setActiveStatus(s.key)}
                  className={[
                    "font-label text-body-sm px-4 py-1.5 rounded-full border transition-colors",
                    activeStatus === s.key
                      ? "bg-primary-container border-primary-container text-on-primary"
                      : "bg-surface-container-lowest dark:bg-white/5 border-outline-variant/70 text-on-surface-variant dark:text-outline-variant hover:border-primary-container",
                  ].join(" ")}
                >
                  {s.key === "low_stock" ? <span className="inline-block w-1.5 h-1.5 rounded-full bg-terracotta-error mr-2 align-middle" /> : null}
                  {s.label}
                </button>
              ))}
            </div>
          </div>
          <div className="rounded-2xl bg-surface-container-lowest dark:bg-[#121212] border border-surface-variant/70 dark:border-white/5 shadow-warm-sm p-5">
            <div className="text-label-sm text-outline uppercase tracking-wider mb-3">Category</div>
            <div className="flex flex-wrap gap-x-6 gap-y-2">
              {CATEGORIES.map((c) => (
                <label key={c} data-testid={GRAAMAM_INVENTORY.categoryToggle(c.toLowerCase())} className="inline-flex items-center gap-2 cursor-pointer text-body-md text-on-surface dark:text-white">
                  <input type="checkbox" checked={activeCats.has(c)} onChange={() => toggleCat(c)} className="w-4 h-4 rounded-sm border-outline text-primary focus:ring-primary" />
                  <span>{c}</span>
                </label>
              ))}
            </div>
          </div>
          <SearchInput
            value={query}
            onChange={setQuery}
            placeholder="Search product name or SKU…"
            testId={GRAAMAM_INVENTORY.searchInput}
            className="self-stretch"
          />
        </div>

        <div className="bg-surface-container-lowest dark:bg-[#121212] rounded-2xl border border-surface-variant/70 dark:border-white/5 shadow-warm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-surface-variant dark:border-white/10 text-outline uppercase text-label-sm tracking-wider">
                  <th className="py-4 px-6">Product</th>
                  <th className="py-4 px-6">Category</th>
                  <th className="py-4 px-6">Qty on Hand</th>
                  <th className="py-4 px-6">Reorder Lvl</th>
                  <th className="py-4 px-6">Unit Price</th>
                  <th className="py-4 px-6">Status</th>
                  <th className="py-4 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-variant/70 dark:divide-white/5">
                {loading ? (
                  <tr><td colSpan={7} className="py-16 text-center text-outline">Loading inventory…</td></tr>
                ) : filtered.length === 0 ? (
                  <tr><td colSpan={7} className="py-16 text-center text-outline">No items match your filters.</td></tr>
                ) : filtered.map((it) => (
                  <tr key={it.sku} data-testid={GRAAMAM_INVENTORY.row(it.sku)} className="hover:bg-surface-container-low dark:hover:bg-white/5 transition-colors">
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-primary-fixed/40 dark:bg-white/10 flex items-center justify-center text-primary-container dark:text-primary-fixed-dim">
                          <Icon name={it.icon || "eco"} className="text-[20px]" />
                        </div>
                        <div>
                          <div className="font-semibold text-on-surface dark:text-white">{it.name}</div>
                          <div className="text-body-sm text-outline">SKU: {it.sku}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-body-md text-on-surface-variant dark:text-outline-variant">{it.category}</td>
                    <td className={`py-4 px-6 font-bold ${it.status === "low_stock" || it.status === "critical" ? "text-terracotta-error" : "text-on-surface dark:text-white"}`}>
                      {it.qty_on_hand} <span className="text-outline text-body-sm font-normal">{it.unit}</span>
                    </td>
                    <td className="py-4 px-6 text-on-surface-variant dark:text-outline-variant">{it.reorder_level} {it.unit}</td>
                    <td className="py-4 px-6 text-on-surface dark:text-white">{formatCurrency(it.unit_price_inr)}</td>
                    <td className="py-4 px-6"><StatusPill status={it.status} /></td>
                    <td className="py-4 px-6 text-right">
                      <button className="text-outline hover:text-primary-container dark:hover:text-white p-2 rounded-full hover:bg-surface-variant/50 dark:hover:bg-white/10 transition-colors">
                        <Icon name="edit" className="text-[18px]" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="px-6 py-3 border-t border-surface-variant dark:border-white/10 text-body-sm text-on-surface-variant dark:text-outline-variant flex justify-between">
            <span>Showing {filtered.length} of {items.length} entries</span>
            <span className="text-outline">Data source: Firestore stand-in via /api/graamam/inventory</span>
          </div>
        </div>

        <NewBatchDrawer
          open={drawerOpen}
          onClose={() => (saving ? null : setDrawerOpen(false))}
          saving={saving}
          producers={producers}
          inventory={items}
          onSubmit={async (payload) => {
            setSaving(true);
            try {
              await batchesRepository.create(payload);
              setDrawerOpen(false);
              load();
            } finally { setSaving(false); }
          }}
        />
      </div>
    </AppShell>
  );
}

function NewBatchDrawer({ open, onClose, onSubmit, saving, producers, inventory }) {
  const [product, setProduct] = useState("");
  const [producer, setProducer] = useState("");
  const [qty, setQty] = useState("");
  const [unit, setUnit] = useState("kg");
  const [date, setDate] = useState("");
  const [notes, setNotes] = useState("");
  const [err, setErr] = useState(null);

  useEffect(() => {
    if (open) {
      setProduct(""); setProducer(""); setQty(""); setUnit("kg"); setDate(""); setNotes(""); setErr(null);
    }
  }, [open]);

  const submit = async (e) => {
    e.preventDefault();
    if (!product) return setErr("Please pick a product");
    if (!producer) return setErr("Please pick a producer");
    const n = Number(qty);
    if (!isFinite(n) || n <= 0) return setErr("Quantity must be greater than 0");
    const p = producers.find((x) => x.producer_id === producer);
    const inv = inventory.find((x) => x.sku === product);
    await onSubmit({
      product_name: inv?.name || product,
      product_sku: inv?.sku,
      producer_id: p?.producer_id,
      producer_name: p?.name,
      village: p?.village,
      quantity: n,
      unit,
      collection_date: date || undefined,
      notes,
    });
  };

  return (
    <SlideOver
      open={open}
      onClose={onClose}
      title="New Batch"
      subtitle="Record fresh produce from our network partners."
      footer={
        <>
          <button type="button" onClick={onClose} data-testid="graamam-batch-cancel" className="font-label font-bold text-body-md px-5 py-2.5 rounded-lg text-on-surface-variant dark:text-outline-variant hover:bg-surface-container dark:hover:bg-white/10">Cancel</button>
          <button type="submit" form="batch-form" disabled={saving} data-testid="graamam-batch-save" className="font-label font-bold text-body-md px-6 py-2.5 rounded-lg bg-primary-container text-on-primary hover:shadow-warm shadow-warm-sm inline-flex items-center gap-2">
            <Icon name="save" className="text-[18px]" />{saving ? "Saving…" : "Save Batch"}
          </button>
        </>
      }
    >
      <form id="batch-form" onSubmit={submit} className="flex flex-col gap-5">
        <div className="flex flex-col gap-1">
          <label className="font-label text-label-sm text-on-surface dark:text-outline-variant uppercase tracking-wider">Product Selection</label>
          <select data-testid="graamam-batch-product" value={product} onChange={(e) => setProduct(e.target.value)} className="font-body text-body-md rounded-lg border border-outline-variant/70 dark:border-white/10 bg-white dark:bg-black text-on-surface dark:text-white px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary">
            <option value="">Choose a variety…</option>
            {inventory.map((i) => <option key={i.sku} value={i.sku}>{i.name}</option>)}
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label className="font-label text-label-sm text-on-surface dark:text-outline-variant uppercase tracking-wider">Village / Producer</label>
          <select data-testid="graamam-batch-producer" value={producer} onChange={(e) => setProducer(e.target.value)} className="font-body text-body-md rounded-lg border border-outline-variant/70 dark:border-white/10 bg-white dark:bg-black text-on-surface dark:text-white px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary">
            <option value="">Select producer source…</option>
            {producers.map((p) => <option key={p.producer_id} value={p.producer_id}>{p.name} · {p.village}</option>)}
          </select>
        </div>
        <div>
          <label className="font-label text-label-sm text-on-surface dark:text-outline-variant uppercase tracking-wider block mb-1">Quantity Received</label>
          <div className="flex items-stretch gap-3">
            <input type="number" step="0.01" value={qty} onChange={(e) => setQty(e.target.value)} data-testid="graamam-batch-qty" placeholder="0.00" className="flex-1 font-body text-body-md rounded-lg border border-outline-variant/70 dark:border-white/10 bg-white dark:bg-black text-on-surface dark:text-white px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary" />
            <div className="inline-flex items-center gap-1 rounded-lg bg-surface-container dark:bg-white/5 p-1 border border-outline-variant/60 dark:border-white/10">
              {["kg", "g", "L", "pcs"].map((u) => (
                <button key={u} type="button" onClick={() => setUnit(u)} className={["px-3 py-1.5 rounded-md text-body-sm font-label font-bold", unit === u ? "bg-primary-container text-on-primary" : "text-on-surface-variant dark:text-outline-variant"].join(" ")}>{u}</button>
              ))}
            </div>
          </div>
        </div>
        <div className="flex flex-col gap-1">
          <label className="font-label text-label-sm text-on-surface dark:text-outline-variant uppercase tracking-wider">Collection Date (IST)</label>
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} data-testid="graamam-batch-date" className="font-body text-body-md rounded-lg border border-outline-variant/70 dark:border-white/10 bg-white dark:bg-black text-on-surface dark:text-white px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary" />
        </div>
        <div className="flex flex-col gap-1">
          <label className="font-label text-label-sm text-on-surface dark:text-outline-variant uppercase tracking-wider">Notes & Observations</label>
          <textarea rows={4} value={notes} onChange={(e) => setNotes(e.target.value)} data-testid="graamam-batch-notes" placeholder="Describe quality, packing condition, or special handling…" className="font-body text-body-md rounded-lg border border-outline-variant/70 dark:border-white/10 bg-white dark:bg-black text-on-surface dark:text-white px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary" />
        </div>
        {err ? <div className="text-body-sm text-error">{err}</div> : null}
      </form>
    </SlideOver>
  );
}
