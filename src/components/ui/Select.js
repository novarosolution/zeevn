import React, { memo, useMemo, useState } from "react";
import { ActionSheetIOS, Alert, Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../context/ThemeContext";
import { fonts } from "../../theme/tokens";

/**
 * Native sheet picker on mobile + custom listbox on web.
 * Falls back to `onPress` when `options`/`onChangeValue` are not provided.
 */
function SelectBase({
  label,
  value,
  placeholder = "Select…",
  onPress,
  options = [],
  onChangeValue,
  disabled = false,
  errorText,
  accessibilityLabel,
  style,
  testID,
}) {
  const { semanticPalette, RADII, TYPE, SHADOWS } = useTheme();
  const [webOpen, setWebOpen] = useState(false);
  const normalizedOptions = useMemo(
    () =>
      Array.isArray(options)
        ? options.map((opt) =>
            typeof opt === "string"
              ? { label: opt, value: opt }
              : { label: String(opt?.label ?? opt?.value ?? ""), value: opt?.value }
          )
        : [],
    [options]
  );
  const selectedOption = normalizedOptions.find((opt) => opt.value === value);
  const display = selectedOption?.label ?? (value != null && String(value).length > 0 ? String(value) : placeholder);
  const isPlaceholder = !selectedOption && display === placeholder;
  const hasOptions = normalizedOptions.length > 0 && typeof onChangeValue === "function";
  const a11yLabel = accessibilityLabel || label || "Select option";

  const openNativePicker = () => {
    if (disabled) return;
    if (!hasOptions) {
      onPress?.();
      return;
    }
    if (Platform.OS === "ios") {
      const labels = normalizedOptions.map((opt) => opt.label);
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: [...labels, "Cancel"],
          cancelButtonIndex: labels.length,
          title: label || "Choose an option",
        },
        (buttonIndex) => {
          if (buttonIndex < labels.length) onChangeValue(normalizedOptions[buttonIndex].value);
        }
      );
      return;
    }
    Alert.alert(
      label || "Choose an option",
      undefined,
      [
        ...normalizedOptions.map((opt) => ({
          text: opt.label,
          onPress: () => onChangeValue(opt.value),
        })),
        { text: "Cancel", style: "cancel" },
      ],
      { cancelable: true }
    );
  };

  return (
    <View style={[styles.wrap, style]} testID={testID}>
      {label ? (
        <Text style={[styles.label, { color: semanticPalette.inkSoft, fontSize: TYPE.small.fontSize }]}>
          {label}
        </Text>
      ) : null}
      <Pressable
        onPress={
          Platform.OS === "web"
            ? () => {
                if (!hasOptions) {
                  onPress?.();
                  return;
                }
                setWebOpen((v) => !v);
              }
            : openNativePicker
        }
        disabled={disabled}
        accessibilityRole="button"
        accessibilityLabel={a11yLabel}
        accessibilityState={{ disabled, expanded: Platform.OS === "web" ? webOpen : undefined }}
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
      {Platform.OS === "web" && hasOptions && webOpen ? (
        <View
          role="listbox"
          aria-label={a11yLabel}
          style={{
            marginTop: 6,
            borderRadius: RADII.md,
            borderWidth: 1,
            borderColor: semanticPalette.lineSoft,
            backgroundColor: semanticPalette.surface,
            overflow: "hidden",
            ...SHADOWS.popover,
          }}
        >
          {normalizedOptions.map((opt) => {
            const isSelected = opt.value === value;
            return (
              <Pressable
                key={String(opt.value)}
                onPress={() => {
                  onChangeValue(opt.value);
                  setWebOpen(false);
                }}
                accessibilityRole="button"
                accessibilityLabel={`Select ${opt.label}`}
                style={({ pressed }) => ({
                  paddingHorizontal: 12,
                  paddingVertical: 10,
                  backgroundColor: isSelected
                    ? semanticPalette.accentSoft
                    : pressed
                      ? semanticPalette.surfaceAlt
                      : semanticPalette.surface,
                })}
              >
                <Text
                  style={{
                    fontFamily: fonts.regular,
                    fontSize: TYPE.body.fontSize,
                    color: semanticPalette.ink,
                  }}
                >
                  {opt.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      ) : null}
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
