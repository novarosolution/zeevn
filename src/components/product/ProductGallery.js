import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  I18nManager,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import ProductImage from "../ui/ProductImage";
import GalleryHeroVideo from "./GalleryHeroVideo";
import { Ionicons } from "@expo/vector-icons";
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

const FADE_MS = 200;
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import { useTheme } from "../../context/ThemeContext";
import { getImageUriCandidates } from "../../utils/image";
import { fonts, icon as sz } from "../../theme/tokens";
import useReducedMotion from "../../hooks/useReducedMotion";
import Skeleton from "../ui/Skeleton";
import { regionA11yProps } from "../../utils/a11y";
import { PRODUCT_SCREEN, fillProductScreen } from "../../content/appContent";
import ProductGalleryZoomModal from "./ProductGalleryZoomModal";

const THUMB_GAP = 8;
const RAIL_WIDTH = 84;
const THUMB_HEIGHT_DESKTOP = Math.round((RAIL_WIDTH * 5) / 4);
const THUMB_HEIGHT_MOBILE = 64;
const HERO_ASPECT = 4 / 5;
const SWIPE_THRESHOLD = 48;

function isSaleBadge(text) {
  const value = String(text || "").toLowerCase();
  return /sale|off|discount|\d+\s*%/.test(value);
}

function buildSlides(images, video, media) {
  if (Array.isArray(media) && media.length) {
    return media
      .map((item) => ({
        type: String(item?.type || "image").toLowerCase() === "video" ? "video" : "image",
        uri: String(item?.url || "").trim(),
        poster: String(item?.poster || "").trim(),
      }))
      .filter((item) => item.uri);
  }
  const slides = [];
  const videoUrl = typeof video === "string" ? video.trim() : String(video?.url || "").trim();
  const videoPoster =
    (typeof video === "object" ? String(video?.poster || "").trim() : "") || String(images?.[0] || "").trim();
  if (videoUrl) {
    slides.push({ type: "video", uri: videoUrl, poster: videoPoster });
  }
  (images || []).forEach((uri) => {
    const clean = String(uri || "").trim();
    if (!clean) return;
    if (clean === videoUrl) return;
    slides.push({ type: "image", uri: clean });
  });
  if (!slides.length && images?.[0]) {
    slides.push({ type: "image", uri: String(images[0]).trim() });
  }
  return slides;
}

function GalleryHeroImage({ sourceUri, style, contentFit = "cover", onError, onLoad, priority = false, lazy = false }) {
  const candidates = useMemo(() => getImageUriCandidates(sourceUri), [sourceUri]);
  const [index, setIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [retryTick, setRetryTick] = useState(0);

  useEffect(() => {
    setIndex(0);
    setLoading(true);
    setRetryTick(0);
  }, [sourceUri]);

  useEffect(() => {
    if (!loading || !sourceUri) return undefined;
    const timer = setTimeout(() => setRetryTick((t) => t + 1), 4000);
    return () => clearTimeout(timer);
  }, [loading, sourceUri, retryTick]);

  const uri = candidates[index] || "";
  if (!uri) {
    return (
      <View style={[style, { alignItems: "center", justifyContent: "center" }]}>
        <Ionicons name="image-outline" size={sz.sm} color="#8A8A8A" />
      </View>
    );
  }

  return (
    <View style={style}>
      {loading ? <Skeleton width="100%" height="100%" radius={0} style={StyleSheet.absoluteFill} /> : null}
      <ProductImage
        key={`${uri}-${retryTick}`}
        uri={uri}
        style={StyleSheet.absoluteFill}
        contentFit={contentFit}
        priority={priority}
        lazy={lazy}
        transition={0}
        onLoad={() => {
          setLoading(false);
          onLoad?.();
        }}
        onError={() => {
          if (index + 1 < candidates.length) {
            setIndex((i) => i + 1);
            return;
          }
          setLoading(true);
          onError?.();
        }}
      />
    </View>
  );
}

function GalleryPaginationDots({ count, activeIndex, accentColor, idleColor }) {
  if (count <= 1) return null;
  return (
    <View style={stylesDots.row}>
      {Array.from({ length: count }).map((_, idx) => (
        <View
          key={`dot-${idx}`}
          style={[
            stylesDots.base,
            { backgroundColor: idx === activeIndex ? accentColor : idleColor },
            idx === activeIndex ? stylesDots.active : stylesDots.idle,
          ]}
        />
      ))}
    </View>
  );
}

const stylesDots = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: 10,
  },
  base: {
    height: 8,
    borderRadius: 999,
  },
  idle: { width: 8, opacity: 0.35 },
  active: { width: 22 },
});

