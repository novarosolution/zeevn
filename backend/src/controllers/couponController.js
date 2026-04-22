const Coupon = require("../models/Coupon");
const {
  normalizeCouponCode,
  getCouponValidationError,
  computeCouponDiscount,
} = require("../utils/coupon");

async function getAdminCoupons(req, res, next) {
  try {
    const coupons = await Coupon.find().sort({ createdAt: -1 });
    res.json(coupons);
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

    const existing = await Coupon.findOne({ code });
    if (existing) {
      return res.status(400).json({ message: "Coupon code already exists." });
    }

    const coupon = await Coupon.create({
      code,
      title: String(req.body?.title || "").trim(),
      type,
      value,
      minOrderAmount: Number(req.body?.minOrderAmount || 0),
      maxDiscountAmount:
        req.body?.maxDiscountAmount === "" || req.body?.maxDiscountAmount === null
          ? null
          : Number(req.body?.maxDiscountAmount),
      usageLimit:
        req.body?.usageLimit === "" || req.body?.usageLimit === null
          ? null
          : Number(req.body?.usageLimit),
      isActive: req.body?.isActive !== false,
      isVisibleToUsers: req.body?.isVisibleToUsers !== false,
      isOneTimePerUser: Boolean(req.body?.isOneTimePerUser),
      expiresAt: req.body?.expiresAt ? new Date(req.body.expiresAt) : null,
    });

    res.status(201).json(coupon);
  } catch (error) {
    next(error);
  }
}

async function updateAdminCoupon(req, res, next) {
  try {
    const coupon = await Coupon.findById(req.params.id);
    if (!coupon) {
      return res.status(404).json({ message: "Coupon not found." });
    }

    if (req.body?.code !== undefined) {
      const code = normalizeCouponCode(req.body.code);
      if (!code) return res.status(400).json({ message: "Coupon code cannot be empty." });
      const duplicate = await Coupon.findOne({ code, _id: { $ne: coupon._id } });
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
      coupon.minOrderAmount = Number(req.body.minOrderAmount || 0);
    }
    if (req.body?.maxDiscountAmount !== undefined) {
      coupon.maxDiscountAmount =
        req.body.maxDiscountAmount === "" || req.body.maxDiscountAmount === null
          ? null
          : Number(req.body.maxDiscountAmount);
    }
    if (req.body?.usageLimit !== undefined) {
      coupon.usageLimit =
        req.body.usageLimit === "" || req.body.usageLimit === null
          ? null
          : Number(req.body.usageLimit);
    }
    if (req.body?.isActive !== undefined) coupon.isActive = Boolean(req.body.isActive);
    if (req.body?.isVisibleToUsers !== undefined) {
      coupon.isVisibleToUsers = Boolean(req.body.isVisibleToUsers);
    }
    if (req.body?.isOneTimePerUser !== undefined) {
      coupon.isOneTimePerUser = Boolean(req.body.isOneTimePerUser);
    }
    if (req.body?.expiresAt !== undefined) {
      coupon.expiresAt = req.body.expiresAt ? new Date(req.body.expiresAt) : null;
    }

    await coupon.save();
    res.json(coupon);
  } catch (error) {
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
