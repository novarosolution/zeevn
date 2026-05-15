import { fonts } from "../theme/tokens";
import { FONT_DISPLAY } from "../theme/customerAlchemy";

const FLUID_BREAKPOINTS = {
  tablet: 768,
  desktop: 1200,
};

function resolveFluidSize(width, sizeDef) {
  if (typeof sizeDef === "number") return sizeDef;
  const safeWidth = Number(width || 0);
  if (safeWidth >= FLUID_BREAKPOINTS.desktop) return sizeDef.desktop;
  if (safeWidth >= FLUID_BREAKPOINTS.tablet) return sizeDef.tablet;
  return sizeDef.phone;
}

function toLineHeight(fontSize, ratio) {
  return Math.round(fontSize * ratio);
}

export const typography = {
  display: {
    fontFamily: FONT_DISPLAY,
    fontWeight: "500",
    letterSpacing: -0.025,
    lineHeight: 1.05,
  },
  hero: { fontSize: { phone: 36, tablet: 44, desktop: 52 } },
  h1: { fontSize: { phone: 28, tablet: 32, desktop: 40 } },
  h2: { fontSize: { phone: 22, tablet: 24, desktop: 28 } },
  h3: { fontSize: 18 },
  uiBase: { fontFamily: fonts.regular, fontWeight: "400", lineHeight: 1.5 },
  bodyLg: { fontSize: 16 },
  body: { fontSize: 14 },
  small: { fontSize: 13 },
  caption: { fontSize: 12 },
  micro: { fontSize: 11 },
  overline: {
    fontSize: 11,
    fontFamily: fonts.semibold,
    fontWeight: "600",
    letterSpacing: 0.18,
    textTransform: "uppercase",
  },
  weights: {
    regular: "400",
    medium: "500",
    semibold: "600",
    bold: "700",
  },
};

export function getTypeRamp(width) {
  const hero = resolveFluidSize(width, typography.hero.fontSize);
  const h1 = resolveFluidSize(width, typography.h1.fontSize);
  const h2 = resolveFluidSize(width, typography.h2.fontSize);
  const h3 = resolveFluidSize(width, typography.h3.fontSize);
  return {
    hero,
    h1,
    h2,
    h3,
    heroLine: toLineHeight(hero, typography.display.lineHeight),
    h1Line: toLineHeight(h1, 1.1),
    h2Line: toLineHeight(h2, 1.12),
    h3Line: toLineHeight(h3, 1.2),
    bodyLine: toLineHeight(typography.body.fontSize, 1.5),
    captionLine: toLineHeight(typography.caption.fontSize, 1.4),
  };
}

export const homeType = {
  display: {
    fontFamily: typography.display.fontFamily,
    letterSpacing: -0.025,
    fontWeight: "500",
  },
  overline: {
    fontFamily: typography.overline.fontFamily,
    fontSize: typography.overline.fontSize,
    letterSpacing: typography.overline.letterSpacing,
    textTransform: "uppercase",
  },
  uiRegular: {
    fontFamily: fonts.regular,
    fontWeight: "400",
  },
  uiMedium: {
    fontFamily: fonts.medium,
    fontWeight: "500",
  },
  uiSemibold: {
    fontFamily: fonts.semibold,
    fontWeight: "600",
  },
  uiBold: {
    fontFamily: fonts.bold,
    fontWeight: "700",
  },
};
