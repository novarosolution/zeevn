import React from "react";
import { Image, Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { HOME_PROMISE_SECTION } from "../../content/homePromiseContent";
import { HOME_SCREEN_UI } from "../../content/appContent";
import { useKankregLayout } from "../../theme/kankregBreakpoints";
import { ZEEVAN_GOLD } from "../../theme/kankregWeb";
import { FONT_HEADING } from "../../theme/typographyRoles";
import { fonts, spacing } from "../../theme/tokens";
import SectionReveal from "../motion/SectionReveal";

/** Dark editorial promise strip — photo + short brand line + CTA. */
export default function WebHomePromiseBand() {
  if (HOME_SCREEN_UI.web?.showPromiseBand === false) return null;

  const navigation = useNavigation();
  const { isMobileWeb, pageGutterClamp } = useKankregLayout();
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
          <Text style={styles.eyebrow}>{copy.eyebrow}</Text>
          <Text style={[styles.title, isMobileWeb && styles.titleMobile]}>{copy.title}</Text>
          <Text style={[styles.body, isMobileWeb && styles.bodyMobile]}>{copy.body}</Text>
          <Pressable
            onPress={() => navigation.navigate("Shop")}
            style={({ hovered, pressed }) => [
              styles.cta,
              hovered && styles.ctaHover,
              pressed && { opacity: 0.92 },
              isMobileWeb && styles.ctaCenter,
            ]}
            accessibilityRole="button"
            accessibilityLabel={copy.cta}
          >
            <Text style={styles.ctaText}>{copy.cta}</Text>
          </Pressable>
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
    minHeight: 280,
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
  shellMobile: { minHeight: 200 },
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
          "linear-gradient(105deg, rgba(12,16,10,0.72) 0%, rgba(12,16,10,0.55) 55%, rgba(12,16,10,0.65) 100%)",
      },
      default: { backgroundColor: "rgba(12,16,10,0.65)" },
    }),
  },
  inner: {
    position: "relative",
    zIndex: 1,
    width: "100%",
    maxWidth: 720,
    alignSelf: "center",
    alignItems: "flex-start",
    gap: 10,
    paddingVertical: spacing.xl,
  },
  eyebrow: {
    fontFamily: fonts.semibold,
    fontSize: 11,
    letterSpacing: 2,
    textTransform: "uppercase",
    color: ZEEVAN_GOLD.bright,
  },
  title: {
    fontFamily: FONT_HEADING,
    fontSize: 34,
    lineHeight: 40,
    letterSpacing: -0.4,
    color: "#FAF8F4",
  },
  titleMobile: { fontSize: 22, lineHeight: 28 },
  body: {
    fontFamily: fonts.regular,
    fontSize: 15,
    lineHeight: 23,
    color: "rgba(250,248,244,0.86)",
    maxWidth: 520,
  },
  bodyMobile: { fontSize: 13, lineHeight: 19, maxWidth: 360 },
  cta: {
    marginTop: 8,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    backgroundColor: ZEEVAN_GOLD.base,
    ...Platform.select({ web: { cursor: "pointer" }, default: {} }),
  },
  ctaCenter: { alignSelf: "flex-start" },
  ctaHover: { backgroundColor: ZEEVAN_GOLD.bright },
  ctaText: {
    fontFamily: fonts.semibold,
    fontSize: 13,
    color: "#1A1C14",
  },
});
