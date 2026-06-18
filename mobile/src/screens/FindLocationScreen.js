import React, { useCallback, useEffect, useState } from "react";
import { InteractionManager, Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import { useAuth } from "../context/AuthContext";
import { useDeliveryLocation } from "../context/DeliveryLocationContext";
import NativeFindLocationScene from "../components/native/NativeFindLocationScene";
import { useTheme } from "../context/ThemeContext";
import { FIGMA, figmaPageBg, figmaSurfaceBg, figmaTextPrimary, figmaTextSecondary } from "../theme/figmaApp";
import { fonts, spacing } from "../theme/tokens";
import { platformShadow } from "../theme/shadowPlatform";

/**
 * Full-screen native location discovery — radar animation, result card, confirm CTA.
 * Skips to Home when delivery location was confirmed recently.
 */
export default function FindLocationScreen({ navigation, route }) {
  const { colors: c, isDark } = useTheme();
  const { user, isAuthenticated, isAuthLoading } = useAuth();
  const forceReveal = route?.params?.force === true;
  const {
    bootstrapped,
    needsFindScreen,
    snippet,
    detect,
    confirmLocation,
    savedLabel,
  } = useDeliveryLocation();
  const [phase, setPhase] = useState("searching");

  useEffect(() => {
    if (Platform.OS === "web") {
      navigation.replace("Home");
    }
  }, [navigation]);

  useEffect(() => {
    if (Platform.OS === "web" || isAuthLoading) return;
    if (!isAuthenticated) {
      navigation.replace("Home");
    }
  }, [isAuthenticated, isAuthLoading, navigation]);

  useEffect(() => {
    if (!bootstrapped || Platform.OS === "web" || forceReveal) return;
    if (!needsFindScreen) {
      const task = InteractionManager.runAfterInteractions(() => {
        navigation.reset({
          index: 0,
          routes: [{ name: "Home" }],
        });
      });
      return () => task.cancel();
    }
    return undefined;
  }, [bootstrapped, forceReveal, needsFindScreen, navigation]);

  const runDetect = useCallback(async () => {
    setPhase("searching");
    const result = await detect({ force: true });
    if (result?.label || savedLabel) {
      setPhase("found");
      return;
    }
    setPhase("error");
  }, [detect, savedLabel]);

  useFocusEffect(
    useCallback(() => {
      if (!bootstrapped) return;
      if (!needsFindScreen && !forceReveal) return;
      runDetect();
    }, [bootstrapped, forceReveal, needsFindScreen, runDetect])
  );

  const displaySnippet = snippet?.label
    ? snippet
    : savedLabel
      ? { label: savedLabel }
      : null;

  const handleConfirm = async () => {
    try {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {
      // optional haptic
    }
    await confirmLocation(displaySnippet || snippet);
    navigation.reset({
      index: 0,
      routes: [{ name: "Home" }],
    });
  };

  const pageBg = figmaPageBg(isDark);
  const gradColors = isDark
    ? [c.background, c.backgroundGradientEnd || "#14110F", c.background]
    : ["#f8f2e8", FIGMA.paper, "#f3ead8"];

  if (
    Platform.OS === "web" ||
    isAuthLoading ||
    !isAuthenticated ||
    !bootstrapped
  ) {
    return <View style={[styles.boot, { backgroundColor: pageBg }]} />;
  }

  if (!needsFindScreen && !forceReveal) {
    return <View style={[styles.boot, { backgroundColor: pageBg }]} />;
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: pageBg }]} edges={["top", "bottom"]}>
      <LinearGradient
        colors={gradColors}
        locations={[0, 0.45, 1]}
        style={StyleSheet.absoluteFill}
      />
      <View style={styles.topMark}>
        <View style={styles.brandDot} />
        <Text style={[styles.brand, figmaTextSecondary(isDark)]}>kankreg</Text>
      </View>

      <View style={styles.body}>
        <NativeFindLocationScene
          phase={phase}
          snippet={displaySnippet}
        />
      </View>

      <View style={styles.footer}>
        {phase === "found" && displaySnippet ? (
          <Pressable
            style={({ pressed }) => [styles.primaryBtn, pressed && styles.btnPressed]}
            onPress={handleConfirm}
            accessibilityRole="button"
            accessibilityLabel="Confirm delivery location"
          >
            <LinearGradient
              colors={["#2a241e", "#1a1612"]}
              style={styles.primaryGrad}
            >
              <Text style={styles.primaryText}>Confirm location</Text>
            </LinearGradient>
          </Pressable>
        ) : phase === "error" ? (
          <Pressable
            style={({ pressed }) => [styles.primaryBtn, pressed && styles.btnPressed]}
            onPress={runDetect}
            accessibilityRole="button"
          >
            <LinearGradient colors={["#2a241e", "#1a1612"]} style={styles.primaryGrad}>
              <Text style={styles.primaryText}>Try again</Text>
            </LinearGradient>
          </Pressable>
        ) : (
          <View
            style={[
              styles.searchingBtn,
              {
                borderColor: isDark ? c.border : FIGMA.line,
                backgroundColor: isDark ? "rgba(255,255,255,0.06)" : "rgba(255,255,255,0.7)",
              },
            ]}
          >
            <Text style={[styles.searchingText, figmaTextSecondary(isDark)]}>Locating you…</Text>
          </View>
        )}

        <Pressable
          style={({ pressed }) => [
            styles.secondaryBtn,
            {
              borderColor: isDark ? c.border : FIGMA.line,
              backgroundColor: figmaSurfaceBg(isDark),
            },
            pressed && styles.btnPressed,
          ]}
          onPress={() => navigation.navigate(user ? "ManageAddress" : "Login")}
        >
          <Text style={[styles.secondaryText, figmaTextPrimary(isDark)]}>Enter address manually</Text>
        </Pressable>

        {phase === "found" ? (
          <Pressable onPress={runDetect} style={styles.linkBtn}>
            <Text style={styles.linkText}>Search again</Text>
          </Pressable>
        ) : null}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  boot: {
    flex: 1,
  },
  topMark: {
    alignItems: "center",
    paddingTop: spacing.md,
    gap: 8,
  },
  brandDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: FIGMA.gold,
  },
  brand: {
    fontFamily: fonts.semibold,
    fontSize: 13,
    letterSpacing: 4,
    textTransform: "uppercase",
  },
  body: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: FIGMA.gutter,
  },
  footer: {
    paddingHorizontal: FIGMA.gutter,
    paddingBottom: spacing.lg,
    gap: 10,
  },
  primaryBtn: {
    borderRadius: 999,
    overflow: "hidden",
    ...platformShadow({
      web: { boxShadow: "0 8px 16px rgba(61, 42, 18, 0.14)" },
      ios: {
        shadowColor: "#3d2a12",
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.14,
        shadowRadius: 16,
      },
      android: { elevation: 5 },
    }),
  },
  primaryGrad: {
    paddingVertical: 15,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryText: {
    fontFamily: fonts.bold,
    fontSize: 15,
    color: "#fff",
    letterSpacing: 0.2,
  },
  searchingBtn: {
    borderRadius: 999,
    borderWidth: 1,
    paddingVertical: 15,
    alignItems: "center",
  },
  searchingText: {
    fontFamily: fonts.semibold,
    fontSize: 15,
  },
  secondaryBtn: {
    borderRadius: 999,
    borderWidth: 1,
    paddingVertical: 14,
    alignItems: "center",
  },
  secondaryText: {
    fontFamily: fonts.semibold,
    fontSize: 14,
  },
  linkBtn: {
    alignItems: "center",
    paddingVertical: 6,
  },
  linkText: {
    fontFamily: fonts.medium,
    fontSize: 13,
    color: FIGMA.gold,
  },
  btnPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.99 }],
  },
});
