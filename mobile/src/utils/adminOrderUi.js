/**
 * How the admin desk talks about an order: short status words, the colour each stage gets, the one-tap "next step"
 * verb, payment state and the little summaries a table row needs. Status values mirror backend `orderStatuses.js`.
 */
import { formatOrderPublicRef } from "../content/appContent";
import { formatRupees } from "./adminFormat";

export const ADMIN_STATUS_META = {
  pending_payment: { label: "Unpaid", tone: "neutral", icon: "card-outline", hint: "Waiting for the customer to pay online" },
  pending: { label: "New", tone: "gold", icon: "sparkles-outline", hint: "Just placed — confirm it" },
  confirmed: { label: "Confirmed", tone: "olive", icon: "checkmark-circle-outline", hint: "Accepted by the shop" },
  paid: { label: "Confirmed", tone: "olive", icon: "checkmark-circle-outline", hint: "Paid and accepted" },
  preparing: { label: "Packing", tone: "olive", icon: "cube-outline", hint: "Being packed" },
  ready_for_pickup: { label: "Ready", tone: "teal", icon: "bag-check-outline", hint: "Packed, waiting for a rider" },
  out_for_delivery: { label: "On the way", tone: "blue", icon: "bicycle-outline", hint: "With the rider" },
  shipped: { label: "On the way", tone: "blue", icon: "bicycle-outline", hint: "With the rider" },
  delivered: { label: "Delivered", tone: "green", icon: "checkmark-done-outline", hint: "Handed to the customer" },
  cancelled: { label: "Cancelled", tone: "red", icon: "close-circle-outline", hint: "Cancelled" },
};

export function adminStatusMeta(status) {
  const key = String(status || "");
  return ADMIN_STATUS_META[key] || { label: key.replace(/_/g, " ") || "—", tone: "neutral", icon: "ellipse-outline", hint: "" };
}

/** The one-tap next step for an order — verb on the button, the status it moves to. */
export const ADMIN_ADVANCE = {
  pending: { to: "confirmed", verb: "Confirm", icon: "checkmark-outline" },
  confirmed: { to: "preparing", verb: "Start packing", icon: "cube-outline" },
  paid: { to: "preparing", verb: "Start packing", icon: "cube-outline" },
  preparing: { to: "ready_for_pickup", verb: "Mark ready", icon: "bag-check-outline" },
  ready_for_pickup: { to: "out_for_delivery", verb: "Send out", icon: "bicycle-outline" },
  out_for_delivery: { to: "delivered", verb: "Delivered", icon: "checkmark-done-outline" },
  shipped: { to: "delivered", verb: "Delivered", icon: "checkmark-done-outline" },
};

export function adminAdvanceFor(status) {
  return ADMIN_ADVANCE[String(status || "")] || null;
}

export const isFinalStatus = (status) => status === "delivered" || status === "cancelled";

/** The single most useful button for an order right now: settle payment, collect cash, or the next pipeline step. */
export function primaryOrderAction(order) {
  if (!order) return null;
  if (order.status === "pending_payment") {
    return { key: "paid", label: "Mark paid", icon: "card-outline", tone: "gold" };
  }
  if (order.status === "delivered" && isCod(order) && order.paymentStatus === "pending") {
    return { key: "cash", label: "Cash collected", icon: "cash-outline", tone: "gold" };
  }
  const step = adminAdvanceFor(order.status);
  if (step) return { key: "advance", label: step.verb, icon: step.icon, tone: "primary" };
  return null;
}

/** Statuses the bulk bar can move a selection to, in pipeline order. */
export const BULK_STATUS_TARGETS = [
  { to: "confirmed", label: "Confirm", icon: "checkmark-outline" },
  { to: "preparing", label: "Start packing", icon: "cube-outline" },
  { to: "ready_for_pickup", label: "Mark ready", icon: "bag-check-outline" },
  { to: "out_for_delivery", label: "Send out", icon: "bicycle-outline" },
  { to: "delivered", label: "Mark delivered", icon: "checkmark-done-outline" },
  { to: "cancelled", label: "Cancel orders", icon: "close-circle-outline", danger: true },
];

export function isCod(order) {
  return /cash|cod/i.test(String(order?.paymentMethod || ""));
}

export function paymentMethodLabel(order) {
  const m = String(order?.paymentMethod || "").toLowerCase();
  if (m.includes("cash") || m.includes("cod")) return "Cash on delivery";
  if (m.includes("youpi")) return "UPI (YouPI)";
  if (m.includes("razor")) return "Online (Razorpay)";
  return order?.paymentMethod || "—";
}

export function paymentShortLabel(order) {
  const m = String(order?.paymentMethod || "").toLowerCase();
  if (m.includes("cash") || m.includes("cod")) return "COD";
  if (m.includes("youpi")) return "YouPI";
  if (m.includes("razor")) return "Razorpay";
  return order?.paymentMethod || "—";
}

/** Payment badge: what state the money is in. COD that was delivered but not collected is called out. */
export function paymentMeta(order) {
  const ps = String(order?.paymentStatus || "pending").toLowerCase();
  if (ps === "paid") return { label: "Paid", tone: "green" };
  if (ps === "refunded") return { label: "Refunded", tone: "purple" };
  if (ps === "failed") return { label: "Failed", tone: "red" };
  if (isCod(order)) {
    if (order?.status === "delivered") return { label: "Collect cash", tone: "gold" };
    return { label: "Pay on delivery", tone: "neutral" };
  }
  return { label: "Unpaid", tone: "gold" };
}

/** Badge props for the server's attention flag (see backend `attentionFlag`). */
export function flagMeta(flag) {
  if (!flag?.code) return null;
  const tone =
    flag.code === "late" || flag.code === "declined" || flag.code === "no_rider"
      ? "red"
      : flag.code === "cash_due"
        ? "gold"
        : "gold";
  const icon =
    flag.code === "late"
      ? "alarm-outline"
      : flag.code === "cash_due"
        ? "cash-outline"
        : flag.code === "waiting"
          ? "hourglass-outline"
          : "person-outline";
  return { label: flag.label, tone, icon };
}

export function orderRef(order) {
  return formatOrderPublicRef(order) || (order?._id ? `#${String(order._id).slice(-6).toUpperCase()}` : "—");
}

export function customerOf(order) {
  const name = order?.user?.name || order?.shippingAddress?.fullName || "Guest";
  const phone = order?.shippingAddress?.phone || order?.user?.phone || "";
  return { name, phone, email: order?.user?.email || "" };
}

export function itemCount(order) {
  return (order?.products || []).reduce((sum, line) => sum + Math.max(0, Number(line.quantity || 1)), 0);
}

/** "A2 Bilona Ghee ×2 +1 more" */
export function itemsSummary(order) {
  const lines = order?.products || [];
  if (!lines.length) return "—";
  const first = lines[0];
  const qty = Number(first.quantity || 1);
  const head = `${first.name || first.product?.name || "Item"}${qty > 1 ? ` ×${qty}` : ""}`;
  return lines.length > 1 ? `${head} +${lines.length - 1} more` : head;
}

export function areaLine(order) {
  const a = order?.shippingAddress || {};
  return [a.city, a.postalCode].filter(Boolean).join(" · ");
}

export function fullAddress(order) {
  const a = order?.shippingAddress || {};
  return [a.houseNumber, a.line1, a.landmark, a.city, a.state, a.postalCode].filter(Boolean).join(", ");
}

export function orderTotalLabel(order) {
  return formatRupees(order?.totalPrice || 0);
}
