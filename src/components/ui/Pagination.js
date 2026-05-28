import React from "react";
import { Pressable, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../context/ThemeContext";
import { fonts } from "../../theme/tokens";

export default function Pagination({
  page = 1,
  totalPages = 1,
  onChangePage,
  accessibilityLabel = "Pagination",
}) {
  const { semanticPalette, RADII, TYPE } = useTheme();
  const canPrev = page > 1;
  const canNext = page < totalPages;
  const btnStyle = (disabled) => ({
    width: 36,
    height: 36,
    borderRadius: RADII.pill,
    borderWidth: 1,
    borderColor: semanticPalette.lineSoft,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: semanticPalette.surface,
    opacity: disabled ? 0.45 : 1,
  });

  return (
    <View accessibilityRole="adjustable" accessibilityLabel={accessibilityLabel} style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Previous page"
        accessibilityState={{ disabled: !canPrev }}
        disabled={!canPrev}
        onPress={() => onChangePage?.(page - 1)}
        style={btnStyle(!canPrev)}
      >
        <Ionicons name="chevron-back" size={16} color={semanticPalette.ink} />
      </Pressable>
      <Text style={{ fontFamily: fonts.medium, fontSize: TYPE.small.fontSize, color: semanticPalette.inkSoft }}>
        {page} / {totalPages}
      </Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Next page"
        accessibilityState={{ disabled: !canNext }}
        disabled={!canNext}
        onPress={() => onChangePage?.(page + 1)}
        style={btnStyle(!canNext)}
      >
        <Ionicons name="chevron-forward" size={16} color={semanticPalette.ink} />
      </Pressable>
    </View>
  );
}
