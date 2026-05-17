import React, { memo, useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import ProductImage from "../../ui/ProductImage";
import { Ionicons } from "@expo/vector-icons";
import Card from "../../ui/Card";
import Badge from "../../ui/Badge";
import { useTheme } from "../../../context/ThemeContext";
import { PRODUCT_SCREEN } from "../../../content/appContent";
import { fonts } from "../../../theme/tokens";
import { formatReviewDate, initialsFromName } from "./reviewUtils";

const COPY = PRODUCT_SCREEN.reviews;
const BODY_LINE_HEIGHT = 14 * 1.6;
const COLLAPSED_LINES = 4;

function StarRow({ rating, size, color, emptyColor }) {
  return (
    <View style={{ flexDirection: "row", gap: 2 }}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Ionicons
          key={i}
          name={i <= Math.round(rating) ? "star" : "star-outline"}
          size={size}
          color={i <= Math.round(rating) ? color : emptyColor}
        />
      ))}
    </View>
  );
}

function ReviewCardBase({ review, userVote, onVote, onPhotoPress }) {
  const { semanticPalette } = useTheme();
  const [expanded, setExpanded] = useState(false);
  const [needsExpand, setNeedsExpand] = useState(false);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        header: { flexDirection: "row", alignItems: "flex-start", gap: 12 },
        avatar: {
          width: 40,
          height: 40,
          borderRadius: 20,
          backgroundColor: semanticPalette.accentSoft,
          alignItems: "center",
          justifyContent: "center",
        },
        avatarText: {
          fontFamily: fonts.semibold,
          fontSize: 14,
          color: semanticPalette.accent,
        },
        meta: { flex: 1, minWidth: 0, gap: 4 },
        nameRow: { flexDirection: "row", flexWrap: "wrap", alignItems: "center", gap: 6 },
        name: { fontFamily: fonts.medium, fontSize: 14, color: semanticPalette.ink },
        date: { fontFamily: fonts.regular, fontSize: 12, color: semanticPalette.inkMuted },
        title: { fontFamily: fonts.semibold, fontSize: 15, color: semanticPalette.ink },
        body: { fontFamily: fonts.regular, fontSize: 14, lineHeight: BODY_LINE_HEIGHT, color: semanticPalette.inkSoft },
        readMore: { fontFamily: fonts.semibold, fontSize: 13, color: semanticPalette.accent, marginTop: 4 },
        photos: { flexDirection: "row", gap: 8, marginTop: 4 },
        photo: { width: 80, height: 80, borderRadius: 8, backgroundColor: semanticPalette.surfaceAlt },
        helpfulRow: { flexDirection: "row", alignItems: "center", gap: 12, flexWrap: "wrap" },
        helpfulLabel: { fontFamily: fonts.regular, fontSize: 12, color: semanticPalette.inkMuted },
        voteBtn: {
          flexDirection: "row",
          alignItems: "center",
          gap: 4,
          paddingHorizontal: 10,
          paddingVertical: 6,
          borderRadius: 999,
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: semanticPalette.line,
        },
        votePressed: { backgroundColor: semanticPalette.surfaceAlt, opacity: 0.72 },
        voteCount: { fontFamily: fonts.medium, fontSize: 12, color: semanticPalette.ink },
      }),
    [semanticPalette]
  );

  const body = review.comment || COPY.noBody;
  const dateStr = formatReviewDate(review.createdAt);

  return (
    <Card padding={20} style={{ width: "100%" }}>
      <View style={{ gap: 12 }}>
        <View style={styles.header}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initialsFromName(review.userName)}</Text>
          </View>
          <View style={styles.meta}>
            <View style={styles.nameRow}>
              <Text style={styles.name} numberOfLines={1}>
                {review.userName}
              </Text>
              {review.verifiedPurchase ? (
                <Badge variant="success" size="sm">
                  {COPY.verifiedPurchase}
                </Badge>
              ) : null}
            </View>
          </View>
          {dateStr ? <Text style={styles.date}>{dateStr}</Text> : null}
        </View>

        <StarRow rating={review.rating} size={16} color={semanticPalette.accent} emptyColor={semanticPalette.inkMuted} />

        {review.title ? <Text style={styles.title}>{review.title}</Text> : null}

        <View>
          <Text
            style={styles.body}
            numberOfLines={expanded ? undefined : COLLAPSED_LINES}
            onTextLayout={(e) => {
              if (!expanded && e.nativeEvent.lines.length >= COLLAPSED_LINES) {
                setNeedsExpand(true);
              }
            }}
          >
            {body}
          </Text>
          {needsExpand && !expanded ? (
            <Pressable onPress={() => setExpanded(true)} hitSlop={8}>
              <Text style={styles.readMore}>{COPY.readMore}</Text>
            </Pressable>
          ) : null}
        </View>

        {review.photos?.length > 0 ? (
          <ScrollViewPhotos photos={review.photos} onPhotoPress={onPhotoPress} style={styles} />
        ) : null}

        <View style={styles.helpfulRow}>
          <Text style={styles.helpfulLabel}>{COPY.helpfulQuestion}</Text>
          <Pressable
            onPress={() => onVote?.(review.id, true)}
            disabled={Boolean(userVote)}
            style={[styles.voteBtn, userVote === "up" ? styles.votePressed : null]}
            accessibilityRole="button"
          >
            <Ionicons
              name="thumbs-up"
              size={14}
              color={userVote === "up" ? semanticPalette.inkMuted : semanticPalette.ink}
            />
            <Text style={styles.voteCount}>{review.helpfulCount}</Text>
          </Pressable>
          <Pressable
            onPress={() => onVote?.(review.id, false)}
            disabled={Boolean(userVote)}
            style={[styles.voteBtn, userVote === "down" ? styles.votePressed : null]}
            accessibilityRole="button"
          >
            <Ionicons
              name="thumbs-down"
              size={14}
              color={userVote === "down" ? semanticPalette.inkMuted : semanticPalette.ink}
            />
            <Text style={styles.voteCount}>{review.notHelpfulCount}</Text>
          </Pressable>
        </View>
      </View>
    </Card>
  );
}

function ScrollViewPhotos({ photos, onPhotoPress, style }) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={style.photos}>
      {photos.map((uri, idx) => (
        <Pressable key={`${uri}-${idx}`} onPress={() => onPhotoPress?.(uri, photos, idx)}>
          <ProductImage uri={uri} style={style.photo} contentFit="cover" transition={120} lazy />
        </Pressable>
      ))}
    </ScrollView>
  );
}

const ReviewCard = memo(ReviewCardBase);

export default ReviewCard;
