/**
 * Hero layout ratios only — bundled marketing photos removed from customer app.
 * Admin-uploaded hero slides (API) still supported when enabled in `HOME_SCREEN_UI`.
 */

export const HOME_HERO_PRODUCT_SLIDE_HEIGHT_PER_WIDTH = 941 / 1672;
export const HOME_HERO_WEB_LANDSCAPE_HEIGHT_PER_WIDTH = 1024 / 1535;
export const HOME_HERO_COMPACT_HEIGHT_RATIO = 0.34;
export const HOME_HERO_COMPACT_MAX_HEIGHT = 220;
export const HOME_HERO_COMPACT_MIN_HEIGHT = 168;
export const HOME_HERO_APP_HEIGHT_RATIO = 0.56;
export const HOME_HERO_APP_MAX_HEIGHT = 312;
export const HOME_HERO_APP_MIN_HEIGHT = 228;
export const HOME_HERO_APP_MAX_SLIDES = 2;
export const HOME_HERO_PHONE_SLIDE_HEIGHT_PER_WIDTH = 1672 / 941;
export const HOME_HERO_PRODUCT_WIDE_HEIGHT_PER_WIDTH = 821 / 1915;
export const HOME_HERO_PRODUCT_PHONE_SLIDE_HEIGHT_PER_WIDTH = 1672 / 941;

export const HOME_HERO_PRODUCT_SLIDE = null;
export const HOME_HERO_PRODUCT_PHONE_SLIDE = null;
export {
  getHomeHeroWebSliderSlides,
  getHomeHeroMobileSliderSlides,
} from "./homeHeroSlides";
export const AUTH_AMBIENT_IMAGE = null;
