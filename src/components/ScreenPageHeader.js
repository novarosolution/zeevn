import React, { useMemo } from "react";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import BrandHeaderMark from "./BrandHeaderMark";
import LocationIconButton from "./LocationIconButton";
import { useTheme } from "../context/ThemeContext";
import { BRAND_LOGO_SIZE } from "../constants/brand";
import { getSemanticColors, icon, lineHeight, semanticRadius, spacing, typography } from "../theme/tokens";
import { customerContentWidth } from "../theme/screenLayout";
import { ALCHEMY, FONT_DISPLAY, FONT_DISPLAY_SEMI, heritageBrandTrimGradient } from "../theme/customerAlchemy";

const HEADER_LOGO = BRAND_LOGO_SIZE.headerCompact;
/** Row height follows logo only — extra space was making the bar feel tall. */
const ROW_MIN_H = HEADER_LOGO;

/**
 * App header: optional back, optional brand mark, title, compact location icon, optional right slot.
 * Card-style bar aligned with page content width (`customerContentWidth`).
 */
export default function ScreenPageHeader({
  title,
  subtitle,
  navigation,
  showBack,
  onBack,
  right,
  showBrand = true,
  showLocation = true,
}) {
  const { colors: c, shadowPremium, isDark } = useTheme();
  const semantic = getSemanticColors(c);
  const styles = useMemo(() => createStyles(ROW_MIN_H, isDark), [isDark]);
  const isWeb = Platform.OS === "web";

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
            backgroundColor: isWeb ? (isDark ? c.surfaceOverlay || c.surface : ALCHEMY.cardBg) : "transparent",
            borderColor: isWeb ? (isDark ? semantic.border.divider || semantic.border.subtle : c.border) : "transparent",
          },
          isWeb ? shadowPremium : null,
          isWeb && shadowPremium?.boxShadow
            ? {
                boxShadow: `${shadowPremium.boxShadow}, ${
                  isDark
                    ? "inset 0 1px 0 rgba(255,255,255,0.05)"
                    : "inset 0 1px 0 rgba(255,255,255,0.95)"
                }`,
              }
            : null,
        ]}
      >
        {isWeb ? (
          <>
            <LinearGradient
              colors={heritageBrandTrimGradient()}
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
          </>
        ) : null}
        <View style={[styles.row, styles.rowBelowAccent]}>
          {backVisible ? (
            <Pressable
              onPress={handleBack}
              style={({ pressed, hovered }) => [
                styles.backBtn,
                hovered && Platform.OS === "web" ? styles.backBtnHover : null,
                pressed ? styles.backBtnPressed : null,
              ]}
              hitSlop={12}
              accessibilityRole="button"
              accessibilityLabel="Go back"
            >
              <Ionicons name="chevron-back" size={icon.lg} color={isDark ? c.primaryBright : ALCHEMY.brown} />
            </Pressable>
          ) : null}
          {showBrand && isWeb ? <BrandHeaderMark navigation={navigation} compact /> : null}
          {!backVisible && !(showBrand && isWeb) ? <View style={[styles.leadSpacer, styles.leadSpacerCompact]} /> : null}
          <View style={styles.titleCol}>
            <Text style={[styles.title, { color: c.textPrimary, fontFamily: FONT_DISPLAY }]} numberOfLines={2}>
              {title}
            </Text>
            {subtitle ? isWeb ? (
              <View
                style={[
                  styles.subtitlePill,
                  {
                    borderColor: isDark ? "rgba(248, 113, 113, 0.22)" : c.border,
                    backgroundColor: isDark ? "rgba(239, 68, 68, 0.08)" : c.surfaceMuted,
                  },
                ]}
              >
                <Text style={[styles.sub, { color: c.textSecondary, fontFamily: FONT_DISPLAY_SEMI }]} numberOfLines={2}>
                  {subtitle}
                </Text>
              </View>
            ) : (
              <Text style={[styles.sub, styles.subPlain, { color: c.textSecondary, fontFamily: FONT_DISPLAY_SEMI }]} numberOfLines={2}>
                {subtitle}
              </Text>
            ) : null}
          </View>
          <View style={styles.rightCluster}>
            {showLocation && isWeb ? <LocationIconButton navigation={navigation} size={icon.webNav} /> : null}
            {right ? <View style={styles.rightSlot}>{right}</View> : null}
          </View>
        </View>
      </View>
    </View>
  );
}