function GalleryThumbnail({
  slide,
  selected,
  onPress,
  onKeyActivate,
  width,
  height,
  semanticPalette,
  reducedMotion,
  thumbIndex,
  thumbRef,
}) {
  const scale = useSharedValue(1);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const posterUri = slide.type === "video" ? slide.poster || slide.uri : slide.uri;

  return (
    <Animated.View style={animStyle}>
      <Pressable
        ref={thumbRef}
        onPress={onPress}
        onKeyPress={
          Platform.OS === "web"
            ? (event) => {
                const key = event?.nativeEvent?.key || event?.key;
                if (key === "Enter" || key === " ") {
                  event.preventDefault?.();
                  onKeyActivate?.();
                }
              }
            : undefined
        }
        accessibilityRole="button"
        accessibilityState={{ selected }}
        accessibilityLabel={fillProductScreen(PRODUCT_SCREEN.galleryThumbA11y, { n: String(thumbIndex + 1) })}
        {...(Platform.OS === "web" && selected ? { "aria-current": "true" } : {})}
        onHoverIn={
          Platform.OS === "web" && !reducedMotion
            ? () => {
                scale.value = withTiming(1.04, { duration: 180, easing: Easing.out(Easing.cubic) });
              }
            : undefined
        }
        onHoverOut={
          Platform.OS === "web" && !reducedMotion
            ? () => {
                scale.value = withTiming(1, { duration: 180, easing: Easing.out(Easing.cubic) });
              }
            : undefined
        }
        style={[
          styles.thumb,
          {
            width,
            height,
            borderColor: selected ? semanticPalette.accent : semanticPalette.lineSoft,
            borderWidth: selected ? 1.5 : 1,
          },
        ]}
      >
        <GalleryHeroImage sourceUri={posterUri} style={StyleSheet.absoluteFill} contentFit="cover" />
        {selected ? (
          <View style={[styles.thumbDot, { backgroundColor: semanticPalette.accent }]} />
        ) : null}
        {slide.type === "video" ? (
          <View style={styles.thumbPlay}>
            <Ionicons name="play" size={16} color="#FFFFFF" />
          </View>
        ) : null}
      </Pressable>
    </Animated.View>
  );
}

