/**
 * One shared copy of the admin "desk summary" (order counters, store open/closed, support + stock alerts).
 * The sidebar, top bar and several screens read it; it loads once, polls while any of them is mounted, and
 * refreshes shortly after a live `orders:updated` event — so badges stay right without each screen fetching.
 */
import { useCallback, useEffect, useSyncExternalStore } from "react";
import { fetchAdminDeskSummary } from "./adminService";
import { useAuth } from "../context/AuthContext";
import { useLiveSocket } from "../context/LiveSocketContext";

const POLL_MS = 45 * 1000;
const MIN_GAP_MS = 1500;
const EVENT_DEBOUNCE_MS = 700;

let snapshot = { summary: null, loading: false, error: "", loadedAt: 0 };
const listeners = new Set();
let pollTimer = null;
let eventTimer = null;
let inflight = null;

function publish(next) {
  snapshot = { ...snapshot, ...next };
  listeners.forEach((listener) => listener());
}

export async function refreshAdminDesk({ force = false } = {}) {
  if (inflight) return inflight;
  if (!force && snapshot.loadedAt && Date.now() - snapshot.loadedAt < MIN_GAP_MS) return snapshot.summary;
  publish({ loading: !snapshot.summary });
  inflight = fetchAdminDeskSummary()
    .then((summary) => {
      publish({ summary, loading: false, error: "", loadedAt: Date.now() });
      return summary;
    })
    .catch((err) => {
      publish({ loading: false, error: err?.message || "Couldn't load the desk summary." });
      return snapshot.summary;
    })
    .finally(() => {
      inflight = null;
    });
  return inflight;
}

function scheduleRefresh() {
  if (eventTimer) clearTimeout(eventTimer);
  eventTimer = setTimeout(() => {
    eventTimer = null;
    refreshAdminDesk({ force: true });
  }, EVENT_DEBOUNCE_MS);
}

function subscribe(listener) {
  listeners.add(listener);
  if (listeners.size === 1) {
    refreshAdminDesk();
    pollTimer = setInterval(() => refreshAdminDesk({ force: true }), POLL_MS);
  }
  return () => {
    listeners.delete(listener);
    if (listeners.size === 0) {
      if (pollTimer) clearInterval(pollTimer);
      pollTimer = null;
      if (eventTimer) clearTimeout(eventTimer);
      eventTimer = null;
    }
  };
}

const getSnapshot = () => snapshot;

/** Clears the cache (sign-out, or switching accounts). */
export function resetAdminDesk() {
  snapshot = { summary: null, loading: false, error: "", loadedAt: 0 };
  listeners.forEach((listener) => listener());
}

/**
 * `{ summary, loading, error, refresh }`. `summary` is null until the first load. Does nothing for non-admins.
 * @param {{ enabled?: boolean }} [options]
 */
export function useAdminDesk({ enabled = true } = {}) {
  const { user } = useAuth();
  const active = Boolean(enabled && user?.isAdmin);
  const { on } = useLiveSocket();
  const state = useSyncExternalStore(active ? subscribe : subscribeNothing, getSnapshot, getSnapshot);

  useEffect(() => {
    if (!active) return undefined;
    return on("orders:updated", scheduleRefresh);
  }, [active, on]);

  const refresh = useCallback(() => refreshAdminDesk({ force: true }), []);
  return { summary: active ? state.summary : null, loading: active && state.loading, error: state.error, refresh };
}

function subscribeNothing() {
  return () => {};
}
