import React, { useEffect, useState } from "react";
import { Appearance, Platform, View } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { StatusBar } from "expo-status-bar";
import { NavigationContainer, createNavigationContainerRef } from "@react-navigation/native";
import * as ExpoLinking from "expo-linking";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { useFonts, Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold, Inter_800ExtraBold } from "@expo-google-fonts/inter";
import {
  PlayfairDisplay_600SemiBold,
  PlayfairDisplay_700Bold,
  PlayfairDisplay_400Regular_Italic,
} from "@expo-google-fonts/playfair-display";
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
import { applyWebPremiumChrome, webRootStyle } from "./src/theme/web";
import { registerProductCacheServiceWorker } from "./src/utils/registerServiceWorker.web";
import { initWebVitalsReporting } from "./src/utils/reportWebVitals";
import { injectSelfHostedFontFaces } from "./src/utils/webHead";
import {
  LEGACY_JEEVAN_STARTUP_WELCOME_KEY,
  LEGACY_STARTUP_WELCOME_KEY,
} from "./src/constants/migrationKeys";
import { parseLoginReturnToParam, stringifyLoginReturnToParam } from "./src/utils/deepLink";
import AppErrorBoundary from "./src/components/errors/AppErrorBoundary";
import OfflineBanner from "./src/components/errors/OfflineBanner";
import ConnectivityBridge from "./src/context/ConnectivityBridge";
import { setSentryRoute } from "./src/observability/sentry";

const STARTUP_WELCOME_KEY = "@zeevan_startup_welcome_shown";

SplashScreen.preventAutoHideAsync().catch(() => {});

const safeAreaRootStyle = { flex: 1, width: "100%" };
const gestureRootStyle = { flex: 1 };

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
      AdminSupport: "admin/support",
      AdminHomeView: "admin/home-view",
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
  useEffect(() => {
    if (Platform.OS !== "web" || typeof document === "undefined") return;
    applyWebPremiumChrome(isDark, colors.background);
    injectSelfHostedFontFaces();
    registerProductCacheServiceWorker();
    initWebVitalsReporting();
  }, [colors.background, isDark]);
  return null;
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
        <CartDrawerProvider navigationRef={navigationRef}>
          <AppNavigator navigationRef={navigationRef} navigationReady={navigationReady} />
        </CartDrawerProvider>
      </NavigationContainer>
    </>
  );
}

export default function App() {
  const [nativeFontsLoaded, nativeFontError] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    Inter_800ExtraBold,
    PlayfairDisplay_600SemiBold,
    PlayfairDisplay_700Bold,
    PlayfairDisplay_400Regular_Italic,
  });
  const [fontLoadTimeoutReached, setFontLoadTimeoutReached] = useState(false);
  const fontsLoaded = Platform.OS === "web" ? true : nativeFontsLoaded || Boolean(nativeFontError) || fontLoadTimeoutReached;

  useEffect(() => {
    if (Platform.OS === "web") {
      injectSelfHostedFontFaces();
    }
  }, []);

  useEffect(() => {
    if (Platform.OS === "web" || nativeFontsLoaded || nativeFontError) return undefined;
    const timer = setTimeout(() => setFontLoadTimeoutReached(true), 3000);
    return () => clearTimeout(timer);
  }, [nativeFontError, nativeFontsLoaded]);
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

  if (!fontsLoaded) {
    return (
      <SafeAreaProvider style={safeAreaRootStyle}>
        <View style={webRootStyle}>
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
          <View style={webRootStyle}>
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
