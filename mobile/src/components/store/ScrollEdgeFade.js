import React from "react";
import { StyleSheet } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useStoreTheme, withAlpha } from "../../theme/storefront";

/**
 * Scroll-edge effect: content dissolves into the page colour where it meets floating chrome (the nav pill, the pay dock)
 * instead of sliding under it and showing through the gaps. `height` includes the fade itself; the lower half is solid.
 * Sits above the scrolling content and below the chrome it backs, and never takes a touch.
 */
export default function ScrollEdgeFade({ height, edge = "bottom" }) {
  const { c } = useStoreTheme();
  const solid = c.page;
  const colors =
    edge === "bottom"
      ? [withAlpha(solid, 0), withAlpha(solid, 0.9), solid]
      : [solid, withAlpha(solid, 0.9), withAlpha(solid, 0)];
  return (
    <LinearGradient
      pointerEvents="none"
      colors={colors}
      locations={[0, 0.5, 1]}
      style={[styles.fade, edge === "bottom" ? styles.bottom : styles.top, { height }]}
    />
  );
}

const styles = StyleSheet.create({
  fade: { position: "absolute", left: 0, right: 0, zIndex: 80 },
  bottom: { bottom: 0 },
  top: { top: 0 },
});
