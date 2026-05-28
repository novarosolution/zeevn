import { Platform, StyleSheet } from "react-native";
import { ALCHEMY, FONT_DISPLAY, FONT_DISPLAY_SEMI, HERITAGE } from "../../theme/customerAlchemy";
import { fonts, layout, lineHeight, radius, spacing, typography } from "../../theme/tokens";
import { spacing as homeSpacing } from "../../styles/spacing";
export function createHomePrimeProductsStyles(c, isDark, windowWidth = 390) {
  const isPhone = windowWidth < 600;
  const isTablet = windowWidth >= 600 && windowWidth < 1024;
  const isDesktop = windowWidth >= 1024;
  const brass = isDark ? c.accent : c.accentOnLight || c.accent;
  const ink = c.textPrimary || ALCHEMY.brown;
  const inkSoft = c.textMuted || ALCHEMY.brownMuted;
  const surface = isDark ? c.surface : ALCHEMY.cardBg;
  const border = isDark ? c.border : ALCHEMY.line;

  const titleSize = isDesktop ? 26 : isTablet ? 24 : 22;
  const padH = isPhone ? 16 : isTablet ? 20 : 24;
  const padV = isPhone ? 18 : 22;

  return StyleSheet.create({
    wrap: {
      width: "100%",
      marginBottom: isPhone ? 32 : 40,
      ...Platform.select({
        web: { maxWidth: layout.maxContentWidth, alignSelf: "center" },
        default: {},
      }),
    },
    gradientShell: {
      borderRadius: radius.xxl,
      overflow: "hidden",
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: border,
      ...Platform.select({
        web: {
          boxShadow: isDark
            ? "0 20px 52px rgba(0,0,0,0.32), inset 0 1px 0 rgba(255,255,255,0.07)"
            : "0 16px 44px rgba(15, 23, 42, 0.09), 0 4px 14px rgba(24, 24, 27, 0.04), inset 0 1px 0 rgba(255,255,255,0.95)",
        },
        ios: {
          shadowColor: "#18181B",
          shadowOffset: { width: 0, height: 12 },
          shadowOpacity: isDark ? 0.24 : 0.1,
          shadowRadius: 22,
        },
        android: { elevation: isDark ? 6 : 4 },
        default: {},
      }),
    },
    inner: {
      paddingHorizontal: padH,
      paddingTop: padV,
      paddingBottom: padV,
      backgroundColor: isDark ? "rgba(255,255,255,0.02)" : "rgba(255,255,255,0.55)",
    },
    topRule: {
      position: "absolute",
      top: 0,
      left: padH,
      right: padH,
      height: 2,
      borderRadius: 2,
      backgroundColor: brass,
      opacity: isDark ? 0.9 : 1,
    },
    headerRow: {
      flexDirection: isPhone ? "column" : "row",
      alignItems: isPhone ? "stretch" : "flex-end",
      justifyContent: "space-between",
      gap: isPhone ? homeSpacing.sm : homeSpacing.md,
      marginBottom: homeSpacing.lg,
    },
    headerCopy: {
      flex: 1,
      minWidth: 0,
      gap: 6,
    },
    overlineRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
    },
    overlineSquare: {
      width: 4,
      height: 4,
      borderRadius: 1,
      backgroundColor: brass,
    },
    overlineText: {
      fontFamily: fonts.semibold,
      fontSize: 10,
      letterSpacing: 1.5,
      textTransform: "uppercase",
      color: brass,
    },
    titleRow: {
      flexDirection: "row",
      flexWrap: "wrap",
      alignItems: "center",
      gap: 10,
    },
    title: {
      fontFamily: FONT_DISPLAY,
      fontSize: titleSize,
      lineHeight: Math.round(titleSize * 1.12),
      letterSpacing: -0.3,
      color: ink,
      flexShrink: 1,
    },
    countPill: {
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: radius.pill,
      backgroundColor: isDark ? "rgba(200,169,126,0.14)" : ALCHEMY.goldSoft,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: isDark ? "rgba(200,169,126,0.28)" : "rgba(200,169,126,0.35)",
    },
    countPillText: {
      fontFamily: fonts.semibold,
      fontSize: 11,
      letterSpacing: 0.3,
      color: isDark ? brass : HERITAGE.amber,
    },
    subtitle: {
      fontFamily: fonts.regular,
      fontSize: typography.bodySmall,
      lineHeight: lineHeight.bodySmall,
      color: inkSoft,
      maxWidth: isDesktop ? 480 : undefined,
    },
    headerActions: {
      flexDirection: "row",
      alignItems: "center",
      gap: homeSpacing.sm,
      alignSelf: isPhone ? "flex-start" : "center",
    },
    seeAllBtn: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      paddingHorizontal: 14,
      paddingVertical: 10,
      borderRadius: radius.pill,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: isDark ? "rgba(200,169,126,0.35)" : border,
      backgroundColor: isDark ? "rgba(255,255,255,0.04)" : surface,
    },
    seeAllPressed: {
      opacity: 0.88,
      transform: [{ scale: 0.98 }],
    },
    seeAllText: {
      fontFamily: FONT_DISPLAY_SEMI,
      fontSize: 13,
      color: brass,
      letterSpacing: 0.2,
    },
    grid: {
      width: "100%",
    },
    gridRow: {
      flexDirection: "row",
      width: "100%",
      justifyContent: "flex-start",
    },
    gridCell: {
      flexGrow: 0,
      flexShrink: 0,
    },
    cellFrame: {
      borderRadius: radius.lg,
      overflow: "hidden",
      backgroundColor: isDark ? c.surfaceMuted || surface : surface,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: isDark ? "rgba(255,255,255,0.08)" : "rgba(15, 23, 42, 0.06)",
      ...Platform.select({
        web: {
          transition: "box-shadow 160ms ease, transform 160ms ease",
        },
        default: {},
      }),
    },
    footerNote: {
      marginTop: homeSpacing.md,
      paddingTop: homeSpacing.sm,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: isDark ? "rgba(255,255,255,0.08)" : "rgba(15, 23, 42, 0.06)",
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
    },
    footerNoteText: {
      flex: 1,
      fontFamily: fonts.regular,
      fontSize: 12,
      lineHeight: 18,
      color: inkSoft,
    },
  });
}

/** Responsive column count for the prime grid. */
export function getPrimeGridColumns(windowWidth, preferred) {
  if (Number.isFinite(Number(preferred)) && Number(preferred) > 0) {
    return Math.min(4, Math.max(1, Math.round(Number(preferred))));
  }
  if (windowWidth >= 1200) return 4;
  if (windowWidth >= 768) return 3;
  return 2;
}
