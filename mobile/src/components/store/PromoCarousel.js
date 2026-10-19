import React, { useCallback, useEffect, useRef } from "react";
import { StyleSheet, Text, View, useWindowDimensions } from "react-native";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import Svg, { Circle, Defs, LinearGradient as SvgGradient, Path, Stop } from "react-native-svg";
import Animated, {
  interpolate,
  runOnJS,
  useAnimatedReaction,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
} from "react-native-reanimated";
import { STORE_SECTIONS } from "../../content/storefrontContent";
import { useStoreTheme, withAlpha } from "../../theme/storefront";
import { useLoop } from "./HomeArt";
import { DepthSlide, PagerDots } from "./HomeMotion";
import { Sparkle } from "./Ornaments";
import PressableScale from "./PressableScale";
import StoreIcon from "./StoreIcon";

const GAP = 10;
const CARD_H = 176;
const AUTOPLAY_MS = 5600;
const AnimatedFlatList = Animated.FlatList;

export function CoinArt({ size = 132 }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 132 132">
      <Defs>
        <SvgGradient id="coin" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor="#FFE08A" />
          <Stop offset="1" stopColor="#E0A030" />
        </SvgGradient>
        <SvgGradient id="coin2" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor="#FFD166" />
          <Stop offset="1" stopColor="#C98A1F" />
        </SvgGradient>
      </Defs>
      <Circle cx={86} cy={84} r={36} fill="url(#coin2)" />
      <Circle cx={86} cy={84} r={28} fill="none" stroke="#FFF3C4" strokeOpacity={0.7} strokeWidth={2} />
      <Circle cx={52} cy={64} r={40} fill="url(#coin)" />
      <Circle cx={52} cy={64} r={31} fill="none" stroke="#FFF7D6" strokeOpacity={0.85} strokeWidth={2.2} />
      <Path
        d="M52 44 L57.6 57.2 L72 58.4 L61 67.8 L64.4 82 L52 74.6 L39.6 82 L43 67.8 L32 58.4 L46.4 57.2 Z"
        fill="#B9770E"
        fillOpacity={0.85}
      />
      <Sparkle cx={104} cy={30} r={8} color="#FFFFFF" opacity={0.9} />
      <Sparkle cx={20} cy={22} r={5} color="#FFFFFF" opacity={0.8} />
      <Sparkle cx={116} cy={112} r={4.5} color="#FFFFFF" opacity={0.7} />
    </Svg>
  );
}

/** Gently bobbing coins. */
function FloatingCoins() {
  const t = useLoop(2200);
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: interpolate(t.value, [0, 1], [3, -6]) }, { rotate: `${interpolate(t.value, [0, 1], [-2, 3])}deg` }],
  }));
  return (
    <Animated.View style={[styles.coinArt, animatedStyle]} pointerEvents="none">
      <CoinArt />
    </Animated.View>
  );
}

function CtaPill({ label, color, textColor }) {
  const { type } = useStoreTheme();
  return (
    <View style={[styles.cta, { backgroundColor: color }]}>
      <Text style={type.ui(13.5, "extrabold", textColor, { letterSpacing: 0.2 })}>{label}</Text>
    </View>
  );
}

function RewardsCard({ item, width, isDark, signedIn, points }) {
  const { c, r, type } = useStoreTheme();
  const colors = isDark ? ["#4A3812", "#2E2209"] : ["#FFF0C9", "#F8D68C"];
  const personal = signedIn && item.signedIn;
  const title = personal ? item.signedIn.title(Number(points || 0).toLocaleString("en-IN")) : item.title;
  const cta = personal ? item.signedIn.cta : item.cta;
  return (
    <View style={[styles.card, { width, borderRadius: r.xxl }]}>
      <LinearGradient colors={colors} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
      <FloatingCoins />
      <View style={styles.copy}>
        <Text style={type.eyebrow(isDark ? c.goldText : "#8A5A12", 10)}>{item.eyebrow}</Text>
        <Text style={[type.display(28, { color: isDark ? c.ink : "#3A2A0C", ls: -0.6, lh: 31 }), styles.heading]} numberOfLines={2}>
          {title}
        </Text>
        <CtaPill label={cta} color={isDark ? c.gold : "#2A1E08"} textColor={isDark ? "#2A1E08" : "#FFF3D0"} />
      </View>
    </View>
  );
}

/**
 * A photo slide. The built-in banners already carry their headline, so they show the picture with a round arrow;
 * admin slides can add a title, subtitle and call to action, which sit on a soft dark gradient.
 */
