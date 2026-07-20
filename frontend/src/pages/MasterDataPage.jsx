import React, { useCallback, useEffect, useState } from "react";
import AppShell from "@/components/graamam/AppShell";
import PageHeader from "@/components/graamam/PageHeader";
import SearchInput from "@/components/graamam/SearchInput";
import SlideOver from "@/components/graamam/SlideOver";
import Icon from "@/components/graamam/Icon";
import { formatCurrency } from "@/lib/formatters";

const API = ((typeof process !== "undefined" && process.env && process.env.REACT_APP_BACKEND_URL) || "") + "/api";
const TABS = [
  { key: "products",   label: "Products",     icon: "inventory_2" },
  { key: "b2b",        label: "B2B Customers", icon: "business" },
  { key: "b2c",        label: "B2C Customers", icon: "person" },
  { key: "costing",    label: "Costing",       icon: "calculate" },
  { key: "recipes",    label: "Recipes",       icon: "science" },
];

const inputCls = "font-body text-body-md rounded-lg border border-outline-variant/70 dark:border-white/10 bg-white dark:bg-black text-on-surface dark:text-white px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary w-full";
const labelCls = "font-label text-label-sm text-on-surface dark:text-outline-variant uppercase tracking-wider";

const emptyIngredient = () => ({ item: "", qty: "", cost_per_kg: "" });

