import React from "react";
import { Image, Platform, StyleSheet, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { AUTH_HERO_IMAGE } from "../../content/authVisualContent";
import { useKankregLayout } from "../../theme/kankregBreakpoints";
import { useTheme } from "../../context/ThemeContext";
import { FIGMA } from "../../theme/figmaApp";
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
        <Image
          source={AUTH_HERO_IMAGE}
          style={styles.heroPhoto}
          resizeMode="cover"
          accessibilityIgnoresInvertColors
        />
        <LinearGradient
          colors={["rgba(18,16,12,0.4)", "rgba(12,10,8,0.82)"]}
          locations={[0.2, 1]}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          style={StyleSheet.absoluteFillObject}
        />
        <View style={styles.heroInner}>
          <AuthHeroPanel
            mode={mode}
            artTitle={artTitle}
            artSubtitle={artSubtitle}
            compact={isXs}
            showPerks={false}
            variant="onDark"
          />
        </View>
      </View>
      <View
        style={[
          styles.sheet,
          isWeb && styles.sheetWeb,
          cardShadow,
          {
            backgroundColor: isDark ? "rgba(20,17,16,0.94)" : "rgba(255,252,246,0.96)",
          },
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
    backgroundColor: "#1a1714",
    minHeight: 220,
    paddingBottom: spacing.lg + 4,
  },
  heroBlockCompact: {
    minHeight: 180,
    paddingBottom: spacing.md + 4,
  },
  heroPhoto: {
    ...StyleSheet.absoluteFillObject,
    width: "100%",
    height: "100%",
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
    marginHorizontal: spacing.md,
    borderRadius: radius.xl + 2,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(31, 92, 71, 0.16)",
    ...Platform.select({
      web: {
        boxShadow: "0 22px 52px rgba(22, 69, 51, 0.16)",
        backdropFilter: "blur(8px)",
        WebkitBackdropFilter: "blur(8px)",
      },
      default: {},
    }),
  },
  sheetAccent: {
    position: "absolute",
    top: 0,
    left: "22%",
    right: "22%",
    height: 3,
    borderBottomLeftRadius: 3,
    borderBottomRightRadius: 3,
    backgroundColor: "rgba(31, 92, 71, 0.7)",
  },
});
