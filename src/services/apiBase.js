import { Platform } from "react-native";
import Constants from "expo-constants";

// Production app calls this host + paths like /products. Static sites on the same domain
// usually proxy the API under /api — we mount both /products and /api/products on the server.
// Override with EXPO_PUBLIC_API_URL if your API lives elsewhere (e.g. https://api.example.com).
const PRODUCTION_API_URL = "https://novarosolution.com/api";
const DEV_API_PORT = 5001;

/**
 * Fix common .env mistakes: ":5001", "5001", "localhost" without scheme, etc.
 */
function sanitizeConfiguredBase(raw) {
  if (raw == null) return null;
  const s = String(raw).trim();
  if (!s) return null;

  if (/^:\d+$/.test(s)) {
    return `http://127.0.0.1${s}`;
  }
  if (/^\d+$/.test(s)) {
    return `http://127.0.0.1:${s}`;
  }
  if (s.startsWith("//")) {
    return `https:${s}`;
  }
  if (!/^https?:\/\//i.test(s)) {
    if (/^[\w.-]+(:\d+)?(\/.*)?$/.test(s)) {
      return `http://${s}`;
    }
  }
  return s.replace(/\/+$/, "");
}

export function getApiBaseUrl() {
  const configured = sanitizeConfiguredBase(process.env.EXPO_PUBLIC_API_URL);
  if (configured) {
    return configured;
  }

  const isDev = typeof __DEV__ === "undefined" || __DEV__;
  if (!isDev) {
    return PRODUCTION_API_URL;
  }

  // Web: use 127.0.0.1 so we don't hit IPv6 ::1 with no server (broken fetch / 404 from wrong host).
  if (Platform.OS === "web" && typeof window !== "undefined") {
    return `http://127.0.0.1:${DEV_API_PORT}`;
  }

  const debuggerHost =
    Constants.expoGoConfig?.debuggerHost ||
    Constants.manifest2?.extra?.expoGo?.debuggerHost ||
    "";
  const devHost = debuggerHost.split(":")[0];
  if (devHost) {
    return `http://${devHost}:${DEV_API_PORT}`;
  }

  if (Platform.OS === "android") {
    return `http://10.0.2.2:${DEV_API_PORT}`;
  }

  return `http://127.0.0.1:${DEV_API_PORT}`;
}
