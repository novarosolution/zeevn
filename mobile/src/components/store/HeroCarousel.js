import React, { memo, useCallback, useEffect, useRef, useState } from "react";
import { AccessibilityInfo, FlatList, StyleSheet, Text, View, useWindowDimensions } from "react-native";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useIsFocused } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Circle, Defs, RadialGradient, Stop } from "react-native-svg";
import Animated, {
  Easing,
  cancelAnimation,
  runOnJS,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { STORE_SECTIONS } from "../../content/storefrontContent";
import { STORE_NAV_HEIGHT, useStoreTheme, withAlpha } from "../../theme/storefront";
import { hapticTick } from "../../utils/haptics";
import PressableScale from "./PressableScale";
import { CoinArt } from "./PromoCarousel";

const GAP = 10;
const RADIUS = 30;
/** How long a slide stays before the carousel moves on. */
const DWELL_MS = 5600;
/** Card height ÷ width — close to the 3:4 photographs, trimmed a little so the header and hero fit one screen. */
const CARD_RATIO = 1.25;
/** Roughly what the Home header (chips, search, tabs) takes below the status bar. */
const HEADER_BELOW_INSET = 250;
const PHOTO_SCRIM = ["rgba(22, 12, 3, 0)", "rgba(22, 12, 3, 0.5)", "rgba(22, 12, 3, 0.9)"];

/** True while a screen reader (VoiceOver / TalkBack) is on — a carousel that moves by itself gets in its way. */
function useScreenReader() {
  const [on, setOn] = useState(false);
  useEffect(() => {
    let alive = true;
    AccessibilityInfo.isScreenReaderEnabled().then((value) => alive && setOn(Boolean(value)));
    const sub = AccessibilityInfo.addEventListener("screenReaderChanged", (value) => setOn(Boolean(value)));
    return () => {
      alive = false;
      sub.remove();
    };
  }, []);
  return on;
}

/** Card size for a screen — shared with the loading skeleton so the placeholder is the same shape as the hero. */
export function heroSize({ width, height, topInset = 0, bottomInset = 0 }) {
  const cardW = Math.round(width * 0.88);
  const room = height - topInset - HEADER_BELOW_INSET - STORE_NAV_HEIGHT - Math.max(16, bottomInset + 6) - 16;
  const cardH = Math.round(Math.min(cardW * CARD_RATIO, Math.max(340, room)));
  return { cardW, cardH };
}

/** Gold call-to-action pill that sits on the photo scrim (the whole slide is the button). */
function Cta({ label }) {
  const { c, type } = useStoreTheme();
  return (
    <View style={[styles.ctaShadow, { shadowColor: c.gold }]}>
      <LinearGradient
        colors={[c.goldBright, c.gold]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.cta}
      >
        <Text style={type.ui(14, "extrabold", "#2E2208", { letterSpacing: 0.3 })}>{label}</Text>
        <View style={styles.ctaArrow}>
          <Ionicons name="arrow-forward" size={13} color="#FFF4D6" />
        </View>
      </LinearGradient>
    </View>
  );
}

/** Portrait photograph with a slow push-in on the slide that is showing, a scrim, the headline and the button. */
function PhotoSlide({ item, width, height, active, motion }) {
  const { type } = useStoreTheme();
  const zoom = useSharedValue(1);

  useEffect(() => {
    cancelAnimation(zoom);
    if (active && motion) {
      zoom.value = 1;
      zoom.value = withTiming(1.09, { duration: DWELL_MS + 1800, easing: Easing.out(Easing.quad) });
    } else {
      zoom.value = withTiming(1, { duration: 450 });
    }
    return () => cancelAnimation(zoom);
  }, [active, motion, zoom]);

  const zoomStyle = useAnimatedStyle(() => ({ transform: [{ scale: zoom.value }], transformOrigin: "50% 28%" }));

  return (
    <View style={[styles.clip, { width, height }]}>
      <Animated.View style={[StyleSheet.absoluteFill, zoomStyle]}>
        <Image
          source={item.art || item.image}
          style={StyleSheet.absoluteFill}
          contentFit="cover"
          contentPosition={{ left: "50%", top: "0%" }}
          transition={0}
          cachePolicy="memory-disk"
        />
      </Animated.View>
      <LinearGradient colors={PHOTO_SCRIM} locations={[0, 0.45, 1]} style={styles.scrim} pointerEvents="none" />
      <View style={styles.copy} pointerEvents="none">
        <Text style={type.display(29, { color: "#FFF6E2", ls: -0.6, lh: 33 })} numberOfLines={2}>
          {item.title}
        </Text>
        {item.cta ? <Cta label={item.cta} /> : null}
      </View>
      <View style={styles.rim} pointerEvents="none" />
    </View>
  );
}

/** The rewards card, dressed like the photo slides: deep olive, a glowing stack of coins, headline + button. */
function RewardsSlide({ item, width, height, signedIn, points }) {
  const { type } = useStoreTheme();
  const personal = signedIn && item.signedIn;
  const title = personal ? item.signedIn.title(Number(points || 0).toLocaleString("en-IN")) : item.title;
  const cta = personal ? item.signedIn.cta : item.cta;
  const coin = Math.round(Math.min(width * 0.58, height * 0.46));
  return (
    <View style={[styles.clip, { width, height }]}>
      <LinearGradient colors={["#14301A", "#23472A", "#3C6B33"]} start={{ x: 0.1, y: 0 }} end={{ x: 0.9, y: 1 }} style={StyleSheet.absoluteFill} />
      <Svg width={width} height={height} style={StyleSheet.absoluteFill} pointerEvents="none">
        <Defs>
          <RadialGradient id="rewardGlow" cx="50%" cy="34%" r="58%">
            <Stop offset="0" stopColor="#F6C453" stopOpacity={0.5} />
            <Stop offset="0.5" stopColor="#F6C453" stopOpacity={0.14} />
            <Stop offset="1" stopColor="#F6C453" stopOpacity={0} />
          </RadialGradient>
        </Defs>
        <Circle cx={width / 2} cy={height * 0.34} r={width * 0.62} fill="url(#rewardGlow)" />
      </Svg>
      <View style={[styles.coinWrap, { top: Math.round(height * 0.12) }]} pointerEvents="none">
        <CoinArt size={coin} />
      </View>
      <LinearGradient colors={["rgba(10, 24, 12, 0)", "rgba(10, 24, 12, 0.7)"]} style={styles.scrim} pointerEvents="none" />
      <View style={styles.copy} pointerEvents="none">
        <Text style={type.display(29, { color: "#FFF6E2", ls: -0.6, lh: 33 })} numberOfLines={2}>
          {title}
        </Text>
        {cta ? <Cta label={cta} /> : null}
      </View>
      <View style={styles.rim} pointerEvents="none" />
    </View>
  );
}

const Slide = memo(function Slide({ item, width, height, active, motion, signedIn, points, onPress }) {
  const { shadow } = useStoreTheme();
  return (
    <PressableScale
      onPress={onPress}
      scaleTo={0.985}
      accessibilityRole="button"
      accessibilityLabel={item.a11y || item.title || STORE_SECTIONS.promoA11y}
      style={[shadow.card, { width, height, borderRadius: RADIUS, backgroundColor: "#2A1A08" }]}
    >
      {item.kind === "rewards" ? (
        <RewardsSlide item={item} width={width} height={height} signedIn={signedIn} points={points} />
      ) : (
        <PhotoSlide item={item} width={width} height={height} active={active} motion={motion} />
      )}
    </PressableScale>
  );
});

/** Fills over `DWELL_MS` while its slide is showing; earlier slides are full, later ones empty. */
function LiveFill({ progress }) {
  const style = useAnimatedStyle(() => ({ transform: [{ scaleX: progress.value }] }));
  return <Animated.View style={[styles.barFill, styles.barLive, style]} />;
}

function StoryBars({ count, active, progress, running, style }) {
  if (count < 2) return null;
  return (
    <View style={[styles.bars, style]} pointerEvents="none">
      {Array.from({ length: count }, (_, i) => (
        <View key={i} style={styles.barTrack}>
          {i < active || (i === active && !running) ? <View style={styles.barFill} /> : null}
          {i === active && running ? <LiveFill progress={progress} /> : null}
        </View>
      ))}
    </View>
  );
}

/**
 * The hero: tall portrait photographs that peek at the next one, a slow push-in on the slide on show, story-style
 * progress bars and a gentle auto-advance (paused while you drag, while the hero is scrolled out of view, while the
 * screen is covered, and with "reduce motion" or a screen reader on). Tap a slide to shop that range.
 */
export default function HeroCarousel({ items, onPressItem, signedIn = false, points = 0, paused = false }) {
  const { gutter } = useStoreTheme();
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const reduced = useReducedMotion();
  const focused = useIsFocused();
  const screenReader = useScreenReader();

  const count = items.length;
  const { cardW, cardH } = heroSize({ width, height, topInset: insets.top, bottomInset: insets.bottom });
  const step = cardW + GAP;

  const listRef = useRef(null);
  const activeRef = useRef(0);
  const dragTimer = useRef(null);
  const userMoved = useRef(false);
  const [active, setActive] = useState(0);
  const [dragging, setDragging] = useState(false);
  const progress = useSharedValue(0);
  const moving = !reduced && focused && !paused && !screenReader;
  const running = moving && !dragging && count > 1;
  activeRef.current = active;

  const advance = useCallback(() => {
    const next = (activeRef.current + 1) % count;
    activeRef.current = next;
    setActive(next);
    listRef.current?.scrollToOffset({ offset: next * step, animated: true });
  }, [count, step]);

  useEffect(() => {
    cancelAnimation(progress);
    progress.value = 0;
    if (!running) return undefined;
    progress.value = withTiming(1, { duration: DWELL_MS, easing: Easing.linear }, (finished) => {
      if (finished) runOnJS(advance)();
    });
    return () => cancelAnimation(progress);
  }, [running, active, advance, progress]);

  useEffect(() => () => clearTimeout(dragTimer.current), []);

  const settle = useCallback(
    (e) => {
      clearTimeout(dragTimer.current);
      const next = Math.max(0, Math.min(count - 1, Math.round(e.nativeEvent.contentOffset.x / step)));
      if (userMoved.current && next !== activeRef.current) hapticTick();
      userMoved.current = false;
      activeRef.current = next;
      setActive(next);
      setDragging(false);
    },
    [count, step]
  );

  const renderItem = useCallback(
    ({ item, index }) => (
      <Slide
        item={item}
        width={cardW}
        height={cardH}
        active={index === active}
        motion={moving}
        signedIn={signedIn}
        points={points}
        onPress={() => onPressItem?.(item)}
      />
    ),
    [active, cardH, cardW, moving, onPressItem, points, signedIn]
  );

  if (!count) return null;

  return (
    <View style={[styles.wrap, { height: cardH + 20 }]}>
      <FlatList
        ref={listRef}
        data={items}
        horizontal
        keyExtractor={(item) => item.key}
        renderItem={renderItem}
        extraData={active}
        showsHorizontalScrollIndicator={false}
        snapToInterval={step}
        snapToAlignment="start"
        decelerationRate="fast"
        initialNumToRender={2}
        windowSize={3}
        onScrollBeginDrag={() => {
          clearTimeout(dragTimer.current);
          userMoved.current = true;
          setDragging(true);
        }}
        onScrollEndDrag={() => {
          clearTimeout(dragTimer.current);
          dragTimer.current = setTimeout(() => setDragging(false), 700);
        }}
        onMomentumScrollBegin={() => clearTimeout(dragTimer.current)}
        onMomentumScrollEnd={settle}
        contentContainerStyle={{ paddingHorizontal: gutter, paddingVertical: 10, gap: GAP }}
      />
      <StoryBars
        count={count}
        active={active}
        progress={progress}
        running={running}
        style={{ left: gutter + 18, width: cardW - 36, top: 10 + 14 }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginVertical: -10 },
  clip: { overflow: "hidden", borderRadius: RADIUS },
  scrim: { position: "absolute", left: 0, right: 0, bottom: 0, height: "48%" },
  copy: { position: "absolute", left: 20, right: 20, bottom: 20, gap: 14 },
  rim: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: RADIUS,
    borderWidth: 1,
    borderColor: "rgba(255, 244, 214, 0.22)",
  },
  coinWrap: { position: "absolute", left: 0, right: 0, alignItems: "center" },
  ctaShadow: {
    alignSelf: "flex-start",
    borderRadius: 22,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 4,
  },
  cta: { height: 44, borderRadius: 22, paddingLeft: 20, paddingRight: 6, flexDirection: "row", alignItems: "center", gap: 10 },
  ctaArrow: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#2E2208",
    alignItems: "center",
    justifyContent: "center",
  },
  bars: { position: "absolute", flexDirection: "row", gap: 5 },
  barTrack: { flex: 1, height: 3.5, borderRadius: 2, overflow: "hidden", backgroundColor: withAlpha("#FFFFFF", 0.34) },
  barFill: { ...StyleSheet.absoluteFillObject, backgroundColor: "#FFFFFF" },
  barLive: { transformOrigin: "left" },
});
