const crypto = require("crypto");
const mongoose = require("mongoose");
const Reward = require("../models/Reward");
const RewardRedemption = require("../models/RewardRedemption");
const Coupon = require("../models/Coupon");
const User = require("../models/User");
const { recordAdminAction } = require("../utils/adminLog");
const {
  normalizeCouponCode,
  parseCouponExpiry,
  computeCouponDiscount,
  getCouponValidationError,
} = require("../utils/coupon");

function present(doc) {
  return {
    _id: String(doc._id),
    title: doc.title || "Reward",
    description: doc.description || "",
    pointsCost: Math.max(1, Math.floor(Number(doc.pointsCost) || 1)),
    discountType: doc.discountType === "flat" ? "flat" : "percent",
    discountValue: Number(doc.discountValue || 0),
    minOrderAmount: Number(doc.minOrderAmount || 0),
    maxDiscountAmount: Number(doc.maxDiscountAmount || 0) || null,
    totalRedemptionLimit:
      Number.isFinite(Number(doc.totalRedemptionLimit)) && Number(doc.totalRedemptionLimit) >= 1
        ? Number(doc.totalRedemptionLimit)
        : null,
    redemptionCount: Number(doc.redemptionCount || 0),
    perUserLimit: Math.max(1, Math.floor(Number(doc.perUserLimit) || 1)),
    issuedCouponValidDays: Math.max(1, Math.floor(Number(doc.issuedCouponValidDays) || 90)),
    isActive: doc.isActive !== false,
    isVisibleToUsers: doc.isVisibleToUsers !== false,
    expiresAt: doc.expiresAt || null,
    createdAt: doc.createdAt,
  };
}

function optionalLimit(value, label) {
  if (value === "" || value == null) return { ok: true, value: null };
  const n = Math.floor(Number(value));
  if (!Number.isFinite(n) || n < 1) {
    return { ok: false, message: `${label} must be a whole number of at least 1.` };
  }
  return { ok: true, value: n };
}

function optionalCap(value) {
  if (value === "" || value == null) return { ok: true, value: null };
  const n = Number(value);
  if (!Number.isFinite(n) || n <= 0) {
    return { ok: false, message: "Max discount must be greater than 0, or empty for no cap." };
  }
  return { ok: true, value: n };
}

function generateRewardCouponCode() {
  return `RW-${crypto.randomBytes(5).toString("hex")}`.toUpperCase();
}

async function ensureUniqueCouponCode() {
  for (let i = 0; i < 8; i += 1) {
    const code = normalizeCouponCode(generateRewardCouponCode());
    const exists = await Coupon.exists({ code });
    if (!exists) return code;
  }
  throw new Error("Unable to generate a unique reward coupon code.");
}

async function getAdminRewards(req, res, next) {
  try {
    const list = await Reward.find().sort({ createdAt: -1 }).lean();
    res.json(list.map(present));
  } catch (error) {
    next(error);
  }
}

async function createAdminReward(req, res, next) {
  try {
    const discountType = String(req.body?.discountType || "percent").toLowerCase();
    const discountValue = Number(req.body?.discountValue);
    const pointsCost = Math.floor(Number(req.body?.pointsCost));

    if (!["percent", "flat"].includes(discountType)) {
      return res.status(400).json({ message: "Discount type must be percent or flat." });
    }
    if (!Number.isFinite(discountValue) || discountValue <= 0) {
      return res.status(400).json({ message: "Discount value must be greater than 0." });
    }
    if (discountType === "percent" && discountValue > 100) {
      return res.status(400).json({ message: "Percent discount cannot be over 100." });
    }
    if (!Number.isFinite(pointsCost) || pointsCost < 1) {
      return res.status(400).json({ message: "Points cost must be a whole number of at least 1." });
    }

    const total = optionalLimit(req.body?.totalRedemptionLimit, "Total redemption limit");
    if (!total.ok) return res.status(400).json({ message: total.message });
    const perUser = optionalLimit(req.body?.perUserLimit ?? 1, "Per customer limit");
    if (!perUser.ok) return res.status(400).json({ message: perUser.message });
    const days = optionalLimit(req.body?.issuedCouponValidDays ?? 90, "Issued code days");
    if (!days.ok) return res.status(400).json({ message: days.message });
    const cap = optionalCap(req.body?.maxDiscountAmount);
    if (!cap.ok) return res.status(400).json({ message: cap.message });

    const reward = await Reward.create({
      title: String(req.body?.title || "").trim() || "Reward",
      description: String(req.body?.description || "").trim(),
      pointsCost,
      discountType,
      discountValue,
      minOrderAmount: Math.max(0, Number(req.body?.minOrderAmount || 0) || 0),
      maxDiscountAmount: cap.value,
      totalRedemptionLimit: total.value,
      perUserLimit: perUser.value || 1,
      issuedCouponValidDays: days.value || 90,
      isActive: req.body?.isActive !== false,
      isVisibleToUsers: req.body?.isVisibleToUsers !== false,
      expiresAt: parseCouponExpiry(req.body?.expiresAt),
    });

    await recordAdminAction(req, {
      action: "Created reward",
      subject: reward.title || "Reward",
      tab: "catalog",
      href: { screen: "AdminRewards" },
    });
    res.status(201).json(present(reward));
  } catch (error) {
    next(error);
  }
}

