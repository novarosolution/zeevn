import React, { useEffect, useMemo, useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { Platform, Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from "react-native";
import { useTheme } from "../../context/ThemeContext";
import { formatINRWhole } from "../../utils/currency";
import { spacing as homeSpacing } from "../../styles/spacing";
import { homeType } from "../../styles/typography";

const CARD_W = 148;
const CARD_H = 240;
const DAY_MS = 24 * 60 * 60 * 1000;

function getDiscountPercent(product) {
  const mrp = Number(product?.mrp || 0);
  const price = Number(product?.price || 0);
  if (!(mrp > price && mrp > 0)) return 0;
  return Math.max(0, Math.round(((mrp - price) / mrp) * 100));
}

function toMs(value) {
  const ms = new Date(value || 0).getTime();
  return Number.isFinite(ms) ? ms : 0;
}

function formatEndsIn(remainingMs) {
  const totalMinutes = Math.max(0, Math.floor(remainingMs / (60 * 1000)));
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `Ends in ${hours}h ${minutes}m`;
}

export default function HomeDealsRail({
  products = [],
  homeViewConfig = {},
  getQuantity,
  onIncrease,
  onDecrease,
  onOpenProduct,
  onSeeAllDeals,
}) {
  const { colors: c, isDark } = useTheme();
  const { width } = useWindowDimensions();
  const brassAction = isDark ? c.accent : c.accentOnLight || c.accent;
  const [nowMs, setNowMs] = useState(Date.now());
  const styles = useMemo(() => createStyles(c, isDark, width >= 600), [c, isDark, width]);

  useEffect(() => {
    const timer = setInterval(() => setNowMs(Date.now()), 60 * 1000);
    return () => clearInterval(timer);
  }, []);

  const deals = useMemo(() => {
    const list = Array.isArray(products) ? products : [];
    const configuredRail = Array.isArray(homeViewConfig?.dealsRail) ? homeViewConfig.dealsRail : [];
    const rankMap = new Map();
    const endMap = new Map();
    configuredRail.forEach((entry, idx) => {
      const id = String(entry?.productId || "").trim();
      if (!id) return;
      rankMap.set(id, Number.isFinite(Number(entry?.rank)) ? Number(entry.rank) : idx);
      if (entry?.endsAt) endMap.set(id, String(entry.endsAt));
    });

    const selected = list
      .filter((item) => item?.inStock !== false && item?.showOnHome !== false)
      .map((item) => {
        const id = String(item?.id || item?._id || "").trim();
        const discountPct = getDiscountPercent(item);
        const isConfigured = rankMap.has(id);
        const isEligible = item?.featuredDeal === true || discountPct >= 15 || isConfigured;
        const endsAt = endMap.get(id) || item?.dealEndsAt || "";
        const endsAtMs = toMs(endsAt);
        const isEndingSoon = endsAtMs > 0 && endsAtMs - nowMs < DAY_MS;
        return {
          ...item,
          id,
          discountPct,
          isConfigured,
          isEligible,
          endsAt,
          endsAtMs,
          isEndingSoon,
          rank: rankMap.has(id) ? rankMap.get(id) : Number.MAX_SAFE_INTEGER,
        };
      })
      .filter((item) => item.isEligible)
      .sort((a, b) => {
        if (a.rank !== b.rank) return a.rank - b.rank;
        if (b.discountPct !== a.discountPct) return b.discountPct - a.discountPct;
        return String(a.name || "").localeCompare(String(b.name || ""));
      })
      .slice(0, 8);

    return selected;
  }, [homeViewConfig?.dealsRail, nowMs, products]);

  const hasEndingSoon = useMemo(() => deals.some((deal) => deal.isEndingSoon), [deals]);
  if (!deals.length) return null;

  return (
    <View style={styles.wrap}>
      <View style={styles.headerRow}>
        <View style={styles.headerCopy}>
          <View style={styles.titleRow}>
            <Text style={styles.title}>Deals</Text>
            {hasEndingSoon ? (
              <View style={styles.endingSoonPill}>
                <Text style={styles.endingSoonText}>ENDING SOON</Text>
              </View>
            ) : null}
          </View>
          <Text style={styles.subtitle}>Limited-time pantry picks.</Text>
        </View>
        <Pressable
          onPress={onSeeAllDeals}
          style={({ pressed }) => [styles.seeAllBtn, pressed ? styles.seeAllPressed : null]}
          accessibilityRole="button"
          accessibilityLabel="See all deals"
        >
          <Text style={styles.seeAllText}>See all deals →</Text>
        </Pressable>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.row}
        decelerationRate={Platform.OS === "ios" ? "fast" : 0.98}
        snapToInterval={CARD_W + homeSpacing.sm}
        snapToAlignment="start"
      >
        {deals.map((item) => {
          const quantity = Math.max(0, Number(getQuantity?.(item) || 0));
          const price = Number(item?.price || 0);
          const mrp = Number(item?.mrp || 0);
          const hasSavings = mrp > price;
          const saveAmount = Math.max(0, mrp - price);
          const showCountdown = item.isEndingSoon && item.endsAtMs > nowMs;
          return (
            <View key={item.id} style={styles.cardWrap}>
              <Pressable
                onPress={() => onOpenProduct?.(item)}
                style={({ pressed }) => [styles.card, pressed ? styles.cardPressed : null]}
                accessibilityRole="button"
                accessibilityLabel={`Open deal for ${item?.name || "product"}`}
              >
                <View style={styles.imageWrap}>
                  <View style={styles.discountBadge}>
                    <Text style={styles.discountText}>{item.discountPct}% OFF</Text>
                  </View>
                  {item.image ? (
                    <Image source={{ uri: item.image }} style={styles.image} contentFit="cover" transition={120} />
                  ) : (
                    <View style={styles.imageFallback} />
                  )}
                  {quantity > 0 ? (
                    <View style={styles.qtyStepper}>
                      <Pressable onPress={() => onDecrease?.(item)} style={styles.stepperBtn} accessibilityRole="button" accessibilityLabel={`Remove one ${item.name}`}>
                        <Ionicons name="remove" size={12} color={brassAction} />
                      </Pressable>
                      <Text style={styles.qtyText}>{quantity}</Text>
                      <Pressable onPress={() => onIncrease?.(item)} style={styles.stepperBtn} accessibilityRole="button" accessibilityLabel={`Add one ${item.name}`}>
                        <Ionicons name="add" size={12} color={brassAction} />
                      </Pressable>
                    </View>
                  ) : (
                    <Pressable
                      onPress={() => onIncrease?.(item)}
                      style={({ pressed }) => [styles.addCircle, pressed ? styles.addCirclePressed : null]}
                      accessibilityRole="button"
                      accessibilityLabel={`Add ${item.name} to bag`}
                    >
                      <Ionicons name="add" size={12} color={brassAction} />
                    </Pressable>
                  )}
                </View>
                <View style={styles.meta}>
                  <Text style={styles.brandOverline} numberOfLines={1}>
                    {String(item.brand || "Zeevan").toUpperCase()}
                  </Text>
                  <Text style={styles.name} numberOfLines={2}>
                    {item.name}
                  </Text>
                  <Text style={styles.unit} numberOfLines={1}>
                    {item.unit || item.variantLabel || "1 pc"}
                  </Text>
                  <View style={styles.priceRow}>
                    <Text style={styles.price}>{formatINRWhole(price)}</Text>
                    {hasSavings ? <Text style={styles.mrp}>{formatINRWhole(mrp)}</Text> : null}
                    {hasSavings ? <Text style={styles.saveTag}>{`Save ${formatINRWhole(saveAmount)}`}</Text> : null}
                  </View>
                </View>
                {showCountdown ? (
                  <View style={styles.countdownBar}>
                    <Text style={styles.countdownText}>{formatEndsIn(item.endsAtMs - nowMs)}</Text>
                  </View>
                ) : null}
              </Pressable>
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}

function createStyles(c, isDark, isTablet) {
  const brassAction = isDark ? c.accent : c.accentOnLight || c.accent;
  return StyleSheet.create({
    wrap: { marginBottom: isTablet ? 40 : 32 },
    headerRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      gap: homeSpacing.sm,
      marginBottom: homeSpacing.sm,
    },
    headerCopy: { flex: 1, minWidth: 0 },
    titleRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      marginBottom: 2,
    },
    title: {
      color: c.textPrimary,
      fontSize: 20,
      fontFamily: homeType.display.fontFamily,
    },
    endingSoonPill: {
      minHeight: 20,
      borderRadius: 999,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: brassAction,
      backgroundColor: c.primarySoft || c.accentSoft,
      paddingHorizontal: 8,
      justifyContent: "center",
    },
    endingSoonText: {
      color: brassAction,
      fontSize: 10,
      fontFamily: homeType.uiSemibold.fontFamily,
      letterSpacing: 0.6,
    },
    subtitle: {
      color: c.textSecondary,
      fontSize: 12,
      fontFamily: homeType.uiRegular.fontFamily,
    },
    seeAllBtn: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      paddingHorizontal: 4,
      minHeight: 26,
    },
    seeAllPressed: { opacity: 0.82 },
    seeAllText: {
      color: brassAction,
      fontSize: 12,
      fontFamily: homeType.uiSemibold.fontFamily,
    },
    row: {
      paddingVertical: homeSpacing.xs,
      paddingRight: homeSpacing.sm,
      gap: homeSpacing.sm,
    },
    cardWrap: {
      width: CARD_W,
      height: CARD_H,
    },
    card: {
      width: "100%",
      height: "100%",
      borderRadius: 14,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: c.border,
      backgroundColor: c.surface,
      overflow: "hidden",
    },
    cardPressed: { opacity: 0.9 },
    imageWrap: {
      width: CARD_W,
      height: CARD_W,
      backgroundColor: c.surfaceAlt,
      position: "relative",
    },
    image: { width: "100%", height: "100%" },
    imageFallback: { width: "100%", height: "100%", backgroundColor: c.surfaceAlt },
    discountBadge: {
      position: "absolute",
      left: 8,
      top: 8,
      zIndex: 3,
      borderRadius: 999,
      minHeight: 20,
      paddingHorizontal: 8,
      justifyContent: "center",
      backgroundColor: c.danger,
    },
    discountText: {
      color: c.onPrimary,
      fontSize: 10,
      letterSpacing: 0.5,
      fontFamily: homeType.uiSemibold.fontFamily,
    },
    addCircle: {
      position: "absolute",
      right: 8,
      bottom: -16,
      width: 32,
      height: 32,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: brassAction,
      backgroundColor: c.surface,
      alignItems: "center",
      justifyContent: "center",
    },
    addCirclePressed: { opacity: 0.84, transform: [{ scale: 0.97 }] },
    qtyStepper: {
      position: "absolute",
      right: 8,
      bottom: -16,
      minWidth: 88,
      height: 32,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: brassAction,
      backgroundColor: c.surface,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 4,
    },
    stepperBtn: { width: 24, height: 24, borderRadius: 12, alignItems: "center", justifyContent: "center" },
    qtyText: { minWidth: 20, textAlign: "center", color: c.textPrimary, fontSize: 12, fontFamily: homeType.uiSemibold.fontFamily },
    meta: {
      flex: 1,
      paddingHorizontal: 10,
      paddingTop: 10,
      paddingBottom: 8,
    },
    brandOverline: {
      color: c.primary,
      fontSize: 10,
      letterSpacing: 1.0,
      fontFamily: homeType.overline.fontFamily,
      marginBottom: 4,
    },
    name: {
      color: c.textPrimary,
      fontSize: 13,
      lineHeight: 17,
      fontFamily: homeType.uiMedium.fontFamily,
      minHeight: 34,
      marginBottom: 2,
    },
    unit: {
      color: c.textSecondary,
      fontSize: 11,
      lineHeight: 13,
      fontFamily: homeType.uiRegular.fontFamily,
      marginBottom: 6,
    },
    priceRow: { flexDirection: "row", alignItems: "center", gap: 6, flexWrap: "wrap" },
    price: { color: c.textPrimary, fontSize: 13, fontFamily: homeType.uiSemibold.fontFamily },
    mrp: {
      color: c.danger,
      fontSize: 11,
      fontFamily: homeType.uiRegular.fontFamily,
      textDecorationLine: "line-through",
    },
    saveTag: {
      color: c.danger,
      fontSize: 10,
      fontFamily: homeType.uiSemibold.fontFamily,
    },
    countdownBar: {
      minHeight: 20,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: brassAction,
      backgroundColor: c.accentSoft || c.primarySoft,
      paddingHorizontal: 8,
      justifyContent: "center",
    },
    countdownText: {
      color: brassAction,
      fontSize: 10,
      fontFamily: homeType.uiSemibold.fontFamily,
    },
  });
}
