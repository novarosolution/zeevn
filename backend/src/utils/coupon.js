function normalizeCouponCode(rawCode = "") {
  return String(rawCode || "").replace(/\s+/g, "").toUpperCase();
}

/** Match a stored code even if older rows still contain spaces. */
function couponCodeQuery(raw) {
  const code = normalizeCouponCode(raw);
  if (!code) return null;
  const escaped = code.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return { $or: [{ code }, { code: new RegExp(`^${[...escaped].join("\\s*")}$`, "i") }] };
}

/** Start of that calendar day in Asia/Kolkata. Empty is no expiry. */
function parseCouponExpiry(value) {
  if (value === "" || value == null) return null;
  const raw = String(value).trim();
  if (!raw) return null;
  const day = /^(\d{4})-(\d{2})-(\d{2})/.exec(raw);
  if (day) return new Date(`${day[1]}-${day[2]}-${day[3]}T00:00:00+05:30`);
  const when = new Date(raw);
  return Number.isNaN(when.getTime()) ? null : when;
}

function getCouponValidationError(coupon, subtotal) {
  if (!coupon) return "Coupon not found.";
  if (!coupon.isActive) return "Coupon is inactive.";
  if (coupon.expiresAt && new Date(coupon.expiresAt).getTime() < Date.now()) {
    return "Coupon has expired.";
  }
  if (
    Number.isFinite(Number(coupon.usageLimit)) &&
    Number(coupon.usageLimit) > 0 &&
    Number(coupon.usedCount || 0) >= Number(coupon.usageLimit)
  ) {
    return "Coupon usage limit reached.";
  }
  if (Number(subtotal || 0) < Number(coupon.minOrderAmount || 0)) {
    return `Minimum order for this coupon is ₹${Math.max(0, Math.round(Number(coupon.minOrderAmount || 0)))}.`;
  }
  return "";
}

function computeCouponDiscount(coupon, subtotal) {
  const safeSubtotal = Math.max(0, Number(subtotal || 0));
  if (!coupon || safeSubtotal <= 0) return 0;

  let discountAmount = 0;
  if (coupon.type === "flat") {
    discountAmount = Number(coupon.value || 0);
  } else {
    discountAmount = safeSubtotal * (Number(coupon.value || 0) / 100);
  }

  if (Number.isFinite(Number(coupon.maxDiscountAmount)) && Number(coupon.maxDiscountAmount) > 0) {
    discountAmount = Math.min(discountAmount, Number(coupon.maxDiscountAmount));
  }

  discountAmount = Math.min(discountAmount, safeSubtotal);
  return Number(discountAmount.toFixed(2));
}

module.exports = {
  normalizeCouponCode,
  couponCodeQuery,
  parseCouponExpiry,
  getCouponValidationError,
  computeCouponDiscount,
};
