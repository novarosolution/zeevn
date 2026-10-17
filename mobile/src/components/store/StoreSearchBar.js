import React, { useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Animated, { FadeInDown, FadeOutUp } from "react-native-reanimated";
import { useStoreTheme } from "../../theme/storefront";
import PressableScale from "./PressableScale";

const ROTATE_MS = 2800;

/**
 * Tappable search pill with a rotating “Search "A2 desi cow ghee"” hint.
 * `compact` is the slimmer variant used in the pinned scroll header.
 */
export default function StoreSearchBar({ onPress, hints = [], prefix = "Search", compact = false, style }) {
  const { c, type, shadow } = useStoreTheme();
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (hints.length < 2) return undefined;
    const id = setInterval(() => setIndex((i) => (i + 1) % hints.length), ROTATE_MS);
    return () => clearInterval(id);
  }, [hints.length]);

  const hint = hints[index % Math.max(hints.length, 1)] || "";
  const height = compact ? 44 : 52;

  return (
    <PressableScale
      onPress={onPress}
      scaleTo={0.985}
      accessibilityRole="search"
      accessibilityLabel="Search products"
      style={[
        styles.bar,
        compact ? shadow.none : shadow.card,
        {
          height,
          borderRadius: height / 2,
          backgroundColor: compact ? c.soft : c.card,
          borderColor: compact ? "transparent" : c.line,
        },
        style,
      ]}
    >
      <Ionicons name="search" size={compact ? 18 : 20} color={c.ink} />
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
              style={type.ui(compact ? 14.5 : 15.5, "semibold", c.inkSoft)}
            >
              {`"${hint}"`}
            </Animated.Text>
          ) : null}
        </View>
      </View>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 16,
    borderWidth: StyleSheet.hairlineWidth,
  },
  textWrap: { flex: 1, minWidth: 0, flexDirection: "row", alignItems: "center", height: 24 },
  hintClip: { flex: 1, minWidth: 0, height: 24, justifyContent: "center", overflow: "hidden" },
});
