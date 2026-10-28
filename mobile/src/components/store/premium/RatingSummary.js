import React, { memo, useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useStoreTheme, withAlpha } from "../../../theme/storefront";
import { bucketShare, buildRatingStats } from "../../../utils/ratingStats";
import PremiumBoundary from "./PremiumBoundary";

function Stars({ value, size = 16 }) {
  const { c } = useStoreTheme();
  return (
    <View style={styles.stars} accessibilityElementsHidden importantForAccessibility="no">
      {[1, 2, 3, 4, 5].map((i) => {
        const name = value >= i - 0.25 ? "star" : value >= i - 0.75 ? "star-half" : "star-outline";
        return <Ionicons key={i} name={name} size={size} color={c.gold} />;
      })}
    </View>
  );
}

/**
 * Review summary: big average, stars, review count and a five-bar distribution. With only an average and a count (no
 * individual reviews loaded yet) it still shows those and leaves the bars out rather than faking them.
 *
 * props: reviews (array of { rating }), average, count (fallbacks), style
 */
function RatingSummaryBase({ reviews, average = 0, count = 0, style }) {
  const { c, r, type, shadow } = useStoreTheme();
  const stats = useMemo(() => buildRatingStats(reviews, { fallbackAverage: average, fallbackCount: count }), [reviews, average, count]);
  if (!stats.count || !stats.average) return null;

  return (
    <View style={[styles.card, shadow.soft, { backgroundColor: c.card, borderColor: c.line, borderRadius: r.xl }, style]} accessible accessibilityLabel={`Rated ${stats.average.toFixed(1)} out of 5 from ${stats.count} reviews`}>
      <View style={styles.left}>
        <Text style={type.display(44, { ls: -1, lh: 48 })}>{stats.average.toFixed(1)}</Text>
        <Stars value={stats.average} />
        <Text style={type.ui(12.5, "medium", c.inkMute)}>
          {stats.count} {stats.count === 1 ? "review" : "reviews"}
        </Text>
      </View>
      {stats.hasBreakdown ? (
        <View style={styles.bars}>
          {[5, 4, 3, 2, 1].map((star) => (
            <View key={star} style={styles.barRow}>
              <Text style={[type.ui(12, "bold", c.inkSoft), styles.starLabel]}>{star}</Text>
              <Ionicons name="star" size={10} color={c.gold} />
              <View style={[styles.track, { backgroundColor: c.soft }]}>
                <View style={[styles.fill, { width: `${Math.round(bucketShare(stats.buckets, star) * 100)}%`, backgroundColor: star >= 4 ? c.brand : star === 3 ? c.gold : withAlpha(c.danger, 0.8) }]} />
              </View>
              <Text style={[type.ui(11.5, "medium", c.inkMute), styles.barCount]}>{stats.buckets[star]}</Text>
            </View>
          ))}
        </View>
      ) : null}
    </View>
  );
}

const Memo = memo(RatingSummaryBase);

export default function RatingSummary(props) {
  return (
    <PremiumBoundary name="RatingSummary">
      <Memo {...props} />
    </PremiumBoundary>
  );
}

const styles = StyleSheet.create({
  card: { flexDirection: "row", alignItems: "center", gap: 20, padding: 18, borderWidth: StyleSheet.hairlineWidth },
  left: { alignItems: "center", gap: 4, minWidth: 96 },
  stars: { flexDirection: "row", gap: 2 },
  bars: { flex: 1, gap: 6 },
  barRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  starLabel: { width: 10, textAlign: "right" },
  track: { flex: 1, height: 7, borderRadius: 4, overflow: "hidden" },
  fill: { height: "100%", borderRadius: 4 },
  barCount: { width: 24, textAlign: "right" },
});
