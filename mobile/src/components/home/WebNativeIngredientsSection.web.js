import React from "react";
import { Image, Platform, StyleSheet, Text, View } from "react-native";
import { NATIVE_INGREDIENTS_SECTION } from "../../content/nativeIngredientsContent";
import { useTheme } from "../../context/ThemeContext";
import { useKankregLayout } from "../../theme/kankregBreakpoints";
import { KANKREG_PALETTE, ZEEVAN_GREEN } from "../../theme/kankregWeb";
import { FONT_HEADING } from "../../theme/typographyRoles";
import { fonts, spacing } from "../../theme/tokens";
import { injectWebCssOnce } from "../../utils/injectWebCssOnce";
import SectionReveal from "../motion/SectionReveal";
import WebSectionBackdrop from "./WebSectionBackdrop";

const CARD_CSS_ID = "zeevan-native-ingredients-v2";
const CARD_CLASS = "zeevan-native-card";
const PHOTO_CLASS = "zeevan-native-photo";
const TITLE_INK = "#5C3A1A";

injectWebCssOnce(
  CARD_CSS_ID,
  `.${CARD_CLASS} {
  transition: transform 0.4s cubic-bezier(0.22, 1, 0.36, 1), box-shadow 0.4s ease;
}
.${CARD_CLASS}:hover {
  transform: translateY(-6px);
  box-shadow: 0 28px 52px -28px rgba(36, 68, 36, 0.32);
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

/**
 * Premium “Native Ingredients” value strip — four image cards (web only).
 */
export default function WebNativeIngredientsSection() {
  const { isDark } = useTheme();
  const { isMobileWeb, pageGutterClamp } = useKankregLayout();
  const copy = NATIVE_INGREDIENTS_SECTION;
  const titleColor = isDark ? KANKREG_PALETTE.goldBright : TITLE_INK;

  return (
    <SectionReveal preset="fade-up" style={styles.reveal}>
      <WebSectionBackdrop
        source={copy.background}
        tone="warm"
        isDark={isDark}
        accessibilityLabel={copy.title}
        style={styles.pad}
      >
        <View style={[styles.inner, { paddingHorizontal: pageGutterClamp }]}>
          <Text style={[styles.title, { color: titleColor }, isMobileWeb && styles.titleMobile]}>
            {copy.title}
          </Text>

          <View style={[styles.grid, isMobileWeb && styles.gridMobile]}>
            {copy.cards.map((card) => {
              const light = card.tone === "light";
              return (
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
                  <View
                    style={[styles.scrim, light ? styles.scrimLight : styles.scrimDark]}
                    pointerEvents="none"
                  />
                  <View style={styles.copy}>
                    <Text
                      style={[
                        styles.cardTitle,
                        { color: light ? ZEEVAN_GREEN.deep : "#FAF8F4" },
                      ]}
                    >
                      {card.title}
                    </Text>
                    <Text
                      style={[
                        styles.cardBody,
                        {
                          color: light ? "#2A3A1A" : "rgba(250, 248, 244, 0.94)",
                        },
                      ]}
                    >
                      {card.body}
                    </Text>
                  </View>
                </View>
              );
            })}
          </View>
        </View>
      </WebSectionBackdrop>
    </SectionReveal>
  );
}

const styles = StyleSheet.create({
  reveal: { width: "100%" },
  pad: {
    paddingTop: spacing.xxl,
    paddingBottom: spacing.xxl + 8,
  },
  inner: {
    width: "100%",
    maxWidth: 1280,
    alignSelf: "center",
    gap: spacing.xl,
  },
  title: {
    fontFamily: FONT_HEADING,
    fontSize: 36,
    lineHeight: 44,
    letterSpacing: -0.4,
    textAlign: "center",
    alignSelf: "center",
    maxWidth: 720,
  },
  titleMobile: {
    fontSize: 28,
    lineHeight: 34,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "nowrap",
    gap: 16,
    width: "100%",
  },
  gridMobile: {
    flexDirection: "column",
  },
  card: {
    flex: 1,
    minWidth: 0,
    minHeight: 420,
    borderRadius: 18,
    overflow: "hidden",
    position: "relative",
    ...Platform.select({
      web: {
        boxShadow: "0 18px 40px -24px rgba(36, 68, 36, 0.28)",
        cursor: "default",
      },
      default: {},
    }),
  },
  cardMobile: {
    minHeight: 360,
    width: "100%",
  },
  photo: {
    ...StyleSheet.absoluteFillObject,
    width: "100%",
    height: "100%",
  },
  scrim: {
    ...StyleSheet.absoluteFillObject,
  },
  /** Stronger wash so green ink stays readable on bright photos. */
  scrimLight: {
    ...Platform.select({
      web: {
        backgroundImage:
          "linear-gradient(180deg, rgba(252,248,240,0.92) 0%, rgba(252,248,240,0.55) 38%, rgba(18,16,12,0.28) 100%)",
      },
      default: { backgroundColor: "rgba(252,248,240,0.55)" },
    }),
  },
  scrimDark: {
    ...Platform.select({
      web: {
        backgroundImage:
          "linear-gradient(180deg, rgba(12,10,8,0.78) 0%, rgba(12,10,8,0.42) 42%, rgba(12,10,8,0.55) 100%)",
      },
      default: { backgroundColor: "rgba(12,10,8,0.55)" },
    }),
  },
  copy: {
    position: "relative",
    zIndex: 2,
    paddingTop: 22,
    paddingHorizontal: 18,
    gap: 8,
  },
  cardTitle: {
    fontFamily: FONT_HEADING,
    fontSize: 18,
    lineHeight: 24,
    letterSpacing: -0.2,
  },
  cardBody: {
    fontFamily: fonts.regular,
    fontSize: 13,
    lineHeight: 19,
  },
});
