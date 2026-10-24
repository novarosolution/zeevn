const Coupon = require("../models/Coupon");
const {
  normalizeCouponCode,
  couponCodeQuery,
  parseCouponExpiry,
  getCouponValidationError,
  computeCouponDiscount,
} = require("../utils/coupon");
const { recordAdminAction } = require("../utils/adminLog");

function present(doc) {
  const user = doc.issuedForUser && typeof doc.issuedForUser === "object" ? doc.issuedForUser : null;
  return {
    _id: String(doc._id),
    code: doc.code,
    title: doc.title || "",
    type: doc.type === "flat" ? "flat" : "percent",
    value: Number(doc.value || 0),
    minOrderAmount: Number(doc.minOrderAmount || 0),
    maxDiscountAmount: Number(doc.maxDiscountAmount || 0) || null,
    usageLimit: Number.isFinite(Number(doc.usageLimit)) && Number(doc.usageLimit) >= 1 ? Number(doc.usageLimit) : null,
    usedCount: Number(doc.usedCount || 0),
    isActive: doc.isActive !== false,
    isVisibleToUsers: doc.isVisibleToUsers !== false,
    isOneTimePerUser: Boolean(doc.isOneTimePerUser),
    expiresAt: doc.expiresAt || null,
    issuedForUser: user?._id ? String(user._id) : doc.issuedForUser ? String(doc.issuedForUser) : null,
    issuedForName: user?.name || "",
    issuedForEmail: user?.email || "",
    createdAt: doc.createdAt,
  };
}

