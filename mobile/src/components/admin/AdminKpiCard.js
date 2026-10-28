import React, { useMemo } from "react";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../context/ThemeContext";
import { ADMIN_FONT, getAdminChrome, useAdminCompactLayout } from "../../theme/adminLayout";

/** Ops metric tile. Icon + hint make the number readable. Use tone warn or hot when it needs work. */
export default function AdminKpiCard({
  label,
  value,
  hint,
  icon,
  delta,
  deltaUp = true,
  tone = "default",
  onPress,
  style,
}) {
  const { colors: c, isDark } = useTheme();
  const compact = useAdminCompactLayout();
  const chrome = useMemo(() => getAdminChrome(c, isDark), [c, isDark]);
  const styles = useMemo(() => createStyles(chrome), [chrome]);
  const hot = tone === "hot" || tone === "warn";
  const Wrapper = onPress ? Pressable : View;
  const toneColor = tone === "hot" ? chrome.danger : tone === "warn" ? chrome.goldDeep : chrome.inkFaint;
  const wrapProps = onPress
    ? {
        onPress,
        accessibilityRole: "button",
        accessibilityLabel: hint ? `${label} ${value}. ${hint}` : `${label} ${value}`,
        style: ({ pressed, hovered }) => [
          styles.card,
          styles.cardInteractive,
          hot && styles.cardHot,
          tone === "warn" && styles.cardWarn,
          hovered && !pressed ? styles.cardHover : null,
          pressed ? styles.cardPressed : null,
          style,
        ],
      }
    : {
        style: [
          styles.card,
          hot && styles.cardHot,
          tone === "warn" && styles.cardWarn,
          style,
        ],
      };

  return (
    <Wrapper {...wrapProps}>
      <View style={styles.top}>
        {icon ? (
          <View style={[styles.iconWell, hot && styles.iconWellHot, tone === "warn" && styles.iconWellWarn]}>
            <Ionicons
              name={icon}
              size={14}
              color={tone === "hot" ? chrome.danger : tone === "warn" ? chrome.goldDeep : chrome.inkSoft}
            />
          </View>
        ) : null}
        <Text style={styles.label} numberOfLines={1}>
          {label}
        </Text>
        {onPress && !compact ? <Ionicons name="arrow-forward" size={12} color={toneColor} style={styles.go} /> : null}
      </View>
      <Text
        style={[
          styles.value,
          tone === "hot" && styles.valueHot,
          tone === "warn" && styles.valueWarn,
        ]}
        numberOfLines={1}
      >
        {value}
      </Text>
      {hint ? (
        <Text style={[styles.hint, hot && styles.hintHot]} numberOfLines={1}>
          {hint}
        </Text>
      ) : null}
      {delta ? (
        <View style={[styles.deltaPill, deltaUp ? styles.deltaUp : styles.deltaDown]}>
          <Text style={[styles.delta, deltaUp ? styles.up : styles.down]} numberOfLines={1}>
            {deltaUp ? "▲" : "▼"} {delta}
          </Text>
        </View>
      ) : null}
    </Wrapper>
  );
}

export function AdminKpiGrid({ children, columns = 4, compact = false }) {
  return (
    <View
      style={[
        stylesGrid.grid,
        compact && stylesGrid.gridCompact,
        columns === 2 && stylesGrid.grid2,
        columns === 3 && stylesGrid.grid3,
        Platform.OS === "web" && stylesGrid.gridWeb,
      ]}
    >
      {children}
    </View>
  );
}

const stylesGrid = StyleSheet.create({
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 4,
  },
  gridCompact: {
    gap: 10,
    marginBottom: 2,
  },
  gridWeb: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(148px, 1fr))",
    gap: 10,
  },
  grid2: Platform.select({
    web: { gridTemplateColumns: "repeat(2, minmax(0, 1fr))" },
    default: {},
  }),
  grid3: Platform.select({
    web: { gridTemplateColumns: "repeat(3, minmax(0, 1fr))" },
    default: {},
  }),
});

