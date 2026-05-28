import React from "react";
import { Image } from "expo-image";
import { Platform, StyleSheet } from "react-native";

/**
 * Image inside a labeled control — hidden from the accessibility tree on web.
 */
export default function DecorativeExpoImage({
  source,
  style,
  contentFit = "cover",
  transition,
  onError,
  onLoad,
  recyclingKey: _recyclingKey,
  priority: _priority,
  ...rest
}) {
  if (Platform.OS === "web") {
    const uri = typeof source === "string" ? source : source?.uri;
    const flat = StyleSheet.flatten(style) || {};
    if (!uri) return null;
    return (
      <img
        src={uri}
        alt=""
        aria-hidden="true"
        onError={onError}
        onLoad={onLoad}
        style={{
          objectFit: flat.objectFit || contentFit,
          width: flat.width,
          height: flat.height,
          ...flat,
        }}
        {...rest}
      />
    );
  }

  return (
    <Image
      source={source}
      style={style}
      contentFit={contentFit}
      transition={transition}
      accessible={false}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      {...rest}
    />
  );
}
