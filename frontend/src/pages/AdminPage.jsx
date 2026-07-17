import React, { useEffect, useState } from "react";
import AppShell from "@/components/graamam/AppShell";
import PageHeader from "@/components/graamam/PageHeader";
import Icon from "@/components/graamam/Icon";

const API = ((typeof process !== "undefined" && process.env && process.env.REACT_APP_BACKEND_URL) || "") + "/api";

const ROLE_ACCENT = {
  admin: "bg-primary-container text-on-primary",
  lead: "bg-tertiary-fixed-dim text-on-tertiary-fixed",
  accounts: "bg-secondary-container text-on-secondary-container",
  procurement: "bg-primary-fixed text-primary-container",
  warehouse: "bg-olive-success/15 text-olive-success",
  production: "bg-tertiary-fixed/60 text-on-tertiary-fixed",
  stock: "bg-surface-container text-on-surface-variant",
};

export default function AdminPage() {
  const [users, setUsers] = useState([]);
  const [dels, setDels] = useState([]);
  useEffect(() => {
    fetch(`${API}/graamam/admin/users`).then(r => r.json()).then(setUsers);
    fetch(`${API}/graamam/admin/delete-requests`).then(r => r.json()).then(setDels);
  }, []);

  return (
    <AppShell topBarTitle="Admin Panel">
      <div data-testid="graamam-admin-page">
        <PageHeader title="Admin Panel" subtitle="Users, roles, and audit-worthy actions across the platform." />

        <section className="mb-8">
          <h3 className="font-headline font-semibold text-headline-sm text-on-surface dark:text-white mb-3">Users & Roles</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {users.map((u) => (
              <div key={u.username} className="rounded-2xl bg-surface-container-lowest dark:bg-[#121212] border border-surface-variant/70 dark:border-white/5 shadow-warm-sm p-5 flex items-center gap-4">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold ${ROLE_ACCENT[u.role] || "bg-primary-fixed text-primary-container"}`}>{u.name?.slice(0, 2).toUpperCase()}</div>
                <div className="flex-1">
                  <div className="font-headline font-bold text-headline-sm text-on-surface dark:text-white">{u.name}</div>
                  <div className="text-body-sm text-outline font-mono">{u.username}</div>
                </div>
                <span className={`text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wider ${ROLE_ACCENT[u.role] || "bg-primary-fixed text-primary-container"}`}>{u.role}</span>
              </div>
            ))}
          </div>
        </section>

        <section>
          <h3 className="font-headline font-semibold text-headline-sm text-on-surface dark:text-white mb-3">Delete Requests</h3>
          <div className="rounded-2xl bg-surface-container-lowest dark:bg-[#121212] border border-surface-variant/70 dark:border-white/5 shadow-warm p-6">
            {dels.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-8 text-outline text-center">
                <Icon name="delete_forever" className="text-[28px]" />
                <div className="font-headline text-headline-sm text-on-surface dark:text-white">Clean slate</div>
                <p className="text-body-sm">No delete tickets awaiting review.</p>
              </div>
            ) : (
              <table className="w-full text-left">
                <thead>
                  <tr className="text-outline uppercase text-label-sm tracking-wider"><th className="py-3">Ticket</th><th>Requester</th><th>Reason</th><th>Actions</th></tr>
                </thead>
                <tbody>
                  {dels.map((d) => (
                    <tr key={d.ticket_id}><td className="py-3 font-mono text-sm">{d.ticket_id}</td><td>{d.requester}</td><td>{d.reason}</td><td><button className="font-label font-bold text-body-sm px-4 py-2 rounded-lg bg-primary-container text-on-primary">Review</button></td></tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </section>
      </div>
    </AppShell>
  );
}
