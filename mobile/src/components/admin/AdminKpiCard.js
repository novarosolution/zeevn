import React, { useMemo } from "react";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { useTheme } from "../../context/ThemeContext";
import { getAdminChrome } from "../../theme/adminLayout";
import { FONT_PRICE } from "../../theme/typographyRoles";
import { fonts } from "../../theme/tokens";

/**
 * Ops metric tile. On web: equal 4-up grid, gold hairline, optional press.
 * Pass `tone="warn"` / `tone="hot"` when the number needs attention.
 */
export default function AdminKpiCard({
  label,
  value,
  delta,
  deltaUp = true,
  tone = "default",
  onPress,
  style,
}) {
  const { colors: c, isDark } = useTheme();
  const chrome = useMemo(() => getAdminChrome(c, isDark), [c, isDark]);
  const styles = useMemo(() => createStyles(chrome), [chrome]);
  const hot = tone === "hot" || tone === "warn";
  const Wrapper = onPress ? Pressable : View;
  const wrapProps = onPress
    ? {
        onPress,
        accessibilityRole: "button",
        style: ({ hovered, pressed }) => [
          styles.card,
          hot && styles.cardHot,
          tone === "warn" && styles.cardWarn,
          hovered && Platform.OS === "web" ? styles.cardHover : null,
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
      <View style={[styles.accent, hot && styles.accentHot, tone === "warn" && styles.accentWarn]} />
      <Text style={styles.label} numberOfLines={1}>
        {label}
      </Text>
      <Text style={[styles.value, hot && styles.valueHot]} numberOfLines={1}>
        {value}
      </Text>
      {delta ? (
        <View style={[styles.deltaPill, deltaUp ? styles.deltaUp : styles.deltaDown]}>
          <Text style={[styles.delta, deltaUp ? styles.up : styles.down]} numberOfLines={1}>
            {deltaUp ? "▲" : "▼"} {delta}
          </Text>
        </View>
      ) : onPress ? (
        <Text style={styles.hint}>Open</Text>
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
    gap: 16,
    marginBottom: 4,
  },
  gridCompact: {
    gap: 10,
    marginBottom: 2,
  },
  gridWeb: {
    gap: 12,
  },
  grid2: {},
  grid3: {},
});

function createStyles(chrome) {
  return StyleSheet.create({
    card: {
      flexGrow: 1,
      flexBasis: Platform.select({ web: "calc(25% - 9px)", default: "48%" }),
      minWidth: Platform.select({ web: 150, default: 148 }),
      maxWidth: Platform.select({ web: undefined, default: "48%" }),
      backgroundColor: chrome.card,
      borderWidth: 1,
      borderColor: chrome.line,
      borderRadius: Platform.select({ web: 16, default: 14 }),
      paddingTop: Platform.select({ web: 16, default: 18 }),
      paddingBottom: Platform.select({ web: 14, default: 18 }),
      paddingHorizontal: Platform.select({ web: 16, default: 18 }),
      overflow: "hidden",
      position: "relative",
      ...Platform.select({
        web: {
          boxShadow: "0 1px 2px rgba(25,20,15,.04), 0 10px 28px -18px rgba(25,20,15,.14)",
          transition: "transform 0.15s ease, box-shadow 0.15s ease, border-color 0.15s ease",
          cursor: "default",
          backgroundImage: "linear-gradient(180deg, rgba(255,255,255,0.55) 0%, rgba(255,255,255,0) 48%)",
        },
        default: {},
      }),
    },
    cardHot: {
      borderColor: Platform.select({
        web: "rgba(185, 28, 28, 0.28)",
        default: chrome.gold,
      }),
      backgroundColor: Platform.select({
        web: "rgba(254, 242, 242, 0.95)",
        default: chrome.card,
      }),
    },
    cardWarn: {
      borderColor: Platform.select({
        web: "rgba(169,119,46,0.42)",
        default: chrome.gold,
      }),
      backgroundColor: Platform.select({
        web: "rgba(255,251,235,0.95)",
        default: chrome.card,
      }),
    },
    cardHover: {
      ...Platform.select({
        web: {
          transform: [{ translateY: -2 }],
          boxShadow: "0 8px 24px -12px rgba(25,20,15,.22)",
          borderColor: chrome.linkOnBorder,
          cursor: "pointer",
        },
        default: {},
      }),
    },
    cardPressed: { opacity: 0.92 },
    accent: {
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      height: 2.5,
      backgroundColor: "transparent",
      ...Platform.select({
        web: { backgroundColor: "rgba(169,119,46,0.32)" },
        default: {},
      }),
    },
    accentHot: {
      backgroundColor: chrome.danger || "#b91c1c",
    },
    accentWarn: {
      backgroundColor: chrome.goldBright || chrome.gold,
    },
    label: {
      fontSize: 10.5,
      color: chrome.inkFaint,
      letterSpacing: 0.7,
      textTransform: "uppercase",
      fontFamily: fonts.semibold,
    },
    value: {
      fontFamily: FONT_PRICE,
      fontSize: Platform.select({ web: 28, default: 27 }),
      fontWeight: "600",
      color: chrome.ink,
      marginTop: 8,
      letterSpacing: -0.6,
    },
    valueHot: {
      color: chrome.goldDeep,
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
      fontFamily: fonts.semibold,
    },
    up: { color: chrome.green },
    down: { color: chrome.danger },
    hint: {
      marginTop: 8,
      fontSize: 10,
      letterSpacing: 0.4,
      textTransform: "uppercase",
      color: chrome.inkFaint,
      fontFamily: fonts.medium,
    },
  });
}
