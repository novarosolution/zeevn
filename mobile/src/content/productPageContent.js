/**
 * Product detail page — copy, line defaults & extra sections.
 * Admin/API fields win; line defaults fill gaps for ghee, tel, masala & honey.
 */

import { GHEE_PRODUCT_CONTENT } from "./gheeProductContent";
import {
  matchProductLine,
  resolveProductLineKey,
  ZEEVAN_PRODUCT_LINES,
} from "./zeevanCatalogContent";

/** PDP section labels & shared UI copy. */
export const PRODUCT_PAGE_UI = {
  specsEyebrow: "Details",
  specsTitle: "Product information",
  ingredientsEyebrow: "Ingredients",
  ingredientsTitle: "What's inside",
  storageEyebrow: "Care",
  storageTitle: "Storage & shelf life",
  usageEyebrow: "Usage",
  usageTitle: "How to use",
  processEyebrow: "Process",
  whyEyebrow: "Why Zeevan",
  whyTitle: "The Zeevan promise",
  shippingEyebrow: "Delivery",
  shippingTitle: "Shipping & returns",
  faqEyebrow: "FAQ",
  faqTitle: "Common questions",
  relatedEyebrow: "Catalog",
  relatedTitle: "You may also like",
  specLabels: {
    brand: "Brand",
    category: "Category",
    unit: "Unit",
    sku: "SKU",
    origin: "Origin",
  },
  brandDefault: "Zeevan",
  originDefault: "Gujarat, India",
};

const SHARED_DELIVERY = {
  title: "Free delivery",
  body: "On orders over ₹1,499 · Cash on Delivery available · Sealed for freshness, easy returns.",
};

const SHARED_SHIPPING = {
  title: "Fast, careful delivery",
  body: "Orders ship within 24–48 hours on business days. Live tracking in My Orders. Unopened items eligible for return within 7 days.",
  bullets: [
    "Tamper-evident sealing on every jar & bottle",
    "Insulated packing for ghee & honey in summer",
    "COD & secure online payment",
  ],
};

const SHARED_WHY = {
  title: "Rooted in Gujarat, made for India",
  body: "Zeevan works directly with farm partners — no middlemen, no shortcuts. Every product is traceable, honestly labelled, and crafted for everyday Indian kitchens.",
  chips: [
    { icon: "leaf-outline", label: "Farm sourced" },
    { icon: "shield-checkmark-outline", label: "Quality checked" },
    { icon: "heart-outline", label: "Family first" },
  ],
};

const SHARED_FAQ = [
  {
    q: "Is this product 100% pure?",
    a: "Yes — no artificial colours, flavours, or preservatives. Batch details are on every label.",
  },
  {
    q: "How should I store it after opening?",
    a: "Keep the lid tight, store away from direct sunlight, and use a clean dry spoon each time.",
  },
  {
    q: "Do you deliver across India?",
    a: "We deliver to most pincodes. Enter your location at checkout to confirm serviceability.",
  },
];

