import React, { useEffect, useMemo } from "react";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, withRepeat, withSequence, withTiming } from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../context/ThemeContext";
import { HOME_LIVE_ORDER_CARD } from "../../content/appContent";
import { fonts, radius, spacing, typography } from "../../theme/tokens";
import useReducedMotion from "../../hooks/useReducedMotion";
import { getOrderStatusLabel } from "../../utils/orderStatus";

function getStepIndex(status) {
  const s = String(status || "").toLowerCase();
  if (s === "delivered") return 3;
  if (s === "out_for_delivery" || s === "shipped" || s === "ready_for_pickup") return 2;
  if (s === "preparing" || s === "paid") return 1;
  return 0;
}

function toEtaLabel(order) {
  const rawEta = order?.estimatedDeliveryAt || order?.eta || order?.deliveryEta || "";
  const date = rawEta ? new Date(rawEta) : null;
  if (date && Number.isFinite(date.getTime())) {
    const time = date.toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" });
    return `${HOME_LIVE_ORDER_CARD.etaPrefix} ${time}`;
  }
  return HOME_LIVE_ORDER_CARD.etaFallback;
}

export default function HomeLiveOrderPinnedCard({ order, onPress }) {
  const { colors: c, isDark } = useTheme();
  const reducedMotion = useReducedMotion();
  const styles = useMemo(() => createStyles(c, isDark), [c, isDark]);
  const pulse = useSharedValue(1);

  const stepLabels = Array.isArray(HOME_LIVE_ORDER_CARD.stepLabels)
    ? HOME_LIVE_ORDER_CARD.stepLabels
    : ["Placed", "Packed", "Out", "Delivered"];
  const activeStep = getStepIndex(order?.status);
  const etaLabel = toEtaLabel(order);
  const shortId = String(order?._id || "").slice(-4).toUpperCase() || "----";
  const itemCount = (order?.products || []).reduce((sum, item) => sum + Number(item?.quantity || 0), 0);
  const progressRatio = Math.min(1, Math.max(0, (activeStep + 1) / Math.max(1, stepLabels.length)));

  useEffect(() => {
    if (reducedMotion) {
      pulse.value = 1;
      return;
    }
    pulse.value = withRepeat(
      withSequence(withTiming(1.14, { duration: 900 }), withTiming(1, { duration: 900 })),
      -1,
      false
    );
  }, [pulse, reducedMotion]);

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulse.value }],
  }));

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed ? styles.cardPressed : null]}
      accessibilityRole="button"
      accessibilityLabel={`Order #${shortId}, ${getOrderStatusLabel(order?.status)}, ${etaLabel}`}
    >
      <View style={styles.topRow}>
        <View style={styles.statusPill}>
          <Text style={styles.statusPillText}>{getOrderStatusLabel(order?.status)}</Text>
        </View>
        <Text style={styles.etaText}>{etaLabel}</Text>
      </View>

      <View style={styles.stepsRow}>
        {stepLabels.map((label, index) => {
          const isActive = index === activeStep;
          const isDone = index < activeStep;
          return (
            <View key={`${label}-${index}`} style={styles.stepCell}>
              {isActive ? (
                <Animated.View style={[styles.stepDot, styles.stepDotActive, pulseStyle]} />
              ) : (
                <View style={[styles.stepDot, isDone ? styles.stepDotDone : null]} />
              )}
              <Text style={[styles.stepLabel, isActive ? styles.stepLabelActive : null]} numberOfLines={1}>
                {label}
              </Text>
            </View>
          );
        })}
      </View>

      <View style={styles.bottomRow}>
        <Text style={styles.summaryText} numberOfLines={1}>
          Order #{shortId} · {itemCount} items
        </Text>
        <View style={styles.trackRow}>
          <Text style={styles.trackLink}>{HOME_LIVE_ORDER_CARD.ctaTrack}</Text>
          <Ionicons name="chevron-forward" size={14} color={c.primary} />
        </View>
      </View>

      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${Math.round(progressRatio * 100)}%` }]} />
      </View>
    </Pressable>
  );
}

function createStyles(c, isDark) {
  return StyleSheet.create({
    card: {
      width: "100%",
      borderRadius: 14,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: isDark ? "rgba(255,255,255,0.14)" : "rgba(220,38,38,0.22)",
      backgroundColor: isDark ? "rgba(220,38,38,0.09)" : "rgba(220,38,38,0.06)",
      paddingHorizontal: spacing.md,
      paddingTop: spacing.sm + 2,
      paddingBottom: spacing.sm,
      gap: spacing.sm,
      ...Platform.select({
        web: { boxShadow: "0 2px 8px rgba(0,0,0,0.04)" },
        default: {},
      }),
    },
    cardPressed: {
      opacity: 0.9,
      transform: [{ scale: 0.995 }],
    },
    topRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: spacing.sm,
    },
    statusPill: {
      borderRadius: radius.pill,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: isDark ? "rgba(248,113,113,0.45)" : "rgba(220,38,38,0.28)",
      backgroundColor: isDark ? "rgba(220,38,38,0.14)" : "rgba(255,255,255,0.72)",
      paddingHorizontal: spacing.sm,
      paddingVertical: 5,
    },
    statusPillText: {
      fontFamily: fonts.semibold,
      fontSize: typography.caption,
      color: c.textPrimary,
      letterSpacing: 0.2,
    },
    etaText: {
      fontFamily: fonts.medium,
      fontSize: typography.caption,
      color: c.textSecondary,
      textAlign: "right",
      flexShrink: 1,
    },
    stepsRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: spacing.xs,
    },
    stepCell: {
      flex: 1,
      minWidth: 0,
      alignItems: "center",
      gap: 5,
    },
    stepDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: isDark ? "rgba(255,255,255,0.22)" : "rgba(100,116,139,0.36)",
    },
    stepDotActive: {
      backgroundColor: c.primary,
    },
    stepDotDone: {
      backgroundColor: isDark ? "rgba(248,113,113,0.8)" : "rgba(220,38,38,0.65)",
    },
    stepLabel: {
      fontFamily: fonts.medium,
      fontSize: 11,
      color: c.textMuted,
      textAlign: "center",
    },
    stepLabelActive: {
      color: c.textPrimary,
    },
    bottomRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: spacing.sm,
    },
    summaryText: {
      flex: 1,
      minWidth: 0,
      fontFamily: fonts.medium,
      fontSize: typography.caption,
      color: c.textSecondary,
    },
    trackRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 2,
      flexShrink: 0,
    },
    trackLink: {
      fontFamily: fonts.semibold,
      fontSize: typography.caption,
      color: c.primary,
    },
    progressTrack: {
      height: 3,
      borderRadius: 999,
      overflow: "hidden",
      backgroundColor: isDark ? "rgba(255,255,255,0.14)" : "rgba(100,116,139,0.2)",
    },
    progressFill: {
      height: "100%",
      borderRadius: 999,
      backgroundColor: c.primary,
    },
  });
}
