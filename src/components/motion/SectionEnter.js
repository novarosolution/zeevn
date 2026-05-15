import React, { useCallback, useEffect, useRef, useState } from "react";
import { Platform, View } from "react-native";
import Animated, { Easing, useAnimatedStyle, useSharedValue, withDelay, withTiming } from "react-native-reanimated";
import useInViewport from "../../hooks/useInViewport";
import useReducedMotion from "../../hooks/useReducedMotion";

const revealedThisSession = new Set();
const EASE = Easing.bezier(0.2, 0.8, 0.2, 1);

/**
 * Reveals a section once per app session.
 * - Web: IntersectionObserver
 * - Native: onLayout + scroll position
 */
export default function SectionEnter({
  sectionKey,
  header,
  children,
  scrollY = 0,
  windowHeight = 0,
  style,
}) {
  const reducedMotion = useReducedMotion();
  const hasBeenShown = sectionKey && revealedThisSession.has(sectionKey);
  const [revealed, setRevealed] = useState(Boolean(reducedMotion || hasBeenShown));
  const [layoutTop, setLayoutTop] = useState(null);
  const nativeRef = useRef(null);
  const { ref: viewportRef, inView } = useInViewport({
    threshold: 0.16,
    rootMargin: "0px 0px -8% 0px",
    once: true,
    disabled: reducedMotion || hasBeenShown,
  });

  const headerOpacity = useSharedValue(revealed ? 1 : 0);
  const headerY = useSharedValue(revealed ? 0 : 16);
  const contentOpacity = useSharedValue(revealed ? 1 : 0);
  const contentY = useSharedValue(revealed ? 0 : 16);

  const markRevealed = useCallback(() => {
    if (revealed) return;
    setRevealed(true);
    if (sectionKey) revealedThisSession.add(sectionKey);
  }, [revealed, sectionKey]);

  useEffect(() => {
    if (reducedMotion) {
      markRevealed();
      return;
    }
    if (Platform.OS === "web" && inView) {
      markRevealed();
    }
  }, [inView, markRevealed, reducedMotion]);

  useEffect(() => {
    if (reducedMotion || Platform.OS === "web" || revealed || layoutTop == null) return;
    const triggerLine = Number(scrollY || 0) + Number(windowHeight || 0) - 40;
    if (layoutTop <= triggerLine) {
      markRevealed();
    }
  }, [layoutTop, markRevealed, reducedMotion, revealed, scrollY, windowHeight]);

  useEffect(() => {
    if (revealed) {
      headerOpacity.value = withTiming(1, { duration: 400, easing: EASE });
      headerY.value = withTiming(0, { duration: 400, easing: EASE });
      contentOpacity.value = withDelay(80, withTiming(1, { duration: 400, easing: EASE }));
      contentY.value = withDelay(80, withTiming(0, { duration: 400, easing: EASE }));
      return;
    }
    headerOpacity.value = 0;
    headerY.value = 16;
    contentOpacity.value = 0;
    contentY.value = 16;
  }, [contentOpacity, contentY, headerOpacity, headerY, revealed]);

  const setRefs = useCallback(
    (node) => {
      nativeRef.current = node;
      viewportRef(node);
    },
    [viewportRef]
  );

  const onLayout = useCallback((event) => {
    setLayoutTop(event.nativeEvent.layout.y);
  }, []);

  const headerAnim = useAnimatedStyle(() => ({
    opacity: headerOpacity.value,
    transform: [{ translateY: headerY.value }],
  }));
  const contentAnim = useAnimatedStyle(() => ({
    opacity: contentOpacity.value,
    transform: [{ translateY: contentY.value }],
  }));

  if (!header) {
    return (
      <Animated.View ref={setRefs} onLayout={onLayout} style={[style, contentAnim]}>
        {children}
      </Animated.View>
    );
  }

  return (
    <View ref={setRefs} onLayout={onLayout} style={style}>
      <Animated.View style={headerAnim}>{header}</Animated.View>
      <Animated.View style={contentAnim}>{children}</Animated.View>
    </View>
  );
}

