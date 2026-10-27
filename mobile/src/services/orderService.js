import { apiGet, apiPatch, apiPost } from "./apiClient";
import { mapApiList, plainRupeeFields } from "../utils/displayText";

/** @param {string} [_token] Legacy — token comes from AuthContext via apiClient. */
export const createOrderRequest = (_token, payload) => apiPost("/orders", payload);

/** @param {string} [_token] */
export const validateCouponRequest = (_token, couponCode, subtotal) =>
  apiPost("/orders/validate-coupon", { couponCode, subtotal });

/** @param {string} [_token] */
export const reorderMyOrderRequest = (_token, orderId) =>
  apiPost(`/orders/${orderId}/reorder`, {});

/** @param {string} [_token] */
export const fetchAvailableCouponsRequest = async (_token, subtotal) => {
  const numericSubtotal = Number(subtotal);
  const query =
    Number.isFinite(numericSubtotal) && numericSubtotal >= 0
      ? `?subtotal=${encodeURIComponent(numericSubtotal)}`
      : "";
  return mapApiList(await apiGet(`/orders/available-coupons${query}`), "coupons", (row) => plainRupeeFields(row, ["title"]));
};

/** @param {string} [_token] */
export const updateMyOrderAddressRequest = (_token, orderId, shippingAddress) =>
  apiPatch(`/orders/${orderId}/address`, { shippingAddress });

/** @param {string} [_token] */
export const claimMyOrderRewardRequest = (_token, orderId) =>
  apiPost(`/orders/${orderId}/claim-reward`, {});

export const createMyOrderReturnRequest = (_token, orderId, payload) =>
  apiPost(`/orders/${orderId}/return`, payload);
