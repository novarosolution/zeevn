/**
 * Order status labels & customer progress (keep in sync with backend `orderStatuses.js`).
 */

export const ALL_ORDER_STATUSES = [
  "pending_payment",
  "pending",
  "confirmed",
  "preparing",
  "ready_for_pickup",
  "out_for_delivery",
  "paid",
  "shipped",
  "delivered",
  "cancelled",
];

/** Same keys as backend ORDER_NEXT_STATUS */
export const ORDER_ADMIN_NEXT_STATUS = {
  pending_payment: null,
  pending: "confirmed",
  confirmed: "preparing",
  preparing: "ready_for_pickup",
  ready_for_pickup: "out_for_delivery",
  out_for_delivery: "delivered",
  paid: "preparing",
  shipped: "delivered",
  delivered: null,
  cancelled: null,
};

const STATUS_LABELS = {
  pending_payment: "Awaiting payment",
  pending: "Placed",
  confirmed: "Confirmed",
  preparing: "Preparing",
  ready_for_pickup: "Ready for pickup",
  out_for_delivery: "Out for delivery",
  paid: "Confirmed",
  shipped: "On the way",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

const STATUS_HINTS = {
  pending_payment: "Complete payment to confirm your order.",
  pending: "We received your order.",
  confirmed: "The store has confirmed your order.",
  preparing: "Your items are being packed.",
  ready_for_pickup: "Packed and waiting for the delivery partner.",
  out_for_delivery: "Your order is on the way.",
  paid: "Your order is confirmed.",
  shipped: "Your order is on the way.",
  delivered: "Delivered successfully.",
  cancelled: "This order was cancelled.",
};

/** Six-step journey for the progress strip (indices 0–5). */
export const ORDER_PROGRESS_STEPS = [
  { key: "placed", title: "Placed", subtitle: "Received" },
  { key: "confirmed", title: "Confirmed", subtitle: "Store OK" },
  { key: "preparing", title: "Preparing", subtitle: "Packing" },
  { key: "ready", title: "Ready", subtitle: "For pickup" },
  { key: "out", title: "On the way", subtitle: "Driving" },
  { key: "done", title: "Delivered", subtitle: "Complete" },
];

export function getOrderStatusLabel(status) {
  const s = String(status || "pending");
  return STATUS_LABELS[s] || s.replace(/_/g, " ");
}

export function getOrderStatusHint(status) {
  const s = String(status || "pending");
  return STATUS_HINTS[s] || "";
}

export function isCancelledOrder(status) {
  return String(status || "") === "cancelled";
}

export function isDeliveredOrder(status) {
  return String(status || "") === "delivered";
}

/**
 * Active step index 0–5 for the progress UI. `delivered` → 5 (all complete).
 * Cancelled should not use this (handled separately).
 */
export function getActiveProgressStep(status) {
  const s = String(status || "pending");
  if (s === "delivered") return 5;
  const map = {
    pending_payment: 0,
    pending: 0,
    confirmed: 1,
    paid: 1,
    preparing: 2,
    ready_for_pickup: 3,
    shipped: 4,
    out_for_delivery: 4,
  };
  return map[s] ?? 0;
}

export function getAdminNextStatusLabel(currentStatus) {
  const next = ORDER_ADMIN_NEXT_STATUS[String(currentStatus || "")];
  if (!next) return "";
  return getOrderStatusLabel(next);
}

/** Statuses that mark each progress-strip step as reached. */
export const PROGRESS_STEP_STATUSES = {
  placed: ["pending_payment", "pending"],
  confirmed: ["confirmed", "paid"],
  preparing: ["preparing"],
  ready: ["ready_for_pickup"],
  out: ["shipped", "out_for_delivery"],
  done: ["delivered"],
};

export function formatEventClock(at) {
  if (!at) return "";
  const d = new Date(at);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleString(undefined, { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
}

export function latestHistoryAt(history, statuses) {
  if (!Array.isArray(history) || !statuses?.length) return null;
  let found = null;
  for (const ev of history) {
    if (statuses.includes(ev?.status)) found = ev.at;
  }
  return found;
}

export function formatDeliveryEta(tracking, status) {
  if (isDeliveredOrder(status) || isCancelledOrder(status)) return "";
  const t = tracking || {};
  if (t.promisedAt) {
    const d = new Date(t.promisedAt);
    if (!Number.isNaN(d.getTime())) {
      return `Arriving by ${d.toLocaleString(undefined, {
        weekday: "short",
        day: "numeric",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
      })}`;
    }
  }
  const min = Number(t.etaMinutesMin);
  const max = Number(t.etaMinutesMax);
  if (min > 0 && max > 0) return `ETA ${min}–${max} min`;
  if (max > 0) return `ETA about ${max} min`;
  if (min > 0) return `ETA about ${min} min`;
  return "";
}

export function isPartnerPending(order) {
  return String(order?.deliveryAcceptStatus || "") === "pending";
}

export const INVOICE_STATUS_VALUES = ["draft", "final", "paid", "void"];

/** Match backend ORDER_STATUSES_ALLOW_ADDRESS_EDIT */
export const ORDER_STATUSES_ALLOW_ADDRESS_EDIT = [
  "pending_payment",
  "pending",
  "confirmed",
  "preparing",
  "paid",
];
