import React, { forwardRef, useMemo } from "react";
import { Platform, ScrollView, StyleSheet } from "react-native";
import Animated, { runOnJS, useAnimatedScrollHandler, useSharedValue } from "react-native-reanimated";
import { ScrollOffsetProvider, useScrollOffsetContextValue } from "../../hooks/useScrollOffset";

const AnimatedScrollView = Animated.createAnimatedComponent(ScrollView);

/**
 * Drop-in ScrollView that:
 *  - Mounts a `ScrollOffsetContext.Provider` so descendants (`HeroParallax`,
 *    shell orbs, header) can react to scroll without their own listeners.
 *  - Provides smooth web scroll affordances without touching native props.
 *
 * Optionally accepts an `onScrollJS` callback (regular JS function) that runs
 * after the internal worklet has updated `scrollY`. Use this for screens that
 * need to react to scroll on the JS thread (e.g. setState).
 *
 *   <MotionScrollView contentContainerStyle={...}>
 *     <HeroParallax>...</HeroParallax>
 *   </MotionScrollView>
 */
const MotionScrollView = forwardRef(function MotionScrollView(
  {
    children,
    contentContainerStyle,
    style,
    scrollEventThrottle = 16,
    smoothScroll = true,
    onScrollJS,
    ...rest
  },
  ref,
) {
  const scrollY = useSharedValue(0);
  const scrollHandler = useAnimatedScrollHandler(
    {
      onScroll: (event) => {
        "worklet";
        scrollY.value = event.contentOffset.y;
        if (onScrollJS) {
          runOnJS(onScrollJS)(event.contentOffset.y);
        }
      },
    },
    [onScrollJS],
  );
  const ctxValue = useScrollOffsetContextValue(scrollY, "internal");

  const webStyle = useMemo(() => {
    if (Platform.OS !== "web") return null;
    return [smoothScroll ? styles.webSmooth : null, styles.webContain];
  }, [smoothScroll]);

  const mergedStyle = useMemo(() => {
    if (Platform.OS !== "web") return style;
    return [webStyle, style];
  }, [style, webStyle]);

  return (
    <ScrollOffsetProvider value={ctxValue}>
      <AnimatedScrollView
        ref={ref}
        style={mergedStyle}
        contentContainerStyle={contentContainerStyle}
        onScroll={scrollHandler}
        scrollEventThrottle={scrollEventThrottle}
        {...rest}
      >
        {children}
      </AnimatedScrollView>
    </ScrollOffsetProvider>
  );
});

const styles = StyleSheet.create({
  webSmooth: Platform.select({
    web: { scrollBehavior: "smooth" },
    default: {},
  }),
  webContain: Platform.select({
    web: { overscrollBehaviorY: "contain" },
    default: {},
  }),
});

export default MotionScrollView;
