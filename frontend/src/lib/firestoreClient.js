/**
 * firestoreClient.js — Repository adapter shaped like a Firestore collection
 * so this Phase-1 codebase can later be swapped to real Firebase without
 * touching UI components.
 *
 * Public interface (stable):
 *   ordersRepository.list({ status? })          -> Promise<Order[]>
 *   ordersRepository.counts()                   -> Promise<{ [status]: number, all: number }>
 *   ordersRepository.create(payload)            -> Promise<Order>
 *   ordersRepository.onSnapshot({ status?, onNext, onError }) -> unsubscribe()
 *
 * Today: this speaks HTTP to our FastAPI "Firestore stand-in" at
 *          `${REACT_APP_BACKEND_URL}/api/graamam/orders`
 * Tomorrow: swap the body of these methods for `firebase/firestore` calls.
 */

const BACKEND_URL =
  (typeof process !== "undefined" && process.env && process.env.REACT_APP_BACKEND_URL) ||
  "";
const API = `${BACKEND_URL}/api`;

async function _fetchJson(url, init = {}) {
  const res = await fetch(url, {
    headers: { "Content-Type": "application/json", ...(init.headers || {}) },
    ...init,
  });
  const text = await res.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch (_) {
    // non-JSON response
  }
  if (!res.ok) {
    const detail = (data && (data.detail || data.message)) || text || `HTTP ${res.status}`;
    const err = new Error(typeof detail === "string" ? detail : JSON.stringify(detail));
    err.status = res.status;
    throw err;
  }
  return data;
}

async function list({ status } = {}) {
  const params = new URLSearchParams();
  if (status && status !== "all") params.set("status", status);
  const qs = params.toString();
  return _fetchJson(`${API}/graamam/orders${qs ? `?${qs}` : ""}`, { method: "GET" });
}

async function counts() {
  return _fetchJson(`${API}/graamam/orders/counts`, { method: "GET" });
}

async function create(payload) {
  return _fetchJson(`${API}/graamam/orders`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

/**
 * Polling-based onSnapshot to mimic Firestore's live-updates contract.
 * When swapping to real Firebase, replace with `onSnapshot(query(...))`.
 */
function onSnapshot({ status, intervalMs = 4000, onNext, onError }) {
  let cancelled = false;
  let timer = null;

  const tick = async () => {
    if (cancelled) return;
    try {
      const data = await list({ status });
      if (!cancelled && typeof onNext === "function") onNext(data);
    } catch (e) {
      if (!cancelled && typeof onError === "function") onError(e);
    } finally {
      if (!cancelled) timer = setTimeout(tick, intervalMs);
    }
  };

  tick();
  return () => {
    cancelled = true;
    if (timer) clearTimeout(timer);
  };
}

export const ordersRepository = { list, counts, create, onSnapshot };
export default ordersRepository;
