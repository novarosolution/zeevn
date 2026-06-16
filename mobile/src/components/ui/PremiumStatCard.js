import React, { memo, useMemo } from "react";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from "react-native-reanimated";
import { fonts, icon, radius, spacing, typography } from "../../theme/tokens";
import { ALCHEMY } from "../../theme/customerAlchemy";
import { FONT_PRICE } from "../../theme/typographyRoles";
import { useTheme } from "../../context/ThemeContext";
import useReducedMotion from "../../hooks/useReducedMotion";
import { platformShadow } from "../../theme/shadowPlatform";

const TONE_PALETTE = {
  gold: {
    accent: ALCHEMY.gold,
    accentStrong: ALCHEMY.brown,
    iconBg: "rgba(31, 92, 71, 0.16)",
    iconBgDark: "rgba(52, 211, 153, 0.18)",
  },
  green: {
    accent: "#22C55E",
    accentStrong: "#15803D",
    iconBg: "rgba(34, 197, 94, 0.14)",
    iconBgDark: "rgba(52, 211, 153, 0.18)",
  },
  navy: {
    accent: "#3B5FAA",
    accentStrong: "#1E3A8A",
    iconBg: "rgba(59, 95, 170, 0.14)",
    iconBgDark: "rgba(96, 165, 250, 0.18)",
  },
  rose: {
    accent: "#E11D48",
    accentStrong: "#9F1239",
    iconBg: "rgba(225, 29, 72, 0.12)",
    iconBgDark: "rgba(244, 114, 182, 0.18)",
  },
  neutral: {
    accent: ALCHEMY.brown,
    accentStrong: ALCHEMY.brownInk,
    iconBg: "rgba(22, 69, 51, 0.12)",
    iconBgDark: "rgba(52, 211, 153, 0.16)",
  },
};

/**
 * Editorial stat tile used on Home stats strip and Profile identity hero.
 * Renders a serif-display value with an eyebrow label and an optional icon
 * + delta chip. When `onPress` is provided, the card lifts on hover.
 */
function PremiumStatCardBase({
  value,
  label,
  hint,
  iconName,
  delta,
  tone = "gold",
  onPress,
  style,
  align = "left",
  compact = false,
  testID,
  accessibilityLabel,
}) {
  const { colors: c, isDark } = useTheme();
  const reducedMotion = useReducedMotion();
  const palette = TONE_PALETTE[tone] || TONE_PALETTE.gold;
  const styles = useMemo(
    () => createStyles(c, isDark, palette, align, compact),
    [c, isDark, palette, align, compact]
  );

  const lift = useSharedValue(0);
  const animStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: lift.value }],
  }));

  const handleHoverIn = () => {
    if (Platform.OS !== "web" || reducedMotion || !onPress) return;
    lift.value = withSpring(-2, { damping: 22, stiffness: 220 });
  };
  const handleHoverOut = () => {
    if (Platform.OS !== "web" || reducedMotion) return;
    lift.value = withSpring(0, { damping: 22, stiffness: 220 });
  };

  const isPositiveDelta = delta && /^[+\u2191]/.test(String(delta).trim());
  const isNegativeDelta = delta && /^[-\u2193]/.test(String(delta).trim());

  const isCenter = align === "center";

  const renderDelta = delta ? (
    <View
      style={[
        styles.deltaChip,
        isPositiveDelta ? styles.deltaUp : null,
        isNegativeDelta ? styles.deltaDown : null,
      ]}
    >
      <Text
        style={[
          styles.deltaText,
          isPositiveDelta ? styles.deltaUpText : null,
          isNegativeDelta ? styles.deltaDownText : null,
        ]}
        numberOfLines={1}
      >
        {delta}
      </Text>
    </View>
  ) : null;

  const inner = (
    <>
      <LinearGradient
        colors={[palette.accent, palette.accentStrong]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.topAccent, styles.peNone]}
      />
      {isCenter ? (
        <View style={styles.stack}>
          {iconName ? (
            <View style={styles.iconWrap}>
              <Ionicons name={iconName} size={icon.md} color={palette.accentStrong} />
            </View>
          ) : null}
          <Text style={styles.value} numberOfLines={1} accessibilityLabel={accessibilityLabel}>
            {value}
          </Text>
          <Text style={styles.label} numberOfLines={2}>
            {label}
          </Text>
          {hint ? (
            <Text style={styles.hint} numberOfLines={2}>
              {hint}
            </Text>
          ) : null}
          {renderDelta}
        </View>
      ) : (
        <View style={styles.row}>
          {iconName ? (
            <View style={styles.iconWrap}>
              <Ionicons name={iconName} size={icon.md} color={palette.accentStrong} />
            </View>
          ) : null}
          <View style={styles.body}>
            <Text style={styles.label} numberOfLines={2}>
              {label}
            </Text>
            <Text style={styles.value} numberOfLines={1} accessibilityLabel={accessibilityLabel}>
              {value}
            </Text>
            {hint ? (
              <Text style={styles.hint} numberOfLines={2}>
                {hint}
              </Text>
            ) : null}
          </View>
          {renderDelta}
        </View>
      )}
    </>
  );

  if (onPress) {
    return (
      <Animated.View style={[styles.outer, animStyle, style]}>
        <Pressable
          onPress={onPress}
          onHoverIn={handleHoverIn}
          onHoverOut={handleHoverOut}
          accessibilityRole="button"
          accessibilityLabel={accessibilityLabel || `${label} ${value}`}
          testID={testID}
          style={({ pressed, hovered }) => [
            styles.card,
            hovered && Platform.OS === "web" ? styles.hover : null,
            pressed ? styles.pressed : null,
          ]}
        >
          {inner}
        </Pressable>
      </Animated.View>
    );
  }

  return (
    <View style={[styles.outer, styles.card, style]} testID={testID}>
      {inner}
    </View>
  );
}

