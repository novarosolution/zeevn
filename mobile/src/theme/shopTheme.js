import { Platform } from "react-native";
import { KANKREG_PALETTE, ZEEVAN_GREEN } from "./kankregWeb";
import { ALCHEMY } from "./customerAlchemy";

/** Shared shop page + filter tokens — light & dark. */
export function getShopTheme(isDark = false) {
  return {
    pageBg: isDark ? "transparent" : "transparent",
    introBand: isDark ? "rgba(255,255,255,0.04)" : ALCHEMY.creamAlt,
    surface: isDark ? "rgba(255,255,255,0.055)" : KANKREG_PALETTE.card,
    surfaceMuted: isDark ? "rgba(255,255,255,0.035)" : "#F5F0E6",
    surfaceChip: isDark ? "rgba(255,255,255,0.08)" : KANKREG_PALETTE.paper2,
    border: isDark ? "rgba(168, 184, 108, 0.22)" : KANKREG_PALETTE.line,
    borderStrong: isDark ? "rgba(168, 184, 108, 0.34)" : ALCHEMY.lineStrong,
    borderTopAccent: isDark ? "rgba(220, 172, 116, 0.55)" : ALCHEMY.green,
    goldAccent: isDark ? KANKREG_PALETTE.goldBright : KANKREG_PALETTE.gold,
    text: isDark ? KANKREG_PALETTE.paper : KANKREG_PALETTE.ink,
    textMuted: isDark ? "rgba(248, 240, 224, 0.78)" : KANKREG_PALETTE.inkSoft,
    textFaint: isDark ? "rgba(248, 240, 224, 0.55)" : KANKREG_PALETTE.inkFaint,
    accent: isDark ? KANKREG_PALETTE.greenBright : KANKREG_PALETTE.greenDeep,
    accentSoft: isDark ? "rgba(168, 184, 108, 0.16)" : ZEEVAN_GREEN.soft,
    chipOnBg: isDark ? KANKREG_PALETTE.greenDeep : KANKREG_PALETTE.green,
    chipOnBorder: isDark ? KANKREG_PALETTE.green : KANKREG_PALETTE.greenDeep,
    chipOnText: KANKREG_PALETTE.paper,
    sectionIcon: isDark ? KANKREG_PALETTE.greenBright : KANKREG_PALETTE.greenDeep,
    track: isDark ? "rgba(255,255,255,0.1)" : KANKREG_PALETTE.paper2,
    trackFill: isDark ? KANKREG_PALETTE.greenBright : KANKREG_PALETTE.green,
    knob: isDark ? "#1a1714" : KANKREG_PALETTE.card,
    knobBorder: isDark ? KANKREG_PALETTE.greenBright : KANKREG_PALETTE.greenDeep,
    checkOn: isDark ? KANKREG_PALETTE.greenDeep : KANKREG_PALETTE.green,
    checkBorder: isDark ? "rgba(168, 184, 108, 0.32)" : KANKREG_PALETTE.line,
    panelGradient: isDark
      ? undefined
      : "linear-gradient(180deg, rgba(252,248,240,0.96), rgba(248,240,224,0.99))",
    heroGradient: isDark
      ? "linear-gradient(135deg, rgba(31,92,71,0.18) 0%, rgba(24,21,19,0.98) 100%)"
      : "linear-gradient(135deg, rgba(240,248,244,0.98) 0%, rgba(255,255,255,0.94) 100%)",
    panelShadow: isDark
      ? "0 22px 50px rgba(0,0,0,0.34), inset 0 1px 0 rgba(255,255,255,0.04)"
      : "0 20px 44px rgba(36, 68, 36, 0.1), inset 0 1px 0 rgba(252,248,240,0.95)",
    cardShadow: Platform.select({
      web: {
        boxShadow: isDark
          ? "0 14px 36px -12px rgba(0,0,0,0.45)"
          : "0 14px 36px -16px rgba(36, 68, 36, 0.16)",
      },
      default: {},
    }),
  };
}
