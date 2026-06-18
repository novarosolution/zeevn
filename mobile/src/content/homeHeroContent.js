/**
 * Home hero slider — native PNG assets. Web uses `homeHeroContent.web.js`.
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
  HOME_HERO_PACKAGING,
  HOME_WEB_INTRO,
} from "./homeHeroContent.shared";

export const HOME_HERO_ASSETS = {
  get webWide() {
    return require("../../assets/zeevan-hero-web-21x9.png");
  },
  get webTelWide() {
    return require("../../assets/zeevan-hero-web-tel-21x9.png");
  },
  get webMasalaWide() {
    return require("../../assets/zeevan-hero-web-masala-21x9.png");
  },
  get telMobile() {
    return require("../../assets/zeevan-tel-portrait.png");
  },
  get masalaMobile() {
    return require("../../assets/zeevan-masala-portrait.png");
  },
  get webHoneyWide() {
    return require("../../assets/zeevan-hero-web-honey-21x9.png");
  },
  get honeyMobile() {
    return require("../../assets/zeevan-honey-portrait.png");
  },
  get packagingMobile() {
    return require("../../assets/zeevan-ghee-packaging-portrait.png");
  },
};
