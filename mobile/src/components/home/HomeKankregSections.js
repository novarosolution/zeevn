import React, { useEffect, useMemo } from "react";
import { LinearGradient } from "expo-linear-gradient";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { getCategoryGridCellStyle, useKankregLayout } from "../../theme/kankregBreakpoints";
import PremiumButton from "../ui/PremiumButton";
import { SectionHeader } from "./editorial";
import {
  HOME_EYEBROW_LETTER_SPACING,
  HOME_SPACE,
  HOME_TYPE,
} from "../../theme/homeEditorial";
import { ALCHEMY } from "../../theme/customerAlchemy";
import { FONT_HEADING, FONT_PRICE } from "../../theme/typographyRoles";
import { KANKREG_PALETTE } from "../../theme/kankregWeb";
import { createKankregEyebrowStyle } from "../../theme/kankregScreenStyles";
import { fonts, icon, radius, spacing, typography } from "../../theme/tokens";
import { useTheme } from "../../context/ThemeContext";
import { HOME_SCREEN_UI } from "../../content/appContent";
import { CATEGORY_SECTION_UI } from "../../content/categorySectionContent";
import { formatINR } from "../../utils/currency";
import { isWebLean } from "../../theme/webLean";
import { injectWebCssOnce } from "../../utils/injectWebCssOnce";
import { buildHomeCategories } from "../../utils/homeCategories";
import { HomeCatalogViewAllLink } from "./HomeCatalogProductViews";

const MARQUEE_CSS_ID = "kankreg-home-marquee-keyframes";
const MARQUEE_CLASS = "kankreg-home-marquee";

const CAT_CARD_CSS_ID = "kankreg-home-category-card-v6";
const CAT_CARD_CLASS = "kankreg-cat-card-v6";

function useCategorySectionCss() {
  useEffect(() => {
    injectWebCssOnce(
      CAT_CARD_CSS_ID,
      `.${CAT_CARD_CLASS} {
  transition: transform 0.28s cubic-bezier(0.22, 1, 0.36, 1), box-shadow 0.28s ease, border-color 0.28s ease;
  border: 1px solid rgba(92, 104, 52, 0.14);
}
.${CAT_CARD_CLASS}:hover {
  transform: translateY(-4px);
  box-shadow: 0 24px 48px -32px rgba(36, 68, 36, 0.24);
  border-color: rgba(220, 172, 116, 0.5);
}
@media (prefers-reduced-motion: reduce) {
  .${CAT_CARD_CLASS} { transition: none !important; }
  .${CAT_CARD_CLASS}:hover { transform: none; }
}`
    );
  }, []);
}

function CategoryIconCard({ cat, onPress, isDark, compact = false }) {
  const isWeb = Platform.OS === "web";
  const metaLine = cat.tagline || cat.description || CATEGORY_SECTION_UI.browseLabel;
  const accent = cat.accent || KANKREG_PALETTE.green;
  const ink = isDark ? KANKREG_PALETTE.paper : KANKREG_PALETTE.ink;
  const muted = isDark ? "rgba(250, 248, 244, 0.72)" : KANKREG_PALETTE.inkSoft;
  const cardMinH = CATEGORY_SECTION_UI.cardMinHeight || 168;
  const cardMaxH = CATEGORY_SECTION_UI.cardMaxHeight || 192;

  return (
    <Pressable
      onPress={onPress}
      className={isWeb ? CAT_CARD_CLASS : undefined}
      style={({ focused, hovered }) => [
        styles.catCard,
        isDark && styles.catCardDark,
        focused && isWeb ? styles.catCardFocus : null,
        hovered && isWeb ? styles.catCardHover : null,
      ]}
      accessibilityRole="button"
      accessibilityLabel={`${cat.label} — ${metaLine}`}
    >
      <View style={[styles.catCardInner, { minHeight: cardMinH, maxHeight: cardMaxH }]}>
        <LinearGradient
          colors={isDark && cat.gradientDark ? cat.gradientDark : cat.gradient}
          style={StyleSheet.absoluteFillObject}
        />
        {cat.count > 0 ? (
          <View style={[styles.catCountBadge, isDark && styles.catCountBadgeDark]} pointerEvents="none">
            <Text style={[styles.catCountText, isDark && styles.catCountTextDark]}>{cat.count}</Text>
          </View>
        ) : null}
        <View style={styles.catIconHero} pointerEvents="none">
          <View
            style={[
              styles.catIconRing,
              compact && styles.catIconRingCompact,
              {
                borderColor: `${accent}55`,
                backgroundColor: isDark ? "rgba(252, 248, 240, 0.08)" : "rgba(252, 248, 240, 0.82)",
              },
            ]}
          >
            <Ionicons
              name={cat.icon || "grid-outline"}
              size={compact ? icon.lg : icon.xl + 4}
              color={accent}
            />
          </View>
        </View>
        <View style={[styles.catCopy, isDark && styles.catCopyDark]} pointerEvents="none">
          <Text style={[styles.catLabel, { color: ink }]} numberOfLines={1}>
            {cat.label}
          </Text>
          <Text style={[styles.catMeta, { color: muted }]} numberOfLines={compact ? 1 : 2}>
            {metaLine}
          </Text>
          <View style={styles.catCtaRow}>
            <Text style={[styles.catCtaText, { color: accent }]}>
              {cat.cta || CATEGORY_SECTION_UI.shopCta}
            </Text>
            <Ionicons name="arrow-forward" size={icon.xs} color={accent} />
          </View>
        </View>
      </View>
    </Pressable>
  );
}

