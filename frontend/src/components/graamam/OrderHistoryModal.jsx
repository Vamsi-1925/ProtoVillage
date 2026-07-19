import React, { useEffect, useState } from "react";
import Icon from "@/components/graamam/Icon";
import { ordersRepository } from "@/lib/firestoreClient";
import { formatDateTimeIST } from "@/lib/formatters";
import { GRAAMAM_ORDERS } from "@/constants/testIds";

/**
 * OrderHistoryModal — shows the append-only audit trail for one order
 * (graamam_v2's viewOrderHistory), backed by /api/graamam/audit/order/{id}/trail.
 */
export default function OrderHistoryModal({ order, onClose }) {
  const [trail, setTrail] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!order) return;
    setLoading(true);
    setError(null);
    ordersRepository
      .history(order.order_id)
      .then((res) => setTrail(res?.trail || []))
      .catch((e) => setError(e))
      .finally(() => setLoading(false));
  }, [order]);

  if (!order) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" data-testid={GRAAMAM_ORDERS.orderHistoryDialog} role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-inverse-surface/60 dark:bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg max-h-[80vh] overflow-y-auto rounded-2xl bg-surface-container-lowest dark:bg-[#121212] border border-outline-variant/60 dark:border-white/10 shadow-warm-lg p-8">
        <div className="flex items-start justify-between mb-6 gap-4">
          <div>
            <h3 className="font-headline font-bold text-headline-md text-on-surface dark:text-white">Order History</h3>
            <p className="font-body text-body-sm text-on-surface-variant dark:text-outline-variant mt-1 font-mono">{order.order_id}</p>
          </div>
          <button type="button" aria-label="Close" onClick={onClose} className="text-outline hover:text-primary-container dark:hover:text-white p-2 -m-2 rounded-full transition-colors">
            <Icon name="close" className="text-[22px]" />
          </button>
        </div>

        {loading ? (
          <div className="py-10 text-center text-on-surface-variant dark:text-outline-variant font-body text-body-md">Loading…</div>
        ) : error ? (
          <div className="py-10 text-center text-error font-body text-body-md">Could not load history.</div>
        ) : trail.length === 0 ? (
          <div className="py-10 text-center text-outline font-body text-body-md flex flex-col items-center gap-2">
            <Icon name="history" className="text-[26px]" />
            No activity logged for this order yet.
          </div>
        ) : (
          <ol className="flex flex-col gap-4">
            {trail.map((t) => (
              <li key={t.id} className="relative pl-5 border-l-2 border-outline-variant/40 dark:border-white/10">
                <span className="absolute -left-[5px] top-1 w-2 h-2 rounded-full bg-primary-container" />
                <div className="font-body text-body-md text-on-surface dark:text-white">{t.action}</div>
                <div className="text-body-sm text-outline mt-0.5">
                  {formatDateTimeIST(t.ts)} · {t.actor_name || "system"}
                </div>
              </li>
            ))}
          </ol>
        )}
      </div>
    </div>
  );
}
