import React from "react";
import { Image, Platform, StyleSheet, Text, View } from "react-native";
import { CERTIFICATIONS_STRIP } from "../../content/certificationsContent";
import { HOME_SCREEN_UI } from "../../content/appContent";
import { useTheme } from "../../context/ThemeContext";
import { useKankregLayout } from "../../theme/kankregBreakpoints";
import { WP } from "../../theme/webPremium";
import { fonts } from "../../theme/tokens";
import { injectWebCssOnce } from "../../utils/injectWebCssOnce";
import WebSectionBackdrop from "./WebSectionBackdrop";
import { WebSectionHead } from "./webPremiumParts";

const BG = require("../../../assets/section-bg-warm-4k.jpg");
const MUTED = "#3F3C2E";
const BADGE = 96;
const BADGE_IMG = 82;
const CSS_ID = "zeevan-cert-badges-v1";

injectWebCssOnce(
  CSS_ID,
  `.zv-cert { filter: grayscale(0.55); opacity: 0.88; transition: filter 0.4s ease, opacity 0.4s ease, transform 0.5s ${WP.ease}; }
.zv-cert:hover { filter: none; opacity: 1; transform: translateY(-4px); }
@media (prefers-reduced-motion: reduce) { .zv-cert { transition: none !important; } .zv-cert:hover { transform: none; } }`
);

/** Certifications row — fixed-size badges (quiet until hovered) so flex never collapses them. */
export default function WebCertificationsStrip() {
  const { isDark } = useTheme();
  const { isMobileWeb, pageGutterClamp } = useKankregLayout();
  if (HOME_SCREEN_UI.web?.showCertificationsStrip === false) return null;

  const copy = CERTIFICATIONS_STRIP;
  const muted = isDark ? "rgba(250,248,244,0.72)" : MUTED;

  return (
    <WebSectionBackdrop
      source={BG}
      tone="warm"
      isDark={isDark}
      accessibilityLabel={copy.title}
      style={[styles.pad, isMobileWeb && styles.padMobile]}
    >
      <View style={[styles.inner, { paddingHorizontal: pageGutterClamp }]}>
        <WebSectionHead align="center" eyebrow={copy.eyebrow} title={copy.title} />

        <View style={[styles.frame, isDark && styles.frameDark]}>
          <View style={styles.row}>
            {copy.badges.map((badge) => (
              <View key={badge.key} className="zv-cert" style={styles.badge}>
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
  pad: { paddingTop: 88, paddingBottom: 96, marginBottom: 0 },
  padMobile: { paddingTop: 48, paddingBottom: 56 },
  inner: {
    width: "100%",
    maxWidth: 1180,
    alignSelf: "center",
    alignItems: "center",
    gap: 40,
  },
  frame: {
    width: "100%",
    backgroundColor: "#FFFFFF",
    borderRadius: WP.radius.tile,
    borderWidth: 1,
    borderColor: "rgba(36, 68, 36, 0.08)",
    paddingVertical: 28,
    paddingHorizontal: 20,
    ...Platform.select({ web: { boxShadow: WP.shadow.card }, default: {} }),
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
    gap: 16,
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
    fontSize: 14.5,
    lineHeight: 22,
    textAlign: "center",
    maxWidth: 460,
    paddingHorizontal: 8,
  },
});
