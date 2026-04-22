import React, { useEffect, useMemo, useRef, useState } from "react";
import { Animated, Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { useNavigation, useNavigationState } from "@react-navigation/native";
import { fonts, radius, spacing, typography } from "../theme/tokens";
import { platformShadow } from "../theme/shadowPlatform";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { ALCHEMY } from "../theme/customerAlchemy";

const useNativeDriver = Platform.OS !== "web";

function TabItem({ label, icon, iconActive, active, onPress, badge, colors }) {
  const scale = useRef(new Animated.Value(active ? 1.06 : 1)).current;
  const lift = useRef(new Animated.Value(active ? -1 : 0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scale, {
        toValue: active ? 1.06 : 1,
        useNativeDriver,
        tension: 160,
        friction: 12,
      }),
      Animated.spring(lift, {
        toValue: active ? -1 : 0,
        useNativeDriver,
        tension: 160,
        friction: 12,
      }),
    ]).start();
  }, [active, lift, scale]);

  const handlePressIn = () => {
    Animated.spring(scale, {
      toValue: 0.95,
      useNativeDriver,
      tension: 200,
      friction: 12,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scale, {
      toValue: active ? 1.06 : 1,
      useNativeDriver,
      tension: 160,
      friction: 12,
    }).start();
  };

  return (
    <Animated.View style={{ transform: [{ scale }, { translateY: lift }] }}>
      <Pressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={[styles.tabItem, active ? styles.tabItemActive : null]}
      >
        <View style={styles.iconWrap}>
          <Ionicons
            name={active && iconActive ? iconActive : icon}
            size={18}
            color={active ? colors.primary : colors.textMuted}
          />
          {badge ? (
            <View style={[styles.badge, { backgroundColor: colors.primary }]}>
              <Text style={[styles.badgeText, { color: colors.onPrimary, fontFamily: fonts.extrabold }]}>{badge}</Text>
            </View>
          ) : null}
        </View>
        <Text
          style={[
            styles.tabLabel,
            { color: active ? colors.textPrimary : colors.textSecondary, fontFamily: active ? fonts.bold : fonts.semibold },
          ]}
        >
          {label}
        </Text>
      </Pressable>
    </Animated.View>
  );
}

