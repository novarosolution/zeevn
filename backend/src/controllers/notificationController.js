const Notification = require("../models/Notification");
const User = require("../models/User");
const { emitNotificationCreated } = require("../realtime/socketHub");
const { recordAdminAction } = require("../utils/adminLog");

function chunkArray(items, chunkSize) {
  const chunks = [];
  for (let i = 0; i < items.length; i += chunkSize) {
    chunks.push(items.slice(i, i + chunkSize));
  }
  return chunks;
}

async function sendExpoPushBroadcast({ title, message, userFilter = {}, dataType = "broadcast" }) {
  const users = await User.find(
    { expoPushTokens: { $exists: true, $not: { $size: 0 } }, ...userFilter },
    { expoPushTokens: 1 }
  ).lean();
  
  const allTokens = Array.from(
    new Set(
      users.flatMap((user) => (Array.isArray(user.expoPushTokens) ? user.expoPushTokens : []))
    )
  );
  if (allTokens.length === 0) {
    return { sent: 0, handed: 0 };
  }

  const messages = allTokens.map((to) => ({
    to,
    sound: "default",
    title,
    body: message,
    priority: "high",
    channelId: "default",
    data: { type: dataType },
  }));

  const invalidTokens = new Set();
  let sentCount = 0;
  let handed = 0;
  for (const batch of chunkArray(messages, 100)) {
    const response = await fetch("https://exp.host/--/api/v2/push/send", {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(batch),
    });
    const json = await response.json().catch(() => ({}));
    if (!response.ok) {
      console.warn(
        "[notifications] Expo push send failed:",
        response.status,
        json?.errors || json?.message || json
      );
      continue;
    }
    handed += batch.length;
    const tickets = Array.isArray(json?.data) ? json.data : [];
    sentCount += tickets.filter((t) => t?.status === "ok").length;
    for (let i = 0; i < tickets.length; i += 1) {
      const ticket = tickets[i];
      const token = batch[i]?.to;
      if (ticket?.status === "error" && ticket?.details?.error === "DeviceNotRegistered" && token) {
        invalidTokens.add(token);
      }
    }
  }

  if (invalidTokens.size > 0) {
    const toRemove = Array.from(invalidTokens);
    await User.updateMany({ expoPushTokens: { $in: toRemove } }, { $pullAll: { expoPushTokens: toRemove } });
  }

  return { sent: sentCount, handed };
}

async function createBroadcastNotification(req, res, next) {
  try {
    const title = String(req.body?.title || "").trim();
    const message = String(req.body?.message || "").trim();
    if (!title || !message) {
      return res.status(400).json({ message: "Title and message are required." });
    }
    if (title.length > 120) {
      return res.status(400).json({ message: "Title must be 120 characters or fewer." });
    }
    if (message.length > 1000) {
      return res.status(400).json({ message: "Message must be 1000 characters or fewer." });
    }

    const created = await Notification.create({
      title,
      message,
      forAllUsers: true,
      kind: "broadcast",
      createdBy: req.user._id,
    });

    let pushResult = { sent: 0, handed: 0 };
    try {
      pushResult = await sendExpoPushBroadcast({
        title: created.title,
        message: created.message,
        dataType: "broadcast",
      });
    } catch (pushErr) {
      console.warn("[notifications] Broadcast push failed (notification still saved):", pushErr?.message || pushErr);
    }

    created.pushSent = pushResult.handed ?? pushResult.sent;
    await created.save();
    emitNotificationCreated(created);
    await recordAdminAction(req, {
      action: "Sent a broadcast",
      subject: created.title || "Broadcast",
      tab: "shop",
      href: { screen: "AdminNotifications" },
    });
    res.status(201).json({ ...created.toObject(), pushSent: created.pushSent });
  } catch (error) {
    next(error);
  }
}

