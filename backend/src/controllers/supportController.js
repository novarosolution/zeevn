const SupportThread = require("../models/SupportThread");
const User = require("../models/User");

async function getOrCreateMySupportThread(req, res, next) {
  try {
    let thread = await SupportThread.findOne({ user: req.user._id }).populate("user", "name email");
    if (!thread) {
      thread = await SupportThread.create({
        user: req.user._id,
        status: "open",
        messages: [],
      });
      thread = await SupportThread.findById(thread._id).populate("user", "name email");
    }
    res.json(thread);
  } catch (error) {
    next(error);
  }
}

async function sendMessageToSupport(req, res, next) {
  try {
    const message = String(req.body?.message || "").trim();
    if (!message) {
      return res.status(400).json({ message: "Message is required." });
    }

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
      message,
    });
    thread.status = "open";
    thread.lastMessageAt = new Date();
    await thread.save();

    const populated = await SupportThread.findById(thread._id).populate("user", "name email");
    res.status(201).json(populated);
  } catch (error) {
    next(error);
  }
}

async function getAdminSupportThreads(req, res, next) {
  try {
    const threads = await SupportThread.find()
      .sort({ lastMessageAt: -1 })
      .populate("user", "name email phone");
    res.json(threads);
  } catch (error) {
    next(error);
  }
}

async function replyToSupportThread(req, res, next) {
  try {
    const { id } = req.params;
    const message = String(req.body?.message || "").trim();
    if (!message) {
      return res.status(400).json({ message: "Message is required." });
    }

    const thread = await SupportThread.findById(id);
    if (!thread) {
      return res.status(404).json({ message: "Support thread not found." });
    }

    thread.messages.push({
      senderRole: "admin",
      senderName: req.user.name || "Admin",
      message,
    });
    if (req.body?.status && ["open", "closed"].includes(req.body.status)) {
      thread.status = req.body.status;
    }
    thread.lastMessageAt = new Date();
    await thread.save();

    const populated = await SupportThread.findById(thread._id).populate("user", "name email phone");
    res.json(populated);
  } catch (error) {
    next(error);
  }
}

async function updateSupportThreadStatus(req, res, next) {
  try {
    const { id } = req.params;
    const status = String(req.body?.status || "").trim().toLowerCase();
    if (!["open", "closed"].includes(status)) {
      return res.status(400).json({ message: "Status must be open or closed." });
    }

    const thread = await SupportThread.findById(id);
    if (!thread) {
      return res.status(404).json({ message: "Support thread not found." });
    }

    thread.status = status;
    await thread.save();
    const populated = await SupportThread.findById(thread._id).populate("user", "name email phone");
    res.json(populated);
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
