/**
 * Client-side product search helper (substring match name, category, type, brand, description).
 * @param {Array<Record<string, unknown>>} products
 * @param {string} q
 * @returns {typeof products}
 */
export function filterProductsByQuery(products, q) {
  if (!Array.isArray(products)) return [];
  const term = String(q || "").trim().toLowerCase();
  if (!term) return [...products];
  return products.filter((p) => {
    const name = String(p?.name || "").toLowerCase();
    const cat = String(p?.category || "").toLowerCase();
    const ptype = String(p?.productType || "").toLowerCase();
    const desc = String(p?.description || "").toLowerCase();
    const brand = String(p?.brand || "").toLowerCase();
    return (
      name.includes(term) ||
      cat.includes(term) ||
      ptype.includes(term) ||
      desc.includes(term) ||
      brand.includes(term)
    );
  });
}
