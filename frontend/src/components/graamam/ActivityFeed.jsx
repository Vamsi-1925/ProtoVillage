import React from "react";
import Icon from "@/components/graamam/Icon";
import { formatTimeAgo } from "@/lib/formatters";

/**
 * ActivityFeed — vertical event stream used on Dashboard.
 * Items: { icon, headline, details, when (ISO), accent (primary|tertiary|success) }
 */
export default function ActivityFeed({ items = [], loading, error }) {
  return (
    <div className="bg-surface-container-lowest dark:bg-[#121212] rounded-2xl border border-surface-variant/70 dark:border-white/5 shadow-warm-sm p-6 flex flex-col gap-4 max-h-[560px] overflow-hidden">
      <h3 className="font-headline font-semibold text-headline-sm text-on-surface dark:text-white">Recent Activity</h3>
      <div className="flex-1 overflow-y-auto pr-1">
        {loading ? (
          <div className="flex items-center gap-2 text-on-surface-variant">
            <span className="w-2 h-2 rounded-full bg-primary-container animate-pulse" />
            <span className="text-body-sm">Loading activity…</span>
          </div>
        ) : error ? (
          <div className="text-error text-body-sm">{error.message || "Could not load activity"}</div>
        ) : items.length === 0 ? (
          <div className="text-outline text-body-sm">No recent activity.</div>
        ) : (
          <ul className="relative">
            <span className="absolute left-4 top-2 bottom-2 w-px bg-surface-variant dark:bg-white/10" />
            {items.map((it, idx) => {
              const accent = it.accent || "primary";
              const dot = {
                primary: "bg-primary-fixed text-on-primary-fixed-variant",
                tertiary: "bg-tertiary-fixed-dim text-on-tertiary-fixed",
                success: "bg-olive-success/15 text-olive-success",
              }[accent] || "bg-primary-fixed text-on-primary-fixed-variant";
              return (
                <li key={idx} className="relative pl-12 py-3">
                  <span className={`absolute left-0 top-2 w-9 h-9 rounded-full flex items-center justify-center ${dot}`}>
                    <Icon name={it.icon || "info"} className="text-[18px]" />
                  </span>
                  <div className="font-label font-bold text-body-md text-on-surface dark:text-white">{it.headline}</div>
                  {it.details ? (
                    <p className="text-body-sm text-on-surface-variant dark:text-outline-variant mt-0.5">{it.details}</p>
                  ) : null}
                  <div className="text-[11px] text-outline uppercase tracking-wider mt-1">{formatTimeAgo(it.when)}</div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
