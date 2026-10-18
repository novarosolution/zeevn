import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";
import BrandLogo from "../BrandLogo";
import SectionReveal from "../motion/SectionReveal";
import { BRAND_LOGO_SIZE, HOME_SCREEN_UI } from "../../content/appContent";
import { HOME_HERO_PACKAGING } from "../../content/homeHeroContent";
import { resolveWebHomeHeroSlides } from "../../utils/homeHeroSlides";
import { HtmlImg, toImageSrc } from "./compareWebDom";
import { HOME_SPACE } from "../../theme/homeEditorial";
import { useKankregLayout } from "../../theme/kankregBreakpoints";
import { KANKREG_CHROME, KANKREG_PALETTE } from "../../theme/kankregWeb";
import { FONT_HEADING } from "../../theme/typographyRoles";
import { useTheme } from "../../context/ThemeContext";
import { fonts, icon, spacing } from "../../theme/tokens";
import { Ionicons } from "@expo/vector-icons";
import useReducedMotion from "../../hooks/useReducedMotion";
import { injectWebCssOnce } from "../../utils/injectWebCssOnce";

const HERO_CSS_ID = "zeevan-atelier-hero-v2";
const HERO_STAGE_CLASS = "zeevan-atelier-hero-stage";
const HERO_MEDIA_CLASS = "zeevan-atelier-hero-media";

