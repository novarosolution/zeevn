import React from "react";
import { View } from "react-native";
import LogoSvg from "../../SVG.svg";
import { APP_DISPLAY_NAME } from "../constants/brand";

/**
 * Square brand mark from repo-root `SVG.svg` (square viewBox; scales uniformly).
 */
export default function BrandLogo({ width = 50, height = 50, style }) {
  return (
    <View
      style={[{ width, height, alignItems: "center", justifyContent: "center", overflow: "hidden" }, style]}
      accessibilityRole="image"
      accessibilityLabel={APP_DISPLAY_NAME}
    >
      <LogoSvg width={width} height={height} preserveAspectRatio="xMidYMid meet" />
    </View>
  );
}
