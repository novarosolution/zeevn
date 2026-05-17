import React from "react";
import { Platform, StyleSheet, View } from "react-native";
import { useTheme } from "../context/ThemeContext";
import { spacing } from "../theme/tokens";
import HomePageFooter from "./home/HomePageFooter";

/**
 * Site-wide footer — same premium editorial layout as the home page.
 * @param {boolean} [webTight] Tighter top spacing on web inner pages.
 */
export default function AppFooter({ webTight = false }) {
  const { colors } = useTheme();

  return (
    <View style={webTight ? styles.webTight : undefined}>
      <HomePageFooter colors={colors} compact={webTight} />
    </View>
  );
}

const styles = StyleSheet.create({
  webTight: {
    marginTop: Platform.select({ web: spacing.md, default: 0 }),
  },
});
