import React, { useEffect } from "react";
import { Platform, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
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
import { useTheme } from "../../context/ThemeContext";
import {
  FIGMA,
  figmaBody,
  figmaDisplayTitle,
  figmaEyebrow,
  figmaTextPrimary,
  figmaTextSecondary,
} from "../../theme/figmaApp";
import { fonts, spacing } from "../../theme/tokens";
import { platformShadow } from "../../theme/platformStyles";

const radarPlateShadow = platformShadow({
  web: { boxShadow: "0 14px 28px rgba(22, 69, 51, 0.08)" },
  ios: {
    shadowColor: "#3d2a12",
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.08,
    shadowRadius: 28,
  },
  android: { elevation: 6 },
});

const pinDiscShadow = platformShadow({
  web: { boxShadow: "0 8px 14px rgba(22, 69, 51, 0.16)" },
  ios: {
    shadowColor: "#3d2a12",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.16,
    shadowRadius: 14,
  },
  android: { elevation: 8 },
});

const cardShadow = platformShadow({
  web: { boxShadow: "0 10px 18px rgba(22, 69, 51, 0.07)" },
  ios: {
    shadowColor: "#3d2a12",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.07,
    shadowRadius: 18,
  },
  android: { elevation: 4 },
});

const RING_COUNT = 4;

function RadarRing({ index }) {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withDelay(
      index * 520,
      withRepeat(
        withSequence(
          withTiming(1, { duration: 2200, easing: Easing.out(Easing.cubic) }),
          withTiming(0, { duration: 0 })
        ),
        -1,
        false
      )
    );
  }, [index, progress]);

  const style = useAnimatedStyle(() => ({
    opacity: (1 - progress.value) * 0.42,
    transform: [{ scale: 0.35 + progress.value * 1.05 }],
  }));

  return <Animated.View style={[styles.ring, style]} />;
}

function SweepLine() {
  const rotation = useSharedValue(0);

  useEffect(() => {
    rotation.value = withRepeat(
      withTiming(360, { duration: 2800, easing: Easing.linear }),
      -1,
      false
    );
  }, [rotation]);

  const style = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  return (
    <Animated.View style={[styles.sweepWrap, style]} pointerEvents="none">
      <LinearGradient
        colors={["transparent", "rgba(176, 141, 87, 0.22)", "transparent"]}
        start={{ x: 0, y: 0.5 }}
        end={{ x: 1, y: 0.5 }}
        style={styles.sweepBeam}
      />
    </Animated.View>
  );
}

