import React, { useCallback, useEffect, useRef, useState } from "react";
import { Platform, StyleSheet, Text, View, useWindowDimensions } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useNavigation, useRoute } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, {
  FadeIn,
  FadeOut,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { useAuth } from "../../context/AuthContext";
import { useCart } from "../../context/CartContext";
import { STORE_NAV } from "../../content/storefrontContent";
import { EASE_IN_OUT, EASE_OUT, motionSettle, motionTiming } from "../../theme/motion";
import { STORE_NAV_HEIGHT, useStoreTheme, withAlpha } from "../../theme/storefront";
import { hapticTick } from "../../utils/haptics";
import { flightRemainingMs, setCartTarget } from "./flyToCart";
import PressableScale from "./PressableScale";
import ScrollEdgeFade from "./ScrollEdgeFade";
import StoreIcon from "./StoreIcon";

const FAB_GAP = 10;
const ITEMS_PAD = 6;

/** The active-tab capsule moves across the bar: ease-in-out, quick, no overshoot (this bar is touched all day). */
const CAPSULE_GLIDE = { duration: motionTiming.toggle + 60, easing: EASE_IN_OUT };
/** Layout-animation builders live at module scope: rebuilding them in render costs every re-render. */
const BADGE_IN = FadeIn.duration(motionTiming.press + 30).easing(EASE_OUT);
const BADGE_OUT = FadeOut.duration(motionTiming.press);

/** The active tab on the previous screen, so the highlight can glide from there instead of popping in. */
let lastActiveIndex = -1;

/** Cart count as the shopper sees it: while a product is still flying to the button, the old number stays. */
function useLandedCount(count) {
  const [shown, setShown] = useState(count);
  useEffect(() => {
    const wait = count > shown ? flightRemainingMs() : 0;
    if (!wait) {
      setShown(count);
      return undefined;
    }
    const id = setTimeout(() => setShown(count), wait);
    return () => clearTimeout(id);
    // `shown` is intentionally not a dependency: only a change of the real count schedules an update.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [count]);
  return shown;
}

function NavItem({ item, active, onPress }) {
  const { c } = useStoreTheme();
  const color = active ? c.brand : c.inkSoft;
  return (
    <PressableScale
      onPress={onPress}
      scaleTo={0.88}
      lite
      style={styles.item}
      accessibilityRole="tab"
      accessibilityState={{ selected: active }}
      accessibilityLabel={item.label}
      hitSlop={6}
    >
      <StoreIcon icon={active && item.iconActive ? item.iconActive : item.icon} active={active} size={32} color={color} />
    </PressableScale>
  );
}

/** The count on the cart button. It stays mounted while the count changes and pops once, instead of re-entering every time. */
function CartBadge({ count }) {
  const { c, type } = useStoreTheme();
  const pop = useSharedValue(1);
  const prev = useRef(count);

  useEffect(() => {
    if (count !== prev.current && prev.current > 0) {
      pop.value = withSequence(withTiming(1.16, { duration: 90, easing: EASE_OUT }), withSpring(1, motionSettle.bump));
    }
    prev.current = count;
  }, [count, pop]);

  const popStyle = useAnimatedStyle(() => ({ transform: [{ scale: pop.value }] }));
  return (
    <Animated.View
      entering={BADGE_IN}
      exiting={BADGE_OUT}
      style={[styles.badge, { backgroundColor: c.gold, borderColor: c.page }, popStyle]}
    >
      <Text style={type.ui(11.5, "extrabold", "#2A1E08")}>{count > 99 ? "99+" : count}</Text>
    </Animated.View>
  );
}

function CartFab({ count: liveCount, onPress }) {
  const { shadow, isDark } = useStoreTheme();
  const count = useLandedCount(liveCount);
  const scale = useSharedValue(1);
  const prev = useRef(count);
  const fabRef = useRef(null);
  const reportTarget = useCallback(() => {
    fabRef.current?.measureInWindow?.((x, y, width, height) => setCartTarget({ x, y, width, height }));
  }, []);

  useEffect(() => {
    if (count > prev.current) {
      scale.value = withSequence(withTiming(1.1, { duration: 100, easing: EASE_OUT }), withSpring(1, motionSettle.bump));
    }
    prev.current = count;
  }, [count, scale]);

  const bumpStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  const colors = isDark ? ["#C9DA8C", "#9DB45B"] : ["#3F6231", "#244424"];
  const iconColor = isDark ? "#18200C" : "#FFFFFF";

  return (
    <Animated.View ref={fabRef} collapsable={false} onLayout={reportTarget} style={bumpStyle}>
      <PressableScale
        onPress={onPress}
        scaleTo={0.92}
        accessibilityRole="button"
        accessibilityLabel={liveCount > 0 ? `Cart, ${liveCount} items` : "Cart"}
        style={[styles.fabWrap, shadow.float, { backgroundColor: colors[1] }]}
      >
        <View style={[styles.fabClip, { borderColor: withAlpha("#FFFFFF", isDark ? 0.18 : 0.55) }]}>
          <LinearGradient colors={colors} start={{ x: 0.1, y: 0 }} end={{ x: 0.9, y: 1 }} style={StyleSheet.absoluteFill} />
          <StoreIcon icon={STORE_NAV.cart.icon} size={30} color={iconColor} />
        </View>
        {count > 0 ? <CartBadge count={count} /> : null}
      </PressableScale>
    </Animated.View>
  );
}

/**
 * Floating bottom navigation: a frosted-glass pill (Home · Categories · Order Again · Account)
 * plus a round cart button with a live item badge. Replaces the old full-width tab bar on native.
 */
export default function FloatingNav() {
  const { c, shadow, isDark, gutter } = useStoreTheme();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { isAuthenticated } = useAuth();
  const { totalItems } = useCart();
  // This screen's own route, not the navigator's focused one: while the next (lazily loaded) screen is still mounting, the
  // navigator already points at it, which would move this bar's highlight early and leave the new bar nothing to glide from.
  const routeName = useRoute().name;

  const go = useCallback(
    (route, requiresAuth = false) => {
      const destination = requiresAuth && !isAuthenticated ? "Login" : route;
      if (routeName === destination) return;
      hapticTick();
      navigation.navigate(destination);
    },
    [isAuthenticated, navigation, routeName]
  );

  const isActive = (key) => (STORE_NAV.activeRoutes[key] || [key]).includes(routeName);
  const activeIndex = STORE_NAV.items.findIndex((item) => isActive(item.key));
  const { width: windowW } = useWindowDimensions();
  // The slot width is known from the geometry before any layout pass. That lets the capsule render on the very first frame
  // of a screen change, already sitting on the previous tab, and glide across (waiting for onLayout hid the glide entirely).
  const estimatedRow = windowW - gutter * 2 - FAB_GAP - STORE_NAV_HEIGHT - 2 * (StyleSheet.hairlineWidth + 0.5);
  const [rowWidth, setRowWidth] = useState(estimatedRow);
  const slot = (rowWidth - ITEMS_PAD * 2) / STORE_NAV.items.length;
  const startIndex = lastActiveIndex >= 0 ? lastActiveIndex : Math.max(activeIndex, 0);
  const capsuleX = useSharedValue(startIndex * slot);
  const capsuleOpacity = useSharedValue(activeIndex >= 0 ? 1 : 0);

  useEffect(() => {
    if (activeIndex < 0) {
      capsuleOpacity.value = withTiming(0, { duration: motionTiming.press + 30, easing: EASE_OUT });
      return;
    }
    capsuleX.value = withTiming(activeIndex * slot, CAPSULE_GLIDE);
    capsuleOpacity.value = withTiming(1, { duration: motionTiming.toggle, easing: EASE_OUT });
    lastActiveIndex = activeIndex;
  }, [activeIndex, slot, capsuleOpacity, capsuleX]);

  const capsuleStyle = useAnimatedStyle(() => ({
    opacity: capsuleOpacity.value,
    transform: [{ translateX: capsuleX.value }],
  }));

  if (Platform.OS === "web") return null;

  const dock = Math.max(16, (insets.bottom || 0) + 6);

  /** Soft glass without live blur — one BlurView on the dock used to hitch scroll. */
  const glassFill = isDark ? withAlpha("#1A1712", 0.88) : withAlpha("#FFFFFF", 0.9);
  const glassBorder = isDark ? withAlpha("#FFFFFF", 0.14) : withAlpha("#FFFFFF", 0.85);

  return (
    <>
      <ScrollEdgeFade height={dock + STORE_NAV_HEIGHT + 30} />
      <View style={[styles.wrap, { bottom: dock, left: gutter, right: gutter }]} pointerEvents="box-none">
        <View style={[styles.pillShadow, shadow.float, { borderColor: glassBorder }]}>
          <View style={styles.pillClip}>
            <View style={[StyleSheet.absoluteFill, { backgroundColor: glassFill }]} />
            <LinearGradient
              colors={[withAlpha("#FFFFFF", isDark ? 0.1 : 0.55), withAlpha("#FFFFFF", 0)]}
              style={styles.glassSheen}
              pointerEvents="none"
            />
            <View style={styles.items} onLayout={(e) => setRowWidth(e.nativeEvent.layout.width)}>
              <Animated.View
                pointerEvents="none"
                style={[
                  styles.capsule,
                  {
                    left: ITEMS_PAD + 2,
                    width: slot - 4,
                    backgroundColor: withAlpha(c.brand, isDark ? 0.22 : 0.14),
                    borderColor: withAlpha(c.brand, 0.18),
                  },
                  capsuleStyle,
                ]}
              />
              {STORE_NAV.items.map((item) => (
                <NavItem key={item.key} item={item} active={isActive(item.key)} onPress={() => go(item.route, item.requiresAuth)} />
              ))}
            </View>
          </View>
        </View>
        <CartFab count={totalItems} onPress={() => go(STORE_NAV.cart.route, STORE_NAV.cart.requiresAuth)} />
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: "absolute",
    flexDirection: "row",
    alignItems: "center",
    gap: FAB_GAP,
    zIndex: 100,
  },
  pillShadow: {
    flex: 1,
    height: STORE_NAV_HEIGHT,
    borderRadius: STORE_NAV_HEIGHT / 2,
    borderWidth: StyleSheet.hairlineWidth + 0.5,
    overflow: "hidden",
  },
  pillClip: { flex: 1, borderRadius: STORE_NAV_HEIGHT / 2, overflow: "hidden" },
  glassSheen: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: "48%",
  },
  items: { flex: 1, flexDirection: "row", alignItems: "center", paddingHorizontal: ITEMS_PAD },
  item: { flex: 1, height: STORE_NAV_HEIGHT - 8, alignItems: "center", justifyContent: "center" },
  capsule: {
    position: "absolute",
    top: 5,
    height: STORE_NAV_HEIGHT - 10,
    borderRadius: (STORE_NAV_HEIGHT - 10) / 2,
    borderWidth: StyleSheet.hairlineWidth,
  },
  fabWrap: {
    width: STORE_NAV_HEIGHT,
    height: STORE_NAV_HEIGHT,
    borderRadius: STORE_NAV_HEIGHT / 2,
  },
  fabClip: {
    flex: 1,
    borderRadius: STORE_NAV_HEIGHT / 2,
    borderWidth: 2.5,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
  badge: {
    position: "absolute",
    top: -3,
    right: -3,
    minWidth: 24,
    height: 24,
    paddingHorizontal: 5,
    borderRadius: 12,
    borderWidth: 2.5,
    alignItems: "center",
    justifyContent: "center",
  },
});
