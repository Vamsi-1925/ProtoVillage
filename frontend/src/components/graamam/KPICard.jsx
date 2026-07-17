import React from "react";
import Icon from "@/components/graamam/Icon";

/**
 * KPICard — a soft-corner card used across the Dashboard and Warehouse pages.
 * Renders a large numeric value, subtitle, optional trend, and an accent icon.
 */
export default function KPICard({
  icon = "eco",
  label,
  value,
  hint,
  trend,
  trendPositive = true,
  accent = "primary", // primary | secondary | tertiary | success
  testId,
}) {
  const iconWrap = {
    primary: "bg-primary-fixed text-on-primary-fixed-variant",
    secondary: "bg-secondary-container text-on-secondary-container",
    tertiary: "bg-tertiary-fixed-dim text-on-tertiary-fixed",
    success: "bg-olive-success/15 text-olive-success",
  }[accent] || "bg-primary-fixed text-on-primary-fixed-variant";
  return (
    <div
      data-testid={testId}
      className="relative rounded-2xl bg-surface-container-lowest dark:bg-[#121212] border border-surface-variant/70 dark:border-white/5 p-6 shadow-warm-sm overflow-hidden"
    >
      <div className="absolute -right-8 -top-8 w-32 h-32 rounded-full bg-primary-fixed/40 dark:bg-primary-fixed/10 blur-2xl pointer-events-none" />
      <div className="relative flex items-start justify-between gap-4">
        <div className={`w-12 h-12 rounded-full ${iconWrap} flex items-center justify-center`}>
          <Icon name={icon} className="text-[24px]" />
        </div>
        {trend ? (
          <span className={[
            "inline-flex items-center gap-1 text-[11px] font-bold px-2 py-1 rounded-full",
            trendPositive ? "bg-olive-success/15 text-olive-success" : "bg-terracotta-error/15 text-terracotta-error",
          ].join(" ")}
          >
            <Icon name={trendPositive ? "trending_up" : "trending_down"} className="text-[14px]" />
            {trend}
          </span>
        ) : null}
      </div>
      <p className="mt-6 text-body-sm text-on-surface-variant dark:text-outline-variant">{label}</p>
      <p className="mt-1 font-display font-bold text-headline-lg text-on-surface dark:text-white leading-none">{value}</p>
      {hint ? (
        <p className="mt-2 text-body-sm text-outline">{hint}</p>
      ) : null}
    </div>
  );
}
