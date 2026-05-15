import React, { memo, useMemo } from "react";
import { Platform, Pressable, StyleSheet, Text, useWindowDimensions, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import {
  lineHeight,
  spacing,
  typography,
} from "../../theme/tokens";
import { useTheme } from "../../context/ThemeContext";
import { homeType } from "../../styles/typography";
import { spacing as homeSpacing } from "../../styles/spacing";

/**
 * Generic premium section header used across customer screens. Same look as
 * `HomeSectionHeader` (kept for back-compat). Use this in new code.
 */
function PremiumSectionHeaderBase({
  overline,
  title,
  subtitle,
  onSeeAll,
  seeAllLabel = "See all",
  align = "left",
  compact = false,
}) {
  const { colors: c, isDark } = useTheme();
  const { width } = useWindowDimensions();
  const titleSize = width >= 1024 ? 44 : width >= 640 ? 36 : 28;
  const titleLine = width >= 1024 ? 50 : width >= 640 ? 42 : 33;
  const styles = useMemo(
    () => createStyles(c, isDark, align, compact, titleSize, titleLine),
    [c, isDark, align, compact, titleSize, titleLine]
  );
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
            hitSlop={{ top: homeSpacing.sm, bottom: homeSpacing.sm, left: homeSpacing.sm, right: homeSpacing.sm }}
            accessibilityRole="button"
            accessibilityLabel={`${seeAllLabel} ${title || ""}`.trim()}
            style={({ pressed }) => [styles.seeAllBtn, pressed ? styles.seeAllBtnPressed : null]}
          >
            {({ pressed }) => (
              <View style={styles.seeAllBtnInner}>
                <Text style={[styles.seeAllText, pressed ? styles.seeAllTextActive : null]} numberOfLines={1}>
                  {seeAllLabel}
                </Text>
                <Ionicons name="chevron-forward" size={14} color={c.textPrimary} />
              </View>
            )}
          </Pressable>
        ) : null}
      </View>

    </View>
  );
}

function createStyles(c, isDark, align, compact, titleSize, titleLine) {
  const metaTextSize = 12;
  const metaLineHeight = 16;
  const subtitleSize = typography.bodySmall;
  const subtitleLineHeight = lineHeight.bodySmall;

  return StyleSheet.create({
    wrap: {
      width: "100%",
      marginBottom: Platform.OS === "web" ? 24 : 20,
    },
    row: {
      flexDirection: "row",
      alignItems: "center",
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
      gap: 8,
      alignItems: align === "center" ? "center" : "flex-start",
    },
    overlineRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: homeSpacing.xs,
      marginBottom: 0,
    },
    overlineDot: {
      width: 4,
      height: 4,
      borderRadius: 2,
      backgroundColor: c.rating,
      ...Platform.select({
        web: {
          boxShadow: isDark
            ? "0 0 12px rgba(253,186,116,0.34)"
            : "0 0 10px rgba(180, 83, 9, 0.18)",
        },
        default: {},
      }),
    },
    overline: {
      fontFamily: homeType.overline.fontFamily,
      fontSize: homeType.overline.fontSize,
      lineHeight: lineHeight.overline,
      letterSpacing: 1.4,
      color: c.textMuted,
      textTransform: "uppercase",
    },
    titleRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.sm,
      flexWrap: "wrap",
    },
    title: {
      fontFamily: compact ? homeType.uiSemibold.fontFamily : homeType.display.fontFamily,
      fontSize: titleSize,
      lineHeight: titleLine,
      letterSpacing: -(titleSize * 0.02),
      color: c.textPrimary,
      fontWeight: compact ? "600" : "500",
    },
    subtitle: {
      fontFamily: homeType.uiRegular.fontFamily,
      fontSize: subtitleSize,
      lineHeight: subtitleLineHeight,
      color: c.textMuted,
      marginTop: homeSpacing.xs,
      maxWidth: Platform.select({ web: 760, default: "100%" }),
    },
    seeAllBtn: {
      paddingHorizontal: 0,
      paddingVertical: 0,
      borderRadius: 0,
      borderWidth: 0,
      borderColor: "transparent",
      backgroundColor: "transparent",
      ...Platform.select({
        web: {
          transition: "opacity 0.18s ease",
          cursor: "pointer",
          marginLeft: "auto",
        },
        default: {},
      }),
    },
    seeAllBtnInner: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      marginLeft: "auto",
    },
    seeAllBtnPressed: {
      opacity: 0.8,
    },
    seeAllText: {
      fontFamily: homeType.uiSemibold.fontFamily,
      fontSize: metaTextSize,
      lineHeight: metaLineHeight,
      letterSpacing: 0.9,
      textTransform: "uppercase",
      color: c.textPrimary,
    },
    seeAllTextActive: {
      textDecorationLine: "underline",
    },
  });
}

const PremiumSectionHeader = memo(PremiumSectionHeaderBase);

export default PremiumSectionHeader;
