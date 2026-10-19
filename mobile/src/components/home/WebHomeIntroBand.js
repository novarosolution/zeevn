import React from "react";
import { Image, Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { HOME_SCREEN_UI } from "../../content/appContent";
import { WEB_HOME_PREMIUM } from "../../content/webHomeContent";
import { ZEEVAN_PRODUCT_LINES } from "../../content/zeevanCatalogContent";
import { useKankregLayout } from "../../theme/kankregBreakpoints";
import { WP } from "../../theme/webPremium";
import { FONT_HEADING } from "../../theme/typographyRoles";
import { fonts } from "../../theme/tokens";
import { useTheme } from "../../context/ThemeContext";
import { getHomeLineImage } from "../../content/homeLineImages";
import SectionReveal from "../motion/SectionReveal";
import { WebPillLink, WebSectionHead } from "./webPremiumParts";

const PANTRY_BG = require("../../../assets/home-pantry-strip-bg.jpg");

/**
 * Desktop intro: a welcome headline and four photographic "shop by line" tiles (ghee, tel, masala, honey).
 * Phone web uses the round category icons instead, so this band is desktop-first (two-up if it is ever shown narrow).
 */
export default function WebHomeIntroBand({ navigation }) {
  const { isDark } = useTheme();
  const { pageGutterClamp, isMobileWeb } = useKankregLayout();
  const copy = HOME_SCREEN_UI.webIntro;
  if (HOME_SCREEN_UI.web?.showIntroBand === false) return null;

  const openLine = (line) =>
    navigation.navigate("Shop", { category: line.label, pill: line.shopPill || line.label });

  return (
    <View style={[styles.shell, isDark && styles.shellDark]}>
      {!isDark ? (
        <Image source={PANTRY_BG} style={styles.bg} resizeMode="cover" accessibilityIgnoresInvertColors />
      ) : null}
      <View style={[styles.scrim, isDark && styles.scrimDark]} pointerEvents="none" />
      <SectionReveal immediate preset="fade-up" delay={80} style={styles.revealWrap}>
        <View style={[styles.inner, { paddingHorizontal: pageGutterClamp }]}>
          <WebSectionHead
            eyebrow={copy?.title || WEB_HOME_PREMIUM.lines.eyebrow}
            title={copy?.subtitle || "Your one-stop store for purity."}
            action={
              !isMobileWeb ? (
                <WebPillLink label={copy?.cta || "Shop all"} onPress={() => navigation.navigate("Shop")} />
              ) : null
            }
          />

          <View
            style={[styles.grid, isMobileWeb && styles.gridMobile]}
            accessibilityRole="navigation"
            accessibilityLabel="Product lines"
          >
            {ZEEVAN_PRODUCT_LINES.map((line) => {
              const thumb = getHomeLineImage(line.key);
              return (
                <Pressable
                  key={line.key}
                  onPress={() => openLine(line)}
                  className="zv-tile"
                  style={[styles.tile, isMobileWeb && styles.tileMobile]}
                  accessibilityRole="link"
                  accessibilityLabel={`Shop ${line.label}`}
                >
                  {thumb ? (
                    <Image source={thumb} className="zv-tile-img" style={styles.tileImg} resizeMode="cover" />
                  ) : (
                    <View style={[StyleSheet.absoluteFill, { backgroundColor: WP.green.deep }]} />
                  )}
                  <View style={styles.tileShade} pointerEvents="none" />
                  <View style={styles.tileBody}>
                    <View style={styles.tileCopy}>
                      <Text style={styles.tileEyebrow} numberOfLines={1}>
                        {String(line.description || WEB_HOME_PREMIUM.lines.tileCta).toUpperCase()}
                      </Text>
                      <Text style={styles.tileName} numberOfLines={2}>
                        {line.label}
                      </Text>
                    </View>
                    <View className="zv-tile-arrow" style={styles.tileArrow}>
                      <Ionicons name="arrow-forward" size={18} color={WP.gold.ink} />
                    </View>
                  </View>
                </Pressable>
              );
            })}
          </View>
        </View>
      </SectionReveal>
    </View>
  );
}

const styles = StyleSheet.create({
  shell: {
    width: "100%",
    position: "relative",
    overflow: "hidden",
    paddingTop: 76,
    paddingBottom: 80,
    backgroundColor: WP.paper,
  },
  shellDark: { backgroundColor: "#141210" },
  bg: { ...StyleSheet.absoluteFillObject, width: "100%", height: "100%" },
  scrim: {
    ...StyleSheet.absoluteFillObject,
    ...Platform.select({
      web: {
        backgroundImage:
          "linear-gradient(180deg, rgba(250,246,237,0.9) 0%, rgba(247,241,230,0.94) 100%)",
      },
      default: { backgroundColor: "rgba(250,246,237,0.92)" },
    }),
  },
  scrimDark: {
    backgroundColor: "rgba(18,16,12,0.92)",
    ...Platform.select({ web: { backgroundImage: "none" }, default: {} }),
  },
  revealWrap: { width: "100%", position: "relative", zIndex: 1 },
  inner: {
    width: "100%",
    maxWidth: 1280,
    alignSelf: "center",
    gap: 40,
  },
  grid: {
    flexDirection: "row",
    gap: 20,
    width: "100%",
  },
  gridMobile: { flexWrap: "wrap", gap: 12 },
  tile: {
    flex: 1,
    minWidth: 0,
    aspectRatio: 0.9,
    borderRadius: WP.radius.tile,
    overflow: "hidden",
    backgroundColor: WP.green.deep,
    ...Platform.select({ web: { boxShadow: WP.shadow.card, cursor: "pointer" }, default: {} }),
  },
  tileMobile: { flexBasis: "47%", flexGrow: 1, aspectRatio: 1 },
  tileImg: { ...StyleSheet.absoluteFillObject, width: "100%", height: "100%" },
  tileShade: {
    ...StyleSheet.absoluteFillObject,
    ...Platform.select({
      web: {
        backgroundImage:
          "linear-gradient(0deg, rgba(16,24,12,0.82) 0%, rgba(16,24,12,0.34) 38%, rgba(16,24,12,0) 66%)",
      },
      default: { backgroundColor: "rgba(16,24,12,0.3)" },
    }),
  },
  tileBody: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 12,
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  tileCopy: { flex: 1, minWidth: 0, gap: 6 },
  tileEyebrow: {
    fontFamily: fonts.bold,
    fontSize: 11,
    letterSpacing: 2.2,
    color: WP.gold.bright,
  },
  tileName: {
    fontFamily: FONT_HEADING,
    fontSize: 28,
    lineHeight: 32,
    letterSpacing: -0.5,
    color: WP.cream,
  },
  tileArrow: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    ...Platform.select({
      web: { backgroundImage: WP.gradient.gold },
      default: { backgroundColor: WP.gold.base },
    }),
  },
});
