import React from "react";
import { getStatusMeta } from "@/lib/statusMap";

/**
 * StatusPill — colored, rounded pill with a leading dot.
 * Status keys must match `STATUS_META` in `lib/statusMap.js`.
 */
export default function StatusPill({ status }) {
  const meta = getStatusMeta(status);
  return (
    <span
      className={[
        "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-label-sm font-label whitespace-nowrap",
        meta.bg,
        meta.text,
        meta.darkBg,
        meta.darkText,
      ].join(" ")}
    >
      <span className={["w-1.5 h-1.5 rounded-full", meta.dot, meta.darkDot].join(" ")} />
      {meta.pillLabel}
    </span>
  );
}
