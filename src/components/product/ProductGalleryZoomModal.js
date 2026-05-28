import React, { useEffect } from "react";
import { Modal, Pressable, StyleSheet, View, useWindowDimensions } from "react-native";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import Animated, { useAnimatedStyle, useSharedValue, withSpring, withTiming } from "react-native-reanimated";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import { useTheme } from "../../context/ThemeContext";
import { PRODUCT_SCREEN } from "../../content/appContent";
import useReducedMotion from "../../hooks/useReducedMotion";
import useEscapeKey from "../../hooks/useEscapeKey";

const AnimatedImage = Animated.createAnimatedComponent(Image);

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

export default function ProductGalleryZoomModal({ visible, uri, onClose }) {
  const { width, height } = useWindowDimensions();
  const { semanticPalette } = useTheme();
  const reducedMotion = useReducedMotion();
  useEscapeKey(onClose, visible);

  const scale = useSharedValue(1);
  const savedScale = useSharedValue(1);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const savedTranslateX = useSharedValue(0);
  const savedTranslateY = useSharedValue(0);
  const dismissY = useSharedValue(0);

  useEffect(() => {
    if (!visible) return;
    scale.value = 1;
    savedScale.value = 1;
    translateX.value = 0;
    translateY.value = 0;
    savedTranslateX.value = 0;
    savedTranslateY.value = 0;
    dismissY.value = 0;
  }, [visible, dismissY, savedScale, savedTranslateX, savedTranslateY, scale, translateX, translateY, uri]);

  const imageStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value + dismissY.value },
      { scale: scale.value },
    ],
  }));

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: 1 - Math.min(0.45, dismissY.value / 280),
  }));

  const pinch = Gesture.Pinch()
    .onUpdate((event) => {
      scale.value = clamp(savedScale.value * event.scale, 1, 4);
    })
    .onEnd(() => {
      if (scale.value < 1) {
        scale.value = withSpring(1);
        savedScale.value = 1;
        translateX.value = withSpring(0);
        translateY.value = withSpring(0);
        savedTranslateX.value = 0;
        savedTranslateY.value = 0;
        return;
      }
      savedScale.value = scale.value;
    });

  const pan = Gesture.Pan()
    .onUpdate((event) => {
      if (scale.value > 1.02) {
        translateX.value = savedTranslateX.value + event.translationX;
        translateY.value = savedTranslateY.value + event.translationY;
        dismissY.value = 0;
        return;
      }
      dismissY.value = Math.max(0, event.translationY);
      translateX.value = 0;
      translateY.value = 0;
    })
    .onEnd((event) => {
      if (scale.value > 1.02) {
        savedTranslateX.value = translateX.value;
        savedTranslateY.value = translateY.value;
        return;
      }
      if (event.translationY > 90 || event.velocityY > 650) {
        dismissY.value = withTiming(height, { duration: reducedMotion ? 1 : 220 });
        scale.value = withTiming(0.92, { duration: reducedMotion ? 1 : 220 });
        setTimeout(() => onClose?.(), reducedMotion ? 0 : 220);
        return;
      }
      dismissY.value = withSpring(0);
    });

  const doubleTap = Gesture.Tap()
    .numberOfTaps(2)
    .onEnd(() => {
      if (scale.value > 1.05) {
        scale.value = withSpring(1);
        savedScale.value = 1;
        translateX.value = withSpring(0);
        translateY.value = withSpring(0);
        savedTranslateX.value = 0;
        savedTranslateY.value = 0;
        return;
      }
      scale.value = withSpring(2);
      savedScale.value = 2;
    });

  const composed = Gesture.Simultaneous(pinch, pan, doubleTap);

  if (!visible || !uri) return null;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Animated.View style={[styles.backdrop, { backgroundColor: "rgba(14,23,41,0.94)" }, backdropStyle]}>
        <Pressable style={styles.closeHit} onPress={onClose} accessibilityRole="button" accessibilityLabel={PRODUCT_SCREEN.zoomCloseA11y}>
          <Ionicons name="close-outline" size={32} color={semanticPalette.inkInverse} />
        </Pressable>
        <GestureDetector gesture={composed}>
          <Animated.View style={[styles.stage, { width, height }]}>
            <AnimatedImage source={{ uri }} style={[styles.image, imageStyle]} contentFit="contain" transition={180} />
          </Animated.View>
        </GestureDetector>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  closeHit: {
    position: "absolute",
    top: 52,
    right: 20,
    zIndex: 4,
    padding: 8,
  },
  stage: {
    justifyContent: "center",
    alignItems: "center",
  },
  image: {
    width: "100%",
    height: "100%",
  },
});
