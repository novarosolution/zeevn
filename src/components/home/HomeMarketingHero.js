import React from "react";
import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import Animated, { FadeInDown } from "react-native-reanimated";
import HomeAmbientOrbs from "./HomeAmbientOrbs";
import BrandWordmark from "../BrandWordmark";
import { HERO_GRADIENT_PRESETS } from "../../constants/marketingAssets";
import { useTheme } from "../../context/ThemeContext";
import { ALCHEMY, FONT_DISPLAY } from "../../theme/customerAlchemy";
import { icon } from "../../theme/tokens";
import PremiumButton from "../ui/PremiumButton";

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
  heroSliderRef,
  heroSliderWidth,
  setHeroSliderWidth,
  heroSlideHeight,
  heroSlideIndex,
  setHeroSlideIndex,
  goToHeroSlide,
  handleHeroSlideAction,
}) {
  const { colors: c } = useTheme();

  if (showMarketing) {
    return (
      <React.Fragment>
        <Animated.View
          ref={webHeroRef}
          entering={reducedMotion ? undefined : FadeInDown.duration(520)}
          style={styles.heroImageOuter}
        >
          <HomeAmbientOrbs isDark={isDark} />
          <ScrollView
            ref={heroSliderRef}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            scrollEventThrottle={16}
            decelerationRate={Platform.OS === "ios" ? "fast" : 0.98}
            onLayout={(e) => setHeroSliderWidth(e.nativeEvent.layout.width)}
            onMomentumScrollEnd={(e) => {
              const pageW = e.nativeEvent.layoutMeasurement.width || heroSliderWidth || 1;
              const current = Math.round(e.nativeEvent.contentOffset.x / pageW);
              setHeroSlideIndex(Math.max(0, Math.min(current, heroSlides.length - 1)));
            }}
            style={styles.heroSlider}
          >
            {heroSlides.map((slide, slideIndex) => {
              const gp = HERO_GRADIENT_PRESETS[slide.preset] || HERO_GRADIENT_PRESETS.noir;
              return (
                <View
                  key={slide.key}
                  style={[
                    styles.heroPremiumFill,
                    {
                      width: heroSliderWidth || "100%",
                      height: heroSlideHeight,
                    },
                  ]}
                >
                  <View style={styles.heroSlideFrame}>
                    {slide.image ? (
                      <Image
                        source={slide.image}
                        contentFit="cover"
                        transition={reducedMotion ? 0 : 180}
                        style={styles.heroSlideMedia}
                      />
                    ) : null}
                    <LinearGradient
                      colors={slide.image ? ["rgba(12, 10, 10, 0.18)", "rgba(12, 10, 10, 0.08)"] : gp.colors}
                      locations={slide.image ? undefined : gp.locations}
                      start={gp.start}
                      end={gp.end}
                      style={StyleSheet.absoluteFillObject}
                    />
                    <LinearGradient
                      colors={["rgba(0,0,0,0.1)", "rgba(0,0,0,0.04)", "rgba(0,0,0,0.12)"]}
                      locations={[0, 0.4, 1]}
                      start={{ x: 0.1, y: 0 }}
                      end={{ x: 0.9, y: 1 }}
                      style={[StyleSheet.absoluteFillObject, styles.peNone]}
                    />
                    <LinearGradient
                      colors={["rgba(8,6,4,0.12)", "rgba(8,6,4,0.24)", "rgba(8,6,4,0.88)"]}
                      locations={[0, 0.45, 1]}
                      start={{ x: 0.5, y: 0 }}
                      end={{ x: 0.5, y: 1 }}
                      style={[StyleSheet.absoluteFillObject, styles.peNone]}
                    />
                    <View
                      style={styles.heroSlideCounter}
                      accessibilityRole="text"
                      accessibilityLabel={`Slide ${slideIndex + 1} of ${heroSlides.length}`}
                    >
                      <Text style={styles.heroSlideCounterText} maxFontSizeMultiplier={1.3}>
                        {String(slideIndex + 1).padStart(2, "0")}
                        <Text style={styles.heroSlideCounterSep}> / </Text>
                        {String(heroSlides.length).padStart(2, "0")}
                      </Text>
                    </View>
                    {heroSlides.length > 1 ? (
                      <View style={styles.heroNavRail}>
                        <Pressable
                          onPress={() => goToHeroSlide((heroSlideIndex - 1 + heroSlides.length) % heroSlides.length)}
                          style={({ pressed }) => [styles.heroNavButton, pressed ? styles.heroNavButtonPressed : null]}
                          accessibilityRole="button"
                          accessibilityLabel="Previous slide"
                        >
                          <Ionicons name="chevron-back" size={icon.md} color={c.heroForeground} />
                        </Pressable>
                        <Pressable
                          onPress={() => goToHeroSlide((heroSlideIndex + 1) % heroSlides.length)}
                          style={({ pressed }) => [styles.heroNavButton, pressed ? styles.heroNavButtonPressed : null]}
                          accessibilityRole="button"
                          accessibilityLabel="Next slide"
                        >
                          <Ionicons name="chevron-forward" size={icon.md} color={c.heroForeground} />
                        </Pressable>
                      </View>
                    ) : null}
                    <View style={styles.heroImageInner}>
                      <BrandWordmark
                        sizeKey="homeHero"
                        color={c.heroForeground}
                        style={[styles.heroBrandLogo, styles.heroBrandLogoOnPhoto]}
                      />
                      <Text style={[styles.heroDisplayTitle, styles.heroDisplayOnPhoto]}>{slide.title}</Text>
                      <Text style={[styles.heroDisplaySub, styles.heroDisplaySubOnPhoto]}>{slide.subtitle}</Text>
                      <PremiumButton
                        label={slide.cta}
                        iconRight="arrow-forward"
                        variant="primary"
                        size={Platform.OS === "web" ? "lg" : "md"}
                        onPress={() => handleHeroSlideAction(slide.action)}
                        style={styles.heroCtaButton}
                        accessibilityLabel={slide.cta}
                      />
                    </View>
                    <LinearGradient
                      colors={[c.primary, c.primaryDark]}
                      start={{ x: 0, y: 0.5 }}
                      end={{ x: 1, y: 0.5 }}
                      style={styles.heroGoldHairline}
                    />
                  </View>
                </View>
              );
            })}
          </ScrollView>
          {heroSlides.length > 1 ? (
            <View
              style={[styles.heroDotsPill, styles.peBoxNone]}
              accessibilityLabel={`Slide ${heroSlideIndex + 1} of ${heroSlides.length}`}
            >
              <View style={styles.heroDotBackdrop}>
                <View style={styles.heroDotRow} accessibilityRole="tablist">
                  {heroSlides.map((s, dotIdx) => (
                    <Pressable
                      key={s.key}
                      onPress={() => goToHeroSlide(dotIdx)}
                      hitSlop={{ top: 10, bottom: 10, left: 6, right: 6 }}
                      accessibilityRole="tab"
                      accessibilityState={{ selected: dotIdx === heroSlideIndex }}
                      accessibilityLabel={`Go to slide ${dotIdx + 1}`}
                      style={({ pressed }) => [styles.heroDotHit, pressed && { opacity: 0.85 }]}
                    >
                      <View
                        style={[
                          styles.heroDot,
                          dotIdx === heroSlideIndex ? styles.heroDotActive : styles.heroDotIdle,
                        ]}
                      />
                    </Pressable>
                  ))}
                </View>
              </View>
            </View>
          ) : null}
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
      <Text style={styles.heroSubtext}>{homeViewConfig.heroSubtitle}</Text>
    </View>
  );
}
