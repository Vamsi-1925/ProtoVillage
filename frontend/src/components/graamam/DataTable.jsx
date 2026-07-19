import React from "react";
import Icon from "@/components/graamam/Icon";
import StatusPill from "@/components/graamam/StatusPill";
import { formatOrderDate, formatQty } from "@/lib/formatters";
import { GRAAMAM_ORDERS } from "@/constants/testIds";

const TERMINAL = ["dispatched", "closed", "cancelled"];

const COLUMNS = [
  { key: "order_id", label: "Order Token" },
  { key: "type", label: "Type" },
  { key: "customer", label: "Customer" },
  { key: "items", label: "Items" },
  { key: "qty", label: "Qty" },
  { key: "status", label: "Status" },
  { key: "tokens", label: "Tokens" },
  { key: "date", label: "Date" },
  { key: "actions", label: "Actions", align: "right" },
];

function TypeBadge({ type }) {
  if (!type) return <span className="text-outline">-</span>;
  const isB2B = type === "b2b";
  return (
    <span className={["inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-label font-bold uppercase tracking-wide",
      isB2B ? "bg-secondary-container text-on-secondary-container" : "bg-tertiary-fixed-dim text-on-tertiary-fixed"].join(" ")}>
      {type.toUpperCase()}
    </span>
  );
}

function TokenChips({ order }) {
  const tokens = [order.wh_token, order.prod_token, order.proc_token].filter(Boolean);
  if (!tokens.length) return <span className="text-outline">-</span>;
  return (
    <div className="flex flex-wrap gap-1">
      {tokens.map((t) => (
        <span key={t} className="font-mono text-[11px] bg-surface-container dark:bg-white/10 px-2 py-0.5 rounded-md border border-outline-variant/30 dark:border-white/10 text-on-surface-variant dark:text-outline-variant">
          {t}
        </span>
      ))}
    </div>
  );
}

/**
 * DataTable — Orders list, functional replica of graamam_v2 pgOrders():
 * Order Token | Type | Customer | Items | Qty | Status | Tokens | Date | Actions
 */
