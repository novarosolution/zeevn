import React, { useMemo } from "react";
import { Platform, StyleSheet, View } from "react-native";
import { useTheme } from "../../context/ThemeContext";
import { getAdminChrome } from "../../theme/adminLayout";
import { spacing } from "../../theme/tokens";

/**
 * Premium manage toolbar — search + filters + actions in one calm strip.
 */
export default function AdminToolbar({ children, style, stacked }) {
  const { colors: c, isDark } = useTheme();
  const chrome = useMemo(() => getAdminChrome(c, isDark), [c, isDark]);
  const styles = useMemo(() => createStyles(chrome), [chrome]);

  return (
    <View style={[styles.bar, stacked && styles.barStacked, style]}>
      {children}
    </View>
  );
}

export function AdminToolbarSlot({ children, flex = false, style }) {
  return <View style={[{ flex: flex ? 1 : undefined, minWidth: flex ? 180 : undefined }, style]}>{children}</View>;
}

function createStyles(chrome) {
  return StyleSheet.create({
    bar: {
      flexDirection: Platform.select({ web: "row", default: "column" }),
      flexWrap: "wrap",
      alignItems: Platform.select({ web: "flex-end", default: "stretch" }),
      gap: spacing.sm,
      padding: Platform.select({ web: 12, default: spacing.sm }),
      borderRadius: Platform.select({ web: 14, default: 12 }),
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: chrome.line,
      backgroundColor: chrome.paper,
      marginBottom: spacing.sm,
    },
    barStacked: {
      flexDirection: "column",
      alignItems: "stretch",
    },
  });
}
