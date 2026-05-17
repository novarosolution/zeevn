import React, { memo } from "react";
import { Platform } from "react-native";
import { Image } from "expo-image";
import { buildResponsiveImageSources } from "../../utils/responsiveImage";

/**
 * Product imagery with web lazy-loading and optional LCP priority.
 */
function ProductImageBase({
  uri,
  style,
  contentFit = "cover",
  priority = false,
  lazy = true,
  transition = 0,
  onLoad,
  onError,
  cachePolicy = "memory-disk",
}) {
  const resolved = String(uri || "").trim();
  if (!resolved) return null;

  const { src, srcSet, sizes } = buildResponsiveImageSources(resolved);
  const webImageProps =
    Platform.OS === "web"
      ? {
          ...(priority ? { fetchPriority: "high" } : {}),
          ...(!priority && lazy ? { loading: "lazy" } : {}),
          ...(srcSet ? { srcSet, sizes } : {}),
        }
      : {};

  return (
    <Image
      source={{ uri: src || resolved }}
      style={style}
      contentFit={contentFit}
      transition={transition}
      cachePolicy={cachePolicy}
      onLoad={onLoad}
      onError={onError}
      {...webImageProps}
    />
  );
}

const ProductImage = memo(ProductImageBase);

export default ProductImage;
