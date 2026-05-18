import React from "react";
import ProductCardInner from "./productCard/ProductCardInner";

/**
 * Product tile — layout split across `productCard/*` (styles, utils, inner).
 * @see docs/extraction-exceptions.md for files still &gt; 600 lines.
 */
export default function ProductCard(props) {
  return <ProductCardInner {...props} />;
}
