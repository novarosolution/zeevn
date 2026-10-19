import React, { useState } from "react";
import { FlatList, StyleSheet, Text, View, useWindowDimensions } from "react-native";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import Svg, { Circle, Defs, LinearGradient as SvgGradient, Path, Stop } from "react-native-svg";
import { STORE_SECTIONS } from "../../content/storefrontContent";
import { useStoreTheme, withAlpha } from "../../theme/storefront";
import { Sparkle } from "./Ornaments";
import PressableScale from "./PressableScale";
import StoreIcon from "./StoreIcon";

const GAP = 10;
/** Compact landscape promo band (~16:9). */
const CARD_RATIO = 9 / 16;
const CARD_H_MIN = 148;
const CARD_H_MAX = 188;

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

function FloatingCoins() {
  return (
    <View style={styles.coinArt} pointerEvents="none">
      <CoinArt />
    </View>
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

function RewardsCard({ item, width, height, isDark, signedIn, points }) {
  const { c, r, type } = useStoreTheme();
  const colors = isDark ? ["#4A3812", "#2E2209"] : ["#FFF0C9", "#F8D68C"];
  const personal = signedIn && item.signedIn;
  const title = personal ? item.signedIn.title(Number(points || 0).toLocaleString("en-IN")) : item.title;
  const cta = personal ? item.signedIn.cta : item.cta;
  return (
    <View style={[styles.card, { width, height, borderRadius: r.xxl }]}>
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

/** Photo slide with left copy + gold CTA over a soft scrim (product stays visible on the right). */
function ImageCard({ item, width, height }) {
  const { c, r, type } = useStoreTheme();
  const source = typeof item.image === "number" ? item.image : { uri: item.image };
  const hasCopy = Boolean(item.eyebrow || item.title || item.subtitle);
  return (
    <View style={[styles.card, { width, height, borderRadius: r.xxl, backgroundColor: "#1A1208" }]}>
      <Image
        source={source}
        style={StyleSheet.absoluteFill}
        contentFit="cover"
        contentPosition="center"
        transition={0}
        cachePolicy="memory-disk"
      />
      {hasCopy || item.cta ? (
        <LinearGradient
          colors={[withAlpha("#0E100A", 0.72), withAlpha("#0E100A", 0.28), "transparent"]}
          locations={[0, 0.42, 0.78]}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={StyleSheet.absoluteFill}
          pointerEvents="none"
        />
      ) : null}
      <View style={styles.imageCopy} pointerEvents="none">
        {item.eyebrow ? (
          <Text style={type.eyebrow(c.goldBright, 9.5)} numberOfLines={1}>
            {item.eyebrow}
          </Text>
        ) : null}
        {item.title ? (
          <Text style={type.display(20, { color: "#FAF8F4", ls: -0.45, lh: 24 })} numberOfLines={2}>
            {item.title}
          </Text>
        ) : null}
        {item.subtitle ? (
          <Text style={type.ui(12, "medium", withAlpha("#FAF8F4", 0.88))} numberOfLines={2}>
            {item.subtitle}
          </Text>
        ) : null}
        {item.cta ? (
          <View
            style={[
              styles.imageCta,
              {
                backgroundColor: withAlpha(c.gold, 0.92),
                borderWidth: StyleSheet.hairlineWidth,
                borderColor: withAlpha("#FFFFFF", 0.55),
              },
            ]}
          >
            <Text style={type.ui(12.5, "extrabold", "#2E2208", { letterSpacing: 0.2 })}>{item.cta}</Text>
            <StoreIcon icon={{ ion: "arrow-forward" }} size={13} color="#2E2208" />
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

function Slide({ item, width, height, isDark, signedIn, points, onPress }) {
  const { shadow } = useStoreTheme();
  return (
    <PressableScale
      onPress={onPress}
      scaleTo={0.98}
      accessibilityRole="button"
      accessibilityLabel={item.title || item.a11y || item.cta || STORE_SECTIONS.promoA11y}
      style={[shadow.soft, { height }]}
    >
      {item.kind === "rewards" ? (
        <RewardsCard item={item} width={width} height={height} isDark={isDark} signedIn={signedIn} points={points} />
      ) : (
        <ImageCard item={item} width={width} height={height} />
      )}
    </PressableScale>
  );
}

function StaticDots({ count, active, style }) {
  const { c } = useStoreTheme();
  if (count < 2) return null;
  return (
    <View style={[styles.pager, style]}>
      {Array.from({ length: count }, (_, i) => (
        <View
          key={i}
          style={[
            styles.pagerDot,
            {
              width: i === active ? 22 : 6,
              backgroundColor: i === active ? c.brand : c.lineStrong,
            },
          ]}
        />
      ))}
    </View>
  );
}

/** Peeking promo carousel — no scroll-driven Reanimated work (keeps Home smooth). */
export default function PromoCarousel({ items, onPressItem, signedIn = false, points = 0 }) {
  const { isDark, gutter } = useStoreTheme();
  const { width } = useWindowDimensions();
  const cardW = Math.round(width * 0.88);
  const cardH = Math.round(Math.min(CARD_H_MAX, Math.max(CARD_H_MIN, cardW * CARD_RATIO)));
  const step = cardW + GAP;
  const [active, setActive] = useState(0);

  if (!items.length) return null;

  return (
    <View style={styles.wrap}>
      <FlatList
        data={items}
        horizontal
        keyExtractor={(item) => item.key}
        showsHorizontalScrollIndicator={false}
        snapToInterval={step}
        snapToAlignment="start"
        decelerationRate="fast"
        scrollEventThrottle={32}
        onMomentumScrollEnd={(e) => {
          const next = Math.round(e.nativeEvent.contentOffset.x / step);
          setActive(Math.max(0, Math.min(items.length - 1, next)));
        }}
        contentContainerStyle={{ paddingHorizontal: gutter, gap: GAP }}
        renderItem={({ item }) => (
          <Slide
            item={item}
            width={cardW}
            height={cardH}
            isDark={isDark}
            signedIn={signedIn}
            points={points}
            onPress={() => onPressItem?.(item)}
          />
        )}
      />
      <StaticDots count={items.length} active={active} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 12 },
  card: { overflow: "hidden" },
  copy: { flex: 1, padding: 18, justifyContent: "center", gap: 5, maxWidth: "68%" },
  heading: { marginBottom: 1 },
  cta: { alignSelf: "flex-start", marginTop: 7, paddingHorizontal: 16, height: 34, borderRadius: 17, alignItems: "center", justifyContent: "center" },
  coinArt: { position: "absolute", right: -6, bottom: -4 },
  imageCopy: {
    position: "absolute",
    left: 16,
    right: "42%",
    top: 0,
    bottom: 0,
    justifyContent: "center",
    gap: 5,
    paddingVertical: 14,
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
    height: 34,
    paddingHorizontal: 14,
    borderRadius: 17,
  },
  pager: { flexDirection: "row", justifyContent: "center", alignItems: "center", gap: 5 },
  pagerDot: { height: 6, borderRadius: 3 },
});
