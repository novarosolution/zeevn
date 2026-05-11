/**
 * Home hero slides: copy + CTA + gradient preset (no bundled photography).
 * First slide title/subtitle can be overridden in HomeScreen from admin `homeViewConfig`.
 */

import { HOME_HERO_SLIDE_COPY } from "../content/appContent";

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

/**
 * Single managed customer-facing hero image used in both app and web.
 * The user requested this exact file from the `web img` folder.
 */
export const SHARED_APP_AND_WEB_HERO_IMAGE = require("../../web img/ChatGPT Image May 11, 2026, 08_04_26 PM.png");
/** @deprecated Prefer `SHARED_APP_AND_WEB_HERO_IMAGE`. */
export const WEB_MARKETING_SHARED_IMAGE = SHARED_APP_AND_WEB_HERO_IMAGE;

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
    title: HOME_HERO_SLIDE_COPY[0].title,
    subtitle: HOME_HERO_SLIDE_COPY[0].subtitle,
    cta: HOME_HERO_SLIDE_COPY[0].cta,
    action: HOME_HERO_SLIDE_COPY[0].action,
    image: WEB_MARKETING_SHARED_IMAGE,
  },
  {
    key: "web-hero-54c4",
    preset: "noir",
    title: HOME_HERO_SLIDE_COPY[1].title,
    subtitle: HOME_HERO_SLIDE_COPY[1].subtitle,
    cta: HOME_HERO_SLIDE_COPY[1].cta,
    action: HOME_HERO_SLIDE_COPY[1].action,
    image: WEB_MARKETING_SHARED_IMAGE,
  },
  {
    key: "web-hero-0500",
    preset: "flare",
    title: HOME_HERO_SLIDE_COPY[2].title,
    subtitle: HOME_HERO_SLIDE_COPY[2].subtitle,
    cta: HOME_HERO_SLIDE_COPY[2].cta,
    action: HOME_HERO_SLIDE_COPY[2].action,
    image: WEB_MARKETING_SHARED_IMAGE,
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
    title: HOME_HERO_SLIDE_COPY[0].title,
    subtitle: HOME_HERO_SLIDE_COPY[0].subtitle,
    cta: HOME_HERO_SLIDE_COPY[0].cta,
    action: HOME_HERO_SLIDE_COPY[0].action,
    image: SHARED_APP_AND_WEB_HERO_IMAGE,
  },
  {
    key: "phone-hero-0808",
    preset: "ember",
    title: HOME_HERO_SLIDE_COPY[1].title,
    subtitle: HOME_HERO_SLIDE_COPY[1].subtitle,
    cta: HOME_HERO_SLIDE_COPY[1].cta,
    action: HOME_HERO_SLIDE_COPY[1].action,
    image: SHARED_APP_AND_WEB_HERO_IMAGE,
  },
  {
    key: "phone-hero-0909",
    preset: "noir",
    title: HOME_HERO_SLIDE_COPY[2].title,
    subtitle: HOME_HERO_SLIDE_COPY[2].subtitle,
    cta: HOME_HERO_SLIDE_COPY[2].cta,
    action: HOME_HERO_SLIDE_COPY[2].action,
    image: SHARED_APP_AND_WEB_HERO_IMAGE,
  },
];

/** @deprecated Hero no longer uses bundled slide images. */
export const HOME_HERO_SLIDE_IMAGES = [];
