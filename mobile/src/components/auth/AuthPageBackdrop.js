import React from "react";
import { Platform, StyleSheet, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useTheme } from "../../context/ThemeContext";

/**
 * Clean cream stage behind Login / Register — matches premium mock (no busy photo wash).
 */
export default function AuthPageBackdrop({ children }) {
  const { isDark } = useTheme();

  return (
    <View style={[styles.root, isDark && styles.rootDark]}>
      <LinearGradient
        colors={
          isDark
            ? ["#161412", "#12100E", "#0E0C0A"]
            : ["#FDF9F3", "#F8F2E8", "#F3ECDF"]
        }
        locations={[0, 0.55, 1]}
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
    backgroundColor: "#FDF9F3",
    ...Platform.select({
      web: {
        minHeight: "calc(100vh - 72px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      },
      default: { minHeight: "100%" },
    }),
  },
  rootDark: {
    backgroundColor: "#12100E",
  },
  content: {
    position: "relative",
    zIndex: 1,
    width: "100%",
    flexGrow: 1,
    ...Platform.select({
      web: {
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      },
      default: {},
    }),
  },
});
