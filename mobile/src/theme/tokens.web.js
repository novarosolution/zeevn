import { Platform } from "react-native";

/**
 * Web tokens — same as `tokens.js` but CSS font family names (Google Fonts `display=swap`).
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

export const fonts = {
  regular: "Hanken Grotesk",
  medium: "Hanken Grotesk",
  semibold: "Hanken Grotesk",
  bold: "Hanken Grotesk",
  extrabold: "Hanken Grotesk",
};

export const typography = {
  h1: 32,
  h2: 28,
  h3: 23,
  body: 16,
  bodySmall: 14,
  caption: 13,
  overline: 11,
};

export const lineHeight = {
  h1: 40,
  h2: 36,
  h3: 30,
  body: 24,
  bodySmall: 21,
  caption: 18,
  overline: 15,
};

export const radius = {
  xs: 8,
  sm: 13,
  md: 16,
  lg: 20,
  xl: 24,
  xxl: 20,
  pill: 999,
};

export const semanticRadius = {
  control: radius.md,
  card: radius.xxl,
  panel: radius.xxl,
  full: radius.pill,
};

export const icon = {
  micro: 12,
  tiny: 13,
  xs: 15,
  sm: 18,
  md: 20,
  lg: 22,
  xl: 24,
  xxl: 28,
  tabBar: 22,
  webNav: 22,
  nav: 26,
  display: 36,
  displayLg: 40,
  displayXl: 44,
  promo: 30,
};

export const lightColors = {
  background: "#F8F0E0",
  backgroundGradientEnd: "#F0E8D8",
  surface: "#FCF8F0",
  surfaceMuted: "#F0E8D8",
  surfaceGlass: "rgba(252, 248, 240, 0.94)",
  border: "#E0D4C0",
  borderStrong: "#D0C4A8",
  textPrimary: "#1E2018",
  textSecondary: "#5C5838",
  textMuted: "#8A8468",
  primary: "#5C6834",
  primaryBright: "#788844",
  primaryDark: "#244424",
  primarySoft: "rgba(92, 104, 52, 0.12)",
  primaryBorder: "rgba(92, 104, 52, 0.32)",
  secondary: "#5C5838",
  secondaryBright: "#787060",
  secondaryDark: "#3E3828",
  secondarySoft: "rgba(92, 88, 56, 0.1)",
  secondaryBorder: "rgba(92, 88, 56, 0.28)",
  accentGold: "#DCAC74",
  accentGoldSoft: "rgba(220, 172, 116, 0.18)",
  navy: "#1E2018",
  onPrimary: "#FFFFFF",
  onPrimaryMuted: "#F0E8D8",
  heroBackground: "#244424",
  heroForeground: "#F8F0E0",
  heroAccent: "#DCAC74",
  success: "#5C6834",
  danger: "#B8442F",
  accentGreen: "#788844",
  brandYellow: "#DCAC74",
  brandYellowSoft: "rgba(220, 172, 116, 0.18)",
  shadow: "#1E2018",
  searchBarFill: "#FCF8F0",
  searchBarBorder: "#E0D4C0",
  onSecondary: "#FFFFFF",
  surfaceElevated: "#FCF8F0",
  surfaceOverlay: "rgba(252, 248, 240, 0.88)",
  focusRing: "rgba(92, 104, 52, 0.34)",
  heroGlow: "rgba(92, 104, 52, 0.11)",
  heroGlowSecondary: "rgba(220, 172, 116, 0.08)",
  dividerSoft: "rgba(138, 132, 104, 0.18)",
};

export const darkColors = {
  background: "#050403",
  backgroundGradientEnd: "#14110F",
  surface: "#181513",
  surfaceMuted: "#24201D",
  surfaceGlass: "rgba(28,25,23,0.97)",
  border: "#3F3933",
  borderStrong: "#595149",
  textPrimary: "#FAFAF9",
  textSecondary: "#CEC7BF",
  textMuted: "#B2A89E",
  primary: "#A8B86C",
  primaryBright: "#C4D088",
  primaryDark: "#788844",
  primarySoft: "rgba(168, 184, 108, 0.12)",
  primaryBorder: "rgba(168, 184, 108, 0.35)",
  secondary: "#A8A29E",
  secondaryBright: "#D6D3D1",
  secondaryDark: "#78716C",
  secondarySoft: "rgba(168, 162, 158, 0.12)",
  secondaryBorder: "rgba(168, 162, 158, 0.28)",
  accentGold: "#E8BC84",
  accentGoldSoft: "rgba(232, 188, 132, 0.14)",
  navy: "#FAFAF9",
  onPrimary: "#1E2018",
  onPrimaryMuted: "#F0E8D8",
  heroBackground: "#0C0A09",
  heroForeground: "#F8F0E0",
  heroAccent: "#E8BC84",
  success: "#A8B86C",
  danger: "#F87171",
  accentGreen: "#849448",
  brandYellow: "#E8BC84",
  brandYellowSoft: "rgba(232, 188, 132, 0.14)",
  shadow: "#000000",
  searchBarFill: "#292524",
  searchBarBorder: "#44403C",
  onSecondary: "#1E2018",
  surfaceElevated: "#1A1612",
  surfaceOverlay: "rgba(18,16,14,0.9)",
  focusRing: "rgba(168, 184, 108, 0.42)",
  heroGlow: "rgba(168, 184, 108, 0.16)",
  heroGlowSecondary: "rgba(232, 188, 132, 0.1)",
  dividerSoft: "rgba(255,255,255,0.08)",
};

export const colors = lightColors;

export const layout = {
  maxContentWidth: Platform.select({ web: 1180, default: 1000 }),
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
    desktop: spacing.xxl + 4,
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
      ? "0 22px 58px rgba(0,0,0,0.54), 0 8px 22px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.07)"
      : "0 18px 46px rgba(22, 69, 51, 0.1), 0 8px 20px rgba(28, 25, 23, 0.055), 0 0 0 1px rgba(31, 92, 71, 0.08), inset 0 1px 0 rgba(255, 253, 251, 0.98)",
  };
}

function webShadowPremium(isDark) {
  return {
    boxShadow: isDark
      ? "0 44px 110px rgba(0,0,0,0.68), 0 20px 46px rgba(0,0,0,0.48), inset 0 1px 0 rgba(255,255,255,0.08)"
      : "0 36px 88px rgba(22, 69, 51, 0.13), 0 16px 38px rgba(28, 25, 23, 0.07), 0 2px 9px rgba(31, 92, 71, 0.08), 0 0 0 1px rgba(31, 92, 71, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.92)",
  };
}

export function getShadow(isDark) {
  return Platform.select({
    ios: {
      shadowColor: isDark ? "#000000" : "#1C1917",
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: isDark ? 0.34 : 0.075,
      shadowRadius: 18,
    },
    android: { elevation: isDark ? 3 : 2 },
    web: {
      boxShadow: isDark
        ? "0 8px 28px rgba(0,0,0,0.3), 0 2px 8px rgba(0,0,0,0.15)"
        : "0 10px 30px rgba(22, 69, 51, 0.08), 0 3px 12px rgba(28, 25, 23, 0.05), inset 0 1px 0 rgba(255,255,255,0.75)",
    },
  });
}

export function getShadowLift(isDark) {
  return Platform.select({
    ios: {
      shadowColor: isDark ? "#000000" : "#1C1917",
      shadowOffset: { width: 0, height: 14 },
      shadowOpacity: isDark ? 0.42 : 0.085,
      shadowRadius: 32,
    },
    android: { elevation: isDark ? 6 : 4 },
    web: webShadowLift(isDark),
  });
}

export function getShadowPremium(isDark) {
  return Platform.select({
    ios: {
      shadowColor: isDark ? "#000000" : "#2A1F12",
      shadowOffset: { width: 0, height: 22 },
      shadowOpacity: isDark ? 0.48 : 0.13,
      shadowRadius: 52,
    },
    android: { elevation: isDark ? 8 : 5 },
    web: webShadowPremium(isDark),
  });
}

export const semanticText = {
  display: {
    fontSize: typography.h1,
    lineHeight: lineHeight.h1,
    letterSpacing: -0.5,
  },
  title: {
    fontSize: typography.h2,
    lineHeight: lineHeight.h2,
    letterSpacing: -0.3,
  },
  section: {
    fontSize: typography.h3,
    lineHeight: lineHeight.h3,
    letterSpacing: -0.2,
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
      danger: c.danger,
      heroGlow: c.heroGlow ?? c.primarySoft,
      heroGlowSecondary: c.heroGlowSecondary ?? c.secondarySoft,
    },
  };
}

export const shadow = getShadow(false);
export const shadowLift = getShadowLift(false);
export const shadowPremium = getShadowPremium(false);
