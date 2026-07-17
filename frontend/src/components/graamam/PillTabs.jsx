import React from "react";
import { GRAAMAM_ORDERS } from "@/constants/testIds";

/**
 * PillTabs — filter chips.
 * @param {Array<{key:string,label:string,count?:number}>} tabs
 * @param {string} value active tab key
 * @param {(k:string)=>void} onChange
 */
export default function PillTabs({ tabs, value, onChange }) {
  return (
    <div
      role="tablist"
      data-testid={GRAAMAM_ORDERS.pillTabsRoot}
      className="flex items-center gap-3 mb-8 overflow-x-auto pb-2 scrollbar-hide"
    >
      {tabs.map((tab) => {
        const isActive = tab.key === value;
        return (
          <button
            key={tab.key}
            role="tab"
            type="button"
            aria-selected={isActive}
            data-testid={GRAAMAM_ORDERS.pillTab(tab.key)}
            onClick={() => onChange && onChange(tab.key)}
            className={[
              "font-label text-label-md px-6 py-2.5 rounded-full flex items-center gap-2 transition-all whitespace-nowrap",
              isActive
                ? "bg-primary-container text-on-primary shadow-warm-sm"
                : "bg-surface-container-lowest dark:bg-white/5 border border-outline-variant dark:border-white/10 text-on-surface-variant dark:text-outline-variant hover:border-primary-container hover:text-primary-container dark:hover:text-white",
            ].join(" ")}
          >
            {tab.label}
            {typeof tab.count === "number" ? (
              <span
                className={[
                  "text-[10px] font-bold px-2 py-0.5 rounded-full min-w-[22px] text-center",
                  isActive
                    ? "bg-on-primary text-primary-container"
                    : "bg-surface-container text-on-surface-variant dark:bg-white/10 dark:text-outline-variant",
                ].join(" ")}
              >
                {tab.count}
              </span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}
