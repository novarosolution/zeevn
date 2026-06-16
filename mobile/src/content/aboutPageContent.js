/**
 * About page — single source for copy, section order, labels & animation indices.
 * Runtime data merges admin `aboutSection` via `normalizeAboutSection` in homeViewMedia.js.
 */
import { ZEEVAN_CATALOG_SUBLINE, ZEEVAN_CATALOG_TAGLINE, ZEEVAN_PRODUCT_LINES } from "./zeevanCatalogContent";

/** Page header fallbacks (admin can override eyebrow/title/pageLead). */
export const ABOUT_PAGE_HEADER = {
  eyebrow: "Our story",
  title: "About Zeevan",
};

/** Stagger indices for SectionReveal — keeps scroll animation rhythm consistent. */
export const ABOUT_PAGE_ANIM = {
  header: 0,
  pullQuote: 1,
  intro: 2,
  gallery: 3,
  storyBlockStart: 4,
  values: 7,
  mission: 8,
  craft: 9,
  craftStepStart: 10,
  cta: 14,
  sidebarStats: 1,
  sidebarHighlights: 2,
  sidebarPillars: 3,
};

/** Story narrative blocks — rendered in order after gallery. */
export const ABOUT_STORY_BLOCKS = [
  {
    key: "heritage",
    dataKey: "heritage",
    icon: "layers-outline",
    preset: "fade-up",
  },
  {
    key: "bilona",
    dataKey: "bilona",
    icon: "flame-outline",
    preset: "fade-up",
  },
  {
    key: "origin",
    dataKey: "origin",
    icon: "home-outline",
    preset: "fade-up",
  },
];

/** Section labels — sidebar, story blocks, gallery. */
export const ABOUT_PAGE_SECTION_LABELS = {
  sidebarStats: "At a glance",
  sidebarPromise: "Range",
  sidebarPromiseTitle: "Four essentials",
  sidebarPillars: "Values",
  sidebarPillarsTitle: "What we stand for",
  storyValues: "Values",
  storyValuesTitle: "What guides us",
  storyGallery: "Gallery",
  storyGalleryTitle: "From our partners",
  missionDivider: "Mission",
  craftDivider: "Process",
};

export function buildAboutPageExtrasDefaults() {
  return {
    pageLead: ZEEVAN_CATALOG_TAGLINE,
    pullQuote: "Nothing rushed.\nNothing added.\nPure craft.",
    bodyContinued:
      "From Bilona ghee to cold-pressed tel, fresh masala and Haldar honey — we partner with small producers who share our standard for purity.",
    heritage: {
      eyebrow: "Range",
      title: "Four pillars of the pantry",
      body:
        "Ghee, tel, masala & Haldar honey — each line crafted with traditional methods and honest labels. No shortcuts, no fillers.",
    },
    bilona: {
      eyebrow: "Craft",
      title: "Traditional methods, modern delivery",
      body:
        "Bilona ghee, cold-pressed oils, small-batch masala, and raw honey — packed fresh and tracked live to your door.",
    },
    origin: {
      eyebrow: "Roots",
      title: "Born in Gujarat, for Indian kitchens",
      body:
        "Zeevan began with one idea: pantry essentials that taste like memory — honest, clear, and fairly priced.",
    },
    values: [
      {
        title: "Purity first",
        body: "Lab-tested batches and zero adulteration — the label matches the jar.",
      },
      {
        title: "Slow craft",
        body: "Traditional methods for ghee, tel, masala & honey cannot be rushed.",
      },
      {
        title: "Fair to farmers",
        body: "Direct sourcing from partners we know, with fair prices for producers.",
      },
      {
        title: "Transparent",
        body: "Live tracking, clear product pages, and support that responds.",
      },
    ],
    highlights: ZEEVAN_PRODUCT_LINES.map((line) => ({
      value: line.label,
      label: line.description,
      description: line.hero?.subtitle || line.description,
    })),
    sidebarStats: [
      { value: "4", label: "Product lines" },
      { value: "100%", label: "Pure ingredients" },
      { value: "Glass", label: "Fresh packing" },
      { value: "Live", label: "Order tracking" },
    ],
    mission: {
      eyebrow: "Mission",
      title: "Food that feels unmistakably real",
      paragraphs: [
        "Small-batch partners, honest labels, and ingredients you'd serve at your own table.",
        "Every order earns rewards, deliveries are tracked live, and every product page tells you exactly what you buy.",
      ],
    },
    pillars: [
      {
        id: "source",
        icon: "leaf-outline",
        title: "Thoughtful sourcing",
        body: "Ghee, tel, masala & honey from partners we trust.",
        enabled: true,
      },
      {
        id: "craft",
        icon: "flame-outline",
        title: "Slow craft",
        body: "Bilona ghee, cold-pressed tel, fresh-ground masala, raw honey.",
        enabled: true,
      },
      {
        id: "fair",
        icon: "heart-outline",
        title: "Fair pricing",
        body: "Premium quality without inflated markups. Rewards on every order.",
        enabled: true,
      },
      {
        id: "deliver",
        icon: "bicycle-outline",
        title: "Delivered with care",
        body: "Secure checkout, live tracking, and responsive support.",
        enabled: true,
      },
    ],
    craft: {
      eyebrow: "Process",
      title: "Farm to your kitchen",
      steps: [
        {
          id: "source",
          label: "01",
          title: "Source",
          body: "Pure ingredients from trusted farms, mills & apiaries.",
        },
        {
          id: "craft",
          label: "02",
          title: "Craft",
          body: "Small batches — ghee, tel, masala & Haldar honey.",
        },
        {
          id: "pack",
          label: "03",
          title: "Pack",
          body: "Sealed fresh with honest labels on every product.",
        },
        {
          id: "ship",
          label: "04",
          title: "Deliver",
          body: "Live tracking from our door to yours.",
        },
      ],
    },
    ctaBand: {
      title: "Shop the full range",
      body: `Browse ${ZEEVAN_CATALOG_SUBLINE} and earn rewards on your first order.`,
      ctaLabel: "Shop all",
      ctaSecondaryLabel: "Support",
    },
  };
}
