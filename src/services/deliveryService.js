import { getApiBaseUrl } from "./apiBase";

function apiUrl(path) {
  return `${getApiBaseUrl()}${path}`;
}

async function deliveryRequest(path, token, options = {}) {
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

export const fetchMyDeliveryOrders = (token) => deliveryRequest("/delivery/orders", token);

export const markDeliveryOrderDelivered = (token, orderId) =>
  deliveryRequest(`/delivery/orders/${orderId}/mark-delivered`, token, {
    method: "PATCH",
  });

/** Delivery partner live GPS ping (foreground share). */
export const updateDeliveryLocation = (token, payload) =>
  deliveryRequest("/delivery/location", token, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
