import { useSyncExternalStore } from "react";

type ScrollYListener = () => void;

let scrollYValue = 0;
const listeners = new Set<ScrollYListener>();

function emit() {
  listeners.forEach((listener) => listener());
}

export function setScrollY(value: number) {
  const next = Number.isFinite(Number(value)) ? Number(value) : 0;
  if (next === scrollYValue) return;
  scrollYValue = next;
  emit();
}

export function getScrollY() {
  return scrollYValue;
}

export default function useScrollY() {
  return useSyncExternalStore(
    (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    () => scrollYValue,
    () => 0
  );
}
