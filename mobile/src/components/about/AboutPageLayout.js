import React from "react";
import { Platform, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useTheme } from "../../context/ThemeContext";
import { getKankregSurfaces, KANKREG_PALETTE, ZEEVAN_GOLD, ZEEVAN_GREEN } from "../../theme/kankregWeb";
import { createKankregEyebrowStyle } from "../../theme/kankregScreenStyles";
import { useKankregLayout } from "../../theme/kankregBreakpoints";
import { HOME_SPACE } from "../../theme/homeEditorial";
import { fonts, icon, layout, spacing, typography } from "../../theme/tokens";
import { FONT_BODY_SEMIBOLD, FONT_HEADING, FONT_PRICE } from "../../theme/typographyRoles";
import { KankregSectionHead } from "../kankreg/KankregPageChrome";
import GoldHairline from "../ui/GoldHairline";
import PremiumButton from "../ui/PremiumButton";
import {
  ABOUT_PAGE_ANIM,
  ABOUT_PAGE_SECTION_LABELS,
} from "../../content/aboutPageContent";
import SectionReveal from "../motion/SectionReveal";

function AboutSectionDivider({ label }) {
  if (!label) {
    return <GoldHairline marginVertical={spacing.lg} withDot={false} variant="subtle" />;
  }
  return (
    <View style={styles.sectionDivider}>
      <GoldHairline marginVertical={0} withDot={false} variant="subtle" style={styles.sectionDividerLine} />
      <Text style={styles.sectionDividerLabel}>{label}</Text>
    </View>
  );
}

function SidebarPanel({ children, animIndex }) {
  return (
    <SectionReveal index={animIndex} preset="slide-right">
      <View style={styles.sidebarPanel}>{children}</View>
    </SectionReveal>
  );
}

export function AboutSidebar({ about, sticky = false }) {
  const { isDark, colors: c } = useTheme();
  const surfaces = getKankregSurfaces(isDark, c);
  const { isMd } = useKankregLayout();

  return (
    <View style={[styles.sidebar, sticky && isMd && styles.sidebarSticky]}>
      {about.sidebarStats?.length ? (
        <SidebarPanel animIndex={ABOUT_PAGE_ANIM.sidebarStats}>
          <Text style={createKankregEyebrowStyle(isDark)}>{ABOUT_PAGE_SECTION_LABELS.sidebarStats}</Text>
          <View style={styles.statsGrid}>
            {about.sidebarStats.map((stat, idx) => (
              <SectionReveal key={`${stat.value}-${stat.label}`} index={ABOUT_PAGE_ANIM.sidebarStats + idx} preset="scale-in">
                <View style={styles.statCell}>
                  <Text style={[styles.statValue, { color: isDark ? ZEEVAN_GOLD.bright : ZEEVAN_GREEN.deep }]}>
                    {stat.value}
                  </Text>
                  <Text style={[styles.statLabel, { color: surfaces.textMuted }]}>{stat.label}</Text>
                </View>
              </SectionReveal>
            ))}
          </View>
        </SidebarPanel>
      ) : null}

      {about.highlights?.length ? (
        <SidebarPanel animIndex={ABOUT_PAGE_ANIM.sidebarHighlights}>
          <Text style={createKankregEyebrowStyle(isDark)}>{ABOUT_PAGE_SECTION_LABELS.sidebarPromise}</Text>
          <Text style={[styles.sidebarTitle, { color: surfaces.text }]}>
            {ABOUT_PAGE_SECTION_LABELS.sidebarPromiseTitle}
          </Text>
          <GoldHairline marginVertical={spacing.sm} withDot={false} variant="subtle" />
          {about.highlights.map((item, idx) => (
            <SectionReveal key={item.value} index={ABOUT_PAGE_ANIM.sidebarHighlights + idx} preset="fade-in">
              <View style={[styles.highlightRow, isDark && styles.highlightRowDark]}>
                <View style={styles.highlightDot} />
                <View style={styles.highlightCopy}>
                  <Text style={[styles.highlightValue, { color: surfaces.text }]}>{item.value}</Text>
                  <Text style={[styles.highlightLabel, { color: surfaces.textMuted }]}>{item.label}</Text>
                  {item.description ? (
                    <Text style={[styles.highlightDesc, { color: surfaces.textSoft }]}>{item.description}</Text>
                  ) : null}
                </View>
              </View>
            </SectionReveal>
          ))}
        </SidebarPanel>
      ) : null}

      {about.pillars?.length ? (
        <SidebarPanel animIndex={ABOUT_PAGE_ANIM.sidebarPillars}>
          <Text style={createKankregEyebrowStyle(isDark)}>{ABOUT_PAGE_SECTION_LABELS.sidebarPillars}</Text>
          <Text style={[styles.sidebarTitle, { color: surfaces.text }]}>{ABOUT_PAGE_SECTION_LABELS.sidebarPillarsTitle}</Text>
          {about.pillars.filter((p) => p.enabled !== false).map((pillar, idx) => (
            <SectionReveal key={pillar.id} index={ABOUT_PAGE_ANIM.sidebarPillars + idx} preset="fade-up">
              <View style={styles.pillarRow}>
                <View style={[styles.pillarIcon, isDark && styles.pillarIconDark]}>
                  <Ionicons name={pillar.icon || "leaf-outline"} size={icon.sm} color={ZEEVAN_GOLD.base} />
                </View>
                <View style={styles.pillarCopy}>
                  <Text style={[styles.pillarTitle, { color: surfaces.text }]}>{pillar.title}</Text>
                  <Text style={[styles.pillarBody, { color: surfaces.textSoft }]}>{pillar.body}</Text>
                </View>
              </View>
            </SectionReveal>
          ))}
        </SidebarPanel>
      ) : null}
    </View>
  );
}

