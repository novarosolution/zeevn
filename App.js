import React, { useEffect, useState } from "react";
import { Appearance, Platform, Text, View } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { StatusBar } from "expo-status-bar";
import { NavigationContainer, createNavigationContainerRef } from "@react-navigation/native";
import * as ExpoLinking from "expo-linking";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { useFonts } from "expo-font";
import * as SplashScreen from "expo-splash-screen";
import { isRunningInExpoGo } from "expo";
import { CartDrawerProvider } from "./src/context/CartDrawerContext";
import { CartProvider } from "./src/context/CartContext";
import { WishlistProvider } from "./src/context/WishlistContext";
import { AuthProvider } from "./src/context/AuthContext";
import { ThemeProvider, useTheme } from "./src/context/ThemeContext";
import AppStartupScreen from "./src/components/AppStartupScreen";
import AppNavigator from "./src/navigation/AppNavigator";
import { darkColors, lightColors } from "./src/theme/tokens";
import { syncWebThemeDocument, webRootStyle } from "./src/theme/web";
import { bindWebPerformanceListeners } from "./src/utils/webPerformance";
import useWebLiteMode from "./src/hooks/useWebLiteMode";
import { registerProductCacheServiceWorker } from "./src/utils/registerServiceWorker.web";
import { initWebVitalsReporting } from "./src/utils/reportWebVitals";
import { enforceMobileViewportMeta, injectSelfHostedFontFaces, preloadCriticalWebFonts } from "./src/utils/webHead";
import { installWebViewportWorkarounds } from "./src/utils/webViewport";
import {
  LEGACY_JEEVAN_STARTUP_WELCOME_KEY,
  LEGACY_STARTUP_WELCOME_KEY,
} from "./src/constants/migrationKeys";
import { parseLoginReturnToParam, stringifyLoginReturnToParam } from "./src/utils/deepLink";
import AppErrorBoundary from "./src/components/errors/AppErrorBoundary";
import OfflineBanner from "./src/components/errors/OfflineBanner";
import ConnectivityBridge from "./src/context/ConnectivityBridge";
import { setSentryRoute } from "./src/observability/sentry";
import { nativeAppFonts } from "./src/config/nativeFontConfig";
import { DEV_DEBUG_UI } from "./src/content/appContent";
import { configureNetInfo } from "./src/utils/configureNetInfo";

configureNetInfo();

const STARTUP_WELCOME_KEY = "@zeevan_startup_welcome_shown";

SplashScreen.preventAutoHideAsync().catch(() => {});

const safeAreaRootStyle = { flex: 1, width: "100%" };
const gestureRootStyle = { flex: 1 };

function getBootstrapBackground() {
  return Appearance.getColorScheme() === "dark" ? darkColors.background : lightColors.background;
}

const navigationRef = createNavigationContainerRef();

const linking = {
  prefixes: [ExpoLinking.createURL("/")],
  config: {
    screens: {
      Home: "",
      Categories: "shop",
      Search: {
        path: "search",
        parse: {
          q: (value) => (value == null ? "" : String(value)),
          category: (value) => (value == null ? "" : String(value)),
          categoryLabel: (value) => (value == null ? "" : String(value)),
          sort: (value) => String(value || "featured"),
          priceMin: (value) => {
            const n = Number(value);
            return Number.isFinite(n) ? n : undefined;
          },
          priceMax: (value) => {
            const n = Number(value);
            return Number.isFinite(n) ? n : undefined;
          },
          cats: (value) => String(value || ""),
          types: (value) => String(value || ""),
          brands: (value) => String(value || ""),
          sizes: (value) => String(value || ""),
          colors: (value) => String(value || ""),
          rating: (value) => {
            const n = Number(value);
            return Number.isFinite(n) ? n : undefined;
          },
          discount: (value) => value === "1" || value === true,
          stock: (value) => value === "1" || value === true,
        },
        stringify: {
          sort: (value) => (value && value !== "featured" ? String(value) : undefined),
          priceMin: (value) => (value != null && value !== "" ? String(value) : undefined),
          priceMax: (value) => (value != null && value !== "" ? String(value) : undefined),
          cats: (value) => (value ? String(value) : undefined),
          types: (value) => (value ? String(value) : undefined),
          brands: (value) => (value ? String(value) : undefined),
          sizes: (value) => (value ? String(value) : undefined),
          colors: (value) => (value ? String(value) : undefined),
          rating: (value) => (value != null ? String(value) : undefined),
          discount: (value) => (value ? "1" : undefined),
          stock: (value) => (value ? "1" : undefined),
        },
      },
      Product: "product/:productId",
      Cart: "cart",
      Login: {
        path: "login",
        parse: {
          email: (value) => String(value || ""),
          sessionExpired: (value) => value === "true" || value === true,
          returnTo: parseLoginReturnToParam,
        },
        stringify: {
          sessionExpired: (value) => (value ? "true" : undefined),
          returnTo: stringifyLoginReturnToParam,
        },
      },
      Register: "register",
      ForgotPassword: "forgot-password",
      ResetPassword: {
        path: "reset-password",
        parse: {
          token: (value) => String(value || ""),
          email: (value) => String(value || ""),
        },
      },
      VerifyEmail: {
        path: "verify-email",
        parse: {
          token: (value) => String(value || ""),
          email: (value) => String(value || ""),
        },
      },
      Profile: "profile",
      EditProfile: "profile/edit",
      MyOrders: "orders",
      Notifications: "notifications",
      Settings: "settings",
      ManageAddress: "address",
      Support: "support",
      Reviews: "reviews",
      QualityInfo: "quality",
      ProcessInfo: "process",
      DeliveryInfo: "delivery",
      About: "about",
      Contact: "contact",
      Faq: "faq",
      Privacy: "privacy",
      Terms: "terms",
      ShippingPolicy: "shipping",
      ReturnsPolicy: "returns",
      Blog: "blog",
      BlogPost: {
        path: "blog/:slug",
        parse: {
          slug: (value) => String(value || ""),
        },
      },
      NotFound: "*",
      DeliveryDashboard: "delivery/dashboard",
      AdminDashboard: "admin",
      AdminProducts: "admin/products",
      AdminInventory: "admin/inventory",
      AdminAddProduct: "admin/products/new",
      AdminOrders: "admin/orders",
      AdminUsers: "admin/users",
      AdminNotifications: "admin/notifications",
      AdminAnalytics: "admin/analytics",
      AdminCoupons: "admin/coupons",
      AdminRewards: "admin/rewards",
      AdminSupport: "admin/support",
      AdminHomeView: "admin/home-view",
      DevDebug: {
        path: "dev-debug",
        parse: {
          key: (value) => String(value || ""),
        },
      },
    },
  },
};

