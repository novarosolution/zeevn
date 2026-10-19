import { useSyncExternalStore } from "react";

/**
 * "The app is ready to be looked at" — set once the navigation tree has mounted. The native launch overlay
 * (`components/BootSplash.native.js`) waits for it before lifting, so the customer never sees a half-built screen.
 *
 * `markAppReady` is called every time a navigation container reports ready, so it also tells the overlay when the
 * tree is *re*mounted (`DeferredHeavyProviders` swaps its wrapper after first paint, which mounts everything again
 * and freezes the UI thread for a moment) — the overlay holds its entrance until that has passed.
 */
let ready = false;
const listeners = new Set();
const mountListeners = new Set();

export function markAppReady() {
  mountListeners.forEach((listener) => listener());
  if (ready) return;
  ready = true;
  listeners.forEach((listener) => listener());
}

/** Calls `listener` on every `markAppReady` (first mount and any remount). Returns the unsubscribe function. */
export function onAppMounted(listener) {
  mountListeners.add(listener);
  return () => mountListeners.delete(listener);
}

const subscribe = (listener) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

export function useAppReady() {
  return useSyncExternalStore(subscribe, () => ready, () => ready);
}
