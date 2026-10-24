import React, { useMemo } from "react";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { useAdminChrome } from "../../theme/adminLayout";
import { getAdminTone } from "../../theme/adminTones";
import { useTheme } from "../../context/ThemeContext";
import { useAdminDesk } from "../../services/adminDeskStore";
import { fonts } from "../../theme/tokens";

/** Live "is the shop taking orders?" pill for the desk header. Tapping it opens the settings page. */
export default function AdminStoreStatusChip({ onPress, compact = false }) {
  const chrome = useAdminChrome();
  const { isDark } = useTheme();
  const { summary } = useAdminDesk();
  const styles = useMemo(() => createStyles(chrome), [chrome]);
  const store = summary?.store;
  if (!store) return null;

  const tone = getAdminTone(store.open ? "green" : store.reason === "paused" ? "red" : "gold", isDark);
  const label = store.open ? "Taking orders" : store.reason === "paused" ? "Orders paused" : "Closed for the day";

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${label}. Open shop desk`}
      {...(Platform.OS === "web" ? { title: store.open ? "The shop is open — tap to change" : store.message || "Tap to change" } : null)}
      style={({ hovered, pressed }) => [
        styles.chip,
        { backgroundColor: tone.bg, borderColor: tone.border },
        hovered && styles.hover,
        pressed && styles.pressed,
      ]}
    >
      <View style={[styles.dot, { backgroundColor: tone.solid }]} />
      {compact ? null : (
        <Text style={[styles.text, { color: tone.fg }]} numberOfLines={1}>
          {label}
        </Text>
      )}
    </Pressable>
  );
}

function createStyles() {
  return StyleSheet.create({
    chip: {
      flexDirection: "row",
      alignItems: "center",
      gap: 7,
      height: 36,
      paddingHorizontal: 12,
      borderRadius: 10,
      borderWidth: StyleSheet.hairlineWidth,
      ...Platform.select({ web: { cursor: "pointer", transition: "transform 100ms ease-out, filter 100ms ease-out" }, default: {} }),
    },
    hover: Platform.select({ web: { filter: "brightness(0.97)" }, default: {} }),
    pressed: { transform: [{ scale: 0.97 }] },
    dot: { width: 8, height: 8, borderRadius: 4 },
    text: { fontSize: 12.5, fontFamily: fonts.semibold },
  });
}