export function AboutMissionSection({ mission }) {
  const { isDark, colors: c } = useTheme();
  const surfaces = getKankregSurfaces(isDark, c);
  const { isMd } = useKankregLayout();
  if (!mission?.paragraphs?.length) return null;

  return (
    <View
      style={[
        styles.missionWrap,
        {
          backgroundColor: isDark ? c.surfaceMuted : KANKREG_PALETTE.paper2,
          borderColor: surfaces.borderSubtle,
        },
      ]}
    >
      <KankregSectionHead eyebrow={mission.eyebrow} title={mission.title} />
      <View style={[styles.missionBody, !isMd && styles.missionBodyStack]}>
        {mission.paragraphs.map((para, idx) => (
          <SectionReveal key={idx} index={ABOUT_PAGE_ANIM.mission + idx} preset="fade-up">
            <Text style={[styles.missionPara, { color: surfaces.textSoft }]}>{para}</Text>
          </SectionReveal>
        ))}
      </View>
    </View>
  );
}

export function AboutCraftSection({ craft, sectionRef }) {
  const { isDark, colors: c } = useTheme();
  const surfaces = getKankregSurfaces(isDark, c);
  const { isMd } = useKankregLayout();
  if (!craft?.steps?.length) return null;

  return (
    <View ref={sectionRef} nativeID="about-craft" style={styles.craftWrap}>
      <KankregSectionHead index={2} eyebrow={craft.eyebrow} title={craft.title} />
      <View style={[styles.craftTimeline, !isMd && styles.craftTimelineStack]}>
        {craft.steps.map((step, idx) => (
          <SectionReveal
            key={step.id}
            index={ABOUT_PAGE_ANIM.craftStepStart + idx}
            preset={isMd ? "slide-right" : "fade-up"}
          >
            <View style={styles.craftStep}>
              <View style={styles.craftStepHead}>
                <Text style={[styles.craftStepNum, { color: isDark ? ZEEVAN_GOLD.bright : ZEEVAN_GREEN.deep }]}>
                  {step.label}
                </Text>
                {idx < craft.steps.length - 1 && isMd ? <View style={styles.craftConnector} /> : null}
              </View>
              <Text style={[styles.craftStepTitle, { color: surfaces.text }]}>{step.title}</Text>
              <Text style={[styles.craftStepBody, { color: surfaces.textSoft }]}>{step.body}</Text>
            </View>
          </SectionReveal>
        ))}
      </View>
    </View>
  );
}

