import React from "react";
import { Platform, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { getKankregChromeTop } from "./KankregSiteHeader";
import KankregSiteFooter from "./KankregSiteFooter";
import WebCertificationsStrip from "../home/WebCertificationsStrip";

/**
 * Standard page tail: certifications strip + global HTML footer.
 * Header is mounted once in AppNavigator.
 */
export function KankregPageFooter() {
  return (
    <View style={{ margin: 0, padding: 0, gap: 0 }}>
      {Platform.OS === "web" ? <WebCertificationsStrip /> : null}
      <KankregSiteFooter />
    </View>
  );
}

/** Extra top padding below fixed header (web) or native chrome. */
export function useKankregContentPadding(extra = 0) {
  const insets = useSafeAreaInsets();
  const top = getKankregChromeTop(insets) + extra;
  const bottom = Platform.OS === "web" ? 24 : insets.bottom + 88;
  return { paddingTop: top, paddingBottom: bottom };
}

export function KankregScrollSpacer({ children, style }) {
  const { paddingTop } = useKankregContentPadding();
  return <View style={[{ paddingTop }, style]}>{children}</View>;
}