export default function BottomNavBar() {
  if (Platform.OS === "web") {
    return null;
  }

  const { colors, isDark } = useTheme();
  const navigation = useNavigation();
  const { totalItems } = useCart();
  const { isAuthenticated } = useAuth();
  const currentRouteName = useNavigationState((state) => state.routes[state.index]?.name);
  const [barWidth, setBarWidth] = useState(0);
  const indicatorX = useRef(new Animated.Value(0)).current;

  const navigateTab = (targetRoute, requiresAuth = false) => {
    const destination = requiresAuth && !isAuthenticated ? "Login" : targetRoute;
    if (currentRouteName === destination) {
      return;
    }
    navigation.navigate(destination);
  };

  const tabs = [
    {
      key: "Home",
      label: "Home",
      icon: "home-outline",
      iconActive: "home",
      onPress: () => navigateTab("Home"),
    },
    {
      key: "Cart",
      label: "Cart",
      icon: "bag-outline",
      iconActive: "bag",
      onPress: () => navigateTab("Cart", true),
      badge: totalItems > 0 ? String(totalItems) : "",
    },
    {
      key: "Profile",
      label: "Profile",
      icon: "person-outline",
      iconActive: "person",
      onPress: () => navigateTab("Profile", true),
    },
  ];
  const activeIndex = useMemo(() => {
    const foundIndex = tabs.findIndex((tab) => tab.key === currentRouteName);
    return foundIndex >= 0 ? foundIndex : 0;
  }, [tabs, currentRouteName]);
  const tabWidth = barWidth > 0 ? (barWidth - spacing.sm * 2) / tabs.length : 0;
  const indicatorWidth = tabWidth > 0 ? Math.max(0, tabWidth - 12) : 0;

  useEffect(() => {
    if (!tabWidth) return;
    Animated.spring(indicatorX, {
      toValue: activeIndex * tabWidth + 6,
      useNativeDriver,
      tension: 140,
      friction: 14,
    }).start();
  }, [activeIndex, tabWidth, indicatorX]);

  const barSurface = useMemo(
    () =>
      StyleSheet.create({
        mobileBar: {
          flexDirection: "row",
          borderRadius: radius.xxl,
          borderWidth: StyleSheet.hairlineWidth,
          borderTopWidth: 2,
          borderTopColor: ALCHEMY.gold,
          borderColor: isDark ? "rgba(201, 162, 39, 0.22)" : "rgba(116, 79, 28, 0.18)",
          backgroundColor: isDark ? "rgba(26,22,20,0.97)" : "rgba(255,252,248,0.97)",
          paddingVertical: 8,
          paddingHorizontal: spacing.sm,
          justifyContent: "space-around",
          overflow: "hidden",
          ...platformShadow({
            web: { boxShadow: "0 18px 40px rgba(61, 42, 18, 0.12), 0 6px 16px rgba(28, 25, 23, 0.06)" },
            ios: {
              shadowColor: colors.shadow,
              shadowOffset: { width: 0, height: 14 },
              shadowOpacity: isDark ? 0.45 : 0.1,
              shadowRadius: 24,
            },
            android: { elevation: 9 },
          }),
        },
        activeIndicator: {
          position: "absolute",
          top: 8,
          bottom: 8,
          left: spacing.sm,
          borderRadius: radius.md,
          backgroundColor: isDark ? colors.primarySoft : "rgba(116, 79, 28, 0.14)",
          borderWidth: 1,
          borderColor: isDark ? colors.primaryBorder : ALCHEMY.pillInactive,
        },
      }),
    [colors, isDark]
  );

  return (
    <View style={styles.mobileContainer}>
      <BlurView
        intensity={isDark ? 55 : 85}
        tint={isDark ? "dark" : "light"}
        style={barSurface.mobileBar}
        onLayout={(event) => setBarWidth(event.nativeEvent.layout.width)}
      >
        <View style={[styles.glassShine, isDark && { backgroundColor: "rgba(255,255,255,0.06)" }]} />
        {indicatorWidth > 0 ? (
          <Animated.View
            style={[
              barSurface.activeIndicator,
              {
                width: indicatorWidth,
                pointerEvents: "none",
                transform: [{ translateX: indicatorX }],
              },
            ]}
          />
        ) : null}
        {tabs.map((tab) => (
          <TabItem
            key={tab.key}
            label={tab.label}
            icon={tab.icon}
            iconActive={tab.iconActive}
            onPress={tab.onPress}
            active={currentRouteName === tab.key}
            badge={tab.badge}
            colors={colors}
          />
        ))}
      </BlurView>
    </View>
  );
}

const styles = StyleSheet.create({
  mobileContainer: {
    position: "absolute",
    left: spacing.md,
    right: spacing.md,
    bottom: spacing.md,
  },
  glassShine: {
    position: "absolute",
    left: 10,
    right: 10,
    top: 4,
    height: 20,
    borderRadius: radius.pill,
    backgroundColor: "rgba(255,255,255,0.28)",
  },
  tabItem: {
    alignItems: "center",
    justifyContent: "center",
    minWidth: 58,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.sm,
  },
  tabItemActive: {
    backgroundColor: "transparent",
    borderWidth: 0,
  },
  iconWrap: {
    position: "relative",
  },
  tabLabel: {
    marginTop: 2,
    fontSize: typography.overline + 1,
    letterSpacing: 0.2,
  },
  badge: {
    position: "absolute",
    top: -6,
    right: -10,
    minWidth: 15,
    height: 15,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 3,
  },
  badgeText: {
    fontSize: typography.overline,
  },
});
