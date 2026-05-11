import React, { useEffect, useMemo, useRef } from "react";
import { Linking, Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import Constants from "expo-constants";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { gsap } from "gsap";
import {
  APP_ENGINEER_NAME,
  APP_ENGINEER_URL,
  APP_FOOTER_NAV_LINKS,
  APP_TAGLINE,
  APP_WORDMARK_SUBLINE,
  FOOTER_COMPACT,
} from "../content/appContent";
import { useTheme } from "../context/ThemeContext";
import { SUPPORT_EMAIL_DISPLAY } from "../constants/brand";
import { ALCHEMY, HERITAGE } from "../theme/customerAlchemy";
import { fonts, getSemanticColors, icon, semanticRadius, spacing, typography } from "../theme/tokens";
import { CUSTOMER_PAGE_MAX_WIDTH } from "../theme/screenLayout";
import BrandWordmark from "./BrandWordmark";

function FooterNavLink({ label, onPress, styles }) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed, hovered }) => [
        styles.linkPress,
        hovered && styles.linkPressHover,
        hovered ? styles.linkPressHoverLift : null,
        pressed && styles.linkPressPressed,
      ]}
      hitSlop={6}
    >
      <Text style={styles.linkText}>{label}</Text>
    </Pressable>
  );
}

export default function AppFooter({ webTight = false }) {
  const navigation = useNavigation();
  const { colors: c, shadowLift, isDark } = useTheme();
  const semantic = getSemanticColors(c);
  const styles = useMemo(
    () => createFooterStyles(c, shadowLift, isDark, semantic, webTight),
    [c, shadowLift, isDark, semantic, webTight]
  );
  const offerLine = String(FOOTER_COMPACT.offerLine || "").trim();
  const needHelp = String(FOOTER_COMPACT.needHelp || "").trim();
  const customerCare = String(FOOTER_COMPACT.customerCare || "").trim();
  const supportEmail = String(SUPPORT_EMAIL_DISPLAY || "").trim();
  const supportMeta = String(FOOTER_COMPACT.chatSupport247 || "").trim();
  const engineerName = String(APP_ENGINEER_NAME || "").trim();
  const engineerUrl = String(APP_ENGINEER_URL || "").trim();
  const hasSupportPrimary = Boolean(needHelp && supportEmail);
  const hasSupportSecondary = Boolean(customerCare && supportMeta);
  const navLinks = APP_FOOTER_NAV_LINKS.filter((item) => item?.route && item?.label);
  const footerRef = useRef(null);

  useEffect(() => {
    if (Platform.OS !== "web" || !footerRef.current) return;
    const tween = gsap.fromTo(
      footerRef.current,
      { y: 22 },
      { y: 0, duration: 0.58, ease: "power3.out", delay: 0.08 }
    );
    return () => tween.kill();
  }, []);

  return (
    <View ref={footerRef} style={styles.footer}>
      <View style={styles.brandBlock}>
        <BrandWordmark sizeKey="footerCompact" style={styles.brandLogoMark} />
        <View style={styles.brandMeta}>
          <Text style={styles.brandKicker}>{APP_WORDMARK_SUBLINE}</Text>
          <Text style={styles.brandSub}>{APP_TAGLINE}</Text>
        </View>
      </View>

      {offerLine ? <Text style={styles.offerLine}>{offerLine}</Text> : null}

      <View style={styles.linksRow}>
        {navLinks.map((item, i) => (
          <React.Fragment key={item.route}>
            {i > 0 ? <Text style={styles.sep}>·</Text> : null}
            <FooterNavLink label={item.label} onPress={() => navigation.navigate(item.route)} styles={styles} />
          </React.Fragment>
        ))}
      </View>

      {hasSupportPrimary || hasSupportSecondary ? <View style={styles.divider} /> : null}

      {hasSupportPrimary ? (
        <View style={styles.supportRow}>
          <View style={styles.noteRow}>
            <MaterialCommunityIcons name="help-circle-outline" size={icon.xs} color={c.textSecondary} />
            <Text style={styles.note}>{needHelp}</Text>
          </View>
          <Text style={styles.noteValue}>{supportEmail}</Text>
        </View>
      ) : null}
      {hasSupportSecondary ? (
        <View style={styles.supportRow}>
          <View style={styles.noteRow}>
            <Ionicons name="chatbubble-ellipses-outline" size={icon.xs} color={c.textSecondary} />
            <Text style={styles.note}>{customerCare}</Text>
          </View>
          <Text style={styles.noteValue}>{supportMeta}</Text>
        </View>
      ) : null}

      <Text style={[styles.engineerLine, { marginTop: hasSupportPrimary || hasSupportSecondary ? spacing.sm : spacing.md }]}>
        {FOOTER_COMPACT.onlinePaymentCta}
      </Text>

      {engineerName && engineerUrl ? (
        <Text style={styles.engineerLine} accessibilityRole="text">
          {FOOTER_COMPACT.engineerPrefix}{" "}
          <Text
            style={styles.engineerLink}
            onPress={() => Linking.openURL(engineerUrl)}
            accessibilityRole="link"
            accessibilityLabel={`${engineerName} website`}
          >
            {engineerName}
          </Text>
        </Text>
      ) : null}
      <Text style={styles.copy}>v{Constants.expoConfig?.version ?? "1.0.0"}</Text>
    </View>
  );
}

