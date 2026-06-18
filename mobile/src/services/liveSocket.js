import { Platform } from "react-native";
import { getSocketBaseUrl } from "./apiBase";

/** @type {import('socket.io-client').Socket | null} */
let socket = null;
let activeToken = null;

const eventHandlers = new Map();

function ensureHandlerSet(event) {
  if (!eventHandlers.has(event)) {
    eventHandlers.set(event, new Set());
  }
  return eventHandlers.get(event);
}

function dispatchEvent(event, payload) {
  const handlers = eventHandlers.get(event);
  if (!handlers) return;
  handlers.forEach((handler) => {
    try {
      handler(payload);
    } catch {
      // Listener errors must not break the socket bridge.
    }
  });
}

function attachSocketListeners(sock) {
  const events = [
    "orders:updated",
    "orders:live-location",
    "notifications:new",
    "support:thread",
  ];
  events.forEach((event) => {
    sock.on(event, (payload) => dispatchEvent(event, payload));
  });
}

async function resolveIo() {
  // eslint-disable-next-line global-require
  return require("socket.io-client").io;
}

export function getLiveSocket() {
  return socket;
}

export function isLiveSocketConnected() {
  return Boolean(socket?.connected);
}

export async function connectLiveSocket(token) {
  const trimmed = String(token || "").trim();
  if (!trimmed) {
    disconnectLiveSocket();
    return null;
  }

  const url = getSocketBaseUrl();
  if (!url) return null;

  if (socket && activeToken === trimmed) {
    if (!socket.connected) socket.connect();
    return socket;
  }

  disconnectLiveSocket();
  activeToken = trimmed;

  try {
    const io = await resolveIo();
    socket = io(url, {
      auth: { token: trimmed },
      transports: Platform.OS === "android" ? ["polling", "websocket"] : ["websocket", "polling"],
      reconnection: true,
      reconnectionAttempts: 12,
      reconnectionDelay: 1200,
      timeout: 12000,
      autoConnect: true,
    });
    attachSocketListeners(socket);
    socket.on("connect_error", () => {
      // Backend may be offline — REST still works; avoid throwing in UI.
    });
  } catch {
    socket = null;
    activeToken = null;
    return null;
  }

  return socket;
}

export function disconnectLiveSocket() {
  if (socket) {
    socket.removeAllListeners();
    socket.disconnect();
  }
  socket = null;
  activeToken = null;
}

/** Release WebSocket before bfcache — keep token so pageshow can reconnect. */
if (Platform.OS === "web" && typeof window !== "undefined") {
  window.addEventListener("pagehide", () => {
    if (socket?.connected) {
      socket.disconnect();
    }
  });
  window.addEventListener("pageshow", (event) => {
    if (!event.persisted || !activeToken) return;
    if (socket) {
      if (!socket.connected) socket.connect();
    } else {
      connectLiveSocket(activeToken).catch(() => {});
    }
  });
}

export function subscribeLiveOrder(orderId) {
  const id = String(orderId || "").trim();
  if (!id || !socket?.connected) return;
  socket.emit("subscribe:order", { orderId: id });
}

export function unsubscribeLiveOrder(orderId) {
  const id = String(orderId || "").trim();
  if (!id || !socket) return;
  socket.emit("unsubscribe:order", { orderId: id });
}

/**
 * Register a live event listener. Returns unsubscribe function.
 * @param {string} event
 * @param {(payload: unknown) => void} handler
 */
export function onLiveEvent(event, handler) {
  const set = ensureHandlerSet(event);
  set.add(handler);
  return () => {
    set.delete(handler);
  };
}
