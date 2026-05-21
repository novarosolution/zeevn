import { useEffect, useState } from "react";
import { Platform } from "react-native";

function isWebRuntime() {
  return Platform.OS === "web" || (typeof window !== "undefined" && typeof document !== "undefined");
}

/**
 * Web-only: show offline UI only after the browser fires `offline`.
 * Ignores navigator.onLine on first paint (avoids false positives when the API is down).
 */
export function useWebBrowserOffline() {
  const web = isWebRuntime();
  const [offline, setOffline] = useState(false);

  useEffect(() => {
    if (!web || typeof window === "undefined") return undefined;

    const onOffline = () => setOffline(true);
    const onOnline = () => setOffline(false);

    window.addEventListener("offline", onOffline);
    window.addEventListener("online", onOnline);
    return () => {
      window.removeEventListener("offline", onOffline);
      window.removeEventListener("online", onOnline);
    };
  }, [web]);

  return { web, offline };
}
