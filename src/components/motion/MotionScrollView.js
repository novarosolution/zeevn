import React, { forwardRef, useCallback, useMemo } from "react";
import { Platform, ScrollView, StyleSheet } from "react-native";
import Animated, { runOnJS, useAnimatedScrollHandler, useSharedValue } from "react-native-reanimated";
import { ScrollOffsetProvider, useScrollOffsetContextValue } from "../../hooks/useScrollOffset";

const AnimatedScrollView = Animated.createAnimatedComponent(ScrollView);
const useNativeDriverScroll = Platform.OS !== "web";

/**
 * Drop-in ScrollView that:
 *  - Mounts a `ScrollOffsetContext.Provider` so descendants can react to scroll.
 *  - Web: plain `ScrollView` (Reanimated scroll views often fail to scroll on RN Web).
 *  - Native: Reanimated scroll handler for smooth worklet updates.
 */
const MotionScrollView = forwardRef(function MotionScrollView(
  {
    children,
    contentContainerStyle,
    style,
    scrollEventThrottle = 16,
    smoothScroll = false,
    onScrollJS,
    ...rest
  },
  ref,
) {
  const scrollY = useSharedValue(0);

  const publishScroll = useCallback(
    (y) => {
      scrollY.value = y;
      onScrollJS?.(y);
    },
    [onScrollJS, scrollY],
  );

  const nativeScrollHandler = useAnimatedScrollHandler(
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

  const webScrollHandler = useCallback(
    (event) => {
      publishScroll(event.nativeEvent.contentOffset.y);
    },
    [publishScroll],
  );

  const ctxValue = useScrollOffsetContextValue(scrollY, "internal");

  const webStyle = useMemo(() => {
    if (Platform.OS !== "web") return null;
    return [styles.webScroll, smoothScroll ? styles.webSmooth : null, styles.webContain];
  }, [smoothScroll]);

  const mergedStyle = useMemo(() => {
    if (Platform.OS !== "web") return style;
    return [webStyle, style];
  }, [style, webStyle]);

  const ScrollComponent = useNativeDriverScroll ? AnimatedScrollView : ScrollView;
  const scrollProps = useNativeDriverScroll
    ? { onScroll: nativeScrollHandler }
    : { onScroll: webScrollHandler };

  return (
    <ScrollOffsetProvider value={ctxValue}>
      <ScrollComponent
        ref={ref}
        style={mergedStyle}
        contentContainerStyle={contentContainerStyle}
        scrollEventThrottle={scrollEventThrottle}
        {...(Platform.OS === "web" ? { dataSet: { zvScroll: "vertical" } } : {})}
        {...scrollProps}
        {...rest}
      >
        {children}
      </ScrollComponent>
    </ScrollOffsetProvider>
  );
});

const styles = StyleSheet.create({
  webScroll: Platform.select({
    web: {
      flex: 1,
      minHeight: 0,
      width: "100%",
      overflowY: "auto",
      WebkitOverflowScrolling: "touch",
      touchAction: "pan-y",
    },
    default: {},
  }),
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
