import React, { createContext, useCallback, useContext, useState } from "react";
import { RefreshControl, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
} from "react-native-reanimated";
import { STORE_NAV_HEIGHT, useStoreTheme } from "../../theme/storefront";
import FloatingNav from "./FloatingNav";
import PressableScale from "./PressableScale";

/** Height of the header bar below the status bar. */
const BAR = 64;

const OriginContext = createContext(0);

/** y of the screen's content block inside its scroll view — add a child's own `layout.y` to scroll to it. */
export function useScreenOrigin() {
  return useContext(OriginContext);
}

/**
 * Scaffold for the app's inner screens: cream page, a big display title that hands over to a small centred one as
 * you scroll (the frosted header fades in under it), pull-to-refresh, keyboard-aware scrolling and the floating nav.
 */
export default function StoreScreen({
  title,
  navigation,
  onBack,
  right,
  hideNav = false,
  refreshing = false,
  onRefresh,
  children,
  contentStyle,
  headerExtra,
  scrollRef,
}) {
  const { c, type, isDark, gutter } = useStoreTheme();
  const insets = useSafeAreaInsets();
  const scrollY = useSharedValue(0);
  const [origin, setOrigin] = useState(0);

  const onScroll = useAnimatedScrollHandler((event) => {
    scrollY.value = event.contentOffset.y;
  });

  const goBack = useCallback(() => {
    if (onBack) return onBack();
    if (navigation?.canGoBack?.()) return navigation.goBack();
    return navigation?.navigate?.("Home");
  }, [navigation, onBack]);

  const frostStyle = useAnimatedStyle(() => ({ opacity: interpolate(scrollY.value, [4, 36], [0, 1], Extrapolation.CLAMP) }));
  const smallTitleStyle = useAnimatedStyle(() => ({
    opacity: interpolate(scrollY.value, [30, 66], [0, 1], Extrapolation.CLAMP),
    transform: [{ translateY: interpolate(scrollY.value, [30, 66], [8, 0], Extrapolation.CLAMP) }],
  }));
  const bigTitleStyle = useAnimatedStyle(() => ({
    opacity: interpolate(scrollY.value, [0, 54], [1, 0], Extrapolation.CLAMP),
    transform: [
      { translateY: interpolate(scrollY.value, [-80, 0, 80], [-14, 0, -14], Extrapolation.CLAMP) },
      { scale: interpolate(scrollY.value, [-120, 0], [1.08, 1], Extrapolation.CLAMP) },
    ],
  }));

  const navPad = STORE_NAV_HEIGHT + Math.max(16, insets.bottom + 6) + 28;

  return (
    <View style={[styles.screen, { backgroundColor: c.page }]}>
      <Animated.ScrollView
        ref={scrollRef}
        onScroll={onScroll}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
        automaticallyAdjustKeyboardInsets
        contentContainerStyle={[{ paddingTop: insets.top + BAR - 6, paddingBottom: navPad }, contentStyle]}
        refreshControl={
          onRefresh ? (
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={c.brand} progressViewOffset={insets.top + BAR} />
          ) : undefined
        }
      >
        <Animated.View style={[styles.titleWrap, { paddingHorizontal: gutter }, bigTitleStyle]}>
          <Text style={type.display(36, { ls: -0.9, lh: 42 })} numberOfLines={1} accessibilityRole="header">
            {title}
          </Text>
        </Animated.View>
        {headerExtra}
        <OriginContext.Provider value={origin}>
          <View style={{ paddingHorizontal: gutter, gap: 20 }} onLayout={(e) => setOrigin(e.nativeEvent.layout.y)}>
            {children}
          </View>
        </OriginContext.Provider>
      </Animated.ScrollView>

      <View pointerEvents="box-none" style={[styles.header, { paddingTop: insets.top + 6 }]}>
        <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, frostStyle]}>
          <View style={[StyleSheet.absoluteFill, { backgroundColor: c.glassStrong }]} />
          <View style={[styles.hairline, { backgroundColor: c.line }]} />
        </Animated.View>
        <View style={[styles.row, { paddingHorizontal: gutter }]}>
          <PressableScale
            onPress={goBack}
            scaleTo={0.92}
            accessibilityRole="button"
            accessibilityLabel="Back"
            style={[styles.round, { backgroundColor: c.card, borderColor: c.line }]}
          >
            <Ionicons name="chevron-back" size={21} color={c.ink} />
          </PressableScale>
          <Animated.Text
            pointerEvents="none"
            numberOfLines={1}
            style={[type.ui(18, "extrabold", c.ink), styles.smallTitle, smallTitleStyle]}
            accessibilityElementsHidden
            importantForAccessibility="no"
          >
            {title}
          </Animated.Text>
          <View style={styles.right}>{right || <View style={styles.spacer} />}</View>
        </View>
      </View>

      {hideNav ? null : <FloatingNav />}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  titleWrap: { paddingTop: 8, paddingBottom: 16 },
  header: { position: "absolute", top: 0, left: 0, right: 0, paddingBottom: 10, zIndex: 20 },
  hairline: { position: "absolute", left: 0, right: 0, bottom: 0, height: StyleSheet.hairlineWidth },
  row: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", height: 46 },
  round: { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center", borderWidth: StyleSheet.hairlineWidth },
  smallTitle: { position: "absolute", left: 72, right: 72, textAlign: "center" },
  right: { minWidth: 44, alignItems: "flex-end" },
  spacer: { width: 44, height: 44 },
});
