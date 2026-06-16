import React, { useEffect, useMemo } from "react";
import { Modal, Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import Animated, {
  Easing,
  FadeIn,
  FadeOut,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
  ZoomIn,
} from "react-native-reanimated";
import PremiumButton from "../ui/PremiumButton";
import useReducedMotion from "../../hooks/useReducedMotion";
import {
  ORDER_CELEBRATION_UI,
  formatOrderPlacedMessage,
  formatOrderReference,
} from "../../content/appContent";
import { FONT_HEADING } from "../../theme/typographyRoles";
import { useTheme } from "../../context/ThemeContext";
import { getKankregSurfaces, KANKREG_PALETTE } from "../../theme/kankregWeb";
import { fonts, radius, spacing, typography } from "../../theme/tokens";
import { platformShadow } from "../../theme/shadowPlatform";

const CONFIRM_GREEN = "#3c6248";
const CONFIRM_HALO = "rgba(124, 196, 154, 0.38)";

function createCardOverlayStyles(isDark, surfaces) {
  const cardShadow = platformShadow({
    web: {
      boxShadow: isDark
        ? "0 28px 70px -24px rgba(0,0,0,0.55)"
        : "0 28px 70px -24px rgba(25,20,15,.45)",
    },
    ios: {
      shadowColor: isDark ? "#000" : "#19140f",
      shadowOffset: { width: 0, height: 16 },
      shadowOpacity: isDark ? 0.35 : 0.18,
      shadowRadius: 28,
    },
    android: { elevation: 10 },
  });

  return StyleSheet.create({
    backdrop: {
      flex: 1,
      backgroundColor: isDark ? "rgba(0, 0, 0, 0.68)" : "rgba(25, 20, 15, 0.52)",
      alignItems: "center",
      justifyContent: "center",
      padding: spacing.lg,
    },
    card: {
      width: "100%",
      maxWidth: 380,
      borderRadius: radius.xl + 4,
      borderWidth: 1,
      borderColor: surfaces.border,
      paddingHorizontal: spacing.lg + 4,
      paddingTop: spacing.xl + 8,
      paddingBottom: spacing.lg,
      alignItems: "center",
      overflow: "hidden",
      ...cardShadow,
    },
    iconStage: {
      width: 112,
      height: 112,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: spacing.md,
    },
    pulseRing: {
      position: "absolute",
      width: 112,
      height: 112,
      borderRadius: 56,
      borderWidth: 2,
    },
    iconDisc: {
      width: 88,
      height: 88,
      borderRadius: 44,
      alignItems: "center",
      justifyContent: "center",
    },
    orderRef: {
      fontFamily: fonts.semibold,
      fontSize: typography.caption,
      letterSpacing: 1.2,
      textTransform: "uppercase",
      color: surfaces.goldDeep,
      marginBottom: spacing.xs,
    },
    title: {
      fontFamily: FONT_HEADING,
      fontSize: typography.h2 + 2,
      lineHeight: typography.h2 + 6,
      color: surfaces.text,
      textAlign: "center",
    },
    subtitle: {
      marginTop: spacing.sm,
      fontFamily: fonts.medium,
      fontSize: typography.bodySmall,
      lineHeight: 22,
      color: surfaces.textSoft,
      textAlign: "center",
      maxWidth: 300,
    },
    actions: {
      width: "100%",
      gap: spacing.sm,
      marginTop: spacing.lg + 4,
    },
    dismissLink: {
      marginTop: spacing.md,
      paddingVertical: spacing.xs,
    },
    dismissText: {
      fontFamily: fonts.semibold,
      fontSize: typography.caption,
      color: surfaces.textMuted,
    },
  });
}

function createPlacedOverlayStyles(isDark) {
  return StyleSheet.create({
    screen: {
      flex: 1,
      backgroundColor: isDark ? "#14110f" : "#f5f1e3",
    },
    body: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: spacing.xl,
      paddingBottom: spacing.xxl,
    },
    iconStage: {
      width: 148,
      height: 148,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: spacing.xl,
    },
    haloOuter: {
      position: "absolute",
      width: 148,
      height: 148,
      borderRadius: 74,
      borderWidth: 2,
      borderColor: isDark ? "rgba(124, 196, 154, 0.22)" : CONFIRM_HALO,
    },
    haloMid: {
      position: "absolute",
      width: 118,
      height: 118,
      borderRadius: 59,
      borderWidth: 2,
      borderColor: isDark ? "rgba(124, 196, 154, 0.32)" : "rgba(124, 196, 154, 0.52)",
    },
    iconDisc: {
      width: 88,
      height: 88,
      borderRadius: 44,
      backgroundColor: CONFIRM_GREEN,
      alignItems: "center",
      justifyContent: "center",
      ...platformShadow({
        ios: {
          shadowColor: CONFIRM_GREEN,
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: 0.28,
          shadowRadius: 16,
        },
        android: { elevation: 6 },
      }),
    },
    title: {
      fontFamily: FONT_HEADING,
      fontSize: 34,
      lineHeight: 40,
      letterSpacing: -0.4,
      color: isDark ? KANKREG_PALETTE.paper : KANKREG_PALETTE.ink,
      textAlign: "center",
      marginBottom: spacing.md,
    },
    message: {
      fontFamily: fonts.regular,
      fontSize: typography.body,
      lineHeight: 24,
      color: isDark ? "rgba(245, 239, 228, 0.82)" : KANKREG_PALETTE.inkSoft,
      textAlign: "center",
      maxWidth: 320,
      marginBottom: spacing.xl + 8,
    },
    trackBtn: {
      width: "100%",
      maxWidth: 320,
      marginBottom: spacing.lg,
    },
    continueLink: {
      paddingVertical: spacing.sm,
    },
    continueText: {
      fontFamily: fonts.semibold,
      fontSize: typography.body,
      color: isDark ? "rgba(245, 239, 228, 0.65)" : KANKREG_PALETTE.inkFaint,
      textAlign: "center",
    },
  });
}

