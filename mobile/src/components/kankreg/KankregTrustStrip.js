import React, { useMemo } from "react";
import { Image, StyleSheet, Text, View } from "react-native";
import { HOME_SCREEN_UI, HOME_TRUST_STRIP } from "../../content/appContent";
import { getHomeTrustImage } from "../../content/homeLineImages";
import { useTheme } from "../../context/ThemeContext";
import { KANKREG_PALETTE, ZEEVAN_GREEN } from "../../theme/kankregWeb";
import { useKankregLayout } from "../../theme/kankregBreakpoints";
import { fonts, layout, spacing } from "../../theme/tokens";

/** Premium trust row — generated stills instead of generic icons. */
export default function KankregTrustStrip() {
  const { isDark } = useTheme();
  const { isXs, isMobileWeb } = useKankregLayout();
  const phoneGrid = isMobileWeb || isXs;
  const styles = useMemo(() => createStyles(phoneGrid, isDark), [phoneGrid, isDark]);
  const overline = HOME_SCREEN_UI.trust?.overline;
  const ink = isDark ? "#FAF8F4" : KANKREG_PALETTE.ink;
  const muted = isDark ? "rgba(250,248,244,0.7)" : KANKREG_PALETTE.inkSoft;

  return (
    <View style={styles.wrap}>
      {overline ? <Text style={[styles.overline, { color: ZEEVAN_GREEN.deep }]}>{overline}</Text> : null}
      <View style={[styles.strip, phoneGrid && styles.stripPhone]}>
        {HOME_TRUST_STRIP.map((item, idx) => {
          const image = getHomeTrustImage(item.key);
          return (
            <React.Fragment key={item.key}>
              {idx > 0 && !phoneGrid ? <View style={styles.divider} /> : null}
              <View style={[styles.cell, phoneGrid && styles.cellPhone]}>
                <View style={styles.thumbWrap}>
                  {image ? (
                    <Image source={image} style={styles.thumb} resizeMode="cover" />
                  ) : null}
                </View>
                <Text style={[styles.label, { color: ink }, phoneGrid && styles.labelPhone]} numberOfLines={2}>
                  {item.label}
                </Text>
              </View>
            </React.Fragment>
          );
        })}
      </View>
      {!phoneGrid ? (
        <Text style={[styles.hint, { color: muted }]}>
          Pure pantry lines · Secure checkout · Live order tracking
        </Text>
      ) : null}
    </View>
  );
}

function createStyles(phoneGrid, isDark) {
  return StyleSheet.create({
    wrap: {
      width: "100%",
      marginBottom: 0,
      gap: spacing.sm,
    },
    overline: {
      fontFamily: fonts.semibold,
      fontSize: 11,
      letterSpacing: 1.8,
      textTransform: "uppercase",
      textAlign: "center",
    },
    strip: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      backgroundColor: isDark ? "rgba(255,255,255,0.04)" : KANKREG_PALETTE.card,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: isDark ? "rgba(255,255,255,0.1)" : "rgba(36, 68, 36, 0.1)",
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.sm,
      maxWidth: layout.maxContentWidth,
      alignSelf: "center",
      width: "100%",
    },
    stripPhone: {
      flexWrap: "wrap",
      justifyContent: "space-between",
      gap: 10,
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.md,
    },
    cell: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 10,
      paddingHorizontal: 6,
    },
    cellPhone: {
      flex: 0,
      flexBasis: "47%",
      width: "47%",
      maxWidth: "47%",
      justifyContent: "flex-start",
      paddingHorizontal: 0,
      gap: 8,
    },
    thumbWrap: {
      width: 44,
      height: 44,
      borderRadius: 10,
      overflow: "hidden",
      backgroundColor: isDark ? "rgba(220,172,116,0.12)" : "rgba(240, 232, 216, 0.9)",
      borderWidth: 1,
      borderColor: isDark ? "rgba(255,255,255,0.1)" : "rgba(36, 68, 36, 0.1)",
    },
    thumb: {
      width: "100%",
      height: "100%",
    },
    divider: {
      width: 1,
      alignSelf: "stretch",
      backgroundColor: isDark ? "rgba(255,255,255,0.1)" : "rgba(36, 68, 36, 0.1)",
    },
    label: {
      fontFamily: fonts.semibold,
      fontSize: 13,
      letterSpacing: 0.02,
      maxWidth: 110,
      textAlign: "left",
    },
    labelPhone: {
      maxWidth: "100%",
      flex: 1,
      fontSize: 12,
      lineHeight: 16,
    },
    hint: {
      fontFamily: fonts.regular,
      fontSize: 12,
      textAlign: "center",
      letterSpacing: 0.02,
    },
  });
}
