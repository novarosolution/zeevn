import React, { memo } from "react";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../context/ThemeContext";
import { fonts } from "../../theme/tokens";

/**
 * Checkbox row with label. Uses native `<button role="checkbox">` on web.
 */
function CheckboxBase({ checked, onToggle, label, labelStyle, disabled = false, style, testID }) {
  const { semanticPalette, TYPE } = useTheme();

  const box = (
    <View
      style={{
        width: 18,
        height: 18,
        borderRadius: 4,
        borderWidth: 1,
        borderColor: checked ? semanticPalette.accentOnLight : semanticPalette.accent,
        backgroundColor: checked ? semanticPalette.accent : semanticPalette.surface,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {checked ? <Ionicons name="checkmark" size={12} color={semanticPalette.inkInverse} /> : null}
    </View>
  );

  const labelNode = label ? (
    <Text
      style={[
        {
          fontFamily: fonts.regular,
          fontSize: TYPE.small.fontSize,
          lineHeight: TYPE.small.lineHeight,
          color: semanticPalette.inkSoft,
        },
        labelStyle,
      ]}
    >
      {label}
    </Text>
  ) : null;

  if (Platform.OS === "web") {
    const a11yLabel = typeof label === "string" ? label : "Checkbox";
    return (
      <button
        type="button"
        data-testid={testID}
        role="checkbox"
        aria-checked={checked}
        aria-label={a11yLabel}
        disabled={disabled}
        onClick={(e) => {
          e.preventDefault();
          if (!disabled && onToggle) onToggle();
        }}
        style={{
          display: "inline-flex",
          flexDirection: "row",
          alignItems: "center",
          gap: 8,
          background: "none",
          border: "none",
          padding: 0,
          margin: 0,
          cursor: disabled ? "default" : "pointer",
          opacity: disabled ? 0.5 : 1,
          font: "inherit",
          textAlign: "left",
        }}
      >
        {box}
        {labelNode}
      </button>
    );
  }

  return (
    <Pressable
      testID={testID}
      disabled={disabled}
      accessibilityRole="checkbox"
      accessibilityState={{ checked }}
      accessibilityLabel={typeof label === "string" ? label : undefined}
      onPress={onToggle}
      style={[styles.row, style]}
    >
      {box}
      {labelNode}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
});

const Checkbox = memo(CheckboxBase);

export default Checkbox;
