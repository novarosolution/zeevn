import React, { useEffect, useMemo, useRef, useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import { Zap } from "lucide-react-native";
import DecorativeExpoImage from "../ui/DecorativeExpoImage";
import { LinearGradient } from "expo-linear-gradient";
import { Platform, Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from "react-native";
import { pointerEventsProp } from "../../utils/pointerEventsStyle";
import { HOME_DEALS_RAIL } from "../../content/appContent";
import { useTheme } from "../../context/ThemeContext";
import { formatINRWhole } from "../../utils/currency";
import { spacing as homeSpacing } from "../../styles/spacing";
import { homeType } from "../../styles/typography";

const CARD_W = 148;
const CARD_H = 248;
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
  return `${HOME_DEALS_RAIL.countdownPrefix || "Ends in"} ${hours}h ${minutes}m`;
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
  const [flashDealId, setFlashDealId] = useState("");
  const flashTimerRef = useRef(null);
  const styles = useMemo(() => createStyles(c, isDark, width >= 600), [c, isDark, width]);

  useEffect(() => {
    const timer = setInterval(() => setNowMs(Date.now()), 60 * 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(
    () => () => {
      if (flashTimerRef.current) clearTimeout(flashTimerRef.current);
    },
    []
  );

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
      <LinearGradient
        colors={["rgba(200,169,126,0.04)", "rgba(0,0,0,0)"]}
        start={{ x: 0, y: 0.5 }}
        end={{ x: 1, y: 0.5 }}
        style={styles.gradientCard}
      >
        <View style={styles.headerRow}>
          <View style={styles.headerCopy}>
            <View style={styles.overlineRow}>
              <View style={styles.overlineSquare} />
              <Text style={styles.overlineText}>DEALS</Text>
            </View>
            <View style={styles.titleRow}>
              <Text style={styles.title}>{HOME_DEALS_RAIL.title || "Deals"}</Text>
              {hasEndingSoon ? (
                <View style={styles.endingSoonPill}>
                  <Text style={styles.endingSoonText}>{String(HOME_DEALS_RAIL.endingSoon || "Ending soon").toUpperCase()}</Text>
                </View>
              ) : null}
            </View>
            <Text style={styles.subtitle}>{HOME_DEALS_RAIL.subtitle || "Limited-time pantry picks."}</Text>
          </View>
          <Pressable
            onPress={onSeeAllDeals}
            style={({ pressed }) => [styles.seeAllBtn, pressed ? styles.seeAllPressed : null]}
            accessibilityRole="button"
            accessibilityLabel={HOME_DEALS_RAIL.seeAll || "See all deals"}
          >
            <Text style={styles.seeAllText}>{`${HOME_DEALS_RAIL.seeAll || "See all deals"} →`}</Text>
          </Pressable>
        </View>

        <ScrollView
          horizontal
          {...(Platform.OS === "web" ? { dataSet: { zvScroll: "horizontal" } } : {})}
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
            const countdownRatio = showCountdown ? Math.max(0, Math.min(1, (item.endsAtMs - nowMs) / DAY_MS)) : 0;
            return (
              <View key={item.id} style={styles.cardWrap}>
                <View style={styles.card}>
                  <Pressable
                    onPress={() => onOpenProduct?.(item)}
                    style={({ pressed }) => [styles.cardTap, pressed ? styles.cardPressed : null]}
                    accessibilityRole="button"
                    accessibilityLabel={`Open deal for ${item?.name || "product"}`}
                  >
                <View style={styles.imageWrap}>
                  <View style={styles.discountBadge}>
                    <Zap size={10} color={c.onPrimary} />
                    <Text style={styles.discountText}>{item.discountPct}% OFF</Text>
                  </View>
                  {item.image ? (
                    <DecorativeExpoImage source={{ uri: item.image }} style={styles.image} contentFit="cover" transition={120} />
                  ) : (
                    <View style={styles.imageFallback} />
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
                    {hasSavings ? (
                      <View style={styles.saveTagPill}>
                        <Text style={styles.saveTag}>{`${HOME_DEALS_RAIL.savePrefix || "Save"} ${formatINRWhole(saveAmount)}`}</Text>
                      </View>
                    ) : null}
                  </View>
                </View>
                {showCountdown ? (
                  <View style={styles.countdownBar}>
                    <Text style={styles.countdownText}>{formatEndsIn(item.endsAtMs - nowMs)}</Text>
                    <View style={styles.countdownTrack}>
                      <View style={[styles.countdownFill, { width: `${Math.round(countdownRatio * 100)}%` }]} />
                    </View>
                  </View>
                ) : null}
                  </Pressable>
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
                      onPress={() => {
                        if (flashTimerRef.current) clearTimeout(flashTimerRef.current);
                        setFlashDealId(item.id);
                        flashTimerRef.current = setTimeout(() => setFlashDealId(""), 140);
                        onIncrease?.(item);
                      }}
                      style={({ pressed }) => [styles.addCircle, pressed ? styles.addCirclePressed : null]}
                      accessibilityRole="button"
                      accessibilityLabel={`Add ${item.name} to bag`}
                    >
                      <Ionicons name="add" size={12} color={brassAction} />
                    </Pressable>
                  )}
                  {flashDealId === item.id ? (
                    <View style={styles.addFlashOverlay} {...pointerEventsProp("none")} />
                  ) : null}
                </View>
              </View>
            );
          })}
        </ScrollView>
      </LinearGradient>
    </View>
  );
}