export function AboutCtaSection({ ctaBand, navigation }) {
  const { isDark } = useTheme();
  const { stackFooterNewsletter } = useKankregLayout();
  if (!ctaBand?.title) return null;

  return (
    <LinearGradient
      colors={
        isDark
          ? [ZEEVAN_GREEN.deep, "#121816"]
          : [ZEEVAN_GREEN.deep, "#2A3D1F"]
      }
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.ctaWrap}
    >
      <View style={styles.ctaGoldRule} pointerEvents="none" />
      <View style={[styles.ctaInner, stackFooterNewsletter && styles.ctaInnerStack]}>
        <View style={styles.ctaCopy}>
          <Text style={styles.ctaTitle}>{ctaBand.title}</Text>
          {ctaBand.body ? <Text style={styles.ctaBody}>{ctaBand.body}</Text> : null}
        </View>
        <View style={[styles.ctaActions, stackFooterNewsletter && styles.ctaActionsStack]}>
          <PremiumButton
            label={ctaBand.ctaLabel || "Shop"}
            variant="gold"
            onPress={() => navigation.navigate("Shop")}
          />
          <PremiumButton
            label={ctaBand.ctaSecondaryLabel || "Support"}
            variant="ghost"
            onPress={() => navigation.navigate("Support")}
            textStyle={styles.ctaGhostText}
          />
        </View>
      </View>
    </LinearGradient>
  );
}

