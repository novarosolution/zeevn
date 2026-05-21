import React from "react";
import { Platform } from "react-native";
import { Image } from "expo-image";

export default function AppImage({
  source,
  alt,
  decorative = false,
  style,
  contentFit = "cover",
  priority = false,
  ...rest
}) {
  if (!decorative && !alt) {
    throw new Error("AppImage requires `alt` text unless `decorative` is true.");
  }

  const accessibilityLabel = decorative ? undefined : alt;
  const accessibilityProps = decorative
    ? {
        accessible: false,
        accessibilityElementsHidden: true,
        importantForAccessibility: "no-hide-descendants",
      }
    : {
        accessible: true,
        accessibilityRole: "image",
        accessibilityLabel,
      };

  if (Platform.OS === "web" && typeof source === "string") {
    return (
      <img
        src={source}
        alt={decorative ? "" : alt}
        loading={priority ? "eager" : "lazy"}
        decoding={priority ? "sync" : "async"}
        fetchPriority={priority ? "high" : "auto"}
        style={style}
      />
    );
  }

  return (
    <Image
      source={source}
      style={style}
      contentFit={contentFit}
      priority={priority ? "high" : "normal"}
      {...accessibilityProps}
      {...rest}
    />
  );
}
