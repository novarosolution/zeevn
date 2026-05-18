import { Platform } from "react-native";
import { FONT_DISPLAY } from "./customerAlchemy";

/**
 * Single source of truth for design tokens.
 * Brand: navy `bgDeep` + brass `accent`; sale/success/warning are restricted semantic roles only.
 * Legacy keys (`spacing`, `radius`, `typography`) remain as aliases during migration.
 */

const SERIF_FAMILY = FONT_DISPLAY;

/** Light semantic palette — use `getSemanticPalette(isDark)` or `useTheme().c` at runtime. */
export const COLORS = {
  bg: "#FAFAF7",
  surface: "#FFFFFF",
  surfaceAlt: "#F4F2EC",
  bgDeep: "#0E1729",
  bgDeepAlt: "#14203A",
  ink: "#0E0E0E",
  inkSoft: "#4A4A4A",
  inkMuted: "#8A8A8A",
  inkInverse: "#FFFFFF",
  inkInverseSoft: "rgba(255,255,255,0.72)",
  inkInverseMuted: "rgba(255,255,255,0.46)",
  line: "#E8E6E1",
  lineSoft: "rgba(14,23,41,0.06)",
  lineInverse: "rgba(255,255,255,0.08)",
  accent: "#C8A97E",
  accentSoft: "rgba(200,169,126,0.16)",
  accentDeep: "#1F3A2E",
  sale: "#B23A3A",
  success: "#2E7D5B",
  warning: "#B17B27",
  info: "#3A6BB2",
};

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

/** 4px grid: 4 / 8 / 12 / 16 / 20 / 24 / 32 / 40 / 56 / 72 / 96 */
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

