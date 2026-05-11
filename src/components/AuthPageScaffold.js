import React, { useMemo } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import AppFooter from "./AppFooter";
import BrandWordmark from "./BrandWordmark";
import CustomerScreenShell from "./CustomerScreenShell";
import MotionScrollView from "./motion/MotionScrollView";
import HeroParallax from "./motion/HeroParallax";
import SectionReveal from "./motion/SectionReveal";
import { useTheme } from "../context/ThemeContext";
import {
  adminScrollPaddingBottom,
  authScrollContent,
  customerPanel,
  customerScrollFill,
} from "../theme/screenLayout";
import { FONT_DISPLAY } from "../theme/customerAlchemy";
import { fonts, lineHeight, semanticRadius, spacing, typography } from "../theme/tokens";

export default function AuthPageScaffold({
  heroBannerA11y,
  heroKicker,
  heroTitle,
  heroSubtitle,
  heroHighlights = [],
  authEyebrow,
  authTitle,
  authSubtitle,
  children,
  assuranceNote,
}) {
  const { colors: c, shadowPremium, isDark } = useTheme();
  const { width } = useWindowDimensions();
  const isWebWide = Platform.OS === "web" && width >= 1080;
  const isCompactMobile = width < 430;
  const styles = useMemo(
    () => createStyles(c, shadowPremium, isDark, { isWebWide, isCompactMobile }),
    [c, shadowPremium, isDark, isWebWide, isCompactMobile]
  );
  const insets = useSafeAreaInsets();
  const heroKickerText = String(heroKicker || "").trim();
  const authSubtitleText = String(authSubtitle || "").trim();
  const assuranceText = String(assuranceNote || "").trim();

  return (
    <CustomerScreenShell style={styles.screen} variant="auth">
      <KeyboardAvoidingView
        style={customerScrollFill}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <MotionScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[
            authScrollContent,
            styles.scrollContentExtra,
            Platform.OS !== "web" ? { paddingBottom: adminScrollPaddingBottom(insets) } : null,
          ]}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.contentGrid}>
            <HeroParallax strength="medium" maxScroll={320} dim style={styles.hero}>
              <View
                style={styles.heroImageWrap}
                accessibilityRole="image"
                accessibilityLabel={heroBannerA11y}
              >
                <LinearGradient
                  colors={["#0F172A", "#1E293B", "#DC2626"]}
                  locations={[0, 0.45, 1]}
                  start={{ x: 0.2, y: 0 }}
                  end={{ x: 0.85, y: 1 }}
                  style={StyleSheet.absoluteFillObject}
                />
                <LinearGradient
                  colors={["rgba(15, 23, 42, 0.12)", "rgba(15, 23, 42, 0.5)", "rgba(15, 23, 42, 0.82)"]}
                  locations={[0, 0.38, 1]}
                  start={{ x: 0.5, y: 0 }}
                  end={{ x: 0.5, y: 1 }}
                  style={StyleSheet.absoluteFillObject}
                />
                <LinearGradient
                  colors={["rgba(255,255,255,0.18)", "rgba(255,255,255,0.04)", "rgba(96,165,250,0.1)"]}
                  locations={[0, 0.28, 1]}
                  start={{ x: 0.08, y: 0 }}
                  end={{ x: 0.92, y: 1 }}
                  style={StyleSheet.absoluteFillObject}
                />
                <View style={styles.heroInner}>
                  <View style={styles.heroBrandStack}>
                    {heroKickerText ? (
                      <View style={styles.heroKickerPill}>
                        <Text style={styles.heroKickerText}>{heroKickerText}</Text>
                      </View>
                    ) : null}
                    <BrandWordmark sizeKey="authHero" color={c.heroForeground} style={styles.heroLogo} />
                  </View>
                  <Text style={styles.heroTitle}>{heroTitle}</Text>
                  <Text style={styles.heroSubtitle}>{heroSubtitle}</Text>
                  {heroHighlights.length > 0 ? (
                    <View style={styles.heroHighlightsRow}>
                      {heroHighlights.map((item) => (
                        <View key={item.key} style={styles.heroHighlightChip}>
                          <Ionicons name={item.icon} size={15} color={c.heroForeground} />
                          <Text style={styles.heroHighlightText}>{item.label}</Text>
                        </View>
                      ))}
                    </View>
                  ) : null}
                </View>
              </View>
            </HeroParallax>

            <SectionReveal delay={60} preset="fade-up" style={styles.cardReveal}>
              <View style={styles.card}>
                <Text style={styles.authEyebrow}>{authEyebrow}</Text>
                <Text style={styles.authTitle}>{authTitle}</Text>
                {authSubtitleText ? <Text style={styles.authSubtitle}>{authSubtitleText}</Text> : null}
                {children}
                {assuranceText ? <Text style={styles.assuranceNote}>{assuranceText}</Text> : null}
              </View>
            </SectionReveal>
          </View>

          <View style={styles.footerWrap}>
            <AppFooter webTight={Platform.OS === "web"} />
          </View>
        </MotionScrollView>
      </KeyboardAvoidingView>
    </CustomerScreenShell>
  );
}

