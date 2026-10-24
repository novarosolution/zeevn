import React, { useMemo } from "react";
import { Platform, StyleSheet, View } from "react-native";
import { useTheme } from "../../context/ThemeContext";
import { adminScreenRoot, getAdminChrome } from "../../theme/adminLayout";

/** Admin page canvas — warm ivory desk, no decorative grid. */
export default function AdminScreenShell({ children, style }) {
  const { colors: c, isDark } = useTheme();
  const chrome = useMemo(() => getAdminChrome(c, isDark), [c, isDark]);

  return (
    <View style={[styles.root, adminScreenRoot({ background: chrome.canvas }), style]}>
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
  content: {
    flex: 1,
    width: "100%",
  },
});
