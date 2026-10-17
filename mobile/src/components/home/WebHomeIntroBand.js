import React from "react";
import { Image, Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { HOME_SCREEN_UI } from "../../content/appContent";
import { ZEEVAN_PRODUCT_LINES } from "../../content/zeevanCatalogContent";
import { ZEEVAN_GREEN } from "../../theme/kankregWeb";
import { useKankregLayout } from "../../theme/kankregBreakpoints";
import { FONT_HEADING } from "../../theme/typographyRoles";
import { fonts, icon, spacing } from "../../theme/tokens";
import { useTheme } from "../../context/ThemeContext";
import { getHomeLineImage } from "../../content/homeLineImages";
import SectionReveal from "../motion/SectionReveal";

const PANTRY_BG = require("../../../assets/home-pantry-strip-bg.jpg");

/**
 * Compact Diwali / pantry intro — title, line cards, one CTA (no sparse empty right).
 */
export default function WebHomeIntroBand({ navigation }) {
  const { isDark } = useTheme();
  const { pageGutterClamp, isMobileWeb } = useKankregLayout();
  const copy = HOME_SCREEN_UI.webIntro;
  if (HOME_SCREEN_UI.web?.showIntroBand === false) return null;

  const ink = isDark ? "#FAF8F4" : "#1A1C14";
  const muted = isDark ? "rgba(250,248,244,0.78)" : "#4A4634";
  const cta = copy?.cta || "Shop all";

  return (
    <View style={[styles.shell, isDark && styles.shellDark]}>
      {!isDark ? (
        <Image source={PANTRY_BG} style={styles.bg} resizeMode="cover" accessibilityIgnoresInvertColors />
      ) : null}
      <View style={[styles.scrim, isDark && styles.scrimDark]} pointerEvents="none" />
      <SectionReveal immediate preset="fade-up" delay={80} style={styles.revealWrap}>
        <View style={[styles.inner, { paddingHorizontal: pageGutterClamp }]}>
          <View style={styles.topRow}>
            <View style={[styles.copy, isMobileWeb && styles.copyCenter]}>
              {copy?.title ? (
                <Text style={[styles.title, { color: ink }, isMobileWeb && styles.titleCenter]}>
                  {copy.title}
                </Text>
              ) : null}
              {copy?.subtitle ? (
                <Text style={[styles.subtitle, { color: muted }, isMobileWeb && styles.titleCenter]}>
                  {copy.subtitle}
                </Text>
              ) : null}
            </View>
            {!isMobileWeb ? (
              <Pressable
                onPress={() => navigation.navigate("Shop")}
                style={({ hovered, pressed }) => [
                  styles.cta,
                  hovered && styles.ctaHover,
                  pressed && { opacity: 0.92 },
                ]}
                accessibilityRole="button"
                accessibilityLabel={cta}
              >
                <Text style={styles.ctaText}>{cta}</Text>
                <Ionicons name="arrow-forward" size={icon.xs} color="#FAF8F4" />
              </Pressable>
            ) : null}
          </View>

          <View
            style={[styles.rail, isMobileWeb && styles.railMobile]}
            accessibilityRole="navigation"
            accessibilityLabel="Product lines"
          >
            {ZEEVAN_PRODUCT_LINES.map((line) => {
              const thumb = getHomeLineImage(line.key);
              const short = isMobileWeb && line.key === "honey" ? "Honey" : line.label;
              return (
                <Pressable
                  key={line.key}
                  onPress={() =>
                    navigation.navigate("Shop", {
                      category: line.label,
                      pill: line.shopPill || line.label,
                    })
                  }
                  style={({ hovered, pressed }) => [
                    styles.lineCard,
                    isMobileWeb && styles.lineCardMobile,
                    isDark && styles.lineCardDark,
                    hovered && styles.lineCardHover,
                    pressed && { opacity: 0.92 },
                  ]}
                  accessibilityRole="link"
                  accessibilityLabel={`Shop ${line.label}`}
                >
                  {thumb ? <Image source={thumb} style={styles.lineThumb} /> : null}
                  <Text style={[styles.lineText, { color: ink }]} numberOfLines={1}>
                    {short}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {isMobileWeb ? (
            <Pressable
              onPress={() => navigation.navigate("Shop")}
              style={({ hovered, pressed }) => [
                styles.cta,
                styles.ctaCenter,
                hovered && styles.ctaHover,
                pressed && { opacity: 0.92 },
              ]}
              accessibilityRole="button"
              accessibilityLabel={cta}
            >
              <Text style={styles.ctaText}>{cta}</Text>
              <Ionicons name="arrow-forward" size={icon.xs} color="#FAF8F4" />
            </Pressable>
          ) : null}
        </View>
      </SectionReveal>
    </View>
  );
}

const styles = StyleSheet.create({
  shell: {
    width: "100%",
    position: "relative",
    overflow: "hidden",
    paddingTop: spacing.md + 4,
    paddingBottom: spacing.md,
    borderBottomWidth: 0,
    backgroundColor: "#F7F1E6",
  },
  shellDark: {
    backgroundColor: "#141210",
  },
  bg: {
    ...StyleSheet.absoluteFillObject,
    width: "100%",
    height: "100%",
  },
  scrim: {
    ...StyleSheet.absoluteFillObject,
    ...Platform.select({
      web: {
        backgroundImage:
          "linear-gradient(180deg, rgba(252,248,240,0.82) 0%, rgba(247,241,230,0.9) 100%)",
      },
      default: { backgroundColor: "rgba(252,248,240,0.85)" },
    }),
  },
  scrimDark: {
    backgroundColor: "rgba(18,16,12,0.88)",
  },
  revealWrap: { width: "100%", position: "relative", zIndex: 1 },
  inner: {
    width: "100%",
    maxWidth: 1100,
    alignSelf: "center",
    gap: spacing.sm + 4,
  },
  topRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    gap: spacing.md,
  },
  copy: {
    flex: 1,
    minWidth: 0,
    gap: 4,
    maxWidth: 520,
  },
  copyCenter: {
    alignItems: "center",
    alignSelf: "center",
    maxWidth: "100%",
  },
  title: {
    fontFamily: FONT_HEADING,
    fontSize: 32,
    lineHeight: 38,
    letterSpacing: -0.4,
  },
  titleCenter: { textAlign: "center" },
  subtitle: {
    fontFamily: fonts.regular,
    fontSize: 15,
    lineHeight: 22,
  },
  rail: {
    flexDirection: "row",
    alignItems: "stretch",
    gap: 10,
    width: "100%",
  },
  railMobile: {
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  lineCard: {
    flex: 1,
    minWidth: 0,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(26, 28, 20, 0.12)",
    backgroundColor: "rgba(255, 253, 248, 0.95)",
    ...Platform.select({
      web: {
        cursor: "pointer",
        transition: "border-color 0.2s ease, background-color 0.2s ease, transform 0.2s ease",
      },
      default: {},
    }),
  },
  lineCardMobile: {
    flex: 0,
    flexBasis: "48%",
    width: "48%",
    maxWidth: "48%",
    ...Platform.select({
      web: { boxSizing: "border-box" },
      default: {},
    }),
  },
  lineCardDark: {
    borderColor: "rgba(255,255,255,0.12)",
    backgroundColor: "rgba(255,255,255,0.05)",
  },
  lineCardHover: {
    borderColor: ZEEVAN_GREEN.deep,
    backgroundColor: "rgba(85, 107, 50, 0.08)",
  },
  lineThumb: {
    width: 44,
    height: 44,
    borderRadius: 10,
  },
  lineText: {
    fontFamily: fonts.semibold,
    fontSize: 14,
    letterSpacing: 0.02,
    flexShrink: 1,
  },
  cta: {
    flexShrink: 0,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 10,
    backgroundColor: ZEEVAN_GREEN.deep,
    ...Platform.select({ web: { cursor: "pointer" }, default: {} }),
  },
  ctaCenter: {
    alignSelf: "center",
    width: "100%",
    justifyContent: "center",
  },
  ctaHover: {
    backgroundColor: ZEEVAN_GREEN.base,
  },
  ctaText: {
    fontFamily: fonts.semibold,
    fontSize: 13,
    letterSpacing: 0.04,
    color: "#FAF8F4",
  },
});
