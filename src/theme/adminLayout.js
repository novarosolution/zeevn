import { Platform, StyleSheet } from "react-native";
import { ALCHEMY, HERITAGE } from "./customerAlchemy";
import { darkColors, getSemanticColors, layout, semanticRadius, spacing } from "./tokens";

function themeIsDark(c) {
  return c?.textPrimary === darkColors.textPrimary;
}

/**
 * Shared panel chrome for admin screens — matches customer cards (slate + brand accent).
 * @param {boolean} [isDark] omit to infer from `c.textPrimary` vs theme dark palette
 */
export function adminPanel(c, shadowPremium, isDark) {
  const dark = typeof isDark === "boolean" ? isDark : themeIsDark(c);
  const semantic = getSemanticColors(c);
  const base = {
    backgroundColor: dark ? semantic.bg.surface : ALCHEMY.ivory,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: dark ? semantic.border.subtle : ALCHEMY.pillInactive,
    borderRadius: semanticRadius.panel,
    borderTopWidth: 2,
    borderTopColor: dark ? semantic.border.accent : HERITAGE.amberMid,
    padding: Platform.OS === "web" ? spacing.lg + 2 : spacing.lg,
    ...shadowPremium,
  };
  if (Platform.OS !== "web" || !shadowPremium?.boxShadow) {
    return base;
  }
  const inset = dark
    ? "inset 0 0 0 1px rgba(255,255,255,0.05), inset 0 1px 0 rgba(255,255,255,0.04)"
    : "inset 0 0 0 1px rgba(226,232,240,0.85), inset 0 1px 0 rgba(255,255,255,0.95)";
  return {
    ...base,
    boxShadow: `${shadowPremium.boxShadow}, ${inset}`,
    ...(Platform.OS === "web"
      ? {
          transition: "box-shadow 0.2s ease, border-color 0.2s ease, background-color 0.2s ease, transform 0.2s ease",
        }
      : {}),
  };
}

/**
 * Grouped “module” on the admin dashboard (and similar stacked tools).
 * Light: soft surface; dark: slightly lifted surface.
 */
export function adminModuleSection(isDark, c) {
  const semantic = getSemanticColors(c);
  return {
    marginBottom: spacing.lg,
    borderRadius: semanticRadius.card,
    padding: spacing.md + 2,
    paddingTop: spacing.sm,
    backgroundColor: isDark ? semantic.bg.muted : ALCHEMY.creamAlt,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: isDark ? semantic.border.subtle : ALCHEMY.pillInactive,
    borderLeftWidth: 2,
    borderLeftColor: c.primary,
    ...Platform.select({
      ios: {
        shadowColor: isDark ? "#000" : "#18181B",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: isDark ? 0.22 : 0.06,
        shadowRadius: 10,
      },
      android: { elevation: isDark ? 2 : 1 },
      web: {
        boxShadow: isDark
          ? "0 10px 22px rgba(0,0,0,0.22), 0 3px 8px rgba(0,0,0,0.14), inset 0 1px 0 rgba(255,255,255,0.05)"
          : "0 10px 20px rgba(15, 23, 42, 0.07), 0 3px 8px rgba(15, 23, 42, 0.04), inset 0 1px 0 rgba(255,255,255,0.9), inset 0 0 0 1px rgba(255,255,255,0.45)",
        transition: "box-shadow 0.18s ease, border-color 0.18s ease, transform 0.18s ease",
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
    maxWidth: Platform.select({ web: layout.maxContentWidth + 96, default: "100%" }),
    backgroundColor: c?.background ?? "transparent",
  };
}
