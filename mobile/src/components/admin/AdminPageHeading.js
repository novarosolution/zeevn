import React, { useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useTheme } from "../../context/ThemeContext";
import { ALCHEMY } from "../../theme/customerAlchemy";
import { FONT_HEADING } from "../../theme/typographyRoles";
import { spacing, typography } from "../../theme/tokens";

/**
 * Shared title + subtitle for admin tool screens (matches customer display weight).
 */
export default function AdminPageHeading({ title, subtitle, right, compact = false }) {
  const { colors: c, isDark } = useTheme();
  const styles = useMemo(() => createStyles(c, isDark, compact), [c, isDark, compact]);

  return (
    <View style={styles.wrap}>
      <View style={styles.row}>
        <View style={styles.textCol}>
          <Text style={[styles.title, { color: c.textPrimary, fontFamily: FONT_HEADING }]}>{title}</Text>
          {subtitle && !compact ? (
            <Text style={[styles.subtitle, { color: c.textSecondary }]}>{subtitle}</Text>
          ) : null}
        </View>
        {right ? <View style={styles.right}>{right}</View> : null}
      </View>
      <View style={styles.hairlineRow}>
        <LinearGradient
          colors={
            isDark
              ? ["rgba(52, 211, 153, 0.5)", "rgba(31, 92, 71, 0.2)", "rgba(52, 211, 153, 0)"]
              : ["rgba(31, 92, 71, 0.55)", "rgba(22, 69, 51, 0.2)", "rgba(31, 92, 71, 0)"]
          }
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={styles.hairline}
        />
        <View style={[styles.hairlineDot, { backgroundColor: isDark ? ALCHEMY.goldBright : ALCHEMY.gold }]} />
      </View>
    </View>
  );
}

function createStyles(_c, isDark, compact) {
  return StyleSheet.create({
    wrap: {
      marginBottom: compact ? spacing.sm : spacing.md + 4,
      flex: 1,
      minWidth: 0,
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
      fontSize: compact ? typography.h3 : typography.h2,
      letterSpacing: compact ? -0.2 : -0.35,
    },
    subtitle: {
      marginTop: spacing.xs,
      fontSize: typography.bodySmall,
      lineHeight: 20,
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