export default function ProductGallery({
  images = [],
  video = null,
  media = [],
  badgeText = "",
  selectedImage,
  onSelectImage,
  onOpenZoomModal,
  isOutOfStock = false,
}) {
  const { width: windowWidth } = useWindowDimensions();
  const { semanticPalette, RADII, SHADOWS, SPACING } = useTheme();
  const reducedMotion = useReducedMotion();
  const isDesktop = windowWidth >= 768;

  const slides = useMemo(() => buildSlides(images, video, media), [images, media, video]);
  const [heroWidth, setHeroWidth] = useState(0);
  const [zoomUri, setZoomUri] = useState("");
  const [imageFailed, setImageFailed] = useState(false);
  const [videoPlaying, setVideoPlaying] = useState(Platform.OS === "web" && isDesktop);
  const [videoMuted, setVideoMuted] = useState(true);
  const [lens, setLens] = useState(null);
  const thumbRefs = useRef([]);

  const rtl = I18nManager.isRTL;
  const dragX = useSharedValue(0);
  const slideIndex = useSharedValue(0);
  const fadeProgress = useSharedValue(1);
  const [heroMode, setHeroMode] = useState("crossfade");
  const [fadeFromIndex, setFadeFromIndex] = useState(0);

  const selectedIndex = useMemo(() => {
    const idx = slides.findIndex((s) => s.uri === selectedImage);
    return idx >= 0 ? idx : 0;
  }, [selectedImage, slides]);

  useEffect(() => {
    if (heroMode === "slide" && !isDesktop) {
      slideIndex.value = withTiming(selectedIndex, { duration: reducedMotion ? 1 : 220, easing: Easing.out(Easing.cubic) });
    }
    setFadeFromIndex(selectedIndex);
  }, [heroMode, isDesktop, reducedMotion, selectedIndex, slideIndex]);

  const currentSlide = slides[selectedIndex] || slides[0];
  const currentUri = currentSlide?.uri || "";
  const imageUris = useMemo(() => getImageUriCandidates(currentSlide?.type === "image" ? currentUri : currentSlide?.poster), [currentSlide, currentUri]);

  const selectIndex = useCallback(
    (nextIndex) => {
      const bounded = ((nextIndex % slides.length) + slides.length) % slides.length;
      const next = slides[bounded];
      if (!next) return;
      onSelectImage?.(next.uri);
      setImageFailed(false);
    },
    [onSelectImage, slides]
  );

  const selectIndexFromThumb = useCallback(
    (nextIndex) => {
      const bounded = ((nextIndex % slides.length) + slides.length) % slides.length;
      if (bounded === selectedIndex) return;
      setHeroMode("crossfade");
      if (reducedMotion) {
        selectIndex(bounded);
        return;
      }
      setFadeFromIndex(selectedIndex);
      fadeProgress.value = 0;
      selectIndex(bounded);
      fadeProgress.value = withTiming(1, { duration: FADE_MS, easing: Easing.out(Easing.cubic) });
    },
    [fadeProgress, reducedMotion, selectIndex, selectedIndex, slides.length]
  );

  const goNext = useCallback(() => {
    setHeroMode("slide");
    selectIndex(selectedIndex + 1);
  }, [selectIndex, selectedIndex]);
  const goPrev = useCallback(() => {
    setHeroMode("slide");
    selectIndex(selectedIndex - 1);
  }, [selectIndex, selectedIndex]);

  const fadeOutStyle = useAnimatedStyle(() => ({
    opacity: 1 - fadeProgress.value,
    transform: [{ scale: 1 - fadeProgress.value * 0.02 }],
  }));
  const fadeInStyle = useAnimatedStyle(() => ({
    opacity: fadeProgress.value,
    transform: [{ scale: 1.02 - fadeProgress.value * 0.02 }],
  }));

  const showSlideTrack = !isDesktop && heroMode === "slide" && slides.length > 1;

  const heroTrackStyle = useAnimatedStyle(() => {
    const w = heroWidth || 1;
    const base = -slideIndex.value * w;
    return {
      transform: [{ translateX: base + dragX.value }],
    };
  });

  const handleThumbKeyNavigation = useCallback(
    (event) => {
      if (Platform.OS !== "web" || slides.length < 2) return;
      const key = event?.nativeEvent?.key || event?.key;
      const delta =
        key === "ArrowRight" || key === "ArrowDown"
          ? 1
          : key === "ArrowLeft" || key === "ArrowUp"
            ? -1
            : 0;
      if (!delta) return;
      event.preventDefault?.();
      const next = ((selectedIndex + delta) % slides.length + slides.length) % slides.length;
      selectIndexFromThumb(next);
      thumbRefs.current[next]?.focus?.();
    },
    [selectIndexFromThumb, selectedIndex, slides.length]
  );

  const panGesture = useMemo(() => {
    if (isDesktop || slides.length < 2) return null;
    return Gesture.Pan()
      .activeOffsetX([-12, 12])
      .onUpdate((event) => {
        dragX.value = event.translationX;
      })
      .onEnd((event) => {
        if (event.translationX < -SWIPE_THRESHOLD) {
          runOnJS(goNext)();
        } else if (event.translationX > SWIPE_THRESHOLD) {
          runOnJS(goPrev)();
        }
        dragX.value = withTiming(0, { duration: 220, easing: Easing.out(Easing.cubic) });
      });
  }, [dragX, goNext, goPrev, isDesktop, slides.length]);

  const openZoom = useCallback(
    (uri) => {
      if (!uri || currentSlide?.type === "video") return;
      setZoomUri(uri);
      onOpenZoomModal?.(uri);
    },
    [currentSlide?.type, onOpenZoomModal]
  );

  const badge = String(badgeText || "").trim();
  const saleBadge = badge && isSaleBadge(badge);

  const heroA11y = fillProductScreen(PRODUCT_SCREEN.galleryA11y, {
    current: String(selectedIndex + 1),
    total: String(Math.max(slides.length, 1)),
  });

  const thumbWidth = isDesktop ? RAIL_WIDTH : Math.round(THUMB_HEIGHT_MOBILE * (4 / 5));
  const thumbHeight = isDesktop ? THUMB_HEIGHT_DESKTOP : THUMB_HEIGHT_MOBILE;
  const railMaxHeight = 6 * thumbHeight + 5 * THUMB_GAP;

  const renderBadge = () => {
    if (!badge) return null;
    return (
      <View
        style={[
          styles.badge,
          saleBadge
            ? { backgroundColor: semanticPalette.sale, borderColor: semanticPalette.sale }
            : { backgroundColor: semanticPalette.accent, borderColor: semanticPalette.accent },
        ]}
      >
        <Text style={styles.badgeText}>{badge}</Text>
      </View>
    );
  };

  const renderHeroSlide = (slide, index) => {
    const w = heroWidth || windowWidth - SPACING.lg * 2;
    if (slide.type === "video") {
      return (
        <View key={`${slide.uri}-${index}`} style={[styles.heroSlide, { width: w }]}>
          <GalleryHeroVideo
            uri={slide.uri}
            poster={slide.poster}
            active={index === selectedIndex}
            playing={videoPlaying}
            muted={videoMuted}
            isDesktop={isDesktop}
            mediaStyle={styles.heroMedia}
            onRequestPlay={() => setVideoPlaying(true)}
            onToggleMute={() => setVideoMuted((m) => !m)}
            playA11y={PRODUCT_SCREEN.galleryVideoPlayA11y}
            muteA11y={PRODUCT_SCREEN.galleryVideoMuteA11y}
          />
        </View>
      );
    }

    return (
      <View key={`${slide.uri}-${index}`} style={[styles.heroSlide, { width: w }]}>
        <GalleryHeroImage
          sourceUri={slide.uri}
          style={styles.heroMedia}
          contentFit="cover"
          priority={index === selectedIndex}
          lazy={index !== selectedIndex}
          onError={() => index === selectedIndex && setImageFailed(true)}
          onLoad={() => index === selectedIndex && setImageFailed(false)}
        />
      </View>
    );
  };

  const heroStage = (
    <View
      style={[
        styles.heroStage,
        {
          borderColor: semanticPalette.lineSoft,
          borderRadius: 18,
          ...Platform.select({
            web: { boxShadow: "0 12px 32px rgba(14, 23, 41, 0.08)" },
            default: SHADOWS.soft,
          }),
        },
      ]}
      onLayout={(e) => setHeroWidth(e.nativeEvent.layout.width)}
      accessibilityLabel={heroA11y}
      {...(Platform.OS === "web"
        ? {
            tabIndex: 0,
            onKeyDown: handleThumbKeyNavigation,
          }
        : {})}
      {...(Platform.OS === "web"
        ? {
            onMouseMove: (event) => {
              if (!isDesktop || currentSlide?.type === "video" || imageFailed) {
                setLens(null);
                return;
              }
              const { locationX, locationY } = event.nativeEvent;
              const w = heroWidth || 1;
              const h = w / HERO_ASPECT;
              const lensSize = 200;
              const bgX = ((locationX - lensSize / 2) / Math.max(w - lensSize, 1)) * 100;
              const bgY = ((locationY - lensSize / 2) / Math.max(h - lensSize, 1)) * 100;
              setLens({
                left: locationX - lensSize / 2,
                top: locationY - lensSize / 2,
                uri: imageUris[0] || currentUri,
                bgX: clampPercent(bgX),
                bgY: clampPercent(bgY),
              });
            },
            onMouseLeave: () => setLens(null),
          }
        : {})}
    >
      {renderBadge()}
      {(() => {
        const heroInner = (
          <View style={[styles.heroAspect, { aspectRatio: HERO_ASPECT }]}>
            {slides.length > 0 && heroWidth > 0 ? (
              showSlideTrack ? (
                <Animated.View style={[styles.heroTrack, heroTrackStyle]}>
                  {slides.map((slide, index) => renderHeroSlide(slide, index))}
                </Animated.View>
              ) : (
                <View style={StyleSheet.absoluteFill}>
                  <Animated.View style={[StyleSheet.absoluteFill, fadeOutStyle, { pointerEvents: "none" }]}>
                    {renderHeroSlide(slides[fadeFromIndex] || slides[0], fadeFromIndex)}
                  </Animated.View>
                  <Animated.View style={[StyleSheet.absoluteFill, fadeInStyle]}>
                    {renderHeroSlide(slides[selectedIndex] || slides[0], selectedIndex)}
                  </Animated.View>
                </View>
              )
            ) : (
              <View style={styles.heroFallback}>
                <Ionicons name="image-outline" size={sz.xl} color={semanticPalette.inkMuted} />
                <Text style={{ marginTop: SPACING.sm, color: semanticPalette.inkMuted, fontFamily: fonts.medium }}>
                  {PRODUCT_SCREEN.heroImageUnavailable}
                </Text>
              </View>
            )}
            {Platform.OS === "web" && lens && isDesktop && currentSlide?.type === "image" ? (
              <View
                style={[
                  styles.lens,
                  { pointerEvents: "none" },
                  {
                    left: lens.left,
                    top: lens.top,
                    backgroundImage: `url(${lens.uri})`,
                    backgroundPosition: `${lens.bgX}% ${lens.bgY}%`,
                    backgroundSize: `${heroWidth * 2}px ${(heroWidth / HERO_ASPECT) * 2}px`,
                  },
                ]}
              />
            ) : null}
          </View>
        );
        return panGesture ? <GestureDetector gesture={panGesture}>{heroInner}</GestureDetector> : heroInner;
      })()}
      {isOutOfStock ? (
        <>
          <View style={[styles.oosOverlay, { pointerEvents: "none" }]} />
          <View style={[styles.oosRibbon, { pointerEvents: "none" }]}>
            <Text style={styles.oosRibbonText}>{PRODUCT_SCREEN.heroOutOfStock}</Text>
          </View>
        </>
      ) : null}
      {currentSlide?.type === "image" && imageUris[0] && !imageFailed ? (
        <Pressable
          style={styles.expandBtn}
          onPress={() => openZoom(imageUris[0])}
          accessibilityRole="button"
          accessibilityLabel={PRODUCT_SCREEN.zoomInA11y}
        >
          <Ionicons name="expand-outline" size={20} color={semanticPalette.ink} />
        </Pressable>
      ) : null}
      {Platform.OS === "web" && isDesktop && currentSlide?.type === "image" ? (
        <View style={[styles.zoomCursor, { pointerEvents: "none" }]} />
      ) : null}
    </View>
  );

  const thumbList = slides.map((slide, index) => (
    <GalleryThumbnail
      key={`${slide.type}-${slide.uri}`}
      slide={slide}
      selected={index === selectedIndex}
      thumbIndex={index}
      thumbRef={(node) => {
        thumbRefs.current[index] = node;
      }}
      onPress={() => selectIndexFromThumb(index)}
      onKeyActivate={() => selectIndexFromThumb(index)}
      width={thumbWidth}
      height={thumbHeight}
      semanticPalette={semanticPalette}
      reducedMotion={reducedMotion}
    />
  ));

  const desktopRowStyle = [styles.desktopRow, rtl ? { flexDirection: "row-reverse" } : null];

  return (
    <View style={styles.root} {...regionA11yProps(PRODUCT_SCREEN.galleryRegionLabel)}>
      {isDesktop ? (
        <View style={desktopRowStyle}>
          {slides.length > 1 ? (
            <ScrollView
              style={[styles.rail, { maxHeight: railMaxHeight, width: RAIL_WIDTH }]}
              contentContainerStyle={styles.railContent}
              showsVerticalScrollIndicator={false}
              {...(Platform.OS === "web" ? { onKeyDown: handleThumbKeyNavigation } : {})}
            >
              {thumbList}
            </ScrollView>
          ) : null}
          <View style={styles.heroFlex}>{heroStage}</View>
        </View>
      ) : (
        <>
          {heroStage}
          {slides.length > 1 ? (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              decelerationRate="fast"
              snapToInterval={thumbWidth + THUMB_GAP}
              snapToAlignment="start"
              style={styles.mobileThumbScroll}
              contentContainerStyle={[styles.mobileThumbContent, rtl ? { flexDirection: "row-reverse" } : null]}
              {...(Platform.OS === "web" ? { onKeyDown: handleThumbKeyNavigation } : {})}
            >
              {thumbList}
            </ScrollView>
          ) : null}
          <GalleryPaginationDots
            count={slides.length}
            activeIndex={selectedIndex}
            accentColor={semanticPalette.accent}
            idleColor={semanticPalette.lineSoft}
          />
        </>
      )}

      <ProductGalleryZoomModal visible={Boolean(zoomUri)} uri={zoomUri} onClose={() => setZoomUri("")} />
    </View>
  );
}

