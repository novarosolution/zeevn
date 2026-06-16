import React from "react";
import { Platform, ScrollView, StyleSheet, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { KankregGrainOverlay } from "../kankreg/KankregPageChrome";
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

  const formBg = isDark ? "#141110" : KANKREG_PALETTE.card;
  const formBorder = isDark ? "rgba(52, 211, 153, 0.12)" : "rgba(31, 92, 71, 0.12)";

  return (
    <View style={[styles.split, isXs && styles.splitStack]}>
      <View style={[styles.art, isXs && styles.artStack]}>
        <LinearGradient
          colors={["#f3e6c8", "#BC905C", "#3d3228", "#1a1714"]}
          locations={[0, 0.38, 0.72, 1]}
          start={{ x: 0.15, y: 0 }}
          end={{ x: 0.85, y: 1 }}
          style={StyleSheet.absoluteFillObject}
        />
        <LinearGradient
          colors={["transparent", "rgba(26, 23, 20, 0.55)"]}
          start={{ x: 0.5, y: 0.35 }}
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
    maxWidth: 960,
    borderRadius: radius.xl + 4,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: KANKREG_PALETTE.line,
    overflow: "hidden",
    ...Platform.select({
      web: {
        boxShadow: "0 28px 64px rgba(22, 69, 51, 0.14), 0 0 0 1px rgba(31, 92, 71, 0.08)",
        minHeight: 640,
        marginTop: 100,
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
    padding: spacing.xl + 8,
    borderLeftWidth: StyleSheet.hairlineWidth,
    borderTopRightRadius: radius.xl + 4,
    borderBottomRightRadius: radius.xl + 4,
    ...Platform.select({
      web: { minHeight: 640 },
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
    borderTopRightRadius: 0,
    borderBottomLeftRadius: radius.xl + 4,
    borderBottomRightRadius: radius.xl + 4,
  },
});
