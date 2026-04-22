import React from "react";
import { Platform, StyleSheet, TextInput, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../context/ThemeContext";
import { SEARCH_PLACEHOLDER } from "../../constants/brand";
import { fonts, radius, spacing, typography } from "../../theme/tokens";
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
}) {
  const { colors: c } = useTheme();
  return (
    <View
      style={[
        styles.wrap,
        premium ? styles.wrapPremium : null,
        {
          backgroundColor: premium ? ALCHEMY.cardBg : c.searchBarFill,
          borderColor: premium ? "rgba(201, 162, 39, 0.35)" : c.searchBarBorder,
        },
        premium
          ? platformShadow({
              web: {
                boxShadow:
                  "0 8px 32px rgba(61, 42, 18, 0.1), inset 0 1px 0 rgba(255,255,255,0.85)",
              },
              ios: {
                shadowColor: "#3D2A12",
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.09,
                shadowRadius: 14,
              },
              android: { elevation: 3 },
            })
          : platformShadow({
              web: { boxShadow: "0 4px 20px rgba(28, 25, 23, 0.05), inset 0 1px 0 rgba(255,255,255,0.6)" },
              ios: {
                shadowColor: "#1C1917",
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.04,
                shadowRadius: 8,
              },
              android: { elevation: 1 },
            }),
      ]}
    >
      <Ionicons name="search" size={18} color={premium ? ALCHEMY.brownMuted : c.textMuted} style={styles.searchIcon} />
      <TextInput
        style={[styles.input, { color: c.textPrimary, fontFamily: fonts.regular }]}
        placeholder={placeholder}
        placeholderTextColor={c.textMuted}
        value={value}
        onChangeText={onChangeText}
        returnKeyType="search"
        autoCorrect={false}
        autoCapitalize="none"
        clearButtonMode={Platform.OS === "ios" ? "while-editing" : "never"}
      />
      {value?.trim() && onClear ? (
        <TouchableOpacity onPress={onClear} hitSlop={10} accessibilityLabel="Clear search">
          <Ionicons name="close-circle" size={20} color={c.textMuted} />
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: radius.pill,
    borderWidth: 1,
    paddingLeft: spacing.md,
    paddingRight: spacing.sm,
    paddingVertical: Platform.OS === "web" ? 10 : 8,
  },
  wrapPremium: {
    paddingVertical: Platform.OS === "web" ? 12 : 11,
    paddingLeft: spacing.lg,
  },
  searchIcon: {
    marginRight: spacing.sm,
  },
  input: {
    flex: 1,
    fontSize: typography.body,
    paddingVertical: Platform.OS === "android" ? 4 : 6,
    minHeight: Platform.OS === "web" ? 22 : undefined,
  },
});
