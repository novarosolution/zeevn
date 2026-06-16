import { PRODUCT_SCREEN } from "../content/appContent";
import {
  getProductLinePageContent,
  getProductPageGlobalContent,
  resolveProductLineFromProduct,
} from "../content/productPageContent";

function pickString(productVal, fallback = "") {
  const v = String(productVal ?? "").trim();
  return v || fallback;
}

function pickArray(productArr, fallbackArr = []) {
  if (Array.isArray(productArr) && productArr.length) return productArr;
  return fallbackArr;
}

function normalizeCopy(value) {
  return String(value ?? "")
    .trim()
    .replace(/\s+/g, " ")
    .toLowerCase();
}

function mapUspsToFeatures(usps = []) {
  return usps.slice(0, 4).map((usp) => ({
    icon: String(usp?.icon || "sparkles-outline").trim() || "sparkles-outline",
    title: String(usp?.title || "").trim(),
    subtitle: String(usp?.description || "").trim(),
  }));
}

function hasNutritionData(nutrition) {
  if (!nutrition) return false;
  return Boolean(
    nutrition.rows?.length ||
      nutrition.cardTitle ||
      nutrition.cardBody ||
      nutrition.cardFooter ||
      nutrition.title
  );
}

function buildSpecs(product, lineDefaults, ui) {
  const line = resolveProductLineFromProduct(product);
  const lineMeta = line ? getProductLinePageContent(line) : null;
  const rows = [
    { key: "brand", label: ui.specLabels.brand, value: pickString(product?.brand, ui.brandDefault) },
    {
      key: "category",
      label: ui.specLabels.category,
      value: pickString(product?.category || product?.productType, lineMeta?.eyebrow || PRODUCT_SCREEN.categoryFallback),
    },
    { key: "unit", label: ui.specLabels.unit, value: pickString(product?.unit, PRODUCT_SCREEN.unitFallback) },
    product?.sku ? { key: "sku", label: ui.specLabels.sku, value: String(product.sku) } : null,
    { key: "origin", label: ui.specLabels.origin, value: ui.originDefault },
  ].filter(Boolean);
  return rows.length ? rows : [];
}

/**
 * Merge product DB fields with Zeevan line defaults (ghee, tel, masala, honey).
 * Product/admin values always win when present.
 */
