import React, { useEffect } from "react";
import { View } from "react-native";
import { StatusBar } from "expo-status-bar";
import { NavigationContainer } from "@react-navigation/native";
import {
  flushPendingNavigationActions,
  navigationRef,
} from "./src/navigation/navigationRef";
import * as ExpoLinking from "expo-linking";
import { SafeAreaProvider } from "react-native-safe-area-context";
import * as SplashScreen from "expo-splash-screen";
import { ToastProvider } from "./src/context/ToastContext";
import { ThemeProvider, useTheme } from "./src/context/ThemeContext";
import AppNavigator from "./src/navigation/AppNavigator";
import { applyWebPremiumChrome, injectWebDocumentMeta, webRootStyle } from "./src/theme/web";
import { initWebFonts } from "./src/theme/webFonts";
import { updateWebRouteSeo } from "./src/utils/webSeo";
import DeferredHeavyProviders from "./src/bootstrap/DeferredHeavyProviders";
import { deferAfterFirstPaint } from "./src/utils/deferAfterFirstPaint";
import { setLcpShellVisible } from "./src/utils/lcpShell";

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
      AdminDashboard: "admin",
      AdminShopDesk: "admin/desk",
      AdminOrders: "admin/orders",
      AdminCounter: "admin/counter",
      AdminOrderDetail: "admin/orders/:orderId",
      AdminReturns: "admin/returns",
      AdminReturnDetail: "admin/returns/:returnId",
      AdminDispatch: "admin/dispatch",
      AdminRiders: "admin/riders",
      AdminRiderMap: "admin/rider-map",
      AdminCash: "admin/cash",
      AdminRiderMessages: "admin/rider-messages",
      AdminRiderPerformance: "admin/rider-performance",
      AdminDelivery: "admin/delivery",
      AdminProducts: "admin/products",
      AdminPrices: "admin/prices",
      AdminCategories: "admin/categories",
      AdminAddProduct: "admin/products/new",
      AdminInventory: "admin/inventory",
      AdminStockIn: "admin/stock-in",
      AdminTransfers: "admin/transfers",
      AdminStockOut: "admin/stock-out",
      AdminReorders: "admin/reorders",
      AdminClosing: "admin/closing",
      AdminStockReport: "admin/stock-report",
      AdminStockHistory: "admin/stock-history",
      AdminAnalytics: "admin/analytics",
      AdminHomeView: "admin/store",
      AdminHomeSections: "admin/home-sections",
      AdminCoupons: "admin/coupons",
      AdminRewards: "admin/rewards",
      AdminFaqs: "admin/faqs",
      AdminNotifications: "admin/notify",
      AdminCustomers: "admin/customers",
      AdminDeletions: "admin/deletions",
      AdminUsers: "admin/users",
      AdminSupport: "admin/support",
      AdminHealth: "admin/health",
      AdminLogs: "admin/logs",
      AdminHelp: "admin/help",
      AdminSettings: "admin/settings",
    },
  },
};

function WebBodySync() {
  const { colors, isDark } = useTheme();
  useEffect(() => {
    if (typeof document === "undefined") return undefined;
    const apply = () => {
      injectWebDocumentMeta();
      applyWebPremiumChrome(isDark, colors.background);
    };
    return deferAfterFirstPaint(apply, { timeoutMs: 1200 });
  }, [colors.background, isDark]);
  return null;
}

function ThemedStatusBar() {
  const { isDark } = useTheme();
  return <StatusBar style={isDark ? "light" : "dark"} />;
}

function WebRouteSeoSync({ navReady }) {
  useEffect(() => {
    if (!navReady || !navigationRef?.addListener) return undefined;

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
  const [navReady, setNavReady] = React.useState(false);

  return (
    <>
      <WebBodySync />
      <WebRouteSeoSync navReady={navReady} />
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

/** Web entry — no @expo-google-fonts in bundle; fonts load async with `display=swap`. */
export default function App() {
  useEffect(() => {
    injectWebDocumentMeta();
    SplashScreen.hideAsync().catch(() => {});
    initWebFonts();
    const dismissShell = () => setLcpShellVisible(false);
    const cancelDeferred = deferAfterFirstPaint(dismissShell, { timeoutMs: 2500 });
    const fallback = setTimeout(dismissShell, 8000);
    return () => {
      cancelDeferred();
      clearTimeout(fallback);
    };
  }, []);

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
      </View>
    </SafeAreaProvider>
  );
}
