// Central test id registry across all Graamam Connect screens.

export const GRAAMAM_ORDERS = {
  page: "graamam-orders-page",
  sidebar: "graamam-sidebar",
  sidebarBrand: "graamam-sidebar-brand",
  sidebarNavDashboard: "graamam-sidebar-nav-dashboard",
  sidebarNavInventory: "graamam-sidebar-nav-inventory",
  sidebarNavOrders: "graamam-sidebar-nav-orders",
  sidebarNavProducers: "graamam-sidebar-nav-producers",
  sidebarNavProduction: "graamam-sidebar-nav-production",
  sidebarNavProcurement: "graamam-sidebar-nav-procurement",
  sidebarNavWarehouse: "graamam-sidebar-nav-warehouse",
  sidebarNavDispatch: "graamam-sidebar-nav-dispatch",
  sidebarNavStore: "graamam-sidebar-nav-store",
  sidebarNavReports: "graamam-sidebar-nav-reports",
  sidebarNavSettings: "graamam-sidebar-nav-settings",

  topBar: "graamam-topbar",
  themeToggle: "graamam-theme-toggle",
  userAvatar: "graamam-user-avatar",

  pageTitle: "graamam-orders-title",
  createOrderButton: "graamam-create-order-button",
  pillTabsRoot: "graamam-pill-tabs",
  pillTab: (status) => `graamam-pill-tab-${status}`,
  ordersTable: "graamam-orders-table",
  ordersTableRow: (orderId) => `graamam-orders-row-${orderId}`,
  ordersTableRowExpand: (orderId) => `graamam-orders-row-expand-${orderId}`,
  ordersEmpty: "graamam-orders-empty",
  ordersLoading: "graamam-orders-loading",
  ordersError: "graamam-orders-error",

  createOrderDialog: "graamam-create-order-dialog",
  createOrderInputCustomer: "graamam-create-order-input-customer",
  createOrderInputItems: "graamam-create-order-input-items",
  createOrderInputTotal: "graamam-create-order-input-total",
  createOrderInputStatus: "graamam-create-order-input-status",
  createOrderInputSummary: "graamam-create-order-input-summary",
  createOrderInputAddress: "graamam-create-order-input-address",
  createOrderSubmit: "graamam-create-order-submit",
  createOrderCancel: "graamam-create-order-cancel",

  // New Order form (graamam_v2 replica)
  orderTypeToggleB2B: "graamam-order-type-b2b",
  orderTypeToggleB2C: "graamam-order-type-b2c",
  orderCustomerSelect: "graamam-order-customer-select",
  orderCustomerName: "graamam-order-customer-name",
  orderShipSameCheckbox: "graamam-order-ship-same",
  orderAddItemButton: "graamam-order-add-item",
  orderItemRow: (i) => `graamam-order-item-row-${i}`,
  orderItemProduct: (i) => `graamam-order-item-product-${i}`,
  orderItemQty: (i) => `graamam-order-item-qty-${i}`,
  orderItemRate: (i) => `graamam-order-item-rate-${i}`,
  orderItemDisc: (i) => `graamam-order-item-disc-${i}`,
  orderItemRemove: (i) => `graamam-order-item-remove-${i}`,
  orderTotalsBox: "graamam-order-totals-box",
  orderNotesInput: "graamam-order-notes",
  orderFormError: "graamam-order-form-error",

  // Orders list row actions
  orderRowHistory: (oid) => `graamam-order-history-${oid}`,
  orderRowEdit: (oid) => `graamam-order-edit-${oid}`,
  orderRowCancel: (oid) => `graamam-order-cancel-${oid}`,
  orderRowDiscuss: (oid) => `graamam-order-discuss-${oid}`,
  orderHistoryDialog: "graamam-order-history-dialog",
};

export const GRAAMAM_DASHBOARD = {
  page: "graamam-dashboard-page",
  kpiCard: (key) => `graamam-kpi-${key}`,
  activityFeed: "graamam-activity-feed",
  productionOverview: "graamam-production-overview",
  weatherAdvisory: "graamam-weather-advisory",
  overviewTab: (key) => `graamam-overview-tab-${key}`,
};

export const GRAAMAM_INVENTORY = {
  page: "graamam-inventory-page",
  addItemButton: "graamam-inventory-add",
  exportButton: "graamam-inventory-export",
  statusPill: (s) => `graamam-inventory-status-${s}`,
  categoryToggle: (c) => `graamam-inventory-category-${c}`,
  searchInput: "graamam-inventory-search",
  row: (sku) => `graamam-inventory-row-${sku}`,
  batchDrawer: "graamam-batch-drawer",
  batchProduct: "graamam-batch-product",
  batchProducer: "graamam-batch-producer",
  batchQty: "graamam-batch-qty",
  batchDate: "graamam-batch-date",
  batchNotes: "graamam-batch-notes",
  batchSave: "graamam-batch-save",
  batchCancel: "graamam-batch-cancel",
};

export const GRAAMAM_PRODUCERS = {
  page: "graamam-producers-page",
  registerButton: "graamam-producers-register",
  searchInput: "graamam-producers-search",
  villageSelect: "graamam-producers-village",
  card: (pid) => `graamam-producer-${pid}`,
};

export const GRAAMAM_PRODUCTION = {
  page: "graamam-production-page",
  createSlip: "graamam-production-create-slip",
  tokenCard: (tid) => `graamam-token-${tid}`,
  startButton: "graamam-production-start",
  completeButton: "graamam-production-complete",
  cancelButton: "graamam-production-cancel",
};

export const GRAAMAM_PROCUREMENT = {
  page: "graamam-procurement-page",
  column: (s) => `graamam-procurement-col-${s}`,
  card: (rid) => `graamam-procurement-card-${rid}`,
  newRequest: "graamam-procurement-new",
  approve: (rid) => `graamam-procurement-approve-${rid}`,
  markPurchased: (rid) => `graamam-procurement-mark-purchased-${rid}`,
  finalize: (rid) => `graamam-procurement-finalize-${rid}`,
};

export const GRAAMAM_DISPATCH = {
  page: "graamam-dispatch-page",
  queueCard: (oid) => `graamam-dispatch-queue-${oid}`,
  markDispatched: (oid) => `graamam-dispatch-mark-${oid}`,
  recentCard: (sid) => `graamam-dispatch-recent-${sid}`,
};

export const GRAAMAM_STORE = {
  page: "graamam-store-page",
  row: (sku) => `graamam-store-row-${sku}`,
  recordSale: (sku) => `graamam-store-record-sale-${sku}`,
  receive: "graamam-store-receive",
};

export const GRAAMAM_REPORTS = {
  page: "graamam-reports-page",
  reportType: "graamam-reports-type",
  quickRange: "graamam-reports-range",
  start: "graamam-reports-start",
  end: "graamam-reports-end",
  generate: "graamam-reports-generate",
  exportCsv: "graamam-reports-csv",
  exportPdf: "graamam-reports-pdf",
};

export const GRAAMAM_WAREHOUSE = {
  page: "graamam-warehouse-page",
  processDispatches: "graamam-warehouse-process-dispatches",
};
