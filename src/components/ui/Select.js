import React, { memo } from "react";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../context/ThemeContext";
import { fonts } from "../../theme/tokens";

/**
 * Minimal select trigger stub — opens options via parent `onPress` (e.g. bottom sheet / modal).
 * Full searchable select is planned; use this for consistent styling during migration.
 */
function SelectBase({
  label,
  value,
  placeholder = "Select…",
  onPress,
  disabled = false,
  errorText,
  style,
  testID,
}) {
  const { semanticPalette, RADII, TYPE } = useTheme();
  const display = value != null && String(value).length > 0 ? String(value) : placeholder;
  const isPlaceholder = display === placeholder;

  return (
    <View style={[styles.wrap, style]} testID={testID}>
      {label ? (
        <Text style={[styles.label, { color: semanticPalette.inkSoft, fontSize: TYPE.small.fontSize }]}>
          {label}
        </Text>
      ) : null}
      <Pressable
        onPress={disabled ? undefined : onPress}
        disabled={disabled}
        accessibilityRole="button"
        style={({ pressed }) => [
          styles.field,
          {
            borderColor: errorText ? semanticPalette.sale : semanticPalette.lineSoft,
            backgroundColor: semanticPalette.surfaceAlt,
            borderRadius: RADII.md,
            opacity: disabled ? 0.5 : pressed ? 0.9 : 1,
          },
        ]}
      >
        <Text
          style={{
            flex: 1,
            fontFamily: fonts.regular,
            fontSize: TYPE.body.fontSize,
            color: isPlaceholder ? semanticPalette.inkMuted : semanticPalette.ink,
          }}
          numberOfLines={1}
        >
          {display}
        </Text>
        <Ionicons name="chevron-down" size={18} color={semanticPalette.inkMuted} />
      </Pressable>
      {errorText ? (
        <Text style={[styles.error, { color: semanticPalette.sale, fontSize: TYPE.caption.fontSize }]}>
          {errorText}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { width: "100%" },
  label: { marginBottom: 6 },
  field: {
    minHeight: 40,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    ...Platform.select({ web: { cursor: "pointer" } }),
  },
  error: { marginTop: 4 },
});

const Select = memo(SelectBase);

export default Select;
