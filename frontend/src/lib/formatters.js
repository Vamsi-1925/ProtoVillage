// Small formatters shared across Graamam UI. Keeping locale explicit to
// avoid surprises in headless test environments.

export function formatCurrency(value) {
  const n = Number(value);
  if (!isFinite(n)) return "$0.00";
  return n.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function formatOrderDate(isoDate) {
  if (!isoDate) return "";
  // Accept both `YYYY-MM-DD` and full ISO timestamps.
  const d = new Date(isoDate.length <= 10 ? `${isoDate}T00:00:00Z` : isoDate);
  if (isNaN(d.getTime())) return isoDate;
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
}

export function initialsFrom(name = "") {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  return (parts[0][0] + (parts[1]?.[0] || "")).toUpperCase();
}
