import React from "react";
import { StyleSheet, View } from "react-native";
import { useTheme } from "../context/ThemeContext";
import { KANKREG_PALETTE } from "../theme/kankregWeb";
import { injectWebCssOnce } from "../utils/injectWebCssOnce";

injectWebCssOnce(
  "zeevan-web-chrome-v1",
  `html, body, #root {
  background: ${KANKREG_PALETTE.paper};
}
body {
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-rendering: optimizeLegibility;
}
::selection {
  background: rgba(92, 104, 52, 0.22);
  color: ${KANKREG_PALETTE.ink};
}
@media (prefers-reduced-motion: no-preference) {
  html { scroll-behavior: smooth; }
}
a, button, [role="button"], [role="link"], [role="tab"] {
  -webkit-tap-highlight-color: transparent;
}`
);

/** Web — cream atelier shell + global polish. */
export default function CustomerScreenShell({ children, style }) {
  const { colors: c, isDark } = useTheme();
  return (
    <View
      style={[
        styles.shell,
        { backgroundColor: isDark ? c.background : KANKREG_PALETTE.paper },
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