function createStyles(rowMinH, isDark) {
  return StyleSheet.create({
    headerOuter: {
      /** Spacing to the next block comes from parent scroll `gap` (`customerInnerPageScrollContent`). */
      marginBottom: 0,
      ...Platform.select({ web: { maxWidth: "100%" }, default: {} }),
    },
    headerCard: {
      width: "100%",
      borderRadius: semanticRadius.panel,
      borderWidth: StyleSheet.hairlineWidth,
      paddingHorizontal: spacing.lg,
      paddingBottom: 12,
      overflow: Platform.OS === "web" ? "visible" : "hidden",
      position: "relative",
      ...Platform.select({
        web: {
          boxSizing: "border-box",
          cursor: "default",
          boxShadow: isDark
            ? "0 12px 24px rgba(0,0,0,0.22), inset 0 1px 0 rgba(255,255,255,0.04)"
            : "0 8px 18px rgba(15, 23, 42, 0.06), inset 0 1px 0 rgba(255,255,255,0.94)",
        },
        default: {
          borderRadius: 0,
          borderWidth: 0,
          backgroundColor: "transparent",
          paddingHorizontal: 0,
          paddingBottom: spacing.xs,
        },
      }),
    },
    headerGoldAccent: {
      width: "100%",
      height: 3,
      opacity: 0.96,
    },
    rowBelowAccent: {
      paddingTop: Platform.OS === "web" ? 12 : 0,
    },
    row: {
      flexDirection: "row",
      alignItems: "flex-start",
      gap: spacing.sm,
      minHeight: rowMinH,
      ...Platform.select({
        web: {
          flexWrap: "wrap",
          rowGap: 10,
        },
        default: {},
      }),
    },
    backBtn: {
      marginLeft: -2,
      width: 36,
      height: 36,
      borderRadius: semanticRadius.full,
      alignItems: "center",
      justifyContent: "center",
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: isDark ? "rgba(255,255,255,0.1)" : "rgba(63, 63, 70, 0.14)",
      backgroundColor: isDark ? "rgba(255,255,255,0.05)" : "rgba(255,255,255,0.84)",
      ...Platform.select({
        web: { cursor: "pointer", transition: "background 0.2s ease, border-color 0.2s ease, transform 0.2s ease" },
        default: {
          marginLeft: 0,
          width: 34,
          height: 34,
          borderColor: "transparent",
          backgroundColor: "transparent",
        },
      }),
    },
    backBtnHover: {
      backgroundColor: isDark ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.94)",
      borderColor: isDark ? "rgba(255,255,255,0.16)" : "rgba(63, 63, 70, 0.22)",
    },
    backBtnPressed: {
      opacity: 0.92,
      transform: [{ scale: 0.98 }],
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
      paddingTop: 2,
      paddingRight: spacing.sm,
    },
    title: {
      fontSize: typography.h3,
      letterSpacing: -0.48,
      lineHeight: lineHeight.h3,
      ...Platform.select({
        web: { fontSize: typography.h3 + 2, lineHeight: lineHeight.h3 + 2 },
        default: {},
      }),
    },
    sub: {
      marginTop: 0,
      fontSize: typography.bodySmall,
      lineHeight: lineHeight.bodySmall,
      letterSpacing: 0.04,
      opacity: 0.92,
    },
    subPlain: {
      marginTop: spacing.xs,
    },
    subtitlePill: {
      marginTop: spacing.xs,
      alignSelf: "flex-start",
      borderRadius: semanticRadius.control,
      borderWidth: StyleSheet.hairlineWidth,
      paddingHorizontal: spacing.sm + 2,
      paddingVertical: 6,
      maxWidth: Platform.select({ web: "92%", default: "100%" }),
    },
    rightCluster: {
      flexDirection: "row",
      alignItems: "flex-start",
      gap: spacing.xs,
      flexShrink: 0,
      ...Platform.select({
        web: {
          marginLeft: "auto",
        },
        default: {
          marginLeft: spacing.xs,
        },
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
