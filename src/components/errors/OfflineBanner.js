import React, { useMemo } from "react";
import { Platform, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useConnectivityOptional } from "../../context/ConnectivityContext";
import { useTheme } from "../../context/ThemeContext";
import { fonts } from "../../theme/tokens";
import { WEB_Z_INDEX } from "../../theme/web";
import { OBSERVABILITY_UI } from "../../content/appContent";

export default function OfflineBanner() {
  const connectivity = useConnectivityOptional();
  const { semanticPalette, TYPE, SPACING } = useTheme();
  const insets = useSafeAreaInsets();

  const isOffline = connectivity?.isOffline;
  const isFlushing = connectivity?.isFlushing;

  const styles = useMemo(
    () =>
      StyleSheet.create({
        shell: {
          position: Platform.OS === "web" ? "fixed" : "absolute",
          top: Platform.OS === "web" ? 0 : insets.top,
          left: 0,
          right: 0,
          zIndex: WEB_Z_INDEX.toast + 2,
          backgroundColor: semanticPalette.warningBg || "rgba(177, 123, 39, 0.12)",
          borderBottomWidth: StyleSheet.hairlineWidth,
          borderBottomColor: semanticPalette.border,
          paddingTop: Platform.OS === "web" ? 8 : 4,
          paddingBottom: 8,
          paddingHorizontal: SPACING.md,
        },
        row: {
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
          maxWidth: 720,
          alignSelf: "center",
          width: "100%",
        },
        text: {
          flex: 1,
          fontFamily: fonts.medium,
          fontSize: TYPE.caption.fontSize,
          lineHeight: TYPE.caption.lineHeight,
          color: semanticPalette.ink,
          textAlign: "center",
        },
      }),
    [TYPE, SPACING, insets.top, semanticPalette]
  );

  if (!isOffline && !isFlushing) return null;

  const message = isFlushing ? OBSERVABILITY_UI.offlineSyncing : OBSERVABILITY_UI.offlineBanner;

  return (
    <View style={styles.shell} accessibilityRole="alert" accessibilityLiveRegion="polite">
      <View style={styles.row}>
        <Ionicons name="cloud-offline-outline" size={18} color={semanticPalette.ink} />
        <Text style={styles.text}>{message}</Text>
      </View>
    </View>
  );
}
