import React, { useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Animated, { FadeIn, FadeOut } from "react-native-reanimated";
import { useTheme } from "../../context/ThemeContext";
import useReducedMotion from "../../hooks/useReducedMotion";
import { KANKREG_PALETTE, ZEEVAN_GOLD } from "../../theme/kankregWeb";
import { fonts, spacing } from "../../theme/tokens";

/**
 * Calm gold notice for the shop's rules on the web bag and checkout: the full card ("We're closed right now" + the
 * shop's message + a reopens-in chip) at the top of the page, or the one-line `compact` form ("Add ₹X more to place
 * this order") under the subtotal. Gold rather than red — nothing is wrong, the shop just can't take this order yet.
 */
export default function KankregStoreNotice({ icon = "information-circle-outline", title, message, chip, compact = false, style }) {
  const { colors: c, isDark } = useTheme();
  const reducedMotion = useReducedMotion();
  const ink = isDark ? ZEEVAN_GOLD.bright : "#7A4F12";
  const styles = useMemo(() => createStyles(c, isDark, compact, ink), [c, isDark, compact, ink]);

  return (
    <Animated.View
      entering={reducedMotion ? undefined : FadeIn.duration(200)}
      exiting={reducedMotion ? undefined : FadeOut.duration(160)}
      accessible
      accessibilityLabel={[title, message, chip].filter(Boolean).join(". ")}
      style={[styles.wrap, style]}
    >
      <View style={styles.bubble}>
        <Ionicons name={icon} size={compact ? 16 : 19} color={ink} />
      </View>
      <View style={styles.body}>
        {title ? <Text style={styles.title}>{title}</Text> : null}
        {message ? <Text style={styles.message}>{message}</Text> : null}
        {chip ? (
          <View style={styles.chip}>
            <Text style={styles.chipText}>{chip}</Text>
          </View>
        ) : null}
      </View>
    </Animated.View>
  );
}

function createStyles(c, isDark, compact, ink) {
  return StyleSheet.create({
    wrap: {
      flexDirection: "row",
      alignItems: compact ? "center" : "flex-start",
      gap: compact ? spacing.xs + 2 : spacing.sm + 2,
      paddingVertical: compact ? spacing.xs + 3 : spacing.sm + 2,
      paddingHorizontal: spacing.md - 2,
      borderRadius: 14,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: isDark ? "rgba(232, 188, 132, 0.32)" : ZEEVAN_GOLD.border,
      borderTopWidth: compact ? StyleSheet.hairlineWidth : 2,
      borderTopColor: isDark ? "rgba(232, 188, 132, 0.6)" : ZEEVAN_GOLD.base,
      backgroundColor: isDark ? "rgba(232, 188, 132, 0.1)" : ZEEVAN_GOLD.soft,
    },
    bubble: {
      width: compact ? 24 : 34,
      height: compact ? 24 : 34,
      borderRadius: 17,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: isDark ? "rgba(232, 188, 132, 0.16)" : "rgba(255, 255, 255, 0.85)",
    },
    body: { flex: 1, minWidth: 0, gap: 2 },
    title: {
      fontFamily: fonts.bold,
      fontSize: 15,
      color: isDark ? c.textPrimary : KANKREG_PALETTE.ink,
    },
    message: {
      fontFamily: compact ? fonts.bold : fonts.medium,
      fontSize: compact ? 13 : 13.5,
      lineHeight: 19,
      color: compact ? ink : isDark ? c.textSecondary : KANKREG_PALETTE.inkSoft,
    },
    chip: {
      alignSelf: "flex-start",
      marginTop: 6,
      paddingHorizontal: 10,
      paddingVertical: 3,
      borderRadius: 11,
      backgroundColor: isDark ? "rgba(232, 188, 132, 0.18)" : "rgba(212, 165, 116, 0.26)",
    },
    chipText: { fontFamily: fonts.bold, fontSize: 12, color: ink },
  });
}
