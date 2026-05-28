const {
  normalizeCouponCode,
  getCouponValidationError,
  computeCouponDiscount,
} = require("../coupon");

describe("coupon utils", () => {
  test("percentage coupon on subtotal", () => {
    const coupon = { type: "percent", value: 10, isActive: true, minOrderAmount: 0 };
    expect(computeCouponDiscount(coupon, 1000)).toBe(100);
  });

  test("fixed-amount coupon clamps to subtotal", () => {
    const coupon = { type: "flat", value: 500, isActive: true, minOrderAmount: 0 };
    expect(computeCouponDiscount(coupon, 200)).toBe(200);
    expect(computeCouponDiscount(coupon, 1000)).toBe(500);
  });

  test("inactive coupon rejected", () => {
    const coupon = { type: "percent", value: 10, isActive: false, minOrderAmount: 0 };
    expect(getCouponValidationError(coupon, 500)).toMatch(/inactive/i);
  });

  test("min-order-value coupon rejected below threshold", () => {
    const coupon = { type: "percent", value: 10, isActive: true, minOrderAmount: 500 };
    expect(getCouponValidationError(coupon, 100)).toMatch(/minimum order/i);
    expect(getCouponValidationError(coupon, 600)).toBe("");
  });

  test("normalizeCouponCode uppercases and trims", () => {
    expect(normalizeCouponCode("  save10 ")).toBe("SAVE10");
  });
});
