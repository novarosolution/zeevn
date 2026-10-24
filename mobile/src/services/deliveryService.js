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
export function checkDeliveryServiceability({
  postalCode = "",
  city = "",
  itemsTotal = 0,
  latitude,
  longitude,
} = {}) {
  const q = new URLSearchParams();
  if (postalCode) q.set("postalCode", String(postalCode).trim());
  if (city) q.set("city", String(city).trim());
  if (itemsTotal != null) q.set("itemsTotal", String(Number(itemsTotal) || 0));
  const lat = Number(latitude);
  const lng = Number(longitude);
  if (Number.isFinite(lat) && Math.abs(lat) > 0.2) q.set("lat", String(lat));
  if (Number.isFinite(lng) && Math.abs(lng) > 0.2) q.set("lng", String(lng));
  const qs = q.toString();
  return apiGet(`/delivery/check${qs ? `?${qs}` : ""}`, { auth: false });
}

export function etaFromQuote(quote) {
  if (!quote || quote.serviceable === false) return "";
  if (quote.etaLabel) return String(quote.etaLabel);
  const min = Number(quote.etaMinutesMin);
  if (!Number.isFinite(min) || min <= 0) return "";
  const n = Math.max(1, Math.round(min));
  if (n < 60) return `${n} minute${n === 1 ? "" : "s"}`;
  const h = Math.floor(n / 60);
  const m = n % 60;
  if (!m) return h === 1 ? "1 hour" : `${h} hours`;
  return `${h}h ${m}m`;
}
