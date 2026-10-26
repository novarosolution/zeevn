import React, { useMemo } from "react";
import { Image } from "expo-image";
import { Platform, StyleSheet, Text, View } from "react-native";
import { HOME_SPACE, HOME_TYPE, homeEditorialMuted } from "../../theme/homeEditorial";
import { fonts, radius } from "../../theme/tokens";
import { resolveImageSource } from "../../utils/mediaSource";
import { HtmlDiv, toImageSrc } from "./compareWebDom";
import ProgressiveImage from "../ui/ProgressiveImage";

/** Dark letterbox around story photos — pairs with cream page + cinematic video. */
export const STORY_FRAME_BG = "#0a0908";

const frameShadow = Platform.select({
  web: { boxShadow: "0 20px 44px -28px rgba(8, 6, 4, 0.42), 0 8px 20px -12px rgba(25, 20, 15, 0.18)" },
  default: {},
});

/**
 * Editorial image frame with black surround and inset crop (matches brand film framing).
 */
export default function StoryImageFrame({
  source,
  caption,
  aspectRatio = 4 / 5,
  isDark = false,
  compact = false,
}) {
  const webSrc = useMemo(
    () => (Platform.OS === "web" ? toImageSrc(source, { width: 960, quality: "auto:good" }) : null),
    [source]
  );

  if (!source) return null;

  return (
    <View style={[styles.wrap, compact && styles.wrapCompact]}>
      <View style={[styles.stage, { aspectRatio }]}>
        <View style={styles.letterbox}>
          {Platform.OS === "web" ? (
            <HtmlDiv style={StyleSheet.absoluteFillObject}>
              {webSrc ? (
                <ProgressiveImage
                  uri={webSrc}
                  style={styles.imageFramed}
                  contentFit="cover"
                  contentPosition="center"
                  priority="normal"
                  width={960}
                  rounded={0}
                />
              ) : null}
            </HtmlDiv>
          ) : (
            <Image
              source={resolveImageSource(source)}
              style={styles.imageFramed}
              contentFit="cover"
              contentPosition="center"
              transition={280}
            />
          )}
        </View>
        <View style={styles.frameLineTop} pointerEvents="none" />
        <View style={styles.frameLineBottom} pointerEvents="none" />
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
    gap: HOME_SPACE.sm,
  },
  wrapCompact: {
    gap: HOME_SPACE.xs,
  },
  stage: {
    width: "100%",
    position: "relative",
    overflow: "hidden",
    borderRadius: radius.lg,
    backgroundColor: STORY_FRAME_BG,
    ...frameShadow,
  },
  letterbox: {
    ...StyleSheet.absoluteFillObject,
    overflow: "hidden",
    backgroundColor: STORY_FRAME_BG,
  },
  imageFramed: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: "86%",
    height: "74%",
    marginLeft: "-4%",
    marginTop: "-4%",
  },
  frameLineTop: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: StyleSheet.hairlineWidth,
    backgroundColor: "rgba(255, 253, 248, 0.14)",
    zIndex: 2,
  },
  frameLineBottom: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: StyleSheet.hairlineWidth,
    backgroundColor: "rgba(255, 253, 248, 0.08)",
    zIndex: 2,
  },
  caption: {
    fontFamily: fonts.regular,
    fontSize: HOME_TYPE.eyebrow + 1,
    lineHeight: 17,
    letterSpacing: 0.2,
    paddingHorizontal: 2,
  },
});
