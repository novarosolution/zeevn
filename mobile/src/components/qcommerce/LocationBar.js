import React, { useMemo } from "react";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../context/ThemeContext";
import { fonts, icon, radius, spacing, typography } from "../../theme/tokens";
import { ALCHEMY } from "../../theme/customerAlchemy";
import { FONT_BODY_SEMIBOLD } from "../../theme/typographyRoles";
import { platformShadow } from "../../theme/shadowPlatform";
import { LOCATION_BAR } from "../../content/appContent";

/**
 * Delivery address row — taps open address flow (no delivery-time promises).
 */
export default function LocationBar({ onPress, addressLine, city }) {
  const { colors: c, isDark } = useTheme();
  const styles = useMemo(() => createStyles(c, isDark), [c, isDark]);

  const label = (() => {
    const line = String(addressLine || "").trim();
    const cty = String(city || "").trim();
    if (line && cty) return `${line} · ${cty}`;
    if (cty) return cty;
    if (line) return line;
    return LOCATION_BAR.emptyLabel;
  })();

  const empty = !String(addressLine || "").trim() && !String(city || "").trim();

  return (
    <Pressable
      onPress={onPress}
      style={({ hovered, pressed }) => [
        styles.row,
        empty ? styles.rowEmpty : null,
        hovered && Platform.OS === "web" ? styles.rowHovered : null,
        pressed ? styles.rowPressed : null,
      ]}
      accessibilityRole="button"
      accessibilityLabel={empty ? LOCATION_BAR.emptyA11y : `${LOCATION_BAR.kicker} ${label}`}
    >
      <View style={styles.iconRing}>
        <View style={styles.iconInner}>
          <Ionicons name="location-sharp" size={icon.sm + 1} color={isDark ? ALCHEMY.goldBright : ALCHEMY.brownMuted} />
        </View>
      </View>
      <View style={styles.textWrap}>
        <Text style={styles.kicker}>{LOCATION_BAR.kicker}</Text>
        <Text style={[styles.label, empty && styles.labelMuted]} numberOfLines={1}>
          {label}
        </Text>
      </View>
      <View style={styles.chevronWrap}>
        <Ionicons name="chevron-forward" size={icon.sm} color={isDark ? "rgba(255,252,248,0.45)" : ALCHEMY.line} />
      </View>
    </Pressable>
  );
}

function createStyles(c, isDark) {
  const lift = platformShadow({
    web: {
      boxShadow: isDark
        ? "0 10px 28px rgba(0,0,0,0.28), inset 0 1px 0 rgba(255,255,255,0.06)"
        : "0 8px 22px rgba(22, 69, 51, 0.07), 0 2px 8px rgba(28, 25, 23, 0.04), inset 0 1px 0 rgba(255,253,251,0.92)",
    },
    ios: {
      shadowColor: "#3D2A12",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: isDark ? 0.2 : 0.06,
      shadowRadius: 10,
    },
    android: { elevation: isDark ? 3 : 2 },
  });

  return StyleSheet.create({
    row: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.md - 2,
      minHeight: 54,
      paddingVertical: spacing.sm + 2,
      paddingHorizontal: spacing.md + 2,
      borderRadius: radius.xl + 6,
      borderWidth: StyleSheet.hairlineWidth,
      borderTopWidth: 2,
      borderTopColor: isDark ? "rgba(52, 211, 153, 0.45)" : "rgba(31, 92, 71, 0.5)",
      borderColor: isDark ? "rgba(255,255,255,0.1)" : "rgba(22, 69, 51, 0.14)",
      backgroundColor: isDark ? "rgba(255,255,255,0.06)" : ALCHEMY.cardBg,
      ...lift,
      ...Platform.select({
        web: {
          cursor: "pointer",
          transition: "background 0.18s ease, border-color 0.18s ease, box-shadow 0.18s ease, transform 0.14s ease",
        },
        default: {},
      }),
    },
    rowEmpty: {
      borderColor: isDark ? "rgba(52, 211, 153, 0.42)" : "rgba(31, 92, 71, 0.42)",
      backgroundColor: isDark ? "rgba(31, 92, 71, 0.07)" : ALCHEMY.creamDeep,
    },
    rowHovered: {
      borderColor: isDark ? "rgba(52, 211, 153, 0.45)" : ALCHEMY.gold,
      backgroundColor: isDark ? "rgba(255,255,255,0.09)" : "#FFFFFF",
      ...(Platform.OS === "web"
        ? {
            boxShadow:
              "0 12px 28px rgba(22, 69, 51, 0.1), inset 0 1px 0 rgba(255,253,251,0.95)",
          }
        : {}),
    },
    rowPressed: {
      opacity: 0.9,
      ...(Platform.OS === "web" ? {} : { transform: [{ scale: 0.995 }] }),
    },
    iconRing: {
      padding: 2,
      borderRadius: radius.pill,
      backgroundColor: isDark ? "rgba(31, 92, 71, 0.18)" : ALCHEMY.goldSoft,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: isDark ? "rgba(52, 211, 153, 0.35)" : "rgba(31, 92, 71, 0.35)",
    },
    iconInner: {
      width: 38,
      height: 38,
      borderRadius: radius.lg,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: isDark ? "rgba(28, 25, 23, 0.85)" : "#FFFCF8",
    },
    textWrap: {
      flex: 1,
      minWidth: 0,
    },
    kicker: {
      fontSize: typography.overline,
      fontFamily: fonts.extrabold,
      letterSpacing: 1.1,
      textTransform: "uppercase",
      color: isDark ? "rgba(255,252,248,0.55)" : ALCHEMY.brownMuted,
      marginBottom: 3,
    },
    label: {
      fontSize: typography.bodySmall + 1,
      fontFamily: FONT_BODY_SEMIBOLD,
      color: c.textPrimary,
      letterSpacing: -0.15,
    },
    labelMuted: {
      color: isDark ? "rgba(255,252,248,0.72)" : ALCHEMY.brownMuted,
      fontFamily: fonts.semibold,
    },
    chevronWrap: {
      paddingLeft: 2,
    },
  });
}
