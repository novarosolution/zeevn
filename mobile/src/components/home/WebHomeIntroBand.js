import React from "react";
import { Image, Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { HOME_SCREEN_UI } from "../../content/appContent";
import { ZEEVAN_PRODUCT_LINES } from "../../content/zeevanCatalogContent";
import { KANKREG_CHROME, ZEEVAN_GREEN } from "../../theme/kankregWeb";
import { useKankregLayout } from "../../theme/kankregBreakpoints";
import { FONT_HEADING } from "../../theme/typographyRoles";
import { fonts, icon, spacing } from "../../theme/tokens";
import { useTheme } from "../../context/ThemeContext";
import { getHomeLineImage } from "../../content/homeLineImages";
import SectionReveal from "../motion/SectionReveal";

/**
 * Premium intro under the web hero — line rail + clear shop CTA.
 */
export default function WebHomeIntroBand({ navigation }) {
  const { isDark } = useTheme();
  const { pageGutterClamp, isMobileWeb } = useKankregLayout();
  const copy = HOME_SCREEN_UI.webIntro;
  if (HOME_SCREEN_UI.web?.showIntroBand === false) return null;

  const ink = isDark ? "#FAF8F4" : "#1A1C14";
  const muted = isDark ? "rgba(250,248,244,0.78)" : "#3F3C2E";
  const cta = copy?.cta || "Shop all";

  return (
    <View style={[styles.shell, isDark && styles.shellDark]}>
      <SectionReveal immediate preset="fade-up" delay={100} style={styles.revealWrap}>
        <View style={[styles.inner, { paddingHorizontal: pageGutterClamp }]}>
          <View style={[styles.copy, isMobileWeb && styles.copyCenter]}>
            {copy?.title ? (
              <Text style={[styles.title, { color: ink }, isMobileWeb && styles.titleCenter]}>
                {copy.title}
              </Text>
            ) : null}
            {copy?.subtitle ? (
              <Text style={[styles.subtitle, { color: muted }, isMobileWeb && styles.titleCenter]}>
                {copy.subtitle}
              </Text>
            ) : null}
          </View>

          <View
            style={[styles.rail, isMobileWeb && styles.railMobile]}
            accessibilityRole="navigation"
            accessibilityLabel="Product lines"
          >
            {ZEEVAN_PRODUCT_LINES.map((line) => {
              const thumb = getHomeLineImage(line.key);
              const short =
                isMobileWeb && line.key === "honey" ? "Honey" : line.label;
              return (
                <Pressable
                  key={line.key}
                  onPress={() =>
                    navigation.navigate("Shop", {
                      category: line.label,
                      pill: line.shopPill || line.label,
                    })
                  }
                  style={({ hovered, pressed }) => [
                    styles.lineChip,
                    isMobileWeb && styles.lineChipMobile,
                    isDark && styles.lineChipDark,
                    hovered && styles.lineChipHover,
                    pressed && { opacity: 0.9 },
                  ]}
                  accessibilityRole="link"
                  accessibilityLabel={`Shop ${line.label}`}
                >
                  {thumb ? <Image source={thumb} style={styles.lineThumb} /> : null}
                  <Text style={[styles.lineText, { color: ink }]} numberOfLines={1}>
                    {short}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <Pressable
            onPress={() => navigation.navigate("Shop")}
            style={({ hovered, pressed }) => [
              styles.cta,
              hovered && styles.ctaHover,
              pressed && { opacity: 0.92 },
              isMobileWeb && styles.ctaCenter,
            ]}
            accessibilityRole="button"
            accessibilityLabel={cta}
          >
            <Text style={styles.ctaText}>{cta}</Text>
            <Ionicons name="arrow-forward" size={icon.xs} color="#FAF8F4" />
          </Pressable>
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
    backgroundColor: KANKREG_CHROME.cream,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(26, 28, 20, 0.12)",
    paddingVertical: spacing.md + 4,
    ...Platform.select({
      web: {
        backgroundImage:
          "linear-gradient(180deg, rgba(252,248,240,0.97) 0%, rgba(243,235,221,0.98) 100%)",
      },
      default: {},
    }),
  },
  shellDark: {
    backgroundColor: "rgba(18, 16, 12, 0.94)",
    borderBottomColor: "rgba(255,255,255,0.1)",
  },
  revealWrap: {
    width: "100%",
  },
  inner: {
    width: "100%",
    maxWidth: 1280,
    alignSelf: "center",
    gap: spacing.md,
  },
  copy: {
    gap: 6,
    maxWidth: 560,
  },
  copyCenter: {
    alignItems: "center",
    alignSelf: "center",
    maxWidth: 420,
  },
  title: {
    fontFamily: FONT_HEADING,
    fontSize: 28,
    lineHeight: 34,
    letterSpacing: -0.35,
  },
  titleCenter: {
    textAlign: "center",
  },
  subtitle: {
    fontFamily: fonts.regular,
    fontSize: 15,
    lineHeight: 22,
  },
  rail: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: 8,
  },
  railMobile: {
    justifyContent: "space-between",
    gap: 8,
  },
  lineChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 7,
    paddingHorizontal: 10,
    paddingRight: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(26, 28, 20, 0.18)",
    backgroundColor: "rgba(255, 253, 248, 0.98)",
    ...Platform.select({ web: { cursor: "pointer" }, default: {} }),
  },
  lineChipMobile: {
    flex: 0,
    flexBasis: "48%",
    width: "48%",
    maxWidth: "48%",
    paddingVertical: 10,
    paddingHorizontal: 10,
    ...Platform.select({
      web: { boxSizing: "border-box" },
      default: {},
    }),
  },
  lineChipDark: {
    borderColor: "rgba(255,255,255,0.14)",
    backgroundColor: "rgba(255,255,255,0.04)",
  },
  lineChipHover: {
    borderColor: ZEEVAN_GREEN.deep,
    backgroundColor: "rgba(92, 104, 52, 0.08)",
  },
  lineThumb: {
    width: 32,
    height: 32,
    borderRadius: 8,
  },
  lineText: {
    fontFamily: fonts.semibold,
    fontSize: 13,
    letterSpacing: 0.06,
  },
  cta: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 4,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    backgroundColor: ZEEVAN_GREEN.deep,
    ...Platform.select({ web: { cursor: "pointer" }, default: {} }),
  },
  ctaCenter: {
    alignSelf: "center",
  },
  ctaHover: {
    backgroundColor: ZEEVAN_GREEN.base,
  },
  ctaText: {
    fontFamily: fonts.semibold,
    fontSize: 13,
    letterSpacing: 0.04,
    color: "#FAF8F4",
  },
});