/** Per-line PDP marketing defaults (API/admin overrides always win). */
export const PRODUCT_LINE_PAGE_CONTENT = {
  ghee: {
    ...GHEE_PRODUCT_CONTENT,
    ingredients: {
      title: "Single ingredient purity",
      body: "100% A2 desi cow ghee — churned using the traditional Bilona method from curd (not cream). No additives, no blending, no vegetable fats.",
      tags: ["A2 milk", "Bilona churned", "Wood-fire clarified"],
    },
    storage: {
      title: "Store with care",
      body: "Best before 12 months from packed date. Store in a cool, dry place. Refrigeration optional — bring to room temperature before use for best aroma.",
    },
    usageRituals: [
      { icon: "sunny-outline", title: "Morning spoon", description: "One teaspoon on empty stomach — Ayurvedic wellness ritual." },
      { icon: "flame-outline", title: "Everyday cooking", description: "High smoke point — ideal for tadka, roti, and festive sweets." },
      { icon: "restaurant-outline", title: "For babies & elders", description: "Gentle A2 fat profile — trusted across generations." },
    ],
    processSteps: ["A2 milk from indigenous cows", "Curd set & cultured", "Hand-churned Bilona", "Slow wood-fire clarification", "Grain test & jar sealing"],
    processTitle: "From farm to jar",
    highlightQuote: "Golden, grainy, honest — the ghee your grandmother would recognise.",
    faq: [
      {
        q: "What makes A2 Bilona ghee different?",
        a: "A2 milk from desi cows is churned into butter and slow-clarified — giving the grainy texture and nutty aroma that industrial ghee lacks.",
      },
      {
        q: "Is it suitable for lactose-sensitive families?",
        a: "Ghee is clarified butter with milk solids removed — many lactose-sensitive people tolerate it well. Consult your doctor if unsure.",
      },
    ],
  },
  tel: {
    eyebrow: "Cold-pressed purity",
    trustChips: [
      { icon: "water-outline", label: "100% Natural" },
      { icon: "heart-outline", label: "Heart friendly" },
      { icon: "shield-checkmark-outline", label: "No preservatives" },
      { icon: "leaf-outline", label: "Cold pressed" },
    ],
    delivery: SHARED_DELIVERY,
    highlights: [
      "Wood-press / cold-press extraction — nutrients stay intact.",
      "High smoke point for everyday Indian cooking.",
      "No hexane, no refining chemicals, no blending.",
    ],
    legacy: {
      kick: "Pure cooking tel",
      title: "Pressed slow, bottled fresh",
      legend:
        "Zeevan tel is extracted from premium oilseeds using traditional cold-press methods — groundnut, mustard, or sesame depending on the variant. No heat damage, no adulteration, just honest oil for your kitchen.",
    },
    features: [
      { icon: "water-outline", title: "Cold pressed", subtitle: "Nutrients preserved" },
      { icon: "heart-outline", title: "Heart friendly", subtitle: "Good fats profile" },
      { icon: "leaf-outline", title: "100% natural", subtitle: "No chemicals" },
      { icon: "flask-outline", title: "Lab tested", subtitle: "Verified purity" },
    ],
    nutrition: {
      kick: "Nutrition",
      title: "Nutritional Facts",
      tableHead: "Per 100 ml",
      tableSub: "Approximate values — varies by oil type",
      rows: [
        { label: "Energy", value: "~884 kcal" },
        { label: "Total Fat", value: "~100 g" },
        { label: "Saturated Fat", value: "~15–20 g" },
        { label: "Monounsaturated", value: "~45–55 g" },
        { label: "Vitamin E", value: "Present" },
      ],
      card: {
        title: "Kitchen-ready tel",
        body: "Net quantity as labelled · Best before 9–12 months. Store upright, away from heat and sunlight.",
        tags: ["Cold pressed", "Single origin", "No adulteration"],
        footer: "FSSAI licensed · Packed by Zeevan, Gujarat.",
      },
    },
    ingredients: {
      title: "Single-source oil",
      body: "100% pure cold-pressed oil — groundnut, mustard, or sesame as labelled. No palm blending, no argemone, no added antioxidants.",
      tags: ["Non-GMO seeds", "First press", "Unrefined"],
    },
    storage: {
      title: "Keep oil fresh",
      body: "Store in a cool, dark place with the cap sealed. Do not reuse empty bottles for other liquids. Use within 3 months of opening for best flavour.",
    },
    usageRituals: [
      { icon: "flame-outline", title: "Tadka & frying", description: "Stable at high heat — perfect for Indian tempering." },
      { icon: "restaurant-outline", title: "Daily cooking", description: "Roti, sabzi, dal — replace refined oil entirely." },
      { icon: "fitness-outline", title: "Salad drizzle", description: "Unrefined tel adds nutty depth to dressings." },
    ],
    processSteps: ["Seed selection & cleaning", "Cold wood-press extraction", "Natural settling", "Filtered & bottled", "Batch quality check"],
    processTitle: "Seed to bottle",
    highlightQuote: "Health in every drop, taste in every meal.",
    faq: [
      {
        q: "Is this oil refined?",
        a: "No — Zeevan tel is cold-pressed and unrefined. You may notice natural sediment; that is a sign of purity.",
      },
      {
        q: "Can I use it for deep frying?",
        a: "Yes — cold-pressed groundnut and mustard oils have high smoke points suitable for Indian cooking.",
      },
    ],
    reviewsKick: "Customer Reviews",
    reviewsTitle: "What cooks are saying",
  },
  masala: {
    eyebrow: "Small-batch spices",
    trustChips: [
      { icon: "flame-outline", label: "Ground fresh" },
      { icon: "leaf-outline", label: "No fillers" },
      { icon: "sparkles-outline", label: "Aroma rich" },
      { icon: "shield-checkmark-outline", label: "Lab tested" },
    ],
    delivery: SHARED_DELIVERY,
    highlights: [
      "Whole spices sourced & ground in small batches.",
      "No added colour, starch, or anti-caking agents.",
      "Aroma you can smell before you open the pack.",
    ],
    legacy: {
      kick: "Fresh masala",
      title: "Spices that wake up your kitchen",
      legend:
        "Zeevan masala blends follow family recipes — whole spices roasted, ground, and packed quickly so the volatile oils that carry flavour never fade.",
    },
    features: [
      { icon: "flame-outline", title: "Small batch", subtitle: "Weekly grinding" },
      { icon: "leaf-outline", title: "Whole spices", subtitle: "Not pre-powdered stock" },
      { icon: "sparkles-outline", title: "No fillers", subtitle: "Pure blends only" },
      { icon: "home-outline", title: "Home style", subtitle: "Gujarati recipes" },
    ],
    ingredients: {
      title: "Clean label blends",
      body: "Whole spices only — coriander, cumin, red chilli, turmeric, and traditional blends as listed on pack. No added starch or artificial colour.",
      tags: ["Whole spice", "Roasted & ground", "No MSG"],
    },
    storage: {
      title: "Keep aroma locked in",
      body: "Store in airtight container after opening. Keep away from moisture and sunlight. Best used within 6 months of opening.",
    },
    usageRituals: [
      { icon: "restaurant-outline", title: "Daily sabzi", description: "Add to hot oil for full bloom of aroma." },
      { icon: "pizza-outline", title: "Marinades", description: "Mix with tel and lemon for tandoor-style prep." },
      { icon: "gift-outline", title: "Festive cooking", description: "Consistent blends for mithai & savoury alike." },
    ],
    processSteps: ["Whole spice sourcing", "Roasting on slow heat", "Cool & grind", "Sieve & blend", "Airtight packing"],
    processTitle: "Spice journey",
    highlightQuote: "If it doesn't smell alive in the packet, it isn't Zeevan masala.",
    faq: [
      {
        q: "Why does colour vary between batches?",
        a: "Natural spices vary by harvest season — we never add artificial colour to standardise appearance.",
      },
      {
        q: "Is there added salt?",
        a: "Only where labelled on the blend — most pure masalas are salt-free so you control seasoning.",
      },
    ],
    reviewsKick: "Customer Reviews",
    reviewsTitle: "Home cooks trust us",
  },
  honey: {
    eyebrow: "Raw Haldar honey",
    trustChips: [
      { icon: "flower-outline", label: "Raw & unfiltered" },
      { icon: "leaf-outline", label: "With haldi" },
      { icon: "shield-checkmark-outline", label: "No sugar syrup" },
      { icon: "sparkles-outline", label: "Immunity blend" },
    ],
    delivery: SHARED_DELIVERY,
    highlights: [
      "Raw forest honey — never heated above hive temperature.",
      "Infused with haldi (turmeric) for the Haldar wellness blend.",
      "No sugar syrup, no corn syrup, no artificial flavour.",
    ],
    legacy: {
      kick: "Haldar Honey",
      title: "Wellness in every spoon",
      legend:
        "Zeevan Haldar Honey combines raw honey with carefully sourced haldi — a golden daily ritual for immunity and warmth, rooted in Indian home remedies.",
    },
    features: [
      { icon: "flower-outline", title: "Raw honey", subtitle: "Unprocessed" },
      { icon: "leaf-outline", title: "Haldi infused", subtitle: "Haldar blend" },
      { icon: "water-outline", title: "No syrup", subtitle: "Pure nectar" },
      { icon: "heart-outline", title: "Daily wellness", subtitle: "Morning ritual" },
    ],
    nutrition: {
      kick: "Nutrition",
      title: "Nutritional Facts",
      tableHead: "Per 100 g",
      tableSub: "Approximate values",
      rows: [
        { label: "Energy", value: "~304 kcal" },
        { label: "Carbohydrates", value: "~82 g" },
        { label: "Sugars (natural)", value: "~80 g" },
        { label: "Protein", value: "~0.3 g" },
      ],
      card: {
        title: "Raw & real",
        body: "Crystallisation is natural in raw honey — warm gently to liquefy. Best before 18 months from packed date.",
        tags: ["Raw", "Unfiltered", "Haldi blend"],
        footer: "FSSAI licensed · Packed by Zeevan, Gujarat.",
      },
    },
    ingredients: {
      title: "Two-ingredient wellness",
      body: "Raw forest honey and turmeric (haldi). No added sugar, no artificial sweeteners, no preservatives.",
      tags: ["Raw honey", "Turmeric", "Unfiltered"],
    },
    storage: {
      title: "Honey care",
      body: "Store at room temperature. Crystallisation is natural — place jar in warm water to soften. Never microwave.",
    },
    usageRituals: [
      { icon: "sunny-outline", title: "Morning spoon", description: "One spoon in warm water with lemon — daily immunity." },
      { icon: "cafe-outline", title: "With milk", description: "Stir into haldi doodh before bed." },
      { icon: "nutrition-outline", title: "On toast & roti", description: "Natural sweetener for kids & elders." },
    ],
    processSteps: ["Forest & farm apiaries", "Cold extraction", "Haldi blending", "Coarse filter", "Glass jar packing"],
    processTitle: "Hive to jar",
    highlightQuote: "Raw, golden, honest — honey the way nature intended.",
    faq: [
      {
        q: "Why is my honey thick or crystallised?",
        a: "Raw honey naturally crystallises — it is a sign of purity, not spoilage. Warm gently to return to liquid form.",
      },
      {
        q: "Is Haldar Honey safe for children?",
        a: "Not recommended for infants under 1 year. For older children, start with small amounts.",
      },
    ],
    reviewsKick: "Customer Reviews",
    reviewsTitle: "Families love Haldar",
  },
};

/** Resolve Zeevan product line from catalog product. */
export function resolveProductLineFromProduct(product) {
  if (!product) return null;
  for (const line of ZEEVAN_PRODUCT_LINES) {
    if (matchProductLine(product, line.key)) return line.key;
  }
  return resolveProductLineKey(product.category || product.productType || product.name);
}

export function getProductLinePageContent(lineKey) {
  if (!lineKey) return null;
  return PRODUCT_LINE_PAGE_CONTENT[lineKey] || null;
}

export function getProductPageGlobalContent() {
  return {
    shipping: SHARED_SHIPPING,
    whyZeevan: SHARED_WHY,
    faq: SHARED_FAQ,
    ui: PRODUCT_PAGE_UI,
  };
}
