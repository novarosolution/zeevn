import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import WebHtmlVideo from "./WebHtmlVideo";
import { HOME_HERO_BANNER } from "../../content/appContent";
import { FONT_HEADING } from "../../theme/typographyRoles";
import {
  HOME_EYEBROW_LETTER_SPACING,
  HOME_SPACE,
  HOME_TYPE,
  homeHeroScrimMuted,
  homeHeroTitleSize,
} from "../../theme/homeEditorial";
import { createKankregEyebrowStyle } from "../../theme/kankregScreenStyles";
import { KANKREG_CHROME, KANKREG_PALETTE } from "../../theme/kankregWeb";
import { platformShadow } from "../../theme/shadowPlatform";
import { useTheme } from "../../context/ThemeContext";
import { fonts, icon, radius, spacing, typography } from "../../theme/tokens";
import { prefetchDisplayImages, getHeroSlideDisplayWidth, getHeroSlideImageUri } from "../../utils/image";
import useReducedMotion from "../../hooks/useReducedMotion";
import { KANKREG_BP, useKankregLayout } from "../../theme/kankregBreakpoints";
import {
  HOME_HERO_COMPACT_HEIGHT_RATIO,
  HOME_HERO_COMPACT_MAX_HEIGHT,
  HOME_HERO_COMPACT_MIN_HEIGHT,
  HOME_HERO_PHONE_SLIDE_HEIGHT_PER_WIDTH,
  HOME_HERO_PRODUCT_PHONE_SLIDE_HEIGHT_PER_WIDTH,
  HOME_HERO_PRODUCT_SLIDE_HEIGHT_PER_WIDTH,
  HOME_HERO_WEB_LANDSCAPE_HEIGHT_PER_WIDTH,
} from "../../constants/marketingAssets";
import {
  WEB_HERO_PORTRAIT_RATIO,
  resolvePhoneHeroFrameHeight,
} from "../../content/homeHeroContent";
import { injectWebCssOnce } from "../../utils/injectWebCssOnce";
import ProgressiveImage from "../ui/ProgressiveImage";
import { HtmlImg } from "./compareWebDom";
import { setLcpShellVisible, hasLcpShell } from "../../utils/lcpShell";

const SLIDE_INTERVAL_MS = 7000;
const KEN_BURNS_CLASS = "kankreg-hero-kenburns";
const KEN_BURNS_PRODUCT_CLASS = "kankreg-hero-kenburns-product";
const HERO_PRODUCT_FRAME_CLASS = "kankreg-hero-product-frame";
const HERO_MEDIA_CLASS = "kankreg-hero-media";
const HERO_CONTAIN_CLASS = "kankreg-hero-contain";
const HERO_MOBILE_SCROLLER_CLASS = "kankreg-hero-mobile-scroller";
const HERO_MOBILE_PAGE_CLASS = "kankreg-hero-mobile-page";
const HERO_PHONE_FIT_BG = "#FAF8F4";

injectWebCssOnce(
  "kankreg-hero-kenburns-keyframes-v2",
  `@keyframes kankregHeroKenBurns {
    from { transform: scale(1); }
    to { transform: scale(1.04); }
  }
@keyframes kankregHeroKenBurnsProduct {
    from { transform: scale(1.02); }
    to { transform: scale(1.06); }
  }
.${KEN_BURNS_CLASS} {
  animation: kankregHeroKenBurns 14s ease-in-out forwards;
  transform-origin: center center;
}
.${KEN_BURNS_PRODUCT_CLASS} {
  animation: kankregHeroKenBurnsProduct 18s ease-in-out infinite alternate;
  transform-origin: center center;
}
.${HERO_PRODUCT_FRAME_CLASS}::before,
.${HERO_PRODUCT_FRAME_CLASS}::after {
  content: "";
  position: absolute;
  left: 0;
  right: 0;
  height: 1px;
  z-index: 4;
  pointer-events: none;
  background: linear-gradient(90deg, transparent, rgba(42, 117, 89, 0.55), transparent);
}
.${HERO_PRODUCT_FRAME_CLASS}::before { top: 0; }
.${HERO_PRODUCT_FRAME_CLASS}::after { bottom: 0; }
.${HERO_MEDIA_CLASS} {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  overflow: hidden;
  z-index: 1;
}
.${HERO_MEDIA_CLASS} img {
  width: 100%;
  height: 100%;
  display: block;
  pointer-events: none;
}
.${HERO_MEDIA_CLASS} .kankreg-progressive-full,
.${HERO_MEDIA_CLASS} .kankreg-progressive-preview {
  width: 100%;
  height: 100%;
}
.${HERO_CONTAIN_CLASS} img,
.${HERO_CONTAIN_CLASS} .kankreg-progressive-full,
.${HERO_CONTAIN_CLASS} .kankreg-progressive-preview {
  object-fit: contain !important;
  object-position: top center !important;
}
@media (prefers-reduced-motion: reduce) {
  .${KEN_BURNS_PRODUCT_CLASS} { animation: none !important; transform: none !important; }
}`
);

injectWebCssOnce(
  "kankreg-hero-mobile-scroller-v1",
  `.${HERO_MOBILE_SCROLLER_CLASS} {
  scroll-snap-type: x mandatory;
  -webkit-overflow-scrolling: touch;
  overscroll-behavior-x: contain;
}
.${HERO_MOBILE_PAGE_CLASS} {
  scroll-snap-align: start;
  scroll-snap-stop: always;
}`
);

const cardShadow = platformShadow({
  web: {
    boxShadow:
      "0 50px 90px -40px rgba(25,20,15,.42), 0 18px 36px -24px rgba(25,20,15,.18), inset 0 1px 0 rgba(255,255,255,.08)",
  },
  ios: {
    shadowColor: "#19140f",
    shadowOffset: { width: 0, height: 28 },
    shadowOpacity: 0.22,
    shadowRadius: 48,
  },
  android: { elevation: 10 },
});

function resolveHeroSlideHeightRatio(slide, { isNative, isMobileWeb }) {
  if (slide?.heightRatio > 0) return slide.heightRatio;
  if (slide?.variant === "product") {
    return isNative || isMobileWeb
      ? HOME_HERO_PRODUCT_PHONE_SLIDE_HEIGHT_PER_WIDTH
      : HOME_HERO_PRODUCT_SLIDE_HEIGHT_PER_WIDTH;
  }
  if (isNative || isMobileWeb) {
    if (slide?.layout === "landscape") return HOME_HERO_WEB_LANDSCAPE_HEIGHT_PER_WIDTH;
    return HOME_HERO_PHONE_SLIDE_HEIGHT_PER_WIDTH;
  }
  return HOME_HERO_WEB_LANDSCAPE_HEIGHT_PER_WIDTH;
}

function resolveHeroImageFit(slide, { isTop, isMobileWebTop, isApp = false, isNative = false }) {
  if (isApp || isNative || isMobileWebTop) return "contain";
  if (slide?.imageFit === "contain" || slide?.imageFit === "cover") return slide.imageFit;
  if (isTop && !isMobileWebTop) return "cover";
  return "cover";
}

function HeroNavButton({ direction, onPress, style, quiet = false }) {
  const name = direction === "prev" ? "chevron-back" : "chevron-forward";
  return (
    <Pressable
      onPress={onPress}
      style={({ hovered, focused }) => [
        quiet ? styles.navBtnQuiet : styles.navBtn,
        hovered && Platform.OS === "web" ? (quiet ? styles.navBtnQuietHover : styles.navBtnHover) : null,
        focused && Platform.OS === "web" ? styles.navBtnFocus : null,
        style,
      ]}
      accessibilityRole="button"
      accessibilityLabel={direction === "prev" ? "Previous slide" : "Next slide"}
    >
      <Ionicons name={name} size={quiet ? icon.sm : icon.md} color="rgba(255,255,255,0.92)" />
    </Pressable>
  );
}

function HeroProductScrim() {
  return (
    <>
      <LinearGradient
        colors={["rgba(8,6,4,0.22)", "transparent", "transparent", "rgba(8,6,4,0.12)"]}
        locations={[0, 0.35, 0.65, 1]}
        start={{ x: 0, y: 0.5 }}
        end={{ x: 1, y: 0.5 }}
        style={[StyleSheet.absoluteFillObject, styles.scrimLayer]}
        pointerEvents="none"
      />
      <LinearGradient
        colors={["transparent", "transparent", "rgba(8,6,4,0.18)", "rgba(8,6,4,0.55)"]}
        locations={[0, 0.45, 0.72, 1]}
        style={[StyleSheet.absoluteFillObject, styles.scrimLayer]}
        pointerEvents="none"
      />
    </>
  );
}

