const mongoose = require("mongoose");
const User = require("../models/User");
const AccountDeletion = require("../models/AccountDeletion");

const PAGE = { min: 5, max: 100, fallback: 25 };
const STATUSES = ["pending", "approved", "rejected"];
const isId = (value) => mongoose.Types.ObjectId.isValid(String(value || ""));
const actorName = (user) => String(user?.name || "Admin").trim().slice(0, 80);
const { recordAdminAction } = require("../utils/adminLog");

const EMPTY_ADDRESS = {
  addressType: "Home",
  houseNumber: "",
  line1: "",
  landmark: "",
  city: "",
  state: "",
  postalCode: "",
  country: "",
  latitude: null,
  longitude: null,
};

function present(doc) {
  return {
    _id: String(doc._id),
    userId: String(doc.user?._id || doc.user || ""),
    name: doc.name || doc.user?.name || "—",
    email: doc.email || doc.user?.email || "",
    phone: doc.phone || doc.user?.phone || "",
    role: doc.wasRider ? "Rider" : "Customer",
    wasRider: Boolean(doc.wasRider),
    reason: doc.reason || "",
    status: doc.status,
    adminNote: doc.adminNote || "",
    decidedByName: doc.decidedByName || "",
    decidedAt: doc.decidedAt || null,
    createdAt: doc.createdAt,
  };
}

async function latestForUser(userId) {
  const pending = await AccountDeletion.findOne({ user: userId, status: "pending" }).sort({ createdAt: -1 }).lean();
  if (pending) return pending;
  return AccountDeletion.findOne({ user: userId, status: "rejected" }).sort({ createdAt: -1 }).lean();
}

function deletionPublic(doc) {
  if (!doc) return null;
  return {
    status: doc.status,
    adminNote: doc.status === "rejected" ? doc.adminNote || "" : "",
    requestedAt: doc.createdAt,
  };
}

async function createMyDeletion(req, res, next) {
  try {
    if (req.user.isAdmin) {
      return res.status(400).json({ message: "An admin cannot file a request for their own account." });
    }
    const open = await AccountDeletion.findOne({ user: req.user._id, status: "pending" });
    if (open) {
      return res.status(400).json({ message: "A deletion request is already pending." });
    }
    const reason = String(req.body?.reason || "").trim().slice(0, 300);
    const doc = await AccountDeletion.create({
      user: req.user._id,
      wasRider: Boolean(req.user.isDeliveryPartner),
      name: String(req.user.name || "").trim().slice(0, 80),
      email: String(req.user.email || "").trim().slice(0, 120),
      phone: String(req.user.phone || "").trim().slice(0, 40),
      reason,
    });
    res.status(201).json(deletionPublic(doc));
  } catch (error) {
    if (error?.code === 11000) {
      return res.status(400).json({ message: "A deletion request is already pending." });
    }
    next(error);
  }
}

async function getMyDeletion(req, res, next) {
  try {
    res.json(deletionPublic(await latestForUser(req.user._id)));
  } catch (error) {
    next(error);
  }
}

async function listAdminDeletions(req, res, next) {
  try {
    const status = STATUSES.includes(String(req.query.status || "")) ? String(req.query.status) : "";
    const filter = status ? { status } : {};
    const pageSize = Math.min(PAGE.max, Math.max(PAGE.min, Math.round(Number(req.query.pageSize)) || PAGE.fallback));
    const [total, pending, approved, rejected] = await Promise.all([
      AccountDeletion.countDocuments(filter),
      AccountDeletion.countDocuments({ status: "pending" }),
      AccountDeletion.countDocuments({ status: "approved" }),
      AccountDeletion.countDocuments({ status: "rejected" }),
    ]);
    const pages = Math.max(1, Math.ceil(total / pageSize) || 1);
    const page = Math.min(pages, Math.max(1, Math.round(Number(req.query.page)) || 1));
    const rows = await AccountDeletion.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * pageSize)
      .limit(pageSize)
      .populate("user", "name email phone isDeliveryPartner")
      .lean();
    res.json({
      items: rows.map(present),
      total,
      page,
      pages,
      pageSize,
      counts: { pending, approved, rejected },
    });
  } catch (error) {
    next(error);
  }
}

