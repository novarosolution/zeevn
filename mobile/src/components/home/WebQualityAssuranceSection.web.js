import React from "react";
import { Image, Platform, StyleSheet, Text, View } from "react-native";
import { QUALITY_ASSURANCE_SECTION } from "../../content/qualityAssuranceContent";
import { WEB_HOME_PREMIUM } from "../../content/webHomeContent";
import { useKankregLayout } from "../../theme/kankregBreakpoints";
import { WP } from "../../theme/webPremium";
import { FONT_HEADING } from "../../theme/typographyRoles";
import { fonts, spacing } from "../../theme/tokens";
import { injectWebCssOnce } from "../../utils/injectWebCssOnce";
import SectionReveal from "../motion/SectionReveal";
import WebPhoneSnapCarousel from "./WebPhoneSnapCarousel";
import { WebSectionHead } from "./webPremiumParts";

const CARD_CSS_ID = "zeevan-quality-assurance-v2";
const CARD_CLASS = "zeevan-quality-card";
const PHOTO_CLASS = "zeevan-quality-photo";
const BODY_INK = "#3B4632";

injectWebCssOnce(
  CARD_CSS_ID,
  `.${CARD_CLASS} {
  transition: transform 0.5s ${WP.ease}, box-shadow 0.5s ease;
}
.${CARD_CLASS}:hover {
  transform: translateY(-8px);
  box-shadow: 0 34px 60px -28px rgba(0, 0, 0, 0.55);
}
.${PHOTO_CLASS} {
  transition: transform 1s ${WP.ease};
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

/** “Only Perfect Makes The Cut” — a deep-olive band of four quality cards (web only), the page's one dark break. */
export default function WebQualityAssuranceSection() {
  const { isMobileWeb, pageGutterClamp } = useKankregLayout();
  const copy = QUALITY_ASSURANCE_SECTION;

  const renderCard = (card) => (
    <View key={card.key} className={CARD_CLASS} style={[styles.card, isMobileWeb && styles.cardMobile]}>
      <View style={styles.copy}>
        <Text style={[styles.cardTitle, isMobileWeb && styles.cardTitleMobile]}>{card.title}</Text>
        <Text style={styles.cardBody}>{card.body}</Text>
      </View>
      <View style={styles.photoWrap}>
        <Image source={card.image} className={PHOTO_CLASS} style={styles.photo} resizeMode="cover" />
        {card.note ? <Text style={styles.note}>{card.note}</Text> : null}
      </View>
    </View>
  );

  return (
    <SectionReveal preset="fade-up" style={styles.reveal}>
      <View
        style={[styles.shell, isMobileWeb && styles.shellMobile]}
        accessibilityRole="region"
        accessibilityLabel={copy.title}
      >
        <View style={[styles.inner, { paddingHorizontal: pageGutterClamp }]}>
          {isMobileWeb ? (
            <Text style={styles.titleMobile}>{copy.title}</Text>
          ) : (
            <WebSectionHead align="center" onDark eyebrow={WEB_HOME_PREMIUM.quality.eyebrow} title={copy.title} />
          )}

          {isMobileWeb ? (
            <WebPhoneSnapCarousel
              items={copy.cards}
              keyExtractor={(c) => c.key}
              dotColor={WP.gold.bright}
              dotMuted="rgba(250,248,244,0.28)"
              renderItem={(card) => renderCard(card)}
            />
          ) : (
            <View style={styles.grid}>{copy.cards.map((card) => renderCard(card))}</View>
          )}
        </View>
      </View>
    </SectionReveal>
  );
}

const styles = StyleSheet.create({
  reveal: { width: "100%" },
  shell: {
    position: "relative",
    overflow: "hidden",
    paddingVertical: 96,
    alignSelf: "center",
    backgroundColor: "#1B2A18",
    ...Platform.select({
      web: {
        width: "100vw",
        maxWidth: "100vw",
        marginLeft: "calc(50% - 50vw)",
        marginRight: "calc(50% - 50vw)",
        backgroundImage:
          "radial-gradient(120% 90% at 50% 0%, #2B4125 0%, #1B2A18 52%, #131D11 100%)",
      },
      default: { width: "100%" },
    }),
  },
  shellMobile: { paddingVertical: spacing.xl },
  inner: {
    width: "100%",
    maxWidth: 1280,
    alignSelf: "center",
    gap: 56,
  },
  titleMobile: {
    fontFamily: FONT_HEADING,
    fontSize: 26,
    lineHeight: 32,
    letterSpacing: -0.4,
    textAlign: "center",
    color: WP.cream,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "nowrap",
    gap: 24,
    width: "100%",
  },
  card: {
    flex: 1,
    minWidth: 0,
    minHeight: 460,
    borderRadius: WP.radius.tile,
    overflow: "hidden",
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "rgba(250, 248, 244, 0.08)",
    ...Platform.select({
      web: {
        boxShadow: "0 30px 60px -34px rgba(0, 0, 0, 0.6)",
        cursor: "default",
        display: "flex",
        flexDirection: "column",
      },
      default: {},
    }),
  },
  cardMobile: { flex: 0, minHeight: 400, height: 400, width: "100%" },
  copy: {
    paddingTop: 28,
    paddingHorizontal: 24,
    paddingBottom: 18,
    gap: 10,
    flexGrow: 0,
  },
  cardTitle: {
    fontFamily: FONT_HEADING,
    fontSize: 21,
    lineHeight: 27,
    letterSpacing: -0.3,
    color: WP.green.ink,
  },
  cardTitleMobile: { fontSize: 20, lineHeight: 26 },
  cardBody: {
    fontFamily: fonts.regular,
    fontSize: 14.5,
    lineHeight: 22,
    color: BODY_INK,
  },
  photoWrap: {
    flex: 1,
    minHeight: 220,
    position: "relative",
    overflow: "hidden",
  },
  photo: {
    ...StyleSheet.absoluteFillObject,
    width: "100%",
    height: "100%",
  },
  note: {
    position: "absolute",
    left: 10,
    right: 10,
    bottom: 8,
    fontFamily: fonts.regular,
    fontSize: 10,
    lineHeight: 14,
    color: "#FFFFFF",
    textAlign: "center",
    textShadowColor: "rgba(0,0,0,0.55)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
});
