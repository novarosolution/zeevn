import { useMemo } from "react";
import { Platform, StyleSheet } from "react-native";
import { useTheme } from "../context/ThemeContext";
import { ALCHEMY } from "./customerAlchemy";
import { KANKREG_PALETTE } from "./kankregWeb";
import { useKankregLayout } from "./kankregBreakpoints";
import { shadowStyleForPlatform } from "./shadowPlatform";
import { darkColors, getSemanticColors, layout, semanticRadius, spacing } from "./tokens";

/** Shared admin light/dark chrome — use in AdminTopBar, tables, KPI cards, etc. */
export function getAdminChrome(c, isDark) {
  const semantic = getSemanticColors(c);
  return {
    ink: c.textPrimary,
    inkSoft: c.textSecondary,
    inkFaint: c.textMuted,
    card: isDark ? c.surface : ALCHEMY.cardBg,
    paper: isDark ? c.surfaceMuted : "#FFFFFF",
    canvas: isDark ? c.background : "#FFFFFF",
    line: isDark ? c.border : ALCHEMY.line,
    lineSoft: isDark ? semantic.border.subtle : "rgba(0, 0, 0, 0.06)",
    topBarBg: isDark ? "rgba(24, 21, 19, 0.72)" : "rgba(255, 252, 247, 0.72)",
    sidebarBg: isDark ? c.surfaceElevated : KANKREG_PALETTE.ink,
    mainBg: isDark ? c.background : "#FFFFFF",
    shellBg: isDark ? c.surface : "#FFFFFF",
    shellBorder: isDark ? c.border : KANKREG_PALETTE.line,
    linkMuted: isDark ? c.textMuted : "#bcb1a3",
    linkOnBg: isDark ? "rgba(52, 211, 153, 0.14)" : "rgba(42, 117, 89, 0.16)",
    linkOnBorder: isDark ? "rgba(52, 211, 153, 0.38)" : "rgba(42, 117, 89, 0.35)",
    chipOnBg: isDark ? "rgba(52, 211, 153, 0.14)" : "rgba(42, 117, 89, 0.14)",
    chipOnBorder: isDark ? "rgba(52, 211, 153, 0.38)" : "rgba(42, 117, 89, 0.35)",
    tabOnBg: isDark ? c.primarySoft : KANKREG_PALETTE.ink,
    tabOnBorder: isDark ? c.primaryBorder : KANKREG_PALETTE.ink,
    tabOnText: isDark ? c.primaryBright : KANKREG_PALETTE.paper,
    rowHover: isDark ? c.surfaceMuted : KANKREG_PALETTE.paper,
    gold: c.primary,
    goldBright: c.primaryBright,
    goldDeep: isDark ? c.primaryDark : KANKREG_PALETTE.goldDeep,
    danger: c.danger,
    green: c.success,
    meBorder: isDark ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.08)",
    meName: isDark ? c.textPrimary : KANKREG_PALETTE.paper,
    meEmail: isDark ? c.textMuted : "#bcb1a3",
    brand: isDark ? c.primaryBright : KANKREG_PALETTE.paper,
    groupLabel: isDark ? c.textMuted : "#6f6557",
    shellShadow: isDark
      ? "0 1px 2px rgba(0,0,0,.35), 0 24px 56px -28px rgba(0,0,0,.6)"
      : "0 1px 2px rgba(25,20,15,.05), 0 28px 64px -28px rgba(25,20,15,.28)",
  };
}

export function useAdminChrome() {
  const { colors: c, isDark } = useTheme();
  return useMemo(() => getAdminChrome(c, isDark), [c, isDark]);
}

/** Phone native + narrow web — stack dense admin rows instead of squeezing text. */
export function useAdminCompactLayout() {
  const { isXs, width } = useKankregLayout();
  return useMemo(
    () => Platform.OS !== "web" || isXs || width < 760,
    [isXs, width]
  );
}

