import React from "react";
import { StyleSheet, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useTheme } from "../context/ThemeContext";
import { CUSTOMER_SHELL_GRADIENT_LOCATIONS, getCustomerShellGradient } from "../theme/customerAlchemy";

/**
 * Full-screen gradient for every screen using this shell.
 * Light mode: warm cream editorial (aligned with Home / Cart). Dark: theme gradient.
 * Adds a subtle gold wash and edge vignette so inner pages match the home “premium” feel.
 */
export default function CustomerScreenShell({ children, style }) {
  const { colors: c, isDark } = useTheme();
  const shellColors = getCustomerShellGradient(isDark, c);
  return (
    <View style={[styles.base, style]}>
      <LinearGradient
        colors={shellColors}
        locations={CUSTOMER_SHELL_GRADIENT_LOCATIONS}
        start={{ x: 0.06, y: 0 }}
        end={{ x: 0.94, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <LinearGradient
        colors={
          isDark
            ? ["rgba(212, 175, 55, 0.09)", "transparent", "transparent", "rgba(0, 0, 0, 0.42)"]
            : ["rgba(212, 175, 55, 0.14)", "transparent", "rgba(255, 253, 251, 0.35)", "rgba(116, 79, 28, 0.06)"]
        }
        locations={[0, 0.22, 0.55, 1]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.ambientWash}
        pointerEvents="none"
      />
      <View style={styles.content}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    flex: 1,
    width: "100%",
    position: "relative",
    overflow: "hidden",
  },
  ambientWash: {
    ...StyleSheet.absoluteFillObject,
  },
  content: {
    flex: 1,
    width: "100%",
  },
});
