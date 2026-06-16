import React, { useMemo } from "react";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { Platform, ScrollView, StyleSheet, Text, View } from "react-native";
import { buildProcessSectionDefaults } from "../../content/processHomeContent";
import { resolveProcessDisplay } from "../../utils/homeViewMedia";
import { SectionHeader, ScrollFadeUp } from "./editorial";
import GoldHairline from "../ui/GoldHairline";
import { FONT_HEADING } from "../../theme/typographyRoles";
import {
  GOLD_HAIRLINE_EDITORIAL,
  HOME_SPACE,
  HOME_TYPE,
  homeEditorialInk,
  homeEditorialMuted,
} from "../../theme/homeEditorial";
import { KANKREG_CHROME, KANKREG_PALETTE } from "../../theme/kankregWeb";
import { useKankregLayout } from "../../theme/kankregBreakpoints";
import { useTheme } from "../../context/ThemeContext";
import { fonts, radius } from "../../theme/tokens";
import { PRODUCT_HERO_BLURHASH } from "../../utils/image";
import { resolveImageSource } from "../../utils/mediaSource";
import { injectWebCssOnce } from "../../utils/injectWebCssOnce";
import { getHomePhoneBleed } from "../../utils/homeSectionBleed";

/** Portrait-friendly frame — `contain` shows the full step photo without cropping. */
const PROCESS_IMAGE_ASPECT = 4 / 5;
const PROCESS_RAIL_CARD_WIDTH = 300;
const PROCESS_CARD_CLASS = "kankreg-process-step-card";
const PROCESS_PHOTO_CLASS = "kankreg-process-photo";

if (Platform.OS === "web") {
  injectWebCssOnce(
    "kankreg-process-journey-grid-v2",
    `.${PROCESS_CARD_CLASS} {
  transition: transform 0.32s cubic-bezier(0.2, 0.7, 0.3, 1), box-shadow 0.32s ease;
}
.${PROCESS_CARD_CLASS}:hover {
  transform: translateY(-4px);
  box-shadow:
    inset 0 1px 0 rgba(255, 253, 248, 0.98),
    0 4px 10px rgba(60, 45, 20, 0.05),
    0 22px 48px -18px rgba(80, 60, 25, 0.22) !important;
}
.${PROCESS_PHOTO_CLASS} img,
.${PROCESS_PHOTO_CLASS} {
  object-fit: contain !important;
  object-position: center center !important;
}
@media (prefers-reduced-motion: reduce) {
  .${PROCESS_CARD_CLASS}:hover { transform: none !important; }
}`
  );
}

function formatStepNum(step) {
  return String(step).padStart(2, "0");
}

function ProcessStepCard({ step, isDark, ink, muted, phone = false }) {
  const imageSource = resolveImageSource(step.image);
  const imageFit = "contain";
  const imagePosition = "center";

  return (
    <View
      className={Platform.OS === "web" ? PROCESS_CARD_CLASS : undefined}
      style={[styles.card, phone && styles.cardPhone, isDark && styles.cardDark]}
    >
      <LinearGradient
        colors={
          isDark
            ? ["rgba(42, 117, 89, 0.12)", "rgba(255, 253, 248, 0.02)"]
            : ["rgba(255, 253, 248, 0.98)", "rgba(247, 241, 228, 0.72)"]
        }
        style={styles.imageWell}
      >
        <View style={[styles.imageFrame, isDark && styles.imageFrameDark]}>
          {imageSource ? (
            <Image
              className={Platform.OS === "web" ? PROCESS_PHOTO_CLASS : undefined}
              source={imageSource}
              style={styles.image}
              contentFit={imageFit}
              contentPosition={imagePosition}
              transition={320}
              placeholder={{ blurhash: PRODUCT_HERO_BLURHASH }}
              cachePolicy="memory-disk"
              recyclingKey={`process-${step.step}`}
              priority={step.step <= 3 ? "high" : "normal"}
            />
          ) : (
            <View style={[styles.image, styles.imageFallback]} />
          )}
          <View style={styles.imageInnerRule} pointerEvents="none" />
          <View style={styles.stepBadge}>
            <Text style={styles.stepBadgeText}>{formatStepNum(step.step)}</Text>
          </View>
        </View>
      </LinearGradient>

      <View style={[styles.cardBody, isDark && styles.cardBodyDark]}>
        <View style={styles.titleRow}>
          <View style={[styles.titleAccent, isDark && styles.titleAccentDark]} />
          <Text style={[styles.cardTitle, { color: ink }]} numberOfLines={2}>
            {step.title}
          </Text>
        </View>
        {step.description ? (
          <Text style={[styles.cardDesc, { color: muted }]} numberOfLines={3}>
            {step.description}
          </Text>
        ) : null}
      </View>
    </View>
  );
}

