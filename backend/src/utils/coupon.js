function normalizeCouponCode(rawCode = "") {
  return String(rawCode || "").trim().toUpperCase();
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
    return `Minimum order for this coupon is ${Number(coupon.minOrderAmount || 0).toFixed(2)}.`;
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
  getCouponValidationError,
  computeCouponDiscount,
};
