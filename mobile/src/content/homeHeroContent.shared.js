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
 * Phone hero viewport cap — keep native posters readable without eating the first screen.
 * Phone *website* slider uses `HOME_HERO_MOBILE_WEB_*` (shorter landscape band) instead.
 */
export const WEB_HERO_PHONE_MAX_HEIGHT = 520;
export const WEB_HERO_PHONE_MAX_VH = 0.58;

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
  title: "A2 Desi Cow Ghee",
  subtitle: "Taste of purity — 1 litre jar",
  badge: "A2 · Desi",
  cta: "Shop ghee",
  action: "catalog",
  shopPill: "Ghee",
};

/** Intro band below the web hero (`WebHomeIntroBand.js`) — typographic line rail CTA. */
export const HOME_WEB_INTRO = {
  title: "Welcome to Zeevan",
  subtitle: "Your one-stop store for purity — ghee, tel, masala & honey.",
  cta: "Shop all",
  ctaSecondary: "About",
};
