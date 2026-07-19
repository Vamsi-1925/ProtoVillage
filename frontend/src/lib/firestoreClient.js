/**
 * firestoreClient.js — Repository adapters for all Graamam collections.
 * Keeps the Firestore contract so we can later swap the fetch bodies for
 * `firebase/firestore` calls without touching UI components.
 */

const BACKEND_URL =
  (typeof process !== "undefined" && process.env && process.env.REACT_APP_BACKEND_URL) || "";
const API = `${BACKEND_URL}/api`;

async function _fetchJson(url, init = {}) {
  const res = await fetch(url, {
    headers: { "Content-Type": "application/json", ...(init.headers || {}) },
    ...init,
  });
  const text = await res.text();
  let data = null;
  try { data = text ? JSON.parse(text) : null; } catch { /* non-json */ }
  if (!res.ok) {
    const detail = (data && (data.detail || data.message)) || text || `HTTP ${res.status}`;
    const err = new Error(typeof detail === "string" ? detail : JSON.stringify(detail));
    err.status = res.status;
    throw err;
  }
  return data;
}

function _qs(obj) {
  const p = new URLSearchParams();
  Object.entries(obj || {}).forEach(([k, v]) => {
    if (v !== undefined && v !== null && String(v) !== "" && String(v) !== "all") p.set(k, v);
  });
  const s = p.toString();
  return s ? `?${s}` : "";
}

// ---------- ORDERS ----------
export const ordersRepository = {
  list: ({ status } = {}) => _fetchJson(`${API}/graamam/orders${_qs({ status })}`),
  counts: () => _fetchJson(`${API}/graamam/orders/counts`),
  create: (payload) => _fetchJson(`${API}/graamam/orders`, { method: "POST", body: JSON.stringify(payload) }),
  update: (orderId, payload) => _fetchJson(`${API}/graamam/orders/${orderId}/edit`, { method: "POST", body: JSON.stringify(payload) }),
  cancel: (orderId, reason) => _fetchJson(`${API}/graamam/orders/${orderId}/cancel${reason ? _qs({ reason }) : ""}`, { method: "POST" }),
  history: (orderId) => _fetchJson(`${API}/graamam/audit/order/${orderId}/trail`),
  updateStatus: (orderId, status) => _fetchJson(`${API}/graamam/orders/${orderId}/status`, { method: "POST", body: JSON.stringify({ status }) }),
  onSnapshot: makePoller((args) => _fetchJson(`${API}/graamam/orders${_qs({ status: args?.status })}`)),
};

// ---------- MASTER (Products, B2B/B2C Customers) — feeds the New Order form ----------
export const masterRepository = {
  company: () => _fetchJson(`${API}/graamam/master/company`),
  products: () => _fetchJson(`${API}/graamam/master/products`),
  b2bCustomers: () => _fetchJson(`${API}/graamam/master/customers/b2b`),
  b2cCustomers: () => _fetchJson(`${API}/graamam/master/customers/b2c`),
};

// ---------- DISCUSSIONS (threads) ----------
export const threadsRepository = {
  list: ({ status } = {}) => _fetchJson(`${API}/graamam/threads${_qs({ status })}`),
  create: (payload) => _fetchJson(`${API}/graamam/threads`, { method: "POST", body: JSON.stringify(payload) }),
  messages: (threadId) => _fetchJson(`${API}/graamam/threads/${threadId}/messages`),
};

// ---------- PRODUCERS ----------
export const producersRepository = {
  list: ({ village, tag, q } = {}) => _fetchJson(`${API}/graamam/producers${_qs({ village, tag, q })}`),
  villages: () => _fetchJson(`${API}/graamam/producers/villages`),
  counts: () => _fetchJson(`${API}/graamam/producers/counts`),
  create: (payload) => _fetchJson(`${API}/graamam/producers`, { method: "POST", body: JSON.stringify(payload) }),
};

// ---------- INVENTORY ----------
export const inventoryRepository = {
  list: ({ status, category, q } = {}) => _fetchJson(`${API}/graamam/inventory${_qs({ status, category, q })}`),
  summary: () => _fetchJson(`${API}/graamam/inventory/summary`),
  create: (payload) => _fetchJson(`${API}/graamam/inventory`, { method: "POST", body: JSON.stringify(payload) }),
  adjust: (sku, delta) => _fetchJson(`${API}/graamam/inventory/${sku}/adjust`, { method: "POST", body: JSON.stringify({ delta }) }),
};

