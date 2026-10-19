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
const BADGE = 88;
const BADGE_IMG = 76;

/** Premium certifications row — fixed-size badges so flex never collapses them. */
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
          <View style={styles.row}>
            {copy.badges.map((badge) => (
              <View key={badge.key} style={styles.badge}>
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

        {copy.hint ? (
          <Text style={[styles.hint, { color: muted }]}>{copy.hint}</Text>
        ) : null}
      </View>
    </WebSectionBackdrop>
  );
}

const styles = StyleSheet.create({
  pad: {
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
    marginBottom: 0,
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
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
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
    flexWrap: "wrap",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    width: "100%",
  },
  badge: {
    width: BADGE,
    height: BADGE,
    flexGrow: 0,
    flexShrink: 0,
    alignItems: "center",
    justifyContent: "center",
  },
  badgeImg: {
    width: BADGE_IMG,
    height: BADGE_IMG,
  },
  hint: {
    fontFamily: fonts.regular,
    fontSize: 13,
    lineHeight: 20,
    textAlign: "center",
    maxWidth: 420,
    paddingHorizontal: spacing.sm,
  },
});
