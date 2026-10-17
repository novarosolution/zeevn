import React from "react";
import { StyleSheet, View } from "react-native";
import { useTheme } from "../context/ThemeContext";
import { KANKREG_PALETTE } from "../theme/kankregWeb";
import {
  buildSiteBackgroundCss,
  getSiteBackgroundUri,
  SITE_BG_FALLBACK,
  siteBackgroundStyle,
} from "../theme/siteBackground";
import { injectWebCssOnce } from "../utils/injectWebCssOnce";

const bgUri = getSiteBackgroundUri();
const bgStack = buildSiteBackgroundCss(bgUri);

injectWebCssOnce(
  "zeevan-web-chrome-v2",
  `html, body, #root {
  background-color: ${SITE_BG_FALLBACK};
  background-image: ${bgStack};
  background-size: auto, auto, auto, cover;
  background-position: center;
  background-repeat: no-repeat;
  background-attachment: fixed;
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

/** Web — premium photo atelier shell + global polish. */
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