async function updateAdminReward(req, res, next) {
  try {
    const reward = await Reward.findById(req.params.id);
    if (!reward) {
      return res.status(404).json({ message: "Reward not found." });
    }

    if (req.body?.title !== undefined) reward.title = String(req.body.title || "").trim() || "Reward";
    if (req.body?.description !== undefined) {
      reward.description = String(req.body.description || "").trim();
    }
    if (req.body?.pointsCost !== undefined) {
      const pc = Math.floor(Number(req.body.pointsCost));
      if (!Number.isFinite(pc) || pc < 1) {
        return res.status(400).json({ message: "Points cost must be a whole number of at least 1." });
      }
      reward.pointsCost = pc;
    }
    if (req.body?.discountType !== undefined || req.body?.discountValue !== undefined) {
      const discountType = String(req.body?.discountType || reward.discountType).toLowerCase();
      const discountValue = Number(req.body?.discountValue ?? reward.discountValue);
      if (!["percent", "flat"].includes(discountType)) {
        return res.status(400).json({ message: "Discount type must be percent or flat." });
      }
      if (!Number.isFinite(discountValue) || discountValue <= 0) {
        return res.status(400).json({ message: "Discount value must be greater than 0." });
      }
      if (discountType === "percent" && discountValue > 100) {
        return res.status(400).json({ message: "Percent discount cannot be over 100." });
      }
      reward.discountType = discountType;
      reward.discountValue = discountValue;
    }
    if (req.body?.minOrderAmount !== undefined) {
      reward.minOrderAmount = Math.max(0, Number(req.body.minOrderAmount || 0) || 0);
    }
    if (req.body?.maxDiscountAmount !== undefined) {
      const cap = optionalCap(req.body.maxDiscountAmount);
      if (!cap.ok) return res.status(400).json({ message: cap.message });
      reward.maxDiscountAmount = cap.value;
    }
    if (req.body?.totalRedemptionLimit !== undefined) {
      const total = optionalLimit(req.body.totalRedemptionLimit, "Total redemption limit");
      if (!total.ok) return res.status(400).json({ message: total.message });
      reward.totalRedemptionLimit = total.value;
    }
    if (req.body?.perUserLimit !== undefined) {
      const perUser = optionalLimit(req.body.perUserLimit, "Per customer limit");
      if (!perUser.ok) return res.status(400).json({ message: perUser.message });
      reward.perUserLimit = perUser.value || 1;
    }
    if (req.body?.issuedCouponValidDays !== undefined) {
      const days = optionalLimit(req.body.issuedCouponValidDays, "Issued code days");
      if (!days.ok) return res.status(400).json({ message: days.message });
      reward.issuedCouponValidDays = days.value || 90;
    }
    if (req.body?.isActive !== undefined) reward.isActive = Boolean(req.body.isActive);
    if (req.body?.isVisibleToUsers !== undefined) {
      reward.isVisibleToUsers = Boolean(req.body.isVisibleToUsers);
    }
    if (req.body?.expiresAt !== undefined) {
      reward.expiresAt = parseCouponExpiry(req.body.expiresAt);
    }

    await reward.save();
    await recordAdminAction(req, {
      action: "Edited reward",
      subject: reward.title || "Reward",
      tab: "catalog",
      href: { screen: "AdminRewards" },
    });
    res.json(present(reward));
  } catch (error) {
    next(error);
  }
}

function rewardBenefitSummary(r) {
  const type = r.discountType === "flat" ? "flat" : "percent";
  if (type === "flat") {
    return `₹${Number(r.discountValue || 0)} off`;
  }
  return `${Number(r.discountValue || 0)}% off`;
}

/** Shape compatible with `computeCouponDiscount` / `getCouponValidationError` (reward catalog preview). */
function rewardAsCouponShape(r) {
  return {
    type: r.discountType,
    value: Number(r.discountValue || 0),
    maxDiscountAmount:
      r.maxDiscountAmount == null || r.maxDiscountAmount === undefined
        ? null
        : Number(r.maxDiscountAmount),
    minOrderAmount: Number(r.minOrderAmount || 0),
    isActive: true,
    expiresAt: null,
    usageLimit: null,
    usedCount: 0,
  };
}