function PulseRing({ color, delay = 0, styles }) {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withDelay(
      delay,
      withRepeat(
        withTiming(1, { duration: 1400, easing: Easing.out(Easing.cubic) }),
        -1,
        false
      )
    );
  }, [delay, progress]);

  const style = useAnimatedStyle(() => ({
    opacity: (1 - progress.value) * 0.42,
    transform: [{ scale: 0.72 + progress.value * 0.55 }],
  }));

  return <Animated.View style={[styles.pulseRing, { borderColor: color }, style]} />;
}

function DeliveredIcon({ styles }) {
  const bounce = useSharedValue(0);
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    if (reducedMotion) return;
    bounce.value = withSequence(
      withSpring(1.12, { damping: 8, stiffness: 220 }),
      withSpring(1, { damping: 12, stiffness: 180 })
    );
  }, [bounce, reducedMotion]);

  const iconStyle = useAnimatedStyle(() => ({
    transform: [{ scale: reducedMotion ? 1 : bounce.value }],
  }));

  return (
    <View style={styles.iconStage}>
      {!reducedMotion ? (
        <>
          <PulseRing color={KANKREG_PALETTE.goldBright} delay={0} styles={styles} />
          <PulseRing color={KANKREG_PALETTE.gold} delay={280} styles={styles} />
        </>
      ) : null}
      <Animated.View style={iconStyle}>
        <LinearGradient colors={["#DCAC74", "#244424"]} style={styles.iconDisc}>
          <Ionicons name="gift" size={42} color="#fff" />
        </LinearGradient>
      </Animated.View>
    </View>
  );
}

function OrderPlacedIcon({ styles, reducedMotion }) {
  const scale = useSharedValue(reducedMotion ? 1 : 0.88);

  useEffect(() => {
    if (reducedMotion) return;
    scale.value = withSpring(1, { damping: 12, stiffness: 200 });
  }, [reducedMotion, scale]);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <View style={styles.iconStage}>
      <View style={styles.haloOuter} />
      <View style={styles.haloMid} />
      <Animated.View style={[styles.iconDisc, animStyle]}>
        <Ionicons name="checkmark" size={44} color="#fff" />
      </Animated.View>
    </View>
  );
}

