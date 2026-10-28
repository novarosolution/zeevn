import React, { useMemo } from "react";
import { ActivityIndicator, Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { ADMIN_FONT, useAdminChrome } from "../../theme/adminLayout";
import { getAdminTone } from "../../theme/adminTones";
import { useTheme } from "../../context/ThemeContext";

const SIZES = {
  xs: { height: 28, padX: 10, font: 12, icon: 13, gap: 5, radius: 8 },
  sm: { height: 34, padX: 13, font: 12.5, icon: 14, gap: 6, radius: 10 },
  md: { height: 40, padX: 16, font: 13.5, icon: 16, gap: 7, radius: 11 },
};

/**
 * Dense admin button. variants: primary · gold · secondary · soft · ghost · tint (with `tone`) · danger.
 * Pass `icon` and no `label` for an icon-only square button (give it a `title` for the tooltip).
 */
export default function AdminButton({
  label,
  icon,
  iconRight,
  onPress,
  variant = "secondary",
  tone = "neutral",
  size = "sm",
  loading = false,
  disabled = false,
  fullWidth = false,
  title,
  style,
  textStyle,
  accessibilityLabel,
}) {
  const chrome = useAdminChrome();
  const { isDark } = useTheme();
  const dims = SIZES[size] || SIZES.sm;
  const palette = useMemo(() => buildPalette(variant, tone, chrome, isDark), [variant, tone, chrome, isDark]);
  const iconOnly = !label;
  const inactive = disabled || loading;

  return (
    <Pressable
      onPress={inactive ? undefined : onPress}
      disabled={inactive}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel || title || label}
      accessibilityState={{ disabled: inactive, busy: loading }}
      {...(Platform.OS === "web" && title ? { title } : null)}
      style={({ pressed, hovered, focused }) => [
        styles.base,
        {
          height: dims.height,
          minWidth: iconOnly ? dims.height : undefined,
          paddingHorizontal: iconOnly ? 0 : dims.padX,
          borderRadius: dims.radius,
          gap: dims.gap,
          backgroundColor: hovered && !inactive ? palette.bgHover : palette.bg,
          borderColor: palette.border,
        },
        Platform.OS === "web" && !inactive ? webDepth(variant, hovered, isDark) : null,
        Platform.OS === "web" && focused && !inactive ? styles.focusRing : null,
        fullWidth && styles.fullWidth,
        pressed && !inactive && styles.pressed,
        disabled && styles.disabled,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator size="small" color={palette.fg} />
      ) : icon ? (
        <Ionicons name={icon} size={dims.icon} color={palette.fg} />
      ) : null}
      {label ? (
        <Text style={[styles.label, { fontSize: dims.font, color: palette.fg }, textStyle]} numberOfLines={1}>
          {label}
        </Text>
      ) : null}
      {iconRight && !loading ? <Ionicons name={iconRight} size={dims.icon} color={palette.fg} /> : null}
    </Pressable>
  );
}

/** Quiet depth on web: solid buttons sit on a soft shadow and lift a hair on hover. Flat variants stay flat. */
function webDepth(variant, hovered, isDark) {
  if (variant === "primary") {
    return {
      boxShadow: hovered
        ? "0 1px 0 rgba(255,255,255,0.14) inset, 0 6px 14px -6px rgba(31,51,31,0.55)"
        : "0 1px 0 rgba(255,255,255,0.12) inset, 0 2px 6px -3px rgba(31,51,31,0.45)",
      transform: [{ translateY: hovered ? -0.5 : 0 }],
    };
  }
  if (variant === "gold") {
    return { boxShadow: hovered ? "0 6px 14px -6px rgba(143,94,20,0.55)" : "0 2px 6px -3px rgba(143,94,20,0.45)" };
  }
  if (variant === "secondary" || variant === "soft") {
    return { boxShadow: isDark ? "none" : hovered ? "0 3px 8px -4px rgba(20,24,16,0.18)" : "0 1px 2px rgba(20,24,16,0.05)" };
  }
  return null;
}

function buildPalette(variant, tone, chrome, isDark) {
  const t = getAdminTone(tone, isDark);
  switch (variant) {
    case "primary":
      return {
        bg: chrome.tabOnBg,
        bgHover: isDark ? chrome.tabOnBg : "#2A4528",
        border: "transparent",
        fg: chrome.tabOnText,
      };
    case "gold":
      return { bg: "#D9A441", bgHover: "#E3B25A", border: "transparent", fg: "#1B1608" };
    case "soft":
      return { bg: chrome.paper, bgHover: chrome.rowHover, border: chrome.line, fg: chrome.ink };
    case "ghost":
      return { bg: "transparent", bgHover: chrome.rowHover, border: "transparent", fg: chrome.inkSoft };
    case "tint":
      return { bg: t.bg, bgHover: t.border, border: t.border, fg: t.fg };
    case "danger":
      return {
        bg: getAdminTone("red", isDark).bg,
        bgHover: getAdminTone("red", isDark).border,
        border: getAdminTone("red", isDark).border,
        fg: getAdminTone("red", isDark).fg,
      };
    case "secondary":
    default:
      return { bg: chrome.card, bgHover: chrome.paper, border: chrome.line, fg: chrome.ink };
  }
}

const styles = StyleSheet.create({
  base: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: StyleSheet.hairlineWidth,
    alignSelf: "flex-start",
    ...Platform.select({
      web: {
        cursor: "pointer",
        userSelect: "none",
        transition: "background-color 120ms ease-out, transform 100ms ease-out, box-shadow 120ms ease-out",
      },
      default: {},
    }),
  },
  fullWidth: { alignSelf: "stretch" },
  focusRing: Platform.select({ web: { outlineStyle: "solid", outlineWidth: 2, outlineOffset: 2, outlineColor: "rgba(184,136,76,0.65)" }, default: {} }),
  pressed: { transform: [{ scale: 0.97 }] },
  disabled: { opacity: 0.45, ...Platform.select({ web: { cursor: "not-allowed" }, default: {} }) },
  label: { fontFamily: ADMIN_FONT.semibold, letterSpacing: 0.1 },
});

export function AdminButtonRow({ children, style }) {
  return <View style={[{ flexDirection: "row", flexWrap: "wrap", alignItems: "center", gap: 8 }, style]}>{children}</View>;
}
