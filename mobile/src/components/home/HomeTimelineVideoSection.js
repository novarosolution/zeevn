import React from "react";
import { LinearGradient } from "expo-linear-gradient";
import { Platform, StyleSheet, Text, View } from "react-native";
import Eyebrow from "./editorial/Eyebrow";
import HomePromoVideo from "./HomePromoVideo";
import {
  HOME_SPACE,
  HOME_TYPE,
  homeEditorialInk,
} from "../../theme/homeEditorial";
import { HOME_SCREEN_UI } from "../../content/appContent";
import { useTheme } from "../../context/ThemeContext";
import { useKankregLayout } from "../../theme/kankregBreakpoints";
import { KANKREG_CHROME } from "../../theme/kankregWeb";
import { FONT_HEADING } from "../../theme/typographyRoles";
import { radius } from "../../theme/tokens";
import { getHomePhoneBleed } from "../../utils/homeSectionBleed";
import { injectWebCssOnce } from "../../utils/injectWebCssOnce";

const TIMELINE_PANEL_CLASS = "kankreg-timeline-cinema-panel";

function timelineVideoHeight(width, isLg) {
  if (isLg) return 560;
  if (width >= 720) return 480;
  return Math.max(320, Math.min(440, Math.round(width * 0.68)));
}

if (Platform.OS === "web") {
  injectWebCssOnce(
    "kankreg-timeline-cinema-premium",
    `.${TIMELINE_PANEL_CLASS} {
  transition: box-shadow 0.35s ease;
}
.${TIMELINE_PANEL_CLASS}:hover {
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.96),
    0 6px 14px rgba(60, 45, 20, 0.05),
    0 40px 80px -36px rgba(80, 60, 25, 0.24) !important;
}
@media (prefers-reduced-motion: reduce) {
  .${TIMELINE_PANEL_CLASS}:hover { box-shadow: inherit !important; }
}`
  );
}

/** Dedicated timeline brand banner — after home catalog, separate from Our Story. */
export default function HomeTimelineVideoSection() {
  const { isDark } = useTheme();
  const { isLg, isMobileWeb, pageGutterClamp, width } = useKankregLayout();
  const ink = homeEditorialInk(isDark);
  const { eyebrow, title } = HOME_SCREEN_UI.timelineVideo;
  const bleed = getHomePhoneBleed({ isMobileWeb, pageGutterClamp, nativeFullWidth: true });
  const videoHeight = timelineVideoHeight(width, isLg && Platform.OS === "web");

  return (
    <View style={styles.wrap} nativeID="home-timeline-video">
      <View
        className={Platform.OS === "web" ? TIMELINE_PANEL_CLASS : undefined}
        style={[
          styles.panel,
          bleed.outer,
          isDark && styles.panelDark,
        ]}
      >
        <LinearGradient
          colors={
            isDark
              ? ["rgba(42, 117, 89, 0.05)", "transparent"]
              : ["rgba(42, 117, 89, 0.08)", "transparent"]
          }
          locations={[0, 0.55]}
          style={styles.panelWash}
          pointerEvents="none"
        />

        <View style={[styles.headerRow, bleed.inner]}>
          {eyebrow ? <Eyebrow style={styles.eyebrow}>{eyebrow}</Eyebrow> : null}
          {title ? (
            <Text style={[styles.title, { color: ink }]} numberOfLines={2}>
              {title}
            </Text>
          ) : null}
        </View>

        <View style={[styles.videoStage, bleed.inner]}>
          <HomePromoVideo
            fullBleed={false}
            embedded
            minimalChrome
            stageHeight={videoHeight}
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: "100%",
    paddingTop: Platform.OS === "web" ? HOME_SPACE.xs : HOME_SPACE.xs,
  },
  panel: {
    width: "100%",
    borderRadius: radius.xl + 6,
    paddingTop: HOME_SPACE.md,
    paddingBottom: HOME_SPACE.md + 2,
    paddingHorizontal: HOME_SPACE.md + 2,
    backgroundColor: KANKREG_CHROME.cream,
    borderWidth: 1,
    borderColor: "rgba(31, 92, 71, 0.16)",
    borderTopWidth: 2,
    borderTopColor: "rgba(31, 92, 71, 0.65)",
    overflow: "hidden",
    position: "relative",
    gap: HOME_SPACE.sm,
    ...Platform.select({
      web: {
        boxShadow:
          "inset 0 1px 0 rgba(255, 255, 255, 0.96), 0 2px 6px rgba(60, 45, 20, 0.04), 0 24px 52px -28px rgba(80, 60, 25, 0.16)",
      },
      ios: {
        shadowColor: "#3D2A12",
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.08,
        shadowRadius: 20,
      },
      android: { elevation: 4 },
      default: {},
    }),
  },
  panelDark: {
    backgroundColor: "rgba(24, 21, 19, 0.74)",
    borderColor: "rgba(42, 117, 89, 0.15)",
    borderTopColor: "rgba(42, 117, 89, 0.52)",
  },
  panelWash: {
    ...StyleSheet.absoluteFillObject,
  },
  headerRow: {
    width: "100%",
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "baseline",
    gap: HOME_SPACE.sm,
    zIndex: 1,
  },
  eyebrow: {
    fontSize: 10,
    lineHeight: 14,
  },
  title: {
    fontFamily: FONT_HEADING,
    fontSize: HOME_TYPE.eyebrow + 8,
    lineHeight: Math.round((HOME_TYPE.eyebrow + 8) * 1.15),
    letterSpacing: -0.2,
    flexShrink: 1,
  },
  videoStage: {
    width: "100%",
    zIndex: 1,
    minHeight: 280,
  },
});
