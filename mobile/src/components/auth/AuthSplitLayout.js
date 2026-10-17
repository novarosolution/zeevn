import React from "react";
import { Image, Platform, ScrollView, StyleSheet, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { KankregGrainOverlay } from "../kankreg/KankregPageChrome";
import { AUTH_HERO_IMAGE } from "../../content/authVisualContent";
import { useKankregLayout } from "../../theme/kankregBreakpoints";
import { useTheme } from "../../context/ThemeContext";
import { KANKREG_PALETTE } from "../../theme/kankregWeb";
import { radius, spacing } from "../../theme/tokens";
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

  const formBg = isDark ? "rgba(20,17,16,0.94)" : "rgba(255,252,246,0.94)";
  const formBorder = isDark ? "rgba(52, 211, 153, 0.14)" : "rgba(31, 92, 71, 0.14)";

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
          colors={["rgba(18,16,12,0.28)", "rgba(18,16,12,0.5)", "rgba(12,10,8,0.9)"]}
          locations={[0, 0.42, 1]}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          style={StyleSheet.absoluteFillObject}
        />
        <KankregGrainOverlay />
        <View style={styles.artRing} pointerEvents="none" />
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
          Platform.OS === "web" && styles.formGlass,
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
    maxWidth: 980,
    borderRadius: radius.xl + 6,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(31, 92, 71, 0.16)",
    overflow: "hidden",
    ...Platform.select({
      web: {
        boxShadow:
          "0 32px 72px rgba(22, 69, 51, 0.18), 0 8px 24px rgba(26, 23, 20, 0.08), 0 0 0 1px rgba(31, 92, 71, 0.06)",
        minHeight: 620,
        marginTop: 56,
        marginBottom: 40,
        marginHorizontal: spacing.md,
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
    flex: 1,
    alignSelf: "stretch",
    minWidth: 0,
    position: "relative",
    backgroundColor: "#1a1714",
    borderTopLeftRadius: radius.xl + 4,
    borderBottomLeftRadius: radius.xl + 4,
    ...Platform.select({
      web: { minHeight: 640 },
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
  artRing: {
    position: "absolute",
    top: "8%",
    right: "-12%",
    width: 280,
    height: 280,
    borderRadius: 140,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    ...Platform.select({ web: { pointerEvents: "none" }, default: {} }),
  },
  artScroll: {
    flex: 1,
    width: "100%",
    zIndex: 1,
  },
  artScrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    paddingHorizontal: spacing.xl + 8,
    paddingTop: spacing.xl + 4,
    paddingBottom: spacing.xl + 12,
    minHeight: Platform.OS === "web" ? 640 : 340,
  },
  form: {
    flex: 1,
    alignSelf: "stretch",
    minWidth: 300,
    padding: spacing.xl + 10,
    borderLeftWidth: StyleSheet.hairlineWidth,
    borderTopRightRadius: radius.xl + 6,
    borderBottomRightRadius: radius.xl + 6,
    ...Platform.select({
      web: { minHeight: 620 },
      default: {},
    }),
  },
  formGlass: {
    backdropFilter: "blur(10px)",
    WebkitBackdropFilter: "blur(10px)",
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
    borderTopRightRadius: 0,
    borderBottomLeftRadius: radius.xl + 6,
    borderBottomRightRadius: radius.xl + 6,
  },
});
