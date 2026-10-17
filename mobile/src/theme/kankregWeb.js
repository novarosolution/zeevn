/**
 * Zeevan brand palette — premium atelier (deep olive, harvest gold, ivory paper).
 */

export const ZEEVAN_GREEN = {
  base: "#556B32",
  bright: "#7A8F44",
  deep: "#1F331F",
  leaf: "#8A9A52",
  soft: "rgba(85, 107, 50, 0.12)",
  border: "rgba(85, 107, 50, 0.34)",
};

export const ZEEVAN_GOLD = {
  base: "#D4A574",
  bright: "#E6BE88",
  deep: "#B8884C",
  soft: "rgba(212, 165, 116, 0.18)",
  border: "rgba(212, 165, 116, 0.38)",
};

export const KANKREG_PALETTE = {
  ink: "#1A1C14",
  inkSoft: "#4A4634",
  inkFaint: "#7A7460",
  paper: "#F7F1E6",
  paper2: "#EFE7D8",
  card: "#FFFCF6",
  line: "#E2D6C2",
  lineSoft: "#EBE3D4",
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
