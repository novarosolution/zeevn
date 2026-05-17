import React, { memo, useMemo } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
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
}) {
  const { semanticPalette, TYPE, SPACING } = useTheme();
  const overlineText = String(overline || "").trim();
  const isCenter = align === "center";

  const styles = useMemo(
    () =>
      StyleSheet.create({
        root: {
          width: "100%",
          marginBottom: SPACING.lg,
        },
        overlineRow: {
          flexDirection: "row",
          alignItems: "center",
          gap: SPACING.sm,
          marginBottom: SPACING.sm,
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
          fontSize: TYPE.micro.fontSize,
          lineHeight: TYPE.micro.lineHeight,
          letterSpacing: 1.6,
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
          ...TYPE.h2,
          color: semanticPalette.ink,
        },
        subtitle: {
          width: "100%",
          textAlign: isCenter ? "center" : "left",
          fontFamily: fonts.regular,
          ...TYPE.body,
          color: semanticPalette.inkMuted,
        },
        actionInner: {
          flexDirection: "row",
          alignItems: "center",
          gap: 4,
          flexShrink: 0,
        },
        actionText: {
          fontFamily: fonts.semibold,
          fontSize: TYPE.caption.fontSize,
          lineHeight: TYPE.caption.lineHeight,
          letterSpacing: 0.6,
          color: semanticPalette.inkSoft,
        },
      }),
    [TYPE, SPACING, isCenter, semanticPalette.accent, semanticPalette.ink, semanticPalette.inkMuted, semanticPalette.inkSoft]
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
