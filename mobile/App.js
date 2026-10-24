import React, { useEffect, useState } from "react";
import { Appearance, Platform, View } from "react-native";
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
import * as Font from "expo-font";
import * as SplashScreen from "expo-splash-screen";
import { isRunningInExpoGo } from "expo";
import { ToastProvider } from "./src/context/ToastContext";
import { ThemeProvider, useTheme } from "./src/context/ThemeContext";
import useAppIconSync from "./src/hooks/useAppIconSync";
import BootSplash, { BootBackdrop } from "./src/components/BootSplash";
import AppNavigator from "./src/navigation/AppNavigator";
import DeferredHeavyProviders from "./src/bootstrap/DeferredHeavyProviders";
import { markAppReady } from "./src/bootstrap/appReady";
import { applyWebPremiumChrome, injectWebDocumentMeta, webRootStyle } from "./src/theme/web";
import { updateWebRouteSeo } from "./src/utils/webSeo";

const CRITICAL_FONTS = Platform.select({
  web: {
    HankenGrotesk_400Regular,
    HankenGrotesk_700Bold,
    Fraunces_600SemiBold,
  },
  default: {
    HankenGrotesk_400Regular,
    HankenGrotesk_700Bold,
  },
});

const DEFERRED_FONTS = {
  HankenGrotesk_500Medium,
  HankenGrotesk_600SemiBold,
  HankenGrotesk_800ExtraBold,
  Fraunces_600SemiBold,
  Fraunces_700Bold,
  Fraunces_400Regular_Italic,
  ...(Platform.OS === "web"
    ? {
        HankenGrotesk_500Medium,
        HankenGrotesk_600SemiBold,
        Fraunces_700Bold,
      }
    : {}),
};

SplashScreen.preventAutoHideAsync().catch(() => {});

const safeAreaRootStyle = { flex: 1, width: "100%" };

const CUSTOMER_SCREENS = {
  Home: "",
  Shop: "shop",
  Wishlist: "wishlist",
  About: "about",
  Privacy: "privacy",
  Terms: "terms",
  Product: "product/:productId",
  Cart: "cart",
  Checkout: "checkout",
  YoupiCheckout: "pay",
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
  PickLocation: "address/map",
  Support: "support",
  DeliveryDashboard: "delivery/dashboard",
};

const ADMIN_SCREENS = {
  AdminDashboard: "admin",
  AdminOrders: "admin/orders",
  AdminOrderDetail: "admin/orders/:orderId",
  AdminDelivery: "admin/delivery",
  AdminProducts: "admin/products",
  AdminAddProduct: "admin/products/new",
  AdminInventory: "admin/inventory",
  AdminAnalytics: "admin/analytics",
  AdminHomeView: "admin/store",
  AdminCoupons: "admin/coupons",
  AdminRewards: "admin/rewards",
  AdminNotifications: "admin/notify",
  AdminUsers: "admin/users",
  AdminSupport: "admin/support",
};

const linking = {
  prefixes: [ExpoLinking.createURL("/")],
  config: {
    screens: {
      ...CUSTOMER_SCREENS,
      ...(Platform.OS === "web" ? ADMIN_SCREENS : null),
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

function WebRouteSeoSync({ navReady }) {
  useEffect(() => {
    if (Platform.OS !== "web" || !navReady || !navigationRef?.addListener) return undefined;

    const sync = () => {
      if (!navigationRef.isReady?.()) return;
      const route = navigationRef.getCurrentRoute();
      const productName = route?.params?.productId ? undefined : route?.params?.name;
      updateWebRouteSeo(route?.name || "Home", { productName });
    };

    sync();
    const unsub = navigationRef.addListener("state", sync);
    return () => {
      if (typeof unsub === "function") unsub();
    };
  }, [navReady]);

  return null;
}

function AppNavigationShell() {
  const [navReady, setNavReady] = useState(false);

  return (
    <>
      <AppIconSync />
      <WebBodySync />
      <WebRouteSeoSync navReady={navReady} />
      <ThemedStatusBar />
      <NavigationContainer
        ref={navigationRef}
        linking={linking}
        onReady={() => {
          setNavReady(true);
          flushPendingNavigationActions();
          markAppReady();
        }}
      >
        <AppNavigator navigationRef={navigationRef} navReady={navReady} />
      </NavigationContainer>
    </>
  );
}

export default function App() {
  const [fontsLoaded] = useFonts(CRITICAL_FONTS);

  useEffect(() => {
    if (!fontsLoaded) return;
    Font.loadAsync(DEFERRED_FONTS).catch(() => {});
  }, [fontsLoaded]);

  useEffect(() => {
    if (Platform.OS === "web") {
      injectWebDocumentMeta();
    }
  }, []);

  useEffect(() => {
    if (!fontsLoaded) return undefined;
    if (Platform.OS === "web") {
      SplashScreen.hideAsync().catch(() => {});
      return undefined;
    }
    // On iOS / Android `BootSplash` lifts the system splash on its own first frame; this only guards against it never mounting.
    const timer = setTimeout(() => SplashScreen.hideAsync().catch(() => {}), 2500);
    return () => clearTimeout(timer);
  }, [fontsLoaded]);

  if (!fontsLoaded && Platform.OS !== "web") {
    return (
      <SafeAreaProvider style={safeAreaRootStyle}>
        <View style={webRootStyle}>
          <StatusBar style={Appearance.getColorScheme() === "dark" ? "light" : "dark"} />
          <BootBackdrop />
        </View>
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider style={safeAreaRootStyle}>
      <View style={webRootStyle}>
        <ThemeProvider>
          <ToastProvider>
            <DeferredHeavyProviders>
              <AppNavigationShell />
            </DeferredHeavyProviders>
          </ToastProvider>
        </ThemeProvider>
        <BootSplash />
      </View>
    </SafeAreaProvider>
  );
}
