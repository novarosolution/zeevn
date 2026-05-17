import React from "react";
import { Pressable, ScrollView, StyleSheet } from "react-native";
import Badge from "../ui/Badge";
import { useTheme } from "../../context/ThemeContext";

const TABS = [
  { key: "all", label: "All" },
  { key: "orders", label: "Orders" },
  { key: "offers", label: "Offers" },
  { key: "account", label: "Account" },
];

export default function NotificationFilterPills({ active, onChange }) {
  const { SPACING } = useTheme();

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={[styles.row, { gap: SPACING.sm, paddingBottom: SPACING.md }]}
    >
      {TABS.map((tab) => {
        const selected = active === tab.key;
        return (
          <Pressable key={tab.key} onPress={() => onChange(tab.key)} accessibilityRole="button" accessibilityState={{ selected }}>
            <Badge variant={selected ? "brass" : "neutral"} size="md">
              {tab.label}
            </Badge>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
  },
});
