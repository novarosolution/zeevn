/**
 * Native app design tokens from figmaforkankreg.html
 * @see /figmaforkankreg.html :root + screen specs
 */
import { Platform, StyleSheet } from "react-native";
import { KANKREG_PALETTE } from "./kankregWeb";
import { FONT_HEADING } from "./typographyRoles";
import { fonts, spacing } from "./tokens";

export const FIGMA = {
  ...KANKREG_PALETTE,
  tabBarHeight: 66,
  radiusCard: 16,
  radiusControl: 11,
  radiusHero: 20,
  radiusSheet: 26,
  gutter: 16,
  productTileGradients: [
    ["#e8f0eb", "#c5d9cc"],
    ["#dfece6", "#b8d4c4"],
    ["#e7eee6", "#cdddcf"],
    ["#eef3f0", "#d4e4dc"],
    ["#e8e9ee", "#cdd2dc"],
  ],
  productTileGradientsDark: [
    ["#2e2820", "#1c1916"],
    ["#1e2a22", "#121816"],
    ["#2a221c", "#181412"],
    ["#2c2618", "#1a1610"],
    ["#22242a", "#14161a"],
  ],
};

/** Product image well — warm cream in light, deep bronze in dark */
export function getProductTileGradient(index = 0, isDark = false) {
  const list = isDark ? FIGMA.productTileGradientsDark : FIGMA.productTileGradients;
  return list[index % list.length];
}

export function figmaEyebrow(isDark = false) {
  return {
    fontFamily: fonts.bold,
    fontSize: 9,
    letterSpacing: 2.6,
    textTransform: "uppercase",
    color: isDark ? FIGMA.goldBright : FIGMA.gold,
  };
}

export function figmaDisplayTitle(size = 22, isDark = false) {
  return {
    fontFamily: FONT_HEADING,
    fontSize: size,
    fontWeight: "500",
    letterSpacing: -0.2,
    lineHeight: size * 1.08,
    color: isDark ? FIGMA.paper : FIGMA.ink,
  };
}

export function figmaBody(size = 12.5, isDark = false) {
  return {
    fontFamily: fonts.regular,
    fontSize: size,
    lineHeight: size * 1.45,
    color: isDark ? "rgba(245, 239, 228, 0.85)" : FIGMA.inkSoft,
  };
}

export function figmaCardShell(isDark = false) {
  return {
    backgroundColor: isDark ? "#181513" : FIGMA.card,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: isDark ? "#3f3933" : FIGMA.line,
    borderRadius: FIGMA.radiusCard,
    overflow: "hidden",
  };
}

export function figmaPill(active, isDark = false) {
  return {
    paddingHorizontal: 13,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: active ? (isDark ? FIGMA.greenDeep : FIGMA.green) : isDark ? "#181513" : FIGMA.card,
    borderWidth: active ? 0 : StyleSheet.hairlineWidth,
    borderColor: isDark ? "#3f3933" : FIGMA.line,
  };
}

export function figmaPillText(active, isDark = false) {
  return {
    fontFamily: fonts.semibold,
    fontSize: 10,
    color: active ? FIGMA.paper : isDark ? "rgba(245, 239, 228, 0.72)" : FIGMA.inkSoft,
  };
}

export function figmaIconCircle(isDark = false) {
  return {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: isDark ? "#3f3933" : FIGMA.line,
    backgroundColor: isDark ? "#181513" : FIGMA.card,
    alignItems: "center",
    justifyContent: "center",
  };
}

export function figmaStickyFooter(isDark = false) {
  return {
    backgroundColor: isDark ? "rgba(15,12,10,0.97)" : "rgba(255,253,248,0.97)",
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: isDark ? "#3f3933" : FIGMA.line,
    paddingHorizontal: FIGMA.gutter + 2,
    paddingTop: spacing.md,
  };
}

export function figmaNativeShell(isDark = false) {
  return Platform.OS !== "web"
    ? { flex: 1, width: "100%", backgroundColor: isDark ? "#050403" : FIGMA.paper }
    : {};
}

export function figmaSurfaceBg(isDark = false) {
  return isDark ? "#181513" : FIGMA.card;
}

export function figmaPageBg(isDark = false) {
  return isDark ? "#050403" : FIGMA.paper;
}

export function figmaPrice(isDark = false) {
  return {
    fontFamily: fonts.bold,
    fontSize: 14,
    fontWeight: "600",
    color: isDark ? FIGMA.paper : FIGMA.ink,
  };
}

/** Readable body/label text on themed surfaces */
export function figmaTextPrimary(isDark = false) {
  return { color: isDark ? "#f5efe4" : FIGMA.ink };
}

export function figmaTextSecondary(isDark = false) {
  return { color: isDark ? "rgba(245, 239, 228, 0.88)" : FIGMA.inkSoft };
}

export function figmaTextMuted(isDark = false) {
  return { color: isDark ? "rgba(245, 239, 228, 0.68)" : FIGMA.inkFaint };
}

export function figmaIconSoft(isDark = false) {
  return isDark ? "rgba(245, 239, 228, 0.88)" : FIGMA.inkSoft;
}

export function figmaIconMuted(isDark = false) {
  return isDark ? "rgba(245, 239, 228, 0.68)" : FIGMA.inkFaint;
}

export function figmaRowBorder(isDark = false) {
  return { borderColor: isDark ? "#3f3933" : FIGMA.line };
}
