import React from "react";
import { Image, Platform, StyleSheet, Text, View } from "react-native";
import { PRODUCT_ATELIER_SECTION } from "../../content/productAtelierContent";
import { useTheme } from "../../context/ThemeContext";
import { useKankregLayout } from "../../theme/kankregBreakpoints";
import { ZEEVAN_GREEN } from "../../theme/kankregWeb";
import { FONT_HEADING } from "../../theme/typographyRoles";
import { fonts, spacing } from "../../theme/tokens";
import { injectWebCssOnce } from "../../utils/injectWebCssOnce";
import SectionReveal from "../motion/SectionReveal";

const CSS_ID = "zeevan-pdp-atelier-v1";
const CARD_CLASS = "zeevan-pdp-atelier-card";
const PHOTO_CLASS = "zeevan-pdp-atelier-photo";

injectWebCssOnce(
  CSS_ID,
  `.${CARD_CLASS} {
  transition: transform 0.4s cubic-bezier(0.22, 1, 0.36, 1), box-shadow 0.4s ease;
}
.${CARD_CLASS}:hover {
  transform: translateY(-5px);
  box-shadow: 0 24px 48px -26px rgba(36, 68, 36, 0.3);
}
.${PHOTO_CLASS} {
  transition: transform 0.7s cubic-bezier(0.22, 1, 0.36, 1);
}
.${CARD_CLASS}:hover .${PHOTO_CLASS} {
  transform: scale(1.05);
}
@media (prefers-reduced-motion: reduce) {
  .${CARD_CLASS}, .${PHOTO_CLASS} { transition: none !important; }
  .${CARD_CLASS}:hover { transform: none; }
  .${CARD_CLASS}:hover .${PHOTO_CLASS} { transform: none; }
}`
);

/** Premium 3-card craft story + lifestyle still for web PDP. */
export default function WebProductAtelierBand() {
  const { isDark } = useTheme();
  const { isMobileWeb } = useKankregLayout();
  const copy = PRODUCT_ATELIER_SECTION;
  const ink = isDark ? "#FAF8F4" : ZEEVAN_GREEN.deep;

  return (
    <SectionReveal immediate delay={220} preset="fade-up" style={styles.reveal}>
      <View
        style={[styles.shell, isDark && styles.shellDark]}
        accessibilityRole="region"
        accessibilityLabel={copy.title}
      >
        <Text style={[styles.eyebrow, { color: ZEEVAN_GREEN.base }]}>{copy.eyebrow}</Text>
        <Text style={[styles.title, { color: ink }, isMobileWeb && styles.titleMobile]}>
          {copy.title}
        </Text>

        <View style={[styles.grid, isMobileWeb && styles.gridMobile]}>
          {copy.cards.map((card) => (
            <View
              key={card.key}
              className={CARD_CLASS}
              style={[styles.card, isMobileWeb && styles.cardMobile]}
            >
              <Image
                source={card.image}
                className={PHOTO_CLASS}
                style={styles.photo}
                resizeMode="cover"
              />
              <View style={styles.scrim} pointerEvents="none" />
              <View style={styles.copy}>
                <Text style={styles.cardTitle}>{card.title}</Text>
                <Text style={styles.cardBody}>{card.body}</Text>
              </View>
            </View>
          ))}
        </View>

      </View>
    </SectionReveal>
  );
}

const styles = StyleSheet.create({
  reveal: { width: "100%" },
  shell: {
    width: "100%",
    gap: spacing.md,
    paddingVertical: spacing.lg,
  },
  shellDark: {},
  eyebrow: {
    fontFamily: fonts.semibold,
    fontSize: 11,
    letterSpacing: 1.8,
    textTransform: "uppercase",
    textAlign: "center",
  },
  title: {
    fontFamily: FONT_HEADING,
    fontSize: 30,
    lineHeight: 36,
    letterSpacing: -0.35,
    textAlign: "center",
    marginBottom: 4,
  },
  titleMobile: { fontSize: 24, lineHeight: 30 },
  grid: {
    flexDirection: "row",
    gap: 14,
    width: "100%",
  },
  gridMobile: { flexDirection: "column" },
  card: {
    flex: 1,
    minWidth: 0,
    minHeight: 340,
    borderRadius: 16,
    overflow: "hidden",
    position: "relative",
    ...Platform.select({
      web: {
        boxShadow: "0 16px 36px -22px rgba(36, 68, 36, 0.26)",
        cursor: "default",
      },
      default: {},
    }),
  },
  cardMobile: { minHeight: 300, width: "100%" },
  photo: {
    ...StyleSheet.absoluteFillObject,
    width: "100%",
    height: "100%",
  },
  scrim: {
    ...StyleSheet.absoluteFillObject,
    ...Platform.select({
      web: {
        backgroundImage:
          "linear-gradient(180deg, rgba(18,16,12,0.55) 0%, rgba(18,16,12,0.15) 45%, rgba(18,16,12,0.4) 100%)",
      },
      default: { backgroundColor: "rgba(18,16,12,0.35)" },
    }),
  },
  copy: {
    position: "relative",
    zIndex: 2,
    paddingTop: 20,
    paddingHorizontal: 16,
    paddingBottom: 16,
    gap: 6,
  },
  cardTitle: {
    fontFamily: fonts.bold,
    fontSize: 16,
    lineHeight: 22,
    color: "#FAF8F4",
  },
  cardBody: {
    fontFamily: fonts.regular,
    fontSize: 13,
    lineHeight: 18,
    color: "rgba(250,248,244,0.88)",
  },
});
