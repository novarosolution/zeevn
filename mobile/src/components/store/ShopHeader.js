import React, { useCallback, useEffect, useRef, useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, { FadeIn, FadeOut } from "react-native-reanimated";
import { useStoreTheme, withAlpha } from "../../theme/storefront";
import PressableScale from "./PressableScale";

const SEARCH_DEBOUNCE_MS = 140;

function RoundButton({ icon, onPress, label, active = false }) {
  const { c, shadow } = useStoreTheme();
  return (
    <PressableScale
      onPress={onPress}
      scaleTo={0.92}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={[styles.round, shadow.soft, { backgroundColor: active ? c.brand : c.card, borderColor: c.line }]}
    >
      <Ionicons name={icon} size={20} color={active ? c.onBrand : c.ink} />
    </PressableScale>
  );
}

/**
 * Shop header — back, title with “Delivering to …” line, share and search.
 * Search expands in place into a text field.
 */
export default function ShopHeader({
  title,
  deliveringLabel,
  searching,
  searchValue,
  searchPlaceholder,
  onBack,
  onShare,
  onToggleSearch,
  onSearchChange,
  onLocationPress,
}) {
  const { c, type, isDark, gutter } = useStoreTheme();
  const insets = useSafeAreaInsets();
  const inputRef = useRef(null);

  // The field keeps its own text so typing never waits on the product grid re-rendering;
  // the parent hears about it a beat after the last keystroke.
  const [text, setText] = useState(searchValue || "");
  const lastSent = useRef(searchValue || "");
  const timer = useRef(null);

  const push = useCallback(
    (value) => {
      clearTimeout(timer.current);
      lastSent.current = value;
      onSearchChange?.(value);
    },
    [onSearchChange]
  );
  const handleChange = (value) => {
    setText(value);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => push(value), SEARCH_DEBOUNCE_MS);
  };
  const handleClear = () => {
    setText("");
    push("");
  };

  // Pick up changes made elsewhere (Clear all, removing the search chip, cancelling search).
  useEffect(() => {
    const incoming = searchValue || "";
    if (incoming !== lastSent.current) {
      clearTimeout(timer.current);
      lastSent.current = incoming;
      setText(incoming);
    }
  }, [searchValue]);

  useEffect(() => () => clearTimeout(timer.current), []);

  useEffect(() => {
    if (!searching) return undefined;
    const id = setTimeout(() => inputRef.current?.focus?.(), 120);
    return () => clearTimeout(id);
  }, [searching]);

  return (
    <View style={[styles.wrap, { paddingTop: insets.top + 6, borderBottomColor: c.line, backgroundColor: c.page }]}>
      <View style={[styles.row, { paddingHorizontal: gutter }]}>
        <RoundButton icon="chevron-back" onPress={onBack} label="Back" />

        {searching ? (
          <Animated.View entering={FadeIn.duration(160)} exiting={FadeOut.duration(100)} style={[styles.searchBox, { backgroundColor: c.soft }]}>
            <Ionicons name="search" size={18} color={c.inkSoft} />
            <TextInput
              ref={inputRef}
              value={text}
              onChangeText={handleChange}
              onSubmitEditing={() => push(text)}
              placeholder={searchPlaceholder}
              placeholderTextColor={c.inkMute}
              returnKeyType="search"
              autoCorrect={false}
              autoCapitalize="none"
              style={[type.ui(15.5, "medium", c.ink), styles.input]}
            />
            {text ? (
              <Pressable onPress={handleClear} hitSlop={10} accessibilityRole="button" accessibilityLabel="Clear search">
                <Ionicons name="close-circle" size={18} color={c.inkMute} />
              </Pressable>
            ) : null}
          </Animated.View>
        ) : (
          <Pressable onPress={onLocationPress} style={styles.titleBox} accessibilityRole="button" accessibilityLabel={`${title}. ${deliveringLabel}`}>
            <Text style={type.display(21, { ls: -0.3, lh: 25 })} numberOfLines={1} accessibilityRole="header">
              {title}
            </Text>
            <View style={[styles.subPill, { backgroundColor: withAlpha(c.brand, isDark ? 0.14 : 0.07) }]}>
              <Text style={[type.ui(11.5, "medium", c.inkSoft), styles.subText]} numberOfLines={1}>
                <Text style={type.ui(11.5, "bold", c.brand)}>{deliveringLabel.split(":")[0]}:</Text>
                {deliveringLabel.includes(":") ? ` ${deliveringLabel.split(":").slice(1).join(":").trim()}` : ""}
              </Text>
              <Ionicons name="chevron-down" size={12} color={c.inkSoft} />
            </View>
          </Pressable>
        )}

        {searching ? (
          <Pressable onPress={onToggleSearch} hitSlop={8} accessibilityRole="button" accessibilityLabel="Cancel search">
            <Text style={type.ui(14.5, "bold", c.brand)}>Cancel</Text>
          </Pressable>
        ) : (
          <>
            <RoundButton icon="share-outline" onPress={onShare} label="Share" />
            <RoundButton icon="search" onPress={onToggleSearch} label="Search" />
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { zIndex: 20, paddingBottom: 10, borderBottomWidth: StyleSheet.hairlineWidth, overflow: "hidden" },
  row: { flexDirection: "row", alignItems: "center", gap: 10 },
  round: { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center", borderWidth: StyleSheet.hairlineWidth },
  titleBox: { flex: 1, minWidth: 0, gap: 3 },
  subPill: { flexDirection: "row", alignItems: "center", alignSelf: "flex-start", gap: 4, paddingHorizontal: 9, paddingVertical: 3, borderRadius: 11, maxWidth: "100%" },
  subText: { flexShrink: 1 },
  searchBox: { flex: 1, height: 44, borderRadius: 22, flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 14 },
  input: { flex: 1, paddingVertical: 0, minHeight: 22 },
});
