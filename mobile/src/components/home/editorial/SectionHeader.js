import React, { memo, useMemo } from "react";
import { Platform, StyleSheet, Text, View } from "react-native";
import GoldHairline from "../../ui/GoldHairline";
import Eyebrow from "./Eyebrow";
import {
  GOLD_HAIRLINE_EDITORIAL,
  HOME_HEADER_CONTENT_GAP,
  HOME_SPACE,
  HOME_TYPE,
  homeEditorialInk,
  homeEditorialMuted,
  homeSectionTitleSize,
} from "../../../theme/homeEditorial";
import { FONT_HEADING } from "../../../theme/typographyRoles";
import { useKankregLayout } from "../../../theme/kankregBreakpoints";
import { fonts } from "../../../theme/tokens";
import { useTheme } from "../../../context/ThemeContext";

/**
 * Editorial section header for web home — eyebrow signpost, display title, optional kicker.
 * No fake section numbering; real labels only (e.g. "Shop by category").
 */
function SectionHeaderBase({
  eyebrow,
  title,
  kicker,
  align = "left",
  hairline = false,
  compact = false,
  flush = false,
  style,
  right,
}) {
  const { isDark } = useTheme();
  const { width } = useKankregLayout();
  const titleSize = homeSectionTitleSize(width, compact);
  const ink = homeEditorialInk(isDark);
  const muted = homeEditorialMuted(isDark);
  const centered = align === "center";

  const styles = useMemo(
    () =>
      StyleSheet.create({
        wrap: {
          marginBottom: flush ? 0 : HOME_HEADER_CONTENT_GAP,
          gap: HOME_SPACE.xs,
        },
        row: {
          flexDirection: "row",
          alignItems: "flex-end",
          justifyContent: centered ? "center" : "space-between",
          gap: HOME_SPACE.md,
        },
        copy: {
          flex: centered ? undefined : 1,
          minWidth: 0,
          alignItems: centered ? "center" : "flex-start",
          gap: HOME_SPACE.xs,
        },
        title: {
          fontFamily: FONT_HEADING,
          fontSize: titleSize,
          lineHeight: Math.round(titleSize * HOME_TYPE.sectionTitle.lineHeightRatio),
          letterSpacing: -0.4,
          color: ink,
          ...(centered ? { textAlign: "center" } : null),
        },
        kicker: {
          fontFamily: fonts.regular,
          fontSize: HOME_TYPE.kicker,
          lineHeight: HOME_TYPE.body.lineHeight,
          color: muted,
          maxWidth: centered ? 520 : 560,
          ...(centered ? { textAlign: "center" } : null),
        },
        rightSlot: {
          flexShrink: 0,
          paddingBottom: 2,
        },
        hairlineCenter: {
          maxWidth: 240,
          alignSelf: "center",
        },
      }),
    [centered, flush, ink, muted, titleSize]
  );

  const eyebrowText = String(eyebrow ?? "").trim();
  const titleText = String(title ?? "").trim();
  const kickerText = String(kicker ?? "").trim();

  if (!eyebrowText && !titleText) return null;

  return (
    <View style={[styles.wrap, style]}>
      <View style={styles.row}>
        <View style={styles.copy}>
          {eyebrowText ? <Eyebrow align={align}>{eyebrowText}</Eyebrow> : null}
          {hairline && eyebrowText ? (
            <GoldHairline
              {...GOLD_HAIRLINE_EDITORIAL.subtle}
              style={centered ? styles.hairlineCenter : null}
            />
          ) : null}
          {titleText ? (
            <Text
              style={styles.title}
              numberOfLines={3}
              accessibilityRole={Platform.OS === "web" ? "header" : undefined}
              {...(Platform.OS === "web" ? { accessibilityLevel: 2 } : null)}
            >
              {titleText}
            </Text>
          ) : null}
          {kickerText ? (
            <Text style={styles.kicker} numberOfLines={2}>
              {kickerText}
            </Text>
          ) : null}
        </View>
        {right ? <View style={styles.rightSlot}>{right}</View> : null}
      </View>
    </View>
  );
}

SectionHeaderBase.displayName = "SectionHeader";

const SectionHeader = memo(SectionHeaderBase);

export default SectionHeader;
