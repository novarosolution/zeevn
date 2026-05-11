import { Platform } from "react-native";

/**
 * Brand: red primary, neutral slate secondary. Customer UI uses `useTheme()` for light/dark.
 */

/** @type {const} 8px-based spacing */
export const spacing = {
  xxs: 4,
  xxxs: 2,
  xs: 8,
  sm: 12,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 40,
};

/** Inter (loaded in App.js) — fallback to system when undefined */
export const fonts = {
  regular: "Inter_400Regular",
  medium: "Inter_500Medium",
  semibold: "Inter_600SemiBold",
  bold: "Inter_700Bold",
  extrabold: "Inter_800ExtraBold",
};

export const typography = {
  h1: 34,
  h2: 30,
  h3: 24,
  body: 16,
  bodySmall: 14,
  caption: 13,
  overline: 11,
};

/** Optional line heights — pair with `typography.*` for consistent vertical rhythm. */
export const lineHeight = {
  h1: 42,
  h2: 38,
  h3: 31,
  body: 24,
  bodySmall: 21,
  caption: 18,
  overline: 15,
};

export const radius = {
  xs: 8,
  sm: 12,
  md: 16,
  lg: 20,
  xl: 24,
  xxl: 26,
  pill: 999,
};

export const semanticRadius = {
  control: radius.md,
  card: radius.xxl,
  panel: radius.xxl,
  full: radius.pill,
};

/**
 * Ionicons / MaterialCommunityIcons sizes — use instead of magic numbers
 * so tap targets and visual rhythm stay consistent across customer + admin UI.
 */
export const icon = {
  micro: 12,
  tiny: 13,
  xs: 15,
  sm: 18,
  md: 20,
  lg: 22,
  xl: 24,
  xxl: 28,
  /** Native bottom tab bar — slightly larger for legibility */
  tabBar: 22,
  /** Web sticky header nav icons */
  webNav: 22,
  /** Home top bar (menu, cart) */
  nav: 26,
  /** Empty states, large placeholders */
  display: 36,
  displayLg: 40,
  displayXl: 44,
  /** Empty states, cart hero */
  promo: 30,
};

/** Light — red accent on warm neutral surfaces */
export const lightColors = {
  background: "#F6F8FC",
  backgroundGradientEnd: "#EDF1F7",
  surface: "#FFFFFF",
  surfaceMuted: "#F7F9FC",
  surfaceGlass: "rgba(255,255,255,0.92)",
  border: "#E2E8F0",
  borderStrong: "#CBD5E1",
  textPrimary: "#0F172A",
  textSecondary: "#475569",
  textMuted: "#64748B",
  primary: "#DC2626",
  primaryBright: "#EF4444",
  primaryDark: "#B91C1C",
  primarySoft: "#FEF2F2",
  primaryBorder: "#FECACA",
  secondary: "#475569",
  secondaryBright: "#64748B",
  secondaryDark: "#334155",
  secondarySoft: "#EEF2F7",
  secondaryBorder: "#CBD5E1",
  accentGold: "#C2410C",
  accentGoldSoft: "rgba(194, 65, 12, 0.12)",
  navy: "#0F172A",
  onPrimary: "#FFFFFF",
  onPrimaryMuted: "#FEE2E2",
  heroBackground: "#0F172A",
  heroForeground: "#FAFAFA",
  heroAccent: "#F87171",
  success: "#15803D",
  warning: "#B45309",
  info: "#2563EB",
  danger: "#B91C1C",
  accentGreen: "#166534",
  brandYellow: "#DC2626",
  brandYellowSoft: "#FEF2F2",
  shadow: "#09090B",
  searchBarFill: "#FFFFFF",
  searchBarBorder: "#D6DEE8",
  onSecondary: "#FFFFFF",
  surfaceElevated: "#FFFFFF",
  surfaceOverlay: "rgba(255,255,255,0.82)",
  focusRing: "rgba(220, 38, 38, 0.35)",
  heroGlow: "rgba(220, 38, 38, 0.12)",
  heroGlowSecondary: "rgba(37, 99, 235, 0.08)",
  dividerSoft: "rgba(15, 23, 42, 0.08)",
};

/** Dark — red accent on elevated zinc surfaces */
export const darkColors = {
  background: "#0B1120",
  backgroundGradientEnd: "#111827",
  surface: "#111A2A",
  surfaceMuted: "#172235",
  surfaceGlass: "rgba(12,18,31,0.96)",
  border: "#2A364B",
  borderStrong: "#41506A",
  textPrimary: "#F8FAFC",
  textSecondary: "#CBD5E1",
  textMuted: "#94A3B8",
  primary: "#EF4444",
  primaryBright: "#F87171",
  primaryDark: "#DC2626",
  primarySoft: "rgba(239,68,68,0.14)",
  primaryBorder: "rgba(248,113,113,0.35)",
  secondary: "#94A3B8",
  secondaryBright: "#CBD5E1",
  secondaryDark: "#64748B",
  secondarySoft: "rgba(148,163,184,0.14)",
  secondaryBorder: "rgba(148,163,184,0.28)",
  accentGold: "#FDBA74",
  accentGoldSoft: "rgba(251, 146, 60, 0.16)",
  navy: "#FAFAFA",
  onPrimary: "#FFFFFF",
  onPrimaryMuted: "#FEE2E2",
  heroBackground: "#050B16",
  heroForeground: "#FAFAFA",
  heroAccent: "#F87171",
  success: "#4ADE80",
  warning: "#FBBF24",
  info: "#60A5FA",
  danger: "#F87171",
  accentGreen: "#86EFAC",
  brandYellow: "#F87171",
  brandYellowSoft: "rgba(239,68,68,0.14)",
  shadow: "#000000",
  searchBarFill: "#172235",
  searchBarBorder: "#314158",
  onSecondary: "#0F172A",
  surfaceElevated: "#152034",
  surfaceOverlay: "rgba(11,17,32,0.9)",
  focusRing: "rgba(248, 113, 113, 0.42)",
  heroGlow: "rgba(239, 68, 68, 0.13)",
  heroGlowSecondary: "rgba(96, 165, 250, 0.08)",
  dividerSoft: "rgba(248,250,252,0.1)",
};

