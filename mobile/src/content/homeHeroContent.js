/**
 * Home hero slider — native assets (same responsive art as web).
 * Web uses `homeHeroContent.web.js`.
 */
export {
  WEB_HERO_WIDE_RATIO,
  WEB_HERO_TEL_WIDE_RATIO,
  WEB_HERO_MASALA_WIDE_RATIO,
  WEB_HERO_TEL_PORTRAIT_RATIO,
  WEB_HERO_MASALA_PORTRAIT_RATIO,
  WEB_HERO_HONEY_WIDE_RATIO,
  WEB_HERO_HONEY_PORTRAIT_RATIO,
  WEB_HERO_PRODUCT_RATIO,
  WEB_HERO_PORTRAIT_RATIO,
  WEB_HERO_PHONE_MAX_HEIGHT,
  WEB_HERO_PHONE_MAX_VH,
  resolvePhoneHeroFrameHeight,
  HOME_HERO_PACKAGING,
  HOME_WEB_INTRO,
} from "./homeHeroContent.shared";

export const HOME_HERO_ASSETS = {
  get webWide() {
    return require("../../assets/slider-desktop-ghee.jpg");
  },
  get webTelWide() {
    return require("../../assets/slider-desktop-tel.jpg");
  },
  get webMasalaWide() {
    return require("../../assets/slider-desktop-masala.jpg");
  },
  get webHoneyWide() {
    return require("../../assets/slider-desktop-honey.jpg");
  },
  get packagingMobile() {
    return require("../../assets/slider-phone-ghee.jpg");
  },
  get telMobile() {
    return require("../../assets/slider-phone-tel.jpg");
  },
  get masalaMobile() {
    return require("../../assets/slider-phone-masala.jpg");
  },
  get honeyMobile() {
    return require("../../assets/slider-phone-honey.jpg");
  },
};
