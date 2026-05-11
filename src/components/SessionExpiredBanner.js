import React, { useEffect, useRef } from "react";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";
import Animated, { FadeInDown, FadeOutUp } from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../context/ThemeContext";
import { useAuth } from "../context/AuthContext";
import { fonts, icon, radius, spacing, typography } from "../theme/tokens";
import useReducedMotion from "../hooks/useReducedMotion";

/**
 * Toast-style banner that appears when AuthContext flags the session as
 * expired (e.g. refresh attempt failed). Auto-dismisses after a short delay
 * but also offers a manual close action so the user controls the moment.
 */
export default function SessionExpiredBanner({ onSignIn }) {
  const { sessionExpired, acknowledgeSessionExpired } = useAuth();
  const { colors: c, isDark } = useTheme();
  const reducedMotion = useReducedMotion();
  const dismissTimerRef = useRef(null);

  useEffect(() => {
    if (!sessionExpired) return undefined;
    dismissTimerRef.current = setTimeout(() => {
      acknowledgeSessionExpired();
    }, 6500);
    return () => {
      if (dismissTimerRef.current) {
        clearTimeout(dismissTimerRef.current);
        dismissTimerRef.current = null;
      }
    };
  }, [sessionExpired, acknowledgeSessionExpired]);

  if (!sessionExpired) return null;

  return (
    <Animated.View
      entering={reducedMotion ? undefined : FadeInDown.duration(280)}
      exiting={reducedMotion ? undefined : FadeOutUp.duration(220)}
      style={[
        styles.wrap,
        {
          backgroundColor: isDark ? "rgba(28, 25, 23, 0.95)" : "rgba(255, 253, 249, 0.98)",
          borderColor: isDark ? "rgba(248, 113, 113, 0.4)" : "rgba(220, 38, 38, 0.32)",
        },
      ]}
      accessibilityLiveRegion="polite"
      accessibilityRole="alert"
    >
      <View
        style={[
          styles.iconBubble,
          {
            backgroundColor: isDark ? "rgba(248, 113, 113, 0.18)" : "rgba(220, 38, 38, 0.1)",
          },
        ]}
      >
        <Ionicons name="time-outline" size={icon.md} color={c.danger} />
      </View>
      <View style={styles.body}>
        <Text style={[styles.title, { color: c.textPrimary }]} numberOfLines={1}>
          Session expired
        </Text>
        <Text style={[styles.sub, { color: c.textSecondary }]} numberOfLines={2}>
          Please sign in again to continue where you left off.
        </Text>
      </View>
      <View style={styles.actions}>
        {onSignIn ? (
          <Pressable
            onPress={() => {
              acknowledgeSessionExpired();
              onSignIn();
            }}
            style={({ pressed }) => [
              styles.primaryBtn,
              { backgroundColor: c.primary },
              pressed ? { opacity: 0.85 } : null,
            ]}
            accessibilityRole="button"
            accessibilityLabel="Sign in again"
          >
            <Text style={[styles.primaryBtnText, { color: c.onPrimary }]}>Sign in</Text>
          </Pressable>
        ) : null}
        <Pressable
          onPress={acknowledgeSessionExpired}
          hitSlop={10}
          style={({ pressed }) => [styles.closeBtn, pressed ? { opacity: 0.7 } : null]}
          accessibilityRole="button"
          accessibilityLabel="Dismiss notification"
        >
          <Ionicons name="close" size={icon.sm} color={c.textMuted} />
        </Pressable>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingVertical: spacing.sm + 2,
    paddingHorizontal: spacing.md,
    borderRadius: radius.lg + 2,
    borderWidth: StyleSheet.hairlineWidth,
    borderTopWidth: 2,
    borderTopColor: "rgba(220, 38, 38, 0.6)",
    marginHorizontal: spacing.md,
    marginTop: spacing.sm,
    ...Platform.select({
      ios: {
        shadowColor: "#1a1208",
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.16,
        shadowRadius: 16,
      },
      android: { elevation: 4 },
      web: {
        boxShadow: "0 16px 36px rgba(28, 25, 23, 0.14), inset 0 1px 0 rgba(255,255,255,0.78)",
      },
      default: {},
    }),
  },
  iconBubble: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  body: {
    flex: 1,
    minWidth: 0,
  },
  title: {
    fontSize: typography.bodySmall,
    fontFamily: fonts.bold,
  },
  sub: {
    marginTop: 1,
    fontSize: typography.caption,
    fontFamily: fonts.medium,
    lineHeight: 16,
  },
  actions: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  primaryBtn: {
    paddingVertical: spacing.xs + 2,
    paddingHorizontal: spacing.sm + 2,
    borderRadius: radius.pill,
  },
  primaryBtnText: {
    fontFamily: fonts.bold,
    fontSize: typography.caption,
    letterSpacing: 0.2,
  },
  closeBtn: {
    width: 28,
    height: 28,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 14,
  },
});
