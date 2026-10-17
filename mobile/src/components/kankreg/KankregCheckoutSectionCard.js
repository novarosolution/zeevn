import React from "react";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { FIGMA, figmaDisplayTitle, figmaTextMuted } from "../../theme/figmaApp";
import { KANKREG_PALETTE, ZEEVAN_GOLD } from "../../theme/kankregWeb";
import { useTheme } from "../../context/ThemeContext";
import { fonts, spacing } from "../../theme/tokens";

/** Premium checkout section shell — delivery, payment, etc. */
export default function KankregCheckoutSectionCard({
  title,
  subtitle,
  actionLabel,
  onActionPress,
  children,
  style,
}) {
  const { isDark } = useTheme();

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: isDark ? "#181513" : KANKREG_PALETTE.card,
          borderColor: isDark ? "#3f3933" : "rgba(36, 68, 36, 0.1)",
        },
        style,
      ]}
    >
      <LinearGradient
        colors={
          isDark
            ? ["rgba(232,188,132,0.55)", "rgba(232,188,132,0)", "rgba(232,188,132,0.35)"]
            : [ZEEVAN_GOLD.base, "rgba(220,172,116,0.15)", ZEEVAN_GOLD.deep]
        }
        start={{ x: 0, y: 0.5 }}
        end={{ x: 1, y: 0.5 }}
        style={styles.goldRule}
        pointerEvents="none"
      />
      <View style={styles.head}>
        <View style={styles.headText}>
          <Text style={[figmaDisplayTitle(18, isDark), styles.title]}>{title}</Text>
          {subtitle ? <Text style={[styles.subtitle, figmaTextMuted(isDark)]}>{subtitle}</Text> : null}
        </View>
        {actionLabel && onActionPress ? (
          <Pressable
            onPress={onActionPress}
            hitSlop={8}
            style={({ pressed, hovered }) => [
              styles.actionHit,
              Platform.OS === "web" && hovered && styles.actionHover,
              pressed && { opacity: 0.85 },
            ]}
          >
            <Text style={[styles.action, { color: isDark ? FIGMA.goldBright : FIGMA.goldDeep }]}>
              {actionLabel}
            </Text>
          </Pressable>
        ) : null}
      </View>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    position: "relative",
    borderRadius: 18,
    padding: 18,
    marginBottom: 14,
    marginHorizontal: FIGMA.gutter,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: "hidden",
    ...Platform.select({
      web: { boxShadow: "0 12px 32px -20px rgba(36, 68, 36, 0.2)" },
      ios: {
        shadowColor: "#3D2A12",
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.07,
        shadowRadius: 14,
      },
      android: { elevation: 2 },
      default: {},
    }),
  },
  goldRule: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 2,
  },
  head: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 12,
    marginBottom: spacing.md,
    paddingTop: 4,
  },
  headText: {
    flex: 1,
    minWidth: 0,
  },
  title: {
    fontWeight: "500",
  },
  subtitle: {
    fontFamily: fonts.regular,
    fontSize: 13,
    marginTop: 6,
    lineHeight: 18,
  },
  actionHit: {
    paddingVertical: 4,
    paddingHorizontal: 6,
  },
  actionHover: {
    opacity: 0.9,
  },
  action: {
    fontFamily: fonts.semibold,
    fontSize: 12,
    letterSpacing: 0.2,
  },
});
