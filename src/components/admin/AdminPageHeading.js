import React, { useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useTheme } from "../../context/ThemeContext";
import { FONT_DISPLAY, HERITAGE, heritageHairlineGradient } from "../../theme/customerAlchemy";
import { spacing, typography } from "../../theme/tokens";

/**
 * Shared title + subtitle for admin tool screens (matches customer display weight).
 */
export default function AdminPageHeading({ title, subtitle, right }) {
  const { colors: c, isDark } = useTheme();
  const styles = useMemo(() => createStyles(c, isDark), [c, isDark]);

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

function createStyles(_c, isDark) {
  return StyleSheet.create({
    wrap: {
      marginBottom: spacing.md + 2,
      paddingBottom: spacing.xs,
    },
    row: {
      flexDirection: "row",
      alignItems: "flex-start",
      justifyContent: "space-between",
      gap: spacing.md,
    },
    textCol: {
      flex: 1,
      minWidth: 0,
    },
    title: {
      fontSize: typography.h2,
      letterSpacing: -0.38,
    },
    subtitle: {
      marginTop: spacing.xs,
      fontSize: typography.bodySmall,
      lineHeight: 21,
    },
    right: {
      flexShrink: 0,
      alignItems: "flex-end",
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
