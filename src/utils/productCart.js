/**
 * Cart line identity: same product id + same variant = one line.
 */
export function cartLineKey(item) {
  const id = String(item?.id ?? item?.product ?? "");
  const v = String(item?.variantLabel ?? "").trim();
  return `${id}::${v}`;
}

/**
 * Build a cart-ready product from catalog data + optional variant label.
 * When variants exist and label is omitted, uses the first variant.
 */
export function productToCartLine(product, variantLabel) {
  const variants = Array.isArray(product?.variants) ? product.variants : [];
  const baseName = String(product?.name ?? "").trim();

  if (variants.length === 0) {
    return {
      ...product,
      variantLabel: "",
      price: Number(product?.price) || 0,
      name: baseName,
    };
  }

  const labelIn = String(variantLabel ?? "").trim();
  const v = labelIn
    ? variants.find((x) => String(x.label || "").trim() === labelIn) || variants[0]
    : variants[0];
  const lab = String(v?.label ?? "").trim();
  const p = Math.max(0, Number(v?.price) || 0);
  return {
    ...product,
    variantLabel: lab,
    price: p,
    name: lab ? `${baseName} — ${lab}` : baseName,
  };
}
