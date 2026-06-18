import React, { useEffect, useMemo, useState } from "react";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useCart } from "../../context/CartContext";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";
import { ALCHEMY } from "../../theme/customerAlchemy";
import { KANKREG_CHROME, KANKREG_PALETTE } from "../../theme/kankregWeb";
import { platformElevation } from "../../theme/platformStyles";
import { fonts, spacing } from "../../theme/tokens";
import {
  NATIVE_HEADER_HEIGHT,
  WEB_CHROME_TOP,
  WEB_HEADER_HEIGHT,
  WEB_Z_INDEX,
} from "../../theme/web";
import KankregBrandMark from "./KankregBrandMark";
import KankregMobileNav from "./KankregMobileNav";
import { buildKankregMobileNavItems, buildKankregNavItems, routeMatchesNav } from "./kankregNav";
import { useKankregLayout } from "../../theme/kankregBreakpoints";
import { KANKREG_HEADER } from "../../content/appContent";
import { safeNavigate } from "../../navigation/navigationRef";
export const KANKREG_HEADER_BODY_HEIGHT = WEB_HEADER_HEIGHT;
export { getKankregChromeTop } from "../../theme/kankregChrome";

/**
 * kankreg.html `.topbar` — web fixed header.
 */
export default function KankregSiteHeader({ navigationRef, navReady = false }) {
  const insets = useSafeAreaInsets();
  const { showDesktopNav, compactHeader, pageGutterClamp } = useKankregLayout();
  const { totalItems } = useCart();
  const { isAuthenticated, user } = useAuth();
  const { colors: c, isDark } = useTheme();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [currentRouteName, setCurrentRouteName] = useState(null);

  useEffect(() => {
    if (!navReady || !navigationRef?.addListener || !navigationRef?.isReady?.()) {
      return undefined;
    }

    const sync = () => {
      if (!navigationRef.isReady()) return;
      setCurrentRouteName(navigationRef.getCurrentRoute()?.name ?? null);
    };

    sync();
    const unsub = navigationRef.addListener("state", sync);
    return () => {
      if (typeof unsub === "function") unsub();
    };
  }, [navigationRef, navReady]);

  const go = React.useCallback(
    (name, requiresAuth = false, params) => {
      const dest = requiresAuth && !isAuthenticated ? "Login" : name;
      safeNavigate(dest, params);
      setMobileOpen(false);
    },
    [isAuthenticated]
  );

  const openShopSearch = React.useCallback(() => {
    go("Shop", false, { focusSearch: true });
  }, [go]);

  const goProduct = React.useCallback(() => {
    if (typeof globalThis.sessionStorage !== "undefined") {
      const id = globalThis.sessionStorage.getItem("kankreg:lastProductId");
      if (id) {
        go("Product", false, { productId: id });
        return;
      }
    }
    /** No last-viewed product: open the Product screen and let it resolve a default (first catalog item). */
    go("Product");
  }, [go]);

  const items = useMemo(
    () => buildKankregNavItems({ go, goProduct, user }),
    [go, goProduct, user]
  );

  const mobileItems = useMemo(
    () => buildKankregMobileNavItems({ go, goProduct, user }),
    [go, goProduct, user]
  );

  const isNative = Platform.OS !== "web";

  /** Native app uses per-screen chrome + bottom tab bar (figmaforkankreg.html). */
  if (isNative) {
    return null;
  }

  const nativeHeaderHeight = NATIVE_HEADER_HEIGHT;

  const shellHeight =
    Platform.OS === "web"
      ? WEB_CHROME_TOP
      : insets.top + nativeHeaderHeight;

  const topbarStyle = [
    styles.topbar,
    isNative && styles.topbarNative,
    {
      backgroundColor: isDark ? "rgba(20, 17, 15, 0.92)" : KANKREG_CHROME.topbarSolid,
      borderBottomColor: isDark ? c.border : "rgba(31, 92, 71, 0.1)",
      paddingTop: Platform.OS === "web" ? 0 : insets.top,
      minHeight: isNative ? nativeHeaderHeight : WEB_HEADER_HEIGHT,
    },
  ];

  return (
    <>
    <View
      style={[
        styles.shell,
        Platform.OS === "web"
          ? { height: WEB_CHROME_TOP, position: "fixed", zIndex: WEB_Z_INDEX.header }
          : { minHeight: shellHeight, zIndex: WEB_Z_INDEX.header },
        !isDark && Platform.OS === "web" ? styles.shellLightWeb : null,
        Platform.OS === "web" ? { backdropFilter: "blur(14px)", WebkitBackdropFilter: "blur(14px)" } : null,
        Platform.OS === "web" && isDark ? { backdropFilter: "blur(16px)" } : null,
      ]}
      accessibilityRole="header"
    >
      <View style={topbarStyle}>
        <View
          style={[
            styles.wrap,
            compactHeader && styles.wrapCompact,
            { paddingHorizontal: pageGutterClamp },
          ]}
        >
          <KankregBrandMark onPress={() => go("Home")} compact={compactHeader} />

          {showDesktopNav ? (
            <View style={styles.nav}>
              {items.map((item) => {
                const active = routeMatchesNav(item.key, currentRouteName);
                return (
                  <Pressable
                    key={item.key}
                    onPress={item.onPress}
                    style={({ hovered }) => [
                      styles.navBtn,
                      active && (isDark ? styles.navBtnActiveDark : styles.navBtnActive),
                      hovered && !active && (isDark ? styles.navBtnHoverDark : styles.navBtnHover),
                    ]}
                    accessibilityRole="tab"
                    accessibilityState={{ selected: active }}
                    accessibilityLabel={item.label}
                  >
                    <Text
                      style={[
                        styles.navBtnText,
                        isDark && styles.navBtnTextDark,
                        active && (isDark ? styles.navBtnTextActiveDark : styles.navBtnTextActive),
                      ]}
                    >
                      {item.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          ) : null}

          <View style={styles.actions}>
            <Pressable
              onPress={openShopSearch}
              style={({ hovered }) => [
                styles.iconBtn,
                isDark && styles.iconBtnDark,
                hovered && (isDark ? styles.iconBtnHoverDark : styles.iconBtnHover),
              ]}
              accessibilityLabel={KANKREG_HEADER.searchA11y}
            >
              <Ionicons
                name="search-outline"
                size={18}
                color={isDark ? c.textSecondary : KANKREG_PALETTE.inkSoft}
              />
            </Pressable>
            <Pressable
              onPress={() => go("Cart", true)}
              style={({ hovered }) => [
                styles.iconBtn,
                isDark && styles.iconBtnDark,
                hovered && (isDark ? styles.iconBtnHoverDark : styles.iconBtnHover),
              ]}
              accessibilityLabel={KANKREG_HEADER.cartA11y}
            >
              <Ionicons
                name="bag-outline"
                size={18}
                color={isDark ? c.textSecondary : KANKREG_PALETTE.inkSoft}
              />
              {totalItems > 0 ? (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{totalItems > 9 ? "9+" : String(totalItems)}</Text>
                </View>
              ) : null}
            </Pressable>
            {isNative ? null : !compactHeader ? (
              <Pressable
                onPress={() => (isAuthenticated ? go("Profile", true) : go("Login"))}
                style={({ hovered, pressed }) => [
                  styles.signIn,
                  hovered && styles.signInHover,
                  pressed && { opacity: 0.9 },
                ]}
                accessibilityRole="button"
                accessibilityLabel={
                  isAuthenticated ? KANKREG_HEADER.accountLabel : KANKREG_HEADER.signInLabel
                }
              >
                <Text style={styles.signInText}>
                  {isAuthenticated ? KANKREG_HEADER.accountLabel : KANKREG_HEADER.signInLabel}
                </Text>
              </Pressable>
            ) : (
              <Pressable
                onPress={() => (isAuthenticated ? go("Profile", true) : go("Login"))}
                style={[styles.iconBtn, isDark && styles.iconBtnDark]}
                accessibilityLabel={
                  isAuthenticated ? KANKREG_HEADER.accountLabel : KANKREG_HEADER.signInLabel
                }
              >
                <Ionicons
                  name="person-outline"
                  size={18}
                  color={isDark ? c.textSecondary : KANKREG_PALETTE.inkSoft}
                />
              </Pressable>
            )}
            {!showDesktopNav && !isNative ? (
              <Pressable
                onPress={() => setMobileOpen((v) => !v)}
                style={({ hovered, pressed }) => [
                  styles.menuToggle,
                  isDark && styles.menuToggleDark,
                  mobileOpen && (isDark ? styles.menuToggleOpenDark : styles.menuToggleOpen),
                  (hovered || pressed) && styles.menuTogglePressed,
                ]}
                accessibilityLabel={mobileOpen ? KANKREG_HEADER.menuCloseA11y : KANKREG_HEADER.menuOpenA11y}
              >
                <Ionicons
                  name={mobileOpen ? "close" : "menu-outline"}
                  size={22}
                  color={
                    mobileOpen
                      ? isDark
                        ? ALCHEMY.goldBright
                        : KANKREG_PALETTE.greenDeep
                      : isDark
                        ? c.textSecondary
                        : KANKREG_PALETTE.inkSoft
                  }
                />
              </Pressable>
            ) : null}
          </View>
        </View>
        <LinearGradient
          colors={[ALCHEMY.goldBright, ALCHEMY.gold, ALCHEMY.goldDeep]}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={styles.goldRule}
          pointerEvents="none"
        />
      </View>
    </View>
    {!showDesktopNav && !isNative ? (
      <KankregMobileNav
        open={mobileOpen}
        items={mobileItems}
        currentRouteName={currentRouteName}
        onClose={() => setMobileOpen(false)}
        isDark={isDark}
        isAuthenticated={isAuthenticated}
        user={user}
        onSignIn={() => go("Login")}
        onAccount={() => go("Profile", true)}
        totalItems={totalItems}
        onLogoPress={() => go("Home")}
      />
    ) : null}
    </>
  );
}

const styles = StyleSheet.create({
  shell: {
    top: 0,
    left: 0,
    right: 0,
    width: "100%",
  },
  shellLightWeb: {
    ...Platform.select({
      web: {
        boxShadow: "0 1px 0 rgba(31, 92, 71, 0.08), 0 8px 32px -16px rgba(21, 18, 16, 0.08)",
      },
      default: {},
    }),
  },
  topbar: {
    borderBottomWidth: 0,
    minHeight: WEB_HEADER_HEIGHT,
    justifyContent: "center",
    position: "relative",
    overflow: "hidden",
    ...Platform.select({
      web: { backgroundColor: KANKREG_CHROME.topbarBg },
      default: {},
    }),
  },
  topbarNative: {
    minHeight: NATIVE_HEADER_HEIGHT,
  },
  wrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 26,
    minHeight: Platform.OS === "web" ? WEB_HEADER_HEIGHT : NATIVE_HEADER_HEIGHT,
    height: Platform.OS === "web" ? WEB_HEADER_HEIGHT : NATIVE_HEADER_HEIGHT,
    maxWidth: 1280,
    width: "100%",
    alignSelf: "center",
    paddingHorizontal: Platform.OS === "web" ? "clamp(18px, 4vw, 40px)" : spacing.lg,
  },
  wrapCompact: {
    gap: 8,
  },
  nav: {
    flex: 1,
    flexDirection: "row",
    flexWrap: "nowrap",
    gap: 2,
    marginLeft: 6,
    justifyContent: "center",
    ...Platform.select({ web: { overflow: "hidden" }, default: {} }),
  },
  navBtn: {
    paddingVertical: 12,
    paddingHorizontal: 11,
    minHeight: 44,
    justifyContent: "center",
    borderRadius: 999,
    flexShrink: 0,
    ...Platform.select({ web: { cursor: "pointer" }, default: {} }),
  },
  navBtnActive: {
    backgroundColor: "rgba(31, 92, 71, 0.1)",
    ...platformElevation({
      web: { boxShadow: "0 1px 2px rgba(21, 18, 16, 0.04), 0 4px 14px -6px rgba(31, 92, 71, 0.12)" },
      ios: {
        shadowColor: "#19140f",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 6,
      },
      android: { elevation: 2 },
    }),
  },
  navBtnActiveDark: {
    backgroundColor: "rgba(255,255,255,0.08)",
  },
  navBtnHover: {
    backgroundColor: "rgba(31, 92, 71, 0.1)",
  },
  navBtnHoverDark: {
    backgroundColor: "rgba(52, 211, 153, 0.1)",
  },
  navBtnText: {
    fontSize: 14,
    fontFamily: fonts.medium,
    color: KANKREG_PALETTE.inkSoft,
    letterSpacing: 0.01,
  },
  navBtnTextDark: {
    color: "rgba(245, 239, 228, 0.78)",
  },
  navBtnTextActive: {
    color: KANKREG_PALETTE.green,
    fontFamily: fonts.semibold,
  },
  navBtnTextActiveDark: {
    color: "#f5efe4",
    fontFamily: fonts.semibold,
  },
  actions: {
    marginLeft: "auto",
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  iconBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 1,
    borderColor: "rgba(31, 92, 71, 0.14)",
    backgroundColor: KANKREG_PALETTE.card,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    ...Platform.select({ web: { cursor: "pointer" }, default: {} }),
  },
  iconBtnDark: {
    backgroundColor: "#181513",
    borderColor: "#3f3933",
  },
  iconBtnHover: {
    borderColor: KANKREG_PALETTE.gold,
  },
  iconBtnHoverDark: {
    borderColor: KANKREG_PALETTE.goldBright,
  },
  badge: {
    position: "absolute",
    top: -5,
    right: -5,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: KANKREG_CHROME.buttonAccent,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
  },
  badgeText: {
    fontSize: 10,
    fontFamily: fonts.bold,
    color: "#fff",
  },
  signIn: {
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 999,
    backgroundColor: KANKREG_CHROME.buttonSecondary,
    ...Platform.select({ web: { cursor: "pointer" }, default: {} }),
  },
  signInHover: { backgroundColor: KANKREG_CHROME.buttonSecondaryHover },
  signInText: {
    fontSize: 13.5,
    fontFamily: fonts.semibold,
    color: KANKREG_CHROME.onAccent,
    letterSpacing: 0.02,
  },
  goldRule: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: 1.5,
    opacity: 0.85,
  },
  menuToggle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "rgba(31, 92, 71, 0.14)",
    backgroundColor: KANKREG_PALETTE.card,
    alignItems: "center",
    justifyContent: "center",
    ...Platform.select({ web: { cursor: "pointer" }, default: {} }),
  },
  menuToggleDark: {
    backgroundColor: "#181513",
    borderColor: "#3f3933",
  },
  menuToggleOpen: {
    borderColor: "rgba(31, 92, 71, 0.28)",
    backgroundColor: "rgba(31, 92, 71, 0.08)",
  },
  menuToggleOpenDark: {
    borderColor: "rgba(52, 211, 153, 0.28)",
    backgroundColor: "rgba(52, 211, 153, 0.1)",
  },
  menuTogglePressed: {
    opacity: 0.88,
    transform: [{ scale: 0.96 }],
  },
});