function setupNotificationHandlerIfSupported() {
  if (Platform.OS === "web") {
    return;
  }
  // Avoid duplicate/conflicting handlers in Expo Go only (supported on standalone Android/iOS).
  if (isRunningInExpoGo()) return;

  try {
    const Notifications = require("expo-notifications");
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
      }),
    });
  } catch {
    // optional
  }
}

setupNotificationHandlerIfSupported();

function WebBodySync() {
  const { colors, isDark } = useTheme();
  const webLite = useWebLiteMode();

  useEffect(() => {
    if (Platform.OS !== "web" || typeof document === "undefined") return undefined;
    injectSelfHostedFontFaces();
    preloadCriticalWebFonts();
    enforceMobileViewportMeta();
    const cleanupViewport = installWebViewportWorkarounds();
    registerProductCacheServiceWorker();
    initWebVitalsReporting();
    const cleanupPerf = bindWebPerformanceListeners((profile) => {
      syncWebThemeDocument({
        isDark,
        background: colors.background,
        surface: colors.surface,
        liteMode: profile.lite,
      });
    });
    return () => {
      cleanupViewport?.();
      cleanupPerf?.();
    };
  }, [colors.background, colors.surface, isDark]);

  useEffect(() => {
    if (Platform.OS !== "web" || typeof document === "undefined") return;
    syncWebThemeDocument({
      isDark,
      background: colors.background,
      surface: colors.surface,
      liteMode: webLite,
    });
  }, [colors.background, colors.surface, isDark, webLite]);

  return null;
}

function WebDebugHud() {
  const [metrics, setMetrics] = useState(null);

  useEffect(() => {
    if (Platform.OS !== "web" || typeof window === "undefined" || !__DEV__) return undefined;
    const params = new URLSearchParams(window.location.search || "");
    if (params.get("debug") !== "1") return undefined;
    let rafId = 0;
    let frames = 0;
    let lastSampleAt = performance.now();
    const loop = () => {
      frames += 1;
      const now = performance.now();
      if (now - lastSampleAt >= 1000) {
        const vv = window.visualViewport;
        setMetrics({
          fps: frames,
          scrollY: Math.round(window.scrollY || 0),
          inner: `${window.innerWidth}x${window.innerHeight}`,
          viewport: vv ? `${Math.round(vv.width)}x${Math.round(vv.height)}` : "n/a",
        });
        frames = 0;
        lastSampleAt = now;
      }
      rafId = window.requestAnimationFrame(loop);
    };
    rafId = window.requestAnimationFrame(loop);
    return () => {
      if (rafId) window.cancelAnimationFrame(rafId);
    };
  }, []);

  if (!metrics) return null;
  return (
    <View
      style={{
        position: "fixed",
        top: 10,
        right: 10,
        zIndex: 100000,
        borderRadius: 10,
        backgroundColor: "rgba(0,0,0,0.72)",
        paddingHorizontal: 10,
        paddingVertical: 8,
        pointerEvents: "none",
      }}
    >
      <Text style={{ color: "#FFFFFF", fontSize: 11 }}>{`${DEV_DEBUG_UI.hudFps}: ${metrics.fps}`}</Text>
      <Text style={{ color: "#FFFFFF", fontSize: 11 }}>{`${DEV_DEBUG_UI.hudScroll}: ${metrics.scrollY}`}</Text>
      <Text style={{ color: "#FFFFFF", fontSize: 11 }}>{`${DEV_DEBUG_UI.hudWindow}: ${metrics.inner}`}</Text>
      <Text style={{ color: "#FFFFFF", fontSize: 11 }}>{`${DEV_DEBUG_UI.hudViewport}: ${metrics.viewport}`}</Text>
    </View>
  );
}

