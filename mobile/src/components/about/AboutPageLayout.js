import React from "react";
import { Platform, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useTheme } from "../../context/ThemeContext";
import { getKankregSurfaces, KANKREG_PALETTE } from "../../theme/kankregWeb";
import { createKankregEyebrowStyle } from "../../theme/kankregScreenStyles";
import { useKankregLayout } from "../../theme/kankregBreakpoints";
import { HOME_SPACE } from "../../theme/homeEditorial";
import { fonts, icon, layout, radius, spacing, typography } from "../../theme/tokens";
import { KankregSectionHead } from "../kankreg/KankregPageChrome";
import GoldHairline from "../ui/GoldHairline";
import PremiumButton from "../ui/PremiumButton";
import {
  ABOUT_PAGE_ANIM,
  ABOUT_PAGE_SECTION_LABELS,
} from "../../content/aboutPageContent";
import SectionReveal from "../motion/SectionReveal";
import { platformShadow, shadowStyleForPlatform } from "../../theme/shadowPlatform";

const panelShadow = platformShadow({
  web: { boxShadow: "0 1px 2px rgba(25,20,15,.04), 0 14px 38px -20px rgba(25,20,15,.22)" },
  ios: {
    shadowColor: "#3D2A12",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.09,
    shadowRadius: 10,
  },
  android: { elevation: 3 },
});

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

function SidebarCard({ children, animIndex, surfaces }) {
  return (
    <SectionReveal index={animIndex} preset="slide-right">
      <View
        style={[
          styles.sidebarCard,
          { backgroundColor: surfaces.card, borderColor: surfaces.border },
          panelShadow,
        ]}
      >
        {children}
      </View>
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
        <SidebarCard animIndex={ABOUT_PAGE_ANIM.sidebarStats} surfaces={surfaces}>
          <Text style={createKankregEyebrowStyle(isDark)}>{ABOUT_PAGE_SECTION_LABELS.sidebarStats}</Text>
          <View style={styles.statsGrid}>
            {about.sidebarStats.map((stat, idx) => (
              <SectionReveal key={`${stat.value}-${stat.label}`} index={ABOUT_PAGE_ANIM.sidebarStats + idx} preset="scale-in">
                <View style={styles.statCell}>
                  <Text style={[styles.statValue, { color: KANKREG_PALETTE.gold }]}>{stat.value}</Text>
                  <Text style={[styles.statLabel, { color: surfaces.textMuted }]}>{stat.label}</Text>
                </View>
              </SectionReveal>
            ))}
          </View>
        </SidebarCard>
      ) : null}

      {about.highlights?.length ? (
        <SidebarCard animIndex={ABOUT_PAGE_ANIM.sidebarHighlights} surfaces={surfaces}>
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
        </SidebarCard>
      ) : null}

      {about.pillars?.length ? (
        <SidebarCard animIndex={ABOUT_PAGE_ANIM.sidebarPillars} surfaces={surfaces}>
          <Text style={createKankregEyebrowStyle(isDark)}>{ABOUT_PAGE_SECTION_LABELS.sidebarPillars}</Text>
          <Text style={[styles.sidebarTitle, { color: surfaces.text }]}>{ABOUT_PAGE_SECTION_LABELS.sidebarPillarsTitle}</Text>
          {about.pillars.filter((p) => p.enabled !== false).map((pillar, idx) => (
            <SectionReveal key={pillar.id} index={ABOUT_PAGE_ANIM.sidebarPillars + idx} preset="fade-up">
              <View style={styles.pillarRow}>
                <View style={[styles.pillarIcon, isDark && styles.pillarIconDark]}>
                  <Ionicons name={pillar.icon || "leaf-outline"} size={icon.sm} color={KANKREG_PALETTE.goldBright} />
                </View>
                <View style={styles.pillarCopy}>
                  <Text style={[styles.pillarTitle, { color: surfaces.text }]}>{pillar.title}</Text>
                  <Text style={[styles.pillarBody, { color: surfaces.textSoft }]}>{pillar.body}</Text>
                </View>
              </View>
            </SectionReveal>
          ))}
        </SidebarCard>
      ) : null}
    </View>
  );
}

