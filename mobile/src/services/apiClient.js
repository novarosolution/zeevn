import { fetchBalanced } from "./apiEndpointBalancer";

const HEALTH_PROBE_TIMEOUT_MS = 25_000;

/**
 * Lightweight central API client.
 *
 * Responsibilities:
 *  - Build absolute URLs from relative paths.
 *  - Inject the current access token via a getter set by AuthContext.
 *  - On 401, exchange the stored refresh token for a fresh access token via
 *    POST /users/refresh, swap it in, and retry the original request once.
 *  - Coalesce concurrent refresh attempts so a 401 burst yields a single
 *    backend call.
 *  - On refresh failure, emit a `session-expired` event so AuthContext can
 *    clear the session and the UI can react.
 *
 * AuthContext wiring (one-time on app boot):
 *
 *   import { configureApiClient } from "./apiClient";
 *   configureApiClient({
 *     getAccessToken: () => tokenRef.current,
 *     getRefreshToken: () => refreshTokenRef.current,
 *     onTokensRefreshed: (token, user) => persist({ token, ... }),
 *     onSessionExpired: () => signOut(),
 *   });
 */

let getAccessToken = () => null;
let getRefreshToken = () => null;
let onTokensRefreshed = null;
let onSessionExpired = null;

/** Single in-flight refresh promise. Multiple 401s share the same call. */
let refreshInFlight = null;

const subscribers = new Set();

export function configureApiClient(config = {}) {
  if (typeof config.getAccessToken === "function") {
    getAccessToken = config.getAccessToken;
  }
  if (typeof config.getRefreshToken === "function") {
    getRefreshToken = config.getRefreshToken;
  }
  if (typeof config.onTokensRefreshed === "function") {
    onTokensRefreshed = config.onTokensRefreshed;
  }
  if (typeof config.onSessionExpired === "function") {
    onSessionExpired = config.onSessionExpired;
  }
}

/** Subscribe to "session-expired" events. Returns unsubscribe. */
export function onSessionExpiredEvent(handler) {
  subscribers.add(handler);
  return () => subscribers.delete(handler);
}

function emitSessionExpired(reason) {
  if (onSessionExpired) {
    try {
      onSessionExpired(reason);
    } catch {
      // Defensive: never throw from the failure path.
    }
  }
  for (const handler of subscribers) {
    try {
      handler(reason);
    } catch {
      // Same defense for external subscribers.
    }
  }
}

async function readJson(response) {
  try {
    return await response.json();
  } catch {
    return {};
  }
}

/** An `Error` carrying the server's machine-readable `code` (e.g. `MIN_ORDER`) and HTTP `status` next to its message. */
function requestError(data, fallback, status) {
  const error = new Error(data?.message || fallback);
  error.status = status;
  if (data?.code) error.code = data.code;
  return error;
}

function networkError(err) {
  const raw = String(err?.message || err || "");
  if (/abort|timeout|network request failed|unreachable|failed to fetch/i.test(raw)) {
    return new Error("Can't reach the shop. Check your internet and try again.");
  }
  return err instanceof Error ? err : new Error(raw || "Request failed.");
}

async function doFetch(path, options, token, timeoutMs) {
  const headers = { ...(options.headers || {}) };
  if (!headers["Content-Type"] && options.body && typeof options.body === "string") {
    headers["Content-Type"] = "application/json";
  }
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  if (/^https?:\/\//i.test(path)) {
    return fetch(path, { ...options, headers });
  }
  return fetchBalanced(path, { ...options, headers }, { timeoutMs });
}

