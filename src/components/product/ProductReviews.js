import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import SectionHeader from "../ui/SectionHeader";
import Button from "../ui/Button";
import Toast from "../ui/Toast";
import Skeleton from "../ui/Skeleton";
import ReviewsSummary from "./reviews/ReviewsSummary";
import ReviewFilters from "./reviews/ReviewFilters";
import ReviewCard from "./reviews/ReviewCard";
import ReviewComposer from "./reviews/ReviewComposer";
import { useTheme } from "../../context/ThemeContext";
import { PRODUCT_SCREEN } from "../../content/appContent";
import { submitProductReview, voteProductReview } from "../../services/productService";
import { hapticSuccess } from "../../utils/haptics";
import {
  FILTER_ALL,
  REVIEW_PAGE_SIZE,
  SORT_RECENT,
  filterReviews,
  normalizeReview,
  sortReviews,
} from "./reviews/reviewUtils";

const COPY = PRODUCT_SCREEN.reviews;
const VOTES_KEY = "@zeevan_review_helpful_votes";

function ReviewsSectionSkeleton() {
  const { SPACING } = useTheme();
  return (
    <View style={{ width: "100%", gap: SPACING.md }}>
      <Skeleton height={140} radius="md" />
      <Skeleton height={48} width="60%" radius="sm" />
      <Skeleton height={120} radius="md" />
      <Skeleton height={120} radius="md" />
    </View>
  );
}

