const Notification = require("../models/Notification");
const User = require("../models/User");

function chunkArray(items, chunkSize) {
  const chunks = [];
  for (let i = 0; i < items.length; i += chunkSize) {
    chunks.push(items.slice(i, i + chunkSize));
  }
  return chunks;
}

async function sendExpoPushBroadcast({ title, message }) {
  const users = await User.find(
    { expoPushTokens: { $exists: true, $not: { $size: 0 } } },
    { expoPushTokens: 1 }
  ).lean();

  const allTokens = Array.from(
    new Set(
      users.flatMap((user) => (Array.isArray(user.expoPushTokens) ? user.expoPushTokens : []))
    )
  );
  if (allTokens.length === 0) {
    return { sent: 0 };
  }

  const messages = allTokens.map((to) => ({
    to,
    sound: "default",
    title,
    body: message,
    priority: "high",
    channelId: "default",
    data: { type: "broadcast" },
  }));

  const invalidTokens = new Set();
  let sentCount = 0;
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

  return { sent: sentCount };
}

async function createBroadcastNotification(req, res, next) {
  try {
    const { title, message } = req.body || {};

    if (!String(title || "").trim() || !String(message || "").trim()) {
      return res.status(400).json({ message: "Title and message are required." });
    }

    const created = await Notification.create({
      title: String(title).trim(),
      message: String(message).trim(),
      forAllUsers: true,
      createdBy: req.user._id,
    });

    let pushResult = { sent: 0 };
    try {
      pushResult = await sendExpoPushBroadcast({
        title: created.title,
        message: created.message,
      });
    } catch (pushErr) {
      console.warn("[notifications] Broadcast push failed (notification still saved):", pushErr?.message || pushErr);
    }

    res.status(201).json({ ...created.toObject(), pushSent: pushResult.sent });
  } catch (error) {
    next(error);
  }
}

async function getAdminNotifications(req, res, next) {
  try {
    const notifications = await Notification.find({ forAllUsers: true })
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
    const notifications = await Notification.find({ forAllUsers: true })
      .sort({ createdAt: -1 })
      .limit(100);

    const mapped = notifications.map((item) => {
      const readers = Array.isArray(item.readBy) ? item.readBy : [];
      return {
        ...item.toObject(),
        isRead: readers.some((readerId) => String(readerId) === userId),
      };
    });

    res.json(mapped);
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

module.exports = {
  createBroadcastNotification,
  getAdminNotifications,
  getMyNotifications,
  markNotificationAsRead,
};
