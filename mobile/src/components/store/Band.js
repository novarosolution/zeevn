import React, { memo } from "react";
import { StyleSheet, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { pickRange, useStoreTheme, withAlpha } from "../../theme/storefront";

/** Older tone names → the range wash they map to. */
const TONES = { olive: "tel", gold: "gifts" };

/**
 * A soft tinted sheet behind a section: it opens with a rounded, hairline-edged top in the wash colour and
 * dissolves into the page by the bottom, so stacked sections breathe instead of boxing each other in.
 * Pass a range (`range="honey"`) or a `tone` ("gold" | "olive"). One static gradient — no per-frame work.
 */
function Band({ tone = "gold", range, children, style }) {
  const { c, isDark } = useStoreTheme();
  const set = pickRange(c, range || TONES[tone] || tone);
  const colors = [
    withAlpha(set.wash[1], isDark ? 0.5 : 0.6),
    withAlpha(set.wash[0], isDark ? 0.2 : 0.42),
    withAlpha(set.wash[0], 0),
  ];
  return (
    <View style={[styles.band, { borderColor: withAlpha(set.accent, isDark ? 0.3 : 0.22) }, style]}>
      <LinearGradient colors={colors} locations={[0, 0.4, 1]} style={StyleSheet.absoluteFill} pointerEvents="none" />
      {children}
    </View>
  );
}

export default memo(Band);

const styles = StyleSheet.create({
  band: {
    borderTopLeftRadius: 34,
    borderTopRightRadius: 34,
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: 22,
    paddingBottom: 14,
    overflow: "hidden",
  },
});
