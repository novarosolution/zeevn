import React, { useMemo } from "react";
import { Platform, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import BrandHeaderMark from "./BrandHeaderMark";
import LocationIconButton from "./LocationIconButton";
import { useTheme } from "../context/ThemeContext";
import { BRAND_LOGO_SIZE } from "../constants/brand";
import { fonts, getSemanticColors, icon, lineHeight, semanticRadius, spacing, typography } from "../theme/tokens";
import { customerContentWidth } from "../theme/screenLayout";
import { ALCHEMY } from "../theme/customerAlchemy";
import { FONT_HEADING, FONT_BODY, FONT_BODY_SEMIBOLD } from "../theme/typographyRoles";

const HEADER_LOGO = BRAND_LOGO_SIZE.headerCompact;
/** Row height follows logo only — extra space was making the bar feel tall. */
const ROW_MIN_H = HEADER_LOGO;

/**
 * App header: optional back, optional brand mark, title, compact location icon, optional right slot.
 * Card-style bar aligned with page content width (`customerContentWidth`).
 */
export default function ScreenPageHeader({
  eyebrow,
  title,
  subtitle,
  navigation,
  showBack,
  onBack,
  right,
  showBrand = true,
  showLocation = true,
  compact = false,
  titleColor,
  subtitleColor,
}) {
  const { colors: c, shadowPremium, isDark } = useTheme();
  const semantic = getSemanticColors(c);
  const styles = useMemo(() => createStyles(ROW_MIN_H, isDark, compact), [isDark, compact]);

  const canGoBack = typeof navigation?.canGoBack === "function" && navigation.canGoBack();
  const backVisible = showBack !== undefined ? showBack : canGoBack;

  const handleBack = () => {
    if (onBack) {
      onBack();
      return;
    }
    if (canGoBack) {
      navigation.goBack();
    }
  };

  return (
    <View style={[styles.headerOuter, customerContentWidth]}>
      <View
        style={[
          styles.headerCard,
          {
            backgroundColor: isDark ? c.surfaceOverlay || c.surface : ALCHEMY.cardBg,
            borderColor: isDark ? semantic.border.divider || semantic.border.subtle : ALCHEMY.pillInactive,
          },
          shadowPremium,
          Platform.OS === "web" && shadowPremium?.boxShadow
            ? {
                boxShadow: `${shadowPremium.boxShadow}, ${
                  isDark
                    ? "inset 0 1px 0 rgba(255,255,255,0.06)"
                    : "inset 0 1px 0 rgba(255,253,251,0.95), inset 0 0 0 1px rgba(255,253,249,0.45)"
                }`,
              }
            : null,
        ]}
      >
        <LinearGradient
          colors={[ALCHEMY.goldBright, ALCHEMY.gold, ALCHEMY.goldDeep, ALCHEMY.brown]}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={[styles.headerGoldAccent, styles.peNone]}
        />
        <LinearGradient
          colors={
            isDark
              ? ["rgba(255,255,255,0.045)", "transparent"]
              : ["rgba(255,255,255,0.82)", "rgba(255,255,255,0.18)"]
          }
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[StyleSheet.absoluteFillObject, styles.peNone]}
        />
        <View style={[styles.row, styles.rowBelowAccent]}>
          {backVisible ? (
            <TouchableOpacity
              onPress={handleBack}
              style={styles.backBtn}
              hitSlop={12}
              accessibilityRole="button"
              accessibilityLabel="Go back"
            >
              <Ionicons name="chevron-back" size={icon.lg} color={isDark ? c.primaryBright : ALCHEMY.brown} />
            </TouchableOpacity>
          ) : null}
          {showBrand ? <BrandHeaderMark navigation={navigation} compact /> : null}
          {!backVisible && !showBrand ? <View style={[styles.leadSpacer, styles.leadSpacerCompact]} /> : null}
          <View style={styles.titleCol}>
            {eyebrow ? (
              <Text
                style={[
                  styles.eyebrow,
                  { color: isDark ? c.primaryBright : ALCHEMY.gold },
                ]}
                numberOfLines={1}
              >
                {eyebrow}
              </Text>
            ) : null}
            <Text
              style={[
                styles.title,
                eyebrow && compact ? styles.titleAfterEyebrow : null,
                { color: titleColor || c.textPrimary, fontFamily: FONT_HEADING },
              ]}
              numberOfLines={2}
            >
              {title}
            </Text>
            {subtitle ? (
              compact ? (
                <Text
                  style={[
                    styles.sub,
                    styles.subCompact,
                    { color: subtitleColor || c.textSecondary, fontFamily: FONT_BODY },
                  ]}
                  numberOfLines={2}
                >
                  {subtitle}
                </Text>
              ) : (
                <View
                  style={[
                    styles.subtitlePill,
                    titleColor
                      ? {
                          borderColor: "rgba(42, 117, 89, 0.35)",
                          backgroundColor: "rgba(255, 255, 255, 0.08)",
                        }
                      : {
                          borderColor: isDark ? "rgba(52, 211, 153, 0.28)" : "rgba(22, 69, 51, 0.14)",
                          backgroundColor: isDark ? "rgba(31, 92, 71, 0.09)" : "rgba(255, 252, 248, 0.9)",
                        },
                  ]}
                >
                  <Text
                    style={[
                      styles.sub,
                      { color: subtitleColor || c.textSecondary, fontFamily: FONT_BODY },
                    ]}
                    numberOfLines={2}
                  >
                    {subtitle}
                  </Text>
                </View>
              )
            ) : null}
          </View>
          <View style={styles.rightCluster}>
            {showLocation ? <LocationIconButton navigation={navigation} size={icon.webNav} /> : null}
            {right ? <View style={styles.rightSlot}>{right}</View> : null}
          </View>
        </View>
      </View>
    </View>
  );
}

