const AdminLog = require("../models/AdminLog");
const { orderPublicRef } = require("./stockHistory");

const TABS = AdminLog.TABS;

const STATUS_ACTION = {
  pending: "Set order to new",
  pending_payment: "Set order to unpaid",
  confirmed: "Confirmed order",
  paid: "Confirmed order",
  preparing: "Started packing",
  ready_for_pickup: "Marked ready",
  out_for_delivery: "Sent out",
  shipped: "Sent out",
  delivered: "Marked delivered",
  cancelled: "Cancelled order",
};

function isCod(order) {
  return /cash|cod/i.test(String(order?.paymentMethod || ""));
}

function paymentAction(order, next) {
  if (next === "paid" && isCod(order)) return "Marked COD collected";
  if (next === "paid") return "Marked payment paid";
  if (next === "pending") return "Marked payment unpaid";
  if (next === "failed") return "Marked payment failed";
  if (next === "refunded") return "Marked payment refunded";
  return "Marked payment";
}

function statusAction(status) {
  return STATUS_ACTION[String(status || "")] || `Set order to ${String(status || "").replace(/_/g, " ")}`;
}

function orderOpen(id) {
  return { screen: "AdminOrderDetail", params: { orderId: String(id) } };
}

function productOpen(name) {
  const search = String(name || "").trim();
  return search ? { screen: "AdminInventory", params: { search } } : { screen: "AdminInventory" };
}

/** Append one activity row. Never throws — a failed log must not block the write. */
async function recordAdminAction(req, row = {}) {
  try {
    const action = String(row.action || "").trim().slice(0, 120);
    if (!action || !req?.user?._id) return null;
    const tab = TABS.includes(row.tab) ? row.tab : "shop";
    const href =
      row.href && row.href.screen
        ? {
            screen: String(row.href.screen).trim().slice(0, 64),
            params: row.href.params && typeof row.href.params === "object" ? row.href.params : {},
          }
        : undefined;
    return await AdminLog.create({
      at: new Date(),
      adminId: req.user._id,
      adminName: String(req.user.name || "Admin").trim().slice(0, 80) || "Admin",
      action,
      subject: String(row.subject || "").trim().slice(0, 160),
      tab,
      ...(href ? { href } : {}),
    });
  } catch (error) {
    console.warn("[admin-log]", error.message);
    return null;
  }
}

function logOrderStatus(req, order, status) {
  return recordAdminAction(req, {
    action: statusAction(status),
    subject: orderPublicRef(order._id || order),
    tab: "orders",
    href: orderOpen(order._id || order),
  });
}

function logOrderPayment(req, order, next) {
  return recordAdminAction(req, {
    action: paymentAction(order, next),
    subject: orderPublicRef(order._id || order),
    tab: "orders",
    href: orderOpen(order._id || order),
  });
}

function logOrderAssign(req, order, riderName) {
  return recordAdminAction(req, {
    action: riderName ? `Assigned ${riderName}` : "Cleared rider",
    subject: orderPublicRef(order._id || order),
    tab: "orders",
    href: orderOpen(order._id || order),
  });
}

function logOrderNote(req, order) {
  return recordAdminAction(req, {
    action: "Added a note",
    subject: orderPublicRef(order._id || order),
    tab: "orders",
    href: orderOpen(order._id || order),
  });
}

module.exports = {
  recordAdminAction,
  logOrderStatus,
  logOrderPayment,
  logOrderAssign,
  logOrderNote,
  orderPublicRef,
  orderOpen,
  productOpen,
};
