import React, { useEffect, useMemo, useRef } from "react";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { getGsap } from "../utils/loadGsap";
import { APP_FOOTER_NAV_LINKS, FOOTER_COMPACT } from "../content/appContent";
import { useTheme } from "../context/ThemeContext";
import { BRAND_LOGO_SIZE, SUPPORT_EMAIL_DISPLAY } from "../constants/brand";
import { ALCHEMY } from "../theme/customerAlchemy";
import { fonts, getSemanticColors, icon, semanticRadius, spacing, typography } from "../theme/tokens";
import BrandLogo from "./BrandLogo";

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
  const hasSupportPrimary = Boolean(needHelp && supportEmail);
  const hasSupportSecondary = Boolean(customerCare && supportMeta);
  const navLinks = APP_FOOTER_NAV_LINKS.filter((item) => item?.route && item?.label);
  const footerRef = useRef(null);

  useEffect(() => {
    if (Platform.OS !== "web" || !footerRef.current) return undefined;
    let tween;
    let cancelled = false;
    (async () => {
      const gsap = await getGsap();
      if (cancelled || !gsap || !footerRef.current) return;
      tween = gsap.fromTo(
        footerRef.current,
        { y: 22 },
        { y: 0, duration: 0.58, ease: "power3.out", delay: 0.08 }
      );
    })();
    return () => {
      cancelled = true;
      tween?.kill?.();
    };
  }, []);

  return (
    <View ref={footerRef} style={styles.footer}>
      <View style={styles.brandBlock}>
        <BrandLogo height={BRAND_LOGO_SIZE.footerCompact} style={styles.brandLogoMark} />
        <View style={styles.brandMeta}>
          <Text style={styles.brandTitle}>Zeevan</Text>
          <Text style={styles.brandSub}>Curated everyday essentials</Text>
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
    </View>
  );
}

function createFooterStyles(c, shadowLift, isDark, semantic, webTight) {
  return StyleSheet.create({
    footer: {
      marginTop: Platform.select({ web: webTight ? spacing.lg : spacing.xxl, default: spacing.xl }),
      paddingVertical: spacing.xl + 6,
      paddingHorizontal: Platform.select({ web: spacing.xl + 8, default: spacing.lg + 2 }),
      borderRadius: semanticRadius.panel,
      backgroundColor: isDark ? c.surface : ALCHEMY.ivory,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: isDark ? semantic.border.subtle : ALCHEMY.line,
      borderTopWidth: 3,
      borderTopColor: isDark ? semantic.border.accent : ALCHEMY.gold,
      ...shadowLift,
      ...Platform.select({
        web: {
          backgroundImage: isDark
            ? undefined
            : "linear-gradient(180deg, rgba(255,255,255,0.9), rgba(255,251,247,1))",
          boxShadow: isDark
            ? "0 20px 44px rgba(0,0,0,0.32), inset 0 1px 0 rgba(255,255,255,0.05)"
            : "0 18px 40px rgba(22, 69, 51, 0.08), inset 0 1px 0 rgba(255,255,255,0.9)",
          maxWidth: 1280,
          alignSelf: "center",
          width: "100%",
          transition: "box-shadow 0.22s ease, transform 0.22s ease, border-color 0.22s ease",
        },
        default: {},
      }),
    },
    brandBlock: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.sm,
    },
    brandLogoMark: {
      flexShrink: 0,
    },
    brandMeta: {
      flex: 1,
      minWidth: 0,
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
      fontSize: typography.body,
      fontFamily: fonts.semibold,
      lineHeight: 24,
    },
    linksRow: {
      marginTop: spacing.md,
      flexDirection: "row",
      flexWrap: "wrap",
      alignItems: "center",
      gap: 6,
    },
    linkPress: {
      paddingVertical: 10,
      paddingHorizontal: 6,
      borderRadius: semanticRadius.control,
    },
    linkPressHover: {
      backgroundColor: isDark ? "rgba(255,255,255,0.06)" : "rgba(31, 92, 71, 0.14)",
    },
    linkPressHoverLift: Platform.select({
      web: {
        boxShadow: isDark
          ? "0 10px 18px rgba(0,0,0,0.2)"
          : "0 10px 18px rgba(22, 69, 51, 0.12)",
        transform: [{ translateY: -1 }],
      },
      default: {},
    }),
    linkPressPressed: {
      opacity: 0.65,
    },
    linkText: {
      color: c.primary,
      fontSize: typography.bodySmall + 1,
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
      marginTop: spacing.sm,
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
  });
}
