import React, { useEffect } from "react";
import { Platform, StyleSheet, Text, View } from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from "react-native-reanimated";
import useReducedMotion from "../../hooks/useReducedMotion";
import { useKankregLayout } from "../../theme/kankregBreakpoints";
import { FONT_HEADING } from "../../theme/typographyRoles";
import { KANKREG_PALETTE } from "../../theme/kankregWeb";
import { createKankregEyebrowStyle, kankregSectionIndex } from "../../theme/kankregScreenStyles";
import { fonts, spacing, typography } from "../../theme/tokens";
import { useTheme } from "../../context/ThemeContext";
import GoldHairline from "../ui/GoldHairline";
import { KankregPageWrap } from "./KankregPageWrap";
export { KankregPageWrap };
/** `.section-head` from kankreg.html */
export function KankregSectionHead({ index, eyebrow, title, kicker, right }) {
  const { isDark } = useTheme();
  const { isMd, isSm, isXs } = useKankregLayout();
  const titleSize =
    Platform.OS === "web"
      ? isMd
        ? 42
        : isSm
          ? 32
          : 28
      : isSm
        ? 26
        : 22;
  return (
    <View style={[styles.sectionHead, isXs && styles.sectionHeadStack]}>
      <View style={[styles.sectionLeft, isXs && styles.sectionLeftFull]}>
        {index != null ? (
          <Text style={[styles.ix, { color: isDark ? KANKREG_PALETTE.goldBright : KANKREG_PALETTE.gold }]}>
            {kankregSectionIndex(index)} {eyebrow ? eyebrow.split("—").pop()?.trim() || eyebrow : ""}
          </Text>
        ) : eyebrow ? (
          <Text style={createKankregEyebrowStyle(isDark)}>{eyebrow}</Text>
        ) : null}
        {eyebrow && index != null ? (
          <Text style={createKankregEyebrowStyle(isDark)}>{eyebrow}</Text>
        ) : null}
        <Text
          style={[
            styles.title,
            { color: isDark ? KANKREG_PALETTE.paper : KANKREG_PALETTE.ink, fontSize: titleSize, lineHeight: titleSize + 2 },
          ]}
        >
          {title}
        </Text>
        {kicker ? (
          <Text
            style={[
              styles.kicker,
              { color: isDark ? "rgba(245, 239, 228, 0.62)" : KANKREG_PALETTE.inkFaint },
            ]}
          >
            {kicker}
          </Text>
        ) : null}
        <GoldHairline marginVertical={spacing.sm} short />
      </View>
      {right ? <View style={styles.sectionRight}>{right}</View> : null}
    </View>
  );
}

/**
 * Page content wrapper — re-exported from `./KankregPageWrap` (no Reanimated on home path).
 */

function CheckoutStepCell({ index, label, active, done, hideLabels, isDark }) {
  const reducedMotion = useReducedMotion();
  const pulse = useSharedValue(active ? 1 : 0);

  useEffect(() => {
    if (reducedMotion) {
      pulse.value = active ? 1 : 0;
      return;
    }
    pulse.value = withSpring(active ? 1 : 0, { damping: 14, stiffness: 180 });
  }, [active, reducedMotion, pulse]);

  const numStyle = useAnimatedStyle(() => ({
    transform: [{ scale: 1 + pulse.value * 0.08 }],
  }));

  const borderColor = done
    ? KANKREG_PALETTE.green
    : active
      ? KANKREG_PALETTE.gold
      : isDark
        ? "#3f3933"
        : KANKREG_PALETTE.line;

  return (
    <View style={[styles.step, { borderBottomColor: borderColor }]}>
      <Animated.View
        style={[
          styles.stepNum,
          !done && !active && (isDark ? styles.stepNumDark : null),
          done && styles.stepNumDone,
          active && styles.stepNumOn,
          numStyle,
        ]}
      >
        <Text
          style={[
            styles.stepNumText,
            isDark && !done && !active && styles.stepNumTextDark,
            (done || active) && styles.stepNumTextOn,
          ]}
        >
          {done ? "✓" : String(index + 1)}
        </Text>
      </Animated.View>
      {hideLabels ? null : (
        <Text
          style={[
            styles.stepLabel,
            isDark && styles.stepLabelDark,
            (done || active) && (isDark ? styles.stepLabelOnDark : styles.stepLabelOn),
          ]}
        >
          {label}
        </Text>
      )}
    </View>
  );
}