async function createRiderNotification(req, res, next) {
  try {
    const title = String(req.body?.title || "").trim();
    const message = String(req.body?.message || "").trim();
    if (!title || !message) {
      return res.status(400).json({ message: "Title and message are required." });
    }
    if (title.length > 120) {
      return res.status(400).json({ message: "Title must be 120 characters or fewer." });
    }
    if (message.length > 1000) {
      return res.status(400).json({ message: "Message must be 1000 characters or fewer." });
    }

    const created = await Notification.create({
      title,
      message,
      forAllUsers: false,
      kind: "riders",
      createdBy: req.user._id,
    });

    let pushResult = { sent: 0 };
    try {
      pushResult = await sendExpoPushBroadcast({
        title: created.title,
        message: created.message,
        userFilter: { isDeliveryPartner: true },
        dataType: "riders",
      });
    } catch (pushErr) {
      console.warn("[notifications] Rider push failed (notification still saved):", pushErr?.message || pushErr);
    }

    created.pushSent = pushResult.handed ?? pushResult.sent;
    await created.save();
    emitNotificationCreated(created);
    await recordAdminAction(req, {
      action: "Sent a rider message",
      subject: created.title || "Riders",
      tab: "riders",
      href: { screen: "AdminRiderMessages" },
    });
    res.status(201).json({ ...created.toObject(), pushSent: created.pushSent });
  } catch (error) {
    next(error);
  }
}

async function getAdminRiderNotifications(req, res, next) {
  try {
    const notifications = await Notification.find({ kind: "riders" })
      .populate("createdBy", "name email")
      .sort({ createdAt: -1 })
      .limit(50);
    res.json(notifications);
  } catch (error) {
    next(error);
  }
}

async function getAdminNotifications(req, res, next) {
  try {
    const notifications = await Notification.find({ forAllUsers: true, kind: { $nin: ["riders", "order"] } })
      .populate("createdBy", "name email")
      .sort({ createdAt: -1 })
      .limit(100);
    res.json(notifications);
  } catch (error) {
    next(error);
  }
}
async function getMyNotifications(req, res, next) {
  try {
    const userId = String(req.user._id);
    const includeArchived = String(req.query.includeArchived || "false") === "true";
    const clauses = [{ forAllUsers: true, kind: { $ne: "riders" } }, { forUser: req.user._id }];
    if (req.user.isDeliveryPartner) clauses.push({ kind: "riders" });
    const notifications = await Notification.find({ $or: clauses })
      .sort({ createdAt: -1 })
      .limit(100);

    const mapped = notifications.map((item) => {
      const readers = Array.isArray(item.readBy) ? item.readBy : [];
      const archived = Array.isArray(item.archivedBy) ? item.archivedBy : [];
      return {
        ...item.toObject(),
        isRead: readers.some((readerId) => String(readerId) === userId),
        isArchived: archived.some((readerId) => String(readerId) === userId),
      };
    });
    res.json(includeArchived ? mapped : mapped.filter((item) => !item.isArchived));
  } catch (error) {
    next(error);
  }
}

async function markNotificationAsRead(req, res, next) {
  try {
    const { id } = req.params;
    const userId = req.user._id;
    const notification = await Notification.findById(id);

    if (!notification) {
      return res.status(404).json({ message: "Notification not found." });
    }

    const readers = Array.isArray(notification.readBy) ? notification.readBy : [];
    if (!readers.some((readerId) => String(readerId) === String(userId))) {
      notification.readBy = [...readers, userId];
      await notification.save();
    }

    res.json({ message: "Notification marked as read." });
  } catch (error) {
    next(error);
  }
}

async function archiveNotification(req, res, next) {
  try {
    const { id } = req.params;
    const userId = req.user._id;
    const notification = await Notification.findById(id);
    if (!notification) {
      return res.status(404).json({ message: "Notification not found." });
    }
    const archived = Array.isArray(notification.archivedBy) ? notification.archivedBy : [];
    if (!archived.some((readerId) => String(readerId) === String(userId))) {
      notification.archivedBy = [...archived, userId];
      await notification.save();
    }
    return res.json({ message: "Notification archived." });
  } catch (error) {
    next(error);
  }
}

async function unarchiveNotification(req, res, next) {
  try {
    const { id } = req.params;
    const userId = req.user._id;
    const notification = await Notification.findById(id);
    if (!notification) {
      return res.status(404).json({ message: "Notification not found." });
    }
    const archived = Array.isArray(notification.archivedBy) ? notification.archivedBy : [];
    notification.archivedBy = archived.filter((readerId) => String(readerId) !== String(userId));
    await notification.save();
    return res.json({ message: "Notification restored." });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  createBroadcastNotification,
  createRiderNotification,
  getAdminRiderNotifications,
  getAdminNotifications,
  getMyNotifications,
  markNotificationAsRead,
  archiveNotification,
  unarchiveNotification,
};
