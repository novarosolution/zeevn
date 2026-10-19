import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { useTheme } from "../../context/ThemeContext";
import { FONT_HEADING_SEMI } from "../../theme/typographyRoles";
import { fonts } from "../../theme/tokens";
import GoldRingLoader from "./GoldRingLoader";

/** Full-screen wait while checkout talks to the kitchen. */
export default function CheckoutPlacingOverlay({ visible, title = "Placing your order", caption = "Confirming kitchen & payment…" }) {
  const { colors: c, isDark } = useTheme();
  if (!visible) return null;
  return (
    <View style={[styles.veil, { backgroundColor: isDark ? "rgba(10,12,10,0.72)" : "rgba(255,253,248,0.86)" }]} pointerEvents="auto">
      <GoldRingLoader size={48} />
      <Text style={[styles.title, { color: c.textPrimary }]}>{title}</Text>
      <Text style={[styles.caption, { color: c.textSecondary }]}>{caption}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  veil: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 40,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    paddingHorizontal: 28,
  },
  title: {
    fontFamily: FONT_HEADING_SEMI,
    fontSize: 20,
    letterSpacing: -0.3,
    textAlign: "center",
  },
  caption: {
    fontFamily: fonts.regular,
    fontSize: 13,
    textAlign: "center",
  },
});
