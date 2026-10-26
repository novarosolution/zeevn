import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useAuth } from "./AuthContext";
import { useLiveSocket } from "./LiveSocketContext";
import OrderCelebrationOverlay from "../components/orders/OrderCelebrationOverlay";
import { safeNavigate, safeReset } from "../navigation/navigationRef";

const OrderCelebrationContext = createContext(undefined);

const CONFIRMED_STATUSES = new Set(["confirmed", "paid"]);
const EARLY_STATUSES = new Set(["pending", "pending_payment"]);

function orderIdOf(order) {
  return String(order?._id || order?.id || "");
}

export function OrderCelebrationProvider({ children, navigationRef }) {
  const { isAuthenticated, user } = useAuth();
  const myId = String(user?.id || user?._id || "");
  const { on: onLiveEvent } = useLiveSocket();
  const [celebration, setCelebration] = useState(null);
  const statusByOrderRef = useRef(new Map());
  const localConfirmRef = useRef(new Set());

  const dismiss = useCallback(() => setCelebration(null), []);

  const showCelebration = useCallback((type, order) => {
    if (!order) return;
    setCelebration({ type, order });
  }, []);

  const showOrderConfirmed = useCallback(
    (order) => {
      const id = orderIdOf(order);
      if (!id) return;
      localConfirmRef.current.add(id);
      statusByOrderRef.current.set(id, order.status || "confirmed");
      setTimeout(() => localConfirmRef.current.delete(id), 90_000);
      safeReset({
        index: 0,
        routes: [{ name: "Home" }],
      });
      showCelebration("confirmed", order);
    },
    [showCelebration]
  );

  const navigateSafe = useCallback(
    (routeName, params) => {
      safeNavigate(routeName, params);
    },
    []
  );

  const handleTrackOrder = useCallback(() => {
    dismiss();
    navigateSafe("MyOrders");
  }, [dismiss, navigateSafe]);

  const handleContinue = useCallback(() => {
    dismiss();
    navigateSafe("Shop");
  }, [dismiss, navigateSafe]);

  useEffect(() => {
    if (!isAuthenticated) {
      statusByOrderRef.current.clear();
      localConfirmRef.current.clear();
      return undefined;
    }

    return onLiveEvent("orders:updated", ({ order }) => {
      if (!order?._id && !order?.id) return;
      // Admins and riders are sent every order's updates; only the person it belongs to gets the celebration.
      const owner = String(order.user?._id || order.user?.id || order.user || "");
      if (!myId || (owner && owner !== myId)) return;
      const id = orderIdOf(order);
      const nextStatus = String(order.status || "");
      const prevStatus = statusByOrderRef.current.get(id);

      if (prevStatus === undefined) {
        statusByOrderRef.current.set(id, nextStatus);
        return;
      }

      statusByOrderRef.current.set(id, nextStatus);

      if (nextStatus === "delivered" && prevStatus !== "delivered") {
        showCelebration("delivered", order);
        return;
      }

      if (
        CONFIRMED_STATUSES.has(nextStatus) &&
        EARLY_STATUSES.has(prevStatus) &&
        !localConfirmRef.current.has(id)
      ) {
        showCelebration("confirmed", order);
      }
    });
  }, [isAuthenticated, myId, navigationRef, onLiveEvent, showCelebration]);

  const seedOrderStatuses = useCallback((orders = []) => {
    orders.forEach((order) => {
      const id = orderIdOf(order);
      if (id) statusByOrderRef.current.set(id, String(order.status || ""));
    });
  }, []);

  const value = useMemo(
    () => ({
      showOrderConfirmed,
      showOrderDelivered: (order) => showCelebration("delivered", order),
      dismissCelebration: dismiss,
      seedOrderStatuses,
    }),
    [dismiss, seedOrderStatuses, showCelebration, showOrderConfirmed]
  );

  return (
    <OrderCelebrationContext.Provider value={value}>
      {children}
      <OrderCelebrationOverlay
        visible={Boolean(celebration)}
        type={celebration?.type}
        order={celebration?.order}
        onDismiss={dismiss}
        onTrackOrder={handleTrackOrder}
        onContinue={handleContinue}
      />
    </OrderCelebrationContext.Provider>
  );
}

export function useOrderCelebration() {
  const ctx = useContext(OrderCelebrationContext);
  if (!ctx) {
    return {
      showOrderConfirmed: () => {},
      showOrderDelivered: () => {},
      dismissCelebration: () => {},
      seedOrderStatuses: () => {},
    };
  }
  return ctx;
}
