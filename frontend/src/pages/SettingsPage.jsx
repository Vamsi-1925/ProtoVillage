import React from "react";
import AppShell from "@/components/graamam/AppShell";
import PageHeader from "@/components/graamam/PageHeader";
import Icon from "@/components/graamam/Icon";

export default function SettingsPage() {
  return (
    <AppShell topBarTitle="Settings">
      <PageHeader title="Settings" subtitle="Manage your Graamam Connect workspace preferences." />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {[
          { icon: "palette", title: "Appearance", body: "Light or OLED dark. Auto-follows your system if you don’t choose." },
          { icon: "language", title: "Language", body: "English (India). Kannada, Tamil, Telugu, Malayalam and Odia coming next." },
          { icon: "currency_rupee", title: "Currency & Locale", body: "₹ INR (en-IN). Dates and times in IST." },
          { icon: "badge", title: "GSTIN & Legal", body: "Add producer group GSTINs used on invoices and export docs." },
          { icon: "notifications", title: "Notifications", body: "WhatsApp and Email alerts for QC, low stock, dispatch." },
          { icon: "cloud_sync", title: "Data & Backup", body: "Firestore stand-in is enabled. Real Firebase available in the last phase." },
        ].map((c) => (
          <div key={c.title} className="rounded-2xl bg-surface-container-lowest dark:bg-[#121212] border border-surface-variant/70 dark:border-white/5 shadow-warm-sm p-6 flex gap-4">
            <div className="w-12 h-12 rounded-full bg-primary-fixed text-primary-container flex items-center justify-center"><Icon name={c.icon} className="text-[22px]" /></div>
            <div>
              <div className="font-headline font-semibold text-headline-sm text-on-surface dark:text-white">{c.title}</div>
              <p className="text-body-sm text-on-surface-variant dark:text-outline-variant mt-1">{c.body}</p>
            </div>
          </div>
        ))}
      </div>
    </AppShell>
  );
}
