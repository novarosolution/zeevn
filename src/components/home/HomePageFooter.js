import React, { useMemo } from "react";
import { Linking, Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import {
  HOME_PAGE_FOOTER_COLUMNS,
  HOME_PAGE_FOOTER_META,
  HOME_PAGE_TRUST_BADGES,
} from "../../content/appContent";
import { BRAND_LOGO_SIZE } from "../../constants/brand";
import { useTheme } from "../../context/ThemeContext";
import { ALCHEMY } from "../../theme/customerAlchemy";
import BrandLogo from "../BrandLogo";
import { fonts, layout, radius, spacing, typography } from "../../theme/tokens";

/**
 * Wide, editorial-style footer for the home experience (columns on web, stacked on mobile).
 */
export default function HomePageFooter({ colors: c, shadowLift }) {
  const navigation = useNavigation();
  const { isDark } = useTheme();
  const styles = useMemo(() => createStyles(c, shadowLift, isDark), [c, shadowLift, isDark]);

  return (
    <View style={styles.shell}>
      <View style={styles.topRow}>
        <View style={styles.brandBlock}>
          <BrandLogo width={BRAND_LOGO_SIZE.footerWide} height={BRAND_LOGO_SIZE.footerWide} style={styles.brandLogoMark} />
        </View>
        <View style={styles.socialRow}>
          <Pressable style={styles.socialBtn} onPress={() => Linking.openURL("https://instagram.com")}>
            <Ionicons name="logo-instagram" size={18} color={c.textSecondary} />
          </Pressable>
          <Pressable style={styles.socialBtn} onPress={() => Linking.openURL("https://facebook.com")}>
            <Ionicons name="logo-facebook" size={18} color={c.textSecondary} />
          </Pressable>
          <Pressable style={styles.socialBtn} onPress={() => navigation.navigate("Support")}>
            <Ionicons name="chatbubble-ellipses-outline" size={18} color={c.textSecondary} />
          </Pressable>
        </View>
      </View>

      <View style={styles.grid}>
        {HOME_PAGE_FOOTER_COLUMNS.map((column) => (
          <View key={column.title} style={styles.col}>
            <Text style={styles.colTitle}>{column.title}</Text>
            {column.links.map((link) => (
              <Pressable
                key={link.label}
                onPress={() => link.route && navigation.navigate(link.route)}
                style={({ pressed }) => [styles.linkRow, pressed && { opacity: 0.7 }]}
              >
                <Text style={styles.linkText}>{link.label}</Text>
              </Pressable>
            ))}
          </View>
        ))}
      </View>

      <View style={styles.trustBadges}>
        {HOME_PAGE_TRUST_BADGES.map((b) => (
          <View key={b.key} style={styles.badge}>
            <Ionicons
              name={b.icon}
              size={16}
              color={b.key === "fair" ? c.accentGold : b.key === "quality" ? c.primary : c.secondary}
            />
            <Text style={styles.badgeText}>{b.label}</Text>
          </View>
        ))}
      </View>

      <View style={styles.divider} />

      <View style={styles.bottomRow}>
        <Text style={styles.copy}>© {new Date().getFullYear()}. All rights reserved.</Text>
        <Text style={styles.meta}>{HOME_PAGE_FOOTER_META}</Text>
      </View>
    </View>
  );
}

function createStyles(c, shadowLift, isDark) {
  return StyleSheet.create({
    shell: {
      marginTop: spacing.xxl,
      paddingVertical: spacing.xl,
      paddingHorizontal: Platform.select({ web: spacing.xxl, default: spacing.lg }),
      paddingBottom: 44,
      borderRadius: 28,
      backgroundColor: isDark ? c.surface : ALCHEMY.cardBg,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: isDark ? c.border : ALCHEMY.pillInactive,
      borderTopWidth: 3,
      borderTopColor: isDark ? c.primaryBorder : ALCHEMY.gold,
      maxWidth: layout.maxContentWidth,
      alignSelf: "center",
      width: "100%",
      ...shadowLift,
    },
    topRow: {
      flexDirection: "row",
      flexWrap: "wrap",
      justifyContent: "space-between",
      alignItems: "center",
      gap: spacing.sm,
      marginBottom: spacing.sm,
    },
    brandBlock: {
      flexDirection: "row",
      alignItems: "center",
    },
    brandLogoMark: {
      flexShrink: 0,
    },
    socialRow: {
      flexDirection: "row",
      gap: spacing.sm,
    },
    socialBtn: {
      width: 40,
      height: 40,
      borderRadius: radius.pill,
      borderWidth: 1,
      borderColor: c.border,
      backgroundColor: c.surfaceMuted,
      alignItems: "center",
      justifyContent: "center",
      ...Platform.select({ web: { cursor: "pointer" }, default: {} }),
    },
    grid: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: spacing.lg,
      justifyContent: "space-between",
      marginBottom: spacing.lg,
    },
    col: {
      minWidth: Platform.OS === "web" ? 140 : "45%",
      flexGrow: 1,
    },
    colTitle: {
      fontSize: typography.caption,
      fontFamily: fonts.bold,
      color: c.textMuted,
      textTransform: "uppercase",
      letterSpacing: 1,
      marginBottom: spacing.sm,
    },
    linkRow: {
      paddingVertical: 6,
    },
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
      borderRadius: radius.pill,
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
  });
}
