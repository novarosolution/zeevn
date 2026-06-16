import React, { useMemo } from "react";
import { Platform, StyleSheet, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { ABOUT_SCREEN_UI } from "../../content/appContent";
import { useTheme } from "../../context/ThemeContext";
import { FONT_HEADING } from "../../theme/typographyRoles";
import { getKankregSurfaces, KANKREG_PALETTE } from "../../theme/kankregWeb";
import { createKankregEyebrowStyle } from "../../theme/kankregScreenStyles";
import { useKankregLayout } from "../../theme/kankregBreakpoints";
import { fonts, icon, layout, radius, spacing, typography } from "../../theme/tokens";
import PremiumButton from "../ui/PremiumButton";
import { KankregSectionHead } from "../kankreg/KankregPageChrome";
import GoldHairline from "../ui/GoldHairline";
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

export function AboutEditorialHero({ navigation, onScrollToCraft }) {
  const { isDark, colors: c } = useTheme();
  const { stackEditorialHero } = useKankregLayout();
  const surfaces = getKankregSurfaces(isDark, c);
  const copy = ABOUT_SCREEN_UI.hero;
  const styles = useMemo(() => createHeroStyles(stackEditorialHero), [stackEditorialHero]);

  return (
    <View style={[styles.shell, stackEditorialHero && styles.shellStack]}>
      <View style={styles.copy}>
        <Text style={createKankregEyebrowStyle(isDark)}>{copy.kicker}</Text>
        <Text style={[styles.title, { color: surfaces.text }]}>{copy.title}</Text>
        <Text style={[styles.lead, { color: surfaces.textSoft }]}>{copy.lead}</Text>
        <View style={styles.ctas}>
          <PremiumButton
            label={copy.ctaPrimary}
            variant="primary"
            onPress={() => navigation.navigate("Shop")}
          />
          <PremiumButton
            label={copy.ctaSecondary}
            variant="ghost"
            onPress={onScrollToCraft}
          />
        </View>
        <View style={[styles.stats, isDark && { borderTopColor: surfaces.borderSubtle }]}>
          {ABOUT_SCREEN_UI.stats.map((stat) => (
            <View key={stat.key} style={styles.statCell}>
              <Text style={[styles.statValue, { color: surfaces.text }]}>{stat.value}</Text>
              <Text style={[styles.statLabel, { color: surfaces.textMuted }]}>{stat.label}</Text>
            </View>
          ))}
        </View>
      </View>
      <View style={styles.visual}>
        <LinearGradient
          colors={isDark ? ["#2a231c", "#1a1612", "#0f0d0b"] : ["#f1e4c6", "#d9c096", "#2c2620"]}
          locations={[0, 0.5, 1]}
          style={StyleSheet.absoluteFillObject}
        />
        <View style={[styles.badge, isDark && styles.badgeDark]}>
          <Ionicons name="location-outline" size={icon.xs} color={KANKREG_PALETTE.goldBright} />
          <Text style={styles.badgeText}>{copy.badge}</Text>
        </View>
        <View style={[styles.quoteCard, isDark && styles.quoteCardDark]}>
          <Text style={[styles.quoteText, { color: isDark ? KANKREG_PALETTE.paper : KANKREG_PALETTE.ink }]}>
            {`"${copy.floatQuote}"`}
          </Text>
        </View>
      </View>
    </View>
  );
}

export function AboutMissionBlock() {
  const { isDark, colors: c, shadowPremium } = useTheme();
  const surfaces = getKankregSurfaces(isDark, c);
  const { isMd } = useKankregLayout();
  const copy = ABOUT_SCREEN_UI.mission;

  return (
    <View
      style={[
        stylesMission.wrap,
        {
          backgroundColor: isDark ? c.surfaceMuted : KANKREG_PALETTE.paper2,
          borderColor: surfaces.borderSubtle,
        },
        shadowStyleForPlatform(shadowPremium),
      ]}
    >
      <KankregSectionHead eyebrow={copy.eyebrow} title={copy.title} />
      <View style={[stylesMission.body, !isMd && stylesMission.bodyStack]}>
        {copy.paragraphs.map((para, idx) => (
          <Text
            key={idx}
            style={[
              stylesMission.para,
              { color: surfaces.textSoft },
              idx > 0 && isMd && stylesMission.paraSecond,
            ]}
          >
            {para}
          </Text>
        ))}
      </View>
    </View>
  );
}

export function AboutPillarsGrid() {
  const { isDark, colors: c } = useTheme();
  const surfaces = getKankregSurfaces(isDark, c);
  const { isMd, isXs } = useKankregLayout();
  const colWidth = isMd ? "48%" : "100%";

  return (
    <View style={stylesPillars.wrap}>
      <Text style={createKankregEyebrowStyle(isDark)}>What we stand for</Text>
      <Text style={[stylesPillars.heading, { color: surfaces.text }]}>Four pillars of Zeevan</Text>
      <GoldHairline marginVertical={spacing.sm} short />
      <View style={[stylesPillars.grid, isXs && stylesPillars.gridStack]}>
        {ABOUT_SCREEN_UI.pillars.map((pillar) => (
          <View
            key={pillar.key}
            style={[
              stylesPillars.card,
              { width: colWidth, backgroundColor: surfaces.card, borderColor: surfaces.border },
              panelShadow,
            ]}
          >
            <View style={[stylesPillars.iconWrap, isDark && stylesPillars.iconWrapDark]}>
              <Ionicons name={pillar.icon} size={icon.md} color={KANKREG_PALETTE.goldBright} />
            </View>
            <Text style={[stylesPillars.cardTitle, { color: surfaces.text }]}>{pillar.title}</Text>
            <Text style={[stylesPillars.cardBody, { color: surfaces.textSoft }]}>{pillar.body}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

export function AboutCraftTimeline({ sectionRef }) {
  const { isDark, colors: c } = useTheme();
  const surfaces = getKankregSurfaces(isDark, c);
  const { isMd } = useKankregLayout();
  const copy = ABOUT_SCREEN_UI.craft;

  return (
    <View ref={sectionRef} nativeID="about-craft" style={stylesCraft.wrap}>
      <KankregSectionHead index={2} eyebrow={copy.eyebrow} title={copy.title} />
      <View style={[stylesCraft.timeline, !isMd && stylesCraft.timelineStack]}>
        {copy.steps.map((step, idx) => (
          <View
            key={step.key}
            style={[
              stylesCraft.step,
              { backgroundColor: surfaces.card, borderColor: surfaces.border },
              panelShadow,
            ]}
          >
            <View style={stylesCraft.stepHead}>
              <Text style={[stylesCraft.stepNum, { color: KANKREG_PALETTE.gold }]}>{step.label}</Text>
              {idx < copy.steps.length - 1 && isMd ? <View style={stylesCraft.connector} /> : null}
            </View>
            <Text style={[stylesCraft.stepTitle, { color: surfaces.text }]}>{step.title}</Text>
            <Text style={[stylesCraft.stepBody, { color: surfaces.textSoft }]}>{step.body}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

export function AboutCtaBand({ navigation }) {
  const { isDark } = useTheme();
  const copy = ABOUT_SCREEN_UI.ctaBand;
  const { stackFooterNewsletter } = useKankregLayout();

  return (
    <LinearGradient
      colors={isDark ? ["#2a231c", "#1f1a15"] : ["#fffdf8", "#f0e6d4"]}
      style={[stylesCta.wrap, isDark && { borderColor: "rgba(52, 211, 153, 0.2)" }]}
    >
      <View style={[stylesCta.inner, stackFooterNewsletter && stylesCta.innerStack]}>
        <View style={stylesCta.copy}>
          <Text style={[stylesCta.title, { color: isDark ? KANKREG_PALETTE.paper : KANKREG_PALETTE.ink }]}>
            {copy.title}
          </Text>
          <Text style={[stylesCta.body, { color: isDark ? "#c8bdaf" : KANKREG_PALETTE.inkSoft }]}>
            {copy.body}
          </Text>
        </View>
        <View style={[stylesCta.actions, stackFooterNewsletter && stylesCta.actionsStack]}>
          <PremiumButton label={copy.cta} variant="gold" onPress={() => navigation.navigate("Shop")} />
          <PremiumButton
            label={copy.ctaSecondary}
            variant="ghost"
            onPress={() => navigation.navigate("Support")}
          />
        </View>
      </View>
    </LinearGradient>
  );
}

function createHeroStyles(stacked) {
  return StyleSheet.create({
    shell: {
      flexDirection: "row",
      alignItems: "stretch",
      gap: spacing.xl,
      marginBottom: spacing.xl,
      width: "100%",
      maxWidth: layout.maxContentWidth,
      alignSelf: "center",
    },
    shellStack: {
      flexDirection: "column",
    },
    copy: {
      flex: 1,
      minWidth: 0,
      justifyContent: "center",
      paddingVertical: spacing.md,
    },
    title: {
      fontFamily: FONT_HEADING,
      fontSize: Platform.OS === "web" ? "clamp(28px, 4vw, 44px)" : 32,
      lineHeight: Platform.OS === "web" ? "clamp(32px, 4.2vw, 48px)" : 38,
      fontWeight: "400",
      letterSpacing: -0.5,
      marginTop: spacing.sm,
      marginBottom: spacing.md,
    },
    lead: {
      fontSize: typography.body + 1,
      lineHeight: 26,
      maxWidth: 520,
      marginBottom: spacing.lg,
    },
    ctas: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: spacing.sm,
      marginBottom: spacing.lg,
    },
    stats: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: spacing.lg,
      paddingTop: spacing.lg,
      borderTopWidth: 1,
      borderTopColor: KANKREG_PALETTE.line,
    },
    statCell: { minWidth: 72 },
    statValue: {
      fontFamily: FONT_HEADING,
      fontSize: 22,
      fontWeight: "500",
    },
    statLabel: {
      fontSize: typography.caption,
      marginTop: 2,
    },
    visual: {
      flex: 1,
      minHeight: stacked ? 280 : 360,
      borderRadius: radius.xl,
      overflow: "hidden",
      position: "relative",
    },
    badge: {
      position: "absolute",
      top: spacing.lg,
      left: spacing.lg,
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      backgroundColor: "rgba(255,253,248,0.92)",
      borderRadius: radius.pill,
      paddingVertical: 6,
      paddingHorizontal: 12,
      borderWidth: 1,
      borderColor: "rgba(169,119,46,0.2)",
    },
    badgeDark: {
      backgroundColor: "rgba(24,21,19,0.88)",
      borderColor: "rgba(232,200,90,0.25)",
    },
    badgeText: {
      fontSize: typography.caption,
      fontFamily: fonts.semibold,
      color: KANKREG_PALETTE.goldDeep,
    },
    quoteCard: {
      position: "absolute",
      bottom: spacing.lg,
      left: spacing.lg,
      right: spacing.lg,
      backgroundColor: "rgba(255,253,248,0.94)",
      borderRadius: radius.lg,
      padding: spacing.md,
      borderWidth: 1,
      borderColor: "rgba(169,119,46,0.18)",
    },
    quoteCardDark: {
      backgroundColor: "rgba(24,21,19,0.9)",
      borderColor: "rgba(232,200,90,0.22)",
    },
    quoteText: {
      fontFamily: FONT_HEADING,
      fontSize: 15,
      fontStyle: "italic",
      lineHeight: 22,
    },
  });
}

const stylesMission = StyleSheet.create({
  wrap: {
    borderRadius: radius.xl,
    borderWidth: 1,
    padding: spacing.lg,
    marginBottom: spacing.xl,
    width: "100%",
    maxWidth: layout.maxContentWidth,
    alignSelf: "center",
  },
  body: {
    flexDirection: "row",
    gap: spacing.xl,
    marginTop: spacing.sm,
  },
  bodyStack: {
    flexDirection: "column",
    gap: spacing.md,
  },
  para: {
    flex: 1,
    fontSize: typography.body,
    lineHeight: typography.body * 1.6,
  },
  paraSecond: {
    marginTop: 0,
  },
});

const stylesPillars = StyleSheet.create({
  wrap: {
    marginBottom: spacing.xl,
    width: "100%",
    maxWidth: layout.maxContentWidth,
    alignSelf: "center",
  },
  heading: {
    fontFamily: FONT_HEADING,
    fontSize: 28,
    fontWeight: "400",
    marginTop: spacing.xs,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.md,
    marginTop: spacing.md,
  },
  gridStack: {
    flexDirection: "column",
  },
  card: {
    borderRadius: radius.lg,
    borderWidth: 1,
    padding: spacing.lg,
    minWidth: 200,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: "rgba(169,119,46,0.12)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.sm,
  },
  iconWrapDark: {
    backgroundColor: "rgba(201,162,39,0.14)",
  },
  cardTitle: {
    fontFamily: fonts.semibold,
    fontSize: typography.body + 1,
    marginBottom: spacing.xs,
  },
  cardBody: {
    fontSize: typography.body,
    lineHeight: typography.body * 1.55,
  },
});

const stylesCraft = StyleSheet.create({
  wrap: {
    marginBottom: spacing.xl,
    width: "100%",
    maxWidth: layout.maxContentWidth,
    alignSelf: "center",
  },
  timeline: {
    flexDirection: "row",
    gap: spacing.md,
    marginTop: spacing.md,
  },
  timelineStack: {
    flexDirection: "column",
  },
  step: {
    flex: 1,
    borderRadius: radius.lg,
    borderWidth: 1,
    padding: spacing.md,
    minWidth: 160,
  },
  stepHead: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.sm,
  },
  stepNum: {
    fontFamily: FONT_HEADING,
    fontSize: 20,
    fontWeight: "600",
  },
  connector: {
    flex: 1,
    height: 1,
    backgroundColor: "rgba(169,119,46,0.35)",
    marginLeft: spacing.sm,
  },
  stepTitle: {
    fontFamily: fonts.semibold,
    fontSize: typography.body + 1,
    marginBottom: spacing.xs,
  },
  stepBody: {
    fontSize: typography.caption,
    lineHeight: typography.caption * 1.55,
  },
});

const stylesCta = StyleSheet.create({
  wrap: {
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: KANKREG_PALETTE.line,
    marginTop: spacing.md,
    marginBottom: spacing.lg,
    width: "100%",
    maxWidth: layout.maxContentWidth,
    alignSelf: "center",
    overflow: "hidden",
  },
  inner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.lg,
    padding: spacing.xl,
  },
  innerStack: {
    flexDirection: "column",
    alignItems: "stretch",
  },
  copy: { flex: 1, minWidth: 200 },
  title: {
    fontFamily: FONT_HEADING,
    fontSize: 26,
    fontWeight: "500",
    marginBottom: spacing.xs,
  },
  body: {
    fontSize: typography.body,
    lineHeight: typography.body * 1.55,
    maxWidth: 480,
  },
  actions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  actionsStack: {
    width: "100%",
  },
});
