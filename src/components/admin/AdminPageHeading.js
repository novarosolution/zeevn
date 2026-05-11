import React, { useMemo } from "react";
import { Platform, StyleSheet, Text, View, useWindowDimensions } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useTheme } from "../../context/ThemeContext";
import { FONT_DISPLAY, HERITAGE, heritageHairlineGradient } from "../../theme/customerAlchemy";
import { spacing, typography } from "../../theme/tokens";

/**
 * Shared title + subtitle for admin tool screens (matches customer display weight).
 */
export default function AdminPageHeading({ title, subtitle, right }) {
  const { colors: c, isDark } = useTheme();
  const { width } = useWindowDimensions();
  const isCompact = width < 720;
  const styles = useMemo(() => createStyles(c, isDark, { isCompact }), [c, isDark, isCompact]);

  return (
    <View style={styles.wrap}>
      <View style={styles.row}>
        <View style={styles.textCol}>
          <Text style={[styles.title, { color: c.textPrimary, fontFamily: FONT_DISPLAY }]}>{title}</Text>
          {subtitle ? (
            <Text style={[styles.subtitle, { color: c.textSecondary }]}>{subtitle}</Text>
          ) : null}
        </View>
        {right ? <View style={styles.right}>{right}</View> : null}
      </View>
      <View style={styles.hairlineRow}>
        <LinearGradient
          colors={heritageHairlineGradient(isDark)}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={styles.hairline}
        />
        <View style={[styles.hairlineDot, { backgroundColor: isDark ? HERITAGE.amberBright : HERITAGE.amberMid }]} />
      </View>
    </View>
  );
}

function createStyles(_c, isDark, layoutFlags = {}) {
  const { isCompact = false } = layoutFlags;
  return StyleSheet.create({
    wrap: {
      marginBottom: spacing.md,
      paddingBottom: spacing.xs,
    },
    row: {
      flexDirection: isCompact ? "column" : "row",
      alignItems: "flex-start",
      justifyContent: "space-between",
      gap: spacing.md,
    },
    textCol: {
      flex: 1,
      minWidth: 0,
    },
    title: {
      fontSize: isCompact ? typography.h2 - 3 : typography.h2 - 1,
      letterSpacing: -0.38,
    },
    subtitle: {
      marginTop: spacing.xs - 2,
      fontSize: typography.bodySmall,
      lineHeight: 20,
    },
    right: {
      flexShrink: 0,
      alignItems: isCompact ? "flex-start" : "flex-end",
      width: isCompact ? "100%" : undefined,
      ...(Platform.OS === "web" && isCompact ? { maxWidth: "100%" } : {}),
    },
    hairlineRow: {
      marginTop: spacing.sm + 2,
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
    },
    hairline: {
      flex: 1,
      height: 1.25,
      borderRadius: 1,
    },
    hairlineDot: {
      width: 5,
      height: 5,
      borderRadius: 2.5,
      opacity: 0.88,
    },
  });
}
