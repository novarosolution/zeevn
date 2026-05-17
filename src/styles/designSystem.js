/**
 * Single source of truth for customer-facing visual tokens (surfaces, type scale, motion).
 *
 * Runtime theme colors (`lightColors` / `darkColors`) remain in `theme/tokens.js` for gradual migration.
 * `getSemanticPalette(isDark)` maps this system to light/dark UI chrome; `useTheme()` exposes it as `semanticPalette`.
 *
 * @see ThemeContext — merges RADII, SPACING, SHADOWS, TYPE, MOTION, semanticPalette into `useTheme()`.
 */

import { Platform } from "react-native";
import { FONT_DISPLAY } from "../theme/customerAlchemy";

/** Loaded Playfair face from expo-google-fonts (matches hero/wordmark). Fraunces-style serif slot. */
const SERIF_FAMILY = FONT_DISPLAY;

export const COLORS = {
  // Surfaces
  bg: "#FAFAF7",
  surface: "#FFFFFF",
  surfaceAlt: "#F4F2EC",
  bgDeep: "#0E1729",
  bgDeepAlt: "#14203A",

  // Ink
  ink: "#0E0E0E",
  inkSoft: "#4A4A4A",
  inkMuted: "#8A8A8A",
  inkInverse: "#FFFFFF",
  inkInverseSoft: "rgba(255,255,255,0.72)",
  inkInverseMuted: "rgba(255,255,255,0.46)",

  // Lines / dividers
  line: "#E8E6E1",
  lineSoft: "rgba(14,23,41,0.06)",
  lineInverse: "rgba(255,255,255,0.08)",

  // Accents — restricted palette
  accent: "#C8A97E",
  accentSoft: "rgba(200,169,126,0.16)",
  accentDeep: "#1F3A2E",

  // Semantic
  sale: "#B23A3A",
  success: "#2E7D5B",
  warning: "#B17B27",
  info: "#3A6BB2",

  /*
   * Forbidden — these must NOT appear anywhere:
   * ❌ Bright reds (#DC2626, #EF4444, etc.) — replaced by ink + brass underline
   * ❌ Pastel pinks/peach — replaced by surface/surfaceAlt
   * ❌ Pure black #000 — use ink #0E0E0E
   */
};

/** Dark-mode semantic palette (same keys as COLORS where applicable). */
export const COLORS_DARK = {
  bg: COLORS.bgDeep,
  surface: COLORS.bgDeepAlt,
  surfaceAlt: "rgba(255,255,255,0.06)",
  bgDeep: COLORS.bgDeep,
  bgDeepAlt: COLORS.bgDeepAlt,

  ink: COLORS.inkInverse,
  inkSoft: COLORS.inkInverseSoft,
  inkMuted: COLORS.inkInverseMuted,
  inkInverse: COLORS.ink,
  inkInverseSoft: "rgba(14,14,14,0.72)",
  inkInverseMuted: "rgba(14,14,14,0.46)",

  line: COLORS.lineInverse,
  lineSoft: "rgba(255,255,255,0.06)",
  lineInverse: "rgba(14,23,41,0.12)",

  accent: COLORS.accent,
  accentSoft: COLORS.accentSoft,
  accentDeep: COLORS.accentDeep,

  sale: COLORS.sale,
  success: COLORS.success,
  warning: COLORS.warning,
  info: COLORS.info,
};

/**
 * Resolves design-system semantic colors for the active theme.
 * Spread into StyleSheet or map to RN theme keys during migration.
 *
 * @param {boolean} isDark
 * @returns {typeof COLORS & { mode: 'light' | 'dark' }}
 */
export function getSemanticPalette(isDark) {
  if (isDark) {
    return { ...COLORS_DARK, mode: "dark" };
  }
  return { ...COLORS, mode: "light" };
}

export const RADII = {
  xs: 6,
  sm: 10,
  md: 14,
  lg: 18,
  xl: 24,
  pill: 999,
};

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  base: 16,
  lg: 20,
  xl: 24,
  "2xl": 32,
  "3xl": 40,
  "4xl": 56,
  "5xl": 72,
  "6xl": 96,
};

export const SHADOWS = {
  none: {},
  soft: Platform.select({
    web: { boxShadow: "0 1px 2px rgba(14,23,41,0.04)" },
    default: {
      shadowColor: "#0E1729",
      shadowOpacity: 0.04,
      shadowRadius: 2,
      shadowOffset: { width: 0, height: 1 },
      elevation: 1,
    },
  }),
  lifted: Platform.select({
    web: { boxShadow: "0 8px 24px rgba(14,23,41,0.06)" },
    default: {
      shadowColor: "#0E1729",
      shadowOpacity: 0.06,
      shadowRadius: 16,
      shadowOffset: { width: 0, height: 8 },
      elevation: 4,
    },
  }),
  popover: Platform.select({
    web: { boxShadow: "0 12px 32px rgba(14,23,41,0.10)" },
    default: {
      shadowColor: "#0E1729",
      shadowOpacity: 0.1,
      shadowRadius: 24,
      shadowOffset: { width: 0, height: 12 },
      elevation: 8,
    },
  }),
};

export const TYPE = {
  serifFamily: SERIF_FAMILY,
  /** Logical UI stack name — loaded faces use `theme/tokens` `fonts.*` (Inter_400Regular, …). */
  uiFamily: "Inter",

  weights: {
    regular: "400",
    medium: "500",
    semibold: "600",
    bold: "700",
  },

  display: { fontSize: 48, lineHeight: 52, letterSpacing: -1.2 },
  h1: { fontSize: 32, lineHeight: 36, letterSpacing: -0.6 },
  h2: { fontSize: 24, lineHeight: 28, letterSpacing: -0.4 },
  h3: { fontSize: 20, lineHeight: 24, letterSpacing: -0.2 },
  h4: { fontSize: 17, lineHeight: 22 },

  bodyLg: { fontSize: 16, lineHeight: 24 },
  body: { fontSize: 14, lineHeight: 20 },
  small: { fontSize: 13, lineHeight: 18 },
  caption: { fontSize: 12, lineHeight: 16 },
  micro: { fontSize: 11, lineHeight: 14 },

  overline: { fontSize: 11, fontWeight: "600", letterSpacing: 1.8, textTransform: "uppercase" },
};

export const MOTION = {
  fast: { duration: 120, easing: "easeOut" },
  base: { duration: 220, easing: "easeOut" },
  slow: { duration: 320, easing: "easeOut" },
  page: { duration: 240, easing: "easeInOut" },
  spring: { damping: 14, stiffness: 220, mass: 0.9 },
};
