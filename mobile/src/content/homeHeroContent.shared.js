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

/** Phone web hero — cap rendered height (full portrait art is too tall on narrow screens). */
export const WEB_HERO_PHONE_MAX_HEIGHT = 340;
export const WEB_HERO_PHONE_MAX_VH = 0.42;

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
