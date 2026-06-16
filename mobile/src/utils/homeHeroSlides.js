import {
  HOME_HERO_MOBILE_SLIDER_SLIDES,
  HOME_HERO_WEB_SLIDER_SLIDES,
  buildPackagingMarketingSlide,
} from "../constants/homeHeroSlides";
import { HOME_SCREEN_UI } from "../content/appContent";
import { productCoverUri } from "./adminProductHelpers";
import {
  getActiveHeroSlides,
  getAppHeroSlides,
  getAppMarketingHeroSlides,
  mapMarketingSlidesToHero,
} from "./homeViewMedia";

const PACKAGING_SLIDE_ID = "hero-packaging";

function imagesOnly(slides) {
  return slides.filter((slide) => slide.mediaType !== "video");
}

function getPackagingHeroSlide({ portrait = false } = {}) {
  const [slide] = mapMarketingSlidesToHero([buildPackagingMarketingSlide({ portrait })]);
  return slide || null;
}

/** Ensure packaging / wide web banner is always slide 1. */
function withPackagingFirst(slides, { portrait = false, max = 4 } = {}) {
  const packaging = getPackagingHeroSlide({ portrait });
  if (!packaging) return slides.slice(0, max);

  const rest = (Array.isArray(slides) ? slides : []).filter(
    (slide) => slide?.id !== PACKAGING_SLIDE_ID
  );
  return [packaging, ...rest].slice(0, max);
}

/** Build hero slides from catalog products that have cover images. */
export function buildProductHeroSlides(products = [], max) {
  const cap = max ?? HOME_SCREEN_UI.heroSlider?.maxProductSlides ?? 4;
  const list = Array.isArray(products) ? products : [];
  const slides = [];

  for (const product of list) {
    const url = productCoverUri(product);
    if (!url) continue;
    slides.push({
      id: `product-${product.id}`,
      order: slides.length,
      mediaType: "image",
      url,
      title: String(product.name || product.title || "").trim(),
      subtitle: String(product.subtitle || product.shortDescription || "").trim(),
      cta: HOME_SCREEN_UI.hero?.cta || "Shop now",
      enabled: true,
    });
    if (slides.length >= cap) break;
  }

  return slides;
}

/** Web home hero — packaging always first, then admin → products → brand defaults. */
export function resolveWebHomeHeroSlides({
  heroSlides = [],
  products = [],
  isMobileWeb = false,
} = {}) {
  if (HOME_SCREEN_UI.web?.showWebHero === false) return [];

  const max = HOME_SCREEN_UI.heroSlider?.maxProductSlides ?? 4;
  const portrait = isMobileWeb;

  const admin = imagesOnly(getActiveHeroSlides(heroSlides));
  if (admin.length) {
    return withPackagingFirst(admin, { portrait, max });
  }

  const pool = isMobileWeb ? HOME_HERO_MOBILE_SLIDER_SLIDES : HOME_HERO_WEB_SLIDER_SLIDES;
  return mapMarketingSlidesToHero(pool).slice(0, max);
}

/** Native app home hero — packaging always first. */
export function resolveNativeHomeHeroSlides({ heroSlides = [], products = [] } = {}) {
  if (HOME_SCREEN_UI.native?.showNativeHero === false) return [];

  const max = HOME_SCREEN_UI.heroSlider?.maxProductSlides ?? 4;
  const appMax = Math.min(max, 4);

  const admin = imagesOnly(getAppHeroSlides(heroSlides));
  if (admin.length) {
    return withPackagingFirst(admin, { portrait: true, max: appMax });
  }

  return getAppMarketingHeroSlides(HOME_HERO_MOBILE_SLIDER_SLIDES);
}
