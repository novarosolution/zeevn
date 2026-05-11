import React, { memo, useMemo } from "react";
import { Platform, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { fonts, icon, radius, spacing, typography } from "../../theme/tokens";
import { ALCHEMY, FONT_DISPLAY } from "../../theme/customerAlchemy";
import { useTheme } from "../../context/ThemeContext";
import PremiumButton from "./PremiumButton";

/**
 * Empty state primitive: gold-tinted icon circle, display-font title, muted
 * body, optional CTA. Used for empty cart, empty orders, no notifications,
 * caught-up support, no deliveries, etc.
 */
function PremiumEmptyStateBase({
  iconName = "leaf-outline",
  title,
  description,
  titleLines,
  descriptionLines,
  ctaLabel,
  onCtaPress,
  ctaVariant = "primary",
  ctaIconLeft,
  secondaryCtaLabel,
  onSecondaryCtaPress,
  compact = false,
  style,
}) {
  const { colors: c, isDark } = useTheme();
  const styles = useMemo(() => createStyles(c, isDark, compact), [c, isDark, compact]);

  return (
    <View style={[styles.wrap, style]}>
      <View style={styles.iconCircle}>
        <Ionicons
          name={iconName}
          size={compact ? icon.display : icon.displayLg}
          color={isDark ? ALCHEMY.goldBright : ALCHEMY.brown}
        />
      </View>
      {title ? (
        <Text style={styles.title} numberOfLines={titleLines}>
          {title}
        </Text>
      ) : null}
      {description ? (
        <Text style={styles.description} numberOfLines={descriptionLines}>
          {description}
        </Text>
      ) : null}
      {ctaLabel || secondaryCtaLabel ? (
        <View style={styles.ctaRow}>
          {ctaLabel ? (
            <PremiumButton
              label={ctaLabel}
              onPress={onCtaPress}
              variant={ctaVariant}
              size="md"
              iconLeft={ctaIconLeft}
            />
          ) : null}
          {secondaryCtaLabel ? (
            <PremiumButton
              label={secondaryCtaLabel}
              onPress={onSecondaryCtaPress}
              variant="ghost"
              size="md"
            />
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

function createStyles(c, isDark, compact) {
  return StyleSheet.create({
    wrap: {
      width: "100%",
      maxWidth: 560,
      alignSelf: "center",
      paddingVertical: compact ? spacing.lg : spacing.xl,
      paddingHorizontal: spacing.lg,
      alignItems: "center",
      gap: spacing.sm,
    },
    iconCircle: {
      width: compact ? 64 : 80,
      height: compact ? 64 : 80,
      borderRadius: radius.pill,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: isDark ? "rgba(185, 28, 28, 0.16)" : ALCHEMY.goldSoft,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: isDark ? "rgba(220, 38, 38, 0.32)" : "rgba(185, 28, 28, 0.32)",
      marginBottom: spacing.xs,
      ...Platform.select({
        web: {
          boxShadow: isDark
            ? "0 14px 30px rgba(0,0,0,0.42), inset 0 1px 0 rgba(220,38,38,0.18)"
            : "0 14px 30px rgba(63, 63, 70, 0.12), inset 0 1px 0 rgba(255,255,255,0.95)",
        },
        ios: {
          shadowColor: isDark ? "#000" : "#18181B",
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: isDark ? 0.32 : 0.1,
          shadowRadius: 14,
        },
        android: { elevation: 3 },
        default: {},
      }),
    },
    title: {
      fontFamily: FONT_DISPLAY,
      fontSize: compact ? typography.h3 : typography.h2,
      lineHeight: compact ? typography.h3 + 6 : typography.h2 + 6,
      color: c.textPrimary,
      textAlign: "center",
      letterSpacing: -0.3,
      marginTop: spacing.xs,
      maxWidth: 360,
    },
    description: {
      fontFamily: fonts.medium,
      fontSize: typography.bodySmall,
      lineHeight: typography.bodySmall + 8,
      color: c.textSecondary,
      textAlign: "center",
      maxWidth: 380,
    },
    ctaRow: {
      marginTop: spacing.md,
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.sm,
      flexWrap: "wrap",
      justifyContent: "center",
    },
  });
}

const PremiumEmptyState = memo(PremiumEmptyStateBase);

export default PremiumEmptyState;
