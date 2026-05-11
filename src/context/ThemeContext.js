import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useColorScheme } from "react-native";
import {
  darkColors,
  getShadow,
  getShadowLift,
  getShadowPremium,
  lightColors,
} from "../theme/tokens";
import {
  LEGACY_JEEVAN_THEME_MODE_KEY,
  LEGACY_THEME_MODE_KEY,
} from "../constants/migrationKeys";

const STORAGE_KEY = "@zeevan_theme_mode";

const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  const systemScheme = useColorScheme();
  const [mode, setModeState] = useState("system");
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        let stored = await AsyncStorage.getItem(STORAGE_KEY);
        if (stored == null) {
          stored = await AsyncStorage.getItem(LEGACY_JEEVAN_THEME_MODE_KEY);
          if (stored === "light" || stored === "dark" || stored === "system") {
            await AsyncStorage.setItem(STORAGE_KEY, stored);
            await AsyncStorage.removeItem(LEGACY_JEEVAN_THEME_MODE_KEY);
          }
        }
        if (stored == null) {
          stored = await AsyncStorage.getItem(LEGACY_THEME_MODE_KEY);
          if (stored === "light" || stored === "dark" || stored === "system") {
            await AsyncStorage.setItem(STORAGE_KEY, stored);
            await AsyncStorage.removeItem(LEGACY_THEME_MODE_KEY);
          }
        }
        if (!cancelled && (stored === "light" || stored === "dark" || stored === "system")) {
          setModeState(stored);
        }
      } catch {
        // ignore
      } finally {
        if (!cancelled) setHydrated(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const isDark = useMemo(() => {
    if (mode === "dark") return true;
    if (mode === "light") return false;
    return systemScheme === "dark";
  }, [mode, systemScheme]);

  const colors = useMemo(() => (isDark ? darkColors : lightColors), [isDark]);

  const setMode = useCallback(async (next) => {
    if (next !== "light" && next !== "dark" && next !== "system") return;
    setModeState(next);
    try {
      await AsyncStorage.setItem(STORAGE_KEY, next);
    } catch {
      // ignore
    }
  }, []);

  const value = useMemo(
    () => ({
      mode,
      setMode,
      isDark,
      colors,
      shadow: getShadow(isDark),
      shadowLift: getShadowLift(isDark),
      shadowPremium: getShadowPremium(isDark),
      hydrated,
    }),
    [mode, setMode, isDark, colors, hydrated]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    return {
      mode: "light",
      setMode: () => {},
      isDark: false,
      colors: lightColors,
      shadow: getShadow(false),
      shadowLift: getShadowLift(false),
      shadowPremium: getShadowPremium(false),
      hydrated: true,
    };
  }
  return ctx;
}
