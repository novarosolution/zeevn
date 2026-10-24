import React, { useCallback, useEffect, useRef, useState } from "react";
import { ScrollView, StyleSheet, Text, View, useWindowDimensions } from "react-native";
import Animated, { interpolate, useAnimatedStyle, useSharedValue, withSequence, withSpring, withTiming } from "react-native-reanimated";
import { useStoreTheme, withAlpha } from "../../theme/storefront";
import { hapticTick } from "../../utils/haptics";
import StoreIcon from "./StoreIcon";
import PressableScale from "./PressableScale";

/** When tabs overflow, show this many at once (the fraction lets the next one peek in). */
const VISIBLE_WHEN_SCROLLING = 5.4;
const SPRING = { damping: 22, stiffness: 240, mass: 0.8 };

/** Tab icon on a soft pill that fades in and pops when its tab becomes the active one. */
function TabIcon({ icon, active, size, color, badge }) {
  const { c, type, isDark } = useStoreTheme();
  const scale = useSharedValue(1);
  const glow = useSharedValue(active ? 1 : 0);
  const mounted = useRef(false);
  useEffect(() => {
    glow.value = withTiming(active ? 1 : 0, { duration: 220 });
    if (!mounted.current) {
      mounted.current = true;
      return;
    }
    if (active) scale.value = withSequence(withSpring(1.2, { damping: 7, stiffness: 420 }), withSpring(1, { damping: 10, stiffness: 260 }));
  }, [active, glow, scale]);
  const popStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  const pillStyle = useAnimatedStyle(() => ({
    opacity: glow.value,
    transform: [{ scaleX: interpolate(glow.value, [0, 1], [0.6, 1]) }],
  }));
  return (
    <View style={[styles.iconWrap, { height: size + 12, minWidth: size + 28 }]}>
      <Animated.View
        pointerEvents="none"
        style={[styles.iconPill, { backgroundColor: isDark ? withAlpha(c.brand, 0.16) : c.brandSoft }, pillStyle]}
      />
      <Animated.View style={popStyle}>
        <StoreIcon icon={icon} active={active} size={size} color={color} />
      </Animated.View>
      {badge ? (
        <View style={[styles.badge, { backgroundColor: c.gold }]}>
          <Text style={type.ui(8, "extrabold", "#3A2A0C", { letterSpacing: 0.5 })} numberOfLines={1}>
            {String(badge).toUpperCase()}
          </Text>
        </View>
      ) : null}
    </View>
  );
}

/**
 * Category tabs (icon over label) with a sliding underline.
 * Up to 6 tabs spread evenly; more tabs scroll horizontally and auto-centre the active one.
 */
export default function StoreTabs({ tabs, activeKey, onChange, compact = false, badges, style }) {
  const { c, type, gutter } = useStoreTheme();
  const { width: screenW } = useWindowDimensions();
  const scrollRef = useRef(null);
  const viewW = useRef(0);
  const [layouts, setLayouts] = useState({});
  const x = useSharedValue(0);
  const w = useSharedValue(0);
  const placed = useRef(false);
  const scrolls = tabs.length > 6;
  const scrollTabW = Math.floor((screenW - (gutter - 8)) / VISIBLE_WHEN_SCROLLING);

  const onTabLayout = useCallback((key, e) => {
    const { x: lx, width } = e.nativeEvent.layout;
    setLayouts((prev) => (prev[key]?.x === lx && prev[key]?.width === width ? prev : { ...prev, [key]: { x: lx, width } }));
  }, []);

  useEffect(() => {
    const l = layouts[activeKey];
    if (!l) return;
    const barW = Math.min(l.width * 0.56, 40);
    const barX = l.x + (l.width - barW) / 2;
    if (!placed.current) {
      placed.current = true;
      x.value = barX;
      w.value = barW;
    } else {
      x.value = withSpring(barX, SPRING);
      w.value = withSpring(barW, SPRING);
    }
    if (scrolls && scrollRef.current && viewW.current) {
      scrollRef.current.scrollTo({ x: Math.max(0, l.x - (viewW.current - l.width) / 2), animated: true });
    }
  }, [activeKey, layouts, scrolls, x, w]);

  const barStyle = useAnimatedStyle(() => ({ width: w.value, transform: [{ translateX: x.value }] }));

  const tabNodes = tabs.map((tab) => {
    const active = tab.key === activeKey;
    const color = active ? c.brand : c.inkSoft;
    return (
      <PressableScale scaleTo={0.97} lite
        key={tab.key}
        onLayout={(e) => onTabLayout(tab.key, e)}
        onPress={() => {
          if (!active) hapticTick();
          onChange?.(tab.key);
        }}
        style={[styles.tab, scrolls ? { width: scrollTabW } : styles.tabFlex, compact && styles.tabCompact]}
        accessibilityRole="tab"
        accessibilityState={{ selected: active }}
        accessibilityLabel={tab.label}
      >
        <TabIcon
          icon={active && tab.iconActive ? tab.iconActive : tab.icon}
          active={active}
          size={compact ? 22 : 26}
          color={color}
          badge={badges?.[tab.key]}
        />
        <Text style={type.ui(compact ? 12.5 : 13.5, active ? "extrabold" : "semibold", color)} numberOfLines={1}>
          {tab.label}
        </Text>
      </PressableScale>
    );
  });

  const indicator = <Animated.View style={[styles.bar, { backgroundColor: c.brand }, barStyle]} pointerEvents="none" />;

  return (
    <View style={[styles.wrap, { borderBottomColor: c.line }, style]}>
      {scrolls ? (
        <ScrollView
          ref={scrollRef}
          horizontal
          showsHorizontalScrollIndicator={false}
          onLayout={(e) => {
            viewW.current = e.nativeEvent.layout.width;
          }}
          contentContainerStyle={{ paddingHorizontal: gutter - 8 }}
        >
          <View style={styles.rowScroll}>
            {tabNodes}
            {indicator}
          </View>
        </ScrollView>
      ) : (
        <View style={[styles.row, { paddingHorizontal: gutter - 8 }]}>
          {tabNodes}
          {indicator}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { borderBottomWidth: StyleSheet.hairlineWidth },
  row: { flexDirection: "row", alignItems: "stretch" },
  rowScroll: { flexDirection: "row", alignItems: "stretch" },
  tab: { alignItems: "center", justifyContent: "center", gap: 5, paddingTop: 10, paddingBottom: 12 },
  tabFlex: { flex: 1 },
  tabCompact: { gap: 3, paddingTop: 7, paddingBottom: 9 },
  bar: { position: "absolute", bottom: -0.5, left: 0, height: 3.5, borderTopLeftRadius: 3, borderTopRightRadius: 3 },
  iconWrap: { alignItems: "center", justifyContent: "center" },
  iconPill: { ...StyleSheet.absoluteFillObject, borderRadius: 16 },
  badge: { position: "absolute", top: -5, right: -9, paddingHorizontal: 5, paddingVertical: 1.5, borderRadius: 7 },
});
