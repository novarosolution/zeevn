/**
 * One shared copy of the admin "desk summary" (order counters, store open/closed, support + stock alerts).
 * The sidebar, top bar and several screens read it; it loads once, polls while any of them is mounted, and
 * refreshes shortly after a live `orders:updated` event — so badges stay right without each screen fetching.
 */
import { useCallback, useEffect, useSyncExternalStore } from "react";
import { fetchAdminDeskSummary } from "./adminService";
import { useAuth } from "../context/AuthContext";
import { useLiveSocket } from "../context/LiveSocketContext";
import { playAdminNewOrderSound } from "../utils/adminNewOrderSound";

const POLL_MS = 45 * 1000;
const MIN_GAP_MS = 1500;
const EVENT_DEBOUNCE_MS = 700;
const NAG_MS = 25 * 1000;

/** Orders that are waiting for the shop to start on them (new COD orders and paid online ones). */
export function ordersToPack(summary) {
  const by = summary?.orders?.byStatus || {};
  return (by.pending || 0) + (by.confirmed || 0) + (by.paid || 0);
}

function waitingNew(summary) {
  return Number(summary?.orders?.new || 0);
}

let snapshot = { summary: null, loading: false, error: "", loadedAt: 0 };
/** Screens that want to hear about new orders; only the newest one is called, so stacked screens don't all toast. */
const newOrderHandlers = [];
const listeners = new Set();
const popListeners = new Set();
let pollTimer = null;
let nagTimer = null;
let eventTimer = null;
let inflight = null;
let popOpen = false;
let snoozeUntil = 0;
let lastWaiting = null;

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
      const before = snapshot.summary ? ordersToPack(snapshot.summary) : null;
      publish({ summary, loading: false, error: "", loadedAt: Date.now() });
      const after = ordersToPack(summary);
      const handler = newOrderHandlers[newOrderHandlers.length - 1];
      if (before !== null && after > before && handler) handler({ added: after - before, total: after });
      reviewOrderAlert();
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
    nagTimer = setInterval(() => reviewOrderAlert(), NAG_MS);
  }
  return () => {
    listeners.delete(listener);
    if (listeners.size === 0) {
      if (pollTimer) clearInterval(pollTimer);
      pollTimer = null;
      if (nagTimer) clearInterval(nagTimer);
      nagTimer = null;
      if (eventTimer) clearTimeout(eventTimer);
      eventTimer = null;
    }
  };
}

const getSnapshot = () => snapshot;

/**
 * Calls `handler({ added, total })` when the number of orders waiting to be packed goes up between two refreshes
 * (never on the first load). Returns the unsubscribe function.
 */
export function onNewOrders(handler) {
  newOrderHandlers.push(handler);
  return () => {
    const index = newOrderHandlers.lastIndexOf(handler);
    if (index >= 0) newOrderHandlers.splice(index, 1);
  };
}

function setPop(open) {
  if (popOpen === open) return;
  popOpen = open;
  popListeners.forEach((listener) => listener());
}

function reviewOrderAlert() {
  const waiting = waitingNew(snapshot.summary);
  if (waiting <= 0) {
    lastWaiting = 0;
    setPop(false);
    return;
  }
  const grew = lastWaiting !== null && waiting > lastWaiting;
  lastWaiting = waiting;
  if (!grew && Date.now() < snoozeUntil) return;
  setPop(true);
  playAdminNewOrderSound();
  snoozeUntil = Date.now() + NAG_MS;
}

export function dismissAdminOrderPop() {
  setPop(false);
  snoozeUntil = Date.now() + NAG_MS;
}

export function useAdminOrderPop() {
  const subscribePop = useCallback((listener) => {
    popListeners.add(listener);
    return () => popListeners.delete(listener);
  }, []);
  const open = useSyncExternalStore(subscribePop, () => popOpen, () => popOpen);
  return { open, waiting: waitingNew(snapshot.summary), dismiss: dismissAdminOrderPop };
}

/** Clears the cache (sign-out, or switching accounts). */
export function resetAdminDesk() {
  snapshot = { summary: null, loading: false, error: "", loadedAt: 0 };
  popOpen = false;
  snoozeUntil = 0;
  lastWaiting = null;
  listeners.forEach((listener) => listener());
  popListeners.forEach((listener) => listener());
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
