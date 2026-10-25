import React from "react";
import { Platform, StyleSheet, Text } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { AUTH_UI } from "../../content/appContent";
import { useStoreTheme } from "../../theme/storefront";
import PressableScale from "../store/PressableScale";

/** "Continue shopping without signing in" — a quiet link under the form. */
export default function AuthGuestLink({ onPress }) {
  const { c, type } = useStoreTheme();
  return (
    <PressableScale
      onPress={onPress}
      scaleTo={0.97}
      style={styles.link}
      hitSlop={8}
      accessibilityRole="link"
      accessibilityLabel={AUTH_UI.continueGuest}
    >
      <Text style={type.ui(14, "semibold", c.inkSoft)}>{AUTH_UI.continueGuest}</Text>
      <Ionicons name="arrow-forward" size={15} color={c.inkSoft} />
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  link: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
    ...Platform.select({ web: { cursor: "pointer" }, default: {} }),
  },
});
