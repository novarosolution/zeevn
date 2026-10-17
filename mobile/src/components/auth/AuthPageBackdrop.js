import React from "react";
import { Image, Platform, StyleSheet, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { AUTH_BODY_BG } from "../../content/authVisualContent";
import { useTheme } from "../../context/ThemeContext";

/**
 * Full-bleed soft pantry photo behind Login / Register body.
 */
export default function AuthPageBackdrop({ children }) {
  const { isDark } = useTheme();

  return (
    <View style={styles.root}>
      <Image
        source={AUTH_BODY_BG}
        style={styles.bg}
        resizeMode="cover"
        accessibilityIgnoresInvertColors
      />
      <LinearGradient
        colors={
          isDark
            ? ["rgba(12,10,8,0.72)", "rgba(12,10,8,0.88)", "rgba(12,10,8,0.94)"]
            : ["rgba(253,250,244,0.72)", "rgba(250,245,234,0.82)", "rgba(247,241,228,0.9)"]
        }
        locations={[0, 0.5, 1]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={StyleSheet.absoluteFillObject}
      />
      <View style={styles.content}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    width: "100%",
    flexGrow: 1,
    position: "relative",
    overflow: "hidden",
    ...Platform.select({
      web: {
        minHeight: "calc(100vh - 72px)",
      },
      default: {
        minHeight: "100%",
      },
    }),
  },
  bg: {
    ...StyleSheet.absoluteFillObject,
    width: "100%",
    height: "100%",
  },
  content: {
    position: "relative",
    zIndex: 1,
    width: "100%",
    flexGrow: 1,
  },
});
