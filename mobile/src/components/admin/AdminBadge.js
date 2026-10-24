import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../context/ThemeContext";
import { getAdminTone } from "../../theme/adminTones";
import { fonts } from "../../theme/tokens";

const SIZES = {
  sm: { height: 20, padX: 7, font: 10.5, icon: 11, dot: 5 },
  md: { height: 24, padX: 9, font: 11.5, icon: 12, dot: 6 },
};

/** Small status capsule: tinted fill, optional leading dot or icon. `solid` flips to a filled, white-text pill. */
export default function AdminBadge({ label, tone = "neutral", dot = false, icon, size = "md", solid = false, style, textStyle }) {
  const { isDark } = useTheme();
  const t = getAdminTone(tone, isDark);
  const dims = SIZES[size] || SIZES.md;
  const fg = solid ? "#FFFFFF" : t.fg;

  return (
    <View
      style={[
        styles.pill,
        {
          height: dims.height,
          paddingHorizontal: dims.padX,
          backgroundColor: solid ? t.solid : t.bg,
          borderColor: solid ? t.solid : t.border,
        },
        style,
      ]}
    >
      {dot ? <View style={{ width: dims.dot, height: dims.dot, borderRadius: dims.dot, backgroundColor: solid ? "#FFFFFF" : t.solid }} /> : null}
      {icon ? <Ionicons name={icon} size={dims.icon} color={fg} /> : null}
      <Text style={[styles.text, { fontSize: dims.font, color: fg }, textStyle]} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    gap: 5,
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
  },
  text: { fontFamily: fonts.semibold, letterSpacing: 0.1 },
});
