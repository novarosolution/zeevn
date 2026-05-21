import { useCallback, useEffect, useState } from "react";
import { fetchMyOrders } from "../../../services/userService";
import { getMyOrdersCached, invalidateMyOrdersCache } from "../../../services/orderCache";

const ACTIVE_STATUSES = new Set(["ready_for_pickup", "shipped", "preparing", "confirmed", "out_for_delivery", "paid"]);

export default function useLiveOrder({ isAuthenticated, token, pollMs = 30000 }) {
  const [liveOrder, setLiveOrder] = useState(null);

  const refresh = useCallback(async () => {
    if (!isAuthenticated || !token) {
      setLiveOrder(null);
      return;
    }
    try {
      const data = await getMyOrdersCached(() => fetchMyOrders(token));
      const orders = Array.isArray(data) ? data : [];
      const active =
        orders.find((order) => String(order?.status || "") === "out_for_delivery") ||
        orders.find((order) => ACTIVE_STATUSES.has(String(order?.status || ""))) ||
        null;
      setLiveOrder((prev) => {
        const prevId = String(prev?._id || prev?.id || "");
        const nextId = String(active?._id || active?.id || "");
        const prevStatus = String(prev?.status || "");
        const nextStatus = String(active?.status || "");
        if (prevId && (prevId !== nextId || prevStatus !== nextStatus)) {
          invalidateMyOrdersCache();
        }
        return active;
      });
    } catch {
      setLiveOrder(null);
    }
  }, [isAuthenticated, token]);

  useEffect(() => {
    refresh();
    if (!isAuthenticated || !token) return undefined;
    const timer = setInterval(refresh, pollMs);
    return () => clearInterval(timer);
  }, [isAuthenticated, pollMs, refresh, token]);

  return {
    liveOrder,
    hasLiveOrder: Boolean(liveOrder),
    refresh,
  };
}
