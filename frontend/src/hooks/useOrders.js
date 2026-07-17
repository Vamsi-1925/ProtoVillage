import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ordersRepository } from "@/lib/firestoreClient";
import { STATUS_ORDER } from "@/lib/statusMap";

/**
 * useOrders — the Graamam Orders view-model.
 * - Loads all orders from the repository (Firestore stand-in)
 * - Filters client-side by active status so counts are computed off one dataset
 * - Exposes counts per status (with an `all` total)
 * - Exposes `createOrder(payload)` that optimistically refetches
 */
export function useOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeStatus, setActiveStatus] = useState("received");
  const [creating, setCreating] = useState(false);
  const [expandedId, setExpandedId] = useState(null);

  const mountedRef = useRef(true);
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const refresh = useCallback(async () => {
    setError(null);
    try {
      const data = await ordersRepository.list({ status: "all" });
      if (mountedRef.current) setOrders(Array.isArray(data) ? data : []);
    } catch (e) {
      if (mountedRef.current) setError(e);
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
    // Poll every 6s to mimic Firestore's live updates.
    const unsub = ordersRepository.onSnapshot({
      status: "all",
      intervalMs: 6000,
      onNext: (data) => mountedRef.current && setOrders(Array.isArray(data) ? data : []),
      onError: (e) => mountedRef.current && setError(e),
    });
    return unsub;
  }, [refresh]);

  const counts = useMemo(() => {
    const c = { all: 0 };
    STATUS_ORDER.forEach((s) => (c[s] = 0));
    orders.forEach((o) => {
      const s = (o?.status || "new").toLowerCase();
      if (c[s] !== undefined) c[s] += 1;
      c.all += 1;
    });
    return c;
  }, [orders]);

  const filtered = useMemo(() => {
    if (activeStatus === "all") return orders;
    return orders.filter((o) => (o?.status || "").toLowerCase() === activeStatus);
  }, [orders, activeStatus]);

  const createOrder = useCallback(async (payload) => {
    setCreating(true);
    try {
      const created = await ordersRepository.create(payload);
      if (mountedRef.current) {
        setOrders((prev) => [created, ...prev.filter((o) => o.order_id !== created.order_id)]);
      }
      return created;
    } finally {
      if (mountedRef.current) setCreating(false);
    }
  }, []);

  const toggleExpanded = useCallback((orderId) => {
    setExpandedId((cur) => (cur === orderId ? null : orderId));
  }, []);

  return {
    orders,
    filtered,
    counts,
    loading,
    error,
    activeStatus,
    setActiveStatus,
    createOrder,
    creating,
    refresh,
    expandedId,
    toggleExpanded,
  };
}
