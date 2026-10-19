import React, { memo } from "react";
import { StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { STORE_HEADER } from "../../content/storefrontContent";
import { useStoreTheme } from "../../theme/storefront";
import PressableScale from "./PressableScale";

/** Search pill — solid surfaces only (no gradient rim). */
function StoreSearchBar({ onPress, hints = [], prefix = "Search", compact = false, style }) {
  const { c, type, shadow, isDark } = useStoreTheme();
  const hint = hints[0] || "";
  const height = compact ? 44 : 52;
  const radius = height / 2;

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
          borderColor: compact ? "transparent" : c.line,
          borderWidth: compact ? 0 : StyleSheet.hairlineWidth,
        },
        style,
      ]}
    >
      <View
        style={[
          styles.searchGlyph,
          { backgroundColor: compact ? c.brandSoft : isDark ? c.goldSoft : c.goldSoft },
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
  textWrap: { flex: 1, minWidth: 0 },
});
