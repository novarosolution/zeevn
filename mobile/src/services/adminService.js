import { apiDelete, apiGet, apiPatch, apiPost, apiPut } from "./apiClient";
import { invalidateProductsCache, normalizeProduct } from "./productService";

/** @param {string} [_token] Legacy — session token from AuthContext. */
export const fetchAdminUsers = (_token, query = {}) => apiGet(`/admin/users${queryString(query)}`);

export const searchAdminDeletions = (_token, query = {}) => apiGet(`/admin/deletions${queryString(query)}`);

export const fetchAdminDeletion = (_token, id) => apiGet(`/admin/deletions/${id}`);

export const approveAdminDeletion = (_token, id, note) =>
  apiPost(`/admin/deletions/${id}/approve`, { note: note || undefined });

export const rejectAdminDeletion = (_token, id, note) =>
  apiPost(`/admin/deletions/${id}/reject`, { note });

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
function decorateAdminProduct(raw) {
  const p = normalizeProduct(raw || {});
  const ownImage = String(raw?.image || "").trim();
  const ownGallery = (Array.isArray(raw?.images) ? raw.images : []).some((img) => String(img || "").trim());
  p.hasCatalogPhoto = Boolean(ownImage || ownGallery);
  return p;
}

export const fetchAdminProducts = async (_token) => {
  const data = await apiGet("/admin/products");
  const list = Array.isArray(data) ? data : [];
  return list.map(decorateAdminProduct);
};

export const updateAdminRole = (_token, userId, isAdmin) =>
  apiPatch(`/admin/users/${userId}/role`, { isAdmin });

export const updateDeliveryPartnerRole = (_token, userId, isDeliveryPartner) =>
  apiPatch(`/admin/users/${userId}/delivery-role`, { isDeliveryPartner });

export const updateOrderStatus = (_token, orderId, status, note) =>
  apiPatch(`/admin/orders/${orderId}/status`, { status, note: note || undefined });

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

/** Stock desk only — PUT stockQty + inStock, never the rest of the product. */
export const patchAdminProductStock = async (_token, productId, payload) => {
  const body = {};
  if (payload?.stockQty !== undefined) body.stockQty = Math.max(0, Math.floor(Number(payload.stockQty) || 0));
  if (payload?.stockCounter !== undefined) body.stockCounter = Math.max(0, Math.floor(Number(payload.stockCounter) || 0));
  if (payload?.inStock !== undefined) body.inStock = payload.inStock === true;
  const raw = await updateAdminProduct(_token, productId, body);
  return decorateAdminProduct(raw);
};

/** Home sections desk — PUT homeOrder only. */
export const saveAdminProductHomeOrder = async (_token, productId, homeOrder) => {
  const raw = await updateAdminProduct(_token, productId, {
    homeOrder: Math.max(0, Math.floor(Number(homeOrder) || 0)),
  });
  return decorateAdminProduct(raw);
};

/** Home sections desk — PUT showOnHome only. */
export const saveAdminProductHomeFlag = async (_token, productId, showOnHome) => {
  const raw = await updateAdminProduct(_token, productId, { showOnHome: showOnHome !== false });
  return decorateAdminProduct(raw);
};

/** Home sections desk — PUT homeSection only. Blank becomes Prime Products. */
export const saveAdminProductHomeSection = async (_token, productId, homeSection) => {
  const name = String(homeSection || "").trim().slice(0, 40) || "Prime Products";
  const raw = await updateAdminProduct(_token, productId, { homeSection: name });
  return decorateAdminProduct(raw);
};

/** Categories desk only — PUT productType + category, never price, stock, or home section. */
export const saveAdminProductLine = async (_token, productId, label) => {
  const line = String(label || "").trim();
  const raw = await updateAdminProduct(_token, productId, { productType: line, category: line });
  return decorateAdminProduct(raw);
};

