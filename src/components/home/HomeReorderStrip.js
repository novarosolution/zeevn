import React, { memo, useMemo } from "react";
import { FlatList, Platform, Pressable, StyleSheet, Text, useWindowDimensions, View } from "react-native";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import HomeSectionHeader from "./HomeSectionHeader";
import { useTheme } from "../../context/ThemeContext";
import { formatINRWhole } from "../../utils/currency";
import { homeType } from "../../styles/typography";
import { spacing as homeSpacing } from "../../styles/spacing";

const CARD_WIDTH = 132;
const CARD_HEIGHT = 210;

function ReorderCard({ item, quantity, onIncrease, onDecrease }) {
  const { colors: c, isDark } = useTheme();
  const styles = useMemo(() => createStyles(c, 0, 0, isDark), [c, isDark]);
  const hasDiscount = Number(item?.mrp || 0) > Number(item?.price || 0);

  return (
    <View style={styles.cardWrap}>
      <View style={styles.cardShell}>
        <View style={styles.mediaWrap}>
          {item.showRestockPill ? (
            <View style={styles.restockPill}>
              <Text style={styles.restockPillText}>Time to restock</Text>
            </View>
          ) : (
            null
          )}
          {item.image ? (
            <Image source={{ uri: item.image }} style={styles.media} contentFit="cover" transition={120} />
          ) : <View style={styles.mediaFallback} />}
          {quantity > 0 ? (
            <View style={styles.qtyStepper}>
              <Pressable onPress={() => onDecrease?.(item)} style={styles.stepperBtn} accessibilityRole="button" accessibilityLabel={`Remove one ${item.name}`}>
                <Ionicons name="remove" size={12} color={c.primary} />
              </Pressable>
              <Text style={styles.qtyText}>{quantity}</Text>
              <Pressable onPress={() => onIncrease?.(item)} style={styles.stepperBtn} accessibilityRole="button" accessibilityLabel={`Add one more ${item.name}`}>
                <Ionicons name="add" size={12} color={c.primary} />
              </Pressable>
            </View>
          ) : (
            <Pressable
              onPress={() => onIncrease?.(item)}
              style={({ pressed }) => [styles.addCircle, pressed ? styles.addCirclePressed : null]}
              accessibilityRole="button"
              accessibilityLabel={`Add ${item.name} to bag`}
            >
              <Ionicons name="add" size={12} color={c.primary} />
            </Pressable>
          )}
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
      </View>
    </View>
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
  const capped = useMemo(() => (Array.isArray(items) ? items.slice(0, 12) : []), [items]);
  const { width } = useWindowDimensions();
  const { colors: c } = useTheme();
  const sectionGap = width >= 640 ? 40 : 32;
  const styles = useMemo(() => createStyles(c, sectionGap, carouselBottomPadding, false), [c, sectionGap, carouselBottomPadding]);

  if (capped.length === 0) {
    return null;
  }

  return (
    <View style={styles.wrap}>
      <HomeSectionHeader
        overline={overline}
        title={title}
        subtitle={subtitle}
        onSeeAll={onSeeAll}
        seeAllLabel="View all"
        compact
      />
      <FlatList
        data={capped}
        keyExtractor={(item) => String(item.key || item.id)}
        horizontal
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
      borderRadius: 12,
      overflow: "hidden",
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: c.border,
      backgroundColor: c.surface,
    },
    mediaWrap: {
      height: CARD_WIDTH,
      width: "100%",
      backgroundColor: c.surfaceAlt,
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
      color: c.primary,
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
      bottom: -16,
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
    qtyStepper: {
      position: "absolute",
      right: 8,
      bottom: -16,
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
