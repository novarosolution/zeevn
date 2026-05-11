import React, { memo, useEffect, useMemo } from "react";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  Easing,
} from "react-native-reanimated";
import { PAYMENT_METHODS } from "../../content/appContent";
import { ALCHEMY, FONT_DISPLAY } from "../../theme/customerAlchemy";
import { useTheme } from "../../context/ThemeContext";
import { fonts, icon, radius, semanticRadius, spacing, typography } from "../../theme/tokens";
import useReducedMotion from "../../hooks/useReducedMotion";
import RazorpayBrandStrip from "./RazorpayBrandStrip";

/**
 * Two-option payment selector for checkout — Razorpay vs Cash on Delivery.
 * Uses gold-framed selection state + animated checkmark when reduced motion is off.
 */
function PaymentMethodSelectorBase({ value, onChange, disabled }) {
  const { colors: c, isDark } = useTheme();
  const reducedMotion = useReducedMotion();
  const styles = useMemo(() => createStyles(c, isDark), [c, isDark]);

  return (
    <View style={styles.shell} accessibilityRole="radiogroup">
      <View style={styles.sectionHeader}>
        <View style={[styles.sectionIconWrap, { backgroundColor: c.primarySoft, borderColor: c.primaryBorder }]}>
          <Ionicons name="wallet-outline" size={icon.sm} color={c.primaryDark} />
        </View>
        <Text style={styles.sectionTitle}>Payment method</Text>
      </View>
      <Text style={styles.sectionHint}>Choose how you’d like to settle this order.</Text>

      <View style={styles.grid}>
        {PAYMENT_METHODS.map((method) => (
          <PaymentMethodCard
            key={method.id}
            method={method}
            selected={value === method.id}
            disabled={disabled}
            reducedMotion={reducedMotion}
            onPress={() => onChange(method.id)}
            styles={styles}
            isDark={isDark}
            c={c}
          />
        ))}
      </View>
    </View>
  );
}

function PaymentMethodCard({ method, selected, disabled, reducedMotion, onPress, styles, isDark, c }) {
  const scale = useSharedValue(selected ? 1 : 0);
  useEffect(() => {
    scale.value = withTiming(selected ? 1 : 0, {
      duration: reducedMotion ? 0 : 220,
      easing: Easing.out(Easing.cubic),
    });
  }, [selected, scale, reducedMotion]);

  const checkStyle = useAnimatedStyle(() => ({
    opacity: scale.value,
    transform: [{ scale: 0.85 + scale.value * 0.15 }],
  }));

  const isRazorpay = method.id === "Razorpay";

  return (
    <Pressable
      onPress={disabled ? undefined : onPress}
      disabled={disabled}
      accessibilityRole="radio"
      accessibilityState={{ selected, disabled }}
      accessibilityLabel={`${method.title}. ${method.subtitle}`}
      style={({ pressed, hovered }) => [
        styles.cardOuter,
        selected ? styles.cardOuterSelected : null,
        hovered && Platform.OS === "web" && !disabled ? styles.cardOuterHover : null,
        pressed ? styles.cardOuterPressed : null,
        disabled ? styles.cardDisabled : null,
      ]}
    >
      <View style={styles.cardTopRow}>
        <View style={[styles.iconCircle, isRazorpay ? styles.iconCircleGold : styles.iconCircleBrown]}>
          <Ionicons
            name={method.icon}
            size={icon.md}
            color={isRazorpay ? (isDark ? ALCHEMY.goldBright : ALCHEMY.brown) : c.secondaryDark}
          />
        </View>
        <View style={styles.cardTitleCol}>
          <View style={styles.eyebrowRow}>
            <Text style={[styles.eyebrow, selected ? styles.eyebrowSelected : null]}>{method.eyebrow}</Text>
            {method.badge ? (
              <View style={styles.recBadge}>
                <Text style={styles.recBadgeText}>{method.badge}</Text>
              </View>
            ) : null}
          </View>
          <Text style={[styles.cardTitle, { color: isDark ? c.textPrimary : ALCHEMY.brown }]}>{method.title}</Text>
          <Text style={styles.cardSubtitle}>{method.subtitle}</Text>
        </View>
        <Animated.View style={[styles.checkWrap, checkStyle]}>
          <Ionicons name="checkmark-circle" size={icon.lg} color={c.primary} />
        </Animated.View>
      </View>

      {isRazorpay && method.brandStrip ? (
        <RazorpayBrandStrip brands={method.brandStrip} selected={selected} compact />
      ) : null}

      {method.secureNote ? (
        <Text style={[styles.secureNote, selected ? styles.secureNoteSelected : null]}>{method.secureNote}</Text>
      ) : null}
    </Pressable>
  );
}