export function resolveProductPageContent(product, { shelfMatch = false, lineKey: lineKeyOverride } = {}) {
  const detectedLine = lineKeyOverride || resolveProductLineFromProduct(product);
  const lineDefaults =
    getProductLinePageContent(detectedLine) ||
    (shelfMatch ? getProductLinePageContent("ghee") : null);
  const global = getProductPageGlobalContent();
  const ui = global.ui;
  const description = String(product?.description ?? "").trim();

  const trustChips = pickArray(product?.trustChips, lineDefaults?.trustChips || []);
  const highlights = pickArray(product?.highlights, lineDefaults?.highlights || []);

  const delivery =
    product?.deliveryTitle || product?.deliveryBody
      ? {
          title: pickString(product.deliveryTitle, "Delivery"),
          body: pickString(product.deliveryBody),
        }
      : lineDefaults?.delivery ||
        (product?.eta ? { title: "Delivery", body: String(product.eta) } : null);

  const storyLegend = pickString(product?.storyLegend, lineDefaults?.legacy?.legend || "");
  const story = {
    kick: pickString(product?.storyKick, lineDefaults?.legacy?.kick || PRODUCT_SCREEN.storyOverline),
    title: pickString(product?.storyTitle, lineDefaults?.legacy?.title || PRODUCT_SCREEN.storyTitle),
    legend: storyLegend,
  };
  const showStoryLegend =
    Boolean(storyLegend) && normalizeCopy(storyLegend) !== normalizeCopy(description);

  const usps = Array.isArray(product?.usps) ? product.usps.filter(Boolean) : [];
  const featureCards =
    usps.length >= 1 ? mapUspsToFeatures(usps) : pickArray(lineDefaults?.features, []);

  const nutritionRaw = product?.nutrition;
  const nutrition = hasNutritionData(nutritionRaw)
    ? {
        kick: pickString(nutritionRaw.kick, lineDefaults?.nutrition?.kick || "Nutrition"),
        title: pickString(nutritionRaw.title, lineDefaults?.nutrition?.title || "Nutritional Facts"),
        tableHead: pickString(nutritionRaw.tableHead, lineDefaults?.nutrition?.tableHead || "Per 100 g"),
        tableSub: pickString(nutritionRaw.tableSub, lineDefaults?.nutrition?.tableSub || ""),
        rows: pickArray(nutritionRaw.rows, lineDefaults?.nutrition?.rows || []),
        card: {
          title: pickString(nutritionRaw.cardTitle, lineDefaults?.nutrition?.card?.title || ""),
          body: pickString(nutritionRaw.cardBody, lineDefaults?.nutrition?.card?.body || ""),
          tags: pickArray(nutritionRaw.cardTags, lineDefaults?.nutrition?.card?.tags || []),
          footer: pickString(nutritionRaw.cardFooter, lineDefaults?.nutrition?.card?.footer || ""),
        },
      }
    : lineDefaults?.nutrition
      ? {
          kick: lineDefaults.nutrition.kick,
          title: lineDefaults.nutrition.title,
          tableHead: lineDefaults.nutrition.tableHead,
          tableSub: lineDefaults.nutrition.tableSub,
          rows: lineDefaults.nutrition.rows,
          card: lineDefaults.nutrition.card,
        }
      : null;

  const reviewsSection = {
    kick: pickString(product?.reviewsKick, lineDefaults?.reviewsKick || PRODUCT_SCREEN.reviewsOverline),
    title: pickString(product?.reviewsTitle, lineDefaults?.reviewsTitle || PRODUCT_SCREEN.reviewsTitle),
  };

  const eyebrow = pickString(
    product?.pageEyebrow,
    lineDefaults?.eyebrow || product?.badgeText || product?.category || PRODUCT_SCREEN.categoryFallback
  );

  const usageRituals = pickArray(product?.usageRituals, lineDefaults?.usageRituals || []);
  const processSteps = pickArray(product?.processSteps, lineDefaults?.processSteps || []);
  const processTitle = pickString(product?.processTitle, lineDefaults?.processTitle || ui.processEyebrow);
  const highlightQuote = pickString(product?.highlightQuote, lineDefaults?.highlightQuote || "");

  const ingredients = lineDefaults?.ingredients || null;
  const storage = lineDefaults?.storage || null;
  const shipping = global.shipping;
  const whyZeevan = global.whyZeevan;
  const faq = pickArray(lineDefaults?.faq, global.faq);

  const specs = buildSpecs(product, lineDefaults, ui);

  const hasDbStory =
    product?.storyKick ||
    product?.storyTitle ||
    product?.storyLegend ||
    product?.highlightQuote ||
    product?.lifestyleImage ||
    product?.usageRituals?.length ||
    product?.usps?.length;

  const showStorySection = Boolean(
    lineDefaults ||
    shelfMatch ||
    product?.richProductPage ||
    hasDbStory ||
    featureCards.length > 0
  );

  const showRichExtras = Boolean(
    highlightQuote ||
    processSteps.length ||
    usageRituals.length ||
    product?.lifestyleImage ||
    (product?.richProductPage && (product?.highlightQuote || product?.processSteps?.length))
  );

  return {
    lineKey: detectedLine,
    ui,
    eyebrow,
    lead: description,
    trustChips,
    highlights,
    delivery,
    story,
    showStoryLegend,
    featureCards,
    nutrition,
    reviewsSection,
    showStorySection,
    showNutritionSection: Boolean(nutrition),
    usageRituals,
    processSteps,
    processTitle,
    highlightQuote,
    ingredients,
    storage,
    shipping,
    whyZeevan,
    faq,
    specs,
    showRichExtras,
    showSpecs: specs.length > 0,
    showIngredients: Boolean(ingredients?.body),
    showStorage: Boolean(storage?.body),
    showShipping: Boolean(shipping?.body),
    showWhyZeevan: Boolean(whyZeevan?.body),
    showFaq: faq.length > 0,
  };
}
