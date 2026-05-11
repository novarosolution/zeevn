import React from "react";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { useTheme } from "../../context/ThemeContext";
import { fonts, radius, spacing, typography } from "../../theme/tokens";
import { HERITAGE } from "../../theme/customerAlchemy";

export default function PremiumSwitch({ label, hint, value, onChange }) {
  const { colors: c, isDark } = useTheme();
  return (
    <Pressable
      onPress={() => onChange?.(!value)}
      style={({ pressed, hovered }) => [
        styles.row,
        {
          borderColor: value ? (isDark ? c.primaryBorder : "rgba(220, 38, 38, 0.18)") : c.border,
          backgroundColor: isDark ? c.surfaceElevated || c.surface : c.surface,
        },
        hovered && Platform.OS === "web" ? styles.hover : null,
        pressed && styles.pressed,
      ]}
      accessibilityRole="switch"
      accessibilityState={{ checked: value }}
    >
      <View style={styles.textCol}>
        <Text style={[styles.label, { color: c.textPrimary }]}>{label}</Text>
        {hint ? <Text style={[styles.hint, { color: c.textSecondary }]}>{hint}</Text> : null}
      </View>
      <View
        style={[
          styles.track,
          {
            backgroundColor: value
              ? isDark
                ? "rgba(239, 68, 68, 0.24)"
                : "rgba(220, 38, 38, 0.14)"
              : c.surfaceMuted,
            borderColor: value ? c.primaryBorder : c.border,
          },
        ]}
      >
        <View
          style={[
            styles.thumb,
            {
              backgroundColor: value
                ? isDark
                  ? c.primaryBright
                  : c.primary
                : isDark
                  ? c.textMuted
                  : "#FFFFFF",
              transform: [{ translateX: value ? 18 : 0 }],
              ...Platform.select({
                web: value
                  ? { boxShadow: `0 0 0 4px ${HERITAGE.soft}` }
                  : {},
                default: {},
              }),
            },
          ]}
        />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: radius.xl,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    minHeight: 56,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.md,
    ...Platform.select({
      web: { transition: "transform .18s ease, box-shadow .18s ease, border-color .18s ease, background-color .18s ease" },
      default: {},
    }),
  },
  hover: {
    ...Platform.select({
      web: {
        boxShadow: "0 12px 24px rgba(15, 23, 42, 0.08)",
        transform: [{ translateY: -1 }],
      },
      default: {},
    }),
  },
  pressed: {
    opacity: 0.9,
  },
  textCol: {
    flex: 1,
  },
  label: {
    fontFamily: fonts.bold,
    fontSize: typography.bodySmall,
  },
  hint: {
    marginTop: 2,
    fontFamily: fonts.regular,
    fontSize: typography.caption,
  },
  track: {
    width: 46,
    height: 28,
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 3,
    justifyContent: "center",
  },
  thumb: {
    width: 20,
    height: 20,
    borderRadius: 10,
  },
});
