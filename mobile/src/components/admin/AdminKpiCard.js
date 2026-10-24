import React, { useMemo } from "react";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { useTheme } from "../../context/ThemeContext";
import { getAdminChrome } from "../../theme/adminLayout";
import { FONT_PRICE } from "../../theme/typographyRoles";
import { fonts } from "../../theme/tokens";

/** Ops metric tile. Use tone warn or hot when the number needs attention. */
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
        style: ({ pressed }) => [
          styles.card,
          styles.cardInteractive,
          hot && styles.cardHot,
          tone === "warn" && styles.cardWarn,
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
      <Text style={styles.label} numberOfLines={1}>
        {label}
      </Text>
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
    gridTemplateColumns: "repeat(auto-fill, minmax(168px, 1fr))",
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
      backgroundColor: chrome.paper,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: chrome.line,
      borderRadius: Platform.select({ web: 14, default: 14 }),
      paddingTop: Platform.select({ web: 14, default: 18 }),
      paddingBottom: Platform.select({ web: 14, default: 18 }),
      paddingHorizontal: Platform.select({ web: 14, default: 18 }),
      overflow: "hidden",
      position: "relative",
      ...Platform.select({
        web: {
          transition: "transform 100ms ease-out, background-color 100ms ease-out",
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
        web: "rgba(184, 68, 47, 0.06)",
        default: chrome.card,
      }),
    },
    cardWarn: {
      borderColor: Platform.select({
        web: "rgba(184, 136, 76, 0.28)",
        default: chrome.gold,
      }),
      backgroundColor: Platform.select({
        web: "rgba(212, 165, 116, 0.12)",
        default: chrome.card,
      }),
    },
    cardPressed: {
      transform: [{ scale: 0.97 }],
      ...Platform.select({ web: { cursor: "pointer" }, default: {} }),
    },
    label: {
      fontSize: 11,
      color: chrome.inkFaint,
      letterSpacing: 0.2,
      fontFamily: fonts.medium,
    },
    value: {
      fontFamily: FONT_PRICE,
      fontSize: Platform.select({ web: 26, default: 26 }),
      fontWeight: "600",
      color: chrome.ink,
      marginTop: 6,
      letterSpacing: -0.55,
    },
    valueHot: {
      color: chrome.danger,
    },
    valueWarn: {
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
  });
}
