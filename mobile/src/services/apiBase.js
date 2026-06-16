import Constants from "expo-constants";

/** Production API (Render). */
export const ZEEVAN_API_URL = "https://kankregserver.onrender.com";

/** Local dev API — backend `npm run dev` on port 5001. */
export const ZEEVAN_API_LOCAL_URL = "http://127.0.0.1:5001";

function isLocalHostname(host) {
  const h = String(host || "").toLowerCase();
  return (
    h === "localhost" ||
    h === "127.0.0.1" ||
    h === "0.0.0.0" ||
    h === "10.0.2.2" ||
    /^\d+\.\d+\.\d+\.\d+$/.test(h)
  );
}

function isInvalidApiHost(hostname) {
  const h = String(hostname || "").toLowerCase();
  if (/^srv-[a-z0-9]+$/i.test(h)) return true;
  return false;
}

function normalizeApiUrl(raw) {
  if (raw == null) return null;
  let s = String(raw).trim();
  if (!s) return null;

  if (/^:\d+$/.test(s)) {
    s = `http://127.0.0.1${s}`;
  } else if (/^\d+$/.test(s)) {
    s = `http://127.0.0.1:${s}`;
  } else if (s.startsWith("//")) {
    s = `http:${s}`;
  } else if (!/^https?:\/\//i.test(s) && /^[\w.-]+(:\d+)?(\/.*)?$/.test(s)) {
    s = `http://${s}`;
  }

  return s.replace(/\/+$/, "");
}

function upgradeInsecureRemoteUrl(url) {
  if (!url || !/^http:\/\//i.test(url)) return url;
  try {
    const { hostname } = new URL(url);
    if (isLocalHostname(hostname)) return url;
    return url.replace(/^http:\/\//i, "https://");
  } catch {
    return url;
  }
}

/** Local / LAN URLs from EXPO_PUBLIC_API_URL (dev). */
function parseLocalApiUrl(raw) {
  const normalized = normalizeApiUrl(raw);
  if (!normalized) return null;
  try {
    const { hostname } = new URL(normalized);
    if (isInvalidApiHost(hostname)) return null;
    if (isLocalHostname(hostname)) return normalized;
  } catch {
    return null;
  }
  return null;
}

/** Public HTTPS API URLs only (production). */
function sanitizeRemoteApiUrl(raw) {
  const normalized = normalizeApiUrl(raw);
  if (!normalized) return null;

  const upgraded = upgradeInsecureRemoteUrl(normalized);
  if (!upgraded) return null;

  try {
    const { hostname } = new URL(upgraded);
    if (isInvalidApiHost(hostname) || isLocalHostname(hostname)) return null;
  } catch {
    return null;
  }

  return upgraded;
}

function getConfiguredApiUrl() {
  const raw = process.env.EXPO_PUBLIC_API_URL ?? Constants.expoConfig?.extra?.apiUrl;
  const local = parseLocalApiUrl(raw);
  if (local) return local;
  const remote = sanitizeRemoteApiUrl(raw);
  if (remote) return remote;
  return null;
}

/** WebSocket host — same origin as API, without `/api` suffix. */
export function getSocketBaseUrl() {
  const api = getApiBaseUrl();
  if (!api) return "";
  return api.replace(/\/api\/?$/i, "");
}

/** Dev → local backend; production → Render unless EXPO_PUBLIC_API_URL is set. */
export function getApiBaseUrl() {
  const configured = getConfiguredApiUrl();
  if (configured) return configured;
  if (typeof __DEV__ !== "undefined" && __DEV__) {
    return ZEEVAN_API_LOCAL_URL;
  }
  return ZEEVAN_API_URL;
}

export function isLocalApiUrl(url = getApiBaseUrl()) {
  try {
    return isLocalHostname(new URL(url).hostname);
  } catch {
    return false;
  }
}