function ImageCard({ item, width }) {
  const { c, r, type, isDark } = useStoreTheme();
  const source = typeof item.image === "number" ? item.image : { uri: item.image };
  const zoom = useLoop(9000);
  const zoomStyle = useAnimatedStyle(() => ({ transform: [{ scale: interpolate(zoom.value, [0, 1], [1, 1.07]) }] }));
  const hasCopy = Boolean(item.eyebrow || item.title || item.subtitle);
  return (
    <View style={[styles.card, { width, borderRadius: r.xxl, backgroundColor: c.soft }]}>
      <Animated.View style={[StyleSheet.absoluteFill, zoomStyle]}>
        <Image source={source} style={StyleSheet.absoluteFill} contentFit="cover" transition={250} cachePolicy="memory-disk" />
      </Animated.View>
      {hasCopy || item.cta ? (
        <LinearGradient
          colors={["transparent", withAlpha(isDark ? "#0A0806" : "#1A140C", hasCopy ? 0.78 : 0.4)]}
          locations={[0.35, 1]}
          style={StyleSheet.absoluteFill}
          pointerEvents="none"
        />
      ) : null}
      <View style={styles.imageCopy} pointerEvents="none">
        {item.eyebrow ? (
          <Text style={type.eyebrow(c.goldBright, 10)} numberOfLines={1}>
            {item.eyebrow}
          </Text>
        ) : null}
        {item.title ? (
          <Text style={type.display(22, { color: "#FFFFFF", ls: -0.4, lh: 26 })} numberOfLines={2}>
            {item.title}
          </Text>
        ) : null}
        {item.subtitle ? (
          <Text style={type.ui(12.5, "medium", withAlpha("#FFFFFF", 0.86))} numberOfLines={1}>
            {item.subtitle}
          </Text>
        ) : null}
        {item.cta ? (
          <View style={[styles.imageCta, { backgroundColor: withAlpha("#FFFFFF", 0.94) }]}>
            <Text style={type.ui(12.5, "extrabold", "#244424", { letterSpacing: 0.2 })}>{item.cta}</Text>
            <StoreIcon icon={{ ion: "arrow-forward" }} size={13} color="#244424" />
          </View>
        ) : null}
      </View>
      {item.cta ? null : (
        <View style={[styles.arrowDisc, { backgroundColor: withAlpha("#FFFFFF", 0.92) }]} pointerEvents="none">
          <StoreIcon icon={{ ion: "arrow-forward" }} size={17} color="#244424" />
        </View>
      )}
    </View>
  );
}

function Slide({ item, index, scrollX, step, width, isDark, signedIn, points, onPress }) {
  const { shadow } = useStoreTheme();
  return (
    <DepthSlide index={index} scrollX={scrollX} step={step}>
      <PressableScale
        onPress={onPress}
        scaleTo={0.98}
        accessibilityRole="button"
        accessibilityLabel={item.title || item.a11y || item.cta || STORE_SECTIONS.promoA11y}
        style={[shadow.soft, { height: CARD_H }]}
      >
        {item.kind === "rewards" ? (
          <RewardsCard item={item} width={width} isDark={isDark} signedIn={signedIn} points={points} />
        ) : (
          <ImageCard item={item} width={width} />
        )}
      </PressableScale>
    </DepthSlide>
  );
}

/** Peeking, auto-advancing promo carousel with depth scaling and animated page dots. */
export default function PromoCarousel({ items, onPressItem, signedIn = false, points = 0 }) {
  const { isDark, gutter } = useStoreTheme();
  const { width } = useWindowDimensions();
  const cardW = Math.round(width * 0.88);
  const step = cardW + GAP;
  const listRef = useRef(null);
  const indexRef = useRef(0);
  const pausedUntil = useRef(0);
  const scrollX = useSharedValue(0);

  const setIndex = useCallback((next) => {
    indexRef.current = next;
  }, []);
  const pause = useCallback(() => {
    pausedUntil.current = Date.now() + 9000;
  }, []);

  const onScroll = useAnimatedScrollHandler({
    onScroll: (e) => {
      scrollX.value = e.contentOffset.x;
    },
    onBeginDrag: () => {
      runOnJS(pause)();
    },
  });

  useAnimatedReaction(
    () => Math.round(scrollX.value / step),
    (now, prev) => {
      if (now !== prev) runOnJS(setIndex)(now);
    },
    [step]
  );

  useEffect(() => {
    if (items.length < 2) return undefined;
    const id = setInterval(() => {
      if (Date.now() < pausedUntil.current) return;
      const next = (indexRef.current + 1) % items.length;
      listRef.current?.scrollToOffset({ offset: next * step, animated: true });
    }, AUTOPLAY_MS);
    return () => clearInterval(id);
  }, [items.length, step]);

  if (!items.length) return null;

  return (
    <View style={styles.wrap}>
      <AnimatedFlatList
        ref={listRef}
        data={items}
        horizontal
        keyExtractor={(item) => item.key}
        showsHorizontalScrollIndicator={false}
        snapToInterval={step}
        snapToAlignment="start"
        decelerationRate="fast"
        scrollEventThrottle={16}
        onScroll={onScroll}
        contentContainerStyle={{ paddingHorizontal: gutter, gap: GAP }}
        renderItem={({ item, index }) => (
          <Slide
            item={item}
            index={index}
            scrollX={scrollX}
            step={step}
            width={cardW}
            isDark={isDark}
            signedIn={signedIn}
            points={points}
            onPress={() => onPressItem?.(item)}
          />
        )}
      />
      <PagerDots count={items.length} scrollX={scrollX} step={step} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 12 },
  card: { height: CARD_H, overflow: "hidden" },
  copy: { flex: 1, padding: 18, justifyContent: "center", gap: 5, maxWidth: "68%" },
  heading: { marginBottom: 1 },
  cta: { alignSelf: "flex-start", marginTop: 7, paddingHorizontal: 16, height: 34, borderRadius: 17, alignItems: "center", justifyContent: "center" },
  coinArt: { position: "absolute", right: -6, bottom: -4 },
  imageCopy: {
    position: "absolute",
    left: 16,
    right: 16,
    bottom: 16,
    gap: 4,
  },
  arrowDisc: {
    position: "absolute",
    right: 14,
    bottom: 14,
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
  },
  imageCta: {
    alignSelf: "flex-start",
    marginTop: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    height: 32,
    paddingHorizontal: 13,
    borderRadius: 16,
  },
});