function optionalAmount(value, fallback = null) {
  if (value === "" || value == null) return fallback;
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function optionalUsageLimit(value) {
  if (value === "" || value == null) return { ok: true, value: null };
  const n = Math.floor(Number(value));
  if (!Number.isFinite(n) || n < 1) {
    return { ok: false, message: "Usage limit must be a whole number of at least 1." };
  }
  return { ok: true, value: n };
}

async function getAdminCoupons(req, res, next) {
  try {
    const coupons = await Coupon.find().sort({ createdAt: -1 }).populate("issuedForUser", "name email").lean();
    res.json(coupons.map(present));
  } catch (error) {
    next(error);
  }
}

async function createAdminCoupon(req, res, next) {
  try {
    const code = normalizeCouponCode(req.body?.code);
    const value = Number(req.body?.value);
    const type = String(req.body?.type || "percent").toLowerCase();

    if (!code) {
      return res.status(400).json({ message: "Coupon code is required." });
    }
    if (!["percent", "flat"].includes(type)) {
      return res.status(400).json({ message: "Coupon type must be percent or flat." });
    }
    if (!Number.isFinite(value) || value <= 0) {
      return res.status(400).json({ message: "Coupon value must be greater than 0." });
    }
    if (type === "percent" && value > 100) {
      return res.status(400).json({ message: "Percent coupon cannot be more than 100." });
    }

    const usage = optionalUsageLimit(req.body?.usageLimit);
    if (!usage.ok) return res.status(400).json({ message: usage.message });

    const existing = await Coupon.findOne(couponCodeQuery(code));
    if (existing) {
      return res.status(400).json({ message: "Coupon code already exists." });
    }

    const coupon = await Coupon.create({
      code,
      title: String(req.body?.title || "").trim(),
      type,
      value,
      minOrderAmount: Math.max(0, optionalAmount(req.body?.minOrderAmount, 0) || 0),
      maxDiscountAmount: optionalAmount(req.body?.maxDiscountAmount, null),
      usageLimit: usage.value,
      isActive: req.body?.isActive !== false,
      isVisibleToUsers: req.body?.isVisibleToUsers !== false,
      isOneTimePerUser: Boolean(req.body?.isOneTimePerUser),
      expiresAt: parseCouponExpiry(req.body?.expiresAt),
    });

    await recordAdminAction(req, {
      action: "Created coupon",
      subject: coupon.code || "Coupon",
      tab: "catalog",
      href: { screen: "AdminCoupons" },
    });
    res.status(201).json(present(coupon));
  } catch (error) {
    if (error?.code === 11000) {
      return res.status(400).json({ message: "Coupon code already exists." });
    }
    next(error);
  }
}

async function updateAdminCoupon(req, res, next) {
  try {
    const coupon = await Coupon.findById(req.params.id);
    if (!coupon) {
      return res.status(404).json({ message: "Coupon not found." });
    }
    if (coupon.issuedForUser) {
      return res.status(400).json({ message: "This code was issued to a customer and is not edited here." });
    }

    if (req.body?.code !== undefined) {
      const code = normalizeCouponCode(req.body.code);
      if (!code) return res.status(400).json({ message: "Coupon code cannot be empty." });
      const duplicate = await Coupon.findOne({ ...couponCodeQuery(code), _id: { $ne: coupon._id } });
      if (duplicate) return res.status(400).json({ message: "Coupon code already exists." });
      coupon.code = code;
    }

    if (req.body?.title !== undefined) coupon.title = String(req.body.title || "").trim();
    if (req.body?.type !== undefined) {
      const type = String(req.body.type || "").toLowerCase();
      if (!["percent", "flat"].includes(type)) {
        return res.status(400).json({ message: "Coupon type must be percent or flat." });
      }
      coupon.type = type;
    }
    if (req.body?.value !== undefined) {
      const value = Number(req.body.value);
      if (!Number.isFinite(value) || value <= 0) {
        return res.status(400).json({ message: "Coupon value must be greater than 0." });
      }
      coupon.value = value;
    }
    if (coupon.type === "percent" && Number(coupon.value) > 100) {
      return res.status(400).json({ message: "Percent coupon cannot be more than 100." });
    }
    if (req.body?.minOrderAmount !== undefined) {
      coupon.minOrderAmount = Math.max(0, optionalAmount(req.body.minOrderAmount, 0) || 0);
    }
    if (req.body?.maxDiscountAmount !== undefined) {
      coupon.maxDiscountAmount = optionalAmount(req.body.maxDiscountAmount, null);
    }
    if (req.body?.usageLimit !== undefined) {
      const usage = optionalUsageLimit(req.body.usageLimit);
      if (!usage.ok) return res.status(400).json({ message: usage.message });
      coupon.usageLimit = usage.value;
    }
    if (req.body?.isActive !== undefined) coupon.isActive = Boolean(req.body.isActive);
    if (req.body?.isVisibleToUsers !== undefined) {
      coupon.isVisibleToUsers = Boolean(req.body.isVisibleToUsers);
    }
    if (req.body?.isOneTimePerUser !== undefined) {
      coupon.isOneTimePerUser = Boolean(req.body.isOneTimePerUser);
    }
    if (req.body?.expiresAt !== undefined) {
      coupon.expiresAt = parseCouponExpiry(req.body.expiresAt);
    }

    await coupon.save();
    const saved = await coupon.populate("issuedForUser", "name email");
    await recordAdminAction(req, {
      action: "Edited coupon",
      subject: coupon.code || "Coupon",
      tab: "catalog",
      href: { screen: "AdminCoupons" },
    });
    res.json(present(saved));
  } catch (error) {
    if (error?.code === 11000) {
      return res.status(400).json({ message: "Coupon code already exists." });
    }
    next(error);
  }
}

function buildCouponValidationResponse(coupon, subtotal) {
  const errorMessage = getCouponValidationError(coupon, subtotal);
  if (errorMessage) return { valid: false, message: errorMessage };

  const discountAmount = computeCouponDiscount(coupon, subtotal);
  return {
    valid: true,
    message: "Coupon applied successfully.",
    coupon: {
      code: coupon.code,
      title: coupon.title,
      type: coupon.type,
      value: Number(coupon.value),
      discountAmount,
      minOrderAmount: Number(coupon.minOrderAmount || 0),
      maxDiscountAmount: Number(coupon.maxDiscountAmount || 0) || null,
      expiresAt: coupon.expiresAt || null,
    },
  };
}

module.exports = {
  getAdminCoupons,
  createAdminCoupon,
  updateAdminCoupon,
  buildCouponValidationResponse,
};
