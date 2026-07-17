// Status meta — the single source of truth for how a status renders across
// the UI: label, dot/text/bg color tokens for light mode, and dark variants.
// Colors come from DESIGN_SYSTEM.md and the Stitch reference exactly.

export const STATUS_ORDER = ["new", "packing", "dispatched", "delivered"];

export const STATUS_META = {
  new: {
    key: "new",
    label: "New",
    pillLabel: "New Order",
    // Light
    bg: "bg-tertiary-fixed-dim",
    text: "text-on-tertiary-fixed",
    dot: "bg-on-tertiary-fixed",
    border: "border-transparent",
    // Dark
    darkBg: "dark:bg-tertiary-fixed-dim",
    darkText: "dark:text-on-tertiary-fixed",
    darkDot: "dark:bg-on-tertiary-fixed",
  },
  packing: {
    key: "packing",
    label: "Packing",
    pillLabel: "Packing",
    bg: "bg-secondary-container",
    text: "text-on-secondary-container",
    dot: "bg-on-secondary-container",
    border: "border-secondary-container",
    darkBg: "dark:bg-secondary-fixed",
    darkText: "dark:text-on-secondary-fixed",
    darkDot: "dark:bg-on-secondary-fixed",
  },
  dispatched: {
    key: "dispatched",
    label: "Dispatched",
    pillLabel: "Dispatched",
    bg: "bg-primary-fixed",
    text: "text-on-primary-fixed-variant",
    dot: "bg-primary-container",
    border: "border-transparent",
    darkBg: "dark:bg-primary-fixed-dim",
    darkText: "dark:text-on-primary-fixed",
    darkDot: "dark:bg-on-primary-fixed",
  },
  delivered: {
    key: "delivered",
    label: "Delivered",
    pillLabel: "Delivered",
    bg: "bg-primary",
    text: "text-on-primary",
    dot: "bg-on-primary",
    border: "border-transparent",
    darkBg: "dark:bg-primary",
    darkText: "dark:text-on-primary",
    darkDot: "dark:bg-on-primary",
  },
};

export function getStatusMeta(status) {
  return STATUS_META[status] || STATUS_META.new;
}
