import React from "react";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { useTheme } from "../../context/ThemeContext";
import { AUTH_UI } from "../../content/appContent";
import { FONT_HEADING } from "../../theme/typographyRoles";
import { KANKREG_PALETTE, ZEEVAN_GREEN } from "../../theme/kankregWeb";
import { fonts, lineHeight, spacing, typography } from "../../theme/tokens";
import AuthRoutePills from "./AuthRoutePills";
import { useKankregLayout } from "../../theme/kankregBreakpoints";

function AuthSocialDivider({ label, isDark }) {
  const lineColor = isDark ? "rgba(52, 211, 153, 0.22)" : "rgba(36, 68, 36, 0.18)";
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
 * Auth form shell — clear title, Sign in / Register toggle, fields, optional OAuth.
 */
export default function AuthFormShell({
  navigation,
  activeRoute,
  title,
  subtitle,
  formEyebrow,
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
  const resolvedEyebrow =
    formEyebrow ||
    (activeRoute === "Login" ? AUTH_UI.loginFormEyebrow : AUTH_UI.registerFormEyebrow);

  return (
    <View style={[styles.shell, compact && styles.shellCompact]}>
      <Text
        style={[
          styles.formEyebrow,
          { color: isDark ? KANKREG_PALETTE.goldBright : ZEEVAN_GREEN.deep },
        ]}
      >
        {resolvedEyebrow}
      </Text>
      <Text
        style={[
          styles.h1,
          isXs && styles.h1Compact,
          { color: isDark ? KANKREG_PALETTE.paper : KANKREG_PALETTE.ink },
        ]}
      >
        {title}
      </Text>
      {subtitle ? (
        <Text style={[styles.sub, { color: isDark ? "#c8bdaf" : KANKREG_PALETTE.inkSoft }]}>
          {subtitle}
        </Text>
      ) : null}

      {showRoutePills && navigation ? (
        <AuthRoutePills navigation={navigation} activeRoute={activeRoute} wide />
      ) : null}

      <View style={styles.fields}>{children}</View>

      {showForgotPassword && onForgotPassword ? (
        <Pressable
          onPress={onForgotPassword}
          style={styles.forgotWrap}
          accessibilityRole="button"
        >
          <Text
            style={[
              styles.forgot,
              { color: isDark ? KANKREG_PALETTE.goldBright : KANKREG_PALETTE.goldDeep },
            ]}
          >
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
    maxWidth: 440,
    alignSelf: "center",
  },
  shellCompact: {
    maxWidth: "100%",
  },
  formEyebrow: {
    fontFamily: fonts.semibold,
    fontSize: typography.overline,
    letterSpacing: 2.2,
    textTransform: "uppercase",
    marginBottom: spacing.xs,
  },
  h1: {
    fontFamily: FONT_HEADING,
    fontWeight: "400",
    fontSize: Platform.select({ web: 34, default: typography.h1 }),
    lineHeight: Platform.select({ web: 40, default: lineHeight.h1 + 4 }),
    letterSpacing: -0.45,
    marginBottom: spacing.xs,
  },
  h1Compact: {
    fontSize: typography.h2 + 2,
    lineHeight: lineHeight.h2 + 4,
  },
  sub: {
    fontSize: typography.bodySmall,
    lineHeight: lineHeight.bodySmall + 2,
    marginBottom: spacing.md,
  },
  fields: {
    width: "100%",
    gap: spacing.md,
    marginTop: spacing.md,
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
    marginTop: spacing.lg,
    alignItems: "center",
  },
});
