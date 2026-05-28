import React from "react";
import ProductCardInner from "../../productCard/ProductCardInner";

/**
 * Compact home-grid product card wrapper.
 * Keeps the home catalog implementation focused and replaceable.
 */
export default function ProductCardCompact(props: any) {
  return <ProductCardInner {...props} compact />;
}

