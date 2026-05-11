import React from "react";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { APP_DISPLAY_NAME, APP_WORDMARK_SUBLINE } from "../constants/brand";
import BrandWordmark from "./BrandWordmark";
import { useTheme } from "../context/ThemeContext";
import { fonts, typography } from "../theme/tokens";

/**
 * Tappable logo; navigates Home (stack `navigation` or root `navigationRef`).
 */
export default function BrandHeaderMark({
  navigation,
  navigationRef,
  compact = false,
  showSubline = false,
}) {
  const { colors: c } = useTheme();
  const goHome = () => {
    if (navigationRef?.isReady?.() && typeof navigationRef.navigate === "function") {
      navigationRef.navigate("Home");
      return;
    }
    navigation?.navigate?.("Home");
  };

  const sizeKey = compact ? "headerCompact" : "headerDefault";

  return (
    <Pressable
      onPress={goHome}
      style={({ pressed, hovered }) => [
        styles.hit,
        hovered && Platform.OS === "web" ? styles.hitHover : null,
        pressed && { opacity: 0.85 },
        Platform.select({ web: { cursor: "pointer" }, default: {} }),
      ]}
      accessibilityRole="button"
      accessibilityLabel={`${APP_DISPLAY_NAME} — Home`}
      hitSlop={10}
    >
      <View style={styles.stack}>
        <BrandWordmark sizeKey={sizeKey} style={styles.logoMark} />
        {showSubline && !compact ? (
          <Text style={[styles.subline, { color: c.textMuted }]} numberOfLines={1}>
            {APP_WORDMARK_SUBLINE}
          </Text>
        ) : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  hit: {
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 999,
    ...Platform.select({
      web: {
        transition: "opacity 0.18s ease, transform 0.18s ease",
      },
      default: {},
    }),
  },
  hitHover: {
    ...Platform.select({
      web: {
        transform: [{ translateY: -1 }],
      },
      default: {},
    }),
  },
  stack: {
    alignItems: "flex-start",
    gap: 2,
  },
  logoMark: {
    flexShrink: 0,
    marginVertical: 0,
  },
  subline: {
    fontSize: typography.overline,
    fontFamily: fonts.extrabold,
    letterSpacing: 1.2,
    textTransform: "uppercase",
    marginLeft: 1,
  },
});
