import React, { useEffect, useMemo } from "react";
import { Platform, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import CustomerScreenShell from "../components/CustomerScreenShell";
import BottomNavBar from "../components/BottomNavBar";
import KankregScrollPage from "../components/kankreg/KankregScrollPage";
import SectionReveal from "../components/motion/SectionReveal";
import PremiumButton from "../components/ui/PremiumButton";
import PremiumCard from "../components/ui/PremiumCard";
import GoldHairline from "../components/ui/GoldHairline";
import useReducedMotion from "../hooks/useReducedMotion";
import {
  ORDER_CELEBRATION_UI,
  formatOrderReference,
  orderItemCount,
  orderPaymentLabel,
} from "../content/appContent";
import { useTheme } from "../context/ThemeContext";
import { useKankregLayout } from "../theme/kankregBreakpoints";
import { ALCHEMY, getCustomerShellGradient } from "../theme/customerAlchemy";
import { FONT_HEADING, FONT_PRICE } from "../theme/typographyRoles";
import { customerPanel, customerScrollFill } from "../theme/screenLayout";
import { KANKREG_PALETTE } from "../theme/kankregWeb";
import { fonts, icon, radius, spacing, typography } from "../theme/tokens";
import { formatINR } from "../utils/currency";
import { formatCompactShippingLine } from "../utils/shippingAddressFormat";
import { platformShadow } from "../theme/shadowPlatform";

const COPY = ORDER_CELEBRATION_UI.screen;

const heroShadow = platformShadow({
  web: { boxShadow: "0 20px 48px -20px rgba(22, 69, 51, 0.18)" },
  ios: {
    shadowColor: "#3D2A12",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
  },
  android: { elevation: 4 },
});

function PulseRing({ color, delay = 0, reducedMotion, styles }) {
  const progress = useSharedValue(0);

  useEffect(() => {
    if (reducedMotion) return;
    progress.value = withDelay(
      delay,
      withRepeat(
        withTiming(1, { duration: 1500, easing: Easing.out(Easing.cubic) }),
        -1,
        false
      )
    );
  }, [delay, progress, reducedMotion]);

  const style = useAnimatedStyle(() => ({
    opacity: (1 - progress.value) * 0.38,
    transform: [{ scale: 0.7 + progress.value * 0.5 }],
  }));

  if (reducedMotion) return null;
  return <Animated.View style={[styles.pulseRing, { borderColor: color }, style]} />;
}

function ConfirmHero({ styles }) {
  const reducedMotion = useReducedMotion();
  const bounce = useSharedValue(0);

  useEffect(() => {
    if (reducedMotion) return;
    bounce.value = withSequence(
      withSpring(1.14, { damping: 8, stiffness: 220 }),
      withSpring(1, { damping: 12, stiffness: 180 })
    );
  }, [bounce, reducedMotion]);

  const iconStyle = useAnimatedStyle(() => ({
    transform: [{ scale: reducedMotion ? 1 : bounce.value }],
  }));

  return (
    <View style={styles.heroIconWrap}>
      <PulseRing color="#7ecf9a" delay={0} reducedMotion={reducedMotion} styles={styles} />
      <PulseRing color="#4ade80" delay={300} reducedMotion={reducedMotion} styles={styles} />
      <Animated.View style={iconStyle}>
        <LinearGradient colors={["#3c6248", "#2a4a36"]} style={styles.heroIconDisc}>
          <Ionicons name="checkmark-circle" size={44} color="#fff" />
        </LinearGradient>
      </Animated.View>
    </View>
  );
}

function StepRow({ step, isLast, isDark, styles }) {
  return (
    <View style={[styles.stepRow, isLast && styles.stepRowLast]}>
      <View style={[styles.stepIcon, isDark ? styles.stepIconDark : styles.stepIconLight]}>
        <Ionicons
          name={step.icon}
          size={icon.md}
          color={isDark ? KANKREG_PALETTE.goldBright : ALCHEMY.brown}
        />
      </View>
      <View style={styles.stepText}>
        <Text style={[styles.stepLabel, { color: isDark ? KANKREG_PALETTE.paper : KANKREG_PALETTE.ink }]}>
          {step.label}
        </Text>
        <Text style={[styles.stepDetail, { color: isDark ? "#c8bdaf" : KANKREG_PALETTE.inkSoft }]}>
          {step.detail}
        </Text>
      </View>
    </View>
  );
}

export default function OrderConfirmedScreen({ navigation, route }) {
  const order = route?.params?.order;
  const { colors: c, shadowPremium, isDark } = useTheme();
  const { showMobileWebTabBar } = useKankregLayout();
  const styles = useMemo(() => createStyles(c, shadowPremium, isDark), [c, shadowPremium, isDark]);
  const shellColors = getCustomerShellGradient(isDark, c);

  const orderRef = formatOrderReference(order);
  const itemCount = orderItemCount(order);
  const paymentLabel = orderPaymentLabel(order);
  const deliveryLine = formatCompactShippingLine(order?.shippingAddress);
  const total = Number(order?.totalPrice) || 0;

  useEffect(() => {
    if (!order || Platform.OS === "web") return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
  }, [order]);

  if (!order?._id && !order?.id) {
    return (
      <CustomerScreenShell style={styles.shell}>
        <KankregScrollPage
          scrollVariant="inner"
          showFooter={Platform.OS === "web" && !showMobileWebTabBar}
          style={customerScrollFill}
        >
          <PremiumCard padding="lg" variant="elevated" goldAccent>
            <Text style={[styles.missingTitle, { color: c.textPrimary }]}>{COPY.missingOrderTitle}</Text>
            <Text style={[styles.missingBody, { color: c.textSecondary }]}>{COPY.missingOrderBody}</Text>
            <PremiumButton
              label={COPY.missingOrderCta}
              variant="primary"
              onPress={() => navigation.replace("MyOrders")}
              style={styles.missingCta}
            />
          </PremiumCard>
        </KankregScrollPage>
        <BottomNavBar />
      </CustomerScreenShell>
    );
  }

  return (
    <CustomerScreenShell style={styles.shell}>
      <LinearGradient
        colors={shellColors}
        locations={[0, 0.45, 1]}
        style={StyleSheet.absoluteFillObject}
      />
      <KankregScrollPage
        scrollVariant="inner"
        showFooter={Platform.OS === "web" && !showMobileWebTabBar}
        style={customerScrollFill}
      >
        <SectionReveal preset="fade-up" delay={0}>
          <LinearGradient
            colors={
              isDark
                ? ["#2a231c", "#1f1a15", "#2a231c"]
                : ["#fffdf8", "#f6ecda", "#fffdf8"]
            }
            locations={[0, 0.5, 1]}
            style={[styles.heroCard, isDark && styles.heroCardDark]}
          >
            <Text style={[styles.eyebrow, { color: isDark ? KANKREG_PALETTE.goldBright : KANKREG_PALETTE.goldDeep }]}>
              {COPY.eyebrow}
            </Text>
            <ConfirmHero styles={styles} />
            {orderRef ? (
              <View style={[styles.refBadge, isDark ? styles.refBadgeDark : styles.refBadgeLight]}>
                <Text style={[styles.refLabel, { color: c.textMuted }]}>{COPY.orderRefLabel}</Text>
                <Text style={[styles.refValue, { color: isDark ? c.textPrimary : ALCHEMY.brown }]}>{orderRef}</Text>
              </View>
            ) : null}
            <Text style={[styles.heroTitle, { color: isDark ? KANKREG_PALETTE.paper : KANKREG_PALETTE.ink }]}>
              {COPY.title}
            </Text>
            <Text style={[styles.heroLead, { color: isDark ? "#c8bdaf" : KANKREG_PALETTE.inkSoft }]}>
              {COPY.lead}
            </Text>
          </LinearGradient>
        </SectionReveal>

        <SectionReveal preset="fade-up" delay={60}>
          <View style={styles.panel}>
            <Text style={[styles.sectionTitle, { color: c.textPrimary }]}>{COPY.stepsTitle}</Text>
            <GoldHairline marginVertical={spacing.sm} />
            {COPY.steps.map((step, idx) => (
              <StepRow
                key={step.key}
                step={step}
                isLast={idx === COPY.steps.length - 1}
                isDark={isDark}
                styles={styles}
              />
            ))}
          </View>
        </SectionReveal>

        <SectionReveal preset="fade-up" delay={120}>
          <PremiumCard padding="md" variant="elevated" goldAccent style={styles.summaryCard}>
            <Text style={[styles.sectionTitle, { color: c.textPrimary }]}>{COPY.summaryTitle}</Text>
            <View style={styles.summaryRows}>
              <View style={styles.summaryRow}>
                <Text style={[styles.summaryLabel, { color: c.textSecondary }]}>{COPY.labels.items}</Text>
                <Text style={[styles.summaryValue, { color: c.textPrimary }]}>
                  {itemCount} {itemCount === 1 ? "item" : "items"}
                </Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={[styles.summaryLabel, { color: c.textSecondary }]}>{COPY.labels.payment}</Text>
                <Text style={[styles.summaryValue, { color: c.textPrimary }]}>{paymentLabel}</Text>
              </View>
              {deliveryLine ? (
                <View style={styles.summaryRow}>
                  <Text style={[styles.summaryLabel, { color: c.textSecondary }]}>{COPY.labels.delivery}</Text>
                  <Text style={[styles.summaryValue, styles.summaryValueWrap, { color: c.textPrimary }]} numberOfLines={2}>
                    {deliveryLine}
                  </Text>
                </View>
              ) : null}
              <View style={[styles.summaryDivider, { backgroundColor: c.border }]} />
              <View style={styles.summaryRow}>
                <Text style={[styles.summaryTotalLabel, { color: c.textPrimary }]}>{COPY.labels.total}</Text>
                <Text style={[styles.summaryTotal, { color: isDark ? c.primaryBright : ALCHEMY.brown }]}>
                  {formatINR(total)}
                </Text>
              </View>
            </View>
          </PremiumCard>
        </SectionReveal>

        <SectionReveal preset="fade-in" delay={180}>
          <View style={[styles.trustStrip, isDark && styles.trustStripDark]}>
            {COPY.trustChips.map((chip) => (
              <View key={chip.key} style={styles.trustChip}>
                <Ionicons
                  name={chip.icon}
                  size={icon.sm}
                  color={isDark ? KANKREG_PALETTE.goldBright : KANKREG_PALETTE.goldDeep}
                />
                <Text style={[styles.trustChipLabel, { color: isDark ? "#ddd5c8" : KANKREG_PALETTE.inkSoft }]}>
                  {chip.label}
                </Text>
              </View>
            ))}
          </View>
          <Text style={[styles.trustLine, { color: c.textSecondary }]}>{COPY.trustLine}</Text>
        </SectionReveal>

        <SectionReveal preset="fade-up" delay={220}>
          <View style={styles.actions}>
            <PremiumButton
              label={COPY.ctaPrimary}
              variant="primary"
              iconLeft="navigate-outline"
              onPress={() => navigation.replace("MyOrders")}
            />
            <PremiumButton
              label={COPY.ctaSecondary}
              variant="secondary"
              iconLeft="bag-outline"
              onPress={() => navigation.replace("Shop")}
            />
            <PremiumButton
              label={COPY.ctaHome}
              variant="ghost"
              iconLeft="home-outline"
              onPress={() => navigation.replace("Home")}
            />
          </View>
        </SectionReveal>
      </KankregScrollPage>
      <BottomNavBar />
    </CustomerScreenShell>
  );
}

function createStyles(c, shadowPremium, isDark) {
  return StyleSheet.create({
    shell: {
      flex: 1,
    },
    heroCard: {
      borderRadius: radius.xl + 2,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: KANKREG_PALETTE.line,
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.lg + 4,
      paddingBottom: spacing.xl,
      alignItems: "center",
      marginBottom: spacing.lg,
      overflow: "hidden",
      ...heroShadow,
    },
    heroCardDark: {
      borderColor: "rgba(42, 117, 89, 0.22)",
    },
    eyebrow: {
      fontFamily: fonts.bold,
      fontSize: typography.overline,
      letterSpacing: 1.4,
      textTransform: "uppercase",
      marginBottom: spacing.md,
    },
    heroIconWrap: {
      width: 116,
      height: 116,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: spacing.md,
    },
    pulseRing: {
      position: "absolute",
      width: 116,
      height: 116,
      borderRadius: 58,
      borderWidth: 2,
    },
    heroIconDisc: {
      width: 92,
      height: 92,
      borderRadius: 46,
      alignItems: "center",
      justifyContent: "center",
    },
    refBadge: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.xs,
      paddingVertical: spacing.xs,
      paddingHorizontal: spacing.md,
      borderRadius: radius.pill,
      marginBottom: spacing.sm,
    },
    refBadgeLight: {
      backgroundColor: ALCHEMY.creamDeep,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: ALCHEMY.pillInactive,
    },
    refBadgeDark: {
      backgroundColor: "rgba(255,255,255,0.06)",
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: "rgba(42, 117, 89, 0.25)",
    },
    refLabel: {
      fontFamily: fonts.semibold,
      fontSize: typography.caption,
      textTransform: "uppercase",
      letterSpacing: 0.8,
    },
    refValue: {
      fontFamily: fonts.bold,
      fontSize: typography.bodySmall,
      letterSpacing: 0.6,
    },
    heroTitle: {
      fontFamily: FONT_HEADING,
      fontSize: typography.h1 - 2,
      lineHeight: typography.h1 + 2,
      textAlign: "center",
      letterSpacing: -0.4,
    },
    heroLead: {
      marginTop: spacing.sm,
      fontFamily: fonts.medium,
      fontSize: typography.bodySmall,
      lineHeight: 22,
      textAlign: "center",
      maxWidth: 320,
    },
    panel: {
      ...customerPanel(c, shadowPremium, isDark),
      marginBottom: spacing.lg,
    },
    sectionTitle: {
      fontFamily: FONT_HEADING,
      fontSize: typography.h3 - 2,
      letterSpacing: -0.2,
    },
    stepRow: {
      flexDirection: "row",
      alignItems: "flex-start",
      gap: spacing.md,
      paddingVertical: spacing.sm + 2,
    },
    stepRowLast: {
      paddingBottom: 0,
    },
    stepIcon: {
      width: 40,
      height: 40,
      borderRadius: radius.md,
      alignItems: "center",
      justifyContent: "center",
    },
    stepIconLight: {
      backgroundColor: ALCHEMY.creamDeep,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: ALCHEMY.pillInactive,
    },
    stepIconDark: {
      backgroundColor: "rgba(255,255,255,0.06)",
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: "rgba(42, 117, 89, 0.2)",
    },
    stepText: {
      flex: 1,
      minWidth: 0,
      paddingTop: 2,
    },
    stepLabel: {
      fontFamily: fonts.bold,
      fontSize: typography.body,
    },
    stepDetail: {
      marginTop: 2,
      fontFamily: fonts.regular,
      fontSize: typography.bodySmall,
      lineHeight: 20,
    },
    summaryCard: {
      marginBottom: spacing.lg,
    },
    summaryRows: {
      marginTop: spacing.md,
      gap: spacing.sm,
    },
    summaryRow: {
      flexDirection: "row",
      alignItems: "flex-start",
      justifyContent: "space-between",
      gap: spacing.md,
    },
    summaryLabel: {
      fontFamily: fonts.medium,
      fontSize: typography.bodySmall,
      flexShrink: 0,
    },
    summaryValue: {
      fontFamily: fonts.semibold,
      fontSize: typography.bodySmall,
      textAlign: "right",
      flex: 1,
    },
    summaryValueWrap: {
      maxWidth: "62%",
    },
    summaryDivider: {
      height: StyleSheet.hairlineWidth,
      marginVertical: spacing.xs,
    },
    summaryTotalLabel: {
      fontFamily: fonts.bold,
      fontSize: typography.body,
    },
    summaryTotal: {
      fontFamily: FONT_PRICE,
      fontSize: typography.h3,
      letterSpacing: -0.2,
    },
    trustStrip: {
      flexDirection: "row",
      flexWrap: "wrap",
      justifyContent: "center",
      gap: spacing.sm,
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.sm,
      borderRadius: radius.lg,
      backgroundColor: ALCHEMY.creamAlt,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: ALCHEMY.pillInactive,
      marginBottom: spacing.sm,
    },
    trustStripDark: {
      backgroundColor: "rgba(255,255,255,0.04)",
      borderColor: "rgba(255,255,255,0.08)",
    },
    trustChip: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.xs,
    },
    trustChipLabel: {
      fontFamily: fonts.semibold,
      fontSize: typography.caption,
    },
    trustLine: {
      fontFamily: fonts.regular,
      fontSize: typography.bodySmall,
      lineHeight: 21,
      textAlign: "center",
      marginBottom: spacing.lg,
      paddingHorizontal: spacing.sm,
    },
    actions: {
      gap: spacing.sm,
      paddingBottom: spacing.xl,
    },
    missingTitle: {
      fontFamily: FONT_HEADING,
      fontSize: typography.h3,
      marginBottom: spacing.sm,
    },
    missingBody: {
      fontFamily: fonts.regular,
      fontSize: typography.bodySmall,
      lineHeight: 22,
      marginBottom: spacing.lg,
    },
    missingCta: {
      alignSelf: "flex-start",
    },
  });
}
