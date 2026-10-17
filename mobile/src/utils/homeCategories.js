import {
  CATEGORY_SECTION_UI,
  getCategorySectionDefaults,
  getCategoryTileMeta,
} from "../content/categorySectionContent";
import {
  getProductLineByKey,
  matchProductLine,
  resolveProductLineKey,
} from "../content/zeevanCatalogContent";
import { getHomeLineImage } from "../content/homeLineImages";

function countForLine(products, lineKey) {
  return products.filter((p) => matchProductLine(p, lineKey)).length;
}

function buildCategoryTile(def, products) {
  const line = getProductLineByKey(def.key);
  const meta = getCategoryTileMeta(def.key);
  const count = line ? countForLine(products, def.key) : 0;
  const lineKey = def.key;

  return {
    key: def.key,
    label: line?.label || def.label,
    count,
    gradient: def.gradient,
    gradientDark: def.gradientDark,
    icon: def.icon,
    image: getHomeLineImage(def.imageKey || lineKey),
    accent: def.accent,
    description: def.description,
    tagline: meta.tagline,
    cta: meta.cta,
    shopPill: meta.shopPill || line?.shopPill,
    lineKey,
  };
}

/**
 * Build home/shop category tiles — always the four Zeevan lines first, merged with API counts & covers.
 */
export function buildHomeCategories(products = [], { max } = {}) {
  const safe = Array.isArray(products) ? products : [];
  const cap = max ?? CATEGORY_SECTION_UI.maxCoreTiles ?? 4;
  const defs = getCategorySectionDefaults().slice(0, cap);
  return defs.map((def) => buildCategoryTile(def, safe));
}
export function buildHomeCategoriesFromApiLabels(products = [], { max = 6 } = {}) {
  const safe = Array.isArray(products) ? products : [];
  const labels = [
    ...new Set(
      safe.map((p) => String(p.category || p.productType || "").trim()).filter(Boolean)
    ),
  ];

  if (!labels.length) return buildHomeCategories(safe, { max });

  const defaults = getCategorySectionDefaults();
  const mapLabel = (label, index) => {
    const resolvedKey = resolveProductLineKey(label);
    const lineDef = resolvedKey ? getProductLineByKey(resolvedKey) : null;
    const def =
      (lineDef && defaults.find((d) => d.key === lineDef.key)) ||
      defaults.find(
        (d) => d.label.toLowerCase() === label.toLowerCase() || d.key === label.toLowerCase()
      ) ||
      defaults[index % defaults.length];
    const meta = getCategoryTileMeta(def.key);
    const count = safe.filter(
      (p) => String(p.category || p.productType || "").trim() === label
    ).length;
    const lineKey = lineDef?.key || def.key;

    return {
      key: `${def.key}-${label}`,
      label: lineDef?.label || label,
      count,
      gradient: def.gradient,
      gradientDark: def.gradientDark,
      icon: def.icon,
      image: getHomeLineImage(lineKey),
      accent: def.accent,
      description: def.description,
      tagline: meta.tagline,
      cta: meta.cta,
      shopPill: lineDef?.shopPill || meta.shopPill,
      lineKey,
    };
  };

  return labels.slice(0, max).map(mapLabel);
}

/** Shop navigation params for a category tile label. */
export function getShopNavParamsForLabel(label) {
  const lineKey = resolveProductLineKey(label);
  const line = lineKey ? getProductLineByKey(lineKey) : null;
  if (line?.shopPill) return { pill: line.shopPill };
  return { category: label };
}

/** Shape for `NativeCategoryRow` tiles. */
export function buildNativeCategoryTiles(products = [], { max = 6 } = {}) {
  return buildHomeCategories(products, { max }).map((cat) => ({
    key: cat.key,
    label: cat.label,
    icon: cat.icon,
    colors: cat.gradient,
    colorsDark: cat.gradientDark || cat.gradient,
    accent: cat.accent,
    lineKey: cat.lineKey,
  }));
}
