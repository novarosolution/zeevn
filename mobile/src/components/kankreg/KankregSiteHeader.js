import React, { useEffect, useMemo, useState } from "react";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useCart } from "../../context/CartContext";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";
import { ALCHEMY } from "../../theme/customerAlchemy";
import { KANKREG_CHROME, KANKREG_PALETTE } from "../../theme/kankregWeb";
import { fonts } from "../../theme/tokens";
import {
  WEB_HEADER_HEIGHT,
  WEB_Z_INDEX,
  getWebHeaderHeight,
} from "../../theme/web";
import KankregBrandMark from "./KankregBrandMark";
import { KankregMobileNav } from "./loadKankregMobileNav";
import { buildKankregMobileNavItems, buildKankregNavItems, routeMatchesNav } from "./kankregNav";
import { useKankregLayout } from "../../theme/kankregBreakpoints";
import { KANKREG_HEADER } from "../../content/appContent";
import { safeNavigate } from "../../navigation/navigationRef";
import { setLcpShellVisible } from "../../utils/lcpShell";
import { ensureWebPremiumCss } from "../../utils/webPremiumCss";

if (Platform.OS === "web") ensureWebPremiumCss();

export const KANKREG_HEADER_BODY_HEIGHT = WEB_HEADER_HEIGHT;
export { getKankregChromeTop } from "../../theme/kankregChrome";

/**
 * kankreg.html `.topbar` — web fixed header.
 */
