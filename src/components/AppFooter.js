import React, { useMemo } from "react";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import Constants from "expo-constants";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { APP_FOOTER_NAV_LINKS, FOOTER_COMPACT } from "../content/appContent";
import { useTheme } from "../context/ThemeContext";
import { BRAND_LOGO_SIZE, SUPPORT_EMAIL_DISPLAY } from "../constants/brand";
import { fonts, radius, spacing, typography } from "../theme/tokens";
import BrandLogo from "./BrandLogo";

function FooterNavLink({ label, onPress, styles }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.linkPress, pressed && styles.linkPressPressed]} hitSlop={6}>
      <Text style={styles.linkText}>{label}</Text>
    </Pressable>
  );
}

export default function AppFooter() {
  const navigation = useNavigation();
  const { colors: c, shadowLift } = useTheme();
  const styles = useMemo(() => createFooterStyles(c, shadowLift), [c, shadowLift]);

  return (
    <View style={styles.footer}>
      <View style={styles.brandBlock}>
        <BrandLogo width={BRAND_LOGO_SIZE.footerCompact} height={BRAND_LOGO_SIZE.footerCompact} style={styles.brandLogoMark} />
      </View>

      <Text style={styles.offerLine}>{FOOTER_COMPACT.offerLine}</Text>

      <View style={styles.linksRow}>
        {APP_FOOTER_NAV_LINKS.map((item, i) => (
          <React.Fragment key={item.route}>
            {i > 0 ? <Text style={styles.sep}>·</Text> : null}
            <FooterNavLink label={item.label} onPress={() => navigation.navigate(item.route)} styles={styles} />
          </React.Fragment>
        ))}
      </View>

      <View style={styles.divider} />

      <View style={styles.supportRow}>
        <View style={styles.noteRow}>
          <MaterialCommunityIcons name="help-circle-outline" size={14} color={c.textSecondary} />
          <Text style={styles.note}>{FOOTER_COMPACT.needHelp}</Text>
        </View>
        <Text style={styles.noteValue}>{SUPPORT_EMAIL_DISPLAY}</Text>
      </View>
      <View style={styles.supportRow}>
        <View style={styles.noteRow}>
          <Ionicons name="chatbubble-ellipses-outline" size={14} color={c.textSecondary} />
          <Text style={styles.note}>{FOOTER_COMPACT.customerCare}</Text>
        </View>
        <Text style={styles.noteValue}>{FOOTER_COMPACT.chatSupport247}</Text>
      </View>

      <Text style={styles.copy}>v{Constants.expoConfig?.version ?? "1.0.0"}</Text>
    </View>
  );
}

function createFooterStyles(c, shadowLift) {
  return StyleSheet.create({
    footer: {
      marginTop: spacing.xl,
      paddingVertical: spacing.xl,
      paddingHorizontal: spacing.lg,
      borderRadius: radius.xxl,
      backgroundColor: c.surface,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: c.border,
      borderLeftWidth: 3,
      borderLeftColor: c.accentGold,
      ...shadowLift,
    },
    brandBlock: {
      flexDirection: "row",
      alignItems: "center",
    },
    brandLogoMark: {
      flexShrink: 0,
    },
    offerLine: {
      marginTop: 0,
      color: c.textSecondary,
      fontSize: typography.bodySmall,
      fontFamily: fonts.medium,
      lineHeight: 20,
    },
    linksRow: {
      marginTop: spacing.sm,
      flexDirection: "row",
      flexWrap: "wrap",
      alignItems: "center",
      gap: 4,
    },
    linkPress: {
      paddingVertical: 4,
      paddingHorizontal: 2,
    },
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
      backgroundColor: c.border,
    },
    supportRow: {
      marginTop: spacing.sm,
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "flex-start",
      gap: spacing.sm,
      flexWrap: Platform.OS === "android" ? "wrap" : "nowrap",
    },
    note: {
      color: c.textSecondary,
      fontSize: typography.caption,
      fontFamily: fonts.regular,
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
      flex: Platform.OS === "android" ? 0 : 1,
      textAlign: Platform.OS === "android" ? "left" : "right",
    },
    copy: {
      marginTop: spacing.md,
      color: c.textMuted,
      fontSize: typography.overline + 1,
      fontFamily: fonts.semibold,
    },
  });
}