function HeroSlideImage({
  slide,
  imageFit,
  contentPosition,
  kenClass,
  active,
  useNativeLcp = false,
  slideLayoutWidth = 960,
  slideHeightRatio,
  layoutHeight,
  isMobileWeb = false,
  fillParent = false,
  onImageReady,
}) {
  const isContain = imageFit === "contain";
  const mediaClassName = [HERO_MEDIA_CLASS, isContain ? HERO_CONTAIN_CLASS : null, kenClass]
    .filter(Boolean)
    .join(" ");
  const deliveryWidth = useMemo(
    () => getHeroSlideDisplayWidth(slideLayoutWidth, { isMobileWeb }),
    [isMobileWeb, slideLayoutWidth]
  );
  const uri = useMemo(
    () => getHeroSlideImageUri(slide?.url, { layoutWidth: slideLayoutWidth, isMobileWeb }),
    [isMobileWeb, slideLayoutWidth, slide?.url]
  );
  const phoneFrameHeight = useMemo(() => {
    if (!isContain) return undefined;
    const ratio =
      slideHeightRatio > 0
        ? slideHeightRatio
        : slide?.heightRatio > 0
          ? slide.heightRatio
          : WEB_HERO_PORTRAIT_RATIO;
    return resolvePhoneHeroFrameHeight(slideLayoutWidth, ratio, layoutHeight);
  }, [isContain, layoutHeight, slide?.heightRatio, slideHeightRatio, slideLayoutWidth]);
  const label =
    slide?.accessibilityLabel ||
    slide?.title ||
    slide?.headline ||
    slide?.caption ||
    "Hero slide";

  if (!uri) return null;

  const containMediaStyle = fillParent
    ? styles.heroContainMediaFill
    : { width: "100%", height: phoneFrameHeight, backgroundColor: HERO_PHONE_FIT_BG };

  if (Platform.OS !== "web" && isContain && phoneFrameHeight) {
    return (
      <View
        style={fillParent ? styles.heroContainFill : [styles.heroContainFrame, { height: phoneFrameHeight }]}
      >
        <Image
          source={{ uri }}
          className={kenClass}
          style={containMediaStyle}
          contentFit="contain"
          contentPosition={contentPosition || "top"}
          transition={active ? 300 : 0}
          priority={active ? "high" : "normal"}
          cachePolicy="memory-disk"
          recyclingKey={String(slide.id || slide.key || uri)}
          accessibilityLabel={label}
        />
      </View>
    );
  }

  if (Platform.OS === "web" && isMobileWeb && isContain && phoneFrameHeight) {
    return (
      <View
        style={fillParent ? styles.heroContainFill : [styles.heroContainFrame, { height: phoneFrameHeight }]}
      >
        <HtmlImg
          src={uri}
          alt={label}
          loading={active || useNativeLcp ? "eager" : "lazy"}
          fetchPriority={active || useNativeLcp ? "high" : "auto"}
          decoding="async"
          width={deliveryWidth}
          height={fillParent ? phoneFrameHeight : phoneFrameHeight}
          sizes={`(max-width: 560px) ${deliveryWidth}px, 100vw`}
          className={mediaClassName}
          style={{
            width: "100%",
            height: fillParent ? "100%" : phoneFrameHeight,
            objectFit: "contain",
            objectPosition: "top center",
            display: "block",
            backgroundColor: HERO_PHONE_FIT_BG,
          }}
          onLoad={useNativeLcp ? onImageReady : undefined}
        />
      </View>
    );
  }

  if (Platform.OS === "web") {
    return (
      <ProgressiveImage
        uri={uri}
        alt={label}
        className={mediaClassName}
        imageClassName={kenClass}
        style={[styles.heroSlideImage, isContain && styles.heroSlideImageContain]}
        contentFit={imageFit}
        contentPosition={contentPosition || (isMobileWeb ? "top" : "center")}
        priority={active || useNativeLcp ? "high" : "low"}
        width={deliveryWidth}
        quality="auto:good"
        showSkeleton={!active && !useNativeLcp}
        recyclingKey={String(slide.id || slide.key || uri)}
        onLoad={useNativeLcp ? onImageReady : undefined}
      />
    );
  }

  return (
    <Image
      source={{ uri }}
      className={kenClass}
      style={[styles.heroSlideImage, isContain && styles.heroSlideImageContain]}
      contentFit={imageFit}
      contentPosition={contentPosition}
      transition={active ? 300 : 0}
      priority={active ? "high" : "normal"}
      cachePolicy="memory-disk"
      recyclingKey={String(slide.id || slide.key || uri)}
      accessibilityLabel={label}
    />
  );
}

function HeroPhoneScrim({ zone = "bottom", ctaOnly = false }) {
  if (zone === "top") {
    return (
      <>
        <LinearGradient
          colors={["rgba(8,6,4,0.72)", "rgba(8,6,4,0.38)", "transparent", "transparent"]}
          locations={[0, 0.22, 0.48, 1]}
          style={[StyleSheet.absoluteFillObject, styles.scrimLayer]}
          pointerEvents="none"
        />
        <LinearGradient
          colors={["transparent", "transparent", "rgba(8,6,4,0.12)", "rgba(8,6,4,0.42)"]}
          locations={[0, 0.55, 0.82, 1]}
          style={[StyleSheet.absoluteFillObject, styles.scrimLayer]}
          pointerEvents="none"
        />
      </>
    );
  }
  if (ctaOnly) {
    return (
      <LinearGradient
        colors={["transparent", "transparent", "rgba(8,6,4,0.28)", "rgba(8,6,4,0.58)"]}
        locations={[0, 0.55, 0.78, 1]}
        style={[StyleSheet.absoluteFillObject, styles.scrimLayer]}
        pointerEvents="none"
      />
    );
  }
  return (
    <>
      <LinearGradient
        colors={["rgba(8,6,4,0.14)", "transparent", "transparent"]}
        locations={[0, 0.28, 1]}
        style={[StyleSheet.absoluteFillObject, styles.scrimLayer]}
        pointerEvents="none"
      />
      <LinearGradient
        colors={["transparent", "rgba(8,6,4,0.18)", "rgba(8,6,4,0.62)", "rgba(8,6,4,0.82)"]}
        locations={[0.38, 0.62, 0.82, 1]}
        style={[StyleSheet.absoluteFillObject, styles.scrimLayer]}
        pointerEvents="none"
      />
    </>
  );
}

function HeroBottomScrim({ editorial, isBanner, isNative, isProduct, phoneZone, phoneCtaOnly }) {
  if (isNative && phoneZone) {
    return <HeroPhoneScrim zone={phoneZone} ctaOnly={phoneCtaOnly} />;
  }
  if (isProduct) {
    return <HeroProductScrim />;
  }
  if (isNative) {
    return (
      <>
        <LinearGradient
          colors={["rgba(8,6,4,0.14)", "transparent", "transparent"]}
          locations={[0, 0.28, 1]}
          style={StyleSheet.absoluteFillObject}
          pointerEvents="none"
        />
        <LinearGradient
          colors={["transparent", "rgba(8,6,4,0.18)", "rgba(8,6,4,0.62)", "rgba(8,6,4,0.82)"]}
          locations={[0.38, 0.62, 0.82, 1]}
          style={StyleSheet.absoluteFillObject}
          pointerEvents="none"
        />
      </>
    );
  }
  if (editorial) {
    return (
      <LinearGradient
        colors={["transparent", "transparent", "rgba(8,6,4,0.22)", "rgba(8,6,4,0.68)"]}
        locations={[0, 0.5, 0.78, 1]}
        style={StyleSheet.absoluteFillObject}
        pointerEvents="none"
      />
    );
  }
  if (!isBanner) {
    return (
      <LinearGradient
        colors={["transparent", "rgba(8,6,4,0.55)", "rgba(8,6,4,0.88)"]}
        locations={[0.35, 0.72, 1]}
        style={StyleSheet.absoluteFillObject}
        pointerEvents="none"
      />
    );
  }
  return (
    <LinearGradient
      colors={["rgba(8,6,4,0.12)", "rgba(8,6,4,0.38)", "rgba(8,6,4,0.78)"]}
      locations={[0, 0.5, 1]}
      style={StyleSheet.absoluteFillObject}
      pointerEvents="none"
    />
  );
}

