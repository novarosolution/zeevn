import React from "react";
import { Pressable, Text, View } from "react-native";
import { useTheme } from "../../context/ThemeContext";
import { fonts } from "../../theme/tokens";

export default function Breadcrumb({ items = [], onNavigate, accessibilityLabel = "Breadcrumb" }) {
  const { semanticPalette, TYPE } = useTheme();
  return (
    <View accessibilityRole="text" accessibilityLabel={accessibilityLabel} style={{ flexDirection: "row", flexWrap: "wrap", gap: 6 }}>
      {items.map((item, index) => {
        const isLast = index === items.length - 1;
        const label = String(item?.label ?? "");
        return (
          <View key={`${label}-${index}`} style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
            <Pressable
              onPress={!isLast && onNavigate ? () => onNavigate(item, index) : undefined}
              accessibilityRole={isLast ? "text" : "button"}
              accessibilityLabel={label}
              style={({ pressed }) => ({ opacity: pressed ? 0.75 : 1 })}
            >
              <Text
                style={{
                  fontFamily: isLast ? fonts.semibold : fonts.medium,
                  fontSize: TYPE.caption.fontSize,
                  lineHeight: TYPE.caption.lineHeight,
                  color: isLast ? semanticPalette.ink : semanticPalette.inkSoft,
                }}
              >
                {label}
              </Text>
            </Pressable>
            {!isLast ? <Text style={{ color: semanticPalette.inkMuted }}>/</Text> : null}
          </View>
        );
      })}
    </View>
  );
}
