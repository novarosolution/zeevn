import React, { useMemo } from "react";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { ADMIN_FONT, useAdminChrome } from "../../theme/adminLayout";
import { getAdminTone } from "../../theme/adminTones";
import { useTheme } from "../../context/ThemeContext";

/**
 * Number tile for the top of a desk screen. `tone` tints the icon and, when `selected` or `alert`, the whole tile.
 * Give it `onPress` and it doubles as a filter.
 */
export default function AdminStatTile({ icon, label, value, hint, tone = "neutral", selected = false, alert = false, onPress, style }) {
  const chrome = useAdminChrome();
  const { isDark } = useTheme();
  const t = getAdminTone(alert ? "red" : tone, isDark);
  const styles = useMemo(() => createStyles(chrome), [chrome]);
  const Wrapper = onPress ? Pressable : View;
  const tinted = selected || alert;

  return (
    <Wrapper
      {...(onPress
        ? {
            onPress,
            accessibilityRole: "button",
            accessibilityState: { selected },
            style: ({ hovered, pressed }) => [
              styles.tile,
              styles.interactive,
              tinted && { backgroundColor: t.bg, borderColor: t.border },
              selected && { borderColor: t.solid },
              hovered && !tinted && styles.hover,
              pressed && styles.pressed,
              style,
            ],
          }
        : { style: [styles.tile, tinted && { backgroundColor: t.bg, borderColor: t.border }, style] })}
    >
      <View style={styles.top}>
        {icon ? (
          <View style={[styles.iconWell, { backgroundColor: t.bg, borderColor: t.border }]}>
            <Ionicons name={icon} size={14} color={t.fg} />
          </View>
        ) : null}
        <Text style={styles.label} numberOfLines={1}>
          {label}
        </Text>
      </View>
      <Text style={[styles.value, alert && { color: t.fg }]} numberOfLines={1}>
        {value}
      </Text>
      {hint ? (
        <Text style={styles.hint} numberOfLines={1}>
          {hint}
        </Text>
      ) : null}
    </Wrapper>
  );
}

/** Auto-fitting row/grid of tiles. */
export function AdminStatGrid({ children, min = 168, style }) {
  return (
    <View
      style={[
        Platform.OS === "web"
          ? { display: "grid", gridTemplateColumns: `repeat(auto-fit, minmax(${min}px, 1fr))`, gap: 10 }
          : { flexDirection: "row", flexWrap: "wrap", gap: 10 },
        style,
      ]}
    >
      {children}
    </View>
  );
}

function createStyles(chrome) {
  return StyleSheet.create({
    tile: {
      minWidth: 0,
      padding: 14,
      borderRadius: 14,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: chrome.line,
      backgroundColor: chrome.card,
      gap: 6,
      ...Platform.select({
        web: {
          boxShadow: "0 1px 1px rgba(20,24,16,0.03), 0 10px 22px -18px rgba(20,24,16,0.12)",
          transition: "background-color 120ms ease-out, border-color 120ms ease-out, transform 100ms ease-out",
        },
        default: {},
      }),
    },
    interactive: Platform.select({ web: { cursor: "pointer" }, default: {} }),
    hover: { backgroundColor: chrome.paper },
    pressed: { transform: [{ scale: 0.985 }] },
    top: { flexDirection: "row", alignItems: "center", gap: 8 },
    iconWell: {
      width: 26,
      height: 26,
      borderRadius: 8,
      alignItems: "center",
      justifyContent: "center",
      borderWidth: StyleSheet.hairlineWidth,
    },
    label: { flex: 1, fontSize: 12, color: chrome.inkSoft, fontFamily: ADMIN_FONT.medium },
    value: { fontFamily: ADMIN_FONT.bold, fontSize: 24, letterSpacing: -0.5, color: chrome.ink, fontWeight: "600" },
    hint: { fontSize: 11.5, color: chrome.inkFaint, fontFamily: ADMIN_FONT.regular },
  });
}
