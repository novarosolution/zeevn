import React, { useCallback, useEffect, useRef } from "react";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import { useNavigation, useNavigationState } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, {
  FadeOut,
  ZoomIn,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { useAuth } from "../../context/AuthContext";
import { useCart } from "../../context/CartContext";
import { STORE_NAV } from "../../content/storefrontContent";
import { STORE_NAV_HEIGHT, useStoreTheme, withAlpha } from "../../theme/storefront";
import { hapticTick } from "../../utils/haptics";
import PressableScale from "./PressableScale";
import StoreIcon from "./StoreIcon";

const FAB_GAP = 10;

function NavItem({ item, active, onPress }) {
  const { c, type } = useStoreTheme();
  const color = active ? c.brand : c.inkSoft;
  return (
    <Pressable
      onPress={onPress}
      style={styles.item}
      accessibilityRole="tab"
      accessibilityState={{ selected: active }}
      accessibilityLabel={item.label}
    >
      {active ? (
        <Animated.View
          entering={ZoomIn.duration(200)}
          exiting={FadeOut.duration(120)}
          style={[styles.capsule, { backgroundColor: withAlpha(c.brand, 0.1) }]}
        />
      ) : null}
      <StoreIcon icon={active && item.iconActive ? item.iconActive : item.icon} active={active} size={23} color={color} />
      <Text style={type.ui(11, active ? "extrabold" : "semibold", color)} numberOfLines={1}>
        {item.label}
      </Text>
    </Pressable>
  );
}

function CartFab({ count, onPress }) {
  const { c, type, shadow, isDark } = useStoreTheme();
  const scale = useSharedValue(1);
  const prev = useRef(count);

  useEffect(() => {
    if (count > prev.current) {
      scale.value = withSequence(withTiming(1.18, { duration: 130 }), withSpring(1, { damping: 7, stiffness: 260 }));
    }
    prev.current = count;
  }, [count, scale]);

  const bumpStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  const colors = isDark ? ["#C9DA8C", "#9DB45B"] : ["#3F6231", "#244424"];
  const iconColor = isDark ? "#18200C" : "#FFFFFF";

  return (
    <Animated.View style={bumpStyle}>
      <PressableScale
        onPress={onPress}
        scaleTo={0.92}
        accessibilityRole="button"
        accessibilityLabel={count > 0 ? `Cart, ${count} items` : "Cart"}
        style={[styles.fabWrap, shadow.float, { backgroundColor: colors[1] }]}
      >
        <View style={[styles.fabClip, { borderColor: withAlpha("#FFFFFF", isDark ? 0.18 : 0.55) }]}>
          <LinearGradient colors={colors} start={{ x: 0.1, y: 0 }} end={{ x: 0.9, y: 1 }} style={StyleSheet.absoluteFill} />
          <StoreIcon icon={STORE_NAV.cart.icon} size={27} color={iconColor} />
        </View>
        {count > 0 ? (
          <Animated.View
            key={count}
            entering={ZoomIn.duration(220)}
            style={[styles.badge, { backgroundColor: c.gold, borderColor: c.page }]}
          >
            <Text style={type.ui(11.5, "extrabold", "#2A1E08")}>{count > 99 ? "99+" : count}</Text>
          </Animated.View>
        ) : null}
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
  const routeName = useNavigationState((state) => state.routes[state.index]?.name);

  const go = useCallback(
    (route, requiresAuth = false) => {
      const destination = requiresAuth && !isAuthenticated ? "Login" : route;
      if (routeName === destination) return;
      hapticTick();
      navigation.navigate(destination);
    },
    [isAuthenticated, navigation, routeName]
  );

  if (Platform.OS === "web") return null;

  const dock = Math.max(16, (insets.bottom || 0) + 6);
  const isActive = (key) => (STORE_NAV.activeRoutes[key] || [key]).includes(routeName);

  return (
    <View style={[styles.wrap, { bottom: dock, left: gutter, right: gutter }]} pointerEvents="box-none">
      <View style={[styles.pillShadow, shadow.float, { borderColor: isDark ? c.line : withAlpha("#FFFFFF", 0.85) }]}>
        <View style={styles.pillClip}>
          <BlurView intensity={isDark ? 45 : 65} tint={isDark ? "dark" : "light"} style={StyleSheet.absoluteFill} />
          <View style={[StyleSheet.absoluteFill, { backgroundColor: c.glass }]} />
          <View style={styles.items}>
            {STORE_NAV.items.map((item) => (
              <NavItem key={item.key} item={item} active={isActive(item.key)} onPress={() => go(item.route, item.requiresAuth)} />
            ))}
          </View>
        </View>
      </View>
      <CartFab count={totalItems} onPress={() => go(STORE_NAV.cart.route, STORE_NAV.cart.requiresAuth)} />
    </View>
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
    borderWidth: 1,
  },
  pillClip: { flex: 1, borderRadius: STORE_NAV_HEIGHT / 2, overflow: "hidden" },
  items: { flex: 1, flexDirection: "row", alignItems: "center", paddingHorizontal: 6 },
  item: { flex: 1, height: 54, alignItems: "center", justifyContent: "center", gap: 3 },
  capsule: { position: "absolute", top: 0, bottom: 0, left: 2, right: 2, borderRadius: 27 },
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
