import { useCallback, useEffect, useState } from "react";
import { fetchMyOrders } from "../../../services/userService";

const ACTIVE_STATUSES = new Set(["ready_for_pickup", "shipped", "preparing", "confirmed", "out_for_delivery", "paid"]);

export default function useLiveOrder({ isAuthenticated, token, pollMs = 30000 }) {
  const [liveOrder, setLiveOrder] = useState(null);

  const refresh = useCallback(async () => {
    if (!isAuthenticated || !token) {
      setLiveOrder(null);
      return;
    }
    try {
      const data = await fetchMyOrders(token);
      const orders = Array.isArray(data) ? data : [];
      const active =
        orders.find((order) => String(order?.status || "") === "out_for_delivery") ||
        orders.find((order) => ACTIVE_STATUSES.has(String(order?.status || ""))) ||
        null;
      setLiveOrder(active);
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
