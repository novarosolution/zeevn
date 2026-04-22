import React, { useCallback, useEffect, useState } from "react";
import { Appearance, Platform, View } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { StatusBar } from "expo-status-bar";
import { NavigationContainer, createNavigationContainerRef } from "@react-navigation/native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { useFonts, Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold, Inter_800ExtraBold } from "@expo-google-fonts/inter";
import {
  PlayfairDisplay_600SemiBold,
  PlayfairDisplay_700Bold,
  PlayfairDisplay_400Regular_Italic,
} from "@expo-google-fonts/playfair-display";
import * as SplashScreen from "expo-splash-screen";
import Constants from "expo-constants";
import { isRunningInExpoGo } from "expo";
import { CartProvider } from "./src/context/CartContext";
import { AuthProvider } from "./src/context/AuthContext";
import { ThemeProvider, useTheme } from "./src/context/ThemeContext";
import AppStartupScreen from "./src/components/AppStartupScreen";
import AppNavigator from "./src/navigation/AppNavigator";
import { darkColors, lightColors } from "./src/theme/tokens";
import { applyWebPremiumChrome, webRootStyle } from "./src/theme/web";

const STARTUP_WELCOME_KEY = "@kankreg_startup_welcome_shown";

SplashScreen.preventAutoHideAsync().catch(() => {});

const safeAreaRootStyle = { flex: 1, width: "100%" };

const navigationRef = createNavigationContainerRef();

function getActiveRouteName() {
  return navigationRef.getCurrentRoute()?.name;
}

function setupNotificationHandlerIfSupported() {
  if (Platform.OS === "web") {
    return;
  }
  const isUnsupportedEnv =
    isRunningInExpoGo() ||
    (Platform.OS === "android" &&
      (Constants?.appOwnership === "expo" ||
        Constants?.executionEnvironment === "storeClient" ||
        Constants?.appOwnership !== "standalone"));
  if (isUnsupportedEnv) return;

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
  }, [colors.background, isDark]);
  return null;
}

function ThemedStatusBar() {
  const { isDark } = useTheme();
  return <StatusBar style={isDark ? "light" : "dark"} />;
}

function AppNavigationShell() {
  const [currentRouteName, setCurrentRouteName] = useState(undefined);

  const syncActiveRoute = useCallback(() => {
    setCurrentRouteName(getActiveRouteName());
  }, []);

  return (
    <>
      <WebBodySync />
      <ThemedStatusBar />
      <NavigationContainer ref={navigationRef} onReady={syncActiveRoute} onStateChange={syncActiveRoute}>
        <AppNavigator currentRouteName={currentRouteName} navigationRef={navigationRef} />
      </NavigationContainer>
    </>
  );
}

export default function App() {
  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    Inter_800ExtraBold,
    PlayfairDisplay_600SemiBold,
    PlayfairDisplay_700Bold,
    PlayfairDisplay_400Regular_Italic,
  });
  const [bootFootnote, setBootFootnote] = useState("Loading…");

  const bootstrapColors = Appearance.getColorScheme() === "dark" ? darkColors : lightColors;

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const seen = await AsyncStorage.getItem(STARTUP_WELCOME_KEY);
        if (cancelled) return;
        if (seen === "1") {
          setBootFootnote("Opening…");
        } else {
          setBootFootnote("Welcome — preparing your shop…");
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
    <SafeAreaProvider style={safeAreaRootStyle}>
      <View style={webRootStyle}>
        <ThemeProvider>
          <AuthProvider>
            <CartProvider>
              <AppNavigationShell />
            </CartProvider>
          </AuthProvider>
        </ThemeProvider>
      </View>
    </SafeAreaProvider>
  );
}
