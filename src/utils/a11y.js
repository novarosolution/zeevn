import { Platform } from "react-native";

/**
 * Heading props for semantic hierarchy (h1–h6). Web uses aria-level; native uses accessibilityLevel.
 */
export function headingA11yProps(level = 2) {
  const lvl = Math.min(6, Math.max(1, Number(level) || 2));
  if (Platform.OS === "web") {
    return { accessibilityRole: "header", "aria-level": lvl };
  }
  return { accessibilityRole: "header", accessibilityLevel: lvl };
}

/** Visually hidden but available to assistive tech. */
export const srOnlyStyle = Platform.select({
  web: {
    position: "absolute",
    width: 1,
    height: 1,
    padding: 0,
    margin: -1,
    overflow: "hidden",
    clip: "rect(0, 0, 0, 0)",
    whiteSpace: "nowrap",
    borderWidth: 0,
  },
  default: {
    position: "absolute",
    width: 1,
    height: 1,
    opacity: 0,
    overflow: "hidden",
  },
});

export function regionA11yProps(label) {
  if (Platform.OS === "web") {
    return { role: "region", "aria-label": label };
  }
  return { accessibilityRole: "none", accessibilityLabel: label };
}

/** Hide duplicate visual text from the accessibility tree (e.g. PDP title under PageHeader h1). */
export function decorativeTextA11yProps() {
  if (Platform.OS === "web") {
    return { "aria-hidden": true };
  }
  return { accessible: false, importantForAccessibility: "no-hide-descendants" };
}
