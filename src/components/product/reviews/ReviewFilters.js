import React, { memo, useMemo, useState } from "react";
import { Modal, Platform, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../../context/ThemeContext";
import { PRODUCT_SCREEN, fillProductScreen } from "../../../content/appContent";
import { fonts } from "../../../theme/tokens";
import { FILTER_ALL, FILTER_PHOTOS, FILTER_VERIFIED } from "./reviewUtils";

const COPY = PRODUCT_SCREEN.reviews;

function FilterPill({ label, selected, onPress, semanticPalette }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      style={({ pressed }) => [
        {
          position: "relative",
          paddingHorizontal: 14,
          paddingVertical: 8,
          borderRadius: 999,
          borderWidth: selected ? 1.5 : StyleSheet.hairlineWidth,
          borderColor: selected ? semanticPalette.accent : semanticPalette.line,
          backgroundColor: semanticPalette.surface,
          opacity: pressed ? 0.92 : 1,
        },
      ]}
    >
      {selected ? (
        <View
          style={{
            position: "absolute",
            top: 4,
            right: 4,
            width: 4,
            height: 4,
            borderRadius: 2,
            backgroundColor: semanticPalette.accent,
          }}
        />
      ) : null}
      <Text
        style={{
          fontFamily: fonts.semibold,
          fontSize: 11,
          letterSpacing: 0.6,
          textTransform: "uppercase",
          color: semanticPalette.ink,
        }}
      >
        {label}
      </Text>
    </Pressable>
  );
}

function ReviewFiltersBase({ filterKey, sortKey, onFilterChange, onSortChange }) {
  const { semanticPalette, SPACING } = useTheme();
  const [sortOpen, setSortOpen] = useState(false);

  const filters = useMemo(
    () => [
      { key: FILTER_ALL, label: COPY.filterAll },
      { key: "5", label: fillProductScreen(COPY.filterStars, { n: "5" }) },
      { key: "4", label: fillProductScreen(COPY.filterStars, { n: "4" }) },
      { key: "3", label: fillProductScreen(COPY.filterStars, { n: "3" }) },
      { key: "2", label: fillProductScreen(COPY.filterStars, { n: "2" }) },
      { key: "1", label: fillProductScreen(COPY.filterStars, { n: "1" }) },
      { key: FILTER_PHOTOS, label: COPY.filterPhotos },
      { key: FILTER_VERIFIED, label: COPY.filterVerified },
    ],
    []
  );

  const sortOptions = useMemo(
    () => [
      { key: "helpful", label: COPY.sortHelpful },
      { key: "recent", label: COPY.sortRecent },
      { key: "high", label: COPY.sortHigh },
      { key: "low", label: COPY.sortLow },
    ],
    []
  );

  const sortLabel = sortOptions.find((o) => o.key === sortKey)?.label || COPY.sortRecent;

  const styles = useMemo(
    () =>
      StyleSheet.create({
        wrap: {
          zIndex: 12,
          backgroundColor: semanticPalette.bg,
          paddingVertical: SPACING.sm,
          gap: SPACING.sm,
          ...Platform.select({
            web: { position: "sticky", top: 0 },
            default: {},
          }),
        },
        row: { flexDirection: "row", alignItems: "center", gap: SPACING.sm },
        pills: { flex: 1, minWidth: 0 },
        sortBtn: {
          flexDirection: "row",
          alignItems: "center",
          gap: 4,
          paddingHorizontal: 12,
          paddingVertical: 8,
          borderRadius: 999,
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: semanticPalette.line,
          backgroundColor: semanticPalette.surface,
          flexShrink: 0,
        },
        sortText: {
          fontFamily: fonts.medium,
          fontSize: 12,
          color: semanticPalette.ink,
          maxWidth: 120,
        },
        modalBackdrop: {
          flex: 1,
          backgroundColor: "rgba(14,23,41,0.45)",
          justifyContent: "flex-end",
        },
        sheet: {
          backgroundColor: semanticPalette.surface,
          borderTopLeftRadius: 16,
          borderTopRightRadius: 16,
          padding: SPACING.lg,
          gap: SPACING.sm,
        },
        sheetTitle: {
          fontFamily: fonts.semibold,
          fontSize: 14,
          color: semanticPalette.ink,
          marginBottom: SPACING.xs,
        },
        sheetItem: {
          paddingVertical: 12,
          borderBottomWidth: StyleSheet.hairlineWidth,
          borderBottomColor: semanticPalette.lineSoft,
        },
      }),
    [SPACING, semanticPalette]
  );

  return (
    <View style={styles.wrap}>
      <View style={styles.row}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.pills}
          contentContainerStyle={{ gap: 8, paddingRight: 8 }}
        >
          {filters.map((f) => (
            <FilterPill
              key={f.key}
              label={f.label}
              selected={filterKey === f.key}
              onPress={() => onFilterChange?.(f.key)}
              semanticPalette={semanticPalette}
            />
          ))}
        </ScrollView>
        <Pressable
          onPress={() => setSortOpen(true)}
          style={styles.sortBtn}
          accessibilityRole="button"
          accessibilityLabel={COPY.sortA11y}
        >
          <Text style={styles.sortText} numberOfLines={1}>
            {sortLabel}
          </Text>
          <Ionicons name="chevron-down" size={14} color={semanticPalette.inkMuted} />
        </Pressable>
      </View>

      <Modal visible={sortOpen} transparent animationType="fade" onRequestClose={() => setSortOpen(false)}>
        <Pressable style={styles.modalBackdrop} onPress={() => setSortOpen(false)}>
          <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation?.()}>
            <Text style={styles.sheetTitle}>{COPY.sortTitle}</Text>
            {sortOptions.map((opt) => (
              <Pressable
                key={opt.key}
                style={styles.sheetItem}
                onPress={() => {
                  onSortChange?.(opt.key);
                  setSortOpen(false);
                }}
              >
                <Text
                  style={{
                    fontFamily: sortKey === opt.key ? fonts.semibold : fonts.regular,
                    fontSize: 14,
                    color: sortKey === opt.key ? semanticPalette.accent : semanticPalette.ink,
                  }}
                >
                  {opt.label}
                </Text>
              </Pressable>
            ))}
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const ReviewFilters = memo(ReviewFiltersBase);

export default ReviewFilters;
