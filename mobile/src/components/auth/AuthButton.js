import React from "react";
import { ActivityIndicator, Platform, StyleSheet, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import PressableScale from "../store/PressableScale";
import { useStoreTheme, withAlpha } from "../../theme/storefront";

/**
 * Login / Register buttons.
 *  - `primary`: the brand-green pill with the label centred and a round arrow on the right (a spinner while `loading`).
 *  - `secondary`: a white pill with a hairline edge and an optional leading icon (Google / Apple).
 */
export default function AuthButton({
  label,
  onPress,
  variant = "primary",
  icon,
  loading = false,
  disabled = false,
  accessibilityHint,
  style,
}) {
  const { c, r, type, shadow, isDark } = useStoreTheme();
  const blocked = disabled || loading;

  if (variant === "secondary") {
    return (
      <PressableScale
        onPress={onPress}
        disabled={blocked}
        scaleTo={0.97}
        style={[styles.shell, { borderRadius: r.pill, opacity: disabled && !loading ? 0.5 : 1 }, style]}
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityHint={accessibilityHint}
        accessibilityState={{ disabled: blocked, busy: loading }}
      >
        <View style={[styles.secondary, { borderRadius: r.pill, backgroundColor: c.card, borderColor: c.lineStrong }, shadow.soft]}>
          {loading ? (
            <ActivityIndicator size="small" color={c.ink} />
          ) : (
            <>
              {icon ? <Ionicons name={icon} size={20} color={c.ink} /> : null}
              <Text style={type.ui(15, "bold", c.ink)} numberOfLines={1}>
                {label}
              </Text>
            </>
          )}
        </View>
      </PressableScale>
    );
  }

  const gradient = isDark ? ["#CDDE92", "#A3B766"] : ["#3A6A34", "#1F3C1F"];
  const ink = isDark ? c.onBrand : "#FFFFFF";
  const glow = Platform.select({
    web: { boxShadow: `0 14px 26px -12px ${withAlpha(isDark ? "#A3B766" : "#244424", isDark ? 0.5 : 0.55)}` },
    ios: { shadowColor: isDark ? "#A3B766" : "#244424", shadowOffset: { width: 0, height: 10 }, shadowOpacity: isDark ? 0.3 : 0.3, shadowRadius: 18 },
    android: { elevation: 7, shadowColor: "#244424" },
    default: {},
  });

  return (
    <PressableScale
      onPress={onPress}
      disabled={blocked}
      scaleTo={0.98}
      style={[styles.shell, { borderRadius: r.pill, opacity: disabled && !loading ? 0.55 : 1 }, glow, style]}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: blocked, busy: loading }}
    >
      <LinearGradient colors={gradient} start={{ x: 0.1, y: 0 }} end={{ x: 0.9, y: 1 }} style={[styles.primary, { borderRadius: r.pill }]}>
        <View pointerEvents="none" style={[styles.gloss, { backgroundColor: withAlpha("#FFFFFF", isDark ? 0.5 : 0.3) }]} />
        <Text style={type.ui(17, "extrabold", ink, { letterSpacing: 0.1 })} numberOfLines={1}>
          {label}
        </Text>
        <View style={[styles.arrow, { backgroundColor: withAlpha(isDark ? "#18200C" : "#FFFFFF", isDark ? 0.14 : 0.18) }]}>
          {loading ? <ActivityIndicator size="small" color={ink} /> : <Ionicons name="arrow-forward" size={20} color={ink} />}
        </View>
      </LinearGradient>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  shell: { alignSelf: "stretch" },
  primary: { height: 60, alignItems: "center", justifyContent: "center", paddingHorizontal: 64, overflow: "hidden" },
  gloss: { position: "absolute", top: 0, left: 26, right: 26, height: StyleSheet.hairlineWidth * 2 },
  arrow: { position: "absolute", right: 8, top: 8, width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center" },
  secondary: {
    height: 54,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 9,
    borderWidth: 1.5,
    paddingHorizontal: 14,
  },
});
