// Test ids for Graamam Connect — Orders (Phase 1).
// Consumed by the E2E testing agent (qabot).

export const GRAAMAM_ORDERS = {
  page: "graamam-orders-page",

  // Sidebar
  sidebar: "graamam-sidebar",
  sidebarBrand: "graamam-sidebar-brand",
  sidebarNavDashboard: "graamam-sidebar-nav-dashboard",
  sidebarNavInventory: "graamam-sidebar-nav-inventory",
  sidebarNavOrders: "graamam-sidebar-nav-orders",
  sidebarNavProducers: "graamam-sidebar-nav-producers",
  sidebarNavSettings: "graamam-sidebar-nav-settings",

  // TopBar
  topBar: "graamam-topbar",
  themeToggle: "graamam-theme-toggle",
  userAvatar: "graamam-user-avatar",

  // Header
  pageTitle: "graamam-orders-title",
  createOrderButton: "graamam-create-order-button",

  // Pill tabs
  pillTabsRoot: "graamam-pill-tabs",
  pillTab: (status) => `graamam-pill-tab-${status}`, // status in: new|packing|dispatched|delivered

  // Table
  ordersTable: "graamam-orders-table",
  ordersTableRow: (orderId) => `graamam-orders-row-${orderId}`, // e.g. GC-8902
  ordersTableRowExpand: (orderId) => `graamam-orders-row-expand-${orderId}`,
  ordersEmpty: "graamam-orders-empty",
  ordersLoading: "graamam-orders-loading",
  ordersError: "graamam-orders-error",

  // Create Order dialog
  createOrderDialog: "graamam-create-order-dialog",
  createOrderInputCustomer: "graamam-create-order-input-customer",
  createOrderInputItems: "graamam-create-order-input-items",
  createOrderInputTotal: "graamam-create-order-input-total",
  createOrderInputStatus: "graamam-create-order-input-status",
  createOrderInputSummary: "graamam-create-order-input-summary",
  createOrderSubmit: "graamam-create-order-submit",
  createOrderCancel: "graamam-create-order-cancel",
};
