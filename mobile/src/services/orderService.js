import { apiGet, apiPatch, apiPost } from "./apiClient";

/** @param {string} [_token] Legacy — token comes from AuthContext via apiClient. */
export const createOrderRequest = (_token, payload) => apiPost("/orders", payload);

/** @param {string} [_token] */
export const validateCouponRequest = (_token, couponCode, subtotal) =>
  apiPost("/orders/validate-coupon", { couponCode, subtotal });

/** @param {string} [_token] */
export const reorderMyOrderRequest = (_token, orderId) =>
  apiPost(`/orders/${orderId}/reorder`, {});

/** @param {string} [_token] */
export const fetchAvailableCouponsRequest = (_token, subtotal) => {
  const numericSubtotal = Number(subtotal);
  const query =
    Number.isFinite(numericSubtotal) && numericSubtotal >= 0
      ? `?subtotal=${encodeURIComponent(numericSubtotal)}`
      : "";
  return apiGet(`/orders/available-coupons${query}`);
};

/** @param {string} [_token] */
export const updateMyOrderAddressRequest = (_token, orderId, shippingAddress) =>
  apiPatch(`/orders/${orderId}/address`, { shippingAddress });

/** @param {string} [_token] */
export const claimMyOrderRewardRequest = (_token, orderId) =>
  apiPost(`/orders/${orderId}/claim-reward`, {});

export const createMyOrderReturnRequest = (_token, orderId, payload) =>
  apiPost(`/orders/${orderId}/return`, payload);
