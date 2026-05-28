import React, { memo, useMemo } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { fonts } from "../../theme/tokens";
import { useTheme } from "../../context/ThemeContext";

/** Pill badge — neutral, brass, navy, sale, success. Optional dismiss control (neutral chips). */
function BadgeBase({
  children,
  variant = "neutral",
  size = "md",
  style,
  textStyle,
  onDismiss,
  dismissAccessibilityLabel = "Dismiss",
}) {
  const { semanticPalette, RADII } = useTheme();

  const palette = useMemo(() => {
    const ink = semanticPalette.ink;
    const inv = semanticPalette.inkInverse;
    const accent = semanticPalette.accent;
    const accentSoft = semanticPalette.accentSoft;
    const line = semanticPalette.line;
    const sale = semanticPalette.sale;
    const success = semanticPalette.success;

    if (variant === "brass") {
      return { bg: accentSoft, border: "transparent", color: accent };
    }
    if (variant === "navy") {
      return { bg: ink, border: ink, color: inv };
    }
    if (variant === "sale") {
      return { bg: sale, border: sale, color: inv };
    }
    if (variant === "success") {
      return { bg: success, border: success, color: inv };
    }
    if (variant === "warning") {
      return { bg: semanticPalette.accentSoft, border: accent, color: accent };
    }
    if (variant === "info") {
      return { bg: semanticPalette.surfaceAlt, border: line, color: ink };
    }
    return { bg: "transparent", border: line, color: ink };
  }, [semanticPalette, variant]);

  const fontSize = size === "sm" ? 10 : 12;

  const styles = useMemo(
    () =>
      StyleSheet.create({
        pill: {
          alignSelf: "flex-start",
          flexDirection: "row",
          alignItems: "center",
          gap: size === "sm" ? 4 : 6,
          paddingLeft: size === "sm" ? 8 : 10,
          paddingRight: onDismiss ? (size === "sm" ? 6 : 8) : size === "sm" ? 8 : 10,
          paddingVertical: size === "sm" ? 3 : 4,
          borderRadius: RADII.pill,
          borderWidth: variant === "neutral" ? StyleSheet.hairlineWidth : 0,
          borderColor: palette.border,
          backgroundColor: palette.bg,
        },
        text: {
          fontFamily: fonts.semibold,
          fontSize,
          lineHeight: fontSize + 4,
          letterSpacing: 0.9,
          textTransform: "uppercase",
          color: palette.color,
          flexShrink: 1,
        },
        dismissHit: {
          padding: 2,
          marginRight: -2,
        },
      }),
    [RADII.pill, fontSize, onDismiss, palette.bg, palette.border, palette.color, size, variant]
  );

  return (
    <View style={[styles.pill, style]}>
      <Text style={[styles.text, textStyle]} numberOfLines={1}>
        {children}
      </Text>
      {onDismiss ? (
        <Pressable
          onPress={onDismiss}
          hitSlop={10}
          accessibilityRole="button"
          accessibilityLabel={dismissAccessibilityLabel}
          style={({ pressed }) => [styles.dismissHit, pressed ? { opacity: 0.72 } : null]}
        >
          <Ionicons name="close" size={size === "sm" ? 14 : 16} color={palette.color} />
        </Pressable>
      ) : null}
    </View>
  );
}

const Badge = memo(BadgeBase);

export default Badge;