function createStyles(chrome) {
  return StyleSheet.create({
    card: {
      flexGrow: 1,
      flexBasis: Platform.select({ web: undefined, default: "48%" }),
      width: Platform.select({ web: "100%", default: undefined }),
      minWidth: Platform.select({ web: 0, default: 148 }),
      maxWidth: Platform.select({ web: "100%", default: "48%" }),
      backgroundColor: chrome.card,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: chrome.line,
      borderRadius: Platform.select({ web: 14, default: 14 }),
      paddingTop: Platform.select({ web: 14, default: 16 }),
      paddingBottom: Platform.select({ web: 14, default: 16 }),
      paddingHorizontal: Platform.select({ web: 14, default: 16 }),
      overflow: "hidden",
      position: "relative",
      ...Platform.select({
        web: {
          boxShadow: "0 1px 1px rgba(20,24,16,0.03), 0 10px 22px -18px rgba(20,24,16,0.14)",
          transition: "transform 100ms ease-out, background-color 100ms ease-out, box-shadow 120ms ease-out",
        },
        default: {},
      }),
    },
    cardInteractive: Platform.select({
      web: { cursor: "pointer" },
      default: {},
    }),
    cardHot: {
      borderColor: Platform.select({
        web: "rgba(184, 68, 47, 0.22)",
        default: chrome.danger,
      }),
      backgroundColor: Platform.select({
        web: "rgba(184, 68, 47, 0.045)",
        default: chrome.card,
      }),
      borderLeftWidth: 3,
      borderLeftColor: chrome.danger,
    },
    cardWarn: {
      borderColor: Platform.select({
        web: "rgba(184, 136, 76, 0.28)",
        default: chrome.gold,
      }),
      backgroundColor: Platform.select({
        web: "rgba(212, 165, 116, 0.09)",
        default: chrome.card,
      }),
      borderLeftWidth: 3,
      borderLeftColor: chrome.goldDeep,
    },
    cardHover: Platform.select({
      web: {
        transform: [{ translateY: -1 }],
        borderColor: chrome.goldDeep,
        boxShadow: "0 2px 4px rgba(20,24,16,0.05), 0 16px 28px -18px rgba(20,24,16,0.22)",
      },
      default: {},
    }),
    go: { opacity: 0.55 },
    cardPressed: {
      transform: [{ scale: 0.97 }],
      ...Platform.select({ web: { cursor: "pointer" }, default: {} }),
    },
    top: { flexDirection: "row", alignItems: "center", gap: 8 },
    iconWell: {
      width: 24,
      height: 24,
      borderRadius: 8,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: chrome.paper,
    },
    iconWellHot: { backgroundColor: "rgba(184, 68, 47, 0.12)" },
    iconWellWarn: { backgroundColor: "rgba(212, 165, 116, 0.22)" },
    label: {
      flex: 1,
      minWidth: 0,
      fontSize: 12,
      color: chrome.inkSoft,
      letterSpacing: 0.1,
      fontFamily: ADMIN_FONT.medium,
    },
    value: {
      fontFamily: ADMIN_FONT.bold,
      fontSize: Platform.select({ web: 26, default: 24 }),
      fontWeight: "600",
      color: chrome.ink,
      marginTop: 8,
      letterSpacing: -0.6,
      fontVariant: ["tabular-nums"],
    },
    valueHot: {
      color: chrome.danger,
    },
    valueWarn: {
      color: chrome.goldDeep,
    },
    hint: {
      marginTop: 4,
      fontSize: 11.5,
      color: chrome.inkFaint,
      fontFamily: ADMIN_FONT.regular,
    },
    hintHot: {
      color: chrome.goldDeep,
      fontFamily: ADMIN_FONT.medium,
    },
    deltaPill: {
      alignSelf: "flex-start",
      marginTop: 8,
      paddingHorizontal: 7,
      paddingVertical: 2,
      borderRadius: 999,
    },
    deltaUp: {
      backgroundColor: "rgba(34, 120, 84, 0.1)",
    },
    deltaDown: {
      backgroundColor: "rgba(185, 28, 28, 0.1)",
    },
    delta: {
      fontSize: 11,
      fontFamily: ADMIN_FONT.semibold,
    },
    up: { color: chrome.green },
    down: { color: chrome.danger },
  });
}
