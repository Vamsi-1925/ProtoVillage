// Number, currency, and date helpers — Indian locale (en-IN, INR, IST).

export function formatCurrency(value) {
  const n = Number(value);
  if (!isFinite(n)) return "₹0";
  // Use Indian digit grouping (12,34,567) and INR symbol.
  return n.toLocaleString("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: n % 1 === 0 ? 0 : 2,
    minimumFractionDigits: n % 1 === 0 ? 0 : 2,
  });
}

export function formatCompactINR(value) {
  const n = Number(value);
  if (!isFinite(n)) return "₹0";
  if (n >= 10000000) return `₹${(n / 10000000).toFixed(1)} Cr`;
  if (n >= 100000) return `₹${(n / 100000).toFixed(1)} L`;
  if (n >= 1000) return `₹${(n / 1000).toFixed(1)} K`;
  return formatCurrency(n);
}

export function formatOrderDate(isoDate) {
  if (!isoDate) return "";
  const d = new Date(isoDate.length <= 10 ? `${isoDate}T00:00:00+05:30` : isoDate);
  if (isNaN(d.getTime())) return isoDate;
  return d.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "Asia/Kolkata",
  });
}

export function formatDateTimeIST(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
    timeZone: "Asia/Kolkata",
  });
}

export function formatTimeAgo(iso) {
  if (!iso) return "";
  const then = new Date(iso).getTime();
  if (!then) return "";
  const now = Date.now();
  const diffMs = Math.max(0, now - then);
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} hr${hrs > 1 ? "s" : ""} ago`;
  const days = Math.floor(hrs / 24);
  if (days === 1) return "yesterday";
  if (days < 7) return `${days} days ago`;
  return formatOrderDate(iso);
}

export function initialsFrom(name = "") {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  return (parts[0][0] + (parts[1]?.[0] || "")).toUpperCase();
}

export function formatQty(qty, unit = "") {
  const n = Number(qty);
  if (!isFinite(n)) return `0 ${unit}`.trim();
  return `${n.toLocaleString("en-IN")} ${unit}`.trim();
}
