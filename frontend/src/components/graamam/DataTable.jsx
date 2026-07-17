import React from "react";
import Icon from "@/components/graamam/Icon";
import StatusPill from "@/components/graamam/StatusPill";
import { formatCurrency, formatOrderDate, initialsFrom } from "@/lib/formatters";
import { GRAAMAM_ORDERS } from "@/constants/testIds";

const COLUMNS = [
  { key: "order_id", label: "Order ID" },
  { key: "customer", label: "Customer" },
  { key: "items", label: "Items" },
  { key: "date", label: "Date" },
  { key: "total", label: "Total" },
  { key: "status", label: "Status" },
  { key: "action", label: "Action", align: "right" },
];

function CustomerCell({ customer }) {
  const name = customer?.name || "Unknown";
  const url = customer?.avatar_url;
  const inits = (customer?.initials || initialsFrom(name)).slice(0, 2).toUpperCase();
  return (
    <div className="flex items-center gap-3 min-w-0">
      <div className="w-8 h-8 rounded-full bg-surface-variant dark:bg-white/10 overflow-hidden flex items-center justify-center text-outline dark:text-outline-variant font-bold text-sm shrink-0">
        {url ? (
          <img
            alt={name}
            src={url}
            className="w-full h-full object-cover"
            onError={(e) => {
              e.currentTarget.style.display = "none";
            }}
          />
        ) : (
          <span>{inits}</span>
        )}
      </div>
      <span className="font-body text-body-md font-semibold text-on-surface dark:text-white truncate">
        {name}
      </span>
    </div>
  );
}

/**
 * DataTable — the Orders table container + rows.
 * Rows are expandable (chevron rotates + a details drawer opens beneath).
 */
export default function DataTable({
  orders,
  loading,
  error,
  expandedId,
  onToggleExpand,
  emptyLabel = "No orders yet",
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
                    "py-5 px-6 font-label text-label-sm text-outline uppercase tracking-wider",
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
                const isOpen = expandedId === o.order_id;
                return (
                  <React.Fragment key={o.order_id}>
                    <tr
                      data-testid={GRAAMAM_ORDERS.ordersTableRow(o.order_id)}
                      className="hover:bg-surface-container-low dark:hover:bg-white/5 transition-colors group cursor-pointer"
                      onClick={() => onToggleExpand && onToggleExpand(o.order_id)}
                    >
                      <td className="py-4 px-6">
                        <span className="font-mono text-sm bg-surface-container dark:bg-white/5 px-3 py-1 rounded-md text-on-surface dark:text-white font-semibold border border-outline-variant/30 dark:border-white/10">
                          #{o.order_id}
                        </span>
                      </td>
                      <td className="py-4 px-6">
                        <CustomerCell customer={o.customer} />
                      </td>
                      <td className="py-4 px-6 text-body-md text-on-surface-variant dark:text-outline-variant">
                        {o.items_summary || `${o.items_count} items`}
                      </td>
                      <td className="py-4 px-6 text-body-md text-on-surface-variant dark:text-outline-variant whitespace-nowrap">
                        {formatOrderDate(o.date)}
                      </td>
                      <td className="py-4 px-6 font-body font-semibold text-on-surface dark:text-white whitespace-nowrap">
                        {formatCurrency(o.total)}
                      </td>
                      <td className="py-4 px-6">
                        <StatusPill status={o.status} />
                      </td>
                      <td className="py-4 px-6 text-right">
                        <button
                          type="button"
                          aria-label={isOpen ? "Collapse row" : "Expand row"}
                          data-testid={GRAAMAM_ORDERS.ordersTableRowExpand(o.order_id)}
                          onClick={(e) => {
                            e.stopPropagation();
                            onToggleExpand && onToggleExpand(o.order_id);
                          }}
                          className="text-outline hover:text-primary-container dark:hover:text-white p-2 rounded-full hover:bg-surface-variant/50 dark:hover:bg-white/10 transition-colors"
                        >
                          <Icon
                            name="expand_more"
                            className={`text-[20px] transition-transform ${isOpen ? "rotate-180" : ""}`}
                          />
                        </button>
                      </td>
                    </tr>
                    {isOpen ? (
                      <tr className="bg-surface-container-low dark:bg-white/5">
                        <td colSpan={COLUMNS.length} className="px-6 py-5">
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
                            <div>
                              <div className="text-outline uppercase text-label-sm tracking-wider mb-1">Order</div>
                              <div className="font-semibold text-on-surface dark:text-white">#{o.order_id}</div>
                              <div className="text-on-surface-variant dark:text-outline-variant mt-1">
                                Placed {formatOrderDate(o.date)}
                              </div>
                            </div>
                            <div>
                              <div className="text-outline uppercase text-label-sm tracking-wider mb-1">Customer</div>
                              <div className="font-semibold text-on-surface dark:text-white">{o.customer?.name}</div>
                              <div className="text-on-surface-variant dark:text-outline-variant mt-1">
                                {o.items_summary || `${o.items_count} items`} · {formatCurrency(o.total)}
                              </div>
                            </div>
                            <div>
                              <div className="text-outline uppercase text-label-sm tracking-wider mb-1">Fulfillment</div>
                              <div className="mt-1">
                                <StatusPill status={o.status} />
                              </div>
                              <div className="text-on-surface-variant dark:text-outline-variant mt-2 text-xs">
                                Producer operations queue.
                              </div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    ) : null}
                  </React.Fragment>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
