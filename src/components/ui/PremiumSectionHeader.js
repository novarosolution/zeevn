import React, { memo, useMemo } from "react";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import {
  fonts,
  icon,
  lineHeight,
  radius,
  spacing,
  typography,
} from "../../theme/tokens";
import { FONT_DISPLAY, HERITAGE, heritageHairlineGradient } from "../../theme/customerAlchemy";
import { useTheme } from "../../context/ThemeContext";

/**
 * Generic premium section header used across customer screens. Same look as
 * `HomeSectionHeader` (kept for back-compat). Use this in new code.
 */
function PremiumSectionHeaderBase({
  overline,
  title,
  subtitle,
  count,
  onSeeAll,
  seeAllLabel = "See all",
  align = "left",
  compact = false,
}) {
  const { colors: c, isDark } = useTheme();
  const styles = useMemo(() => createStyles(c, isDark, align, compact), [c, isDark, align, compact]);
  const showCount = count != null && count > 0;
  const overlineText = String(overline || "").trim();

  return (
    <View style={styles.wrap}>
      <View style={styles.row}>
        <View style={styles.left}>
          {overlineText ? (
            <View style={styles.overlineRow}>
              <View style={styles.overlineDot} />
              <Text style={styles.overline} numberOfLines={1}>
                {overlineText.toUpperCase()}
              </Text>
            </View>
          ) : null}
          <View style={styles.titleRow}>
            <Text style={styles.title} numberOfLines={2}>
              {title}
            </Text>
            {showCount ? (
              <View style={styles.countChip}>
                <Text style={styles.countText} numberOfLines={1}>
                  {count}
                </Text>
              </View>
            ) : null}
          </View>
          {subtitle ? (
            <Text style={styles.subtitle} numberOfLines={2}>
              {subtitle}
            </Text>
          ) : null}
        </View>

        {onSeeAll ? (
          <Pressable
            onPress={onSeeAll}
            hitSlop={{ top: 8, bottom: 8, left: 6, right: 6 }}
            accessibilityRole="button"
            accessibilityLabel={`${seeAllLabel} ${title || ""}`.trim()}
            style={({ pressed, hovered }) => [
              styles.seeAllBtn,
              hovered && Platform.OS === "web" ? styles.seeAllBtnHover : null,
              pressed ? styles.seeAllBtnPressed : null,
            ]}
          >
            <Text style={styles.seeAllText} numberOfLines={1}>
              {seeAllLabel}
            </Text>
            <Ionicons
              name="chevron-forward"
              size={icon.sm}
              color={isDark ? c.primaryBright : c.primaryDark}
            />
          </Pressable>
        ) : null}
      </View>

      <View style={[styles.hairlineWrap, styles.peNone]}>
        <LinearGradient
          colors={heritageHairlineGradient(isDark)}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={styles.hairline}
        />
        <View style={[styles.hairlineDot, { backgroundColor: isDark ? HERITAGE.amberBright : HERITAGE.amberMid }]} />
      </View>
    </View>
  );
}

function createStyles(c, isDark, align, compact) {
  const titleSize = compact ? 20 : 25;
  const titleSizeWeb = compact ? 22 : 27;

  return StyleSheet.create({
    wrap: {
      width: "100%",
      marginBottom: compact ? spacing.sm + 2 : spacing.md,
    },
    row: {
      flexDirection: "row",
      alignItems: "flex-end",
      justifyContent: "space-between",
      gap: spacing.md,
      ...Platform.select({
        web: {
          flexWrap: "wrap",
        },
        default: {},
      }),
    },
    left: {
      flex: 1,
      minWidth: 0,
      gap: 5,
      alignItems: align === "center" ? "center" : "flex-start",
    },
    overlineRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      marginBottom: 2,
    },
    overlineDot: {
      width: 6,
      height: 6,
      borderRadius: 3,
      backgroundColor: isDark ? HERITAGE.amberBright : HERITAGE.amberMid,
      ...Platform.select({
        web: {
          boxShadow: isDark
            ? "0 0 12px rgba(251, 146, 60, 0.4)"
            : "0 0 10px rgba(217, 119, 6, 0.25)",
        },
        default: {},
      }),
    },
    overline: {
      fontFamily: fonts.extrabold,
      fontSize: typography.overline,
      lineHeight: lineHeight.overline,
      letterSpacing: 1.8,
      color: isDark ? HERITAGE.amberBright : HERITAGE.amber,
    },
    titleRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.sm,
      flexWrap: "wrap",
    },
    title: {
      fontFamily: FONT_DISPLAY,
      fontSize: titleSize,
      lineHeight: titleSize + 5,
      letterSpacing: -0.55,
      color: c.textPrimary,
      ...Platform.select({
        web: { fontSize: titleSizeWeb, lineHeight: titleSizeWeb + 4 },
        default: {},
      }),
    },
    countChip: {
      paddingHorizontal: 10,
      paddingVertical: 3,
      borderRadius: radius.pill,
      backgroundColor: isDark
        ? "rgba(248, 113, 113, 0.16)"
        : c.primarySoft,
    },
    countText: {
      fontFamily: fonts.extrabold,
      fontSize: 12,
      letterSpacing: 0.4,
      color: isDark ? c.primaryBright : c.primaryDark,
    },
    subtitle: {
      fontFamily: fonts.medium,
      fontSize: 12,
      lineHeight: 17,
      color: c.textMuted,
      marginTop: 2,
    },
    seeAllBtn: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      paddingHorizontal: spacing.md - 2,
      paddingVertical: 8,
      borderRadius: radius.pill,
      borderWidth: 1,
      borderColor: isDark
        ? "rgba(248, 113, 113, 0.32)"
        : "rgba(220, 38, 38, 0.18)",
      backgroundColor: isDark
        ? "rgba(239, 68, 68, 0.1)"
        : "rgba(255,255,255,0.82)",
      ...Platform.select({
        web: {
          transition: "transform 0.18s ease, box-shadow 0.18s ease, background-color 0.18s ease",
          cursor: "pointer",
          marginLeft: "auto",
        },
        default: {},
      }),
    },
    seeAllBtnHover: {
      ...Platform.select({
        web: {
          transform: [{ translateY: -1 }],
          boxShadow: isDark
            ? "0 10px 22px rgba(0,0,0,0.4), inset 0 1px 0 rgba(220, 38, 38, 0.18)"
            : "0 10px 22px rgba(63, 63, 70, 0.14), inset 0 1px 0 rgba(255,255,255,0.95)",
        },
        default: {},
      }),
    },
    seeAllBtnPressed: {
      opacity: 0.86,
    },
    seeAllText: {
      fontFamily: fonts.extrabold,
      fontSize: 12,
      letterSpacing: 0.4,
      color: isDark ? c.primaryBright : c.primaryDark,
    },
    hairlineWrap: {
      marginTop: 8,
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
    },
    hairline: {
      flex: 1,
      height: 1.25,
      borderRadius: 1,
    },
    hairlineDot: {
      width: 5,
      height: 5,
      borderRadius: 2.5,
      opacity: 0.85,
    },
    peNone: {
      pointerEvents: "none",
    },
  });
}

const PremiumSectionHeader = memo(PremiumSectionHeaderBase);

export default PremiumSectionHeader;
