import React, { useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../context/ThemeContext";
import { fonts } from "../../theme/tokens";
import Button from "../ui/Button";
import { OBSERVABILITY_UI } from "../../content/appContent";

export default function ErrorFallback({ title, description, onRetry, compact = false }) {
  const { semanticPalette, TYPE, SPACING } = useTheme();

  const styles = useMemo(
    () =>
      StyleSheet.create({
        wrap: {
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
          paddingHorizontal: SPACING.xl,
          paddingVertical: compact ? SPACING.lg : SPACING["3xl"],
          gap: SPACING.md,
          minHeight: compact ? 200 : 320,
        },
        title: {
          fontFamily: TYPE.serifFamily,
          ...TYPE.h2,
          color: semanticPalette.ink,
          textAlign: "center",
        },
        body: {
          fontFamily: fonts.regular,
          ...TYPE.body,
          color: semanticPalette.inkSoft,
          textAlign: "center",
          maxWidth: 360,
        },
      }),
    [TYPE, SPACING, compact, semanticPalette.ink, semanticPalette.inkSoft]
  );

  return (
    <View style={styles.wrap} accessibilityRole="alert">
      <Ionicons name="alert-circle-outline" size={compact ? 40 : 52} color={semanticPalette.inkMuted} />
      <Text style={styles.title}>{title || OBSERVABILITY_UI.errorBoundaryTitle}</Text>
      <Text style={styles.body}>{description || OBSERVABILITY_UI.errorBoundaryBody}</Text>
      {onRetry ? (
        <Button label={OBSERVABILITY_UI.errorBoundaryRetry} onPress={onRetry} variant="primary" />
      ) : null}
    </View>
  );
}