async function refreshAccessToken() {
  if (refreshInFlight) {
    return refreshInFlight;
  }
  const refreshToken = getRefreshToken();
  if (!refreshToken) {
    return Promise.reject(new Error("No refresh token available."));
  }

  refreshInFlight = (async () => {
    try {
      const response = await fetchBalanced("/users/refresh", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken }),
      });
      const data = await readJson(response);
      if (!response.ok || !data?.token) {
        throw new Error(data?.message || "Refresh failed.");
      }
      if (onTokensRefreshed) {
        try {
          await onTokensRefreshed(data.token, data.user || null);
        } catch {
          // Persist failure shouldn't kill the in-memory refresh.
        }
      }
      return data.token;
    } finally {
      refreshInFlight = null;
    }
  })();

  return refreshInFlight;
}

/**
 * Public request entrypoint. Pass `auth: false` to skip the bearer header
 * (used internally for /login, /register, /refresh).
 */
export async function apiRequest(path, options = {}) {
  const { auth = true, timeoutMs, ...rest } = options;
  const initialToken = auth ? getAccessToken() : null;

  let response;
  try {
    response = await doFetch(path, rest, initialToken, timeoutMs);
  } catch (err) {
    throw networkError(err);
  }

  if (response.status !== 401 || !auth) {
    const data = await readJson(response);
    if (!response.ok) {
      throw requestError(data, `Request failed (${response.status}).`, response.status);
    }
    return data;
  }

  if (!getRefreshToken()) {
    emitSessionExpired("no-refresh-token");
    const data = await readJson(response);
    throw new Error(data.message || "Session expired.");
  }

  let nextToken;
  try {
    nextToken = await refreshAccessToken();
  } catch (err) {
    emitSessionExpired(err?.message || "refresh-failed");
    throw err instanceof Error ? err : new Error("Refresh failed.");
  }

  try {
    response = await doFetch(path, rest, nextToken, timeoutMs);
  } catch (err) {
    throw networkError(err);
  }
  const data = await readJson(response);
  if (response.status === 401) {
    emitSessionExpired("retry-401");
    throw new Error(data.message || "Session expired.");
  }
  if (!response.ok) {
    throw requestError(data, `Request failed (${response.status}).`, response.status);
  }
  return data;
}

export function apiGet(path, options = {}) {
  return apiRequest(path, { ...options, method: "GET" });
}

export function apiPost(path, body, options = {}) {
  return apiRequest(path, {
    ...options,
    method: "POST",
    body: body == null ? undefined : JSON.stringify(body),
  });
}

export function apiPut(path, body, options = {}) {
  return apiRequest(path, {
    ...options,
    method: "PUT",
    body: body == null ? undefined : JSON.stringify(body),
  });
}

export function apiPatch(path, body, options = {}) {
  return apiRequest(path, {
    ...options,
    method: "PATCH",
    body: body == null ? undefined : JSON.stringify(body),
  });
}

export function apiDelete(path, options = {}) {
  return apiRequest(path, { ...options, method: "DELETE" });
}

/** GET /api/health. A 503 body is a failed check (db down), not an unreachable API. */
export async function fetchApiHealth() {
  const response = await fetchBalanced("/api/health", { method: "GET" }, { accept5xx: true });
  const data = await readJson(response);
  if (data?.db !== "connected" && data?.db !== "disconnected") {
    throw new Error("Can't reach the API");
  }
  return {
    ok: Boolean(data.ok),
    db: data.db,
    socket: data.socket === "ready" ? "ready" : "not_ready",
    ts: data.ts || new Date().toISOString(),
  };
}

/** Lightweight connectivity probe — GET / on server root (no auth). */
export async function checkApiHealth() {
  const attempts = 3;
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    try {
      const timeoutMs = attempt === 0 ? 10_000 : HEALTH_PROBE_TIMEOUT_MS;
      const response = await fetchBalanced("/", { method: "GET" }, { timeoutMs });
      const data = await readJson(response);
      if (response.ok && data?.ok) return true;
    } catch {
      // Retry — hosted APIs (e.g. Render) may be cold-starting.
    }
    if (attempt < attempts - 1) {
      await new Promise((resolve) => setTimeout(resolve, 2000 * (attempt + 1)));
    }
  }
  return false;
}