function HeroSlideCard({
  slide,
  active,
  shouldLoadImage = true,
  isDark,
  isBanner,
  isTop,
  showCta,
  onCta,
  reducedMotion,
  editorialEyebrow,
  layoutWidth,
  isNative = false,
  isCompact = false,
  isApp = false,
  isMobileWebTop = false,
  slideLayoutWidth = 960,
  layoutHeight,
  onLcpImageReady,
}) {
  const hasImage = Boolean(slide?.url) && slide.mediaType !== "video";
  const isProduct = !isCompact && !isApp && slide.variant === "product";
  const isPhoneBand = isNative || isMobileWebTop || isApp;
  const captionMode =
    slide.captionMode ||
    (slide.title || slide.subtitle ? "overlay" : slide.cta ? "cta-only" : "overlay");
  const captionZone = isPhoneBand ? slide.captionZone || "bottom" : "bottom";
  const showTextOverlay =
    captionMode !== "none" &&
    !isApp &&
    !isCompact &&
    captionMode === "overlay" &&
    Boolean(slide.title || slide.subtitle);
  const phoneCtaOnly = isPhoneBand && captionMode === "baked";
  const scrimMuted = homeHeroScrimMuted();
  const heroTitleSize = isMobileWebTop
    ? Math.min(28, homeHeroTitleSize(layoutWidth))
    : isProduct && isTop
      ? Math.min(52, homeHeroTitleSize(layoutWidth) + 4)
      : homeHeroTitleSize(layoutWidth);
  const imageFit = resolveHeroImageFit(slide, { isTop, isMobileWebTop, isApp, isNative });
  const isContainFit = imageFit === "contain";
  const isPackagingSlide = slide.id === "hero-packaging" || slide.key === "hero-packaging";
  const marketingArtOnly = captionMode === "none";
  const portraitPosition =
    isPhoneBand && isContainFit
      ? "top"
      : isMobileWebTop && slide?.layout === "portrait"
        ? isContainFit
          ? "top"
          : slide.contentPosition || "top"
        : slide.contentPosition || "center";
  const kenBurns =
    imageFit === "cover" &&
    isTop &&
    active &&
    !isPackagingSlide &&
    Platform.OS === "web" &&
    !reducedMotion &&
    !isMobileWebTop;
  const kenClass = isProduct && kenBurns ? KEN_BURNS_PRODUCT_CLASS : kenBurns ? KEN_BURNS_CLASS : undefined;
  const contentPosition = portraitPosition;
  const captionLeft = isTop && !isMobileWebTop && slide.captionAlign !== "center";
  const eyebrowLabel =
    isNative && editorialEyebrow
      ? editorialEyebrow
      : editorialEyebrow || (isBanner && !isTop ? HOME_HERO_BANNER.kicker : "");
  const useGoldCta = isTop || isNative;
  const slideHeightRatio = resolveHeroSlideHeightRatio(slide, {
    isNative,
    isMobileWeb: isMobileWebTop || isApp,
  });

  return (
    <View
      className={isProduct && Platform.OS === "web" ? HERO_PRODUCT_FRAME_CLASS : undefined}
      style={[
        styles.slideInner,
        isBanner && styles.slideInnerBanner,
        isPhoneBand && styles.slideInnerPhoneFit,
        isPhoneBand && styles.slideInnerPhoneBand,
        isProduct && styles.slideInnerProduct,
      ]}
    >
      {hasImage ? null : (
        <LinearGradient
          colors={isDark ? ["#3a3228", "#d9c096", "#2c2620"] : ["#f1e4c6", "#d9c096", "#2c2620"]}
          locations={[0, 0.48, 1]}
          style={StyleSheet.absoluteFillObject}
        />
      )}
      {slide.mediaType === "video" && Platform.OS === "web" ? (
        active ? (
          <WebHtmlVideo
            source={slide.url}
            active
            layoutWidth={layoutWidth}
            isMobileWeb={isMobileWebTop}
            muted
            loop
            fit={isTop && layoutWidth >= 1080 ? "contain" : "cover"}
            style={styles.mediaFill}
          />
        ) : (
          <View style={[styles.mediaFill, styles.videoPoster]} />
        )
      ) : hasImage && shouldLoadImage ? (
        <HeroSlideImage
          slide={slide}
          imageFit={imageFit}
          contentPosition={contentPosition}
          kenClass={kenClass}
          active={active}
          useNativeLcp={isTop && active && Boolean(onLcpImageReady)}
          slideLayoutWidth={slideLayoutWidth}
          slideHeightRatio={slideHeightRatio}
          layoutHeight={layoutHeight}
          isMobileWeb={isMobileWebTop}
          fillParent={isPhoneBand && isContainFit}
          onImageReady={onLcpImageReady}
        />
      ) : hasImage ? (
        <View style={[styles.mediaFill, styles.videoPoster]} />
      ) : null}

      {isProduct && slide.badge && !marketingArtOnly ? (
        <View style={styles.productBadge} pointerEvents="none">
          <View style={styles.productBadgeDot} />
          <Text style={styles.productBadgeText}>{slide.badge}</Text>
        </View>
      ) : null}

      {!marketingArtOnly ? (
      <HeroBottomScrim
        editorial={
          !isCompact &&
          !isApp &&
          isTop &&
          !isMobileWebTop &&
          !isProduct &&
          slide.layout !== "landscape"
        }
        isBanner={isBanner && !isApp}
        isNative={isNative || isMobileWebTop}
        isProduct={isProduct || (isTop && !isMobileWebTop && slide.layout === "landscape")}
        phoneZone={isPhoneBand ? captionZone : undefined}
        phoneCtaOnly={phoneCtaOnly}
      />
      ) : null}

      {showTextOverlay || (showCta && slide.cta && captionMode !== "none") ? (
        <View
          style={[
            styles.slideCaption,
            isBanner && !isTop && !isNative && styles.slideCaptionBanner,
            isPhoneBand && styles.slideCaptionPhone,
            isApp && styles.slideCaptionApp,
            isPhoneBand && captionZone === "top" && styles.slideCaptionPhoneTop,
            isPhoneBand && captionZone === "bottom" && styles.slideCaptionPhoneBottom,
            isPhoneBand && phoneCtaOnly && styles.slideCaptionPhoneCtaOnly,
            isNative && !isMobileWebTop && styles.slideCaptionNative,
            isMobileWebTop && styles.slideCaptionMobileWeb,
            isTop && !isMobileWebTop && styles.slideCaptionTop,
            captionLeft && styles.slideCaptionTopLeft,
          ]}
          pointerEvents="box-none"
        >
          {showTextOverlay && (isPhoneBand || isApp) ? (
            <View style={styles.phoneCaptionStack} pointerEvents="box-none">
              {isApp && editorialEyebrow ? (
                <Text style={styles.heroEyebrowApp} numberOfLines={1}>
                  {String(editorialEyebrow).toUpperCase()}
                </Text>
              ) : null}
              {(isTop || isNative) && eyebrowLabel && !isMobileWebTop && !isApp ? (
                <Text
                  style={[
                    isNative ? styles.heroEyebrowNative : styles.heroEyebrow,
                    captionLeft && styles.heroEyebrowLeft,
                    { color: scrimMuted },
                  ]}
                  numberOfLines={1}
                >
                  {String(eyebrowLabel).toUpperCase()}
                </Text>
              ) : null}
              {isMobileWebTop && eyebrowLabel ? (
                <Text style={[styles.heroEyebrowMobileWeb, { color: scrimMuted }]} numberOfLines={1}>
                  {String(eyebrowLabel).toUpperCase()}
                </Text>
              ) : null}
              {!isTop && isBanner && !isNative && eyebrowLabel ? (
                <Text style={[createKankregEyebrowStyle(isDark), styles.captionEyebrowCenter]}>
                  {eyebrowLabel}
                </Text>
              ) : null}
              {slide.title ? (
                <Text
                  style={[
                    styles.slideTitle,
                    isApp && styles.slideTitleApp,
                    isTop &&
                      !isMobileWebTop && {
                        fontSize: heroTitleSize,
                        lineHeight: Math.round(heroTitleSize * HOME_TYPE.hero.lineHeightRatio),
                      },
                    isMobileWebTop && styles.slideTitleMobileWeb,
                    isProduct && isTop && styles.slideTitleProduct,
                    isBanner && !isTop && !isNative && !isApp && styles.slideTitleBanner,
                    isPhoneBand && !isApp && styles.slideTitlePhone,
                    (isBanner || isTop) && !captionLeft && styles.captionTextCenter,
                    captionLeft && styles.captionTextLeft,
                  ]}
                  numberOfLines={isApp ? 2 : isPhoneBand ? 2 : isMobileWebTop ? 2 : isTop ? 3 : 2}
                >
                  {slide.title}
                </Text>
              ) : null}
              {slide.subtitle ? (
                <Text
                  style={[
                    styles.slideSubtitle,
                    isApp && styles.slideSubtitleApp,
                    isTop && !isMobileWebTop && styles.slideSubtitleTop,
                    isBanner && !isTop && !isNative && !isApp && styles.slideSubtitleBanner,
                    isPhoneBand && !isApp && styles.slideSubtitlePhone,
                    isMobileWebTop && styles.slideSubtitleMobileWeb,
                    (isBanner || isTop) && !captionLeft && styles.captionTextCenter,
                    captionLeft && styles.captionTextLeft,
                  ]}
                  numberOfLines={isApp ? 2 : isPhoneBand ? 3 : isMobileWebTop ? 2 : isTop ? 2 : isBanner ? 3 : 2}
                >
                  {slide.subtitle}
                </Text>
              ) : null}
              {isApp && slide.cta ? (
                <View style={styles.appCtaPill} pointerEvents="none">
                  <Text style={styles.appCtaText}>{slide.cta}</Text>
                  <Ionicons name="arrow-forward" size={icon.xs - 1} color={KANKREG_PALETTE.goldBright} />
                </View>
              ) : null}
            </View>
          ) : (
            <>
              {(isTop || isNative) && eyebrowLabel && !isMobileWebTop ? (
                <Text
                  style={[
                    isNative ? styles.heroEyebrowNative : styles.heroEyebrow,
                    captionLeft && styles.heroEyebrowLeft,
                    { color: scrimMuted },
                  ]}
                  numberOfLines={1}
                >
                  {String(eyebrowLabel).toUpperCase()}
                </Text>
              ) : null}
              {isMobileWebTop && eyebrowLabel ? (
                <Text style={[styles.heroEyebrowMobileWeb, { color: scrimMuted }]} numberOfLines={1}>
                  {String(eyebrowLabel).toUpperCase()}
                </Text>
              ) : null}
              {!isTop && isBanner && !isNative && eyebrowLabel ? (
                <Text style={[createKankregEyebrowStyle(isDark), styles.captionEyebrowCenter]}>
                  {eyebrowLabel}
                </Text>
              ) : null}
              {slide.title ? (
                <Text
                  style={[
                    styles.slideTitle,
                    isTop &&
                      !isMobileWebTop && {
                        fontSize: heroTitleSize,
                        lineHeight: Math.round(heroTitleSize * HOME_TYPE.hero.lineHeightRatio),
                      },
                    isMobileWebTop && styles.slideTitleMobileWeb,
                    isProduct && isTop && styles.slideTitleProduct,
                    isBanner && !isTop && !isNative && styles.slideTitleBanner,
                    isNative && styles.slideTitleNative,
                    (isBanner || isTop) && !captionLeft && styles.captionTextCenter,
                    captionLeft && styles.captionTextLeft,
                  ]}
                  numberOfLines={isMobileWebTop ? 2 : isTop ? 3 : 2}
                >
                  {slide.title}
                </Text>
              ) : null}
              {slide.subtitle ? (
                <Text
                  style={[
                    styles.slideSubtitle,
                    isTop && !isMobileWebTop && styles.slideSubtitleTop,
                    isBanner && !isTop && !isNative && styles.slideSubtitleBanner,
                    isNative && styles.slideSubtitleNative,
                    isMobileWebTop && styles.slideSubtitleMobileWeb,
                    (isBanner || isTop) && !captionLeft && styles.captionTextCenter,
                    captionLeft && styles.captionTextLeft,
                  ]}
                  numberOfLines={isMobileWebTop ? 2 : isTop ? 2 : isBanner ? 3 : 2}
                >
                  {slide.subtitle}
                </Text>
              ) : null}
            </>
          )}
          {showCta && slide.cta ? (
            <Pressable
              onPress={onCta}
              style={({ hovered, focused, pressed }) => [
                useGoldCta ? styles.ctaPillGold : styles.ctaPill,
                (isBanner || isTop) && !captionLeft && styles.ctaPillCenter,
                captionLeft && styles.ctaPillStart,
                isNative && styles.ctaPillNative,
                useGoldCta && !captionLeft && styles.ctaPillGoldCenter,
                useGoldCta && captionLeft && styles.ctaPillGoldStart,
                isPhoneBand && styles.ctaPillPhone,
                phoneCtaOnly && styles.ctaPillPhoneFloating,
                pressed && Platform.OS !== "web" ? styles.ctaPillPressed : null,
                hovered && Platform.OS === "web" ? (useGoldCta ? styles.ctaPillGoldHover : styles.ctaPillHover) : null,
                focused && Platform.OS === "web" ? styles.ctaFocus : null,
              ]}
              accessibilityRole="button"
              accessibilityLabel={slide.cta}
            >
              <Text style={useGoldCta ? styles.ctaTextGold : styles.ctaText}>{slide.cta}</Text>
            </Pressable>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

/** Premium hero carousel — `top` web banner, `native` phone band, `card` sidebar. */
export default function HeroMediaSlider({
  slides = [],
  variant = "card",
  onPress,
  editorialEyebrow = "",
  cardEmbedded = false,
}) {
  const { isDark } = useTheme();
  const { isMobileWeb, width: layoutWidth, height: layoutHeight } =
    useKankregLayout();
  const reducedMotion = useReducedMotion();
  const isTop = variant === "top";
  const isNative = variant === "native";
  const isCompact = variant === "compact";
  const isApp = variant === "app";
  const isMobileWebTop = isTop && isMobileWeb && layoutWidth < KANKREG_BP.news;
  const isBanner = isTop || isNative || isCompact || isApp;
  const useWebAspectFrame = isTop && Platform.OS === "web" && !isMobileWebTop;

  const scrollRef = useRef(null);
  const indexRef = useRef(0);
  const pauseAutoRef = useRef(false);
  const [pageWidth, setPageWidth] = useState(0);
  const [index, setIndex] = useState(0);
  const [slidesWarmed, setSlidesWarmed] = useState(false);
  const count = slides.length;

  indexRef.current = index;
  const slideWidth = pageWidth > 0 ? pageWidth : Math.floor(layoutWidth);
  const heroImageWidth = useMemo(
    () => getHeroSlideDisplayWidth(slideWidth || layoutWidth, { isMobileWeb: isMobileWebTop || isMobileWeb }),
    [isMobileWeb, isMobileWebTop, layoutWidth, slideWidth]
  );

  const activeSlide = slides[index] || slides[0];
  const lcpShellDismissedRef = useRef(false);
  const dismissLcpShell = useCallback(() => {
    if (lcpShellDismissedRef.current || !hasLcpShell()) return;
    lcpShellDismissedRef.current = true;
    setLcpShellVisible(false);
  }, []);

  useEffect(() => {
    if (Platform.OS !== "web" || !hasLcpShell()) return undefined;
    const fallback = setTimeout(dismissLcpShell, 10000);
    return () => clearTimeout(fallback);
  }, [dismissLcpShell]);

  /** Phone: shell height tracks the active slide’s width-perfect poster ratio. */
  const slideFrameHeights = useMemo(() => {
    const phoneBand = isNative || isApp || (isTop && isMobileWeb);
    if (!phoneBand || !slideWidth) return [];
    return slides.map((slide) =>
      resolvePhoneHeroFrameHeight(
        slideWidth,
        resolveHeroSlideHeightRatio(slide, {
          isNative,
          isMobileWeb: isMobileWeb || isApp,
        }),
        layoutHeight
      )
    );
  }, [isApp, isMobileWeb, isNative, isTop, layoutHeight, slideWidth, slides]);

  const bannerHeightRatio = useMemo(() => {
    const phonePerSlide = (isTop && isMobileWeb) || isApp || isNative;
    if (phonePerSlide && activeSlide) {
      return resolveHeroSlideHeightRatio(activeSlide, {
        isNative,
        isMobileWeb: isMobileWeb || isApp,
      });
    }
    if (!slides.length) {
      return resolveHeroSlideHeightRatio(activeSlide, { isNative, isMobileWeb });
    }
    return Math.max(
      ...slides.map((slide) => resolveHeroSlideHeightRatio(slide, { isNative, isMobileWeb }))
    );
  }, [activeSlide, isApp, isMobileWeb, isNative, isTop, slides]);

  const bannerHeight = useMemo(() => {
    const w = slideWidth;
    if (!w) return undefined;
    const natural = Math.round(w * bannerHeightRatio);

    if (slideFrameHeights.length && slideFrameHeights[index] > 0) {
      return slideFrameHeights[index];
    }

    if (isNative) {
      return resolvePhoneHeroFrameHeight(w, bannerHeightRatio, layoutHeight);
    }
    if (isCompact) {
      const target = Math.round(w * HOME_HERO_COMPACT_HEIGHT_RATIO);
      return Math.min(
        HOME_HERO_COMPACT_MAX_HEIGHT,
        Math.max(HOME_HERO_COMPACT_MIN_HEIGHT, target)
      );
    }
    if (isApp && Platform.OS !== "web") {
      return resolvePhoneHeroFrameHeight(w, bannerHeightRatio, layoutHeight);
    }
    if (isTop) {
      if (isMobileWeb) {
        return resolvePhoneHeroFrameHeight(w, bannerHeightRatio, layoutHeight);
      }
      // 21:9 — height from width; only shrink on very short viewports
      const vhCap = Math.round((layoutHeight || 900) * 0.85);
      return Math.min(natural, vhCap);
    }
    return undefined;
  }, [
    bannerHeightRatio,
    index,
    isApp,
    isCompact,
    isMobileWeb,
    isNative,
    isTop,
    layoutHeight,
    slideFrameHeights,
    slideWidth,
  ]);

  useEffect(() => {
    if (!slides.length) return undefined;
    const imageSlides = slides.filter((slide) => slide.mediaType !== "video" && slide.url);
    if (Platform.OS === "web") {
      const eagerCount = 1;
      prefetchDisplayImages(
        imageSlides.map((slide) =>
          getHeroSlideImageUri(slide.url, {
            layoutWidth: slideWidth || layoutWidth,
            isMobileWeb: isMobileWebTop || isMobileWeb,
          })
        ),
        {
          eagerCount,
          width: heroImageWidth,
          quality: "auto:good",
          warmupAll: slidesWarmed && !isMobileWeb,
        }
      );
      return undefined;
    }
    imageSlides.forEach((slide) => {
      const uri = getHeroSlideImageUri(slide.url, {
        layoutWidth: slideWidth || layoutWidth,
        isMobileWeb: isMobileWebTop || isMobileWeb,
      });
      if (uri) Image.prefetch(uri).catch(() => {});
    });
    return undefined;
  }, [heroImageWidth, isMobileWeb, isMobileWebTop, layoutWidth, slideWidth, slides, slidesWarmed]);

  const syncIndexFromOffset = useCallback(
    (offsetX, pageW) => {
      const pageWidthPx = Math.floor(pageW) || slideWidth || 1;
      const current = Math.round(offsetX / pageWidthPx);
      setIndex(Math.max(0, Math.min(current, count - 1)));
    },
    [count, slideWidth]
  );

  const pauseAutoplay = useCallback(() => {
    pauseAutoRef.current = true;
  }, []);

  const resumeAutoplaySoon = useCallback(() => {
    setTimeout(() => {
      pauseAutoRef.current = false;
    }, 4000);
  }, []);

  const goTo = useCallback(
    (next) => {
      if (!count || slideWidth <= 0) return;
      const clamped = ((next % count) + count) % count;
      setIndex(clamped);
      scrollRef.current?.scrollTo?.({ x: clamped * slideWidth, y: 0, animated: !reducedMotion });
    },
    [count, reducedMotion, slideWidth]
  );

  useEffect(() => {
    if (pageWidth <= 0) return;
    scrollRef.current?.scrollTo?.({ x: indexRef.current * pageWidth, y: 0, animated: false });
  }, [pageWidth]);

  useEffect(() => {
    if (!isMobileWebTop || Platform.OS !== "web") return undefined;
    const run = () => setSlidesWarmed(true);
    if (typeof requestIdleCallback === "function") {
      const id = requestIdleCallback(run, { timeout: 1800 });
      return () => {
        if (typeof cancelIdleCallback === "function") cancelIdleCallback(id);
      };
    }
    const timer = setTimeout(run, 600);
    return () => clearTimeout(timer);
  }, [isMobileWebTop]);

  useEffect(() => {
    if (reducedMotion || count <= 1 || slideWidth <= 0) return undefined;
    const timer = setInterval(() => {
      if (pauseAutoRef.current) return;
      goTo(indexRef.current + 1);
    }, SLIDE_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [count, goTo, reducedMotion, slideWidth]);

  if (!count) return null;

  const useSnapPaging =
    slideWidth > 0 && (isNative || isApp || isMobileWebTop);
  const showArrows =
    count > 1 && slideWidth > 0 && !isApp && !isMobileWebTop && (isBanner || Platform.OS === "web");
  const progress = ((index + 1) / count) * 100;
  const shellStyle = isApp
    ? styles.shellApp
    : isCompact
      ? styles.shellCompact
      : isTop
        ? styles.shellTop
        : isNative
          ? styles.shellNative
          : [styles.shellCard, cardShadow];
  const chromeBottom = isApp ? 14 : isCompact ? 10 : isNative || isMobileWebTop ? 12 : isTop ? 20 : 12;
  const useQuietNav = isTop || isNative || isCompact || isApp;
  const usePhoneChrome = isNative || isMobileWebTop;
  const useAppChrome = isApp;

  return (
    <View
      accessibilityRole={Platform.OS === "web" ? "region" : undefined}
      accessibilityLabel={Platform.OS === "web" ? "Hero carousel" : undefined}
      onLayout={(e) => {
        const w = Math.floor(e.nativeEvent.layout.width);
        if (w > 0 && w !== pageWidth) setPageWidth(w);
      }}
      style={[
        shellStyle,
        isMobileWebTop && styles.shellMobileWeb,
        cardEmbedded && isApp && styles.shellAppEmbedded,
        isBanner && useWebAspectFrame && styles.shellAspect21x9,
        isBanner && !useWebAspectFrame && bannerHeight ? { height: bannerHeight } : null,
        isBanner && isMobileWebTop && styles.shellMobileWebAnimated,
        isBanner && !isMobileWebTop && !isApp && styles.shellBannerBase,
      ]}
    >
      {isNative || (isApp && !cardEmbedded) ? (
        <View style={styles.nativeGoldRail} pointerEvents="none" />
      ) : null}

      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled={slideWidth > 0 && !isMobileWebTop}
        snapToInterval={useSnapPaging ? slideWidth : undefined}
        snapToAlignment="start"
        nestedScrollEnabled
        showsHorizontalScrollIndicator={false}
        scrollEventThrottle={16}
        decelerationRate="fast"
        disableIntervalMomentum
        overScrollMode={Platform.OS === "android" ? "never" : undefined}
        bounces={count > 1}
        onTouchStart={pauseAutoplay}
        onTouchEnd={resumeAutoplaySoon}
        onScrollBeginDrag={pauseAutoplay}
        onScroll={(e) => {
          const { contentOffset, layoutMeasurement } = e.nativeEvent;
          syncIndexFromOffset(contentOffset.x, layoutMeasurement.width);
        }}
        onMomentumScrollEnd={(e) => {
          const { contentOffset, layoutMeasurement } = e.nativeEvent;
          syncIndexFromOffset(contentOffset.x, layoutMeasurement.width);
          resumeAutoplaySoon();
        }}
        onScrollEndDrag={(e) => {
          const { contentOffset, layoutMeasurement } = e.nativeEvent;
          syncIndexFromOffset(contentOffset.x, layoutMeasurement.width);
        }}
        style={[
          styles.scroller,
          isMobileWebTop &&
            Platform.OS === "web" && {
              scrollSnapType: "x mandatory",
              WebkitOverflowScrolling: "touch",
            },
        ]}
        {...(isMobileWebTop && Platform.OS === "web"
          ? { className: HERO_MOBILE_SCROLLER_CLASS }
          : {})}
        contentContainerStyle={slideWidth > 0 ? { width: slideWidth * count } : undefined}
      >
        {slides.map((slide, slideIndex) => {
          /** Avoid <button> inside <button> — top slides use the inner CTA only. */
          const PageWrap = isTop ? View : Pressable;
          const pageWrapProps = isTop
            ? { style: styles.pagePress }
            : {
                onPress,
                style: styles.pagePress,
                accessibilityRole: "button",
                accessibilityLabel: slide.title || "Shop Zeevan",
              };

          return (
            <View
              key={slide.id}
              style={[
                styles.page,
                slideWidth > 0 ? { width: slideWidth } : styles.pageFlex,
                isMobileWebTop &&
                  Platform.OS === "web" && {
                    scrollSnapAlign: "start",
                    scrollSnapStop: "always",
                  },
              ]}
              {...(isMobileWebTop && Platform.OS === "web"
                ? { className: HERO_MOBILE_PAGE_CLASS }
                : {})}
            >
              <PageWrap {...pageWrapProps}>
                <HeroSlideCard
                  slide={slide}
                  active={slideIndex === index}
                  shouldLoadImage={
                    slidesWarmed ||
                    !isMobileWebTop ||
                    slideIndex === index
                  }
                  isDark={isDark}
                  isBanner={isBanner}
                  isTop={isTop}
                  isNative={isNative}
                  isCompact={isCompact}
                  isApp={isApp}
                  isMobileWebTop={isMobileWebTop}
                  showCta={isBanner && !isCompact && !isApp}
                  onCta={onPress}
                  reducedMotion={reducedMotion}
                  editorialEyebrow={editorialEyebrow}
                  layoutWidth={layoutWidth}
                  slideLayoutWidth={slideWidth || layoutWidth}
                  layoutHeight={layoutHeight}
                  onLcpImageReady={isTop && slideIndex === 0 && hasLcpShell() ? dismissLcpShell : undefined}
                />
              </PageWrap>
            </View>
          );
        })}
      </ScrollView>

      {showArrows ? (
        <>
          <HeroNavButton
            direction="prev"
            onPress={() => goTo(index - 1)}
            style={[styles.navPrev, usePhoneChrome && styles.navPrevNative]}
            quiet={useQuietNav}
          />
          <HeroNavButton
            direction="next"
            onPress={() => goTo(index + 1)}
            style={[styles.navNext, usePhoneChrome && styles.navNextNative]}
            quiet={useQuietNav}
          />
        </>
      ) : null}

      {count > 1 && useAppChrome ? (
        <View style={styles.chromeAppMinimal} pointerEvents="box-none">
          <View style={styles.dotsAppPill}>
            {slides.map((slide, dotIndex) => (
              <Pressable
                key={slide.id}
                onPress={() => goTo(dotIndex)}
                hitSlop={8}
                style={styles.dotAppHit}
                accessibilityRole="button"
                accessibilityLabel={`Go to slide ${dotIndex + 1}`}
                accessibilityState={{ selected: dotIndex === index }}
              >
                <View style={[styles.dotApp, dotIndex === index && styles.dotAppActive]} />
              </Pressable>
            ))}
          </View>
        </View>
      ) : count > 1 ? (
        <>
          {usePhoneChrome ? (
            <LinearGradient
              colors={["transparent", "rgba(8,6,4,0.5)"]}
              style={styles.chromeScrimNative}
              pointerEvents="none"
            />
          ) : null}
          <View
            style={[
              styles.chrome,
              isTop && !isMobileWebTop && styles.chromeTop,
              usePhoneChrome && styles.chromeNative,
              { paddingBottom: chromeBottom },
            ]}
            pointerEvents="box-none"
          >
            <View
              style={[
                styles.progressTrack,
                isTop && !isMobileWebTop && styles.progressTrackTop,
                usePhoneChrome && styles.progressTrackNative,
              ]}
            >
              <View
                style={[
                  styles.progressFill,
                  isTop && !isMobileWebTop && styles.progressFillTop,
                  usePhoneChrome && styles.progressFillNative,
                  { width: `${progress}%` },
                ]}
              />
            </View>
            <View style={styles.chromeRow}>
              <Text
                style={[
                  styles.counter,
                  isTop && !isMobileWebTop && styles.counterTop,
                  usePhoneChrome && styles.counterNative,
                ]}
                {...(Platform.OS === "web"
                  ? { accessibilityLiveRegion: "polite", accessibilityLabel: `Slide ${index + 1} of ${count}` }
                  : null)}
              >
                {String(index + 1).padStart(2, "0")}
                <Text style={styles.counterSep}> / </Text>
                {String(count).padStart(2, "0")}
              </Text>
              <View style={[styles.dots, usePhoneChrome && styles.dotsNative]}>
                {slides.map((slide, dotIndex) => (
                  <Pressable
                    key={slide.id}
                    onPress={() => goTo(dotIndex)}
                    hitSlop={12}
                    style={styles.dotHit}
                    accessibilityRole="button"
                    accessibilityLabel={`Go to slide ${dotIndex + 1}`}
                    accessibilityState={{ selected: dotIndex === index }}
                  >
                    <View
                      style={[
                        isNative || isMobileWebTop ? styles.dotNative : isTop ? styles.dotTop : styles.dot,
                        dotIndex === index &&
                          (isNative || isMobileWebTop
                            ? styles.dotNativeActive
                            : isTop
                              ? styles.dotTopActive
                              : styles.dotActive),
                      ]}
                    />
                  </Pressable>
                ))}
              </View>
              <Text style={styles.counterSpacer} accessibilityElementsHidden>
                {String(index + 1).padStart(2, "0")}
              </Text>
            </View>
          </View>
        </>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  shellBannerBase: {
    width: "100%",
    maxWidth: "100%",
    alignSelf: "stretch",
  },
  shellCard: {
    width: "100%",
    maxWidth: 480,
    aspectRatio: 5 / 6,
    borderRadius: 26,
    overflow: "hidden",
    position: "relative",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255,255,255,0.14)",
    alignSelf: "center",
  },
  shellTop: {
    width: "100%",
    maxWidth: "100%",
    alignSelf: "stretch",
    aspectRatio: undefined,
    borderRadius: 0,
    borderWidth: 0,
    overflow: "hidden",
    position: "relative",
    backgroundColor: "#1a1410",
    ...Platform.select({
      web: {
        boxShadow: "0 28px 64px -36px rgba(25,20,15,.32)",
      },
      default: {},
    }),
  },
  /** Desktop web — lock slider to 21:9 so images fill edge-to-edge without crop. */
  shellAspect21x9: Platform.select({
    web: {
      width: "100%",
      aspectRatio: 21 / 9,
      maxHeight: "85vh",
    },
    default: {},
  }),
  /** Phone web — cream frame so contain-fit product art reads cleanly. */
  shellMobileWeb: {
    width: "100%",
    maxWidth: "100%",
    alignSelf: "stretch",
    borderRadius: 0,
    borderWidth: 0,
    overflow: "hidden",
    backgroundColor: HERO_PHONE_FIT_BG,
    ...Platform.select({
      web: {
        boxShadow: "none",
      },
      default: {},
    }),
  },
  shellMobileWebAnimated: Platform.select({
    web: {
      transitionProperty: "height",
      transitionDuration: "0.32s",
      transitionTimingFunction: "ease",
    },
    default: {},
  }),
  shellNative: {
    width: "100%",
    maxWidth: "100%",
    alignSelf: "stretch",
    aspectRatio: undefined,
    borderRadius: 24,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(31, 92, 71, 0.32)",
    overflow: "hidden",
    position: "relative",
    backgroundColor: "#14110e",
    ...Platform.select({
      ios: {
        shadowColor: "#19140f",
        shadowOffset: { width: 0, height: 16 },
        shadowOpacity: 0.2,
        shadowRadius: 28,
      },
      android: { elevation: 8 },
      default: {},
    }),
  },
  shellCompact: {
    width: "100%",
    maxWidth: "100%",
    alignSelf: "stretch",
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(31, 92, 71, 0.24)",
    overflow: "hidden",
    position: "relative",
    backgroundColor: "#14110e",
    ...Platform.select({
      web: {
        boxShadow: "0 12px 28px -16px rgba(25,20,15,.28)",
      },
      ios: {
        shadowColor: "#19140f",
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.14,
        shadowRadius: 16,
      },
      android: { elevation: 4 },
      default: {},
    }),
  },
  shellApp: {
    width: "100%",
    maxWidth: "100%",
    alignSelf: "stretch",
    borderRadius: 20,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(31, 92, 71, 0.36)",
    overflow: "hidden",
    position: "relative",
    backgroundColor: HERO_PHONE_FIT_BG,
    ...Platform.select({
      ios: {
        shadowColor: "#3D2A12",
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.22,
        shadowRadius: 22,
      },
      android: { elevation: 7 },
      default: {},
    }),
  },
  shellAppEmbedded: {
    borderWidth: 0,
    borderRadius: 0,
    ...Platform.select({
      ios: { shadowOpacity: 0, shadowRadius: 0 },
      android: { elevation: 0 },
      default: {},
    }),
  },
  chromeAppMinimal: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 12,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 5,
  },
  dotsAppPill: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 999,
    backgroundColor: "rgba(8, 6, 4, 0.42)",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255,255,255,0.12)",
  },
  dotAppHit: {
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 2,
  },
  dotApp: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "rgba(255,255,255,0.42)",
  },
  dotAppActive: {
    width: 18,
    height: 6,
    borderRadius: 3,
    backgroundColor: KANKREG_PALETTE.goldBright,
  },
  nativeGoldRail: {
    position: "absolute",
    top: 0,
    left: 18,
    right: 18,
    height: StyleSheet.hairlineWidth,
    backgroundColor: "rgba(42, 117, 89, 0.45)",
    zIndex: 6,
  },
  scroller: {
    flex: 1,
    width: "100%",
  },
  page: {
    height: "100%",
    overflow: "hidden",
  },
  pageFlex: {
    width: "100%",
  },
  pagePress: {
    flex: 1,
    width: "100%",
    height: "100%",
  },
  slideInner: {
    flex: 1,
    position: "relative",
    overflow: "hidden",
    backgroundColor: "#2c2620",
    width: "100%",
  },
  slideInnerBanner: {
    minHeight: "100%",
    backgroundColor: "#1a1410",
  },
  slideInnerPhoneFit: {
    backgroundColor: HERO_PHONE_FIT_BG,
  },
  slideInnerPhoneBand: {
    flex: 1,
    minHeight: "100%",
    justifyContent: "flex-start",
  },
  slideInnerProduct: {
    backgroundColor: "#1a1410",
  },
  productBadge: {
    position: "absolute",
    top: 18,
    left: 18,
    zIndex: 5,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: radius.pill,
    backgroundColor: "rgba(28, 18, 8, 0.58)",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255, 253, 248, 0.16)",
    ...Platform.select({
      web: { backdropFilter: "blur(8px)" },
      default: {},
    }),
  },
  productBadgeDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: KANKREG_PALETTE.gold,
  },
  productBadgeText: {
    fontFamily: fonts.semibold,
    fontSize: 10,
    letterSpacing: 0.9,
    textTransform: "uppercase",
    color: "rgba(255, 253, 248, 0.88)",
  },
  mediaFill: {
    ...StyleSheet.absoluteFillObject,
  },
  heroSlideImage: {
    ...StyleSheet.absoluteFillObject,
    width: "100%",
    height: "100%",
    zIndex: 1,
    backgroundColor: "transparent",
  },
  heroSlideImageContain: {
    backgroundColor: HERO_PHONE_FIT_BG,
  },
  heroContainFrame: {
    width: "100%",
    alignSelf: "stretch",
    overflow: "hidden",
    backgroundColor: HERO_PHONE_FIT_BG,
    zIndex: 1,
  },
  heroContainFill: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: HERO_PHONE_FIT_BG,
    zIndex: 1,
  },
  heroContainMediaFill: {
    width: "100%",
    height: "100%",
    backgroundColor: HERO_PHONE_FIT_BG,
  },
  scrimLayer: {
    zIndex: 2,
  },
  videoPoster: {
    backgroundColor: "rgba(28,25,23,0.35)",
  },
  slideCaption: {
    position: "absolute",
    left: 20,
    right: 20,
    bottom: 56,
    zIndex: 4,
  },
  slideCaptionBanner: {
    left: 0,
    right: 0,
    bottom: 64,
    paddingHorizontal: spacing.lg,
    alignItems: "center",
    maxWidth: 640,
    alignSelf: "center",
    width: "100%",
  },
  slideCaptionNative: {
    left: 0,
    right: 0,
    paddingHorizontal: spacing.lg + 4,
    alignItems: "center",
    alignSelf: "center",
    width: "100%",
    gap: spacing.xs,
  },
  slideCaptionPhone: {
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    alignItems: "center",
    alignSelf: "center",
    width: "100%",
    maxWidth: 380,
    gap: 8,
  },
  slideCaptionPhoneTop: {
    top: 18,
    bottom: undefined,
    paddingTop: 4,
  },
  slideCaptionPhoneBottom: {
    top: undefined,
    bottom: 102,
  },
  slideCaptionApp: {
    left: 0,
    right: 0,
    top: undefined,
    bottom: 56,
    paddingHorizontal: 16,
    alignItems: "flex-start",
    alignSelf: "stretch",
    width: "100%",
    gap: 6,
  },
  heroEyebrowApp: {
    fontFamily: fonts.semibold,
    fontSize: typography.overline - 1,
    letterSpacing: 2.4,
    color: KANKREG_PALETTE.goldBright,
  },
  slideTitleApp: {
    fontFamily: FONT_HEADING,
    fontSize: typography.h3,
    lineHeight: typography.h3 + 6,
    color: "#fff",
    textAlign: "left",
    width: "100%",
  },
  slideSubtitleApp: {
    fontFamily: fonts.regular,
    fontSize: typography.bodySmall,
    lineHeight: typography.bodySmall + 4,
    color: "rgba(255,255,255,0.9)",
    textAlign: "left",
    width: "100%",
  },
  appCtaPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 2,
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(42, 117, 89, 0.45)",
    backgroundColor: "rgba(0,0,0,0.28)",
    alignSelf: "flex-start",
  },
  appCtaText: {
    fontFamily: fonts.semibold,
    fontSize: typography.caption,
    color: KANKREG_PALETTE.goldBright,
  },
  appBadge: {
    position: "absolute",
    top: 12,
    left: 12,
    zIndex: 4,
    paddingVertical: 5,
    paddingHorizontal: 9,
    borderRadius: 999,
    backgroundColor: "rgba(0,0,0,0.42)",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(42, 117, 89, 0.38)",
  },
  appBadgeText: {
    fontFamily: fonts.semibold,
    fontSize: typography.caption - 1,
    color: KANKREG_PALETTE.goldBright,
  },
  slideCaptionPhoneCtaOnly: {
    top: undefined,
    bottom: 88,
    gap: 0,
  },
  phoneCaptionStack: {
    width: "100%",
    alignItems: "center",
    gap: 6,
    paddingVertical: 2,
  },
  slideCaptionTop: {
    left: 0,
    right: 0,
    bottom: 96,
    paddingHorizontal: HOME_SPACE.lg,
    alignItems: "center",
    alignSelf: "center",
    width: "100%",
    maxWidth: 720,
    gap: HOME_SPACE.sm,
    ...Platform.select({
      web: { paddingHorizontal: "max(24px, 4vw)" },
      default: {},
    }),
  },
  slideCaptionTopLeft: {
    alignItems: "flex-start",
    alignSelf: "stretch",
    maxWidth: "52%",
    ...Platform.select({
      web: {
        paddingLeft: "max(32px, 5vw)",
        paddingRight: 24,
        maxWidth: "min(560px, 48vw)",
      },
      default: { maxWidth: "58%" },
    }),
  },
  slideCaptionMobileWeb: {
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    alignItems: "center",
    alignSelf: "center",
    width: "100%",
    gap: 8,
    maxWidth: 380,
  },
  heroEyebrowMobileWeb: {
    fontFamily: fonts.semibold,
    fontSize: 10,
    lineHeight: 14,
    letterSpacing: 1.3,
    textAlign: "center",
    textTransform: "uppercase",
  },
  slideTitleMobileWeb: {
    fontSize: 26,
    lineHeight: 30,
    letterSpacing: -0.45,
    textAlign: "center",
  },
  slideSubtitleMobileWeb: {
    fontSize: 14,
    lineHeight: 20,
    marginTop: 2,
    maxWidth: 300,
    textAlign: "center",
    color: "rgba(245,239,228,0.9)",
  },
  heroEyebrow: {
    fontFamily: fonts.semibold,
    fontSize: HOME_TYPE.eyebrow,
    lineHeight: HOME_TYPE.eyebrow + 4,
    letterSpacing: HOME_EYEBROW_LETTER_SPACING,
    textAlign: "center",
    textTransform: "uppercase",
  },
  heroEyebrowLeft: {
    textAlign: "left",
    alignSelf: "flex-start",
  },
  heroEyebrowNative: {
    fontFamily: fonts.semibold,
    fontSize: 10,
    lineHeight: 14,
    letterSpacing: 1.5,
    textAlign: "center",
    textTransform: "uppercase",
    opacity: 0.94,
    color: "rgba(245,239,228,0.82)",
  },
  captionEyebrowCenter: {
    textAlign: "center",
  },
  captionTextCenter: {
    textAlign: "center",
  },
  captionTextLeft: {
    textAlign: "left",
    alignSelf: "flex-start",
  },
  slideTitle: {
    fontFamily: FONT_HEADING,
    fontSize: 22,
    lineHeight: 26,
    letterSpacing: -0.5,
    color: KANKREG_PALETTE.paper,
  },
  slideTitleProduct: {
    letterSpacing: -0.6,
    ...Platform.select({
      web: { textShadow: "0 2px 18px rgba(0, 0, 0, 0.45)" },
      default: {},
    }),
  },
  slideTitleBanner: {
    fontSize: 34,
    lineHeight: 38,
    letterSpacing: -0.8,
    marginTop: spacing.xs,
  },
  slideTitleNative: {
    fontSize: 30,
    lineHeight: 34,
    letterSpacing: -0.65,
    marginTop: 2,
  },
  slideTitlePhone: {
    fontSize: 28,
    lineHeight: 32,
    letterSpacing: -0.55,
    marginTop: 0,
    maxWidth: 320,
    ...Platform.select({
      ios: {
        textShadowColor: "rgba(0,0,0,0.42)",
        textShadowOffset: { width: 0, height: 2 },
        textShadowRadius: 10,
      },
      android: {
        textShadowColor: "rgba(0,0,0,0.5)",
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 6,
      },
      default: {
        textShadow: "0 2px 16px rgba(0,0,0,0.45)",
      },
    }),
  },
  slideSubtitle: {
    marginTop: 8,
    fontFamily: fonts.regular,
    fontSize: typography.bodySmall,
    lineHeight: 20,
    color: "rgba(245,239,228,0.86)",
  },
  slideSubtitleTop: {
    marginTop: HOME_SPACE.xs,
    fontSize: HOME_TYPE.kicker,
    lineHeight: HOME_TYPE.body.lineHeight,
    color: homeHeroScrimMuted(),
    maxWidth: 480,
  },
  slideSubtitleBanner: {
    fontSize: typography.body,
    lineHeight: 24,
    marginTop: 10,
    maxWidth: 480,
  },
  slideSubtitleNative: {
    fontSize: typography.bodySmall,
    lineHeight: 21,
    marginTop: 6,
    maxWidth: 300,
    color: "rgba(245,239,228,0.9)",
  },
  slideSubtitlePhone: {
    fontSize: 14,
    lineHeight: 20,
    marginTop: 2,
    maxWidth: 310,
    color: "rgba(245,239,228,0.92)",
    ...Platform.select({
      ios: {
        textShadowColor: "rgba(0,0,0,0.38)",
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 8,
      },
      android: {
        textShadowColor: "rgba(0,0,0,0.45)",
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 4,
      },
      default: {
        textShadow: "0 1px 10px rgba(0,0,0,0.4)",
      },
    }),
  },
  ctaPill: {
    marginTop: spacing.md,
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: radius.pill,
    backgroundColor: "rgba(255,253,248,0.94)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.65)",
    ...Platform.select({
      web: { cursor: "pointer", transition: "transform 0.2s ease, box-shadow 0.2s ease" },
      default: {},
    }),
  },
  ctaPillCenter: {
    alignSelf: "center",
  },
  ctaPillStart: {
    alignSelf: "flex-start",
  },
  ctaPillGold: {
    marginTop: HOME_SPACE.md,
    paddingVertical: 12,
    paddingHorizontal: 22,
    borderRadius: radius.pill,
    backgroundColor: KANKREG_CHROME.buttonAccent,
    borderWidth: 0,
    ...Platform.select({
      web: {
        cursor: "pointer",
        transition: "transform 0.22s ease, box-shadow 0.22s ease, background-color 0.22s ease",
        boxShadow: "0 10px 28px -12px rgba(25,20,15,.45)",
      },
      default: {},
    }),
  },
  ctaPillGoldCenter: {
    alignSelf: "center",
  },
  ctaPillGoldStart: {
    alignSelf: "flex-start",
  },
  ctaPillNative: {
    marginTop: spacing.sm + 2,
    paddingVertical: 11,
    paddingHorizontal: 24,
    ...Platform.select({
      ios: {
        shadowColor: "#19140f",
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.28,
        shadowRadius: 10,
      },
      android: { elevation: 4 },
      default: {},
    }),
  },
  ctaPillPhone: {
    marginTop: 10,
    paddingVertical: 12,
    paddingHorizontal: 26,
    minWidth: 148,
    alignItems: "center",
    justifyContent: "center",
  },
  ctaPillPhoneFloating: {
    marginTop: 0,
    paddingVertical: 13,
    paddingHorizontal: 28,
    minWidth: 160,
  },
  ctaPillPressed: {
    opacity: 0.88,
    transform: [{ scale: 0.98 }],
  },
  ctaPillHover: {
    transform: [{ translateY: -1 }],
  },
  ctaPillGoldHover: {
    transform: [{ translateY: -1 }],
    backgroundColor: KANKREG_CHROME.buttonAccentHover,
  },
  ctaFocus: {
    ...Platform.select({
      web: { outlineStyle: "solid", outlineWidth: 2, outlineColor: KANKREG_PALETTE.goldBright, outlineOffset: 2 },
      default: {},
    }),
  },
  ctaText: {
    fontFamily: fonts.bold,
    fontSize: typography.bodySmall,
    color: KANKREG_PALETTE.ink,
    letterSpacing: 0.2,
  },
  ctaTextGold: {
    fontFamily: fonts.semibold,
    fontSize: HOME_TYPE.kicker,
    color: KANKREG_CHROME.onAccent,
    letterSpacing: 0.3,
  },
  navBtn: {
    position: "absolute",
    top: "50%",
    marginTop: -22,
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(8,6,4,0.42)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.18)",
    zIndex: 4,
    ...Platform.select({
      web: { cursor: "pointer", backdropFilter: "blur(8px)" },
      default: {},
    }),
  },
  navBtnQuiet: {
    position: "absolute",
    top: "50%",
    marginTop: -18,
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(8,6,4,0.26)",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255,255,255,0.14)",
    zIndex: 4,
    ...Platform.select({
      web: { cursor: "pointer", backdropFilter: "blur(6px)" },
      default: {},
    }),
  },
  navBtnHover: {
    backgroundColor: "rgba(8,6,4,0.58)",
  },
  navBtnQuietHover: {
    backgroundColor: "rgba(8,6,4,0.38)",
  },
  navBtnFocus: {
    ...Platform.select({
      web: { outlineStyle: "solid", outlineWidth: 2, outlineColor: "rgba(255,255,255,0.65)", outlineOffset: 2 },
      default: {},
    }),
  },
  navPrev: {
    left: 12,
  },
  navNext: {
    right: 12,
  },
  navPrevNative: {
    left: 8,
    marginTop: -20,
  },
  navNextNative: {
    right: 8,
    marginTop: -20,
  },
  chromeScrimNative: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: 120,
    zIndex: 3,
  },
  chromeNative: {
    zIndex: 4,
    paddingHorizontal: 18,
    paddingTop: 10,
    gap: 9,
  },
  chromeApp: {
    zIndex: 4,
    paddingHorizontal: 14,
    paddingTop: 8,
    gap: 8,
  },
  progressTrackNative: {
    height: 2,
    backgroundColor: "rgba(255,255,255,0.18)",
  },
  progressFillNative: {
    backgroundColor: KANKREG_PALETTE.goldBright,
  },
  counterNative: {
    left: 18,
    fontSize: 10,
    letterSpacing: 1.1,
    color: "rgba(255,255,255,0.78)",
  },
  dotsNative: {
    gap: 7,
  },
  dotNative: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: "rgba(255,255,255,0.34)",
  },
  dotNativeActive: {
    width: 30,
    height: 7,
    borderRadius: 4,
    backgroundColor: KANKREG_PALETTE.goldBright,
  },
  chrome: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    paddingBottom: 12,
    paddingHorizontal: 16,
    gap: 8,
  },
  chromeTop: {
    paddingHorizontal: HOME_SPACE.lg,
    gap: 6,
  },
  progressTrack: {
    height: 2,
    borderRadius: 1,
    backgroundColor: "rgba(255,255,255,0.22)",
    overflow: "hidden",
  },
  progressTrackTop: {
    height: 1,
    backgroundColor: "rgba(255,255,255,0.16)",
  },
  progressFill: {
    height: "100%",
    backgroundColor: KANKREG_PALETTE.goldBright,
    borderRadius: 1,
  },
  progressFillTop: {
    backgroundColor: KANKREG_CHROME.buttonAccent,
    opacity: 0.85,
  },
  chromeRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  counter: {
    position: "absolute",
    left: 16,
    fontFamily: fonts.semibold,
    fontSize: 11,
    color: "rgba(255,255,255,0.9)",
    letterSpacing: 0.8,
  },
  counterTop: {
    left: HOME_SPACE.lg,
    fontSize: 11,
    color: "rgba(255,255,255,0.78)",
    letterSpacing: 1.2,
  },
  counterSpacer: {
    position: "absolute",
    right: 16,
    opacity: 0,
    fontFamily: fonts.semibold,
    fontSize: 11,
  },
  counterSep: {
    color: "rgba(255,255,255,0.38)",
  },
  dots: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  dotHit: {
    minWidth: 44,
    minHeight: 44,
    alignItems: "center",
    justifyContent: "center",
    ...Platform.select({ web: { cursor: "pointer" }, default: {} }),
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "rgba(255,255,255,0.32)",
    ...Platform.select({ web: { cursor: "pointer" }, default: {} }),
  },
  dotActive: {
    width: 24,
    backgroundColor: KANKREG_PALETTE.goldBright,
  },
  dotTop: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: "rgba(255,255,255,0.28)",
    ...Platform.select({ web: { cursor: "pointer", transition: "width 0.2s ease, background-color 0.2s ease" } }),
  },
  dotTopActive: {
    width: 20,
    height: 3,
    borderRadius: 2,
    backgroundColor: KANKREG_CHROME.buttonAccent,
  },
});