function createStyles(rowMinH, isDark, compact) {
  return StyleSheet.create({
    headerOuter: {
      /** Spacing to the next block comes from parent scroll `gap` (`customerInnerPageScrollContent`). */
      marginBottom: compact ? spacing.xs : 0,
      ...Platform.select({ web: { maxWidth: "100%" }, default: {} }),
    },
    headerCard: {
      width: "100%",
      borderRadius: compact ? semanticRadius.lg : semanticRadius.panel,
      borderWidth: StyleSheet.hairlineWidth,
      paddingHorizontal: compact ? spacing.md : spacing.lg - 2,
      paddingBottom: compact ? 10 : 14,
      overflow: Platform.OS === "web" ? "visible" : "hidden",
      position: "relative",
      ...Platform.select({
        web: {
          boxSizing: "border-box",
          cursor: "default",
          boxShadow: isDark
            ? "0 18px 40px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.04)"
            : "0 14px 34px rgba(22, 69, 51, 0.08), inset 0 1px 0 rgba(255,255,255,0.9)",
        },
        default: {},
      }),
    },
    headerGoldAccent: {
      width: "100%",
      height: 3,
      opacity: 0.98,
    },
    rowBelowAccent: {
      paddingTop: compact ? 10 : 14,
    },
    row: {
      flexDirection: "row",
      alignItems: "center",
      gap: compact ? 6 : 8,
      minHeight: compact ? Math.max(rowMinH - 4, 36) : rowMinH,
      flexWrap: "wrap",
      rowGap: 8,
    },
    backBtn: {
      marginLeft: -2,
      width: 38,
      height: 38,
      borderRadius: semanticRadius.full,
      alignItems: "center",
      justifyContent: "center",
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: isDark ? "rgba(255,255,255,0.1)" : "rgba(22, 69, 51, 0.14)",
      backgroundColor: isDark ? "rgba(255,255,255,0.07)" : "rgba(255,255,255,0.68)",
      ...Platform.select({
        web: { cursor: "pointer", transition: "background 0.2s ease, border-color 0.2s ease, transform 0.2s ease" },
        default: {},
      }),
    },
    leadSpacer: {
      flexShrink: 0,
      height: 1,
    },
    leadSpacerCompact: {
      width: 8,
    },
    titleCol: {
      flex: 1,
      minWidth: 0,
      justifyContent: "center",
    },
    eyebrow: {
      fontSize: typography.overline,
      letterSpacing: 2.4,
      textTransform: "uppercase",
      fontFamily: fonts.semibold,
      marginBottom: 2,
    },
    titleAfterEyebrow: {
      marginTop: 0,
    },
    title: {
      fontSize: compact ? typography.h3 : typography.h3 + 1,
      letterSpacing: -0.48,
      lineHeight: compact ? lineHeight.h3 - 2 : lineHeight.h3,
      ...Platform.select({
        web: compact ? {} : { fontSize: typography.h2 },
        default: {},
      }),
    },
    subCompact: {
      marginTop: 4,
    },
    sub: {
      marginTop: 0,
      fontSize: typography.bodySmall,
      lineHeight: lineHeight.bodySmall,
      letterSpacing: 0.04,
      opacity: 0.92,
    },
    subtitlePill: {
      marginTop: 8,
      alignSelf: "flex-start",
      borderRadius: semanticRadius.control,
      borderWidth: StyleSheet.hairlineWidth,
      paddingHorizontal: spacing.sm + 1,
      paddingVertical: 7,
      maxWidth: "100%",
    },
    rightCluster: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.xs,
      flexShrink: 0,
      ...Platform.select({
        web: {
          marginLeft: "auto",
        },
        default: {},
      }),
    },
    rightSlot: {
      alignItems: "flex-end",
      justifyContent: "center",
      maxWidth: "100%",
    },
    peNone: {
      pointerEvents: "none",
    },
  });
}
