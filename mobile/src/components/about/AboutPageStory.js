import React from "react";
import { Platform, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../context/ThemeContext";
import { FONT_HEADING, FONT_HEADING_ITALIC } from "../../theme/typographyRoles";
import { getKankregSurfaces, KANKREG_PALETTE, ZEEVAN_GREEN } from "../../theme/kankregWeb";
import { createKankregEyebrowStyle } from "../../theme/kankregScreenStyles";
import { useKankregLayout } from "../../theme/kankregBreakpoints";
import { HOME_SPACE } from "../../theme/homeEditorial";
import { fonts, icon, spacing, typography } from "../../theme/tokens";
import AboutPhoto from "./AboutPhoto";
import GoldHairline from "../ui/GoldHairline";
import SectionReveal from "../motion/SectionReveal";
import {
  ABOUT_PAGE_ANIM,
  ABOUT_PAGE_SECTION_LABELS,
  ABOUT_STORY_BLOCKS,
} from "../../content/aboutPageContent";

function AboutSectionDivider() {
  return <GoldHairline marginVertical={spacing.sm} withDot={false} variant="subtle" />;
}

function StoryBlock({ eyebrow, title, body, isDark, surfaces, iconName }) {
  if (!body && !title) return null;
  return (
    <View style={styles.block}>
      <View style={styles.blockHead}>
        {iconName ? (
          <View style={[styles.blockIcon, isDark && styles.blockIconDark]}>
            <Ionicons name={iconName} size={icon.sm} color={ZEEVAN_GREEN.deep} />
          </View>
        ) : null}
        <View style={styles.blockHeadCopy}>
          {eyebrow ? <Text style={createKankregEyebrowStyle(isDark)}>{eyebrow}</Text> : null}
          {title ? <Text style={[styles.blockTitle, { color: surfaces.text }]}>{title}</Text> : null}
        </View>
      </View>
      {body ? <Text style={[styles.blockBody, { color: surfaces.textSoft }]}>{body}</Text> : null}
    </View>
  );
}

function ValuesGrid({ values, isDark, surfaces, isMd }) {
  if (!values?.length) return null;
  return (
    <View style={styles.valuesWrap}>
      <Text style={createKankregEyebrowStyle(isDark)}>{ABOUT_PAGE_SECTION_LABELS.storyValues}</Text>
      <Text style={[styles.valuesHeading, { color: surfaces.text }]}>
        {ABOUT_PAGE_SECTION_LABELS.storyValuesTitle}
      </Text>
      <View style={[styles.valuesGrid, isMd && styles.valuesGridWide]}>
        {values.map((item, idx) => (
          <SectionReveal key={item.title} index={ABOUT_PAGE_ANIM.values + idx} preset="fade-up">
            <View
              style={[
                styles.valueCard,
                { borderColor: surfaces.borderSubtle },
                isMd && styles.valueCardHalf,
              ]}
            >
              <Text style={[styles.valueIndex, { color: KANKREG_PALETTE.gold }]}>
                {String(idx + 1).padStart(2, "0")}
              </Text>
              <Text style={[styles.valueTitle, { color: surfaces.text }]}>{item.title}</Text>
              <Text style={[styles.valueBody, { color: surfaces.textSoft }]}>{item.body}</Text>
            </View>
          </SectionReveal>
        ))}
      </View>
    </View>
  );
}

/** Compact equal gallery — 4-up desktop, 2-up phone. No giant featured image. */
function PhotoGallery({ photos, isDark, isMd, isMobileWeb }) {
  if (!photos?.length) return null;
  const cols = isMd ? 4 : 2;

  return (
    <View style={styles.galleryWrap}>
      <Text style={createKankregEyebrowStyle(isDark)}>{ABOUT_PAGE_SECTION_LABELS.storyGallery}</Text>
      <Text style={[styles.galleryHeading, { color: isDark ? KANKREG_PALETTE.paper : KANKREG_PALETTE.ink }]}>
        {ABOUT_PAGE_SECTION_LABELS.storyGalleryTitle}
      </Text>
      <View style={[styles.galleryGrid, { gap: isMobileWeb ? 10 : 14 }]}>
        {photos.slice(0, 4).map((photo, idx) => {
          const media = photo.source ?? photo.url;
          return (
            <SectionReveal
              key={`${photo.caption || idx}-${idx}`}
              index={ABOUT_PAGE_ANIM.gallery + idx}
              preset="fade-up"
            >
              <View style={[styles.galleryCell, { width: `${100 / cols - 1.5}%` }]}>
                <AboutPhoto
                  source={media}
                  caption={photo.caption}
                  aspectRatio={1}
                  isDark={isDark}
                  priority={idx < 2 ? "high" : "normal"}
                />
              </View>
            </SectionReveal>
          );
        })}
      </View>
    </View>
  );
}

export default function AboutPageStory({ about, hidePullQuote = false }) {
  const { isDark, colors: c } = useTheme();
  const surfaces = getKankregSurfaces(isDark, c);
  const { isMd, isMobileWeb } = useKankregLayout();

  if (!about) return null;

  const storyBlocks = ABOUT_STORY_BLOCKS.map((cfg, idx) => {
    const data = about[cfg.dataKey];
    if (!data?.title && !data?.body) return null;
    return (
      <SectionReveal
        key={cfg.key}
        index={ABOUT_PAGE_ANIM.storyBlockStart + idx}
        preset={cfg.preset || "fade-up"}
      >
        <StoryBlock
          eyebrow={data.eyebrow}
          title={data.title}
          body={data.body}
          isDark={isDark}
          surfaces={surfaces}
          iconName={cfg.icon}
        />
      </SectionReveal>
    );
  }).filter(Boolean);

  return (
    <View style={styles.root}>
      {!hidePullQuote && about.pullQuote ? (
        <SectionReveal index={ABOUT_PAGE_ANIM.pullQuote} preset="scale-in">
          <View style={[styles.pullQuote, isDark && styles.pullQuoteDark]}>
            <Text style={[styles.pullQuoteText, { color: surfaces.text }]}>{about.pullQuote}</Text>
          </View>
        </SectionReveal>
      ) : null}

      {about.body || about.bodyContinued ? (
        <SectionReveal index={ABOUT_PAGE_ANIM.intro} preset="fade-up">
          <View style={styles.leadWrap}>
            {about.body ? (
              <Text style={[styles.lead, { color: surfaces.text }]}>{about.body}</Text>
            ) : null}
            {about.bodyContinued ? (
              <Text style={[styles.leadContinued, { color: surfaces.textSoft }]}>{about.bodyContinued}</Text>
            ) : null}
          </View>
        </SectionReveal>
      ) : null}

      {about.photos?.length ? (
        <PhotoGallery photos={about.photos} isDark={isDark} isMd={isMd} isMobileWeb={isMobileWeb} />
      ) : null}

      {storyBlocks.length ? (
        <View style={styles.storyBlocks}>
          <AboutSectionDivider />
          {storyBlocks}
        </View>
      ) : null}

      {about.values?.length ? (
        <SectionReveal index={ABOUT_PAGE_ANIM.values} preset="fade-up">
          <ValuesGrid values={about.values} isDark={isDark} surfaces={surfaces} isMd={isMd} />
        </SectionReveal>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    width: "100%",
    gap: HOME_SPACE.md,
  },
  storyBlocks: {
    gap: HOME_SPACE.sm,
  },
  pullQuote: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    borderLeftWidth: 3,
    borderLeftColor: ZEEVAN_GREEN.base,
  },
  pullQuoteDark: {
    borderLeftColor: KANKREG_PALETTE.gold,
  },
  pullQuoteText: {
    fontFamily: FONT_HEADING_ITALIC,
    fontStyle: "italic",
    fontSize: 18,
    lineHeight: 28,
  },
  leadWrap: {
    gap: spacing.sm,
  },
  lead: {
    fontFamily: FONT_HEADING,
    fontSize: Platform.OS === "web" ? 20 : 18,
    lineHeight: Platform.OS === "web" ? 30 : 28,
    letterSpacing: -0.2,
  },
  leadContinued: {
    fontFamily: fonts.regular,
    fontSize: typography.body,
    lineHeight: 26,
    maxWidth: 640,
  },
  block: {
    paddingVertical: spacing.sm,
    gap: 6,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: KANKREG_PALETTE.lineSoft,
  },
  blockHead: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.sm,
  },
  blockHeadCopy: {
    flex: 1,
    gap: 2,
  },
  blockIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: ZEEVAN_GREEN.soft,
    alignItems: "center",
    justifyContent: "center",
  },
  blockIconDark: {
    backgroundColor: "rgba(52, 211, 153, 0.12)",
  },
  blockTitle: {
    fontFamily: FONT_HEADING,
    fontSize: 20,
    lineHeight: 26,
    fontWeight: "400",
  },
  blockBody: {
    fontFamily: fonts.regular,
    fontSize: typography.body,
    lineHeight: typography.body * 1.6,
    maxWidth: 620,
    paddingLeft: 44,
  },
  valuesWrap: {
    gap: spacing.xs,
    paddingTop: spacing.xs,
  },
  valuesHeading: {
    fontFamily: FONT_HEADING,
    fontSize: 24,
    letterSpacing: -0.3,
  },
  valuesGrid: {
    gap: spacing.md,
    marginTop: spacing.sm,
  },
  valuesGridWide: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  valueCard: {
    paddingVertical: spacing.sm,
    paddingRight: spacing.sm,
    gap: 4,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  valueCardHalf: {
    width: "48%",
    minWidth: 180,
    flexGrow: 1,
  },
  valueIndex: {
    fontFamily: fonts.semibold,
    fontSize: 11,
    letterSpacing: 1.2,
  },
  valueTitle: {
    fontFamily: FONT_HEADING,
    fontSize: 18,
    lineHeight: 24,
  },
  valueBody: {
    fontFamily: fonts.regular,
    fontSize: typography.caption + 1,
    lineHeight: 20,
  },
  galleryWrap: {
    gap: 6,
    marginTop: spacing.xs,
  },
  galleryHeading: {
    fontFamily: FONT_HEADING,
    fontSize: 24,
    letterSpacing: -0.3,
    marginBottom: spacing.xs,
  },
  galleryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  galleryCell: {
    minWidth: 140,
    flexGrow: 1,
  },
});
