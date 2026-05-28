import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Animated as RNAnimated,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  useWindowDimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Animated, { useAnimatedReaction, runOnJS, useAnimatedStyle, useSharedValue, withSequence, withSpring } from "react-native-reanimated";
import { loadGsap } from "../utils/loadGsap";
import { nativeDriverEnabled } from "../utils/motion";
import {
  breakpoints,
  fonts,
  getSemanticColors,
  icon,
  semanticRadius,
  spacing,
  typography,
} from "../theme/tokens";
import { useCartDrawer } from "../context/CartDrawerContext";
import LiveRegion from "./a11y/LiveRegion";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { WEB_HEADER_BAND, WEB_Z_INDEX, webBackdropFilterStyle } from "../theme/web";
import { CUSTOMER_PAGE_MAX_WIDTH } from "../theme/screenLayout";
import { CUSTOMER_NAV_LINKS, SEARCH_PLACEHOLDERS, WEB_HEADER_UI } from "../content/appContent";
import { ACCOUNT_NESTED } from "../navigation/accountRoutes";
import BrandHeaderMark from "./BrandHeaderMark";
import LocationIconButton from "./LocationIconButton";
import useReducedMotion from "../hooks/useReducedMotion";
import useScrollOffset from "../hooks/useScrollOffset";
import { getAdminMenuFlatLinks, isAdminRouteName } from "../constants/adminNav";
import SearchSuggestionsPopover from "./web/SearchSuggestionsPopover";
import SearchOverlay from "./web/SearchOverlay";
import WebHeaderDrawer from "./web/WebHeaderDrawer";
import useRecentSearches from "../hooks/useRecentSearches";
import useKeyboardShortcut from "../hooks/useKeyboardShortcut";
import { HERITAGE } from "../theme/customerAlchemy";

const COMPACT_SCROLL_THRESHOLD = 24;

const ACCOUNT_ROUTE_NAMES = new Set([
  "Profile",
  ACCOUNT_NESTED.Overview,
  ACCOUNT_NESTED.Orders,
  ACCOUNT_NESTED.OrderDetail,
  ACCOUNT_NESTED.Wishlist,
  ACCOUNT_NESTED.Addresses,
  ACCOUNT_NESTED.Payment,
  ACCOUNT_NESTED.AccountProfile,
  ACCOUNT_NESTED.NotificationPrefs,
  "MyOrders",
  "ManageAddress",
  "EditProfile",
  "Settings",
]);

