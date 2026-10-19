import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { STORE_HEADER } from "../../content/storefrontContent";
import { useStoreTheme, withAlpha } from "../../theme/storefront";
import PressableScale from "./PressableScale";

const RIM = 1.5;

/** Search pill — solid surfaces only (no blur / rotating hint timers). */
export default function StoreSearchBar({ onPress, hints = [], prefix = "Search", compact = false, style }) {
  const { c, type, shadow, isDark } = useStoreTheme();
  const hint = hints[0] || "";
  const height = compact ? 44 : 54;
  const radius = height / 2;
  const inner = (
    <>
      <View
        style={[
          styles.searchGlyph,
          { backgroundColor: compact ? c.brandSoft : isDark ? withAlpha(c.gold, 0.16) : c.goldSoft },
        ]}
      >
        <Ionicons name="search" size={compact ? 15 : 17} color={compact ? c.brand : c.goldText} />
      </View>
      <View style={styles.textWrap}>
        <Text style={type.ui(compact ? 14.5 : 15.5, "medium", c.inkMute)} numberOfLines={1}>
          {prefix}{" "}
          <Text style={type.ui(compact ? 14.5 : 15.5, "semibold", c.ink)}>{hint ? `"${hint}"` : ""}</Text>
        </Text>
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
        style={[styles.bar, { height, borderRadius: radius, backgroundColor: c.soft }, style]}
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
      style={[shadow.card, { height, borderRadius: radius, backgroundColor: c.card }, style]}
    >
      <LinearGradient
        colors={[withAlpha(c.gold, isDark ? 0.55 : 0.8), withAlpha(c.gold, isDark ? 0.12 : 0.18), withAlpha(c.gold, isDark ? 0.4 : 0.55)]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[StyleSheet.absoluteFill, { borderRadius: radius }]}
      />
      <View style={[styles.bar, { margin: RIM, borderRadius: radius - RIM, backgroundColor: c.card, height: height - RIM * 2 }]}>
        {inner}
      </View>
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
  textWrap: { flex: 1, minWidth: 0 },
});