/** @deprecated Use SPACING — legacy 8px names */
export const spacing = {
  xxs: SPACING.xs,
  xxxs: 2,
  xs: SPACING.sm,
  sm: SPACING.md,
  md: SPACING.base,
  lg: SPACING.xl,
  xl: SPACING["2xl"],
  xxl: SPACING["3xl"],
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

/** @deprecated Use RADII */
export const radius = {
  xs: RADII.sm,
  sm: RADII.md,
  md: RADII.lg,
  lg: RADII.xl,
  xl: RADII.xl,
  xxl: RADII.xl,
  pill: RADII.pill,
};

export const semanticRadius = {
  control: RADII.md,
  card: RADII.xl,
  panel: RADII.xl,
  full: RADII.pill,
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

/** Light — brass accent on warm neutral surfaces; sale red only via `danger` / `discount` */
export const lightColors = {
  background: "#FAFAF7",
  backgroundGradientEnd: "#EDF1F7",
  surface: "#FFFFFF",
  surfaceMuted: "#F4F2EC",
  surfaceGlass: "rgba(255,255,255,0.92)",
  border: "#E8E6E1",
  borderStrong: "#CBD5E1",
  textPrimary: "#0E0E0E",
  textSecondary: "#4A4A4A",
  textMuted: "#8A8A8A",
  primary: "#C8A97E",
  primaryBright: "#D4B896",
  primaryDark: "#A8895E",
  primarySoft: "rgba(200, 169, 126, 0.16)",
  primaryBorder: "rgba(200, 169, 126, 0.38)",
  secondary: "#475569",
  secondaryBright: "#64748B",
  secondaryDark: "#334155",
  secondarySoft: "#EEF2F7",
  secondaryBorder: "#CBD5E1",
  accentGold: "#C8A97E",
  accentGoldSoft: "rgba(200, 169, 126, 0.16)",
  navy: "#0E1729",
  onPrimary: "#FFFFFF",
  onPrimaryMuted: "rgba(255,255,255,0.88)",
  heroBackground: "#0E1729",
  heroForeground: "#FAFAFA",
  heroAccent: "#C8A97E",
  success: "#2E7D5B",
  warning: "#B17B27",
  info: "#3A6BB2",
  danger: "#B23A3A",
  accentGreen: "#2E7D5B",
  brandYellow: "#C8A97E",
  brandYellowSoft: "rgba(200, 169, 126, 0.16)",
  shadow: "#0E0E0E",
  searchBarFill: "#FFFFFF",
  searchBarBorder: "#E8E6E1",
  onSecondary: "#FFFFFF",
  surfaceElevated: "#FFFFFF",
  surfaceOverlay: "rgba(255,255,255,0.82)",
  focusRing: "rgba(14, 23, 41, 0.38)",
  heroGlow: "rgba(200, 169, 126, 0.14)",
  heroGlowSecondary: "rgba(58, 107, 178, 0.08)",
  dividerSoft: "rgba(14, 14, 14, 0.08)",
  frostTint: "rgba(255,255,255,0.76)",
  premiumScrim: "rgba(14,23,41,0.04)",
  price: "#0E0E0E",
  priceMuted: "#4A4A4A",
  discount: "#B23A3A",
  trust: "#2E7D5B",
  rating: "#B17B27",
  ctaStart: "#0E0E0E",
  ctaEnd: "#0E1729",
};

/** Dark — brass accent on elevated navy surfaces */
export const darkColors = {
  background: "#0B1120",
  backgroundGradientEnd: "#111827",
  surface: "#0E1729",
  surfaceMuted: "#172235",
  surfaceGlass: "rgba(12,18,31,0.96)",
  border: "#2A364B",
  borderStrong: "#41506A",
  textPrimary: "#F8FAFC",
  textSecondary: "#CBD5E1",
  textMuted: "#94A3B8",
  primary: "#D4B896",
  primaryBright: "#E2C9A8",
  primaryDark: "#C8A97E",
  primarySoft: "rgba(200, 169, 126, 0.18)",
  primaryBorder: "rgba(200, 169, 126, 0.32)",
  secondary: "#94A3B8",
  secondaryBright: "#CBD5E1",
  secondaryDark: "#64748B",
  secondarySoft: "rgba(148,163,184,0.14)",
  secondaryBorder: "rgba(148,163,184,0.28)",
  accentGold: "#D4B896",
  accentGoldSoft: "rgba(200, 169, 126, 0.18)",
  navy: "#FAFAFA",
  onPrimary: "#0E0E0E",
  onPrimaryMuted: "rgba(14,14,14,0.72)",
  heroBackground: "#050B16",
  heroForeground: "#FAFAFA",
  heroAccent: "#D4B896",
  success: "#4ADE80",
  warning: "#FBBF24",
  info: "#60A5FA",
  danger: "#F87171",
  accentGreen: "#86EFAC",
  brandYellow: "#D4B896",
  brandYellowSoft: "rgba(200, 169, 126, 0.18)",
  shadow: "#0E0E0E",
  searchBarFill: "#172235",
  searchBarBorder: "#314158",
  onSecondary: "#0F172A",
  surfaceElevated: "#152034",
  surfaceOverlay: "rgba(11,17,32,0.9)",
  focusRing: "rgba(200, 169, 126, 0.42)",
  heroGlow: "rgba(200, 169, 126, 0.14)",
  heroGlowSecondary: "rgba(96, 165, 250, 0.08)",
  dividerSoft: "rgba(248,250,252,0.1)",
  frostTint: "rgba(11,17,32,0.74)",
  premiumScrim: "rgba(14,14,14,0.24)",
  price: "#F8FAFC",
  priceMuted: "#CBD5E1",
  discount: "#F87171",
  trust: "#4ADE80",
  rating: "#D4B896",
  ctaStart: "#F8FAFC",
  ctaEnd: "#E2E8F0",
};

export const colors = lightColors;

/**
 * Loading foundation tokens (premium navy + brass system).
 * Keep these isolated so loaders can migrate without disturbing existing theme keys.
 */
export const loadingColors = {
  bgDeep: "#0E1729",
  bgWell: "#14203A",
  inkInverse: "#FFFFFF",
  inkInverseSoft: "rgba(255,255,255,0.72)",
  inkInverseMuted: "rgba(255,255,255,0.46)",
  line: "rgba(255,255,255,0.08)",
  accent: "#C8A97E",
  accentSoft: "rgba(200,169,126,0.16)",
  success: "#6EE7A6",
};

/** Loader-only radii. */
export const loadingRadius = {
  sm: 12,
  md: 18,
  pill: 999,
};

/** Loader motion timings (ms). */
export const loadingMotion = {
  enter: 220,
  breathCycle: 1400,
  phaseAdvance: 1800,
};

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
      shadowColor: isDark ? "#0E0E0E" : "#0E0E0E",
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
      shadowColor: isDark ? "#0E0E0E" : "#0E0E0E",
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
      shadowColor: isDark ? "#0E0E0E" : "#18181B",
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

/** Shared commerce-specific semantic roles for product/order UI. */
export function getCommerceSemantic(c) {
  return {
    pricing: {
      price: c.price ?? c.textPrimary,
      muted: c.priceMuted ?? c.textSecondary,
      discount: c.discount ?? c.danger,
    },
    trust: {
      positive: c.trust ?? c.success,
      rating: c.rating ?? c.accentGold,
      info: c.info,
    },
    cta: {
      start: c.ctaStart ?? c.primaryBright,
      end: c.ctaEnd ?? c.primaryDark,
      text: c.onPrimary,
    },
    premium: {
      frost: c.frostTint ?? c.surfaceGlass,
      scrim: c.premiumScrim ?? c.surfaceOverlay,
    },
  };
}

export function getSemanticColors(c) {
  const commerce = getCommerceSemantic(c);
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
    commerce,
  };
}

export const shadow = getShadow(false);
export const shadowLift = getShadowLift(false);
export const shadowPremium = getShadowPremium(false);

/**
 * Web glass scrims — header, modal/drawer backdrops, cart drawer.
 * Change blur/saturation here once; consumers use helpers in `webStacking.js`.
 */
export const WEB_BACKDROP = {
  blurPx: 14,
  /** CSS `saturate()` multiplier (160% → 1.6). */
  saturate: "160%",
  filter: "saturate(160%) blur(14px)",
  scrimLight: "rgba(14, 23, 41, 0.45)",
  scrimDark: "rgba(6, 10, 18, 0.52)",
  /** Brass selection + ink text (premium chrome). */
  selectionBackground: "rgba(200, 169, 126, 0.35)",
  selectionColor: COLORS.ink,
  focusRing: "rgba(200, 169, 126, 0.55)",
  scrollbarThumb: COLORS.accent,
  scrollbarTrack: "rgba(14, 23, 41, 0.06)",
};
