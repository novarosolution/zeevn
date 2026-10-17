import { apiGet, apiPatch } from "./apiClient";

/** @param {string} [_token] Legacy — ignored; apiClient injects session token. */
export const fetchMyDeliveryOrders = (_token) => apiGet("/delivery/orders");

/** @param {string} [_token] */
export const markDeliveryOrderDelivered = (_token, orderId) =>
  apiPatch(`/delivery/orders/${orderId}/mark-delivered`, {});

/** @param {string} [_token] */
export const acceptDeliveryOrder = (_token, orderId) =>
  apiPatch(`/delivery/orders/${orderId}/accept`, {});

/** @param {string} [_token] */
export const declineDeliveryOrder = (_token, orderId, reason = "") =>
  apiPatch(`/delivery/orders/${orderId}/decline`, { reason });

/** @param {string} [_token] */
export const updateDeliveryLocation = (_token, payload) =>
  apiPatch("/delivery/location", payload);

/**
 * Public serviceability check for checkout.
 * @param {{ postalCode?: string, city?: string, itemsTotal?: number }} params
 */
export function checkDeliveryServiceability({ postalCode = "", city = "", itemsTotal = 0 } = {}) {
  const q = new URLSearchParams();
  if (postalCode) q.set("postalCode", String(postalCode).trim());
  if (city) q.set("city", String(city).trim());
  if (itemsTotal != null) q.set("itemsTotal", String(Number(itemsTotal) || 0));
  const qs = q.toString();
  return apiGet(`/delivery/check${qs ? `?${qs}` : ""}`, { auth: false });
}
