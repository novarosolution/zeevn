import React from "react";
import ProductCardInner from "../../productCard/ProductCardInner";

/**
 * Horizontal-rail product card wrapper (reorder/deals).
 * Shared card contract for carousel surfaces.
 */
export default function ProductCardCarousel(props: any) {
  return <ProductCardInner {...props} compact />;
}

