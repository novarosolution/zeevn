import React, { useMemo, useState } from "react";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import CinemaStoryPlayer from "./CinemaStoryPlayer";
import StoryImageFrame from "./StoryImageFrame";
import { SectionHeader } from "./editorial";
import {
  GOLD_HAIRLINE_EDITORIAL,
  HOME_SPACE,
  HOME_TYPE,
  homeEditorialInk,
  homeEditorialMuted,
} from "../../theme/homeEditorial";
import { FONT_HEADING, FONT_BODY } from "../../theme/typographyRoles";
import { KANKREG_PALETTE } from "../../theme/kankregWeb";
import { useKankregLayout } from "../../theme/kankregBreakpoints";
import { useTheme } from "../../context/ThemeContext";
import { fonts, icon, radius } from "../../theme/tokens";
import { normalizeAboutSection } from "../../utils/homeViewMedia";
import PremiumButton from "../ui/PremiumButton";
import GoldHairline from "../ui/GoldHairline";
import { HOME_SCREEN_UI } from "../../content/appContent";
import { GHEE_HOME_CONTENT as HOME_STORY_CONTENT } from "../../content/gheeHomeContent";
import useReducedMotion from "../../hooks/useReducedMotion";
import { injectWebCssOnce } from "../../utils/injectWebCssOnce";

const PHOTO_LEAD_ASPECT = 5 / 6;

const CINEMA_VIDEO_CLASS = "kankreg-cinema-video";
const CINEMA_REEL_CLASS = "kankreg-cinema-reel";
/** Dark stage behind full-bleed video — no cream letterbox */
const CINEMA_FRAME_BG = "#0a0908";
const STORY_SPLIT_MIN_WIDTH = 900;
/** Fixed story video height — desktop split + wide stacked */
const STORY_VIDEO_HEIGHT = 480;
/** Phone web reel — shorter, aspect-led */
const STORY_VIDEO_HEIGHT_PHONE = 320;
const HIGHLIGHT_RAIL_CARD_WIDTH = 252;

const CINEMA_STAGE_CLASS = "kankreg-cinema-stage";

if (Platform.OS === "web") {
  injectWebCssOnce(
    "kankreg-cinema-video-v7",
    `@keyframes kankregCinemaDrift {
  from { transform: scale(1.04); }
  to { transform: scale(1.1); }
}
.${CINEMA_REEL_CLASS} {
  position: relative;
  width: 100%;
  height: clamp(240px, 52vw, ${STORY_VIDEO_HEIGHT_PHONE}px);
  overflow: hidden;
  background-color: ${CINEMA_FRAME_BG};
}
@media (min-width: ${STORY_SPLIT_MIN_WIDTH}px) {
  .${CINEMA_REEL_CLASS} {
    height: ${STORY_VIDEO_HEIGHT}px;
  }
}
.${CINEMA_STAGE_CLASS} {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  overflow: hidden;
  z-index: 0;
}
.${CINEMA_STAGE_CLASS} video,
.${CINEMA_STAGE_CLASS} [data-kankreg-fill="true"] {
  z-index: 1;
}
.${CINEMA_REEL_CLASS} video,
.${CINEMA_VIDEO_CLASS} {
  position: absolute !important;
  inset: 0 !important;
  top: 0 !important;
  left: 0 !important;
  right: 0 !important;
  bottom: 0 !important;
  width: 100% !important;
  height: 100% !important;
  min-width: 100% !important;
  min-height: 100% !important;
  max-width: none !important;
  object-fit: cover !important;
  object-position: center center !important;
  background-color: ${CINEMA_FRAME_BG};
  transform-origin: center center;
  animation: kankregCinemaDrift 26s ease-in-out infinite alternate;
  display: block;
}
.${CINEMA_REEL_CLASS}::before {
  content: "";
  position: absolute;
  inset: 0;
  z-index: 3;
  pointer-events: none;
  background: linear-gradient(
    180deg,
    rgba(30, 18, 6, 0.3) 0%,
    transparent 28%,
    transparent 58%,
    rgba(30, 18, 6, 0.45) 100%
  );
}
.${CINEMA_REEL_CLASS}::after {
  content: "";
  position: absolute;
  inset: 0;
  pointer-events: none;
  opacity: 0.04;
  z-index: 4;
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
  mix-blend-mode: overlay;
}
@media (prefers-reduced-motion: reduce) {
  .${CINEMA_REEL_CLASS} video,
  .${CINEMA_VIDEO_CLASS} {
    animation: none !important;
    transform: none !important;
  }
}`
  );
}

/** Native / narrow fallback reel height */
function cinemaReelStyle(layoutWidth, isStoryPhone) {
  if (Platform.OS === "web") {
    if (isStoryPhone) {
      return { height: STORY_VIDEO_HEIGHT_PHONE, maxHeight: STORY_VIDEO_HEIGHT_PHONE };
    }
    return { height: STORY_VIDEO_HEIGHT };
  }
  if (layoutWidth >= 560) {
    return { height: isStoryPhone ? STORY_VIDEO_HEIGHT_PHONE : STORY_VIDEO_HEIGHT };
  }
  return { aspectRatio: 16 / 10, maxHeight: STORY_VIDEO_HEIGHT_PHONE };
}

