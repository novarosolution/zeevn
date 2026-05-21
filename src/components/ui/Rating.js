import React from "react";
import { Pressable, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../context/ThemeContext";

function starName(index, value) {
  const diff = value - index;
  if (diff >= 1) return "star";
  if (diff >= 0.5) return "star-half";
  return "star-outline";
}

export default function Rating({
  value = 0,
  max = 5,
  onChange,
  size = 16,
  accessibilityLabel = "Rating",
}) {
  const { semanticPalette } = useTheme();
  return (
    <View accessibilityRole="adjustable" accessibilityLabel={accessibilityLabel} style={{ flexDirection: "row", gap: 4 }}>
      {Array.from({ length: max }).map((_, i) => {
        const index = i + 1;
        const name = starName(index, value);
        const editable = typeof onChange === "function";
        return (
          <Pressable
            key={index}
            onPress={editable ? () => onChange(index) : undefined}
            accessibilityRole={editable ? "button" : "image"}
            accessibilityLabel={`Star ${index}`}
          >
            <Ionicons name={name} size={size} color={semanticPalette.accent} />
          </Pressable>
        );
      })}
    </View>
  );
}
