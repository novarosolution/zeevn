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
import { EASE_OUT, motionSettle, motionTiming } from "../../theme/motion";
import { STORE_NAV_HEIGHT, useStoreTheme, withAlpha } from "../../theme/storefront";
import { hapticTick } from "../../utils/haptics";
import { flightRemainingMs, setCartTarget } from "./flyToCart";
import Glass from "./Glass";
import PressableScale from "./PressableScale";
import ScrollEdgeFade from "./ScrollEdgeFade";
import StoreIcon from "./StoreIcon";

const FAB_GAP = 8;
const ITEMS_PAD = 4;
const ICON = 22;
const CAPSULE_INSET = 6;

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
  const color = active ? c.brand : withAlpha(c.ink, 0.6);
  return (
    <PressableScale
      onPress={onPress}
      scaleTo={0.97}
      lite
      style={styles.item}
      accessibilityRole="tab"
      accessibilityState={{ selected: active }}
      accessibilityLabel={item.label}
      hitSlop={10}
    >
      <StoreIcon icon={active && item.iconActive ? item.iconActive : item.icon} active={active} size={ICON} color={color} />
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
      <Text style={type.ui(10, "extrabold", "#2A1E08")}>{count > 99 ? "99+" : count}</Text>
    </Animated.View>
  );
}

function CartFab({ count: liveCount, onPress }) {
  const { isDark } = useStoreTheme();
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
        style={[
          styles.fabWrap,
          {
            backgroundColor: colors[1],
            shadowColor: colors[1],
            shadowOpacity: isDark ? 0.34 : 0.3,
            shadowRadius: 14,
            shadowOffset: { width: 0, height: 6 },
            elevation: 8,
          },
        ]}
      >
        <View style={[styles.fabClip, { borderColor: withAlpha("#FFFFFF", isDark ? 0.18 : 0.4) }]}>
          <LinearGradient colors={colors} start={{ x: 0.1, y: 0 }} end={{ x: 0.9, y: 1 }} style={StyleSheet.absoluteFill} />
          <LinearGradient
            pointerEvents="none"
            colors={[withAlpha("#FFFFFF", isDark ? 0.36 : 0.24), withAlpha("#FFFFFF", 0)]}
            style={styles.fabGloss}
          />
          <StoreIcon icon={STORE_NAV.cart.icon} size={ICON} color={iconColor} />
        </View>
        {count > 0 ? <CartBadge count={count} /> : null}
      </PressableScale>
    </Animated.View>
  );
}

/**
 * Floating bottom navigation: a glass pill (Home · Categories · Order Again · Account) whose active tab sits in a lighter
 * glass "lens" that glides between tabs, plus a round olive cart button with a live item badge.
 */
export default function FloatingNav() {
  const { isDark, gutter } = useStoreTheme();
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
    capsuleX.value = withSpring(activeIndex * slot, motionSettle.settle);
    capsuleOpacity.value = withSpring(1, motionSettle.press);
    lastActiveIndex = activeIndex;
  }, [activeIndex, slot, capsuleOpacity, capsuleX]);

  const capsuleStyle = useAnimatedStyle(() => ({
    opacity: capsuleOpacity.value,
    transform: [{ translateX: capsuleX.value }],
  }));

  if (Platform.OS === "web") return null;

  // Sits just above the home-indicator zone, like the system's own floating tab bar.
  const dock = Math.max(14, (insets.bottom || 0) - 4);
  const lensFill = isDark ? withAlpha("#FFFFFF", 0.16) : withAlpha("#FFFFFF", 0.9);
  const lensEdge = isDark ? withAlpha("#FFFFFF", 0.26) : "#FFFFFF";

  return (
    <>
      <ScrollEdgeFade height={dock + STORE_NAV_HEIGHT + 30} />
      <View style={[styles.wrap, { bottom: dock, left: gutter, right: gutter }]} pointerEvents="box-none">
        <Glass material="thin" radius={STORE_NAV_HEIGHT / 2} lift style={styles.pill} contentStyle={styles.pillBody}>
          <View style={styles.items} onLayout={(e) => setRowWidth(e.nativeEvent.layout.width)}>
            <Animated.View
              pointerEvents="none"
              style={[
                styles.lens,
                {
                  left: ITEMS_PAD + CAPSULE_INSET,
                  width: Math.max(28, slot - CAPSULE_INSET * 2),
                  backgroundColor: lensFill,
                  borderColor: lensEdge,
                  shadowColor: isDark ? "#000000" : "#3D2A12",
                  shadowOpacity: isDark ? 0.3 : 0.12,
                },
                capsuleStyle,
              ]}
            />
            {STORE_NAV.items.map((item) => (
              <NavItem key={item.key} item={item} active={isActive(item.key)} onPress={() => go(item.route, item.requiresAuth)} />
            ))}
          </View>
        </Glass>
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
  pill: { flex: 1, height: STORE_NAV_HEIGHT },
  pillBody: { flex: 1 },
  items: { flex: 1, flexDirection: "row", alignItems: "center", paddingHorizontal: ITEMS_PAD },
  item: { flex: 1, height: STORE_NAV_HEIGHT, alignItems: "center", justifyContent: "center" },
  lens: {
    position: "absolute",
    top: CAPSULE_INSET,
    height: STORE_NAV_HEIGHT - CAPSULE_INSET * 2,
    borderRadius: (STORE_NAV_HEIGHT - CAPSULE_INSET * 2) / 2,
    borderWidth: StyleSheet.hairlineWidth,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
  },
  fabWrap: {
    width: STORE_NAV_HEIGHT,
    height: STORE_NAV_HEIGHT,
    borderRadius: STORE_NAV_HEIGHT / 2,
  },
  fabClip: {
    flex: 1,
    borderRadius: STORE_NAV_HEIGHT / 2,
    borderWidth: StyleSheet.hairlineWidth,
    borderTopColor: "rgba(255,255,255,0.45)",
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
  fabGloss: { position: "absolute", top: 0, left: 0, right: 0, height: "55%" },
  badge: {
    position: "absolute",
    top: -2,
    right: -2,
    minWidth: 18,
    height: 18,
    paddingHorizontal: 4,
    borderRadius: 9,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
});