/** Premium radar + pin animation for the find-location flow. */
export default function NativeFindLocationScene({ phase = "searching", snippet }) {
  const { colors: c, isDark } = useTheme();
  const pinScale = useSharedValue(1);
  const pinLift = useSharedValue(0);

  useEffect(() => {
    if (phase === "searching") {
      pinScale.value = withRepeat(
        withSequence(
          withTiming(1.08, { duration: 700, easing: Easing.inOut(Easing.ease) }),
          withTiming(1, { duration: 700, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        false
      );
      pinLift.value = withRepeat(
        withSequence(
          withTiming(-4, { duration: 700, easing: Easing.inOut(Easing.ease) }),
          withTiming(0, { duration: 700, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        false
      );
      return;
    }

    pinScale.value = withSpring(1.12, { damping: 12, stiffness: 180 });
    pinLift.value = withSpring(-8, { damping: 14, stiffness: 160 });
  }, [phase, pinLift, pinScale]);

  const pinStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: pinLift.value }, { scale: pinScale.value }],
  }));

  if (Platform.OS === "web") return null;

  const showCard = phase === "found" && snippet?.label;

  return (
    <View style={styles.root}>
      <View style={styles.radarStage}>
        <View style={styles.radarPlate}>
          {phase === "searching" ? (
            <>
              {Array.from({ length: RING_COUNT }).map((_, i) => (
                <RadarRing key={i} index={i} />
              ))}
              <SweepLine />
            </>
          ) : (
            <View style={styles.foundHalo} />
          )}
          <Animated.View style={[styles.pinWrap, pinStyle]}>
            <LinearGradient
              colors={phase === "found" ? ["#d4b06a", "#9a7a45"] : ["#f5efe4", "#e8dcc8"]}
              style={styles.pinDisc}
            >
              <Ionicons
                name={phase === "found" ? "location" : "navigate"}
                size={28}
                color={phase === "found" ? "#fff" : FIGMA.gold}
              />
            </LinearGradient>
            <View style={styles.pinTail} />
          </Animated.View>
        </View>
      </View>

      <Animated.View style={styles.copyBlock}>
        <Text style={figmaEyebrow(isDark)}>
          {phase === "found" ? "LOCATION FOUND" : phase === "error" ? "UNABLE TO LOCATE" : "DELIVERY ZONE"}
        </Text>
        <Text style={figmaDisplayTitle(28, isDark)}>
          {phase === "found"
            ? "Confirm your spot"
            : phase === "error"
              ? "Turn on location"
              : "Finding you…"}
        </Text>
        <Text style={[figmaBody(14, isDark), styles.subtitle]}>
          {phase === "found"
            ? "We pinned your area for faster delivery and curated picks."
            : phase === "error"
              ? "Allow location access or enter your address manually."
              : "Scanning nearby streets for the best delivery experience."}
        </Text>
      </Animated.View>

      {showCard ? (
        <Animated.View style={[styles.card, isDark && { borderColor: "rgba(52, 211, 153, 0.28)" }]}>
          <LinearGradient
            colors={isDark ? [c.surface, c.surfaceMuted] : ["#fffdf8", "#f8f0e4"]}
            style={StyleSheet.absoluteFill}
          />
          <View style={styles.cardTop}>
            <View style={styles.cardIcon}>
              <Ionicons name="checkmark-circle" size={18} color={FIGMA.gold} />
            </View>
            <Text style={styles.cardEyebrow}>Delivering to</Text>
          </View>
          <Text style={[styles.cardTitle, figmaTextPrimary(isDark)]} numberOfLines={2}>
            {snippet.label}
          </Text>
          {snippet.line1 ? (
            <Text style={[styles.cardMeta, figmaTextSecondary(isDark)]} numberOfLines={1}>
              {snippet.line1}
            </Text>
          ) : null}
          {(snippet.city || snippet.postalCode) ? (
            <Text style={[styles.cardMeta, figmaTextSecondary(isDark)]} numberOfLines={1}>
              {[snippet.city, snippet.postalCode].filter(Boolean).join(" · ")}
            </Text>
          ) : null}
        </Animated.View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    alignItems: "center",
    width: "100%",
  },
  radarStage: {
    width: 260,
    height: 260,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.lg,
  },
  radarPlate: {
    width: 240,
    height: 240,
    borderRadius: 120,
    backgroundColor: "rgba(255, 252, 247, 0.92)",
    borderWidth: 1,
    borderColor: FIGMA.line,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    ...radarPlateShadow,
  },
  ring: {
    position: "absolute",
    width: 220,
    height: 220,
    borderRadius: 110,
    borderWidth: 1.5,
    borderColor: FIGMA.gold,
  },
  sweepWrap: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
  },
  sweepBeam: {
    position: "absolute",
    width: "50%",
    height: "100%",
    left: "50%",
    transform: [{ translateX: -20 }],
  },
  foundHalo: {
    position: "absolute",
    width: 190,
    height: 190,
    borderRadius: 95,
    backgroundColor: "rgba(176, 141, 87, 0.12)",
    borderWidth: 1,
    borderColor: "rgba(176, 141, 87, 0.28)",
  },
  pinWrap: {
    alignItems: "center",
    zIndex: 2,
  },
  pinDisc: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.85)",
    ...pinDiscShadow,
  },
  pinTail: {
    width: 2,
    height: 14,
    backgroundColor: FIGMA.gold,
    borderRadius: 1,
    marginTop: -2,
  },
  copyBlock: {
    alignItems: "center",
    paddingHorizontal: FIGMA.gutter + 8,
    gap: 8,
  },
  subtitle: {
    textAlign: "center",
    maxWidth: 300,
    marginTop: 4,
  },
  card: {
    width: "100%",
    marginTop: spacing.lg + 4,
    borderRadius: FIGMA.radiusHero,
    borderWidth: 1,
    borderColor: "rgba(176, 141, 87, 0.28)",
    padding: spacing.md + 2,
    overflow: "hidden",
    ...cardShadow,
  },
  cardTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  cardIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "rgba(176, 141, 87, 0.14)",
    alignItems: "center",
    justifyContent: "center",
  },
  cardEyebrow: {
    fontFamily: fonts.bold,
    fontSize: 10,
    letterSpacing: 2,
    textTransform: "uppercase",
    color: FIGMA.gold,
  },
  cardTitle: {
    fontFamily: fonts.semibold,
    fontSize: 18,
    lineHeight: 24,
    marginBottom: 4,
  },
  cardMeta: {
    fontFamily: fonts.regular,
    fontSize: 13,
    lineHeight: 18,
  },
});
