import React, { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { fonts, icon, radius, spacing } from "../../theme/tokens";
import { HOME_TIMELINE_VIDEO } from "../../constants/marketingTimelineVideo";
import { useKankregLayout } from "../../theme/kankregBreakpoints";
import { useTheme } from "../../context/ThemeContext";
import { injectWebCssOnce } from "../../utils/injectWebCssOnce";
import { KANKREG_PALETTE } from "../../theme/kankregWeb";
import WebHtmlVideo from "./WebHtmlVideo";

const BANNER_VIDEO_CLASS = "kankreg-timeline-banner-video";
const BANNER_REEL_CLASS = "kankreg-timeline-banner-reel";
const BANNER_REEL_EMBED_CLASS = "kankreg-timeline-banner-reel-embed";

injectWebCssOnce(
  "kankreg-timeline-banner-v3",
  `.${BANNER_REEL_CLASS},
.${BANNER_REEL_EMBED_CLASS} {
  position: relative;
  width: 100%;
  overflow: hidden;
  background: #0a0908;
}
.${BANNER_REEL_CLASS} {
  border-radius: 22px;
}
.${BANNER_REEL_EMBED_CLASS} {
  border-radius: 20px;
  height: 100%;
}
.${BANNER_REEL_CLASS} video,
.${BANNER_REEL_EMBED_CLASS} video,
.${BANNER_VIDEO_CLASS} {
  width: 100% !important;
  height: 100% !important;
  object-fit: cover !important;
  object-position: center center !important;
  display: block;
}
@keyframes kankregBannerDrift {
  from { transform: scale(1.02); }
  to { transform: scale(1.05); }
}
.${BANNER_REEL_CLASS} video,
.${BANNER_REEL_EMBED_CLASS} video {
  animation: kankregBannerDrift 32s ease-in-out infinite alternate;
  transform-origin: center center;
}
@media (prefers-reduced-motion: reduce) {
  .${BANNER_REEL_CLASS} video,
  .${BANNER_REEL_EMBED_CLASS} video { animation: none !important; transform: none !important; }
}`
);

/** Web timeline banner — progressive HTML5 video (preview MP4 → full via load balancer). */
export default function HomePromoVideo({
  fullBleed = false,
  embedded = false,
  filmLabel = "Brand timeline",
  filmDuration = "2 min film",
  loopingLabel = "Always playing",
  stageHeight,
  minimalChrome = false,
}) {
  const { isDark } = useTheme();
  const { width, isXs } = useKankregLayout();
  const [isMuted, setIsMuted] = useState(true);

  const bannerHeight =
    stageHeight ??
    (width >= 1080
      ? 520
      : width >= 720
        ? 440
        : Math.max(300, Math.min(440, Math.round(width * 0.62))));

  const reelClass = embedded ? BANNER_REEL_EMBED_CLASS : BANNER_REEL_CLASS;

  const reelContent = (
    <View
      className={reelClass}
      style={[
        styles.reel,
        embedded && styles.reelEmbedded,
        fullBleed && styles.reelBleed,
        embedded ? styles.reelEmbeddedHeight : { height: bannerHeight },
      ]}
    >
      <WebHtmlVideo
        source={HOME_TIMELINE_VIDEO}
        active
        autoPlay
        muted={isMuted}
        loop
        fit="cover"
        cinematic
        progressive
        style={styles.video}
      />
      <LinearGradient
        colors={[
          "rgba(8, 6, 4, 0.28)",
          "transparent",
          "transparent",
          "rgba(8, 6, 4, 0.52)",
        ]}
        locations={[0, 0.16, 0.68, 1]}
        style={styles.vignette}
        pointerEvents="none"
      />
      <LinearGradient
        colors={["transparent", "rgba(8, 6, 4, 0.62)"]}
        locations={[0.62, 1]}
        style={styles.bottomScrim}
        pointerEvents="none"
      />
      <View style={styles.goldRuleTop} pointerEvents="none" />

      <Pressable
        onPress={() => setIsMuted((prev) => !prev)}
        style={({ pressed, hovered }) => [
          styles.muteChip,
          minimalChrome && styles.muteChipMinimal,
          isMuted ? styles.muteChipOff : styles.muteChipOn,
          pressed && styles.muteChipPressed,
          hovered ? styles.muteChipHover : null,
        ]}
        accessibilityRole="button"
        accessibilityLabel={isMuted ? "Unmute video" : "Mute video"}
        accessibilityState={{ selected: !isMuted }}
      >
        <Ionicons
          name={isMuted ? "volume-mute" : "volume-high"}
          size={icon.sm}
          color="#FFF9EC"
        />
        {!minimalChrome ? (
          <Text style={styles.muteLabel}>{isMuted ? "Sound off" : "Sound on"}</Text>
        ) : null}
      </Pressable>

      {!minimalChrome ? (
        <View style={styles.filmChrome} pointerEvents="none">
          <View style={styles.filmChromeLeft}>
            <View style={styles.filmBadge}>
              <View style={styles.filmBadgeDot} />
            </View>
            <View style={styles.filmMeta}>
              <Text style={styles.filmMetaLabel} numberOfLines={1}>
                {filmLabel}
              </Text>
              {filmDuration ? (
                <Text style={styles.filmMetaSub} numberOfLines={1}>
                  {filmDuration}
                </Text>
              ) : null}
            </View>
          </View>
          {loopingLabel ? (
            <View style={styles.loopPill}>
              <View style={styles.loopDot} />
              <Text style={styles.loopText} numberOfLines={1}>
                {loopingLabel}
              </Text>
            </View>
          ) : null}
        </View>
      ) : null}
    </View>
  );

  if (embedded) {
    return (
      <View style={[styles.embeddedWrap, { minHeight: bannerHeight }]} accessibilityElementsHidden={false}>
        {reelContent}
      </View>
    );
  }

  return (
    <View
      style={[
        styles.bannerShell,
        fullBleed && styles.bannerShellBleed,
        isDark && styles.bannerShellDark,
      ]}
      accessibilityElementsHidden={false}
    >
      {!fullBleed ? <View style={styles.bannerFrameTop} pointerEvents="none" /> : null}
      {reelContent}
    </View>
  );
}

const styles = StyleSheet.create({
  embeddedWrap: {
    width: "100%",
    flex: 1,
    minHeight: "100%",
  },
  bannerShell: {
    width: "100%",
    borderRadius: radius.xl + 8,
    padding: 10,
    backgroundColor: "#110B07",
    borderWidth: 1,
    borderColor: "rgba(31, 92, 71, 0.22)",
    borderTopWidth: 3,
    borderTopColor: "rgba(31, 92, 71, 0.8)",
    overflow: "hidden",
    boxShadow:
      "inset 0 1px 0 rgba(255, 253, 248, 0.12), 0 24px 52px -24px rgba(80, 60, 25, 0.28)",
  },
  bannerShellBleed: {
    padding: 0,
    borderRadius: 0,
    borderWidth: 0,
    borderTopWidth: 0,
    backgroundColor: "transparent",
    boxShadow: "none",
  },
  bannerShellDark: {
    borderColor: "rgba(42, 117, 89, 0.18)",
    borderTopColor: "rgba(42, 117, 89, 0.55)",
  },
  reelBleed: {
    borderRadius: 0,
    borderWidth: 0,
  },
  bannerFrameTop: {
    position: "absolute",
    top: 3,
    left: 14,
    right: 14,
    height: 1,
    backgroundColor: "rgba(255, 253, 248, 0.2)",
    zIndex: 2,
  },
  reel: {
    width: "100%",
    borderRadius: 22,
    overflow: "hidden",
    backgroundColor: "#0a0908",
    position: "relative",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255, 252, 248, 0.12)",
  },
  reelEmbedded: {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(31, 92, 71, 0.2)",
    flex: 1,
    boxShadow: "0 20px 48px -24px rgba(8, 6, 4, 0.55), inset 0 1px 0 rgba(255, 253, 248, 0.08)",
  },
  reelEmbeddedHeight: {
    flex: 1,
    minHeight: "100%",
  },
  video: {
    width: "100%",
    height: "100%",
    backgroundColor: "#0a0908",
  },
  vignette: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1,
  },
  bottomScrim: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: "38%",
    zIndex: 2,
  },
  goldRuleTop: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: "rgba(42, 117, 89, 0.42)",
    zIndex: 3,
  },
  muteChip: {
    position: "absolute",
    top: spacing.md,
    right: spacing.md,
    zIndex: 5,
    minHeight: 36,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: radius.pill,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    borderWidth: 1,
    backgroundColor: "rgba(12, 9, 7, 0.55)",
    cursor: "pointer",
    backdropFilter: "blur(10px)",
    WebkitBackdropFilter: "blur(10px)",
    transition: "background-color 0.2s ease, border-color 0.2s ease",
  },
  muteLabel: {
    fontFamily: fonts.semibold,
    fontSize: 11,
    letterSpacing: 0.2,
    color: "rgba(255, 249, 236, 0.9)",
  },
  muteChipOff: {
    borderColor: "rgba(255, 252, 248, 0.32)",
  },
  muteChipMinimal: {
    minHeight: 34,
    paddingVertical: 7,
    paddingHorizontal: 10,
  },
  muteChipOn: {
    borderColor: "rgba(42, 117, 89, 0.65)",
    backgroundColor: "rgba(31, 77, 54, 0.5)",
  },
  muteChipPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.97 }],
  },
  muteChipHover: {
    borderColor: "rgba(42, 117, 89, 0.8)",
  },
  filmChrome: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 4,
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    paddingHorizontal: spacing.md + 4,
    paddingBottom: spacing.md,
    paddingTop: spacing.lg,
    gap: spacing.sm,
  },
  filmChromeLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flex: 1,
    minWidth: 0,
  },
  filmBadge: {
    width: 11,
    height: 11,
    borderRadius: 6,
    backgroundColor: "rgba(28, 18, 8, 0.5)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(42, 117, 89, 0.4)",
  },
  filmBadgeDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: KANKREG_PALETTE.gold,
  },
  filmMeta: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  filmMetaLabel: {
    fontFamily: fonts.semibold,
    fontSize: 10,
    letterSpacing: 1.5,
    textTransform: "uppercase",
    color: "rgba(255, 249, 236, 0.92)",
  },
  filmMetaSub: {
    fontFamily: fonts.regular,
    fontSize: 10,
    letterSpacing: 0.1,
    color: "rgba(255, 249, 236, 0.58)",
  },
  loopPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 11,
    borderRadius: radius.pill,
    backgroundColor: "rgba(12, 9, 7, 0.48)",
    borderWidth: 1,
    borderColor: "rgba(255, 252, 248, 0.14)",
    flexShrink: 0,
    backdropFilter: "blur(6px)",
  },
  loopDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: KANKREG_PALETTE.green,
  },
  loopText: {
    fontFamily: fonts.semibold,
    fontSize: 9,
    letterSpacing: 1.1,
    textTransform: "uppercase",
    color: "rgba(255, 249, 236, 0.75)",
  },
});
