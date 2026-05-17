/**
 * Shared brand palette (red / black family) and display font names for customer UI.
 * Loaded in App.js: Playfair Display (see FONT_DISPLAY_*).
 */

export const FONT_DISPLAY = "PlayfairDisplay_700Bold";
export const FONT_DISPLAY_SEMI = "PlayfairDisplay_600SemiBold";
export const FONT_DISPLAY_ITALIC = "PlayfairDisplay_400Regular_Italic";

/** Legacy keys preserved for minimal churn; `gold*` maps to brass accent (not sale red). */
export const ALCHEMY = {
  cream: "#FAFAF7",
  creamDeep: "#F4F2EC",
  creamAlt: "#FFFFFF",
  creamAltDeep: "#E8E6E1",
  creamHighlight: "#FBFCFE",
  ivory: "#FFFFFF",
  pearl: "#F4F2EC",
  brown: "#0E0E0E",
  brownMuted: "#4A4A4A",
  brownInk: "#0E1729",
  gold: "#C8A97E",
  goldDeep: "#A8895E",
  goldBright: "#D4B896",
  goldSoft: "rgba(200, 169, 126, 0.16)",
  goldMist: "rgba(200, 169, 126, 0.14)",
  pillInactive: "#DCE4EF",
  cardBeige: "#F7F9FC",
  cardBg: "#FFFFFF",
  line: "rgba(15, 23, 42, 0.1)",
  lineStrong: "rgba(15, 23, 42, 0.16)",
  veil: "rgba(255, 255, 255, 0.82)",
};

/**
 * Warm heritage trim (amber / spice) — hairlines, star ratings, top accents on cards.
 * Primary actions and sale chips stay on ALCHEMY `gold*` (brand red).
 */
export const HERITAGE = {
  amber: "#B45309",
  amberMid: "#D97706",
  amberBright: "#F59E0B",
  amberDeep: "#78350F",
  /** Editorial heritage trim (subline, underline) — distinct from CTAs (`ALCHEMY.gold*`). */
  brass: "#C8A97E",
  brassSoft: "rgba(200, 169, 126, 0.18)",
  soft: "rgba(217, 119, 6, 0.12)",
  mist: "rgba(245, 158, 11, 0.14)",
  ring: "rgba(217, 119, 6, 0.28)",
};

/** Card / page header top strip: amber → brand red → ink. */
export function heritageBrandTrimGradient() {
  return [HERITAGE.amberBright, HERITAGE.amberMid, ALCHEMY.goldBright, ALCHEMY.gold, ALCHEMY.brown];
}

/** Shorter trim (e.g. compact cards). */
export function heritageBrandTrimGradientShort() {
  return [HERITAGE.amberBright, ALCHEMY.gold, ALCHEMY.brown];
}

/** Horizontal hairline fade (light / dark). */
export function heritageHairlineGradient(isDark) {
  if (isDark) {
    return ["rgba(251, 146, 60, 0)", "rgba(251, 146, 60, 0.45)", "rgba(251, 146, 60, 0)"];
  }
  return ["rgba(234, 88, 12, 0)", "rgba(194, 65, 12, 0.45)", "rgba(234, 88, 12, 0)"];
}

/**
 * Background gradient for CustomerScreenShell (and screens that opt out of the default theme gradient).
 */
export function getCustomerShellGradient(isDark, themeColors) {
  const c = themeColors;
  if (isDark) {
    return ["#050B16", "#0B1120", "#131C2F", c.backgroundGradientEnd || "#1D2940"];
  }
  return [
    "#FFFFFF",
    c.frostTint || ALCHEMY.creamHighlight,
    ALCHEMY.cream,
    c.backgroundGradientEnd || ALCHEMY.creamDeep,
  ];
}

/**
 * Maps legacy alchemy keys to semantic theme colors.
 */
export function getAlchemyPalette(themeColors, isDark) {
  const c = themeColors;
  return {
    card: isDark ? c.surfaceElevated || c.surface : ALCHEMY.cardBg,
    cardBorder: isDark ? c.border : ALCHEMY.pillInactive,
    line: isDark ? c.dividerSoft || c.border : ALCHEMY.line,
    lineStrong: isDark ? c.borderStrong : ALCHEMY.lineStrong,
    goldSoft: isDark ? c.primarySoft : ALCHEMY.goldSoft,
    goldRing: isDark ? c.primaryBorder : ALCHEMY.gold,
    glowPrimary: c.heroGlow || (isDark ? "rgba(200, 169, 126, 0.14)" : "rgba(200, 169, 126, 0.14)"),
    glowSecondary:
      c.heroGlowSecondary || (isDark ? "rgba(96, 165, 250, 0.08)" : "rgba(37, 99, 235, 0.08)"),
  };
}

/** Stops for `getCustomerShellGradient` */
export const CUSTOMER_SHELL_GRADIENT_LOCATIONS = [0, 0.32, 0.68, 1];
