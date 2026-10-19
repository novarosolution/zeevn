import React from "react";
import { Image, Platform, StyleSheet, View } from "react-native";

/**
 * Full-bleed home section stage: premium photo bg + opaque scrim so copy stays readable.
 * tone: "warm" (cream) | "cool" (mist teal)
 */
export default function WebSectionBackdrop({
  source,
  tone = "warm",
  isDark = false,
  children,
  style,
  accessibilityLabel,
}) {
  const scrimTone = tone === "cool" ? styles.scrimCool : styles.scrimWarm;

  return (
    <View
      style={[styles.shell, isDark && styles.shellDark, style]}
      accessibilityRole="region"
      accessibilityLabel={accessibilityLabel}
    >
      {source ? (
        <Image source={source} style={styles.bg} resizeMode="cover" accessibilityIgnoresInvertColors />
      ) : null}
      <View
        style={[styles.scrim, scrimTone, isDark && styles.scrimDark]}
        pointerEvents="none"
      />
      <View style={styles.content}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  shell: {
    position: "relative",
    overflow: "hidden",
    backgroundColor: "#FFFFFF",
    alignSelf: "center",
    ...Platform.select({
      web: {
        width: "100vw",
        maxWidth: "100vw",
        marginLeft: "calc(50% - 50vw)",
        marginRight: "calc(50% - 50vw)",
      },
      default: { width: "100%" },
    }),
  },
  shellDark: { backgroundColor: "#141210" },
  bg: {
    ...StyleSheet.absoluteFillObject,
    width: "100%",
    height: "100%",
    opacity: 1,
  },
  scrim: {
    ...StyleSheet.absoluteFillObject,
  },
  /** Keep text above the photo — cream wash, not tint-on-tint. */
  scrimWarm: {
    ...Platform.select({
      web: {
        backgroundImage:
          "linear-gradient(180deg, rgba(252,248,240,0.94) 0%, rgba(247,241,227,0.9) 48%, rgba(252,248,240,0.95) 100%)",
      },
      default: { backgroundColor: "rgba(252,248,240,0.92)" },
    }),
  },
  scrimCool: {
    ...Platform.select({
      web: {
        backgroundImage:
          "linear-gradient(180deg, rgba(244,250,252,0.94) 0%, rgba(232,244,248,0.9) 50%, rgba(244,250,252,0.95) 100%)",
      },
      default: { backgroundColor: "rgba(240,248,250,0.92)" },
    }),
  },
  scrimDark: {
    ...Platform.select({
      web: {
        backgroundImage:
          "linear-gradient(180deg, rgba(18,16,12,0.9) 0%, rgba(18,16,12,0.86) 100%)",
      },
      default: { backgroundColor: "rgba(18,16,12,0.88)" },
    }),
  },
  content: {
    position: "relative",
    zIndex: 1,
    width: "100%",
  },
});
