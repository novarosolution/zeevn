import { Platform } from "react-native";
import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "./AuthContext";
import {
  connectLiveSocket,
  disconnectLiveSocket,
  getLiveSocket,
  isLiveSocketConnected,
  onLiveEvent,
  subscribeLiveOrder,
  unsubscribeLiveOrder,
} from "../services/liveSocket";

const LiveSocketContext = createContext(undefined);

export function LiveSocketProvider({ children }) {
  const { token, isAuthenticated } = useAuth();
  const [connected, setConnected] = useState(false);
  const socketRef = useRef(null);

  useEffect(() => {
    if (!isAuthenticated || !token) {
      disconnectLiveSocket();
      socketRef.current = null;
      setConnected(false);
      return undefined;
    }

    let cancelled = false;
    let idleId;
    let timeoutId;
    let teardownSocket = null;

    const runConnect = async () => {
      const sock = await connectLiveSocket(token);
      if (cancelled) return;
      socketRef.current = sock;
      if (!sock) {
        setConnected(false);
        return;
      }

      const onConnect = () => setConnected(true);
      const onDisconnect = () => setConnected(false);

      sock.on("connect", onConnect);
      sock.on("disconnect", onDisconnect);
      setConnected(sock.connected);

      teardownSocket = () => {
        sock.off("connect", onConnect);
        sock.off("disconnect", onDisconnect);
      };
    };

    if (Platform.OS === "web") {
      if (typeof requestIdleCallback === "function") {
        idleId = requestIdleCallback(runConnect, { timeout: 2500 });
      } else {
        timeoutId = setTimeout(runConnect, 1200);
      }
    } else {
      timeoutId = setTimeout(runConnect, 800);
    }

    return () => {
      cancelled = true;
      if (idleId != null && typeof cancelIdleCallback === "function") {
        cancelIdleCallback(idleId);
      }
      if (timeoutId != null) clearTimeout(timeoutId);
      teardownSocket?.();
      disconnectLiveSocket();
      socketRef.current = null;
      setConnected(false);
    };
  }, [isAuthenticated, token]);

  const subscribeOrder = useCallback((orderId) => {
    subscribeLiveOrder(orderId);
  }, []);

  const unsubscribeOrder = useCallback((orderId) => {
    unsubscribeLiveOrder(orderId);
  }, []);

  const on = useCallback((event, handler) => onLiveEvent(event, handler), []);

  const value = useMemo(
    () => ({
      connected,
      socket: getLiveSocket(),
      subscribeOrder,
      unsubscribeOrder,
      on,
    }),
    [connected, subscribeOrder, unsubscribeOrder, on]
  );

  return <LiveSocketContext.Provider value={value}>{children}</LiveSocketContext.Provider>;
}

export function useLiveSocket() {
  const ctx = useContext(LiveSocketContext);
  if (!ctx) {
    return {
      connected: false,
      socket: null,
      subscribeOrder: () => {},
      unsubscribeOrder: () => {},
      on: () => () => {},
    };
  }
  return ctx;
}

export function useLiveSocketStatus() {
  return useLiveSocket().connected || isLiveSocketConnected();
}