function couponBenefitSummary(c) {
  const t = String(c.type || "percent").toLowerCase();
  if (t === "flat") {
    return `₹${Number(c.value || 0)} off`;
  }
  return `${Number(c.value || 0)}% off`;
}

function parseCatalogSubtotal(req) {
  const raw = req.query?.subtotal;
  if (raw === undefined || raw === null || raw === "") {
    return null;
  }
  const n = Number(raw);
  if (!Number.isFinite(n) || n < 0) {
    return null;
  }
  return n;
}

async function getRewardsCatalog(req, res, next) {
  try {
    const user = await User.findById(req.user._id).select("rewardPoints");
    const balance = Number(user?.rewardPoints || 0);

    const subtotal = parseCatalogSubtotal(req);

    const redemptionRows = await RewardRedemption.aggregate([
      { $match: { user: req.user._id } },
      { $group: { _id: "$reward", n: { $sum: 1 } } },
    ]);
    const redemptionByReward = new Map(
      redemptionRows.map((row) => [String(row._id), Number(row.n || 0)])
    );

    const now = new Date();
    const rewards = await Reward.find({
      isActive: true,
      isVisibleToUsers: true,
      $or: [{ expiresAt: null }, { expiresAt: { $gt: now } }],
    }).sort({ pointsCost: 1 });

    const items = rewards.map((r) => {
      const userRedemptions = redemptionByReward.get(String(r._id)) || 0;
      const atGlobalCap =
        r.totalRedemptionLimit != null &&
        Number.isFinite(Number(r.totalRedemptionLimit)) &&
        Number(r.redemptionCount || 0) >= Number(r.totalRedemptionLimit);
      const atUserCap = userRedemptions >= Number(r.perUserLimit || 1);

      const synthetic = rewardAsCouponShape(r);
      let estimatedDiscount = 0;
      let eligibleForSubtotal = false;
      if (subtotal !== null) {
        eligibleForSubtotal = !getCouponValidationError(synthetic, subtotal);
        estimatedDiscount = eligibleForSubtotal ? computeCouponDiscount(synthetic, subtotal) : 0;
      }

      const row = {
        _id: r._id,
        title: r.title,
        description: r.description,
        pointsCost: r.pointsCost,
        benefitSummary: rewardBenefitSummary(r),
        discountType: r.discountType,
        discountValue: r.discountValue,
        minOrderAmount: Number(r.minOrderAmount || 0),
        expiresAt: r.expiresAt || null,
        issuedCouponValidDays: r.issuedCouponValidDays,
        userRedemptionCount: userRedemptions,
        canRedeem: !atGlobalCap && !atUserCap && balance >= Number(r.pointsCost || 0),
        disabledReason: atGlobalCap
          ? "Fully redeemed"
          : atUserCap
            ? "Limit reached for your account"
            : balance < Number(r.pointsCost || 0)
              ? "Not enough points"
              : null,
      };

      if (subtotal !== null) {
        row.estimatedDiscount = estimatedDiscount;
        row.eligibleForSubtotal = eligibleForSubtotal;
      }

      const cost = Number(r.pointsCost || 0);
      if (!atGlobalCap && !atUserCap && balance < cost) {
        row.pointsNeeded = Math.max(0, Math.ceil(cost - balance));
      }

      return row;
    });

    const payload = { rewardPoints: balance, rewards: items };
    if (subtotal !== null) {
      payload.catalogSubtotal = subtotal;
    }
    res.json(payload);
  } catch (error) {
    next(error);
  }
}

async function getMyRewardCoupons(req, res, next) {
  try {
    const now = new Date();
    const coupons = await Coupon.find({
      issuedForUser: req.user._id,
      isActive: true,
    })
      .sort({ expiresAt: 1 })
      .lean();

    const unused = coupons.filter((c) => {
      if (c.expiresAt && new Date(c.expiresAt).getTime() <= now.getTime()) {
        return false;
      }
      if (c.usageLimit != null && Number(c.usedCount || 0) >= Number(c.usageLimit)) {
        return false;
      }
      return true;
    });

    const items = unused.map((c) => ({
      _id: c._id,
      code: c.code,
      title: c.title || "",
      expiresAt: c.expiresAt || null,
      benefitSummary: couponBenefitSummary(c),
      minOrderAmount: Number(c.minOrderAmount || 0),
    }));

    res.json({ coupons: items });
  } catch (error) {
    next(error);
  }
}

