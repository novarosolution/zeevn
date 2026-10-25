import { useMemo } from "react";
import { Platform, StyleSheet } from "react-native";
import { useTheme } from "../context/ThemeContext";
import { KANKREG_PALETTE, ZEEVAN_GOLD, ZEEVAN_GREEN } from "./kankregWeb";
import { useKankregLayout } from "./kankregBreakpoints";
import { shadowStyleForPlatform } from "./shadowPlatform";
import { darkColors, fonts, getSemanticColors, semanticRadius, spacing } from "./tokens";

/** Admin UI uses the platform sans so every letter renders. Do not point at the shop webfont on web. */
const WEB_SANS = 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
export const ADMIN_FONT = {
  regular: Platform.select({ web: WEB_SANS, default: fonts.regular }),
  medium: Platform.select({ web: WEB_SANS, default: fonts.medium }),
  semibold: Platform.select({ web: WEB_SANS, default: fonts.semibold }),
  bold: Platform.select({ web: WEB_SANS, default: fonts.bold }),
};

/** Same white canvas + forest/gold as the shop. */
const WHITE = "#FFFFFF";
const PAPER = "#F6F7F4";

/** Shared admin light/dark chrome — use in AdminTopBar, tables, KPI cards, etc. */
export function getAdminChrome(c, isDark) {
  const semantic = getSemanticColors(c);
  return {
    ink: isDark ? c.textPrimary : KANKREG_PALETTE.ink,
    inkSoft: isDark ? c.textSecondary : KANKREG_PALETTE.inkSoft,
    inkFaint: isDark ? c.textMuted : KANKREG_PALETTE.inkFaint,
    card: isDark ? c.surface : WHITE,
    paper: isDark ? c.surfaceMuted : PAPER,
    canvas: isDark ? c.background : PAPER,
    line: isDark ? c.border : KANKREG_PALETTE.line,
    lineSoft: isDark ? semantic.border.subtle : KANKREG_PALETTE.lineSoft,
    topBarBg: isDark ? "rgba(18, 22, 15, 0.84)" : "rgba(246,247,244,0.88)",
    sidebarBg: isDark ? c.surfaceElevated : WHITE,
    mainBg: isDark ? c.background : PAPER,
    shellBg: isDark ? c.surface : PAPER,
    shellBorder: isDark ? c.border : KANKREG_PALETTE.line,
    linkMuted: isDark ? c.textMuted : KANKREG_PALETTE.inkSoft,
    linkOnBg: isDark ? "rgba(220, 172, 116, 0.16)" : ZEEVAN_GREEN.soft,
    linkOnBorder: isDark ? "rgba(220, 172, 116, 0.32)" : ZEEVAN_GREEN.border,
    linkOnRail: isDark ? c.primaryBright : ZEEVAN_GOLD.base,
    linkOnText: isDark ? c.primaryBright : KANKREG_PALETTE.greenDeep,
    linkHover: isDark ? "rgba(255,255,255,0.05)" : "rgba(85, 107, 50, 0.05)",
    tileOnBg: isDark ? "rgba(220, 172, 116, 0.14)" : ZEEVAN_GOLD.soft,
    tileOnBorder: isDark ? "rgba(220, 172, 116, 0.28)" : ZEEVAN_GOLD.border,
    chipOnBg: isDark ? "rgba(220, 172, 116, 0.14)" : ZEEVAN_GREEN.soft,
    chipOnBorder: isDark ? "rgba(220, 172, 116, 0.28)" : ZEEVAN_GREEN.border,
    tabOnBg: isDark ? c.primarySoft : KANKREG_PALETTE.greenDeep,
    tabOnBorder: isDark ? c.primaryBorder : KANKREG_PALETTE.greenDeep,
    tabOnText: isDark ? c.primaryBright : WHITE,
    rowHover: isDark ? c.surfaceMuted : "rgba(31, 51, 31, 0.035)",
    gold: isDark ? c.primary : KANKREG_PALETTE.gold,
    goldBright: isDark ? c.primaryBright : KANKREG_PALETTE.goldBright,
    goldDeep: isDark ? c.primaryDark : KANKREG_PALETTE.goldDeep,
    danger: isDark ? c.danger : KANKREG_PALETTE.danger,
    green: isDark ? c.success : KANKREG_PALETTE.green,
    meBorder: isDark ? "rgba(255,255,255,0.08)" : KANKREG_PALETTE.line,
    meName: isDark ? c.textPrimary : KANKREG_PALETTE.ink,
    meEmail: isDark ? c.textMuted : KANKREG_PALETTE.inkFaint,
    brand: isDark ? c.primaryBright : KANKREG_PALETTE.ink,
    groupLabel: isDark ? c.textMuted : KANKREG_PALETTE.inkFaint,
    shellShadow: isDark
      ? "0 1px 2px rgba(0,0,0,.35), 0 24px 56px -28px rgba(0,0,0,.6)"
      : "0 1px 0 rgba(26,28,20,.06)",
  };
}

export function useAdminChrome() {
  const { colors: c, isDark } = useTheme();
  return useMemo(() => getAdminChrome(c, isDark), [c, isDark]);
}

/**
 * The app's global `*:focus-visible` ring would draw a box inside our own field wrappers (which show their own focus
 * state). Applied as an inline style (not through StyleSheet.create) so it beats the global stylesheet rule.
 */
export const WEB_NO_FOCUS_RING = Platform.OS === "web" ? { outlineStyle: "none", outlineWidth: 0 } : null;

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
    backgroundColor: dark ? semantic.bg.surface : "#FFFFFF",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: dark ? semantic.border.subtle : "rgba(20, 24, 16, 0.08)",
    borderRadius: Platform.select({ web: 16, default: semanticRadius.panel }),
    padding: Platform.select({
      web: spacing.md + 8,
      default: spacing.md + 2,
    }),
    marginBottom: Platform.select({ web: spacing.md, default: 0 }),
    ...shadowStyleForPlatform(shadowPremium),
  };
  if (Platform.OS !== "web") {
    return base;
  }
  const softShadow = dark
    ? "0 1px 2px rgba(0,0,0,.28), 0 16px 36px -28px rgba(0,0,0,.5)"
    : "0 1px 1px rgba(31,51,31,.04), 0 14px 32px -22px rgba(31,51,31,.14)";
  return {
    ...base,
    boxShadow: softShadow,
    transition: "box-shadow 160ms ease-out, border-color 160ms ease-out",
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
    borderRadius: 16,
    padding: spacing.md + 4,
    paddingTop: spacing.sm + 4,
    backgroundColor: isDark ? semantic.bg.muted : "#FFFFFF",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: isDark ? semantic.border.subtle : "rgba(31, 51, 31, 0.08)",
    ...Platform.select({
      ios: {
        shadowColor: isDark ? "#000" : "#1F331F",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: isDark ? 0.18 : 0.04,
        shadowRadius: 8,
      },
      android: { elevation: isDark ? 2 : 1 },
      web: {
        boxShadow: isDark
          ? "0 1px 2px rgba(0,0,0,.28), 0 14px 32px -24px rgba(0,0,0,.5)"
          : "0 1px 1px rgba(31,51,31,.04), 0 12px 28px -20px rgba(31,51,31,.12)",
        transition: "box-shadow 160ms ease-out, border-color 160ms ease-out",
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
 * Content area inside `KankregAdminShell` — flat white canvas.
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
