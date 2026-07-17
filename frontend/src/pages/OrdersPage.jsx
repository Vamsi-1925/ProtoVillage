import React, { useMemo, useState } from "react";
import Sidebar from "@/components/graamam/Sidebar";
import TopBar from "@/components/graamam/TopBar";
import PageHeader from "@/components/graamam/PageHeader";
import PillTabs from "@/components/graamam/PillTabs";
import DataTable from "@/components/graamam/DataTable";
import CreateOrderDialog from "@/components/graamam/CreateOrderDialog";
import { useOrders } from "@/hooks/useOrders";
import { STATUS_META, STATUS_ORDER } from "@/lib/statusMap";
import { GRAAMAM_ORDERS } from "@/constants/testIds";

export default function OrdersPage() {
  const {
    filtered,
    counts,
    loading,
    error,
    activeStatus,
    setActiveStatus,
    createOrder,
    creating,
    expandedId,
    toggleExpanded,
  } = useOrders();

  const [dialogOpen, setDialogOpen] = useState(false);

  const tabs = useMemo(
    () =>
      STATUS_ORDER.map((k) => ({
        key: k,
        label: STATUS_META[k].label,
        count: counts[k] || 0,
      })),
    [counts]
  );

  const handleCreate = async (payload) => {
    await createOrder(payload);
    setDialogOpen(false);
    // Jump to the status of the created order so the user sees the row.
    if (payload?.status && STATUS_ORDER.includes(payload.status)) {
      setActiveStatus(payload.status);
    }
  };

  return (
    <div
      data-testid={GRAAMAM_ORDERS.page}
      className="min-h-screen flex bg-background dark:bg-black text-on-surface dark:text-white"
    >
      <Sidebar activeKey="orders" ordersBadgeCount={counts.new || undefined} />

      <div className="flex-1 ml-[220px] flex flex-col min-h-screen w-[calc(100%-220px)]">
        <TopBar />

        <main className="flex-1 p-8 max-w-[1280px] w-full mx-auto">
          <PageHeader
            title="Orders"
            subtitle="Manage and track your producer fulfillments."
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

          {/* Footer note on interactive state for the trial */}
          <p className="mt-6 text-body-sm text-outline dark:text-outline-variant">
            Data source: Firestore stand-in via <code className="font-mono">/api/graamam/orders</code>. Swap to real Firebase without touching this UI.
          </p>
        </main>
      </div>

      <CreateOrderDialog
        open={dialogOpen}
        submitting={creating}
        onClose={() => setDialogOpen(false)}
        onSubmit={handleCreate}
      />
    </div>
  );
}
