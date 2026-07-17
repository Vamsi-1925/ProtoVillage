import React, { useEffect, useState } from "react";
import Icon from "@/components/graamam/Icon";
import { STATUS_ORDER } from "@/lib/statusMap";
import { GRAAMAM_ORDERS } from "@/constants/testIds";

/**
 * CreateOrderDialog — minimal modal to write a new order.
 * Native `<dialog>`-shaped implementation for zero-dep interop; visually
 * matches the Modern Humanist system with rounded card + backdrop.
 */
const STATUS_OPTIONS = STATUS_ORDER;

export default function CreateOrderDialog({ open, onClose, onSubmit, submitting }) {
  const [customerName, setCustomerName] = useState("");
  const [itemsCount, setItemsCount] = useState(1);
  const [itemsSummary, setItemsSummary] = useState("");
  const [total, setTotal] = useState("");
  const [status, setStatus] = useState("new");
  const [error, setError] = useState(null);

  useEffect(() => {
    if (open) {
      setCustomerName("");
      setItemsCount(1);
      setItemsSummary("");
      setTotal("");
      setStatus("new");
      setError(null);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === "Escape") onClose && onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  const validate = () => {
    if (!customerName.trim()) return "Customer name is required";
    const n = Number(itemsCount);
    if (!Number.isFinite(n) || n < 1) return "Items must be at least 1";
    if (total !== "" && !Number.isFinite(Number(total))) return "Total must be a number";
    if (!STATUS_OPTIONS.includes(status)) return "Invalid status";
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const err = validate();
    if (err) {
      setError(err);
      return;
    }
    setError(null);
    try {
      await onSubmit({
        customer_name: customerName.trim(),
        items_count: Number(itemsCount) || 1,
        items_summary: itemsSummary.trim() || undefined,
        total: total === "" ? 0 : Number(total),
        status,
      });
    } catch (e2) {
      setError(e2?.message || "Could not create order");
    }
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      data-testid={GRAAMAM_ORDERS.createOrderDialog}
      role="dialog"
      aria-modal="true"
    >
      <div
        data-modal-overlay="true"
        className="absolute inset-0 bg-inverse-surface/60 dark:bg-black/70 backdrop-blur-sm"
        onClick={() => (submitting ? null : onClose && onClose())}
      />
      <form
        data-modal-content="true"
        onSubmit={handleSubmit}
        className="relative w-full max-w-lg rounded-2xl bg-surface-container-lowest dark:bg-[#121212] border border-outline-variant/60 dark:border-white/10 shadow-warm-lg p-8"
      >
        <div className="flex items-start justify-between mb-6 gap-4">
          <div>
            <h3 className="font-headline font-bold text-headline-md text-on-surface dark:text-white">Create Order</h3>
            <p className="font-body text-body-sm text-on-surface-variant dark:text-outline-variant mt-1">
              Write a new order to the Graamam producer queue.
            </p>
          </div>
          <button
            type="button"
            aria-label="Close"
            onClick={() => onClose && onClose()}
            className="text-outline hover:text-primary-container dark:hover:text-white p-2 -m-2 rounded-full transition-colors"
          >
            <Icon name="close" className="text-[22px]" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <label className="col-span-2 flex flex-col gap-1">
            <span className="font-label text-label-sm text-on-surface dark:text-outline-variant uppercase tracking-wider">
              Customer name
            </span>
            <input
              type="text"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              data-testid={GRAAMAM_ORDERS.createOrderInputCustomer}
              autoFocus
              placeholder="Eleanor Vance"
              className="font-body text-body-md rounded-lg border border-outline-variant/70 dark:border-white/10 bg-white dark:bg-black text-on-surface dark:text-white placeholder:text-outline px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="font-label text-label-sm text-on-surface dark:text-outline-variant uppercase tracking-wider">
              Items count
            </span>
            <input
              type="number"
              min="1"
              value={itemsCount}
              onChange={(e) => setItemsCount(e.target.value)}
              data-testid={GRAAMAM_ORDERS.createOrderInputItems}
              className="font-body text-body-md rounded-lg border border-outline-variant/70 dark:border-white/10 bg-white dark:bg-black text-on-surface dark:text-white px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="font-label text-label-sm text-on-surface dark:text-outline-variant uppercase tracking-wider">
              Total (USD)
            </span>
            <input
              type="number"
              step="0.01"
              min="0"
              value={total}
              onChange={(e) => setTotal(e.target.value)}
              data-testid={GRAAMAM_ORDERS.createOrderInputTotal}
              placeholder="0.00"
              className="font-body text-body-md rounded-lg border border-outline-variant/70 dark:border-white/10 bg-white dark:bg-black text-on-surface dark:text-white px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </label>
          <label className="col-span-2 flex flex-col gap-1">
            <span className="font-label text-label-sm text-on-surface dark:text-outline-variant uppercase tracking-wider">
              Items summary (optional)
            </span>
            <input
              type="text"
              value={itemsSummary}
              onChange={(e) => setItemsSummary(e.target.value)}
              data-testid={GRAAMAM_ORDERS.createOrderInputSummary}
              placeholder="3 jars raw honey"
              className="font-body text-body-md rounded-lg border border-outline-variant/70 dark:border-white/10 bg-white dark:bg-black text-on-surface dark:text-white placeholder:text-outline px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </label>
          <label className="col-span-2 flex flex-col gap-1">
            <span className="font-label text-label-sm text-on-surface dark:text-outline-variant uppercase tracking-wider">
              Status
            </span>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              data-testid={GRAAMAM_ORDERS.createOrderInputStatus}
              className="font-body text-body-md rounded-lg border border-outline-variant/70 dark:border-white/10 bg-white dark:bg-black text-on-surface dark:text-white px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary"
            >
              {STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>
                  {s.charAt(0).toUpperCase() + s.slice(1)}
                </option>
              ))}
            </select>
          </label>
        </div>

        {error ? (
          <div className="mt-4 text-body-sm text-error font-body">{error}</div>
        ) : null}

        <div className="mt-8 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={() => onClose && onClose()}
            disabled={submitting}
            data-testid={GRAAMAM_ORDERS.createOrderCancel}
            className="font-label font-bold text-label-md px-5 py-2.5 rounded-lg text-on-surface-variant dark:text-outline-variant hover:bg-surface-container dark:hover:bg-white/10 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            data-testid={GRAAMAM_ORDERS.createOrderSubmit}
            className="font-label font-bold text-label-md px-6 py-2.5 rounded-lg bg-primary-container text-on-primary hover:shadow-warm shadow-warm-sm disabled:opacity-70 transition-all inline-flex items-center gap-2"
          >
            {submitting ? (
              <>
                <Icon name="progress_activity" className="animate-spin text-[18px]" />
                Creating…
              </>
            ) : (
              <>
                <Icon name="add" className="text-[18px]" />
                Create Order
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
