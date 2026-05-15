import React, { useEffect, useRef } from "react";
import { Animated, Platform, Pressable, StyleSheet, TextInput, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../context/ThemeContext";
import { SEARCH_PLACEHOLDER } from "../../constants/brand";
import { fonts, getSemanticColors, icon, semanticRadius, spacing, typography } from "../../theme/tokens";
import { platformShadow } from "../../theme/shadowPlatform";
import { ALCHEMY } from "../../theme/customerAlchemy";

/**
 * Zepto/Blinkit-style pill search: grey fill, search icon, optional clear.
 * `premium` — editorial gold/cream treatment for the home hero.
 */
export default function QCommerceSearchField({
  value,
  onChangeText,
  placeholder = SEARCH_PLACEHOLDER,
  onClear,
  premium = false,
  onFocus,
  onBlur,
  onSubmitEditing,
  accessibilityLabel = "Search products",
  containerStyle,
  inputStyle,
}) {
  const { colors: c } = useTheme();
  const semantic = getSemanticColors(c);
  const placeholderOpacity = useRef(new Animated.Value(1)).current;
  const didMountRef = useRef(false);

  useEffect(() => {
    if (!didMountRef.current) {
      didMountRef.current = true;
      return;
    }
    if (String(value || "").trim().length > 0) return;
    placeholderOpacity.setValue(0);
    Animated.timing(placeholderOpacity, {
      toValue: 1,
      duration: 200,
      useNativeDriver: true,
    }).start();
  }, [placeholder, placeholderOpacity, value]);

  return (
    <Pressable
      style={({ hovered }) => [
        styles.wrap,
        premium ? styles.wrapPremium : null,
        {
          backgroundColor: premium ? "#FAFAF7" : c.searchBarFill,
          borderColor: premium ? "rgba(100, 116, 139, 0.2)" : c.searchBarBorder,
        },
        hovered && Platform.OS === "web"
          ? { borderColor: premium ? "rgba(100, 116, 139, 0.3)" : semantic.border.accent, backgroundColor: c.surface }
          : null,
        premium
          ? platformShadow({
              web: {
                boxShadow:
                  "0 10px 34px rgba(24, 24, 27, 0.12), inset 0 1px 0 rgba(255,255,255,0.85)",
              },
              ios: {
                shadowColor: "#18181B",
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.09,
                shadowRadius: 14,
              },
              android: { elevation: 3 },
            })
          : platformShadow({
              web: { boxShadow: "0 6px 22px rgba(28, 25, 23, 0.06), inset 0 1px 0 rgba(255,255,255,0.65)" },
              ios: {
                shadowColor: "#1C1917",
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.04,
                shadowRadius: 8,
              },
              android: { elevation: 1 },
            }),
        containerStyle,
      ]}
    >
      <Ionicons
        name="search-outline"
        size={20}
        color={premium ? ALCHEMY.brownMuted : semantic.text.secondary}
        style={styles.searchIcon}
      />
      <Animated.View style={[styles.inputWrap, { opacity: placeholderOpacity }]}>
        <TextInput
          style={[styles.input, { color: c.textPrimary, fontFamily: fonts.regular }, inputStyle]}
          placeholder={placeholder}
          placeholderTextColor={semantic.text.secondary}
          value={value}
          onChangeText={onChangeText}
          onFocus={onFocus}
          onBlur={onBlur}
          onSubmitEditing={onSubmitEditing}
          returnKeyType="search"
          autoCorrect={false}
          autoCapitalize="none"
          clearButtonMode={Platform.OS === "ios" ? "while-editing" : "never"}
          accessibilityLabel={accessibilityLabel}
        />
      </Animated.View>
      {value?.trim() && onClear ? (
        <TouchableOpacity onPress={onClear} hitSlop={10} accessibilityLabel="Clear search" style={styles.clearBtn}>
          <Ionicons name="close-circle-outline" size={icon.md} color={semantic.text.secondary} />
        </TouchableOpacity>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: semanticRadius.full,
    borderWidth: 1,
    paddingLeft: spacing.md,
    paddingRight: spacing.sm,
    paddingVertical: Platform.OS === "web" ? 10 : 8,
    ...Platform.select({
      web: { transition: "border-color 0.18s ease, background-color 0.18s ease, box-shadow 0.18s ease" },
      default: {},
    }),
  },
  wrapPremium: {
    paddingVertical: Platform.OS === "web" ? 13 : 12,
    paddingLeft: spacing.lg,
  },
  searchIcon: {
    marginRight: spacing.sm,
    opacity: 0.9,
  },
  input: {
    fontSize: typography.body,
    paddingVertical: Platform.OS === "android" ? 5 : 6,
    minHeight: Platform.OS === "web" ? 22 : undefined,
  },
  inputWrap: {
    flex: 1,
    minWidth: 0,
  },
  clearBtn: {
    borderRadius: semanticRadius.full,
    padding: 2,
  },
});
