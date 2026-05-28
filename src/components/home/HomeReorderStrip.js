import React, { memo, useEffect, useMemo, useRef, useState } from "react";
import { FlatList, Platform, Pressable, StyleSheet, Text, useWindowDimensions, View } from "react-native";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { ArrowRight } from "lucide-react-native";
import Animated, { LinearTransition } from "react-native-reanimated";
import { MotiView } from "moti";
import { HOME_REORDER_STRIP } from "../../content/appContent";
import { useTheme } from "../../context/ThemeContext";
import { formatINRWhole } from "../../utils/currency";
import { homeType } from "../../styles/typography";
import { spacing as homeSpacing } from "../../styles/spacing";
import { pointerEventsProp } from "../../utils/pointerEventsStyle";
import { isLowEndWebDevice } from "../../utils/webPerf";

const CARD_WIDTH = 132;
const CARD_HEIGHT = 220;

function ReorderCard({ item, quantity, onIncrease, onDecrease }) {
  const { colors: c, isDark, SHADOWS } = useTheme();
  const styles = useMemo(() => createStyles(c, 0, 0, isDark), [c, isDark]);
  const hasDiscount = Number(item?.mrp || 0) > Number(item?.price || 0);
  const brassAction = isDark ? c.accent : c.accentOnLight || c.accent;
  const lowEndWeb = isLowEndWebDevice();
  const [pressed, setPressed] = useState(false);
  const [flash, setFlash] = useState(false);
  const flashTimerRef = useRef(null);

  const triggerAddFlash = () => {
    if (flashTimerRef.current) clearTimeout(flashTimerRef.current);
    setFlash(true);
    flashTimerRef.current = setTimeout(() => setFlash(false), 140);
  };

  useEffect(
    () => () => {
      if (flashTimerRef.current) clearTimeout(flashTimerRef.current);
    },
    []
  );

  return (
    <MotiView
      style={styles.cardWrap}
      from={{ opacity: 0, translateY: 12 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{
        type: "timing",
        duration: lowEndWeb ? 1 : 260,
        delay: lowEndWeb ? 0 : Math.min(Number(item?.animationDelay || 0), 540),
      }}
    >
      <Pressable
        onPressIn={() => setPressed(true)}
        onPressOut={() => setPressed(false)}
        style={[styles.cardShell, pressed ? SHADOWS.lifted : SHADOWS.soft]}
      >
        <View style={styles.mediaWrap}>
          {item.showRestockPill ? (
            <View style={styles.restockPill}>
              <Text style={styles.restockPillText}>{HOME_REORDER_STRIP.restockLabel || "Time to restock"}</Text>
            </View>
          ) : (
            null
          )}
          {item.image ? (
            <Image source={{ uri: item.image }} style={styles.media} contentFit="cover" transition={120} />
          ) : <View style={styles.mediaFallback} />}
          <Animated.View layout={lowEndWeb ? undefined : LinearTransition.duration(220)}>
            {quantity > 0 ? (
              <View style={styles.qtyStepper}>
                <Pressable onPress={() => onDecrease?.(item)} style={styles.stepperBtn} accessibilityRole="button" accessibilityLabel={`Remove one ${item.name}`}>
                  <Ionicons name="remove" size={12} color={brassAction} />
                </Pressable>
                <Text style={styles.qtyText}>{quantity}</Text>
                <Pressable onPress={() => onIncrease?.(item)} style={styles.stepperBtn} accessibilityRole="button" accessibilityLabel={`Add one more ${item.name}`}>
                  <Ionicons name="add" size={12} color={brassAction} />
                </Pressable>
              </View>
            ) : (
              <Pressable
                onPress={() => {
                  triggerAddFlash();
                  onIncrease?.(item);
                }}
                style={({ pressed }) => [styles.addCircle, pressed ? styles.addCirclePressed : null]}
                accessibilityRole="button"
                accessibilityLabel={`Add ${item.name} to bag`}
              >
                <Ionicons name="add" size={12} color={brassAction} />
              </Pressable>
            )}
          </Animated.View>
          {flash ? <View style={styles.addFlashOverlay} {...pointerEventsProp("none")} /> : null}
        </View>
        <View style={styles.meta}>
          <Text style={styles.name} numberOfLines={2}>
            {item.name}
          </Text>
          <Text style={styles.unit} numberOfLines={1}>
            {item.unitLabel}
          </Text>
          <View style={styles.priceRow}>
            <Text style={styles.price}>{formatINRWhole(Number(item.price || 0))}</Text>
            {hasDiscount ? <Text style={styles.mrp}>{formatINRWhole(Number(item.mrp || 0))}</Text> : null}
          </View>
        </View>
      </Pressable>
    </MotiView>
  );
}

function HomeReorderStripBase({
  items = [],
  overline,
  title,
  subtitle,
  onIncrease,
  onDecrease,
  getQuantity,
  onSeeAll,
  carouselBottomPadding = 24,
}) {
  const capped = useMemo(
    () => (Array.isArray(items) ? items.slice(0, 12).map((entry, idx) => ({ ...entry, animationDelay: idx * 60 })) : []),
    [items]
  );
  const { width } = useWindowDimensions();
  const { colors: c } = useTheme();
  const sectionGap = width >= 640 ? 40 : 32;
  const styles = useMemo(() => createStyles(c, sectionGap, carouselBottomPadding, false), [c, sectionGap, carouselBottomPadding]);

  if (capped.length === 0) {
    return null;
  }

  return (
    <View style={styles.wrap}>
      <View style={styles.headerRow}>
        <View style={styles.headerCopy}>
          <View style={styles.overlineRow}>
            <View style={[styles.overlineSquare, { backgroundColor: c.primary }]} />
            <Text style={styles.overlineText}>{String(overline || "Order again").toUpperCase()}</Text>
          </View>
          <Text style={styles.titleText}>{title || "Your usual basket"}</Text>
          <Text style={styles.subtitleText}>{subtitle}</Text>
        </View>
        <Pressable style={styles.seeAllBtn} onPress={onSeeAll} accessibilityRole="button" accessibilityLabel="See all reorder items">
          <Text style={styles.seeAllText}>{HOME_REORDER_STRIP.seeAll || "See all"}</Text>
          <ArrowRight size={14} color={c.accentOnLight || c.primary} />
        </Pressable>
      </View>
      <FlatList
        data={capped}
        keyExtractor={(item) => String(item.key || item.id)}
        horizontal
        {...(Platform.OS === "web" ? { dataSet: { zvScroll: "horizontal" } } : {})}
        showsHorizontalScrollIndicator={false}
        decelerationRate={Platform.OS === "ios" ? "fast" : 0.98}
        snapToInterval={CARD_WIDTH + homeSpacing.sm}
        snapToAlignment="start"
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <ReorderCard
            item={item}
            quantity={Math.max(0, Number(getQuantity?.(item) || 0))}
            onIncrease={onIncrease}
            onDecrease={onDecrease}
          />
        )}
      />
    </View>
  );
}

