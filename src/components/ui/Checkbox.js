import React, { memo } from "react";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../context/ThemeContext";
import { fonts } from "../../theme/tokens";
import { WebNativeButton } from "./inputWebHelpers";

/**
 * Checkbox row with label. Uses native `<button role="checkbox">` on web.
 */
function CheckboxBase({ checked, onToggle, label, disabled = false, style, testID }) {
  const { semanticPalette, TYPE } = useTheme();

  const box = (
    <View
      style={{
        width: 18,
        height: 18,
        borderRadius: 4,
        borderWidth: 1,
        borderColor: checked ? semanticPalette.ink : semanticPalette.line,
        backgroundColor: checked ? semanticPalette.ink : semanticPalette.surface,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {checked ? <Ionicons name="checkmark" size={12} color={semanticPalette.inkInverse} /> : null}
    </View>
  );

  const labelNode = label ? (
    <Text
      style={{
        fontFamily: fonts.regular,
        fontSize: TYPE.small.fontSize,
        lineHeight: TYPE.small.lineHeight,
        color: semanticPalette.inkSoft,
      }}
    >
      {label}
    </Text>
  ) : null;

  if (Platform.OS === "web") {
    return (
      <WebNativeButton
        testID={testID}
        disabled={disabled}
        ariaLabel={typeof label === "string" ? label : "Checkbox"}
        onPress={onToggle}
        style={{
          display: "inline-flex",
          flexDirection: "row",
          alignItems: "center",
          gap: 8,
          background: "none",
          border: "none",
          padding: 0,
          cursor: disabled ? "default" : "pointer",
          opacity: disabled ? 0.5 : 1,
          ...style,
        }}
      >
        <span role="checkbox" aria-checked={checked} style={{ display: "flex" }}>
          {box}
        </span>
        {labelNode}
      </WebNativeButton>
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
