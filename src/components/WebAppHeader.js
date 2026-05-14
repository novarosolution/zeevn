import React, { useEffect, useRef, useState } from "react";
import { Platform, Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useAnimatedReaction, runOnJS } from "react-native-reanimated";
import { gsap } from "gsap";
import {
  breakpoints,
  fonts,
  getSemanticColors,
  icon,
  semanticRadius,
  spacing,
  typography,
} from "../theme/tokens";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { WEB_HEADER_HEIGHT, WEB_Z_INDEX } from "../theme/web";
import { CUSTOMER_PAGE_MAX_WIDTH } from "../theme/screenLayout";
import { SEARCH_PLACEHOLDER } from "../constants/brand";
import { CUSTOMER_NAV_LINKS } from "../content/appContent";
import BrandHeaderMark from "./BrandHeaderMark";
import LocationIconButton from "./LocationIconButton";
import useReducedMotion from "../hooks/useReducedMotion";
import useScrollOffset from "../hooks/useScrollOffset";
import { getAdminMenuFlatLinks, isAdminRouteName } from "../constants/adminNav";

const COMPACT_SCROLL_THRESHOLD = 80;

/** Sticky desktop nav (web). Kept intentionally calmer so pages carry the visual weight. */
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
  if (navKey === "Delivery" && routeName === "DeliveryDashboard") {
    return true;
  }
  if (navKey === "Admin" && isAdminRouteName(routeName)) {
    return true;
  }
  return false;
}