async function getAdminDeletion(req, res, next) {
  try {
    if (!isId(req.params.id)) return res.status(400).json({ message: "Invalid request id." });
    const doc = await AccountDeletion.findById(req.params.id).populate("user", "name email phone isDeliveryPartner isAdmin").lean();
    if (!doc) return res.status(404).json({ message: "Deletion request not found." });
    res.json(present(doc));
  } catch (error) {
    next(error);
  }
}

async function wipeUser(user) {
  await User.updateOne(
    { _id: user._id },
    {
      $set: {
        name: "Deleted user",
        email: `deleted+${user._id}@zeevan.invalid`,
        phone: "",
        adminNote: "",
        password: "",
        authProviders: [],
        expoPushTokens: [],
        cartItems: [],
        avatar: "",
        defaultAddress: EMPTY_ADDRESS,
        isDeliveryPartner: false,
        deliveryLiveLocation: { latitude: null, longitude: null, accuracyMeters: null, updatedAt: null },
        rewardPoints: 0,
        deletedAt: new Date(),
      },
    }
  );
}

async function approveDeletion(req, res, next) {
  try {
    if (!isId(req.params.id)) return res.status(400).json({ message: "Invalid request id." });
    const doc = await AccountDeletion.findById(req.params.id);
    if (!doc) return res.status(404).json({ message: "Deletion request not found." });
    if (doc.status !== "pending") {
      return res.status(400).json({ message: "This request has already been decided." });
    }
    const user = await User.findById(doc.user);
    if (!user) return res.status(404).json({ message: "User not found." });
    if (user.isAdmin) {
      return res.status(400).json({ message: "An admin account is not closed here." });
    }
    await wipeUser(user);
    doc.status = "approved";
    doc.adminNote = String(req.body?.note || "").trim().slice(0, 300);
    doc.decidedBy = req.user?._id || null;
    doc.decidedByName = actorName(req.user);
    doc.decidedAt = new Date();
    await doc.save();
    await recordAdminAction(req, {
      action: "Approved deletion",
      subject: doc.name || user.name || "Customer",
      tab: "people",
      href: { screen: "AdminDeletions", params: { requestId: String(doc._id) } },
    });
    res.json(present(doc.toObject()));
  } catch (error) {
    next(error);
  }
}

async function rejectDeletion(req, res, next) {
  try {
    if (!isId(req.params.id)) return res.status(400).json({ message: "Invalid request id." });
    const note = String(req.body?.note || "").trim().slice(0, 300);
    if (!note) return res.status(400).json({ message: "A note is required to reject." });
    const doc = await AccountDeletion.findById(req.params.id);
    if (!doc) return res.status(404).json({ message: "Deletion request not found." });
    if (doc.status !== "pending") {
      return res.status(400).json({ message: "This request has already been decided." });
    }
    doc.status = "rejected";
    doc.adminNote = note;
    doc.decidedBy = req.user?._id || null;
    doc.decidedByName = actorName(req.user);
    doc.decidedAt = new Date();
    await doc.save();
    await recordAdminAction(req, {
      action: "Rejected deletion",
      subject: doc.name || "Customer",
      tab: "people",
      href: { screen: "AdminDeletions", params: { requestId: String(doc._id) } },
    });
    res.json(present(doc.toObject()));
  } catch (error) {
    next(error);
  }
}

module.exports = {
  createMyDeletion,
  getMyDeletion,
  latestForUser,
  deletionPublic,
  listAdminDeletions,
  getAdminDeletion,
  approveDeletion,
  rejectDeletion,
};
