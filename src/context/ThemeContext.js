import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useColorScheme } from "react-native";
import {
  COLORS,
  COLORS_DARK,
  MOTION,
  RADII,
  SHADOWS,
  SPACING,
  TYPE,
  getSemanticPalette,
  darkColors,
  fonts,
  getShadow,
  getShadowLift,
  getShadowPremium,
  lightColors,
} from "../theme/tokens";
import {
  ALCHEMY,
  FONT_DISPLAY,
  FONT_DISPLAY_ITALIC,
  FONT_DISPLAY_SEMI,
  HERITAGE,
  getCustomerShellGradient,
  heritageBrandTrimGradient,
  heritageBrandTrimGradientShort,
  heritageHairlineGradient,
} from "../theme/customerAlchemy";
import {
  LEGACY_JEEVAN_THEME_MODE_KEY,
  LEGACY_THEME_MODE_KEY,
} from "../constants/migrationKeys";

const STORAGE_KEY = "@zeevan_theme_mode";

const ThemeContext = createContext(null);

const customerAlchemy = {
  ALCHEMY,
  HERITAGE,
  FONT_DISPLAY,
  FONT_DISPLAY_SEMI,
  FONT_DISPLAY_ITALIC,
  getCustomerShellGradient,
  heritageBrandTrimGradient,
  heritageBrandTrimGradientShort,
  heritageHairlineGradient,
};

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

  const semanticPalette = useMemo(() => getSemanticPalette(isDark), [isDark]);

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
      fonts,
      semanticPalette,
      COLORS: isDark ? COLORS_DARK : COLORS,
      COLORS_LIGHT: COLORS,
      COLORS_DARK,
      /** Theme-resolved semantic palette (preferred). */
      c: semanticPalette,
      S: SPACING,
      R: RADII,
      SH: SHADOWS,
      T: TYPE,
      M: MOTION,
      customerAlchemy,
      RADII,
      SPACING,
      SHADOWS,
      TYPE,
      MOTION,
      shadow: getShadow(isDark),
      shadowLift: getShadowLift(isDark),
      shadowPremium: getShadowPremium(isDark),
      hydrated,
    }),
    [mode, setMode, isDark, colors, semanticPalette, hydrated]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

const fallbackPalette = getSemanticPalette(false);

function buildFallbackTheme() {
  return {
    mode: "light",
    setMode: () => {},
    isDark: false,
    colors: lightColors,
    fonts,
    semanticPalette: fallbackPalette,
    COLORS,
    COLORS_LIGHT: COLORS,
    COLORS_DARK,
    c: fallbackPalette,
    S: SPACING,
    R: RADII,
    SH: SHADOWS,
    T: TYPE,
    M: MOTION,
    customerAlchemy,
    RADII,
    SPACING,
    SHADOWS,
    TYPE,
    MOTION,
    shadow: getShadow(false),
    shadowLift: getShadowLift(false),
    shadowPremium: getShadowPremium(false),
    hydrated: true,
  };
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    return buildFallbackTheme();
  }
  return ctx;
}
