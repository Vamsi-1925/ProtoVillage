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
  greeting: "graamam-dashboard-greeting",
  kpiCard: (key) => `graamam-kpi-${key}`,
  activityFeed: "graamam-activity-feed",
  recentOrders: "graamam-dashboard-recent-orders",
  recentOrderRow: (oid) => `graamam-dashboard-recent-order-${oid}`,
};

export const GRAAMAM_INVENTORY = {
  page: "graamam-inventory-page",
  groupBlock: (g) => `graamam-inventory-group-${g}`,
  backToGroups: "graamam-inventory-back",
  groupTable: "graamam-inventory-group-table",
  groupRow: (sku) => `graamam-inventory-row-${sku}`,
  updateStockButton: "graamam-inventory-update-stock",
  reconcileButton: "graamam-inventory-reconcile",
  priceHistoryButton: (sku) => `graamam-inventory-price-history-${sku}`,
  priceHistoryTable: "graamam-inventory-price-history-table",
  updateStockDialog: "graamam-inventory-update-stock-dialog",
  updateStockSku: "graamam-inventory-update-stock-sku",
  updateStockQty: "graamam-inventory-update-stock-qty",
  updateStockPrice: "graamam-inventory-update-stock-price",
  updateStockSubmit: "graamam-inventory-update-stock-submit",
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
  activeSection: "graamam-production-active-section",
  activeEmpty: "graamam-production-active-empty",
  completedSection: "graamam-production-completed-section",
  tokenCard: (tid) => `graamam-token-${tid}`,
  createSlipButton: (tid) => `graamam-production-create-slip-${tid}`,
  viewSlipButton: (tid) => `graamam-production-view-slip-${tid}`,
  startButton: (tid) => `graamam-production-start-${tid}`,
  sendToProcButton: (tid) => `graamam-production-send-proc-${tid}`,
  completeButton: (tid) => `graamam-production-complete-${tid}`,
  slipDialog: "graamam-production-slip-dialog",
};

export const GRAAMAM_PROCUREMENT = {
  page: "graamam-procurement-page",
  column: (s) => `graamam-procurement-col-${s}`,
  card: (pid) => `graamam-procurement-card-${pid}`,
  approve: (pid) => `graamam-procurement-approve-${pid}`,
  receiveButton: (pid) => `graamam-procurement-receive-btn-${pid}`,
  receiveDialog: "graamam-procurement-receive-dialog",
  receiveVendor: "graamam-procurement-receive-vendor",
  receiveCostInput: (mat) => `graamam-procurement-receive-cost-${mat}`,
  receiveSubmit: "graamam-procurement-receive-submit",
};

export const GRAAMAM_DISPATCH = {
  page: "graamam-dispatch-page",
  queueSection: "graamam-dispatch-queue-section",
  queueEmpty: "graamam-dispatch-queue-empty",
  queueCard: (oid) => `graamam-dispatch-queue-${oid}`,
  dispatchFormButton: (oid) => `graamam-dispatch-form-${oid}`,
  dispatchOrderButton: (oid) => `graamam-dispatch-order-${oid}`,
  markDispatched: (oid) => `graamam-dispatch-mark-${oid}`,
  dispatchedSection: "graamam-dispatch-dispatched-section",
  dispatchedRow: (oid) => `graamam-dispatch-dispatched-row-${oid}`,
  printInvoiceButton: (oid) => `graamam-dispatch-print-invoice-${oid}`,
  printFormButton: (oid) => `graamam-dispatch-print-form-${oid}`,
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
  pendingSection: "graamam-warehouse-pending-section",
  pendingEmpty: "graamam-warehouse-pending-empty",
  pendingCard: (oid) => `graamam-warehouse-pending-card-${oid}`,
  readyButton: (oid) => `graamam-warehouse-ready-${oid}`,
  raiseProdButton: (oid) => `graamam-warehouse-raise-prod-${oid}`,
  processedSection: "graamam-warehouse-processed-section",
  processedRow: (oid) => `graamam-warehouse-processed-row-${oid}`,
  finishedGoodsToggle: "graamam-warehouse-finished-goods-toggle",
  finishedGoodsRow: (pid) => `graamam-warehouse-finished-goods-row-${pid}`,
};
