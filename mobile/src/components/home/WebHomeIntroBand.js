import React from "react";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { HOME_SCREEN_UI } from "../../content/appContent";
import { ZEEVAN_PRODUCT_LINES } from "../../content/zeevanCatalogContent";
import { FONT_HEADING } from "../../theme/typographyRoles";
import { KANKREG_CHROME, KANKREG_PALETTE } from "../../theme/kankregWeb";
import { useKankregLayout } from "../../theme/kankregBreakpoints";
import { fonts, icon, spacing } from "../../theme/tokens";
import { useTheme } from "../../context/ThemeContext";
import SectionReveal from "../motion/SectionReveal";

/** Compact intro band below the web hero — copy from `HOME_SCREEN_UI.webIntro`. */
export default function WebHomeIntroBand({ navigation }) {
  const { isDark } = useTheme();
  const { pageGutterClamp, isMobileWeb } = useKankregLayout();
  const copy = HOME_SCREEN_UI.webIntro;
  if (!copy?.title || HOME_SCREEN_UI.web?.showIntroBand === false) return null;

  const ink = isDark ? "#FAF8F4" : KANKREG_PALETTE.ink;
  const muted = isDark ? "rgba(250,248,244,0.72)" : KANKREG_PALETTE.inkSoft;

  return (
    <View style={[styles.shell, isDark && styles.shellDark]}>
      <SectionReveal immediate preset="fade-up" delay={140} style={styles.revealWrap}>
        <View style={[styles.inner, { paddingHorizontal: pageGutterClamp }]}>
          <View style={styles.copy}>
            <Text style={[styles.title, { color: ink }]}>{copy.title}</Text>
            {copy.subtitle ? (
              <Text style={[styles.subtitle, { color: muted }]}>{copy.subtitle}</Text>
            ) : null}
            {HOME_SCREEN_UI.web?.showIntroCategoryChips !== false ? (
              <View style={styles.lineRow}>
                {ZEEVAN_PRODUCT_LINES.map((line) => (
                  <Pressable
                    key={line.key}
                    onPress={() => navigation.navigate("Shop", { pill: line.shopPill })}
                    style={({ hovered, pressed }) => [
                      styles.lineChip,
                      isDark && styles.lineChipDark,
                      hovered && styles.lineChipHover,
                      pressed && { opacity: 0.9 },
                    ]}
                    accessibilityRole="button"
                  >
                    <Ionicons name={line.icon} size={12} color={KANKREG_PALETTE.green} />
                    <Text style={[styles.lineChipText, { color: isDark ? "#FAF8F4" : KANKREG_PALETTE.ink }]}>
                      {line.label}
                    </Text>
                  </Pressable>
                ))}
              </View>
            ) : null}
          </View>
          <View style={[styles.actions, isMobileWeb && styles.actionsStack]}>
          <Pressable
            onPress={() => navigation.navigate("Shop")}
            style={({ hovered, pressed }) => [
              styles.primaryBtn,
              hovered && styles.primaryBtnHover,
              pressed && { opacity: 0.92 },
            ]}
            accessibilityRole="button"
          >
            <Text style={styles.primaryBtnText}>{copy.cta}</Text>
            <Ionicons name="arrow-forward" size={icon.xs} color="#fff" />
          </Pressable>
          <Pressable
            onPress={() => navigation.navigate("About")}
            style={({ hovered, pressed }) => [
              styles.secondaryBtn,
              isDark && styles.secondaryBtnDark,
              hovered && styles.secondaryBtnHover,
              pressed && { opacity: 0.88 },
            ]}
            accessibilityRole="button"
          >
            <Text style={[styles.secondaryBtnText, { color: isDark ? "#FAF8F4" : KANKREG_PALETTE.green }]}>
              {copy.ctaSecondary}
            </Text>
          </Pressable>
        </View>
      </View>
      </SectionReveal>
    </View>
  );
}

const styles = StyleSheet.create({
  shell: {
    width: "100%",
    backgroundColor: KANKREG_CHROME.topbarSolid,
    borderBottomWidth: 1,
    borderBottomColor: KANKREG_PALETTE.lineSoft,
    paddingVertical: spacing.lg,
  },
  shellDark: {
    backgroundColor: "rgba(24, 21, 19, 0.55)",
    borderBottomColor: "rgba(255,255,255,0.06)",
  },
  revealWrap: {
    width: "100%",
  },
  inner: {
    width: "100%",
    maxWidth: 1280,
    alignSelf: "center",
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.md,
  },
  copy: {
    flex: 1,
    minWidth: 240,
    gap: 6,
  },
  title: {
    fontFamily: FONT_HEADING,
    fontSize: 24,
    lineHeight: 30,
    letterSpacing: -0.3,
  },
  subtitle: {
    fontFamily: fonts.regular,
    fontSize: 14,
    lineHeight: 22,
    maxWidth: 480,
  },
  lineRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.xs,
    marginTop: spacing.sm,
  },
  lineChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingVertical: 6,
    paddingHorizontal: 11,
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(31, 92, 71, 0.18)",
    backgroundColor: "rgba(31, 92, 71, 0.06)",
    ...Platform.select({ web: { cursor: "pointer" }, default: {} }),
  },
  lineChipDark: {
    borderColor: "rgba(42, 117, 89, 0.24)",
    backgroundColor: "rgba(42, 117, 89, 0.1)",
  },
  lineChipHover: {
    borderColor: KANKREG_PALETTE.green,
    backgroundColor: "rgba(31, 92, 71, 0.1)",
  },
  lineChipText: {
    fontFamily: fonts.semibold,
    fontSize: 12,
  },
  actions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    flexShrink: 0,
  },
  actionsStack: {
    width: "100%",
  },
  primaryBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 11,
    paddingHorizontal: 20,
    borderRadius: 999,
    backgroundColor: KANKREG_CHROME.buttonAccent,
    ...Platform.select({ web: { cursor: "pointer" }, default: {} }),
  },
  primaryBtnHover: {
    backgroundColor: KANKREG_CHROME.buttonAccentHover,
  },
  primaryBtnText: {
    fontFamily: fonts.semibold,
    fontSize: 14,
    color: "#fff",
  },
  secondaryBtn: {
    paddingVertical: 11,
    paddingHorizontal: 18,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(31, 92, 71, 0.22)",
    ...Platform.select({ web: { cursor: "pointer" }, default: {} }),
  },
  secondaryBtnDark: {
    borderColor: "rgba(42, 117, 89, 0.28)",
  },
  secondaryBtnHover: {
    borderColor: KANKREG_PALETTE.green,
  },
  secondaryBtnText: {
    fontFamily: fonts.semibold,
    fontSize: 14,
  },
});
