import { useSyncExternalStore } from "react";

/**
 * "The app is ready to be looked at" — set once the navigation tree has mounted. The native launch overlay
 * (`components/BootSplash.native.js`) waits for it before lifting, so the customer never sees a half-built screen.
 */
let ready = false;
const listeners = new Set();

export function markAppReady() {
  if (ready) return;
  ready = true;
  listeners.forEach((listener) => listener());
}

const subscribe = (listener) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

export function useAppReady() {
  return useSyncExternalStore(subscribe, () => ready, () => ready);
}
