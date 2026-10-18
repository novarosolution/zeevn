import React from "react";
import { Image, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
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

/** Four-up “Why Choose Zeevan” — icon grid on phone, photo cards on desktop. */
export default function WebWhyChooseSection() {
  const { isDark } = useTheme();
  const { isMobileWeb, pageGutterClamp } = useKankregLayout();
  const copy = WHY_CHOOSE_SECTION;
  const ink = isDark ? "#FAF8F4" : INK;
  const muted = isDark ? "rgba(250,248,244,0.78)" : MUTED;

  const body = (
    <View style={[styles.inner, { paddingHorizontal: pageGutterClamp }]}>
      {!isMobileWeb ? (
        <Text style={[styles.eyebrow, { color: isDark ? "#E8BC84" : ZEEVAN_GREEN.deep }]}>
          {copy.eyebrow}
        </Text>
      ) : null}
      <Text style={[styles.title, { color: ink }, isMobileWeb && styles.titleMobile]}>
        {isMobileWeb ? "Why choose Zeevan?" : copy.title}
      </Text>
      <View style={[styles.grid, isMobileWeb && styles.gridMobile]}>
        {copy.items.map((item) =>
          isMobileWeb ? (
            <View key={item.key} style={styles.iconCardFlat}>
              <Ionicons
                name={item.icon || "leaf-outline"}
                size={40}
                color={isDark ? "#C4D088" : ZEEVAN_GREEN.deep}
              />
              <Text style={[styles.cardTitle, styles.cardTitlePhone, { color: ink }]}>
                {item.title}
              </Text>
              <Text style={[styles.cardBody, { color: muted }]} numberOfLines={2}>
                {item.body}
              </Text>
            </View>
          ) : (
            <View key={item.key} style={[styles.card, isDark && styles.cardDark]}>
              <Image source={item.image} style={styles.icon} resizeMode="cover" />
              <Text style={[styles.cardTitle, { color: ink }]}>{item.title}</Text>
              <Text style={[styles.cardBody, { color: muted }]}>{item.body}</Text>
            </View>
          )
        )}
      </View>
    </View>
  );

  return (
    <SectionReveal preset="fade-up" style={styles.reveal}>
      {isMobileWeb ? (
        <View
          style={[styles.pad, styles.padPhone, { backgroundColor: isDark ? "#1A1712" : "#F3EDE0" }]}
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
  pad: { paddingVertical: spacing.lg + 4 },
  padPhone: { paddingVertical: spacing.lg, marginTop: spacing.sm },
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
    alignItems: "stretch",
    gap: 10,
    padding: 12,
    borderRadius: 14,
    backgroundColor: "rgba(255,253,248,0.96)",
    borderWidth: 1,
    borderColor: "rgba(26, 28, 20, 0.12)",
  },
  iconCardFlat: {
    flex: 0,
    flexBasis: "48%",
    width: "48%",
    maxWidth: "48%",
    alignItems: "center",
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 6,
  },
  cardDark: {
    backgroundColor: "rgba(255,255,255,0.08)",
    borderColor: "rgba(255,255,255,0.14)",
  },
  cardTitlePhone: {
    fontSize: 14,
    marginTop: 2,
  },
  icon: {
    width: "100%",
    height: 128,
    borderRadius: 10,
  },
  cardTitle: {
    fontFamily: fonts.bold,
    fontSize: 15,
    textAlign: "center",
  },
  cardBody: {
    fontFamily: fonts.regular,
    fontSize: 12.5,
    lineHeight: 18,
    textAlign: "center",
    paddingHorizontal: 2,
  },
});
