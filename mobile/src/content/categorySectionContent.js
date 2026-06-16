/**
 * Shop by category — section copy, tile art & layout (`HomeCategoryCards`).
 * Product counts & API cover photos merge in `buildHomeCategories()`.
 */

import {
  ZEEVAN_CATALOG_SUBLINE,
  ZEEVAN_PRODUCT_LINES,
  buildHomeCategoryDefaults,
} from "./zeevanCatalogContent";

/** Section header + grid behaviour. */
export const CATEGORY_SECTION_UI = {
  eyebrow: "Collections",
  title: "Shop by category",
  titleFallback: "Shop by category",
  subtitle: "Four pantry lines — ghee, tel, masala & Haldar honey.",
  viewAllLabel: "View all",
  shopCta: "Shop",
  itemsSuffix: "items",
  browseLabel: "Explore",
  maxCoreTiles: 4,
  showExtraTiles: false,
  /** Icon tiles — compact height, not square. */
  iconsOnly: true,
  cardMinHeight: 168,
  cardMaxHeight: 192,
};

/** Per-line tile copy — icons come from `ZEEVAN_PRODUCT_LINES`. */
export const CATEGORY_TILE_CONFIG = {
  ghee: {
    tagline: "A2 Bilona ghee — golden & grainy",
    cta: "Shop ghee",
  },
  tel: {
    tagline: "Cold-pressed cooking oils",
    cta: "Shop tel",
  },
  masala: {
    tagline: "Small-batch spices & blends",
    cta: "Shop masala",
  },
  honey: {
    tagline: "Raw Haldar honey with haldi",
    cta: "Shop honey",
  },
};

export const CATEGORY_EXTRA_TILES = [
  {
    key: "gifts",
    label: "Gift Sets",
    icon: "gift-outline",
    gradient: ["#eef0e0", "#d8e0c8"],
    gradientDark: ["#1e2418", "#121810"],
    accent: "#5C6834",
    description: "Curated hampers",
    tagline: "Thoughtful gifts for every kitchen",
    cta: "Shop gifts",
    shopPill: "All",
  },
  {
    key: "new",
    label: "New Arrivals",
    icon: "sparkles-outline",
    gradient: ["#f4f0e4", "#e0e8d0"],
    gradientDark: ["#1a2018", "#121810"],
    accent: "#788844",
    description: "Latest from Zeevan",
    tagline: "Fresh drops from our farm partners",
    cta: "See new",
    shopPill: "New",
  },
];

export function getCategoryTileConfig(lineKey) {
  return CATEGORY_TILE_CONFIG[lineKey] || null;
}

export function getCategoryTileMeta(lineKey) {
  const line = ZEEVAN_PRODUCT_LINES.find((l) => l.key === lineKey);
  const tile = getCategoryTileConfig(lineKey);
  if (!line && !tile) return { tagline: "", cta: CATEGORY_SECTION_UI.shopCta };
  return {
    tagline: tile?.tagline || line?.hero?.subtitle || line?.description || "",
    cta: tile?.cta || line?.hero?.cta || `${CATEGORY_SECTION_UI.shopCta} ${line?.shopPill || ""}`.trim(),
    shopPill: line?.shopPill,
  };
}

export function getCategorySectionDefaults() {
  const core = buildHomeCategoryDefaults().filter((d) =>
    ZEEVAN_PRODUCT_LINES.some((line) => line.key === d.key)
  );
  if (!CATEGORY_SECTION_UI.showExtraTiles) return core;
  return [...core, ...CATEGORY_EXTRA_TILES];
}

export { ZEEVAN_CATALOG_SUBLINE, ZEEVAN_PRODUCT_LINES };
