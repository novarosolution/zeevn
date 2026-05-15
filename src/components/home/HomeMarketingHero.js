import React, { useCallback, useEffect, useMemo } from "react";
import { Platform, Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from "react-native";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import { Ionicons } from "@expo/vector-icons";
import Animated, { Easing, FadeInDown, useAnimatedStyle, useSharedValue, withRepeat, withTiming } from "react-native-reanimated";
import { ALCHEMY, FONT_DISPLAY } from "../../theme/customerAlchemy";
import { homeType } from "../../styles/typography";
import { spacing as homeSpacing } from "../../styles/spacing";

const AnimatedExpoImage = Animated.createAnimatedComponent(Image);
const NAVY_BASE = "#0E1729";
const BRASS = "#C8A97E";
const WHITE = "#FFFFFF";

function getSlideOverline(slide, index) {
  if (typeof slide?.overline === "string" && slide.overline.trim()) {
    return slide.overline.trim().toUpperCase();
  }
  if (index === 0 || slide?.key === "heritage") return "DAILY PANTRY";
  if (slide?.key === "purity") return "FRESH EDIT";
  return "DAILY PANTRY";
}

function HeroKenBurnsImage({ slide, reducedMotion, style, direction }) {
  const scale = useSharedValue(1);

  useEffect(() => {
    if (reducedMotion) {
      scale.value = 1;
      return;
    }
    const start = direction < 0 ? 1.06 : 1;
    const end = direction < 0 ? 1 : 1.06;
    scale.value = start;
    scale.value = withRepeat(withTiming(end, { duration: 8000, easing: Easing.linear }), -1, true);
  }, [direction, reducedMotion, scale]);

  const imageAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  if (!slide?.image) return null;

  return (
    <AnimatedExpoImage
      source={slide.image}
      contentFit="cover"
      transition={reducedMotion ? 0 : 180}
      style={[style, imageAnimStyle]}
    />
  );
}

function HeroDotIndicator({ active, style }) {
  const width = useSharedValue(active ? 24 : 8);
  useEffect(() => {
    width.value = withTiming(active ? 24 : 8, {
      duration: 220,
      easing: Easing.out(Easing.cubic),
    });
  }, [active, width]);
  const animatedStyle = useAnimatedStyle(() => ({
    width: width.value,
  }));
  return <Animated.View style={[style, animatedStyle]} />;
}

/**
 * Full-bleed marketing hero with slider, or compact copy-only hero when the user is searching.
 */
export default function HomeMarketingHero({
  showMarketing,
  webHeroRef,
  reducedMotion,
  styles,
  isDark,
  homeViewConfig,
  heroSlides,
  windowWidth,
  heroSliderRef,
  heroSliderWidth,
  setHeroSliderWidth,
  heroSlideHeight,
  heroSlideIndex,
  setHeroSlideIndex,
  goToHeroSlide,
  handleHeroSlideAction,
  onHeroPressIn,
  onHeroPressOut,
}) {
  const { width: measuredWidth } = useWindowDimensions();
  const viewportWidth = Number(windowWidth || measuredWidth || 0);
  const isTablet = viewportWidth >= 768;
  const showHeroArrows = viewportWidth >= 640 && heroSlides.length > 1;
  const contentOpacity = useSharedValue(1);
  const contentTranslate = useSharedValue(0);

  const editorialStyles = useMemo(() => {
    const titleSize = isTablet ? 48 : 36;
    return StyleSheet.create({
      heroFrame: {
        flex: 1,
        borderRadius: 18,
        overflow: "hidden",
        backgroundColor: NAVY_BASE,
      },
      topRule: {
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        height: 1,
        backgroundColor: "rgba(200,169,126,0.32)",
        zIndex: 4,
      },
      lampOverlay: {
        position: "absolute",
        top: -120,
        right: -100,
        width: isTablet ? 420 : 300,
        height: isTablet ? 420 : 300,
        borderRadius: 999,
        backgroundColor: "rgba(200,169,126,0.10)",
        zIndex: 1,
      },
      contentWrap: {
        flex: 1,
        paddingVertical: isTablet ? homeSpacing["3xl"] : homeSpacing.xl,
        paddingHorizontal: isTablet ? 32 : 24,
        justifyContent: "space-between",
        zIndex: 3,
      },
      overlineRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        marginBottom: 16,
      },
      overlineSquare: {
        width: 4,
        height: 4,
        borderRadius: 0,
        backgroundColor: BRASS,
      },
      overlineText: {
        color: BRASS,
        fontSize: 11,
        fontFamily: homeType.overline.fontFamily,
        fontWeight: "600",
        letterSpacing: 1.4,
        textTransform: "uppercase",
      },
      title: {
        color: WHITE,
        fontFamily: homeType.display.fontFamily,
        fontSize: titleSize,
        lineHeight: Math.round(titleSize * 1.05),
        letterSpacing: -(titleSize * 0.025),
        fontWeight: "500",
        maxWidth: isTablet ? 680 : 520,
      },
      subtitle: {
        marginTop: 12,
        color: "rgba(255,255,255,0.72)",
        fontSize: 16,
        lineHeight: 21,
        fontFamily: homeType.uiRegular.fontFamily,
        fontWeight: "400",
        maxWidth: isTablet ? 520 : 420,
      },
      cta: {
        alignSelf: "flex-start",
        marginTop: homeSpacing.xl,
        minHeight: 44,
        borderRadius: 999,
        paddingVertical: 12,
        paddingHorizontal: 20,
        backgroundColor: WHITE,
        flexDirection: "row",
        alignItems: "center",
        gap: homeSpacing.sm,
        ...Platform.select({
          web: {
            cursor: "pointer",
            transition: "transform 120ms ease, opacity 120ms ease",
          },
          default: {},
        }),
      },
      ctaPressed: {
        transform: [{ scale: 0.96 }],
        opacity: 0.94,
      },
      ctaText: {
        color: NAVY_BASE,
        fontSize: 13,
        letterSpacing: 0.78,
        fontFamily: homeType.uiSemibold.fontFamily,
        fontWeight: "600",
      },
      counterPill: {
        position: "absolute",
        top: 20,
        right: 20,
        zIndex: 5,
        borderWidth: 1,
        borderColor: "rgba(200,169,126,0.8)",
        borderRadius: 999,
        paddingVertical: homeSpacing.xs,
        paddingHorizontal: homeSpacing.md,
        backgroundColor: "transparent",
      },
      counterText: {
        color: BRASS,
        fontSize: 12,
        letterSpacing: 0.96,
        fontFamily: homeType.uiSemibold.fontFamily,
        fontWeight: "600",
        fontVariant: ["tabular-nums"],
      },
      dotsWrap: {
        position: "absolute",
        right: 20,
        bottom: 20,
        zIndex: 5,
      },
      dotsRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
      },
      dotHit: {
        minHeight: 20,
        minWidth: 12,
        justifyContent: "center",
        ...Platform.select({
          web: { cursor: "pointer" },
          default: {},
        }),
      },
      dotBase: {
        height: 8,
        borderRadius: 999,
      },
      dotIdle: {
        backgroundColor: "rgba(255,255,255,0.32)",
      },
      dotActive: {
        backgroundColor: BRASS,
      },
      navRail: {
        position: "absolute",
        top: "50%",
        left: 16,
        right: 16,
        marginTop: -20,
        zIndex: 5,
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
      },
      navButton: {
        width: 40,
        height: 40,
        borderRadius: 999,
        justifyContent: "center",
        alignItems: "center",
        borderWidth: 1,
        borderColor: "rgba(200,169,126,0.6)",
        backgroundColor: "rgba(14,23,41,0.45)",
        ...Platform.select({
          web: {
            cursor: "pointer",
            transition: "transform 120ms ease, opacity 120ms ease",
          },
          default: {},
        }),
      },
      navButtonPressed: {
        opacity: 0.92,
        transform: [{ scale: 0.96 }],
      },
      liveRegion: {
        position: "absolute",
        left: 0,
        right: 0,
        bottom: 0,
        height: 1,
        opacity: 0,
      },
    });
  }, [isTablet]);

  useEffect(() => {
    if (reducedMotion) {
      contentOpacity.value = 0.2;
      contentOpacity.value = withTiming(1, { duration: 120 });
      contentTranslate.value = 0;
      return;
    }
    contentOpacity.value = 0;
    contentTranslate.value = 14;
    contentOpacity.value = withTiming(1, { duration: 200, easing: Easing.out(Easing.cubic) });
    contentTranslate.value = withTiming(0, { duration: 200, easing: Easing.out(Easing.cubic) });
  }, [contentOpacity, contentTranslate, heroSlideIndex, reducedMotion]);

  const contentAnimStyle = useAnimatedStyle(() => ({
    opacity: contentOpacity.value,
    transform: [{ translateX: reducedMotion ? 0 : contentTranslate.value }],
  }));

  const onPressCta = useCallback(
    async (slide) => {
      onHeroPressIn?.();
      if (Platform.OS === "ios") {
        try {
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        } catch {
          // non-blocking enhancement only
        }
      }
      handleHeroSlideAction(slide.action);
      onHeroPressOut?.();
    },
    [handleHeroSlideAction, onHeroPressIn, onHeroPressOut]
  );

  if (showMarketing) {
    return (
      <React.Fragment>
        <Animated.View
          ref={webHeroRef}
          entering={reducedMotion ? undefined : FadeInDown.duration(520)}
          style={[styles.heroImageOuter, { borderRadius: 18, backgroundColor: NAVY_BASE }]}
          accessible
          accessibilityRole="region"
          accessibilityLabel={`Featured collections, slide ${heroSlideIndex + 1} of ${heroSlides.length}`}
        >
          <ScrollView
            ref={heroSliderRef}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            scrollEventThrottle={16}
            decelerationRate={Platform.OS === "ios" ? "fast" : 0.98}
            onLayout={(e) => setHeroSliderWidth(e.nativeEvent.layout.width)}
            onTouchStart={onHeroPressIn}
            onTouchEnd={onHeroPressOut}
            onScrollEndDrag={onHeroPressOut}
            onMouseEnter={Platform.OS === "web" ? onHeroPressIn : undefined}
            onMouseLeave={Platform.OS === "web" ? onHeroPressOut : undefined}
            onMomentumScrollEnd={(e) => {
              const pageW = e.nativeEvent.layoutMeasurement.width || heroSliderWidth || 1;
              const current = Math.round(e.nativeEvent.contentOffset.x / pageW);
              setHeroSlideIndex(Math.max(0, Math.min(current, heroSlides.length - 1)));
              onHeroPressOut?.();
            }}
            style={styles.heroSlider}
          >
            {heroSlides.map((slide, slideIndex) => {
              return (
                <View
                  key={slide.key}
                  accessible
                  accessibilityLabel={`${getSlideOverline(slide, slideIndex)}. ${slide.title}. ${slide.subtitle}`}
                  style={[
                    styles.heroPremiumFill,
                    {
                      width: heroSliderWidth || "100%",
                      height: heroSlideHeight,
                    },
                  ]}
                >
                  <View style={editorialStyles.heroFrame}>
                    <HeroKenBurnsImage
                      slide={slide}
                      reducedMotion={reducedMotion}
                      style={styles.heroSlideMedia}
                      direction={slideIndex % 2 === 0 ? 1 : -1}
                    />
                    <LinearGradient
                      colors={["rgba(14,23,41,0.48)", "rgba(14,23,41,0.82)"]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 0, y: 1 }}
                      style={StyleSheet.absoluteFillObject}
                    />
                    <View style={editorialStyles.lampOverlay} pointerEvents="none" />
                    <View style={editorialStyles.topRule} pointerEvents="none" />
                    <View
                      style={editorialStyles.counterPill}
                      accessibilityRole="text"
                      accessibilityLabel={`Slide ${slideIndex + 1} of ${heroSlides.length}`}
                    >
                      <Text style={editorialStyles.counterText} maxFontSizeMultiplier={1.3}>
                        {String(slideIndex + 1).padStart(2, "0")}
                        {" / "}
                        {String(heroSlides.length).padStart(2, "0")}
                      </Text>
                    </View>
                    {showHeroArrows ? (
                      <View style={editorialStyles.navRail}>
                        <Pressable
                          onHoverIn={Platform.OS === "web" ? onHeroPressIn : undefined}
                          onHoverOut={Platform.OS === "web" ? onHeroPressOut : undefined}
                          onPressIn={onHeroPressIn}
                          onPressOut={onHeroPressOut}
                          onPress={() =>
                            goToHeroSlide((heroSlideIndex - 1 + heroSlides.length) % heroSlides.length, {
                              animated: !reducedMotion,
                            })
                          }
                          style={({ hovered, pressed }) => [
                            editorialStyles.navButton,
                            hovered ? { opacity: 0.95 } : null,
                            pressed ? editorialStyles.navButtonPressed : null,
                          ]}
                          accessibilityRole="button"
                          accessibilityLabel="Previous slide"
                        >
                          <Ionicons name="chevron-back" size={18} color={BRASS} />
                        </Pressable>
                        <Pressable
                          onHoverIn={Platform.OS === "web" ? onHeroPressIn : undefined}
                          onHoverOut={Platform.OS === "web" ? onHeroPressOut : undefined}
                          onPressIn={onHeroPressIn}
                          onPressOut={onHeroPressOut}
                          onPress={() =>
                            goToHeroSlide((heroSlideIndex + 1) % heroSlides.length, {
                              animated: !reducedMotion,
                            })
                          }
                          style={({ hovered, pressed }) => [
                            editorialStyles.navButton,
                            hovered ? { opacity: 0.95 } : null,
                            pressed ? editorialStyles.navButtonPressed : null,
                          ]}
                          accessibilityRole="button"
                          accessibilityLabel="Next slide"
                        >
                          <Ionicons name="chevron-forward" size={18} color={BRASS} />
                        </Pressable>
                      </View>
                    ) : null}
                    <Animated.View style={[editorialStyles.contentWrap, contentAnimStyle]}>
                      <View>
                        <View style={editorialStyles.overlineRow}>
                          <View style={editorialStyles.overlineSquare} />
                          <Text style={editorialStyles.overlineText}>{getSlideOverline(slide, slideIndex)}</Text>
                        </View>
                        <Text style={editorialStyles.title} numberOfLines={3} ellipsizeMode="tail">
                          {slide.title}
                        </Text>
                        <Text style={editorialStyles.subtitle} numberOfLines={2} ellipsizeMode="tail">
                          {slide.subtitle}
                        </Text>
                      </View>
                      <Pressable
                        onHoverIn={Platform.OS === "web" ? onHeroPressIn : undefined}
                        onHoverOut={Platform.OS === "web" ? onHeroPressOut : undefined}
                        onPressIn={onHeroPressIn}
                        onPressOut={onHeroPressOut}
                        onPress={() => onPressCta(slide)}
                        style={({ pressed }) => [
                          editorialStyles.cta,
                          pressed ? editorialStyles.ctaPressed : null,
                        ]}
                        accessibilityRole="button"
                        accessibilityLabel={slide.cta}
                      >
                        <Text style={editorialStyles.ctaText}>{slide.cta}</Text>
                        <Ionicons name="arrow-forward" size={14} color={NAVY_BASE} />
                      </Pressable>
                    </Animated.View>
                  </View>
                </View>
              );
            })}
          </ScrollView>
          {heroSlides.length > 1 ? (
            <View
              style={editorialStyles.dotsWrap}
              accessibilityLabel={`Slide ${heroSlideIndex + 1} of ${heroSlides.length}`}
            >
              <View style={editorialStyles.dotsRow} accessibilityRole="tablist">
                {heroSlides.map((s, dotIdx) => (
                  <Pressable
                    onHoverIn={Platform.OS === "web" ? onHeroPressIn : undefined}
                    onHoverOut={Platform.OS === "web" ? onHeroPressOut : undefined}
                    onPressIn={onHeroPressIn}
                    onPressOut={onHeroPressOut}
                    key={s.key}
                    onPress={() => goToHeroSlide(dotIdx, { animated: !reducedMotion })}
                    hitSlop={{ top: homeSpacing.md, bottom: homeSpacing.md, left: homeSpacing.sm, right: homeSpacing.sm }}
                    accessibilityRole="tab"
                    accessibilityState={{ selected: dotIdx === heroSlideIndex }}
                    accessibilityLabel={`Go to slide ${dotIdx + 1}`}
                    style={({ pressed }) => [editorialStyles.dotHit, pressed && { opacity: 0.85 }]}
                  >
                    <HeroDotIndicator
                      active={dotIdx === heroSlideIndex}
                      style={[
                        editorialStyles.dotBase,
                        dotIdx === heroSlideIndex ? editorialStyles.dotActive : editorialStyles.dotIdle,
                      ]}
                    />
                  </Pressable>
                ))}
              </View>
            </View>
          ) : null}
          <Text accessibilityLiveRegion="polite" style={editorialStyles.liveRegion}>
            {heroSlides[heroSlideIndex]?.title || ""}
          </Text>
        </Animated.View>
      </React.Fragment>
    );
  }

  return (
    <View
      style={[
        styles.heroCardCompact,
        isDark ? null : { backgroundColor: ALCHEMY.cardBg, borderColor: ALCHEMY.pillInactive },
      ]}
    >
      <Text style={[styles.heroTitle, { fontFamily: FONT_DISPLAY }]}>{homeViewConfig.heroTitle}</Text>
      <Text style={[styles.heroSubtext, { fontFamily: homeType.uiRegular.fontFamily }]} numberOfLines={2}>
        {homeViewConfig.heroSubtitle}
      </Text>
    </View>
  );
}
