import { useCallback, useEffect, useState } from "react";
import { AppState } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { fetchStoreInfo } from "../services/userService";
import { normalizeStoreInfo } from "../utils/storeRules";

/** How often a focused screen re-reads the shop's rules. */
export const STORE_INFO_REFRESH_MS = 60_000;
/** Screens that ask within this window of a good answer share it instead of calling the API again. */
const SHARED_FOR_MS = 5_000;

let snapshot = null;
let snapshotAt = 0;
let inFlight = null;
const subscribers = new Set();

/**
 * Re-reads the public `GET /store-info` and shares the answer with every screen using `useStoreInfo`.
 * Never rejects: when the request fails the previous answer stays, so a flaky network can't block ordering
 * (the API still enforces the rules and its error is shown as the fallback).
 */
export function refreshStoreInfo({ force = false } = {}) {
  if (inFlight) return inFlight;
  if (!force && snapshot && Date.now() - snapshotAt < SHARED_FOR_MS) return Promise.resolve(snapshot);
  inFlight = fetchStoreInfo()
    .then((raw) => {
      const next = normalizeStoreInfo(raw);
      if (next) {
        snapshot = next;
        snapshotAt = Date.now();
        subscribers.forEach((notify) => notify(next));
      }
      return snapshot;
    })
    .catch(() => snapshot)
    .finally(() => {
      inFlight = null;
    });
  return inFlight;
}

/**
 * The shop's current rules (`null` until the first answer, or if it never comes): open or paused, the minimum order,
 * which payment methods are on. Cached for the whole app, refreshed whenever the screen gains focus, when the app
 * returns to the foreground, and about every minute while the screen stays focused. Feed it to `getStoreRules`.
 * Needs a screen context (it uses `useFocusEffect`).
 */
export default function useStoreInfo() {
  const [info, setInfo] = useState(snapshot);

  useEffect(() => {
    subscribers.add(setInfo);
    setInfo(snapshot);
    return () => {
      subscribers.delete(setInfo);
    };
  }, []);

  useFocusEffect(
    useCallback(() => {
      refreshStoreInfo();
      const timer = setInterval(() => refreshStoreInfo({ force: true }), STORE_INFO_REFRESH_MS);
      const appState = AppState.addEventListener("change", (state) => {
        if (state === "active") refreshStoreInfo();
      });
      return () => {
        clearInterval(timer);
        appState.remove();
      };
    }, [])
  );

  return info;
}
