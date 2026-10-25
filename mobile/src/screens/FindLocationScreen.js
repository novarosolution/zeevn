import React, { useCallback, useEffect, useRef, useState } from "react";
import { InteractionManager, Platform, StyleSheet, View } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import * as Haptics from "expo-haptics";
import { useAuth } from "../context/AuthContext";
import { useDeliveryLocation } from "../context/DeliveryLocationContext";
import { StoreFindLocation } from "../components/store/entry";
import { openPickLocation, usePickedPlace } from "../navigation/pickLocationNav";
import { useTheme } from "../context/ThemeContext";
import { figmaPageBg } from "../theme/figmaApp";
import GoldRingLoader from "../components/loading/GoldRingLoader";

/**
 * Full-screen native location discovery — radar while we look, then a map of what we found and one button to confirm.
 * Skips to Home when delivery location was confirmed recently.
 */
export default function FindLocationScreen({ navigation, route }) {
  const { isDark } = useTheme();
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
  const [locateError, setLocateError] = useState("");
  const mapPickedRef = useRef(false);

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
    setLocateError("");
    const result = await detect({ force: true });
    if (result?.error) {
      setLocateError(result.error);
      setPhase("error");
      return;
    }
    if (result?.label || result?.latitude || savedLabel) {
      setPhase("found");
      return;
    }
    setLocateError("Turn on location or pick your place on the map.");
    setPhase("error");
  }, [detect, savedLabel]);

  useFocusEffect(
    useCallback(() => {
      if (!bootstrapped) return;
      if (!needsFindScreen && !forceReveal) return;
      if (mapPickedRef.current || route?.params?.pickedPlace) {
        setPhase("found");
        return;
      }
      runDetect();
    }, [bootstrapped, forceReveal, needsFindScreen, runDetect, route?.params?.pickedPlace])
  );

  const displaySnippet = snippet?.label
    ? snippet
    : savedLabel
      ? { label: savedLabel }
      : null;

  usePickedPlace(route, navigation, () => {
    mapPickedRef.current = true;
    setPhase("found");
  });

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

  if (
    Platform.OS === "web" ||
    isAuthLoading ||
    !isAuthenticated ||
    !bootstrapped
  ) {
    return (
      <View style={[styles.boot, { backgroundColor: pageBg }]}>
        <GoldRingLoader size={44} />
      </View>
    );
  }

  if (!needsFindScreen && !forceReveal) {
    return (
      <View style={[styles.boot, { backgroundColor: pageBg }]}>
        <GoldRingLoader size={44} />
      </View>
    );
  }

  return (
    <StoreFindLocation
      phase={phase}
      snippet={displaySnippet}
      errorMessage={locateError}
      onConfirm={handleConfirm}
      onRetry={runDetect}
      onOpenMap={() =>
        openPickLocation(navigation, {
          latitude: snippet?.latitude ?? snippet?.lat,
          longitude: snippet?.longitude ?? snippet?.lng,
          returnTo: "FindLocation",
        })
      }
      onManual={() => navigation.navigate(user ? "ManageAddress" : "Login")}
    />
  );
}

const styles = StyleSheet.create({
  boot: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
});
