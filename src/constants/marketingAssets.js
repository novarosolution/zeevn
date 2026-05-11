/**
 * Home hero slides: copy + CTA + gradient preset (no bundled photography).
 * First slide title/subtitle can be overridden in HomeScreen from admin `homeViewConfig`.
 */

/** Gradient-only hero backgrounds (red / black family). */
export const HERO_GRADIENT_PRESETS = {
  ember: {
    colors: ["#0c0a0a", "#450a0a", "#991b1b", "#1c0a0a"],
    locations: [0, 0.38, 0.72, 1],
    start: { x: 0.1, y: 0 },
    end: { x: 0.9, y: 1 },
  },
  noir: {
    colors: ["#030303", "#18181b", "#27272a", "#0a0a0a"],
    locations: [0, 0.4, 0.75, 1],
    start: { x: 0.5, y: 0 },
    end: { x: 0.5, y: 1 },
  },
  flare: {
    colors: ["#1a0505", "#7f1d1d", "#b91c1c", "#0f0f0f"],
    locations: [0, 0.35, 0.65, 1],
    start: { x: 1, y: 0.2 },
    end: { x: 0, y: 0.95 },
  },
};

const _cycle = ["ember", "noir", "flare"];

const HERO_SLIDE_MEDIA = {
  tradition: require("../../assets/marketing/hero-slide-1.jpg"),
  trust: require("../../assets/marketing/hero-slide-2.jpg"),
  premium: require("../../assets/marketing/hero-slide-3.jpg"),
  catalog: require("../../assets/marketing/hero-slide-11.png"),
  essentials: require("../../assets/marketing/hero-slide-14.png"),
  discovery: require("../../assets/marketing/hero-slide-15.png"),
};

function carouselSlide(i, key, title, subtitle, cta, action) {
  return {
    key,
    preset: _cycle[i % _cycle.length],
    title,
    subtitle,
    cta,
    action,
  };
}

export const HOME_HERO_CAROUSEL_SLIDES = [
  carouselSlide(0, "hero-1", "Heritage craft, delivered", "Fast delivery and curated picks.", "Explore collection", "featured"),
  carouselSlide(1, "hero-2", "Fresh picks, daily", "Handpicked essentials for every day.", "Explore fresh", "featured"),
  carouselSlide(2, "hero-3", "Smooth checkout", "Faster ordering with a cleaner cart flow.", "Start shopping", "catalog"),
  carouselSlide(3, "hero-4", "Pure & natural", "Thoughtfully sourced staples for your home.", "Shop now", "catalog"),
  carouselSlide(4, "hero-5", "Small batch quality", "Carefully selected for flavour and freshness.", "See highlights", "featured"),
  carouselSlide(5, "hero-6", "From our kitchen to yours", "Tradition-led staples for daily use.", "Browse catalog", "catalog"),
  carouselSlide(6, "hero-7", "Curated for you", "Quick discovery on phone and web.", "Explore collection", "featured"),
  carouselSlide(7, "hero-8", "COD & reliable delivery", "Clear updates and dependable fulfilment.", "Start shopping", "catalog"),
  carouselSlide(8, "hero-9", "Premium presentation", "Packaging and picks made with care.", "Shop now", "catalog"),
  carouselSlide(9, "hero-10", "Your everyday essentials", "Stock up without compromising on quality.", "See highlights", "featured"),
  carouselSlide(10, "hero-11", "Crafted selection", "Shelf-worthy picks, chosen well.", "Browse catalog", "catalog"),
  carouselSlide(11, "hero-12", "Bright, modern shopping", "Find what you need faster.", "Explore collection", "featured"),
  carouselSlide(12, "hero-13", "Trust in every order", "Quality, support, and a cart that stays in sync.", "Start shopping", "catalog"),
  carouselSlide(13, "hero-14", "Made to impress", "Gift-ready picks and daily staples.", "Shop now", "catalog"),
  carouselSlide(14, "hero-15", "Welcome to the experience", "Browse, save your address, and checkout fast.", "See highlights", "featured"),
];

export const HOME_HERO_WEB_SLIDER_SLIDES = [
  {
    key: "web-hero-a7b4",
    preset: "ember",
    title: "Trust in every order",
    subtitle: "Quality, support, and a cart that stays in sync.",
    cta: "Start shopping",
    action: "catalog",
    image: HERO_SLIDE_MEDIA.catalog,
  },
  {
    key: "web-hero-54c4",
    preset: "noir",
    title: "Your everyday essentials",
    subtitle: "Stock up on favourites without compromise.",
    cta: "See highlights",
    action: "featured",
    image: HERO_SLIDE_MEDIA.essentials,
  },
  {
    key: "web-hero-0500",
    preset: "flare",
    title: "Curated for you",
    subtitle: "Quick discovery on the web.",
    cta: "Explore collection",
    action: "featured",
    image: HERO_SLIDE_MEDIA.discovery,
  },
];

/** Text-first hero band: height per slider width (no photo aspect). */
export const HOME_HERO_TEXT_BAND_HEIGHT_PER_WIDTH = 0.5;

/** @deprecated Use HOME_HERO_TEXT_BAND_HEIGHT_PER_WIDTH */
export const HOME_HERO_PHONE_SLIDE_HEIGHT_PER_WIDTH = HOME_HERO_TEXT_BAND_HEIGHT_PER_WIDTH;

export const HOME_HERO_MOBILE_SLIDER_SLIDES = [
  {
    key: "phone-hero-iae",
    preset: "flare",
    title: "From our kitchen to yours",
    subtitle: "Tradition-led staples for every day.",
    cta: "Browse catalog",
    action: "catalog",
    image: HERO_SLIDE_MEDIA.tradition,
  },
  {
    key: "phone-hero-0808",
    preset: "ember",
    title: "Pure & natural",
    subtitle: "Thoughtfully sourced staples you can trust.",
    cta: "Shop now",
    action: "catalog",
    image: HERO_SLIDE_MEDIA.trust,
  },
  {
    key: "phone-hero-0909",
    preset: "noir",
    title: "Small batch quality",
    subtitle: "Carefully selected for flavour and freshness.",
    cta: "See highlights",
    action: "featured",
    image: HERO_SLIDE_MEDIA.premium,
  },
];

/** @deprecated Hero no longer uses bundled slide images. */
export const HOME_HERO_SLIDE_IMAGES = [];