function createStyles(c, isDark) {
  return StyleSheet.create({
    shell: {
      marginBottom: spacing.md,
    },
    sectionHeader: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.sm,
      marginBottom: spacing.xs,
    },
    sectionIconWrap: {
      width: 36,
      height: 36,
      borderRadius: semanticRadius.full,
      borderWidth: 1,
      alignItems: "center",
      justifyContent: "center",
    },
    sectionTitle: {
      flex: 1,
      fontFamily: fonts.extrabold,
      fontSize: typography.body,
      color: c.textPrimary,
    },
    sectionHint: {
      fontFamily: fonts.regular,
      fontSize: typography.caption,
      color: c.textSecondary,
      lineHeight: 18,
      marginBottom: spacing.md,
      marginLeft: 44,
    },
    grid: {
      gap: spacing.sm,
    },
    cardOuter: {
      borderRadius: radius.xxl,
      padding: spacing.md,
      borderWidth: StyleSheet.hairlineWidth * 2,
      borderColor: isDark ? "rgba(220, 38, 38, 0.14)" : "rgba(63, 63, 70, 0.14)",
      backgroundColor: isDark ? c.surface : ALCHEMY.cardBg,
      ...Platform.select({
        web: {
          cursor: "pointer",
          transition: "border-color 0.2s ease, box-shadow 0.2s ease, transform 0.2s ease",
        },
        default: {},
      }),
    },
    cardOuterSelected: {
      borderColor: isDark ? ALCHEMY.goldBright : ALCHEMY.gold,
      borderWidth: 2,
      ...Platform.select({
        ios: {
          shadowColor: ALCHEMY.gold,
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: isDark ? 0.25 : 0.18,
          shadowRadius: 12,
        },
        android: { elevation: isDark ? 5 : 4 },
        web: {
          boxShadow: isDark
            ? "0 12px 28px rgba(0,0,0,0.35), 0 0 0 1px rgba(220,38,38,0.35)"
            : "0 14px 32px rgba(24, 24, 27, 0.12), 0 0 0 1px rgba(220, 38, 38, 0.35)",
        },
        default: {},
      }),
    },
    cardOuterHover: {
      ...Platform.select({
        web: {
          transform: [{ translateY: -2 }],
          boxShadow: isDark
            ? "0 18px 36px rgba(0,0,0,0.4)"
            : "0 18px 36px rgba(24, 24, 27, 0.14)",
        },
        default: {},
      }),
    },
    cardOuterPressed: {
      opacity: 0.94,
    },
    cardDisabled: {
      opacity: 0.55,
    },
    cardTopRow: {
      flexDirection: "row",
      alignItems: "flex-start",
      gap: spacing.sm,
    },
    iconCircle: {
      width: 44,
      height: 44,
      borderRadius: 22,
      alignItems: "center",
      justifyContent: "center",
      borderWidth: StyleSheet.hairlineWidth,
    },
    iconCircleGold: {
      backgroundColor: isDark ? "rgba(220, 38, 38, 0.12)" : "rgba(255, 244, 219, 1)",
      borderColor: isDark ? "rgba(220, 38, 38, 0.35)" : ALCHEMY.gold,
    },
    iconCircleBrown: {
      backgroundColor: isDark ? c.secondarySoft : "#ECFDF3",
      borderColor: c.secondaryBorder,
    },
    cardTitleCol: {
      flex: 1,
      minWidth: 0,
    },
    eyebrowRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      flexWrap: "wrap",
      marginBottom: 2,
    },
    eyebrow: {
      fontFamily: fonts.bold,
      fontSize: typography.overline - 1,
      letterSpacing: 1,
      color: c.textMuted,
    },
    eyebrowSelected: {
      color: isDark ? ALCHEMY.goldBright : ALCHEMY.goldDeep,
    },
    recBadge: {
      paddingHorizontal: 7,
      paddingVertical: 2,
      borderRadius: radius.pill,
      backgroundColor: isDark ? "rgba(220, 38, 38, 0.18)" : ALCHEMY.goldSoft,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: isDark ? "rgba(220, 38, 38, 0.4)" : ALCHEMY.gold,
    },
    recBadgeText: {
      fontFamily: fonts.extrabold,
      fontSize: 9,
      letterSpacing: 0.8,
      color: isDark ? ALCHEMY.goldBright : ALCHEMY.brown,
    },
    cardTitle: {
      fontFamily: FONT_DISPLAY,
      fontSize: typography.h3 - 1,
      letterSpacing: -0.2,
      lineHeight: 24,
    },
    cardSubtitle: {
      marginTop: 4,
      fontFamily: fonts.regular,
      fontSize: typography.caption,
      color: c.textSecondary,
      lineHeight: 18,
    },
    checkWrap: {
      marginLeft: 4,
      marginTop: -2,
    },
    secureNote: {
      marginTop: spacing.sm,
      fontFamily: fonts.medium,
      fontSize: typography.overline,
      color: c.textMuted,
      letterSpacing: 0.2,
    },
    secureNoteSelected: {
      color: c.textSecondary,
    },
  });
}

const PaymentMethodSelector = memo(PaymentMethodSelectorBase);

export default PaymentMethodSelector;
