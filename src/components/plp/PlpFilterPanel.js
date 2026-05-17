import React, { memo, useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { PLP_UI } from "../../content/appContent";
import { useTheme } from "../../context/ThemeContext";
import { fonts } from "../../theme/tokens";
import Card from "../ui/Card";

function PlpCollapsibleFilterCard({ title, activeCount, defaultOpen = true, children }) {
  const [open, setOpen] = useState(defaultOpen);
  const { semanticPalette, SPACING, TYPE } = useTheme();

  const label = activeCount > 0 ? `${title} (${activeCount})` : title;

  const styles = useMemo(
    () =>
      StyleSheet.create({
        head: {
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          paddingHorizontal: SPACING.md,
          paddingVertical: SPACING.sm + 2,
          borderBottomWidth: StyleSheet.hairlineWidth,
          borderBottomColor: semanticPalette.line,
        },
        headTitle: {
          fontFamily: fonts.semibold,
          fontSize: TYPE.body.fontSize,
          lineHeight: TYPE.body.lineHeight,
          color: semanticPalette.ink,
          flex: 1,
          marginRight: SPACING.sm,
        },
        body: {
          paddingHorizontal: SPACING.md,
          paddingVertical: SPACING.md,
          gap: SPACING.sm,
          flexDirection: "row",
          flexWrap: "wrap",
        },
      }),
    [SPACING, TYPE.body.fontSize, TYPE.body.lineHeight, semanticPalette.ink, semanticPalette.line]
  );

  return (
    <Card padding="none" contentStyle={{ padding: 0 }}>
      <Pressable
        onPress={() => setOpen((v) => !v)}
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
        style={({ pressed }) => [styles.head, pressed ? { opacity: 0.92 } : null]}
      >
        <Text style={styles.headTitle}>{label}</Text>
        <Ionicons name={open ? "chevron-up-outline" : "chevron-down-outline"} size={18} color={semanticPalette.inkMuted} />
      </Pressable>
      {open ? <View style={styles.body}>{children}</View> : null}
    </Card>
  );
}

function FacetToggle({ label, selected, onToggle }) {
  const { semanticPalette, RADII, SPACING, TYPE } = useTheme();

  return (
    <Pressable
      onPress={onToggle}
      accessibilityRole="checkbox"
      accessibilityState={{ checked: selected }}
      style={({ pressed }) => ({
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: selected ? semanticPalette.accent : semanticPalette.line,
        backgroundColor: selected ? semanticPalette.accentSoft : semanticPalette.surfaceAlt,
        borderRadius: RADII.sm,
        paddingVertical: SPACING.sm,
        paddingHorizontal: SPACING.md,
        opacity: pressed ? 0.9 : 1,
      })}
    >
      <Text
        style={{
          fontFamily: fonts.medium,
          fontSize: TYPE.caption.fontSize,
          lineHeight: TYPE.caption.lineHeight,
          color: semanticPalette.ink,
        }}
      >
        {label}
      </Text>
    </Pressable>
  );
}

function PlpFilterPanelBase({
  facetCategories,
  facetTypes,
  selectedCategories,
  selectedTypes,
  onToggleCategory,
  onToggleType,
  inStockOnly,
  onToggleInStock,
}) {
  const { SPACING } = useTheme();

  const catActive = selectedCategories.size;
  const typeActive = selectedTypes.size;
  const availActive = inStockOnly ? 1 : 0;

  return (
    <View style={{ gap: SPACING.md }}>
      <PlpCollapsibleFilterCard title={PLP_UI.sectionCategory} activeCount={catActive}>
        {facetCategories.map((cat) => (
          <FacetToggle
            key={`cat-${cat}`}
            label={cat}
            selected={selectedCategories.has(cat)}
            onToggle={() => onToggleCategory(cat)}
          />
        ))}
      </PlpCollapsibleFilterCard>
      <PlpCollapsibleFilterCard title={PLP_UI.sectionType} activeCount={typeActive} defaultOpen={false}>
        {facetTypes.map((t) => (
          <FacetToggle
            key={`type-${t}`}
            label={t}
            selected={selectedTypes.has(t)}
            onToggle={() => onToggleType(t)}
          />
        ))}
      </PlpCollapsibleFilterCard>
      <PlpCollapsibleFilterCard title={PLP_UI.sectionAvailability} activeCount={availActive} defaultOpen={false}>
        <FacetToggle label={PLP_UI.inStockOnly} selected={inStockOnly} onToggle={onToggleInStock} />
      </PlpCollapsibleFilterCard>
    </View>
  );
}

const PlpFilterPanel = memo(PlpFilterPanelBase);

export default PlpFilterPanel;
