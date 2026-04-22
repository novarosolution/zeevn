/**
 * Resolve display name, server-validated price, and variant label for cart/order lines.
 * When a product has variants, price always comes from the matching variant row in DB.
 */

function normalizeVariants(matchedProduct) {
  const raw = Array.isArray(matchedProduct?.variants) ? matchedProduct.variants : [];
  return raw
    .filter((v) => v && String(v.label || "").trim())
    .map((v) => ({
      label: String(v.label).trim(),
      price: Math.max(0, Number(v.price) || 0),
    }));
}

function resolveProductLineFromRaw(matchedProduct, rawItem) {
  const baseName = String(matchedProduct.name || "").trim();
  const variants = normalizeVariants(matchedProduct);

  if (variants.length === 0) {
    return {
      name: baseName,
      price: Math.max(0, Number(matchedProduct.price) || 0),
      variantLabel: "",
    };
  }

  const labelIn = String(rawItem.variantLabel ?? rawItem.variant ?? "").trim();

  if (labelIn) {
    const v = variants.find((x) => x.label === labelIn);
    if (!v) {
      const err = new Error("Invalid variant for one or more products.");
      err.statusCode = 400;
      throw err;
    }
    return {
      name: `${baseName} — ${labelIn}`,
      price: v.price,
      variantLabel: labelIn,
    };
  }

  const clientPrice = Number(rawItem.price);
  const byPrice = variants.filter((v) => v.price === clientPrice);
  if (byPrice.length === 1) {
    const v = byPrice[0];
    return {
      name: `${baseName} — ${v.label}`,
      price: v.price,
      variantLabel: v.label,
    };
  }

  const first = variants[0];
  return {
    name: `${baseName} — ${first.label}`,
    price: first.price,
    variantLabel: first.label,
  };
}

module.exports = {
  resolveProductLineFromRaw,
  normalizeVariants,
};
