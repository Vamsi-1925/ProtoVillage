import React, { useMemo, useState, useEffect } from "react";
import AppShell from "@/components/graamam/AppShell";
import PageHeader from "@/components/graamam/PageHeader";
import PillTabs from "@/components/graamam/PillTabs";
import DataTable from "@/components/graamam/DataTable";
import CreateOrderDialog from "@/components/graamam/CreateOrderDialog";
import { useOrders } from "@/hooks/useOrders";
import { STATUS_META, STATUS_ORDER } from "@/lib/statusMap";
import { GRAAMAM_ORDERS } from "@/constants/testIds";

export default function OrdersPage() {
  const {
    filtered, counts, loading, error, activeStatus, setActiveStatus,
    createOrder, creating, expandedId, toggleExpanded,
  } = useOrders();
  const [dialogOpen, setDialogOpen] = useState(false);

  const tabs = useMemo(() =>
    STATUS_ORDER.map((k) => ({ key: k, label: STATUS_META[k].label, count: counts[k] || 0 })),
    [counts]);

  const handleCreate = async (payload) => {
    await createOrder(payload);
    setDialogOpen(false);
    if (payload?.status && STATUS_ORDER.includes(payload.status)) setActiveStatus(payload.status);
  };

  return (
    <AppShell badges={{ orders: counts.received || 0 }}>
      <div data-testid={GRAAMAM_ORDERS.page}>
        <PageHeader
          title="Orders"
          subtitle="Manage and track your producer fulfillments. Amounts in ₹ INR."
          actionLabel="Create Order"
          actionIcon="add"
          onAction={() => setDialogOpen(true)}
        />
        <PillTabs tabs={tabs} value={activeStatus} onChange={setActiveStatus} />
        <DataTable
          orders={filtered}
          loading={loading}
          error={error}
          expandedId={expandedId}
          onToggleExpand={toggleExpanded}
          emptyLabel={`No ${STATUS_META[activeStatus]?.label?.toLowerCase() || ""} orders yet`}
        />
        <p className="mt-6 text-body-sm text-outline dark:text-outline-variant">
          Data source: Firestore stand-in via <code className="font-mono">/api/graamam/orders</code>. Swap to real Firebase without touching this UI.
        </p>
      </div>
      <CreateOrderDialog open={dialogOpen} submitting={creating} onClose={() => setDialogOpen(false)} onSubmit={handleCreate} />
    </AppShell>
  );
}
