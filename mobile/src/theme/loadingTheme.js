import { KANKREG_PALETTE } from "./kankregWeb";

/** Loading states — aligned with Zeevan packaging palette. */
export const LOADING_THEME = {
  shimmerLight: ["#e8e4d0", "#f4f0e0", "#e8e4d0"],
  shimmerDark: ["rgba(255,255,255,0.05)", "rgba(168,184,108,0.24)", "rgba(255,255,255,0.05)"],
  skeletonBaseLight: "#e8e4d0",
  skeletonBaseDark: "rgba(255,255,255,0.09)",
  skeletonBorderDark: "rgba(168,184,108,0.14)",
  paper2: KANKREG_PALETTE.paper2,
  gold: KANKREG_PALETTE.gold,
  goldBright: KANKREG_PALETTE.goldBright,
  goldDeep: KANKREG_PALETTE.goldDeep,
  splashRadialLight: ["#d8dcc8", "#788844", "#244424"],
  splashRadialDark: ["#1a2018", "#121810", "#050403"],
  shimmerDurationMs: 1500,
  ringDurationMs: 1000,
  dotsDurationMs: 1200,
  progressDurationMs: 1400,
};

/** Theme-aware palette for skeletons, dots, rings, and progress bars. */
export function getLoadingPalette(isDark, colors) {
  return {
    skeletonBase: isDark ? LOADING_THEME.skeletonBaseDark : LOADING_THEME.skeletonBaseLight,
    skeletonShimmer: isDark ? LOADING_THEME.shimmerDark : LOADING_THEME.shimmerLight,
    skeletonBorder: isDark ? LOADING_THEME.skeletonBorderDark : "rgba(92, 104, 52, 0.08)",
    dot: isDark ? LOADING_THEME.goldBright : LOADING_THEME.gold,
    ring: isDark ? LOADING_THEME.goldBright : LOADING_THEME.goldDeep,
    track: isDark ? "rgba(255,255,255,0.1)" : LOADING_THEME.paper2,
    fill: isDark ? LOADING_THEME.goldBright : KANKREG_PALETTE.green,
    shellBg: isDark ? colors?.background || "#050403" : KANKREG_PALETTE.paper,
    panelBg: isDark ? colors?.surface || "#181513" : KANKREG_PALETTE.card,
    panelBorder: isDark ? colors?.border || "#3F3933" : KANKREG_PALETTE.line,
    caption: isDark ? "rgba(245,239,228,0.88)" : "rgba(255,255,255,0.85)",
    footnote: isDark ? "rgba(245,239,228,0.72)" : "rgba(255,255,255,0.7)",
  };
}
