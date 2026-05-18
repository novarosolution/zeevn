import React from "react";
import { Platform, StyleSheet, View } from "react-native";
import { HERO_ASPECT_RATIO, HERO_INTRINSIC_HEIGHT, HERO_INTRINSIC_WIDTH } from "../../constants/heroLcp.web";

/**
 * Web-only LCP-friendly `<img>` with explicit dimensions, fetchpriority, and srcset.
 */
export default function WebLcpImage({
  src,
  srcSet,
  sizes = "100vw",
  alt = "",
  width = HERO_INTRINSIC_WIDTH,
  height = HERO_INTRINSIC_HEIGHT,
  priority = false,
  lazy = false,
  style,
  className,
}) {
  if (Platform.OS !== "web") return null;

  const flat = StyleSheet.flatten(style) || {};
  const w = flat.width ?? width;
  const h = flat.height ?? height;

  return (
    <View style={[styles.wrap, style, { aspectRatio: width / height }]}>
      <img
        src={src}
        srcSet={srcSet || undefined}
        sizes={srcSet ? sizes : undefined}
        alt={alt}
        width={typeof w === "number" ? w : HERO_INTRINSIC_WIDTH}
        height={typeof h === "number" ? h : HERO_INTRINSIC_HEIGHT}
        decoding={priority ? "sync" : "async"}
        loading={lazy ? "lazy" : "eager"}
        fetchPriority={priority ? "high" : "auto"}
        className={className}
        style={{
          ...styles.img,
          width: "100%",
          height: "100%",
          objectFit: flat.objectFit || "cover",
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: "100%",
    overflow: "hidden",
    backgroundColor: "#0E1729",
  },
  img: {
    display: "block",
  },
});

export { HERO_ASPECT_RATIO };