/** Bilona process journey — centered header + premium 3×2 step grid (web + native). */
export default function HomeProcessJourney({ processSection }) {
  const { isDark } = useTheme();
  const { width, isMobileWeb, pageGutterClamp } = useKankregLayout();
  const ink = homeEditorialInk(isDark);
  const muted = homeEditorialMuted(isDark);

  const process = useMemo(() => {
    return (
      resolveProcessDisplay(processSection) ??
      resolveProcessDisplay(buildProcessSectionDefaults())
    );
  }, [processSection]);

  const layout = useMemo(() => {
    if (width >= 960) return { cols: 3, rail: false };
    if (width >= 640) return { cols: 2, rail: false };
    return { cols: 1, rail: true };
  }, [width]);

  const railCardWidth = useMemo(() => {
    if (width < 640) return Math.round(Math.min(width * 0.84, 320));
    return PROCESS_RAIL_CARD_WIDTH;
  }, [width]);

  const cellStyle = useMemo(() => {
    if (layout.cols === 3) {
      return { width: "31.6%", maxWidth: "31.6%", minWidth: 0 };
    }
    if (layout.cols === 2) {
      return { width: "48.4%", maxWidth: "48.4%", minWidth: 0 };
    }
    return { width: "100%", maxWidth: "100%" };
  }, [layout.cols]);

  if (!process) return null;

  const bleed = getHomePhoneBleed({
    isMobileWeb,
    pageGutterClamp,
    nativeFullWidth: true,
  });

  const railGap = width < 640 ? 14 : HOME_SPACE.md + 2;
  const phoneLayout = width < 640;

  const gridBlock = layout.rail ? (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      decelerationRate={Platform.OS === "ios" ? "fast" : 0.98}
      snapToInterval={railCardWidth + railGap}
      snapToAlignment="start"
      disableIntervalMomentum
      contentContainerStyle={[styles.railContent, bleed.railPad]}
      style={styles.rail}
    >
      {process.steps.map((step, idx) => (
        <View key={step.id || step.step} style={{ width: railCardWidth, marginRight: railGap }}>
          <ScrollFadeUp index={idx} delay={idx * 60} preset="fade-up">
            <ProcessStepCard step={step} isDark={isDark} ink={ink} muted={muted} phone />
          </ScrollFadeUp>
        </View>
      ))}
    </ScrollView>
  ) : (
    <View style={[styles.grid, bleed.inner]}>
      {process.steps.map((step, idx) => (
        <View key={step.id || step.step} style={[styles.gridCell, cellStyle]}>
          <ScrollFadeUp index={idx} delay={idx * 50} preset="fade-up" style={styles.gridReveal}>
            <ProcessStepCard step={step} isDark={isDark} ink={ink} muted={muted} />
          </ScrollFadeUp>
        </View>
      ))}
    </View>
  );

  return (
    <View
      nativeID="home-process"
      style={[
        styles.section,
        phoneLayout && styles.sectionPhone,
        bleed.outer,
        isDark && styles.sectionDark,
      ]}
    >
      <LinearGradient
        colors={
          isDark
            ? ["rgba(42, 117, 89, 0.07)", "transparent", "rgba(60, 98, 72, 0.04)"]
            : ["rgba(42, 117, 89, 0.1)", "transparent", "rgba(255, 253, 248, 0.5)"]
        }
        locations={[0, 0.45, 1]}
        style={styles.sectionWash}
        pointerEvents="none"
      />
      <View style={styles.sectionFrameTop} pointerEvents="none" />

      <View style={[styles.headerBlock, bleed.inner]}>
        <SectionHeader
          eyebrow={process.eyebrow}
          title={process.title}
          kicker={process.subtitle}
          align="center"
          flush
        />
        {process.journeyLabel ? (
          <View style={[styles.journeyChip, isDark && styles.journeyChipDark]}>
            <Text style={[styles.journeyLabel, { color: KANKREG_PALETTE.gold }]}>
              {process.journeyLabel.toUpperCase()}
            </Text>
          </View>
        ) : null}
      </View>

      <GoldHairline
        {...GOLD_HAIRLINE_EDITORIAL.subtle}
        marginVertical={0}
        style={[styles.headerHairline, bleed.inner]}
      />

      {gridBlock}
    </View>
  );
}

