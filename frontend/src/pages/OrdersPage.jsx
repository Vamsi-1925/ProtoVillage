import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import AppShell from "@/components/graamam/AppShell";
import PageHeader from "@/components/graamam/PageHeader";
import PillTabs from "@/components/graamam/PillTabs";
import DataTable from "@/components/graamam/DataTable";
import CreateOrderDialog from "@/components/graamam/CreateOrderDialog";
import OrderHistoryModal from "@/components/graamam/OrderHistoryModal";
import { useOrders } from "@/hooks/useOrders";
import { useAuth } from "@/context/AuthContext";
import { threadsRepository } from "@/lib/firestoreClient";
import { STATUS_META, STATUS_ORDER } from "@/lib/statusMap";
import { GRAAMAM_ORDERS } from "@/constants/testIds";

export default function OrdersPage() {
  const {
    filtered, counts, loading, error, activeStatus, setActiveStatus,
    createOrder, updateOrder, cancelOrder, creating,
  } = useOrders();
  const { user } = useAuth();
  const nav = useNavigate();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editOrder, setEditOrder] = useState(null);
  const [historyOrder, setHistoryOrder] = useState(null);

  const canEditCancel = user?.role === "admin" || user?.role === "warehouse";
  const isAdmin = user?.role === "admin";

  const tabs = useMemo(() =>
    STATUS_ORDER.map((k) => ({ key: k, label: STATUS_META[k].label, count: counts[k] || 0 })),
    [counts]);

  const openCreate = () => {
    setEditOrder(null);
    setDialogOpen(true);
  };

  const openEdit = (order) => {
    setEditOrder(order);
    setDialogOpen(true);
  };

  const closeDialog = () => {
    setDialogOpen(false);
    setEditOrder(null);
  };

  const handleSubmit = async (payload) => {
    if (editOrder) {
      await updateOrder(editOrder.order_id, payload);
    } else {
      const created = await createOrder(payload);
      if (created?.status) setActiveStatus(created.status);
    }
    closeDialog();
  };

  const handleCancel = async (order) => {
    const reason = window.prompt(`Cancel order ${order.order_id}? Optionally add a reason:`, "");
    if (reason === null) return; // user hit Cancel on the prompt itself
    try {
      await cancelOrder(order.order_id, reason || undefined);
    } catch (e) {
      alert(`Could not cancel order: ${e.message}`);
    }
  };

  const handleDiscuss = async (order) => {
    try {
      const threads = await threadsRepository.list({});
      let t = (Array.isArray(threads) ? threads : []).find(
        (x) => x.link_type === "order" && x.link_id === order.order_id && x.status === "open"
      );
      if (!t) {
        await threadsRepository.create({
          title: `Order ${order.order_id}`,
          link_type: "order",
          link_id: order.order_id,
          created_by: user?.name || "User",
        });
      }
      nav("/discussions");
    } catch (e) {
      alert(`Could not open discussion: ${e.message}`);
    }
  };

  return (
    <AppShell badges={{ orders: counts.received || 0 }}>
      <div data-testid={GRAAMAM_ORDERS.page}>
        <PageHeader
          title="Orders"
          subtitle="Full order pipeline with token tracking. Amounts in ₹ INR."
          actionLabel="New Order"
          actionIcon="add"
          onAction={openCreate}
        />
        <PillTabs tabs={tabs} value={activeStatus} onChange={setActiveStatus} />
        <DataTable
          orders={filtered}
          loading={loading}
          error={error}
          canEditCancel={canEditCancel}
          isAdmin={isAdmin}
          onEdit={openEdit}
          onCancel={handleCancel}
          onDiscuss={handleDiscuss}
          onHistory={setHistoryOrder}
          emptyLabel={`No ${STATUS_META[activeStatus]?.label?.toLowerCase() || ""} orders yet. Create one to start the pipeline.`}
        />
        <p className="mt-6 text-body-sm text-outline dark:text-outline-variant">
          Data source: Firestore stand-in via <code className="font-mono">/api/graamam/orders</code>. Swap to real Firebase without touching this UI.
        </p>
      </div>
      <CreateOrderDialog open={dialogOpen} submitting={creating} editOrder={editOrder} onClose={closeDialog} onSubmit={handleSubmit} />
      <OrderHistoryModal order={historyOrder} onClose={() => setHistoryOrder(null)} />
    </AppShell>
  );
}
