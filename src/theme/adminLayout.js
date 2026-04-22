import { Platform, StyleSheet } from "react-native";
import { ALCHEMY } from "./customerAlchemy";
import { layout, radius, spacing } from "./tokens";

/**
 * Shared “premium” panel for admin screens (matches customer Settings/Cart panels).
 */
export function adminPanel(c, shadowPremium) {
  return {
    backgroundColor: c.surface,
    borderWidth: 1,
    borderColor: c.border,
    borderRadius: radius.xl,
    borderTopWidth: 3,
    borderTopColor: c.accentGold ?? c.primary,
    padding: spacing.lg,
    ...shadowPremium,
  };
}

/**
 * Grouped “module” on the admin dashboard (and similar stacked tools).
 * Light: warm card; dark: slightly lifted surface.
 */
export function adminModuleSection(isDark, c) {
  return {
    marginBottom: spacing.lg,
    borderRadius: radius.lg,
    padding: spacing.md,
    paddingTop: spacing.sm,
    backgroundColor: isDark ? c.surfaceMuted : ALCHEMY.creamAlt,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: isDark ? c.border : ALCHEMY.pillInactive,
    borderLeftWidth: 3,
    borderLeftColor: c.primary,
    ...Platform.select({
      ios: {
        shadowColor: isDark ? "#000" : "#3D2A12",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: isDark ? 0.22 : 0.06,
        shadowRadius: 10,
      },
      android: { elevation: isDark ? 2 : 1 },
      web: {
        boxShadow: isDark
          ? "0 10px 28px rgba(0,0,0,0.26), inset 0 1px 0 rgba(255,255,255,0.04)"
          : "0 10px 28px rgba(61, 42, 18, 0.08), 0 2px 8px rgba(28, 25, 23, 0.04), inset 0 1px 0 rgba(255,253,251,0.82)",
      },
      default: {},
    }),
  };
}

/** Root view for admin screens — centered column on web. */
export function adminScreenRoot(c) {
  return {
    flex: 1,
    width: "100%",
    alignSelf: "center",
    maxWidth: Platform.select({ web: layout.maxContentWidth, default: "100%" }),
    backgroundColor: c?.background ?? "transparent",
  };
}