export default function DataTable({
  orders,
  loading,
  error,
  canEditCancel,
  isAdmin,
  onEdit,
  onCancel,
  onDiscuss,
  onHistory,
  emptyLabel = "No orders yet. Create one to start the pipeline.",
}) {
  return (
    <div
      data-testid={GRAAMAM_ORDERS.ordersTable}
      className="bg-surface-container-lowest dark:bg-[#121212] rounded-xl shadow-warm border border-surface-variant/70 dark:border-white/5 overflow-hidden"
    >
      <div className="w-full overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-surface-container-lowest dark:bg-transparent border-b border-surface-variant dark:border-white/10">
              {COLUMNS.map((col) => (
                <th
                  key={col.key}
                  className={[
                    "py-5 px-6 font-label text-label-sm text-outline uppercase tracking-wider whitespace-nowrap",
                    col.align === "right" ? "text-right" : "",
                  ].join(" ")}
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-variant/70 dark:divide-white/5">
            {loading && (orders?.length ?? 0) === 0 ? (
              <tr data-testid={GRAAMAM_ORDERS.ordersLoading}>
                <td colSpan={COLUMNS.length} className="py-16 px-6 text-center text-on-surface-variant dark:text-outline-variant">
                  <div className="inline-flex items-center gap-3">
                    <span className="w-3 h-3 rounded-full bg-primary-container animate-pulse" />
                    <span className="font-body text-body-md">Loading orders…</span>
                  </div>
                </td>
              </tr>
            ) : error && (orders?.length ?? 0) === 0 ? (
              <tr data-testid={GRAAMAM_ORDERS.ordersError}>
                <td colSpan={COLUMNS.length} className="py-16 px-6 text-center text-error">
                  <div className="font-body text-body-md">Could not load orders. {error?.message || ""}</div>
                </td>
              </tr>
            ) : (orders?.length ?? 0) === 0 ? (
              <tr data-testid={GRAAMAM_ORDERS.ordersEmpty}>
                <td colSpan={COLUMNS.length} className="py-16 px-6 text-center text-on-surface-variant dark:text-outline-variant">
                  <div className="flex flex-col items-center gap-2">
                    <Icon name="inbox" className="text-[28px] text-outline" />
                    <span className="font-body text-body-md">{emptyLabel}</span>
                  </div>
                </td>
              </tr>
            ) : (
              orders.map((o) => {
                const terminal = TERMINAL.includes(o.status);
                const showEdit = canEditCancel && !terminal;
                const showCancel = isAdmin && !terminal;
                const showDiscuss = !["dispatched", "cancelled"].includes(o.status);
                return (
                  <tr
                    key={o.order_id}
                    data-testid={GRAAMAM_ORDERS.ordersTableRow(o.order_id)}
                    className="hover:bg-surface-container-low dark:hover:bg-white/5 transition-colors"
                  >
                    <td className="py-4 px-6">
                      <span className="font-mono text-sm bg-surface-container dark:bg-white/5 px-3 py-1 rounded-md text-on-surface dark:text-white font-semibold border border-outline-variant/30 dark:border-white/10 whitespace-nowrap">
                        {o.order_id}
                      </span>
                    </td>
                    <td className="py-4 px-6"><TypeBadge type={o.order_type} /></td>
                    <td className="py-4 px-6">
                      <span className="font-body font-semibold text-on-surface dark:text-white">{o.customer?.name || "Unknown"}</span>
                    </td>
                    <td className="py-4 px-6 text-body-md text-on-surface-variant dark:text-outline-variant max-w-[220px] truncate">
                      {o.items_summary || `${o.items_count} items`}
                    </td>
                    <td className="py-4 px-6 text-body-md text-on-surface-variant dark:text-outline-variant whitespace-nowrap">
                      {formatQty(o.items_count)}
                    </td>
                    <td className="py-4 px-6">
                      <StatusPill status={o.status} />
                    </td>
                    <td className="py-4 px-6"><TokenChips order={o} /></td>
                    <td className="py-4 px-6 text-body-md text-on-surface-variant dark:text-outline-variant whitespace-nowrap">
                      {formatOrderDate(o.date)}
                    </td>
                    <td className="py-4 px-6 text-right">
                      <div className="inline-flex items-center gap-1 flex-wrap justify-end">
                        <button
                          type="button"
                          onClick={() => onHistory && onHistory(o)}
                          data-testid={GRAAMAM_ORDERS.orderRowHistory(o.order_id)}
                          className="font-label font-bold text-[12px] px-2.5 py-1.5 rounded-lg text-on-surface-variant dark:text-outline-variant hover:bg-surface-container dark:hover:bg-white/10 transition-colors"
                        >
                          History
                        </button>
                        {showEdit ? (
                          <button
                            type="button"
                            onClick={() => onEdit && onEdit(o)}
                            data-testid={GRAAMAM_ORDERS.orderRowEdit(o.order_id)}
                            className="font-label font-bold text-[12px] px-2.5 py-1.5 rounded-lg text-primary-container dark:text-primary-fixed-dim hover:bg-primary-fixed/40 dark:hover:bg-white/10 transition-colors"
                          >
                            Edit
                          </button>
                        ) : null}
                        {showCancel ? (
                          <button
                            type="button"
                            onClick={() => onCancel && onCancel(o)}
                            data-testid={GRAAMAM_ORDERS.orderRowCancel(o.order_id)}
                            className="font-label font-bold text-[12px] px-2.5 py-1.5 rounded-lg text-error hover:bg-error-container/40 transition-colors"
                          >
                            Cancel
                          </button>
                        ) : null}
                        {showDiscuss ? (
                          <button
                            type="button"
                            onClick={() => onDiscuss && onDiscuss(o)}
                            data-testid={GRAAMAM_ORDERS.orderRowDiscuss(o.order_id)}
                            title="Discuss this order"
                            className="text-on-surface-variant dark:text-outline-variant hover:text-primary-container dark:hover:text-white p-1.5 rounded-full hover:bg-surface-variant/50 dark:hover:bg-white/10 transition-colors"
                          >
                            <Icon name="forum" className="text-[18px]" />
                          </button>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