/** KPI strip above admin lists (orders, etc.). */
export function adminStatsGridStyle(compact) {
  return {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    marginBottom: spacing.sm,
  };
}

export function adminMetricCardStyle(compact) {
  return {
    flexGrow: 1,
    flexBasis: compact ? "47%" : "18%",
    minWidth: compact ? 132 : 90,
    maxWidth: compact ? "48%" : undefined,
  };
}

/** Order / record card header — row on desktop, column on phone. */
export function adminRecordHeaderRowStyle(compact) {
  return compact
    ? {
        flexDirection: "column",
        alignItems: "stretch",
        gap: spacing.sm,
      }
    : {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "flex-start",
        gap: spacing.md,
      };
}

export function adminRecordMainColStyle(compact) {
  return {
    flex: compact ? undefined : 1,
    flexShrink: 1,
    minWidth: 0,
    width: compact ? "100%" : undefined,
  };
}

export function adminBadgeClusterStyle(compact) {
  return compact
    ? {
        flexDirection: "row",
        flexWrap: "wrap",
        alignItems: "center",
        justifyContent: "flex-start",
        gap: spacing.xs,
        width: "100%",
        maxWidth: "100%",
      }
    : {
        flexDirection: "row",
        flexWrap: "wrap",
        alignItems: "center",
        justifyContent: "flex-end",
        gap: spacing.xs,
        flexShrink: 0,
        maxWidth: "42%",
      };
}

export function adminCardActionsStyle(compact) {
  return compact
    ? {
        flexDirection: "column",
        alignItems: "stretch",
        gap: spacing.xs,
      }
    : {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: spacing.xs,
      };
}

function themeIsDark(c) {
  return c?.textPrimary === darkColors.textPrimary;
}

/**
 * Shared “premium” panel for admin screens — warm editorial card in light mode (aligned with customer panels).
 * @param {boolean} [isDark] omit to infer from `c.textPrimary` vs theme dark palette
 */
export function adminPanel(c, shadowPremium, isDark) {
  const dark = typeof isDark === "boolean" ? isDark : themeIsDark(c);
  const semantic = getSemanticColors(c);
  const base = {
    backgroundColor: dark ? semantic.bg.surface : "#fffcf7",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: dark ? semantic.border.subtle : "rgba(25,20,15,0.08)",
    borderRadius: Platform.select({ web: 20, default: semanticRadius.panel }),
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: dark ? semantic.border.subtle : "rgba(25,20,15,0.08)",
    padding: Platform.select({
      web: spacing.md + 10,
      default: spacing.md + 2,
    }),
    marginBottom: Platform.select({ web: spacing.md, default: 0 }),
    ...shadowStyleForPlatform(shadowPremium),
  };
  if (Platform.OS !== "web") {
    return base;
  }
  const softShadow = dark
    ? "0 1px 2px rgba(0,0,0,.28), 0 18px 40px -28px rgba(0,0,0,.55)"
    : "0 1px 2px rgba(25,20,15,.04), 0 16px 36px -24px rgba(25,20,15,.18)";
  const inset = dark
    ? "inset 0 0 0 1px rgba(255,255,255,0.06), inset 0 1px 0 rgba(255,255,255,0.04)"
    : "inset 0 0 0 1px rgba(255,253,249,0.85), inset 0 1px 0 rgba(255,255,255,0.95)";
  return {
    ...base,
    boxShadow: `${softShadow}, ${inset}`,
    transition: "box-shadow 0.2s ease, border-color 0.2s ease, background-color 0.2s ease",
  };
}

/**
 * Grouped “module” on the admin dashboard (and similar stacked tools).
 * Light: warm card; dark: slightly lifted surface.
 */
