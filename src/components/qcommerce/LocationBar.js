import React from "react";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../context/ThemeContext";
import { fonts, radius, spacing, typography } from "../../theme/tokens";

/**
 * Premium address row — no delivery-time promises.
 */
export default function LocationBar({ onPress, addressLine, city }) {
  const { colors: c } = useTheme();

  const label = (() => {
    const line = String(addressLine || "").trim();
    const cty = String(city || "").trim();
    if (line && cty) return `${cty} · ${line}`;
    if (cty) return cty;
    if (line) return line;
    return "Add your delivery address";
  })();

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.row, { borderColor: c.border, backgroundColor: c.surfaceMuted }, pressed && { opacity: 0.88 }]}
      accessibilityRole="button"
      accessibilityLabel="Delivery address"
    >
      <View style={[styles.iconWrap, { backgroundColor: c.primarySoft, borderColor: c.primaryBorder }]}>
        <Ionicons name="location" size={18} color={c.primary} />
      </View>
      <View style={styles.textWrap}>
        <Text style={[styles.kicker, { color: c.textMuted, fontFamily: fonts.semibold }]}>Deliver to</Text>
        <Text style={[styles.label, { color: c.textPrimary, fontFamily: fonts.semibold }]} numberOfLines={1}>
          {label}
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color={c.textMuted} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    minHeight: 48,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    marginBottom: spacing.sm,
    ...Platform.select({ web: { cursor: "pointer" }, default: {} }),
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  textWrap: {
    flex: 1,
    minWidth: 0,
  },
  kicker: {
    fontSize: typography.overline,
    letterSpacing: 0.8,
    textTransform: "uppercase",
    marginBottom: 2,
  },
  label: {
    fontSize: typography.bodySmall,
  },
});
