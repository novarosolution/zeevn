/**
 * Single source of truth for order lifecycle (API + Mongoose enum must match).
 * Legacy `paid` / `shipped` remain valid for existing documents.
 */

exports.ORDER_STATUS_VALUES = [
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

/** Admin “advance one step” — null = no primary next action */
exports.ORDER_NEXT_STATUS = {
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

exports.ORDER_STATUSES_ALLOW_ADDRESS_EDIT = [
  "pending_payment",
  "pending",
  "confirmed",
  "preparing",
  "paid",
];

exports.ORDER_STATUSES_DELIVERY_DASHBOARD = [
  "confirmed",
  "preparing",
  "ready_for_pickup",
  "paid",
  "shipped",
  "out_for_delivery",
];

/** Partner may complete once order is in hand / en route (includes packed & waiting). */
exports.ORDER_STATUSES_MARK_DELIVERABLE_FROM = [
  "ready_for_pickup",
  "shipped",
  "out_for_delivery",
];