export function KankregCheckoutSteps({ active = 2 }) {
  const { isDark } = useTheme();
  const { isXs } = useKankregLayout();
  const hideLabels = isXs;
  const steps = ["Bag", "Address", "Payment", "Confirm"];
  return (
    <View style={styles.steps}>
      {steps.map((label, i) => (
        <CheckoutStepCell
          key={label}
          index={i}
          label={label}
          active={i === active}
          done={i < active}
          hideLabels={hideLabels}
          isDark={isDark}
        />
      ))}
    </View>
  );
}

export function KankregGrainOverlay() {
  return null;
}

const styles = StyleSheet.create({
  wrap: {
    width: "100%",
  },
  inner: {
    width: "100%",
    maxWidth: 1280,
    alignSelf: "center",
  },
  sectionHead: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    marginBottom: Platform.select({ web: spacing.lg + 6, default: spacing.md }),
    flexWrap: "wrap",
    gap: spacing.md,
    width: "100%",
  },
  sectionHeadStack: {
    flexDirection: "column",
    alignItems: "flex-start",
  },
  sectionLeft: { flex: 1, minWidth: 200 },
  sectionLeftFull: { minWidth: 0, width: "100%" },
  sectionRight: { flexShrink: 0, maxWidth: "100%" },
  ix: {
    fontFamily: FONT_HEADING,
    fontSize: 13,
    marginBottom: 6,
    letterSpacing: 0.5,
  },
  title: {
    fontFamily: FONT_HEADING,
    fontSize: Platform.OS === "web" ? 42 : typography.h2 + 6,
    fontWeight: "400",
    lineHeight: Platform.OS === "web" ? 44 : typography.h2 + 8,
    letterSpacing: -0.5,
  },
  kicker: {
    fontFamily: fonts.regular,
    fontSize: typography.bodySmall,
    lineHeight: 22,
    marginTop: spacing.xs,
    maxWidth: 560,
  },
  steps: {
    flexDirection: "row",
    gap: spacing.sm,
    marginBottom: spacing.xl,
  },
  step: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingBottom: spacing.sm + 2,
    borderBottomWidth: 2,
    gap: 6,
  },
  stepNum: {
    width: 25,
    height: 25,
    borderRadius: 13,
    backgroundColor: KANKREG_PALETTE.paper2,
    alignItems: "center",
    justifyContent: "center",
  },
  stepNumDark: {
    backgroundColor: "#24201d",
  },
  stepNumDone: { backgroundColor: KANKREG_PALETTE.green },
  stepNumOn: { backgroundColor: KANKREG_PALETTE.gold },
  stepNumText: {
    fontSize: 12,
    fontFamily: fonts.semibold,
    color: KANKREG_PALETTE.inkFaint,
  },
  stepNumTextDark: {
    color: "rgba(245, 239, 228, 0.55)",
  },
  stepNumTextOn: { color: "#fff" },
  stepLabel: {
    fontSize: 13,
    fontFamily: fonts.semibold,
    color: KANKREG_PALETTE.inkFaint,
  },
  stepLabelDark: {
    color: "rgba(245, 239, 228, 0.55)",
  },
  stepLabelOn: { color: KANKREG_PALETTE.ink },
  stepLabelOnDark: { color: KANKREG_PALETTE.paper },
  grain: {
    ...Platform.select({
      web: {
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        opacity: 0.045,
        zIndex: 200,
        pointerEvents: "none",
      },
      default: { display: "none" },
    }),
  },
});
