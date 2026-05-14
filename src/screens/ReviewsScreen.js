import React, { useMemo } from "react";
import { Platform, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../context/ThemeContext";
import { HOME_TESTIMONIALS } from "../content/appContent";
import { fonts, icon, radius, spacing, typography } from "../theme/tokens";
import { ALCHEMY, FONT_DISPLAY } from "../theme/customerAlchemy";

function StarRow({ rating = 5, color, style }) {
  return (
    <View style={style}>
      {Array.from({ length: 5 }).map((_, idx) => (
        <Ionicons key={idx} name={idx < rating ? "star" : "star-outline"} size={12} color={color} />
      ))}
    </View>
  );
}

export default function ReviewsScreen({ navigation }) {
  const { colors: c, isDark } = useTheme();
  const localStyles = useMemo(() => createStyles(c, isDark), [c, isDark]);

  return (
    <SafeAreaView style={localStyles.safe}>
      <ScrollView contentContainerStyle={localStyles.content} showsVerticalScrollIndicator={false}>
        <Pressable
          onPress={() => (navigation.canGoBack?.() ? navigation.goBack() : navigation.navigate("Home"))}
          style={({ pressed }) => [localStyles.backBtn, pressed ? localStyles.backBtnPressed : null]}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <Ionicons name="chevron-back" size={icon.md} color={c.textPrimary} />
          <Text style={localStyles.backText}>Back</Text>
        </Pressable>

        <Text style={localStyles.overline}>{HOME_TESTIMONIALS.overline}</Text>
        <Text style={localStyles.title}>Read more stories</Text>

        {(HOME_TESTIMONIALS.items || []).map((item) => (
          <View
            key={item.key}
            style={[
              localStyles.card,
              { borderColor: isDark ? "rgba(255,255,255,0.14)" : "rgba(63,63,70,0.18)", backgroundColor: c.surface },
            ]}
          >
            <Text style={localStyles.quoteGlyph}>“</Text>
            <Text style={[localStyles.quote, { color: c.textPrimary }]}>{item.quote}</Text>
            <View style={[localStyles.divider, { backgroundColor: isDark ? "rgba(255,255,255,0.14)" : "rgba(100,116,139,0.2)" }]} />
            <View style={localStyles.metaRow}>
              <View style={[localStyles.avatar, { backgroundColor: isDark ? "rgba(255,255,255,0.08)" : "rgba(248,250,252,0.92)" }]}>
                <Text style={[localStyles.avatarText, { color: c.textPrimary }]}>
                  {String(item.name || "?")
                    .split(" ")
                    .map((p) => String(p || "").slice(0, 1).toUpperCase())
                    .join("")
                    .slice(0, 2)}
                </Text>
              </View>
              <View style={localStyles.metaTextWrap}>
                <Text style={[localStyles.name, { color: c.textPrimary }]}>{item.name}</Text>
                <Text style={[localStyles.city, { color: c.textMuted }]}>{item.city}</Text>
              </View>
              <StarRow rating={item.rating} color={isDark ? ALCHEMY.goldBright : ALCHEMY.gold} style={localStyles.starRow} />
            </View>
          </View>
        ))}
      </ScrollView>
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
      ...Platform.select({ web: { cursor: "pointer" }, default: {} }),
    },
    backBtnPressed: { opacity: 0.8 },
    backText: {
      fontFamily: fonts.semibold,
      fontSize: typography.bodySmall,
      color: c.textPrimary,
      marginRight: 2,
    },
    overline: {
      fontFamily: fonts.extrabold,
      fontSize: typography.overline + 1,
      letterSpacing: 1.5,
      textTransform: "uppercase",
      color: c.textMuted,
      textAlign: "center",
    },
    title: {
      fontFamily: FONT_DISPLAY,
      fontSize: typography.h2,
      lineHeight: typography.h2 + 8,
      color: c.textPrimary,
      textAlign: "center",
      marginBottom: spacing.xs,
    },
    card: {
      borderRadius: 16,
      borderWidth: StyleSheet.hairlineWidth,
      padding: 24,
      gap: spacing.sm,
    },
    quoteGlyph: {
      fontFamily: FONT_DISPLAY,
      fontSize: 40,
      lineHeight: 42,
      color: ALCHEMY.gold,
      opacity: 0.4,
    },
    quote: {
      fontFamily: FONT_DISPLAY,
      fontSize: 16,
      lineHeight: 25,
    },
    divider: {
      height: StyleSheet.hairlineWidth,
    },
    metaRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.sm,
    },
    avatar: {
      width: 30,
      height: 30,
      borderRadius: 15,
      alignItems: "center",
      justifyContent: "center",
    },
    avatarText: {
      fontFamily: fonts.semibold,
      fontSize: 12,
    },
    metaTextWrap: {
      flex: 1,
    },
    name: {
      fontFamily: fonts.medium,
      fontSize: 14,
    },
    city: {
      fontFamily: fonts.medium,
      fontSize: 12,
      marginTop: 1,
    },
    starRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 1,
    },
  });
}