export default function WebAppHeader({ navigationRef }) {
  const { colors, isDark, shadowLift, shadowPremium } = useTheme();
  const semantic = getSemanticColors(colors);
  const { width: windowWidth } = useWindowDimensions();
  const { totalItems } = useCart();
  const { isAuthenticated, user } = useAuth();
  const [adminMenuOpen, setAdminMenuOpen] = useState(false);
  const adminWrapRef = useRef(null);
  const reducedMotion = useReducedMotion();
  const shellRef = useRef(null);
  const brandRef = useRef(null);
  const searchRef = useRef(null);
  const navRefs = useRef([]);
  const cartBadgeRef = useRef(null);
  const progressRef = useRef(null);
  const prevTotalItemsRef = useRef(totalItems);
  const [compact, setCompact] = useState(false);
  const [currentRouteName, setCurrentRouteName] = useState(
    navigationRef?.getCurrentRoute?.()?.name
  );
  const { scrollY } = useScrollOffset({ trackWindow: true });

  useEffect(() => {
    if (!navigationRef?.addListener) return undefined;
    const syncRoute = () => {
      setCurrentRouteName(navigationRef?.getCurrentRoute?.()?.name);
    };
    syncRoute();
    const unsubscribe = navigationRef.addListener("state", syncRoute);
    return () => {
      if (typeof unsubscribe === "function") unsubscribe();
    };
  }, [navigationRef]);

  useEffect(() => {
    setAdminMenuOpen(false);
  }, [currentRouteName]);

  useEffect(() => {
    if (Platform.OS !== "web" || !adminMenuOpen || typeof document === "undefined") return undefined;
    const onDocDown = (e) => {
      const node = adminWrapRef.current;
      const t = e?.target;
      if (node && t && typeof node.contains === "function" && !node.contains(t)) {
        setAdminMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", onDocDown);
    return () => document.removeEventListener("mousedown", onDocDown);
  }, [adminMenuOpen]);

  const compactNav = windowWidth < breakpoints.md;
  const isPhoneWeb = windowWidth < 760;

  const go = React.useCallback((name, requiresAuth = false) => {
    const dest = requiresAuth && !isAuthenticated ? "Login" : name;
    if (currentRouteName !== dest && navigationRef?.isReady?.()) {
      navigationRef.navigate(dest);
    }
  }, [currentRouteName, isAuthenticated, navigationRef]);

  const goAdmin = React.useCallback(
    (routeName) => {
      setAdminMenuOpen(false);
      if (navigationRef?.isReady?.()) {
        navigationRef.navigate(routeName);
      }
    },
    [navigationRef]
  );

  const adminFlatLinks = React.useMemo(() => getAdminMenuFlatLinks(), []);

  const items = React.useMemo(() => {
    const deliveryNavItem = user?.isDeliveryPartner
      ? [
          {
            key: "Delivery",
            label: "Delivery",
            icon: "bicycle-outline",
            iconActive: "bicycle",
            onPress: () => go("DeliveryDashboard", true),
          },
        ]
      : [];
    const adminNavItem = user?.isAdmin
      ? [
          {
            key: "Admin",
            label: "Admin",
            icon: "shield-checkmark-outline",
            iconActive: "shield-checkmark",
            onPress: () => setAdminMenuOpen((o) => !o),
            adminMenu: true,
          },
        ]
      : [];
    return [
      {
        key: "Home",
        label: CUSTOMER_NAV_LINKS.home.label,
        icon: "home-outline",
        iconActive: "home",
        onPress: () => go("Home"),
      },
      ...deliveryNavItem,
      ...adminNavItem,
      {
        key: "Cart",
        label: CUSTOMER_NAV_LINKS.cart.label,
        icon: "bag-outline",
        iconActive: "bag",
        onPress: () => go("Cart", true),
        badge: totalItems > 0 ? String(totalItems) : "",
      },
      {
        key: "Settings",
        label: CUSTOMER_NAV_LINKS.settings.label,
        icon: "settings-outline",
        iconActive: "settings",
        onPress: () => go("Settings", true),
      },
      {
        key: "Profile",
        label: CUSTOMER_NAV_LINKS.profile.label,
        icon: "person-outline",
        iconActive: "person",
        onPress: () => go("Profile", true),
      },
    ];
  }, [go, totalItems, user?.isDeliveryPartner, user?.isAdmin]);

  const itemCount = items.length;

  useEffect(() => {
    if (Platform.OS !== "web" || reducedMotion) {
      return undefined;
    }
    const tl = gsap.timeline({ defaults: { ease: "power3.out" } });
    if (shellRef.current) {
      tl.fromTo(shellRef.current, { y: -26 }, { y: 0, duration: 0.52 });
    }
    if (brandRef.current) {
      tl.fromTo(brandRef.current, { x: -14 }, { x: 0, duration: 0.34 }, "-=0.36");
    }
    if (searchRef.current) {
      tl.fromTo(searchRef.current, { y: -8 }, { y: 0, duration: 0.3 }, "-=0.25");
    }
    if (navRefs.current.length) {
      tl.fromTo(
        navRefs.current.filter(Boolean),
        { y: -8 },
        { y: 0, duration: 0.24, stagger: 0.045 },
        "-=0.24"
      );
    }
    return () => tl.kill();
  }, [itemCount, reducedMotion]);

  const updateChrome = React.useCallback((y) => {
    if (typeof globalThis === "undefined" || typeof globalThis.window === "undefined") {
      return;
    }
    const win = globalThis.window;
    const doc = globalThis.document;
    const docHeight =
      Math.max(
        doc?.documentElement?.scrollHeight || 0,
        doc?.body?.scrollHeight || 0
      ) - (win.innerHeight || 0);
    const ratio = docHeight > 0 ? Math.max(0, Math.min(1, y / docHeight)) : 0;
    setCompact((prev) => {
      const next = y > COMPACT_SCROLL_THRESHOLD;
      return prev === next ? prev : next;
    });
    if (progressRef.current) {
      progressRef.current.style.transform = `scaleX(${ratio})`;
    }
  }, []);

  useAnimatedReaction(
    () => scrollY.value,
    (current, previous) => {
      if (previous === current) return;
      if (Math.abs(current - previous) < 2) return;
      runOnJS(updateChrome)(current);
    },
    [updateChrome],
  );

  useEffect(() => {
    const prev = prevTotalItemsRef.current;
    prevTotalItemsRef.current = totalItems;
    if (reducedMotion || totalItems <= prev) return;
    if (!cartBadgeRef.current) return;
    gsap.fromTo(
      cartBadgeRef.current,
      { scale: 0.8 },
      { scale: 1, duration: 0.5, ease: "back.out(2.4)" }
    );
  }, [totalItems, reducedMotion]);

  if (Platform.OS !== "web") {
    return null;
  }

  return (
    <View ref={shellRef} style={styles.shell} accessibilityRole="navigation">
      <View
        style={[
          styles.glassInner,
          {
            backgroundColor: isDark ? colors.surfaceOverlay : "rgba(255,255,255,0.94)",
            borderBottomColor: isDark ? semantic.border.divider || semantic.border.subtle : semantic.border.subtle,
          },
          compact ? styles.glassInnerCompact : null,
          Platform.OS === "web" ? shadowPremium : shadowLift,
        ]}
      >
        <LinearGradient
          colors={[semantic.commerce.cta.start, colors.primary, semantic.commerce.cta.end, colors.navy]}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={[styles.chromeTopAccent, styles.peNone]}
        />
        <LinearGradient
          colors={
            isDark
              ? ["rgba(255,255,255,0.05)", "transparent"]
              : ["rgba(255,255,255,0.8)", "rgba(255,255,255,0.08)"]
          }
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[StyleSheet.absoluteFillObject, styles.peNone]}
        />
        <View style={[styles.inner, compact ? styles.innerCompact : null, isPhoneWeb ? styles.innerPhone : null]}>
          <View ref={brandRef} style={styles.brandCluster}>
            <BrandHeaderMark
              navigationRef={navigationRef}
              compact={isPhoneWeb || compact}
              showSubline={!isPhoneWeb && !compact}
            />
            {!isPhoneWeb ? <LocationIconButton navigationRef={navigationRef} size={icon.webNav} /> : null}
          </View>

          {!isPhoneWeb ? (
            <Pressable
              onPress={() => go("Home")}
              style={({ hovered, pressed }) => [
                styles.searchFake,
                {
                  borderColor: colors.searchBarBorder,
                  backgroundColor: colors.searchBarFill,
                },
                compact ? styles.searchFakeCompact : null,
                hovered && { borderColor: semantic.border.focus, backgroundColor: semantic.bg.surface },
                hovered && Platform.OS === "web" ? { boxShadow: "0 8px 16px rgba(15, 23, 42, 0.06)" } : null,
                pressed && { opacity: 0.92 },
              ]}
              accessibilityRole="button"
              accessibilityLabel="Search products"
              ref={searchRef}
            >
              <Ionicons name="search-outline" size={icon.sm} color={colors.textSecondary} />
              <Text style={[styles.searchFakeText, { color: colors.textMuted, fontFamily: fonts.medium }]} numberOfLines={1}>
                {SEARCH_PLACEHOLDER}
              </Text>
            </Pressable>
          ) : null}

          <View style={[styles.navRow, isPhoneWeb ? styles.navRowPhone : null]}>
            {items.map((item, index) => {
              const active = routeMatchesNav(item.key, currentRouteName);
              const itemStyle = ({ hovered, pressed }) => [
                styles.navItem,
                isPhoneWeb ? styles.navItemPhone : null,
                compact ? styles.navItemCompact : null,
                active && {
                  backgroundColor: isDark ? colors.primarySoft : "rgba(220, 38, 38, 0.08)",
                  borderWidth: 1,
                  borderTopWidth: 2,
                  borderColor: isDark ? semantic.border.accent : colors.border,
                  borderTopColor: isDark ? semantic.border.accent : colors.primary,
                },
                !active && hovered && { backgroundColor: semantic.bg.muted },
                !active && hovered && Platform.OS === "web" ? { boxShadow: "0 6px 14px rgba(15, 23, 42, 0.05)" } : null,
                pressed && { opacity: 0.9 },
              ];

              const iconLabel = (
                <>
                  <View style={styles.navIconWrap}>
                    <Ionicons
                      name={active && item.iconActive ? item.iconActive : item.icon}
                      size={icon.webNav}
                      color={active ? colors.primary : colors.textSecondary}
                    />
                    {item.badge ? (
                      <View
                        ref={item.key === "Cart" ? cartBadgeRef : undefined}
                        style={[styles.badge, { backgroundColor: colors.primary }]}
                      >
                        <Text style={[styles.badgeText, { fontFamily: fonts.extrabold, color: colors.onPrimary }]}>{item.badge}</Text>
                      </View>
                    ) : null}
                  </View>
                  {!compactNav && !isPhoneWeb && !compact ? (
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
                </>
              );

              if (item.adminMenu) {
                return (
                  <View
                    key={item.key}
                    ref={adminWrapRef}
                    style={[styles.adminNavWrap, adminMenuOpen ? { zIndex: WEB_Z_INDEX.dropdown } : null]}
                  >
                    <Pressable
                      ref={(el) => {
                        navRefs.current[index] = el;
                      }}
                      onPress={item.onPress}
                      style={itemStyle}
                      accessibilityRole="tab"
                      accessibilityState={{ selected: active, expanded: adminMenuOpen }}
                      accessibilityLabel="Admin menu"
                    >
                      {iconLabel}
                    </Pressable>
                    {adminMenuOpen ? (
                      <View
                        style={[
                          styles.adminDropdown,
                          {
                            backgroundColor: colors.surface,
                            borderColor: semantic.border.subtle,
                          },
                        ]}
                      >
                        <ScrollView
                          nestedScrollEnabled
                          keyboardShouldPersistTaps="handled"
                          style={styles.adminDropdownScroll}
                          showsVerticalScrollIndicator
                        >
                          {adminFlatLinks.map((link) => {
                            const linkActive = currentRouteName === link.route;
                            return (
                              <Pressable
                                key={link.route}
                                onPress={() => goAdmin(link.route)}
                                style={({ hovered, pressed }) => [
                                  styles.adminDropdownRow,
                                  linkActive && { backgroundColor: colors.primarySoft },
                                  hovered && !linkActive && { backgroundColor: semantic.bg.muted },
                                  pressed && { opacity: 0.92 },
                                ]}
                                accessibilityRole="menuitem"
                              >
                                <Ionicons name={link.icon} size={18} color={colors.primary} />
                                <Text
                                  style={[styles.adminDropdownLabel, { color: colors.textPrimary, fontFamily: fonts.semibold }]}
                                  numberOfLines={2}
                                >
                                  {link.label}
                                </Text>
                              </Pressable>
                            );
                          })}
                        </ScrollView>
                      </View>
                    ) : null}
                  </View>
                );
              }

              return (
                <Pressable
                  key={item.key}
                  ref={(el) => {
                    navRefs.current[index] = el;
                  }}
                  onPress={item.onPress}
                  style={itemStyle}
                  accessibilityRole="tab"
                  accessibilityState={{ selected: active }}
                >
                  {iconLabel}
                </Pressable>
              );
            })}
          </View>
        </View>
        <View
          ref={progressRef}
          style={[
            styles.scrollProgress,
            {
              backgroundColor: colors.primary,
            },
          ]}
          accessibilityElementsHidden
        />
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
    zIndex: WEB_Z_INDEX.header,
    height: WEB_HEADER_HEIGHT,
    ...Platform.select({
      web: { backdropFilter: "blur(12px) saturate(1.04)" },
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
    borderBottomWidth: 1,
    overflow: Platform.OS === "web" ? "visible" : "hidden",
    ...Platform.select({
      web: {
        transition: "background-color 0.18s ease, border-color 0.18s ease, box-shadow 0.18s ease, padding 0.18s ease",
      },
      default: {},
    }),
  },
  glassInnerCompact: {
    ...Platform.select({
      web: {
        backdropFilter: "blur(18px) saturate(1.08)",
      },
      default: {},
    }),
  },
  inner: {
    flex: 1,
    maxWidth: CUSTOMER_PAGE_MAX_WIDTH,
    width: "100%",
    alignSelf: "center",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Platform.select({ web: spacing.lg + 2, default: spacing.md }),
    paddingVertical: 8,
    gap: spacing.md + 2,
    ...Platform.select({
      web: { transition: "padding 0.2s ease" },
      default: {},
    }),
  },
  innerPhone: {
    alignItems: "center",
    ...Platform.select({
      web: {
        gap: spacing.xs,
      },
      default: {},
    }),
  },
  innerCompact: {
    paddingVertical: 5,
  },
  brandCluster: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flexShrink: 1,
    minWidth: 0,
  },
  searchFake: {
    flex: 1,
    maxWidth: 560,
    minWidth: 100,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 10,
    paddingHorizontal: spacing.md + 2,
    borderRadius: semanticRadius.full,
    borderWidth: 1,
    ...Platform.select({
      web: {
        cursor: "pointer",
        transition: "border-color 0.18s ease, background 0.18s ease, box-shadow 0.18s ease, transform 0.18s ease, padding 0.18s ease",
        boxShadow: "inset 0 1px 0 rgba(255,255,255,0.78), 0 4px 12px rgba(15, 23, 42, 0.04)",
      },
      default: {},
    }),
  },
  searchFakeCompact: {
    paddingVertical: 8,
  },
  searchFakeText: {
    flex: 1,
    fontSize: typography.caption,
  },
  navRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    flexShrink: 1,
  },
  navRowPhone: {
    flex: 1,
    minWidth: 0,
    marginLeft: "auto",
    gap: 2,
    justifyContent: "flex-end",
  },
  navItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 7,
    paddingHorizontal: spacing.md,
    minHeight: 44,
    borderRadius: semanticRadius.full,
    ...Platform.select({
      web: {
        cursor: "pointer",
        transition:
          "background 0.18s ease, border-color 0.18s ease, transform 0.18s ease, box-shadow 0.18s ease, padding 0.18s ease",
      },
      default: {},
    }),
  },
  navItemPhone: {
    paddingVertical: 7,
    paddingHorizontal: 7,
    minHeight: 36,
  },
  navItemCompact: {
    paddingVertical: 6,
    paddingHorizontal: spacing.sm + 2,
    minHeight: 36,
  },
  navIconWrap: {
    position: "relative",
  },
  navLabel: {
    fontSize: typography.bodySmall,
    letterSpacing: 0.08,
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
  scrollProgress: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: 2,
    transformOrigin: "left center",
    transform: [{ scaleX: 0 }],
    opacity: 0.85,
    ...Platform.select({
      web: { transition: "transform 0.08s linear" },
      default: {},
    }),
  },
  peNone: {
    pointerEvents: "none",
  },
  adminNavWrap: {
    position: "relative",
    alignSelf: "stretch",
  },
  adminDropdown: {
    position: "absolute",
    top: "100%",
    right: 0,
    marginTop: 8,
    minWidth: 268,
    maxHeight: 400,
    borderRadius: semanticRadius.card,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: "hidden",
    zIndex: WEB_Z_INDEX.dropdown,
    ...Platform.select({
      web: {
        boxShadow: "0 14px 28px rgba(15, 23, 42, 0.12), 0 4px 10px rgba(15, 23, 42, 0.06)",
      },
      default: {},
    }),
  },
  adminDropdownScroll: {
    maxHeight: 380,
  },
  adminDropdownRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 11,
    paddingHorizontal: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(148, 163, 184, 0.2)",
    ...Platform.select({
      web: { cursor: "pointer" },
      default: {},
    }),
  },
  adminDropdownLabel: {
    flex: 1,
    fontSize: typography.bodySmall,
    letterSpacing: 0.05,
  },
});