function createStyles(c, sectionGap, carouselBottomPadding, isDark = false) {
  return StyleSheet.create({
    wrap: {
      marginBottom: sectionGap,
    },
    headerRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: homeSpacing.sm,
      gap: homeSpacing.sm,
    },
    headerCopy: { flex: 1, minWidth: 0 },
    overlineRow: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 4 },
    overlineSquare: { width: 4, height: 4, borderRadius: 1 },
    overlineText: {
      fontSize: 11,
      letterSpacing: 1.2,
      textTransform: "uppercase",
      color: c.accentOnLight || c.primary,
      fontFamily: homeType.uiSemibold.fontFamily,
    },
    subtitleText: {
      fontSize: 13,
      lineHeight: 16,
      color: c.textSecondary,
      fontFamily: homeType.uiRegular.fontFamily,
    },
    titleText: {
      fontSize: 20,
      lineHeight: 24,
      color: c.textPrimary,
      fontFamily: homeType.display.fontFamily,
      marginBottom: 2,
    },
    seeAllBtn: { flexDirection: "row", alignItems: "center", gap: 4 },
    seeAllText: {
      fontSize: 12,
      color: c.accentOnLight || c.primary,
      fontFamily: homeType.uiSemibold.fontFamily,
    },
    listContent: {
      paddingVertical: homeSpacing.sm,
      paddingRight: homeSpacing.sm,
      paddingBottom: carouselBottomPadding,
      gap: homeSpacing.sm,
    },
    cardWrap: {
      width: CARD_WIDTH,
      height: CARD_HEIGHT,
    },
    cardShell: {
      width: "100%",
      height: "100%",
      borderRadius: 14,
      overflow: "hidden",
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: c.lineSoft || c.border,
      backgroundColor: c.surface,
      position: "relative",
    },
    mediaWrap: {
      height: CARD_WIDTH,
      width: "100%",
      backgroundColor: c.accentSoft || c.primarySoft || c.surfaceAlt,
      position: "relative",
    },
    media: {
      width: "100%",
      height: "100%",
    },
    mediaFallback: {
      width: "100%",
      height: "100%",
      alignItems: "center",
      justifyContent: "center",
    },
    restockPill: {
      position: "absolute",
      left: 8,
      top: 8,
      zIndex: 3,
      borderRadius: 999,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: c.primary,
      backgroundColor: c.surface,
      paddingHorizontal: 8,
      minHeight: 20,
      justifyContent: "center",
    },
    restockPillText: {
      fontSize: 10,
      fontFamily: homeType.uiSemibold.fontFamily,
      color: c.accentOnLight || c.primary,
    },
    meta: {
      flex: 1,
      paddingHorizontal: 10,
      paddingTop: 10,
      paddingBottom: 10,
      gap: 6,
    },
    name: {
      fontSize: 12,
      lineHeight: 15,
      fontFamily: homeType.uiMedium.fontFamily,
      color: c.textPrimary,
      minHeight: 30,
    },
    unit: {
      fontSize: 11,
      lineHeight: 13,
      fontFamily: homeType.uiRegular.fontFamily,
      color: c.textSecondary,
    },
    priceRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
    },
    price: {
      fontSize: 13,
      fontFamily: homeType.uiSemibold.fontFamily,
      color: c.textPrimary,
    },
    mrp: {
      fontSize: 11,
      fontFamily: homeType.uiRegular.fontFamily,
      color: c.textMuted,
      textDecorationLine: "line-through",
    },
    addCircle: {
      position: "absolute",
      right: 8,
      bottom: 8,
      width: 32,
      height: 32,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: c.primary,
      backgroundColor: c.surface,
      alignItems: "center",
      justifyContent: "center",
      ...Platform.select({
        web: { cursor: "pointer" },
        default: {},
      }),
    },
    addCirclePressed: {
      opacity: 0.86,
      transform: [{ scale: 0.98 }],
    },
    addFlashOverlay: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: "rgba(200,169,126,0.18)",
      borderRadius: 12,
      zIndex: 2,
    },
    qtyStepper: {
      position: "absolute",
      right: 8,
      bottom: 8,
      minWidth: 88,
      height: 32,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: c.primary,
      backgroundColor: c.surface,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 4,
    },
    stepperBtn: {
      width: 24,
      height: 24,
      borderRadius: 12,
      alignItems: "center",
      justifyContent: "center",
    },
    qtyText: {
      minWidth: 20,
      textAlign: "center",
      fontSize: 12,
      fontFamily: homeType.uiSemibold.fontFamily,
      color: c.textPrimary,
    },
  });
}

const HomeReorderStrip = memo(HomeReorderStripBase);
export default HomeReorderStrip;
