/**
 * Premium web design tokens — one place for the website Home redesign (hero, tiles, cards, bands).
 * Light and dark variants are chosen by the caller with `isDark`; web-only values (CSS gradients, box-shadows)
 * are plain strings that RN-web passes straight through.
 */
import { KANKREG_PALETTE, ZEEVAN_GOLD, ZEEVAN_GREEN } from "./kankregWeb";

export const WP = {
  gold: {
    base: ZEEVAN_GOLD.base,
    bright: ZEEVAN_GOLD.bright,
    deep: ZEEVAN_GOLD.deep,
    /** Text on gold fills. */
    ink: "#2E2208",
  },
  green: {
    base: ZEEVAN_GREEN.base,
    deep: ZEEVAN_GREEN.deep,
    ink: "#244424",
  },
  paper: KANKREG_PALETTE.paper,
  paper2: KANKREG_PALETTE.paper2,
  card: KANKREG_PALETTE.card,
  ink: KANKREG_PALETTE.ink,
  inkSoft: KANKREG_PALETTE.inkSoft,
  inkFaint: KANKREG_PALETTE.inkFaint,
  cream: "#FFFFFF",

  radius: { card: 20, tile: 24, pill: 999, control: 14 },

  ease: "cubic-bezier(0.22, 1, 0.36, 1)",

  shadow: {
    card: "0 1px 2px rgba(36, 68, 36, 0.05), 0 18px 40px -28px rgba(36, 68, 36, 0.3)",
    lift: "0 2px 4px rgba(36, 68, 36, 0.06), 0 32px 60px -30px rgba(36, 68, 36, 0.42)",
    gold: "0 16px 32px -14px rgba(184, 136, 76, 0.65)",
    green: "0 16px 30px -14px rgba(31, 51, 31, 0.65)",
    glass: "0 10px 30px -12px rgba(0, 0, 0, 0.45)",
  },

  gradient: {
    green: "linear-gradient(135deg, #3F6231 0%, #2C5230 52%, #1F331F 100%)",
    greenHover: "linear-gradient(135deg, #4B7439 0%, #356038 52%, #244424 100%)",
    gold: "linear-gradient(135deg, #F1D493 0%, #DDAE62 48%, #BE8C45 100%)",
    goldHover: "linear-gradient(135deg, #F7DEA6 0%, #E5B96F 48%, #C99650 100%)",
    heroSide: "linear-gradient(90deg, rgba(14,16,10,0.74) 0%, rgba(14,16,10,0.46) 34%, rgba(14,16,10,0.1) 64%, rgba(14,16,10,0) 100%)",
    heroBottom: "linear-gradient(0deg, rgba(14,16,10,0.72) 0%, rgba(14,16,10,0.25) 34%, rgba(14,16,10,0) 62%)",
    stage: "linear-gradient(180deg, #FFFFFF 0%, #F7F7F7 100%)",
  },
};

/** Section heading scale for the website Home (px). */
export function webTitleSize(width) {
  if (width >= 1200) return 42;
  if (width >= 1080) return 38;
  if (width >= 900) return 34;
  if (width >= 560) return 30;
  return 26;
}

/** Hero headline scale (px). */
export function webHeroSize(width) {
  if (width >= 1500) return 76;
  if (width >= 1200) return 68;
  if (width >= 1080) return 58;
  if (width >= 900) return 50;
  if (width >= 560) return 42;
  return 28;
}
