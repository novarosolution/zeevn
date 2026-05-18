/**
 * Server product document → client-safe product shape (pricing, variants, PDP fields).
 */

export function normalizeProduct(raw) {
  const primaryImage =
    raw.image || (Array.isArray(raw.images) && raw.images.length ? raw.images[0] : "");

  const priceNum = Number(raw.price);
  const price = Number.isFinite(priceNum) && priceNum >= 0 ? priceNum : 0;

  const mrpNum = Number(raw.mrp);
  const mrp =
    Number.isFinite(mrpNum) && mrpNum > 0 ? mrpNum : null;

  const id = raw._id ?? raw.id;
  const name = String(raw.name ?? "").trim() || "Untitled product";
  const description = String(raw.description ?? "").trim();
  const unit = String(raw.unit ?? "").trim() || "1 pc";

  const variants = Array.isArray(raw.variants)
    ? raw.variants
        .map((v) => ({
          label: String(v?.label ?? "").trim(),
          price: Math.max(0, Number(v?.price) || 0),
        }))
        .filter((v) => v.label && Number.isFinite(v.price))
    : [];

  const usps = Array.isArray(raw.usps)
    ? raw.usps
        .map((b) => ({
          icon: String(b?.icon ?? "checkmark-circle-outline").trim() || "checkmark-circle-outline",
          title: String(b?.title ?? "").trim(),
          description: String(b?.description ?? "").trim(),
        }))
        .filter((b) => b.title || b.description)
    : [];

  const usageRituals = Array.isArray(raw.usageRituals)
    ? raw.usageRituals
        .map((b) => ({
          icon: String(b?.icon ?? "sunny-outline").trim() || "sunny-outline",
          title: String(b?.title ?? "").trim(),
          description: String(b?.description ?? "").trim(),
          image: String(b?.image ?? "").trim(),
          recipeUrl: String(b?.recipeUrl ?? b?.recipeLink ?? "").trim(),
        }))
        .filter((b) => b.title || b.description)
    : [];

  const sourcingRaw = raw.sourcing;
  const sourcing =
    sourcingRaw && typeof sourcingRaw === "object"
      ? {
          originRegion: String(sourcingRaw.originRegion ?? "").trim(),
          harvestDate: String(sourcingRaw.harvestDate ?? "").trim(),
          certifications: Array.isArray(sourcingRaw.certifications)
            ? sourcingRaw.certifications.map((c) => String(c ?? "").trim()).filter(Boolean)
            : [],
        }
      : undefined;

  const processSteps = Array.isArray(raw.processSteps)
    ? raw.processSteps.map((s) => String(s ?? "").trim()).filter(Boolean)
    : [];

  const media = Array.isArray(raw.media)
    ? raw.media
        .map((m) => ({
          type: String(m?.type || "image").toLowerCase() === "video" ? "video" : "image",
          url: String(m?.url ?? "").trim(),
          poster: String(m?.poster ?? "").trim(),
        }))
        .filter((m) => m.url)
    : [];

  const ratingAvg = Number(raw.ratingAverage);
  const reviewCt = Number(raw.reviewCount);

  return {
    ...raw,
    id,
    name,
    description,
    price,
    mrp,
    image: primaryImage,
    images:
      Array.isArray(raw.images) && raw.images.length
        ? raw.images
        : primaryImage
          ? [primaryImage]
          : [],
    category: String(raw.category ?? "").trim() || "General",
    homeSection: String(raw.homeSection ?? "").trim() || "Prime Products",
    productType: String(raw.productType ?? raw.category ?? "").trim() || "General",
    showOnHome: raw.showOnHome !== false,
    homeOrder: Number.isFinite(Number(raw.homeOrder)) ? Number(raw.homeOrder) : 0,
    brand: String(raw.brand ?? "").trim(),
    sku: String(raw.sku ?? "").trim(),
    unit,
    eta: raw.eta ? String(raw.eta).trim() : "",
    isSpecial: Boolean(raw.isSpecial),
    inStock: raw.inStock !== false,
    stockQty: Number.isFinite(Number(raw.stockQty)) ? Math.max(0, Number(raw.stockQty)) : 0,
    ratingAverage: Number.isFinite(ratingAvg) ? Math.min(5, Math.max(0, ratingAvg)) : 0,
    reviewCount: Number.isFinite(reviewCt) ? Math.max(0, Math.floor(reviewCt)) : 0,
    badgeText: String(raw.badgeText ?? "").trim(),
    lifestyleImage: String(raw.lifestyleImage ?? "").trim(),
    variants,
    usps,
    processTitle: String(raw.processTitle ?? "").trim(),
    processSteps,
    highlightQuote: String(raw.highlightQuote ?? "").trim(),
    highlightQuoteAttribution: String(raw.highlightQuoteAttribution ?? "").trim(),
    lifestyleCaption: String(raw.lifestyleCaption ?? "").trim(),
    processImage: String(raw.processImage ?? "").trim(),
    usageRituals,
    richProductPage: raw.richProductPage === true,
    media,
    ...(sourcing ? { sourcing } : {}),
  };
}