function ThemedStatusBar() {
  const { isDark } = useTheme();
  return <StatusBar style={isDark ? "light" : "dark"} />;
}

function AppNavigationShell() {
  const [navigationReady, setNavigationReady] = useState(false);

  return (
    <>
      <WebBodySync />
      <ThemedStatusBar />
      <OfflineBanner />
      <NavigationContainer
        ref={navigationRef}
        linking={linking}
        onReady={() => setNavigationReady(true)}
        onStateChange={(state) => {
          const route = state?.routes?.[state.index];
          const nested = route?.state;
          const active =
            nested?.routes?.[nested.index ?? 0]?.name ||
            route?.name ||
            "unknown";
          setSentryRoute(active);
        }}
      >
        <WebDebugHud />
        <CartDrawerProvider navigationRef={navigationRef}>
          <AppNavigator navigationRef={navigationRef} navigationReady={navigationReady} />
        </CartDrawerProvider>
      </NavigationContainer>
    </>
  );
}

export default function App() {
  const [nativeFontsLoaded, nativeFontError] = useFonts(nativeAppFonts);
  const [fontLoadTimeoutReached, setFontLoadTimeoutReached] = useState(false);
  const fontsLoaded =
    Platform.OS === "web" ? true : nativeFontsLoaded || Boolean(nativeFontError) || fontLoadTimeoutReached;

  useEffect(() => {
    if (Platform.OS === "web") {
      injectSelfHostedFontFaces();
    }
  }, []);

  useEffect(() => {
    if (Platform.OS === "web" || nativeFontsLoaded || nativeFontError) return undefined;
    const timer = setTimeout(() => setFontLoadTimeoutReached(true), 1500);
    return () => clearTimeout(timer);
  }, [nativeFontError, nativeFontsLoaded]);

  useEffect(() => {
    const splashFailsafe = setTimeout(() => {
      SplashScreen.hideAsync().catch(() => {});
    }, 6000);
    return () => clearTimeout(splashFailsafe);
  }, []);
  const [bootFootnote, setBootFootnote] = useState("Loading your storefront…");

  const bootstrapColors = Appearance.getColorScheme() === "dark" ? darkColors : lightColors;

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        let seen = await AsyncStorage.getItem(STARTUP_WELCOME_KEY);
        if (seen == null) {
          seen = await AsyncStorage.getItem(LEGACY_JEEVAN_STARTUP_WELCOME_KEY);
          if (seen === "1") {
            await AsyncStorage.setItem(STARTUP_WELCOME_KEY, "1");
            await AsyncStorage.removeItem(LEGACY_JEEVAN_STARTUP_WELCOME_KEY);
          }
        }
        if (seen == null) {
          seen = await AsyncStorage.getItem(LEGACY_STARTUP_WELCOME_KEY);
          if (seen === "1") {
            await AsyncStorage.setItem(STARTUP_WELCOME_KEY, "1");
            await AsyncStorage.removeItem(LEGACY_STARTUP_WELCOME_KEY);
          }
        }
        if (cancelled) return;
        if (seen === "1") {
          setBootFootnote("Restoring your shop…");
        } else {
          setBootFootnote("Welcome. Setting up your first visit…");
          await AsyncStorage.setItem(STARTUP_WELCOME_KEY, "1");
        }
      } catch {
        if (!cancelled) setBootFootnote("Opening your shop…");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [fontsLoaded]);

  const rootBackground = getBootstrapBackground();

  if (!fontsLoaded) {
    return (
      <SafeAreaProvider style={safeAreaRootStyle}>
        <View style={[webRootStyle, { backgroundColor: rootBackground }]}>
          <StatusBar style={Appearance.getColorScheme() === "dark" ? "light" : "dark"} />
          <AppStartupScreen
            colors={bootstrapColors}
            isDark={Appearance.getColorScheme() === "dark"}
            useAppFonts={false}
            footnote={bootFootnote}
          />
        </View>
      </SafeAreaProvider>
    );
  }

  return (
    <AppErrorBoundary>
      <GestureHandlerRootView style={gestureRootStyle}>
        <SafeAreaProvider style={safeAreaRootStyle}>
          <View style={[webRootStyle, { backgroundColor: rootBackground }]}>
            <ThemeProvider>
              <AuthProvider>
                <ConnectivityBridge>
                  <WishlistProvider>
                    <CartProvider>
                      <AppNavigationShell />
                    </CartProvider>
                  </WishlistProvider>
                </ConnectivityBridge>
              </AuthProvider>
            </ThemeProvider>
          </View>
        </SafeAreaProvider>
      </GestureHandlerRootView>
    </AppErrorBoundary>
  );
}
