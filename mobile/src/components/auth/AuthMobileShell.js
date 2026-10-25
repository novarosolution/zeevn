import React from "react";
import { Image, Platform, StyleSheet, Text, View, useWindowDimensions } from "react-native";
import { StatusBar } from "expo-status-bar";
import { LinearGradient } from "expo-linear-gradient";
import Animated, { FadeIn } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AUTH_HERO_IMAGE } from "../../content/authVisualContent";
import { AUTH_UI } from "../../content/appContent";
import { APP_DISPLAY_NAME } from "../../constants/brand";
import { EASE_OUT, motionTiming } from "../../theme/motion";
import { useStoreTheme, withAlpha } from "../../theme/storefront";
import { getWebHeaderHeight } from "../../theme/web";
import { Emblem } from "../startup/ZeevanEmblem";
import { AUTH_BODY_IN } from "./authMotion";
import AuthRoutePills from "./AuthRoutePills";

/** The hero photo is a portrait (864 × 1152); the jar sits between a quarter and three quarters of the way down. */
const PHOTO_RATIO = 1152 / 864;
const JAR_TOP = 0.25;
const SHELL_MAX = 520;
const TOGGLE_OVERLAP = 26;

/**
 * Native + narrow-web Login / Register: the product photo with the brand lockup on top, rounded at the bottom, and the
 * Sign in / Create account glass switch straddling its lower edge. The form sits on the ivory page below. Both screens
 * share this hero, so switching between them only changes the form.
 */
export default function AuthMobileShell({ children, mode = "login", navigation }) {
  const { c, r, type } = useStoreTheme();
  const insets = useSafeAreaInsets();
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const isWeb = Platform.OS === "web";

  const width = Math.min(windowWidth, SHELL_MAX);
  const photoHeight = width * PHOTO_RATIO;
  // Native: the photo runs under the status bar and carries the brand lockup. Web: the site header already says Zeevan,
  // so the photo starts below it and stays clean.
  const heroHeight = Math.round(Math.min(400, Math.max(300, windowHeight * 0.36))) + (isWeb ? 0 : insets.top);
  const lidY = isWeb ? 36 : insets.top + 62;
  // Keep the jar's lid `lidY` below the top edge, without ever leaving a gap above or below the photo.
  const photoTop = Math.min(0, Math.max(heroHeight - photoHeight, lidY - photoHeight * JAR_TOP));
  const toggleWidth = Math.min(320, width - 56);

  return (
    <View style={[styles.root, { maxWidth: SHELL_MAX, backgroundColor: c.page }]}>
      {isWeb ? null : <StatusBar style="light" />}

      <View
        style={[
          styles.hero,
          { height: heroHeight, marginTop: isWeb ? getWebHeaderHeight(windowWidth) : 0, borderBottomLeftRadius: r.xxl + 6, borderBottomRightRadius: r.xxl + 6 },
        ]}
      >
        <Image
          source={AUTH_HERO_IMAGE}
          style={{ position: "absolute", left: 0, top: photoTop, width, height: photoHeight }}
          resizeMode="cover"
          accessibilityIgnoresInvertColors
        />
        {isWeb ? null : (
          <LinearGradient
            colors={["rgba(22, 14, 6, 0.62)", "rgba(22, 14, 6, 0)"]}
            style={[styles.topShade, { height: insets.top + 110 }]}
            pointerEvents="none"
          />
        )}
        <LinearGradient
          colors={["rgba(22, 14, 6, 0)", "rgba(22, 14, 6, 0.28)"]}
          style={styles.bottomShade}
          pointerEvents="none"
        />

        {isWeb ? null : (
          <Animated.View
            entering={FadeIn.delay(60).duration(motionTiming.enter).easing(EASE_OUT)}
            style={[styles.lockup, { top: insets.top + 14 }]}
            accessibilityRole="header"
          >
            <View style={styles.emblem}>
              <Emblem size={64} dark />
            </View>
            <View style={styles.lockupText}>
              <Text style={type.display(26, { color: "#FFF8E8", semi: true, lh: 30 })}>{APP_DISPLAY_NAME}</Text>
              <Text style={type.eyebrow(withAlpha("#F2CE9B", 0.96), 9.5)} numberOfLines={1}>
                {AUTH_UI.brandLine}
              </Text>
            </View>
          </Animated.View>
        )}
      </View>

      {navigation ? (
        <View style={styles.toggleRow}>
          <AuthRoutePills glass navigation={navigation} activeRoute={mode === "login" ? "Login" : "Register"} style={{ width: toggleWidth }} />
        </View>
      ) : null}

      <Animated.View entering={AUTH_BODY_IN} style={[styles.body, !navigation && styles.bodyBare]}>
        {children}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { width: "100%", flexGrow: 1, alignSelf: "center" },
  hero: { overflow: "hidden", backgroundColor: "#2A1C0E" },
  topShade: { position: "absolute", top: 0, left: 0, right: 0 },
  bottomShade: { position: "absolute", bottom: 0, left: 0, right: 0, height: 120 },
  lockup: { position: "absolute", left: 18, flexDirection: "row", alignItems: "center", gap: 6 },
  emblem: { width: 36, height: 36, alignItems: "center", justifyContent: "center" },
  lockupText: { gap: 1 },
  toggleRow: { alignItems: "center", marginTop: -TOGGLE_OVERLAP, zIndex: 2 },
  body: { paddingHorizontal: 22, paddingTop: 24, paddingBottom: 8 },
  bodyBare: { paddingTop: 28 },
});
