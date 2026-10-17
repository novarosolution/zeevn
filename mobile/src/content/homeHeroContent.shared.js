/**
 * Shared hero copy + layout ratios (no platform-specific asset requires).
 */

/** Desktop slider — 16:9 widescreen. */
export const WEB_HERO_WIDE_RATIO = 9 / 16;

/** Slide 2 — tel desktop 16:9. */
export const WEB_HERO_TEL_WIDE_RATIO = 9 / 16;

/** Slide 3 — masala desktop 16:9. */
export const WEB_HERO_MASALA_WIDE_RATIO = 9 / 16;

/** Phone tel portrait — 3:4. */
export const WEB_HERO_TEL_PORTRAIT_RATIO = 4 / 3;

/** Phone masala portrait — 3:4. */
export const WEB_HERO_MASALA_PORTRAIT_RATIO = 4 / 3;

/** Honey desktop 16:9. */
export const WEB_HERO_HONEY_WIDE_RATIO = 9 / 16;

/** Phone honey portrait — 3:4. */
export const WEB_HERO_HONEY_PORTRAIT_RATIO = 4 / 3;

/** Landscape product slides — 16:9. */
export const WEB_HERO_PRODUCT_RATIO = 9 / 16;

/** Portrait phone / native hero — 3:4. */
export const WEB_HERO_PORTRAIT_RATIO = 4 / 3;

/**
 * Phone hero viewport cap — only shrink when natural poster height would dominate the screen.
 * At 0.86, a ~390px-wide portrait slide (~693px tall) fits on common 844px-tall phones.
 */
export const WEB_HERO_PHONE_MAX_HEIGHT = 720;
export const WEB_HERO_PHONE_MAX_VH = 0.86;

/** Slider / lean-hero frame height — width-perfect aspect, soft viewport cap only. */
export function resolvePhoneHeroFrameHeight(width, heightRatio, layoutHeight) {
  const frameWidth = Math.max(320, Math.round(width || 390));
  const ratio = heightRatio > 0 ? heightRatio : WEB_HERO_PORTRAIT_RATIO;
  const natural = Math.round(frameWidth * ratio);
  if (!layoutHeight || layoutHeight < 1) return natural;
  const vhCap = Math.round(layoutHeight * WEB_HERO_PHONE_MAX_VH);
  return Math.min(natural, vhCap, WEB_HERO_PHONE_MAX_HEIGHT);
}

export const HOME_HERO_PACKAGING = {
  key: "hero-packaging",
  title: "Pure Bilona ghee",
  subtitle: "A2 desi cow ghee — taste of purity",
  badge: "A2 · Bilona",
  cta: "Shop ghee",
  action: "catalog",
  shopPill: "Ghee",
};

/** Intro band below the web hero (`WebHomeIntroBand.js`) — typographic line rail CTA. */
export const HOME_WEB_INTRO = {
  title: "Diwali pantry picks",
  /** Short — chips + CTA carry the rest. */
  subtitle: "Festive gifts that taste like home.",
  cta: "Shop Diwali gifts",
  ctaSecondary: "About",
};
