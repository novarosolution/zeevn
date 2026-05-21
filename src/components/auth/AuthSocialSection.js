import React, { useMemo } from "react";
import { Platform, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../context/ThemeContext";
import { fonts, spacing } from "../../theme/tokens";
import Button from "../ui/Button";
import {
  AUTH_SOCIAL_APPLE_ENABLED,
  AUTH_SOCIAL_GOOGLE_ENABLED,
  isAuthSocialVisible,
} from "../../constants/authFeatures";

function providerButtons({ onApplePress, onGooglePress, appleLabel, googleLabel }) {
  const items = [];
  if (AUTH_SOCIAL_APPLE_ENABLED && Platform.OS === "ios") {
    items.push({
      key: "apple",
      label: appleLabel,
      icon: "logo-apple",
      onPress: onApplePress,
    });
  }
  if (AUTH_SOCIAL_GOOGLE_ENABLED) {
    items.push({
      key: "google",
      label: googleLabel,
      icon: "logo-google",
      onPress: onGooglePress,
    });
  }
  if (AUTH_SOCIAL_APPLE_ENABLED && Platform.OS === "android") {
    items.push({
      key: "apple",
      label: appleLabel,
      icon: "logo-apple",
      onPress: onApplePress,
    });
  }
  return items;
}

/**
 * Social sign-in row — hidden until OAuth is enabled via env flags.
 */
export default function AuthSocialSection({
  dividerLabel,
  googleLabel,
  appleLabel,
  onGooglePress,
  onApplePress,
  disabled = false,
}) {
  const { semanticPalette, TYPE } = useTheme();

  const buttons = useMemo(
    () => providerButtons({ onApplePress, onGooglePress, appleLabel, googleLabel }),
    [appleLabel, googleLabel, onApplePress, onGooglePress]
  );

  const styles = useMemo(
    () =>
      StyleSheet.create({
        wrap: {
          marginTop: spacing.lg,
          gap: spacing.md,
        },
        dividerRow: {
          flexDirection: "row",
          alignItems: "center",
          gap: spacing.sm,
        },
        hairline: {
          flex: 1,
          height: StyleSheet.hairlineWidth,
          backgroundColor: semanticPalette.lineSoft,
        },
        dividerText: {
          fontFamily: fonts.semibold,
          fontSize: TYPE.micro.fontSize,
          lineHeight: TYPE.micro.lineHeight,
          letterSpacing: TYPE.micro.letterSpacing,
          textTransform: "uppercase",
          color: semanticPalette.inkMuted,
        },
        stack: {
          gap: spacing.sm,
        },
      }),
    [TYPE.micro, semanticPalette.inkMuted, semanticPalette.lineSoft]
  );

  if (!isAuthSocialVisible() || buttons.length === 0) return null;

  return (
    <View style={styles.wrap}>
      <View style={styles.dividerRow}>
        <View style={styles.hairline} />
        <Text style={styles.dividerText}>{dividerLabel}</Text>
        <View style={styles.hairline} />
      </View>
      <View style={styles.stack}>
        {buttons.map((btn) => (
          <Button
            key={btn.key}
            variant="secondary"
            size="lg"
            fullWidth
            interactionProfile="authSocial"
            label={btn.label}
            iconLeft={<Ionicons name={btn.icon} size={20} color={semanticPalette.ink} />}
            onPress={btn.onPress}
            disabled={disabled}
          />
        ))}
      </View>
    </View>
  );
}
