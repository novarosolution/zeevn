import React from "react";
import { StyleSheet, View } from "react-native";
import { useTheme } from "../context/ThemeContext";
import { KANKREG_PALETTE } from "../theme/kankregWeb";
import { SITE_BG_FALLBACK, siteBackgroundStyle } from "../theme/siteBackground";
import { injectWebCssOnce } from "../utils/injectWebCssOnce";

injectWebCssOnce(
  "zeevan-web-chrome-v4-white",
  `html, body, #root, [data-expo-root] {
  background-color: ${SITE_BG_FALLBACK} !important;
  background-image: none !important;
}
body {
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-rendering: optimizeLegibility;
}
::selection {
  background: rgba(85, 107, 50, 0.22);
  color: ${KANKREG_PALETTE.ink};
}
@media (prefers-reduced-motion: no-preference) {
  html { scroll-behavior: smooth; }
}
a, button, [role="button"], [role="link"], [role="tab"] {
  -webkit-tap-highlight-color: transparent;
}`
);

/** Web — pure white page canvas + global polish (customer funnel). */
export default function CustomerScreenShell({ children, style }) {
  const { colors: c, isDark } = useTheme();
  return (
    <View
      style={[
        styles.shell,
        isDark ? { backgroundColor: c.background } : siteBackgroundStyle(false),
        style,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  shell: {
    flex: 1,
    width: "100%",
    maxWidth: "100%",
    minHeight: "100dvh",
    overflowX: "clip",
  },
});
