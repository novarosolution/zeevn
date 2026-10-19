import React from "react";
import { Image, Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { HOME_PROMISE_SECTION } from "../../content/homePromiseContent";
import { HOME_SCREEN_UI } from "../../content/appContent";
import { useKankregLayout } from "../../theme/kankregBreakpoints";
import { WP } from "../../theme/webPremium";
import { FONT_HEADING } from "../../theme/typographyRoles";
import { fonts } from "../../theme/tokens";
import SectionReveal from "../motion/SectionReveal";
import { WebEyebrow } from "./webPremiumParts";

/** Dark editorial promise band — photo, a short brand line and one gold call to action. */
export default function WebHomePromiseBand() {
  const navigation = useNavigation();
  const { isMobileWeb, pageGutterClamp } = useKankregLayout();
  if (HOME_SCREEN_UI.web?.showPromiseBand === false) return null;

  const copy = HOME_PROMISE_SECTION;

  return (
    <SectionReveal preset="fade-up" style={styles.reveal}>
      <View
        style={[styles.shell, isMobileWeb && styles.shellMobile]}
        accessibilityRole="region"
        accessibilityLabel={copy.title}
      >
        <Image source={copy.image} style={styles.bg} resizeMode="cover" accessibilityIgnoresInvertColors />
        <View style={styles.scrim} pointerEvents="none" />
        <View style={[styles.inner, { paddingHorizontal: pageGutterClamp }]}>
          <View style={styles.copy}>
            <WebEyebrow onDark>{copy.eyebrow}</WebEyebrow>
            <Text style={[styles.title, isMobileWeb && styles.titleMobile]}>{copy.title}</Text>
            <Text style={[styles.body, isMobileWeb && styles.bodyMobile]}>{copy.body}</Text>
            <Pressable
              onPress={() => navigation.navigate("Shop")}
              className="zv-btn"
              style={[styles.cta, isMobileWeb && styles.ctaMobile]}
              accessibilityRole="button"
              accessibilityLabel={copy.cta}
            >
              <Text style={styles.ctaText}>{copy.cta}</Text>
              <Ionicons name="arrow-forward" size={16} color={WP.gold.ink} />
            </Pressable>
          </View>
        </View>
      </View>
    </SectionReveal>
  );
}

const styles = StyleSheet.create({
  reveal: { width: "100%" },
  shell: {
    position: "relative",
    overflow: "hidden",
    minHeight: 380,
    backgroundColor: "#141910",
    alignSelf: "center",
    justifyContent: "center",
    ...Platform.select({
      web: {
        width: "100vw",
        maxWidth: "100vw",
        marginLeft: "calc(50% - 50vw)",
        marginRight: "calc(50% - 50vw)",
      },
      default: { width: "100%" },
    }),
  },
  shellMobile: { minHeight: 280 },
  bg: {
    ...StyleSheet.absoluteFillObject,
    width: "100%",
    height: "100%",
  },
  scrim: {
    ...StyleSheet.absoluteFillObject,
    ...Platform.select({
      web: {
        backgroundImage:
          "linear-gradient(100deg, rgba(10,14,8,0.86) 0%, rgba(10,14,8,0.62) 48%, rgba(10,14,8,0.5) 100%)",
      },
      default: { backgroundColor: "rgba(10,14,8,0.7)" },
    }),
  },
  inner: {
    position: "relative",
    zIndex: 1,
    width: "100%",
    maxWidth: 1280,
    alignSelf: "center",
    paddingVertical: 72,
  },
  copy: { maxWidth: 640, alignItems: "flex-start", gap: 20 },
  title: {
    fontFamily: FONT_HEADING,
    fontSize: 50,
    lineHeight: 54,
    letterSpacing: -1,
    color: WP.cream,
  },
  titleMobile: { fontSize: 30, lineHeight: 34 },
  body: {
    fontFamily: fonts.regular,
    fontSize: 17.5,
    lineHeight: 28,
    color: "rgba(250,248,244,0.88)",
    maxWidth: 520,
  },
  bodyMobile: { fontSize: 15, lineHeight: 23 },
  cta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: 6,
    paddingVertical: 15,
    paddingHorizontal: 28,
    borderRadius: WP.radius.pill,
    ...Platform.select({
      web: { backgroundImage: WP.gradient.gold, boxShadow: WP.shadow.gold },
      default: { backgroundColor: WP.gold.base },
    }),
  },
  ctaMobile: { paddingVertical: 12, paddingHorizontal: 22 },
  ctaText: { fontFamily: fonts.bold, fontSize: 14.5, letterSpacing: 0.3, color: WP.gold.ink },
});
