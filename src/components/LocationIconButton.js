import React from "react";
import { Platform, Pressable, StyleSheet, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { radius } from "../theme/tokens";

/**
 * Compact location control — icon only; opens address or login.
 * Pass either `navigation` (screen) or `navigationRef` (root ref, e.g. web header).
 */
export default function LocationIconButton({ navigation, navigationRef, size = 17 }) {
  const { colors: c } = useTheme();
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
      style={({ pressed }) => [styles.hit, { borderColor: c.primaryBorder, backgroundColor: c.primarySoft }, pressed && { opacity: 0.88 }]}
      accessibilityRole="button"
      accessibilityLabel="Delivery address"
      hitSlop={8}
    >
      <View style={styles.inner}>
        <Ionicons name="location" size={size} color={c.primary} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  hit: {
    borderRadius: radius.pill,
    borderWidth: 1,
    ...Platform.select({ web: { cursor: "pointer" }, default: {} }),
  },
  inner: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
  },
});
