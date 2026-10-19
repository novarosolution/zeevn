import React, { useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import Animated, { FadeInDown, FadeOutUp } from "react-native-reanimated";
import { STORE_HEADER } from "../../content/storefrontContent";
import { useStoreTheme, withAlpha } from "../../theme/storefront";
import PressableScale from "./PressableScale";

const ROTATE_MS = 2800;
const RIM = 1.5;

/**
 * Tappable search pill with a rotating “Search "A2 desi cow ghee"” hint. The full-size bar has a fine gold rim;
 * `compact` is the slimmer, flat variant used in the pinned scroll header.
 */
export default function StoreSearchBar({ onPress, hints = [], prefix = "Search", compact = false, style }) {
  const { c, type, shadow, isDark } = useStoreTheme();
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (hints.length < 2) return undefined;
    const id = setInterval(() => setIndex((i) => (i + 1) % hints.length), ROTATE_MS);
    return () => clearInterval(id);
  }, [hints.length]);

  const hint = hints[index % Math.max(hints.length, 1)] || "";
  const height = compact ? 44 : 54;
  const inner = (
    <>
      <View style={[styles.searchGlyph, { backgroundColor: compact ? c.brandSoft : isDark ? withAlpha(c.gold, 0.16) : c.goldSoft }]}>
        <Ionicons name="search" size={compact ? 15 : 17} color={compact ? c.brand : c.goldText} />
      </View>
      <View style={styles.textWrap}>
        <Text style={type.ui(compact ? 14.5 : 15.5, "medium", c.inkMute)} numberOfLines={1}>
          {prefix}{" "}
        </Text>
        <View style={styles.hintClip}>
          {hint ? (
            <Animated.Text
              key={hint}
              entering={FadeInDown.duration(320)}
              exiting={FadeOutUp.duration(240)}
              numberOfLines={1}
              style={type.ui(compact ? 14.5 : 15.5, "semibold", c.ink)}
            >
              {`"${hint}"`}
            </Animated.Text>
          ) : null}
        </View>
      </View>
    </>
  );

  if (compact) {
    return (
      <PressableScale
        onPress={onPress}
        scaleTo={0.985}
        accessibilityRole="search"
        accessibilityLabel={STORE_HEADER.a11y.search}
        style={[styles.bar, { height, borderRadius: height / 2, backgroundColor: c.soft }, style]}
      >
        {inner}
      </PressableScale>
    );
  }

  return (
    <PressableScale
      onPress={onPress}
      scaleTo={0.985}
      accessibilityRole="search"
      accessibilityLabel={STORE_HEADER.a11y.search}
      style={[shadow.card, { height, borderRadius: height / 2, backgroundColor: c.card }, style]}
    >
      <LinearGradient
        colors={[withAlpha(c.gold, isDark ? 0.6 : 0.85), withAlpha(c.gold, isDark ? 0.14 : 0.2), withAlpha(c.gold, isDark ? 0.42 : 0.6)]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[StyleSheet.absoluteFill, { borderRadius: height / 2 }]}
      />
      <View style={[styles.bar, { margin: RIM, borderRadius: height / 2 - RIM, backgroundColor: c.card }]}>{inner}</View>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  bar: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 10,
  },
  searchGlyph: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
  },
  textWrap: { flex: 1, minWidth: 0, flexDirection: "row", alignItems: "center", height: 24 },
  hintClip: { flex: 1, minWidth: 0, height: 24, justifyContent: "center", overflow: "hidden" },
});
