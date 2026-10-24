import React from "react";
import { Platform, Pressable, StyleSheet, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useAdminChrome } from "../../theme/adminLayout";

/** Tick box for row selection. `indeterminate` shows a dash (some, not all, rows picked). */
export default function AdminCheckbox({ checked = false, indeterminate = false, onChange, disabled = false, size = 18, accessibilityLabel }) {
  const chrome = useAdminChrome();
  const on = checked || indeterminate;

  return (
    <Pressable
      onPress={disabled ? undefined : () => onChange?.(!checked)}
      hitSlop={8}
      accessibilityRole="checkbox"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ checked: indeterminate ? "mixed" : checked, disabled }}
      style={[
        styles.box,
        {
          width: size,
          height: size,
          borderRadius: Math.round(size * 0.3),
          borderColor: on ? chrome.tabOnBg : chrome.inkFaint,
          backgroundColor: on ? chrome.tabOnBg : chrome.card,
        },
        disabled && styles.disabled,
      ]}
    >
      <View pointerEvents="none">
        {on ? <Ionicons name={indeterminate && !checked ? "remove" : "checkmark"} size={Math.round(size * 0.78)} color={chrome.tabOnText} /> : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  box: {
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
    ...Platform.select({ web: { cursor: "pointer", transition: "background-color 100ms ease-out, border-color 100ms ease-out" }, default: {} }),
  },
  disabled: { opacity: 0.4 },
});
