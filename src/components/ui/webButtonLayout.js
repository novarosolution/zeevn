import { StyleSheet } from "react-native";

/** Size tokens shared by Button and web DOM button styling. */
export const WEB_BUTTON_SIZES = {
  sm: { padV: 6, padH: 14, gap: 6, minHeight: 34 },
  md: { padV: 10, padH: 18, gap: 8, minHeight: 42 },
  lg: { padV: 12, padH: 22, gap: 10, minHeight: 48 },
};

const OUTER_LAYOUT_KEYS = new Set([
  "flex",
  "flexGrow",
  "flexShrink",
  "flexBasis",
  "alignSelf",
  "margin",
  "marginTop",
  "marginBottom",
  "marginLeft",
  "marginRight",
  "marginHorizontal",
  "marginVertical",
  "width",
  "maxWidth",
  "minWidth",
]);

/** Keep flex growth on the wrapper; pill height stays on the actual `<button>`. */
export function splitWebButtonLayoutStyle(style) {
  const flat = StyleSheet.flatten(style) || {};
  const outer = {};
  const press = {};
  for (const [key, value] of Object.entries(flat)) {
    if (value == null) continue;
    if (OUTER_LAYOUT_KEYS.has(key)) outer[key] = value;
    else press[key] = value;
  }
  return { outer, press };
}
