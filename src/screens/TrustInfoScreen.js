import React, { useMemo } from "react";
import { Platform, Pressable, SafeAreaView, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../context/ThemeContext";
import { fonts, icon, radius, spacing, typography } from "../theme/tokens";

const TRUST_PAGE_COPY = {
  quality: {
    overline: "Quality",
    title: "Curated quality",
    body: "We hand-select pantry essentials from trusted growers and partners, then review each batch for consistency before it reaches your basket.",
  },
  process: {
    overline: "Process",
    title: "Small-batch crafted",
    body: "Products are prepared in smaller runs to preserve freshness and flavor, with careful handling across packing and fulfilment.",
  },
  delivery: {
    overline: "Delivery",
    title: "Reliable doorstep delivery",
    body: "Most orders arrive the same day or next day in serviceable areas, with clear status updates and dependable handoff.",
  },
};

export default function TrustInfoScreen({ navigation, topic = "quality" }) {
  const { colors: c, isDark } = useTheme();
  const styles = useMemo(() => createStyles(c, isDark), [c, isDark]);
  const copy = TRUST_PAGE_COPY[topic] || TRUST_PAGE_COPY.quality;

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.content}>
        <Pressable
          onPress={() => (navigation.canGoBack?.() ? navigation.goBack() : navigation.navigate("Home"))}
          style={({ pressed }) => [styles.backBtn, pressed ? styles.backBtnPressed : null]}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <Ionicons name="chevron-back" size={icon.md} color={c.textPrimary} />
          <Text style={styles.backText}>Back</Text>
        </Pressable>
        <View style={styles.card}>
          <Text style={styles.overline}>{copy.overline}</Text>
          <Text style={styles.title}>{copy.title}</Text>
          <Text style={styles.body}>{copy.body}</Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

function createStyles(c, isDark) {
  return StyleSheet.create({
    safe: {
      flex: 1,
      backgroundColor: c.background,
    },
    content: {
      flex: 1,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.md,
      gap: spacing.md,
    },
    backBtn: {
      alignSelf: "flex-start",
      minHeight: 44,
      borderRadius: radius.pill,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: isDark ? "rgba(255,255,255,0.16)" : "rgba(100,116,139,0.22)",
      paddingHorizontal: spacing.sm,
      flexDirection: "row",
      alignItems: "center",
      gap: 2,
      ...Platform.select({
        web: { cursor: "pointer" },
        default: {},
      }),
    },
    backBtnPressed: {
      opacity: 0.82,
    },
    backText: {
      fontFamily: fonts.semibold,
      color: c.textPrimary,
      fontSize: typography.bodySmall,
      marginRight: 2,
    },
    card: {
      borderRadius: 14,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: isDark ? "rgba(255,255,255,0.16)" : "rgba(63,63,70,0.18)",
      backgroundColor: c.surface,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.md + 2,
      gap: spacing.xs,
    },
    overline: {
      fontFamily: fonts.extrabold,
      fontSize: typography.overline,
      letterSpacing: 1.2,
      textTransform: "uppercase",
      color: c.textMuted,
    },
    title: {
      fontFamily: fonts.semibold,
      fontSize: typography.h4 + 2,
      lineHeight: typography.h4 + 8,
      color: c.textPrimary,
      letterSpacing: -0.2,
    },
    body: {
      fontFamily: fonts.regular,
      fontSize: typography.bodySmall + 1,
      lineHeight: typography.body + 6,
      color: c.textSecondary,
      marginTop: spacing.xs,
    },
  });
}
