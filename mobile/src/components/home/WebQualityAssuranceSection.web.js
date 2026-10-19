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

const CARD_CSS_ID = "zeevan-quality-assurance-v3";
const CARD_CLASS = "zeevan-quality-panel";
const PHOTO_CLASS = "zeevan-quality-panel-img";
const ACTIVE_CLASS = "zeevan-quality-panel-active";
const BG_CLASS = "zeevan-quality-bg";

injectWebCssOnce(
  CARD_CSS_ID,
  `.${BG_CLASS} {
  animation: zeevan-quality-bg-drift 28s ease-in-out infinite alternate;
}
.${CARD_CLASS} {
  transition: transform 0.55s ${WP.ease}, box-shadow 0.55s ease, border-color 0.35s ease;
}
.${CARD_CLASS}:hover {
  transform: translateY(-10px) scale(1.015);
  box-shadow: 0 36px 64px -26px rgba(0, 0, 0, 0.65);
  border-color: rgba(241, 212, 147, 0.35);
}
.${PHOTO_CLASS} {
  transition: transform 1.15s ${WP.ease};
}
.${CARD_CLASS}:hover .${PHOTO_CLASS} {
  transform: scale(1.1);
}
.${CARD_CLASS} .zeevan-quality-gold {
  transition: width 0.45s ${WP.ease}, background-color 0.3s ease;
}
.${CARD_CLASS}:hover .zeevan-quality-gold {
  width: 44px;
  background-color: ${WP.gold.bright};
}
@keyframes zeevan-quality-bg-drift {
  from { transform: scale(1.02) translate3d(0, 0, 0); }
  to { transform: scale(1.08) translate3d(-1.5%, -1%, 0); }
}
@keyframes zeevan-quality-phone-in {
  from { opacity: 0; transform: translateY(18px) scale(0.97); }
  to { opacity: 1; transform: translateY(0) scale(1); }
}
@keyframes zeevan-quality-phone-glow {
  0%, 100% { box-shadow: 0 16px 36px -20px rgba(0, 0, 0, 0.55); }
  50% { box-shadow: 0 22px 44px -16px rgba(221, 174, 98, 0.45); }
}
.zeevan-quality-phone-card {
  animation: zeevan-quality-phone-in 0.65s ${WP.ease} both;
}
.${ACTIVE_CLASS} {
  animation: zeevan-quality-phone-in 0.65s ${WP.ease} both, zeevan-quality-phone-glow 2.8s ease-in-out infinite;
  border-color: rgba(241, 212, 147, 0.42) !important;
}
@media (prefers-reduced-motion: reduce) {
  .${BG_CLASS}, .${CARD_CLASS}, .${PHOTO_CLASS}, .zeevan-quality-gold { transition: none !important; animation: none !important; }
  .${CARD_CLASS}:hover { transform: none; }
  .${CARD_CLASS}:hover .${PHOTO_CLASS} { transform: none; }
  .zeevan-quality-phone-card, .${ACTIVE_CLASS} { animation: none !important; }
}`
);

function QualityPanel({ card, mobile, active, delayMs = 0 }) {
  return (
    <View
      className={[
        CARD_CLASS,
        mobile ? "zeevan-quality-phone-card" : "",
        mobile && active ? ACTIVE_CLASS : "",
      ]
        .filter(Boolean)
        .join(" ")}
      style={[
        styles.panel,
        mobile && styles.panelMobile,
        mobile && Platform.OS === "web" ? { animationDelay: `${delayMs}ms` } : null,
      ]}
      accessibilityRole="summary"
      accessibilityLabel={`${card.title}. ${card.body}`}
    >
      <Image source={card.image} className={PHOTO_CLASS} style={styles.panelImg} resizeMode="cover" />
      <View style={styles.scrim} pointerEvents="none" />
      <View style={[styles.copy, mobile && styles.copyMobile]}>
        <View className="zeevan-quality-gold" style={styles.goldRule} />
        <Text style={[styles.panelTitle, mobile && styles.panelTitleMobile]} numberOfLines={2}>
          {card.title}
        </Text>
        <Text style={[styles.panelBody, mobile && styles.panelBodyMobile]} numberOfLines={3}>
          {card.body}
        </Text>
        {card.note ? <Text style={styles.note}>{card.note}</Text> : null}
      </View>
    </View>
  );
}

