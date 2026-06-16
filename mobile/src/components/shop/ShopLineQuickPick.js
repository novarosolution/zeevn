import React from "react";
import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { buildShopCollectionLines } from "../../content/shopPageContent";
import { useTheme } from "../../context/ThemeContext";
import { getShopTheme } from "../../theme/shopTheme";
import { fonts, icon, radius, spacing, typography } from "../../theme/tokens";

const LINES = buildShopCollectionLines();

/** Premium collection row — icon + label, no extra copy. */
export default function ShopLineQuickPick({ selectedPill = "All", onSelectPill, compact = false }) {
  const { isDark } = useTheme();
  const t = getShopTheme(isDark);

  const allCard = (
    <Pressable
      key="all"
      onPress={() => onSelectPill?.("All")}
      style={({ pressed, hovered }) => [
        styles.chip,
        { borderColor: t.border, backgroundColor: t.surfaceChip },
        selectedPill === "All" && styles.chipOn,
        selectedPill === "All" && { borderColor: t.accent, backgroundColor: t.chipOnBg },
        Platform.OS === "web" && hovered && selectedPill !== "All" && styles.chipHover,
        pressed && styles.pressed,
      ]}
      accessibilityRole="button"
      accessibilityState={{ selected: selectedPill === "All" }}
    >
      <Ionicons
        name="grid-outline"
        size={icon.sm}
        color={selectedPill === "All" ? t.chipOnText : t.accent}
      />
      <Text
        style={[
          styles.chipLabel,
          { color: selectedPill === "All" ? t.chipOnText : t.text },
        ]}
      >
        All
      </Text>
    </Pressable>
  );

  const lineCards = LINES.map((line) => {
    const on = selectedPill === line.pill;
    const grad = isDark ? line.gradientDark : line.gradient;

    return (
      <Pressable
        key={line.key}
        onPress={() => onSelectPill?.(line.pill)}
        style={({ pressed, hovered }) => [
          styles.chip,
          styles.chipWide,
          { borderColor: t.border, backgroundColor: t.surfaceChip },
          on && styles.chipOn,
          on && { borderColor: line.accent },
          Platform.OS === "web" && hovered && !on && styles.chipHover,
          pressed && styles.pressed,
        ]}
        accessibilityRole="button"
        accessibilityState={{ selected: on }}
      >
        {on ? (
          <LinearGradient colors={grad} style={StyleSheet.absoluteFillObject} />
        ) : null}
        <View
          style={[
            styles.iconDot,
            {
              backgroundColor: on
                ? "rgba(255,255,255,0.82)"
                : isDark
                  ? "rgba(255,255,255,0.08)"
                  : "rgba(255,255,255,0.88)",
            },
          ]}
        >
          <Ionicons name={line.icon} size={icon.sm} color={line.accent} />
        </View>
        <Text
          style={[styles.chipLabel, { color: on ? t.chipOnText : t.text }]}
          numberOfLines={1}
        >
          {line.label}
        </Text>
      </Pressable>
    );
  });

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={[styles.row, compact && styles.rowCompact]}
      keyboardShouldPersistTaps="handled"
    >
      {allCard}
      {lineCards}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    gap: spacing.sm,
    paddingBottom: spacing.xs,
    paddingRight: spacing.sm,
  },
  rowCompact: {
    gap: 8,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: radius.pill,
    borderWidth: StyleSheet.hairlineWidth,
    minHeight: 44,
    ...Platform.select({
      web: {
        boxShadow: "0 8px 24px -18px rgba(36, 68, 36, 0.18)",
        transition: "transform 0.16s ease, box-shadow 0.16s ease",
      },
      default: {},
    }),
  },
  chipWide: {
    paddingHorizontal: 12,
  },
  chipOn: {
    borderWidth: 1.5,
  },
  chipHover: {
    transform: [{ translateY: -1 }],
  },
  pressed: {
    opacity: 0.9,
  },
  iconDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  chipLabel: {
    fontFamily: fonts.semibold,
    fontSize: typography.caption,
    letterSpacing: 0.1,
  },
});
