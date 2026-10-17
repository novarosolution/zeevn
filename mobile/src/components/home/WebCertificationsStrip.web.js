import React from "react";
import { Image, Platform, StyleSheet, Text, View } from "react-native";
import { CERTIFICATIONS_STRIP } from "../../content/certificationsContent";
import { HOME_SCREEN_UI } from "../../content/appContent";
import { useTheme } from "../../context/ThemeContext";
import { useKankregLayout } from "../../theme/kankregBreakpoints";
import { KANKREG_PALETTE, ZEEVAN_GREEN } from "../../theme/kankregWeb";
import { FONT_HEADING } from "../../theme/typographyRoles";
import { fonts, spacing } from "../../theme/tokens";

/** Premium certifications row — individual badges, no crop/clip (web). */
export default function WebCertificationsStrip() {
  if (HOME_SCREEN_UI.web?.showCertificationsStrip === false) return null;

  const { isDark } = useTheme();
  const { isMobileWeb, pageGutterClamp } = useKankregLayout();
  const copy = CERTIFICATIONS_STRIP;
  const ink = isDark ? "#FAF8F4" : ZEEVAN_GREEN.deep;
  const muted = isDark ? "rgba(250,248,244,0.62)" : KANKREG_PALETTE.inkSoft;

  return (
    <View
      style={[styles.shell, isDark && styles.shellDark]}
      accessibilityRole="region"
      accessibilityLabel={copy.title}
    >
      <View style={[styles.inner, { paddingHorizontal: pageGutterClamp }]}>
        <Text style={[styles.eyebrow, { color: ZEEVAN_GREEN.base }]}>{copy.eyebrow}</Text>
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

        {copy.hint ? (
          <Text style={[styles.hint, { color: muted }]}>{copy.hint}</Text>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  shell: {
    width: "100%",
    backgroundColor: "#F7F1E3",
    paddingTop: spacing.xl,
    paddingBottom: spacing.xl,
    borderTopWidth: 1,
    borderTopColor: "rgba(36, 68, 36, 0.08)",
    alignSelf: "center",
    ...Platform.select({
      web: {
        width: "100vw",
        maxWidth: "100vw",
        marginLeft: "calc(50% - 50vw)",
        marginRight: "calc(50% - 50vw)",
      },
      default: {},
    }),
  },
  shellDark: {
    backgroundColor: "#161412",
    borderTopColor: "rgba(255,255,255,0.06)",
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
    backgroundColor: "#FCFAF6",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(36, 68, 36, 0.1)",
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.md,
    ...Platform.select({
      web: { boxShadow: "0 10px 24px -18px rgba(36, 68, 36, 0.16)" },
      default: {},
    }),
  },
  frameDark: {
    backgroundColor: "rgba(255,255,255,0.04)",
    borderColor: "rgba(255,255,255,0.08)",
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
    maxWidth: 120,
    aspectRatio: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  badgeMobile: {
    flex: 0,
    width: "22%",
    maxWidth: 96,
  },
  badgeImg: {
    width: "100%",
    height: "100%",
  },
  hint: {
    fontFamily: fonts.regular,
    fontSize: 13,
    lineHeight: 18,
    textAlign: "center",
    maxWidth: 480,
  },
});