/** Prices desk only — PUT price + mrp + variants, never stock or the story. */
export const saveAdminProductPrices = async (_token, productId, payload) => {
  const price = Math.max(0, Math.floor(Number(payload?.price) || 0));
  const mrpRaw = payload?.mrp;
  const mrp = mrpRaw === "" || mrpRaw == null ? null : Math.max(0, Math.floor(Number(mrpRaw) || 0));
  const variants = Array.isArray(payload?.variants)
    ? payload.variants
        .map((v) => ({
          label: String(v?.label || "").trim(),
          price: Math.max(0, Math.floor(Number(v?.price) || 0)),
          tag: String(v?.tag || "").trim(),
        }))
        .filter((v) => v.label)
    : [];
  const raw = await updateAdminProduct(_token, productId, { price, mrp, variants });
  return decorateAdminProduct(raw);
};

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

export const fetchAdminRiderNotifications = (_token) => apiGet("/admin/notifications/riders");

export const sendAdminRiderNotification = (_token, payload) =>
  apiPost("/admin/notifications/riders", payload);

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

/** Live Ops command-center KPIs + attention queue. */
export const fetchAdminOpsSummary = (_token) => apiGet("/admin/ops-summary");

/** Super-admin business overview (Kolkata periods). */
export const fetchAdminOverview = (_token, query = {}) => apiGet(`/admin/overview${queryString(query)}`);

function queryString(query = {}) {
  const params = new URLSearchParams();
  for (const [k, v] of Object.entries(query)) {
    if (v === undefined || v === null) continue;
    const s = String(v).trim();
    if (s === "") continue;
    params.set(k, s);
  }
  const qs = params.toString();
  return qs ? `?${qs}` : "";
}

/** Paged, filtered orders: `{ items, total, page, pageSize, pages, counts, totals }`. */
export const searchAdminOrders = (_token, query = {}) => apiGet(`/admin/orders/search${queryString(query)}`);

/** Counters behind the sidebar badges, store open/closed state and the dashboard strip. */
export const fetchAdminDeskSummary = (_token) => apiGet("/admin/desk-summary");

export const bulkUpdateAdminOrderStatus = (_token, ids, status, note) =>
  apiPost("/admin/orders/bulk-status", { ids, status, note: note || undefined });

/** `riderId` null releases the orders. */
export const bulkAssignAdminOrderRider = (_token, ids, riderId) =>
  apiPost("/admin/orders/bulk-assign", { ids, riderId: riderId || null });

export const updateAdminOrderPayment = (_token, orderId, paymentStatus, note) =>
  apiPatch(`/admin/orders/${orderId}/payment`, { paymentStatus, note: note || undefined });

export const fetchAdminOrderNotes = (_token, orderId) => apiGet(`/admin/orders/${orderId}/notes`);

export const addAdminOrderNote = (_token, orderId, text) => apiPost(`/admin/orders/${orderId}/notes`, { text });

export const deleteAdminOrderNote = (_token, orderId, noteId) => apiDelete(`/admin/orders/${orderId}/notes/${noteId}`);

export const searchAdminReturns = (_token, query = {}) => apiGet(`/admin/returns${queryString(query)}`);

export const searchAdminDispatch = (_token, query = {}) => apiGet(`/admin/dispatch${queryString(query)}`);

export const searchAdminCash = (_token, query = {}) => apiGet(`/admin/cash${queryString(query)}`);

export const searchAdminStockIn = (_token, query = {}) => apiGet(`/admin/stock-in${queryString(query)}`);

export const fetchAdminStockIn = (_token, id) => apiGet(`/admin/stock-in/${id}`);

export const saveAdminStockInDraft = (_token, payload, id) =>
  id ? apiPut(`/admin/stock-in/${id}`, payload) : apiPost("/admin/stock-in", payload);

export const confirmAdminStockIn = (_token, id, payload) => apiPost(`/admin/stock-in/${id}/confirm`, payload);

export const searchAdminTransfers = (_token, query = {}) => apiGet(`/admin/stock-transfers${queryString(query)}`);
export const fetchAdminTransfer = (_token, id) => apiGet(`/admin/stock-transfers/${id}`);
export const saveAdminTransferDraft = (_token, payload, id) =>
  id ? apiPut(`/admin/stock-transfers/${id}`, payload) : apiPost("/admin/stock-transfers", payload);
