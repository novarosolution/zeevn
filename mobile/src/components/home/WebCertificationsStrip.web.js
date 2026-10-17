import React from "react";
import { Image, Platform, StyleSheet, Text, View } from "react-native";
import { CERTIFICATIONS_STRIP } from "../../content/certificationsContent";
import { HOME_SCREEN_UI } from "../../content/appContent";
import { useTheme } from "../../context/ThemeContext";
import { useKankregLayout } from "../../theme/kankregBreakpoints";
import { ZEEVAN_GREEN } from "../../theme/kankregWeb";
import { FONT_HEADING } from "../../theme/typographyRoles";
import { fonts, spacing } from "../../theme/tokens";
import WebSectionBackdrop from "./WebSectionBackdrop";

const BG = require("../../../assets/section-bg-warm-4k.jpg");
const INK = "#1A1C14";
const MUTED = "#3F3C2E";

/** Premium certifications row — individual badges, no crop/clip (web). */
export default function WebCertificationsStrip() {
  if (HOME_SCREEN_UI.web?.showCertificationsStrip === false) return null;

  const { isDark } = useTheme();
  const { isMobileWeb, pageGutterClamp } = useKankregLayout();
  const copy = CERTIFICATIONS_STRIP;
  const ink = isDark ? "#FAF8F4" : INK;
  const muted = isDark ? "rgba(250,248,244,0.72)" : MUTED;

  return (
    <WebSectionBackdrop
      source={BG}
      tone="warm"
      isDark={isDark}
      accessibilityLabel={copy.title}
      style={styles.pad}
    >
      <View style={[styles.inner, { paddingHorizontal: pageGutterClamp }]}>
        <Text style={[styles.eyebrow, { color: isDark ? "#E8BC84" : ZEEVAN_GREEN.deep }]}>
          {copy.eyebrow}
        </Text>
        <Text style={[styles.title, { color: ink }, isMobileWeb && styles.titleMobile]}>
          {copy.title}
        </Text>

        <View style={[styles.frame, isDark && styles.frameDark]}>
          <View style={[styles.row, isMobileWeb && styles.rowMobile]}>
            {copy.badges.map((badge) => (
              <View key={badge.key} style={[styles.badge, isMobileWeb && styles.badgeMobile]}>
                <Image
                  source={badge.image}
                  style={styles.badgeImg}
                  resizeMode="contain"
                  accessibilityLabel={badge.label}
                />
              </View>
            ))}
          </View>
        </View>

        {copy.hint ? <Text style={[styles.hint, { color: muted }]}>{copy.hint}</Text> : null}
      </View>
    </WebSectionBackdrop>
  );
}

const styles = StyleSheet.create({
  pad: {
    paddingTop: spacing.xl,
    paddingBottom: spacing.xl,
  },
  inner: {
    width: "100%",
    maxWidth: 1080,
    alignSelf: "center",
    alignItems: "center",
    gap: spacing.md,
  },
  eyebrow: {
    fontFamily: fonts.semibold,
    fontSize: 11,
    letterSpacing: 2,
    textTransform: "uppercase",
  },
  title: {
    fontFamily: FONT_HEADING,
    fontSize: 26,
    lineHeight: 32,
    letterSpacing: -0.3,
    textAlign: "center",
  },
  titleMobile: { fontSize: 22, lineHeight: 28 },
  frame: {
    width: "100%",
    backgroundColor: "rgba(255,253,248,0.97)",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(26, 28, 20, 0.12)",
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.md,
    ...Platform.select({
      web: { boxShadow: "0 10px 24px -18px rgba(36, 68, 36, 0.16)" },
      default: {},
    }),
  },
  frameDark: {
    backgroundColor: "rgba(255,255,255,0.08)",
    borderColor: "rgba(255,255,255,0.14)",
  },
  row: {
    flexDirection: "row",
    flexWrap: "nowrap",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
    width: "100%",
  },
  rowMobile: {
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 12,
  },
  badge: {
    flex: 1,
    minWidth: 0,
    alignItems: "center",
    justifyContent: "center",
    height: 72,
  },
  badgeMobile: {
    flex: 0,
    width: "30%",
    height: 64,
  },
  badgeImg: {
    width: "100%",
    height: "100%",
    maxWidth: 96,
  },
  hint: {
    fontFamily: fonts.regular,
    fontSize: 12,
    lineHeight: 18,
    textAlign: "center",
    maxWidth: 520,
  },
});