/**
 * Spend points on a reward coupon. The live database is a single MongoDB server, which refuses multi-document
 * transactions, so every step is one atomic update and anything already done is undone if a later step fails:
 * take the points (only while the balance still covers them) -> reserve a slot -> issue the coupon -> record it.
 */
async function redeemReward(req, res, next) {
  const undo = [];
  const rollback = async () => {
    for (const step of undo.reverse()) {
      try {
        await step();
      } catch (undoError) {
        console.error("[rewards] could not undo a redeem step:", undoError.message);
      }
    }
  };
  try {
    const rewardId = req.params.rewardId;
    if (!mongoose.Types.ObjectId.isValid(String(rewardId))) {
      return res.status(400).json({ message: "Invalid reward id." });
    }

    const reward = await Reward.findById(rewardId);
    if (!reward || !reward.isActive || !reward.isVisibleToUsers) {
      return res.status(404).json({ message: "Reward not available." });
    }
    const now = new Date();
    if (reward.expiresAt && new Date(reward.expiresAt).getTime() <= now.getTime()) {
      return res.status(400).json({ message: "This reward has expired." });
    }
    const totalLimit =
      reward.totalRedemptionLimit != null && Number.isFinite(Number(reward.totalRedemptionLimit))
        ? Number(reward.totalRedemptionLimit)
        : null;
    if (totalLimit !== null && Number(reward.redemptionCount || 0) >= totalLimit) {
      return res.status(400).json({ message: "This reward is fully redeemed." });
    }

    const perUserLimit = Math.max(1, Number(reward.perUserLimit || 1));
    const userRedemptions = await RewardRedemption.countDocuments({ user: req.user._id, reward: reward._id });
    if (userRedemptions >= perUserLimit) {
      return res.status(400).json({ message: "You have reached the redeem limit for this reward." });
    }

    const cost = Math.max(0, Number(reward.pointsCost || 0));
    const paid = await User.findOneAndUpdate(
      { _id: req.user._id, rewardPoints: { $gte: cost } },
      { $inc: { rewardPoints: -cost } },
      { new: true }
    );
    if (!paid) {
      return res.status(400).json({ message: "Not enough reward points." });
    }
    undo.push(() => User.updateOne({ _id: paid._id }, { $inc: { rewardPoints: cost } }));

    const slot = await Reward.findOneAndUpdate(
      totalLimit !== null
        ? { _id: reward._id, redemptionCount: { $lt: totalLimit } }
        : { _id: reward._id },
      { $inc: { redemptionCount: 1 } },
      { new: true }
    );
    if (!slot) {
      await rollback();
      return res.status(400).json({ message: "This reward is fully redeemed." });
    }
    undo.push(() => Reward.updateOne({ _id: reward._id }, { $inc: { redemptionCount: -1 } }));

    const code = await ensureUniqueCouponCode();
    const couponExpires = new Date(
      now.getTime() + Math.max(1, Number(reward.issuedCouponValidDays || 90)) * 86400000
    );
    const coupon = await Coupon.create({
      code,
      title: String(reward.title || "Reward").slice(0, 120),
      type: reward.discountType,
      value: Number(reward.discountValue || 0),
      minOrderAmount: Number(reward.minOrderAmount || 0),
      maxDiscountAmount:
        reward.maxDiscountAmount === null || reward.maxDiscountAmount === undefined
          ? null
          : Number(reward.maxDiscountAmount),
      usageLimit: 1,
      usedCount: 0,
      isActive: true,
      isVisibleToUsers: false,
      isOneTimePerUser: false,
      expiresAt: couponExpires,
      issuedForUser: paid._id,
    });
    undo.push(() => Coupon.deleteOne({ _id: coupon._id }));

    const redemption = await RewardRedemption.create({
      user: paid._id,
      reward: reward._id,
      coupon: coupon._id,
      pointsSpent: cost,
    });
    undo.push(() => RewardRedemption.deleteOne({ _id: redemption._id }));

    // Two taps at once can both pass the check above; if this one went over the limit, give everything back.
    const mine = await RewardRedemption.countDocuments({ user: paid._id, reward: reward._id });
    if (mine > perUserLimit) {
      await rollback();
      return res.status(400).json({ message: "You have reached the redeem limit for this reward." });
    }

    res.status(201).json({
      message: `Redeemed! Use code ${code} at checkout before ${couponExpires.toLocaleDateString()}.`,
      couponCode: code,
      rewardPoints: paid.rewardPoints,
      couponExpiresAt: couponExpires.toISOString(),
    });
  } catch (error) {
    await rollback();
    next(error);
  }
}

module.exports = {
  getAdminRewards,
  createAdminReward,
  updateAdminReward,
  getRewardsCatalog,
  getMyRewardCoupons,
  redeemReward,
};
