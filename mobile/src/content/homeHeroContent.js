/**
 * Home hero slider — copy + assets (web desktop banner, mobile packaging).
 * Edit here to change slide 1 text; images live in `mobile/assets/`.
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

export const HOME_HERO_PACKAGING = {
  key: "hero-packaging",
  title: "Pure Bilona ghee",
  subtitle: "A2 desi cow ghee — taste of purity",
  badge: "A2 · Bilona",
  cta: "Shop ghee",
  action: "catalog",
  shopPill: "Ghee",
};

export const HOME_HERO_ASSETS = {
  /** Slide 1 — 21:9 ultrawide web banner (large screens) */
  webWide: require("../../assets/zeevan-hero-web-21x9.png"),
  /** Slide 2 — tel / groundnut oil banner (1823×863) */
  webTelWide: require("../../assets/zeevan-hero-web-tel-21x9.png"),
  /** Slide 3 — masala / red chilli powder banner (1824×862) */
  webMasalaWide: require("../../assets/zeevan-hero-web-masala-21x9.png"),
  /** Slide 2 — tel portrait poster, phone web + native (853×1844) */
  telMobile: require("../../assets/zeevan-tel-portrait.png"),
  /** Slide 3 — masala portrait poster, phone web + native (852×1846) */
  masalaMobile: require("../../assets/zeevan-masala-portrait.png"),
  /** Slide 4 — Haldar honey banner (1698×926) */
  webHoneyWide: require("../../assets/zeevan-hero-web-honey-21x9.png"),
  /** Slide 4 — honey portrait poster, phone web + native (853×1844) */
  honeyMobile: require("../../assets/zeevan-honey-portrait.png"),
  /** Portrait poster — phone web + native hero slide 1 (941×1672) */
  packagingMobile: require("../../assets/zeevan-ghee-packaging-portrait.png"),
};

/** Intro band below the web hero (`WebHomeIntroBand.js`). */
export const HOME_WEB_INTRO = {
  title: "Premium pantry, delivered fresh",
  subtitle: "Ghee · tel · masala · honey · live tracking",
  cta: "Shop all",
  ctaSecondary: "About",
};
