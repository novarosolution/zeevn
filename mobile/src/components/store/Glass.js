import React, { useEffect, useSyncExternalStore } from "react";
import { AccessibilityInfo, Platform, StyleSheet, View } from "react-native";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Defs, RadialGradient, Rect, Stop } from "react-native-svg";
import { useStoreTheme, withAlpha } from "../../theme/storefront";

/**
 * Glass — the material for chrome that floats over moving content (the bottom nav, the pinned search bar, docks,
 * small pills over photos). Follows Apple's rules: a real blur so what scrolls underneath dissolves instead of
 * ghosting through, a thin warm tint for legibility, a bright specular line where light catches the top edge, and a
 * hairline outer edge. Flat cards and plain fields do NOT use it: blur is for things that sit over motion.
 *
 * - iOS: UIVisualEffectView (expo-blur) with an explicit Light/Dark material, because the app theme is independent
 *   of the system appearance.
 * - Android, or Reduce Transparency on: no blur, a near-solid tint of the same colour (frostier, never see-through).
 * - `GLASS_BLUR` is the single switch: set it to false to fall back to the tint everywhere (e.g. if a very old phone
 *   hitches while scrolling under the blur).
 *
 * The contact shadow (`lift`: below the shape, or `lift="up"` above a sheet docked to the bottom) is drawn outside the
 * shape only. A normal drop shadow would show through translucent glass and turn it muddy.
 *
 * `edge` picks the outline: "full" (a floating pill: hairline all round + a specular line along the top), "bottom"
 * (a bar pinned to the top of the screen: just the hairline underneath), "top" (a dock at the bottom of the screen:
 * the hairline above) or "none".
 */
export const GLASS_BLUR = Platform.OS === "ios";

/* ---- Reduce Transparency (iOS accessibility setting) ---- */
let reduced = false;
let watching = false;
const subscribers = new Set();

function setReduced(value) {
  reduced = Boolean(value);
  subscribers.forEach((fn) => fn());
}

function watchReduceTransparency() {
  if (watching || Platform.OS !== "ios") return;
  watching = true;
  AccessibilityInfo.isReduceTransparencyEnabled?.().then(setReduced).catch(() => {});
  AccessibilityInfo.addEventListener?.("reduceTransparencyChanged", setReduced);
}

const subscribe = (fn) => {
  subscribers.add(fn);
  return () => subscribers.delete(fn);
};

/** True when the shopper turned on Settings → Accessibility → Display → Reduce Transparency. */
export function useReduceTransparency() {
  useEffect(() => {
    watchReduceTransparency();
  }, []);
  return useSyncExternalStore(subscribe, () => reduced, () => false);
}

/** How thick the material is: ultra for small chips over photos, thin for bars, regular for docks and sheets. */
const MATERIAL = {
  ultra: { blur: "systemUltraThinMaterial", intensity: 55, light: 0.42, dark: 0.38 },
  thin: { blur: "systemThinMaterial", intensity: 70, light: 0.5, dark: 0.46 },
  regular: { blur: "systemMaterial", intensity: 85, light: 0.64, dark: 0.58 },
};
/** Tint strength when there is no blur behind it. */
const SOLID = 0.94;

/** The tint colours: ivory over light pages, the deep storefront green over dark ones. */
const TINT_LIGHT = "#FBF6EC";
const TINT_DARK = "#0F2418";

