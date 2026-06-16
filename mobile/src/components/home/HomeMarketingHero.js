import React from "react";
import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import Animated, { FadeInDown } from "react-native-reanimated";
import HomeAmbientOrbs from "./HomeAmbientOrbs";
import BrandLogo from "../BrandLogo";
import { BRAND_LOGO_SIZE } from "../../constants/brand";
import { HOME_HERO_BANNER } from "../../content/appContent";
import { ALCHEMY } from "../../theme/customerAlchemy";
import { FONT_HEADING } from "../../theme/typographyRoles";
import { icon } from "../../theme/tokens";
import { PRODUCT_HERO_BLURHASH } from "../../utils/image";

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
            {heroSlides.map((slide, slideIndex) => (
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
                <Image
                  source={slide.image}
                  style={styles.heroPhoto}
                  contentFit="cover"
                  transition={280}
                  cachePolicy="memory-disk"
                  recyclingKey={slide.key}
                  priority={slideIndex === heroSlideIndex ? "high" : "normal"}
                  placeholder={{ blurhash: PRODUCT_HERO_BLURHASH }}
                  accessibilityRole="none"
                />
                <LinearGradient
                  colors={["rgba(10, 8, 6, 0.42)", "transparent", "rgba(15, 23, 42, 0.08)"]}
                  locations={[0, 0.36, 1]}
                  start={{ x: 0.5, y: 0 }}
                  end={{ x: 0.5, y: 1 }}
                  style={[StyleSheet.absoluteFillObject, styles.peNone]}
                />
                <LinearGradient
                  colors={["transparent", "rgba(28, 25, 23, 0.52)", "rgba(8, 6, 4, 0.97)"]}
                  locations={[0.18, 0.48, 1]}
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
                <View style={styles.heroImageInner}>
                  {slideIndex === 0 ? (
                    <View style={styles.heroEditorialRow}>
                      <Text style={styles.heroKickerText}>{HOME_HERO_BANNER.kicker}</Text>
                      <View style={styles.heroBadgePill}>
                        <Text style={styles.heroBadgePillText}>{HOME_HERO_BANNER.badge}</Text>
                      </View>
                    </View>
                  ) : null}
                  <BrandLogo
                    height={BRAND_LOGO_SIZE.homeHero}
                    variant="onDark"
                    glow
                    style={[styles.heroBrandLogo, styles.heroBrandLogoOnPhoto]}
                  />
                  <Text style={[styles.heroDisplayTitle, styles.heroDisplayOnPhoto]}>{slide.title}</Text>
                  <Text style={[styles.heroDisplaySub, styles.heroDisplaySubOnPhoto]}>{slide.subtitle}</Text>
                  <Pressable
                    style={({ pressed, hovered }) => [
                      styles.heroCtaWrap,
                      hovered && Platform.OS === "web" ? styles.heroCtaWrapHover : null,
                      pressed && { opacity: 0.94 },
                      Platform.OS !== "web" && pressed ? { transform: [{ scale: 0.985 }] } : null,
                    ]}
                    onPress={() => handleHeroSlideAction(slide.action)}
                    accessibilityRole="button"
                    accessibilityLabel={slide.cta}
                  >
                    <LinearGradient
                      colors={[ALCHEMY.gold, "#A67C1A", ALCHEMY.brown]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={styles.heroCtaGradient}
                    >
                      <Text style={styles.heroBrownCtaText}>{slide.cta}</Text>
                      <Ionicons name="arrow-forward" size={icon.md} color="#FFFCF8" />
                    </LinearGradient>
                  </Pressable>
                </View>
                <LinearGradient
                  colors={[ALCHEMY.gold, ALCHEMY.brown]}
                  start={{ x: 0, y: 0.5 }}
                  end={{ x: 1, y: 0.5 }}
                  style={styles.heroGoldHairline}
                />
              </View>
            ))}
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
      <Text style={[styles.heroTitle, { fontFamily: FONT_HEADING }]}>{homeViewConfig.heroTitle}</Text>
      <Text style={styles.heroSubtext}>{homeViewConfig.heroSubtitle}</Text>
    </View>
  );
}
