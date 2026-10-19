import React from "react";
import { StyleSheet, Text, View, useWindowDimensions } from "react-native";
import { Image } from "expo-image";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import Animated, { useAnimatedScrollHandler, useSharedValue } from "react-native-reanimated";
import { useStoreTheme, withAlpha } from "../../theme/storefront";
import { resolveImageSource } from "../../utils/mediaSource";
import { DepthSlide, PagerDots } from "./HomeMotion";
import { SectionHeader } from "./SectionTitle";

const GAP = 12;

function Stars({ rating = 5 }) {
  const { c } = useStoreTheme();
  return (
    <View style={styles.stars} accessible accessibilityLabel={`${rating} out of 5 stars`}>
      {Array.from({ length: 5 }, (_, i) => (
        <Ionicons key={i} name={i < rating ? "star" : "star-outline"} size={15} color={c.gold} />
      ))}
    </View>
  );
}

/** One customer quote: stars, the words, and who said them. */
function ReviewCard({ item, width }) {
  const { c, r, type, shadow, isDark } = useStoreTheme();
  const avatar = resolveImageSource(item.avatar);
  return (
    <View style={[styles.card, shadow.card, { width, borderRadius: r.xxl, backgroundColor: c.card, borderColor: withAlpha(c.gold, isDark ? 0.26 : 0.34) }]}>
      <MaterialCommunityIcons
        name="format-quote-open"
        size={84}
        color={withAlpha(c.gold, isDark ? 0.16 : 0.2)}
        style={styles.quoteMark}
      />
      <Stars rating={item.rating} />
      <Text style={[type.ui(15.5, "medium", c.ink), styles.quote]} numberOfLines={6}>
        {item.quote}
      </Text>
      <View style={styles.who}>
        <View style={[styles.avatar, { borderColor: c.gold, backgroundColor: c.soft }]}>
          {avatar ? <Image source={avatar} style={StyleSheet.absoluteFill} contentFit="cover" cachePolicy="memory-disk" /> : null}
        </View>
        <View style={styles.name}>
          <Text style={type.ui(14, "extrabold", c.ink)} numberOfLines={1}>
            {item.name}
          </Text>
          {item.city ? (
            <Text style={type.ui(12.5, "medium", c.inkMute)} numberOfLines={1}>
              {item.city}
            </Text>
          ) : null}
        </View>
      </View>
    </View>
  );
}

/**
 * Customer reviews — a snapping carousel of quote cards. The quotes live in `HOME_TESTIMONIALS` (appContent.js);
 * the rating line under the title is computed from the live catalog.
 */
export default function StoreReviews({ items, overline, title, caption }) {
  const { gutter } = useStoreTheme();
  const { width } = useWindowDimensions();
  const cardW = Math.round(width * 0.8);
  const stride = cardW + GAP;
  const scrollX = useSharedValue(0);
  const onScroll = useAnimatedScrollHandler((e) => {
    scrollX.value = e.contentOffset.x;
  });
  if (!items?.length) return null;

  return (
    <View style={styles.wrap}>
      <SectionHeader eyebrow={overline} title={title} caption={caption} />
      <Animated.FlatList
        data={items}
        horizontal
        keyExtractor={(item) => item.key}
        showsHorizontalScrollIndicator={false}
        snapToInterval={stride}
        snapToAlignment="start"
        decelerationRate="fast"
        scrollEventThrottle={16}
        onScroll={onScroll}
        contentContainerStyle={{ paddingHorizontal: gutter, paddingVertical: 6, gap: GAP }}
        renderItem={({ item, index }) => (
          <DepthSlide index={index} scrollX={scrollX} step={stride}>
            <ReviewCard item={item} width={cardW} />
          </DepthSlide>
        )}
      />
      <PagerDots count={items.length} scrollX={scrollX} step={stride} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 12 },
  card: { borderWidth: 1, padding: 18, gap: 12, minHeight: 232, overflow: "hidden", justifyContent: "space-between" },
  quoteMark: { position: "absolute", right: 6, top: -6 },
  stars: { flexDirection: "row", gap: 2 },
  quote: { lineHeight: 23 },
  who: { flexDirection: "row", alignItems: "center", gap: 12 },
  avatar: { width: 46, height: 46, borderRadius: 23, borderWidth: 2, overflow: "hidden" },
  name: { flex: 1, minWidth: 0, gap: 1 },
});