export default function KankregSiteHeader({ navigationRef, navReady = false }) {
  const { showDesktopNav, compactHeader, isMobileWeb, width, pageGutterClamp } = useKankregLayout();
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

  const webHeaderHeight = getWebHeaderHeight(width);
  const useCompactChrome = isMobileWeb;

  const topbarStyle = [
    styles.topbar,
    isNative && styles.topbarNative,
    useCompactChrome && styles.topbarCompact,
    {
      backgroundColor: "transparent",
      borderBottomColor: "transparent",
      paddingTop: 0,
      minHeight: webHeaderHeight,
    },
  ];

  return (
    <>
    <View
      className={isDark ? "zv-chrome-glass-dark" : "zv-chrome-glass"}
      style={[
        styles.shell,
        {
          height: webHeaderHeight,
          position: "fixed",
          zIndex: WEB_Z_INDEX.header,
        },
      ]}
      accessibilityRole="header"
    >
      <View style={topbarStyle}>
        <View
          style={[
            styles.wrap,
            useCompactChrome && styles.wrapCompactPhone,
            compactHeader && styles.wrapTight,
            {
              paddingHorizontal: pageGutterClamp,
              minHeight: webHeaderHeight,
              height: webHeaderHeight,
            },
          ]}
        >
          {useCompactChrome ? (
            <>
              <Pressable
                onPress={() => {
                  setLcpShellVisible(false);
                  setMobileOpen((v) => !v);
                }}
                style={[styles.iconBtn, styles.iconBtnCompact]}
                accessibilityLabel={mobileOpen ? KANKREG_HEADER.menuCloseA11y : KANKREG_HEADER.menuOpenA11y}
              >
                <Ionicons
                  name={mobileOpen ? "close" : "menu-outline"}
                  size={22}
                  color={isDark ? c.textSecondary : KANKREG_PALETTE.greenDeep}
                />
              </Pressable>
              <View style={styles.brandCenter}>
                <KankregBrandMark onPress={() => go("Home")} compact />
              </View>
              <Pressable
                onPress={() => go("Cart", false)}
                style={[styles.iconBtn, styles.iconBtnCompact]}
                accessibilityLabel={KANKREG_HEADER.cartA11y}
              >
                <Ionicons
                  name="bag-outline"
                  size={18}
                  color={isDark ? c.textSecondary : KANKREG_PALETTE.greenDeep}
                />
                {totalItems > 0 ? (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>{totalItems > 9 ? "9+" : String(totalItems)}</Text>
                  </View>
                ) : null}
              </Pressable>
            </>
          ) : (
            <>
              <KankregBrandMark onPress={() => go("Home")} compact={false} />

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
                  <Ionicons name="search-outline" size={18} color={isDark ? c.textSecondary : KANKREG_PALETTE.inkSoft} />
                </Pressable>
                <Pressable
                  onPress={() => go("Cart", false)}
                  style={({ hovered }) => [
                    styles.iconBtn,
                    isDark && styles.iconBtnDark,
                    hovered && (isDark ? styles.iconBtnHoverDark : styles.iconBtnHover),
                  ]}
                  accessibilityLabel={KANKREG_HEADER.cartA11y}
                >
                  <Ionicons name="bag-outline" size={18} color={isDark ? c.textSecondary : KANKREG_PALETTE.inkSoft} />
                  {totalItems > 0 ? (
                    <View style={styles.badge}>
                      <Text style={styles.badgeText}>{totalItems > 9 ? "9+" : String(totalItems)}</Text>
                    </View>
                  ) : null}
                </Pressable>
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
              </View>
            </>
          )}
        </View>
        {!useCompactChrome ? (
          <LinearGradient
            colors={[ALCHEMY.goldBright, ALCHEMY.gold, ALCHEMY.goldDeep]}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
            style={styles.goldRule}
            pointerEvents="none"
          />
        ) : null}
      </View>
    </View>
    {!showDesktopNav && !isNative && mobileOpen && KankregMobileNav ? (
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
        backgroundColor: KANKREG_CHROME.topbarSolid,
        boxShadow: "0 1px 0 rgba(36, 68, 36, 0.08)",
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
      web: { backgroundColor: "transparent" },
      default: {},
    }),
  },
  topbarNative: {},
  topbarCompact: {
    minHeight: undefined,
  },
  wrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 26,
    maxWidth: 1280,
    width: "100%",
    alignSelf: "center",
    paddingHorizontal: "clamp(18px, 4vw, 40px)",
  },
  wrapCompactPhone: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  brandCenter: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  wrapCompact: {
    gap: 10,
  },
  wrapTight: {
    gap: 6,
  },
  nav: {
    flex: 1,
    flexDirection: "row",
    flexWrap: "nowrap",
    gap: 4,
    marginLeft: 10,
    justifyContent: "center",
    ...Platform.select({ web: { overflow: "hidden" }, default: {} }),
  },
  navBtn: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    minHeight: 44,
    justifyContent: "center",
    borderRadius: 0,
    flexShrink: 0,
    borderBottomWidth: 1.5,
    borderBottomColor: "transparent",
    ...Platform.select({ web: { cursor: "pointer" }, default: {} }),
  },
  navBtnActive: {
    backgroundColor: "transparent",
    borderBottomColor: KANKREG_PALETTE.greenDeep,
  },
  navBtnActiveDark: {
    backgroundColor: "transparent",
    borderBottomColor: ALCHEMY.goldBright,
  },
  navBtnHover: {
    backgroundColor: "transparent",
    borderBottomColor: "rgba(36, 68, 36, 0.28)",
  },
  navBtnHoverDark: {
    backgroundColor: "transparent",
    borderBottomColor: "rgba(232, 188, 132, 0.4)",
  },
  navBtnText: {
    fontSize: 13,
    fontFamily: fonts.medium,
    color: KANKREG_PALETTE.inkSoft,
    letterSpacing: 0.08,
    textTransform: "uppercase",
  },
  navBtnTextDark: {
    color: "rgba(245, 239, 228, 0.78)",
  },
  navBtnTextActive: {
    color: KANKREG_PALETTE.greenDeep,
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
    gap: 10,
  },
  actionsCompact: {
    gap: 6,
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(36, 68, 36, 0.12)",
    backgroundColor: "transparent",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    ...Platform.select({ web: { cursor: "pointer" }, default: {} }),
  },
  iconBtnCompact: {
    width: 40,
    height: 40,
    borderRadius: 10,
  },
  iconBtnDark: {
    backgroundColor: "transparent",
    borderColor: "#3f3933",
  },
  iconBtnHover: {
    borderColor: KANKREG_PALETTE.gold,
    backgroundColor: "rgba(220, 172, 116, 0.08)",
  },
  iconBtnHoverDark: {
    borderColor: KANKREG_PALETTE.goldBright,
  },
  badge: {
    position: "absolute",
    top: -4,
    right: -4,
    minWidth: 17,
    height: 17,
    borderRadius: 8.5,
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
    paddingHorizontal: 16,
    borderRadius: 10,
    backgroundColor: KANKREG_CHROME.buttonSecondary,
    ...Platform.select({ web: { cursor: "pointer" }, default: {} }),
  },
  signInHover: { backgroundColor: KANKREG_CHROME.buttonSecondaryHover },
  signInText: {
    fontSize: 13,
    fontFamily: fonts.semibold,
    color: KANKREG_CHROME.onAccent,
    letterSpacing: 0.04,
  },
  goldRule: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: 1,
    opacity: 0.55,
  },
  menuToggle: {
    width: 40,
    height: 40,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(36, 68, 36, 0.12)",
    backgroundColor: "transparent",
    alignItems: "center",
    justifyContent: "center",
    ...Platform.select({ web: { cursor: "pointer" }, default: {} }),
  },
  menuToggleCompact: {
    width: 36,
    height: 36,
    borderRadius: 9,
  },
  menuToggleDark: {
    backgroundColor: "transparent",
    borderColor: "#3f3933",
  },
  menuToggleOpen: {
    borderColor: "rgba(36, 68, 36, 0.28)",
    backgroundColor: "rgba(36, 68, 36, 0.06)",
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
