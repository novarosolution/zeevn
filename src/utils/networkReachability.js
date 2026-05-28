import { Platform } from "react-native";

/** True when the browser reports network (web only). */
export function isBrowserOnline() {
  if (typeof navigator === "undefined") return true;
  return navigator.onLine !== false;
}

/**
 * Whether the app should treat the device as offline for UX (banner, auth guard).
 * Web: browser `navigator.onLine` only — NetInfo/API reachability false-negatives otherwise.
 */
export function isNetworkOffline(state) {
  if (Platform.OS === "web") {
    return !isBrowserOnline();
  }

  // Only physical disconnect — ignore isInternetReachable (API/reachability probes lie).
  return state?.isConnected === false;
}
