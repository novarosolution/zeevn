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
        <Text style={type.display(24)} numberOfLines={1} accessibilityRole="header">
          {title}
        </Text>
        {caption ? (
          <Text style={[type.ui(13, "medium", c.inkMute), styles.caption]} numberOfLines={1}>
            {caption}
          </Text>
        ) : null}
      </View>
      {action && onAction ? (
        <Pressable onPress={onAction} hitSlop={10} style={styles.action} accessibilityRole="button" accessibilityLabel={action}>
          <Text style={type.ui(13.5, "bold", c.brandAlt)}>{action}</Text>
          <Ionicons name="chevron-forward" size={14} color={c.brandAlt} />
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
      <Text style={[type.display(27, { color: c.goldText, ls: -0.3 }), styles.ornamentText]} numberOfLines={1}>
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
    alignItems: "flex-end",
    justifyContent: "space-between",
    gap: 12,
  },
  headerText: { flex: 1, minWidth: 0 },
  caption: { marginTop: 2 },
  action: { flexDirection: "row", alignItems: "center", gap: 2, paddingBottom: 3 },
  ornament: { flexDirection: "row", alignItems: "center", gap: 8 },
  rule: { flex: 1, height: 1.5, borderRadius: 1 },
  diamond: { width: 7, height: 7, transform: [{ rotate: "45deg" }], borderRadius: 1.5 },
  ornamentText: { textAlign: "center", paddingHorizontal: 2 },
});
