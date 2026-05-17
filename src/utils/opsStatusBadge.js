/**
 * Map domain status strings to design-system Badge variants.
 */

export function orderStatusToBadgeVariant(status, { context = "admin" } = {}) {
  const s = String(status || "").toLowerCase();
  if (s === "delivered") return "success";
  if (s === "cancelled") return "sale";
  if (s === "pending_payment" || s === "pending") return "warning";
  if (context === "delivery" && (s === "ready_for_pickup" || s === "shipped" || s === "out_for_delivery")) {
    return "brass";
  }
  if (s === "preparing" || s === "confirmed") return "info";
  if (s === "out_for_delivery" || s === "shipped" || s === "ready_for_pickup") return "info";
  return "neutral";
}

export function paymentStatusToBadgeVariant(status) {
  const s = String(status || "").toLowerCase();
  if (s === "paid" || s === "captured") return "success";
  if (s === "failed" || s === "refunded") return "sale";
  if (s === "pending") return "warning";
  return "neutral";
}
