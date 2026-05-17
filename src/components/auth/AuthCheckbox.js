import React from "react";
import { Pressable, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../context/ThemeContext";
import { fonts } from "../../theme/tokens";

export default function AuthCheckbox({ checked, onToggle, label, labelStyle }) {
  const { semanticPalette } = useTheme();
  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityState={{ checked }}
      accessibilityLabel={label}
      onPress={onToggle}
      style={({ pressed }) => [{ flexDirection: "row", alignItems: "flex-start", gap: 8, opacity: pressed ? 0.75 : 1 }]}
    >
      <View
        style={{
          width: 18,
          height: 18,
          marginTop: 1,
          borderRadius: 4,
          borderWidth: 1,
          borderColor: checked ? semanticPalette.ink : semanticPalette.line,
          backgroundColor: checked ? semanticPalette.ink : semanticPalette.surface,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {checked ? <Ionicons name="checkmark" size={12} color={semanticPalette.inkInverse} /> : null}
      </View>
      <Text style={labelStyle}>{label}</Text>
    </Pressable>
  );
}
