import React from "react";
import { Pressable, Text, View } from "react-native";
import { useTheme } from "../../context/ThemeContext";
import { fonts } from "../../theme/tokens";

export default function Tabs({ items = [], value, onChange, accessibilityLabel = "Tabs" }) {
  const { semanticPalette, RADII, TYPE } = useTheme();
  return (
    <View accessibilityRole="tablist" accessibilityLabel={accessibilityLabel} style={{ flexDirection: "row", gap: 8, flexWrap: "wrap" }}>
      {items.map((item) => {
        const selected = item.value === value;
        return (
          <Pressable
            key={String(item.value)}
            onPress={() => onChange?.(item.value)}
            accessibilityRole="tab"
            accessibilityLabel={item.label}
            accessibilityState={{ selected }}
            style={({ pressed }) => ({
              borderRadius: RADII.pill,
              paddingHorizontal: 12,
              paddingVertical: 8,
              borderWidth: 1,
              borderColor: selected ? semanticPalette.accentOnLight : semanticPalette.lineSoft,
              backgroundColor: selected ? semanticPalette.accentSoft : semanticPalette.surface,
              opacity: pressed ? 0.84 : 1,
            })}
          >
            <Text
              style={{
                fontFamily: selected ? fonts.semibold : fonts.medium,
                fontSize: TYPE.caption.fontSize,
                lineHeight: TYPE.caption.lineHeight,
                color: selected ? semanticPalette.accentOnLight : semanticPalette.inkSoft,
              }}
            >
              {item.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
