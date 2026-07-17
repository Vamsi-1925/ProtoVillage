import React, { useEffect, useState } from "react";
import AppShell from "@/components/graamam/AppShell";
import PageHeader from "@/components/graamam/PageHeader";
import StatusPill from "@/components/graamam/StatusPill";
import Icon from "@/components/graamam/Icon";
import { formatOrderDate } from "@/lib/formatters";

const API = ((typeof process !== "undefined" && process.env && process.env.REACT_APP_BACKEND_URL) || "") + "/api";

export default function ApprovalsPage() {
  const [items, setItems] = useState([]);
  const [busy, setBusy] = useState(null);

  const load = () => fetch(`${API}/graamam/approvals`).then(r => r.json()).then(setItems);
  useEffect(() => { load(); }, []);

  const decide = async (id, decision) => {
    setBusy(id);
    try {
      await fetch(`${API}/graamam/approvals/${id}/decide`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ approved_by: "Graamam Lead", decision }),
      });
      load();
    } finally { setBusy(null); }
  };

  return (
    <AppShell topBarTitle="Approvals">
      <div data-testid="graamam-approvals-page">
        <PageHeader title="Approvals" subtitle="Stage-1 gate: Graamam Lead reviews purchase requests before Procurement raises the PO." />

        {items.length === 0 ? (
          <div className="rounded-2xl bg-surface-container-lowest dark:bg-[#121212] border border-surface-variant/70 dark:border-white/5 shadow-warm-sm p-10 text-center text-outline">
            <Icon name="task_alt" className="text-olive-success text-[36px]" />
            <div className="mt-2 font-headline text-headline-sm text-on-surface dark:text-white">All caught up</div>
            <p className="text-body-sm mt-1">No purchase requests awaiting your decision.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {items.map((r) => (
              <div key={r.request_id} className="rounded-2xl bg-surface-container-lowest dark:bg-[#121212] border border-surface-variant/70 dark:border-white/5 shadow-warm-sm p-6">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div>
                    <div className="text-outline uppercase text-label-sm tracking-wider">Request #{r.request_id}</div>
                    <div className="font-headline text-headline-sm text-on-surface dark:text-white mt-1">{r.material_name}</div>
                    <div className="text-body-sm text-on-surface-variant dark:text-outline-variant mt-1">Needed: {r.quantity} {r.unit} · Required by {formatOrderDate(r.required_by)}</div>
                  </div>
                  <StatusPill status={r.status} />
                </div>
                <div className="flex items-center justify-end gap-3">
                  <button disabled={busy === r.request_id} onClick={() => decide(r.request_id, "rejected")} className="font-label font-bold text-body-md px-5 py-2 rounded-lg bg-surface-container dark:bg-white/5 text-on-surface dark:text-white border border-outline-variant/70">Reject</button>
                  <button disabled={busy === r.request_id} onClick={() => decide(r.request_id, "approved")} className="font-label font-bold text-body-md px-5 py-2 rounded-lg bg-primary-container text-on-primary shadow-warm-sm inline-flex items-center gap-2"><Icon name="check" className="text-[16px]" /> Approve → Raise PO</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
