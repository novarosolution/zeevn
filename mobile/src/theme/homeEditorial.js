/**
 * Zeevan web home — editorial spacing & type scale.
 * Premium brief: generous rhythm, muted eyebrows, green used sparingly.
 */
import { Platform } from "react-native";
import { spacing } from "./tokens";
import { KANKREG_PALETTE } from "./kankregWeb";

/** Vertical rhythm for web home sections (8px base). */
export const HOME_SPACE = {
  xs: spacing.xs,
  sm: spacing.sm,
  md: spacing.md,
  lg: spacing.lg,
  xl: spacing.xl,
  /** Gap between major home blocks inside `KankregPageWrap`. */
  section: spacing.xxl,
};

/** Single source: vertical gap between web home sections (categories → grid → story). */
export const HOME_SECTION_GAP = HOME_SPACE.section;

/** Space from a section header to its content (grid, cards, body). */
export const HOME_HEADER_CONTENT_GAP = HOME_SPACE.md;

/**
 * Editorial type scale (web home). Pair with `FONT_HEADING` + sans body tokens.
 * Sizes are px; responsive helpers live on `SectionHeader`.
 */
export const HOME_TYPE = {
  hero: { min: 40, max: 64, lineHeightRatio: 1.05 },
  sectionTitle: { min: 26, max: 34, lineHeightRatio: 1.08 },
  body: { min: 15, max: 17, lineHeight: 24 },
  eyebrow: 12,
  kicker: 15,
};

/** ~0.12em letter-spacing for 12px eyebrow (RN uses px, not em). */
export const HOME_EYEBROW_LETTER_SPACING = HOME_TYPE.eyebrow * 0.12;

/** Muted warm taupe — eyebrows, kickers, captions (not gold). */
export function homeEditorialMuted(isDark) {
  return isDark ? "rgba(245, 239, 228, 0.58)" : KANKREG_PALETTE.inkFaint;
}

/** Warm ink for display titles. */
export function homeEditorialInk(isDark) {
  return isDark ? KANKREG_PALETTE.paper : KANKREG_PALETTE.ink;
}

/**
 * Standard `GoldHairline` presets for editorial surfaces.
 * @see components/ui/GoldHairline.js — pass `variant="subtle"` for section dividers.
 */
export const GOLD_HAIRLINE_EDITORIAL = {
  /** Under-section eyebrow — thin, low-opacity, no dot. */
  subtle: {
    variant: "subtle",
    withDot: false,
    marginVertical: HOME_SPACE.xs,
  },
  /** Between major blocks — default gradient hairline. */
  section: {
    variant: "default",
    withDot: true,
    marginVertical: HOME_SPACE.md,
  },
};

export function homeSectionTitleSize(width, compact = false) {
  if (Platform.OS !== "web") return compact ? HOME_TYPE.sectionTitle.min : HOME_TYPE.sectionTitle.min + 2;
  if (width >= 1080) return HOME_TYPE.sectionTitle.max;
  if (width >= 900) return 30;
  if (width >= 560) return 28;
  return compact ? HOME_TYPE.sectionTitle.min : HOME_TYPE.sectionTitle.min + 2;
}

/** Responsive hero display title (web top banner). */
export function homeHeroTitleSize(width) {
  if (Platform.OS !== "web") return HOME_TYPE.hero.min;
  if (width >= 1200) return HOME_TYPE.hero.max;
  if (width >= 1080) return 56;
  if (width >= 900) return 48;
  if (width >= 560) return 40;
  return HOME_TYPE.hero.min;
}

/** Muted copy on dark hero scrim (eyebrow + subtitle). */
export function homeHeroScrimMuted() {
  return "rgba(245, 239, 228, 0.72)";
}
