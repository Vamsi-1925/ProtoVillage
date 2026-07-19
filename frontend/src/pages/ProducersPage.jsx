import React, { useEffect, useMemo, useState } from "react";
import AppShell from "@/components/graamam/AppShell";
import PageHeader from "@/components/graamam/PageHeader";
import SearchInput from "@/components/graamam/SearchInput";
import StatusPill from "@/components/graamam/StatusPill";
import Icon from "@/components/graamam/Icon";
import SlideOver from "@/components/graamam/SlideOver";
import { producersRepository, ordersRepository } from "@/lib/firestoreClient";
import { GRAAMAM_PRODUCERS } from "@/constants/testIds";

export default function ProducersPage() {
  const [producers, setProducers] = useState([]);
  const [villages, setVillages] = useState(["all"]);
  const [village, setVillage] = useState("all");
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);
  const [drawer, setDrawer] = useState(false);
  const [saving, setSaving] = useState(false);
  const [ordersCounts, setOrdersCounts] = useState({});

  const load = async () => {
    setLoading(true);
    try {
      const [list, vs] = await Promise.all([
        producersRepository.list({ village, q }),
        producersRepository.villages(),
      ]);
      setProducers(list); setVillages(["all", ...vs]);
    } finally { setLoading(false); }
  };
  useEffect(() => { load(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [village]);
  useEffect(() => {
    ordersRepository.counts().then(setOrdersCounts).catch(() => {});
  }, []);

  const filtered = useMemo(() => {
    if (!q) return producers;
    const s = q.toLowerCase();
    return producers.filter((p) => p.name.toLowerCase().includes(s) || p.village?.toLowerCase().includes(s) || p.craft?.toLowerCase().includes(s));
  }, [producers, q]);

  return (
    <AppShell badges={{ orders: ordersCounts.received || 0 }} topBarTitle="Producers">
      <div data-testid={GRAAMAM_PRODUCERS.page}>
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
          <div>
            <h2 className="font-headline font-bold text-display-lg text-on-surface dark:text-white">Producers</h2>
            <p className="text-body-lg text-on-surface-variant dark:text-outline-variant mt-1">The network behind every Graamam batch.</p>
          </div>
          <button data-testid={GRAAMAM_PRODUCERS.registerButton} onClick={() => setDrawer(true)} className="self-start md:self-auto inline-flex items-center gap-2 bg-primary-container text-on-primary font-label font-bold text-label-md px-6 py-3 rounded-lg shadow-warm-sm hover:shadow-warm transition-all">
            <Icon name="person_add" className="text-[18px]" /> Register Producer
          </button>
        </div>

        <div className="flex flex-col md:flex-row gap-3 mb-8">
          <SearchInput value={q} onChange={setQ} placeholder="Search producers by name, village, or craft…" testId={GRAAMAM_PRODUCERS.searchInput} className="flex-1" />
          <select data-testid={GRAAMAM_PRODUCERS.villageSelect} value={village} onChange={(e) => setVillage(e.target.value)} className="font-body text-body-md rounded-full border border-outline-variant/70 dark:border-white/10 bg-surface-container-lowest dark:bg-white/5 text-on-surface dark:text-white px-5 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary min-w-[200px]">
            {villages.map((v) => <option key={v} value={v}>{v === "all" ? "All Villages" : v}</option>)}
          </select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {loading ? (
            <div className="col-span-full text-center py-16 text-outline">Loading producers…</div>
          ) : filtered.length === 0 ? (
            <div className="col-span-full text-center py-16 text-outline">No producers match your search.</div>
          ) : filtered.map((p) => (
            <article key={p.producer_id} data-testid={GRAAMAM_PRODUCERS.card(p.producer_id)} className="rounded-2xl bg-surface-container-lowest dark:bg-[#121212] border border-surface-variant/70 dark:border-white/5 shadow-warm-sm p-5 flex flex-col gap-3">
              <div className="flex items-start justify-between gap-3">
                <div className="w-20 h-20 rounded-2xl overflow-hidden bg-surface-variant dark:bg-white/10 shrink-0">
                  {p.photo_url ? <img alt={p.name} src={p.photo_url} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-outline"><Icon name="person" className="text-[36px]" /></div>}
                </div>
                <div className="text-right">
                  <div className="text-label-sm text-outline uppercase tracking-wider">Quality Score</div>
                  <div className="font-headline font-bold text-headline-md text-primary-container dark:text-primary-fixed-dim">{p.quality_score?.toFixed(1)}</div>
                </div>
              </div>
              <div>
                <h3 className="font-headline font-bold text-headline-sm text-on-surface dark:text-white">{p.name}</h3>
                <div className="flex items-center gap-1.5 text-body-sm text-on-surface-variant dark:text-outline-variant mt-1">
                  <Icon name="location_on" className="text-[16px]" /> {p.village}, {p.state}
                </div>
                <p className="text-body-sm text-outline mt-1">{p.craft}</p>
                <div className="flex flex-wrap gap-1.5 mt-3">
                  {(p.tags || []).map((t, i) => (
                    <span key={i} className={["font-label text-label-sm px-3 py-1 rounded-full", i === 0 ? "bg-secondary-container text-on-secondary-container" : "bg-tertiary-fixed/50 text-on-tertiary-fixed"].join(" ")}>{t}</span>
                  ))}
                </div>
              </div>
              <div className="border-t border-surface-variant dark:border-white/10 pt-3 mt-1 flex items-center justify-between">
                <div>
                  <div className="text-label-sm text-outline uppercase tracking-wider">Active Batches</div>
                  <div className="font-body font-bold text-on-surface dark:text-white">{p.active_batches} {p.unit}</div>
                </div>
                <div className="text-right">
                  <div className="text-label-sm text-outline uppercase tracking-wider">Status</div>
                  <StatusPill status={p.status} />
                </div>
              </div>
            </article>
          ))}

          <button onClick={() => setDrawer(true)} className="rounded-2xl border-2 border-dashed border-outline-variant/60 dark:border-white/10 hover:border-primary-container p-6 flex flex-col items-center justify-center gap-3 text-on-surface-variant dark:text-outline-variant hover:text-primary-container transition-colors min-h-[220px]">
            <div className="w-14 h-14 rounded-full bg-primary-fixed/40 dark:bg-white/10 flex items-center justify-center">
              <Icon name="add" className="text-[28px] text-primary-container dark:text-primary-fixed-dim" />
            </div>
            <div className="font-headline font-semibold text-headline-sm">Add New Producer</div>
            <p className="text-body-sm text-center max-w-xs">Scale the Graamam network by onboarding verified local artisans.</p>
          </button>
        </div>

        <RegisterDrawer
          open={drawer}
          onClose={() => (saving ? null : setDrawer(false))}
          saving={saving}
          onSubmit={async (payload) => {
            setSaving(true);
            try { await producersRepository.create(payload); setDrawer(false); await load(); } finally { setSaving(false); }
          }}
        />
      </div>
    </AppShell>
  );
}

function RegisterDrawer({ open, onClose, onSubmit, saving }) {
  const [name, setName] = useState("");
  const [village, setVillage] = useState("");
  const [state, setState] = useState("Karnataka");
  const [craft, setCraft] = useState("");
  const [phone, setPhone] = useState("");
  const [tags, setTags] = useState("");
  const [err, setErr] = useState(null);
  useEffect(() => { if (open) { setName(""); setVillage(""); setState("Karnataka"); setCraft(""); setPhone(""); setTags(""); setErr(null); } }, [open]);

  const submit = async (e) => {
    e.preventDefault();
    if (!name.trim()) return setErr("Producer name is required");
    if (!village.trim()) return setErr("Village is required");
    await onSubmit({
      name: name.trim(),
      village: village.trim(),
      state,
      craft: craft.trim(),
      tags: tags.split(",").map((t) => t.trim()).filter(Boolean),
      phone: phone.trim(),
    });
  };

  const INDIAN_STATES = ["Karnataka", "Kerala", "Odisha", "Tamil Nadu", "Andhra Pradesh", "Maharashtra", "Gujarat", "Rajasthan", "West Bengal", "Assam"];

  return (
    <SlideOver open={open} onClose={onClose} title="Register Producer" subtitle="Onboard a verified artisan into the Graamam network."
      footer={<>
        <button type="button" onClick={onClose} className="font-label font-bold text-body-md px-5 py-2.5 rounded-lg text-on-surface-variant dark:text-outline-variant hover:bg-surface-container dark:hover:bg-white/10">Cancel</button>
        <button type="submit" form="prod-form" disabled={saving} className="font-label font-bold text-body-md px-6 py-2.5 rounded-lg bg-primary-container text-on-primary hover:shadow-warm shadow-warm-sm inline-flex items-center gap-2"><Icon name="person_add" className="text-[18px]" /> {saving ? "Saving…" : "Register"}</button>
      </>}
    >
      <form id="prod-form" onSubmit={submit} className="flex flex-col gap-5">
        {[
          ["Producer Name", <input key="n" value={name} onChange={(e) => setName(e.target.value)} placeholder="Demo Producer One" className="font-body text-body-md rounded-lg border border-outline-variant/70 dark:border-white/10 bg-white dark:bg-black text-on-surface dark:text-white px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary" />],
          ["Village", <input key="v" value={village} onChange={(e) => setVillage(e.target.value)} placeholder="Demo Village One" className="font-body text-body-md rounded-lg border border-outline-variant/70 dark:border-white/10 bg-white dark:bg-black text-on-surface dark:text-white px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary" />],
          ["State", <select key="s" value={state} onChange={(e) => setState(e.target.value)} className="font-body text-body-md rounded-lg border border-outline-variant/70 dark:border-white/10 bg-white dark:bg-black text-on-surface dark:text-white px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary">{INDIAN_STATES.map((s) => <option key={s} value={s}>{s}</option>)}</select>],
          ["Craft", <input key="c" value={craft} onChange={(e) => setCraft(e.target.value)} placeholder="e.g. Cold-pressed coconut oil" className="font-body text-body-md rounded-lg border border-outline-variant/70 dark:border-white/10 bg-white dark:bg-black text-on-surface dark:text-white px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary" />],
          ["Phone", <input key="p" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+91 90000 00000" className="font-body text-body-md rounded-lg border border-outline-variant/70 dark:border-white/10 bg-white dark:bg-black text-on-surface dark:text-white px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary" />],
          ["Tags (comma-separated)", <input key="t" value={tags} onChange={(e) => setTags(e.target.value)} placeholder="Spices, Organic" className="font-body text-body-md rounded-lg border border-outline-variant/70 dark:border-white/10 bg-white dark:bg-black text-on-surface dark:text-white px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary" />],
        ].map(([lbl, ctrl], i) => (
          <div key={i} className="flex flex-col gap-1">
            <label className="font-label text-label-sm text-on-surface dark:text-outline-variant uppercase tracking-wider">{lbl}</label>
            {ctrl}
          </div>
        ))}
        {err ? <div className="text-body-sm text-error">{err}</div> : null}
      </form>
    </SlideOver>
  );
}
