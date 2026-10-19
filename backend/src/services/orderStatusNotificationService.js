const Notification = require("../models/Notification");
const User = require("../models/User");
const { emitNotificationCreated } = require("../realtime/socketHub");

/** Customer-facing copy per status. `null` = stay silent. */
const STATUS_COPY = {
  pending_payment: null,
  pending: {
    title: "Order received",
    message: "We have your order #{short}. We'll confirm it shortly.",
  },
  paid: {
    title: "Payment received",
    message: "Payment for order #{short} is confirmed. We're getting it ready.",
  },
  confirmed: {
    title: "Order confirmed",
    message: "Order #{short} is confirmed and heading to the kitchen.",
  },
  preparing: {
    title: "Being prepared",
    message: "Your jars for order #{short} are being packed fresh.",
  },
  ready_for_pickup: {
    title: "Packed & ready",
    message: "Order #{short} is packed. A delivery partner is picking it up.",
  },
  shipped: {
    title: "On the way",
    message: "Order #{short} has left our kitchen and is on the way to you.",
  },
  out_for_delivery: {
    title: "Out for delivery",
    message: "Order #{short} is out for delivery. Keep your phone handy.",
  },
  delivered: {
    title: "Delivered",
    message: "Order #{short} was delivered. Enjoy, and tell us how it tastes.",
  },
  cancelled: {
    title: "Order cancelled",
    message: "Order #{short} was cancelled. Any payment will be refunded.",
  },
};

function shortId(order) {
  return String(order?._id || "").slice(-6).toUpperCase();
}

async function sendExpoPushToUser(userId, { title, body, data }) {
  const user = await User.findById(userId).select("expoPushTokens").lean();
  const tokens = Array.isArray(user?.expoPushTokens) ? user.expoPushTokens.filter(Boolean) : [];
  if (!tokens.length) return 0;
  const messages = tokens.map((to) => ({
    to,
    sound: "default",
    title,
    body,
    priority: "high",
    channelId: "default",
    data,
  }));
  const res = await fetch("https://exp.host/--/api/v2/push/send", {
    method: "POST",
    headers: { Accept: "application/json", "Content-Type": "application/json" },
    body: JSON.stringify(messages),
  });
  if (!res.ok) return 0;
  const json = await res.json().catch(() => ({}));
  const tickets = Array.isArray(json?.data) ? json.data : [];
  const dead = tickets
    .map((t, i) => (t?.status === "error" && t?.details?.error === "DeviceNotRegistered" ? tokens[i] : null))
    .filter(Boolean);
  if (dead.length) {
    await User.updateOne({ _id: userId }, { $pullAll: { expoPushTokens: dead } });
  }
  return tickets.filter((t) => t?.status === "ok").length;
}

/**
 * Persist an in-app notification for the order owner, emit it over Socket.IO and
 * fan out an Expo push. Safe to call fire-and-forget; errors are swallowed by caller.
 */
async function notifyCustomerOrderStatus(order) {
  const status = String(order?.status || "");
  const copy = STATUS_COPY[status];
  const userId = order?.user?._id || order?.user;
  if (!copy || !userId) return null;

  const short = shortId(order);
  const title = copy.title;
  const message = copy.message.replace("{short}", short);

  const created = await Notification.create({
    title,
    message,
    forAllUsers: false,
    forUser: userId,
    kind: "order",
    order: order._id,
    orderStatus: status,
    createdBy: null,
  });

  emitNotificationCreated(created);

  sendExpoPushToUser(userId, {
    title,
    body: message,
    data: { type: "order", orderId: String(order._id), status },
  }).catch(() => {});

  return created;
}

module.exports = { notifyCustomerOrderStatus, STATUS_COPY };
