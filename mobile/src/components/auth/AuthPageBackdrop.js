import React from "react";
import { Platform, StyleSheet, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useStoreTheme } from "../../theme/storefront";

/**
 * The ivory (or deep-green) page behind Login / Register — the same canvas the storefront sits on.
 */
export default function AuthPageBackdrop({ children }) {
  const { c } = useStoreTheme();

  return (
    <View style={[styles.root, { backgroundColor: c.page }]}>
      <LinearGradient
        colors={[c.page, c.pageDeep]}
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
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      },
      default: { minHeight: "100%" },
    }),
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
