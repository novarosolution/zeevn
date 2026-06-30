/**
 * Shared hero copy + layout ratios (no platform-specific asset requires).
 */

/** Slide 1 — 21:9 ultrawide banner (1915×821). */
export const WEB_HERO_WIDE_RATIO = 821 / 1915;

/** Slide 2 — tel / groundnut oil wide banner (1823×863). */
export const WEB_HERO_TEL_WIDE_RATIO = 863 / 1823;

/** Slide 3 — masala / red chilli wide banner (1824×862). */
export const WEB_HERO_MASALA_WIDE_RATIO = 862 / 1824;

/** Slide 2 — tel portrait banner, phone web + native (853×1844). */
export const WEB_HERO_TEL_PORTRAIT_RATIO = 1844 / 853;

/** Slide 3 — masala portrait banner, phone web + native (852×1846). */
export const WEB_HERO_MASALA_PORTRAIT_RATIO = 1846 / 852;

/** Slide 4 — honey / Haldar honey wide banner (1698×926). */
export const WEB_HERO_HONEY_WIDE_RATIO = 926 / 1698;

/** Slide 4 — honey portrait banner, phone web + native (853×1844). */
export const WEB_HERO_HONEY_PORTRAIT_RATIO = 1844 / 853;

/** Landscape product slides (821×1915 source art). */
export const WEB_HERO_PRODUCT_RATIO = 821 / 1915;

/** Portrait phone / native hero — 941×1672 poster art. */
export const WEB_HERO_PORTRAIT_RATIO = 1672 / 941;

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

/** Intro band below the web hero (`WebHomeIntroBand.js`). */
export const HOME_WEB_INTRO = {
  title: "Premium pantry, delivered fresh",
  subtitle: "Ghee · tel · masala · honey · live tracking",
  cta: "Shop all",
  ctaSecondary: "About",
};