function createStyles(c, isDark, palette, align, compact) {
  const padV = compact ? spacing.sm : spacing.md;
  const padH = compact ? spacing.md : spacing.lg - 4;
  const valueSize = compact ? 24 : 30;

  const cardShadow = platformShadow({
    ios: {
      shadowColor: isDark ? "#000000" : "#3D2A12",
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: isDark ? 0.32 : 0.07,
      shadowRadius: 18,
    },
    android: { elevation: isDark ? 4 : 2 },
    web: {
      boxShadow: isDark
        ? "0 14px 30px rgba(0,0,0,0.4), inset 0 1px 0 rgba(232,200,90,0.1)"
        : "0 14px 28px rgba(22, 69, 51, 0.07), 0 4px 10px rgba(28, 25, 23, 0.04), inset 0 1px 0 rgba(255,255,255,0.95)",
      transition: "transform 0.22s ease, box-shadow 0.22s ease, border-color 0.22s ease",
    },
  });

  return StyleSheet.create({
    outer: {
      width: "100%",
    },
    card: {
      borderRadius: radius.xl,
      backgroundColor: isDark ? "#15110D" : ALCHEMY.cardBg,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: isDark ? "rgba(52, 211, 153, 0.18)" : "rgba(22, 69, 51, 0.14)",
      paddingVertical: padV,
      paddingHorizontal: padH,
      overflow: "hidden",
      position: "relative",
      ...cardShadow,
    },
    topAccent: {
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      height: 3,
      opacity: 0.95,
    },
    peNone: {
      pointerEvents: "none",
    },
    row: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.sm,
    },
    stack: {
      alignItems: "center",
      justifyContent: "center",
      gap: 4,
      width: "100%",
    },
    iconWrap: {
      width: 42,
      height: 42,
      borderRadius: radius.lg,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: isDark ? palette.iconBgDark : palette.iconBg,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: isDark ? "rgba(52, 211, 153, 0.22)" : "rgba(22, 69, 51, 0.12)",
      marginBottom: align === "center" ? 6 : 0,
    },
    body: {
      flex: 1,
      alignItems: align === "center" ? "center" : "flex-start",
    },
    label: {
      fontFamily: fonts.semibold,
      fontSize: compact ? typography.caption : typography.overline,
      letterSpacing: 0.6,
      textTransform: "uppercase",
      color: c.textMuted,
      marginBottom: align === "center" ? 0 : 4,
      textAlign: align === "center" ? "center" : "left",
      width: "100%",
    },
    value: {
      fontFamily: FONT_PRICE,
      fontSize: valueSize,
      lineHeight: valueSize + 4,
      letterSpacing: -0.4,
      color: isDark ? "#F2D679" : ALCHEMY.brown,
      textAlign: align === "center" ? "center" : "left",
      fontVariant: ["tabular-nums"],
    },
    hint: {
      marginTop: 4,
      fontFamily: fonts.medium,
      fontSize: typography.caption,
      color: c.textSecondary,
    },
    deltaChip: {
      paddingHorizontal: 9,
      paddingVertical: 3,
      borderRadius: radius.pill,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: c.border,
      backgroundColor: c.surfaceMuted,
    },
    deltaText: {
      fontFamily: fonts.extrabold,
      fontSize: 11,
      letterSpacing: 0.2,
      color: c.textSecondary,
    },
    deltaUp: {
      borderColor: isDark ? "rgba(52, 211, 153, 0.34)" : "rgba(22, 163, 74, 0.24)",
      backgroundColor: isDark ? "rgba(52, 211, 153, 0.16)" : "rgba(22, 163, 74, 0.1)",
    },
    deltaUpText: {
      color: isDark ? "#86EFAC" : "#15803D",
    },
    deltaDown: {
      borderColor: isDark ? "rgba(248, 113, 113, 0.34)" : "rgba(220, 38, 38, 0.22)",
      backgroundColor: isDark ? "rgba(248, 113, 113, 0.16)" : "rgba(220, 38, 38, 0.1)",
    },
    deltaDownText: {
      color: isDark ? "#FCA5A5" : "#B91C1C",
    },
    hover: {
      ...Platform.select({
        web: {
          boxShadow: isDark
            ? "0 22px 46px rgba(0,0,0,0.5), inset 0 1px 0 rgba(232,200,90,0.16)"
            : "0 22px 44px rgba(22, 69, 51, 0.1), 0 6px 14px rgba(28, 25, 23, 0.06), inset 0 1px 0 rgba(255,255,255,0.95)",
        },
        default: {},
      }),
    },
    pressed: {
      opacity: 0.96,
    },
  });
}

const PremiumStatCard = memo(PremiumStatCardBase);

export default PremiumStatCard;
