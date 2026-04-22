import { getApiBaseUrl } from "./apiBase";

function apiUrl(path) {
  return `${getApiBaseUrl()}${path}`;
}

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

export const fetchUserProfile = (token) => userRequest("/users/profile", token);

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

export const fetchMyNotifications = (token) => userRequest("/users/notifications", token);

export const markMyNotificationRead = (token, notificationId) =>
  userRequest(`/users/notifications/${notificationId}/read`, token, {
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

export const fetchMyCart = async (token) => {
  const data = await userRequest("/users/cart", token);
  return normalizeCartItems(data.items || []);
};

export const replaceMyCart = async (token, items) => {
  const payloadItems = (Array.isArray(items) ? items : []).map((item) => ({
    product: item.product || item.id,
    id: item.id,
    name: item.name,
    price: item.price,
    image: item.image || "",
    quantity: item.quantity,
    variantLabel: item.variantLabel || "",
  }));
  const data = await userRequest("/users/cart", token, {
    method: "PUT",
    body: JSON.stringify({ items: payloadItems }),
  });
  return normalizeCartItems(data.items || []);
};
