import React, { memo, useMemo } from "react";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { fonts, icon, radius, typography } from "../../theme/tokens";
import { ALCHEMY } from "../../theme/customerAlchemy";
import { useTheme } from "../../context/ThemeContext";

/**
 * Compact capsule chip used for filters, statuses, variant selection. Tones
 * pull from theme (gold = brand, green = secondary, red = danger, info =
 * primary, neutral = surfaceMuted).
 */
function PremiumChipBase({
  label,
  iconLeft,
  iconRight,
  tone = "neutral",
  size = "md",
  selected = false,
  onPress,
  style,
  textStyle,
  accessibilityLabel,
  testID,
}) {
  const { colors: c, isDark } = useTheme();
  const tokens = SIZE_TOKENS[size] || SIZE_TOKENS.md;
  const palette = useMemo(() => resolveTone(tone, c, isDark), [tone, c, isDark]);
  const styles = useMemo(
    () => createStyles(c, isDark, palette, tokens, selected, Boolean(onPress)),
    [c, isDark, palette, tokens, selected, onPress]
  );

  const Wrapper = onPress ? Pressable : View;
  const wrapperProps = onPress
    ? {
        onPress,
        accessibilityRole: "button",
        accessibilityState: { selected },
        accessibilityLabel: accessibilityLabel || (typeof label === "string" ? label : undefined),
        style: ({ pressed, hovered }) => [
          styles.chip,
          hovered && Platform.OS === "web" ? styles.hover : null,
          pressed ? styles.pressed : null,
          style,
        ],
        testID,
      }
    : { style: [styles.chip, style], testID };

  return (
    <Wrapper {...wrapperProps}>
      {iconLeft ? (
        typeof iconLeft === "string" ? (
          <Ionicons name={iconLeft} size={tokens.iconSize} color={palette.text} />
        ) : (
          iconLeft
        )
      ) : null}
      {label != null ? (
        <Text style={[styles.text, { color: palette.text }, textStyle]} numberOfLines={1}>
          {label}
        </Text>
      ) : null}
      {iconRight ? (
        typeof iconRight === "string" ? (
          <Ionicons name={iconRight} size={tokens.iconSize} color={palette.text} />
        ) : (
          iconRight
        )
      ) : null}
    </Wrapper>
  );
}

const SIZE_TOKENS = {
  xs: { padV: 2, padH: 8, fs: 10, gap: 4, iconSize: icon.tiny },
  sm: { padV: 3, padH: 10, fs: 11, gap: 5, iconSize: icon.tiny },
  md: { padV: 5, padH: 12, fs: typography.caption, gap: 6, iconSize: icon.xs },
  lg: { padV: 7, padH: 14, fs: typography.bodySmall, gap: 8, iconSize: icon.sm },
};

function resolveTone(tone, c, isDark) {
  switch (tone) {
    case "gold":
      return {
        bg: isDark ? "rgba(31, 92, 71, 0.16)" : ALCHEMY.goldSoft,
        border: isDark ? "rgba(52, 211, 153, 0.32)" : "rgba(31, 92, 71, 0.32)",
        text: isDark ? ALCHEMY.goldBright : ALCHEMY.brown,
      };
    case "green":
      return {
        bg: isDark ? "rgba(52, 211, 153, 0.16)" : "rgba(22, 163, 74, 0.1)",
        border: isDark ? "rgba(52, 211, 153, 0.3)" : "rgba(22, 163, 74, 0.22)",
        text: isDark ? "#86EFAC" : c.secondaryDark,
      };
    case "red":
      return {
        bg: isDark ? "rgba(248, 113, 113, 0.18)" : "rgba(220, 38, 38, 0.1)",
        border: isDark ? "rgba(248, 113, 113, 0.34)" : "rgba(220, 38, 38, 0.22)",
        text: isDark ? "#FCA5A5" : "#B91C1C",
      };
    case "info":
      return {
        bg: c.primarySoft,
        border: c.primaryBorder,
        text: c.primaryDark,
      };
    case "neutral":
    default:
      return {
        bg: c.surfaceMuted,
        border: c.border,
        text: c.textSecondary,
      };
  }
}

function createStyles(c, isDark, palette, t, selected, clickable) {
  return StyleSheet.create({
    chip: {
      flexDirection: "row",
      alignItems: "center",
      gap: t.gap,
      paddingVertical: t.padV,
      paddingHorizontal: t.padH,
      borderRadius: radius.pill,
      borderWidth: selected ? 1.25 : StyleSheet.hairlineWidth,
      borderColor: selected ? palette.text : palette.border,
      backgroundColor: palette.bg,
      ...Platform.select({
        web: {
          transition: "background-color 0.16s ease, border-color 0.16s ease, transform 0.16s ease",
          cursor: clickable ? "pointer" : "default",
        },
        default: {},
      }),
    },
    text: {
      fontFamily: fonts.bold,
      fontSize: t.fs,
      letterSpacing: 0.3,
    },
    hover: {
      ...Platform.select({
        web: {
          transform: [{ translateY: -0.5 }],
        },
        default: {},
      }),
    },
    pressed: {
      opacity: 0.86,
    },
  });
}

const PremiumChip = memo(PremiumChipBase);

export default PremiumChip;
