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

/** Merge pointer-events into `style` on web; leave style unchanged on native. */
export function withPointerEventsStyle(style, value) {
  if (!value) return style;
  if (Platform.OS === "web") {
    const pe = { pointerEvents: value };
    if (Array.isArray(style)) return [...style, pe];
    return style ? [style, pe] : pe;
  }
  return style;
}

/** Append pointer-events to an existing style array/object. */
export function withPointerEvents(style, value) {
  return withPointerEventsStyle(style, value);
}

/** Native-only `pointerEvents` prop (pair with `withPointerEventsStyle` on Animated.View). */
export function pointerEventsNativeOnly(value) {
  if (Platform.OS === "web" || !value) return {};
  return { pointerEvents: value };
}
