import React from "react";
import { Linking, Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import {
  APP_DISPLAY_NAME,
  HOME_PAGE_TRUST_BADGES,
  KANKREG_FOOTER_COLUMNS,
  KANKREG_FOOTER_COPYRIGHT,
  KANKREG_FOOTER_TAGLINE,
  SUPPORT_EMAIL_DISPLAY,
} from "../../content/appContent";
import BrandLogo from "../BrandLogo";
import { useAuth } from "../../context/AuthContext";
import { BRAND_LOGO_SIZE } from "../../constants/brand";
import { FONT_HEADING } from "../../theme/typographyRoles";
import { KANKREG_CHROME, KANKREG_PALETTE } from "../../theme/kankregWeb";
import { fonts, icon, spacing } from "../../theme/tokens";
import { useKankregLayout } from "../../theme/kankregBreakpoints";

/** Premium site footer — Zeevan brand, managed copy from `appContent.js`. */
export default function KankregSiteFooter() {
  const navigation = useNavigation();
  const { footerCols, isXs, pageGutterClamp } = useKankregLayout();
  const { isAuthenticated } = useAuth();

  const handleLink = (link) => {
    if (!link.route) return;
    if (link.requiresAuth && !isAuthenticated) {
      navigation.navigate("Login");
      return;
    }
    navigation.navigate(link.route, link.params);
  };

  const openEmail = () => {
    Linking.openURL(`mailto:${SUPPORT_EMAIL_DISPLAY}`).catch(() => {});
  };

  return (
    <View style={styles.shell}>
      <LinearGradient
        colors={[KANKREG_CHROME.footerFrom, KANKREG_CHROME.footerTo]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <View style={[styles.inner, { paddingHorizontal: pageGutterClamp }]}>
        <View style={styles.trustRow}>
          {HOME_PAGE_TRUST_BADGES.map((badge) => (
            <View key={badge.key} style={styles.trustChip}>
              <Ionicons name={badge.icon} size={icon.xs} color={KANKREG_CHROME.footerAccent} />
              <Text style={styles.trustChipText}>{badge.label}</Text>
            </View>
          ))}
        </View>

        <View
          style={[
            styles.cols,
            {
              flexDirection: footerCols === 1 ? "column" : "row",
              flexWrap: "wrap",
            },
          ]}
        >
          <View style={[styles.brandCol, { width: footerCols >= 4 ? "38%" : "100%", minWidth: 220 }]}>
            <BrandLogo
              height={BRAND_LOGO_SIZE.footerCompact}
              variant="onDark"
              glow={false}
            />
            <Text style={styles.tagline}>{KANKREG_FOOTER_TAGLINE}</Text>
            <Pressable onPress={openEmail} style={({ pressed }) => [styles.emailRow, pressed && { opacity: 0.8 }]}>
              <Ionicons name="mail-outline" size={icon.xs} color={KANKREG_CHROME.footerAccent} />
              <Text style={styles.emailText}>{SUPPORT_EMAIL_DISPLAY}</Text>
            </Pressable>
          </View>

          {KANKREG_FOOTER_COLUMNS.map((column) => (
            <View
              key={column.title}
              style={[styles.col, { minWidth: footerCols === 1 ? "100%" : isXs ? "46%" : 140 }]}
            >
              <Text style={styles.colTitle}>{column.title}</Text>
              {column.links.map((link) => (
                <Pressable
                  key={link.label}
                  onPress={() => handleLink(link)}
                  disabled={!link.route}
                  style={({ hovered, pressed }) => [
                    styles.link,
                    link.route && hovered && styles.linkHover,
                    pressed && link.route && { opacity: 0.75 },
                  ]}
                >
                  <Text style={[styles.linkText, !link.route && styles.linkMuted]}>{link.label}</Text>
                </Pressable>
              ))}
            </View>
          ))}
        </View>

        <View style={[styles.bottom, isXs && styles.bottomStack]}>
          <Text style={styles.bottomText}>{KANKREG_FOOTER_COPYRIGHT}</Text>
          <Text style={styles.bottomBrand}>{APP_DISPLAY_NAME}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  shell: {
    marginTop: 48,
    paddingTop: Platform.OS === "web" ? "clamp(48px, 6vw, 72px)" : 48,
    paddingBottom: 36,
    width: "100%",
    overflow: "hidden",
    position: "relative",
  },
  inner: {
    maxWidth: 1280,
    width: "100%",
    alignSelf: "center",
    paddingHorizontal: Platform.OS === "web" ? "clamp(18px, 4vw, 40px)" : spacing.lg,
  },
  trustRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 36,
    paddingBottom: 28,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.08)",
  },
  trustChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 999,
    backgroundColor: "rgba(42, 117, 89, 0.1)",
    borderWidth: 1,
    borderColor: "rgba(42, 117, 89, 0.18)",
  },
  trustChipText: {
    fontFamily: fonts.medium,
    fontSize: 12.5,
    color: "rgba(250, 248, 244, 0.88)",
  },
  cols: {
    gap: 36,
  },
  brandCol: {
    gap: spacing.sm,
  },
  tagline: {
    fontSize: 14,
    color: "rgba(250, 248, 244, 0.62)",
    maxWidth: 300,
    lineHeight: 22,
    marginTop: 4,
  },
  emailRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: spacing.sm,
    ...Platform.select({ web: { cursor: "pointer" }, default: {} }),
  },
  emailText: {
    fontFamily: fonts.medium,
    fontSize: 13.5,
    color: KANKREG_CHROME.footerAccent,
    textDecorationLine: "underline",
  },
  col: {
    flex: 1,
  },
  colTitle: {
    fontSize: 11,
    letterSpacing: 2.4,
    textTransform: "uppercase",
    color: KANKREG_CHROME.footerAccent,
    marginBottom: 16,
    fontFamily: fonts.semibold,
  },
  link: {
    marginVertical: 7,
    ...Platform.select({ web: { cursor: "pointer" }, default: {} }),
  },
  linkHover: {
    transform: [{ translateX: 2 }],
  },
  linkText: {
    fontSize: 14,
    color: "rgba(250, 248, 244, 0.72)",
    fontFamily: fonts.medium,
  },
  linkMuted: {
    opacity: 0.45,
  },
  bottom: {
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.08)",
    marginTop: 44,
    paddingTop: 22,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 10,
  },
  bottomStack: {
    flexDirection: "column",
    alignItems: "flex-start",
  },
  bottomText: {
    fontSize: 12.5,
    color: "rgba(250, 248, 244, 0.45)",
  },
  bottomBrand: {
    fontFamily: FONT_HEADING,
    fontSize: 14,
    color: "rgba(42, 117, 89, 0.65)",
    letterSpacing: 0.5,
  },
});
