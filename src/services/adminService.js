import { getApiBaseUrl } from "./apiBase";

function apiUrl(path) {
  return `${getApiBaseUrl()}${path}`;
}

async function adminRequest(path, token, options = {}) {
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

export const fetchAdminUsers = (token) => adminRequest("/admin/users", token);
export const fetchAdminOrders = (token) => adminRequest("/admin/orders", token);
export const fetchAdminProducts = (token) => adminRequest("/admin/products", token);

export const updateAdminRole = (token, userId, isAdmin) =>
  adminRequest(`/admin/users/${userId}/role`, token, {
    method: "PATCH",
    body: JSON.stringify({ isAdmin }),
  });

export const updateOrderStatus = (token, orderId, status) =>
  adminRequest(`/admin/orders/${orderId}/status`, token, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });

export const updateAdminOrderDetails = (token, orderId, payload) =>
  adminRequest(`/admin/orders/${orderId}`, token, {
    method: "PUT",
    body: JSON.stringify(payload),
  });

export const deleteAdminProduct = (token, productId) =>
  adminRequest(`/admin/products/${productId}`, token, {
    method: "DELETE",
  });

export const updateAdminProduct = (token, productId, payload) =>
  adminRequest(`/admin/products/${productId}`, token, {
    method: "PUT",
    body: JSON.stringify(payload),
  });

/** Stock-only or partial product patch (server merges fields). */
export const patchAdminProductStock = (token, productId, payload) =>
  updateAdminProduct(token, productId, payload);

export const deleteAdminOrder = (token, orderId) =>
  adminRequest(`/admin/orders/${orderId}`, token, {
    method: "DELETE",
  });

export const deleteAdminUser = (token, userId) =>
  adminRequest(`/admin/users/${userId}`, token, {
    method: "DELETE",
  });

export const createAdminProduct = (token, payload) =>
  adminRequest("/admin/products", token, {
    method: "POST",
    body: JSON.stringify(payload),
  });

export const uploadAdminProductImage = (token, { imageBase64, mimeType }) =>
  adminRequest("/admin/uploads/image", token, {
    method: "POST",
    body: JSON.stringify({ imageBase64, mimeType }),
  });

export const fetchAdminNotifications = (token) => adminRequest("/admin/notifications", token);

export const sendAdminBroadcastNotification = (token, payload) =>
  adminRequest("/admin/notifications/broadcast", token, {
    method: "POST",
    body: JSON.stringify(payload),
  });

export const fetchAdminAnalytics = (token) => adminRequest("/admin/analytics", token);
export const fetchAdminHomeView = (token) => adminRequest("/admin/home-view", token);
export const updateAdminHomeView = (token, payload) =>
  adminRequest("/admin/home-view", token, {
    method: "PUT",
    body: JSON.stringify(payload),
  });

export const fetchAdminCoupons = (token) => adminRequest("/admin/coupons", token);

export const createAdminCoupon = (token, payload) =>
  adminRequest("/admin/coupons", token, {
    method: "POST",
    body: JSON.stringify(payload),
  });

export const updateAdminCoupon = (token, couponId, payload) =>
  adminRequest(`/admin/coupons/${couponId}`, token, {
    method: "PUT",
    body: JSON.stringify(payload),
  });

export const fetchAdminSupportThreads = (token) => adminRequest("/admin/support-threads", token);

export const replyAdminSupportThread = (token, threadId, payload) =>
  adminRequest(`/admin/support-threads/${threadId}/reply`, token, {
    method: "POST",
    body: JSON.stringify(payload),
  });

export const updateAdminSupportThreadStatus = (token, threadId, status) =>
  adminRequest(`/admin/support-threads/${threadId}/status`, token, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