function createStyles(c, shadowPremium, isDark, layoutFlags = {}) {
  const { isWebWide = false, isCompactMobile = false } = layoutFlags;
  return StyleSheet.create({
    screen: {
      flex: 1,
    },
    scrollContentExtra: {
      width: "100%",
      ...(Platform.OS === "web"
        ? {
            justifyContent: isWebWide ? "center" : "flex-start",
          }
        : {}),
    },
    contentGrid: {
      width: "100%",
      maxWidth: isWebWide ? 1080 : 500,
      alignSelf: "center",
      flexDirection: isWebWide ? "row" : "column",
      alignItems: isWebWide ? "stretch" : "center",
      justifyContent: "center",
      gap: isWebWide ? spacing.lg : spacing.sm + 4,
    },
    hero: {
      width: "100%",
      maxWidth: isWebWide ? 500 : 480,
      flex: isWebWide ? 1 : undefined,
      borderRadius: semanticRadius.panel,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: isDark ? c.primaryBorder : c.border,
      overflow: "hidden",
      alignSelf: "center",
      ...shadowPremium,
    },
    heroImageWrap: {
      width: "100%",
      overflow: "hidden",
      minHeight: Platform.OS === "web" ? (isWebWide ? 432 : 244) : isCompactMobile ? 204 : 224,
      backgroundColor: c.heroBackground,
      flex: isWebWide ? 1 : undefined,
    },
    heroInner: {
      position: "relative",
      paddingHorizontal: isCompactMobile ? spacing.lg : spacing.lg + 2,
      paddingTop: isCompactMobile ? spacing.lg : spacing.lg + 2,
      paddingBottom: isCompactMobile ? spacing.md : spacing.lg,
      justifyContent: isWebWide ? "center" : "flex-start",
      minHeight: isWebWide ? 432 : undefined,
    },
    heroBrandStack: {
      alignSelf: "stretch",
    },
    heroKickerPill: {
      alignSelf: "flex-start",
      paddingHorizontal: spacing.sm + 2,
      paddingVertical: 5,
      borderRadius: semanticRadius.full,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: "rgba(255,255,255,0.24)",
      backgroundColor: "rgba(15, 23, 42, 0.28)",
      marginBottom: spacing.sm,
    },
    heroKickerText: {
      color: "rgba(248, 250, 252, 0.92)",
      fontSize: typography.overline + 1,
      fontFamily: fonts.extrabold,
      letterSpacing: 1.2,
      textTransform: "uppercase",
    },
    heroLogo: {
      alignSelf: "center",
    },
    heroTitle: {
      marginTop: spacing.sm,
      color: c.heroForeground,
      fontSize: isCompactMobile ? typography.h1 - 3 : typography.h1,
      fontFamily: FONT_DISPLAY,
      lineHeight: isCompactMobile ? lineHeight.h1 - 2 : lineHeight.h1,
      letterSpacing: -0.82,
      ...Platform.select({
        web: { textShadow: "0 1px 8px rgba(0,0,0,0.35)" },
        default: {
          textShadowColor: "rgba(0,0,0,0.35)",
          textShadowOffset: { width: 0, height: 1 },
          textShadowRadius: 8,
        },
      }),
    },
    heroSubtitle: {
      marginTop: spacing.xs + 2,
      color: "rgba(248, 250, 252, 0.94)",
      fontSize: isCompactMobile ? typography.bodySmall : typography.bodySmall + 1,
      lineHeight: isCompactMobile ? lineHeight.bodySmall : lineHeight.bodySmall + 1,
      fontFamily: fonts.medium,
      maxWidth: isWebWide ? 380 : 344,
      ...Platform.select({
        web: { textShadow: "0 1px 6px rgba(0,0,0,0.25)" },
        default: {
          textShadowColor: "rgba(0,0,0,0.25)",
          textShadowOffset: { width: 0, height: 1 },
          textShadowRadius: 6,
        },
      }),
    },
    heroHighlightsRow: {
      marginTop: spacing.sm + 2,
      flexDirection: "row",
      flexWrap: "wrap",
      gap: spacing.xs + 2,
    },
    heroHighlightChip: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      paddingHorizontal: spacing.sm,
      paddingVertical: 6,
      borderRadius: semanticRadius.full,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: "rgba(255,255,255,0.18)",
      backgroundColor: "rgba(15, 23, 42, 0.22)",
    },
    heroHighlightText: {
      color: c.heroForeground,
      fontSize: typography.caption - 1,
      fontFamily: fonts.semibold,
      letterSpacing: 0.2,
    },
    cardReveal: {
      width: "100%",
      maxWidth: isWebWide ? 500 : 480,
      flex: isWebWide ? 1 : undefined,
    },
    card: {
      width: "100%",
      maxWidth: isWebWide ? 500 : 480,
      ...customerPanel(c, shadowPremium, isDark),
      paddingHorizontal: isCompactMobile ? spacing.lg : spacing.lg + 2,
      paddingVertical: isCompactMobile ? spacing.lg : spacing.lg + 2,
      borderTopWidth: 1,
      borderTopColor: isDark ? "rgba(248, 113, 113, 0.38)" : "rgba(220, 38, 38, 0.24)",
      minHeight: isWebWide ? 100 : undefined,
    },
    authEyebrow: {
      fontFamily: fonts.extrabold,
      fontSize: typography.overline,
      letterSpacing: 1.4,
      textTransform: "uppercase",
      color: isDark ? "rgba(220, 38, 38, 0.9)" : c.primaryDark,
      marginBottom: spacing.xxs,
    },
    authTitle: {
      color: c.textPrimary,
      fontSize: isCompactMobile ? typography.h2 : typography.h2 + 1,
      lineHeight: isCompactMobile ? lineHeight.h2 : lineHeight.h2 + 1,
      fontFamily: FONT_DISPLAY,
      letterSpacing: -0.52,
    },
    authSubtitle: {
      marginTop: spacing.xs + 2,
      color: c.textSecondary,
      fontSize: isCompactMobile ? typography.bodySmall : typography.bodySmall + 1,
      lineHeight: isCompactMobile ? lineHeight.bodySmall + 2 : lineHeight.bodySmall + 4,
      fontFamily: fonts.medium,
    },
    assuranceNote: {
      marginTop: spacing.md,
      color: c.textMuted,
      fontSize: typography.caption,
      lineHeight: lineHeight.caption + 2,
      fontFamily: fonts.medium,
      textAlign: "center",
    },
    footerWrap: {
      marginTop: spacing.md,
      width: "100%",
      maxWidth: isWebWide ? 1080 : 500,
      alignSelf: "center",
    },
  });
}
