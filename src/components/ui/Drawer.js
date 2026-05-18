import React from "react";
import { Platform, StyleSheet, View } from "react-native";

/**
 * Layout primitive for slide-over panels. For the shop cart, see `components/cart/CartDrawer`.
 * This stub provides a consistent import path during the UI consolidation.
 */
export default function Drawer({ visible = true, children, style, testID }) {
  if (!visible) return null;

  return (
    <View
      testID={testID}
      style={[styles.base, style]}
      {...(Platform.OS === "web" ? { role: "dialog" } : {})}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    flex: 1,
  },
});
