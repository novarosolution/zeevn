import {
  ZEEVAN_CATALOG_TAGLINE,
  ZEEVAN_PRODUCT_LINES,
} from "../content/zeevanCatalogContent";
import {
  HOME_HERO_ASSETS,
  HOME_HERO_PACKAGING,
  WEB_HERO_HONEY_PORTRAIT_RATIO,
  WEB_HERO_HONEY_WIDE_RATIO,
  WEB_HERO_MASALA_PORTRAIT_RATIO,
  WEB_HERO_MASALA_WIDE_RATIO,
  WEB_HERO_PORTRAIT_RATIO,
  WEB_HERO_PRODUCT_RATIO,
  WEB_HERO_TEL_PORTRAIT_RATIO,
  WEB_HERO_TEL_WIDE_RATIO,
  WEB_HERO_WIDE_RATIO,
} from "../content/homeHeroContent";
import { ZEEVAN_BRAND_ASSETS } from "../content/appContent";

const HERO_IMAGES = {
  ghee: ZEEVAN_BRAND_ASSETS.wordmark,
  tel: ZEEVAN_BRAND_ASSETS.wordmark,
  masala: ZEEVAN_BRAND_ASSETS.mark,
  honey: ZEEVAN_BRAND_ASSETS.mark,
};

/** Wide marketing banners — slides 2 tel, 3 masala, 4 honey. */
const HERO_WIDE_BANNERS = {
  tel: {
    asset: HOME_HERO_ASSETS.webTelWide,
    ratio: WEB_HERO_TEL_WIDE_RATIO,
    portraitAsset: HOME_HERO_ASSETS.telMobile,
    portraitRatio: WEB_HERO_TEL_PORTRAIT_RATIO,
  },
  masala: {
    asset: HOME_HERO_ASSETS.webMasalaWide,
    ratio: WEB_HERO_MASALA_WIDE_RATIO,
    portraitAsset: HOME_HERO_ASSETS.masalaMobile,
    portraitRatio: WEB_HERO_MASALA_PORTRAIT_RATIO,
  },
  honey: {
    asset: HOME_HERO_ASSETS.webHoneyWide,
    ratio: WEB_HERO_HONEY_WIDE_RATIO,
    portraitAsset: HOME_HERO_ASSETS.honeyMobile,
    portraitRatio: WEB_HERO_HONEY_PORTRAIT_RATIO,
  },
};

/** Slide 1 — wide packaging banner (always first). */
export function buildPackagingMarketingSlide({ portrait = false } = {}) {
  const copy = HOME_HERO_PACKAGING;

  return {
    key: copy.key,
    image: portrait ? HOME_HERO_ASSETS.packagingMobile : HOME_HERO_ASSETS.webWide,
    title: copy.title,
    subtitle: copy.subtitle,
    cta: copy.cta,
    action: copy.action,
    variant: "product",
    badge: copy.badge,
    contentPosition: portrait ? "top" : "center",
    heightRatio: portrait ? WEB_HERO_PORTRAIT_RATIO : WEB_HERO_WIDE_RATIO,
    imageFit: "cover",
    layout: portrait ? "portrait" : "landscape",
    captionMode: portrait ? "none" : "overlay",
    captionAlign: portrait ? "center" : "left",
    captionZone: "bottom",
    order: 0,
  };
}

function toMarketingSlide(line, index, { portrait = false, wideBannerKey = null } = {}) {
  const hero = line.hero || {};
  const wide = wideBannerKey ? HERO_WIDE_BANNERS[wideBannerKey] : null;
  const useWideArt = Boolean(wide && line.key === wideBannerKey);
  const image = useWideArt
    ? wide.asset
    : HERO_IMAGES[line.key] || HERO_IMAGES.ghee;

  return {
    key: `hero-${line.key}`,
    image,
    title: hero.title || line.label,
    subtitle: hero.subtitle || line.description,
    cta: hero.cta || "Shop",
    action: "catalog",
    variant: useWideArt || line.key === "ghee" ? "product" : "",
    badge: hero.badge || line.label,
    contentPosition: "center",
    heightRatio: useWideArt
      ? wide.ratio
      : portrait
        ? WEB_HERO_PORTRAIT_RATIO
        : WEB_HERO_PRODUCT_RATIO,
    imageFit: "cover",
    layout: useWideArt ? "landscape" : portrait ? "portrait" : "landscape",
    captionMode: useWideArt ? "none" : "overlay",
    captionAlign: portrait ? "center" : "left",
    captionZone: "bottom",
    order: index + 1,
  };
}

function buildLineWideSlide(lineKey, index, { portrait = false } = {}) {
  const line = ZEEVAN_PRODUCT_LINES.find((l) => l.key === lineKey);
  const wide = line ? HERO_WIDE_BANNERS[line.key] : null;
  if (!line || !wide) return null;

  if (portrait && wide.portraitAsset) {
    return {
      key: `hero-${line.key}`,
      image: wide.portraitAsset,
      title: line.hero?.title || line.label,
      subtitle: line.hero?.subtitle || line.description,
      cta: line.hero?.cta || "Shop",
      action: "catalog",
      variant: "product",
      badge: line.hero?.badge || line.label,
      contentPosition: "top",
      heightRatio: wide.portraitRatio,
      imageFit: "cover",
      layout: "portrait",
      captionMode: "none",
      captionAlign: "center",
      captionZone: "bottom",
      order: index + 1,
    };
  }

  return toMarketingSlide(line, index, { portrait: false, wideBannerKey: lineKey });
}

function buildCoreSlidePool({ portraitPackaging = false, portraitLines = false } = {}) {
  const packaging = buildPackagingMarketingSlide({ portrait: portraitPackaging });
  const telSlide = buildLineWideSlide("tel", 0, { portrait: portraitLines });
  const masalaSlide = buildLineWideSlide("masala", 1, { portrait: portraitLines });
  const honeySlide = buildLineWideSlide("honey", 2, { portrait: portraitLines });
  return [packaging, telSlide, masalaSlide, honeySlide].filter(Boolean);
}

function buildWebSlidePool() {
  return buildCoreSlidePool({ portraitPackaging: false, portraitLines: false });
}

function buildMobileSlidePool() {
  return buildCoreSlidePool({ portraitPackaging: true, portraitLines: true });
}

/** Desktop web — packaging + tel + masala + honey banners. */
let _webSlides = null;
export function getHomeHeroWebSliderSlides() {
  if (!_webSlides) _webSlides = buildWebSlidePool();
  return _webSlides;
}

/** Phone web + native — portrait slides 1–4 (ghee, tel, masala, honey). */
let _mobileSlides = null;
export function getHomeHeroMobileSliderSlides() {
  if (!_mobileSlides) _mobileSlides = buildMobileSlidePool();
  return _mobileSlides;
}

export const PACKAGING_RATIO = WEB_HERO_WIDE_RATIO;

export const HOME_HERO_TITLE_DEFAULT = ZEEVAN_CATALOG_TAGLINE;
export const HOME_HERO_SUBTITLE_DEFAULT = "Ghee · tel · masala · Haldar honey — delivered fresh.";
