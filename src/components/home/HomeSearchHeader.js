import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Animated, Platform, Pressable, StyleSheet, Text, TextInput, useWindowDimensions, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { HOME_SEARCH_UI } from "../../content/appContent";
import { usePrefersReducedMotion } from "../../utils/motion";
import { homeType } from "../../styles/typography";
import { spacing as homeSpacing } from "../../styles/spacing";

const PHONE_BREAKPOINT = 600;
const NARROW_FALLBACK_BREAKPOINT = 360;
const SEARCH_MIN_WIDTH = 120;
const DESKTOP_MAX_WIDTH = 720;
const TABLET_ADDRESS_WIDTH = 220;
const SEARCH_MAX_WIDTH = 480;

function getA11yLabel(deliveryAddress) {
  const trimmed = String(deliveryAddress || "").trim();
  if (trimmed) return `Change delivery address, currently ${trimmed}`;
  return HOME_SEARCH_UI.locationCta || "Set delivery address";
}

export default function HomeSearchHeader({
  colors,
  isDark,
  deliveryAddress,
  unreadCount = 0,
  onPressAddress,
  onPressBell,
  onSubmitSearch,
  value,
  onChangeSearch,
}) {
  const { width } = useWindowDimensions();
  const reducedMotion = usePrefersReducedMotion();
  const isPhone = width < PHONE_BREAKPOINT;
  const isWideDesktop = width >= 1024;

  const [inputValue, setInputValue] = useState(String(value || ""));
  const [isFocused, setIsFocused] = useState(false);
  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  const [searchSegmentWidth, setSearchSegmentWidth] = useState(0);
  const placeholderOpacity = useRef(new Animated.Value(1)).current;
  const focusAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    setInputValue(String(value || ""));
  }, [value]);

  const c = colors || {};
  const surface = c.surface || "#FFFFFF";
  const line = c.line || c.border || "#E8E6E1";
  const ink = c.ink || c.textPrimary || "#0E0E0E";
  const muted = c.muted || c.textMuted || "#6B7280";
  const accent = c.accent || c.primary || "#C8A97E";
  const surfaceAlt =
    c.surfaceAlt ||
    (isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.03)");

  const placeholders = useMemo(() => {
    if (Array.isArray(HOME_SEARCH_UI.searchPlaceholders) && HOME_SEARCH_UI.searchPlaceholders.length > 0) {
      return HOME_SEARCH_UI.searchPlaceholders.filter(Boolean);
    }
    return ["Search saffron, ghee, basmati..."];
  }, []);

  const activePlaceholder = placeholders[placeholderIndex % placeholders.length] || placeholders[0];

  useEffect(() => {
    Animated.timing(focusAnim, {
      toValue: isFocused ? 1 : 0,
      duration: 180,
      useNativeDriver: false,
    }).start();
  }, [focusAnim, isFocused]);

  useEffect(() => {
    if (reducedMotion || placeholders.length < 2 || isFocused || inputValue.trim().length > 0) {
      setPlaceholderIndex(0);
      placeholderOpacity.setValue(1);
      return undefined;
    }

    const timer = setInterval(() => {
      Animated.timing(placeholderOpacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start(({ finished }) => {
        if (!finished) return;
        setPlaceholderIndex((prev) => (prev + 1) % placeholders.length);
        Animated.timing(placeholderOpacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }).start();
      });
    }, 4000);

    return () => clearInterval(timer);
  }, [inputValue, isFocused, placeholderOpacity, placeholders, reducedMotion]);

  const useTwoRows =
    isPhone && (width < NARROW_FALLBACK_BREAKPOINT || (searchSegmentWidth > 0 && searchSegmentWidth < SEARCH_MIN_WIDTH));

  const addressText = isPhone
    ? HOME_SEARCH_UI.locationCtaShort || "Set address"
    : HOME_SEARCH_UI.locationCta || "Set delivery address";
  const showChevron = !isPhone;

  const onChangeText = useCallback(
    (text) => {
      setInputValue(text);
      if (typeof onChangeSearch === "function") {
        onChangeSearch(text);
      }
    },
    [onChangeSearch]
  );

  const submitSearch = useCallback(() => {
    const normalized = String(inputValue || "").trim();
    if (!normalized) return;
    if (typeof onSubmitSearch === "function") {
      onSubmitSearch(normalized);
    }
  }, [inputValue, onSubmitSearch]);

  const onSearchLayout = useCallback((event) => {
    setSearchSegmentWidth(Math.round(event.nativeEvent.layout.width || 0));
  }, []);

  const wrapperStyle = useMemo(
    () => [
      styles.outer,
      {
        maxWidth: isWideDesktop ? DESKTOP_MAX_WIDTH : undefined,
        alignSelf: isWideDesktop ? "center" : "stretch",
      },
    ],
    [isWideDesktop]
  );

  const rowGap = isPhone ? homeSpacing.sm : homeSpacing.md;
  const focusBackground = focusAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [surfaceAlt, surface],
  });
  const focusBorder = focusAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [line, ink],
  });

  const bellLabel =
    unreadCount > 0
      ? HOME_SEARCH_UI.notificationsA11yLabelWithCount?.(unreadCount) || `Notifications, ${unreadCount} unread`
      : HOME_SEARCH_UI.notificationsA11yLabel || "Notifications";

  const addressPressLabel = getA11yLabel(deliveryAddress);

  const renderAddressChip = (fillRow = false) => (
    <Pressable
      onPress={onPressAddress}
      style={({ pressed }) => [
        styles.addressChip,
        {
          borderColor: line,
          paddingHorizontal: isPhone ? homeSpacing.md : homeSpacing.base,
          width: !isPhone ? TABLET_ADDRESS_WIDTH : undefined,
          maxWidth: isPhone && !fillRow ? "40%" : undefined,
          flexGrow: fillRow ? 1 : 0,
          backgroundColor: pressed ? surfaceAlt : "transparent",
          opacity: pressed ? 0.92 : 1,
        },
      ]}
      accessibilityRole="button"
      accessibilityLabel={addressPressLabel}
      hitSlop={2}
    >
      <Ionicons name="location-outline" size={16} color={ink} />
      <Text style={[styles.addressText, { color: ink }]} numberOfLines={1} ellipsizeMode="tail">
        {addressText}
      </Text>
      {showChevron ? <Ionicons name="chevron-down" size={14} color={muted} /> : null}
    </Pressable>
  );

  return (
    <View style={wrapperStyle}>
      <View
        style={[
          styles.container,
          {
            borderColor: line,
            backgroundColor: surface,
          },
        ]}
      >
        {useTwoRows ? (
          <View style={{ gap: homeSpacing.sm }}>
            <View style={[styles.row, { gap: homeSpacing.sm }]}>
              {renderAddressChip(true)}
              <Pressable
                onPress={onPressBell}
                style={({ pressed }) => [
                  styles.bellButton,
                  {
                    borderColor: line,
                    backgroundColor: pressed ? surfaceAlt : "transparent",
                    opacity: pressed ? 0.92 : 1,
                  },
                ]}
                accessibilityRole="button"
                accessibilityLabel={bellLabel}
                hitSlop={2}
              >
                <Ionicons name="notifications-outline" size={18} color={ink} />
                {unreadCount > 0 ? (
                  <View
                    style={[
                      styles.unreadDot,
                      {
                        backgroundColor: accent,
                        borderColor: surface,
                      },
                    ]}
                  />
                ) : null}
              </Pressable>
            </View>
            <Animated.View
              onLayout={onSearchLayout}
              style={[
                styles.searchWrap,
                {
                  width: "100%",
                  backgroundColor: focusBackground,
                  borderColor: focusBorder,
                },
              ]}
            >
              <Ionicons name="search-outline" size={16} color={muted} />
              <Animated.View style={[styles.placeholderContainer, { opacity: reducedMotion ? 1 : placeholderOpacity }]}>
                <TextInput
                  style={[styles.input, { color: ink }]}
                  value={inputValue}
                  onChangeText={onChangeText}
                  onSubmitEditing={submitSearch}
                  onFocus={() => setIsFocused(true)}
                  onBlur={() => setIsFocused(false)}
                  placeholder={placeholders[0]}
                  placeholderTextColor={muted}
                  returnKeyType="search"
                  clearButtonMode="while-editing"
                  accessibilityLabel={HOME_SEARCH_UI.searchA11yLabel || "Search products"}
                />
              </Animated.View>
            </Animated.View>
          </View>
        ) : (
          <View style={[styles.row, { gap: rowGap }]}>
            {renderAddressChip(false)}
            <Animated.View
              onLayout={onSearchLayout}
              style={[
                styles.searchWrap,
                {
                  flex: 1,
                  minWidth: SEARCH_MIN_WIDTH,
                  maxWidth: isPhone ? undefined : SEARCH_MAX_WIDTH,
                  backgroundColor: focusBackground,
                  borderColor: focusBorder,
                },
              ]}
            >
              <Ionicons name="search-outline" size={16} color={muted} />
              <Animated.View style={[styles.placeholderContainer, { opacity: reducedMotion ? 1 : placeholderOpacity }]}>
                <TextInput
                  style={[styles.input, { color: ink }]}
                  value={inputValue}
                  onChangeText={onChangeText}
                  onSubmitEditing={submitSearch}
                  onFocus={() => setIsFocused(true)}
                  onBlur={() => setIsFocused(false)}
                  placeholder={activePlaceholder}
                  placeholderTextColor={muted}
                  returnKeyType="search"
                  clearButtonMode="while-editing"
                  accessibilityLabel={HOME_SEARCH_UI.searchA11yLabel || "Search products"}
                />
              </Animated.View>
            </Animated.View>
            <Pressable
              onPress={onPressBell}
              style={({ pressed }) => [
                styles.bellButton,
                {
                  borderColor: line,
                  backgroundColor: pressed ? surfaceAlt : "transparent",
                  opacity: pressed ? 0.92 : 1,
                },
              ]}
              accessibilityRole="button"
              accessibilityLabel={bellLabel}
              hitSlop={2}
            >
              <Ionicons name="notifications-outline" size={18} color={ink} />
              {unreadCount > 0 ? (
                <View
                  style={[
                    styles.unreadDot,
                    {
                      backgroundColor: accent,
                      borderColor: surface,
                    },
                  ]}
                />
              ) : null}
            </Pressable>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  outer: {
    width: "100%",
  },
  container: {
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: homeSpacing.sm,
    paddingVertical: homeSpacing.sm,
    ...Platform.select({
      web: {
        boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
      },
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.04,
        shadowRadius: 2,
      },
      android: {
        elevation: 1,
      },
    }),
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    minWidth: 0,
  },
  addressChip: {
    height: 40,
    borderWidth: 1,
    borderRadius: 999,
    flexDirection: "row",
    alignItems: "center",
    minWidth: 0,
    gap: homeSpacing.xs,
  },
  addressText: {
    flexShrink: 1,
    fontSize: 14,
    fontFamily: homeType.uiMedium.fontFamily,
    fontWeight: "500",
  },
  searchWrap: {
    height: 40,
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: homeSpacing.base,
    flexDirection: "row",
    alignItems: "center",
    gap: homeSpacing.sm,
    minWidth: SEARCH_MIN_WIDTH,
  },
  placeholderContainer: {
    flex: 1,
  },
  input: {
    flex: 1,
    minWidth: 0,
    fontSize: 14,
    fontFamily: homeType.uiRegular.fontFamily,
    paddingVertical: 0,
  },
  bellButton: {
    width: 40,
    height: 40,
    borderWidth: 1,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    position: "relative",
  },
  unreadDot: {
    position: "absolute",
    top: homeSpacing.sm,
    right: homeSpacing.sm,
    width: 8,
    height: 8,
    borderRadius: 999,
    borderWidth: 2,
  },
});
