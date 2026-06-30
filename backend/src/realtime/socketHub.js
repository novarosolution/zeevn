const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const { Server } = require("socket.io");
const User = require("../models/User");
const Order = require("../models/Order");
const { corsOriginCallback } = require("../config/corsOrigins");

let io = null;

function toPlain(doc) {
  if (!doc) return null;
  return typeof doc.toObject === "function" ? doc.toObject() : doc;
}

function initSocketServer(httpServer) {
  io = new Server(httpServer, {
    cors: {
      origin: corsOriginCallback,
      credentials: true,
    },
    path: "/socket.io",
  });

  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token || socket.handshake.query?.token;
      if (!token) {
        return next(new Error("Unauthorized"));
      }
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      if (decoded.type === "refresh") {
        return next(new Error("Unauthorized"));
      }
      const user = await User.findById(decoded.id).select("-password");
      if (!user) {
        return next(new Error("Unauthorized"));
      }
      socket.user = user;
      return next();
    } catch {
      return next(new Error("Unauthorized"));
    }
  });

  io.on("connection", (socket) => {
    const uid = String(socket.user._id);
    socket.join(`user:${uid}`);
    if (socket.user.isAdmin) socket.join("role:admin");
    if (socket.user.isDeliveryPartner) socket.join("role:delivery");

    socket.on("subscribe:order", async (payload, ack) => {
      try {
        const orderId = String(payload?.orderId || "");
        if (!mongoose.Types.ObjectId.isValid(orderId)) {
          if (typeof ack === "function") ack({ ok: false });
          return;
        }
        const order = await Order.findById(orderId).select("user assignedDeliveryUser");
        if (!order) {
          if (typeof ack === "function") ack({ ok: false });
          return;
        }
        const isOwner = String(order.user) === uid;
        const isPartner =
          order.assignedDeliveryUser && String(order.assignedDeliveryUser) === uid;
        const isAdmin = Boolean(socket.user.isAdmin);
        if (!isOwner && !isPartner && !isAdmin) {
          if (typeof ack === "function") ack({ ok: false });
          return;
        }
        socket.join(`order:${orderId}`);
        if (typeof ack === "function") ack({ ok: true });
      } catch {
        if (typeof ack === "function") ack({ ok: false });
      }
    });

    socket.on("unsubscribe:order", (payload) => {
      const orderId = String(payload?.orderId || "");
      if (orderId) socket.leave(`order:${orderId}`);
    });
  });

  return io;
}

function getIO() {
  return io;
}

function emitOrderUpdated(order) {
  if (!io || !order) return;
  const payload = { order: toPlain(order) };
  const orderId = String(order._id || order.id || "");
  const userId = String(order.user?._id || order.user || "");
  if (orderId) io.to(`order:${orderId}`).emit("orders:updated", payload);
  if (userId) io.to(`user:${userId}`).emit("orders:updated", payload);
  io.to("role:admin").emit("orders:updated", payload);
  io.to("role:delivery").emit("orders:updated", payload);
  const partnerId = order.assignedDeliveryUser?._id || order.assignedDeliveryUser;
  if (partnerId) {
    io.to(`user:${String(partnerId)}`).emit("orders:updated", payload);
  }
}

const LIVE_LOCATION_STATUSES = new Set(["ready_for_pickup", "shipped", "out_for_delivery"]);

async function emitDeliveryPartnerLocation(partnerUser, location) {
  if (!io || !partnerUser) return;
  const partnerId = partnerUser._id || partnerUser;
  const lat = location?.latitude;
  const lng = location?.longitude;
  const trackable = Number.isFinite(Number(lat)) && Number.isFinite(Number(lng));

  const orders = await Order.find({
    assignedDeliveryUser: partnerId,
    status: { $in: Array.from(LIVE_LOCATION_STATUSES) },
  }).select("user");

  const base = {
    latitude: trackable ? Number(lat) : null,
    longitude: trackable ? Number(lng) : null,
    updatedAt: location?.updatedAt
      ? new Date(location.updatedAt).toISOString()
      : new Date().toISOString(),
    accuracyMeters:
      location?.accuracyMeters != null && Number.isFinite(Number(location.accuracyMeters))
        ? Number(location.accuracyMeters)
        : null,
    trackable,
    partner: {
      name: partnerUser.name || "",
      phone: partnerUser.phone || "",
    },
  };

  for (const order of orders) {
    const orderPayload = { orderId: String(order._id), ...base };
    io.to(`order:${String(order._id)}`).emit("orders:live-location", orderPayload);
    io.to(`user:${String(order.user)}`).emit("orders:live-location", orderPayload);
  }
}

function emitNotificationCreated(notification) {
  if (!io || !notification) return;
  io.emit("notifications:new", {
    notification: toPlain(notification),
  });
}

function emitSupportThreadUpdated(thread) {
  if (!io || !thread) return;
  const payload = { thread: toPlain(thread) };
  const userId = String(thread.user?._id || thread.user || "");
  if (userId) io.to(`user:${userId}`).emit("support:thread", payload);
  io.to("role:admin").emit("support:thread", payload);
}

module.exports = {
  initSocketServer,
  getIO,
  emitOrderUpdated,
  emitDeliveryPartnerLocation,
  emitNotificationCreated,
  emitSupportThreadUpdated,
};
