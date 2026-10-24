import React from "react";
import { Platform, Pressable, StyleSheet, View } from "react-native";
import { useAdminChrome } from "../../theme/adminLayout";
import { getAdminTone } from "../../theme/adminTones";
import { useTheme } from "../../context/ThemeContext";

/** Compact on/off switch. `tone` colours the track when on (default forest green; use "red" for a "paused" style switch). */
export default function AdminSwitch({ value, onChange, disabled = false, tone = "green", accessibilityLabel, size = "md" }) {
  const chrome = useAdminChrome();
  const { isDark } = useTheme();
  const w = size === "sm" ? 32 : 40;
  const h = size === "sm" ? 18 : 22;
  const pad = 2;
  const thumb = h - pad * 2;
  const on = getAdminTone(tone, isDark).solid;

  return (
    <Pressable
      onPress={disabled ? undefined : () => onChange?.(!value)}
      hitSlop={8}
      accessibilityRole="switch"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ checked: Boolean(value), disabled }}
      style={[
        styles.track,
        { width: w, height: h, borderRadius: h / 2, backgroundColor: value ? on : chrome.line, borderColor: value ? on : chrome.inkFaint },
        disabled && styles.disabled,
      ]}
    >
      <View
        style={[
          styles.thumb,
          { width: thumb, height: thumb, borderRadius: thumb / 2, transform: [{ translateX: value ? w - h : 0 }] },
        ]}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  track: {
    borderWidth: StyleSheet.hairlineWidth,
    padding: 2,
    justifyContent: "center",
    ...Platform.select({ web: { cursor: "pointer", transition: "background-color 160ms ease-out" }, default: {} }),
  },
  thumb: {
    backgroundColor: "#FFFFFF",
    ...Platform.select({
      web: { boxShadow: "0 1px 3px rgba(0,0,0,0.28)", transition: "transform 160ms cubic-bezier(0.22, 1, 0.36, 1)" },
      default: {},
    }),
  },
  disabled: { opacity: 0.45 },
});
