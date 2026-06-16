import { Platform, StyleSheet } from "react-native";
import { ALCHEMY } from "./customerAlchemy";
import { FONT_HEADING } from "./typographyRoles";
import { KANKREG_PALETTE, KANKREG_RADIUS } from "./kankregWeb";
import { fonts, spacing, typography } from "./tokens";
import { createKankregCardShell, createKankregEyebrowStyle } from "./kankregScreenStyles";

/** Root flex container for any full-screen page. */
export function createPageRoot() {
  return { flex: 1, width: "100%" };
}

/** Premium editorial quote block (home, marketing). */
export function createQuoteBlockStyles(isDark = false) {
  return StyleSheet.create({
    wrap: {
      borderRadius: KANKREG_RADIUS.card + 10,
      overflow: "hidden",
      paddingVertical: spacing.xl + spacing.lg,
      paddingHorizontal: spacing.lg,
      marginVertical: spacing.xl,
      backgroundColor: isDark ? ALCHEMY.brown : ALCHEMY.brown,
    },
    wrapXs: {
      paddingVertical: spacing.xl,
      paddingHorizontal: spacing.md + 2,
      marginVertical: spacing.lg,
      borderRadius: KANKREG_RADIUS.card,
    },
    mark: {
      position: "absolute",
      top: spacing.lg,
      left: spacing.lg,
      fontSize: 120,
      lineHeight: 72,
      color: isDark ? "rgba(42, 117, 89, 0.18)" : "rgba(42, 117, 89, 0.2)",
      fontFamily: FONT_HEADING,
    },
    block: { alignItems: "center" },
    text: {
      fontFamily: FONT_HEADING,
      fontSize: typography.h2 + 4,
      lineHeight: typography.h2 + 12,
      color: KANKREG_PALETTE.paper,
      textAlign: "center",
      maxWidth: Platform.OS === "web" ? 560 : 320,
      fontStyle: "italic",
    },
    textXs: {
      fontSize: typography.h3,
      lineHeight: typography.h3 + 8,
      maxWidth: "100%",
    },
    who: {
      marginTop: spacing.md + 2,
      fontSize: typography.caption,
      letterSpacing: 1,
      color: ALCHEMY.goldBright,
      textTransform: "uppercase",
      fontFamily: fonts.semibold,
    },
  });
}

/** Section wrapper with optional gold top accent. */
export function createPremiumSectionShell(isDark) {
  return {
    ...createKankregCardShell(isDark),
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderTopWidth: 3,
    borderTopColor: isDark ? ALCHEMY.goldBright : ALCHEMY.gold,
  };
}

/** Eyebrow + display title pair for inner pages. */
export function createSectionHeaderStyles(isDark) {
  return StyleSheet.create({
    eyebrow: createKankregEyebrowStyle(isDark),
    title: {
      fontFamily: FONT_HEADING,
      fontSize: typography.h2,
      letterSpacing: -0.4,
      color: isDark ? KANKREG_PALETTE.paper : KANKREG_PALETTE.ink,
      marginTop: spacing.xs,
    },
    subtitle: {
      marginTop: spacing.xs,
      fontSize: typography.bodySmall,
      lineHeight: 20,
      color: isDark ? "rgba(245, 239, 228, 0.72)" : KANKREG_PALETTE.inkFaint,
      fontFamily: fonts.regular,
    },
    wrap: {
      marginBottom: spacing.md,
    },
  });
}

/** List row card used on account, settings, support screens. */
export function createInteractiveRowShell(isDark) {
  return {
    ...createKankregCardShell(isDark),
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md + 2,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    ...Platform.select({
      web: { transition: "box-shadow 0.18s ease, border-color 0.18s ease" },
      default: {},
    }),
  };
}

/** Gate / access-denied panel (admin, protected routes). */
export function createGatePanelStyles(isDark) {
  return StyleSheet.create({
    panel: {
      ...createPremiumSectionShell(isDark),
      maxWidth: 480,
      alignSelf: "center",
      width: "100%",
      gap: spacing.md,
    },
    cta: { marginTop: spacing.sm },
  });
}
