import React, { memo } from "react";
import { Platform, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Button from "../../ui/Button";
import { NOTIFICATION_PREFS_SCREEN } from "../../../content/appContent";
import { useTheme } from "../../../context/ThemeContext";

const copy = NOTIFICATION_PREFS_SCREEN;

function NotificationPrefsSaveBarBase({ dirty, saving, onSave, sticky = false }) {
  const { semanticPalette, SPACING } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.bar,
        sticky
          ? {
              position: "absolute",
              left: 0,
              right: 0,
              bottom: 0,
              paddingBottom: Math.max(insets.bottom, SPACING.md),
              paddingTop: SPACING.md,
              paddingHorizontal: SPACING.lg,
              backgroundColor: semanticPalette.surface,
              borderTopWidth: StyleSheet.hairlineWidth,
              borderTopColor: semanticPalette.lineSoft,
              ...Platform.select({
                ios: {
                  shadowColor: "#0E1729",
                  shadowOffset: { width: 0, height: -4 },
                  shadowOpacity: 0.08,
                  shadowRadius: 12,
                },
                android: { elevation: 8 },
                default: {},
              }),
            }
          : {
              marginTop: SPACING.xl,
              paddingTop: SPACING.md,
            },
      ]}
    >
      <Button
        label={saving ? copy.savingCta : copy.saveCta}
        variant="primary"
        size="md"
        fullWidth
        disabled={!dirty}
        loading={saving}
        onPress={onSave}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    ...Platform.select({
      web: { position: "relative" },
      default: {},
    }),
  },
});

const NotificationPrefsSaveBar = memo(NotificationPrefsSaveBarBase);
export default NotificationPrefsSaveBar;