/** Quality band — premium photo panels over a generated dark atmospheric background. */
export default function WebQualityAssuranceSection() {
  const { isMobileWeb, pageGutterClamp } = useKankregLayout();
  const copy = QUALITY_ASSURANCE_SECTION;

  return (
    <SectionReveal preset="fade-up" style={styles.reveal}>
      <View
        style={[styles.shell, isMobileWeb && styles.shellMobile]}
        accessibilityRole="region"
        accessibilityLabel={copy.title}
      >
        <Image
          source={copy.background}
          className={BG_CLASS}
          style={styles.bgImg}
          resizeMode="cover"
          accessibilityElementsHidden
          importantForAccessibility="no"
        />
        <View style={styles.bgScrim} pointerEvents="none" />

        <View style={[styles.inner, { paddingHorizontal: isMobileWeb ? 0 : pageGutterClamp }]}>
          <View style={{ paddingHorizontal: isMobileWeb ? pageGutterClamp : 0 }}>
            {isMobileWeb ? (
              <Text style={styles.titleMobile}>{copy.title}</Text>
            ) : (
              <WebSectionHead align="center" onDark eyebrow={WEB_HOME_PREMIUM.quality.eyebrow} title={copy.title} />
            )}
          </View>

          {isMobileWeb ? (
            <WebPhoneSnapCarousel
              items={copy.cards}
              keyExtractor={(c) => c.key}
              dotColor={WP.gold.bright}
              dotMuted="rgba(250,248,244,0.28)"
              renderItem={(card, { index, active }) => (
                <QualityPanel card={card} mobile active={active} delayMs={index * 90} />
              )}
            />
          ) : (
            <View style={styles.grid}>
              {copy.cards.map((card, i) => (
                <SectionReveal key={card.key} index={i} preset="fade-up" style={styles.gridCell}>
                  <QualityPanel card={card} />
                </SectionReveal>
              ))}
            </View>
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
    backgroundColor: "#12180F",
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
  shellMobile: { paddingVertical: spacing.xl },
  bgImg: {
    ...StyleSheet.absoluteFillObject,
    width: "100%",
    height: "100%",
  },
  bgScrim: {
    ...StyleSheet.absoluteFillObject,
    ...Platform.select({
      web: {
        backgroundImage:
          "linear-gradient(180deg, rgba(12,18,10,0.55) 0%, rgba(12,18,10,0.72) 45%, rgba(12,18,10,0.88) 100%)",
      },
      default: { backgroundColor: "rgba(12,18,10,0.72)" },
    }),
  },
  inner: {
    width: "100%",
    maxWidth: 1280,
    alignSelf: "center",
    gap: 48,
    zIndex: 1,
  },
  titleMobile: {
    fontFamily: FONT_HEADING,
    fontSize: 26,
    lineHeight: 32,
    letterSpacing: -0.4,
    textAlign: "center",
    color: WP.cream,
    marginBottom: 4,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "nowrap",
    gap: 16,
    width: "100%",
  },
  gridCell: { flex: 1, minWidth: 0 },
  panel: {
    flex: 1,
    minWidth: 0,
    aspectRatio: 0.72,
    minHeight: 420,
    borderRadius: 22,
    overflow: "hidden",
    position: "relative",
    justifyContent: "flex-end",
    backgroundColor: "#1A1208",
    borderWidth: 1,
    borderColor: "rgba(250, 248, 244, 0.1)",
    ...Platform.select({
      web: {
        boxShadow: "0 28px 52px -30px rgba(0, 0, 0, 0.6)",
        cursor: "default",
      },
      default: {},
    }),
  },
  panelMobile: {
    flex: 0,
    width: "100%",
    minHeight: 380,
    height: 380,
    aspectRatio: undefined,
    borderRadius: 18,
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
          "linear-gradient(180deg, rgba(10,14,8,0.05) 0%, rgba(10,14,8,0.2) 36%, rgba(10,14,8,0.78) 70%, rgba(10,14,8,0.94) 100%)",
      },
      default: { backgroundColor: "rgba(10,14,8,0.6)" },
    }),
  },
  copy: {
    zIndex: 2,
    paddingHorizontal: 20,
    paddingBottom: 22,
    paddingTop: 56,
    gap: 8,
  },
  copyMobile: {
    paddingHorizontal: 18,
    paddingBottom: 18,
    paddingTop: 48,
    gap: 6,
  },
  goldRule: {
    width: 28,
    height: 1.5,
    backgroundColor: WP.gold.base,
    marginBottom: 4,
  },
  panelTitle: {
    fontFamily: FONT_HEADING,
    fontSize: 22,
    lineHeight: 27,
    letterSpacing: -0.35,
    color: WP.cream,
  },
  panelTitleMobile: { fontSize: 21, lineHeight: 26 },
  panelBody: {
    fontFamily: fonts.regular,
    fontSize: 14,
    lineHeight: 21,
    color: "rgba(250, 248, 244, 0.88)",
  },
  panelBodyMobile: { fontSize: 13.5, lineHeight: 20 },
  note: {
    marginTop: 4,
    fontFamily: fonts.regular,
    fontSize: 10,
    lineHeight: 14,
    color: "rgba(250, 248, 244, 0.55)",
  },
});
