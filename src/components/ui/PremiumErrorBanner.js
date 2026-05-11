import React, { memo, useMemo } from "react";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Animated, { FadeIn, FadeOut } from "react-native-reanimated";
import { fonts, icon, radius, spacing, typography } from "../../theme/tokens";
import { useTheme } from "../../context/ThemeContext";
import useReducedMotion from "../../hooks/useReducedMotion";

const SEVERITY_TOKENS = {
  error: { iconName: "alert-circle", colorKey: "danger" },
  warning: { iconName: "warning", colorKey: "primary" },
  info: { iconName: "information-circle", colorKey: "primary" },
  success: { iconName: "checkmark-circle", colorKey: "secondary" },
};

/**
 * Inline banner for error/warning/info/success messages. Same visual language
 * as `SessionExpiredBanner` but rendered inline (not toast) with a severity
 * prop. Used to replace ad-hoc red `Text` rows on customer screens.
 */
function PremiumErrorBannerBase({
  severity = "error",
  title,
  message,
  titleLines,
  messageLines,
  onClose,
  onActionPress,
  actionLabel,
  style,
  compact = false,
}) {
  const { colors: c, isDark } = useTheme();
  const reducedMotion = useReducedMotion();
  const sev = SEVERITY_TOKENS[severity] || SEVERITY_TOKENS.error;
  const accent = c[sev.colorKey] || c.danger;
  const styles = useMemo(
    () => createStyles(c, isDark, accent, compact),
    [c, isDark, accent, compact]
  );

  return (
    <Animated.View
      entering={reducedMotion ? undefined : FadeIn.duration(200)}
      exiting={reducedMotion ? undefined : FadeOut.duration(160)}
      style={[styles.wrap, style]}
      accessibilityLiveRegion="polite"
      accessibilityRole={severity === "error" ? "alert" : undefined}
    >
      <View style={styles.iconBubble}>
        <Ionicons name={sev.iconName} size={icon.sm} color={accent} />
      </View>
      <View style={styles.body}>
        {title ? (
          <Text style={styles.title} numberOfLines={titleLines}>
            {title}
          </Text>
        ) : null}
        {message ? (
          <Text style={styles.message} numberOfLines={messageLines}>
            {message}
          </Text>
        ) : null}
      </View>
      {onActionPress && actionLabel ? (
        <Pressable
          onPress={onActionPress}
          style={({ pressed }) => [styles.actionBtn, pressed ? { opacity: 0.85 } : null]}
          accessibilityRole="button"
          accessibilityLabel={actionLabel}
        >
          <Text style={styles.actionText}>{actionLabel}</Text>
        </Pressable>
      ) : null}
      {onClose ? (
        <Pressable
          onPress={onClose}
          hitSlop={10}
          style={({ pressed }) => [styles.closeBtn, pressed ? { opacity: 0.7 } : null]}
          accessibilityRole="button"
          accessibilityLabel="Dismiss"
        >
          <Ionicons name="close" size={icon.sm} color={c.textMuted} />
        </Pressable>
      ) : null}
    </Animated.View>
  );
}

function createStyles(c, isDark, accent, compact) {
  return StyleSheet.create({
    wrap: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.sm,
      paddingVertical: compact ? spacing.xs + 2 : spacing.sm,
      paddingHorizontal: spacing.md - 2,
      borderRadius: radius.lg,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: accent + "40",
      backgroundColor: isDark
        ? "rgba(28, 25, 23, 0.92)"
        : "rgba(255, 253, 249, 0.96)",
      borderTopWidth: 2,
      borderTopColor: accent + "99",
      ...Platform.select({
        web: {
          boxShadow: isDark
            ? "0 14px 28px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.05)"
            : "0 14px 28px rgba(28, 25, 23, 0.08), inset 0 1px 0 rgba(255,255,255,0.95)",
        },
        ios: {
          shadowColor: "#1a1208",
          shadowOffset: { width: 0, height: 6 },
          shadowOpacity: isDark ? 0.32 : 0.1,
          shadowRadius: 12,
        },
        android: { elevation: 3 },
        default: {},
      }),
    },
    iconBubble: {
      width: 32,
      height: 32,
      borderRadius: 16,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: accent + "1F",
    },
    body: {
      flex: 1,
      minWidth: 0,
      gap: 2,
    },
    title: {
      fontFamily: fonts.bold,
      fontSize: typography.bodySmall,
      color: c.textPrimary,
    },
    message: {
      fontFamily: fonts.medium,
      fontSize: typography.caption,
      lineHeight: 18,
      color: c.textSecondary,
    },
    actionBtn: {
      paddingVertical: 6,
      paddingHorizontal: 12,
      borderRadius: radius.pill,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: accent + "55",
      backgroundColor: accent + "12",
    },
    actionText: {
      fontFamily: fonts.bold,
      fontSize: typography.caption,
      letterSpacing: 0.3,
      color: accent,
    },
    closeBtn: {
      width: 28,
      height: 28,
      alignItems: "center",
      justifyContent: "center",
      borderRadius: 14,
    },
  });
}

const PremiumErrorBanner = memo(PremiumErrorBannerBase);

export default PremiumErrorBanner;