function RecipeFormDrawer({ open, onClose, onSubmit, onDelete, saving, recipe, products, rawMaterials }) {
  const [productKey, setProductKey] = useState("");
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [batchOutput, setBatchOutput] = useState(1000);
  const [conversion, setConversion] = useState(0.6);
  const [ingredients, setIngredients] = useState([emptyIngredient()]);
  const [err, setErr] = useState(null);

  const isEdit = !!recipe;

  useEffect(() => {
    if (!open) return;
    setErr(null);
    if (recipe) {
      setProductKey(recipe.name);
      setName(recipe.name || "");
      setCategory(recipe.category || "");
      setBatchOutput(recipe.batch_output ?? 1000);
      setConversion(recipe.conversion ?? 0.6);
      const rows = (recipe.ingredients || []).map((i) => ({ item: i.item, qty: i.qty, cost_per_kg: i.cost_per_kg }));
      setIngredients(rows.length ? rows : [emptyIngredient()]);
    } else {
      setProductKey(""); setName(""); setCategory("");
      setBatchOutput(1000); setConversion(0.6);
      setIngredients([emptyIngredient()]);
    }
  }, [open, recipe]);

  const onPickProduct = (productName) => {
    setProductKey(productName);
    setName(productName);
    const p = products.find((x) => x.name === productName);
    if (p) setCategory(p.category || "");
  };

  const updateIngredient = (i, patch) => setIngredients((prev) => prev.map((row, idx) => (idx === i ? { ...row, ...patch } : row)));
  const addIngredient = () => setIngredients((prev) => [...prev, emptyIngredient()]);
  const removeIngredient = (i) => setIngredients((prev) => (prev.length <= 1 ? prev : prev.filter((_, idx) => idx !== i)));

  const submit = async (e) => {
    e.preventDefault();
    if (!name.trim()) return setErr("Pick a product first.");
    const rows = ingredients
      .filter((r) => r.item && Number(r.qty) > 0)
      .map((r) => {
        const mat = rawMaterials.find((m) => m.name === r.item);
        return { item: r.item, qty: Number(r.qty), cost_per_kg: r.cost_per_kg !== "" ? Number(r.cost_per_kg) : (mat?.unit_price_inr || 0) };
      });
    if (!rows.length) return setErr("Add at least one ingredient with a quantity.");
    setErr(null);
    try {
      await onSubmit({ name: name.trim(), category: category.trim(), conversion: Number(conversion) || 1, batch_output: Number(batchOutput) || 1, ingredients: rows }, recipe?.name);
    } catch (e2) {
      setErr(e2.message || "Could not save recipe.");
    }
  };

  const usedItems = new Set(ingredients.map((r) => r.item).filter(Boolean));

  return (
    <SlideOver
      open={open}
      onClose={onClose}
      title={isEdit ? `Edit Recipe — ${recipe?.name}` : "Add Recipe"}
      subtitle="Linked to a product BY NAME — this is what Production reads to work out raw-material needs."
      footer={
        <>
          {isEdit ? (
            <button type="button" onClick={() => onDelete(recipe.name)} disabled={saving} data-testid="graamam-recipe-delete"
              className="font-label font-bold text-body-md px-5 py-2.5 rounded-lg text-error hover:bg-error-container/30 mr-auto">
              Delete
            </button>
          ) : null}
          <button type="button" onClick={onClose} disabled={saving} className="font-label font-bold text-body-md px-5 py-2.5 rounded-lg text-on-surface-variant dark:text-outline-variant hover:bg-surface-container dark:hover:bg-white/10">Cancel</button>
          <button type="submit" form="recipe-form" disabled={saving} data-testid="graamam-recipe-save" className="font-label font-bold text-body-md px-6 py-2.5 rounded-lg bg-primary-container text-on-primary hover:shadow-warm shadow-warm-sm inline-flex items-center gap-2">
            <Icon name="save" className="text-[18px]" />{saving ? "Saving…" : "Save Recipe"}
          </button>
        </>
      }
    >
      <form id="recipe-form" onSubmit={submit} className="flex flex-col gap-5">
        <label className="flex flex-col gap-1.5">
          <span className={labelCls}>Product</span>
          <select data-testid="graamam-recipe-product" value={productKey} onChange={(e) => onPickProduct(e.target.value)} className={inputCls}>
            <option value="">Select a product…</option>
            {products.map((p) => <option key={p.name} value={p.name}>{p.name}</option>)}
          </select>
        </label>
        <label className="flex flex-col gap-1.5">
          <span className={labelCls}>Category</span>
          <input value={category} onChange={(e) => setCategory(e.target.value)} className={inputCls} placeholder="e.g. Snacks" />
        </label>
        <div className="grid grid-cols-2 gap-4">
          <label className="flex flex-col gap-1.5">
            <span className={labelCls}>Batch Output (units)</span>
            <input type="number" min="1" data-testid="graamam-recipe-batch-output" value={batchOutput} onChange={(e) => setBatchOutput(e.target.value)} className={inputCls} />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className={labelCls}>Conversion (0–1)</span>
            <input type="number" min="0.01" max="1" step="0.01" data-testid="graamam-recipe-conversion" value={conversion} onChange={(e) => setConversion(e.target.value)} className={inputCls} />
          </label>
        </div>

        <div className="flex items-center justify-between mt-2 pb-1 border-b border-outline-variant/40 dark:border-white/10">
          <span className={labelCls}>Ingredients (per full batch)</span>
          <button type="button" data-testid="graamam-recipe-add-ingredient" onClick={addIngredient} className="font-label font-bold text-body-sm px-3 py-1.5 rounded-lg bg-surface-container dark:bg-white/10 text-on-surface dark:text-white hover:bg-surface-container-high inline-flex items-center gap-1.5">
            <Icon name="add" className="text-[16px]" /> Add Ingredient
          </button>
        </div>
        <div className="grid grid-cols-[2fr_1fr_1fr_36px] gap-2 text-[10px] font-label font-bold uppercase tracking-wider text-outline">
          <div>Raw Material</div><div>Qty (kg)</div><div>Cost/Kg ₹</div><div />
        </div>
        <div className="flex flex-col gap-2">
          {ingredients.map((row, i) => {
            const opts = rawMaterials.filter((m) => m.name === row.item || !usedItems.has(m.name));
            return (
              <div key={i} data-testid={`graamam-recipe-ingredient-row-${i}`} className="grid grid-cols-[2fr_1fr_1fr_36px] gap-2 items-center">
                <select
                  data-testid={`graamam-recipe-ingredient-item-${i}`}
                  value={row.item}
                  onChange={(e) => {
                    const mat = rawMaterials.find((m) => m.name === e.target.value);
                    updateIngredient(i, { item: e.target.value, cost_per_kg: row.cost_per_kg || mat?.unit_price_inr || "" });
                  }}
                  className={inputCls}
                >
                  <option value="">Select material</option>
                  {opts.map((m) => <option key={m.name} value={m.name}>{m.name}</option>)}
                </select>
                <input type="number" min="0" step="0.01" placeholder="0" value={row.qty} data-testid={`graamam-recipe-ingredient-qty-${i}`} onChange={(e) => updateIngredient(i, { qty: e.target.value })} className={inputCls} />
                <input type="number" min="0" step="0.01" placeholder="0" value={row.cost_per_kg} onChange={(e) => updateIngredient(i, { cost_per_kg: e.target.value })} className={inputCls} />
                <button type="button" data-testid={`graamam-recipe-ingredient-remove-${i}`} onClick={() => removeIngredient(i)} disabled={ingredients.length <= 1}
                  className="h-[42px] rounded-lg text-outline hover:text-error hover:bg-error-container/40 disabled:opacity-40 flex items-center justify-center transition-colors">
                  <Icon name="close" className="text-[16px]" />
                </button>
              </div>
            );
          })}
        </div>
        {err ? <div className="text-body-sm text-error" data-testid="graamam-recipe-form-error">{err}</div> : null}
      </form>
    </SlideOver>
  );
}