function OrderPlacedPopup({ order, onTrackOrder, onContinue, isDark }) {
  const styles = useMemo(() => createPlacedOverlayStyles(isDark), [isDark]);
  const reducedMotion = useReducedMotion();
  const copy = ORDER_CELEBRATION_UI.confirmed;
  const message = formatOrderPlacedMessage(order);
  const entering = reducedMotion ? undefined : FadeIn.duration(280);

  return (
    <SafeAreaView style={styles.screen} edges={["top", "bottom"]}>
      <Animated.View entering={entering} style={styles.body}>
        <OrderPlacedIcon styles={styles} reducedMotion={reducedMotion} />
        <Text style={styles.title}>{copy.title}</Text>
        <Text style={styles.message}>{message}</Text>
        <PremiumButton
          label={copy.ctaPrimary}
          variant="primary"
          size="lg"
          fullWidth
          iconRight="arrow-forward"
          onPress={onTrackOrder}
          style={styles.trackBtn}
        />
        <Pressable onPress={onContinue} style={styles.continueLink} accessibilityRole="button">
          <Text style={styles.continueText}>{copy.ctaSecondary}</Text>
        </Pressable>
      </Animated.View>
    </SafeAreaView>
  );
}

function DeliveredCardPopup({
  order,
  onDismiss,
  onTrackOrder,
  onContinue,
  isDark,
  c,
  reducedMotion,
}) {
  const surfaces = getKankregSurfaces(isDark, c);
  const styles = useMemo(() => createCardOverlayStyles(isDark, surfaces), [isDark, surfaces]);
  const copy = ORDER_CELEBRATION_UI.delivered;
  const orderRef = formatOrderReference(order);
  const cardGradient = isDark
    ? [c.surface, c.surfaceMuted, c.surface]
    : ["#fffdf8", "#f8f0e4", "#fffdf8"];
  const entering = reducedMotion ? undefined : ZoomIn.springify().damping(16).stiffness(240);
  const backdropEntering = reducedMotion ? undefined : FadeIn.duration(220);
  const backdropExiting = reducedMotion ? undefined : FadeOut.duration(180);

  return (
    <Animated.View entering={backdropEntering} exiting={backdropExiting} style={styles.backdrop}>
      <Pressable style={StyleSheet.absoluteFill} onPress={onDismiss} accessibilityLabel="Dismiss" />
      <Animated.View entering={entering} style={styles.card}>
        <LinearGradient
          colors={cardGradient}
          locations={[0, 0.55, 1]}
          style={StyleSheet.absoluteFillObject}
        />
        <DeliveredIcon styles={styles} />
        {orderRef ? <Text style={styles.orderRef}>{orderRef}</Text> : null}
        <Text style={styles.title}>{copy.title}</Text>
        <Text style={styles.subtitle}>{copy.subtitle}</Text>
        <View style={styles.actions}>
          <PremiumButton label={copy.ctaPrimary} variant="primary" onPress={onTrackOrder} />
          <PremiumButton label={copy.ctaSecondary} variant="ghost" onPress={onContinue} />
        </View>
        <Pressable onPress={onDismiss} style={styles.dismissLink} accessibilityRole="button">
          <Text style={styles.dismissText}>Dismiss</Text>
        </Pressable>
      </Animated.View>
    </Animated.View>
  );
}

/**
 * Order-placed popup after checkout; delivered celebration uses a compact card modal.
 */
export default function OrderCelebrationOverlay({
  visible,
  type = "confirmed",
  order,
  onDismiss,
  onTrackOrder,
  onContinue,
}) {
  const { colors: c, isDark } = useTheme();
  const reducedMotion = useReducedMotion();
  const isPlaced = type === "confirmed";

  useEffect(() => {
    if (!visible || Platform.OS === "web") return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
  }, [type, visible]);

  if (!visible) return null;

  return (
    <Modal
      visible
      transparent={!isPlaced}
      animationType="none"
      onRequestClose={onDismiss}
      statusBarTranslucent
    >
      {isPlaced ? (
        <OrderPlacedPopup
          order={order}
          onTrackOrder={onTrackOrder}
          onContinue={onContinue}
          isDark={isDark}
        />
      ) : (
        <DeliveredCardPopup
          order={order}
          onDismiss={onDismiss}
          onTrackOrder={onTrackOrder}
          onContinue={onContinue}
          isDark={isDark}
          c={c}
          reducedMotion={reducedMotion}
        />
      )}
    </Modal>
  );
}
