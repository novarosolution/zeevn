/** Sort wishlist products; `ids` order = recently added (append order). */
export function sortWishlistProducts(products, sortId, ids = []) {
  const list = [...(products || [])];
  const rank = new Map(ids.map((id, i) => [String(id), i]));

  if (sortId === "priceAsc") {
    return list.sort((a, b) => Number(a?.price || 0) - Number(b?.price || 0));
  }
  if (sortId === "priceDesc") {
    return list.sort((a, b) => Number(b?.price || 0) - Number(a?.price || 0));
  }
  if (sortId === "nameAsc") {
    return list.sort((a, b) => String(a?.name || "").localeCompare(String(b?.name || "")));
  }
  return list.sort((a, b) => (rank.get(String(b.id)) ?? 0) - (rank.get(String(a.id)) ?? 0));
}