// ---------- BATCHES ----------
export const batchesRepository = {
  list: ({ status } = {}) => _fetchJson(`${API}/graamam/batches${_qs({ status })}`),
  summary: () => _fetchJson(`${API}/graamam/batches/summary`),
  create: (payload) => _fetchJson(`${API}/graamam/batches`, { method: "POST", body: JSON.stringify(payload) }),
};

// ---------- PRODUCTION ----------
export const productionRepository = {
  list: ({ status } = {}) => _fetchJson(`${API}/graamam/production${_qs({ status })}`),
  create: (payload) => _fetchJson(`${API}/graamam/production`, { method: "POST", body: JSON.stringify(payload) }),
  updateStatus: (tokenId, status) => _fetchJson(`${API}/graamam/production/${tokenId}/status`, { method: "POST", body: JSON.stringify({ status }) }),
};

// ---------- PROCUREMENT ----------
export const procurementRepository = {
  list: ({ status } = {}) => _fetchJson(`${API}/graamam/procurement${_qs({ status })}`),
  summary: () => _fetchJson(`${API}/graamam/procurement/summary`),
  create: (payload) => _fetchJson(`${API}/graamam/procurement`, { method: "POST", body: JSON.stringify(payload) }),
  update: (requestId, payload) => _fetchJson(`${API}/graamam/procurement/${requestId}`, { method: "POST", body: JSON.stringify(payload) }),
};

// ---------- DISPATCH ----------
export const dispatchRepository = {
  queue: () => _fetchJson(`${API}/graamam/dispatch/queue`),
  recent: (limit = 10) => _fetchJson(`${API}/graamam/dispatch/recent?limit=${limit}`),
  history: () => _fetchJson(`${API}/graamam/dispatch/history`),
  mark: (payload) => _fetchJson(`${API}/graamam/dispatch/mark`, { method: "POST", body: JSON.stringify(payload) }),
};

// ---------- STORE ----------
export const storeRepository = {
  list: () => _fetchJson(`${API}/graamam/store`),
  summary: () => _fetchJson(`${API}/graamam/store/summary`),
  sale: (payload) => _fetchJson(`${API}/graamam/store/sale`, { method: "POST", body: JSON.stringify(payload) }),
  sales: (limit = 20) => _fetchJson(`${API}/graamam/store/sales?limit=${limit}`),
  receive: (sku, qty) => _fetchJson(`${API}/graamam/store/receive?sku=${encodeURIComponent(sku)}&qty=${qty}`, { method: "POST" }),
};

// ---------- REPORTS ----------
export const reportsRepository = {
  orders: ({ start, end, status } = {}) => _fetchJson(`${API}/graamam/reports/orders${_qs({ start, end, status })}`),
  inventory: () => _fetchJson(`${API}/graamam/reports/inventory`),
  producers: () => _fetchJson(`${API}/graamam/reports/producers`),
  sales: ({ start, end } = {}) => _fetchJson(`${API}/graamam/reports/sales${_qs({ start, end })}`),
};

// ---------- DASHBOARD ----------
export const dashboardRepository = {
  kpis: () => _fetchJson(`${API}/graamam/dashboard/kpis`),
  productionOverview: (filter = "all") => _fetchJson(`${API}/graamam/dashboard/production-overview?filter=${filter}`),
  activity: (limit = 8) => _fetchJson(`${API}/graamam/dashboard/activity?limit=${limit}`),
  alerts: () => _fetchJson(`${API}/graamam/dashboard/alerts`),
  warehouse: () => _fetchJson(`${API}/graamam/dashboard/warehouse`),
};

// ---------- Polling onSnapshot factory ----------
function makePoller(fetcher) {
  return function onSnapshot({ intervalMs = 6000, onNext, onError, ...args } = {}) {
    let cancelled = false;
    let timer = null;
    const tick = async () => {
      if (cancelled) return;
      try {
        const data = await fetcher(args);
        if (!cancelled && onNext) onNext(data);
      } catch (e) {
        if (!cancelled && onError) onError(e);
      } finally {
        if (!cancelled) timer = setTimeout(tick, intervalMs);
      }
    };
    tick();
    return () => { cancelled = true; if (timer) clearTimeout(timer); };
  };
}

export default ordersRepository;
