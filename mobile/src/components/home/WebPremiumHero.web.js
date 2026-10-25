import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import SectionReveal from "../motion/SectionReveal";
import { HOME_SCREEN_UI, HOME_TRUST_STRIP } from "../../content/appContent";
import { HOME_HERO_PACKAGING } from "../../content/homeHeroContent";
import { WEB_HOME_PREMIUM } from "../../content/webHomeContent";
import { resolveWebHomeHeroSlides } from "../../utils/homeHeroSlides";
import { HtmlImg, toImageSrc } from "./compareWebDom";
import { useKankregLayout } from "../../theme/kankregBreakpoints";
import { WP, webHeroSize } from "../../theme/webPremium";
import { FONT_HEADING } from "../../theme/typographyRoles";
import { fonts } from "../../theme/tokens";
import useReducedMotion from "../../hooks/useReducedMotion";
import { injectWebCssOnce } from "../../utils/injectWebCssOnce";
import { ensureWebPremiumCss } from "../../utils/webPremiumCss";

const HERO_CSS_ID = "zeevan-atelier-hero-v2";
const HERO_STAGE_CLASS = "zeevan-atelier-hero-stage";
const HERO_MEDIA_CLASS = "zeevan-atelier-hero-media";
const SLIDE_MS = 6500;
const BAR_HEIGHT = 68;

if (Platform.OS === "web") {
  ensureWebPremiumCss();
  injectWebCssOnce(
    HERO_CSS_ID,
    `.${HERO_STAGE_CLASS} {
  position: relative;
  overflow: hidden;
}
.${HERO_MEDIA_CLASS} {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center center;
  transition: opacity 1s cubic-bezier(0.22, 1, 0.36, 1), transform 9s linear;
  will-change: opacity, transform;
}
.${HERO_STAGE_CLASS} .${HERO_MEDIA_CLASS}[data-active="1"] {
  transform: scale(1.07);
}
.${HERO_STAGE_CLASS} .${HERO_MEDIA_CLASS}[data-active="0"] {
  transform: scale(1);
}
@media (prefers-reduced-motion: reduce) {
  .${HERO_MEDIA_CLASS} { transition: opacity 0.2s ease !important; transform: none !important; }
}`
  );
}

function shopParamsForSlide(slide) {
  const pill = String(slide?.shopPill || "").trim();
  if (pill) return { category: pill, pill };
  const id = String(slide?.id || "").toLowerCase();
  if (id.includes("tel")) return { category: "Oil", pill: "Oil" };
  if (id.includes("masala")) return { category: "Masala", pill: "Masala" };
  if (id.includes("honey")) return { category: "Honey", pill: "Honey" };
  if (id.includes("packaging") || id.includes("ghee")) return { category: "Ghee", pill: "Ghee" };
  return undefined;
}

const pad2 = (n) => String(n).padStart(2, "0");

/**
 * Web home hero — full-bleed slider. Desktop: editorial headline with two calls to action, a progress pager and a
 * frosted trust bar along the bottom edge. Phone web: a compact promo band.
 */