export const confirmAdminTransfer = (_token, id, payload) => apiPost(`/admin/stock-transfers/${id}/confirm`, payload);
export const createAdminStockOut = (_token, payload) => apiPost("/admin/stock-out", payload);
export const createAdminWalkIn = (_token, payload) => apiPost("/admin/walk-in", payload);
export const voidAdminWalkIn = (_token, id) => apiPost(`/admin/walk-in/${id}/void`);
export const createAdminWalkInCustomer = (_token, payload) => apiPost("/admin/customers", payload);
export const updateAdminCustomerNote = (_token, id, adminNote) => apiPatch(`/admin/customers/${id}/note`, { adminNote });
export const applyAdminClosing = (_token, date) => apiPost(`/admin/closings/${date}/apply`);

export const fetchAdminReorders = (_token, query = {}) => apiGet(`/admin/reorders${queryString(query)}`);

export const fetchAdminStockReport = (_token, query = {}) => apiGet(`/admin/stock-report${queryString(query)}`);

export const fetchAdminStockHistory = (_token, query = {}) => apiGet(`/admin/stock-history${queryString(query)}`);

export const fetchAdminLogs = (_token, query = {}) => apiGet(`/admin/logs${queryString(query)}`);

export const searchAdminClosings = (_token) => apiGet("/admin/closings");

export const fetchAdminClosingToday = (_token) => apiGet("/admin/closings/today");

export const fetchAdminClosing = (_token, date) => apiGet(`/admin/closings/${date}`);

export const saveAdminClosingDraft = (_token, date, payload) => apiPut(`/admin/closings/${date}`, payload);

export const submitAdminClosing = (_token, date, payload) => apiPost(`/admin/closings/${date}/submit`, payload);

export const reopenAdminClosing = (_token, date) => apiPost(`/admin/closings/${date}/reopen`);

export const fetchAdminReturn = (_token, id) => apiGet(`/admin/returns/${id}`);

export const approveAdminReturn = (_token, id, remarks) =>
  apiPost(`/admin/returns/${id}/approve`, { remarks: remarks || undefined });

export const rejectAdminReturn = (_token, id, remarks) => apiPost(`/admin/returns/${id}/reject`, { remarks });

/** Delivery partners with load, today's deliveries, zones and last GPS ping. */
export const fetchAdminRiders = (_token) => apiGet("/admin/riders");

export const fetchAdminRiderPerformance = (_token, query = {}) =>
  apiGet(`/admin/rider-performance${queryString(query)}`);

export const fetchAdminZoneStats = (_token, days = 30) => apiGet(`/admin/delivery-zones/stats?days=${days}`);

/** Open/paused, hours, minimum order, payment methods, contact and invoice details. */
export const fetchAdminStoreOps = (_token) => apiGet("/admin/store-ops");

export const updateAdminStoreOps = (_token, payload) => apiPut("/admin/store-ops", payload);

/** Public serviceability quote — what a customer at this pin / pincode would be told. */
export const checkAdminDeliveryCoverage = (_token, query = {}) => apiGet(`/delivery/check${queryString(query)}`);

export const fetchAdminDeliveryZones = (_token) => apiGet("/admin/delivery-zones");

export const createAdminDeliveryZone = (_token, payload) =>
  apiPost("/admin/delivery-zones", payload);

export const updateAdminDeliveryZone = (_token, zoneId, payload) =>
  apiPatch(`/admin/delivery-zones/${zoneId}`, payload);

export const deleteAdminDeliveryZone = (_token, zoneId) =>
  apiDelete(`/admin/delivery-zones/${zoneId}`);

export const fetchAdminDeliveryPartners = (_token) => apiGet("/admin/delivery-partners");

export const fetchAdminStoreSettings = (_token) => apiGet("/admin/store-settings");

export const updateAdminStoreSettings = (_token, payload) => apiPut("/admin/store-settings", payload);

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

export const fetchAdminFaqs = (_token) => apiGet("/admin/faqs");

export const updateAdminFaqs = (_token, payload) => apiPut("/admin/faqs", payload);

export const fetchAdminSupportThreads = (_token) => apiGet("/admin/support-threads");

export const replyAdminSupportThread = (_token, threadId, payload) =>
  apiPost(`/admin/support-threads/${threadId}/reply`, payload);

export const updateAdminSupportThreadStatus = (_token, threadId, status) =>
  apiPatch(`/admin/support-threads/${threadId}/status`, { status });