export function adminModuleSection(isDark, c) {
  const semantic = getSemanticColors(c);
  return {
    marginBottom: spacing.lg,
    borderRadius: semanticRadius.card,
    padding: spacing.md + 6,
    paddingTop: spacing.sm,
    backgroundColor: isDark ? semantic.bg.muted : ALCHEMY.creamAlt,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: isDark ? semantic.border.subtle : ALCHEMY.pillInactive,
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
          ? "0 14px 36px rgba(0,0,0,0.3), 0 4px 12px rgba(0,0,0,0.18), inset 0 1px 0 rgba(255,255,255,0.05)"
          : "0 14px 36px rgba(22, 69, 51, 0.09), 0 4px 12px rgba(28, 25, 23, 0.045), inset 0 1px 0 rgba(255,253,251,0.88), inset 0 0 0 1px rgba(255,253,249,0.5)",
        transition: "box-shadow 0.18s ease, border-color 0.18s ease, transform 0.18s ease",
      },
      default: {},
    }),
  };
}

/** Inner padding for `KankregAdminShell` main column. */
export function adminShellMainPadding() {
  return Platform.select({ web: spacing.lg + 4, default: spacing.md });
}

/**
 * Content area inside `KankregAdminShell` — flat cream canvas (no nested gold-top card).
 * Use `adminPanel()` only for standalone gate/denied blocks outside the shell.
 */
export function adminShellContent() {
  return {
    width: "100%",
    flex: 1,
    gap: Platform.select({ web: spacing.md + 6, default: spacing.md }),
    paddingBottom: Platform.select({ web: spacing.xl, default: spacing.xs }),
  };
}

/** Soft inset well for filters / composers inside panels. */
export function adminInsetWell(chrome) {
  return {
    borderRadius: Platform.select({ web: 14, default: 12 }),
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: chrome?.line || "rgba(25,20,15,0.08)",
    backgroundColor: chrome?.paper || "rgba(245,239,228,0.65)",
    padding: Platform.select({ web: spacing.md, default: spacing.sm }),
    gap: spacing.sm,
  };
}

/** Standalone gate / access-denied card on admin routes. */
export function adminGatePanel(c, shadowPremium) {
  return {
    ...adminPanel(c, shadowPremium),
    margin: spacing.md,
  };
}

/** Toolbar row — stacks vertically on native for readable search + actions. */
export const adminToolbarRow = Platform.select({
  web: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "flex-end",
    gap: spacing.sm,
  },
  default: {
    flexDirection: "column",
    alignItems: "stretch",
    gap: spacing.sm,
  },
});

export const adminToolbarPrimary = Platform.select({
  web: { flex: 1, minWidth: 0 },
  default: { width: "100%" },
});

/** Root view for admin screens — full-bleed desk on web. */
export function adminScreenRoot(c) {
  return {
    flex: 1,
    width: "100%",
    alignSelf: "stretch",
    maxWidth: "100%",
    backgroundColor: c?.background ?? "transparent",
  };
}

/** Two-column admin layout (dashboard charts, add-product, home editor). */
export function adminTwoColStyle(compact, ratio = 1.6) {
  if (compact) {
    return { flexDirection: "column", gap: spacing.md };
  }
  return {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.md,
    flexWrap: "wrap",
  };
}

export function adminTwoColMain(compact, ratio = 1.6) {
  if (compact) return { width: "100%" };
  return { flex: ratio, minWidth: 280 };
}

export function adminTwoColAside(compact) {
  if (compact) return { width: "100%" };
  return { flex: 1, minWidth: 240 };
}

/** Coupon / card grid for admin marketing screens. */
export function adminCardGridStyle(compact, cols = 3) {
  if (compact) {
    return { flexDirection: "column", gap: spacing.md };
  }
  return {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.md,
  };
}

export function adminCardGridItem(compact, cols = 3) {
  if (compact) return { width: "100%" };
  const basis = cols === 2 ? "48%" : cols === 3 ? "31%" : "23%";
  return { flexGrow: 1, flexBasis: basis, minWidth: 220, maxWidth: cols === 1 ? "100%" : 360 };
}
