import React, { memo } from "react";
import { Platform, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../context/ThemeContext";
import { useKankregLayout } from "../../theme/kankregBreakpoints";
import { FONT_HEADING } from "../../theme/typographyRoles";
import { WP } from "../../theme/webPremium";
import { fonts } from "../../theme/tokens";
import { HOME_SCREEN_UI } from "../../content/appContent";
import { WEB_HOME_PREMIUM } from "../../content/webHomeContent";
import { isProductComingSoon } from "../../utils/productAvailability";

/**
 * Home shelf for products the admin marked "coming soon": a slim cream-and-gold notice with the upcoming products as
 * chips, instead of a full-width panel competing with the catalog.
 */
function HomeComingSoonStrip({ products = [] }) {
  const { isDark } = useTheme();
  const { isMobileWeb } = useKankregLayout();
  const copy = HOME_SCREEN_UI.comingSoon;
  const items = (Array.isArray(products) ? products : []).filter(isProductComingSoon);

  if (!items.length) return null;

  const ink = isDark ? WP.cream : WP.ink;
  const accent = isDark ? WP.gold.bright : WP.gold.deep;

  return (
    <View style={[styles.shell, isMobileWeb && styles.shellPhone, isDark && styles.shellDark]}>
      <View style={styles.lead}>
        <View style={styles.iconWrap}>
          <Ionicons name="sparkles" size={18} color={WP.gold.ink} />
        </View>
        <View style={styles.copy}>
          <Text style={[styles.eyebrow, { color: accent }]}>
            {(copy.stripEyebrow && copy.stripEyebrow !== "Soon" ? copy.stripEyebrow : WEB_HOME_PREMIUM.comingSoon.eyebrow).toUpperCase()}
          </Text>
          <Text style={[styles.title, { color: ink }]}>{copy.stripTitle || WEB_HOME_PREMIUM.comingSoon.title}</Text>
        </View>
      </View>
      <View style={styles.chips}>
        {items.slice(0, 4).map((p) => (
          <View key={p.id} style={[styles.chip, isDark && styles.chipDark]}>
            <Text style={[styles.chipName, { color: ink }]} numberOfLines={1}>
              {p.name}
            </Text>
            {p.comingSoonNote ? (
              <Text style={[styles.chipNote, { color: accent }]} numberOfLines={1}>
                {p.comingSoonNote}
              </Text>
            ) : null}
          </View>
        ))}
      </View>
    </View>
  );
}

export default memo(HomeComingSoonStrip);

const styles = StyleSheet.create({
  shell: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 20,
    paddingVertical: 18,
    paddingHorizontal: 24,
    marginBottom: 28,
    borderRadius: WP.radius.card,
    borderWidth: 1,
    borderColor: "rgba(184, 136, 76, 0.4)",
    backgroundColor: "#FFFFFF",
    overflow: "hidden",
    ...Platform.select({
      web: {
        backgroundImage: "linear-gradient(100deg, #FBF3E1 0%, #F6E8C9 100%)",
        boxShadow: "0 14px 30px -24px rgba(120, 82, 28, 0.45)",
        maxWidth: "100%",
      },
      default: {},
    }),
  },
  shellPhone: { paddingVertical: 14, paddingHorizontal: 16, gap: 12, marginBottom: 18 },
  shellDark: {
    backgroundColor: "#211b12",
    borderColor: "rgba(230, 190, 136, 0.28)",
    ...Platform.select({ web: { backgroundImage: "linear-gradient(100deg, #261f14 0%, #1d1810 100%)" }, default: {} }),
  },
  lead: { flexDirection: "row", alignItems: "center", gap: 14 },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    ...Platform.select({
      web: { backgroundImage: WP.gradient.gold, boxShadow: "0 8px 18px -8px rgba(120, 82, 28, 0.6)" },
      default: { backgroundColor: WP.gold.base },
    }),
  },
  copy: { gap: 2 },
  eyebrow: { fontFamily: fonts.bold, fontSize: 10.5, letterSpacing: 2.4 },
  title: { fontFamily: FONT_HEADING, fontSize: 22, lineHeight: 26, letterSpacing: -0.3 },
  chips: { flex: 1, minWidth: 200, flexDirection: "row", flexWrap: "wrap", gap: 10, justifyContent: "flex-end" },
  chip: {
    maxWidth: "100%",
    paddingVertical: 8,
    paddingHorizontal: 14,
    gap: 1,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(184, 136, 76, 0.35)",
    backgroundColor: "rgba(255, 252, 246, 0.8)",
  },
  chipDark: {
    borderColor: "rgba(230, 190, 136, 0.25)",
    backgroundColor: "rgba(255, 255, 255, 0.05)",
  },
  chipName: { fontFamily: fonts.semibold, fontSize: 14 },
  chipNote: { fontFamily: fonts.medium, fontSize: 12 },
});
