import AsyncStorage from "@react-native-async-storage/async-storage";
import { getApiBaseUrl } from "./apiBase";

const PREFERRED_URL_KEY = "@zeevan_api_preferred_url";
const REQUEST_TIMEOUT_MS = 12_000;
/** Render free tier cold starts can exceed 6s — allow longer health probes. */
const HEALTH_TIMEOUT_MS = 25_000;

let preferredUrl = null;
let preferredLoaded = false;

function uniqueUrls(urls) {
  const seen = new Set();
  const out = [];
  for (const raw of urls) {
    const url = String(raw || "").trim().replace(/\/+$/, "");
    if (!url || seen.has(url)) continue;
    seen.add(url);
    out.push(url);
  }
  return out;
}

function isLanUrl(url) {
  try {
    const h = new URL(String(url)).hostname.toLowerCase();
    if (h === "localhost" || h === "127.0.0.1" || h === "0.0.0.0" || h === "10.0.2.2") return true;
    if (/^192\.168\.\d+\.\d+$/.test(h) || /^10\.\d+\.\d+\.\d+$/.test(h)) return true;
    if (/^172\.(1[6-9]|2\d|3[0-1])\.\d+\.\d+$/.test(h)) return true;
    return false;
  } catch {
    return false;
  }
}

/** Candidate API origins — live/configured first; stale LAN preferred URLs are ignored. */
export function getApiEndpointCandidates() {
  const configured = getApiBaseUrl();
  const envFallback = String(process.env.EXPO_PUBLIC_API_URL_FALLBACK || "").trim();
  const preferred = preferredUrl && !isLanUrl(preferredUrl) ? preferredUrl : null;
  return uniqueUrls([configured, preferred, envFallback]);
}

async function ensurePreferredLoaded() {
  if (preferredLoaded) return;
  preferredLoaded = true;
  try {
    const saved = await AsyncStorage.getItem(PREFERRED_URL_KEY);
    if (saved) preferredUrl = saved.replace(/\/+$/, "");
  } catch {
    // ignore
  }
}

export async function getBalancedApiBaseUrl() {
  await ensurePreferredLoaded();
  const candidates = getApiEndpointCandidates();
  return candidates[0] || getApiBaseUrl();
}

export async function markApiEndpointHealthy(url) {
  const normalized = String(url || "").trim().replace(/\/+$/, "");
  if (!normalized) return;
  preferredUrl = normalized;
  preferredLoaded = true;
  try {
    await AsyncStorage.setItem(PREFERRED_URL_KEY, normalized);
  } catch {
    // ignore
  }
}

async function fetchWithTimeout(url, options = {}, timeoutMs = REQUEST_TIMEOUT_MS) {
  const controller = typeof AbortController !== "undefined" ? new AbortController() : null;
  const timer = controller
    ? setTimeout(() => {
        controller.abort();
      }, timeoutMs)
    : null;
  try {
    return await fetch(url, {
      ...options,
      signal: controller?.signal,
    });
  } finally {
    if (timer) clearTimeout(timer);
  }
}

/**
 * Race API origins — first healthy response wins (load balancing / failover).
 * First healthy response wins (load balancing / failover).
 */
export async function fetchBalanced(path, options = {}, { timeoutMs = REQUEST_TIMEOUT_MS, accept5xx = false } = {}) {
  await ensurePreferredLoaded();
  const candidates = getApiEndpointCandidates();
  const relativePath = String(path || "");
  const isAbsolute = /^https?:\/\//i.test(relativePath);

  let lastError = null;
  for (const base of candidates) {
    const url = isAbsolute
      ? relativePath
      : relativePath === "/"
        ? `${base.replace(/\/api\/?$/i, "")}/`
        : `${base}${relativePath}`;
    try {
      const response = await fetchWithTimeout(url, options, timeoutMs);
      if (response.ok || response.status < 500 || (accept5xx && response.status === 503)) {
        await markApiEndpointHealthy(base);
        return response;
      }
      lastError = new Error(`Request failed (${response.status}).`);
    } catch (err) {
      lastError = err instanceof Error ? err : new Error("Network request failed.");
    }
  }

  throw lastError || new Error("All API endpoints are unreachable.");
}

/** Parallel health probe — used on boot to pick the fastest API host. */
export async function warmApiEndpoints() {
  await ensurePreferredLoaded();
  const candidates = getApiEndpointCandidates();
  const probes = candidates.map(async (base) => {
    try {
      const response = await fetchWithTimeout(`${base.replace(/\/api\/?$/i, "")}/`, { method: "GET" }, HEALTH_TIMEOUT_MS);
      const data = await response.json().catch(() => ({}));
      if (response.ok && data?.ok) {
        return base;
      }
    } catch {
      // try next
    }
    return null;
  });
  const results = await Promise.all(probes);
  const winner = results.find(Boolean);
  if (winner) await markApiEndpointHealthy(winner);
  return winner;
}
