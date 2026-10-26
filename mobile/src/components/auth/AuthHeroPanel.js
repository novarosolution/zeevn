import React from "react";
import { Platform, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { AUTH_UI } from "../../content/appContent";
import { APP_DISPLAY_NAME } from "../../constants/brand";
import { FONT_HEADING } from "../../theme/typographyRoles";
import { KANKREG_PALETTE } from "../../theme/kankregWeb";
import { fonts, icon, typography } from "../../theme/tokens";

/** Premium auth hero copy + perk chips — split web panel & native sheet header. */
export default function AuthHeroPanel({
  mode = "login",
  compact = false,
  showLogo = true,
  showPerks = true,
  artTitle,
  artSubtitle,
  variant = "onDark",
  perksLayout = "wrap",
}) {
  const isLogin = mode === "login";
  const eyebrow = isLogin ? AUTH_UI.loginHeroEyebrow : AUTH_UI.registerFormEyebrow;
  const title =
    artTitle || (isLogin ? AUTH_UI.loginHeroTitle : AUTH_UI.registerHeroTitle);
  const subtitle =
    artSubtitle || (isLogin ? AUTH_UI.loginSubtitle : AUTH_UI.registerSubtitle);
  const perks = isLogin ? AUTH_UI.loginPerks : AUTH_UI.registerPerks;
  const onDark = variant === "onDark";

  return (
    <View style={[styles.wrap, compact && styles.wrapCompact]}>
      {showLogo ? (
        <Text
          style={[styles.wordmark, onDark && styles.wordmarkOnDark, compact && styles.wordmarkCompact]}
          accessibilityRole="header"
        >
          {APP_DISPLAY_NAME}
        </Text>
      ) : null}
      {eyebrow ? (
        <Text style={[styles.eyebrow, onDark && styles.eyebrowOnDark]}>{eyebrow}</Text>
      ) : null}
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
                color={onDark ? "#E8BC84" : KANKREG_PALETTE.goldDeep}
              />
              <Text style={[styles.perkText, onDark && styles.perkTextOnDark]}>{perk.label}</Text>
            </View>
          ))}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: 10,
    maxWidth: 420,
  },
  wrapCompact: {
    gap: 8,
    maxWidth: "100%",
  },
  wordmark: {
    fontFamily: FONT_HEADING,
    fontSize: 42,
    lineHeight: 46,
    letterSpacing: -0.8,
    color: KANKREG_PALETTE.ink,
    marginBottom: 2,
  },
  wordmarkOnDark: {
    color: "#FAF8F4",
  },
  wordmarkCompact: {
    fontSize: 32,
    lineHeight: 36,
  },
  eyebrow: {
    fontFamily: fonts.semibold,
    fontSize: 11,
    letterSpacing: 2.6,
    textTransform: "uppercase",
    color: KANKREG_PALETTE.goldDeep,
  },
  eyebrowOnDark: {
    color: "rgba(232, 188, 132, 0.92)",
    letterSpacing: 3,
  },
  title: {
    fontFamily: FONT_HEADING,
    fontSize: 36,
    lineHeight: 42,
    letterSpacing: -0.6,
    color: KANKREG_PALETTE.ink,
    marginTop: 4,
  },
  titleCompact: {
    fontSize: 26,
    lineHeight: 32,
  },
  titleOnDark: {
    color: "#FAF8F4",
  },
  sub: {
    fontFamily: fonts.regular,
    fontSize: 14,
    lineHeight: 21,
    color: KANKREG_PALETTE.inkSoft,
    maxWidth: 340,
    marginTop: 2,
  },
  subCompact: {
    fontSize: 13,
    lineHeight: 19,
  },
  subOnDark: {
    color: "rgba(250, 248, 244, 0.86)",
  },
  perks: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 14,
  },
  perksCompact: {
    flexDirection: "column",
    gap: 6,
    marginTop: 10,
  },
  perksColumn: {
    flexDirection: "column",
    alignItems: "flex-start",
    gap: 8,
  },
  perk: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
    maxWidth: Platform.OS === "web" ? 240 : "100%",
  },
  perkCompact: {
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  perkColumn: {
    width: "auto",
    alignSelf: "flex-start",
  },
  perkOnDark: {
    backgroundColor: "rgba(12, 10, 8, 0.52)",
    borderColor: "rgba(255,255,255,0.16)",
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
    color: "rgba(250, 248, 244, 0.92)",
  },
});