if (Platform.OS === "web") {
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
  transition: opacity 0.9s ease;
}
@media (prefers-reduced-motion: reduce) {
  .${HERO_MEDIA_CLASS} { transition: none !important; }
}`
  );
}

function shopParamsForSlide(slide) {
  const pill = String(slide?.shopPill || "").trim();
  if (pill) return { category: pill, pill };
  const id = String(slide?.id || "").toLowerCase();
  if (id.includes("tel")) return { category: "Tel", pill: "Tel" };
  if (id.includes("masala")) return { category: "Masala", pill: "Masala" };
  if (id.includes("honey")) return { category: "Honey", pill: "Honey" };
  if (id.includes("packaging") || id.includes("ghee")) return { category: "Ghee", pill: "Ghee" };
  return undefined;
}

/**
 * Web home hero — responsive full-bleed slider (desktop wide + phone portrait art).
 */
export default function WebPremiumHero({ navigation, heroSlides = [], products = [] }) {
  const { isDark } = useTheme();
  const { pageGutterClamp, isMobileWeb } = useKankregLayout();
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

  useEffect(() => {
    if (reduceMotion || paused || activeSlides.length < 2) return undefined;
    const id = setInterval(() => go(1), 6500);
    return () => clearInterval(id);
  }, [activeSlides.length, reduceMotion, paused, go]);

  if (Platform.OS !== "web" || !activeSlides.length) return null;

  const headline =
    current?.title || HOME_HERO_PACKAGING.title || "Pure Bilona ghee";
  const support =
    current?.subtitle ||
    HOME_SCREEN_UI.web?.atelierSupport ||
    HOME_HERO_PACKAGING.subtitle ||
    "Hand-churned A2 ghee — slow craft for your table.";
  const cta = isMobileWeb
    ? "Shop Now"
    : current?.cta || HOME_SCREEN_UI.web?.atelierCta || "Shop the collection";

  const openShop = () => {
    const params = shopParamsForSlide(current);
    navigation.navigate("Shop", params);
  };

  const fullBleedStyle = isMobileWeb
    ? { width: "100%", alignSelf: "stretch", maxWidth: "100%" }
    : {
        width: "100vw",
        maxWidth: "100vw",
        marginLeft: "calc(50% - 50vw)",
        marginRight: "calc(50% - 50vw)",
        alignSelf: "center",
      };

  /** Phone web: short promo band (~Anveshan). Desktop: tall atelier stage. */
  const stageHeight = isMobileWeb ? 200 : 560;
  const stageAspect = isMobileWeb
    ? { height: stageHeight, minHeight: stageHeight, maxHeight: stageHeight }
    : { aspectRatio: 16 / 9, minHeight: 480, maxHeight: 720 };

  return (
    <View
      style={[styles.fullBleed, fullBleedStyle]}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <View
        className={HERO_STAGE_CLASS}
        style={[
          styles.stage,
          isMobileWeb ? styles.stagePhone : { minHeight: stageHeight },
          stageAspect,
          isDark && styles.stageDark,
          isMobileWeb && styles.stagePhoneMaroon,
        ]}
      >
        {activeSlides.map((slide, index) => {
          const src = toImageSrc(slide.url, { width: isMobileWeb ? 900 : 1600 });
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
              style={{ opacity: active ? 1 : 0 }}
            />
          );
        })}

        <View style={[styles.scrim, isMobileWeb && styles.scrimPhone]} pointerEvents="none" />

        <View
          style={[
            styles.copyWrap,
            { paddingHorizontal: pageGutterClamp },
            isMobileWeb && styles.copyWrapPhone,
          ]}
        >
          <SectionReveal
            key={current?.id || slideIndex}
            immediate
            preset="fade-up"
            delay={40}
            style={[styles.reveal, isMobileWeb && styles.revealPhone]}
          >
            {!isMobileWeb ? (
              <BrandLogo
                height={BRAND_LOGO_SIZE.homeHero + 12}
                variant="onDark"
                showTagline={false}
              />
            ) : null}
            {current?.badge && !isMobileWeb ? <Text style={styles.badge}>{current.badge}</Text> : null}
            <Text style={[styles.headline, isMobileWeb && styles.headlinePhone]} numberOfLines={isMobileWeb ? 2 : 3}>
              {isMobileWeb ? headline : headline}
            </Text>
            {!isMobileWeb ? (
              <Text style={[styles.support, isMobileWeb && styles.supportPhone]}>{support}</Text>
            ) : null}
            <Pressable
              onPress={openShop}
              style={({ hovered, pressed }) => [
                styles.cta,
                isMobileWeb ? styles.ctaPhone : styles.ctaDesktop,
                hovered && (isMobileWeb ? styles.ctaPhoneHover : styles.ctaHover),
                pressed && { opacity: 0.92 },
              ]}
              accessibilityRole="button"
              accessibilityLabel={cta}
            >
              <Text style={[styles.ctaText, isMobileWeb && styles.ctaTextPhone]}>{cta}</Text>
              {!isMobileWeb ? (
                <Ionicons name="arrow-forward" size={icon.xs} color={KANKREG_PALETTE.ink} />
              ) : null}
            </Pressable>
          </SectionReveal>
        </View>

        {!isMobileWeb && activeSlides.length > 1 ? (
          <>
            <Pressable
              onPress={() => go(-1)}
              style={({ hovered }) => [styles.arrow, styles.arrowLeft, hovered && styles.arrowHover]}
              accessibilityLabel="Previous slide"
            >
              <Ionicons name="chevron-back" size={20} color="#FAF8F4" />
            </Pressable>
            <Pressable
              onPress={() => go(1)}
              style={({ hovered }) => [styles.arrow, styles.arrowRight, hovered && styles.arrowHover]}
              accessibilityLabel="Next slide"
            >
              <Ionicons name="chevron-forward" size={20} color="#FAF8F4" />
            </Pressable>
          </>
        ) : null}

        {activeSlides.length > 1 ? (
          <View
            style={[styles.dots, isMobileWeb && styles.dotsPhone]}
            accessibilityRole="tablist"
          >
            {activeSlides.map((slide, index) => (
              <Pressable
                key={slide.id || `dot-${index}`}
                onPress={() => setSlideIndex(index)}
                style={[styles.dot, isMobileWeb && styles.dotPhone, index === slideIndex && styles.dotActive]}
                accessibilityRole="tab"
                accessibilityState={{ selected: index === slideIndex }}
                accessibilityLabel={slide.title || `Slide ${index + 1}`}
              />
            ))}
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
    backgroundColor: KANKREG_CHROME.cream,
  },
  stagePhone: {
    overflow: "hidden",
    justifyContent: "center",
  },
  stagePhoneMaroon: {
    backgroundColor: "#4A1C28",
  },
  stageDark: {
    backgroundColor: "#151210",
  },
  scrim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(18, 16, 12, 0.28)",
    ...Platform.select({
      web: {
        backgroundImage:
          "linear-gradient(180deg, rgba(18,16,12,0.18) 0%, rgba(18,16,12,0.22) 40%, rgba(18,16,12,0.62) 100%)",
        backgroundColor: "transparent",
      },
      default: {},
    }),
  },
  scrimPhone: {
    backgroundColor: "transparent",
    ...Platform.select({
      web: {
        backgroundImage:
          "linear-gradient(90deg, rgba(58,18,28,0.72) 0%, rgba(58,18,28,0.35) 55%, rgba(58,18,28,0.15) 100%)",
      },
      default: { backgroundColor: "rgba(58, 18, 28, 0.45)" },
    }),
  },
  copyWrap: {
    width: "100%",
    maxWidth: 1280,
    alignSelf: "center",
    paddingBottom: HOME_SPACE.xl + 12,
    paddingTop: HOME_SPACE.xl,
    zIndex: 2,
  },
  copyWrapPhone: {
    paddingTop: 18,
    paddingBottom: 22,
    alignItems: "flex-start",
    justifyContent: "center",
  },
  reveal: {
    maxWidth: 520,
    gap: spacing.sm,
  },
  revealPhone: {
    maxWidth: "78%",
    gap: 8,
  },
  badge: {
    alignSelf: "flex-start",
    marginTop: spacing.sm,
    fontFamily: fonts.semibold,
    fontSize: 11,
    letterSpacing: 0.14,
    textTransform: "uppercase",
    color: "rgba(250, 248, 244, 0.78)",
  },
  headline: {
    fontFamily: FONT_HEADING,
    fontSize: 42,
    lineHeight: 48,
    letterSpacing: -0.6,
    color: "#FAF8F4",
    marginTop: spacing.xs,
  },
  headlinePhone: {
    fontSize: 22,
    lineHeight: 26,
    letterSpacing: -0.3,
    textAlign: "left",
    alignSelf: "stretch",
    marginTop: 0,
  },
  support: {
    fontFamily: fonts.regular,
    fontSize: 16,
    lineHeight: 24,
    color: "rgba(250, 248, 244, 0.86)",
    maxWidth: 420,
    marginBottom: spacing.xs,
  },
  supportPhone: {
    textAlign: "left",
    alignSelf: "stretch",
    maxWidth: 340,
  },
  cta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: spacing.sm,
    paddingVertical: 12,
    paddingHorizontal: 22,
    borderRadius: 10,
    backgroundColor: "#FAF8F4",
    ...Platform.select({ web: { cursor: "pointer" }, default: {} }),
  },
  ctaDesktop: { alignSelf: "flex-start" },
  ctaPhone: {
    alignSelf: "flex-start",
    marginTop: 6,
    paddingVertical: 9,
    paddingHorizontal: 18,
    borderRadius: 8,
    backgroundColor: "#E8BC84",
  },
  ctaHover: {
    backgroundColor: "#F0EBE0",
  },
  ctaPhoneHover: {
    backgroundColor: "#F2CE9B",
  },
  ctaText: {
    fontFamily: fonts.semibold,
    fontSize: 14,
    color: KANKREG_PALETTE.ink,
  },
  ctaTextPhone: {
    fontFamily: fonts.extrabold,
    fontSize: 13,
    letterSpacing: 0.2,
    color: "#2A1E08",
  },
  arrow: {
    position: "absolute",
    top: "50%",
    marginTop: -22,
    width: 44,
    height: 44,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(250, 248, 244, 0.28)",
    backgroundColor: "rgba(18, 16, 12, 0.35)",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 4,
    ...Platform.select({ web: { cursor: "pointer" }, default: {} }),
  },
  arrowLeft: { left: 20 },
  arrowRight: { right: 20 },
  arrowHover: {
    backgroundColor: "rgba(18, 16, 12, 0.55)",
    borderColor: "rgba(250, 248, 244, 0.5)",
  },
  dots: {
    position: "absolute",
    bottom: HOME_SPACE.md,
    right: HOME_SPACE.lg,
    flexDirection: "row",
    gap: 6,
    zIndex: 3,
  },
  dotsPhone: {
    bottom: 8,
    right: 12,
    left: "auto",
    justifyContent: "flex-end",
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 999,
    backgroundColor: "rgba(250, 248, 244, 0.35)",
    ...Platform.select({ web: { cursor: "pointer" }, default: {} }),
  },
  dotPhone: {
    width: 5,
    height: 5,
  },
  dotActive: {
    width: 22,
    backgroundColor: "#FAF8F4",
  },
});
