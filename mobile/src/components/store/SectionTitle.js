import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useStoreTheme, withAlpha } from "../../theme/storefront";

/** Section heading: serif title, optional caption, optional “See all ›” action. */
export function SectionHeader({ title, caption, action, onAction, style }) {
  const { c, type, gutter } = useStoreTheme();
  return (
    <View style={[styles.header, { paddingHorizontal: gutter }, style]}>
      <View style={styles.headerText}>
        <View style={styles.titleRow}>
          <View style={[styles.accent, { backgroundColor: c.gold }]} />
          <Text style={type.display(22, { ls: -0.45, lh: 26 })} numberOfLines={1} accessibilityRole="header">
            {title}
          </Text>
        </View>
        {caption ? (
          <Text style={[type.ui(12.5, "medium", c.inkMute), styles.caption]} numberOfLines={1}>
            {caption}
          </Text>
        ) : null}
      </View>
      {action && onAction ? (
        <Pressable
          onPress={onAction}
          hitSlop={10}
          style={[styles.action, { backgroundColor: withAlpha(c.brand, 0.08) }]}
          accessibilityRole="button"
          accessibilityLabel={action}
        >
          <Text style={type.ui(12.5, "extrabold", c.brand)}>{action}</Text>
          <Ionicons name="chevron-forward" size={13} color={c.brand} />
        </Pressable>
      ) : null}
    </View>
  );
}

/** Centered title flanked by gold hairlines and diamonds — used for festive sections. */
export function OrnamentTitle({ title, style }) {
  const { c, type, gutter } = useStoreTheme();
  const fade = [withAlpha(c.gold, 0), c.gold];
  const fadeOut = [c.gold, withAlpha(c.gold, 0)];
  return (
    <View style={[styles.ornament, { paddingHorizontal: gutter }, style]} accessibilityRole="header" accessibilityLabel={title}>
      <LinearGradient colors={fade} start={{ x: 0, y: 0.5 }} end={{ x: 1, y: 0.5 }} style={styles.rule} />
      <View style={[styles.diamond, { backgroundColor: c.gold }]} />
      <Text style={[type.display(24, { color: c.goldText, ls: -0.35 }), styles.ornamentText]} numberOfLines={1}>
        {title}
      </Text>
      <View style={[styles.diamond, { backgroundColor: c.gold }]} />
      <LinearGradient colors={fadeOut} start={{ x: 0, y: 0.5 }} end={{ x: 1, y: 0.5 }} style={styles.rule} />
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  headerText: { flex: 1, minWidth: 0 },
  titleRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  accent: { width: 3, height: 18, borderRadius: 2 },
  caption: { marginTop: 3, marginLeft: 11 },
  action: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    height: 30,
    paddingHorizontal: 10,
    borderRadius: 15,
  },
  ornament: { flexDirection: "row", alignItems: "center", gap: 8 },
  rule: { flex: 1, height: 1.5, borderRadius: 1 },
  diamond: { width: 6, height: 6, transform: [{ rotate: "45deg" }], borderRadius: 1 },
  ornamentText: { textAlign: "center", paddingHorizontal: 2 },
});