function CinematicStoryVideo({
  source,
  caption,
  isDark,
  layoutWidth,
  filmLabel,
  split = false,
  showCaption = true,
  isStoryPhone = false,
}) {
  const [muted, setMuted] = useState(true);
  const reducedMotion = useReducedMotion();
  const reelStyle = cinemaReelStyle(layoutWidth, isStoryPhone);
  const useWebCssReel = Platform.OS === "web";

  return (
    <View
      style={[
        styles.cinemaWrap,
        !isStoryPhone && !split && styles.cinemaWrapDesktop,
        split && styles.cinemaWrapSplit,
        split && styles.cinemaWrapSplitFill,
        isStoryPhone && styles.cinemaWrapPhone,
        isDark ? styles.cinemaWrapDark : styles.cinemaWrapLight,
      ]}
    >
      <View
        className={useWebCssReel ? CINEMA_REEL_CLASS : undefined}
        style={[styles.cinemaReel, split && styles.cinemaReelSplit, reelStyle]}
      >
        <View
          className={useWebCssReel ? CINEMA_STAGE_CLASS : undefined}
          style={styles.cinemaStage}
        >
          <CinemaStoryPlayer
            source={source}
            muted={muted}
            style={useWebCssReel ? styles.cinemaVideoBg : styles.cinemaVideoFill}
          />
        </View>
        {!useWebCssReel ? (
          <>
            <LinearGradient
              colors={["rgba(8,6,4,0.32)", "transparent", "transparent", "rgba(8,6,4,0.32)"]}
              locations={[0, 0.12, 0.88, 1]}
              start={{ x: 0, y: 0.5 }}
              end={{ x: 1, y: 0.5 }}
              style={styles.cinemaSideVignette}
              pointerEvents="none"
            />
            <LinearGradient
              colors={["transparent", "rgba(8, 6, 4, 0.15)", "rgba(8, 6, 4, 0.78)"]}
              locations={[0.5, 0.82, 1]}
              style={styles.cinemaBottomScrim}
              pointerEvents="none"
            />
          </>
        ) : null}
        <View style={styles.cinemaFrameLineTop} pointerEvents="none" />
        <View style={styles.cinemaFrameLineBottom} pointerEvents="none" />
        <View style={[styles.cinemaChrome, split && styles.cinemaChromeSplit]} pointerEvents="box-none">
          {filmLabel ? (
            <View style={styles.filmBadge} pointerEvents="none">
              <View style={styles.filmBadgeDot} />
              <Text style={styles.filmBadgeText}>{filmLabel}</Text>
            </View>
          ) : null}
          <Pressable
            onPress={() => setMuted((m) => !m)}
            style={({ hovered, focused }) => [
              styles.cinemaChip,
              hovered && Platform.OS === "web" ? styles.cinemaChipHover : null,
              focused && Platform.OS === "web" ? styles.cinemaChipFocus : null,
            ]}
            accessibilityRole="button"
            accessibilityLabel={muted ? "Unmute video" : "Mute video"}
          >
            <Ionicons name={muted ? "volume-mute" : "volume-high"} size={icon.sm} color="#fff" />
          </Pressable>
        </View>
        {showCaption && caption ? (
          <View style={[styles.cinemaCaption, split && styles.cinemaCaptionSplit]} pointerEvents="none">
            {!split ? <View style={styles.cinemaCaptionRule} /> : null}
            <Text
              style={[styles.cinemaCaptionText, split && styles.cinemaCaptionTextSplit]}
              numberOfLines={2}
            >
              {caption}
            </Text>
          </View>
        ) : null}
      </View>
    </View>
  );
}

function StoryPullQuote({ quote, isDark, phone = false }) {
  if (!quote) return null;
  const ink = homeEditorialInk(isDark);
  return (
    <View style={[styles.pullQuote, phone && styles.pullQuotePhone, isDark && styles.pullQuoteDark]}>
      <View style={[styles.pullQuoteRule, phone && styles.pullQuoteRulePhone]} />
      <Text
        style={[
          phone ? styles.pullQuoteTextPhone : styles.pullQuoteText,
          { color: phone ? ink : ink },
        ]}
      >
        {quote}
      </Text>
    </View>
  );
}

