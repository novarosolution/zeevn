import React, { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../context/ThemeContext";
import { fonts, spacing, typography } from "../../theme/tokens";
import GoldHairline from "./GoldHairline";

export default function CollapsibleSection({ title, subtitle, children, defaultOpen = true }) {
  const [open, setOpen] = useState(defaultOpen);
  const { colors: c, isDark } = useTheme();
  return (
    <View style={styles.wrap}>
      <Pressable
        onPress={() => setOpen((v) => !v)}
        style={({ pressed }) => [
          styles.head,
          {
            backgroundColor: isDark ? c.surface : c.surfaceElevated || c.surface,
            borderColor: c.border,
          },
          pressed ? styles.headPressed : null,
        ]}
      >
        <View
          style={[
            styles.iconWrap,
            {
              backgroundColor: isDark ? "rgba(220, 38, 38, 0.16)" : c.primarySoft,
              borderColor: isDark ? "rgba(248, 113, 113, 0.28)" : c.primaryBorder,
            },
          ]}
        >
          <Ionicons name={open ? "sparkles-outline" : "chevron-forward-outline"} size={16} color={c.primary} />
        </View>
        <View style={styles.titleCol}>
          <Text style={[styles.title, { color: c.textPrimary }]}>{title}</Text>
          {subtitle ? <Text style={[styles.subtitle, { color: c.textSecondary }]}>{subtitle}</Text> : null}
        </View>
        <View
          style={[
            styles.chevronWrap,
            {
              backgroundColor: isDark ? "rgba(255,255,255,0.04)" : "rgba(255,255,255,0.86)",
              borderColor: c.border,
            },
          ]}
        >
          <Ionicons name={open ? "chevron-up-outline" : "chevron-down-outline"} size={18} color={c.textMuted} />
        </View>
      </Pressable>
      {open ? (
        <View
          style={[
            styles.body,
            {
              backgroundColor: isDark ? "rgba(255,255,255,0.02)" : "rgba(255,255,255,0.68)",
              borderColor: c.border,
            },
          ]}
        >
          <GoldHairline marginVertical={spacing.sm} withDot={false} />
          {children}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginTop: spacing.md,
  },
  head: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.sm,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 18,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
  },
  headPressed: {
    opacity: 0.92,
  },
  iconWrap: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  titleCol: {
    flex: 1,
  },
  title: {
    fontSize: typography.caption,
    fontFamily: fonts.bold,
    letterSpacing: 0.2,
  },
  subtitle: {
    marginTop: 3,
    fontSize: typography.caption,
    fontFamily: fonts.regular,
    lineHeight: 18,
  },
  chevronWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: "center",
    justifyContent: "center",
  },
  body: {
    marginTop: spacing.sm,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 18,
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
  },
});
