import React, { useMemo } from "react";
import { Platform, StyleSheet, View } from "react-native";
import { useTheme } from "../../context/ThemeContext";
import { adminScreenRoot, getAdminChrome } from "../../theme/adminLayout";

/**
 * Admin backdrop — warm dot grid on web (kankreg admin design board).
 */
export default function AdminScreenShell({ children, style }) {
  const { colors: c, isDark } = useTheme();
  const chrome = useMemo(() => getAdminChrome(c, isDark), [c, isDark]);
  const dotStyle = useMemo(
    () => (isDark ? styles.dotGridDark : styles.dotGridLight),
    [isDark]
  );

  return (
    <View style={[styles.root, adminScreenRoot({ background: chrome.canvas }), style]}>
      {Platform.OS === "web" ? <View style={[styles.dotGrid, dotStyle]} pointerEvents="none" /> : null}
      <View style={styles.content}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    width: "100%",
    position: "relative",
    ...Platform.select({
      web: { minHeight: 0 },
      default: {},
    }),
  },
  dotGrid: {
    ...StyleSheet.absoluteFillObject,
    ...Platform.select({
      web: { backgroundSize: "26px 26px" },
      default: {},
    }),
  },
  dotGridLight: {
    opacity: 0.55,
    ...Platform.select({
      web: {
        backgroundImage:
          "radial-gradient(circle at 1px 1px, rgba(25,20,15,0.07) 1px, transparent 0), linear-gradient(180deg, rgba(255,252,247,0.55), rgba(239,231,219,0.2))",
        backgroundSize: "26px 26px, 100% 100%",
      },
      default: {},
    }),
  },
  dotGridDark: {
    opacity: 0.4,
    ...Platform.select({
      web: {
        backgroundImage:
          "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.05) 1px, transparent 0)",
      },
      default: {},
    }),
  },
  content: {
    flex: 1,
    width: "100%",
  },
});