function useMarqueeKeyframes() {
  useEffect(() => {
    injectWebCssOnce(
      MARQUEE_CSS_ID,
      `@keyframes kankregHomeMarquee { from { transform: translateX(0); } to { transform: translateX(-50%); } }
.${MARQUEE_CLASS} { animation: kankregHomeMarquee 32s linear infinite; }`
    );
  }, []);
}

/** Scrolling ticker like kankreg.html `.marquee` */
export function HomeMarqueeTicker() {
  const { isDark } = useTheme();
  useMarqueeKeyframes();
  const text = HOME_SCREEN_UI.marquee.join("  ✦  ");
  const segment = `${text}  ✦  `;
  const isWeb = Platform.OS === "web";

  return (
    <View style={[styles.marqueeWrap, isDark && styles.marqueeWrapDark]}>
      {isWeb ? (
        <View style={styles.marqueeTrack}>
          <View className={MARQUEE_CLASS} style={styles.marqueeScroller}>
            <Text
              style={[styles.marqueeText, styles.marqueeTextWeb, { color: isDark ? KANKREG_PALETTE.goldBright : KANKREG_PALETTE.green }]}
            >
              {segment}
              {segment}
            </Text>
          </View>
        </View>
      ) : (
        <Text
          style={[styles.marqueeText, { color: isDark ? KANKREG_PALETTE.paper : KANKREG_PALETTE.inkSoft }]}
          numberOfLines={1}
        >
          {segment}
          {segment}
        </Text>
      )}
    </View>
  );
}