export default function WebPremiumHero({ navigation, heroSlides = [], products = [] }) {
  const { width, pageGutterClamp, isMobileWeb } = useKankregLayout();
  const reduceMotion = useReducedMotion();
  const [paused, setPaused] = useState(false);

  const activeSlides = useMemo(
    () =>
      resolveWebHomeHeroSlides({
        heroSlides,
        products,
        isMobileWeb,
      }),
    [heroSlides, products, isMobileWeb]
  );

  const [slideIndex, setSlideIndex] = useState(0);
  const current = activeSlides[slideIndex] || activeSlides[0];

  useEffect(() => {
    setSlideIndex(0);
  }, [activeSlides]);

  const go = useCallback(
    (delta) => {
      if (!activeSlides.length) return;
      setSlideIndex((i) => (i + delta + activeSlides.length) % activeSlides.length);
    },
    [activeSlides.length]
  );

  // Auto-advance in step with the CSS progress bar: pausing (hover) keeps the time left on this slide.
  const remainRef = useRef(SLIDE_MS);
  const startedRef = useRef(0);
  const lastSlideRef = useRef(-1);
  useEffect(() => {
    if (reduceMotion || activeSlides.length < 2) return undefined;
    if (lastSlideRef.current !== slideIndex) {
      lastSlideRef.current = slideIndex;
      remainRef.current = SLIDE_MS;
    }
    if (paused) return undefined;
    startedRef.current = Date.now();
    const timer = setTimeout(() => go(1), remainRef.current);
    return () => {
      clearTimeout(timer);
      remainRef.current = Math.max(300, remainRef.current - (Date.now() - startedRef.current));
    };
  }, [activeSlides.length, reduceMotion, paused, slideIndex, go]);

  if (Platform.OS !== "web" || !activeSlides.length) return null;

  const headline = current?.title || HOME_HERO_PACKAGING.title || "Pure Bilona ghee";
  const support =
    current?.subtitle ||
    HOME_SCREEN_UI.web?.atelierSupport ||
    HOME_HERO_PACKAGING.subtitle ||
    "Hand-churned A2 ghee — slow craft for your table.";
  const cta = isMobileWeb ? "Shop now" : current?.cta || HOME_SCREEN_UI.web?.atelierCta || "Shop the collection";
  const eyebrow = String(
    current?.badge || HOME_SCREEN_UI.web?.heroEyebrow || WEB_HOME_PREMIUM.hero.eyebrowFallback
  ).toUpperCase();

  const openShop = () => navigation.navigate("Shop", shopParamsForSlide(current));
  const openStory = () => navigation.navigate("About");

  const fullBleedStyle = isMobileWeb
    ? { width: "100%", alignSelf: "stretch", maxWidth: "100%" }
    : {
        width: "100vw",
        maxWidth: "100vw",
        marginLeft: "calc(50% - 50vw)",
        marginRight: "calc(50% - 50vw)",
        alignSelf: "center",
      };

  const titleSize = webHeroSize(width);
  const showTrust = !isMobileWeb && HOME_SCREEN_UI.web?.showHeroTrustChips !== false;
  const many = activeSlides.length > 1;

  const pager = many ? (
    <View style={[styles.pager, isMobileWeb && styles.pagerPhone]}>
      {!isMobileWeb ? (
        <Text style={styles.counter} accessibilityLabel={`Slide ${slideIndex + 1} of ${activeSlides.length}`}>
          <Text style={styles.counterNow}>{pad2(slideIndex + 1)}</Text>
          {`  /  ${pad2(activeSlides.length)}`}
        </Text>
      ) : null}
      <View style={styles.segments} accessibilityRole="tablist">
        {activeSlides.map((slide, index) => {
          const on = index === slideIndex;
          return (
            <Pressable
              key={slide.id || `seg-${index}`}
              onPress={() => setSlideIndex(index)}
              hitSlop={{ top: 12, bottom: 12, left: 2, right: 2 }}
              style={[styles.segment, isMobileWeb && styles.segmentPhone]}
              accessibilityRole="tab"
              accessibilityState={{ selected: on }}
              accessibilityLabel={slide.title || `Slide ${index + 1}`}
            >
              {on ? (
                <View
                  key={`fill-${slideIndex}`}
                  className="zv-hero-fill"
                  dataSet={{ paused: paused ? "1" : "0" }}
                  style={styles.segmentFill}
                />
              ) : index < slideIndex ? (
                <View style={[styles.segmentFill, styles.segmentDone]} />
              ) : null}
            </Pressable>
          );
        })}
      </View>
      {!isMobileWeb ? (
        <View style={styles.arrows}>
          <Pressable
            onPress={() => go(-1)}
            className="zv-glass"
            style={styles.arrow}
            accessibilityRole="button"
            accessibilityLabel={WEB_HOME_PREMIUM.hero.prev}
          >
            <Ionicons name="arrow-back" size={18} color={WP.cream} />
          </Pressable>
          <Pressable
            onPress={() => go(1)}
            className="zv-glass"
            style={styles.arrow}
            accessibilityRole="button"
            accessibilityLabel={WEB_HOME_PREMIUM.hero.next}
          >
            <Ionicons name="arrow-forward" size={18} color={WP.cream} />
          </Pressable>
        </View>
      ) : null}
    </View>
  ) : null;

  return (
    <View
      style={[styles.fullBleed, fullBleedStyle]}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <View
        className={HERO_STAGE_CLASS}
        style={[styles.stage, isMobileWeb ? styles.stagePhone : styles.stageDesktop]}
      >
        {activeSlides.map((slide, index) => {
          const src = toImageSrc(slide.url, { width: isMobileWeb ? 900 : 1800 });
          if (!src) return null;
          const active = index === slideIndex;
          return (
            <HtmlImg
              key={slide.id || `slide-${index}`}
              src={src}
              alt={slide.title || headline}
              className={HERO_MEDIA_CLASS}
              loading={index === 0 ? "eager" : "lazy"}
              fetchPriority={index === 0 ? "high" : "auto"}
              data-active={active ? "1" : "0"}
              style={{ opacity: active ? 1 : 0 }}
            />
          );
        })}

        <View style={styles.scrimSide} pointerEvents="none" />
        <View style={styles.scrimBottom} pointerEvents="none" />

        <View
          style={[
            styles.copyWrap,
            isMobileWeb ? styles.copyWrapPhone : { paddingBottom: showTrust ? BAR_HEIGHT + 64 : 72 },
            { paddingHorizontal: pageGutterClamp },
          ]}
        >
          <SectionReveal
            key={current?.id || slideIndex}
            immediate
            preset="fade-up"
            delay={40}
            style={[styles.reveal, isMobileWeb && styles.revealPhone]}
          >
            <View style={styles.eyebrowRow}>
              <View style={[styles.eyebrowLine, isMobileWeb && styles.eyebrowLinePhone]} />
              <Text style={[styles.eyebrow, isMobileWeb && styles.eyebrowPhone]} numberOfLines={1}>
                {eyebrow}
              </Text>
            </View>

            <Text
              style={[
                styles.headline,
                isMobileWeb
                  ? { fontSize: 26, lineHeight: 30, letterSpacing: -0.4 }
                  : { fontSize: titleSize, lineHeight: Math.round(titleSize * 1.04), letterSpacing: -titleSize * 0.022 },
              ]}
              numberOfLines={isMobileWeb ? 2 : 3}
              accessibilityRole="header"
            >
              {headline}
            </Text>

            {!isMobileWeb ? <Text style={styles.support}>{support}</Text> : null}

            <View style={[styles.ctaRow, isMobileWeb && styles.ctaRowPhone]}>
              <Pressable
                onPress={openShop}
                className="zv-btn"
                style={[styles.ctaGold, isMobileWeb && styles.ctaGoldPhone]}
                accessibilityRole="button"
                accessibilityLabel={cta}
              >
                <Text style={[styles.ctaGoldText, isMobileWeb && styles.ctaGoldTextPhone]}>{cta}</Text>
                <Ionicons name="arrow-forward" size={isMobileWeb ? 14 : 17} color={WP.gold.ink} />
              </Pressable>
              {!isMobileWeb ? (
                <Pressable
                  onPress={openStory}
                  className="zv-glass"
                  style={styles.ctaGlass}
                  accessibilityRole="button"
                  accessibilityLabel={WEB_HOME_PREMIUM.hero.secondaryCta}
                >
                  <Text style={styles.ctaGlassText}>{WEB_HOME_PREMIUM.hero.secondaryCta}</Text>
                </Pressable>
              ) : null}
            </View>
          </SectionReveal>
        </View>

        {pager ? (
          <View
            style={[
              styles.controls,
              isMobileWeb ? styles.controlsPhone : { bottom: showTrust ? BAR_HEIGHT + 30 : 34 },
            ]}
            pointerEvents="box-none"
          >
            <View style={[styles.controlsInner, { paddingHorizontal: pageGutterClamp }]} pointerEvents="box-none">
              {pager}
            </View>
          </View>
        ) : null}

        {showTrust ? (
          <View style={styles.bar}>
            <View style={[styles.barInner, { paddingHorizontal: pageGutterClamp }]}>
              {HOME_TRUST_STRIP.map((item, i) => (
                <View key={item.key} style={[styles.barItem, i > 0 && styles.barItemRule]}>
                  <Ionicons name={item.icon} size={18} color={WP.gold.bright} />
                  <Text style={styles.barText} numberOfLines={1}>
                    {item.label}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  fullBleed: {
    width: "100%",
    alignSelf: "stretch",
    marginBottom: 0,
    marginTop: 0,
  },
  stage: {
    width: "100%",
    position: "relative",
    justifyContent: "flex-end",
    backgroundColor: "#151510",
    overflow: "hidden",
  },
  stageDesktop: {
    width: "100%",
    aspectRatio: 16 / 9,
    maxHeight: 760,
    minHeight: 420,
    justifyContent: "flex-end",
  },
  stagePhone: {
    width: "100%",
    aspectRatio: 3 / 4,
    maxHeight: 560,
    justifyContent: "flex-end",
    backgroundColor: "#1A1208",
  },
  scrimSide: {
    ...StyleSheet.absoluteFillObject,
    ...Platform.select({ web: { backgroundImage: WP.gradient.heroSide }, default: { backgroundColor: "rgba(14,16,10,0.35)" } }),
  },
  scrimBottom: {
    ...StyleSheet.absoluteFillObject,
    ...Platform.select({ web: { backgroundImage: WP.gradient.heroBottom }, default: {} }),
  },
  copyWrap: {
    width: "100%",
    maxWidth: 1280,
    alignSelf: "center",
    zIndex: 2,
  },
  copyWrapPhone: {
    paddingTop: 18,
    paddingBottom: 22,
    justifyContent: "center",
  },
  reveal: {
    maxWidth: 640,
    gap: 18,
  },
  revealPhone: {
    maxWidth: "86%",
    gap: 8,
  },
  eyebrowRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  eyebrowLine: {
    width: 40,
    height: 1,
    backgroundColor: WP.gold.bright,
  },
  eyebrowLinePhone: { width: 22 },
  eyebrow: {
    fontFamily: fonts.bold,
    fontSize: 12.5,
    letterSpacing: 3,
    color: WP.gold.bright,
  },
  eyebrowPhone: { fontSize: 10.5, letterSpacing: 2.2 },
  headline: {
    fontFamily: FONT_HEADING,
    color: WP.cream,
    textShadowColor: "rgba(0, 0, 0, 0.35)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 24,
  },
  support: {
    fontFamily: fonts.regular,
    fontSize: 18,
    lineHeight: 28,
    color: "rgba(250, 248, 244, 0.9)",
    maxWidth: 500,
  },
  ctaRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 14,
    marginTop: 8,
  },
  ctaRowPhone: { marginTop: 4, gap: 10 },
  ctaGold: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 16,
    paddingHorizontal: 30,
    borderRadius: WP.radius.pill,
    ...Platform.select({
      web: { backgroundImage: WP.gradient.gold, boxShadow: WP.shadow.gold },
      default: { backgroundColor: WP.gold.base },
    }),
  },
  ctaGoldPhone: { paddingVertical: 10, paddingHorizontal: 18, gap: 6 },
  ctaGoldText: {
    fontFamily: fonts.bold,
    fontSize: 15,
    letterSpacing: 0.3,
    color: WP.gold.ink,
  },
  ctaGoldTextPhone: { fontSize: 12.5 },
  ctaGlass: {
    paddingVertical: 15,
    paddingHorizontal: 28,
    borderRadius: WP.radius.pill,
    borderWidth: 1,
    borderColor: "rgba(250, 248, 244, 0.5)",
    backgroundColor: "rgba(250, 248, 244, 0.1)",
    ...Platform.select({
      web: { backdropFilter: "blur(10px)", WebkitBackdropFilter: "blur(10px)", cursor: "pointer" },
      default: {},
    }),
  },
  ctaGlassText: {
    fontFamily: fonts.semibold,
    fontSize: 15,
    letterSpacing: 0.3,
    color: WP.cream,
  },
  controls: {
    position: "absolute",
    left: 0,
    right: 0,
    zIndex: 4,
  },
  controlsPhone: { bottom: 12 },
  controlsInner: {
    width: "100%",
    maxWidth: 1280,
    alignSelf: "center",
    alignItems: "flex-end",
  },
  pager: {
    flexDirection: "row",
    alignItems: "center",
    gap: 18,
  },
  pagerPhone: { gap: 0 },
  counter: {
    fontFamily: fonts.medium,
    fontSize: 13,
    letterSpacing: 1.2,
    color: "rgba(250, 248, 244, 0.62)",
    ...Platform.select({ web: { fontVariant: ["tabular-nums"] }, default: {} }),
  },
  counterNow: {
    fontFamily: fonts.bold,
    color: WP.cream,
  },
  segments: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  segment: {
    width: 56,
    height: 3,
    borderRadius: 2,
    overflow: "hidden",
    backgroundColor: "rgba(250, 248, 244, 0.3)",
    ...Platform.select({ web: { cursor: "pointer" }, default: {} }),
  },
  segmentPhone: { width: 22, height: 3 },
  segmentFill: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: WP.cream,
  },
  segmentDone: { opacity: 0.85 },
  arrows: {
    flexDirection: "row",
    gap: 10,
  },
  arrow: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(250, 248, 244, 0.38)",
    backgroundColor: "rgba(250, 248, 244, 0.1)",
    ...Platform.select({
      web: { backdropFilter: "blur(10px)", WebkitBackdropFilter: "blur(10px)", cursor: "pointer" },
      default: {},
    }),
  },
  bar: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: BAR_HEIGHT,
    zIndex: 3,
    borderTopWidth: 1,
    borderTopColor: "rgba(250, 248, 244, 0.16)",
    backgroundColor: "rgba(14, 16, 10, 0.46)",
    justifyContent: "center",
    ...Platform.select({ web: { backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)" }, default: {} }),
  },
  barInner: {
    width: "100%",
    maxWidth: 1280,
    alignSelf: "center",
    flexDirection: "row",
    alignItems: "center",
  },
  barItem: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingVertical: 6,
  },
  barItemRule: {
    borderLeftWidth: 1,
    borderLeftColor: "rgba(250, 248, 244, 0.16)",
  },
  barText: {
    fontFamily: fonts.semibold,
    fontSize: 13.5,
    letterSpacing: 0.4,
    color: "rgba(250, 248, 244, 0.92)",
  },
});
