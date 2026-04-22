import { Platform } from "react-native";
import { adminPanel } from "./adminLayout";
import { layout, radius, spacing } from "./tokens";
import { WEB_HEADER_HEIGHT } from "./web";

/**
 * Customer-facing panels: shared admin base + slightly tighter radius and stronger gold top edge.
 */
export function customerPanel(c, shadowPremium) {
  return {
    ...adminPanel(c, shadowPremium),
    borderRadius: radius.xl,
  };
}

/**
 * Shared width constraint for customer screens (matches `ScrollView` content + headers).
 * Merge with `padding`, `paddingTop`, and `paddingBottom` as needed per screen.
 */
export const customerContentWidth = {
  width: "100%",
  alignSelf: "center",
  maxWidth: Platform.select({ web: layout.maxContentWidth, default: "100%" }),
};

/**
 * Common bottom padding: web tab bar vs native bottom nav.
 */
export function customerScrollPaddingBottom() {
  return Platform.OS === "web" ? spacing.xl : 88;
}

/**
 * Standard `ScrollView` content for customer pages (width cap + horizontal padding + bottom inset).
 * Merge with `{ paddingTop: … }` and optional `{ paddingBottom: … }` when a screen needs extra room.
 */
export const customerPageScrollBase = {
  /** Balanced gutters: slightly tighter on web for a denser editorial layout. */
  paddingHorizontal: Platform.select({ web: spacing.xl, default: spacing.lg }),
  width: "100%",
  alignSelf: "center",
  maxWidth: Platform.select({ web: layout.maxContentWidth, default: "100%" }),
  paddingBottom: customerScrollPaddingBottom(),
};

/**
 * Scroll content for Login / Register: centered column on web with vertical breathing room below header.
 */
export const authScrollContent = {
  alignItems: "center",
  ...Platform.select({
    web: {
      width: "100%",
      maxWidth: layout.maxContentWidth,
      alignSelf: "center",
      paddingHorizontal: spacing.xl,
      paddingTop: spacing.md,
      paddingBottom: spacing.xl,
      flexGrow: 1,
      minHeight: `calc(100vh - ${WEB_HEADER_HEIGHT}px)`,
      justifyContent: "center",
    },
    default: {
      padding: spacing.lg,
      paddingBottom: spacing.xl,
    },
  }),
};

/** Removes default browser focus ring on web inputs (custom borders remain). */
export const inputOutlineWeb = Platform.select({
  web: { outlineStyle: "none", outlineWidth: 0 },
  default: {},
});

/** ScrollView / KeyboardAvoidingView on top of `CustomerScreenShell` (no flat background). */
export const customerScrollFill = {
  flex: 1,
  width: "100%",
};
