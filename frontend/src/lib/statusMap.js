// Status meta — covers Orders, Batches, Production tokens, Procurement,
// Inventory, Producers. Colors follow DESIGN_SYSTEM.md / Stitch reference.

export const STATUS_ORDER = [
  "received",
  "warehouse_check",
  "ready_dispatch",
  "production_pending",
  "production_active",
  "procurement_pending",
  "dispatched",
  "closed",
];

const basePill = (bg, text, dot, dbg, dtext, ddot) => ({
  bg, text, dot, border: "border-transparent",
  darkBg: dbg || bg, darkText: dtext || text, darkDot: ddot || dot,
});

export const STATUS_META = {
  // ORDERS (v2 8-status flow)
  received: { key: "received", label: "Received", pillLabel: "Received",
    ...basePill("bg-tertiary-fixed-dim", "text-on-tertiary-fixed", "bg-on-tertiary-fixed",
      "dark:bg-tertiary-fixed-dim", "dark:text-on-tertiary-fixed", "dark:bg-on-tertiary-fixed") },
  warehouse_check: { key: "warehouse_check", label: "Warehouse Check", pillLabel: "Warehouse Check",
    ...basePill("bg-secondary-container", "text-on-secondary-container", "bg-on-secondary-container",
      "dark:bg-secondary-fixed", "dark:text-on-secondary-fixed", "dark:bg-on-secondary-fixed") },
  ready_dispatch: { key: "ready_dispatch", label: "Ready Dispatch", pillLabel: "Ready to Dispatch",
    ...basePill("bg-primary-fixed", "text-on-primary-fixed-variant", "bg-primary-container",
      "dark:bg-primary-fixed-dim", "dark:text-on-primary-fixed", "dark:bg-on-primary-fixed") },
  production_pending: { key: "production_pending", label: "Prod. Pending", pillLabel: "Production Pending",
    ...basePill("bg-tertiary-fixed", "text-on-tertiary-fixed-variant", "bg-tertiary-fixed-dim") },
  production_active: { key: "production_active", label: "Prod. Active", pillLabel: "Production Active",
    ...basePill("bg-tertiary-fixed-dim", "text-on-tertiary-fixed", "bg-on-tertiary-fixed") },
  procurement_pending: { key: "procurement_pending", label: "Proc. Pending", pillLabel: "Procurement Pending",
    ...basePill("bg-error-container", "text-on-error-container", "bg-on-error-container") },
  dispatched: { key: "dispatched", label: "Dispatched", pillLabel: "Dispatched",
    ...basePill("bg-primary-container", "text-on-primary", "bg-on-primary",
      "dark:bg-primary-fixed-dim", "dark:text-on-primary-fixed", "dark:bg-on-primary-fixed") },
  closed: { key: "closed", label: "Closed", pillLabel: "Closed",
    ...basePill("bg-primary", "text-on-primary", "bg-on-primary",
      "dark:bg-primary", "dark:text-on-primary", "dark:bg-on-primary") },

  // Legacy 4-status keys kept for any lingering references
  new: { key: "new", label: "New", pillLabel: "New",
    ...basePill("bg-tertiary-fixed-dim", "text-on-tertiary-fixed", "bg-on-tertiary-fixed") },
  packing: { key: "packing", label: "Packing", pillLabel: "Packing",
    ...basePill("bg-secondary-container", "text-on-secondary-container", "bg-on-secondary-container") },
  delivered: { key: "delivered", label: "Delivered", pillLabel: "Delivered",
    ...basePill("bg-primary", "text-on-primary", "bg-on-primary") },

  // BATCHES
  received: { key: "received", label: "Received", pillLabel: "Received",
    ...basePill("bg-surface-container-highest", "text-on-surface-variant", "bg-outline") },
  qc_pending: { key: "qc_pending", label: "QC Pending", pillLabel: "QC Pending",
    ...basePill("bg-secondary-container", "text-on-secondary-container", "bg-on-secondary-container") },
  qc_pass: { key: "qc_pass", label: "QC Passed", pillLabel: "QC Passed",
    ...basePill("bg-olive-success/20", "text-olive-success", "bg-olive-success",
      "dark:bg-olive-success/30", "dark:text-olive-success", "dark:bg-olive-success") },
  in_production: { key: "in_production", label: "In Production", pillLabel: "In Production",
    ...basePill("bg-tertiary-fixed-dim", "text-on-tertiary-fixed", "bg-on-tertiary-fixed") },
  done: { key: "done", label: "Done", pillLabel: "Done",
    ...basePill("bg-olive-success", "text-white", "bg-white",
      "dark:bg-olive-success", "dark:text-white", "dark:bg-white") },
  rejected: { key: "rejected", label: "Rejected", pillLabel: "Rejected",
    ...basePill("bg-error-container", "text-on-error-container", "bg-on-error-container") },

  // PRODUCTION TOKENS
  pending: { key: "pending", label: "Pending", pillLabel: "Pending",
    ...basePill("bg-tertiary-fixed-dim", "text-on-tertiary-fixed", "bg-on-tertiary-fixed") },
  active: { key: "active", label: "Active", pillLabel: "Active",
    ...basePill("bg-secondary-container", "text-on-secondary-container", "bg-on-secondary-container") },
  complete: { key: "complete", label: "Complete", pillLabel: "Complete",
    ...basePill("bg-olive-success", "text-white", "bg-white",
      "dark:bg-olive-success", "dark:text-white", "dark:bg-white") },
  cancelled: { key: "cancelled", label: "Cancelled", pillLabel: "Cancelled",
    ...basePill("bg-error-container", "text-on-error-container", "bg-on-error-container") },

  // PROCUREMENT
  pending_approval: { key: "pending_approval", label: "Pending", pillLabel: "Pending Approval",
    ...basePill("bg-tertiary-fixed-dim", "text-on-tertiary-fixed", "bg-on-tertiary-fixed") },
  po_raised: { key: "po_raised", label: "PO Raised", pillLabel: "PO Raised",
    ...basePill("bg-secondary-container", "text-on-secondary-container", "bg-on-secondary-container") },
  received_qc: { key: "received_qc", label: "QC Passed", pillLabel: "QC Passed",
    ...basePill("bg-olive-success/20", "text-olive-success", "bg-olive-success") },
  closed: { key: "closed", label: "Closed", pillLabel: "Closed",
    ...basePill("bg-surface-container-highest", "text-on-surface-variant", "bg-outline") },

  // INVENTORY (status labels)
  in_stock: { key: "in_stock", label: "In Stock", pillLabel: "In Stock",
    ...basePill("bg-olive-success", "text-white", "bg-white") },
  adequate: { key: "adequate", label: "Adequate", pillLabel: "Adequate",
    ...basePill("bg-tertiary-fixed-dim", "text-on-tertiary-fixed", "bg-on-tertiary-fixed") },
  low_stock: { key: "low_stock", label: "Low Stock", pillLabel: "Low Stock",
    ...basePill("bg-terracotta-error", "text-white", "bg-white",
      "dark:bg-terracotta-error", "dark:text-white", "dark:bg-white") },
  critical: { key: "critical", label: "Critical", pillLabel: "Critical",
    ...basePill("bg-terracotta-error", "text-white", "bg-white") },

  // PRODUCERS
  on_track: { key: "on_track", label: "On Track", pillLabel: "On Track",
    ...basePill("bg-olive-success/15", "text-olive-success", "bg-olive-success") },
  growing: { key: "growing", label: "Growing", pillLabel: "Growing",
    ...basePill("bg-secondary-container", "text-on-secondary-container", "bg-on-secondary-container") },
  review_required: { key: "review_required", label: "Review Req.", pillLabel: "Review Req.",
    ...basePill("bg-tertiary-fixed-dim", "text-on-tertiary-fixed", "bg-on-tertiary-fixed") },
  processing: { key: "processing", label: "Processing", pillLabel: "Processing",
    ...basePill("bg-primary-fixed", "text-on-primary-fixed-variant", "bg-primary-container") },
  paused: { key: "paused", label: "Paused", pillLabel: "Paused",
    ...basePill("bg-surface-container-highest", "text-on-surface-variant", "bg-outline") },

  // MATERIALS (production slip)
  sufficient: { key: "sufficient", label: "Sufficient", pillLabel: "Sufficient",
    ...basePill("bg-olive-success/15", "text-olive-success", "bg-olive-success") },
  shortage: { key: "shortage", label: "Shortage", pillLabel: "Shortage",
    ...basePill("bg-terracotta-error", "text-white", "bg-white") },
};

export function getStatusMeta(status) {
  return STATUS_META[status] || STATUS_META.new;
}
