import React from "react";
import { StyleSheet, View } from "react-native";

/**
 * Page content wrapper: max-width centering + vertical rhythm.
 * Extracted so home/checkout paths avoid pulling Reanimated checkout steps.
 */
export function KankregPageWrap({ children, style, gap }) {
  return (
    <View style={[styles.wrap, style]}>
      <View style={[styles.inner, gap != null ? { gap } : null]}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: "100%",
    maxWidth: "100%",
    alignSelf: "center",
  },
  inner: {
    width: "100%",
    maxWidth: "100%",
    minWidth: 0,
  },
});
