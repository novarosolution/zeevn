const SupportThread = require("../models/SupportThread");
const { emitSupportThreadUpdated } = require("../realtime/socketHub");
const { recordAdminAction } = require("../utils/adminLog");

const USER_FIELDS = "name email phone";
const MAX_MESSAGE = 2000;

function readMessage(raw) {
  const message = String(raw || "").trim();
  if (!message) return { error: "Message is required." };
  if (message.length > MAX_MESSAGE) return { error: "Message is at most 2000 characters." };
  return { message };
}

function lastOf(thread) {
  const messages = thread.messages || [];
  return messages.length ? messages[messages.length - 1] : null;
}

function presentThread(thread) {
  const last = lastOf(thread);
  const user = thread.user && typeof thread.user === "object" ? thread.user : {};
  return {
    _id: thread._id,
    status: thread.status,
    lastMessageAt: thread.lastMessageAt,
    user: {
      _id: user._id || thread.user,
      name: user.name || "",
      email: user.email || "",
      phone: user.phone || "",
    },
    lastMessage: last ? String(last.message || "").replace(/\s+/g, " ").trim() : "",
    lastSenderRole: last?.senderRole || "",
    waiting: thread.status === "open" && Boolean(last) && last.senderRole !== "admin",
    messages: (thread.messages || []).map((row) => ({
      senderRole: row.senderRole,
      senderName: row.senderName || "",
      message: row.message,
      createdAt: row.createdAt,
    })),
  };
}

async function loadThread(id) {
  return SupportThread.findById(id).populate("user", USER_FIELDS);
}

async function getOrCreateMySupportThread(req, res, next) {
  try {
    const thread = await SupportThread.findOne({ user: req.user._id }).populate("user", USER_FIELDS);
    if (!thread) {
      return res.json({
        user: { _id: req.user._id, name: req.user.name || "", email: req.user.email || "", phone: req.user.phone || "" },
        status: "open",
        messages: [],
        lastMessageAt: null,
      });
    }
    res.json(thread);
  } catch (error) {
    next(error);
  }
}

async function sendMessageToSupport(req, res, next) {
  try {
    const read = readMessage(req.body?.message);
    if (read.error) return res.status(400).json({ message: read.error });

    let thread = await SupportThread.findOne({ user: req.user._id });
    if (!thread) {
      thread = await SupportThread.create({
        user: req.user._id,
        status: "open",
        messages: [],
      });
    }

    thread.messages.push({
      senderRole: "user",
      senderName: req.user.name || "User",
      message: read.message,
    });
    thread.status = "open";
    thread.lastMessageAt = new Date();
    await thread.save();

    const populated = await loadThread(thread._id);
    emitSupportThreadUpdated(populated);
    res.status(201).json(populated);
  } catch (error) {
    next(error);
  }
}

async function getAdminSupportThreads(req, res, next) {
  try {
    const threads = await SupportThread.find({ "messages.0": { $exists: true } })
      .sort({ lastMessageAt: -1 })
      .populate("user", USER_FIELDS)
      .lean();
    res.json(threads.map(presentThread));
  } catch (error) {
    next(error);
  }
}

async function replyToSupportThread(req, res, next) {
  try {
    const read = readMessage(req.body?.message);
    if (read.error) return res.status(400).json({ message: read.error });

    const thread = await SupportThread.findById(req.params.id);
    if (!thread) return res.status(404).json({ message: "Support thread not found." });
    if (!thread.messages.length) {
      return res.status(400).json({ message: "You cannot start a thread for someone who has never written." });
    }

    thread.messages.push({
      senderRole: "admin",
      senderName: req.user.name || "Admin",
      message: read.message,
    });
    thread.lastMessageAt = new Date();
    await thread.save();

    const populated = await loadThread(thread._id);
    emitSupportThreadUpdated(populated);
    const presented = presentThread(populated.toObject ? populated.toObject() : populated);
    await recordAdminAction(req, {
      action: "Replied to support",
      subject: presented.user?.name || "Customer",
      tab: "people",
      href: { screen: "AdminSupport", params: { threadId: String(thread._id) } },
    });
    res.json(presented);
  } catch (error) {
    next(error);
  }
}

async function updateSupportThreadStatus(req, res, next) {
  try {
    const status = String(req.body?.status || "").trim().toLowerCase();
    if (!["open", "closed"].includes(status)) {
      return res.status(400).json({ message: "Status must be open or closed." });
    }

    const thread = await SupportThread.findById(req.params.id);
    if (!thread) return res.status(404).json({ message: "Support thread not found." });

    const prev = thread.status;
    thread.status = status;
    await thread.save();
    const populated = await loadThread(thread._id);
    emitSupportThreadUpdated(populated);
    const presented = presentThread(populated.toObject ? populated.toObject() : populated);
    if (prev !== status) {
      await recordAdminAction(req, {
        action: status === "closed" ? "Closed conversation" : "Reopened conversation",
        subject: presented.user?.name || "Customer",
        tab: "people",
        href: { screen: "AdminSupport", params: { threadId: String(thread._id) } },
      });
    }
    res.json(presented);
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getOrCreateMySupportThread,
  sendMessageToSupport,
  getAdminSupportThreads,
  replyToSupportThread,
  updateSupportThreadStatus,
};
