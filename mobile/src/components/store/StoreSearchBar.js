import React, { memo, useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useIsFocused } from "@react-navigation/native";
import Animated, { FadeInDown, FadeOutUp, useReducedMotion } from "react-native-reanimated";
import { STORE_HEADER } from "../../content/storefrontContent";
import { useStoreTheme, withAlpha } from "../../theme/storefront";
import PressableScale from "./PressableScale";

/** How long each suggestion stays before the next one slides in. */
const ROTATE_MS = 3400;

function useRotatingHint(hints, enabled) {
  const [index, setIndex] = useState(0);
  useEffect(() => {
    if (!enabled || hints.length < 2) return undefined;
    const id = setInterval(() => setIndex((n) => (n + 1) % hints.length), ROTATE_MS);
    return () => clearInterval(id);
  }, [enabled, hints.length]);
  return hints.length ? hints[index % hints.length] : "";
}

/**
 * Search pill with a gold hairline. The suggestion ("A2 desi cow ghee", "kachi ghani mustard oil", …) slides
 * to the next one every few seconds — still while the screen is covered or with "reduce motion".
 */
function StoreSearchBar({ onPress, hints = [], prefix = "Search", compact = false, style }) {
  const { c, type, shadow, isDark } = useStoreTheme();
  const focused = useIsFocused();
  const reduced = useReducedMotion();
  const hint = useRotatingHint(hints, !compact && focused && !reduced);
  const height = compact ? 44 : 52;
  const radius = height / 2;
  const size = compact ? 14.5 : 15.5;

  return (
    <PressableScale
      onPress={onPress}
      scaleTo={0.99}
      lite
      accessibilityRole="search"
      accessibilityLabel={STORE_HEADER.a11y.search}
      style={[
        styles.bar,
        compact ? null : shadow.soft,
        {
          height,
          borderRadius: radius,
          backgroundColor: compact ? c.soft : c.card,
          borderColor: compact ? "transparent" : withAlpha(c.gold, isDark ? 0.5 : 0.6),
          borderWidth: compact ? 0 : 1,
        },
        style,
      ]}
    >
      <View style={[styles.searchGlyph, { backgroundColor: compact ? c.brandSoft : c.goldSoft }]}>
        <Ionicons name="search" size={compact ? 15 : 17} color={compact ? c.brand : c.goldText} />
      </View>
      <View style={styles.textWrap}>
        <Text style={type.ui(size, "medium", c.inkMute)} numberOfLines={1}>
          {prefix}
        </Text>
        {hint ? (
          <Animated.Text
            key={hint}
            entering={FadeInDown.duration(260)}
            exiting={FadeOutUp.duration(180)}
            style={[type.ui(size, "semibold", c.ink), styles.hint]}
            numberOfLines={1}
          >
            {`"${hint}"`}
          </Animated.Text>
        ) : null}
      </View>
    </PressableScale>
  );
}

export default memo(StoreSearchBar);

const styles = StyleSheet.create({
  bar: { flexDirection: "row", alignItems: "center", paddingHorizontal: 10, gap: 10 },
  searchGlyph: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
  },
  textWrap: { flex: 1, minWidth: 0, flexDirection: "row", alignItems: "center", gap: 5 },
  hint: { flexShrink: 1 },
});
