import { Platform } from "react-native";

const injected = new Set();

/** Inject or refresh a `<style>` block on web (CSS animations, etc.). */
export function injectWebCssOnce(id, cssText) {
  if (Platform.OS !== "web" || typeof document === "undefined") return;
  const existing = document.getElementById(id);
  if (existing) {
    if (existing.textContent !== cssText) existing.textContent = cssText;
    injected.add(id);
    return;
  }
  if (injected.has(id)) return;
  const node = document.createElement("style");
  node.id = id;
  node.textContent = cssText;
  document.head.appendChild(node);
  injected.add(id);
}
