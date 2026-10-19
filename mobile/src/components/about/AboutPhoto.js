import React from "react";
import { Image as RNImage, Platform, StyleSheet, Text, View } from "react-native";
import { Image } from "expo-image";
import { homeEditorialMuted } from "../../theme/homeEditorial";
import { KANKREG_PALETTE } from "../../theme/kankregWeb";
import { fonts, radius, spacing } from "../../theme/tokens";
import { resolveImageSource } from "../../utils/mediaSource";

/**
 * Reliable About photography — cream placeholder, full-bleed cover, bundled require() safe.
 */
export default function AboutPhoto({
  source,
  caption,
  aspectRatio = 4 / 5,
  isDark = false,
  rounded = true,
  priority = "normal",
  style,
}) {
  if (source == null || source === "") return null;

  const isBundled = typeof source === "number";
  const remote = !isBundled ? resolveImageSource(source) : null;

  return (
    <View style={[styles.wrap, style]}>
      <View
        style={[
          styles.stage,
          { aspectRatio },
          rounded && styles.stageRounded,
          { backgroundColor: isDark ? "#1a1714" : KANKREG_PALETTE.paper2 },
        ]}
      >
        {isBundled ? (
          <RNImage
            source={source}
            style={styles.image}
            resizeMode="cover"
            accessibilityIgnoresInvertColors
          />
        ) : remote ? (
          Platform.OS === "web" ? (
            <RNImage
              source={remote}
              style={styles.image}
              resizeMode="cover"
              accessibilityIgnoresInvertColors
            />
          ) : (
            <Image
              source={remote}
              style={styles.image}
              contentFit="cover"
              contentPosition="center"
              transition={280}
              priority={priority}
              cachePolicy="memory-disk"
            />
          )
        ) : null}
      </View>
      {caption ? (
        <Text style={[styles.caption, { color: homeEditorialMuted(isDark) }]} numberOfLines={2}>
          {caption}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: "100%",
    gap: spacing.sm,
  },
  stage: {
    width: "100%",
    position: "relative",
    overflow: "hidden",
    ...Platform.select({
      web: {
        boxShadow: "0 18px 40px -24px rgba(36, 68, 36, 0.22)",
      },
      default: {},
    }),
  },
  stageRounded: {
    borderRadius: radius.lg,
  },
  image: {
    ...StyleSheet.absoluteFillObject,
    width: "100%",
    height: "100%",
  },
  caption: {
    fontFamily: fonts.regular,
    fontSize: 13,
    lineHeight: 18,
    letterSpacing: 0.15,
    paddingHorizontal: 2,
  },
});
