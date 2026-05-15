import React, { memo, useMemo } from "react";
import { FlatList, Platform, Pressable, StyleSheet, Text, useWindowDimensions, View } from "react-native";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import HomeSectionHeader from "./HomeSectionHeader";
import PremiumCard from "../ui/PremiumCard";
import { useTheme } from "../../context/ThemeContext";
import { icon, radius, typography } from "../../theme/tokens";
import { formatINR } from "../../utils/currency";
import { homeType } from "../../styles/typography";
import { spacing as homeSpacing } from "../../styles/spacing";

function ReorderCard({ item, onAdd }) {
  const { colors: c, isDark } = useTheme();
  const styles = useMemo(() => createStyles(c, 0, 0, isDark), [c, isDark]);

  return (
    <View style={styles.cardWrap}>
      <PremiumCard variant="muted" padding="none" style={styles.cardShell} contentStyle={styles.cardContent}>
        <View style={styles.mediaWrap}>
          {item.image ? (
            <Image source={{ uri: item.image }} style={styles.media} contentFit="cover" transition={120} />
          ) : (
            <View style={styles.mediaFallback}>
              <Ionicons name="bag-outline" size={icon.md} color={c.textMuted} />
            </View>
          )}
        </View>
        <View style={styles.meta}>
          <Text style={styles.name} numberOfLines={2}>
            {item.name}
          </Text>
          <Text style={styles.price}>{formatINR(Number(item.price || 0))}</Text>
        </View>
        <Pressable
          onPress={() => onAdd?.(item)}
          style={({ pressed }) => [styles.addPill, pressed ? styles.addPillPressed : null]}
          accessibilityRole="button"
          accessibilityLabel={`Add ${item.name} to bag`}
        >
          <Text style={styles.addPillText}>Add</Text>
        </Pressable>
      </PremiumCard>
    </View>
  );
}

function HomeReorderStripBase({ items = [], overline, title, onAdd, onSeeAll, carouselBottomPadding = 24 }) {
  const capped = useMemo(() => (Array.isArray(items) ? items.slice(0, 8) : []), [items]);
  const { width } = useWindowDimensions();
  const { colors: c } = useTheme();
  const sectionGap = width >= 640 ? 72 : 56;
  const styles = useMemo(() => createStyles(c, sectionGap, carouselBottomPadding, false), [c, sectionGap, carouselBottomPadding]);

  if (capped.length === 0) {
    return null;
  }

  return (
    <View style={styles.wrap}>
      <HomeSectionHeader overline={overline} title={title} onSeeAll={onSeeAll} seeAllLabel="View all" compact />
      <FlatList
        data={capped}
        keyExtractor={(item) => String(item.key || item.id)}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => <ReorderCard item={item} onAdd={onAdd} />}
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
      paddingVertical: homeSpacing.md,
      paddingRight: homeSpacing.md,
      paddingBottom: carouselBottomPadding,
      gap: homeSpacing.md,
    },
    cardWrap: {
      width: 140,
      height: 180,
    },
    cardShell: {
      width: "100%",
      height: "100%",
      borderRadius: radius.lg,
      overflow: "hidden",
    },
    cardContent: {
      width: "100%",
      height: "100%",
      padding: 0,
      position: "relative",
    },
    mediaWrap: {
      height: 92,
      width: "100%",
      backgroundColor: isDark ? "rgba(255,255,255,0.05)" : "rgba(241,245,249,0.8)",
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
    meta: {
      flex: 1,
      paddingHorizontal: homeSpacing.base,
      paddingTop: homeSpacing.md,
      paddingBottom: homeSpacing["2xl"],
      gap: homeSpacing.sm,
    },
    name: {
      fontSize: 14,
      lineHeight: 21,
      fontFamily: homeType.uiMedium.fontFamily,
      color: c.textPrimary,
      minHeight: 36,
    },
    price: {
      fontSize: 16,
      fontFamily: homeType.uiSemibold.fontFamily,
      color: c.textPrimary,
    },
    addPill: {
      position: "absolute",
      right: homeSpacing.md,
      bottom: homeSpacing.md,
      minHeight: 28,
      borderRadius: radius.pill,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: "rgba(100,116,139,0.24)",
      backgroundColor: isDark ? "rgba(148,163,184,0.14)" : "rgba(241,245,249,0.9)",
      paddingHorizontal: homeSpacing.md,
      alignItems: "center",
      justifyContent: "center",
      ...Platform.select({
        web: { cursor: "pointer" },
        default: {},
      }),
    },
    addPillPressed: {
      opacity: 0.86,
      transform: [{ scale: 0.98 }],
    },
    addPillText: {
      fontSize: typography.caption,
      fontFamily: homeType.uiSemibold.fontFamily,
      color: c.textPrimary,
      letterSpacing: 0.3,
      textTransform: "uppercase",
    },
  });
}

const HomeReorderStrip = memo(HomeReorderStripBase);
export default HomeReorderStrip;
