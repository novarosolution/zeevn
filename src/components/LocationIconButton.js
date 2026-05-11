import React from "react";
import { Platform, Pressable, StyleSheet, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { getSemanticColors, icon, semanticRadius } from "../theme/tokens";

/**
 * Compact location control — icon only; opens address or login.
 * Pass either `navigation` (screen) or `navigationRef` (root ref, e.g. web header).
 */
export default function LocationIconButton({ navigation, navigationRef, size = icon.md }) {
  const { colors: c } = useTheme();
  const semantic = getSemanticColors(c);
  const { isAuthenticated } = useAuth();

  const onPress = () => {
    const dest = isAuthenticated ? "ManageAddress" : "Login";
    if (navigationRef?.isReady?.() && typeof navigationRef.navigate === "function") {
      navigationRef.navigate(dest);
      return;
    }
    if (navigation?.navigate) {
      navigation.navigate(dest);
    }
  };

  return (
    <Pressable
      onPress={onPress}
      style={({ hovered, pressed }) => [
        styles.hit,
        { borderColor: semantic.border.accent, backgroundColor: c.primarySoft },
        hovered ? { backgroundColor: c.surface, borderColor: c.primary } : null,
        pressed && { opacity: 0.88 },
      ]}
      accessibilityRole="button"
      accessibilityLabel="Delivery address"
      hitSlop={8}
    >
      <View style={styles.inner}>
        <Ionicons name="location" size={size} color={semantic.accent.primary} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  hit: {
    borderRadius: semanticRadius.full,
    borderWidth: 1,
    borderTopWidth: 2,
    ...Platform.select({
      web: {
        cursor: "pointer",
        transition: "background 0.18s ease, border-color 0.18s ease, box-shadow 0.18s ease",
        boxShadow: "0 6px 14px rgba(24, 24, 27, 0.09), inset 0 1px 0 rgba(255,255,255,0.86)",
      },
      default: {},
    }),
  },
  inner: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
});
