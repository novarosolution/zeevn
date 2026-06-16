/**
 * Shared heritage palette + shell helpers (no platform font names).
 * Imported by `customerAlchemy.js` (native) and `customerAlchemy.web.js` (web).
 */
import { KANKREG_PALETTE, ZEEVAN_GOLD, ZEEVAN_GREEN } from "./kankregWeb";

export const ALCHEMY = {
  cream: KANKREG_PALETTE.paper,
  creamDeep: KANKREG_PALETTE.paper2,
  creamAlt: KANKREG_PALETTE.card,
  creamAltDeep: "#f4ecd8",
  creamHighlight: KANKREG_PALETTE.card,
  ivory: "#ffffff",
  pearl: KANKREG_PALETTE.paper2,
  brown: KANKREG_PALETTE.inkSoft,
  brownMuted: KANKREG_PALETTE.inkFaint,
  brownInk: KANKREG_PALETTE.ink,
  gold: ZEEVAN_GOLD.base,
  goldDeep: ZEEVAN_GOLD.deep,
  goldBright: ZEEVAN_GOLD.bright,
  goldSoft: ZEEVAN_GOLD.soft,
  goldMist: "rgba(220, 172, 116, 0.22)",
  pillInactive: KANKREG_PALETTE.lineSoft,
  cardBeige: KANKREG_PALETTE.paper,
  cardBg: KANKREG_PALETTE.card,
  line: ZEEVAN_GREEN.border,
  lineStrong: "rgba(36, 68, 36, 0.4)",
  veil: "rgba(248, 240, 224, 0.85)",
  green: KANKREG_PALETTE.green,
  danger: KANKREG_PALETTE.danger,
};

/** Background gradient for CustomerScreenShell. */
export function getCustomerShellGradient(isDark, themeColors) {
  const c = themeColors;
  if (isDark) {
    return ["#050403", "#0B0806", "#17120F", c.backgroundGradientEnd];
  }
  return [KANKREG_PALETTE.card, KANKREG_PALETTE.paper, KANKREG_PALETTE.paper2, "#E8E4D0"];
}

export function getAlchemyPalette(themeColors, isDark) {
  const c = themeColors;
  return {
    card: isDark ? c.surfaceElevated || c.surface : ALCHEMY.cardBg,
    cardBorder: isDark ? c.border : KANKREG_PALETTE.line,
    line: isDark ? c.dividerSoft || c.border : ALCHEMY.line,
    lineStrong: isDark ? c.borderStrong : ALCHEMY.lineStrong,
    goldSoft: isDark ? c.accentGoldSoft ?? c.primarySoft : ALCHEMY.goldSoft,
    goldRing: isDark ? c.accentGold ?? c.primaryBright : ALCHEMY.gold,
    glowPrimary: c.heroGlow || (isDark ? "rgba(168, 184, 108, 0.16)" : "rgba(92, 104, 52, 0.12)"),
    glowSecondary:
      c.heroGlowSecondary || (isDark ? "rgba(232, 188, 132, 0.1)" : "rgba(220, 172, 116, 0.08)"),
  };
}

export const CUSTOMER_SHELL_GRADIENT_LOCATIONS = [0, 0.28, 0.6, 1];
