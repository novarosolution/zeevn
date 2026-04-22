import React from "react";
import { Platform, Pressable, StyleSheet, Text, useWindowDimensions, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { layout, radius, spacing, typography, fonts } from "../theme/tokens";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { WEB_HEADER_HEIGHT } from "../theme/web";
import { SEARCH_PLACEHOLDER } from "../constants/brand";
import { ALCHEMY } from "../theme/customerAlchemy";
import BrandHeaderMark from "./BrandHeaderMark";
import LocationIconButton from "./LocationIconButton";

/**
 * Desktop top navigation (web): sticky, minimal, search affordance, cart + profile.
 */
function routeMatchesNav(navKey, routeName) {
  if (!routeName) return false;
  if (navKey === routeName) return true;
  if (navKey === "Home" && routeName === "Product") {
    return true;
  }
  if (navKey === "Settings" && (routeName === "EditProfile" || routeName === "ManageAddress")) {
    return true;
  }
  if (
    navKey === "Profile" &&
    (routeName === "MyOrders" || routeName === "Notifications" || routeName === "Support")
  ) {
    return true;
  }
  return false;
}

export default function WebAppHeader({ currentRouteName, navigationRef }) {
  const { colors, isDark, shadowLift } = useTheme();
  const { width: windowWidth } = useWindowDimensions();
  const compactNav = windowWidth < 720;

  if (Platform.OS !== "web") {
    return null;
  }

  const { totalItems } = useCart();
  const { isAuthenticated } = useAuth();

  const go = (name, requiresAuth = false) => {
    const dest = requiresAuth && !isAuthenticated ? "Login" : name;
    if (currentRouteName !== dest && navigationRef?.isReady?.()) {
      navigationRef.navigate(dest);
    }
  };

  const items = [
    { key: "Home", label: "Home", icon: "home-outline", iconActive: "home", onPress: () => go("Home") },
    {
      key: "Cart",
      label: "Cart",
      icon: "bag-outline",
      iconActive: "bag",
      onPress: () => go("Cart", true),
      badge: totalItems > 0 ? String(totalItems) : "",
    },
    {
      key: "Settings",
      label: "Settings",
      icon: "settings-outline",
      iconActive: "settings",
      onPress: () => go("Settings", true),
    },
    {
      key: "Profile",
      label: "Account",
      icon: "person-outline",
      iconActive: "person",
      onPress: () => go("Profile", true),
    },
  ];

  return (
    <View style={styles.shell} accessibilityRole="navigation">
      <View
        style={[
          styles.glassInner,
          {
            backgroundColor: isDark ? "rgba(20,18,16,0.96)" : "rgba(255,252,248,0.94)",
            borderBottomColor: colors.border,
          },
          shadowLift,
        ]}
      >
        <LinearGradient
          colors={[ALCHEMY.gold, "#D4AF37", ALCHEMY.brown]}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={styles.chromeTopAccent}
          pointerEvents="none"
        />
        <View style={styles.inner}>
          <View style={styles.brandCluster}>
            <BrandHeaderMark navigationRef={navigationRef} compact={false} />
            <LocationIconButton navigationRef={navigationRef} size={20} />
          </View>

          <Pressable
            onPress={() => go("Home")}
            style={({ hovered, pressed }) => [
              styles.searchFake,
              {
                borderColor: colors.searchBarBorder,
                backgroundColor: colors.searchBarFill,
              },
              hovered && { borderColor: colors.primaryBorder, backgroundColor: colors.surface },
              pressed && { opacity: 0.92 },
            ]}
            accessibilityRole="button"
            accessibilityLabel="Search products"
          >
            <Ionicons name="search" size={15} color={colors.textMuted} />
            <Text style={[styles.searchFakeText, { color: colors.textMuted, fontFamily: fonts.medium }]} numberOfLines={1}>
              {SEARCH_PLACEHOLDER}
            </Text>
          </Pressable>

          <View style={styles.navRow}>
            {items.map((item) => {
              const active = routeMatchesNav(item.key, currentRouteName);
              return (
                <Pressable
                  key={item.key}
                  onPress={item.onPress}
                  style={({ hovered, pressed }) => [
                    styles.navItem,
                    active && {
                      backgroundColor: colors.primarySoft,
                      borderWidth: 1,
                      borderColor: colors.primaryBorder,
                    },
                    !active && hovered && { backgroundColor: colors.surfaceMuted },
                    pressed && { opacity: 0.9 },
                  ]}
                  accessibilityRole="tab"
                  accessibilityState={{ selected: active }}
                >
                  <View style={styles.navIconWrap}>
                    <Ionicons
                      name={active && item.iconActive ? item.iconActive : item.icon}
                      size={16}
                      color={active ? colors.primary : colors.textSecondary}
                    />
                    {item.badge ? (
                      <View style={[styles.badge, { backgroundColor: colors.primary }]}>
                        <Text style={[styles.badgeText, { fontFamily: fonts.extrabold, color: colors.onPrimary }]}>{item.badge}</Text>
                      </View>
                    ) : null}
                  </View>
                  {!compactNav ? (
                    <Text
                      style={[
                        styles.navLabel,
                        {
                          color: active ? colors.textPrimary : colors.textSecondary,
                          fontFamily: active ? fonts.bold : fonts.semibold,
                        },
                      ]}
                    >
                      {item.label}
                    </Text>
                  ) : null}
                </Pressable>
              );
            })}
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  shell: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
    height: WEB_HEADER_HEIGHT,
    ...Platform.select({
      web: { backdropFilter: "blur(16px)" },
      default: {},
    }),
  },
  chromeTopAccent: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 3,
    zIndex: 1,
    opacity: 0.95,
  },
  glassInner: {
    flex: 1,
    position: "relative",
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  inner: {
    flex: 1,
    maxWidth: layout.maxContentWidth,
    width: "100%",
    alignSelf: "center",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.md,
    paddingVertical: 2,
    gap: spacing.sm,
  },
  brandCluster: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    flexShrink: 0,
  },
  searchFake: {
    flex: 1,
    maxWidth: 400,
    minWidth: 100,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 4,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.lg,
    borderWidth: 1,
    ...Platform.select({ web: { cursor: "pointer", transition: "border-color 0.2s ease, background 0.2s ease" }, default: {} }),
  },
  searchFakeText: {
    flex: 1,
    fontSize: typography.caption,
  },
  navRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    flexShrink: 0,
  },
  navItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 5,
    paddingHorizontal: spacing.xs,
    borderRadius: radius.sm,
    ...Platform.select({ web: { cursor: "pointer" }, default: {} }),
  },
  navIconWrap: {
    position: "relative",
  },
  navLabel: {
    fontSize: typography.bodySmall,
    letterSpacing: 0.12,
  },
  badge: {
    position: "absolute",
    top: -6,
    right: -10,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
  },
  badgeText: {
    fontSize: 10,
  },
});
