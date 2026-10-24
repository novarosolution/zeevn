import Constants from "expo-constants";
import { Platform } from "react-native";

/** Local dev API — backend `npm run dev` on port 5001. */
export const ZEEVAN_API_LOCAL_URL = "http://127.0.0.1:5001";

/** Live shop API — Vercel /aws proxies EC2. Phone cannot use 127.0.0.1. */
export const ZEEVAN_API_LIVE_URL = "https://www.zeevan.shop/aws";

function isLoopbackHostname(host) {
  const h = String(host || "").toLowerCase();
  return h === "localhost" || h === "127.0.0.1" || h === "0.0.0.0" || h === "10.0.2.2";
}

/** True for loopback / emulator / private LAN — not public cloud IPs. */
function isLocalHostname(host) {
  const h = String(host || "").toLowerCase();
  if (isLoopbackHostname(h)) return true;
  // RFC1918 private ranges (dev LAN). Public EC2 IPs must NOT match.
  if (/^10\.\d+\.\d+\.\d+$/.test(h)) return true;
  if (/^192\.168\.\d+\.\d+$/.test(h)) return true;
  if (/^172\.(1[6-9]|2\d|3[0-1])\.\d+\.\d+$/.test(h)) return true;
  return false;
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
    // Bare IPs (EC2 http://54.x) have no TLS — keep http.
    if (/^\d+\.\d+\.\d+\.\d+$/.test(hostname)) return url;
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
    // Allow public IP hosts over http (EC2) as well as https domains.
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

/**
 * Browser production host → same-origin API.
 * Fixes stale exports that baked `EXPO_PUBLIC_API_URL=http://127.0.0.1:5001`
 * (product `/media/…` URLs then pointed at the visitor's own machine and never loaded).
 */
function getWebRuntimeApiBaseUrl() {
  if (typeof window === "undefined" || !window.location?.hostname) return null;
  const host = String(window.location.hostname).toLowerCase();
  if (isLoopbackHostname(host)) return null;

  const origin = String(window.location.origin || "").replace(/\/+$/, "");
  if (!origin) return null;

  // Vercel (zeevan.shop) proxies the EC2 API under `/aws`.
  if (/(^|\.)zeevan\.(shop|app)$/i.test(host) || host.endsWith(".vercel.app")) {
    return `${origin}/aws`;
  }

  // EC2 IP / nginx site — `/api` and `/media` are reverse-proxied.
  return origin;
}

function hostnameOf(url) {
  try {
    return new URL(url).hostname;
  } catch {
    return "";
  }
}

/** WebSocket host — same origin as API, without `/api` suffix. */
export function getSocketBaseUrl() {
  const api = getApiBaseUrl();
  if (!api) return "";
  return api.replace(/\/api\/?$/i, "");
}

/**
 * Dev web → local backend; production web → current origin (+ `/aws` on the shop);
 * native → live shop (loopback is the phone itself, so catalog images never load).
 */
export function getApiBaseUrl() {
  const webRuntime = getWebRuntimeApiBaseUrl();
  const configured = getConfiguredApiUrl();

  if (webRuntime) {
    // Never serve localhost media URLs to real visitors.
    if (!configured || isLocalHostname(hostnameOf(configured))) return webRuntime;
    return webRuntime;
  }

  const native = Platform.OS !== "web";
  if (native) {
    if (configured && !isLoopbackHostname(hostnameOf(configured))) return configured;
    return ZEEVAN_API_LIVE_URL;
  }

  if (configured) return configured;
  if (typeof __DEV__ !== "undefined" && __DEV__) {
    return ZEEVAN_API_LOCAL_URL;
  }
  return ZEEVAN_API_LIVE_URL;
}

export function isLocalApiUrl(url = getApiBaseUrl()) {
  try {
    return isLocalHostname(new URL(url).hostname);
  } catch {
    return false;
  }
}
