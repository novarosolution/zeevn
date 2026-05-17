import React, { useMemo } from "react";
import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Input from "../../ui/Input";
import { MY_ORDERS_SCREEN } from "../../../content/appContent";
import { useTheme } from "../../../context/ThemeContext";
import { fonts } from "../../../theme/tokens";

const FILTERS = ["all", "active", "delivered", "cancelled", "returned"];
const SORT_KEYS = ["newest", "oldest", "value_high", "value_low"];

const copy = MY_ORDERS_SCREEN;

function FilterPill({ label, active, onPress }) {
  const { semanticPalette } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      style={({ pressed }) => [
        {
          flexDirection: "row",
          alignItems: "center",
          gap: 6,
          paddingHorizontal: 12,
          paddingVertical: 6,
          borderRadius: 999,
          borderWidth: 1,
          borderColor: active ? semanticPalette.accent : semanticPalette.line,
          backgroundColor: active ? semanticPalette.accentSoft : semanticPalette.surface,
          opacity: pressed ? 0.88 : 1,
        },
      ]}
    >
      {active ? (
        <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: semanticPalette.accent }} />
      ) : null}
      <Text
        style={{
          fontFamily: fonts.semibold,
          fontSize: 11,
          letterSpacing: 0.6,
          textTransform: "uppercase",
          color: active ? semanticPalette.accent : semanticPalette.inkSoft,
        }}
      >
        {label}
      </Text>
    </Pressable>
  );
}

export default function OrdersFilterBar({ search, onSearchChange, filter, onFilterChange, sort, onSortChange }) {
  const { semanticPalette, SPACING } = useTheme();
  const [sortOpen, setSortOpen] = React.useState(false);

  const sortLabel = useMemo(() => {
    const map = {
      newest: copy.sort.newest,
      oldest: copy.sort.oldest,
      value_high: copy.sort.valueHigh,
      value_low: copy.sort.valueLow,
    };
    return map[sort] || copy.sort.newest;
  }, [sort]);

  return (
    <View
      style={[
        styles.sticky,
        {
          marginHorizontal: -SPACING.lg,
          paddingHorizontal: SPACING.lg,
          paddingBottom: SPACING.md,
          backgroundColor: semanticPalette.bg,
          borderBottomWidth: StyleSheet.hairlineWidth,
          borderBottomColor: semanticPalette.lineSoft,
          gap: SPACING.sm,
        },
        Platform.select({
          web: { position: "sticky", top: 0, zIndex: 8 },
          default: {},
        }),
      ]}
    >
      <Input
        value={search}
        onChangeText={onSearchChange}
        placeholder={copy.searchPlaceholder}
        iconLeft="search-outline"
        accessibilityLabel={copy.searchPlaceholder}
      />

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingVertical: 4 }}>
        {FILTERS.map((key) => (
          <FilterPill
            key={key}
            label={copy.filters[key]}
            active={filter === key}
            onPress={() => onFilterChange(key)}
          />
        ))}
      </ScrollView>

      <Pressable
        onPress={() => setSortOpen((v) => !v)}
        style={({ pressed }) => ({
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          paddingVertical: 10,
          paddingHorizontal: 12,
          borderRadius: 8,
          borderWidth: 1,
          borderColor: semanticPalette.line,
          backgroundColor: semanticPalette.surface,
          opacity: pressed ? 0.9 : 1,
        })}
      >
        <Text style={{ fontFamily: fonts.medium, fontSize: 14, color: semanticPalette.inkMuted }}>{copy.sort.label}</Text>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
          <Text style={{ fontFamily: fonts.semibold, fontSize: 14, color: semanticPalette.ink }}>{sortLabel}</Text>
          <Ionicons name={sortOpen ? "chevron-up" : "chevron-down"} size={16} color={semanticPalette.inkMuted} />
        </View>
      </Pressable>

      {sortOpen ? (
        <View
          style={{
            borderRadius: 8,
            borderWidth: 1,
            borderColor: semanticPalette.line,
            backgroundColor: semanticPalette.surface,
            overflow: "hidden",
          }}
        >
          {SORT_KEYS.map((key) => (
            <Pressable
              key={key}
              onPress={() => {
                onSortChange(key);
                setSortOpen(false);
              }}
              style={({ pressed }) => ({
                paddingVertical: 12,
                paddingHorizontal: 14,
                backgroundColor: sort === key ? semanticPalette.surfaceAlt : pressed ? semanticPalette.surfaceAlt : "transparent",
              })}
            >
              <Text style={{ fontFamily: fonts.medium, fontSize: 14, color: semanticPalette.ink }}>
                {key === "newest"
                  ? copy.sort.newest
                  : key === "oldest"
                    ? copy.sort.oldest
                    : key === "value_high"
                      ? copy.sort.valueHigh
                      : copy.sort.valueLow}
              </Text>
            </Pressable>
          ))}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  sticky: {},
});