/** Two-column about page shell — main story + sticky sidebar. */
export default function AboutPageLayout({ about, navigation, children, craftRef }) {
  const { isMd } = useKankregLayout();
  const twoCol = isMd && Platform.OS === "web";

  return (
    <View style={[styles.page, twoCol && styles.pageTwoCol]}>
      <View style={[styles.main, twoCol && styles.mainCol]}>
        {children}

        {!twoCol ? <AboutSidebar about={about} /> : null}

        <AboutSectionDivider label={ABOUT_PAGE_SECTION_LABELS.missionDivider} />
        <SectionReveal preset="fade-up" index={ABOUT_PAGE_ANIM.mission}>
          <AboutMissionSection mission={about.mission} />
        </SectionReveal>

        <AboutSectionDivider label={ABOUT_PAGE_SECTION_LABELS.craftDivider} />
        <SectionReveal preset="fade-up" index={ABOUT_PAGE_ANIM.craft}>
          <AboutCraftSection craft={about.craft} sectionRef={craftRef} />
        </SectionReveal>

        <SectionReveal preset="scale-in" index={ABOUT_PAGE_ANIM.cta}>
          <AboutCtaSection ctaBand={about.ctaBand} navigation={navigation} />
        </SectionReveal>
      </View>

      {twoCol ? <AboutSidebar about={about} sticky /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  page: {
    width: "100%",
    gap: HOME_SPACE.lg,
  },
  pageTwoCol: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: HOME_SPACE.xl,
    maxWidth: layout.maxContentWidth + 120,
    alignSelf: "center",
  },
  main: {
    width: "100%",
    gap: HOME_SPACE.md,
  },
  mainCol: {
    flex: 1,
    minWidth: 0,
  },
  sectionDivider: {
    marginVertical: spacing.sm,
    gap: spacing.sm,
  },
  sectionDividerLine: {
    width: "100%",
  },
  sectionDividerLabel: {
    fontFamily: fonts.semibold,
    fontSize: 10,
    letterSpacing: 2,
    textTransform: "uppercase",
    color: ZEEVAN_GREEN.deep,
    textAlign: "center",
    opacity: 0.85,
  },
  sidebar: {
    width: "100%",
    gap: HOME_SPACE.md,
  },
  sidebarSticky: {
    width: 300,
    flexShrink: 0,
    position: Platform.OS === "web" ? "sticky" : "relative",
    top: 88,
    alignSelf: "flex-start",
  },
  sidebarPanel: {
    paddingVertical: spacing.md,
    gap: spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: KANKREG_PALETTE.line,
  },
  sidebarTitle: {
    fontFamily: FONT_HEADING,
    fontSize: 22,
    fontWeight: "400",
    marginTop: spacing.xs,
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.md,
    marginTop: spacing.sm,
  },
  statCell: {
    width: "46%",
    minWidth: 120,
  },
  statValue: {
    fontFamily: FONT_PRICE,
    fontSize: 24,
    fontWeight: "500",
  },
  statLabel: {
    fontSize: typography.caption,
    marginTop: 2,
    fontFamily: fonts.medium,
  },
  highlightRow: {
    flexDirection: "row",
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: KANKREG_PALETTE.lineSoft,
  },
  highlightRowDark: {
    borderTopColor: "#3f3933",
  },
  highlightDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: ZEEVAN_GOLD.base,
    marginTop: 8,
  },
  highlightCopy: {
    flex: 1,
    gap: 2,
  },
  highlightValue: {
    fontFamily: fonts.semibold,
    fontSize: typography.body,
  },
  highlightLabel: {
    fontSize: 10,
    letterSpacing: 0.8,
    textTransform: "uppercase",
    fontFamily: fonts.semibold,
  },
  highlightDesc: {
    fontSize: typography.caption,
    lineHeight: 18,
    marginTop: 2,
  },
  pillarRow: {
    flexDirection: "row",
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  pillarIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: ZEEVAN_GOLD.soft,
    alignItems: "center",
    justifyContent: "center",
  },
  pillarIconDark: {
    backgroundColor: "rgba(201,162,39,0.14)",
  },
  pillarCopy: {
    flex: 1,
  },
  pillarTitle: {
    fontFamily: fonts.semibold,
    fontSize: typography.body,
    marginBottom: 2,
  },
  pillarBody: {
    fontSize: typography.caption,
    lineHeight: 18,
  },
  missionWrap: {
    borderRadius: 0,
    borderWidth: 0,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.lg,
    width: "100%",
  },
  missionBody: {
    flexDirection: "row",
    gap: spacing.xl,
    marginTop: spacing.sm,
  },
  missionBodyStack: {
    flexDirection: "column",
    gap: spacing.md,
  },
  missionPara: {
    flex: 1,
    fontSize: typography.body,
    lineHeight: typography.body * 1.7,
  },
  craftWrap: {
    width: "100%",
  },
  craftTimeline: {
    flexDirection: "row",
    gap: spacing.lg,
    marginTop: spacing.md,
  },
  craftTimelineStack: {
    flexDirection: "column",
    gap: spacing.lg,
  },
  craftStep: {
    flex: 1,
    paddingVertical: spacing.sm,
    minWidth: 160,
    borderTopWidth: 2,
    borderTopColor: ZEEVAN_GOLD.base,
  },
  craftStepHead: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.sm,
  },
  craftStepNum: {
    fontFamily: FONT_BODY_SEMIBOLD,
    fontSize: 22,
    fontWeight: "600",
  },
  craftConnector: {
    flex: 1,
    height: 1,
    backgroundColor: "rgba(212,165,116,0.45)",
    marginLeft: spacing.sm,
  },
  craftStepTitle: {
    fontFamily: FONT_HEADING,
    fontSize: typography.body + 3,
    marginBottom: spacing.xs,
  },
  craftStepBody: {
    fontSize: typography.caption + 1,
    lineHeight: typography.caption * 1.7,
  },
  ctaWrap: {
    borderRadius: 16,
    overflow: "hidden",
    width: "100%",
    marginTop: spacing.md,
    position: "relative",
  },
  ctaGoldRule: {
    position: "absolute",
    top: 0,
    left: "20%",
    right: "20%",
    height: 2,
    backgroundColor: ZEEVAN_GOLD.base,
    opacity: 0.85,
  },
  ctaInner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.lg,
    padding: spacing.xl,
  },
  ctaInnerStack: {
    flexDirection: "column",
    alignItems: "stretch",
  },
  ctaCopy: {
    flex: 1,
    minWidth: 200,
  },
  ctaTitle: {
    fontFamily: FONT_HEADING,
    fontSize: 28,
    fontWeight: "400",
    marginBottom: spacing.xs,
    color: "#FAF8F4",
  },
  ctaBody: {
    fontSize: typography.body,
    lineHeight: typography.body * 1.55,
    maxWidth: 480,
    color: "rgba(250,248,244,0.78)",
  },
  ctaActions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    alignItems: "center",
  },
  ctaActionsStack: {
    width: "100%",
  },
  ctaGhostText: {
    color: "rgba(250,248,244,0.88)",
  },
});
