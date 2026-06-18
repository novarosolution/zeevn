import React from "react";
import ProgressiveImage from "./ProgressiveImage";

/** Web catalog tile — smaller delivery width for faster grid paint. */
export default function ProgressiveProductImage({
  uri,
  previewUri = "",
  style,
  className,
  contentFit = "cover",
  onError,
  priority = "normal",
  recyclingKey,
  rounded = 14,
  showSkeleton = true,
}) {
  if (!uri) return null;

  return (
    <ProgressiveImage
      uri={uri}
      previewSource={previewUri || undefined}
      style={style}
      className={className}
      contentFit={contentFit}
      onError={onError}
      priority={priority}
      recyclingKey={recyclingKey || uri}
      rounded={rounded}
      showSkeleton={showSkeleton && priority === "high"}
      width={360}
      quality="auto:eco"
    />
  );
}
