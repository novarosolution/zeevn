import React, { useEffect, useRef, useState } from "react";
import { Platform, StyleSheet, Text, View } from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";
import { AUTH_UI } from "../../content/appContent";
import { EASE_IN_OUT, motionTiming } from "../../theme/motion";
import { useStoreTheme } from "../../theme/storefront";
import Glass from "../store/Glass";
import PressableScale from "../store/PressableScale";

const PAD = 4;
const HEIGHT = 52;
const TABS = [
  { route: "Login", label: AUTH_UI.tabSignIn },
  { route: "Register", label: AUTH_UI.tabCreate },
];

const indicatorLift = Platform.select({
  web: { boxShadow: "0 1px 3px rgba(61, 42, 18, 0.16), 0 1px 1px rgba(61, 42, 18, 0.06)" },
  default: null,
});

/**
 * Sign in / Create account switch. The white pill glides to the chosen side, then the route is swapped: both screens share
 * the same hero, so the change reads as the form changing rather than a page turn. `glass` floats it over the hero photo.
 */
export default function AuthRoutePills({ navigation, activeRoute = "Login", glass = false, style }) {
  const { c, r, type, shadow } = useStoreTheme();
  const [width, setWidth] = useState(0);
  const [selected, setSelected] = useState(activeRoute);
  const index = useSharedValue(activeRoute === "Login" ? 0 : 1);
  const timer = useRef(null);
  const segment = Math.max(0, (width - PAD * 2) / 2);

  useEffect(() => () => clearTimeout(timer.current), []);

  const slide = useAnimatedStyle(() => ({ transform: [{ translateX: index.value * segment }] }), [segment]);

  const go = (route, to) => {
    if (route === selected || timer.current) return;
    setSelected(route);
    index.value = withTiming(to, { duration: motionTiming.toggle + 60, easing: EASE_IN_OUT });
    timer.current = setTimeout(() => {
      timer.current = null;
      navigation.replace(route);
    }, 160);
  };

  const track = (
    <View style={styles.track} onLayout={(e) => setWidth(e.nativeEvent.layout.width)} accessibilityRole="tablist">
      {segment > 0 ? (
        <Animated.View
          pointerEvents="none"
          style={[styles.indicator, { width: segment, borderRadius: r.pill, backgroundColor: c.card }, shadow.soft, indicatorLift, slide]}
        />
      ) : null}
      {TABS.map((tab, i) => {
        const on = tab.route === selected;
        return (
          <PressableScale
            key={tab.route}
            onPress={() => go(tab.route, i)}
            scaleTo={0.96}
            style={styles.tab}
            accessibilityRole="tab"
            accessibilityState={{ selected: on }}
            accessibilityLabel={tab.label}
          >
            <Text style={type.ui(14.5, on ? "extrabold" : "bold", on ? c.brand : c.inkMute)} numberOfLines={1}>
              {tab.label}
            </Text>
          </PressableScale>
        );
      })}
    </View>
  );

  if (glass) {
    return (
      <Glass material="regular" radius={HEIGHT / 2} lift style={style}>
        {track}
      </Glass>
    );
  }
  return <View style={[{ backgroundColor: c.soft, borderRadius: r.pill }, style]}>{track}</View>;
}

const styles = StyleSheet.create({
  track: { flexDirection: "row", height: HEIGHT, padding: PAD },
  indicator: { position: "absolute", left: PAD, top: PAD, bottom: PAD },
  tab: { flex: 1, alignItems: "center", justifyContent: "center" },
});