function createFooterStyles(c, shadowLift, isDark, semantic, webTight) {
  return StyleSheet.create({
    footer: {
      marginTop: Platform.select({ web: webTight ? spacing.md + 2 : spacing.xl, default: spacing.xl }),
      paddingVertical: spacing.lg,
      paddingHorizontal: Platform.select({ web: spacing.lg + 2, default: spacing.lg }),
      borderRadius: semanticRadius.panel,
      backgroundColor: isDark ? c.surface : ALCHEMY.ivory,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: isDark ? semantic.border.subtle : c.border,
      borderTopWidth: 2,
      borderTopColor: isDark ? semantic.border.accent : HERITAGE.amberMid,
      ...shadowLift,
      ...Platform.select({
        web: {
          backgroundImage: isDark
            ? undefined
            : "linear-gradient(180deg, rgba(255,255,255,0.96), rgba(247,249,252,1))",
          boxShadow: isDark
            ? "0 12px 24px rgba(0,0,0,0.24), inset 0 1px 0 rgba(255,255,255,0.05)"
            : "0 10px 20px rgba(15, 23, 42, 0.06), inset 0 1px 0 rgba(255,255,255,0.94)",
          maxWidth: CUSTOMER_PAGE_MAX_WIDTH,
          alignSelf: "center",
          width: "100%",
          transition: "box-shadow 0.22s ease, border-color 0.22s ease",
        },
        default: {},
      }),
    },
    brandBlock: {
      flexDirection: "row",
      alignItems: "flex-start",
      gap: spacing.sm + 2,
    },
    brandLogoMark: {
      flexShrink: 0,
    },
    brandMeta: {
      flex: 1,
      minWidth: 0,
    },
    brandKicker: {
      color: isDark ? ALCHEMY.goldBright : ALCHEMY.brown,
      fontSize: typography.overline + 1,
      fontFamily: fonts.extrabold,
      letterSpacing: 1.3,
      textTransform: "uppercase",
    },
    brandTitle: {
      color: c.textPrimary,
      fontSize: typography.body + 1,
      fontFamily: fonts.extrabold,
      letterSpacing: -0.3,
    },
    brandSub: {
      marginTop: 2,
      color: c.textMuted,
      fontSize: typography.caption,
      fontFamily: fonts.medium,
    },
    offerLine: {
      marginTop: spacing.sm,
      color: c.textSecondary,
      fontSize: typography.bodySmall,
      fontFamily: fonts.semibold,
      lineHeight: 20,
    },
    linksRow: {
      marginTop: spacing.sm + 2,
      flexDirection: "row",
      flexWrap: "wrap",
      alignItems: "center",
      gap: 8,
    },
    linkPress: {
      paddingVertical: 10,
      paddingHorizontal: 8,
      borderRadius: semanticRadius.control,
    },
    linkPressHover: {
      backgroundColor: isDark ? "rgba(255,255,255,0.06)" : "rgba(220, 38, 38, 0.08)",
    },
    linkPressHoverLift: Platform.select({
      web: {
        boxShadow: isDark
          ? "0 6px 12px rgba(0,0,0,0.16)"
          : "0 6px 12px rgba(15, 23, 42, 0.06)",
      },
      default: {},
    }),
    linkPressPressed: {
      opacity: 0.65,
    },
    linkText: {
      color: c.primary,
      fontSize: typography.bodySmall,
      fontFamily: fonts.bold,
    },
    sep: {
      color: c.textMuted,
      fontSize: typography.bodySmall,
      fontFamily: fonts.semibold,
    },
    divider: {
      marginTop: spacing.md,
      marginBottom: spacing.xs,
      height: StyleSheet.hairlineWidth,
      backgroundColor: isDark ? c.border : ALCHEMY.lineStrong,
    },
    supportRow: {
      marginTop: spacing.xs + 4,
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "flex-start",
      gap: spacing.sm,
      flexWrap: "wrap",
      paddingVertical: 1,
    },
    note: {
      color: c.textSecondary,
      fontSize: typography.caption,
      fontFamily: fonts.regular,
      lineHeight: 19,
    },
    noteRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 5,
    },
    noteValue: {
      color: c.textPrimary,
      fontSize: typography.caption,
      fontFamily: fonts.bold,
      lineHeight: 19,
      flex: Platform.OS === "web" ? 0 : Platform.OS === "android" ? 0 : 1,
      textAlign: Platform.OS === "ios" ? "right" : "left",
    },
    engineerLine: {
      marginTop: spacing.md,
      color: c.textMuted,
      fontSize: typography.overline + 1,
      fontFamily: fonts.medium,
      textAlign: "center",
      width: "100%",
    },
    engineerLink: {
      fontFamily: fonts.bold,
      color: c.primary,
      textDecorationLine: Platform.OS === "web" ? "underline" : "none",
      ...Platform.select({ web: { cursor: "pointer" }, default: {} }),
    },
    copy: {
      marginTop: spacing.xs,
      color: c.textMuted,
      fontSize: typography.overline + 1,
      fontFamily: fonts.semibold,
      alignSelf: "center",
    },
  });
}