function createStyles(c, isDark, isTablet) {
  const brassAction = isDark ? c.accent : c.accentOnLight || c.accent;
  return StyleSheet.create({
    wrap: { marginBottom: isTablet ? 40 : 32 },
    gradientCard: {
      borderRadius: 16,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: c.border,
      paddingHorizontal: homeSpacing.base,
      paddingVertical: homeSpacing.base,
    },
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
    overlineRow: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 4 },
    overlineSquare: { width: 4, height: 4, borderRadius: 1, backgroundColor: brassAction },
    overlineText: {
      color: brassAction,
      fontSize: 10,
      fontFamily: homeType.uiSemibold.fontFamily,
      letterSpacing: 1.2,
      textTransform: "uppercase",
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
      paddingRight: homeSpacing.xs,
      gap: homeSpacing.sm,
    },
    cardWrap: {
      width: CARD_W,
      height: CARD_H,
    },
    card: {
      position: "relative",
      width: "100%",
      height: "100%",
      borderRadius: 14,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: c.border,
      backgroundColor: c.surface,
      overflow: "hidden",
    },
    cardTap: {
      width: "100%",
      height: "100%",
      borderRadius: 14,
      overflow: "hidden",
    },
    cardPressed: { opacity: 0.9 },
    imageWrap: {
      width: CARD_W,
      height: CARD_W,
      backgroundColor: c.surfaceAlt || c.surfaceMuted || c.surface,
      position: "relative",
    },
    image: { width: "100%", height: "100%" },
    imageFallback: { width: "100%", height: "100%", backgroundColor: c.surfaceAlt || c.surfaceMuted || c.surface },
    discountBadge: {
      position: "absolute",
      left: 8,
      top: 8,
      zIndex: 3,
      borderRadius: 999,
      minHeight: 20,
      paddingHorizontal: 8,
      justifyContent: "center",
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
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
      bottom: 8,
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
    addFlashOverlay: {
      ...StyleSheet.absoluteFillObject,
      borderRadius: 14,
      backgroundColor: "rgba(200,169,126,0.18)",
      zIndex: 4,
    },
    qtyStepper: {
      position: "absolute",
      right: 8,
      bottom: 8,
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
      color: brassAction,
      fontSize: 10,
      fontFamily: homeType.uiSemibold.fontFamily,
    },
    saveTagPill: {
      borderWidth: 1,
      borderColor: "rgba(200,169,126,0.24)",
      borderRadius: 999,
      paddingHorizontal: 6,
      paddingVertical: 2,
    },
    countdownBar: {
      minHeight: 26,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: brassAction,
      backgroundColor: c.accentSoft || c.primarySoft,
      paddingHorizontal: 8,
      justifyContent: "center",
      gap: 3,
    },
    countdownText: {
      color: brassAction,
      fontSize: 10,
      fontFamily: homeType.uiSemibold.fontFamily,
    },
    countdownTrack: {
      height: 2,
      borderRadius: 999,
      backgroundColor: "rgba(14,23,41,0.16)",
      overflow: "hidden",
    },
    countdownFill: {
      height: "100%",
      borderRadius: 999,
      backgroundColor: brassAction,
    },
  });
}
