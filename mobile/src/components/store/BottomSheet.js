import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Modal, Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { Gesture, GestureDetector, GestureHandlerRootView } from "react-native-gesture-handler";
import Animated, {
  Extrapolation,
  ReduceMotion,
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { motionSettle, motionTiming, projectVelocity, rubberband } from "../../theme/motion";
import { useStoreTheme } from "../../theme/storefront";
import { hapticTap } from "../../utils/haptics";
import PressableScale from "./PressableScale";

/** Extra surface under the sheet so an upward over-drag never shows a gap at the bottom edge. */
const BLEED = 160;
/** A drag has to travel this far before releasing it back counts as "snapped home" and earns a haptic. */
const SNAP_HAPTIC_MIN = 24;

/**
 * Storefront bottom sheet. Slides up over a dimmed backdrop (iOS sheet curve), and drags down to dismiss from the handle
 * or header:
 *  - the backdrop is derived from the sheet's position, so the two can never drift apart;
 *  - releasing hands the finger's velocity to the spring, and a flick dismisses even a short drag (momentum projection);
 *  - dragging up past the top resists like rubber instead of stopping dead;
 *  - everything runs on the UI thread, so a busy JS thread cannot make it stutter.
 * With Reduce Motion on, the sheet fades in place instead of travelling.
 */
export default function BottomSheet({ visible, onClose, title, subtitle, children, footer, maxHeightRatio = 0.86 }) {
  const { c, r, type, shadow } = useStoreTheme();
  const insets = useSafeAreaInsets();
  const { height: screenH } = useWindowDimensions();
  const reduced = useReducedMotion();

  const [mounted, setMounted] = useState(visible);
  const mountedRef = useRef(visible);
  const gestureClosed = useRef(false);
  const closeRef = useRef(onClose);
  closeRef.current = onClose;

  const translateY = useSharedValue(screenH);
  const appear = useSharedValue(0);
  const sheetH = useSharedValue(screenH * 0.5);
  const startY = useSharedValue(0);

  const unmount = useCallback(() => {
    mountedRef.current = false;
    setMounted(false);
  }, []);

  /** The drag already carried the sheet off screen: tell the parent, and skip the exit animation it would otherwise play. */
  const finishDrag = useCallback(() => {
    gestureClosed.current = true;
    closeRef.current?.();
  }, []);

  useEffect(() => {
    if (visible) {
      gestureClosed.current = false;
      if (!mountedRef.current) {
        mountedRef.current = true;
        translateY.value = reduced ? 0 : screenH;
        appear.value = 0;
        setMounted(true);
      }
      // One frame for the sheet to lay out off screen, then it travels (from wherever it is, if it was mid-exit).
      const id = requestAnimationFrame(() => {
        if (reduced) {
          appear.value = withTiming(1, { duration: motionTiming.toggle, reduceMotion: ReduceMotion.Never });
        } else {
          translateY.value = withSpring(0, motionSettle.sheet);
        }
      });
      return () => cancelAnimationFrame(id);
    }

    if (!mountedRef.current) return undefined;
    if (gestureClosed.current) {
      gestureClosed.current = false;
      unmount();
      return undefined;
    }
    if (reduced) {
      appear.value = withTiming(0, { duration: motionTiming.exit, reduceMotion: ReduceMotion.Never }, (finished) => {
        if (finished) runOnJS(unmount)();
      });
    } else {
      translateY.value = withSpring(
        screenH,
        { ...motionSettle.settle, overshootClamping: true },
        (finished) => {
          if (finished) runOnJS(unmount)();
        }
      );
    }
    return undefined;
    // `screenH`, `reduced` and the shared values are stable for one open/close; only `visible` starts a transition.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  const pan = useMemo(
    () =>
      Gesture.Pan()
        .activeOffsetY([-10, 10])
        .failOffsetX([-30, 30])
        .onStart(() => {
          // Start from where the eye last saw the sheet, not from zero: grabbing it mid-animation must not teleport it.
          startY.value = translateY.value;
        })
        .onUpdate((e) => {
          const next = startY.value + e.translationY;
          translateY.value = next >= 0 ? next : rubberband(next, sheetH.value);
        })
        .onEnd((e) => {
          const dragged = translateY.value;
          const projected = dragged + projectVelocity(e.velocityY);
          if (projected > sheetH.value * 0.4) {
            translateY.value = withSpring(
              screenH,
              { duration: 300, dampingRatio: 1, velocity: e.velocityY, overshootClamping: true },
              (finished) => {
                if (finished) runOnJS(finishDrag)();
              }
            );
          } else {
            translateY.value = withSpring(0, { ...motionSettle.snapBack, velocity: e.velocityY });
            if (dragged > SNAP_HAPTIC_MIN) runOnJS(hapticTap)();
          }
        }),
    [finishDrag, screenH, sheetH, startY, translateY]
  );

  const sheetStyle = useAnimatedStyle(() => ({
    opacity: reduced ? appear.value : 1,
    transform: [{ translateY: translateY.value }],
  }));
  const backdropStyle = useAnimatedStyle(() => ({
    opacity: reduced ? appear.value : interpolate(translateY.value, [0, sheetH.value], [1, 0], Extrapolation.CLAMP),
  }));

  if (!mounted) return null;

  return (
    <Modal visible transparent animationType="none" onRequestClose={onClose} statusBarTranslucent>
      <GestureHandlerRootView style={styles.root}>
        <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: c.scrim }, backdropStyle]}>
          <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityRole="button" accessibilityLabel="Close" />
        </Animated.View>

        <Animated.View
          accessibilityViewIsModal
          onLayout={(e) => {
            sheetH.value = e.nativeEvent.layout.height;
          }}
          style={[
            styles.sheet,
            shadow.float,
            {
              // Solid fill on the shadow-casting view: a shadow from transparent content is re-rendered offscreen every frame.
              backgroundColor: c.card,
              borderTopLeftRadius: r.xxl,
              borderTopRightRadius: r.xxl,
              maxHeight: screenH * maxHeightRatio,
            },
            sheetStyle,
          ]}
        >
          <View
            style={[
              styles.surface,
              {
                backgroundColor: c.card,
                borderTopLeftRadius: r.xxl,
                borderTopRightRadius: r.xxl,
                paddingBottom: Math.max(insets.bottom, 12),
              },
            ]}
          >
            <GestureDetector gesture={pan}>
              <View>
                <View style={styles.handleWrap}>
                  <View style={[styles.handle, { backgroundColor: c.lineStrong }]} />
                </View>
                {title ? (
                  <View style={styles.header}>
                    <View style={styles.headerText}>
                      <Text style={type.display(22, { semi: true })} numberOfLines={1}>
                        {title}
                      </Text>
                      {subtitle ? (
                        <Text style={[type.ui(13, "medium", c.inkMute), styles.subtitle]} numberOfLines={2}>
                          {subtitle}
                        </Text>
                      ) : null}
                    </View>
                    <PressableScale
                      onPress={onClose}
                      hitSlop={10}
                      scaleTo={0.92}
                      lite
                      style={[styles.close, { backgroundColor: c.soft }]}
                      accessibilityRole="button"
                      accessibilityLabel="Close"
                    >
                      <Ionicons name="close" size={18} color={c.inkSoft} />
                    </PressableScale>
                  </View>
                ) : null}
              </View>
            </GestureDetector>

            <ScrollView
              bounces={false}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={styles.body}
            >
              {children}
            </ScrollView>
            {footer ? <View style={styles.footer}>{footer}</View> : null}
          </View>
          <View pointerEvents="none" style={[styles.bleed, { backgroundColor: c.card }]} />
        </Animated.View>
      </GestureHandlerRootView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, justifyContent: "flex-end" },
  sheet: { width: "100%" },
  surface: { overflow: "hidden", flexShrink: 1 },
  bleed: { position: "absolute", left: 0, right: 0, top: "100%", height: BLEED },
  handleWrap: { alignItems: "center", paddingTop: 10, paddingBottom: 6 },
  handle: { width: 42, height: 4.5, borderRadius: 3 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 6,
    paddingBottom: 10,
    gap: 12,
  },
  headerText: { flex: 1, minWidth: 0 },
  subtitle: { marginTop: 2 },
  close: { width: 32, height: 32, borderRadius: 16, alignItems: "center", justifyContent: "center" },
  body: { paddingHorizontal: 20, paddingBottom: 8, paddingTop: 4 },
  footer: { paddingHorizontal: 20, paddingTop: 8 },
});
