import React from "react";
import { Image, Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../context/ThemeContext";
import { useKankregLayout } from "../../theme/kankregBreakpoints";
import { KANKREG_CHROME, KANKREG_PALETTE, ZEEVAN_GREEN } from "../../theme/kankregWeb";
import { FONT_HEADING, FONT_HEADING_ITALIC } from "../../theme/typographyRoles";
import { fonts, icon, spacing } from "../../theme/tokens";
import SectionReveal from "../motion/SectionReveal";
import { ABOUT_HERO_IMAGE } from "../../content/aboutVisualContent";
import { resolveImageSource } from "../../utils/mediaSource";

/**
 * Compact About hero — short photo + cream copy (not a full-viewport image).
 * Desktop: split. Phone: 180px photo band, then readable copy below.
 */
export default function AboutPremiumHero({
  eyebrow,
  title,
  subtitle,
  pullQuote,
  navigation,
  showBack = false,
  heroImage = ABOUT_HERO_IMAGE,
}) {
  const { isDark } = useTheme();
  const { isMobileWeb, pageGutterClamp, isMd } = useKankregLayout();
  const ink = isDark ? KANKREG_PALETTE.paper : KANKREG_PALETTE.ink;
  const soft = isDark ? "rgba(250,248,244,0.72)" : KANKREG_PALETTE.inkSoft;
  const isBundled = typeof heroImage === "number";
  const remoteSource = !isBundled ? resolveImageSource(heroImage) : null;
  const photoSource = isBundled ? heroImage : remoteSource;
  const split = isMd && !isMobileWeb;

  const photo = photoSource ? (
    <Image
      source={photoSource}
      style={styles.photo}
      resizeMode="cover"
      accessibilityIgnoresInvertColors
    />
  ) : (
    <View style={[styles.photo, styles.photoFallback]} />
  );

  const copy = (
    <SectionReveal immediate preset="fade-up" style={styles.copy}>
      {showBack ? (
        <Pressable
          onPress={() => navigation?.goBack?.()}
          style={({ pressed }) => [styles.back, pressed && { opacity: 0.75 }]}
          accessibilityRole="button"
          accessibilityLabel="Back"
        >
          <Ionicons name="chevron-back" size={icon.md} color={ink} />
          <Text style={[styles.backText, { color: soft }]}>Back</Text>
        </Pressable>
      ) : null}
      {eyebrow ? (
        <Text style={[styles.eyebrow, { color: isDark ? KANKREG_PALETTE.goldBright : ZEEVAN_GREEN.deep }]}>
          {eyebrow}
        </Text>
      ) : null}
      <Text style={[styles.title, isMobileWeb && styles.titlePhone, { color: ink }]}>{title}</Text>
      {subtitle ? (
        <Text style={[styles.subtitle, isMobileWeb && styles.subtitlePhone, { color: soft }]}>{subtitle}</Text>
      ) : null}
      {pullQuote ? (
        <Text style={[styles.quote, isMobileWeb && styles.quotePhone, { color: ink }]}>{pullQuote}</Text>
      ) : null}
      <View style={[styles.ctaRow, isMobileWeb && styles.ctaRowStack]}>
        <Pressable
          onPress={() => navigation?.navigate?.("Shop")}
          style={({ hovered, pressed }) => [
            styles.ctaPrimary,
            hovered && styles.ctaPrimaryHover,
            pressed && { opacity: 0.92 },
          ]}
          accessibilityRole="button"
          accessibilityLabel="Shop Zeevan"
        >
          <Text style={styles.ctaPrimaryText}>Shop Zeevan</Text>
          <Ionicons name="arrow-forward" size={15} color="#FFFFFF" />
        </Pressable>
        <Pressable
          onPress={() => navigation?.navigate?.("Support")}
          style={({ pressed }) => [styles.ctaGhost, pressed && { opacity: 0.8 }]}
          accessibilityRole="button"
          accessibilityLabel="Contact support"
        >
          <Text style={[styles.ctaGhostText, { color: ink }]}>Talk to us</Text>
        </Pressable>
      </View>
    </SectionReveal>
  );

  return (
    <View
      style={[
        styles.shell,
        isDark && styles.shellDark,
        { paddingHorizontal: pageGutterClamp || spacing.lg },
      ]}
    >
      <View style={[styles.inner, split ? styles.innerSplit : styles.innerStack]}>
        {split ? (
          <>
            <View style={styles.copyCol}>{copy}</View>
            <View style={styles.photoCol}>{photo}</View>
          </>
        ) : (
          <>
            <View style={[styles.photoBand, isMobileWeb && styles.photoBandPhone]}>{photo}</View>
            {copy}
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  shell: {
    width: "100%",
    backgroundColor: KANKREG_PALETTE.paper,
    paddingTop: Platform.OS === "web" ? spacing.lg : spacing.md,
    paddingBottom: Platform.OS === "web" ? spacing.xl : spacing.lg,
    marginBottom: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: KANKREG_PALETTE.line,
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
  shellDark: {
    backgroundColor: "#141110",
    borderBottomColor: "rgba(255,255,255,0.08)",
  },
  inner: {
    maxWidth: 1100,
    width: "100%",
    alignSelf: "center",
    gap: spacing.lg,
  },
  innerSplit: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xl,
  },
  innerStack: {
    flexDirection: "column",
  },
  copyCol: {
    flex: 1.05,
    minWidth: 280,
  },
  photoCol: {
    flex: 0.95,
    minWidth: 280,
    maxWidth: 480,
    height: 280,
    borderRadius: 14,
    overflow: "hidden",
    backgroundColor: KANKREG_PALETTE.paper2,
    ...Platform.select({
      web: { boxShadow: "0 16px 36px -20px rgba(36,68,36,0.28)" },
      default: {},
    }),
  },
  photoBand: {
    width: "100%",
    height: 200,
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: KANKREG_PALETTE.paper2,
  },
  photoBandPhone: {
    height: 168,
    borderRadius: 10,
  },
  photo: {
    width: "100%",
    height: "100%",
  },
  photoFallback: {
    backgroundColor: ZEEVAN_GREEN.soft,
  },
  copy: {
    gap: 8,
    maxWidth: 520,
  },
  back: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginBottom: 4,
    alignSelf: "flex-start",
    ...Platform.select({ web: { cursor: "pointer" }, default: {} }),
  },
  backText: {
    fontFamily: fonts.medium,
    fontSize: 14,
  },
  eyebrow: {
    fontFamily: fonts.semibold,
    fontSize: 11,
    letterSpacing: 2.2,
    textTransform: "uppercase",
  },
  title: {
    fontFamily: FONT_HEADING,
    fontSize: Platform.OS === "web" ? 40 : 30,
    lineHeight: Platform.OS === "web" ? 46 : 36,
    letterSpacing: -0.6,
    fontWeight: "400",
  },
  titlePhone: {
    fontSize: 28,
    lineHeight: 34,
  },
  subtitle: {
    fontFamily: fonts.regular,
    fontSize: 16,
    lineHeight: 24,
    maxWidth: 440,
  },
  subtitlePhone: {
    fontSize: 14,
    lineHeight: 21,
  },
  quote: {
    fontFamily: FONT_HEADING_ITALIC,
    fontStyle: "italic",
    fontSize: 17,
    lineHeight: 26,
    marginTop: spacing.xs,
    maxWidth: 400,
  },
  quotePhone: {
    fontSize: 15,
    lineHeight: 22,
  },
  ctaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginTop: spacing.md,
  },
  ctaRowStack: {
    flexDirection: "column",
    alignItems: "stretch",
  },
  ctaPrimary: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 11,
    backgroundColor: KANKREG_CHROME.buttonAccent,
    ...Platform.select({
      web: {
        cursor: "pointer",
        boxShadow: "0 10px 24px -12px rgba(31, 51, 31, 0.4)",
      },
      default: {},
    }),
  },
  ctaPrimaryHover: {
    backgroundColor: KANKREG_CHROME.buttonAccentHover,
  },
  ctaPrimaryText: {
    fontFamily: fonts.semibold,
    fontSize: 14,
    color: "#FFFFFF",
    letterSpacing: 0.2,
  },
  ctaGhost: {
    paddingVertical: 10,
    paddingHorizontal: 4,
    ...Platform.select({ web: { cursor: "pointer" }, default: {} }),
  },
  ctaGhostText: {
    fontFamily: fonts.medium,
    fontSize: 14,
    textDecorationLine: "underline",
    textDecorationColor: "rgba(36,68,36,0.28)",
  },
});
