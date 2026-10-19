import React from "react";
import { Image, Platform, StyleSheet, Text, View } from "react-native";
import { NATIVE_INGREDIENTS_SECTION } from "../../content/nativeIngredientsContent";
import { WEB_HOME_PREMIUM } from "../../content/webHomeContent";
import { useTheme } from "../../context/ThemeContext";
import { useKankregLayout } from "../../theme/kankregBreakpoints";
import { WP } from "../../theme/webPremium";
import { FONT_HEADING } from "../../theme/typographyRoles";
import { fonts, spacing } from "../../theme/tokens";
import { injectWebCssOnce } from "../../utils/injectWebCssOnce";
import SectionReveal from "../motion/SectionReveal";
import WebSectionBackdrop from "./WebSectionBackdrop";
import WebPhoneSnapCarousel from "./WebPhoneSnapCarousel";
import { WebSectionHead } from "./webPremiumParts";

const CARD_CSS_ID = "zeevan-native-ingredients-v3";
const CARD_CLASS = "zeevan-native-panel";
const PHOTO_CLASS = "zeevan-native-panel-img";
const ACTIVE_CLASS = "zeevan-native-panel-active";

injectWebCssOnce(
  CARD_CSS_ID,
  `.${CARD_CLASS} {
  transition: transform 0.55s ${WP.ease}, box-shadow 0.55s ease, border-color 0.35s ease;
}
.${CARD_CLASS}:hover {
  transform: translateY(-10px) scale(1.015);
  box-shadow: 0 34px 58px -26px rgba(36, 68, 36, 0.42);
  border-color: rgba(184, 136, 76, 0.4);
}
.${PHOTO_CLASS} {
  transition: transform 1.15s ${WP.ease};
}
.${CARD_CLASS}:hover .${PHOTO_CLASS} {
  transform: scale(1.1);
}
.${CARD_CLASS} .zeevan-native-gold {
  transition: width 0.45s ${WP.ease}, background-color 0.3s ease;
}
.${CARD_CLASS}:hover .zeevan-native-gold {
  width: 44px;
  background-color: ${WP.gold.bright};
}
.${CARD_CLASS} .zeevan-native-copy {
  transition: transform 0.45s ${WP.ease};
}
.${CARD_CLASS}:hover .zeevan-native-copy {
  transform: translateY(-4px);
}
@keyframes zeevan-native-phone-in {
  from { opacity: 0; transform: translateY(18px) scale(0.97); }
  to { opacity: 1; transform: translateY(0) scale(1); }
}
@keyframes zeevan-native-phone-glow {
  0%, 100% { box-shadow: 0 16px 36px -20px rgba(36, 68, 36, 0.35); }
  50% { box-shadow: 0 22px 44px -16px rgba(184, 136, 76, 0.4); }
}
.zeevan-native-phone-card {
  animation: zeevan-native-phone-in 0.65s ${WP.ease} both;
}
.${ACTIVE_CLASS} {
  animation: zeevan-native-phone-in 0.65s ${WP.ease} both, zeevan-native-phone-glow 2.8s ease-in-out infinite;
  border-color: rgba(184, 136, 76, 0.45) !important;
}
@media (prefers-reduced-motion: reduce) {
  .${CARD_CLASS}, .${PHOTO_CLASS}, .zeevan-native-gold, .zeevan-native-copy { transition: none !important; animation: none !important; }
  .${CARD_CLASS}:hover { transform: none; }
  .${CARD_CLASS}:hover .${PHOTO_CLASS} { transform: none; }
  .${CARD_CLASS}:hover .zeevan-native-copy { transform: none; }
  .zeevan-native-phone-card, .${ACTIVE_CLASS} { animation: none !important; }
}`
);

function NativePanel({ card, mobile, active, delayMs = 0 }) {
  return (
    <View
      className={[
        CARD_CLASS,
        mobile ? "zeevan-native-phone-card" : "",
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
      <View className="zeevan-native-copy" style={[styles.copy, mobile && styles.copyMobile]}>
        <View className="zeevan-native-gold" style={styles.goldRule} />
        <Text style={[styles.panelTitle, mobile && styles.panelTitleMobile]} numberOfLines={2}>
          {card.title}
        </Text>
        <Text style={[styles.panelBody, mobile && styles.panelBodyMobile]} numberOfLines={3}>
          {card.body}
        </Text>
      </View>
    </View>
  );
}

/** Native ingredients — bottom-anchored type on photography, premium hover + phone motion. */
export default function WebNativeIngredientsSection() {
  const { isDark } = useTheme();
  const { isMobileWeb, pageGutterClamp } = useKankregLayout();
  const copy = NATIVE_INGREDIENTS_SECTION;

  return (
    <SectionReveal preset="fade-up" style={styles.reveal}>
      <WebSectionBackdrop
        source={copy.background}
        tone="warm"
        isDark={isDark}
        accessibilityLabel={copy.title}
        style={[styles.pad, isMobileWeb && styles.padMobile]}
      >
        <View
          style={[
            styles.inner,
            isMobileWeb && styles.innerMobile,
            !isMobileWeb && { paddingHorizontal: pageGutterClamp },
          ]}
        >
          {isMobileWeb ? (
            <Text
              style={[
                styles.titleMobile,
                { color: isDark ? WP.cream : WP.green.deep, paddingHorizontal: pageGutterClamp },
              ]}
            >
              {copy.title}
            </Text>
          ) : (
            <WebSectionHead align="center" eyebrow={WEB_HOME_PREMIUM.ingredients.eyebrow} title={copy.title} />
          )}

          {isMobileWeb ? (
            <WebPhoneSnapCarousel
              items={copy.cards}
              keyExtractor={(c) => c.key}
              dotColor={WP.gold.deep}
              dotMuted="rgba(92,58,26,0.22)"
              renderItem={(card, { index, active }) => (
                <NativePanel card={card} mobile active={active} delayMs={index * 90} />
              )}
            />
          ) : (
            <View style={styles.grid}>
              {copy.cards.map((card, i) => (
                <SectionReveal key={card.key} index={i} preset="fade-up" style={styles.gridCell}>
                  <NativePanel card={card} />
                </SectionReveal>
              ))}
            </View>
          )}
        </View>
      </WebSectionBackdrop>
    </SectionReveal>
  );
}

const styles = StyleSheet.create({
  reveal: { width: "100%" },
  pad: { paddingTop: 88, paddingBottom: 88 },
  padMobile: {
    paddingTop: spacing.lg + 4,
    paddingBottom: spacing.lg + 4,
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
    borderColor: "rgba(36, 68, 36, 0.12)",
    ...Platform.select({
      web: {
        boxShadow: "0 18px 40px -24px rgba(36, 68, 36, 0.28)",
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
          "linear-gradient(180deg, rgba(14,16,10,0.06) 0%, rgba(14,16,10,0.18) 36%, rgba(14,16,10,0.78) 70%, rgba(14,16,10,0.94) 100%)",
      },
      default: { backgroundColor: "rgba(14,16,10,0.55)" },
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
});
