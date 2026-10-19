import React, { createElement, useMemo } from "react";
import { Image, Platform, StyleSheet, Text, View } from "react-native";
import { CERTIFICATIONS_STRIP } from "../../content/certificationsContent";
import { HOME_SCREEN_UI } from "../../content/appContent";
import { useTheme } from "../../context/ThemeContext";
import { useKankregLayout } from "../../theme/kankregBreakpoints";
import { WP } from "../../theme/webPremium";
import { fonts } from "../../theme/tokens";
import { injectWebCssOnce } from "../../utils/injectWebCssOnce";
import useReducedMotion from "../../hooks/useReducedMotion";
import WebSectionBackdrop from "./WebSectionBackdrop";
import { WebSectionHead } from "./webPremiumParts";

const MUTED = "#3F3C2E";
const BADGE = 88;
const BADGE_IMG = 64;
const BADGE_PHONE = 72;
const BADGE_IMG_PHONE = 52;
const GAP_PHONE = 10;
const CSS_ID = "zeevan-cert-badges-v4";
const TRACK = "zeevan-cert-marquee";
const SET = "zeevan-cert-set";
const BADGE_CLASS = "zv-cert";

injectWebCssOnce(
  CSS_ID,
  `@keyframes zeevanCertMarquee {
  from { transform: translate3d(0, 0, 0); }
  to { transform: translate3d(-50%, 0, 0); }
}
.${TRACK} {
  display: flex !important;
  flex-direction: row !important;
  flex-wrap: nowrap !important;
  align-items: center;
  width: max-content !important;
  max-width: none !important;
  will-change: transform;
  animation: zeevanCertMarquee 28s linear infinite;
}
.${TRACK}:hover { animation-play-state: paused; }
.${SET} {
  display: flex !important;
  flex-direction: row !important;
  flex-wrap: nowrap !important;
  align-items: center;
  gap: ${GAP_PHONE}px;
  flex-shrink: 0;
  padding-right: ${GAP_PHONE}px;
}
.${BADGE_CLASS} {
  filter: grayscale(0.3);
  opacity: 0.94;
  transition: filter 0.35s ease, opacity 0.35s ease, transform 0.4s ${WP.ease}, box-shadow 0.4s ease;
}
.${BADGE_CLASS}:hover {
  filter: none;
  opacity: 1;
  transform: translateY(-3px) scale(1.04);
  box-shadow: 0 12px 28px -16px rgba(36, 68, 36, 0.35);
}
@media (prefers-reduced-motion: reduce) {
  .${TRACK} { animation: none !important; transform: none !important; }
  .${BADGE_CLASS} { transition: none !important; }
  .${BADGE_CLASS}:hover { transform: none; }
}`
);

function CertBadge({ badge, phone }) {
  return (
    <View
      className={BADGE_CLASS}
      style={[styles.badge, phone && styles.badgePhone]}
      accessibilityLabel={badge.label}
    >
      <Image
        source={badge.image}
        style={[styles.badgeImg, phone && styles.badgeImgPhone]}
        resizeMode="contain"
        accessibilityIgnoresInvertColors
      />
    </View>
  );
}

function BadgeSet({ badges, phone, hidden }) {
  const kids = badges.map((badge) => <CertBadge key={badge.key} badge={badge} phone={phone} />);
  if (Platform.OS === "web") {
    return createElement(
      "div",
      {
        className: SET,
        "aria-hidden": hidden ? "true" : undefined,
        style: { display: "flex", flexDirection: "row", flexWrap: "nowrap", alignItems: "center" },
      },
      kids
    );
  }
  return <View style={styles.set}>{kids}</View>;
}

/** Phone marquee — native div track so width:max-content + CSS scroll actually run. */
function PhoneMarquee({ badges, reducedMotion, isDark }) {
  const label = useMemo(() => badges.map((b) => b.label).join(", "), [badges]);

  if (reducedMotion) {
    return (
      <View
        style={[styles.frame, styles.framePhone, isDark && styles.frameDark]}
        accessibilityRole="list"
        accessibilityLabel={label}
      >
        <View style={styles.staticScroll}>
          {badges.map((badge) => (
            <CertBadge key={badge.key} badge={badge} phone />
          ))}
        </View>
      </View>
    );
  }

  const track = createElement(
    "div",
    { className: TRACK, style: { display: "flex", flexDirection: "row", flexWrap: "nowrap" } },
    createElement(BadgeSet, { badges, phone: true, hidden: false }),
    createElement(BadgeSet, { badges, phone: true, hidden: true })
  );

  return (
    <View
      style={[styles.frame, styles.framePhone, isDark && styles.frameDark]}
      accessibilityRole="list"
      accessibilityLabel={label}
    >
      <View style={[styles.fadeLeft, isDark && styles.fadeDarkL]} pointerEvents="none" />
      <View style={[styles.fadeRight, isDark && styles.fadeDarkR]} pointerEvents="none" />
      <View style={styles.marqueeClip}>{track}</View>
    </View>
  );
}

