/**
 * Zeevan brand palette — sampled from A2 ghee packaging (olive green, harvest gold, warm cream).
 */

export const ZEEVAN_GREEN = {
  base: "#5C6834",
  bright: "#788844",
  deep: "#244424",
  leaf: "#849448",
  soft: "rgba(92, 104, 52, 0.12)",
  border: "rgba(92, 104, 52, 0.32)",
};

export const ZEEVAN_GOLD = {
  base: "#DCAC74",
  bright: "#E8BC84",
  deep: "#BC905C",
  soft: "rgba(220, 172, 116, 0.18)",
  border: "rgba(220, 172, 116, 0.35)",
};

export const KANKREG_PALETTE = {
  ink: "#1E2018",
  inkSoft: "#5C5838",
  inkFaint: "#8A8468",
  paper: "#F8F0E0",
  paper2: "#F0E8D8",
  card: "#FCF8F0",
  line: "#E0D4C0",
  lineSoft: "#E8E0D0",
  green: ZEEVAN_GREEN.base,
  greenBright: ZEEVAN_GREEN.bright,
  greenDeep: ZEEVAN_GREEN.deep,
  greenLeaf: ZEEVAN_GREEN.leaf,
  gold: ZEEVAN_GOLD.base,
  goldBright: ZEEVAN_GOLD.bright,
  goldDeep: ZEEVAN_GOLD.deep,
  danger: "#B8442F",
};

/** Web chrome — announce strip, header, trust band, CTAs. */
export const KANKREG_CHROME = {
  announceBg: ZEEVAN_GREEN.deep,
  cream: KANKREG_PALETTE.paper,
  topbarBg: KANKREG_PALETTE.paper,
  topbarSolid: KANKREG_PALETTE.paper,
  buttonAccent: ZEEVAN_GREEN.base,
  buttonAccentHover: ZEEVAN_GREEN.bright,
  buttonSecondary: ZEEVAN_GREEN.deep,
  buttonSecondaryHover: ZEEVAN_GREEN.bright,
  onAccent: "#FFFFFF",
  footerFrom: ZEEVAN_GREEN.deep,
  footerTo: KANKREG_PALETTE.ink,
  footerAccent: ZEEVAN_GOLD.base,
};

/** Display radius from HTML --r */
export const KANKREG_RADIUS = {
  card: 20,
  control: 13,
};

/**
 * Theme-aware surface tokens — use with `useTheme()` colors in customer UI.
 * @param {boolean} isDark
 * @param {import("./tokens").typeof lightColors} c
 */
export function getKankregSurfaces(isDark, c) {
  return {
    background: isDark ? c.background : KANKREG_PALETTE.paper,
    card: isDark ? c.surface : KANKREG_PALETTE.card,
    cardMuted: isDark ? c.surfaceMuted : KANKREG_PALETTE.paper2,
    text: isDark ? c.textPrimary : KANKREG_PALETTE.ink,
    textSoft: isDark ? c.textSecondary : KANKREG_PALETTE.inkSoft,
    textMuted: isDark ? c.textMuted : KANKREG_PALETTE.inkFaint,
    border: isDark ? c.border : KANKREG_PALETTE.line,
    borderSubtle: isDark ? "rgba(168, 184, 108, 0.18)" : KANKREG_PALETTE.lineSoft,
    inkBar: isDark ? c.surfaceMuted : KANKREG_PALETTE.ink,
    pillInactive: isDark ? "rgba(255,255,255,0.06)" : KANKREG_PALETTE.paper2,
    gold: isDark ? c.accentGold ?? c.primaryBright : KANKREG_PALETTE.gold,
    goldBright: isDark ? c.accentGold ?? c.primaryBright : KANKREG_PALETTE.goldBright,
    goldDeep: isDark ? c.primaryDark : KANKREG_PALETTE.goldDeep,
    cardShadow: isDark
      ? "0 14px 38px -20px rgba(0,0,0,0.45)"
      : "0 1px 2px rgba(36, 68, 36, 0.04), 0 14px 38px -20px rgba(36, 68, 36, 0.18)",
  };
}
