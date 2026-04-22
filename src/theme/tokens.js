import { Platform } from "react-native";

/**
 * Brand: gold primary, green secondary. Customer UI uses `useTheme()` for light/dark.
 */

/** @type {const} 8px-based spacing */
export const spacing = {
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
  h1: 28,
  h2: 24,
  h3: 19,
  body: 16,
  bodySmall: 14,
  caption: 12,
  overline: 10,
};

export const radius = {
  sm: 10,
  md: 14,
  lg: 18,
  xl: 22,
  xxl: 28,
  pill: 999,
};

/** Light — gold primary, emerald secondary (warm editorial “premium” base) */
export const lightColors = {
  background: "#F5F1EA",
  backgroundGradientEnd: "#EBE5DC",
  surface: "#FFFCFA",
  surfaceMuted: "#F4F1EB",
  surfaceGlass: "rgba(255,252,248,0.88)",
  border: "#E2DDD4",
  borderStrong: "#C4BDB2",
  textPrimary: "#1C1917",
  textSecondary: "#57534E",
  textMuted: "#A8A29E",
  /** Primary — antique gold */
  primary: "#B8860B",
  primaryBright: "#D4AF37",
  primaryDark: "#8B6914",
  primarySoft: "#FFFBF0",
  primaryBorder: "#E8D5A3",
  /** Secondary — forest / emerald */
  secondary: "#15803D",
  secondaryBright: "#22C55E",
  secondaryDark: "#166534",
  secondarySoft: "#ECFDF5",
  secondaryBorder: "#86EFAC",
  accentGold: "#D4AF37",
  accentGoldSoft: "#FFFBEB",
  navy: "#1C1917",
  /** Dark text on gold buttons (readable contrast) */
  onPrimary: "#1C1917",
  onPrimaryMuted: "#F5F0E1",
  heroBackground: "#1C1917",
  heroForeground: "#FFFBF0",
  heroAccent: "#D4AF37",
  success: "#15803D",
  danger: "#DC2626",
  accentGreen: "#16A34A",
  brandYellow: "#D4AF37",
  brandYellowSoft: "#FFFBEB",
  shadow: "#1C1917",
  /** Blinkit/Zepto-style search bar fill */
  searchBarFill: "#EFEBE6",
  searchBarBorder: "#D8D3CA",
  /** Text on green (secondary) buttons */
  onSecondary: "#FFFFFF",
};

/** Dark — warm gold on dark, mint green accents */
export const darkColors = {
  background: "#080706",
  backgroundGradientEnd: "#181512",
  surface: "#1C1917",
  surfaceMuted: "#262320",
  surfaceGlass: "rgba(28,25,23,0.94)",
  border: "#3F3A36",
  borderStrong: "#57514C",
  textPrimary: "#FAFAF9",
  textSecondary: "#A8A29E",
  textMuted: "#78716C",
  primary: "#D4AF37",
  primaryBright: "#E8C547",
  primaryDark: "#B8860B",
  primarySoft: "rgba(212,175,55,0.12)",
  primaryBorder: "rgba(232,200,90,0.35)",
  secondary: "#34D399",
  secondaryBright: "#6EE7B7",
  secondaryDark: "#10B981",
  secondarySoft: "rgba(16,185,129,0.12)",
  secondaryBorder: "rgba(52,211,153,0.35)",
  accentGold: "#E8C547",
  accentGoldSoft: "rgba(212,175,55,0.12)",
  navy: "#FAFAF9",
  onPrimary: "#1C1917",
  onPrimaryMuted: "#F5F0E1",
  heroBackground: "#0C0A09",
  heroForeground: "#FFFBF0",
  heroAccent: "#D4AF37",
  success: "#34D399",
  danger: "#F87171",
  accentGreen: "#4ADE80",
  brandYellow: "#E8C547",
  brandYellowSoft: "rgba(212,175,55,0.12)",
  shadow: "#000000",
  searchBarFill: "#292524",
  searchBarBorder: "#44403C",
  onSecondary: "#FFFFFF",
};

export const colors = lightColors;

export const layout = {
  maxContentWidth: Platform.select({ web: 1180, default: 1000 }),
};

function webShadowLift(isDark) {
  return {
    boxShadow: isDark
      ? "0 14px 44px rgba(0,0,0,0.4), 0 4px 14px rgba(0,0,0,0.22), inset 0 1px 0 rgba(255,255,255,0.04)"
      : "0 18px 52px rgba(61, 42, 18, 0.09), 0 6px 18px rgba(28, 25, 23, 0.05), inset 0 1px 0 rgba(255, 253, 251, 0.92)",
  };
}

function webShadowPremium(isDark) {
  return {
    boxShadow: isDark
      ? "0 32px 80px rgba(0,0,0,0.58), 0 14px 32px rgba(0,0,0,0.38), inset 0 1px 0 rgba(255,255,255,0.05)"
      : "0 32px 80px rgba(61, 42, 18, 0.1), 0 12px 32px rgba(28, 25, 23, 0.055), 0 1px 4px rgba(116, 79, 28, 0.06), inset 0 1px 0 rgba(255, 255, 255, 0.78)",
  };
}

export function getShadow(isDark) {
  return Platform.select({
    ios: {
      shadowColor: isDark ? "#000000" : "#1C1917",
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: isDark ? 0.32 : 0.05,
      shadowRadius: 14,
    },
    android: { elevation: isDark ? 3 : 2 },
    web: {
      boxShadow: isDark
        ? "0 8px 28px rgba(0,0,0,0.3), 0 2px 8px rgba(0,0,0,0.15)"
        : "0 8px 28px rgba(61, 42, 18, 0.06), 0 2px 10px rgba(28, 25, 23, 0.04)",
    },
  });
}

export function getShadowLift(isDark) {
  return Platform.select({
    ios: {
      shadowColor: isDark ? "#000000" : "#1C1917",
      shadowOffset: { width: 0, height: 14 },
      shadowOpacity: isDark ? 0.4 : 0.07,
      shadowRadius: 30,
    },
    android: { elevation: isDark ? 6 : 4 },
    web: webShadowLift(isDark),
  });
}

export function getShadowPremium(isDark) {
  return Platform.select({
    ios: {
      shadowColor: isDark ? "#000000" : "#1C1917",
      shadowOffset: { width: 0, height: 22 },
      shadowOpacity: isDark ? 0.44 : 0.1,
      shadowRadius: 44,
    },
    android: { elevation: isDark ? 8 : 5 },
    web: webShadowPremium(isDark),
  });
}

export const shadow = getShadow(false);
export const shadowLift = getShadowLift(false);
export const shadowPremium = getShadowPremium(false);