export default function Glass({
  material = "thin",
  radius = 0,
  lift = false,
  sheen = true,
  edge = "full",
  style,
  contentStyle,
  children,
  ...rest
}) {
  const { isDark } = useStoreTheme();
  const reduceTransparency = useReduceTransparency();
  const spec = MATERIAL[material] || MATERIAL.thin;
  const blurOn = GLASS_BLUR && !reduceTransparency;
  const fill = withAlpha(isDark ? TINT_DARK : TINT_LIGHT, blurOn ? (isDark ? spec.dark : spec.light) : SOLID);
  const edgeColor = isDark ? withAlpha("#FFFFFF", 0.14) : withAlpha("#5A4220", 0.12);
  const catch_ = isDark ? withAlpha("#FFFFFF", 0.34) : withAlpha("#FFFFFF", 0.95);
  const inset = Math.max(10, radius * 0.7);

  return (
    <View {...rest} style={style}>
      {lift ? (
        <View pointerEvents="none" style={[lift === "up" ? styles.contactUp : styles.contact, { left: radius * 0.4, right: radius * 0.4 }]}>
          <Svg width="100%" height="100%">
            <Defs>
              <RadialGradient
                id="glassContact"
                cx="50%"
                cy={lift === "up" ? "100%" : "0%"}
                rx="50%"
                ry="100%"
                fx="50%"
                fy={lift === "up" ? "100%" : "0%"}
              >
                <Stop offset="0" stopColor={isDark ? "#000000" : "#3D2A12"} stopOpacity={isDark ? 0.34 : 0.13} />
                <Stop offset="1" stopColor={isDark ? "#000000" : "#3D2A12"} stopOpacity={0} />
              </RadialGradient>
            </Defs>
            <Rect x="0" y="0" width="100%" height="100%" fill="url(#glassContact)" />
          </Svg>
        </View>
      ) : null}

      <View pointerEvents="none" style={[StyleSheet.absoluteFill, { borderRadius: radius, overflow: "hidden" }]}>
        {blurOn ? <BlurView tint={`${spec.blur}${isDark ? "Dark" : "Light"}`} intensity={spec.intensity} style={StyleSheet.absoluteFill} /> : null}
        <View style={[StyleSheet.absoluteFill, { backgroundColor: fill }]} />
        {sheen ? (
          <LinearGradient
            colors={[withAlpha("#FFFFFF", isDark ? 0.09 : 0.34), withAlpha("#FFFFFF", 0)]}
            style={styles.sheen}
          />
        ) : null}
        {edge === "full" ? (
          <>
            <View style={[StyleSheet.absoluteFill, { borderRadius: radius, borderWidth: StyleSheet.hairlineWidth, borderColor: edgeColor }]} />
            <LinearGradient
              colors={[withAlpha(catch_, 0), catch_, withAlpha(catch_, 0)]}
              start={{ x: 0, y: 0.5 }}
              end={{ x: 1, y: 0.5 }}
              style={[styles.highlight, { left: inset, right: inset }]}
            />
          </>
        ) : null}
        {edge === "bottom" ? <View style={[styles.underline, { backgroundColor: edgeColor }]} /> : null}
        {edge === "top" ? <View style={[styles.overline, { backgroundColor: edgeColor }]} /> : null}
      </View>

      <View style={contentStyle}>{children}</View>
    </View>
  );
}

/** A bar docked to the bottom of a screen: the primary action over glass, clear of the home indicator. */
export function GlassDock({ children, style }) {
  const insets = useSafeAreaInsets();
  const { gutter } = useStoreTheme();
  return (
    <Glass
      material="regular"
      edge="top"
      contentStyle={[{ paddingHorizontal: gutter, paddingTop: 12, paddingBottom: Math.max(12, insets.bottom) + 4 }, style]}
    >
      {children}
    </Glass>
  );
}

const styles = StyleSheet.create({
  contact: { position: "absolute", top: "100%", height: 16 },
  contactUp: { position: "absolute", bottom: "100%", height: 18 },
  sheen: { position: "absolute", top: 0, left: 0, right: 0, height: "52%" },
  highlight: { position: "absolute", top: 0, height: StyleSheet.hairlineWidth * 2 },
  underline: { position: "absolute", left: 0, right: 0, bottom: 0, height: StyleSheet.hairlineWidth },
  overline: { position: "absolute", left: 0, right: 0, top: 0, height: StyleSheet.hairlineWidth },
});
