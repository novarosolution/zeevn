import React, { memo, useMemo } from "react";
import { Platform, Pressable, StyleSheet, Text, View, useWindowDimensions } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Card from "../../ui/Card";
import Badge from "../../ui/Badge";
import Button from "../../ui/Button";
import { useTheme } from "../../../context/ThemeContext";
import { PRODUCT_SCREEN, fillProductScreen } from "../../../content/appContent";
import { fonts } from "../../../theme/tokens";
import { buildRatingDistribution, verifiedPercent } from "./reviewUtils";

const COPY = PRODUCT_SCREEN.reviews;
const STAR_SIZES = { hero: 18, bar: 12 };

function StarIcons({ rating, size = 18, color, emptyColor }) {
  const full = Math.floor(rating);
  const half = rating - full >= 0.25 && rating - full < 0.85;
  return (
    <View style={{ flexDirection: "row", gap: 2 }}>
      {[1, 2, 3, 4, 5].map((i) => {
        const filled = i <= full || (half && i === full + 1);
        return (
          <Ionicons
            key={i}
            name={filled ? "star" : "star-outline"}
            size={size}
            color={filled ? color : emptyColor}
          />
        );
      })}
    </View>
  );
}

function ReviewsSummaryBase({ reviews, ratingAverage, reviewCount, onFilterByRating, isEmpty = false, onBeFirstPress }) {
  const { width } = useWindowDimensions();
  const { semanticPalette, TYPE } = useTheme();
  const isWide = width >= 768;
  const dist = useMemo(() => buildRatingDistribution(reviews), [reviews]);
  const total = Math.max(reviewCount, (reviews || []).length, 1);
  const verifiedPct = verifiedPercent(reviews);
  const displayRating = reviewCount > 0 ? ratingAverage : 0;

  const styles = useMemo(
    () =>
      StyleSheet.create({
        row: {
          flexDirection: isWide ? "row" : "column",
          gap: isWide ? 32 : 24,
        },
        left: { flex: isWide ? 1 : undefined, alignItems: isWide ? "flex-start" : "center" },
        right: { flex: isWide ? 1.2 : undefined, gap: 10 },
        ratingValue: {
          fontFamily: TYPE.serifFamily,
          fontSize: 60,
          lineHeight: 64,
          fontWeight: "500",
          color: semanticPalette.ink,
          fontVariant: ["tabular-nums"],
        },
        basedOn: {
          fontFamily: fonts.regular,
          fontSize: TYPE.small.fontSize,
          color: semanticPalette.inkMuted,
          marginTop: 8,
        },
        verifiedWrap: { marginTop: 12 },
        barRow: { flexDirection: "row", alignItems: "center", gap: 10 },
        barLabel: {
          width: 36,
          fontFamily: fonts.medium,
          fontSize: 12,
          color: semanticPalette.ink,
        },
        track: {
          flex: 1,
          height: 8,
          borderRadius: 4,
          backgroundColor: semanticPalette.lineSoft,
          overflow: "hidden",
        },
        fill: { height: "100%", borderRadius: 4, backgroundColor: semanticPalette.accent },
        count: {
          width: 32,
          textAlign: "right",
          fontFamily: fonts.regular,
          fontSize: 12,
          color: semanticPalette.inkMuted,
          fontVariant: ["tabular-nums"],
        },
      }),
    [TYPE, isWide, semanticPalette]
  );

  const basedOnText =
    reviewCount === 1
      ? COPY.basedOnOne
      : fillProductScreen(COPY.basedOn, { count: String(reviewCount) });

  return (
    <Card padding={24} style={{ width: "100%" }}>
      <View style={styles.row}>
        <View style={styles.left}>
          <Text style={styles.ratingValue}>{displayRating > 0 ? displayRating.toFixed(1) : "—"}</Text>
          <StarIcons
            rating={isEmpty ? 0 : displayRating}
            size={STAR_SIZES.hero}
            color={isEmpty ? semanticPalette.inkMuted : semanticPalette.accent}
            emptyColor={semanticPalette.inkMuted}
          />
          <Text style={styles.basedOn}>{isEmpty ? COPY.emptySubtitle : basedOnText}</Text>
          {isEmpty ? (
            <View style={{ marginTop: 16, width: "100%", maxWidth: 280 }}>
              <Button
                label={COPY.beFirstToReview}
                variant="secondary"
                fullWidth
                onPress={onBeFirstPress}
                accessibilityLabel={COPY.beFirstToReviewA11y}
              />
            </View>
          ) : null}
          {reviewCount > 0 && verifiedPct > 0 ? (
            <View style={styles.verifiedWrap}>
              <Badge variant="brass" size="sm">
                {fillProductScreen(COPY.verifiedPct, { pct: String(verifiedPct) })}
              </Badge>
            </View>
          ) : null}
        </View>

        {!isEmpty ? (
        <View style={styles.right}>
          {[5, 4, 3, 2, 1].map((star) => {
            const count = dist[star] || 0;
            const pct = total > 0 ? count / total : 0;
            return (
              <Pressable
                key={star}
                onPress={() => onFilterByRating?.(star)}
                style={({ pressed }) => [styles.barRow, pressed ? { opacity: 0.88 } : null]}
                accessibilityRole="button"
                accessibilityLabel={fillProductScreen(COPY.filterStarsA11y, { n: String(star) })}
              >
                <Text style={styles.barLabel}>{`${star} ★`}</Text>
                <View style={styles.track}>
                  <View style={[styles.fill, { width: `${Math.round(pct * 100)}%` }]} />
                </View>
                <Text style={styles.count}>{count}</Text>
              </Pressable>
            );
          })}
        </View>
        ) : null}
      </View>
    </Card>
  );
}

const ReviewsSummary = memo(ReviewsSummaryBase);

export default ReviewsSummary;
