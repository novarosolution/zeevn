import React from "react";
import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { fonts, icon, radius, spacing, typography } from "../../theme/tokens";
import { KANKREG_PALETTE } from "../../theme/kankregWeb";

function formatError(error) {
  if (!error) return "Unknown error";
  if (typeof error === "string") return error;
  return error.message || String(error);
}

/** Visible fallback when a lazy screen chunk fails to load or render. */
export default function ScreenLoadError({
  screenName = "Page",
  error,
  onRetry,
  details,
}) {
  const message = formatError(error);
  const detailText = details || message;

  return (
    <View style={styles.shell}>
      <ScrollView contentContainerStyle={styles.inner} keyboardShouldPersistTaps="handled">
        <View style={styles.iconWrap}>
          <Ionicons name="alert-circle-outline" size={icon.xl} color={KANKREG_PALETTE.gold} />
        </View>
        <Text style={styles.title}>{screenName} could not open</Text>
        <Text style={styles.message}>
          Something went wrong while loading this page. The error details are shown below.
        </Text>
        <View style={styles.detailBox}>
          <Text style={styles.detailLabel}>Error</Text>
          <Text selectable style={styles.detailText}>
            {detailText}
          </Text>
        </View>
        {onRetry ? (
          <Pressable
            onPress={onRetry}
            style={({ hovered, pressed }) => [
              styles.retryBtn,
              hovered && Platform.OS === "web" ? styles.retryBtnHover : null,
              pressed ? styles.retryBtnPressed : null,
            ]}
            accessibilityRole="button"
            accessibilityLabel="Retry loading page"
          >
            <Text style={styles.retryText}>Retry</Text>
          </Pressable>
        ) : null}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  shell: {
    flex: 1,
    width: "100%",
    backgroundColor: KANKREG_PALETTE.paper,
  },
  inner: {
    flexGrow: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xl,
    gap: spacing.md,
    maxWidth: 560,
    alignSelf: "center",
    width: "100%",
  },
  iconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(31, 92, 71, 0.12)",
  },
  title: {
    fontFamily: fonts.bold,
    fontSize: typography.h3,
    color: KANKREG_PALETTE.ink,
    textAlign: "center",
  },
  message: {
    fontFamily: fonts.regular,
    fontSize: typography.body,
    lineHeight: 22,
    color: KANKREG_PALETTE.inkSoft,
    textAlign: "center",
  },
  detailBox: {
    width: "100%",
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: "rgba(31, 92, 71, 0.22)",
    backgroundColor: "#fffdf8",
    padding: spacing.md,
    gap: spacing.xs,
  },
  detailLabel: {
    fontFamily: fonts.semibold,
    fontSize: 11,
    letterSpacing: 1,
    textTransform: "uppercase",
    color: KANKREG_PALETTE.inkSoft,
  },
  detailText: {
    fontFamily: Platform.select({ web: "monospace", default: fonts.regular }),
    fontSize: 12,
    lineHeight: 18,
    color: "#7a2e2e",
  },
  retryBtn: {
    marginTop: spacing.sm,
    paddingVertical: 12,
    paddingHorizontal: 22,
    borderRadius: radius.pill,
    backgroundColor: KANKREG_PALETTE.ink,
    ...Platform.select({ web: { cursor: "pointer" }, default: {} }),
  },
  retryBtnHover: {
    opacity: 0.92,
  },
  retryBtnPressed: {
    opacity: 0.85,
  },
  retryText: {
    fontFamily: fonts.semibold,
    fontSize: typography.bodySmall,
    color: "#fffdf8",
  },
});
