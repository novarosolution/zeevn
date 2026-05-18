import React, { memo, useMemo } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useWindowDimensions } from "react-native";
import { fonts } from "../../theme/tokens";
import { useTheme } from "../../context/ThemeContext";
import { headingA11yProps } from "../../utils/a11y";

/**
 * Section chrome: brass square + tracked overline, serif h2, optional trailing action.
 */
function SectionHeaderBase({
  overline,
  title,
  subtitle,
  actionLabel = "View all",
  onActionPress,
  showActionChevron = true,
  align = "left",
  headingLevel = 2,
  cardTitleLevel,
  density = "default",
}) {
  const { semanticPalette, TYPE, SPACING } = useTheme();
  const { width } = useWindowDimensions();
  const overlineText = String(overline || "").trim();
  const isCenter = align === "center";

  const isCatalogDensity = density === "catalog";
  const styles = useMemo(
    () =>
      StyleSheet.create({
        root: {
          width: "100%",
          marginBottom: isCatalogDensity ? (width >= 600 ? 20 : 16) : SPACING.lg,
        },
        overlineRow: {
          flexDirection: "row",
          alignItems: "center",
          gap: SPACING.sm,
          marginBottom: isCatalogDensity ? SPACING.xs : SPACING.sm,
          justifyContent: isCenter ? "center" : "flex-start",
        },
        square: {
          width: 6,
          height: 6,
          borderRadius: 1,
          backgroundColor: semanticPalette.accent,
        },
        overlineText: {
          fontFamily: fonts.semibold,
          fontSize: isCatalogDensity ? 10 : TYPE.micro.fontSize,
          lineHeight: isCatalogDensity ? 12 : TYPE.micro.lineHeight,
          letterSpacing: isCatalogDensity ? 1.1 : 1.6,
          textTransform: "uppercase",
          color: semanticPalette.accent,
          minWidth: 0,
          flexShrink: 1,
        },
        row: {
          flexDirection: "row",
          alignItems: "flex-end",
          justifyContent: "space-between",
          gap: SPACING.md,
        },
        titleCol: {
          flex: 1,
          minWidth: 0,
          alignItems: isCenter ? "center" : "flex-start",
          gap: SPACING.xs,
        },
        title: {
          width: "100%",
          textAlign: isCenter ? "center" : "left",
          fontFamily: TYPE.serifFamily,
          ...(isCatalogDensity
            ? { fontSize: 20, lineHeight: 24, letterSpacing: -0.2 }
            : TYPE.h2),
          color: semanticPalette.ink,
        },
        subtitle: {
          width: "100%",
          textAlign: isCenter ? "center" : "left",
          fontFamily: fonts.regular,
          ...(isCatalogDensity ? TYPE.caption : TYPE.body),
          color: semanticPalette.inkSoft,
        },
        actionInner: {
          flexDirection: "row",
          alignItems: "center",
          gap: 4,
          flexShrink: 0,
        },
        actionText: {
          fontFamily: fonts.semibold,
          fontSize: isCatalogDensity ? 12 : TYPE.caption.fontSize,
          lineHeight: isCatalogDensity ? 16 : TYPE.caption.lineHeight,
          letterSpacing: isCatalogDensity ? 0.2 : 0.6,
          color: isCatalogDensity ? semanticPalette.accent : semanticPalette.inkSoft,
        },
      }),
    [
      TYPE,
      SPACING,
      width,
      isCatalogDensity,
      isCenter,
      semanticPalette.accent,
      semanticPalette.ink,
      semanticPalette.inkSoft,
    ]
  );

  return (
    <View style={styles.root}>
      {overlineText ? (
        <View style={styles.overlineRow}>
          <View style={styles.square} />
          <Text style={styles.overlineText} numberOfLines={1}>
            {overlineText}
          </Text>
        </View>
      ) : null}
      <View style={styles.row}>
        <View style={styles.titleCol}>
          <Text style={styles.title} numberOfLines={2} {...headingA11yProps(cardTitleLevel ?? headingLevel)}>
            {title}
          </Text>
          {subtitle ? (
            <Text style={styles.subtitle} numberOfLines={2}>
              {subtitle}
            </Text>
          ) : null}
        </View>
        {onActionPress ? (
          <Pressable
            onPress={onActionPress}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel={`${actionLabel} ${title || ""}`.trim()}
            style={({ pressed }) => [pressed ? { opacity: 0.82 } : null]}
          >
            <View style={styles.actionInner}>
              <Text style={styles.actionText}>
                {actionLabel}
                {showActionChevron ? " →" : ""}
              </Text>
            </View>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

const SectionHeader = memo(SectionHeaderBase);

export default SectionHeader;
