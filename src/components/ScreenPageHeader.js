import React, { useMemo } from "react";
import { Platform, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import BrandHeaderMark from "./BrandHeaderMark";
import LocationIconButton from "./LocationIconButton";
import { useTheme } from "../context/ThemeContext";
import { BRAND_LOGO_SIZE } from "../constants/brand";
import { fonts, radius, spacing, typography } from "../theme/tokens";
import { customerContentWidth } from "../theme/screenLayout";
import { ALCHEMY, FONT_DISPLAY } from "../theme/customerAlchemy";

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

  const styles = useMemo(() => createStyles(ROW_MIN_H), []);

  return (
    <View style={[styles.headerOuter, customerContentWidth]}>
      <View
        style={[
          styles.headerCard,
          {
            backgroundColor: isDark ? c.surface : ALCHEMY.cardBg,
            borderColor: isDark ? c.border : ALCHEMY.pillInactive,
          },
          shadowPremium,
        ]}
      >
        <LinearGradient
          colors={[ALCHEMY.gold, "#D4AF37", ALCHEMY.brown]}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={styles.headerGoldAccent}
          pointerEvents="none"
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
              <Ionicons name="chevron-back" size={22} color={isDark ? c.textPrimary : ALCHEMY.brown} />
            </TouchableOpacity>
          ) : null}
          {showBrand ? <BrandHeaderMark navigation={navigation} compact /> : null}
          {!backVisible && !showBrand ? <View style={[styles.leadSpacer, styles.leadSpacerCompact]} /> : null}
          <View style={styles.titleCol}>
            <Text style={[styles.title, { color: c.textPrimary, fontFamily: FONT_DISPLAY }]} numberOfLines={2}>
              {title}
            </Text>
            {subtitle ? (
              <Text style={[styles.sub, { color: c.textSecondary, fontFamily: fonts.medium }]} numberOfLines={2}>
                {subtitle}
              </Text>
            ) : null}
          </View>
          <View style={styles.rightCluster}>
            {showLocation ? <LocationIconButton navigation={navigation} size={20} /> : null}
            {right ? <View style={styles.rightSlot}>{right}</View> : null}
          </View>
        </View>
      </View>
    </View>
  );
}

function createStyles(rowMinH) {
  return StyleSheet.create({
    headerOuter: {
      marginBottom: spacing.sm,
      ...Platform.select({ web: { maxWidth: "100%" }, default: {} }),
    },
    headerCard: {
      width: "100%",
      borderRadius: radius.xxl,
      borderWidth: StyleSheet.hairlineWidth,
      paddingHorizontal: spacing.sm,
      paddingBottom: 6,
      overflow: "hidden",
      ...Platform.select({
        web: { boxSizing: "border-box", cursor: "default" },
        default: {},
      }),
    },
    headerGoldAccent: {
      width: "100%",
      height: 3,
      opacity: 0.95,
    },
    rowBelowAccent: {
      paddingTop: 6,
    },
    row: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      minHeight: rowMinH,
    },
    backBtn: {
      marginLeft: -2,
      padding: 2,
      justifyContent: "center",
      ...Platform.select({ web: { cursor: "pointer" }, default: {} }),
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
    title: {
      fontSize: typography.h2,
      letterSpacing: -0.35,
      lineHeight: 28,
    },
    sub: {
      marginTop: 3,
      fontSize: typography.bodySmall,
      lineHeight: 20,
      opacity: 0.9,
    },
    rightCluster: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.xs,
      flexShrink: 0,
    },
    rightSlot: {
      alignItems: "flex-end",
      justifyContent: "center",
    },
  });
}
