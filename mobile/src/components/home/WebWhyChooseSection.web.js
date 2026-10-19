import React from "react";
import { Image, Platform, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { WHY_CHOOSE_SECTION } from "../../content/whyChooseContent";
import { useTheme } from "../../context/ThemeContext";
import { useKankregLayout } from "../../theme/kankregBreakpoints";
import { WP } from "../../theme/webPremium";
import { FONT_HEADING } from "../../theme/typographyRoles";
import { fonts, spacing } from "../../theme/tokens";
import SectionReveal from "../motion/SectionReveal";
import WebSectionBackdrop from "./WebSectionBackdrop";
import { WebSectionHead } from "./webPremiumParts";

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
    <View style={[styles.inner, isMobileWeb && styles.innerMobile, { paddingHorizontal: pageGutterClamp }]}>
      {isMobileWeb ? (
        <Text style={[styles.titleMobile, { color: isDark ? ink : WP.green.deep }]}>Why choose Zeevan?</Text>
      ) : (
        <WebSectionHead align="center" eyebrow={copy.eyebrow} title={copy.title} />
      )}
      <View style={[styles.grid, isMobileWeb && styles.gridMobile]}>
        {copy.items.map((item) =>
          isMobileWeb ? (
            <View key={item.key} style={styles.iconCardFlat}>
              <Ionicons name={item.icon || "leaf-outline"} size={52} color={isDark ? "#C4D088" : WP.green.deep} />
              <Text style={[styles.cardTitle, styles.cardTitlePhone, { color: ink }]}>{item.title}</Text>
              <Text style={[styles.cardBody, styles.cardBodyPhone, { color: muted }]}>{item.body}</Text>
            </View>
          ) : (
            <View key={item.key} className="zv-tile" style={[styles.card, isDark && styles.cardDark]}>
              <View style={styles.photo}>
                <Image source={item.image} className="zv-tile-img" style={styles.photoImg} resizeMode="cover" />
              </View>
              <View style={styles.cardCopy}>
                <Text style={[styles.cardTitle, { color: ink }]}>{item.title}</Text>
                <Text style={[styles.cardBody, { color: muted }]}>{item.body}</Text>
              </View>
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
    borderRadius: 18,
    marginHorizontal: 0,
  },
  inner: {
    width: "100%",
    maxWidth: 1280,
    alignSelf: "center",
    gap: 48,
  },
  innerMobile: { gap: spacing.md },
  titleMobile: {
    fontFamily: FONT_HEADING,
    fontSize: 24,
    lineHeight: 30,
    textAlign: "center",
    marginBottom: 8,
  },
  grid: {
    flexDirection: "row",
    gap: 24,
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
    padding: 14,
    borderRadius: WP.radius.tile,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "rgba(36, 68, 36, 0.08)",
    ...Platform.select({ web: { boxShadow: WP.shadow.card, cursor: "default" }, default: {} }),
  },
  cardDark: {
    backgroundColor: "rgba(255,255,255,0.06)",
    borderColor: "rgba(255,255,255,0.14)",
  },
  photo: {
    width: "100%",
    aspectRatio: 1.25,
    borderRadius: 16,
    overflow: "hidden",
  },
  photoImg: { width: "100%", height: "100%" },
  cardCopy: { gap: 8, paddingHorizontal: 8, paddingTop: 20, paddingBottom: 10 },
  iconCardFlat: {
    flex: 0,
    flexBasis: "48%",
    width: "48%",
    maxWidth: "48%",
    alignItems: "center",
    gap: 10,
    paddingVertical: 14,
    paddingHorizontal: 6,
  },
  cardTitlePhone: {
    fontFamily: fonts.bold,
    fontSize: 15,
    lineHeight: 20,
    letterSpacing: 0,
    marginTop: 4,
    textAlign: "center",
  },
  cardBodyPhone: {
    fontSize: 12.5,
    lineHeight: 18,
    textAlign: "center",
    paddingHorizontal: 2,
  },
  cardTitle: {
    fontFamily: FONT_HEADING,
    fontSize: 22,
    lineHeight: 27,
    letterSpacing: -0.3,
  },
  cardBody: {
    fontFamily: fonts.regular,
    fontSize: 15,
    lineHeight: 23,
  },
});
