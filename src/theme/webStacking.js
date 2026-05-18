import { Platform } from "react-native";

/**
 * RN Web maps `zIndex` to CSS `z-index`, but browsers ignore it unless `position` is not `static`.
 * Always pair z-index with `position: relative` (or fixed/absolute) on web.
 */
export function webZIndex(zIndex) {
  if (Platform.OS !== "web" || zIndex == null) return {};
  return {
    position: "relative",
    zIndex,
  };
}

/** Interactive layer above decorative backgrounds (auth forms, inputs, buttons). */
export function webElevatedLayer(zIndex = 10) {
  if (Platform.OS !== "web") return {};
  return {
    position: "relative",
    zIndex,
    pointerEvents: "auto",
  };
}

/** Non-interactive decorative layer (hero images, orbs, gradients). */
export function webDecorLayer(zIndex = 0) {
  if (Platform.OS !== "web") return {};
  return {
    position: "relative",
    zIndex,
    pointerEvents: "none",
  };
}

export function webFixedLayer(zIndex) {
  if (Platform.OS !== "web" || zIndex == null) return {};
  return {
    position: "fixed",
    zIndex,
  };
}
