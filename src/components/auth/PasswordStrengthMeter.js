import React, { useEffect } from "react";
import { StyleSheet, Text, View } from "react-native";
import Animated, {
  Easing,
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { useTheme } from "../../context/ThemeContext";
import { COLORS } from "../../styles/designSystem";
import { fonts } from "../../theme/tokens";
import useReducedMotion from "../../hooks/useReducedMotion";
import { getPasswordStrengthScore } from "../../utils/passwordStrength";

const SCORE_COLORS = [
  COLORS.lineSoft,
  COLORS.sale,
  COLORS.warning,
  COLORS.accent,
  COLORS.success,
];

const PILL_COUNT = 5;
const FILL_MS = 200;

function StrengthPill({ index, score, reducedMotion, trackColor }) {
  const filled = score > 0 && index <= score;
  const fill = useSharedValue(filled ? 1 : 0);
  const colorProgress = useSharedValue(score);

  useEffect(() => {
    if (reducedMotion) {
      colorProgress.value = score;
      fill.value = filled ? 1 : 0;
      return;
    }
    colorProgress.value = withTiming(score, { duration: FILL_MS, easing: Easing.out(Easing.ease) });
    fill.value = withTiming(filled ? 1 : 0, {
      duration: FILL_MS,
      easing: Easing.out(Easing.ease),
    });
  }, [colorProgress, fill, filled, reducedMotion, score]);

  const fillStyle = useAnimatedStyle(() => ({
    transform: [{ scaleX: fill.value }],
    backgroundColor: interpolateColor(colorProgress.value, [0, 1, 2, 3, 4], SCORE_COLORS),
  }));

  return (
    <View style={[pillStyles.track, { backgroundColor: trackColor }]}>
      <Animated.View style={[pillStyles.fill, fillStyle]} />
    </View>
  );
}

const pillStyles = StyleSheet.create({
  track: {
    flex: 1,
    height: 4,
    borderRadius: 2,
    overflow: "hidden",
  },
  fill: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    width: "100%",
    borderRadius: 2,
    transformOrigin: "left center",
  },
});

/**
 * @param {string} password
 * @param {string[]} strengthLabels — AUTH_SCREEN.register.strengthLabels (5 entries)
 * @param {string} [hint] — password hint below pills
 */
export default function PasswordStrengthMeter({ password, strengthLabels, hint }) {
  const { semanticPalette, TYPE } = useTheme();
  const reducedMotion = useReducedMotion();
  const score = getPasswordStrengthScore(password);
  const label = strengthLabels?.[score] ?? strengthLabels?.[0] ?? "";
  const labelColor = useSharedValue(score);

  useEffect(() => {
    if (reducedMotion) {
      labelColor.value = score;
      return;
    }
    labelColor.value = withTiming(score, { duration: FILL_MS, easing: Easing.out(Easing.ease) });
  }, [labelColor, reducedMotion, score]);

  const labelStyle = useAnimatedStyle(() => ({
    color: interpolateColor(labelColor.value, [0, 1, 2, 3, 4], SCORE_COLORS),
  }));

  if (!password) return null;

  return (
    <View style={styles.wrap} accessibilityRole="text" accessibilityLabel={`Password strength: ${label}`}>
      <View style={styles.row}>
        <View style={styles.pills}>
          {Array.from({ length: PILL_COUNT }, (_, i) => (
            <StrengthPill
              key={i}
              index={i}
              score={score}
              reducedMotion={reducedMotion}
              trackColor={semanticPalette.lineSoft}
            />
          ))}
        </View>
        <Animated.Text style={[styles.label, labelStyle]}>{label}</Animated.Text>
      </View>
      {hint ? <Text style={[styles.hint, { color: semanticPalette.inkSoft }]}>{hint}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginTop: 8,
    gap: 6,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  pills: {
    flex: 1,
    flexDirection: "row",
    gap: 4,
  },
  label: {
    fontFamily: fonts.semibold,
    fontSize: 11,
    lineHeight: 14,
    letterSpacing: 1.2,
    textTransform: "uppercase",
    minWidth: 72,
    textAlign: "right",
  },
  hint: {
    fontFamily: fonts.regular,
    fontSize: 12,
    lineHeight: 16,
  },
});
