import { apiDelete, apiGet, apiPatch, apiPost, apiPut } from "./apiClient";
import { invalidateProductsCache, normalizeProduct } from "./productService";

/** @param {string} [_token] Legacy — session token from AuthContext. */
export const fetchAdminUsers = (_token) => apiGet("/admin/users");
export const fetchAdminOrders = (_token) => apiGet("/admin/orders");

/** Single order — falls back to list lookup when GET /:id is unavailable (older API). */
export async function fetchAdminOrder(_token, orderId) {
  const id = String(orderId || "").trim();
  if (!id) throw new Error("Order id is required.");

  try {
    return await apiGet(`/admin/orders/${id}`);
  } catch (primaryErr) {
    try {
      const orders = await fetchAdminOrders(_token);
      const match = (orders || []).find((o) => String(o._id) === id);
      if (match) return match;
    } catch {
      // List fallback failed — surface original error.
    }
    throw primaryErr;
  }
}
export const fetchAdminProducts = async (_token) => {
  const data = await apiGet("/admin/products");
  const list = Array.isArray(data) ? data : [];
  return list.map(normalizeProduct);
};

export const updateAdminRole = (_token, userId, isAdmin) =>
  apiPatch(`/admin/users/${userId}/role`, { isAdmin });

export const updateDeliveryPartnerRole = (_token, userId, isDeliveryPartner) =>
  apiPatch(`/admin/users/${userId}/delivery-role`, { isDeliveryPartner });

export const updateOrderStatus = (_token, orderId, status) =>
  apiPatch(`/admin/orders/${orderId}/status`, { status });

export const updateAdminOrderDetails = (_token, orderId, payload) =>
  apiPut(`/admin/orders/${orderId}`, payload);

export const deleteAdminProduct = async (_token, productId) => {
  const result = await apiDelete(`/admin/products/${productId}`);
  invalidateProductsCache();
  return result;
};

export const updateAdminProduct = async (_token, productId, payload) => {
  const result = await apiPut(`/admin/products/${productId}`, payload);
  invalidateProductsCache();
  return result;
};

export const patchAdminProductStock = (_token, productId, payload) =>
  updateAdminProduct(_token, productId, payload);

export const deleteAdminOrder = (_token, orderId) => apiDelete(`/admin/orders/${orderId}`);

export const deleteAdminUser = (_token, userId) => apiDelete(`/admin/users/${userId}`);

export const createAdminProduct = async (_token, payload) => {
  const result = await apiPost("/admin/products", payload);
  invalidateProductsCache();
  return result;
};

export const uploadAdminProductImage = (_token, { imageBase64, mimeType }) =>
  apiPost("/admin/uploads/image", { imageBase64, mimeType });

export const fetchAdminNotifications = (_token) => apiGet("/admin/notifications");

export const sendAdminBroadcastNotification = (_token, payload) =>
  apiPost("/admin/notifications/broadcast", payload);

export const fetchAdminAnalytics = (_token, query = {}) => {
  const params = new URLSearchParams();
  for (const [k, v] of Object.entries(query)) {
    if (v === undefined || v === null) continue;
    const s = String(v).trim();
    if (s === "") continue;
    params.set(k, s);
  }
  const qs = params.toString();
  return apiGet(`/admin/analytics${qs ? `?${qs}` : ""}`);
};

export const fetchAdminHomeView = (_token) => apiGet("/admin/home-view");

export const updateAdminHomeView = (_token, payload) => apiPut("/admin/home-view", payload);

export const fetchAdminCoupons = (_token) => apiGet("/admin/coupons");

export const createAdminCoupon = (_token, payload) => apiPost("/admin/coupons", payload);

export const updateAdminCoupon = (_token, couponId, payload) =>
  apiPut(`/admin/coupons/${couponId}`, payload);

export const fetchAdminRewards = (_token) => apiGet("/admin/rewards");

export const createAdminReward = (_token, payload) => apiPost("/admin/rewards", payload);

export const updateAdminReward = (_token, rewardId, payload) =>
  apiPut(`/admin/rewards/${rewardId}`, payload);

export const fetchAdminSupportThreads = (_token) => apiGet("/admin/support-threads");

export const replyAdminSupportThread = (_token, threadId, payload) =>
  apiPost(`/admin/support-threads/${threadId}/reply`, payload);

export const updateAdminSupportThreadStatus = (_token, threadId, status) =>
  apiPatch(`/admin/support-threads/${threadId}/status`, { status });
