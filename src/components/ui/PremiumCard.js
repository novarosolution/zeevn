import React, { memo, useMemo } from "react";
import { Platform, StyleSheet, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Card from "./Card";
import { heritageBrandTrimGradientShort } from "../../theme/customerAlchemy";
import { useTheme } from "../../context/ThemeContext";

const PADDING_MAP = {
  none: "none",
  sm: "sm",
  md: "md",
  lg: "lg",
  xl: "xl",
};

/**
 * Legacy-friendly card shell built on design-system {@link Card}.
 * Keeps variant overlays (gold accent bar, soft gradients) used across admin + profile.
 */
function PremiumCardBase({
  children,
  onPress,
  style,
  contentStyle,
  goldAccent = false,
  gradient = false,
  padding = "lg",
  variant = "default",
  borderless = false,
  interactive,
  disabled = false,
  accessibilityLabel,
  accessibilityRole,
  testID,
}) {
  const { semanticPalette, SHADOWS, SPACING } = useTheme();
  const isPressable = interactive ?? Boolean(onPress);

  const resolvedPaddingKey = PADDING_MAP[padding] ?? padding;
  const resolvedPad =
    typeof padding === "number"
      ? padding
      : resolvedPaddingKey === "none"
        ? "none"
        : resolvedPaddingKey === "sm"
          ? SPACING.sm
          : resolvedPaddingKey === "md"
            ? SPACING.md
            : resolvedPaddingKey === "lg"
            ? SPACING.lg
            : resolvedPaddingKey === "xl"
              ? SPACING.lg + 6
              : SPACING.base;

  const variantSurface = useMemo(() => {
    const dangerTintLight = "rgba(178, 58, 58, 0.06)";
    const dangerTintDark = "rgba(178, 58, 58, 0.14)";
    const mutedLift =
      semanticPalette.mode === "dark" ? semanticPalette.surfaceAlt : semanticPalette.surfaceAlt;

    switch (variant) {
      case "muted":
        return {
          backgroundColor: mutedLift,
          borderColor: semanticPalette.line,
        };
      case "elevated":
      case "hero":
        return {
          ...SHADOWS.lifted,
          borderTopWidth: StyleSheet.hairlineWidth,
          borderTopColor: semanticPalette.line,
        };
      case "flat":
        return Platform.select({
          web: { boxShadow: "none", elevation: 0 },
          ios: { shadowOpacity: 0, shadowRadius: 0, shadowOffset: { width: 0, height: 0 } },
          android: { elevation: 0 },
          default: {},
        });
      case "danger":
        return {
          borderColor: semanticPalette.sale,
          backgroundColor: semanticPalette.mode === "dark" ? dangerTintDark : dangerTintLight,
          borderTopColor: semanticPalette.sale,
        };
      case "accent":
        return {
          borderTopWidth: 2,
          borderTopColor: semanticPalette.accent,
          backgroundColor: semanticPalette.surface,
        };
      case "panel":
      default:
        return {};
    }
  }, [SHADOWS.lifted, semanticPalette, variant]);

  const overlay = useMemo(() => {
    const nodes = [];
    if (goldAccent) {
      nodes.push(
        Platform.OS === "web" ? (
          <LinearGradient
            key="accentBar"
            colors={heritageBrandTrimGradientShort()}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              height: 3,
            }}
          />
        ) : (
          <View
            key="accentBarNative"
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              height: 3,
              backgroundColor: semanticPalette.accent,
            }}
          />
        )
      );
    }
    if (gradient && Platform.OS === "web") {
      nodes.push(
        <LinearGradient
          key="wash"
          colors={
            semanticPalette.mode === "dark"
              ? ["rgba(14,23,41,0.35)", "transparent", "transparent"]
              : ["rgba(255,255,255,0.92)", "rgba(244,242,236,0.55)", "rgba(250,250,247,0.9)"]
          }
          locations={[0, 0.45, 1]}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={StyleSheet.absoluteFillObject}
        />
      );
    }
    return nodes.length ? <>{nodes}</> : undefined;
  }, [goldAccent, gradient, semanticPalette.accent, semanticPalette.mode]);

  return (
    <Card
      onPress={isPressable ? onPress : undefined}
      padding={resolvedPad}
      overlay={overlay}
      disabled={disabled}
      style={[
        borderless ? { borderWidth: 0, borderTopWidth: 0 } : null,
        variantSurface,
        style,
      ]}
      contentStyle={contentStyle}
      accessibilityLabel={accessibilityLabel}
      accessibilityRole={accessibilityRole}
      testID={testID}
    >
      {children}
    </Card>
  );
}

const PremiumCard = memo(PremiumCardBase);

export default PremiumCard;