/** Certifications — desktop wrap; phone = continuous horizontal marquee (no cut-off). */
export default function WebCertificationsStrip() {
  const { isDark } = useTheme();
  const { isMobileWeb, pageGutterClamp } = useKankregLayout();
  const reducedMotion = useReducedMotion();
  if (HOME_SCREEN_UI.web?.showCertificationsStrip === false) return null;

  const copy = CERTIFICATIONS_STRIP;
  const muted = isDark ? "rgba(250,248,244,0.72)" : MUTED;

  return (
    <WebSectionBackdrop
      source={copy.background}
      tone="warm"
      isDark={isDark}
      accessibilityLabel={copy.title}
      style={[styles.pad, isMobileWeb && styles.padMobile]}
    >
      <View style={[styles.inner, { paddingHorizontal: isMobileWeb ? 0 : pageGutterClamp }]}>
        <View style={{ paddingHorizontal: isMobileWeb ? pageGutterClamp : 0, width: "100%" }}>
          <WebSectionHead align="center" eyebrow={copy.eyebrow} title={copy.title} />
        </View>

        {isMobileWeb ? (
          <PhoneMarquee badges={copy.badges} reducedMotion={reducedMotion} isDark={isDark} />
        ) : (
          <View style={[styles.frame, isDark && styles.frameDark]}>
            <View style={styles.row}>
              {copy.badges.map((badge) => (
                <CertBadge key={badge.key} badge={badge} />
              ))}
            </View>
          </View>
        )}

        {copy.hint ? (
          <Text style={[styles.hint, { color: muted, paddingHorizontal: pageGutterClamp }]}>{copy.hint}</Text>
        ) : null}
      </View>
    </WebSectionBackdrop>
  );
}

const styles = StyleSheet.create({
  pad: { paddingTop: 88, paddingBottom: 96, marginBottom: 0 },
  padMobile: { paddingTop: 40, paddingBottom: 48 },
  inner: {
    width: "100%",
    maxWidth: 1180,
    alignSelf: "center",
    alignItems: "center",
    gap: 36,
  },
  frame: {
    width: "100%",
    backgroundColor: "rgba(255,255,255,0.94)",
    borderRadius: WP.radius.tile,
    borderWidth: 1,
    borderColor: "rgba(36, 68, 36, 0.1)",
    paddingVertical: 26,
    paddingHorizontal: 18,
    ...Platform.select({ web: { boxShadow: WP.shadow.card }, default: {} }),
  },
  framePhone: {
    borderRadius: 20,
    paddingVertical: 14,
    paddingHorizontal: 0,
    overflow: "hidden",
    position: "relative",
    marginHorizontal: 16,
    width: "auto",
    alignSelf: "stretch",
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
    gap: 14,
    width: "100%",
  },
  marqueeClip: {
    overflow: "hidden",
    width: "100%",
    ...Platform.select({
      web: { display: "block" },
      default: {},
    }),
  },
  set: {
    flexDirection: "row",
    flexWrap: "nowrap",
    alignItems: "center",
    gap: GAP_PHONE,
    paddingRight: GAP_PHONE,
  },
  staticScroll: {
    flexDirection: "row",
    flexWrap: "nowrap",
    alignItems: "center",
    gap: GAP_PHONE,
    paddingHorizontal: 14,
    ...Platform.select({
      web: { overflowX: "auto", WebkitOverflowScrolling: "touch" },
      default: {},
    }),
  },
  fadeLeft: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    width: 36,
    zIndex: 2,
    ...Platform.select({
      web: {
        backgroundImage: "linear-gradient(90deg, rgba(255,255,255,1) 0%, rgba(255,255,255,0) 100%)",
      },
      default: {},
    }),
  },
  fadeRight: {
    position: "absolute",
    right: 0,
    top: 0,
    bottom: 0,
    width: 36,
    zIndex: 2,
    ...Platform.select({
      web: {
        backgroundImage: "linear-gradient(270deg, rgba(255,255,255,1) 0%, rgba(255,255,255,0) 100%)",
      },
      default: {},
    }),
  },
  fadeDarkL: {
    ...Platform.select({
      web: {
        backgroundImage: "linear-gradient(90deg, rgba(30,28,24,0.95) 0%, rgba(30,28,24,0) 100%)",
      },
      default: {},
    }),
  },
  fadeDarkR: {
    ...Platform.select({
      web: {
        backgroundImage: "linear-gradient(270deg, rgba(30,28,24,0.95) 0%, rgba(30,28,24,0) 100%)",
      },
      default: {},
    }),
  },
  badge: {
    width: BADGE,
    height: BADGE,
    flexGrow: 0,
    flexShrink: 0,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 16,
    backgroundColor: "#F7F4EC",
    borderWidth: 1,
    borderColor: "rgba(36, 68, 36, 0.06)",
  },
  badgePhone: {
    width: BADGE_PHONE,
    height: BADGE_PHONE,
    borderRadius: 14,
  },
  badgeImg: {
    width: BADGE_IMG,
    height: BADGE_IMG,
  },
  badgeImgPhone: {
    width: BADGE_IMG_PHONE,
    height: BADGE_IMG_PHONE,
  },
  hint: {
    fontFamily: fonts.regular,
    fontSize: 14.5,
    lineHeight: 22,
    textAlign: "center",
    maxWidth: 460,
  },
});