const cardShadow = Platform.select({
  web: {
    boxShadow:
      "inset 0 1px 0 rgba(255, 253, 248, 0.96), 0 2px 6px rgba(60, 45, 20, 0.04), 0 16px 40px -22px rgba(80, 60, 25, 0.14)",
  },
  ios: {
    shadowColor: "#19140f",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.09,
    shadowRadius: 18,
  },
  android: { elevation: 4 },
  default: {},
});

const styles = StyleSheet.create({
  section: {
    width: "100%",
    paddingTop: HOME_SPACE.xl + 12,
    paddingBottom: HOME_SPACE.xl + 8,
    paddingHorizontal: HOME_SPACE.lg + 6,
    borderRadius: radius.xl + 10,
    backgroundColor: KANKREG_CHROME.cream,
    borderWidth: 1,
    borderColor: "rgba(31, 92, 71, 0.2)",
    borderTopWidth: 3,
    borderTopColor: "rgba(31, 92, 71, 0.78)",
    overflow: "hidden",
    position: "relative",
    gap: HOME_SPACE.md,
    ...Platform.select({
      web: {
        boxShadow:
          "inset 0 1px 0 rgba(255, 255, 255, 0.96), 0 2px 6px rgba(60, 45, 20, 0.04), 0 28px 64px -32px rgba(80, 60, 25, 0.16)",
      },
      ios: {
        shadowColor: "#3D2A12",
        shadowOffset: { width: 0, height: 14 },
        shadowOpacity: 0.1,
        shadowRadius: 28,
      },
      android: { elevation: 5 },
      default: {},
    }),
  },
  sectionPhone: {
    paddingHorizontal: HOME_SPACE.md,
    paddingVertical: HOME_SPACE.lg + 6,
    borderRadius: radius.xl + 6,
  },
  sectionDark: {
    backgroundColor: "rgba(24, 21, 19, 0.74)",
    borderColor: "rgba(42, 117, 89, 0.16)",
    borderTopColor: "rgba(42, 117, 89, 0.55)",
  },
  sectionWash: {
    ...StyleSheet.absoluteFillObject,
  },
  sectionFrameTop: {
    position: "absolute",
    top: 3,
    left: HOME_SPACE.lg + 8,
    right: HOME_SPACE.lg + 8,
    height: 1,
    backgroundColor: "rgba(255, 253, 248, 0.55)",
    zIndex: 2,
  },
  headerBlock: {
    width: "100%",
    alignItems: "center",
    gap: HOME_SPACE.sm,
    zIndex: 1,
  },
  headerHairline: {
    width: "100%",
    maxWidth: 420,
    alignSelf: "center",
    opacity: 0.55,
    zIndex: 1,
  },
  journeyChip: {
    marginTop: HOME_SPACE.xs,
    paddingVertical: HOME_SPACE.xs + 2,
    paddingHorizontal: HOME_SPACE.md + 2,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: "rgba(31, 92, 71, 0.22)",
    backgroundColor: "rgba(255, 253, 248, 0.88)",
    ...Platform.select({
      web: { boxShadow: "0 1px 2px rgba(60, 45, 20, 0.04)" },
      default: {},
    }),
  },
  journeyChipDark: {
    backgroundColor: "rgba(24, 21, 19, 0.55)",
    borderColor: "rgba(42, 117, 89, 0.2)",
  },
  journeyLabel: {
    fontFamily: fonts.semibold,
    fontSize: 10,
    letterSpacing: 2.2,
    textAlign: "center",
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    rowGap: HOME_SPACE.lg + 6,
    columnGap: HOME_SPACE.md,
    width: "100%",
    zIndex: 1,
  },
  gridCell: {
    flexGrow: 0,
    flexShrink: 0,
  },
  gridReveal: {
    flex: 1,
    width: "100%",
  },
  rail: {
    width: "100%",
    zIndex: 1,
  },
  railContent: {
    paddingBottom: HOME_SPACE.sm,
  },
  card: {
    flex: 1,
    borderRadius: radius.lg + 6,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(31, 92, 71, 0.18)",
    backgroundColor: "#FFFCF6",
    ...cardShadow,
  },
  cardPhone: {
    borderRadius: radius.lg + 4,
  },
  cardDark: {
    backgroundColor: "#181513",
    borderColor: "rgba(42, 117, 89, 0.14)",
  },
  imageWell: {
    padding: HOME_SPACE.sm + 2,
    paddingBottom: HOME_SPACE.sm,
  },
  imageFrame: {
    width: "100%",
    aspectRatio: PROCESS_IMAGE_ASPECT,
    position: "relative",
    overflow: "hidden",
    borderRadius: radius.lg + 2,
    backgroundColor: "#F3EBD8",
    borderWidth: 1,
    borderColor: "rgba(31, 92, 71, 0.12)",
  },
  imageFrameDark: {
    backgroundColor: "#1f1b18",
    borderColor: "rgba(42, 117, 89, 0.1)",
  },
  image: {
    ...StyleSheet.absoluteFillObject,
    width: "100%",
    height: "100%",
  },
  imageFallback: {
    backgroundColor: KANKREG_PALETTE.paper2,
  },
  imageInnerRule: {
    position: "absolute",
    left: HOME_SPACE.sm,
    right: HOME_SPACE.sm,
    bottom: 0,
    height: 1,
    backgroundColor: "rgba(42, 117, 89, 0.35)",
  },
  stepBadge: {
    position: "absolute",
    left: HOME_SPACE.sm + 2,
    bottom: HOME_SPACE.sm + 2,
    minWidth: 40,
    height: 40,
    paddingHorizontal: 10,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: KANKREG_PALETTE.green,
    borderWidth: 1.5,
    borderColor: "rgba(244, 213, 150, 0.55)",
    ...Platform.select({
      web: {
        boxShadow: "0 4px 12px rgba(27, 48, 34, 0.35)",
      },
      ios: {
        shadowColor: "#1b3022",
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.28,
        shadowRadius: 6,
      },
      android: { elevation: 3 },
      default: {},
    }),
  },
  stepBadgeText: {
    fontFamily: fonts.bold,
    fontSize: 14,
    lineHeight: 17,
    color: "#F5EFE4",
    letterSpacing: 0.5,
  },
  cardBody: {
    paddingHorizontal: HOME_SPACE.md + 2,
    paddingTop: HOME_SPACE.sm + 2,
    paddingBottom: HOME_SPACE.md + 4,
    gap: HOME_SPACE.sm,
    backgroundColor: "#FFFCF6",
  },
  cardBodyDark: {
    backgroundColor: "#181513",
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: HOME_SPACE.sm,
  },
  titleAccent: {
    width: 3,
    height: 18,
    marginTop: 3,
    borderRadius: 2,
    backgroundColor: KANKREG_PALETTE.gold,
    flexShrink: 0,
  },
  titleAccentDark: {
    backgroundColor: KANKREG_PALETTE.goldBright,
  },
  cardTitle: {
    flex: 1,
    fontFamily: FONT_HEADING,
    fontSize: HOME_TYPE.kicker + 1,
    lineHeight: HOME_TYPE.body.lineHeight + 2,
    letterSpacing: -0.2,
  },
  cardDesc: {
    fontFamily: fonts.regular,
    fontSize: 13,
    lineHeight: 21,
    paddingLeft: HOME_SPACE.sm + 5,
  },
});
