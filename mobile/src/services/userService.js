import { apiGet, apiPatch, apiPost, apiPut, apiRequest } from "./apiClient";

export const fetchUserProfile = () => apiRequest("/users/profile");

export const fetchMyDeletion = () => apiGet("/users/account-deletion");

export const requestAccountDeletion = (reason) =>
  apiPost("/users/account-deletion", { reason: reason || undefined });

/** @param {string} [_token] */
export const updateUserProfile = (_token, payload) => apiPut("/users/profile", payload);

/** @param {string} [_token] */
export const uploadUserAvatar = (_token, { imageBase64, mimeType }) =>
  apiPost("/users/profile/avatar", { imageBase64, mimeType });

/** @param {string} [_token] */
export const fetchMyOrders = (_token) => apiGet("/users/my-orders");

export const fetchOrderLiveLocation = (orderId) =>
  apiGet(`/users/my-orders/${orderId}/live-location`);

export const fetchOrderDrivingRoute = (orderId) =>
  apiGet(`/users/my-orders/${orderId}/driving-route`);

/** @param {string} [_token] */
export const fetchMyNotifications = (_token) => apiGet("/users/notifications");

/** @param {string} [_token] */
export const fetchMyNotificationsIncludingArchived = (_token) =>
  apiGet("/users/notifications?includeArchived=true");

/** @param {string} [_token] */
export const markMyNotificationRead = (_token, notificationId) =>
  apiPatch(`/users/notifications/${notificationId}/read`, {});

/** @param {string} [_token] */
export const archiveMyNotification = (_token, notificationId) =>
  apiPatch(`/users/notifications/${notificationId}/archive`, {});

/** @param {string} [_token] */
export const unarchiveMyNotification = (_token, notificationId) =>
  apiPatch(`/users/notifications/${notificationId}/unarchive`, {});

/** @param {string} [_token] */
export const registerMyPushToken = (_token, pushToken) =>
  apiPost("/users/push-token", { pushToken });

/** @param {string} [_token] */
export const fetchHelpFaqs = () => apiGet("/faqs", { auth: false });

export const fetchStoreInfo = () => apiGet("/store-info", { auth: false });

export const fetchMySupportThread = (_token) => apiGet("/users/support-thread");

/** @param {string} [_token] */
export const sendMySupportMessage = (_token, message) =>
  apiPost("/users/support-thread/messages", { message });

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

export const replaceMyCart = async (itemsOrToken, maybeItems) => {
  const items = Array.isArray(itemsOrToken) ? itemsOrToken : maybeItems;
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