/** Category lookbook grid — API categories merged with Zeevan defaults. */
export function HomeCategoryCards({ products = [], onBrowse, onOpenShop, productTypeTitle = "" }) {
  const { isDark } = useTheme();
  const { categoryCols, isMobileWeb } = useKankregLayout();
  const cellStyle = getCategoryGridCellStyle(categoryCols);
  useCategorySectionCss();

  const categories = useMemo(
    () => buildHomeCategories(products, { max: CATEGORY_SECTION_UI.maxCoreTiles }),
    [products]
  );

  const sectionTitle = productTypeTitle || CATEGORY_SECTION_UI.title;
  const sectionKicker = CATEGORY_SECTION_UI.subtitle;

  return (
    <View
      style={[styles.catSection, isDark && styles.catSectionDark]}
      nativeID="home-categories"
      accessibilityRole={Platform.OS === "web" ? "region" : undefined}
      accessibilityLabel={CATEGORY_SECTION_UI.title}
    >
      <View
        style={[
          Platform.OS === "web" && styles.catSectionInner,
          Platform.OS === "web" && isDark && styles.catSectionInnerDark,
        ]}
      >
        <SectionHeader
          eyebrow={CATEGORY_SECTION_UI.eyebrow}
          title={sectionTitle}
          kicker={sectionKicker}
          hairline
          right={
            <HomeCatalogViewAllLink
              label={CATEGORY_SECTION_UI.viewAllLabel}
              onPress={() => onOpenShop?.()}
            />
          }
        />
        <View style={styles.catGrid}>
          {categories.map((cat) => (
            <View key={cat.key} style={cellStyle}>
              <CategoryIconCard
                cat={cat}
                compact={isMobileWeb}
                isDark={isDark}
                onPress={() => onBrowse?.(cat.label)}
              />
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}

/** Featured editorial block like `.feature` */
export function HomeFeaturedEditorial({ product, navigation }) {
  const { isDark } = useTheme();
  const { useAuthSplit } = useKankregLayout();
  const image = product?.image || product?.images?.[0];
  const title = String(product?.name || "").trim();
  const body = String(product?.description || "").trim();
  if (!title) return null;

  return (
    <View
      style={[
        styles.feature,
        isDark && styles.featureDark,
        !useAuthSplit && styles.featureStack,
      ]}
    >
      <View style={styles.featureArt}>
        <LinearGradient
          colors={["#f0e3c5", "#cdb079", "#2c2620"]}
          locations={[0, 0.55, 1]}
          start={{ x: 0.7, y: 0.1 }}
          end={{ x: 0.3, y: 1 }}
          style={StyleSheet.absoluteFillObject}
        />
        {image ? <Image source={{ uri: image }} style={styles.featureImage} contentFit="contain" /> : null}
      </View>
      <View style={[styles.featureCopy, isDark && { backgroundColor: "#181513" }]}>
        <Text style={[styles.featureTitle, { color: isDark ? KANKREG_PALETTE.paper : KANKREG_PALETTE.ink }]}>
          {title}
        </Text>
        {body ? (
          <Text style={[styles.featureBody, { color: isDark ? "#c8bdaf" : KANKREG_PALETTE.inkSoft }]} numberOfLines={4}>
            {body}
          </Text>
        ) : null}
        <View style={styles.featureCtas}>
          <PremiumButton
            label={formatINR(product?.price)}
            variant="primary"
            size="md"
            onPress={() => product?.id && navigation.navigate("Product", { productId: product.id })}
          />
        </View>
      </View>
    </View>
  );
}

/** Web editorial hero (copy + visual) — complements marketing slider on large screens */
export function HomeEditorialHero({ navigation, featuredProduct, heroTitle, heroSubtitle }) {
  const { isDark } = useTheme();
  const { showEditorialHero, stackEditorialHero } = useKankregLayout();
  if (!showEditorialHero) return null;

  const image = featuredProduct?.image || featuredProduct?.images?.[0];
  const title = heroTitle || HOME_SCREEN_UI.hero.titleFallback;
  const subtitle = heroSubtitle || HOME_SCREEN_UI.hero.subtitleFallback;

  return (
    <View style={[styles.editorialHero, stackEditorialHero && styles.editorialHeroStack]}>
      <View style={styles.editorialCopy}>
        {!isWebLean() ? (
          <Text style={createKankregEyebrowStyle(isDark)}>{HOME_SCREEN_UI.editorial.overline}</Text>
        ) : null}
        <Text style={[styles.editorialH1, { color: isDark ? KANKREG_PALETTE.paper : KANKREG_PALETTE.ink }]}>
          {title}
        </Text>
        {subtitle ? (
          <Text style={[styles.editorialLead, { color: isDark ? "#c8bdaf" : KANKREG_PALETTE.inkSoft }]}>
            {subtitle}
          </Text>
        ) : null}
        <View style={styles.editorialCtas}>
          <PremiumButton
            label={HOME_SCREEN_UI.editorial.ctaExplore}
            variant="primary"
            onPress={() => {
              if (typeof globalThis?.document !== "undefined") {
                const el = globalThis.document.getElementById("home-catalog");
                el?.scrollIntoView?.({ behavior: "smooth", block: "start" });
              } else {
                navigation.navigate("Shop");
              }
            }}
          />
          <PremiumButton
            label={HOME_SCREEN_UI.editorial.ctaRewards}
            variant="ghost"
            onPress={() => navigation.navigate("RedeemRewards")}
          />
        </View>
        {!isWebLean() && HOME_SCREEN_UI.web?.heroStats?.length ? (
          <View
            style={[
              styles.editorialStats,
              isDark && { borderTopColor: "rgba(52, 211, 153, 0.18)" },
            ]}
          >
            {HOME_SCREEN_UI.web.heroStats.map((stat) => (
              <View key={stat.key} style={styles.statCell}>
                <Text style={[styles.statN, { color: isDark ? KANKREG_PALETTE.paper : KANKREG_PALETTE.ink }]}>
                  {stat.value}
                </Text>
                <Text style={[styles.statL, { color: isDark ? "rgba(245,239,228,0.65)" : KANKREG_PALETTE.inkFaint }]}>
                  {stat.label}
                </Text>
              </View>
            ))}
          </View>
        ) : null}
      </View>
      <View style={styles.editorialVisual}>
        <LinearGradient
          colors={["#f1e4c6", "#d9c096", "#2c2620"]}
          locations={[0, 0.48, 1]}
          style={StyleSheet.absoluteFillObject}
        />
        {image ? <Image source={{ uri: image }} style={styles.editorialPhoto} contentFit="cover" /> : null}
        <View
          style={[
            styles.floatA,
            isDark && {
              backgroundColor: "rgba(24, 21, 19, 0.92)",
              borderColor: "rgba(52, 211, 153, 0.22)",
            },
          ]}
        >
          {featuredProduct?.name ? (
            <Text style={[styles.floatTitle, { color: isDark ? KANKREG_PALETTE.paper : KANKREG_PALETTE.ink }]}>
              {featuredProduct.name}
            </Text>
          ) : null}
        </View>
        <View
          style={[
            styles.floatB,
            isDark && {
              backgroundColor: "rgba(24, 21, 19, 0.92)",
              borderColor: "rgba(52, 211, 153, 0.22)",
            },
          ]}
        >
          <View style={styles.swatch} />
          <View>
            <Text style={[styles.floatFrom, { color: isDark ? "rgba(245,239,228,0.65)" : KANKREG_PALETTE.inkFaint }]}>
              {HOME_SCREEN_UI.hero.fromLabel}
            </Text>
            <Text style={[styles.floatPrice, { color: isDark ? KANKREG_PALETTE.paper : KANKREG_PALETTE.ink }]}>
              {featuredProduct?.price != null ? formatINR(featuredProduct.price) : HOME_SCREEN_UI.editorial.shopNowLabel}
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  marqueeWrap: {
    marginTop: spacing.lg,
    paddingVertical: spacing.sm + 4,
    backgroundColor: "rgba(15, 46, 36, 0.04)",
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: "rgba(31, 92, 71, 0.12)",
    overflow: "hidden",
    borderRadius: 12,
  },
  marqueeWrapDark: {
    backgroundColor: "rgba(42, 117, 89, 0.06)",
    borderColor: "rgba(42, 117, 89, 0.14)",
  },
  marqueeTrack: {
    width: "100%",
    overflow: "hidden",
  },
  marqueeScroller: {
    flexDirection: "row",
    width: "max-content",
  },
  marqueeText: {
    fontFamily: fonts.medium,
    fontSize: typography.caption,
    letterSpacing: 0.8,
  },
  marqueeTextWeb: {
    flexShrink: 0,
    paddingRight: spacing.xl,
  },
  catSection: {
    width: "100%",
    paddingTop: HOME_SPACE.lg,
    paddingBottom: HOME_SPACE.xl,
    paddingHorizontal: 0,
  },
  catSectionDark: {},
  catSectionInner: {
    position: "relative",
    zIndex: 1,
    paddingHorizontal: HOME_SPACE.lg,
    paddingTop: HOME_SPACE.lg,
    paddingBottom: HOME_SPACE.lg + 4,
    borderRadius: 24,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(92, 104, 52, 0.1)",
    backgroundColor: KANKREG_PALETTE.card,
    ...Platform.select({
      web: {
        boxShadow: "0 1px 0 rgba(252, 248, 240, 0.8) inset",
      },
      default: {},
    }),
  },
  catSectionInnerDark: {
    backgroundColor: "rgba(30, 36, 24, 0.55)",
    borderColor: "rgba(168, 184, 108, 0.12)",
  },
  catGrid: {
    width: "100%",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: HOME_SPACE.md,
  },
  catCard: {
    width: "100%",
    borderRadius: radius.lg + 2,
    overflow: "hidden",
    backgroundColor: KANKREG_PALETTE.card,
    ...Platform.select({
      web: {
        cursor: "pointer",
        boxShadow: "0 8px 28px -20px rgba(36, 68, 36, 0.18)",
      },
      default: {},
    }),
  },
  catCardDark: {
    ...Platform.select({
      web: { boxShadow: "0 12px 32px -20px rgba(0, 0, 0, 0.38)" },
      default: {},
    }),
  },
  catCardHover: {
    ...Platform.select({
      web: {},
      default: {},
    }),
  },
  catCardInner: {
    width: "100%",
    position: "relative",
    overflow: "hidden",
    flexDirection: "column",
    justifyContent: "flex-end",
  },
  catCountBadge: {
    position: "absolute",
    top: HOME_SPACE.sm,
    right: HOME_SPACE.sm,
    zIndex: 3,
    minWidth: 26,
    height: 26,
    paddingHorizontal: 7,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(252, 248, 240, 0.92)",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(92, 104, 52, 0.18)",
  },
  catCountBadgeDark: {
    backgroundColor: "rgba(30, 36, 24, 0.72)",
    borderColor: "rgba(168, 184, 108, 0.2)",
  },
  catCountText: {
    fontFamily: FONT_PRICE,
    fontSize: HOME_TYPE.eyebrow,
    color: KANKREG_PALETTE.greenDeep,
  },
  catCountTextDark: {
    color: KANKREG_PALETTE.goldBright,
  },
  catIconHero: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: "center",
    justifyContent: "center",
    paddingBottom: HOME_SPACE.xl + 8,
  },
  catIconRing: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    ...Platform.select({
      web: { backdropFilter: "blur(6px)" },
      default: {},
    }),
  },
  catIconRingCompact: {
    width: 52,
    height: 52,
    borderRadius: 26,
  },
  catCopy: {
    paddingHorizontal: HOME_SPACE.sm + 2,
    paddingTop: HOME_SPACE.sm,
    paddingBottom: HOME_SPACE.sm + 2,
    gap: 2,
    backgroundColor: "rgba(252, 248, 240, 0.92)",
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "rgba(92, 104, 52, 0.1)",
  },
  catCopyDark: {
    backgroundColor: "rgba(18, 24, 16, 0.72)",
    borderTopColor: "rgba(168, 184, 108, 0.12)",
  },
  catLabel: {
    fontFamily: FONT_HEADING,
    fontSize: HOME_TYPE.kicker,
    lineHeight: 20,
    letterSpacing: -0.15,
  },
  catMeta: {
    fontFamily: fonts.regular,
    fontSize: HOME_TYPE.eyebrow + 1,
    lineHeight: 16,
  },
  catCtaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 4,
  },
  catCtaText: {
    fontFamily: fonts.semibold,
    fontSize: HOME_TYPE.eyebrow,
    letterSpacing: 0.2,
  },
  catCardFocus: {
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
  feature: {
    flexDirection: "row",
    flexWrap: "wrap",
    borderRadius: 26,
    overflow: "hidden",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: KANKREG_PALETTE.line,
    marginVertical: spacing.xl,
    ...Platform.select({
      web: { boxShadow: "0 1px 2px rgba(25,20,15,.04), 0 14px 38px -20px rgba(25,20,15,.28)" },
      default: {},
    }),
  },
  featureStack: {
    flexDirection: "column",
  },
  featureDark: {
    borderColor: "#3f3933",
  },
  featureArt: {
    flex: 1,
    minHeight: 280,
    position: "relative",
  },
  featureImage: {
    width: "72%",
    height: "72%",
    alignSelf: "center",
    marginTop: "14%",
  },
  featureCopy: {
    flex: 1,
    padding: spacing.xl + 8,
    justifyContent: "center",
    backgroundColor: KANKREG_PALETTE.card,
    gap: spacing.sm,
  },
  featureEyebrow: {
    fontFamily: fonts.semibold,
    fontSize: typography.overline,
    letterSpacing: 2,
    textTransform: "uppercase",
  },
  featureTitle: {
    fontFamily: FONT_HEADING,
    fontSize: typography.h2 + 4,
    letterSpacing: -0.5,
    lineHeight: typography.h2 + 8,
  },
  featureBody: {
    fontSize: typography.bodySmall + 1,
    lineHeight: 22,
    maxWidth: 420,
  },
  featureCtas: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  editorialHero: {
    flexDirection: "row",
    gap: spacing.xl + 8,
    alignItems: "center",
    marginBottom: spacing.lg,
    paddingVertical: spacing.xl,
    flexWrap: "wrap",
  },
  editorialHeroStack: {
    flexDirection: "column",
  },
  editorialCopy: {
    flex: 1.04,
    minWidth: 0,
  },
  editorialH1: {
    fontFamily: FONT_HEADING,
    fontSize: Platform.OS === "web" ? 52 : 36,
    lineHeight: Platform.OS === "web" ? 50 : 40,
    letterSpacing: -1.2,
    marginTop: spacing.md,
  },
  editorialEm: {
    fontStyle: "italic",
    color: KANKREG_PALETTE.gold,
  },
  editorialLead: {
    marginTop: spacing.lg,
    fontSize: typography.body + 1,
    lineHeight: 26,
    maxWidth: 420,
  },
  editorialCtas: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    marginTop: spacing.xl,
  },
  editorialStats: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.xl,
    marginTop: spacing.xl + 4,
    paddingTop: spacing.lg,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: KANKREG_PALETTE.line,
  },
  statCell: {
    minWidth: 88,
  },
  statN: {
    fontFamily: FONT_PRICE,
    fontSize: 28,
    letterSpacing: -0.4,
  },
  statL: {
    fontSize: 11.5,
    color: KANKREG_PALETTE.inkFaint,
    letterSpacing: 0.6,
    textTransform: "uppercase",
    marginTop: 2,
    fontFamily: fonts.semibold,
  },
  editorialVisual: {
    flex: 0.96,
    aspectRatio: 5 / 6,
    borderRadius: 26,
    overflow: "hidden",
    position: "relative",
    ...Platform.select({
      web: { boxShadow: "0 50px 90px -40px rgba(25,20,15,.40)" },
      default: {},
    }),
  },
  editorialPhoto: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.92,
  },
  floatA: {
    position: "absolute",
    top: 22,
    left: 22,
    backgroundColor: "rgba(255,253,248,0.94)",
    borderRadius: 15,
    padding: spacing.sm + 2,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.6)",
  },
  floatEyebrow: {
    fontSize: typography.overline,
    color: KANKREG_PALETTE.gold,
    fontFamily: fonts.semibold,
    letterSpacing: 2,
    textTransform: "uppercase",
  },
  floatTitle: {
    fontFamily: FONT_HEADING,
    fontSize: 18,
    color: KANKREG_PALETTE.ink,
    marginTop: 2,
  },
  floatB: {
    position: "absolute",
    bottom: 22,
    right: 22,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    backgroundColor: "rgba(255,253,248,0.94)",
    borderRadius: 15,
    padding: spacing.sm + 2,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.6)",
  },
  swatch: {
    width: 40,
    height: 40,
    borderRadius: 11,
    backgroundColor: KANKREG_PALETTE.goldBright,
  },
  floatFrom: {
    fontSize: 11,
    color: KANKREG_PALETTE.inkFaint,
  },
  floatPrice: {
    fontFamily: FONT_PRICE,
    fontSize: 19,
    color: KANKREG_PALETTE.ink,
  },
});