function routeMatchesNav(navKey, routeName) {
  if (!routeName) return false;
  if (navKey === routeName) return true;
  if (navKey === "Home" && (routeName === "Product" || routeName === "Search")) {
    return true;
  }
  if (navKey === "Settings" && (routeName === ACCOUNT_NESTED.AccountProfile || routeName === ACCOUNT_NESTED.NotificationPrefs)) {
    return true;
  }
  if (navKey === "Profile" && (ACCOUNT_ROUTE_NAMES.has(routeName) || routeName === "Notifications" || routeName === "Support")) {
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

function isApplePlatform() {
  return (
    Platform.OS === "web" &&
    typeof navigator !== "undefined" &&
    /Mac|iPhone|iPad|iPod/.test(String(navigator.platform || navigator.userAgent || ""))
  );
}

const SkipToMainLink = () => {
  const [visible, setVisible] = useState(false);
  if (Platform.OS !== "web") return null;
  return (
    <Pressable
      onFocus={() => setVisible(true)}
      onBlur={() => setVisible(false)}
      onPress={() => {
        if (typeof document === "undefined") return;
        const el = document.getElementById("main-content");
        if (el && typeof el.focus === "function") el.focus({ preventScroll: false });
        if (el && typeof el.scrollIntoView === "function") el.scrollIntoView({ behavior: "smooth", block: "start" });
      }}
      style={[styles.skipPress, { opacity: visible ? 1 : 0, pointerEvents: visible ? "auto" : "none" }]}
      accessibilityRole="link"
      accessibilityLabel={WEB_HEADER_UI.skipToContentLabel}
      {...(Platform.OS === "web" ? { "aria-hidden": !visible, tabIndex: visible ? 0 : -1 } : {})}
    >
      <Text style={[styles.skipText, visible ? null : { color: "transparent" }]}>{WEB_HEADER_UI.skipToContentLabel}</Text>
    </Pressable>
  );
};

export default function WebAppHeader({ navigationRef }) {
  const { colors, isDark, shadowLift } = useTheme();
  const semantic = getSemanticColors(colors);
  const { width: windowWidth } = useWindowDimensions();
  const { totalItems, registerCartBadgeBump } = useCart();
  const { openCartDrawer } = useCartDrawer();
  const { isAuthenticated, user } = useAuth();
  const [adminMenuOpen, setAdminMenuOpen] = useState(false);
  const adminWrapRef = useRef(null);
  const reducedMotion = useReducedMotion();
  const shellRef = useRef(null);
  const brandRef = useRef(null);
  const searchChromeRef = useRef(null);
  const searchInputRef = useRef(null);
  const navRefs = useRef([]);
  const prevTotalItemsRef = useRef(totalItems);
  const [cartCountAnnouncement, setCartCountAnnouncement] = useState("");
  const [compact, setCompact] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [searchOverlayOpen, setSearchOverlayOpen] = useState(false);
  const [suggestionsOpen, setSuggestionsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  const placeholderOpacity = useRef(new RNAnimated.Value(1)).current;
  const [currentRouteName, setCurrentRouteName] = useState(
    navigationRef?.getCurrentRoute?.()?.name
  );
  const { scrollY } = useScrollOffset({ trackWindow: true });
  const progressRef = useRef(null);
  const cartBadgeScale = useSharedValue(1);
  const { recentSearches, add: addRecentSearch } = useRecentSearches();

  const shortcutDisplay = useMemo(() => (isApplePlatform() ? WEB_HEADER_UI.searchShortcutApple : WEB_HEADER_UI.searchShortcutWin), []);

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
    setSuggestionsOpen(false);
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
  const isPhoneWeb = windowWidth < breakpoints.md;
  const useDrawerNav = compactNav;

  const headerHeight = useMemo(() => {
    if (isPhoneWeb) {
      return compact ? WEB_HEADER_BAND.phoneScrolled : WEB_HEADER_BAND.phoneDefault;
    }
    if (compactNav) {
      return compact ? WEB_HEADER_BAND.tabletScrolled : WEB_HEADER_BAND.tabletDefault;
    }
    return compact ? WEB_HEADER_BAND.desktopScrolled : WEB_HEADER_BAND.desktopDefault;
  }, [compact, compactNav, isPhoneWeb]);

  const wordmarkFontSize = useMemo(() => {
    if (isPhoneWeb) return compact ? 17 : 18;
    if (compactNav) return compact ? 18 : 20;
    return compact ? 20 : 22;
  }, [compact, compactNav, isPhoneWeb]);

  const surfaceAlt = isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.03)";
  const lineSoft = isDark ? "rgba(248,250,252,0.42)" : "rgba(30,41,59,0.35)";

  const go = useCallback(
    (name, requiresAuth = false, nestedScreen) => {
      const dest = requiresAuth && !isAuthenticated ? "Login" : name;
      if (dest === "Login") {
        if (currentRouteName !== "Login" && navigationRef?.isReady?.()) {
          const returnTo = { name };
          if (nestedScreen) returnTo.params = { screen: nestedScreen };
          navigationRef.navigate("Login", { returnTo });
        }
        return;
      }
      if (!navigationRef?.isReady?.()) return;
      if (nestedScreen) {
        navigationRef.navigate(dest, { screen: nestedScreen });
        return;
      }
      if (currentRouteName !== dest) {
        navigationRef.navigate(dest);
      }
    },
    [currentRouteName, isAuthenticated, navigationRef]
  );

  const goAdmin = useCallback(
    (routeName) => {
      setAdminMenuOpen(false);
      if (navigationRef?.isReady?.()) {
        navigationRef.navigate(routeName);
      }
    },
    [navigationRef]
  );

  const submitSearch = useCallback(
    (raw) => {
      const q = String(raw || "").trim();
      if (!q) return;
      addRecentSearch(q);
      setSuggestionsOpen(false);
      setSearchOverlayOpen(false);
      if (navigationRef?.isReady?.()) {
        navigationRef.navigate({
          name: "Search",
          params: { q, category: "", categoryLabel: "" },
        });
      }
      setSearchQuery("");
    },
    [addRecentSearch, navigationRef]
  );

  const pickProduct = useCallback(
    (product) => {
      const id = product?.id;
      if (!id) return;
      setSuggestionsOpen(false);
      setSearchOverlayOpen(false);
      setSearchQuery("");
      if (navigationRef?.isReady?.()) {
        navigationRef.navigate({ name: "Product", params: { productId: String(id) } });
      }
    },
    [navigationRef]
  );

  const focusSearchField = useCallback(() => {
    if (isPhoneWeb) {
      setSearchOverlayOpen(true);
      return;
    }
    searchInputRef.current?.focus?.();
  }, [isPhoneWeb]);

  useKeyboardShortcut("k", focusSearchField, { enabled: Platform.OS === "web" && !isPhoneWeb });

  const adminFlatLinks = useMemo(() => getAdminMenuFlatLinks(), []);

  const items = useMemo(() => {
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
        onPress: () => {
          if (Platform.OS === "web" && isAuthenticated) {
            openCartDrawer();
          } else {
            go("Cart", true);
          }
        },
        badge: totalItems > 0 ? (totalItems > 9 ? "9+" : String(totalItems)) : "",
      },
      {
        key: "Settings",
        label: CUSTOMER_NAV_LINKS.settings.label,
        icon: "settings-outline",
        iconActive: "settings",
        onPress: () => go("Profile", true, ACCOUNT_NESTED.AccountProfile),
      },
      {
        key: "Profile",
        label: CUSTOMER_NAV_LINKS.profile.label,
        icon: "person-outline",
        iconActive: "person",
        onPress: () => go("Profile", true),
      },
    ];
  }, [go, isAuthenticated, openCartDrawer, totalItems, user?.isDeliveryPartner, user?.isAdmin]);

  const placeholders = SEARCH_PLACEHOLDERS.filter(Boolean);

  useEffect(() => {
    if (reducedMotion || placeholders.length < 2 || searchQuery.trim().length > 0) {
      placeholderOpacity.setValue(1);
      return undefined;
    }
    const rotate = () => {
      RNAnimated.timing(placeholderOpacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: nativeDriverEnabled,
      }).start(({ finished }) => {
        if (!finished) return;
        setPlaceholderIndex((i) => (i + 1) % placeholders.length);
        RNAnimated.timing(placeholderOpacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: nativeDriverEnabled,
        }).start();
      });
    };
    const t = setInterval(rotate, 4000);
    return () => clearInterval(t);
  }, [placeholderOpacity, placeholders.length, reducedMotion, searchQuery]);

  const itemCount = items.length;

  useEffect(() => {
    if (Platform.OS !== "web" || reducedMotion) return undefined;
    let cancelled = false;
    let tl;
    (async () => {
      const gsap = await loadGsap();
      if (cancelled || !gsap) return;
      tl = gsap.timeline({ defaults: { ease: "power3.out" } });
      if (shellRef.current) tl.fromTo(shellRef.current, { y: -26 }, { y: 0, duration: 0.52 });
      if (brandRef.current) tl.fromTo(brandRef.current, { x: -14 }, { x: 0, duration: 0.34 }, "-=0.36");
      if (searchChromeRef.current) tl.fromTo(searchChromeRef.current, { y: -8 }, { y: 0, duration: 0.3 }, "-=0.25");
      if (navRefs.current.length) {
        tl.fromTo(
          navRefs.current.filter(Boolean),
          { y: -8 },
          { y: 0, duration: 0.24, stagger: 0.045 },
          "-=0.24"
        );
      }
    })();
    return () => {
      cancelled = true;
      tl?.kill?.();
    };
  }, [itemCount, reducedMotion]);

  const updateChrome = useCallback((y) => {
    if (typeof globalThis === "undefined" || typeof globalThis.window === "undefined") return;
    const win = globalThis.window;
    const doc = globalThis.document;
    const docHeight =
      Math.max(doc?.documentElement?.scrollHeight || 0, doc?.body?.scrollHeight || 0) - (win.innerHeight || 0);
    const ratio = docHeight > 0 ? Math.max(0, Math.min(1, y / docHeight)) : 0;
    setCompact((prev) => {
      const next = y > COMPACT_SCROLL_THRESHOLD;
      return prev === next ? prev : next;
    });
    if (progressRef.current) progressRef.current.style.transform = `scaleX(${ratio})`;
  }, []);

  useAnimatedReaction(
    () => scrollY.value,
    (current, previous) => {
      if (previous === current) return;
      if (Math.abs(current - previous) < 2) return;
      runOnJS(updateChrome)(current);
    },
    [updateChrome]
  );

  const pulseCartBadge = useCallback(() => {
    if (reducedMotion) return;
    cartBadgeScale.value = withSequence(
      withSpring(1.18, { damping: 14, stiffness: 220, mass: 0.35 }),
      withSpring(1, { damping: 16, stiffness: 280, mass: 0.3 })
    );
  }, [cartBadgeScale, reducedMotion]);

  useEffect(() => registerCartBadgeBump(pulseCartBadge), [pulseCartBadge, registerCartBadgeBump]);

  useEffect(() => {
    const prev = prevTotalItemsRef.current;
    prevTotalItemsRef.current = totalItems;
    if (totalItems !== prev) {
      const label =
        totalItems === 0
          ? "Cart is empty"
          : totalItems === 1
            ? "Cart updated, 1 item"
            : `Cart updated, ${totalItems} items`;
      setCartCountAnnouncement(label);
    }
    if (totalItems <= prev || reducedMotion) return;
    pulseCartBadge();
  }, [pulseCartBadge, reducedMotion, totalItems]);

  const cartA11yLabel = useMemo(() => {
    const base = CUSTOMER_NAV_LINKS.cart.label;
    if (totalItems <= 0) return base;
    if (totalItems > 9) return `${base}, more than 9 items`;
    return `${base}, ${totalItems} item${totalItems === 1 ? "" : "s"}`;
  }, [totalItems]);

  const cartBadgeAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: cartBadgeScale.value }],
  }));

  if (Platform.OS !== "web") {
    return null;
  }

  const cartItem = items.find((it) => it.key === "Cart");

  const glassInnerDyn = compact
    ? {
        ...(Platform.OS === "web"
          ? {
              ...webBackdropFilterStyle(),
              borderBottomWidth: StyleSheet.hairlineWidth + 1,
              boxShadow: isDark ? "0 10px 30px rgba(0,0,0,0.35)" : "0 12px 32px rgba(15,23,42,0.08)",
              borderBottomColor: lineSoft,
            }
          : {}),
      }
    : {
        ...(Platform.OS === "web"
          ? {
              borderBottomColor: `${colors.border}`,
              opacity: 1,
            }
          : {}),
      };

  const navCluster = ({ phoneMode = false } = {}) =>
    items.map((item, index) => {
      const active = routeMatchesNav(item.key, currentRouteName);
      const itemStyle = ({ hovered, pressed }) => [
        styles.navItem,
        phoneMode ? styles.navItemPhone : null,
        compact ? styles.navItemCompact : null,
        active
          ? {
              backgroundColor: surfaceAlt,
              borderWidth: StyleSheet.hairlineWidth,
              borderColor: lineSoft,
            }
          : { borderWidth: 0 },
        !active && { opacity: 0.72 },
        !active && hovered && { backgroundColor: semantic.bg.muted },
        hovered && Platform.OS === "web" && !active ? { boxShadow: "0 6px 14px rgba(15, 23, 42, 0.05)" } : null,
        pressed && { opacity: 0.86 },
      ];

      const iconLabel = (
        <View style={styles.navIconCol}>
          <View style={styles.navIconWrap}>
            <Ionicons
              name={active && item.iconActive ? item.iconActive : item.icon}
              size={icon.webNav}
              color={colors.textPrimary}
            />
            {item.badge ? (
              <Animated.View
                style={[
                  styles.badge,
                  {
                    backgroundColor: colors.textPrimary,
                    top: -4,
                    right: -4,
                  },
                  item.key === "Cart" ? cartBadgeAnimatedStyle : undefined,
                ]}
              >
                <Text style={[styles.badgeText, { fontFamily: fonts.extrabold, color: colors.surface }]}>{item.badge}</Text>
              </Animated.View>
            ) : null}
          </View>
          {!compactNav && !compact && !phoneMode ? (
            <View style={styles.labelStack}>
              <Text
                style={[
                  styles.navLabel,
                  {
                    color: colors.textPrimary,
                    fontFamily: active ? fonts.bold : fonts.semibold,
                  },
                ]}
              >
                {item.label}
              </Text>
              {active ? (
                <View
                  style={[
                    styles.brassUnderline,
                    {
                      width: reducedMotion ? 24 : undefined,
                      backgroundColor: HERITAGE.brass,
                    },
                  ]}
                />
              ) : null}
            </View>
          ) : null}
        </View>
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
                          linkActive && { backgroundColor: surfaceAlt },
                          hovered && !linkActive && { backgroundColor: semantic.bg.muted },
                          pressed && { opacity: 0.92 },
                        ]}
                        accessibilityRole="menuitem"
                      >
                        <Ionicons name={link.icon} size={18} color={colors.textPrimary} />
                        <Text style={[styles.adminDropdownLabel, { color: colors.textPrimary, fontFamily: fonts.semibold }]}>
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
          accessibilityLabel={item.key === "Cart" ? cartA11yLabel : item.label}
        >
          {iconLabel}
        </Pressable>
      );
    });

  return (
    <>
      <LiveRegion message={cartCountAnnouncement} politeness="polite" />
      <View
        ref={shellRef}
        style={[
          styles.shell,
          { height: headerHeight },
          Platform.OS === "web" ? { transition: "height 0.2s ease" } : {},
        ]}
        accessibilityRole="header"
      >
        <SkipToMainLink />
        <View
          style={[
            styles.glassInner,
            {
              backgroundColor: colors.surface,
              borderBottomWidth: StyleSheet.hairlineWidth,
              borderBottomColor: isDark ? "rgba(248,250,252,0.28)" : "rgba(30,41,59,0.18)",
              ...glassInnerDyn,
            },
            compact ? null : shadowLift,
          ]}
        >
          <View
            style={[styles.inner, compact ? styles.innerCompact : null, isPhoneWeb ? styles.innerPhone : null]}
            accessibilityRole="navigation"
            accessibilityLabel={WEB_HEADER_UI.primaryNavigationLabel}
          >
            {useDrawerNav ? (
              <View style={styles.phoneToolbar}>
                <Pressable
                  onPress={() => setDrawerOpen((open) => !open)}
                  hitSlop={8}
                  style={({ hovered, pressed }) => [
                    styles.iconHit,
                    hovered && Platform.OS === "web" ? { opacity: 0.88 } : null,
                    pressed && { opacity: 0.8 },
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel={drawerOpen ? "Close menu" : "Open menu"}
                  accessibilityState={{ expanded: drawerOpen }}
                >
                  <Ionicons name={drawerOpen ? "close-outline" : "menu-outline"} size={icon.md + 4} color={colors.textPrimary} />
                </Pressable>
                <View style={styles.phoneBrandWrap} ref={brandRef}>
                  <BrandHeaderMark
                    navigationRef={navigationRef}
                    compact
                    showSubline={false}
                    wordmarkFontSizeOverride={wordmarkFontSize}
                  />
                </View>
                <Pressable
                  onPress={() => setSearchOverlayOpen(true)}
                  hitSlop={8}
                  style={({ pressed }) => [styles.iconHit, pressed && { opacity: 0.85 }]}
                  accessibilityRole="button"
                  accessibilityLabel="Search products"
                >
                  <Ionicons name="search-outline" size={icon.md + 2} color={colors.textPrimary} />
                </Pressable>
                {cartItem ? (
                  <Pressable
                    onPress={cartItem.onPress}
                    style={({ pressed }) => [styles.iconHit, pressed && { opacity: 0.85 }]}
                    accessibilityRole="button"
                    accessibilityLabel={cartA11yLabel}
                  >
                    <View style={styles.navIconWrap} importantForAccessibility="no-hide-descendants">
                      <Ionicons name="bag-outline" size={icon.webNav} color={colors.textPrimary} importantForAccessibility="no" />
                      {cartItem.badge ? (
                        <Animated.View
                          style={[
                            styles.badge,
                            { backgroundColor: colors.textPrimary, top: -4, right: -4 },
                            cartBadgeAnimatedStyle,
                          ]}
                          importantForAccessibility="no"
                        >
                          <Text
                            style={[styles.badgeText, { fontFamily: fonts.extrabold, color: colors.surface }]}
                            importantForAccessibility="no"
                          >
                            {cartItem.badge}
                          </Text>
                        </Animated.View>
                      ) : null}
                    </View>
                  </Pressable>
                ) : null}
              </View>
            ) : (
              <>
                <View ref={brandRef} style={styles.brandCluster}>
                  <BrandHeaderMark
                    navigationRef={navigationRef}
                    compact={compact}
                    showSubline={!compact}
                    wordmarkFontSizeOverride={wordmarkFontSize}
                  />
                  <LocationIconButton navigationRef={navigationRef} size={icon.webNav} />
                </View>

                <View ref={searchChromeRef} style={[styles.searchWrap, compact ? styles.searchWrapCompact : null]}>
                  <View
                    style={[
                      styles.searchField,
                      {
                        borderColor: colors.searchBarBorder,
                        backgroundColor: colors.searchBarFill,
                      },
                    ]}
                  >
                    <Ionicons name="search-outline" size={icon.sm} color={colors.textSecondary} />
                    <TextInput
                      ref={searchInputRef}
                      value={searchQuery}
                      onChangeText={(t) => {
                        setSearchQuery(t);
                        setSuggestionsOpen(true);
                      }}
                      onFocus={() => setSuggestionsOpen(true)}
                      onSubmitEditing={() => submitSearch(searchQuery)}
                      placeholder={placeholders[placeholderIndex % placeholders.length] || ""}
                      placeholderTextColor="transparent"
                      style={[styles.searchInput, { color: colors.textPrimary, fontFamily: fonts.medium }]}
                      returnKeyType="search"
                      accessibilityLabel="Search products"
                    />
                    <RNAnimated.Text
                      style={[
                        { pointerEvents: "none" },
                        styles.searchPlaceholderOverlay,
                        {
                          color: colors.textSecondary,
                          fontFamily: fonts.medium,
                          opacity: searchQuery.trim().length > 0 ? 0 : placeholderOpacity,
                        },
                      ]}
                      numberOfLines={1}
                    >
                      {placeholders[placeholderIndex % placeholders.length] || ""}
                    </RNAnimated.Text>
                    <Text style={[styles.kbdHint, { color: semantic.text.primary, fontFamily: fonts.medium }]}>{shortcutDisplay}</Text>
                  </View>
                  <SearchSuggestionsPopover
                    visible={suggestionsOpen}
                    onClose={() => setSuggestionsOpen(false)}
                    anchorRef={searchChromeRef}
                    query={searchQuery}
                    onSubmitTerm={submitSearch}
                    onPickProduct={pickProduct}
                    recentSearches={recentSearches}
                    onAddRecent={addRecentSearch}
                    colors={colors}
                    isDark={isDark}
                  />
                </View>

                <View
                  style={styles.navRow}
                  accessibilityRole="tablist"
                  accessibilityLabel={WEB_HEADER_UI.primaryNavigationLabel}
                >
                  {navCluster({ phoneMode: false })}
                </View>
              </>
            )}
          </View>
          <View
            ref={progressRef}
            style={[
              styles.scrollProgress,
              {
                backgroundColor: HERITAGE.brass,
              },
            ]}
            accessibilityElementsHidden
          />
        </View>
      </View>

      <WebHeaderDrawer
        visible={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        navigationRef={navigationRef}
        colors={colors}
        isDark={isDark}
        isAuthenticated={isAuthenticated}
        user={user}
        onOpenSearch={() => {
          setDrawerOpen(false);
          setSearchOverlayOpen(true);
        }}
      />

      <SearchOverlay
        visible={searchOverlayOpen}
        onClose={() => setSearchOverlayOpen(false)}
        query={searchQuery}
        onChangeQuery={setSearchQuery}
        onSubmitQuery={(q) => submitSearch(q)}
        onPickProduct={pickProduct}
        recentSearches={recentSearches}
        onAddRecent={addRecentSearch}
        placeholder={placeholders[0] || ""}
      />
    </>
  );
}

const styles = StyleSheet.create({
  shell: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    zIndex: WEB_Z_INDEX.header,
    transform: Platform.OS === "web" ? "translateZ(0)" : undefined,
    willChange: Platform.OS === "web" ? "transform" : undefined,
    ...webBackdropFilterStyle(),
  },
  skipPress: {
    ...(Platform.OS === "web"
      ? {
          position: "fixed",
          top: 10,
          left: 12,
          zIndex: WEB_Z_INDEX.overlay + 2,
          paddingVertical: spacing.sm,
          paddingHorizontal: spacing.md,
          borderRadius: semanticRadius.full,
          backgroundColor: "rgba(250,251,253,0.98)",
        }
      : {}),
    ...Platform.select({
      web: { cursor: "pointer" },
      default: {},
    }),
  },
  skipText: {
    fontSize: typography.bodySmall,
    fontFamily: fonts.semibold,
    color: "#0f172a",
  },
  glassInner: {
    flex: 1,
    position: "relative",
    overflow: Platform.OS === "web" ? "visible" : "hidden",
    ...Platform.select({
      web: {
        transition: "background-color 0.18s ease, border-color 0.18s ease, box-shadow 0.18s ease, padding 0.18s ease",
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
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    justifyContent: "center",
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
  phoneToolbar: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.sm,
    minHeight: 44,
    width: "100%",
  },
  phoneBrandWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    minWidth: 0,
  },
  iconHit: {
    minWidth: 44,
    minHeight: 44,
    justifyContent: "center",
    alignItems: "center",
    ...Platform.select({
      web: { cursor: "pointer" },
      default: {},
    }),
  },
  searchWrap: {
    flex: 1,
    maxWidth: 560,
    minWidth: 100,
    position: "relative",
    justifyContent: "center",
    zIndex: WEB_Z_INDEX.sticky + 10,
  },
  searchWrapCompact: {
    maxWidth: 480,
  },
  searchField: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 10,
    paddingHorizontal: spacing.md + 2,
    borderRadius: semanticRadius.full,
    borderWidth: 1,
    position: "relative",
    ...Platform.select({
      web: {
        boxShadow: "inset 0 1px 0 rgba(255,255,255,0.5), 0 4px 12px rgba(15, 23, 42, 0.05)",
      },
      default: {},
    }),
  },
  searchInput: {
    flex: 1,
    minHeight: 22,
    fontSize: Platform.OS === "web" ? 16 : typography.caption,
    paddingVertical: Platform.OS === "web" ? 4 : 0,
    ...(Platform.OS === "web"
      ? {
          outlineStyle: "none",
        }
      : {}),
  },
  searchPlaceholderOverlay: {
    position: "absolute",
    left: icon.sm + 10 + spacing.md,
    right: 56,
    top: "50%",
    marginTop: -9,
    fontSize: Platform.OS === "web" ? 16 : typography.caption,
  },
  kbdHint: {
    fontSize: 11,
    paddingHorizontal: 4,
  },
  navRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    flexShrink: 0,
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
        transition: "opacity 0.18s ease, background 0.18s ease, border-color 0.18s ease, box-shadow 0.18s ease",
      },
      default: {},
    }),
  },
  navItemPhone: {
    paddingHorizontal: spacing.xs,
    minHeight: 40,
    paddingVertical: 6,
  },
  navItemCompact: {
    paddingVertical: 6,
    paddingHorizontal: spacing.sm + 2,
    minHeight: 36,
  },
  navIconCol: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    position: "relative",
  },
  navIconWrap: {
    position: "relative",
  },
  labelStack: {
    alignItems: "flex-start",
    gap: 4,
    minHeight: icon.webNav + 6,
    justifyContent: "center",
  },
  brassUnderline: {
    height: 2,
    width: 24,
    borderRadius: 99,
    alignSelf: "flex-start",
  },
  navLabel: {
    fontSize: typography.bodySmall,
    letterSpacing: 0.08,
  },
  badge: {
    position: "absolute",
    minWidth: 18,
    height: 18,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 5,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(248,250,252,0.92)",
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
    opacity: 0.9,
    ...Platform.select({
      web: { transition: "transform 0.08s linear" },
      default: {},
    }),
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
