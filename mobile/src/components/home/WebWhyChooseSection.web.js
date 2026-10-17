import React from "react";
import { Image, StyleSheet, Text, View } from "react-native";
import { WHY_CHOOSE_SECTION } from "../../content/whyChooseContent";
import { useTheme } from "../../context/ThemeContext";
import { useKankregLayout } from "../../theme/kankregBreakpoints";
import { ZEEVAN_GREEN } from "../../theme/kankregWeb";
import { FONT_HEADING } from "../../theme/typographyRoles";
import { fonts, spacing } from "../../theme/tokens";
import SectionReveal from "../motion/SectionReveal";
import WebSectionBackdrop from "./WebSectionBackdrop";

const BG = require("../../../assets/section-bg-warm-4k.jpg");
const INK = "#1A1C14";
const MUTED = "#3F3C2E";

/** Four-up “Why Choose Zeevan” — Anveshan-style values row (web). */
export default function WebWhyChooseSection() {
  const { isDark } = useTheme();
  const { isMobileWeb, pageGutterClamp } = useKankregLayout();
  const copy = WHY_CHOOSE_SECTION;
  const ink = isDark ? "#FAF8F4" : INK;
  const muted = isDark ? "rgba(250,248,244,0.78)" : MUTED;

  return (
    <SectionReveal preset="fade-up" style={styles.reveal}>
      <WebSectionBackdrop
        source={BG}
        tone="warm"
        isDark={isDark}
        accessibilityLabel={copy.title}
        style={styles.pad}
      >
        <View style={[styles.inner, { paddingHorizontal: pageGutterClamp }]}>
          <Text style={[styles.eyebrow, { color: isDark ? "#E8BC84" : ZEEVAN_GREEN.deep }]}>
            {copy.eyebrow}
          </Text>
          <Text style={[styles.title, { color: ink }, isMobileWeb && styles.titleMobile]}>
            {copy.title}
          </Text>
          <View style={[styles.grid, isMobileWeb && styles.gridMobile]}>
            {copy.items.map((item) => (
              <View
                key={item.key}
                style={[styles.card, isMobileWeb && styles.cardMobile, isDark && styles.cardDark]}
              >
                <Image
                  source={item.image}
                  style={[styles.icon, isMobileWeb && styles.iconMobile]}
                  resizeMode="cover"
                />
                <Text style={[styles.cardTitle, { color: ink }]}>{item.title}</Text>
                <Text
                  style={[styles.cardBody, { color: muted }]}
                  numberOfLines={isMobileWeb ? 3 : undefined}
                >
                  {item.body}
                </Text>
              </View>
            ))}
          </View>
        </View>
      </WebSectionBackdrop>
    </SectionReveal>
  );
}

const styles = StyleSheet.create({
  reveal: { width: "100%" },
  pad: { paddingVertical: spacing.xl },
  inner: {
    width: "100%",
    maxWidth: 1100,
    alignSelf: "center",
    gap: spacing.md,
  },
  eyebrow: {
    fontFamily: fonts.semibold,
    fontSize: 11,
    letterSpacing: 1.8,
    textTransform: "uppercase",
    textAlign: "center",
  },
  title: {
    fontFamily: FONT_HEADING,
    fontSize: 28,
    lineHeight: 34,
    textAlign: "center",
    marginBottom: 8,
  },
  titleMobile: { fontSize: 22, lineHeight: 28 },
  grid: {
    flexDirection: "row",
    gap: 16,
  },
  gridMobile: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: 10,
  },
  card: {
    flex: 1,
    minWidth: 0,
    alignItems: "center",
    gap: 10,
    padding: 16,
    borderRadius: 14,
    backgroundColor: "rgba(255,253,248,0.96)",
    borderWidth: 1,
    borderColor: "rgba(26, 28, 20, 0.12)",
  },
  cardMobile: {
    flex: 0,
    flexBasis: "48%",
    width: "48%",
    maxWidth: "48%",
    padding: 12,
    gap: 8,
  },
  cardDark: {
    backgroundColor: "rgba(255,255,255,0.08)",
    borderColor: "rgba(255,255,255,0.14)",
  },
  icon: {
    width: 72,
    height: 72,
    borderRadius: 36,
  },
  iconMobile: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  cardTitle: {
    fontFamily: fonts.bold,
    fontSize: 15,
    textAlign: "center",
  },
  cardBody: {
    fontFamily: fonts.regular,
    fontSize: 13,
    lineHeight: 19,
    textAlign: "center",
  },
});