export function AboutMissionSection({ mission }) {
  const { isDark, colors: c, shadowPremium } = useTheme();
  const surfaces = getKankregSurfaces(isDark, c);
  const { isMd } = useKankregLayout();
  if (!mission?.paragraphs?.length) return null;

  return (
    <View
      style={[
        styles.missionWrap,
        { backgroundColor: isDark ? c.surfaceMuted : KANKREG_PALETTE.paper2, borderColor: surfaces.borderSubtle },
        shadowStyleForPlatform(shadowPremium),
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
            <View
              style={[styles.craftStep, { backgroundColor: surfaces.card, borderColor: surfaces.border }, panelShadow]}
            >
              <View style={styles.craftStepHead}>
                <Text style={[styles.craftStepNum, { color: KANKREG_PALETTE.gold }]}>{step.label}</Text>
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
      colors={isDark ? ["#1a2820", "#121816"] : ["#f0f5f2", "#e8f0eb"]}
      style={[styles.ctaWrap, isDark && { borderColor: "rgba(52, 211, 153, 0.2)" }]}
    >
      <View style={[styles.ctaInner, stackFooterNewsletter && styles.ctaInnerStack]}>
        <View style={styles.ctaCopy}>
          <Text style={[styles.ctaTitle, { color: isDark ? KANKREG_PALETTE.paper : KANKREG_PALETTE.ink }]}>
            {ctaBand.title}
          </Text>
          {ctaBand.body ? (
            <Text style={[styles.ctaBody, { color: isDark ? "#c8bdaf" : KANKREG_PALETTE.inkSoft }]}>
              {ctaBand.body}
            </Text>
          ) : null}
        </View>
        <View style={[styles.ctaActions, stackFooterNewsletter && styles.ctaActionsStack]}>
          <PremiumButton
            label={ctaBand.ctaLabel || "Shop"}
            variant="primary"
            onPress={() => navigation.navigate("Shop")}
          />
          <PremiumButton
            label={ctaBand.ctaSecondaryLabel || "Support"}
            variant="ghost"
            onPress={() => navigation.navigate("Support")}
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
    letterSpacing: 1.4,
    textTransform: "uppercase",
    color: KANKREG_PALETTE.greenDeep,
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
    top: 24,
    alignSelf: "flex-start",
  },
  sidebarCard: {
    borderRadius: radius.xl,
    borderWidth: 1,
    padding: spacing.lg,
    gap: spacing.sm,
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
    fontSize: 22,
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
    backgroundColor: KANKREG_PALETTE.gold,
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
    borderRadius: 10,
    backgroundColor: "rgba(169,119,46,0.12)",
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
    borderRadius: radius.xl,
    borderWidth: 1,
    padding: spacing.lg,
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
    lineHeight: typography.body * 1.6,
  },
  craftWrap: {
    width: "100%",
  },
  craftTimeline: {
    flexDirection: "row",
    gap: spacing.md,
    marginTop: spacing.md,
  },
  craftTimelineStack: {
    flexDirection: "column",
  },
  craftStep: {
    flex: 1,
    borderRadius: radius.lg,
    borderWidth: 1,
    padding: spacing.md,
    minWidth: 160,
  },
  craftStepHead: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.sm,
  },
  craftStepNum: {
    fontFamily: FONT_BODY_SEMIBOLD,
    fontSize: 20,
    fontWeight: "600",
  },
  craftConnector: {
    flex: 1,
    height: 1,
    backgroundColor: "rgba(169,119,46,0.35)",
    marginLeft: spacing.sm,
  },
  craftStepTitle: {
    fontFamily: fonts.semibold,
    fontSize: typography.body + 1,
    marginBottom: spacing.xs,
  },
  craftStepBody: {
    fontSize: typography.caption,
    lineHeight: typography.caption * 1.55,
  },
  ctaWrap: {
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: KANKREG_PALETTE.line,
    overflow: "hidden",
    width: "100%",
    marginTop: spacing.sm,
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
    fontSize: 26,
    fontWeight: "500",
    marginBottom: spacing.xs,
  },
  ctaBody: {
    fontSize: typography.body,
    lineHeight: typography.body * 1.55,
    maxWidth: 480,
  },
  ctaActions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  ctaActionsStack: {
    width: "100%",
  },
});
