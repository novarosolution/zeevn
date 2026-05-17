import { Platform } from "react-native";

/**
 * RN Web deprecates `pointerEvents` as a View prop — use in `style` on web, prop on native.
 */
export function pointerEventsProp(value) {
  if (!value) return {};
  if (Platform.OS === "web") {
    return { style: { pointerEvents: value } };
  }
  return { pointerEvents: value };
}

/** Append pointer-events to an existing style array/object. */
export function withPointerEvents(style, value) {
  if (!value) return style;
  if (Platform.OS === "web") {
    const pe = { pointerEvents: value };
    if (Array.isArray(style)) return [...style, pe];
    return style ? [style, pe] : pe;
  }
  return style;
}

/** Native-only prop (when style array is used on web). */
export function pointerEventsNativeProp(value) {
  if (Platform.OS === "web" || !value) return {};
  return { pointerEvents: value };
}
