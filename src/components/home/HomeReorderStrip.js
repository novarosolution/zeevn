import React, { memo, useMemo } from "react";
import { FlatList, Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import HomeSectionHeader from "./HomeSectionHeader";
import PremiumCard from "../ui/PremiumCard";
import { useTheme } from "../../context/ThemeContext";
import { fonts, icon, radius, spacing, typography } from "../../theme/tokens";
import { formatINR } from "../../utils/currency";

function ReorderCard({ item, onAdd }) {
  const { colors: c, isDark } = useTheme();
  const styles = useMemo(() => createStyles(c, isDark), [c, isDark]);

  return (
    <View style={styles.cardWrap}>
      <PremiumCard variant="muted" padding="none" style={styles.cardShell} contentStyle={styles.cardContent}>
        <View style={styles.mediaWrap}>
          {item.image ? (
            <Image source={{ uri: item.image }} style={styles.media} contentFit="cover" transition={120} />
          ) : (
            <View style={styles.mediaFallback}>
              <Ionicons name="bag-handle-outline" size={icon.md} color={c.textMuted} />
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

function HomeReorderStripBase({ items = [], overline, title, onAdd, onSeeAll }) {
  const capped = useMemo(() => (Array.isArray(items) ? items.slice(0, 8) : []), [items]);
  const { colors: c } = useTheme();
  const styles = useMemo(() => createStyles(c), [c]);

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

function createStyles(c, isDark = false) {
  return StyleSheet.create({
    wrap: {
      marginBottom: spacing.md + 2,
    },
    listContent: {
      paddingVertical: spacing.xs,
      paddingRight: spacing.sm,
      gap: spacing.sm,
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
      paddingHorizontal: spacing.sm,
      paddingTop: spacing.sm - 1,
      paddingBottom: spacing.lg + 8,
      gap: 4,
    },
    name: {
      fontSize: typography.caption + 1,
      lineHeight: 18,
      fontFamily: fonts.medium,
      color: c.textPrimary,
      minHeight: 36,
    },
    price: {
      fontSize: typography.bodySmall,
      fontFamily: fonts.semibold,
      color: c.textPrimary,
    },
    addPill: {
      position: "absolute",
      right: spacing.sm - 1,
      bottom: spacing.sm - 1,
      minHeight: 28,
      borderRadius: radius.pill,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: "rgba(220,38,38,0.32)",
      backgroundColor: c.primarySoft,
      paddingHorizontal: spacing.sm,
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
      fontFamily: fonts.extrabold,
      color: c.primaryDark,
      letterSpacing: 0.3,
    },
  });
}

const HomeReorderStrip = memo(HomeReorderStripBase);
export default HomeReorderStrip;
