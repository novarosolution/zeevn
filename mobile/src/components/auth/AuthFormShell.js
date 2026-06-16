import React from "react";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { useTheme } from "../../context/ThemeContext";
import { AUTH_UI } from "../../content/appContent";
import { FONT_HEADING } from "../../theme/typographyRoles";
import { KANKREG_PALETTE } from "../../theme/kankregWeb";
import { fonts, lineHeight, spacing, typography } from "../../theme/tokens";
import AuthRoutePills from "./AuthRoutePills";
import { useKankregLayout } from "../../theme/kankregBreakpoints";

function AuthSocialDivider({ label, isDark }) {
  const lineColor = isDark ? "rgba(52, 211, 153, 0.22)" : "rgba(31, 92, 71, 0.28)";
  const textColor = isDark ? "#9a8f82" : KANKREG_PALETTE.inkFaint;
  return (
    <View style={dividerStyles.row}>
      <View style={[dividerStyles.line, { backgroundColor: lineColor }]} />
      <Text style={[dividerStyles.label, { color: textColor }]}>{label}</Text>
      <View style={[dividerStyles.line, { backgroundColor: lineColor }]} />
    </View>
  );
}

const dividerStyles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginVertical: spacing.md,
  },
  line: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
  },
  label: {
    fontFamily: fonts.semibold,
    fontSize: typography.caption - 1,
    letterSpacing: 0.4,
    textTransform: "uppercase",
  },
});

/**
 * kankreg.html `.auth-form` — title, subtitle, route pills, fields slot, social slot, footer links.
 */
export default function AuthFormShell({
  navigation,
  activeRoute,
  title,
  subtitle,
  formEyebrow,
  /** Hero panel already shows eyebrow + marketing copy — form keeps only the action title. */
  marketingInHero = false,
  children,
  socialSlot,
  footerSlot,
  showRoutePills = true,
  showForgotPassword = false,
  onForgotPassword,
  compact = false,
}) {
  const { isDark } = useTheme();
  const { isXs } = useKankregLayout();
  const isNativeApp = Platform.OS !== "web";
  const resolvedEyebrow =
    formEyebrow ||
    (activeRoute === "Login" ? AUTH_UI.loginFormEyebrow : AUTH_UI.registerFormEyebrow);
  const showFormEyebrow = !isNativeApp && !marketingInHero;
  const showFormTitle = !isNativeApp && !marketingInHero;
  const showFormSubtitle = !isNativeApp && Boolean(subtitle) && !marketingInHero;

  return (
    <View style={[styles.shell, compact && styles.shellCompact]}>
      {showFormEyebrow ? (
        <Text style={[styles.formEyebrow, { color: isDark ? KANKREG_PALETTE.goldBright : KANKREG_PALETTE.goldDeep }]}>
          {resolvedEyebrow}
        </Text>
      ) : null}
      {showFormTitle ? (
        <Text
          style={[
            styles.h1,
            isXs && styles.h1Compact,
            marketingInHero && styles.h1WithHero,
            { color: isDark ? KANKREG_PALETTE.paper : KANKREG_PALETTE.ink },
          ]}
        >
          {title}
        </Text>
      ) : null}
      {showFormSubtitle ? (
        <Text style={[styles.sub, { color: isDark ? "#c8bdaf" : KANKREG_PALETTE.inkSoft }]}>
          {subtitle}
        </Text>
      ) : null}
      {showRoutePills && navigation ? (
        <AuthRoutePills navigation={navigation} activeRoute={activeRoute} wide={marketingInHero} />
      ) : null}
      <View style={styles.fields}>{children}</View>
      {showForgotPassword ? (
        <Pressable
          onPress={onForgotPassword}
          style={styles.forgotWrap}
          accessibilityRole="button"
        >
          <Text style={[styles.forgot, { color: isDark ? KANKREG_PALETTE.goldBright : KANKREG_PALETTE.gold }]}>
            {AUTH_UI.forgotPassword}
          </Text>
        </Pressable>
      ) : null}
      {socialSlot ? (
        <>
          <AuthSocialDivider label={AUTH_UI.socialDivider} isDark={isDark} />
          {socialSlot}
        </>
      ) : null}
      {footerSlot ? <View style={styles.footer}>{footerSlot}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  shell: {
    width: "100%",
    maxWidth: 468,
    alignSelf: "center",
  },
  shellCompact: {
    maxWidth: "100%",
  },
  formEyebrow: {
    fontFamily: fonts.semibold,
    fontSize: typography.overline,
    letterSpacing: 2.4,
    textTransform: "uppercase",
    marginBottom: spacing.xs,
  },
  h1: {
    fontFamily: FONT_HEADING,
    fontWeight: "400",
    fontSize: Platform.select({ web: 38, default: typography.h1 }),
    lineHeight: Platform.select({ web: 44, default: lineHeight.h1 + 4 }),
    letterSpacing: -0.5,
    marginBottom: spacing.sm,
  },
  h1Compact: {
    fontSize: typography.h2 + 2,
    lineHeight: lineHeight.h2 + 4,
  },
  h1WithHero: {
    marginBottom: spacing.md,
  },
  sub: {
    fontSize: typography.bodySmall,
    lineHeight: lineHeight.bodySmall + 2,
    marginBottom: spacing.md,
  },
  fields: {
    width: "100%",
    gap: spacing.sm,
  },
  forgotWrap: {
    alignSelf: "flex-end",
    marginTop: spacing.xs,
    marginBottom: spacing.sm,
  },
  forgot: {
    fontSize: typography.caption,
    fontFamily: fonts.semibold,
  },
  footer: {
    marginTop: spacing.md,
    alignItems: "center",
    gap: spacing.sm,
  },
});
