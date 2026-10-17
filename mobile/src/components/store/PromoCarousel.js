import React, { useCallback, useEffect, useRef, useState } from "react";
import { FlatList, StyleSheet, Text, View, useWindowDimensions } from "react-native";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import Svg, { Circle, Defs, LinearGradient as SvgGradient, Path, Stop } from "react-native-svg";
import { useStoreTheme, withAlpha } from "../../theme/storefront";
import { Sparkle } from "./Ornaments";
import PressableScale from "./PressableScale";
import StoreIcon from "./StoreIcon";

const GAP = 10;
const CARD_H = 196;
const AUTOPLAY_MS = 5600;

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

function CtaPill({ label, color, textColor }) {
  const { type } = useStoreTheme();
  return (
    <View style={[styles.cta, { backgroundColor: color }]}>
      <Text style={type.ui(13.5, "extrabold", textColor, { letterSpacing: 0.2 })}>{label}</Text>
    </View>
  );
}

function RewardsCard({ item, width, isDark }) {
  const { c, r, type } = useStoreTheme();
  const colors = isDark ? ["#4A3812", "#2E2209"] : ["#FFF0C9", "#F8D68C"];
  return (
    <View style={[styles.card, { width, borderRadius: r.xxl }]}>
      <LinearGradient colors={colors} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
      <View style={styles.coinArt} pointerEvents="none">
        <CoinArt />
      </View>
      <View style={styles.copy}>
        <Text style={type.eyebrow(isDark ? c.goldText : "#8A5A12", 10)}>{item.eyebrow}</Text>
        <Text style={[type.display(26, { color: isDark ? c.ink : "#3A2A0C", ls: -0.5, lh: 29 }), styles.heading]} numberOfLines={2}>
          {item.title}
        </Text>
        <Text style={type.ui(13, "medium", isDark ? c.inkSoft : "#6A4A1C")} numberOfLines={2}>
          {item.subtitle}
        </Text>
        <CtaPill label={item.cta} color={isDark ? c.gold : "#2A1E08"} textColor={isDark ? "#2A1E08" : "#FFF3D0"} />
      </View>
    </View>
  );
}

function FeatureCard({ item, width, isDark }) {
  const { c, r, type } = useStoreTheme();
  const colors = isDark ? ["#2A3A1E", "#1B2814"] : ["#2F4E2B", "#1E3B1F"];
  return (
    <View style={[styles.card, { width, borderRadius: r.xxl }]}>
      <LinearGradient colors={colors} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
      <View style={styles.featureIcon} pointerEvents="none">
        <StoreIcon icon={item.icon} size={118} color={withAlpha("#FFFFFF", 0.09)} />
      </View>
      <View style={styles.copy}>
        <Text style={type.eyebrow(c.goldBright, 10)}>{item.eyebrow}</Text>
        <Text style={[type.display(24, { color: "#FFFFFF", ls: -0.4, lh: 28 }), styles.heading]} numberOfLines={2}>
          {item.title}
        </Text>
        <Text style={type.ui(13, "medium", withAlpha("#FFFFFF", 0.78))} numberOfLines={2}>
          {item.subtitle}
        </Text>
        <CtaPill label={item.cta} color={c.gold} textColor="#2A1E08" />
      </View>
    </View>
  );
}

function ImageCard({ item, width }) {
  const { c, r, type, isDark } = useStoreTheme();
  const source = typeof item.image === "number" ? item.image : { uri: item.image };
  return (
    <View style={[styles.card, { width, borderRadius: r.xxl, backgroundColor: c.soft }]}>
      <Image source={source} style={StyleSheet.absoluteFill} contentFit="cover" transition={250} cachePolicy="memory-disk" />
      <LinearGradient
        colors={["transparent", withAlpha(isDark ? "#0A0806" : "#1A140C", 0.78)]}
        locations={[0.35, 1]}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />
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
        {item.cta ? (
          <View style={[styles.imageCta, { backgroundColor: withAlpha("#FFFFFF", 0.94) }]}>
            <Text style={type.ui(12.5, "extrabold", "#244424", { letterSpacing: 0.2 })}>{item.cta}</Text>
            <StoreIcon icon={{ ion: "arrow-forward" }} size={13} color="#244424" />
          </View>
        ) : null}
      </View>
    </View>
  );
}

/** Peeking, auto-advancing promo carousel with animated page dots. */
export default function PromoCarousel({ items, onPressItem }) {
  const { c, isDark, gutter, shadow } = useStoreTheme();
  const { width } = useWindowDimensions();
  const cardW = Math.round(width * 0.88);
  const step = cardW + GAP;
  const listRef = useRef(null);
  const indexRef = useRef(0);
  const pausedUntil = useRef(0);
  const [index, setIndex] = useState(0);

  const onScroll = useCallback(
    (e) => {
      const next = Math.min(items.length - 1, Math.max(0, Math.round(e.nativeEvent.contentOffset.x / step)));
      if (next !== indexRef.current) {
        indexRef.current = next;
        setIndex(next);
      }
    },
    [items.length, step]
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
      <FlatList
        ref={listRef}
        data={items}
        horizontal
        keyExtractor={(item) => item.key}
        showsHorizontalScrollIndicator={false}
        snapToInterval={step}
        snapToAlignment="start"
        decelerationRate="fast"
        scrollEventThrottle={32}
        onScroll={onScroll}
        onScrollBeginDrag={() => {
          pausedUntil.current = Date.now() + 9000;
        }}
        contentContainerStyle={{ paddingHorizontal: gutter, gap: GAP }}
        renderItem={({ item }) => (
          <PressableScale
            onPress={() => onPressItem?.(item)}
            scaleTo={0.98}
            accessibilityRole="button"
            accessibilityLabel={item.title || item.cta || "Promotion"}
            style={[shadow.soft, { height: CARD_H }]}
          >
            {item.kind === "rewards" ? (
              <RewardsCard item={item} width={cardW} isDark={isDark} />
            ) : item.kind === "feature" ? (
              <FeatureCard item={item} width={cardW} isDark={isDark} />
            ) : (
              <ImageCard item={item} width={cardW} />
            )}
          </PressableScale>
        )}
      />
      {items.length > 1 ? (
        <View style={styles.dots}>
          {items.map((item, i) => (
            <View
              key={item.key}
              style={[styles.dot, { width: i === index ? 20 : 6, backgroundColor: i === index ? c.brand : c.lineStrong }]}
            />
          ))}
        </View>
      ) : null}
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
  featureIcon: { position: "absolute", right: -14, bottom: -18 },
  imageCopy: {
    position: "absolute",
    left: 16,
    right: 16,
    bottom: 16,
    gap: 4,
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
  dots: { flexDirection: "row", justifyContent: "center", alignItems: "center", gap: 5 },
  dot: { height: 6, borderRadius: 3 },
});
