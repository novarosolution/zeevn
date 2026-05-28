import { useCallback, useEffect, useMemo, useState } from "react";
import { fetchMyOrders } from "../../../services/userService";
import { getMyOrdersCached } from "../../../services/orderCache";

const DAY_MS = 24 * 60 * 60 * 1000;

function toMs(value) {
  const ms = new Date(value || 0).getTime();
  return Number.isFinite(ms) ? ms : 0;
}

function averageIntervalDays(datesDesc) {
  if (!Array.isArray(datesDesc) || datesDesc.length < 2) return null;
  const deltas = [];
  for (let i = 0; i < datesDesc.length - 1; i += 1) {
    const diff = (datesDesc[i] - datesDesc[i + 1]) / DAY_MS;
    if (diff > 0) deltas.push(diff);
  }
  if (!deltas.length) return null;
  return deltas.reduce((sum, value) => sum + value, 0) / deltas.length;
}

export default function useReorderData({ isAuthenticated, token }) {
  const [pastOrders, setPastOrders] = useState([]);

  const refresh = useCallback(async () => {
    if (!isAuthenticated || !token) {
      setPastOrders([]);
      return;
    }
    try {
      const data = await getMyOrdersCached(() => fetchMyOrders(token));
      setPastOrders(Array.isArray(data) ? data : []);
    } catch {
      setPastOrders([]);
    }
  }, [isAuthenticated, token]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const reorderItems = useMemo(() => {
    if (!isAuthenticated || !pastOrders.length) return [];
    const sorted = [...pastOrders].sort((a, b) => toMs(b?.createdAt) - toMs(a?.createdAt));
    const historyBySku = new Map();

    sorted.forEach((order) => {
      const createdAtMs = toMs(order?.createdAt);
      (order?.products || []).forEach((line) => {
        const productId = String(line?.product || line?.externalProductId || "").trim();
        if (!productId) return;
        const variantLabel = String(line?.variantLabel || "").trim();
        const skuKey = `${productId}::${variantLabel}`;
        const current = historyBySku.get(skuKey) || { dates: [] };
        if (createdAtMs > 0) current.dates.push(createdAtMs);
        historyBySku.set(skuKey, current);
      });
    });

    const seen = new Set();
    const items = [];
    const nowMs = Date.now();
    sorted.forEach((order) => {
      (order?.products || []).forEach((line, idx) => {
        const productId = String(line?.product || line?.externalProductId || "").trim();
        if (!productId) return;
        const variantLabel = String(line?.variantLabel || "").trim();
        const dedupeKey = `${productId}::${variantLabel}`;
        if (seen.has(dedupeKey)) return;
        seen.add(dedupeKey);
        const datesDesc = (historyBySku.get(dedupeKey)?.dates || []).sort((a, b) => b - a);
        const avgReorderIntervalDays = averageIntervalDays(datesDesc);
        const daysSinceLastOrder = datesDesc.length > 0 ? (nowMs - datesDesc[0]) / DAY_MS : 0;
        const isDueForRestock =
          Number.isFinite(avgReorderIntervalDays) && avgReorderIntervalDays > 0 && daysSinceLastOrder >= avgReorderIntervalDays;
        const dueScore =
          Number.isFinite(avgReorderIntervalDays) && avgReorderIntervalDays > 0
            ? daysSinceLastOrder / avgReorderIntervalDays
            : 0;
        items.push({
          key: `${order?._id || "order"}-${idx}-${dedupeKey}`,
          id: productId,
          product: productId,
          name: String(line?.name || "Product").trim() || "Product",
          price: Number(line?.price || 0),
          mrp: Number(line?.mrp || line?.originalPrice || line?.listPrice || 0),
          image: String(line?.image || "").trim(),
          variantLabel,
          unitLabel:
            String(line?.variantLabel || line?.unit || line?.size || "").trim() ||
            `${Number(line?.quantity || 1)} item`,
          daysSinceLastOrder,
          averageReorderIntervalDays: avgReorderIntervalDays,
          isDueForRestock,
          dueScore,
        });
      });
    });

    const dueKeys = new Set(
      items
        .filter((item) => item.isDueForRestock)
        .sort((a, b) => b.dueScore - a.dueScore)
        .slice(0, 3)
        .map((item) => item.key)
    );

    return items.slice(0, 12).map((item) => ({
      ...item,
      showRestockPill: dueKeys.has(item.key),
    }));
  }, [isAuthenticated, pastOrders]);

  return {
    reorderItems,
    hasReorder: reorderItems.length > 0,
    refresh,
  };
}
