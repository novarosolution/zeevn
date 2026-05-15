import React, { useEffect, useRef, useState } from "react";
import { AccessibilityInfo, Platform, Pressable, SafeAreaView, StyleSheet, Text, useWindowDimensions, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Svg, { Circle, Defs, RadialGradient, Stop } from "react-native-svg";
import Animated, {
  Easing,
  FadeIn,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import { APP_LOADING_UI } from "../content/appContent";
import { fonts, loadingColors, loadingMotion, loadingRadius } from "../theme/tokens";
import { FONT_DISPLAY_SEMI } from "../theme/customerAlchemy";
import { usePrefersReducedMotion } from "../utils/motion";
import ProgressRing from "./feedback/ProgressRing";

const PHASE_STATES = {
  pending: "pending",
  active: "active",
  complete: "complete",
};

const STARTUP = APP_LOADING_UI.startup;

function BrassPillBadge({ label, reducedMotion }) {
  const pulse = useSharedValue(1);

  useEffect(() => {
    if (reducedMotion) return;
    pulse.value = withRepeat(
      withSequence(
        withTiming(1.02, { duration: loadingMotion.breathCycle / 2, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: loadingMotion.breathCycle / 2, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      false
    );
  }, [pulse, reducedMotion]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulse.value }],
  }));

  return (
    <Animated.View style={[styles.badge, animatedStyle]}>
      <Text style={styles.badgeText} numberOfLines={1}>
        {label}
      </Text>
    </Animated.View>
  );
}

function PhasePill({ item, state, reducedMotion }) {
  const scale = useSharedValue(1);
  const isActive = state === PHASE_STATES.active;
  const isComplete = state === PHASE_STATES.complete;

  useEffect(() => {
    if (reducedMotion || !isActive) {
      scale.value = withTiming(1, { duration: loadingMotion.enter });
      return;
    }
    scale.value = withRepeat(
      withSequence(
        withTiming(1.03, { duration: loadingMotion.breathCycle / 2, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: loadingMotion.breathCycle / 2, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      false
    );
  }, [isActive, reducedMotion, scale]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const pillStyle = [
    styles.phasePill,
    isActive ? styles.phasePillActive : null,
    isComplete ? styles.phasePillComplete : null,
  ];
  const iconColor = isComplete ? loadingColors.success : isActive ? loadingColors.accent : loadingColors.inkInverseMuted;
  const labelColor = isActive
    ? loadingColors.inkInverse
    : isComplete
      ? loadingColors.inkInverseSoft
      : loadingColors.inkInverseMuted;
  const a11yStateWord = STARTUP.phaseA11yState[state] || state;

  return (
    <Animated.View
      style={animatedStyle}
      accessibilityRole="text"
      accessibilityLabel={`${item.label}, ${a11yStateWord}`}
    >
      <View style={pillStyle}>
        <Ionicons name={isComplete ? "checkmark-circle" : item.icon} size={16} color={iconColor} />
        <Text style={[styles.phaseText, { color: labelColor }]} numberOfLines={1}>
          {item.label}
        </Text>
      </View>
    </Animated.View>
  );
}

function PhasePills({ phases, phaseStates, reducedMotion }) {
  return (
    <View style={styles.phaseRow} accessibilityLiveRegion="polite">
      {phases.map((item) => (
        <PhasePill key={item.key} item={item} state={phaseStates[item.key] || PHASE_STATES.pending} reducedMotion={reducedMotion} />
      ))}
    </View>
  );
}

function RotatingTagline({ messages, reducedMotion }) {
  const [index, setIndex] = useState(0);
  const opacity = useSharedValue(1);
  const innerTimerRef = useRef(null);

  useEffect(() => {
    if (reducedMotion || !Array.isArray(messages) || messages.length < 2) {
      return undefined;
    }

    const timer = setInterval(() => {
      opacity.value = withTiming(0, { duration: 200, easing: Easing.out(Easing.ease) });
      if (innerTimerRef.current) clearTimeout(innerTimerRef.current);
      innerTimerRef.current = setTimeout(() => {
        setIndex((prev) => (prev + 1) % messages.length);
        opacity.value = withTiming(1, { duration: 200, easing: Easing.in(Easing.ease) });
      }, 210);
    }, 2400);

    return () => {
      clearInterval(timer);
      if (innerTimerRef.current) clearTimeout(innerTimerRef.current);
    };
  }, [messages, opacity, reducedMotion]);

  const fadeStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  const activeMessage = reducedMotion ? messages[0] : messages[index % messages.length];

  return (
    <Animated.Text style={[styles.tagline, fadeStyle]} numberOfLines={2}>
      {activeMessage}
    </Animated.Text>
  );
}

function buildTimedPhaseStates(phases, step) {
  const out = {};
  phases.forEach((phase, idx) => {
    if (step > idx) out[phase.key] = PHASE_STATES.complete;
    else if (step === idx) out[phase.key] = PHASE_STATES.active;
    else out[phase.key] = PHASE_STATES.pending;
  });
  if (step >= phases.length) {
    phases.forEach((phase) => {
      out[phase.key] = PHASE_STATES.complete;
    });
  }
  return out;
}

/**
 * Premium startup loading screen. Uses APP_LOADING_UI + loading tokens only.
 * Optional `phaseStates` lets callers wire real boot milestones.
 */
export default function AppStartupScreen({ phaseStates, onRetry }) {
  const reducedMotion = usePrefersReducedMotion();
  const { width } = useWindowDimensions();
  const [phaseStep, setPhaseStep] = useState(0);
  const [showAlmostThere, setShowAlmostThere] = useState(false);
  const [showTimeout, setShowTimeout] = useState(false);
  const announcedRef = useRef(false);
  const phases = STARTUP.phases || [];
  const cardWidth = Math.min(360, Math.round(width * 0.86));
  const hasExternalPhases = phaseStates && typeof phaseStates === "object";

  useEffect(() => {
    const t = setTimeout(() => setShowAlmostThere(true), 4000);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    const t = setTimeout(() => setShowTimeout(true), 8000);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (announcedRef.current) return;
    announcedRef.current = true;
    AccessibilityInfo.announceForAccessibility?.(STARTUP.a11yAnnouncement);
  }, []);

  useEffect(() => {
    if (hasExternalPhases || phases.length === 0) return undefined;
    const timer = setInterval(() => {
      setPhaseStep((prev) => (prev < phases.length ? prev + 1 : prev));
    }, loadingMotion.phaseAdvance);
    return () => clearInterval(timer);
  }, [hasExternalPhases, phases.length]);

  const resolvedPhaseStates = hasExternalPhases ? phaseStates : buildTimedPhaseStates(phases, phaseStep);
  const rotatingMessages = STARTUP.rotatingMessages?.length ? STARTUP.rotatingMessages : [STARTUP.fallback];

  return (
    <SafeAreaView
      style={styles.safe}
      accessibilityRole="progressbar"
      accessibilityLabel={STARTUP.a11yAnnouncement}
    >
      <View style={styles.root}>
        <View style={styles.glowWrap} pointerEvents="none" accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
          <Svg width={600} height={600}>
            <Defs>
              <RadialGradient id="startup-accent-glow" cx="50%" cy="50%" r="50%">
                <Stop offset="0%" stopColor={loadingColors.accentSoft} stopOpacity="1" />
                <Stop offset="100%" stopColor={loadingColors.accentSoft} stopOpacity="0" />
              </RadialGradient>
            </Defs>
            <Circle cx="300" cy="300" r="300" fill="url(#startup-accent-glow)" />
          </Svg>
        </View>

        <View style={[styles.heroCard, { width: cardWidth }]}>
          <BrassPillBadge label={STARTUP.badge} reducedMotion={reducedMotion} />

          <View accessibilityRole="header">
            <Text style={styles.wordmark}>{STARTUP.wordmark}</Text>
            <RotatingTagline messages={rotatingMessages} reducedMotion={reducedMotion} />
          </View>

          <View style={styles.ringWrap}>
            <ProgressRing
              size={48}
              reducedMotion={reducedMotion}
              accessibilityValueText={STARTUP.progressA11yValue}
              accessible={false}
            />
          </View>
          <PhasePills phases={phases} phaseStates={resolvedPhaseStates} reducedMotion={reducedMotion} />
        </View>

        {showAlmostThere ? <Text style={styles.almostThere}>{STARTUP.almostThere}</Text> : null}
        {showTimeout ? (
          <Animated.View entering={FadeIn.duration(220)} style={styles.timeoutWrap}>
            <Text style={styles.timeoutTitle}>{APP_LOADING_UI.errors.timeoutTitle}</Text>
            <Text style={styles.timeoutBody}>{APP_LOADING_UI.errors.timeoutBody}</Text>
            {onRetry ? (
              <Pressable
                onPress={onRetry}
                accessibilityRole="button"
                accessibilityLabel={APP_LOADING_UI.errors.retry}
                style={({ pressed }) => [styles.retryBtn, pressed ? styles.retryPressed : null]}
              >
                <Text style={styles.retryText}>{APP_LOADING_UI.errors.retry}</Text>
              </Pressable>
            ) : null}
          </Animated.View>
        ) : null}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    width: "100%",
    backgroundColor: loadingColors.bgDeep,
  },
  root: {
    flex: 1,
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: loadingColors.bgDeep,
    paddingHorizontal: 20,
    ...Platform.select({
      web: { minHeight: "100vh" },
      default: {},
    }),
  },
  glowWrap: {
    position: "absolute",
    width: 600,
    height: 600,
    top: -180,
    opacity: 0.5,
  },
  heroCard: {
    backgroundColor: loadingColors.bgWell,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: loadingColors.line,
    borderRadius: loadingRadius.md,
    paddingVertical: 32,
    paddingHorizontal: 28,
    alignItems: "center",
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: loadingRadius.pill,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(200,169,126,0.24)",
    backgroundColor: loadingColors.accentSoft,
    marginBottom: 20,
  },
  badgeText: {
    color: loadingColors.accent,
    fontFamily: fonts.semibold,
    fontSize: 10,
    letterSpacing: 1.8,
    textTransform: "uppercase",
  },
  wordmark: {
    color: loadingColors.inkInverse,
    fontFamily: FONT_DISPLAY_SEMI,
    fontSize: 56,
    lineHeight: 56,
    letterSpacing: -1.12,
    textAlign: "center",
  },
  tagline: {
    marginTop: 20,
    color: loadingColors.inkInverseSoft,
    fontFamily: fonts.regular,
    fontSize: 14,
    lineHeight: 21,
    textAlign: "center",
    maxWidth: 280,
  },
  ringWrap: {
    marginTop: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  phaseRow: {
    marginTop: 20,
    width: "100%",
    flexDirection: "row",
    justifyContent: "center",
    flexWrap: "wrap",
    gap: 8,
  },
  phasePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: loadingRadius.pill,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: loadingColors.line,
    backgroundColor: "rgba(255,255,255,0.04)",
  },
  phasePillActive: {
    borderColor: "rgba(200,169,126,0.40)",
    backgroundColor: loadingColors.accentSoft,
  },
  phasePillComplete: {
    borderColor: loadingColors.line,
    backgroundColor: "rgba(255,255,255,0.04)",
  },
  phaseText: {
    fontFamily: fonts.semibold,
    fontSize: 11,
    letterSpacing: 1.1,
    textTransform: "uppercase",
  },
  almostThere: {
    marginTop: 32,
    color: loadingColors.inkInverseMuted,
    fontFamily: fonts.regular,
    fontSize: 12,
    textAlign: "center",
  },
  timeoutWrap: {
    marginTop: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: loadingColors.line,
    borderRadius: 10,
    backgroundColor: loadingColors.bgWell,
    paddingHorizontal: 14,
    paddingVertical: 10,
    alignItems: "center",
    maxWidth: 360,
  },
  timeoutTitle: {
    color: loadingColors.inkInverse,
    fontFamily: fonts.semibold,
    fontSize: 12,
    textAlign: "center",
  },
  timeoutBody: {
    marginTop: 4,
    color: loadingColors.inkInverseSoft,
    fontFamily: fonts.regular,
    fontSize: 11,
    textAlign: "center",
  },
  retryBtn: {
    marginTop: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  retryPressed: {
    opacity: 0.72,
  },
  retryText: {
    color: loadingColors.accent,
    fontFamily: fonts.semibold,
    fontSize: 12,
  },
});
