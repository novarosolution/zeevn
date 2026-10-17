import React from "react";
import { Image, Platform, ScrollView, StyleSheet, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { KankregGrainOverlay } from "../kankreg/KankregPageChrome";
import { AUTH_HERO_IMAGE } from "../../content/authVisualContent";
import { useKankregLayout } from "../../theme/kankregBreakpoints";
import { useTheme } from "../../context/ThemeContext";
import { KANKREG_PALETTE } from "../../theme/kankregWeb";
import { spacing } from "../../theme/tokens";
import AuthHeroPanel from "./AuthHeroPanel";

/**
 * kankreg.html `.auth` split panel — used on web for Login / Register.
 */
export default function AuthSplitLayout({ artTitle, artSubtitle, mode = "login", children }) {
  const { useAuthSplit, isXs } = useKankregLayout();
  const { isDark } = useTheme();
  const useSplit = useAuthSplit;

  if (!useSplit) {
    return <View style={styles.mobileOnly}>{children}</View>;
  }

  const formBg = isDark ? "#141110" : "#FFFEF9";
  const formBorder = isDark ? "rgba(52, 211, 153, 0.14)" : "rgba(31, 92, 71, 0.1)";

  return (
    <View style={[styles.split, isXs && styles.splitStack]}>
      <View style={[styles.art, isXs && styles.artStack]}>
        <Image
          source={AUTH_HERO_IMAGE}
          style={styles.artPhoto}
          resizeMode="cover"
          accessibilityIgnoresInvertColors
        />
        <LinearGradient
          colors={["rgba(18,16,12,0.22)", "rgba(18,16,12,0.42)", "rgba(12,10,8,0.82)"]}
          locations={[0, 0.4, 1]}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          style={StyleSheet.absoluteFillObject}
        />
        <KankregGrainOverlay />
        <ScrollView
          style={styles.artScroll}
          contentContainerStyle={styles.artScrollContent}
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
          <AuthHeroPanel
            mode={mode}
            artTitle={artTitle}
            artSubtitle={artSubtitle}
            compact={isXs}
            showPerks
            variant="onDark"
            perksLayout="column"
          />
        </ScrollView>
      </View>
      <View
        style={[
          styles.form,
          isXs && styles.formStack,
          { backgroundColor: formBg, borderLeftColor: formBorder },
        ]}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.formScrollContent}
        >
          {children}
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  mobileOnly: {
    width: "100%",
  },
  split: {
    flexDirection: "row",
    alignItems: "stretch",
    alignSelf: "center",
    width: "100%",
    maxWidth: 1000,
    borderRadius: 28,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(31, 92, 71, 0.12)",
    overflow: "hidden",
    backgroundColor: "#FFFEF9",
    ...Platform.select({
      web: {
        boxShadow:
          "0 28px 64px rgba(26, 23, 20, 0.14), 0 8px 20px rgba(22, 69, 51, 0.08)",
        minHeight: 600,
        marginTop: 48,
        marginBottom: 48,
        marginHorizontal: spacing.lg,
      },
      default: {
        minHeight: 560,
      },
    }),
  },
  splitStack: {
    flexDirection: "column",
    minHeight: 0,
  },
  art: {
    flex: 1.05,
    alignSelf: "stretch",
    minWidth: 0,
    position: "relative",
    backgroundColor: "#1a1714",
    ...Platform.select({
      web: { minHeight: 600 },
      default: { minHeight: 340, overflow: "hidden" },
    }),
  },
  artStack: {
    minHeight: 280,
    flex: 0,
  },
  artPhoto: {
    ...StyleSheet.absoluteFillObject,
    width: "100%",
    height: "100%",
  },
  artScroll: {
    flex: 1,
    width: "100%",
    zIndex: 1,
  },
  artScrollContent: {
    flexGrow: 1,
    justifyContent: "flex-end",
    paddingHorizontal: spacing.xl + 4,
    paddingTop: spacing.xl,
    paddingBottom: spacing.xl + 8,
    minHeight: Platform.OS === "web" ? 600 : 340,
  },
  form: {
    flex: 0.95,
    alignSelf: "stretch",
    minWidth: 300,
    paddingHorizontal: spacing.xl + 12,
    paddingVertical: spacing.xl + 8,
    borderLeftWidth: StyleSheet.hairlineWidth,
    ...Platform.select({
      web: { minHeight: 600 },
      default: {},
    }),
  },
  formScrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    paddingVertical: spacing.sm,
    width: "100%",
  },
  formStack: {
    minWidth: 0,
    width: "100%",
    borderLeftWidth: 0,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: KANKREG_PALETTE.line,
  },
});
