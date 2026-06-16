import React from "react";
import { Platform, StyleSheet, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useKankregLayout } from "../../theme/kankregBreakpoints";
import { useTheme } from "../../context/ThemeContext";
import { FIGMA, figmaPageBg } from "../../theme/figmaApp";
import { KANKREG_PALETTE } from "../../theme/kankregWeb";
import { radius, spacing } from "../../theme/tokens";
import { platformShadow } from "../../theme/shadowPlatform";
import AuthHeroPanel from "./AuthHeroPanel";

const cardShadow = platformShadow({
  ios: {
    shadowColor: "#3D2A12",
    shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.12,
    shadowRadius: 22,
  },
  android: { elevation: 10 },
});

/** Native + narrow web auth — stacked hero (in flow) + form sheet (no overlapping clip). */
export default function AuthMobileShell({ children, artTitle, artSubtitle, mode = "login" }) {
  const { isDark } = useTheme();
  const { isXs, useAuthSplit } = useKankregLayout();
  const isWeb = Platform.OS === "web";

  if (isWeb && useAuthSplit) {
    return <View style={styles.webFallback}>{children}</View>;
  }

  return (
    <View style={styles.root}>
      <View style={[styles.heroBlock, isXs && styles.heroBlockCompact]}>
        <LinearGradient
          colors={["#f3e6c8", "#BC905C", "#2a241e", "#1a1714"]}
          locations={[0, 0.45, 0.78, 1]}
          start={{ x: 0.2, y: 0 }}
          end={{ x: 0.8, y: 1 }}
          style={StyleSheet.absoluteFillObject}
        />
        <View style={styles.heroInner}>
          <AuthHeroPanel
            mode={mode}
            artTitle={artTitle}
            artSubtitle={artSubtitle}
            compact={isXs}
            showPerks={!isXs}
            variant="onDark"
          />
        </View>
      </View>
      <View
        style={[
          styles.sheet,
          isWeb && styles.sheetWeb,
          cardShadow,
          { backgroundColor: figmaPageBg(isDark) },
        ]}
      >
        <View style={styles.sheetAccent} />
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  webFallback: {
    width: "100%",
  },
  root: {
    width: "100%",
    flexGrow: 1,
  },
  heroBlock: {
    position: "relative",
    overflow: "hidden",
    paddingBottom: spacing.lg + 4,
  },
  heroBlockCompact: {
    paddingBottom: spacing.md + 4,
  },
  heroInner: {
    paddingTop: spacing.xl + 8,
    paddingHorizontal: spacing.lg + 4,
    paddingBottom: spacing.sm,
  },
  sheet: {
    marginTop: -spacing.lg,
    borderTopLeftRadius: FIGMA.radiusSheet + 4,
    borderTopRightRadius: FIGMA.radiusSheet + 4,
    paddingHorizontal: spacing.lg + 2,
    paddingTop: spacing.lg + 6,
    paddingBottom: spacing.xl,
  },
  sheetWeb: {
    width: "100%",
    maxWidth: 468,
    alignSelf: "center",
    marginTop: -spacing.md,
    borderRadius: radius.xl,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: KANKREG_PALETTE.line,
    ...Platform.select({
      web: {
        boxShadow: "0 18px 48px rgba(22, 69, 51, 0.12)",
      },
      default: {},
    }),
  },
  sheetAccent: {
    position: "absolute",
    top: 0,
    left: "20%",
    right: "20%",
    height: 3,
    borderBottomLeftRadius: 3,
    borderBottomRightRadius: 3,
    backgroundColor: "rgba(31, 92, 71, 0.65)",
  },
});
