import React, { useMemo } from "react";
import { Linking, Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import {
  APP_DISPLAY_NAME,
  APP_ENGINEER_NAME,
  APP_ENGINEER_URL,
  APP_TAGLINE,
  APP_WORDMARK_SUBLINE,
  HOME_PAGE_FOOTER_COLUMNS,
  HOME_PAGE_FOOTER_META,
  HOME_PAGE_TRUST_BADGES,
  RAZORPAY_PAY_URL,
  SUPPORT_EMAIL_DISPLAY,
} from "../../content/appContent";
import { useTheme } from "../../context/ThemeContext";
import { ALCHEMY, HERITAGE } from "../../theme/customerAlchemy";
import BrandWordmark from "../BrandWordmark";
import { fonts, getSemanticColors, icon, layout, semanticRadius, spacing, typography } from "../../theme/tokens";

/**
 * Wide, editorial-style footer for the home experience (columns on web, stacked on mobile).
 */
export default function HomePageFooter({ colors: c }) {
  const navigation = useNavigation();
  const { isDark, shadowPremium } = useTheme();
  const semantic = getSemanticColors(c);
  const styles = useMemo(() => createStyles(c, shadowPremium, isDark, semantic), [c, shadowPremium, isDark, semantic]);
  const footerMeta = String(HOME_PAGE_FOOTER_META || "").trim();
  const engineerName = String(APP_ENGINEER_NAME || "").trim();
  const engineerUrl = String(APP_ENGINEER_URL || "").trim();
  const supportEmail = String(SUPPORT_EMAIL_DISPLAY || "").trim();
  const payOnlineUrl = String(RAZORPAY_PAY_URL || "").trim();
  const footerColumns = HOME_PAGE_FOOTER_COLUMNS
    .map((col) => ({
      ...col,
      links: (col.links || []).filter((link) => String(link?.label || "").trim()),
    }))
    .filter((col) => String(col.title || "").trim() && col.links.length > 0);
  const trustBadges = (HOME_PAGE_TRUST_BADGES || []).filter((b) => String(b?.label || "").trim());

  return (
    <View style={styles.shell}>
      <View style={styles.topRow}>
        <View style={styles.brandBlock}>
          <View style={styles.brandTextCol}>
            <BrandWordmark sizeKey="footerWide" style={styles.brandLogoMark} />
            <Text style={styles.brandKicker}>{APP_WORDMARK_SUBLINE}</Text>
            <Text style={styles.brandTagline}>{APP_TAGLINE}</Text>
          </View>
        </View>
        <View style={styles.socialRow}>
          <Pressable
            style={({ hovered }) => [styles.socialBtn, hovered && Platform.OS === "web" ? styles.socialBtnHover : null]}
            onPress={() => navigation.navigate("Support")}
          >
            <Ionicons name="chatbubble-ellipses" size={icon.md} color={c.textSecondary} />
          </Pressable>
          <Pressable
            style={({ hovered }) => [styles.socialBtn, hovered && Platform.OS === "web" ? styles.socialBtnHover : null]}
            onPress={() => supportEmail ? Linking.openURL(`mailto:${supportEmail}`) : null}
          >
            <Ionicons name="mail-outline" size={icon.md} color={c.textSecondary} />
          </Pressable>
          <Pressable
            style={({ hovered }) => [styles.socialBtn, hovered && Platform.OS === "web" ? styles.socialBtnHover : null]}
            onPress={() => payOnlineUrl ? Linking.openURL(payOnlineUrl) : null}
          >
            <Ionicons name="card-outline" size={icon.md} color={c.textSecondary} />
          </Pressable>
        </View>
      </View>

      <View style={styles.grid}>
        {footerColumns.map((column) => (
          <View key={column.title} style={styles.col}>
            <Text style={styles.colTitle}>{column.title}</Text>
            {column.links.map((link) => {
              const canPress = Boolean(link.route || link.url);
              return (
                <Pressable
                  key={`${link.label}-${link.route ?? ""}-${link.url ?? ""}`}
                  onPress={() => {
                    if (link.url) void Linking.openURL(link.url);
                    else if (link.route) navigation.navigate(link.route);
                  }}
                  style={({ pressed, hovered }) => [
                    styles.linkRow,
                    !canPress ? styles.linkRowStatic : null,
                    hovered && Platform.OS === "web" ? styles.linkRowHover : null,
                    hovered && canPress ? styles.linkRowHoverLift : null,
                    pressed && { opacity: 0.7 },
                  ]}
                >
                  <Text style={styles.linkText}>{link.label}</Text>
                </Pressable>
              );
            })}
          </View>
        ))}
      </View>

      <View style={styles.trustBadges}>
        {trustBadges.map((b) => (
          <View key={b.key} style={styles.badge}>
            <Ionicons
              name={b.icon}
              size={icon.xs}
              color={b.key === "fair" ? c.accentGold : b.key === "quality" ? c.primary : c.secondary}
            />
            <Text style={styles.badgeText}>{b.label}</Text>
          </View>
        ))}
      </View>

      <View style={styles.divider} />

      <View style={styles.bottomRow}>
        <Text style={styles.copy}>© {new Date().getFullYear()} {APP_DISPLAY_NAME}. All rights reserved.</Text>
        {footerMeta ? <Text style={styles.meta}>{footerMeta}</Text> : null}
      </View>
      {engineerName && engineerUrl ? (
        <Text style={styles.engineerLine} accessibilityRole="text">
          App by{" "}
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
    </View>
  );
}

function createStyles(c, shadowPremium, isDark, semantic) {
  return StyleSheet.create({
    shell: {
      marginTop: spacing.xxl + 8,
      paddingVertical: spacing.xl + 8,
      paddingHorizontal: Platform.select({ web: spacing.xxl, default: spacing.lg }),
      paddingBottom: 44,
      borderRadius: semanticRadius.panel,
      backgroundColor: isDark ? c.surface : ALCHEMY.cardBg,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: isDark ? semantic.border.subtle : c.border,
      borderTopWidth: 2,
      borderTopColor: isDark ? semantic.border.accent : HERITAGE.amberMid,
      maxWidth: layout.maxContentWidth,
      alignSelf: "center",
      width: "100%",
      ...shadowPremium,
      ...Platform.select({
        web: {
          boxShadow: isDark
            ? "0 18px 40px rgba(0,0,0,0.28), inset 0 1px 0 rgba(255,255,255,0.05)"
            : "0 16px 32px rgba(15, 23, 42, 0.08), inset 0 1px 0 rgba(255,255,255,0.94)",
          transition: "box-shadow 0.2s ease, border-color 0.2s ease, transform 0.2s ease",
        },
        default: {},
      }),
    },
    topRow: {
      flexDirection: "row",
      flexWrap: "wrap",
      justifyContent: "space-between",
      alignItems: "flex-start",
      gap: spacing.sm,
      marginBottom: spacing.md + 2,
      paddingBottom: spacing.sm,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: isDark ? "rgba(255,255,255,0.08)" : "rgba(63, 63, 70, 0.1)",
    },
    brandBlock: {
      flexDirection: "row",
      alignItems: "center",
    },
    brandTextCol: {
      gap: 4,
    },
    brandLogoMark: {
      flexShrink: 0,
    },
    brandKicker: {
      color: isDark ? ALCHEMY.goldBright : ALCHEMY.brown,
      fontSize: typography.overline + 1,
      fontFamily: fonts.extrabold,
      letterSpacing: 1.3,
      textTransform: "uppercase",
    },
    brandTagline: {
      color: c.textMuted,
      fontSize: typography.caption,
      fontFamily: fonts.medium,
      lineHeight: 18,
      maxWidth: 340,
    },
    socialRow: {
      flexDirection: "row",
      gap: spacing.xs + 2,
    },
    socialBtn: {
      width: 44,
      height: 44,
      borderRadius: semanticRadius.full,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: isDark ? semantic.border.subtle : ALCHEMY.pillInactive,
      backgroundColor: isDark ? c.surfaceMuted : c.surface,
      alignItems: "center",
      justifyContent: "center",
      ...Platform.select({
        web: { cursor: "pointer", transition: "background 0.18s ease, border-color 0.18s ease, box-shadow 0.18s ease, transform 0.18s ease" },
        default: {},
      }),
    },
    socialBtnHover: {
      backgroundColor: isDark ? c.surface : ALCHEMY.ivory,
      borderColor: isDark ? semantic.border.accent : c.borderStrong,
      ...Platform.select({
        web: {
          boxShadow: isDark ? "0 10px 18px rgba(0,0,0,0.2)" : "0 10px 18px rgba(15, 23, 42, 0.1)",
          transform: [{ translateY: -1 }],
        },
        default: {},
      }),
    },
    grid: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: spacing.xl + 4,
      rowGap: spacing.lg,
      justifyContent: "space-between",
      marginBottom: spacing.lg + 4,
    },
    col: {
      minWidth: Platform.OS === "web" ? 140 : "45%",
      flexGrow: 1,
    },
    colTitle: {
      fontSize: typography.overline + 1,
      fontFamily: fonts.extrabold,
      color: c.textMuted,
      textTransform: "uppercase",
      letterSpacing: 1.5,
      marginBottom: spacing.sm + 2,
    },
    linkRow: {
      paddingVertical: 6,
      borderRadius: semanticRadius.control,
      paddingHorizontal: 4,
    },
    linkRowStatic: {
      ...Platform.select({
        web: { cursor: "default" },
        default: {},
      }),
    },
    linkRowHover: {
      backgroundColor: isDark ? "rgba(255,255,255,0.06)" : "rgba(220, 38, 38, 0.08)",
    },
    linkRowHoverLift: Platform.select({
      web: {
        boxShadow: isDark ? "0 8px 16px rgba(0,0,0,0.18)" : "0 8px 16px rgba(15, 23, 42, 0.08)",
        transform: [{ translateY: -1 }],
      },
      default: {},
    }),
    linkText: {
      fontSize: typography.bodySmall,
      fontFamily: fonts.semibold,
      color: c.textPrimary,
    },
    trustBadges: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: spacing.sm,
      marginBottom: spacing.md,
    },
    badge: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      paddingHorizontal: spacing.sm,
      paddingVertical: 6,
      borderRadius: semanticRadius.full,
      backgroundColor: c.surfaceMuted,
      borderWidth: 1,
      borderColor: c.border,
    },
    badgeText: {
      fontSize: typography.caption,
      fontFamily: fonts.medium,
      color: c.textSecondary,
    },
    divider: {
      height: StyleSheet.hairlineWidth,
      backgroundColor: c.border,
      marginBottom: spacing.md,
    },
    bottomRow: {
      flexDirection: "row",
      flexWrap: "wrap",
      justifyContent: "space-between",
      gap: spacing.sm,
    },
    copy: {
      fontSize: typography.caption,
      fontFamily: fonts.medium,
      color: c.textMuted,
    },
    meta: {
      fontSize: typography.caption,
      fontFamily: fonts.medium,
      color: c.textMuted,
    },
    engineerLine: {
      marginTop: spacing.sm,
      textAlign: "center",
      width: "100%",
      fontSize: typography.caption,
      fontFamily: fonts.medium,
      color: c.textMuted,
    },
    engineerLink: {
      fontFamily: fonts.bold,
      color: c.primary,
      textDecorationLine: Platform.OS === "web" ? "underline" : "none",
      ...Platform.select({ web: { cursor: "pointer" }, default: {} }),
    },
  });
}
