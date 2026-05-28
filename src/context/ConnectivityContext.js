import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { Platform } from "react-native";
import NetInfo from "@react-native-community/netinfo";
import { WRITE_TYPES, flushCriticalWriteQueue } from "../utils/criticalWriteQueue";
import { replaceMyCart } from "../services/userService";
import { saveSavedAddresses } from "../utils/savedAddresses";
import { captureException } from "../observability/sentry";
import { isNetworkOffline } from "../utils/networkReachability";

const ConnectivityContext = createContext(undefined);

async function runReplayHandlers(getAuth) {
  const { token, updateStoredUser } = getAuth() || {};
  return flushCriticalWriteQueue({
    [WRITE_TYPES.CART_SYNC]: async (payload) => {
      if (!token) return;
      await replaceMyCart(token, payload.items || []);
    },
    [WRITE_TYPES.ADDRESS_SAVE]: async (payload) => {
      if (!token) return;
      await saveSavedAddresses(payload.list || [], { token, updateStoredUser });
    },
  });
}

const isWebRuntime = () =>
  Platform.OS === "web" || (typeof window !== "undefined" && typeof document !== "undefined");

export function ConnectivityProvider({ children, getAuth }) {
  const [isOffline, setIsOffline] = useState(false);
  const [isFlushing, setIsFlushing] = useState(false);
  const wasOfflineRef = useRef(false);
  const getAuthRef = useRef(getAuth);
  getAuthRef.current = getAuth;

  const flushQueue = useCallback(async () => {
    if (!getAuthRef.current) return { flushed: 0, failed: 0 };
    setIsFlushing(true);
    try {
      return await runReplayHandlers(() => getAuthRef.current());
    } catch (err) {
      captureException(err, { tags: { area: "critical_write_queue" } });
      return { flushed: 0, failed: 1 };
    } finally {
      setIsFlushing(false);
    }
  }, []);

  const applyOffline = useCallback(
    (offline) => {
      setIsOffline(offline);
      if (wasOfflineRef.current && !offline) {
        flushQueue().catch(() => {});
      }
      wasOfflineRef.current = offline;
    },
    [flushQueue]
  );

  useEffect(() => {
    if (isWebRuntime()) {
      if (typeof window === "undefined") return undefined;

      const onOnline = () => applyOffline(false);
      const onOffline = () => applyOffline(true);

      window.addEventListener("online", onOnline);
      window.addEventListener("offline", onOffline);
      return () => {
        window.removeEventListener("online", onOnline);
        window.removeEventListener("offline", onOffline);
      };
    }

    let mounted = true;
    const applyNetInfo = (state) => {
      if (!mounted) return;
      applyOffline(isNetworkOffline(state));
    };

    const unsub = NetInfo.addEventListener(applyNetInfo);
    NetInfo.fetch().then(applyNetInfo).catch(() => {});

    return () => {
      mounted = false;
      unsub();
    };
  }, [applyOffline]);

  const value = useMemo(
    () => ({
      isOffline,
      isFlushing,
      flushQueue,
    }),
    [isOffline, isFlushing, flushQueue]
  );

  return <ConnectivityContext.Provider value={value}>{children}</ConnectivityContext.Provider>;
}

export function useConnectivity() {
  const ctx = useContext(ConnectivityContext);
  if (!ctx) {
    throw new Error("useConnectivity must be used within ConnectivityProvider");
  }
  return ctx;
}

export function useConnectivityOptional() {
  return useContext(ConnectivityContext);
}
