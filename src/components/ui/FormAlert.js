import React, { memo } from "react";
import { Platform, StyleSheet, Text, View } from "react-native";
import { useTheme } from "../../context/ThemeContext";
import { fonts } from "../../theme/tokens";

/** Server / form-level errors — assertive announcement. */
function FormAlertBase({ message, style }) {
  const { semanticPalette, TYPE, SPACING, RADII } = useTheme();
  if (!message) return null;

  return (
    <View
      style={[
        {
          padding: SPACING.md,
          borderRadius: RADII.md,
          backgroundColor: "rgba(178, 58, 58, 0.08)",
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: semanticPalette.sale,
        },
        style,
      ]}
      accessibilityRole="alert"
      accessibilityLiveRegion="assertive"
      {...Platform.select({
        web: { role: "alert" },
        default: {},
      })}
    >
      <Text style={{ fontFamily: fonts.medium, fontSize: TYPE.body.fontSize, color: semanticPalette.sale }}>{message}</Text>
    </View>
  );
}

const FormAlert = memo(FormAlertBase);
export default FormAlert;
