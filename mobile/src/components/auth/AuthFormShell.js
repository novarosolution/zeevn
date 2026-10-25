import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { AUTH_UI } from "../../content/appContent";
import { useStoreTheme } from "../../theme/storefront";
import AuthRoutePills from "./AuthRoutePills";

function Divider({ label }) {
  const { c, type } = useStoreTheme();
  return (
    <View style={styles.divider}>
      <View style={[styles.rule, { backgroundColor: c.lineStrong }]} />
      <Text style={type.ui(12.5, "semibold", c.inkMute)}>{label}</Text>
      <View style={[styles.rule, { backgroundColor: c.lineStrong }]} />
    </View>
  );
}

/**
 * Title, fields, optional Google / Apple row and footer for Login and Register.
 * `compact` is the phone layout: centred title, and the Sign in / Create account switch is drawn by the hero shell.
 * Without it (the wide-web form panel) the title is left-aligned and the switch sits under the subtitle.
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
  compact = false,
}) {
  const { c, type } = useStoreTheme();
  const eyebrow = formEyebrow || (activeRoute === "Login" ? AUTH_UI.loginFormEyebrow : AUTH_UI.registerFormEyebrow);

  return (
    <View style={[styles.shell, compact && styles.shellCompact]}>
      {compact ? null : <Text style={type.eyebrow(c.brandAlt, 11)}>{eyebrow}</Text>}
      <Text
        style={[type.display(compact ? 32 : 38, { semi: true }), compact && styles.centered, styles.title]}
        accessibilityRole="header"
      >
        {title}
      </Text>
      {subtitle ? (
        <Text style={[type.ui(14.5, "medium", c.inkMute, { lineHeight: 21 }), compact && styles.centered, styles.sub]}>{subtitle}</Text>
      ) : null}

      {showRoutePills && navigation && !compact ? (
        <AuthRoutePills navigation={navigation} activeRoute={activeRoute} style={styles.pills} />
      ) : null}

      <View style={styles.fields}>{children}</View>

      {socialSlot ? (
        <>
          <Divider label={AUTH_UI.socialDivider} />
          {socialSlot}
        </>
      ) : null}

      {footerSlot ? <View style={styles.footer}>{footerSlot}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  shell: { width: "100%", maxWidth: 440, alignSelf: "center" },
  shellCompact: { maxWidth: "100%" },
  centered: { textAlign: "center", alignSelf: "center" },
  title: { marginTop: 4 },
  sub: { marginTop: 6, maxWidth: 320 },
  pills: { marginTop: 22 },
  fields: { width: "100%", gap: 12, marginTop: 22 },
  divider: { flexDirection: "row", alignItems: "center", gap: 12, marginTop: 24, marginBottom: 16 },
  rule: { flex: 1, height: StyleSheet.hairlineWidth * 2 },
  footer: { marginTop: 18, alignItems: "center" },
});
