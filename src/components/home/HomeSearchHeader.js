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
  deliveryPromise,
  isScrolled = false,
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
  const [rowWidth, setRowWidth] = useState(0);
  const placeholderOpacity = useRef(new Animated.Value(1)).current;
  const focusAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    setInputValue(String(value || ""));
  }, [value]);

  const c = colors || {};
  const surface = c.surface;
  const line = c.line || c.border;
  const ink = c.ink || c.textPrimary;
  const muted = c.muted || c.textMuted;
  const inkSoft = c.inkSoft || c.textSecondary;
  const accent = isDark ? c.accent : c.accentOnLight || c.accent;
  const surfaceAlt = c.surfaceAlt;

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
        useNativeDriver: false,
      }).start(({ finished }) => {
        if (!finished) return;
        setPlaceholderIndex((prev) => (prev + 1) % placeholders.length);
        Animated.timing(placeholderOpacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: false,
        }).start();
      });
    }, 4000);

    return () => clearInterval(timer);
  }, [inputValue, isFocused, placeholderOpacity, placeholders, reducedMotion]);

  const addressWidthPx = rowWidth > 0 ? Math.max(120, Math.floor(rowWidth * 0.38)) : undefined;
  const effectiveSearchWidth = rowWidth > 0 ? rowWidth - (addressWidthPx || 0) - 40 - homeSpacing.sm * 2 : searchSegmentWidth;
  const useTwoRows =
    isPhone &&
    (width < NARROW_FALLBACK_BREAKPOINT ||
      (effectiveSearchWidth > 0 && effectiveSearchWidth < SEARCH_MIN_WIDTH));

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
      Platform.OS === "web"
        ? {
            width: "100%",
            maxWidth: isWideDesktop ? DESKTOP_MAX_WIDTH : undefined,
            alignSelf: isWideDesktop ? "center" : "stretch",
            minWidth: 0,
          }
        : {
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

  const resolvedPromiseLine =
    String(deliveryPromise || "").trim() || "Reliable doorstep delivery";

  const renderAddressChip = (fillRow = false) => (
    <Pressable
      onPress={onPressAddress}
      style={({ pressed }) => [
        styles.addressChip,
        {
          borderColor: line,
          paddingHorizontal: isPhone ? homeSpacing.md : homeSpacing.base,
          width: isPhone ? addressWidthPx : TABLET_ADDRESS_WIDTH,
          maxWidth: isPhone && !fillRow ? addressWidthPx || "38%" : undefined,
          flexGrow: fillRow ? 1 : 0,
          backgroundColor: pressed ? surfaceAlt : surface,
          opacity: pressed ? 0.92 : 1,
        },
      ]}
      accessibilityRole="button"
      accessibilityLabel={addressPressLabel}
      hitSlop={2}
    >
      <Ionicons name="location-outline" size={16} color={ink} style={styles.addressIcon} />
      <View style={styles.addressTextWrap}>
        <Text style={[styles.addressText, { color: ink }]} numberOfLines={1} ellipsizeMode="tail">
          {addressText}
        </Text>
        <Text style={[styles.addressPromiseText, { color: inkSoft }]} numberOfLines={1} ellipsizeMode="tail">
          {resolvedPromiseLine}
        </Text>
      </View>
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
            borderBottomColor: isScrolled ? accent : line,
            borderBottomWidth: isScrolled ? 1 : StyleSheet.hairlineWidth,
            ...(isScrolled
              ? Platform.select({
                  web: {
                    backdropFilter: "saturate(180%) blur(14px)",
                    WebkitBackdropFilter: "saturate(180%) blur(14px)",
                    backgroundColor: c.surfaceOverlay || surface,
                  },
                  default: {
                    backgroundColor: surface,
                  },
                })
              : null),
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
          <View style={[styles.row, { gap: rowGap }]} onLayout={(event) => setRowWidth(Math.round(event.nativeEvent.layout.width || 0))}>
            {renderAddressChip(false)}
            <Animated.View
              onLayout={onSearchLayout}
              style={[
                styles.searchWrap,
                {
                  flex: 1,
                  minWidth: SEARCH_MIN_WIDTH,
                  maxWidth: isPhone ? undefined : SEARCH_MAX_WIDTH,
                  backgroundColor: surfaceAlt,
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
    ...Platform.select({
      web: { minWidth: 0 },
      default: {},
    }),
  },
  container: {
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: homeSpacing.sm,
    paddingVertical: homeSpacing.sm,
    ...Platform.select({
      web: {
        boxShadow: "0 1px 2px rgba(14,23,41,0.08)",
      },
      ios: {
        shadowColor: "#0E1729",
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
    minHeight: 40,
    borderWidth: 1,
    borderRadius: 999,
    flexDirection: "row",
    alignItems: "center",
    minWidth: 0,
    gap: homeSpacing.xs,
  },
  addressIcon: {
    alignSelf: "center",
  },
  addressTextWrap: {
    flex: 1,
    minWidth: 0,
    justifyContent: "center",
  },
  addressText: {
    flexShrink: 1,
    fontSize: 13,
    fontFamily: homeType.uiMedium.fontFamily,
    fontWeight: "500",
  },
  addressPromiseText: {
    fontSize: 10,
    lineHeight: 12,
    fontFamily: homeType.uiRegular.fontFamily,
    marginTop: 1,
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
