import React, { useEffect, useState } from "react";
import { Appearance, Platform, View } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { StatusBar } from "expo-status-bar";
import { NavigationContainer } from "@react-navigation/native";
import {
  flushPendingNavigationActions,
  navigationRef,
} from "./src/navigation/navigationRef";
import * as ExpoLinking from "expo-linking";
import { SafeAreaProvider } from "react-native-safe-area-context";
import {
  HankenGrotesk_400Regular,
  HankenGrotesk_500Medium,
  HankenGrotesk_600SemiBold,
  HankenGrotesk_700Bold,
  HankenGrotesk_800ExtraBold,
} from "@expo-google-fonts/hanken-grotesk";
import {
  Fraunces_600SemiBold,
  Fraunces_700Bold,
  Fraunces_400Regular_Italic,
} from "@expo-google-fonts/fraunces";
import { useFonts } from "expo-font";
import * as SplashScreen from "expo-splash-screen";
import { isRunningInExpoGo } from "expo";
import { CartProvider } from "./src/context/CartContext";
import { AuthProvider } from "./src/context/AuthContext";
import { LiveSocketProvider } from "./src/context/LiveSocketContext";
import { OrderCelebrationProvider } from "./src/context/OrderCelebrationContext";
import { DeliveryLocationProvider } from "./src/context/DeliveryLocationContext";
import { ApiHealthProvider } from "./src/context/ApiHealthContext";
import { ToastProvider } from "./src/context/ToastContext";
import BackendOfflineBanner from "./src/components/BackendOfflineBanner";
import { ThemeProvider, useTheme } from "./src/context/ThemeContext";
import useAppIconSync from "./src/hooks/useAppIconSync";
import AppStartupScreen from "./src/components/AppStartupScreen";
import AppNavigator from "./src/navigation/AppNavigator";
import { applyWebPremiumChrome, injectWebDocumentMeta, webRootStyle } from "./src/theme/web";

const STARTUP_WELCOME_KEY = "@kankreg_startup_welcome_shown";

SplashScreen.preventAutoHideAsync().catch(() => {});

const safeAreaRootStyle = { flex: 1, width: "100%" };

const linking = {
  prefixes: [ExpoLinking.createURL("/")],
  config: {
    screens: {
      Home: "",
      Shop: "shop",
      About: "about",
      Privacy: "privacy",
      Terms: "terms",
      Product: "product/:productId",
      Cart: "cart",
      Checkout: "checkout",
      RedeemRewards: "rewards",
      Login: "login",
      Register: "register",
      Profile: "profile",
      EditProfile: "profile/edit",
      MyOrders: "orders",
      OrderConfirmed: "order-confirmed",
      Notifications: "notifications",
      Settings: "settings",
      ManageAddress: "address",
      Support: "support",
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
    injectWebDocumentMeta();
    applyWebPremiumChrome(isDark, colors.background);
  }, [colors.background, isDark]);
  return null;
}

function ThemedStatusBar() {
  const { isDark } = useTheme();
  return <StatusBar style={isDark ? "light" : "dark"} />;
}

function AppIconSync() {
  useAppIconSync();
  return null;
}

function AppNavigationShell() {
  const [navReady, setNavReady] = useState(false);

  return (
    <>
      <AppIconSync />
      <WebBodySync />
      <ThemedStatusBar />
      <NavigationContainer
        ref={navigationRef}
        linking={linking}
        onReady={() => {
          setNavReady(true);
          flushPendingNavigationActions();
        }}
      >
        <AppNavigator navigationRef={navigationRef} navReady={navReady} />
      </NavigationContainer>
    </>
  );
}

export default function App() {
  const fontMap = {
    HankenGrotesk_400Regular,
    HankenGrotesk_500Medium,
    HankenGrotesk_600SemiBold,
    HankenGrotesk_700Bold,
    HankenGrotesk_800ExtraBold,
    Fraunces_600SemiBold,
    Fraunces_700Bold,
    Fraunces_400Regular_Italic,
  };
  const [fontsLoaded] = useFonts(fontMap);
  const [bootFootnote, setBootFootnote] = useState("Loading Zeevan…");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const seen = await AsyncStorage.getItem(STARTUP_WELCOME_KEY);
        if (cancelled) return;
        if (seen === "1") {
          setBootFootnote("Loading Zeevan…");
        } else {
          setBootFootnote("Loading Zeevan…");
          await AsyncStorage.setItem(STARTUP_WELCOME_KEY, "1");
        }
      } catch {
        if (!cancelled) setBootFootnote("Opening…");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (Platform.OS === "web") {
      injectWebDocumentMeta();
    }
  }, []);

  useEffect(() => {
    if (Platform.OS === "web" && typeof document !== "undefined") {
      const shell = document.getElementById("kankreg-lcp-shell");
      if (shell) {
        shell.style.pointerEvents = "none";
        shell.style.zIndex = "0";
      }
    }
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
          {Platform.OS !== "web" ? (
            <AppStartupScreen
              isDark={Appearance.getColorScheme() === "dark"}
              useAppFonts={false}
              footnote={bootFootnote}
            />
          ) : null}
        </View>
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider style={safeAreaRootStyle}>
      <View style={webRootStyle}>
        <ThemeProvider>
          <ToastProvider>
            <ApiHealthProvider>
              <AuthProvider>
                <LiveSocketProvider>
                  <OrderCelebrationProvider navigationRef={navigationRef}>
                    <CartProvider>
                      <BackendOfflineBanner />
                      <AppNavigationShell />
                    </CartProvider>
                  </OrderCelebrationProvider>
                </LiveSocketProvider>
              </AuthProvider>
            </ApiHealthProvider>
          </ToastProvider>
        </ThemeProvider>
      </View>
    </SafeAreaProvider>
  );
}
