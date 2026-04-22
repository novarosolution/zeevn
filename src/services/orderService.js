import { getApiBaseUrl } from "./apiBase";

function apiUrl(path) {
  return `${getApiBaseUrl()}${path}`;
}

async function orderRequest(path, token, options = {}) {
  const response = await fetch(apiUrl(path), {
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...(options.headers || {}),
    },
    ...options,
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.message || "Request failed.");
  }
  return data;
}

export const createOrderRequest = (token, payload) =>
  orderRequest("/orders", token, {
    method: "POST",
    body: JSON.stringify(payload),
  });

export const validateCouponRequest = (token, couponCode) =>
  orderRequest("/orders/validate-coupon", token, {
    method: "POST",
    body: JSON.stringify({ couponCode }),
  });

export const reorderMyOrderRequest = (token, orderId) =>
  orderRequest(`/orders/${orderId}/reorder`, token, {
    method: "POST",
  });

export const fetchAvailableCouponsRequest = (token) =>
  orderRequest("/orders/available-coupons", token);

export const updateMyOrderAddressRequest = (token, orderId, shippingAddress) =>
  orderRequest(`/orders/${orderId}/address`, token, {
    method: "PATCH",
    body: JSON.stringify({ shippingAddress }),
  });
