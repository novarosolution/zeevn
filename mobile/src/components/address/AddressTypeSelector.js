import React from "react";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../context/ThemeContext";
import { ALCHEMY } from "../../theme/customerAlchemy";
import { fonts, icon, radius, spacing, typography } from "../../theme/tokens";

export const ADDRESS_TYPES = [
  { key: "Home", label: "Home", iconName: "home" },
  { key: "Work", label: "Work", iconName: "briefcase" },
  { key: "Office", label: "Office", iconName: "business" },
];

/**
 * Home / Work / Office address label selector (segmented chips).
 */
export default function AddressTypeSelector({ value = "Home", onChange, label = "Save address as" }) {
  const { colors: c, isDark } = useTheme();

  return (
    <View style={styles.wrap}>
      {label ? (
        <Text style={[styles.label, { color: isDark ? c.textSecondary : ALCHEMY.brownMuted }]}>{label}</Text>
      ) : null}
      <View style={styles.row}>
        {ADDRESS_TYPES.map((opt) => {
          const active = value === opt.key;
          return (
            <Pressable
              key={opt.key}
              onPress={() => onChange?.(opt.key)}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
              accessibilityLabel={`Save address as ${opt.label}`}
              style={({ hovered, pressed }) => [
                styles.chip,
                {
                  borderColor: active
                    ? isDark
                      ? ALCHEMY.goldBright
                      : ALCHEMY.gold
                    : isDark
                      ? "rgba(255,255,255,0.12)"
                      : "rgba(22, 69, 51, 0.16)",
                  backgroundColor: active
                    ? isDark
                      ? "rgba(31, 92, 71, 0.16)"
                      : ALCHEMY.goldSoft
                    : isDark
                      ? "rgba(255,255,255,0.04)"
                      : "rgba(255, 252, 248, 0.9)",
                },
                hovered && !active && Platform.OS === "web" ? styles.chipHover : null,
                pressed ? styles.chipPressed : null,
              ]}
            >
              <Ionicons
                name={active ? opt.iconName : `${opt.iconName}-outline`}
                size={icon.sm}
                color={active ? (isDark ? ALCHEMY.goldBright : ALCHEMY.brown) : c.textMuted}
              />
              <Text
                style={[
                  styles.chipText,
                  {
                    color: active
                      ? isDark
                        ? ALCHEMY.goldBright
                        : ALCHEMY.brown
                      : c.textSecondary,
                    fontFamily: active ? fonts.bold : fonts.semibold,
                  },
                ]}
              >
                {opt.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { width: "100%" },
  label: {
    fontFamily: fonts.semibold,
    fontSize: typography.caption,
    letterSpacing: 0.2,
    marginBottom: spacing.xs + 2,
  },
  row: {
    flexDirection: "row",
    gap: spacing.xs + 2,
  },
  chip: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 11,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 1.25,
    ...Platform.select({ web: { cursor: "pointer", transition: "all 0.18s ease" }, default: {} }),
  },
  chipHover: {
    borderColor: ALCHEMY.gold,
  },
  chipPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
  chipText: {
    fontSize: typography.bodySmall,
    letterSpacing: 0.2,
  },
});
