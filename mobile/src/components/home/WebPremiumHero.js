import React, { useMemo } from "react";
import { Platform, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import GoldHairline from "../ui/GoldHairline";
import { HOME_SCREEN_UI, HOME_TRUST_STRIP } from "../../content/appContent";
import { resolveWebHomeHeroSlides } from "../../utils/homeHeroSlides";
import {
  GOLD_HAIRLINE_EDITORIAL,
  HOME_EYEBROW_LETTER_SPACING,
  HOME_SPACE,
  HOME_TYPE,
  homeEditorialMuted,
} from "../../theme/homeEditorial";
import { useKankregLayout } from "../../theme/kankregBreakpoints";
import { KANKREG_CHROME, KANKREG_PALETTE } from "../../theme/kankregWeb";
import { useTheme } from "../../context/ThemeContext";
import { fonts, icon } from "../../theme/tokens";
import HeroMediaSlider from "./HeroMediaSlider";

function TrustRibbonItem({ item, muted, compact = false }) {
  return (
    <View style={[styles.trustItem, compact && styles.trustItemCompact]}>
      <Ionicons
        name={item.icon}
        size={compact ? 13 : icon.micro}
        color={muted}
        style={styles.trustIcon}
      />
      <Text
        style={[styles.trustText, compact && styles.trustTextCompact, { color: muted }]}
        numberOfLines={compact ? 2 : 1}
      >
        {compact ? item.label : item.label.toUpperCase()}
      </Text>
    </View>
  );
}

function TrustRibbonDivider({ isDark }) {
  return (
    <View
      style={[
        styles.trustDivider,
        { backgroundColor: isDark ? "rgba(245, 239, 228, 0.14)" : KANKREG_PALETTE.line },
      ]}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    />
  );
}

/** Full-width premium top slider + trust ribbon (web home). */
export default function WebPremiumHero({ navigation, heroSlides = [], products = [] }) {
  const { isDark } = useTheme();
  const { pageGutterClamp, isXs, isMobileWeb } = useKankregLayout();
  const muted = homeEditorialMuted(isDark);
  const showDividers = !isXs;

  const activeSlides = useMemo(
    () =>
      resolveWebHomeHeroSlides({
        heroSlides,
        products,
        isMobileWeb,
      }),
    [heroSlides, products, isMobileWeb]
  );

  if (Platform.OS !== "web" || !activeSlides.length) return null;

  const openShop = () => navigation.navigate("Shop");
  const showTrust = HOME_SCREEN_UI.web?.showHeroTrustChips !== false;
  const heroEyebrow = HOME_SCREEN_UI.web?.heroEyebrow || "A2 ghee";

  /** Desktop: break out of centered 1280px scroll column. Phone web: scroll has no side gutter. */
  const fullBleedStyle =
    Platform.OS === "web"
      ? isMobileWeb
        ? {
            width: "100%",
            alignSelf: "stretch",
            maxWidth: "100%",
          }
        : {
            width: "100vw",
            maxWidth: "100vw",
            marginLeft: "calc(50% - 50vw)",
            marginRight: "calc(50% - 50vw)",
            alignSelf: "center",
          }
      : null;

  return (
    <View style={[styles.fullBleed, fullBleedStyle]}>
      <HeroMediaSlider
        variant="top"
        slides={activeSlides}
        onPress={openShop}
        editorialEyebrow={heroEyebrow}
      />

      {showTrust ? (
        <View style={[styles.trustBand, isDark && styles.trustBandDark]}>
          <View style={[styles.trustBandInner, { paddingHorizontal: pageGutterClamp }]}>
            <GoldHairline {...GOLD_HAIRLINE_EDITORIAL.subtle} marginVertical={0} style={styles.trustHairline} />
            <View style={[styles.trustRibbon, isMobileWeb && styles.trustRibbonMobile]}>
              {HOME_TRUST_STRIP.map((item, index) => (
                <React.Fragment key={item.key}>
                  {showDividers && index > 0 && !isMobileWeb ? <TrustRibbonDivider isDark={isDark} /> : null}
                  <TrustRibbonItem item={item} muted={muted} compact={isMobileWeb} />
                </React.Fragment>
              ))}
            </View>
            <GoldHairline {...GOLD_HAIRLINE_EDITORIAL.subtle} marginVertical={0} style={styles.trustHairline} />
          </View>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  fullBleed: {
    width: "100%",
    alignSelf: "stretch",
    marginBottom: 0,
    marginTop: 0,
  },
  trustBand: {
    width: "100%",
    alignItems: "center",
    backgroundColor: KANKREG_CHROME.cream,
  },
  trustBandDark: {
    backgroundColor: "rgba(24, 21, 19, 0.28)",
  },
  trustBandInner: {
    width: "100%",
    maxWidth: 1280,
    alignSelf: "center",
    paddingVertical: HOME_SPACE.sm,
    gap: HOME_SPACE.xs,
  },
  trustHairline: {
    marginVertical: 0,
    width: "100%",
  },
  trustRibbon: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    justifyContent: "center",
    columnGap: HOME_SPACE.md,
    rowGap: HOME_SPACE.sm,
    paddingVertical: HOME_SPACE.xs,
  },
  trustRibbonMobile: {
    flexWrap: "nowrap",
    justifyContent: "space-between",
    columnGap: 4,
    paddingVertical: 4,
  },
  trustItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingHorizontal: HOME_SPACE.xs,
    minWidth: 0,
  },
  trustItemCompact: {
    flex: 1,
    flexDirection: "column",
    paddingHorizontal: 1,
    gap: 3,
  },
  trustIcon: {
    opacity: 0.88,
  },
  trustText: {
    fontFamily: fonts.semibold,
    fontSize: HOME_TYPE.eyebrow,
    lineHeight: HOME_TYPE.eyebrow + 4,
    letterSpacing: HOME_EYEBROW_LETTER_SPACING,
    textAlign: "center",
  },
  trustTextCompact: {
    fontSize: 9.5,
    lineHeight: 12,
    letterSpacing: 0.2,
    textTransform: "none",
  },
  trustDivider: {
    width: StyleSheet.hairlineWidth,
    height: 14,
    alignSelf: "center",
    opacity: 0.85,
    ...Platform.select({
      web: { minHeight: 14 },
      default: {},
    }),
  },
});
