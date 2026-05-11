import { getApiBaseUrl } from "./apiBase";
import { apiRequest, apiGet } from "./apiClient";

function apiUrl(path) {
  return `${getApiBaseUrl()}${path}`;
}

/**
 * Legacy bearer-with-token fetch wrapper used by services that still pass a
 * token explicitly. Kept for backwards compatibility while we migrate to
 * `apiClient` which injects the token via AuthContext and handles 401 retry.
 */
async function userRequest(path, token, options = {}) {
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

/**
 * Use the central apiClient so 401 responses trigger a silent refresh + retry
 * instead of bubbling straight up. Token argument is ignored — the active
 * session token is taken from AuthContext via the configured getter.
 */
export const fetchUserProfile = () => apiRequest("/users/profile");

export const updateUserProfile = (token, payload) =>
  userRequest("/users/profile", token, {
    method: "PUT",
    body: JSON.stringify(payload),
  });

export const uploadUserAvatar = (token, { imageBase64, mimeType }) =>
  userRequest("/users/profile/avatar", token, {
    method: "POST",
    body: JSON.stringify({ imageBase64, mimeType }),
  });

export const fetchMyOrders = (token) => userRequest("/users/my-orders", token);

/** Customer: live partner location for own order (out_for_delivery only). Uses apiClient refresh. */
export const fetchOrderLiveLocation = (orderId) =>
  apiGet(`/users/my-orders/${orderId}/live-location`);

/** Driving route polyline (proxied Google Directions). Returns { encodedPolyline, provider } or null polyline. */
export const fetchOrderDrivingRoute = (orderId) =>
  apiGet(`/users/my-orders/${orderId}/driving-route`);

export const fetchMyNotifications = (token) => userRequest("/users/notifications", token);
export const fetchMyNotificationsIncludingArchived = (token) =>
  userRequest("/users/notifications?includeArchived=true", token);

export const markMyNotificationRead = (token, notificationId) =>
  userRequest(`/users/notifications/${notificationId}/read`, token, {
    method: "PATCH",
  });

export const archiveMyNotification = (token, notificationId) =>
  userRequest(`/users/notifications/${notificationId}/archive`, token, {
    method: "PATCH",
  });

export const unarchiveMyNotification = (token, notificationId) =>
  userRequest(`/users/notifications/${notificationId}/unarchive`, token, {
    method: "PATCH",
  });

export const registerMyPushToken = (token, pushToken) =>
  userRequest("/users/push-token", token, {
    method: "POST",
    body: JSON.stringify({ pushToken }),
  });

export const fetchMySupportThread = (token) => userRequest("/users/support-thread", token);

export const sendMySupportMessage = (token, message) =>
  userRequest("/users/support-thread/messages", token, {
    method: "POST",
    body: JSON.stringify({ message }),
  });

export const fetchRewardsCatalog = (subtotal) => {
  const qs =
    subtotal !== undefined &&
    subtotal !== null &&
    Number.isFinite(Number(subtotal)) &&
    Number(subtotal) >= 0
      ? `?subtotal=${encodeURIComponent(String(Number(subtotal)))}`
      : "";
  return apiRequest(`/users/rewards/catalog${qs}`);
};

export const fetchMyRewardCoupons = () => apiRequest("/users/rewards/my-coupons");

export const redeemRewardRequest = (rewardId) =>
  apiRequest(`/users/rewards/${rewardId}/redeem`, {
    method: "POST",
    body: JSON.stringify({}),
  });

function normalizeCartItems(items = []) {
  return items.map((item) => {
    const productId = item.product || item.externalProductId || item.id;
    const variantLabel = String(item.variantLabel ?? "").trim();
    return {
      ...item,
      id: String(productId || ""),
      product: productId,
      quantity: Number(item.quantity || 1),
      price: Number(item.price || 0),
      variantLabel,
    };
  });
}

export const fetchMyCart = async () => {
  const data = await apiRequest("/users/cart");
  return normalizeCartItems(data.items || []);
};

export const replaceMyCart = async (_token, items) => {
  const payloadItems = (Array.isArray(items) ? items : []).map((item) => ({
    product: item.product || item.id,
    id: item.id,
    name: item.name,
    price: item.price,
    image: item.image || "",
    quantity: item.quantity,
    variantLabel: item.variantLabel || "",
  }));
  const data = await apiRequest("/users/cart", {
    method: "PUT",
    body: JSON.stringify({ items: payloadItems }),
  });
  return normalizeCartItems(data.items || []);
};
