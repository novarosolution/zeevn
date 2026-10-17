import React from "react";
import { Image, Platform, StyleSheet, Text, View } from "react-native";
import { QUALITY_ASSURANCE_SECTION } from "../../content/qualityAssuranceContent";
import { useTheme } from "../../context/ThemeContext";
import { useKankregLayout } from "../../theme/kankregBreakpoints";
import { KANKREG_PALETTE } from "../../theme/kankregWeb";
import { FONT_HEADING } from "../../theme/typographyRoles";
import { fonts, spacing } from "../../theme/tokens";
import { injectWebCssOnce } from "../../utils/injectWebCssOnce";
import SectionReveal from "../motion/SectionReveal";

const CARD_CSS_ID = "zeevan-quality-assurance-v1";
const CARD_CLASS = "zeevan-quality-card";
const PHOTO_CLASS = "zeevan-quality-photo";
const TEAL = "#0D4F4F";
const TEAL_BODY = "rgba(13, 79, 79, 0.72)";
const SHELL_BG = "#E8F4F8";

injectWebCssOnce(
  CARD_CSS_ID,
  `.${CARD_CLASS} {
  transition: transform 0.4s cubic-bezier(0.22, 1, 0.36, 1), box-shadow 0.4s ease;
}
.${CARD_CLASS}:hover {
  transform: translateY(-6px);
  box-shadow: 0 28px 52px -28px rgba(13, 79, 79, 0.28);
}
.${PHOTO_CLASS} {
  transition: transform 0.7s cubic-bezier(0.22, 1, 0.36, 1);
}
.${CARD_CLASS}:hover .${PHOTO_CLASS} {
  transform: scale(1.04);
}
@media (prefers-reduced-motion: reduce) {
  .${CARD_CLASS}, .${PHOTO_CLASS} { transition: none !important; }
  .${CARD_CLASS}:hover { transform: none; }
  .${CARD_CLASS}:hover .${PHOTO_CLASS} { transform: none; }
}`
);

/** Premium “Only Perfect Makes The Cut” quality strip — four cards (web only). */
export default function WebQualityAssuranceSection() {
  const { isDark } = useTheme();
  const { isMobileWeb, pageGutterClamp } = useKankregLayout();
  const copy = QUALITY_ASSURANCE_SECTION;
  const titleColor = isDark ? KANKREG_PALETTE.goldBright : TEAL;

  return (
    <SectionReveal preset="fade-up" style={styles.reveal}>
      <View
        style={[styles.shell, isDark && styles.shellDark]}
        accessibilityRole="region"
        accessibilityLabel={copy.title}
      >
        <Image source={copy.background} style={styles.bgPattern} resizeMode="cover" />
        <View style={[styles.inner, { paddingHorizontal: pageGutterClamp }]}>
          <Text style={[styles.title, { color: titleColor }, isMobileWeb && styles.titleMobile]}>
            {copy.title}
          </Text>

          <View style={[styles.grid, isMobileWeb && styles.gridMobile]}>
            {copy.cards.map((card) => (
              <View
                key={card.key}
                className={CARD_CLASS}
                style={[styles.card, isMobileWeb && styles.cardMobile, isDark && styles.cardDark]}
              >
                <View style={styles.copy}>
                  <Text style={[styles.cardTitle, isDark && styles.cardTitleDark]}>{card.title}</Text>
                  <Text style={[styles.cardBody, isDark && styles.cardBodyDark]}>{card.body}</Text>
                </View>
                <View style={styles.photoWrap}>
                  <Image
                    source={card.image}
                    className={PHOTO_CLASS}
                    style={styles.photo}
                    resizeMode="cover"
                  />
                  {card.note ? <Text style={styles.note}>{card.note}</Text> : null}
                </View>
              </View>
            ))}
          </View>
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
    backgroundColor: SHELL_BG,
    paddingTop: spacing.xxl,
    paddingBottom: spacing.xxl + 8,
    alignSelf: "center",
    ...Platform.select({
      web: {
        width: "100vw",
        maxWidth: "100vw",
        marginLeft: "calc(50% - 50vw)",
        marginRight: "calc(50% - 50vw)",
      },
      default: { width: "100%" },
    }),
  },
  shellDark: { backgroundColor: "#121c1e" },
  bgPattern: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.35,
  },
  inner: {
    width: "100%",
    maxWidth: 1280,
    alignSelf: "center",
    gap: spacing.xl,
    zIndex: 1,
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
  titleMobile: { fontSize: 28, lineHeight: 34 },
  grid: {
    flexDirection: "row",
    flexWrap: "nowrap",
    gap: 16,
    width: "100%",
  },
  gridMobile: { flexDirection: "column" },
  card: {
    flex: 1,
    minWidth: 0,
    minHeight: 440,
    borderRadius: 18,
    overflow: "hidden",
    backgroundColor: "#FAF8F4",
    ...Platform.select({
      web: {
        boxShadow: "0 16px 36px -22px rgba(13, 79, 79, 0.22)",
        cursor: "default",
        display: "flex",
        flexDirection: "column",
      },
      default: {},
    }),
  },
  cardDark: { backgroundColor: "#1c2426" },
  cardMobile: { minHeight: 300, width: "100%" },
  copy: {
    paddingTop: 22,
    paddingHorizontal: 18,
    paddingBottom: 14,
    gap: 8,
    flexGrow: 0,
  },
  cardTitle: {
    fontFamily: FONT_HEADING,
    fontSize: 18,
    lineHeight: 24,
    letterSpacing: -0.2,
    color: TEAL,
  },
  cardTitleDark: { color: KANKREG_PALETTE.goldBright },
  cardBody: {
    fontFamily: fonts.regular,
    fontSize: 13,
    lineHeight: 19,
    color: TEAL_BODY,
  },
  cardBodyDark: { color: "rgba(250, 248, 244, 0.72)" },
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
    color: "rgba(255,255,255,0.85)",
    textAlign: "center",
    textShadowColor: "rgba(0,0,0,0.45)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
});
