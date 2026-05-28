import React from "react";
import { Platform, StyleSheet, View } from "react-native";
import { Image } from "expo-image";

/**
 * expo-image on native; on web adds lazy loading + explicit box for CLS when `width`/`height` set.
 */
export default function OptimizedImage({
  source,
  width,
  height,
  priority = false,
  alt = "",
  contentFit = "cover",
  style,
  ...rest
}) {
  const hasBox = Number(width) > 0 && Number(height) > 0;
  const aspectRatio = hasBox ? width / height : undefined;

  if (Platform.OS === "web" && typeof source === "string") {
    return (
      <View style={[hasBox && { width, height, aspectRatio }, style]}>
        <img
          src={source}
          alt={alt}
          width={width}
          height={height}
          loading={priority ? "eager" : "lazy"}
          decoding={priority ? "sync" : "async"}
          fetchPriority={priority ? "high" : "auto"}
          style={{
            width: "100%",
            height: "100%",
            objectFit: contentFit === "contain" ? "contain" : "cover",
            display: "block",
          }}
        />
      </View>
    );
  }

  return (
    <View style={[hasBox && { width, height, aspectRatio, overflow: "hidden" }, style]}>
      <Image
        source={source}
        contentFit={contentFit}
        transition={priority ? 0 : 200}
        priority={priority ? "high" : "normal"}
        recyclingKey={typeof source === "string" ? source : undefined}
        style={hasBox ? StyleSheet.absoluteFill : { width: "100%", height: "100%" }}
        accessibilityLabel={alt || undefined}
        {...rest}
      />
    </View>
  );
}
