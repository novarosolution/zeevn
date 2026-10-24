import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { Platform } from "react-native";
import { useAuth } from "./AuthContext";
import { checkDeliveryServiceability } from "../services/deliveryService";
import { getCurrentAddressFromGPS } from "../services/locationService";
import {
  DELIVERY_CONFIRM_TTL_MS,
  isDeliveryLocationConfirmed,
  loadCachedDeliverySnippet,
  loadDeliveryConfirmedAt,
  saveCachedDeliverySnippet,
  saveDeliveryConfirmedAt,
} from "../services/deliveryLocationCache";
import { formatDeliveryLocationLabel, formatSavedAddressLabel } from "../utils/deliveryLocationLabel";

const DETECT_COOLDOWN_MS = 90 * 1000;

function validCoord(n) {
  const v = Number(n);
  return Number.isFinite(v) && Math.abs(v) > 0.2;
}

function coordsFrom(snippet, address) {
  const lat = snippet?.latitude ?? snippet?.lat ?? address?.latitude;
  const lng = snippet?.longitude ?? snippet?.lng ?? address?.longitude;
  return {
    latitude: validCoord(lat) ? Number(lat) : undefined,
    longitude: validCoord(lng) ? Number(lng) : undefined,
    postalCode: address?.postalCode || snippet?.postalCode || "",
    city: snippet?.city || address?.city || "",
  };
}

const defaultDeliveryLocationValue = {
  bootstrapped: Platform.OS === "web",
  status: "idle",
  snippet: null,
  quote: null,
  detect: async () => null,
  confirmLocation: async () => {},
  clearConfirmation: async () => {},
  needsFindScreen: false,
  isFinding: false,
  displayLabel: "Set delivery location",
  savedLabel: "",
  confirmedAt: null,
  confirmTtlMs: DELIVERY_CONFIRM_TTL_MS,
};

const DeliveryLocationContext = createContext(defaultDeliveryLocationValue);

export function DeliveryLocationProvider({ children }) {
  const { user } = useAuth();
  const [bootstrapped, setBootstrapped] = useState(false);
  const [status, setStatus] = useState("idle");
  const [snippet, setSnippet] = useState(null);
  const [quote, setQuote] = useState(null);
  const [confirmedAt, setConfirmedAt] = useState(null);
  const snippetRef = useRef(null);
  const lastDetectAtRef = useRef(0);
  const detectInFlightRef = useRef(false);
  const askedDetectRef = useRef(false);

  const savedLabel = useMemo(
    () => formatSavedAddressLabel(user?.defaultAddress || user?.addresses?.[0]),
    [user?.defaultAddress, user?.addresses]
  );

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [cached, confirmed] = await Promise.all([
        loadCachedDeliverySnippet(),
        loadDeliveryConfirmedAt(),
      ]);
      if (cancelled) return;
      if (cached && (cached.label || validCoord(cached.latitude ?? cached.lat))) {
        snippetRef.current = cached;
        setSnippet(cached);
      }
      setConfirmedAt(confirmed);
      setBootstrapped(true);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!bootstrapped || snippetRef.current) return;
    const addr = user?.defaultAddress;
    if (!addr) return;
    if (!validCoord(addr.latitude) && !addr.city && !addr.postalCode) return;
    const next = {
      ...addr,
      label: formatSavedAddressLabel(addr) || addr.city || "Saved address",
      updatedAt: Date.now(),
    };
    snippetRef.current = next;
    setSnippet(next);
  }, [bootstrapped, user?.defaultAddress]);

  const detect = useCallback(
    async ({ force = false } = {}) => {
      if (detectInFlightRef.current) return snippetRef.current;

      const now = Date.now();
      const cached = snippetRef.current;
      if (!force && validCoord(cached?.latitude) && now - lastDetectAtRef.current < DETECT_COOLDOWN_MS) {
        return cached;
      }

      detectInFlightRef.current = true;
      setStatus("detecting");
      try {
        const address = await getCurrentAddressFromGPS();
        const label = formatDeliveryLocationLabel(address);
        const next = {
          ...address,
          label: label || "Current location",
          updatedAt: now,
        };
        snippetRef.current = next;
        setSnippet(next);
        await saveCachedDeliverySnippet(next);
        lastDetectAtRef.current = now;
        setStatus("ready");
        return next;
      } catch {
        const fallback = snippetRef.current;
        setStatus(fallback?.label || savedLabel ? "ready" : "error");
        return fallback;
      } finally {
        detectInFlightRef.current = false;
      }
    },
    [savedLabel]
  );

  useEffect(() => {
    if (!bootstrapped || Platform.OS === "web") return;
    if (validCoord(snippetRef.current?.latitude ?? snippetRef.current?.lat)) return;
    if (askedDetectRef.current) return;
    askedDetectRef.current = true;
    detect();
  }, [bootstrapped, detect, snippet, user?.defaultAddress]);

  useEffect(() => {
    if (!bootstrapped) return undefined;
    const point = coordsFrom(snippet, user?.defaultAddress);
    if (point.latitude == null && !point.postalCode && !point.city) {
      setQuote(null);
      return undefined;
    }
    let cancelled = false;
    checkDeliveryServiceability(point)
      .then((res) => {
        if (!cancelled) setQuote(res);
      })
      .catch(() => {
        if (!cancelled) setQuote(null);
      });
    return () => {
      cancelled = true;
    };
  }, [bootstrapped, snippet, user?.defaultAddress]);

  const confirmLocation = useCallback(async (nextSnippet) => {
    const payload = nextSnippet || snippetRef.current;
    const now = Date.now();
    if (payload?.label || validCoord(payload?.latitude)) {
      snippetRef.current = payload;
      setSnippet(payload);
      await saveCachedDeliverySnippet(payload);
    }
    await saveDeliveryConfirmedAt(now);
    setConfirmedAt(now);
    setStatus("ready");
  }, []);

  const clearConfirmation = useCallback(async () => {
    setConfirmedAt(null);
    await saveDeliveryConfirmedAt(0);
  }, []);

  const needsFindScreen = useMemo(() => {
    if (Platform.OS === "web" || !bootstrapped || !user) return false;
    return !isDeliveryLocationConfirmed(confirmedAt);
  }, [bootstrapped, confirmedAt, user]);

  const isFinding = status === "detecting";
  const displayLabel = snippet?.label || savedLabel || "Set delivery location";

  const value = useMemo(
    () => ({
      bootstrapped,
      status,
      snippet,
      quote,
      detect,
      confirmLocation,
      clearConfirmation,
      needsFindScreen,
      isFinding,
      displayLabel,
      savedLabel,
      confirmedAt,
      confirmTtlMs: DELIVERY_CONFIRM_TTL_MS,
    }),
    [
      bootstrapped,
      status,
      snippet,
      quote,
      detect,
      confirmLocation,
      clearConfirmation,
      needsFindScreen,
      isFinding,
      displayLabel,
      savedLabel,
      confirmedAt,
    ]
  );

  return (
    <DeliveryLocationContext.Provider value={value}>{children}</DeliveryLocationContext.Provider>
  );
}

export function useDeliveryLocation() {
  return useContext(DeliveryLocationContext);
}
