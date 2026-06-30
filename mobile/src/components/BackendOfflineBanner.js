import React from "react";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";
import Animated, { FadeInDown, FadeOutUp } from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";
import { isLocalApiUrl } from "../services/apiBase";
import { useApiHealth } from "../context/ApiHealthContext";
import { useTheme } from "../context/ThemeContext";
import { fonts, icon, spacing, typography } from "../theme/tokens";
import useReducedMotion from "../hooks/useReducedMotion";

/**
 * Shown when the Zeevan API health check fails.
 */
export default function BackendOfflineBanner() {
  const { isOnline, checking, apiBaseUrl, retry } = useApiHealth();
  const { isDark } = useTheme();
  const reducedMotion = useReducedMotion();

  if (isOnline || checking) return null;

  const hint = isLocalApiUrl(apiBaseUrl)
    ? "Start the local API: npm run backend:dev (repo root), then retry."
    : "The shop could not reach the API. If this is your first visit today, wait a moment and tap Retry — the server may be waking up.";

  return (
    <Animated.View
      entering={reducedMotion ? undefined : FadeInDown.duration(280)}
      exiting={reducedMotion ? undefined : FadeOutUp.duration(220)}
      style={[
        styles.wrap,
        {
          backgroundColor: isDark ? "rgba(28, 25, 23, 0.96)" : "rgba(255, 251, 245, 0.98)",
          borderColor: isDark ? "rgba(168, 184, 108, 0.35)" : "rgba(92, 104, 52, 0.4)",
        },
      ]}
      accessibilityRole="alert"
    >
      <Ionicons name="cloud-offline-outline" size={icon.md} color={isDark ? "#C4D088" : "#244424"} />
      <View style={styles.textCol}>
        <Text style={[styles.title, { color: isDark ? "#f5efe4" : "#1a1510" }]}>Cannot reach server</Text>
        <Text style={[styles.body, { color: isDark ? "rgba(245,239,228,0.75)" : "#5c4d3a" }]} numberOfLines={3}>
          {hint}
        </Text>
        <Text style={[styles.url, { color: isDark ? "#788844" : "#244424" }]} numberOfLines={1}>
          {apiBaseUrl}
        </Text>
      </View>
      <Pressable onPress={retry} style={styles.retryBtn} accessibilityRole="button" accessibilityLabel="Retry">
        <Text style={styles.retryText}>Retry</Text>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: "absolute",
    top: Platform.select({ web: 72, default: 8 }),
    left: spacing.md,
    right: spacing.md,
    zIndex: 500,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    ...Platform.select({
      web: { maxWidth: 520, alignSelf: "center", left: "50%", right: "auto", marginLeft: -260 },
      default: {},
    }),
  },
  textCol: { flex: 1, minWidth: 0 },
  title: { fontFamily: fonts.bold, fontSize: typography.body, marginBottom: 4 },
  body: { fontSize: typography.caption, lineHeight: 18 },
  url: { fontFamily: fonts.medium, fontSize: 11, marginTop: 6 },
  retryBtn: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: "rgba(92, 104, 52, 0.15)",
  },
  retryText: { fontFamily: fonts.semibold, fontSize: 13, color: "#244424" },
});
