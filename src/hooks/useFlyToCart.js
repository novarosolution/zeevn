import { useCallback, useState } from "react";
import { Image, StyleSheet, useWindowDimensions, View } from "react-native";
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import useReducedMotion from "./useReducedMotion";
import { CUSTOMER_BOTTOM_NAV_BAR_HEIGHT } from "../theme/screenLayout";

/**
 * Fly-to-cart ghost animation (shared by Home, PDP, account reorder).
 * @param {{ onComplete?: () => void }} [options]
 */
export default function useFlyToCart(options = {}) {
  const { onComplete } = options;
  const reducedMotion = useReducedMotion();
  const { width: safeWindowWidth, height: safeWindowHeight } = useWindowDimensions();
  const [flyGhost, setFlyGhost] = useState(null);

  const flyX = useSharedValue(0);
  const flyY = useSharedValue(0);
  const flyScale = useSharedValue(1);
  const flyOpacity = useSharedValue(0);

  const flyGhostStyle = useAnimatedStyle(() => ({
    position: "absolute",
    left: flyX.value,
    top: flyY.value,
    width: 48,
    height: 56,
    opacity: flyOpacity.value,
    transform: [{ scale: flyScale.value }],
    zIndex: 9999,
  }));

  const triggerFlyToCart = useCallback(
    (meta) => {
      if (reducedMotion || !meta?.sourceRect) {
        onComplete?.();
        return;
      }
      const fromX = Number(meta.sourceRect.x || 0);
      const fromY = Number(meta.sourceRect.y || 0);
      const fromW = Number(meta.sourceRect.width || 48);
      const fromH = Number(meta.sourceRect.height || 60);
      const startX = fromX + fromW * 0.5 - 24;
      const startY = fromY + fromH * 0.5 - 28;
      const targetX = safeWindowWidth * 0.5 - 20;
      const targetY = safeWindowHeight - 48 - CUSTOMER_BOTTOM_NAV_BAR_HEIGHT - 8;

      setFlyGhost({ imageUri: meta.imageUri || "" });
      flyX.value = startX;
      flyY.value = startY;
      flyScale.value = 1;
      flyOpacity.value = 0.98;

      const midX = (startX + targetX) / 2 + 18;
      const midY = Math.min(startY, targetY) - 76;
      flyX.value = withSequence(
        withTiming(midX, { duration: 280, easing: Easing.bezier(0.2, 0.8, 0.2, 1) }),
        withTiming(targetX, { duration: 200, easing: Easing.bezier(0.2, 0.8, 0.2, 1) })
      );
      flyY.value = withSequence(
        withTiming(midY, { duration: 280, easing: Easing.bezier(0.2, 0.8, 0.2, 1) }),
        withTiming(targetY, { duration: 200, easing: Easing.bezier(0.2, 0.8, 0.2, 1) })
      );
      flyScale.value = withSequence(
        withTiming(0.92, { duration: 380, easing: Easing.out(Easing.cubic) }),
        withTiming(0, { duration: 100, easing: Easing.in(Easing.cubic) })
      );
      flyOpacity.value = withSequence(
        withTiming(0.98, { duration: 80 }),
        withTiming(0.98, { duration: 400 }),
        withTiming(0, { duration: 120 }, (finished) => {
          if (finished) {
            runOnJS(setFlyGhost)(null);
            if (onComplete) runOnJS(onComplete)();
          }
        })
      );
    },
    [flyOpacity, flyScale, flyX, flyY, onComplete, reducedMotion, safeWindowHeight, safeWindowWidth]
  );

  const FlyGhostLayer = useCallback(() => {
    if (!flyGhost) return null;
    return (
      <Animated.View pointerEvents="none" style={flyGhostStyle}>
        {flyGhost.imageUri ? (
          <Image source={{ uri: flyGhost.imageUri }} style={styles.ghostImage} />
        ) : (
          <View style={[styles.ghostImage, { backgroundColor: "rgba(200,169,126,0.35)" }]} />
        )}
      </Animated.View>
    );
  }, [flyGhost, flyGhostStyle]);

  return { triggerFlyToCart, FlyGhostLayer };
}

const styles = StyleSheet.create({
  ghostImage: { width: "100%", height: "100%", borderRadius: 8 },
});
