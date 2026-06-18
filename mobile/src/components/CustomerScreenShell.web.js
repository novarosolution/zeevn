import React from "react";
import { StyleSheet, View } from "react-native";
import { useTheme } from "../context/ThemeContext";

/** Web — plain shell (no Reanimated backdrop work on the critical path). */
export default function CustomerScreenShell({ children, style }) {
  const { colors: c } = useTheme();
  return <View style={[styles.shell, { backgroundColor: c.background }, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  shell: {
    flex: 1,
    width: "100%",
    maxWidth: "100%",
    minHeight: "100dvh",
    overflowX: "clip",
  },
});
