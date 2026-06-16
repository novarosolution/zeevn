/**
 * Zeevan product catalog — single source for ghee, tel, masala & Haldar honey.
 * Import here for home, shop, about, hero, and category UI (not ghee-only).
 */

export const ZEEVAN_CATALOG_TAGLINE = "Ghee, tel, masala & honey — pure heritage delivered";
export const ZEEVAN_CATALOG_SUBLINE = "Ghee · Tel · Masala · Honey";
export const ZEEVAN_SEARCH_PLACEHOLDER = "Search ghee, tel, masala, honey…";

/** Core product lines shown on home, shop filters, and hero. */
export const ZEEVAN_PRODUCT_LINES = [
  {
    key: "ghee",
    label: "Ghee",
    shopPill: "Ghee",
    aliases: ["ghee", "bilona", "a2", "a2 ghee", "pure ghee", "desi ghee"],
    icon: "nutrition-outline",
    description: "A2 Bilona ghee",
    gradient: ["#eef0e0", "#d8e0c8"],
    gradientDark: ["#1e2418", "#121810"],
    accent: "#5C6834",
    hero: {
      title: "Pure Bilona ghee",
      subtitle: "Hand-churned A2 ghee — golden, grainy, honest.",
      badge: "A2 · Bilona",
      cta: "Shop ghee",
    },
  },
  {
    key: "tel",
    label: "Tel",
    shopPill: "Tel",
    aliases: ["tel", "oil", "tel oil", "cooking oil", "mustard", "sarson", "groundnut"],
    icon: "water-outline",
    description: "Cold-pressed tel",
    gradient: ["#eef2e4", "#d4dcc8"],
    gradientDark: ["#1a2018", "#101814"],
    accent: "#788844",
    hero: {
      title: "Pure cooking tel",
      subtitle: "Traditional oils — cold-pressed, kitchen-ready.",
      badge: "Pure · Natural",
      cta: "Shop tel",
    },
  },
  {
    key: "masala",
    label: "Masala",
    shopPill: "Masala",
    aliases: ["masala", "march", "marcha", "spice", "spices", "blend", "masala march"],
    icon: "flame-outline",
    description: "Spices & blends",
    gradient: ["#f8f0e0", "#e8dcc8"],
    gradientDark: ["#28221a", "#161410"],
    accent: "#BC905C",
    hero: {
      title: "Fresh masala",
      subtitle: "Small-batch spices — aroma you can taste.",
      badge: "Ground fresh",
      cta: "Shop masala",
    },
  },
  {
    key: "honey",
    label: "Haldar Honey",
    shopPill: "Honey",
    aliases: ["honey", "haldar", "haldar honey", "haldi", "turmeric honey", "raw honey"],
    icon: "flower-outline",
    description: "Haldar honey",
    gradient: ["#f8f0e0", "#edd4a8"],
    gradientDark: ["#2a2418", "#161410"],
    accent: "#DCAC74",
    hero: {
      title: "Haldar Honey",
      subtitle: "Raw honey with haldi — wellness in every spoon.",
      badge: "Raw · Natural",
      cta: "Shop honey",
    },
  },
];

export const ZEEVAN_SHOP_COLLECTION_PILLS = ["All", ...ZEEVAN_PRODUCT_LINES.map((l) => l.shopPill)];

export const ZEEVAN_TRUST_STRIP = [
  { key: "pure", label: "100% Pure", icon: "shield-checkmark-outline" },
  { key: "lines", label: ZEEVAN_CATALOG_SUBLINE, icon: "grid-outline" },
  { key: "track", label: "Live tracking", icon: "bicycle-outline" },
];

export const ZEEVAN_HOME_MARQUEE = [
  "Pure ghee",
  "Cold-pressed tel",
  "Fresh masala",
  "Haldar honey",
  "Secure checkout",
  "Live tracking",
];

/** Default home category tiles — four lines + gifts & new. */
export function buildHomeCategoryDefaults() {
  const core = ZEEVAN_PRODUCT_LINES.map((line) => ({
    key: line.key,
    label: line.label,
    icon: line.icon,
    gradient: line.gradient,
    gradientDark: line.gradientDark,
    accent: line.accent,
    description: line.description,
  }));
  return [
    ...core,
    {
      key: "gifts",
      label: "Gift Sets",
      icon: "gift-outline",
      gradient: ["#eef0e0", "#d8e0c8"],
      gradientDark: ["#1e2418", "#121810"],
      accent: "#5C6834",
      description: "Curated hampers",
    },
    {
      key: "new",
      label: "New Arrivals",
      icon: "sparkles-outline",
      gradient: ["#f4f0e4", "#e0e8d0"],
      gradientDark: ["#1a2018", "#121810"],
      accent: "#788844",
      description: "Latest from Zeevan",
    },
  ];
}

export function getProductLineByKey(key) {
  return ZEEVAN_PRODUCT_LINES.find((line) => line.key === key) || null;
}

export function resolveProductLineKey(rawLabel) {
  const value = String(rawLabel || "").trim().toLowerCase();
  if (!value) return null;
  for (const line of ZEEVAN_PRODUCT_LINES) {
    if (line.key === value || line.label.toLowerCase() === value) return line.key;
    if (line.aliases.some((alias) => value.includes(alias) || alias.includes(value))) {
      return line.key;
    }
  }
  return null;
}

/** Match catalog product to a Zeevan line (category, type, name, tags). */
export function matchProductLine(product, lineKey) {
  const line = getProductLineByKey(lineKey);
  if (!line || !product) return false;
  const haystack = [
    product.category,
    product.productType,
    product.name,
    product.title,
    ...(Array.isArray(product.tags) ? product.tags : []),
  ]
    .map((v) => String(v || "").toLowerCase())
    .join(" ");
  return line.aliases.some((alias) => haystack.includes(alias));
}

export function matchProductLinePill(product, pill) {
  if (!pill || pill === "All") return true;
  const keyMap = {
    Ghee: "ghee",
    Tel: "tel",
    Masala: "masala",
    Honey: "honey",
  };
  const lineKey = keyMap[pill];
  if (lineKey) return matchProductLine(product, lineKey);
  return false;
}