function clampPercent(value) {
  return Math.min(100, Math.max(0, value));
}

const styles = StyleSheet.create({
  root: {
    width: "100%",
  },
  desktopRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: THUMB_GAP + 4,
    width: "100%",
  },
  rail: {
    flexShrink: 0,
  },
  railContent: {
    gap: THUMB_GAP,
    paddingBottom: 4,
  },
  heroFlex: {
    flex: 1,
    minWidth: 0,
  },
  heroStage: {
    width: "100%",
    borderWidth: 1,
    overflow: "hidden",
    backgroundColor: "rgba(14,23,41,0.03)",
    position: "relative",
  },
  heroAspect: {
    width: "100%",
    overflow: "hidden",
  },
  heroTrack: {
    flexDirection: "row",
    height: "100%",
  },
  heroSlide: {
    height: "100%",
    overflow: "hidden",
  },
  heroMedia: {
    width: "100%",
    height: "100%",
  },
  heroFallback: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 200,
  },
  badge: {
    position: "absolute",
    top: 14,
    left: 14,
    zIndex: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    maxWidth: "78%",
  },
  badgeText: {
    fontFamily: fonts.semibold,
    fontSize: 10,
    letterSpacing: 1,
    textTransform: "uppercase",
    color: "#FFFFFF",
  },
  expandBtn: {
    position: "absolute",
    right: 12,
    bottom: 12,
    zIndex: 5,
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.92)",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(14,23,41,0.12)",
  },
  lens: {
    position: "absolute",
    width: 200,
    height: 200,
    borderRadius: 100,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.95)",
    zIndex: 6,
    ...Platform.select({
      web: {
        boxShadow: "0 8px 24px rgba(14, 23, 41, 0.22)",
        backgroundRepeat: "no-repeat",
        cursor: "none",
      },
      default: {},
    }),
  },
  zoomCursor: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 3,
    ...Platform.select({
      web: { cursor: "zoom-in" },
      default: {},
    }),
  },
  thumb: {
    borderRadius: 10,
    overflow: "hidden",
    backgroundColor: "rgba(14,23,41,0.04)",
    position: "relative",
  },
  thumbDot: {
    position: "absolute",
    top: 6,
    right: 6,
    width: 4,
    height: 4,
    borderRadius: 2,
    zIndex: 2,
  },
  thumbPlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(14,23,41,0.28)",
  },
  mobileThumbScroll: {
    marginTop: THUMB_GAP + 2,
  },
  mobileThumbContent: {
    gap: THUMB_GAP,
    paddingHorizontal: 2,
  },
  oosOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 7,
    backgroundColor: "rgba(255,255,255,0.42)",
  },
  oosRibbon: {
    position: "absolute",
    top: 18,
    right: -36,
    zIndex: 8,
    width: 160,
    paddingVertical: 8,
    backgroundColor: "rgba(14,23,41,0.88)",
    transform: [{ rotate: "32deg" }],
    alignItems: "center",
  },
  oosRibbonText: {
    fontFamily: fonts.semibold,
    fontSize: 10,
    letterSpacing: 1.2,
    textTransform: "uppercase",
    color: "#FFFFFF",
  },
});