export default function MasterDataPage() {
  const [tab, setTab] = useState("products");
  const [q, setQ] = useState("");
  const [data, setData] = useState([]);
  const [company, setCompany] = useState(null);
  const [summary, setSummary] = useState({});
  const [products, setProducts] = useState([]);
  const [rawMaterials, setRawMaterials] = useState([]);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingRecipe, setEditingRecipe] = useState(null);
  const [saving, setSaving] = useState(false);

  const refreshSummary = useCallback(() => {
    fetch(`${API}/graamam/master/summary`).then((r) => r.json()).then(setSummary);
  }, []);

  useEffect(() => {
    fetch(`${API}/graamam/master/company`).then((r) => r.json()).then(setCompany);
    refreshSummary();
  }, [refreshSummary]);

  const loadRecipeRefData = useCallback(() => {
    fetch(`${API}/graamam/master/products`).then((r) => r.json()).then((list) => {
      const seen = new Set();
      const distinct = [];
      (list || []).forEach((p) => { if (!seen.has(p.name)) { seen.add(p.name); distinct.push(p); } });
      setProducts(distinct);
    });
    fetch(`${API}/graamam/inventory/groups/raw`).then((r) => r.json()).then((list) => setRawMaterials(Array.isArray(list) ? list : []));
  }, []);

  useEffect(() => {
    const url = tab === "products" ? `${API}/graamam/master/products${q ? `?q=${encodeURIComponent(q)}` : ""}` :
                tab === "b2b"      ? `${API}/graamam/master/customers/b2b` :
                tab === "b2c"      ? `${API}/graamam/master/customers/b2c${q ? `?q=${encodeURIComponent(q)}` : ""}` :
                tab === "recipes"  ? `${API}/graamam/master/recipes` :
                                     `${API}/graamam/master/costing`;
    fetch(url).then(r => r.json()).then(setData);
    if (tab === "recipes") loadRecipeRefData();
  }, [tab, q, loadRecipeRefData]);

  const openAddRecipe = () => { setEditingRecipe(null); setDrawerOpen(true); };
  const openEditRecipe = (r) => { setEditingRecipe(r); setDrawerOpen(true); };
  const closeDrawer = () => { if (!saving) { setDrawerOpen(false); setEditingRecipe(null); } };

  const reloadRecipes = () => {
    fetch(`${API}/graamam/master/recipes`).then((r) => r.json()).then(setData);
    refreshSummary();
  };

  const saveRecipe = async (payload, originalName) => {
    setSaving(true);
    try {
      const url = originalName ? `${API}/graamam/master/recipes/${encodeURIComponent(originalName)}` : `${API}/graamam/master/recipes`;
      const res = await fetch(url, { method: originalName ? "PUT" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      if (!res.ok) {
        const t = await res.json().catch(() => ({}));
        throw new Error(t.detail || "Save failed");
      }
      setDrawerOpen(false);
      setEditingRecipe(null);
      reloadRecipes();
    } finally {
      setSaving(false);
    }
  };

  const deleteRecipe = async (name) => {
    if (!window.confirm(`Delete the recipe for "${name}"? Production will no longer find raw-material needs for this product.`)) return;
    setSaving(true);
    try {
      await fetch(`${API}/graamam/master/recipes/${encodeURIComponent(name)}`, { method: "DELETE" });
      setDrawerOpen(false);
      setEditingRecipe(null);
      reloadRecipes();
    } finally {
      setSaving(false);
    }
  };

  return (
    <AppShell topBarTitle="Master Data">
      <div data-testid="graamam-masterdata-page">
        <PageHeader
          title="Master Data"
          subtitle="Source-of-truth catalog: Products, Customers, Rate Cards, Costing, Recipes."
          actionLabel={tab === "recipes" ? "Add Recipe" : undefined}
          actionIcon="add"
          actionTestId="graamam-recipe-add"
          onAction={tab === "recipes" ? openAddRecipe : undefined}
        />

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

        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
          {TABS.map((t) => (
            <button key={t.key} onClick={() => { setTab(t.key); setQ(""); }} className={[
              "rounded-2xl p-4 border transition-all flex items-center gap-3",
              tab === t.key ? "bg-primary-container text-on-primary border-primary-container shadow-warm-sm" : "bg-surface-container-lowest dark:bg-[#121212] border-surface-variant/70 dark:border-white/5 text-on-surface dark:text-white hover:shadow-warm-sm",
            ].join(" ")}>
              <Icon name={t.icon} className="text-[20px]" />
              <div className="text-left">
                <div className="font-label font-bold text-body-md">{t.label}</div>
                <div className="text-[11px] opacity-80">{t.key === "products" ? `${summary.products || 0} SKUs` : t.key === "b2b" ? `${summary.b2b_customers || 0} B2B` : t.key === "b2c" ? `${summary.b2c_customers || 0} B2C` : t.key === "recipes" ? `${summary.recipes || 0} recipes` : `${summary.costing || 0} rows`}</div>
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
            ) : tab === "recipes" ? (
              <table className="w-full text-left">
                <thead><tr className="text-outline uppercase text-label-sm tracking-wider border-b border-surface-variant dark:border-white/10">
                  <th className="py-3 px-6">Product</th><th className="py-3 px-6">Category</th><th className="py-3 px-6">Batch Output</th><th className="py-3 px-6">Conversion</th><th className="py-3 px-6">Ingredients</th><th className="py-3 px-6 text-right">Actions</th>
                </tr></thead>
                <tbody className="divide-y divide-surface-variant/70 dark:divide-white/5">
                  {(data || []).length === 0 ? (
                    <tr><td colSpan={6} className="py-12 text-center text-outline">No recipes yet.</td></tr>
                  ) : (data || []).map((r) => (
                    <tr key={r.name} data-testid={`graamam-recipe-row-${r.name}`} className="hover:bg-surface-container-low dark:hover:bg-white/5 transition-colors">
                      <td className="py-2.5 px-6 font-semibold text-on-surface dark:text-white">{r.name}</td>
                      <td className="py-2.5 px-6 text-on-surface-variant dark:text-outline-variant">{r.category || "—"}</td>
                      <td className="py-2.5 px-6 text-on-surface-variant dark:text-outline-variant">{r.batch_output}</td>
                      <td className="py-2.5 px-6 text-on-surface-variant dark:text-outline-variant">{r.conversion}</td>
                      <td className="py-2.5 px-6 text-on-surface-variant dark:text-outline-variant max-w-[320px] truncate">
                        {(r.ingredients || []).map((i) => `${i.item} (${i.qty}kg)`).join(", ") || "—"}
                      </td>
                      <td className="py-2.5 px-6 text-right">
                        <button type="button" data-testid={`graamam-recipe-edit-${r.name}`} onClick={() => openEditRecipe(r)} className="text-outline hover:text-primary-container dark:hover:text-white p-2 rounded-full hover:bg-surface-variant/50 dark:hover:bg-white/10 transition-colors">
                          <Icon name="edit" className="text-[18px]" />
                        </button>
                      </td>
                    </tr>
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

      <RecipeFormDrawer
        open={drawerOpen}
        onClose={closeDrawer}
        onSubmit={saveRecipe}
        onDelete={deleteRecipe}
        saving={saving}
        recipe={editingRecipe}
        products={products}
        rawMaterials={rawMaterials}
      />
    </AppShell>
  );
}
