import React from "react";
import { Platform, Pressable, StyleSheet } from "react-native";
import { APP_DISPLAY_NAME, BRAND_LOGO_SIZE } from "../constants/brand";
import BrandLogo from "./BrandLogo";

/**
 * Tappable logo; navigates Home (stack `navigation` or root `navigationRef`).
 */
export default function BrandHeaderMark({ navigation, navigationRef, compact = false }) {
  const goHome = () => {
    if (navigationRef?.isReady?.() && typeof navigationRef.navigate === "function") {
      navigationRef.navigate("Home");
      return;
    }
    navigation?.navigate?.("Home");
  };

  const size = compact ? BRAND_LOGO_SIZE.headerCompact : BRAND_LOGO_SIZE.headerDefault;

  return (
    <Pressable
      onPress={goHome}
      style={({ pressed }) => [
        styles.hit,
        pressed && { opacity: 0.85 },
        Platform.select({ web: { cursor: "pointer" }, default: {} }),
      ]}
      accessibilityRole="button"
      accessibilityLabel={`${APP_DISPLAY_NAME} — Home`}
      hitSlop={10}
    >
      <BrandLogo width={size} height={size} style={styles.logoMark} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  hit: {
    alignItems: "center",
    justifyContent: "center",
  },
  logoMark: {
    flexShrink: 0,
    marginVertical: 0,
  },
});