export default function ProductReviews({
  reviews: rawReviews = [],
  reviewsLoading = false,
  ratingAverage = 0,
  reviewCount = 0,
  productId,
  isAuthenticated,
  token,
  onReviewsUpdate,
  onNavigateLogin,
  sectionStyle,
}) {
  const { semanticPalette, SPACING } = useTheme();
  const [filterKey, setFilterKey] = useState(FILTER_ALL);
  const [sortKey, setSortKey] = useState(SORT_RECENT);
  const [visibleCount, setVisibleCount] = useState(REVIEW_PAGE_SIZE);
  const [busy, setBusy] = useState(false);
  const [votes, setVotes] = useState({});
  const [helpfulCounts, setHelpfulCounts] = useState({});
  const [toastVisible, setToastVisible] = useState(false);
  const [lightbox, setLightbox] = useState(null);
  const [composerOpen, setComposerOpen] = useState(false);

  const reviews = useMemo(
    () => (rawReviews || []).map(normalizeReview).filter(Boolean),
    [rawReviews]
  );

  useEffect(() => {
    const counts = {};
    reviews.forEach((r) => {
      counts[r.id] = { helpful: r.helpfulCount, notHelpful: r.notHelpfulCount };
    });
    setHelpfulCounts(counts);
  }, [reviews]);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(VOTES_KEY);
        const parsed = raw ? JSON.parse(raw) : {};
        if (alive && parsed && typeof parsed === "object") setVotes(parsed);
      } catch {
        if (alive) setVotes({});
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  const persistVote = useCallback(async (reviewId, vote) => {
    const next = { ...votes, [reviewId]: vote };
    setVotes(next);
    try {
      await AsyncStorage.setItem(VOTES_KEY, JSON.stringify(next));
    } catch {
      /* noop */
    }
  }, [votes]);

  const filteredSorted = useMemo(() => {
    const filtered = filterReviews(
      reviews.map((r) => ({
        ...r,
        helpfulCount: helpfulCounts[r.id]?.helpful ?? r.helpfulCount,
        notHelpfulCount: helpfulCounts[r.id]?.notHelpful ?? r.notHelpfulCount,
      })),
      filterKey
    );
    return sortReviews(filtered, sortKey);
  }, [reviews, filterKey, sortKey, helpfulCounts]);

  const visible = filteredSorted.slice(0, visibleCount);
  const remaining = Math.max(0, filteredSorted.length - visibleCount);
  const isEmpty = reviewCount === 0 && reviews.length === 0;

  useEffect(() => {
    if (isEmpty) setComposerOpen(true);
  }, [isEmpty]);

  const handleFilterByRating = useCallback((star) => {
    setFilterKey(String(star));
    setVisibleCount(REVIEW_PAGE_SIZE);
  }, []);

  const handleSubmit = useCallback(
    async ({ rating, title, comment, photos }) => {
      if (!token) {
        onNavigateLogin?.();
        return;
      }
      setBusy(true);
      try {
        const payload = await submitProductReview(token, productId, {
          rating,
          title,
          comment,
          photos,
        });
        onReviewsUpdate?.(payload);
        hapticSuccess();
        setToastVisible(true);
        setFilterKey(FILTER_ALL);
        setSortKey(SORT_RECENT);
        setVisibleCount(REVIEW_PAGE_SIZE);
      } finally {
        setBusy(false);
      }
    },
    [onNavigateLogin, onReviewsUpdate, productId, token]
  );

  const handleVote = useCallback(
    async (reviewId, helpful) => {
      if (votes[reviewId]) return;
      const vote = helpful ? "up" : "down";
      await persistVote(reviewId, vote);

      setHelpfulCounts((prev) => {
        const cur = prev[reviewId] || { helpful: 0, notHelpful: 0 };
        return {
          ...prev,
          [reviewId]: {
            helpful: cur.helpful + (helpful ? 1 : 0),
            notHelpful: cur.notHelpful + (helpful ? 0 : 1),
          },
        };
      });

      if (token) {
        try {
          const result = await voteProductReview(token, productId, reviewId, helpful);
          setHelpfulCounts((prev) => ({
            ...prev,
            [reviewId]: { helpful: result.helpfulCount, notHelpful: result.notHelpfulCount },
          }));
        } catch {
          /* keep optimistic */
        }
      }
    },
    [persistVote, productId, token, votes]
  );

  return (
    <View style={[{ width: "100%", gap: 16 }, sectionStyle]}>
      <SectionHeader
        overline={COPY.sectionOverline}
        title={COPY.sectionTitleShort || COPY.sectionTitle}
        headingLevel={2}
        subtitle={isEmpty ? COPY.emptySubtitle : undefined}
      />

      {reviewsLoading && reviews.length === 0 ? (
        <ReviewsSectionSkeleton />
      ) : (
        <ReviewsSummary
          reviews={reviews}
          ratingAverage={ratingAverage}
          reviewCount={reviewCount}
          onFilterByRating={handleFilterByRating}
          isEmpty={isEmpty}
          onBeFirstPress={() => setComposerOpen(true)}
        />
      )}

      {reviewsLoading && reviews.length === 0 ? null : reviewCount > 0 ? (
        <>
          <ReviewFilters
            filterKey={filterKey}
            sortKey={sortKey}
            onFilterChange={(key) => {
              setFilterKey(key);
              setVisibleCount(REVIEW_PAGE_SIZE);
            }}
            onSortChange={(key) => {
              setSortKey(key);
              setVisibleCount(REVIEW_PAGE_SIZE);
            }}
          />

          <View style={{ gap: 16 }}>
            {visible.map((review) => (
              <ReviewCard
                key={review.id}
                review={review}
                userVote={votes[review.id]}
                onVote={handleVote}
                onPhotoPress={(uri, photos, index) => setLightbox({ uri, photos, index })}
              />
            ))}
          </View>

          {remaining > 0 ? (
            <Button
              variant="ghost"
              fullWidth
              label={COPY.loadMore.replace("{n}", String(remaining))}
              onPress={() => setVisibleCount((c) => c + REVIEW_PAGE_SIZE)}
            />
          ) : null}
        </>
      ) : null}

      {!reviewsLoading || reviews.length > 0 ? (
        <ReviewComposer
          productId={productId}
          token={token}
          isAuthenticated={isAuthenticated}
          onNavigateLogin={onNavigateLogin}
          onSubmit={handleSubmit}
          busy={busy}
          defaultOpen={composerOpen}
        />
      ) : null}

      <Toast
        visible={toastVisible}
        message={PRODUCT_SCREEN.reviewSubmitSuccess}
        onDismiss={() => setToastVisible(false)}
        durationMs={3500}
      />

      <Modal visible={Boolean(lightbox)} transparent animationType="fade" onRequestClose={() => setLightbox(null)}>
        <Pressable style={lbStyles.backdrop} onPress={() => setLightbox(null)}>
          <Pressable style={lbStyles.close} onPress={() => setLightbox(null)} hitSlop={12}>
            <Ionicons name="close" size={28} color="#fff" />
          </Pressable>
          {lightbox?.uri ? (
            <Image source={{ uri: lightbox.uri }} style={lbStyles.image} contentFit="contain" transition={180} />
          ) : null}
        </Pressable>
      </Modal>
    </View>
  );
}

const lbStyles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(14,23,41,0.92)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  image: { width: "100%", height: "72%" },
  close: { position: "absolute", top: 48, right: 24, zIndex: 2 },
});
