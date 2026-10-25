import React from "react";
import { Image, Platform, StyleSheet, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { AUTH_HERO_IMAGE } from "../../content/authVisualContent";
import { useKankregLayout } from "../../theme/kankregBreakpoints";
import { useStoreTheme } from "../../theme/storefront";
import { spacing } from "../../theme/tokens";
import AuthHeroPanel from "./AuthHeroPanel";

/**
 * Premium Login / Register split card — photo hero + form (web md+).
 */
export default function AuthSplitLayout({ artTitle, artSubtitle, mode = "login", children }) {
  const { useAuthSplit, isXs } = useKankregLayout();
  const { c } = useStoreTheme();

  if (!useAuthSplit) {
    return <View style={styles.mobileOnly}>{children}</View>;
  }

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
          colors={["rgba(12,10,8,0.18)", "rgba(12,10,8,0.38)", "rgba(10,8,6,0.78)"]}
          locations={[0, 0.45, 1]}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          style={StyleSheet.absoluteFillObject}
          pointerEvents="none"
        />
        <View style={styles.artInner}>
          <AuthHeroPanel
            mode={mode}
            artTitle={artTitle}
            artSubtitle={artSubtitle}
            compact={isXs}
            showPerks
            variant="onDark"
            perksLayout="column"
          />
        </View>
      </View>

      <View
        style={[
          styles.form,
          isXs && styles.formStack,
          { backgroundColor: c.page },
        ]}
      >
        {children}
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
    maxWidth: 1040,
    borderRadius: 28,
    overflow: "hidden",
    backgroundColor: "#FFFEF9",
    ...Platform.select({
      web: {
        boxShadow: "0 24px 56px rgba(26, 23, 20, 0.16), 0 4px 16px rgba(22, 69, 51, 0.06)",
        minHeight: 620,
        marginVertical: 40,
        marginHorizontal: spacing.lg,
      },
      default: { minHeight: 560 },
    }),
  },
  splitStack: {
    flexDirection: "column",
    minHeight: 0,
  },
  art: {
    flex: 1.08,
    position: "relative",
    minWidth: 0,
    backgroundColor: "#1a1714",
    ...Platform.select({
      web: { minHeight: 620 },
      default: { minHeight: 340, overflow: "hidden" },
    }),
  },
  artStack: {
    minHeight: 260,
    flex: 0,
  },
  artPhoto: {
    ...StyleSheet.absoluteFillObject,
    width: "100%",
    height: "100%",
  },
  artInner: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1,
    justifyContent: "flex-end",
    paddingHorizontal: spacing.xl + 6,
    paddingTop: spacing.xl,
    paddingBottom: spacing.xl + 10,
  },
  form: {
    flex: 0.92,
    minWidth: 320,
    justifyContent: "center",
    paddingHorizontal: spacing.xl + 14,
    paddingVertical: spacing.xl + 10,
    ...Platform.select({
      web: { minHeight: 620 },
      default: {},
    }),
  },
  formStack: {
    minWidth: 0,
    width: "100%",
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "rgba(31, 92, 71, 0.12)",
  },
});
