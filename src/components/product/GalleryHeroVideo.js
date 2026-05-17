import React, { useEffect } from "react";
import { Platform, Pressable, StyleSheet, View } from "react-native";
import { VideoView, useVideoPlayer } from "expo-video";
import { Ionicons } from "@expo/vector-icons";
import ProductImage from "../ui/ProductImage";

/**
 * Hero gallery video slide — replaces deprecated expo-av `Video`.
 */
export default function GalleryHeroVideo({
  uri,
  poster = "",
  active = false,
  playing = false,
  muted = true,
  isDesktop = false,
  mediaStyle,
  onRequestPlay,
  onToggleMute,
  playA11y,
  muteA11y,
}) {
  const source = uri ? { uri: String(uri) } : null;
  const player = useVideoPlayer(source, (p) => {
    p.loop = true;
    p.muted = muted;
  });

  useEffect(() => {
    player.muted = muted;
  }, [muted, player]);

  useEffect(() => {
    if (!active) {
      player.pause();
      return;
    }
    if (playing) {
      player.play();
    } else {
      player.pause();
    }
  }, [active, player, playing]);

  const posterUri = String(poster || "").trim();
  const showPoster = !playing && posterUri;

  return (
    <>
      {showPoster ? (
        <ProductImage uri={posterUri} style={mediaStyle} contentFit="cover" priority={active} lazy={false} />
      ) : (
        <VideoView
          player={player}
          style={mediaStyle}
          contentFit="cover"
          nativeControls={false}
          allowsFullscreen={false}
          allowsPictureInPicture={false}
        />
      )}
      {active ? (
        <Pressable
          style={styles.videoTap}
          onPress={() => {
            if (Platform.OS === "web" && isDesktop) {
              onToggleMute?.();
              return;
            }
            onRequestPlay?.();
          }}
          accessibilityRole="button"
          accessibilityLabel={playing ? muteA11y : playA11y}
        >
          {!playing ? (
            <View style={styles.videoPlayOverlay}>
              <Ionicons name="play-circle" size={56} color="rgba(255,255,255,0.92)" />
            </View>
          ) : null}
        </Pressable>
      ) : null}
    </>
  );
}

const styles = StyleSheet.create({
  videoTap: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
  },
  videoPlayOverlay: {
    alignItems: "center",
    justifyContent: "center",
  },
});
