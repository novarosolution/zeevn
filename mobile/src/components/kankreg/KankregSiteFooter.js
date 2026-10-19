import React, { useState } from "react";
import { Image, Linking, Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import {
  APP_DISPLAY_NAME,
  HOME_PAGE_TRUST_BADGES,
  KANKREG_FOOTER_COLUMNS,
  KANKREG_FOOTER_COPYRIGHT,
  KANKREG_FOOTER_TAGLINE,
  SUPPORT_EMAIL_DISPLAY,
} from "../../content/appContent";
import BrandLogo from "../BrandLogo";
import EngineerCredit from "../EngineerCredit";
import { useAuth } from "../../context/AuthContext";
import { BRAND_LOGO_SIZE } from "../../constants/brand";
import { FONT_HEADING } from "../../theme/typographyRoles";
import { KANKREG_CHROME, ZEEVAN_GREEN } from "../../theme/kankregWeb";
import { fonts, icon, spacing } from "../../theme/tokens";
import { useKankregLayout } from "../../theme/kankregBreakpoints";

const FOOTER_BG = require("../../../assets/footer-bg-heritage-final.jpg");

function FooterColumn({ column, handleLink, accordion }) {
  const [open, setOpen] = useState(false);
  if (!accordion) {
    return (
      <View style={[styles.col, { minWidth: 140 }]}>
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
    );
  }

  return (
    <View style={styles.accordionCol}>
      <Pressable
        onPress={() => setOpen((v) => !v)}
        style={({ pressed }) => [styles.accordionHead, pressed && { opacity: 0.85 }]}
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
      >
        <Text style={styles.colTitle}>{column.title}</Text>
        <Ionicons name={open ? "chevron-up" : "chevron-down"} size={16} color={KANKREG_CHROME.footerAccent} />
      </Pressable>
      {open
        ? column.links.map((link) => (
            <Pressable
              key={link.label}
              onPress={() => handleLink(link)}
              disabled={!link.route}
              style={({ pressed }) => [styles.link, pressed && link.route && { opacity: 0.75 }]}
            >
              <Text style={[styles.linkText, !link.route && styles.linkMuted]}>{link.label}</Text>
            </Pressable>
          ))
        : null}
    </View>
  );
}

/** Premium site footer — solid green phone / heritage desktop. */
export default function KankregSiteFooter() {
  const navigation = useNavigation();
  const { footerCols, isXs, pageGutterClamp, isMobileWeb } = useKankregLayout();
  const { isAuthenticated } = useAuth();
  const phone = isMobileWeb || isXs;

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
    <View style={[styles.shell, phone && styles.shellPhone]}>
      {!phone ? (
        <>
          <Image source={FOOTER_BG} style={styles.bg} resizeMode="cover" accessibilityIgnoresInvertColors />
          <View style={styles.bgScrim} pointerEvents="none" />
        </>
      ) : null}
      <View style={[styles.inner, { paddingHorizontal: pageGutterClamp }, phone && styles.innerPhone]}>
        <View style={[styles.trustRow, phone && styles.trustRowPhone]}>
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
              flexDirection: phone ? "column" : footerCols === 1 ? "column" : "row",
              flexWrap: "wrap",
            },
            phone && styles.colsPhone,
          ]}
        >
          <View style={[styles.brandCol, { width: phone || footerCols < 4 ? "100%" : "38%", minWidth: 220 }]}>
            <BrandLogo height={BRAND_LOGO_SIZE.footerCompact} variant="onDark" glow={false} />
            <Text style={styles.tagline}>{KANKREG_FOOTER_TAGLINE}</Text>
            <Pressable onPress={openEmail} style={({ pressed }) => [styles.emailRow, pressed && { opacity: 0.8 }]}>
              <Ionicons name="mail-outline" size={icon.xs} color={KANKREG_CHROME.footerAccent} />
              <Text style={styles.emailText}>{SUPPORT_EMAIL_DISPLAY}</Text>
            </Pressable>
          </View>

          {KANKREG_FOOTER_COLUMNS.map((column) => (
            <FooterColumn
              key={column.title}
              column={column}
              handleLink={handleLink}
              accordion={phone}
            />
          ))}
        </View>

        <View style={[styles.bottom, (phone || isXs) && styles.bottomStack]}>
          <Text style={styles.bottomText}>{KANKREG_FOOTER_COPYRIGHT}</Text>
          <Text style={styles.bottomBrand}>{APP_DISPLAY_NAME}</Text>
        </View>
        <EngineerCredit
          style={styles.engineerCredit}
          textStyle={styles.engineerCreditText}
          linkStyle={styles.engineerCreditLink}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  shell: {
    marginTop: 0,
    marginBottom: 0,
    paddingTop: Platform.OS === "web" ? "clamp(40px, 5vw, 64px)" : 48,
    paddingBottom: Platform.OS === "web" ? 28 : 36,
    width: "100%",
    overflow: "hidden",
    position: "relative",
    backgroundColor: ZEEVAN_GREEN.deep,
    alignSelf: "center",
    ...Platform.select({
      web: {
        width: "100vw",
        maxWidth: "100vw",
        marginLeft: "calc(50% - 50vw)",
        marginRight: "calc(50% - 50vw)",
      },
      default: {},
    }),
  },
  shellPhone: {
    paddingTop: 28,
    paddingBottom: 20,
  },
  bg: {
    ...StyleSheet.absoluteFillObject,
    width: "100%",
    height: "100%",
  },
  bgScrim: {
    ...StyleSheet.absoluteFillObject,
    ...Platform.select({
      web: {
        backgroundImage:
          "linear-gradient(105deg, rgba(10,14,8,0.22) 0%, rgba(10,14,8,0.58) 48%, rgba(10,14,8,0.45) 100%)",
      },
      default: { backgroundColor: "rgba(10,14,8,0.5)" },
    }),
  },
  inner: {
    maxWidth: 1280,
    width: "100%",
    alignSelf: "center",
    position: "relative",
    zIndex: 1,
    paddingHorizontal: Platform.OS === "web" ? "clamp(18px, 4vw, 40px)" : spacing.lg,
  },
  innerPhone: {
    gap: 4,
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
  trustRowPhone: {
    marginBottom: 20,
    paddingBottom: 16,
    gap: 8,
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
  colsPhone: {
    gap: 8,
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
  accordionCol: {
    width: "100%",
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.1)",
    paddingVertical: 4,
  },
  accordionHead: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    ...Platform.select({ web: { cursor: "pointer" }, default: {} }),
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
    marginTop: 24,
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
  engineerCredit: {
    marginTop: 14,
    textAlign: "center",
    width: "100%",
  },
  engineerCreditText: {
    color: "rgba(250, 248, 244, 0.42)",
  },
  engineerCreditLink: {
    color: KANKREG_CHROME.footerAccent,
  },
});
