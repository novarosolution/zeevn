import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import BrandLogo from "../BrandLogo";
import { BRAND_LOGO_SIZE } from "../../constants/brand";
import { FONT_HEADING } from "../../theme/typographyRoles";
import { fonts, lineHeight, spacing, typography } from "../../theme/tokens";

/** Lightweight native auth header — no video loop. `compact` reduces height when form card is primary. */
export default function AuthCompactHero({ compact = false }) {
  return (
    <View style={[styles.wrap, compact && styles.wrapCompact]}>
      <LinearGradient
        colors={["#ead9b2", "#b6985c", "#2a241e"]}
        locations={[0, 0.45, 1]}
        start={{ x: 0.2, y: 0 }}
        end={{ x: 0.85, y: 1 }}
        style={StyleSheet.absoluteFillObject}
      />
      <BrandLogo
        height={compact ? BRAND_LOGO_SIZE.authHero - 12 : BRAND_LOGO_SIZE.authHero}
        variant="onDark"
        glow
        style={styles.logo}
      />
      <Text style={styles.eyebrow}>Welcome back</Text>
      {!compact ? (
        <Text style={styles.title}>Goods worth coming back for.</Text>
      ) : (
        <Text style={styles.titleCompact}>Premium essentials</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: "100%",
    maxWidth: 468,
    alignSelf: "center",
    borderRadius: 20,
    overflow: "hidden",
    minHeight: 140,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
    marginTop: spacing.sm,
  },
  wrapCompact: {
    minHeight: 96,
    paddingVertical: spacing.md,
    marginBottom: spacing.sm,
  },
  logo: {
    alignSelf: "center",
    marginBottom: spacing.sm,
  },
  eyebrow: {
    textAlign: "center",
    fontFamily: fonts.semibold,
    fontSize: typography.overline,
    letterSpacing: 2.8,
    textTransform: "uppercase",
    color: "#788844",
    marginBottom: spacing.xs,
  },
  title: {
    textAlign: "center",
    fontFamily: FONT_HEADING,
    fontSize: typography.h3 + 2,
    lineHeight: lineHeight.h3 + 4,
    color: "#f5efe4",
    letterSpacing: -0.4,
  },
  titleCompact: {
    textAlign: "center",
    fontFamily: FONT_HEADING,
    fontSize: typography.body + 2,
    lineHeight: lineHeight.body + 4,
    color: "#f5efe4",
    letterSpacing: -0.3,
  },
});
