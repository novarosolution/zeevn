function getRatingMeta(product) {
  const rawRating = Number(product?.rating ?? product?.avgRating ?? product?.averageRating ?? product?.stars);
  const rawReviews = Number(product?.reviewCount ?? product?.reviewsCount ?? product?.numReviews ?? product?.ratingsCount);
  const hasRating = Number.isFinite(rawRating) && rawRating > 0;
  return {
    rating: hasRating ? rawRating.toFixed(1) : "",
    reviewCount: Number.isFinite(rawReviews) && rawReviews > 0 ? Math.round(rawReviews) : 0,
  };
}

function getProductDisplayName(product) {
  const name = String(product?.name || "").trim() || "Product";
  const unit = String(product?.unit || product?.size || "").trim();
  if (!unit) return name;
  const normalizedName = name.toLowerCase();
  const normalizedUnit = unit.toLowerCase();
  if (normalizedName.includes(normalizedUnit)) return name;
  return `${name} ${unit}`;
}

function isWithinDays(value, days) {
  if (!value) return false;
  const created = new Date(value).getTime();
  if (!Number.isFinite(created)) return false;
  const now = Date.now();
  return now - created <= days * 24 * 60 * 60 * 1000;
}

function getCardA11yLabel({ brand, name, rating, price, mrp, outOfStock }) {
  const parts = [brand, name];
  if (rating) {
    parts.push(`${rating} stars`);
  }
  parts.push(price);
  if (mrp) {
    parts.push(`was ${mrp}`);
  }
  if (outOfStock) {
    parts.push("out of stock");
  }
  return parts.filter(Boolean).join(", ");
}

function getCategoryTone(rawCategory, isDark, editorial, c) {
  const key = String(rawCategory || "").toLowerCase();
  const editorialLight = {
    cardBg: c.surface,
    cardBorder: c.border,
    imageWrapBg: c.surfaceMuted,
    imageBoxBg: c.surface,
    imageBoxBorder: c.border,
  };
  const editorialDark = {
    cardBg: c.surface,
    cardBorder: c.border,
    imageWrapBg: c.surfaceMuted,
    imageBoxBg: c.surfaceMuted,
    imageBoxBorder: c.borderStrong,
  };
  if (editorial && !isDark) {
    return editorialLight;
  }
  if (editorial && isDark) {
    return editorialDark;
  }
  if (isDark) {
    return editorialDark;
  }
  const neutral = {
    cardBg: c.surface,
    cardBorder: c.border,
    imageWrapBg: "rgba(248, 250, 252, 0.96)",
    imageBoxBg: c.surface,
    imageBoxBorder: c.border,
  };
  const redShelf = {
    cardBg: c.primarySoft,
    cardBorder: c.primaryBorder,
    imageWrapBg: "rgba(254, 242, 242, 0.94)",
    imageBoxBg: c.surface,
    imageBoxBorder: c.primaryBorder,
  };
  const slateShelf = {
    cardBg: c.secondarySoft,
    cardBorder: c.secondaryBorder,
    imageWrapBg: "rgba(241, 245, 249, 0.95)",
    imageBoxBg: c.surface,
    imageBoxBorder: c.secondaryBorder,
  };
  if (key.includes("fruit") || key.includes("vegetable")) {
    return redShelf;
  }
  if (key.includes("snack") || key.includes("bakery")) {
    return slateShelf;
  }
  if (key.includes("dairy") || key.includes("beverage") || key.includes("drink")) {
    return neutral;
  }
  return neutral;
}

export {
  getRatingMeta,
  getProductDisplayName,
  isWithinDays,
  getCardA11yLabel,
  getCategoryTone,
};
