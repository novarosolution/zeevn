import React from "react";
import { Image, Platform, StyleSheet, Text, View } from "react-native";
import { WHY_CHOOSE_SECTION } from "../../content/whyChooseContent";
import { useTheme } from "../../context/ThemeContext";
import { useKankregLayout } from "../../theme/kankregBreakpoints";
import { WP } from "../../theme/webPremium";
import { FONT_HEADING } from "../../theme/typographyRoles";
import { fonts, spacing } from "../../theme/tokens";
import SectionReveal from "../motion/SectionReveal";
import WebSectionBackdrop from "./WebSectionBackdrop";
import { WebSectionHead } from "./webPremiumParts";
import { ensureWebPremiumCss } from "../../utils/webPremiumCss";

if (Platform.OS === "web") ensureWebPremiumCss();

const BG = require("../../../assets/section-bg-warm-4k.jpg");

function WhyPanel({ item, tall }) {
  return (
    <View
      className="zv-tile"
      style={[styles.panel, tall && styles.panelTall]}
      accessibilityRole="summary"
      accessibilityLabel={`${item.title}. ${item.body}`}
    >
      <Image source={item.image} className="zv-tile-img" style={styles.panelImg} resizeMode="cover" />
      <View style={styles.scrim} pointerEvents="none" />
      <View style={[styles.copy, tall && styles.copyPhone]}>
        <View style={styles.goldRule} />
        <Text style={[styles.panelTitle, tall && styles.panelTitlePhone]} numberOfLines={2}>
          {item.title}
        </Text>
        <Text style={[styles.panelBody, tall && styles.panelBodyPhone]} numberOfLines={3}>
          {item.body}
        </Text>
      </View>
    </View>
  );
}

/** Four photographic panels — type sits on the image, not under a white card. */
export default function WebWhyChooseSection() {
  const { isDark } = useTheme();
  const { isMobileWeb, pageGutterClamp } = useKankregLayout();
  const copy = WHY_CHOOSE_SECTION;

  const body = (
    <View style={[styles.inner, isMobileWeb && styles.innerMobile, { paddingHorizontal: pageGutterClamp }]}>
      {isMobileWeb ? (
        <Text style={[styles.titleMobile, { color: isDark ? WP.cream : WP.green.deep }]}>{copy.title}</Text>
      ) : (
        <WebSectionHead align="center" eyebrow={copy.eyebrow} title={copy.title} />
      )}
      <View style={[styles.grid, isMobileWeb && styles.gridMobile]}>
        {copy.items.map((item) => (
          <WhyPanel key={item.key} item={item} tall={isMobileWeb} />
        ))}
      </View>
    </View>
  );

  return (
    <SectionReveal preset="fade-up" style={styles.reveal}>
      {isMobileWeb ? (
        <View
          style={[styles.pad, styles.padPhone, { backgroundColor: isDark ? "#1A1712" : "#FFFFFF" }]}
          accessibilityLabel={copy.title}
        >
          {body}
        </View>
      ) : (
        <WebSectionBackdrop source={BG} tone="warm" isDark={isDark} accessibilityLabel={copy.title} style={styles.pad}>
          {body}
        </WebSectionBackdrop>
      )}
    </SectionReveal>
  );
}

const styles = StyleSheet.create({
  reveal: { width: "100%" },
  pad: { paddingVertical: 88 },
  padPhone: {
    paddingVertical: spacing.lg + 4,
    marginTop: spacing.sm,
  },
  inner: {
    width: "100%",
    maxWidth: 1280,
    alignSelf: "center",
    gap: 40,
  },
  innerMobile: { gap: spacing.md },
  titleMobile: {
    fontFamily: FONT_HEADING,
    fontSize: 26,
    lineHeight: 32,
    letterSpacing: -0.4,
    textAlign: "center",
    marginBottom: 4,
  },
  grid: {
    flexDirection: "row",
    gap: 16,
  },
  gridMobile: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: 12,
  },
  panel: {
    flex: 1,
    minWidth: 0,
    aspectRatio: 0.78,
    borderRadius: 20,
    overflow: "hidden",
    position: "relative",
    justifyContent: "flex-end",
    backgroundColor: "#1A1208",
    ...Platform.select({
      web: { boxShadow: "0 18px 40px -24px rgba(26, 18, 8, 0.55)", cursor: "default" },
      default: {},
    }),
  },
  panelTall: {
    flex: 0,
    flexBasis: "48%",
    width: "48%",
    maxWidth: "48%",
    aspectRatio: 0.72,
    borderRadius: 16,
  },
  panelImg: {
    ...StyleSheet.absoluteFillObject,
    width: "100%",
    height: "100%",
  },
  scrim: {
    ...StyleSheet.absoluteFillObject,
    ...Platform.select({
      web: {
        backgroundImage:
          "linear-gradient(180deg, rgba(14,16,10,0.08) 0%, rgba(14,16,10,0.18) 38%, rgba(14,16,10,0.72) 72%, rgba(14,16,10,0.92) 100%)",
      },
      default: { backgroundColor: "rgba(14,16,10,0.55)" },
    }),
  },
  copy: {
    zIndex: 2,
    paddingHorizontal: 20,
    paddingBottom: 22,
    paddingTop: 48,
    gap: 8,
  },
  copyPhone: {
    paddingHorizontal: 14,
    paddingBottom: 14,
    paddingTop: 36,
    gap: 5,
  },
  goldRule: {
    width: 28,
    height: 1.5,
    backgroundColor: WP.gold.bright,
    marginBottom: 4,
  },
  panelTitle: {
    fontFamily: FONT_HEADING,
    fontSize: 24,
    lineHeight: 28,
    letterSpacing: -0.35,
    color: WP.cream,
  },
  panelTitlePhone: {
    fontSize: 17,
    lineHeight: 21,
    letterSpacing: -0.2,
  },
  panelBody: {
    fontFamily: fonts.regular,
    fontSize: 14.5,
    lineHeight: 21,
    color: "rgba(250, 248, 244, 0.88)",
    maxWidth: 280,
  },
  panelBodyPhone: {
    fontSize: 12,
    lineHeight: 16.5,
    maxWidth: "100%",
  },
});
