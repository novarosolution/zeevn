import AsyncStorage from "@react-native-async-storage/async-storage";
import { getApiBaseUrl, ZEEVAN_API_URL } from "./apiBase";

const PREFERRED_URL_KEY = "@zeevan_api_preferred_url";
const REQUEST_TIMEOUT_MS = 12_000;
const HEALTH_TIMEOUT_MS = 6_000;

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

/** Candidate API origins — configured URL first, then production fallback. */
export function getApiEndpointCandidates() {
  const configured = getApiBaseUrl();
  const envFallback = String(process.env.EXPO_PUBLIC_API_URL_FALLBACK || "").trim();
  return uniqueUrls([preferredUrl, configured, envFallback, ZEEVAN_API_URL]);
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
  return candidates[0] || ZEEVAN_API_URL;
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
 * Wakes cold Render instances by hitting the fastest reachable host.
 */
export async function fetchBalanced(path, options = {}, { timeoutMs = REQUEST_TIMEOUT_MS } = {}) {
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
      if (response.ok || response.status < 500) {
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