function StoryHighlights({
  isDark,
  layoutWidth,
  compact = false,
  pills = false,
  rail = false,
  stats: statsProp,
}) {
  const ink = homeEditorialInk(isDark);
  const muted = homeEditorialMuted(isDark);
  const { highlightsEyebrow, highlightsTitle } = HOME_SCREEN_UI.ourStory;
  const stats = statsProp?.length ? statsProp : HOME_STORY_CONTENT.whyKankrej.stats;

  if (rail) {
    return (
      <View style={styles.highlightsRailSection}>
        <SectionHeader eyebrow={highlightsEyebrow} title={highlightsTitle} compact flush />
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          decelerationRate={Platform.OS === "ios" ? "fast" : 0.98}
          snapToInterval={HIGHLIGHT_RAIL_CARD_WIDTH + HOME_SPACE.md}
          snapToAlignment="start"
          disableIntervalMomentum
          contentContainerStyle={styles.highlightsRailContent}
          style={styles.highlightsRail}
        >
          {stats.map((stat) => (
            <View
              key={stat.value}
              style={[styles.highlightRailCard, isDark && styles.highlightRailCardDark]}
            >
              <Text style={[styles.highlightRailValue, { color: KANKREG_PALETTE.gold }]}>
                {stat.value}
              </Text>
              <Text style={[styles.highlightRailLabel, { color: ink }]}>{stat.label}</Text>
              <Text style={[styles.highlightRailDesc, { color: muted }]} numberOfLines={3}>
                {stat.description}
              </Text>
            </View>
          ))}
        </ScrollView>
      </View>
    );
  }

  if (pills) {
    return (
      <View style={styles.promisePillsWrap}>
        <View style={styles.promisePillsRow}>
          {stats.map((stat) => (
            <View key={stat.value} style={[styles.promisePill, isDark && styles.promisePillDark]}>
              <Text style={[styles.promisePillText, { color: ink }]}>{stat.value}</Text>
            </View>
          ))}
        </View>
      </View>
    );
  }

  if (compact) {
    return (
      <View style={styles.highlightsCompact}>
        <Text style={[styles.highlightsCompactEyebrow, { color: muted }]}>{highlightsTitle.toUpperCase()}</Text>
        {stats.map((stat, idx) => (
          <View
            key={stat.value}
            style={[
              styles.highlightCompactRow,
              idx === 0 && styles.highlightCompactRowFirst,
              isDark && styles.highlightCompactRowDark,
            ]}
          >
            <View style={styles.highlightCompactDot} />
            <View style={styles.highlightCompactCopy}>
              <Text style={[styles.highlightCompactValue, { color: ink }]}>{stat.value}</Text>
              <Text style={[styles.highlightCompactDesc, { color: muted }]}>{stat.description}</Text>
            </View>
          </View>
        ))}
      </View>
    );
  }

  return (
    <View style={styles.highlightsBlock}>
      <SectionHeader eyebrow={highlightsEyebrow} title={highlightsTitle} compact flush />
      <View style={[styles.highlightsGrid, layoutWidth >= 900 && styles.highlightsGridWide]}>
        {stats.map((stat) => (
          <View key={stat.value} style={[styles.highlightCard, isDark && styles.highlightCardDark]}>
            <Text style={[styles.highlightValue, { color: KANKREG_PALETTE.gold }]}>{stat.value}</Text>
            <Text style={[styles.highlightLabel, { color: ink }]}>{stat.label}</Text>
            <Text style={[styles.highlightDesc, { color: muted }]}>{stat.description}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

function StoryDetailsPanel({
  isDark,
  muted,
  pullQuote,
  about,
  showCta,
  navigation,
  split = false,
  hidePills = false,
}) {
  const ink = homeEditorialInk(isDark);

  const { highlightsTitle } = HOME_SCREEN_UI.ourStory;

  return (
    <View style={[styles.storyDetailsPanel, split && styles.storySplitDetails, isDark && styles.storySplitDetailsDark]}>
      {pullQuote ? (
        <Text style={[styles.storyCardTitle, { color: ink }]}>{pullQuote}</Text>
      ) : null}
      {about.body ? (
        <Text style={[styles.storyCardBody, { color: muted }]}>{about.body}</Text>
      ) : null}
      {split && !hidePills ? (
        <>
          <Text style={[styles.storyCardLabel, { color: muted }]}>{highlightsTitle.toUpperCase()}</Text>
          <StoryHighlights isDark={isDark} layoutWidth={0} pills />
        </>
      ) : null}
      {showCta && navigation ? (
        <View style={[styles.ctaRow, split && styles.ctaRowSplit]}>
          <PremiumButton
            label={HOME_SCREEN_UI.ourStory.readMore}
            variant="gold"
            size="md"
            onPress={() => navigation.navigate("About")}
          />
        </View>
      ) : null}
    </View>
  );
}

function AboutStoryPhoto({ photo, isDark, layoutWidth, isEditorial }) {
  const aspectRatio = isEditorial ? 16 / 9 : PHOTO_LEAD_ASPECT;
  return (
    <StoryImageFrame
      source={photo.url}
      caption={photo.caption}
      aspectRatio={aspectRatio}
      isDark={isDark}
    />
  );
}

/** Shared about block — admin photos, video, and copy. */
export default function AboutKankregMedia({
  aboutSection,
  navigation,
  showCta = true,
  compact = false,
  variant = "default",
  hideHighlights = false,
}) {
  const { isDark } = useTheme();
  const { width } = useKankregLayout();
  const about = normalizeAboutSection(aboutSection);
  const isEditorial = variant === "editorial" && Platform.OS === "web" && !compact;
  const isStoryPhone = isEditorial && width < STORY_SPLIT_MIN_WIDTH;
  const { kicker: storyKicker } = HOME_SCREEN_UI.ourStory;

  const videoSource = useMemo(() => {
    if (about.videoUrl) return about.videoUrl;
    return null;
  }, [about.videoUrl]);

  const leadPhoto = useMemo(() => {
    if (videoSource || !about.photos.length) return null;
    return about.photos[0];
  }, [videoSource, about.photos]);

  const muted = homeEditorialMuted(isDark);

  if (!about.enabled) return null;

  const eyebrow = isEditorial ? HOME_SCREEN_UI.ourStory.eyebrow : about.eyebrow;
  const hasCopy = Boolean(about.body || (showCta && navigation));
  const showHeader = Boolean(eyebrow || about.title);

  const storyContinued = isEditorial
    ? about.bodyContinued || HOME_STORY_CONTENT.whyKankrej.body
    : null;
  const storySplit = isEditorial && Boolean(videoSource) && width >= STORY_SPLIT_MIN_WIDTH;
  const pullQuote = isEditorial
    ? about.pullQuote || HOME_SCREEN_UI.ourStory.pullQuote
    : null;
  const highlightStats = isEditorial && about.highlights?.length ? about.highlights : null;
  const splitVideoCaption =
    about.videoCaption?.trim() || HOME_SCREEN_UI.ourStory.videoCaptionFallback || "";

  const copyPanel =
    !storySplit && (hasCopy || storyContinued) ? (
      <View style={[styles.copyPanel, isEditorial && styles.copyPanelEditorial]}>
        {!isEditorial && showHeader ? (
          <>
            <SectionHeader eyebrow={eyebrow} title={about.title} compact flush style={styles.storyHeader} />
            <GoldHairline {...GOLD_HAIRLINE_EDITORIAL.subtle} marginVertical={0} />
          </>
        ) : null}
        {about.body ? (
          <Text
            style={[
              styles.body,
              { color: muted },
              isEditorial && styles.bodyEditorial,
              isStoryPhone && styles.bodyPhone,
            ]}
          >
            {about.body}
          </Text>
        ) : null}
        {storyContinued ? (
          <Text style={[styles.bodyContinued, { color: muted }]}>{storyContinued}</Text>
        ) : null}
        {showCta && navigation ? (
          <View style={[styles.ctaRow, isStoryPhone && styles.ctaRowPhone]}>
            <PremiumButton
              label={HOME_SCREEN_UI.ourStory.readMore}
              variant="gold"
              size="md"
              onPress={() => navigation.navigate("About")}
            />
          </View>
        ) : null}
      </View>
    ) : null;

  const mediaBlock = videoSource ? (
    <CinematicStoryVideo
      source={videoSource}
      caption={storySplit ? splitVideoCaption : about.videoCaption}
      isDark={isDark}
      layoutWidth={width}
      filmLabel={isEditorial ? HOME_SCREEN_UI.ourStory.filmLabel : null}
      split={storySplit}
      showCaption={storySplit ? Boolean(splitVideoCaption) : !isStoryPhone}
      isStoryPhone={isStoryPhone}
    />
  ) : leadPhoto ? (
    <AboutStoryPhoto photo={leadPhoto} isDark={isDark} layoutWidth={width} isEditorial={isEditorial} />
  ) : null;

  const detailsPanel =
    storySplit ? (
      <StoryDetailsPanel
        isDark={isDark}
        muted={muted}
        pullQuote={pullQuote}
        about={about}
        showCta={showCta}
        navigation={navigation}
        split
        hidePills={hideHighlights}
      />
    ) : null;

  const inner = (
    <View
      style={[
        styles.inner,
        isEditorial && styles.innerEditorial,
        isStoryPhone && styles.innerEditorialPhone,
      ]}
    >
      {isEditorial && showHeader ? (
        <View
          style={[
            styles.sectionIntro,
            isStoryPhone && styles.sectionIntroPhone,
            isStoryPhone && isDark && styles.sectionIntroPhoneDark,
          ]}
        >
          <SectionHeader
            eyebrow={eyebrow}
            title={about.title}
            kicker={isStoryPhone ? storyKicker : undefined}
            align={isStoryPhone ? "center" : "left"}
            compact
            flush
          />
          <GoldHairline
            {...GOLD_HAIRLINE_EDITORIAL.subtle}
            marginVertical={0}
            style={isStoryPhone ? styles.sectionIntroHairline : null}
          />
        </View>
      ) : null}

      {storySplit ? (
        <>
          <View style={styles.storySplitRow}>
            <View style={styles.storySplitText}>{detailsPanel}</View>
            <View style={styles.storySplitMedia}>{mediaBlock}</View>
          </View>
          {!hideHighlights ? (
            <>
              <GoldHairline {...GOLD_HAIRLINE_EDITORIAL.subtle} marginVertical={HOME_SPACE.md} />
              <StoryHighlights isDark={isDark} layoutWidth={width} rail={false} stats={highlightStats} />
            </>
          ) : null}
        </>
      ) : (
        <>
          {mediaBlock}
          {isEditorial && videoSource ? (
            <>
              {!isStoryPhone ? (
                <GoldHairline {...GOLD_HAIRLINE_EDITORIAL.subtle} marginVertical={HOME_SPACE.sm} />
              ) : null}
              <StoryPullQuote quote={pullQuote} isDark={isDark} phone={isStoryPhone} />
            </>
          ) : null}
          {copyPanel}
          {isEditorial && !storySplit && !hideHighlights ? (
            <StoryHighlights
              isDark={isDark}
              layoutWidth={width}
              rail={isStoryPhone}
              stats={highlightStats}
            />
          ) : null}
        </>
      )}
    </View>
  );

  if (isEditorial) {
    return (
      <View
        style={[styles.editorialFrame, isStoryPhone && styles.editorialFramePhone]}
        accessibilityRole="none"
        nativeID="home-our-story"
      >
        <GoldHairline {...GOLD_HAIRLINE_EDITORIAL.subtle} marginVertical={0} />
        <View style={[styles.editorialPad, isStoryPhone && styles.editorialPadPhone]}>{inner}</View>
        <GoldHairline {...GOLD_HAIRLINE_EDITORIAL.subtle} marginVertical={0} />
      </View>
    );
  }

  return (
    <View style={[styles.wrap, compact && styles.wrapCompact]}>
      {inner}
    </View>
  );
}

const cinemaShadowPremium = Platform.select({
  web: {
    boxShadow:
      "0 32px 64px -36px rgba(8, 6, 4, 0.5), 0 12px 32px -16px rgba(25, 20, 15, 0.28), inset 0 1px 0 rgba(42, 117, 89, 0.22)",
  },
  default: {},
});

const styles = StyleSheet.create({
  editorialFrame: {
    width: "100%",
    gap: HOME_SPACE.md,
  },
  editorialFramePhone: {
    gap: HOME_SPACE.sm,
  },
  editorialPad: {
    width: "100%",
    paddingVertical: HOME_SPACE.md,
  },
  editorialPadPhone: {
    paddingVertical: HOME_SPACE.sm,
    gap: HOME_SPACE.md,
  },
  sectionIntro: {
    width: "100%",
    gap: HOME_SPACE.sm,
    marginBottom: HOME_SPACE.xs,
    marginTop: HOME_SPACE.sm,
  },
  sectionIntroPhone: {
    paddingHorizontal: HOME_SPACE.sm,
    paddingVertical: HOME_SPACE.md,
    borderRadius: radius.xl,
    backgroundColor: "rgba(250, 245, 233, 0.72)",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(31, 92, 71, 0.14)",
    marginBottom: HOME_SPACE.sm,
    ...Platform.select({
      web: {
        boxShadow: "0 1px 2px rgba(60, 45, 20, 0.04), 0 16px 36px rgba(80, 60, 25, 0.08)",
      },
      default: {},
    }),
  },
  sectionIntroPhoneDark: {
    backgroundColor: "rgba(24, 21, 19, 0.55)",
    borderColor: "#3f3933",
  },
  sectionIntroHairline: {
    maxWidth: 200,
    alignSelf: "center",
  },
  storyHeader: {
    marginBottom: HOME_SPACE.xs,
  },
  wrap: {
    width: "100%",
    gap: HOME_SPACE.lg,
    paddingVertical: HOME_SPACE.md,
  },
  wrapCompact: {
    gap: HOME_SPACE.md,
    paddingVertical: HOME_SPACE.sm,
  },
  inner: {
    width: "100%",
    gap: HOME_SPACE.lg,
  },
  innerEditorial: {
    gap: HOME_SPACE.lg,
  },
  innerEditorialPhone: {
    gap: HOME_SPACE.md,
  },
  bodyPhone: {
    fontSize: HOME_TYPE.body.min,
    lineHeight: HOME_TYPE.body.lineHeight,
    textAlign: "left",
  },
  storySplitRow: {
    flexDirection: "row",
    alignItems: "stretch",
    gap: HOME_SPACE.lg + 6,
    width: "100%",
    marginTop: HOME_SPACE.sm,
  },
  storySplitText: {
    flex: 0.9,
    minWidth: 280,
    alignSelf: "stretch",
  },
  storySplitMedia: {
    flex: 1.1,
    minWidth: 280,
    alignSelf: "stretch",
    height: STORY_VIDEO_HEIGHT,
    minHeight: STORY_VIDEO_HEIGHT,
  },
  storyDetailsPanel: {
    width: "100%",
    gap: HOME_SPACE.md,
  },
  storySplitDetails: {
    flex: 1,
    height: "100%",
    minHeight: STORY_VIDEO_HEIGHT,
    justifyContent: "center",
    gap: 0,
    paddingVertical: HOME_SPACE.lg + 10,
    paddingHorizontal: HOME_SPACE.lg + 8,
    borderRadius: 30,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: KANKREG_PALETTE.lineSoft,
    backgroundColor: KANKREG_PALETTE.card,
    ...Platform.select({
      web: {
        boxShadow:
          "0 1px 2px rgba(60, 45, 20, 0.04), 0 30px 60px rgba(80, 60, 25, 0.07), inset 0 1px 0 rgba(255, 255, 255, 0.9)",
      },
      default: {},
    }),
  },
  storySplitDetailsDark: {
    backgroundColor: "#181513",
    borderColor: "#3f3933",
  },
  storyCardTitle: {
    fontFamily: FONT_HEADING,
    fontSize: 33,
    lineHeight: 38,
    letterSpacing: -0.5,
  },
  storyCardBody: {
    fontFamily: fonts.regular,
    fontSize: 17,
    lineHeight: 28,
    marginTop: HOME_SPACE.md,
    maxWidth: 440,
  },
  storyCardLabel: {
    fontFamily: fonts.bold,
    fontSize: 12,
    letterSpacing: 2,
    marginTop: HOME_SPACE.lg + 4,
  },
  storyFilmLine: {
    flexDirection: "row",
    alignItems: "center",
    gap: HOME_SPACE.sm,
  },
  storyFilmDash: {
    width: 22,
    height: StyleSheet.hairlineWidth,
    backgroundColor: KANKREG_PALETTE.gold,
    opacity: 0.8,
  },
  storyFilmText: {
    flex: 1,
    fontFamily: fonts.medium,
    fontSize: HOME_TYPE.eyebrow + 1,
    lineHeight: 17,
    letterSpacing: 0.35,
    fontStyle: "italic",
  },
  promisePillsWrap: {
    marginTop: HOME_SPACE.md,
  },
  promisePillsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: HOME_SPACE.sm,
  },
  promisePill: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: radius.pill,
    backgroundColor: KANKREG_PALETTE.paper,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: KANKREG_PALETTE.line,
  },
  promisePillDark: {
    backgroundColor: "#1f1b18",
    borderColor: "#3f3933",
  },
  promisePillText: {
    fontFamily: fonts.semibold,
    fontSize: 14.5,
    color: KANKREG_PALETTE.inkSoft,
    letterSpacing: 0.1,
  },
  ctaRowSplit: {
    marginTop: HOME_SPACE.lg + 2,
  },
  storyDetailsBody: {
    gap: HOME_SPACE.sm,
  },
  highlightsCompact: {
    width: "100%",
    gap: HOME_SPACE.sm,
    paddingTop: HOME_SPACE.xs,
  },
  highlightsCompactEyebrow: {
    fontFamily: fonts.semibold,
    fontSize: 10,
    letterSpacing: 1.2,
    marginBottom: 2,
  },
  highlightCompactRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: HOME_SPACE.sm,
    paddingVertical: HOME_SPACE.xs + 2,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: KANKREG_PALETTE.lineSoft,
  },
  highlightCompactRowFirst: {
    borderTopWidth: 0,
    paddingTop: 0,
  },
  highlightCompactRowDark: {
    borderTopColor: "#3f3933",
  },
  highlightCompactDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: KANKREG_PALETTE.gold,
    marginTop: 6,
  },
  highlightCompactCopy: {
    flex: 1,
    gap: 2,
  },
  highlightCompactValue: {
    fontFamily: fonts.semibold,
    fontSize: HOME_TYPE.kicker,
    lineHeight: HOME_TYPE.body.lineHeight,
  },
  highlightCompactDesc: {
    fontFamily: fonts.regular,
    fontSize: 13,
    lineHeight: 18,
  },
  copyPanel: {
    width: "100%",
    gap: HOME_SPACE.md,
    maxWidth: 640,
  },
  copyPanelEditorial: {
    maxWidth: 680,
    alignSelf: "stretch",
    paddingTop: HOME_SPACE.xs,
    gap: HOME_SPACE.md,
  },
  body: {
    fontFamily: fonts.regular,
    fontSize: HOME_TYPE.body.min,
    lineHeight: HOME_TYPE.body.lineHeight,
  },
  bodyEditorial: {
    fontSize: HOME_TYPE.body.max,
    lineHeight: HOME_TYPE.body.lineHeight + 4,
    maxWidth: 620,
  },
  bodyContinued: {
    fontFamily: fonts.regular,
    fontSize: HOME_TYPE.body.min,
    lineHeight: HOME_TYPE.body.lineHeight,
    maxWidth: 680,
    opacity: 0.92,
  },
  bodySplit: {
    maxWidth: "100%",
    fontSize: HOME_TYPE.body.min,
    lineHeight: HOME_TYPE.body.lineHeight,
  },
  pullQuote: {
    width: "100%",
    flexDirection: "row",
    alignItems: "flex-start",
    gap: HOME_SPACE.md,
    paddingVertical: HOME_SPACE.md,
    paddingHorizontal: HOME_SPACE.md,
    borderRadius: radius.lg,
    backgroundColor: "rgba(201, 146, 30, 0.05)",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(31, 92, 71, 0.18)",
  },
  pullQuotePhone: {
    flexDirection: "column",
    alignItems: "center",
    gap: HOME_SPACE.sm,
    paddingVertical: HOME_SPACE.lg,
    paddingHorizontal: HOME_SPACE.md + 4,
    borderRadius: radius.xl,
    backgroundColor: "rgba(201, 146, 30, 0.07)",
    ...Platform.select({
      web: {
        boxShadow: "0 12px 32px -24px rgba(80, 60, 25, 0.14)",
      },
      default: {},
    }),
  },
  pullQuoteDark: {
    backgroundColor: "rgba(201, 146, 30, 0.08)",
    borderColor: "rgba(31, 92, 71, 0.22)",
  },
  pullQuoteRule: {
    width: 3,
    alignSelf: "stretch",
    borderRadius: 2,
    backgroundColor: KANKREG_PALETTE.gold,
    opacity: 0.75,
    marginTop: 2,
  },
  pullQuoteRulePhone: {
    width: 40,
    height: StyleSheet.hairlineWidth,
    alignSelf: "center",
    marginTop: 0,
  },
  pullQuoteText: {
    flex: 1,
    fontFamily: fonts.medium,
    fontSize: HOME_TYPE.kicker + 1,
    lineHeight: HOME_TYPE.body.lineHeight + 4,
    letterSpacing: 0.15,
  },
  pullQuoteTextPhone: {
    fontFamily: FONT_HEADING,
    fontSize: 22,
    lineHeight: 30,
    letterSpacing: -0.2,
    textAlign: "center",
  },
  highlightsRailSection: {
    width: "100%",
    gap: HOME_SPACE.sm,
  },
  highlightsRail: {
    width: "100%",
    marginHorizontal: -HOME_SPACE.xs,
  },
  highlightsRailContent: {
    paddingHorizontal: HOME_SPACE.xs,
    paddingBottom: HOME_SPACE.xs,
  },
  highlightRailCard: {
    width: HIGHLIGHT_RAIL_CARD_WIDTH,
    marginRight: HOME_SPACE.md,
    borderRadius: radius.lg + 2,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: KANKREG_PALETTE.lineSoft,
    backgroundColor: KANKREG_PALETTE.card,
    padding: HOME_SPACE.md,
    ...Platform.select({
      web: {
        boxShadow: "0 1px 2px rgba(60, 45, 20, 0.04), 0 14px 32px rgba(80, 60, 25, 0.09)",
      },
      default: {},
    }),
  },
  highlightRailCardDark: {
    backgroundColor: "#181513",
    borderColor: "#3f3933",
  },
  highlightRailValue: {
    fontFamily: fonts.bold,
    fontSize: HOME_TYPE.kicker + 1,
    lineHeight: HOME_TYPE.body.lineHeight,
  },
  highlightRailLabel: {
    fontFamily: fonts.semibold,
    fontSize: 10,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginTop: 4,
  },
  highlightRailDesc: {
    fontFamily: fonts.regular,
    fontSize: 13,
    lineHeight: 18,
    marginTop: HOME_SPACE.xs,
  },
  highlightsBlock: {
    width: "100%",
    gap: HOME_SPACE.md,
    paddingTop: HOME_SPACE.xs,
  },
  highlightsGrid: {
    width: "100%",
    gap: HOME_SPACE.md,
  },
  highlightsGridWide: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  highlightCard: {
    flex: 1,
    minWidth: 200,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: KANKREG_PALETTE.line,
    backgroundColor: KANKREG_PALETTE.card,
    padding: HOME_SPACE.md,
    ...Platform.select({
      web: { boxShadow: "0 10px 28px -20px rgba(25, 20, 15, 0.16)" },
      default: {},
    }),
  },
  highlightCardDark: {
    backgroundColor: "#181513",
    borderColor: "#3f3933",
  },
  highlightValue: {
    fontFamily: fonts.bold,
    fontSize: HOME_TYPE.kicker + 2,
    lineHeight: HOME_TYPE.body.lineHeight,
  },
  highlightLabel: {
    fontFamily: fonts.semibold,
    fontSize: 11,
    textTransform: "uppercase",
    letterSpacing: 0.7,
    marginTop: 4,
  },
  highlightDesc: {
    fontFamily: fonts.regular,
    fontSize: 13,
    lineHeight: 18,
    marginTop: HOME_SPACE.xs,
  },
  ctaRow: {
    alignSelf: "flex-start",
    marginTop: HOME_SPACE.xs,
  },
  ctaRowPhone: {
    alignSelf: "stretch",
    marginTop: HOME_SPACE.sm,
  },
  cinemaWrap: {
    width: "100%",
    borderRadius: radius.xl,
    overflow: "hidden",
    borderWidth: StyleSheet.hairlineWidth,
    backgroundColor: CINEMA_FRAME_BG,
    ...Platform.select({
      web: { marginTop: HOME_SPACE.xs },
      default: {},
    }),
  },
  cinemaWrapDesktop: {
    height: STORY_VIDEO_HEIGHT,
  },
  cinemaWrapPhone: {
    borderRadius: radius.lg + 2,
    marginTop: 0,
    ...Platform.select({
      web: {
        boxShadow:
          "0 2px 4px rgba(60, 40, 15, 0.08), 0 20px 44px -20px rgba(70, 48, 18, 0.2)",
      },
      default: {},
    }),
  },
  cinemaWrapSplit: {
    marginTop: 0,
    borderRadius: 26,
    ...Platform.select({
      web: {
        boxShadow: "0 2px 4px rgba(60, 40, 15, 0.1), 0 34px 70px rgba(70, 48, 18, 0.22)",
      },
      default: {},
    }),
  },
  cinemaWrapSplitFill: {
    width: "100%",
    height: "100%",
    minHeight: STORY_VIDEO_HEIGHT,
  },
  cinemaReelSplit: {
    height: "100%",
    minHeight: STORY_VIDEO_HEIGHT,
  },
  cinemaChromeSplit: {
    top: 18,
    left: 18,
    right: 18,
  },
  cinemaCaptionSplit: {
    left: 18,
    right: "40%",
    bottom: 18,
    flexDirection: "column",
    alignItems: "flex-start",
    gap: 0,
  },
  cinemaCaptionTextSplit: {
    fontFamily: FONT_BODY,
    fontSize: 20,
    lineHeight: 26,
    color: "#F6ECD7",
    letterSpacing: 0,
    ...Platform.select({
      web: { textShadow: "0 2px 14px rgba(0, 0, 0, 0.4)" },
      default: {},
    }),
  },
  cinemaWrapLight: {
    borderColor: "rgba(31, 92, 71, 0.38)",
    ...cinemaShadowPremium,
  },
  cinemaWrapDark: {
    borderColor: "#3f3933",
    ...cinemaShadowPremium,
  },
  cinemaReel: {
    width: "100%",
    height: STORY_VIDEO_HEIGHT,
    position: "relative",
    overflow: "hidden",
    backgroundColor: CINEMA_FRAME_BG,
    ...Platform.select({
      default: { minHeight: 220 },
      web: {},
    }),
  },
  cinemaStage: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: "100%",
    height: "100%",
    overflow: "hidden",
    backgroundColor: CINEMA_FRAME_BG,
    zIndex: 0,
  },
  cinemaVideoFill: {
    ...StyleSheet.absoluteFillObject,
    width: "100%",
    height: "100%",
    backgroundColor: CINEMA_FRAME_BG,
  },
  cinemaVideoBg: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: "100%",
    height: "100%",
    backgroundColor: CINEMA_FRAME_BG,
  },
  cinemaFrameLineTop: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: StyleSheet.hairlineWidth,
    backgroundColor: "rgba(255, 253, 248, 0.22)",
    zIndex: 3,
  },
  cinemaFrameLineBottom: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: StyleSheet.hairlineWidth,
    backgroundColor: "rgba(255, 253, 248, 0.12)",
    zIndex: 3,
  },
  cinemaSideVignette: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 2,
  },
  cinemaBottomScrim: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 2,
  },
  cinemaChrome: {
    position: "absolute",
    top: HOME_SPACE.md,
    left: HOME_SPACE.md,
    right: HOME_SPACE.md,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    zIndex: 6,
  },
  filmBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: radius.pill,
    backgroundColor: "rgba(28, 18, 8, 0.55)",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255, 253, 248, 0.14)",
    ...Platform.select({
      web: { backdropFilter: "blur(6px)" },
      default: {},
    }),
  },
  filmBadgeDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: KANKREG_PALETTE.gold,
  },
  filmBadgeText: {
    fontFamily: fonts.semibold,
    fontSize: 10,
    letterSpacing: 0.8,
    textTransform: "uppercase",
    color: "rgba(255, 253, 248, 0.82)",
  },
  cinemaChip: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(28, 18, 8, 0.55)",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255, 253, 248, 0.14)",
    marginLeft: "auto",
    ...Platform.select({
      web: { cursor: "pointer", backdropFilter: "blur(6px)" },
      default: {},
    }),
  },
  cinemaChipHover: {
    backgroundColor: "rgba(0, 0, 0, 0.62)",
  },
  cinemaChipFocus: {
    ...Platform.select({
      web: {
        outlineStyle: "solid",
        outlineWidth: 2,
        outlineColor: KANKREG_PALETTE.gold,
        outlineOffset: 2,
      },
      default: {},
    }),
  },
  cinemaCaption: {
    position: "absolute",
    left: HOME_SPACE.lg,
    right: HOME_SPACE.lg,
    bottom: HOME_SPACE.md,
    flexDirection: "row",
    alignItems: "flex-end",
    gap: HOME_SPACE.sm,
    zIndex: 6,
    paddingBottom: 2,
  },
  cinemaCaptionRule: {
    width: 20,
    height: StyleSheet.hairlineWidth,
    backgroundColor: KANKREG_PALETTE.gold,
    marginBottom: 8,
    opacity: 0.85,
  },
  cinemaCaptionText: {
    flex: 1,
    fontFamily: fonts.medium,
    fontSize: HOME_TYPE.kicker,
    lineHeight: HOME_TYPE.body.lineHeight,
    color: "rgba(255, 253, 248, 0.94)",
    letterSpacing: 0.12,
  },
});
