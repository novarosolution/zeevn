import { isCancelledOrder, isDeliveredOrder } from "./orderStatus";

export function formatOrderDisplayId(order) {
  const raw = String(order?._id || order?.id || "");
  return `ZV-${raw.slice(-6).toUpperCase()}`;
}

export function getOrderStatusBucket(status) {
  const s = String(status || "").toLowerCase();
  if (s === "returned" || s === "refunded") return "returned";
  if (s === "cancelled") return "cancelled";
  if (s === "delivered" || isDeliveredOrder(status)) return "delivered";
  return "active";
}

/** Badge variant for design-system status pills. */
export function getStatusBadgeVariant(status) {
  const s = String(status || "").toLowerCase();
  if (s === "cancelled") return "neutral";
  if (s === "returned" || s === "refunded") return "warning";
  if (s === "delivered") return "success";
  if (s === "out_for_delivery" || s === "shipped") return "brass";
  if (["preparing", "confirmed", "paid", "ready_for_pickup"].includes(s)) return "info";
  return "neutral";
}

export function getStatusDisplayLabel(status) {
  const s = String(status || "").toLowerCase();
  if (s === "cancelled") return "Cancelled";
  if (s === "returned" || s === "refunded") return "Returned";
  if (s === "delivered") return "Delivered";
  if (s === "out_for_delivery" || s === "shipped") return "Out for delivery";
  if (["preparing", "confirmed", "paid", "ready_for_pickup"].includes(s)) return "Packed";
  return "Placed";
}

export function fulfillmentStepIndex(status) {
  const s = String(status || "").toLowerCase();
  if (s === "returned" || s === "refunded") return 4;
  if (s === "cancelled") return -1;
  if (s === "delivered") return 3;
  if (s === "shipped" || s === "out_for_delivery") return 2;
  if (["confirmed", "paid", "preparing", "ready_for_pickup"].includes(s)) return 1;
  return 0;
}

export function canEditOrderAddress(status) {
  return fulfillmentStepIndex(status) < 1 && !isCancelledOrder(status);
}

export function formatOrderDateLong(date) {
  const d = new Date(date || Date.now());
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

export function formatOrderDateWithWeekday(date) {
  const d = new Date(date || Date.now());
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
}

export function formatOrderTime(date) {
  const d = new Date(date || Date.now());
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
}

export function productsSummaryLine(products, moreTemplate, fillFn) {
  const items = Array.isArray(products) ? products : [];
  const names = items.map((p) => String(p.name || "").trim()).filter(Boolean);
  if (!names.length) return "";
  if (names.length <= 2) return names.join(", ");
  const more =
    typeof fillFn === "function"
      ? fillFn(moreTemplate, { count: String(names.length - 2) })
      : moreTemplate.replace("{count}", String(names.length - 2));
  return `${names.slice(0, 2).join(", ")}, ${more}`;
}

export function orderMatchesSearch(order, query) {
  const q = String(query || "").trim().toLowerCase();
  if (!q) return true;
  const id = String(order?._id || "").toLowerCase();
  const displayId = formatOrderDisplayId(order).toLowerCase();
  if (id.includes(q) || displayId.includes(q)) return true;
  return (order?.products || []).some((p) => String(p.name || "").toLowerCase().includes(q));
}

export function sortOrders(orders, sortKey) {
  const list = [...orders];
  if (sortKey === "oldest") {
    return list.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
  }
  if (sortKey === "value_high") {
    return list.sort((a, b) => Number(b.totalPrice || 0) - Number(a.totalPrice || 0));
  }
  if (sortKey === "value_low") {
    return list.sort((a, b) => Number(a.totalPrice || 0) - Number(b.totalPrice || 0));
  }
  return list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}
