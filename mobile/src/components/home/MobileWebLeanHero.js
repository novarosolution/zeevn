import React, { useCallback, useMemo } from "react";
import { Platform, Pressable, StyleSheet, View } from "react-native";
import { WEB_HERO_PORTRAIT_RATIO } from "../../content/homeHeroContent";
import { useKankregLayout } from "../../theme/kankregBreakpoints";
import { getHeroSlideDisplayWidth, getHeroSlideImageUri } from "../../utils/image";
import { setLcpShellVisible } from "../../utils/lcpShell";
import { HtmlImg } from "./compareWebDom";

/**
 * Phone web LCP hero — single static WebP, no carousel / GSAP / slider chunk.
 */
export default function MobileWebLeanHero({ slide, onPress, layoutWidth }) {
  const { width: viewportWidth } = useKankregLayout();
  const frameWidth = Math.max(320, layoutWidth || viewportWidth || 390);

  const uri = useMemo(() => {
    if (!slide?.url) return "";
    return getHeroSlideImageUri(slide.url, { layoutWidth: frameWidth, isMobileWeb: true });
  }, [frameWidth, slide?.url]);

  const frameHeight = Math.round(frameWidth * (slide?.heightRatio || WEB_HERO_PORTRAIT_RATIO));

  const dismissShell = useCallback(() => {
    if (Platform.OS === "web") setLcpShellVisible(false);
  }, []);

  if (Platform.OS !== "web" || !uri) return null;

  const image = (
    <HtmlImg
      src={uri}
      alt={slide?.title || "Zeevan premium A2 ghee"}
      loading="eager"
      fetchPriority="high"
      decoding="async"
      width={frameWidth}
      height={frameHeight}
      sizes="100vw"
      style={{
        width: "100%",
        height: frameHeight,
        objectFit: "contain",
        objectPosition: "top center",
        display: "block",
        backgroundColor: "#FAF8F4",
      }}
      onLoad={dismissShell}
    />
  );

  if (!onPress) {
    return <View style={[styles.frame, { height: frameHeight }]}>{image}</View>;
  }

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={slide?.cta || "Shop Zeevan"}
      style={[styles.frame, { height: frameHeight }]}
    >
      {image}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  frame: {
    width: "100%",
    maxWidth: "100%",
    alignSelf: "stretch",
    overflow: "hidden",
    backgroundColor: "#FAF8F4",
  },
});
