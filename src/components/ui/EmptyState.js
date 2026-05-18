import React, { memo, useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { fonts } from "../../theme/tokens";
import { useTheme } from "../../context/ThemeContext";
import Button from "./Button";

/** Centered empty list / zero-state pattern with optional primary + secondary CTAs. */
function EmptyStateBase({
  iconName = "albums-outline",
  iconColor,
  title,
  description,
  ctaLabel,
  onCtaPress,
  ctaVariant = "primary",
  secondaryCtaLabel,
  onSecondaryCtaPress,
  secondaryVariant = "ghost",
  style,
}) {
  const { semanticPalette, TYPE, SPACING } = useTheme();

  const styles = useMemo(
    () =>
      StyleSheet.create({
        wrap: {
          width: "100%",
          maxWidth: 400,
          alignSelf: "center",
          alignItems: "center",
          paddingVertical: SPACING["2xl"],
          paddingHorizontal: SPACING.base,
          gap: SPACING.sm,
        },
        title: {
          fontFamily: TYPE.serifFamily,
          ...TYPE.h3,
          color: semanticPalette.ink,
          textAlign: "center",
          marginTop: SPACING.xs,
        },
        body: {
          fontFamily: fonts.regular,
          ...TYPE.body,
          color: semanticPalette.inkSoft,
          textAlign: "center",
          maxWidth: 340,
        },
      }),
    [semanticPalette.ink, semanticPalette.inkSoft, SPACING, TYPE]
  );

  return (
    <View style={[styles.wrap, style]}>
      <Ionicons name={iconName} size={48} color={iconColor ?? semanticPalette.inkMuted} />
      {title ? <Text style={styles.title}>{title}</Text> : null}
      {description ? <Text style={styles.body}>{description}</Text> : null}
      {ctaLabel && onCtaPress ? (
        <View
          style={{
            marginTop: SPACING.md,
            width: "100%",
            maxWidth: 320,
            alignSelf: "center",
            gap: SPACING.sm,
          }}
        >
          <Button
            label={ctaLabel}
            variant={ctaVariant === "danger" ? "destructive" : ctaVariant}
            onPress={onCtaPress}
            fullWidth
          />
          {secondaryCtaLabel && onSecondaryCtaPress ? (
            <Button
              label={secondaryCtaLabel}
              variant={secondaryVariant}
              onPress={onSecondaryCtaPress}
              fullWidth
            />
          ) : null}
        </View>
      ) : secondaryCtaLabel && onSecondaryCtaPress ? (
        <View style={{ marginTop: SPACING.md, width: "100%", maxWidth: 320, alignSelf: "center" }}>
          <Button label={secondaryCtaLabel} variant={secondaryVariant} onPress={onSecondaryCtaPress} fullWidth />
        </View>
      ) : null}
    </View>
  );
}

const EmptyState = memo(EmptyStateBase);

export default EmptyState;
