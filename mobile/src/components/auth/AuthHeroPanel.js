import React from "react";
import { Platform, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { AUTH_UI } from "../../content/appContent";
import { BRAND_LOGO_SIZE } from "../../constants/brand";
import { FONT_HEADING } from "../../theme/typographyRoles";
import { KANKREG_PALETTE } from "../../theme/kankregWeb";
import { fonts, icon, lineHeight, spacing, typography } from "../../theme/tokens";
import BrandLogo from "../BrandLogo";

/** Premium auth hero copy + perk chips — split web panel & native sheet header. */
export default function AuthHeroPanel({
  mode = "login",
  compact = false,
  showLogo = true,
  showPerks = true,
  artTitle,
  artSubtitle,
  variant = "onDark",
  /** "wrap" | "column" — column keeps perks fully visible in narrow panels */
  perksLayout = "wrap",
}) {
  const isLogin = mode === "login";
  const eyebrow = isLogin ? AUTH_UI.loginHeroEyebrow : AUTH_UI.registerFormEyebrow;
  const title =
    artTitle ||
    (isLogin ? AUTH_UI.loginHeroTitle : AUTH_UI.registerHeroTitle);
  const subtitle =
    artSubtitle || (isLogin ? AUTH_UI.loginSubtitle : AUTH_UI.registerSubtitle);
  const perks = isLogin ? AUTH_UI.loginPerks : AUTH_UI.registerPerks;
  const onDark = variant === "onDark";

  return (
    <View style={[styles.wrap, compact && styles.wrapCompact]}>
      {showLogo ? (
        <BrandLogo
          height={compact ? BRAND_LOGO_SIZE.footerCompact : BRAND_LOGO_SIZE.authHero}
          variant={onDark ? "onDark" : "onLight"}
          glow={onDark}
          style={styles.logo}
        />
      ) : null}
      <Text style={[styles.eyebrow, onDark && styles.eyebrowOnDark]}>{eyebrow}</Text>
      <Text style={[styles.title, compact && styles.titleCompact, onDark && styles.titleOnDark]}>
        {title}
      </Text>
      {subtitle ? (
        <Text style={[styles.sub, onDark && styles.subOnDark, compact && styles.subCompact]}>
          {subtitle}
        </Text>
      ) : null}
      {showPerks && perks?.length ? (
        <View
          style={[
            styles.perks,
            perksLayout === "column" && styles.perksColumn,
            compact && styles.perksCompact,
          ]}
        >
          {perks.map((perk) => (
            <View
              key={perk.label}
              style={[
                styles.perk,
                onDark ? styles.perkOnDark : styles.perkOnLight,
                compact && styles.perkCompact,
                perksLayout === "column" && styles.perkColumn,
              ]}
            >
              <Ionicons
                name={perk.icon || "checkmark-circle-outline"}
                size={compact ? icon.xs - 1 : icon.xs}
                color={onDark ? KANKREG_PALETTE.goldBright : KANKREG_PALETTE.goldDeep}
              />
              <Text style={[styles.perkText, onDark && styles.perkTextOnDark]}>
                {perk.label}
              </Text>
            </View>
          ))}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: spacing.sm,
  },
  wrapCompact: {
    gap: spacing.xs + 2,
    marginBottom: spacing.sm,
  },
  logo: {
    marginBottom: spacing.xs,
  },
  eyebrow: {
    fontFamily: fonts.semibold,
    fontSize: typography.overline,
    letterSpacing: 2.8,
    textTransform: "uppercase",
    color: KANKREG_PALETTE.goldDeep,
  },
  eyebrowOnDark: {
    color: KANKREG_PALETTE.goldBright,
    letterSpacing: 3.2,
  },
  title: {
    fontFamily: FONT_HEADING,
    fontSize: typography.h2 + 8,
    lineHeight: lineHeight.h2 + 8,
    letterSpacing: -0.6,
    color: KANKREG_PALETTE.ink,
  },
  titleCompact: {
    fontSize: typography.h2 + 2,
    lineHeight: lineHeight.h2 + 4,
  },
  titleOnDark: {
    color: KANKREG_PALETTE.paper,
  },
  sub: {
    fontFamily: fonts.regular,
    fontSize: typography.bodySmall,
    lineHeight: lineHeight.bodySmall + 4,
    color: KANKREG_PALETTE.inkSoft,
    maxWidth: 340,
  },
  subCompact: {
    fontSize: typography.caption + 1,
    lineHeight: 18,
  },
  subOnDark: {
    color: "rgba(245, 239, 228, 0.88)",
  },
  perks: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  perksCompact: {
    flexDirection: "column",
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  perksColumn: {
    flexDirection: "column",
    alignItems: "flex-start",
    gap: spacing.xs + 2,
  },
  perk: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    paddingVertical: 7,
    paddingHorizontal: 10,
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
    maxWidth: Platform.OS === "web" ? 220 : "100%",
  },
  perkCompact: {
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 12,
    maxWidth: "100%",
  },
  perkColumn: {
    maxWidth: "100%",
    width: "100%",
    borderRadius: 12,
  },
  perkOnDark: {
    backgroundColor: "rgba(255,255,255,0.08)",
    borderColor: "rgba(42, 117, 89, 0.28)",
  },
  perkOnLight: {
    backgroundColor: "rgba(31, 92, 71, 0.08)",
    borderColor: "rgba(31, 92, 71, 0.22)",
  },
  perkText: {
    flexShrink: 1,
    fontFamily: fonts.medium,
    fontSize: typography.caption,
    color: KANKREG_PALETTE.inkSoft,
  },
  perkTextOnDark: {
    color: "rgba(245, 239, 228, 0.9)",
  },
});
