import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useStoreTheme, withAlpha } from "../../theme/storefront";
import StoreIcon from "./StoreIcon";
import PressableScale from "./PressableScale";

/**
 * Section heading: gold rule (or a round range icon), optional eyebrow, serif title, optional caption and an
 * optional “See all ›” action.
 */
export function SectionHeader({ eyebrow, title, caption, action, onAction, icon, style }) {
  const { c, type, gutter, isDark } = useStoreTheme();
  return (
    <View style={[styles.header, { paddingHorizontal: gutter }, style]}>
      <View style={styles.headerText}>
        <View style={styles.titleRow}>
          {icon ? (
            <View
              style={[
                styles.iconDisc,
                { backgroundColor: isDark ? withAlpha(c.brand, 0.14) : c.brandSoft, borderColor: withAlpha(isDark ? c.gold : c.brand, isDark ? 0.3 : 0.16) },
              ]}
            >
              <StoreIcon icon={icon} size={22} color={c.brand} active />
            </View>
          ) : (
            <LinearGradient
              colors={[c.goldBright, c.gold]}
              style={[styles.accent, eyebrow ? styles.accentTall : null]}
            />
          )}
          <View style={styles.titleCol}>
            {eyebrow ? (
              <Text style={type.eyebrow(c.goldText, 9.5)} numberOfLines={1}>
                {eyebrow}
              </Text>
            ) : null}
            <Text style={type.display(23, { ls: -0.5, lh: 27 })} numberOfLines={2} accessibilityRole="header">
              {title}
            </Text>
          </View>
        </View>
        {caption ? (
          <Text style={[type.ui(12.5, "medium", c.inkMute), styles.caption]} numberOfLines={2}>
            {caption}
          </Text>
        ) : null}
      </View>
      {action && onAction ? (
        <PressableScale scaleTo={0.96} lite
          onPress={onAction}
          hitSlop={10}
          style={[styles.action, { backgroundColor: withAlpha(c.brand, 0.08) }]}
          accessibilityRole="button"
          accessibilityLabel={action}
        >
          <Text style={type.ui(12.5, "extrabold", c.brand)}>{action}</Text>
          <Ionicons name="chevron-forward" size={13} color={c.brand} />
        </PressableScale>
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
  titleRow: { flexDirection: "row", alignItems: "center", gap: 9 },
  titleCol: { flexShrink: 1, gap: 1 },
  accent: { width: 3.5, height: 20, borderRadius: 2 },
  accentTall: { height: 40 },
  iconDisc: { width: 40, height: 40, borderRadius: 20, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  caption: { marginTop: 3, marginLeft: 12.5 },
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