export const colors = lightColors;

export const layout = {
  maxContentWidth: Platform.select({ web: 1240, default: 980 }),
};

export const breakpoints = {
  sm: 480,
  md: 768,
  lg: 1024,
  xl: 1280,
};

export const container = {
  compact: 720,
  content: layout.maxContentWidth,
  expanded: 1320,
  gutter: {
    mobile: spacing.md,
    tablet: spacing.lg,
    desktop: spacing.xl + 10,
  },
};

export const elevation = {
  flat: 0,
  raised: 1,
  floating: 2,
  overlay: 3,
};

function webShadowLift(isDark) {
  return {
    boxShadow: isDark
      ? "0 22px 52px rgba(0,0,0,0.44), 0 8px 24px rgba(0,0,0,0.24), inset 0 1px 0 rgba(255,255,255,0.06)"
      : "0 18px 42px rgba(15, 23, 42, 0.09), 0 6px 18px rgba(15, 23, 42, 0.05), inset 0 1px 0 rgba(255, 255, 255, 0.96)",
  };
}

function webShadowPremium(isDark) {
  return {
    boxShadow: isDark
      ? "0 34px 80px rgba(0,0,0,0.54), 0 16px 40px rgba(0,0,0,0.34), inset 0 1px 0 rgba(255,255,255,0.07)"
      : "0 28px 68px rgba(15, 23, 42, 0.11), 0 12px 28px rgba(15, 23, 42, 0.06), inset 0 1px 0 rgba(255, 255, 255, 0.92)",
  };
}

export function getShadow(isDark) {
  return Platform.select({
    ios: {
      shadowColor: isDark ? "#000000" : "#09090B",
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: isDark ? 0.24 : 0.06,
      shadowRadius: 16,
    },
    android: { elevation: isDark ? 3 : 2 },
    web: {
      boxShadow: isDark
        ? "0 8px 22px rgba(0,0,0,0.24), 0 2px 8px rgba(0,0,0,0.12)"
        : "0 8px 22px rgba(15, 23, 42, 0.06), 0 2px 8px rgba(15, 23, 42, 0.03), inset 0 1px 0 rgba(255,255,255,0.75)",
    },
  });
}

export function getShadowLift(isDark) {
  return Platform.select({
    ios: {
      shadowColor: isDark ? "#000000" : "#09090B",
      shadowOffset: { width: 0, height: 14 },
      shadowOpacity: isDark ? 0.32 : 0.08,
      shadowRadius: 28,
    },
    android: { elevation: isDark ? 6 : 4 },
    web: webShadowLift(isDark),
  });
}

export function getShadowPremium(isDark) {
  return Platform.select({
    ios: {
      shadowColor: isDark ? "#000000" : "#18181B",
      shadowOffset: { width: 0, height: 22 },
      shadowOpacity: isDark ? 0.38 : 0.1,
      shadowRadius: 40,
    },
    android: { elevation: isDark ? 8 : 5 },
    web: webShadowPremium(isDark),
  });
}

export const semanticText = {
  display: {
    fontSize: typography.h1,
    lineHeight: lineHeight.h1,
    letterSpacing: -0.7,
  },
  title: {
    fontSize: typography.h2,
    lineHeight: lineHeight.h2,
    letterSpacing: -0.45,
  },
  section: {
    fontSize: typography.h3,
    lineHeight: lineHeight.h3,
    letterSpacing: -0.3,
  },
  body: {
    fontSize: typography.body,
    lineHeight: lineHeight.body,
    letterSpacing: 0,
  },
  bodyCompact: {
    fontSize: typography.bodySmall,
    lineHeight: lineHeight.bodySmall,
    letterSpacing: 0.1,
  },
  caption: {
    fontSize: typography.caption,
    lineHeight: lineHeight.caption,
    letterSpacing: 0.15,
  },
  overline: {
    fontSize: typography.overline,
    lineHeight: lineHeight.overline,
    letterSpacing: 0.4,
    textTransform: "uppercase",
  },
};

export function getSemanticColors(c) {
  return {
    bg: {
      page: c.background,
      pageGradientEnd: c.backgroundGradientEnd,
      surface: c.surface,
      muted: c.surfaceMuted,
      glass: c.surfaceGlass,
      elevated: c.surfaceElevated ?? c.surface,
      overlay: c.surfaceOverlay ?? c.surfaceGlass,
    },
    text: {
      primary: c.textPrimary,
      secondary: c.textSecondary,
      muted: c.textMuted,
      onPrimary: c.onPrimary,
      onSecondary: c.onSecondary,
    },
    border: {
      subtle: c.border,
      divider: c.dividerSoft ?? c.border,
      strong: c.borderStrong,
      accent: c.primaryBorder,
      focus: c.focusRing ?? c.primaryBorder,
    },
    accent: {
      primary: c.primary,
      primaryStrong: c.primaryDark,
      secondary: c.secondary,
      success: c.success,
      warning: c.warning ?? c.accentGold,
      info: c.info ?? c.secondaryBright,
      danger: c.danger,
      heroGlow: c.heroGlow ?? c.primarySoft,
      heroGlowSecondary: c.heroGlowSecondary ?? c.secondarySoft,
    },
  };
}

export const shadow = getShadow(false);
export const shadowLift = getShadowLift(false);
export const shadowPremium = getShadowPremium(false);
