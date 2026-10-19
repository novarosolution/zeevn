import React from "react";
import { StyleSheet, View } from "react-native";
import { useStoreTheme, withAlpha } from "../../theme/storefront";

/**
 * Lite “glass” — solid translucent fill only. No BlurView / backdrop-filter (those hitch scroll).
 */
export default function GlassSurface({
  children,
  style,
  contentStyle,
  sheen = false,
  border = true,
  pointerEvents,
}) {
  const { isDark } = useStoreTheme();
  const fill = isDark ? withAlpha("#1A1712", 0.92) : withAlpha("#FFFFFF", 0.92);
  const edge = isDark ? withAlpha("#FFFFFF", 0.12) : withAlpha("#244424", 0.08);
  void sheen;

  return (
    <View
      style={[styles.shell, border && { borderWidth: StyleSheet.hairlineWidth, borderColor: edge }, { backgroundColor: fill }, style]}
      pointerEvents={pointerEvents}
    >
      <View style={[styles.content, contentStyle]}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  shell: {
    overflow: "hidden",
    position: "relative",
  },
  content: {
    zIndex: 1,
  },
});
