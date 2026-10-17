import React, { useMemo } from "react";
import { Image, StyleSheet, Text, View } from "react-native";
import { HOME_SCREEN_UI, HOME_TRUST_STRIP } from "../../content/appContent";
import { getHomeTrustImage } from "../../content/homeLineImages";
import { useTheme } from "../../context/ThemeContext";
import { KANKREG_PALETTE, ZEEVAN_GREEN } from "../../theme/kankregWeb";
import { useKankregLayout } from "../../theme/kankregBreakpoints";
import { FONT_HEADING } from "../../theme/typographyRoles";
import { fonts, layout, spacing } from "../../theme/tokens";

/** Compact trust grid — larger photos, left-aligned with the rest of the home. */
export default function KankregTrustStrip() {
  const { isDark } = useTheme();
  const { isXs, isMobileWeb } = useKankregLayout();
  const phoneGrid = isMobileWeb || isXs;
  const styles = useMemo(() => createStyles(phoneGrid, isDark), [phoneGrid, isDark]);
  const overline = HOME_SCREEN_UI.trust?.overline;
  const ink = isDark ? "#FAF8F4" : "#1A1C14";

  return (
    <View style={styles.wrap} accessibilityRole="summary">
      {overline ? (
        <Text style={[styles.overline, { color: isDark ? "#E6BE88" : ZEEVAN_GREEN.deep }]}>
          {overline}
        </Text>
      ) : null}
      <View style={[styles.grid, phoneGrid && styles.gridPhone]}>
        {HOME_TRUST_STRIP.map((item) => {
          const image = getHomeTrustImage(item.key);
          return (
            <View key={item.key} style={[styles.card, phoneGrid && styles.cardPhone, isDark && styles.cardDark]}>
              <View style={styles.thumbWrap}>
                {image ? <Image source={image} style={styles.thumb} resizeMode="cover" /> : null}
              </View>
              <Text style={[styles.label, { color: ink }]} numberOfLines={2}>
                {item.label}
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

function createStyles(phoneGrid, isDark) {
  return StyleSheet.create({
    wrap: {
      width: "100%",
      maxWidth: layout.maxContentWidth,
      alignSelf: "center",
      gap: spacing.sm + 2,
      marginTop: 0,
      marginBottom: 0,
    },
    overline: {
      fontFamily: fonts.semibold,
      fontSize: 11,
      letterSpacing: 1.8,
      textTransform: "uppercase",
      textAlign: "left",
    },
    grid: {
      flexDirection: "row",
      alignItems: "stretch",
      gap: 12,
      width: "100%",
    },
    gridPhone: {
      flexWrap: "wrap",
      justifyContent: "space-between",
      gap: 10,
    },
    card: {
      flex: 1,
      minWidth: 0,
      alignItems: "center",
      gap: 10,
      paddingVertical: 14,
      paddingHorizontal: 10,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: isDark ? "rgba(255,255,255,0.1)" : "rgba(26, 28, 20, 0.1)",
      backgroundColor: isDark ? "rgba(255,255,255,0.04)" : "rgba(255,252,246,0.96)",
    },
    cardPhone: {
      flex: 0,
      flexBasis: "47%",
      width: "47%",
      maxWidth: "47%",
    },
    cardDark: {
      backgroundColor: "rgba(255,255,255,0.05)",
    },
    thumbWrap: {
      width: 72,
      height: 72,
      borderRadius: 16,
      overflow: "hidden",
      backgroundColor: isDark ? "rgba(212,165,116,0.12)" : KANKREG_PALETTE.paper2,
    },
    thumb: {
      width: "100%",
      height: "100%",
    },
    label: {
      fontFamily: FONT_HEADING,
      fontSize: 14,
      lineHeight: 18,
      letterSpacing: -0.1,
      textAlign: "center",
    },
  });
}
