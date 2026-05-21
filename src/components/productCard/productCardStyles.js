import { Platform, StyleSheet } from "react-native";
import { fonts, icon, radius, semanticRadius, spacing, typography } from "../../theme/tokens";
import { platformShadow } from "../../theme/shadowPlatform";
import { FONT_DISPLAY, FONT_DISPLAY_SEMI, ALCHEMY } from "../../theme/customerAlchemy";

function createStyles(c, isDark, layoutFlags = {}) {
  const { isWideWeb = false, isHugeWeb = false, isNarrowViewport = false } = layoutFlags;
  const lineBorder = isDark ? c.border : "#E8E6E1";
  const cardLiftShadow = platformShadow({
    web: {
      boxShadow: isDark
        ? "0 10px 26px rgba(0,0,0,0.24), inset 0 1px 0 rgba(255,255,255,0.05)"
        : "0 6px 16px rgba(15, 23, 42, 0.05), 0 1px 3px rgba(15, 23, 42, 0.03), inset 0 1px 0 rgba(255,255,255,0.92)",
    },
    ios: {
      shadowColor: "#18181B",
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: isDark ? 0.22 : 0.07,
      shadowRadius: 14,
    },
    android: { elevation: isDark ? 4 : 3 },
  });

  return StyleSheet.create({
    cardEntryWrap: {
      width: "100%",
    },
    card: {
      width: "100%",
      minHeight: Platform.select({
        web: isHugeWeb ? 220 : isWideWeb ? 204 : 168,
        default: isNarrowViewport ? 170 : 186,
      }),
      backgroundColor: c.surface,
      borderRadius: radius.xxl,
      overflow: "hidden",
      marginBottom: spacing.sm,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: lineBorder,
      ...cardLiftShadow,
      ...Platform.select({
        web: {
          backgroundImage: isDark
            ? undefined
            : "linear-gradient(180deg, rgba(255,255,255,0.96), rgba(255,253,250,0.99))",
          transition: "box-shadow 0.18s ease, border-color 0.18s ease, transform 0.18s ease",
        },
        default: {},
      }),
    },
    cardGridRest: {
      borderRadius: 14,
      borderColor: lineBorder,
      marginBottom: 0,
      ...Platform.select({
        web: {
          boxShadow: "none",
          backgroundImage: "none",
        },
        ios: {
          shadowColor: "transparent",
          shadowOpacity: 0,
          shadowRadius: 0,
          shadowOffset: { width: 0, height: 0 },
        },
        android: { elevation: 0 },
        default: {},
      }),
    },
    /** Quick-commerce tile: white card, blue discount badge, ETA row, outlined ADD. */
    cardQcShell: {
      width: "100%",
      maxWidth: "100%",
      alignSelf: "center",
      minHeight: 0,
      marginBottom: 0,
      padding: 0,
      borderRadius: semanticRadius.card,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: lineBorder,
      overflow: "hidden",
      ...cardLiftShadow,
      ...Platform.select({
        web: {
          backgroundImage: isDark
            ? undefined
            : "linear-gradient(180deg, rgba(255,255,255,0.92), rgba(255,253,250,0.99))",
          transitionProperty: "transform, box-shadow, border-color, background-color",
          transitionDuration: "180ms",
        },
        default: {},
      }),
    },
    cardQcShelfAccent: {
      borderLeftWidth: 0,
    },
    cardGridWeb: {
      minHeight: 0,
    },
    cardGridCompact: {
      minHeight: 0,
    },
    premiumGridCard: {
      width: "100%",
      borderRadius: 12,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: c.line || lineBorder,
      backgroundColor: c.surface,
      overflow: "hidden",
    },
    premiumGridCardRaised: {
      ...Platform.select({
        web: { boxShadow: "0 8px 18px rgba(15,23,42,0.10)" },
        ios: {
          shadowColor: "#0F172A",
          shadowOffset: { width: 0, height: 6 },
          shadowOpacity: 0.12,
          shadowRadius: 10,
        },
        android: { elevation: 3 },
        default: {},
      }),
    },
    premiumCardPressable: {
      width: "100%",
    },
    premiumImageHit: {
      ...StyleSheet.absoluteFillObject,
      zIndex: 0,
    },
    premiumContentPressable: {
      width: "100%",
    },
    premiumPriceHit: {
      flex: 1,
    },
    premiumImageArea: {
      position: "relative",
      width: "100%",
      backgroundColor: c.surfaceAlt || "rgba(0,0,0,0.03)",
      overflow: "visible",
      borderTopLeftRadius: 12,
      borderTopRightRadius: 12,
    },
    premiumImageAreaCompact: {
      aspectRatio: 1,
    },
    premiumImageAreaComfortable: {
      aspectRatio: 1,
    },
    premiumImageScaleWrap: {
      width: "100%",
      height: "100%",
    },
    premiumImageFrame: {
      width: "100%",
      height: "100%",
      overflow: "hidden",
    },
    premiumImageBackground: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: c.surfaceAlt || "rgba(0,0,0,0.03)",
    },
    premiumImage: {
      width: "100%",
      height: "100%",
    },
    premiumSecondaryImageLayer: {
      ...StyleSheet.absoluteFillObject,
    },
    shimmerSweep: {
      position: "absolute",
      top: 0,
      bottom: 0,
      width: "48%",
      zIndex: 2,
    },
    qcPress: {
      width: "100%",
    },
    qcImageBlock: {
      width: "100%",
    },
    qcImageFrame: {
      position: "relative",
      marginHorizontal: spacing.sm,
      marginTop: spacing.sm,
      borderRadius: radius.lg + 4,
      borderWidth: 1,
      padding: spacing.xs,
      overflow: "hidden",
      backgroundColor: isDark ? "rgba(255,255,255,0.04)" : "rgba(255, 252, 248, 0.85)",
    },
    qcDiscountBadge: {
      position: "absolute",
      top: 6,
      left: 6,
      zIndex: 4,
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: radius.pill,
      maxWidth: "62%",
      borderWidth: 1,
      borderColor: "rgba(255, 252, 248, 0.5)",
      ...Platform.select({
        web: { boxShadow: "0 8px 18px rgba(220, 38, 38, 0.25)" },
        default: {},
      }),
    },
    qcDiscountBadgeText: {
      fontSize: 10,
      letterSpacing: 0.5,
    },
    qcImageInner: {
      borderRadius: radius.lg,
      aspectRatio: 1,
      width: "100%",
      overflow: "hidden",
      alignItems: "center",
      justifyContent: "center",
    },
    qcImage: {
      width: "100%",
      height: "100%",
    },
    qcBody: {
      paddingHorizontal: spacing.md + 2,
      paddingTop: spacing.md - 2,
      paddingBottom: spacing.md + 2,
    },
    qcTitle: {
      fontSize: typography.body,
      fontFamily: FONT_DISPLAY_SEMI,
      lineHeight: 21,
      letterSpacing: -0.3,
      minHeight: 40,
      width: "100%",
      ...Platform.select({
        android: { includeFontPadding: false },
        default: {},
      }),
    },
    qcUnitRow: {
      marginTop: 2,
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
    },
    qcRatingRow: {
      marginTop: 6,
      flexDirection: "row",
      alignItems: "center",
      gap: 5,
      alignSelf: "flex-start",
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: radius.pill,
      backgroundColor: isDark ? "rgba(185, 28, 28, 0.1)" : ALCHEMY.goldSoft,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: isDark ? c.primaryBorder : "rgba(185, 28, 28, 0.2)",
    },
    qcRatingText: {
      fontSize: typography.overline + 1,
      lineHeight: 15,
      fontFamily: fonts.semibold,
    },
    qcUnit: {
      fontSize: 11,
      flexShrink: 1,
    },
    qcPriceRow: {
      marginTop: spacing.sm,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: spacing.sm,
    },
    qcPriceCol: {
      flex: 1,
      minWidth: 72,
      flexShrink: 1,
      paddingRight: 4,
    },
    qcPrice: {
      fontSize: typography.h3 - 1,
      fontFamily: FONT_DISPLAY,
      letterSpacing: -0.45,
      maxWidth: "100%",
      ...Platform.select({
        android: { includeFontPadding: false },
        default: {},
      }),
    },
    qcMrp: {
      marginTop: 2,
      fontSize: 11,
      textDecorationLine: "line-through",
    },
    qcSaveText: {
      marginTop: 2,
      fontSize: 10,
      letterSpacing: 0.15,
      opacity: 0.92,
    },
    qcAddBtn: {
      borderWidth: 1,
      borderRadius: semanticRadius.full,
      paddingHorizontal: spacing.md,
      paddingVertical: 9,
      minWidth: 64,
      flexShrink: 0,
      flexDirection: "row",
      gap: 4,
      alignItems: "center",
      justifyContent: "center",
      ...Platform.select({
        web: {
          boxShadow: "0 8px 16px rgba(62, 40, 12, 0.16), inset 0 1px 0 rgba(255,255,255,0.2)",
          transitionProperty: "transform, box-shadow, background-color, border-color",
          transitionDuration: "180ms",
        },
        default: {},
      }),
    },
    qcAddBtnText: {
      fontSize: typography.caption,
      letterSpacing: 0.6,
    },
    qcStepper: {
      flexDirection: "row",
      alignItems: "center",
      borderWidth: StyleSheet.hairlineWidth,
      borderRadius: semanticRadius.control,
      paddingHorizontal: 4,
      height: 34,
      flexShrink: 0,
      backgroundColor: "transparent",
    },
    qcStepHit: {
      paddingHorizontal: 8,
      paddingVertical: 4,
      minWidth: 28,
      alignItems: "center",
      justifyContent: "center",
    },
    qcStepQty: {
      fontSize: 13,
      minWidth: 18,
      textAlign: "center",
    },
    cardShelfAccent: {
      borderLeftWidth: 0,
    },
    cardList: {
      minHeight: Platform.select({
        web: isHugeWeb ? 212 : isWideWeb ? 192 : isNarrowViewport ? 158 : 174,
        ios: isNarrowViewport ? 156 : 168,
        default: isNarrowViewport ? 162 : 174,
      }),
      borderRadius: semanticRadius.card,
      marginBottom: 0,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: isDark ? c.border : "rgba(100, 116, 139, 0.1)",
      ...platformShadow({
        web: {
          boxShadow: isDark
            ? "0 10px 28px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.04)"
            : "0 8px 20px rgba(28, 25, 23, 0.07), 0 2px 8px rgba(24, 24, 27, 0.04), inset 0 1px 0 rgba(255,255,255,0.82)",
        },
        ios: {
          shadowColor: "#18181B",
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: isDark ? 0.22 : 0.07,
          shadowRadius: 11,
        },
        android: { elevation: isDark ? 3 : 2 },
      }),
      ...Platform.select({
        web: {
          transition: "box-shadow 0.18s ease, border-color 0.18s ease, transform 0.18s ease",
        },
        default: {},
      }),
    },
    cardListShelfAccent: {
      borderLeftWidth: 0,
    },
    touchableList: {
      flexDirection: "row",
      alignItems: "stretch",
    },
    imageWrap: {
      position: "relative",
      padding: spacing.sm,
      backgroundColor: isDark ? "rgba(255,255,255,0.04)" : ALCHEMY.creamAlt,
    },
    imageWrapGridHome: {
      padding: 8,
      paddingBottom: 0,
      backgroundColor: "transparent",
    },
    imageWrapGridWeb: {
      paddingHorizontal: isWideWeb ? spacing.md : spacing.sm,
      paddingTop: isWideWeb ? spacing.md : spacing.sm,
      paddingBottom: spacing.sm,
      backgroundColor: isDark ? "rgba(255,255,255,0.03)" : "rgba(255, 252, 248, 0.92)",
    },
    imageWrapGridCompact: {
      padding: spacing.xs + 2,
    },
    imageWrapList: {
      width: Platform.select({
        web: isHugeWeb ? 180 : isWideWeb ? 164 : isNarrowViewport ? 110 : 140,
        ios: isNarrowViewport ? 116 : 132,
        default: isNarrowViewport ? 120 : 140,
      }),
      padding: isNarrowViewport ? spacing.xs + 2 : spacing.sm,
    },
    imageBox: {
      height: Platform.select({
        web: isHugeWeb ? 112 : isWideWeb ? 98 : 76,
        default: isNarrowViewport ? 84 : 94,
      }),
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: c.border,
      borderRadius: radius.lg + 2,
      backgroundColor: c.surfaceMuted,
      alignItems: "center",
      justifyContent: "center",
      overflow: "hidden",
    },
    imageBoxGridHome: {
      height: undefined,
      aspectRatio: 4 / 5,
      borderRadius: 12,
      borderWidth: 0,
      backgroundColor: c.surfaceMuted,
    },
    imageBoxGridWeb: {
      height: isHugeWeb ? 214 : isWideWeb ? 190 : 166,
      borderRadius: radius.xl + 4,
      borderWidth: 1,
      borderColor: isDark ? "rgba(220, 38, 38, 0.16)" : "rgba(63, 63, 70, 0.08)",
      backgroundColor: isDark ? "rgba(24, 24, 27, 0.98)" : "#FFFFFF",
      ...Platform.select({
        web: {
          boxShadow: isDark
            ? "inset 0 1px 0 rgba(255,255,255,0.05), 0 8px 18px rgba(0,0,0,0.18)"
            : "0 10px 24px rgba(15, 23, 42, 0.06), inset 0 1px 0 rgba(255,255,255,0.96)",
        },
        default: {},
      }),
    },
    imageBoxGridCompact: {
      borderRadius: radius.lg,
    },
    imageBoxList: {
      height: Platform.select({
        web: isHugeWeb ? 176 : isWideWeb ? 152 : isNarrowViewport ? 102 : 130,
        default: isNarrowViewport ? 108 : 130,
      }),
      borderRadius: radius.xl + 4,
      position: "relative",
    },
    discountBadge: {
      position: "absolute",
      top: 8,
      left: 8,
      zIndex: 2,
      paddingHorizontal: 7,
      paddingVertical: 3,
      borderRadius: radius.pill,
      borderWidth: 0,
      borderColor: "transparent",
      flexDirection: "row",
      alignItems: "center",
      gap: 0,
      ...Platform.select({
        web: { boxShadow: "0 6px 14px rgba(180, 83, 9, 0.22)" },
        ios: {
          shadowColor: "#B45309",
          shadowOffset: { width: 0, height: 3 },
          shadowOpacity: 0.2,
          shadowRadius: 6,
        },
        android: { elevation: 2 },
        default: {},
      }),
    },
    discountBadgeText: {
      fontSize: 10,
      letterSpacing: 0.7,
      color: "#FFFFFF",
      fontFamily: fonts.semibold,
      textTransform: "uppercase",
    },
    newBadge: {
      position: "absolute",
      top: 10,
      left: 10,
      zIndex: 2,
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: radius.pill,
    },
    newBadgeText: {
      fontSize: 10,
      letterSpacing: 0.4,
      fontFamily: fonts.semibold,
      textTransform: "uppercase",
    },
    wishlistBtn: {
      position: "absolute",
      top: 8,
      right: 8,
      zIndex: 2,
      width: 28,
      height: 28,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: c.line || lineBorder,
      backgroundColor: "#FFFFFF",
      alignItems: "center",
      justifyContent: "center",
      ...Platform.select({
        web: { boxShadow: "0 2px 10px rgba(15,23,42,0.14)" },
        ios: {
          shadowColor: "#0F172A",
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.12,
          shadowRadius: 6,
        },
        android: { elevation: 2 },
        default: {},
      }),
    },
    heartBurstDot: {
      position: "absolute",
      width: 4,
      height: 4,
      borderRadius: 999,
      backgroundColor: c.accent || "#C8A97E",
      zIndex: 1,
    },
    oosOverlay: {
      ...StyleSheet.absoluteFillObject,
      opacity: 0.65,
      zIndex: 3,
    },
    oosRibbon: {
      position: "absolute",
      left: -30,
      top: 10,
      width: 120,
      paddingVertical: 5,
      backgroundColor: "rgba(0,0,0,0.7)",
      zIndex: 4,
      alignItems: "center",
      borderRadius: 2,
      transform: [{ rotate: "-24deg" }],
    },
    oosRibbonText: {
      color: "#FFFFFF",
      fontSize: 11,
      letterSpacing: 0.5,
      fontFamily: fonts.semibold,
      textTransform: "uppercase",
    },
    cardListEditorial: {
      borderLeftWidth: 0,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: lineBorder,
      borderRadius: radius.xxl - 2,
      ...Platform.select({
        ios: {
          shadowColor: "#18181B",
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: isDark ? 0.18 : 0.06,
          shadowRadius: 12,
        },
        android: { elevation: isDark ? 3 : 2 },
        web: {
          boxShadow: isDark
            ? "0 10px 28px rgba(0,0,0,0.22)"
            : "0 8px 20px rgba(28, 25, 23, 0.05), 0 2px 6px rgba(28, 25, 23, 0.035)",
        },
        default: {},
      }),
    },
    nameEditorial: {
      fontSize: 17,
      lineHeight: 22,
      letterSpacing: -0.25,
      minHeight: 44,
    },
    bottomStackList: {
      marginTop: spacing.md,
      width: "100%",
      alignSelf: "stretch",
      gap: spacing.sm,
    },
    bottomStackListCompact: {
      marginTop: spacing.sm + 2,
      flexDirection: "row",
      alignItems: "flex-end",
      justifyContent: "space-between",
      gap: spacing.sm,
    },
    bottomStackListEditorial: {
      marginTop: spacing.sm + 2,
      gap: spacing.sm + 2,
    },
    priceBlockListFull: {
      width: "100%",
      minWidth: 0,
    },
    priceBlockListCompact: {
      flex: 1,
      width: "auto",
    },
    priceLineList: {
      flexDirection: "row",
      alignItems: "baseline",
      flexWrap: "wrap",
      columnGap: 10,
      rowGap: 4,
    },
    priceListEditorial: {
      fontSize: 22,
      letterSpacing: -0.4,
    },
    mrpList: {
      fontSize: 12,
      textDecorationLine: "line-through",
      flexShrink: 0,
    },
    youSaveText: {
      marginTop: 6,
      fontSize: typography.bodySmall,
      lineHeight: 18,
    },
    listCtaRow: {
      flexDirection: "row",
      justifyContent: "flex-end",
      alignItems: "center",
      width: "100%",
    },
    listCtaRowCompact: {
      width: "auto",
      flexShrink: 0,
    },
    buttonEditorialList: {
      paddingHorizontal: spacing.md,
      minWidth: 96,
      flexShrink: 0,
    },
    image: {
      width: "100%",
      height: "100%",
      backgroundColor: "transparent",
    },
    imageGridWeb: {
      width: "92%",
      height: "92%",
    },
    imageFallback: {
      alignItems: "center",
      justifyContent: "center",
      gap: 6,
      paddingHorizontal: spacing.xs,
    },
    imageFallbackIconWrap: {
      width: 34,
      height: 34,
      borderRadius: radius.pill,
      alignItems: "center",
      justifyContent: "center",
    },
    imageFallbackText: {
      fontSize: typography.caption,
      textAlign: "center",
    },
    etaBadge: {
      position: "absolute",
      top: spacing.xs,
      left: spacing.xs,
      maxWidth: "85%",
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      backgroundColor: isDark ? "rgba(28,25,23,0.9)" : "rgba(255,252,248,0.96)",
      borderRadius: radius.md,
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: c.primaryBorder,
    },
    etaText: {
      fontSize: 9,
      flexShrink: 1,
    },
    badge: {
      position: "absolute",
      bottom: spacing.xs,
      left: spacing.xs,
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      backgroundColor: c.primary,
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: radius.md,
    },
    badgeText: {
      color: c.onPrimary,
      fontSize: 9,
    },
    content: {
      padding: Platform.select({
        web: isWideWeb ? spacing.md : spacing.sm,
        default: isNarrowViewport ? spacing.sm + 2 : spacing.md,
      }),
    },
    contentGridHome: {
      padding: 12,
      paddingTop: 12,
    },
    contentGridCompact: {
      paddingTop: spacing.sm,
      paddingBottom: spacing.sm,
    },
    contentGridWeb: {
      paddingTop: spacing.sm,
      paddingBottom: spacing.md,
    },
    contentCompact: {
      paddingTop: 6,
      paddingBottom: 6,
    },
    contentList: {
      flex: 1,
      paddingVertical: isWideWeb ? spacing.lg : isNarrowViewport ? spacing.sm + 2 : spacing.md + 2,
      paddingRight: isWideWeb ? spacing.xl : isNarrowViewport ? spacing.sm + 2 : spacing.lg,
      paddingLeft: isWideWeb ? spacing.md : isNarrowViewport ? spacing.xs + 2 : spacing.sm,
      justifyContent: "flex-start",
    },
    category: {
      fontSize: typography.overline + 1,
      textTransform: "none",
      marginBottom: 2,
      opacity: 0.82,
    },
    categoryGridHome: {
      fontSize: 11,
      textTransform: "uppercase",
      letterSpacing: 0.8,
      marginBottom: 2,
    },
    categoryGridCompact: {
      marginBottom: 1,
    },
    categoryGridWeb: {
      marginBottom: 4,
    },
    name: {
      fontSize: Platform.select({
        web: isWideWeb ? typography.body + 3 : typography.body + 1,
        default: typography.body + 1,
      }),
      lineHeight: Platform.select({
        web: isWideWeb ? 25 : 22,
        default: 22,
      }),
      minHeight: Platform.select({
        web: isWideWeb ? 50 : 42,
        default: 42,
      }),
      fontWeight: "500",
    },
    nameGridHome: {
      fontSize: 14,
      lineHeight: 18,
      minHeight: 18,
      fontWeight: "500",
    },
    imageFadeWrap: {
      width: "100%",
      height: "100%",
    },
    gridPriceRow: {
      flexDirection: "row",
      alignItems: "baseline",
      gap: 6,
      marginTop: 0,
    },
    gridPriceCurrent: {
      fontSize: 14,
      lineHeight: 18,
      fontFamily: fonts.semibold,
    },
    gridPriceMrp: {
      fontSize: 11,
      textDecorationLine: "line-through",
      fontFamily: fonts.medium,
    },
    atcControl: {
      position: "absolute",
      right: 10,
      bottom: 10,
      height: 32,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: c.accent || "#C8A97E",
      backgroundColor: c.surface,
      alignItems: "center",
      justifyContent: "center",
      overflow: "hidden",
      ...Platform.select({
        web: { boxShadow: "0 3px 10px rgba(15,23,42,0.16)" },
        default: {},
      }),
    },
    atcFlashActive: {
      backgroundColor: "rgba(200,169,126,0.18)",
    },
    addHit: {
      width: 32,
      height: 32,
      alignItems: "center",
      justifyContent: "center",
    },
    notifyHit: {
      width: "100%",
      height: "100%",
      alignItems: "center",
      justifyContent: "center",
    },
    gridFloatingAdd: {
      position: "absolute",
      right: 10,
      bottom: 10,
      width: 36,
      height: 36,
      borderRadius: 18,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: c.ink || c.textPrimary || "#111827",
      ...Platform.select({
        web: { boxShadow: "0 4px 12px rgba(0,0,0,0.18)" },
        ios: {
          shadowColor: "#000000",
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.18,
          shadowRadius: 12,
        },
        android: { elevation: 3 },
        default: {},
      }),
    },
    notifyGhost: {
      borderColor: c.accent || "#C8A97E",
      backgroundColor: c.surface,
    },
    notifyGhostText: {
      fontSize: 11,
      fontFamily: fonts.semibold,
      letterSpacing: 0.4,
      textTransform: "uppercase",
    },
    gridFloatingAddDisabled: {
      backgroundColor: c.textMuted,
    },
    gridFloatingAddPressed: {
      transform: [{ scale: 0.92 }],
    },
    gridFloatingStepper: {
      position: "absolute",
      right: 8,
      bottom: -12,
      height: 36,
      borderRadius: 18,
      backgroundColor: c.surface,
      borderWidth: 1,
      borderColor: c.accent || "#C8A97E",
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 2,
    },
    gridFloatingStepHit: {
      width: 30,
      height: 30,
      borderRadius: 15,
      alignItems: "center",
      justifyContent: "center",
    },
    gridFloatingQty: {
      minWidth: 20,
      textAlign: "center",
      fontFamily: fonts.bold,
      fontSize: 13,
    },
    premiumContent: {
      paddingHorizontal: 10,
      paddingTop: 12,
      paddingBottom: 10,
      minHeight: 92,
      gap: 2,
    },
    categoryPremium: {
      fontSize: 10,
      fontFamily: fonts.semibold,
      letterSpacing: 1.2,
      textTransform: "uppercase",
      marginBottom: 3,
    },
    namePremium: {
      fontSize: 13,
      lineHeight: 16,
      fontFamily: fonts.medium,
      fontWeight: "500",
      minHeight: 32,
    },
    unitText: {
      marginTop: 1,
      color: c.textSecondary,
      fontSize: 11,
      lineHeight: 13,
      fontFamily: fonts.medium,
    },
    shortDescription: {
      marginTop: 1,
      color: c.textSecondary,
      fontSize: 11,
      lineHeight: 13,
      fontFamily: fonts.regular,
    },
    ratingInline: {
      marginTop: 2,
      color: c.textSecondary,
      fontSize: 10,
      lineHeight: 12,
      fontFamily: fonts.medium,
    },
    ratingRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 2,
      marginTop: 2,
      minHeight: 14,
    },
    ratingValue: {
      fontSize: 11,
      fontFamily: fonts.semibold,
    },
    reviewCount: {
      fontSize: 11,
      fontFamily: fonts.medium,
    },
    newPill: {
      alignSelf: "flex-start",
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 999,
    },
    newPillText: {
      fontSize: 10,
      fontFamily: fonts.semibold,
      letterSpacing: 0.35,
      textTransform: "uppercase",
    },
    premiumBottomRow: {
      marginTop: 8,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 8,
    },
    inlineStepper: {
      flexDirection: "row",
      alignItems: "center",
      width: "100%",
      height: "100%",
      borderRadius: 16,
      paddingHorizontal: 4,
      justifyContent: "space-between",
    },
    inlineStepHit: {
      width: 24,
      height: 24,
      borderRadius: 12,
      alignItems: "center",
      justifyContent: "center",
    },
    inlineQty: {
      color: c.textPrimary,
      minWidth: 18,
      textAlign: "center",
      fontSize: 13,
      fontFamily: fonts.semibold,
    },
    notifyBackdrop: {
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.4)",
      alignItems: "center",
      justifyContent: "center",
      padding: 20,
    },
    notifyModal: {
      width: "100%",
      maxWidth: 360,
      borderRadius: 14,
      backgroundColor: c.surface,
      padding: 16,
      gap: 10,
    },
    notifyTitle: {
      fontSize: 16,
      fontFamily: fonts.semibold,
    },
    notifyBody: {
      fontSize: 13,
      lineHeight: 18,
      fontFamily: fonts.regular,
    },
    notifyInput: {
      borderWidth: 1,
      borderRadius: 10,
      paddingHorizontal: 12,
      paddingVertical: 10,
      fontSize: 14,
      fontFamily: fonts.regular,
    },
    notifyActions: {
      flexDirection: "row",
      justifyContent: "flex-end",
      gap: 8,
      marginTop: 2,
    },
    notifyActionGhost: {
      paddingHorizontal: 10,
      paddingVertical: 8,
      borderRadius: 8,
    },
    notifyActionGhostText: {
      fontSize: 13,
      fontFamily: fonts.medium,
    },
    notifyActionPrimary: {
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 8,
    },
    notifyActionPrimaryText: {
      color: "#FFFFFF",
      fontSize: 13,
      fontFamily: fonts.semibold,
    },
    nameListCompact: {
      fontSize: typography.body,
      lineHeight: 20,
      minHeight: 40,
    },
    nameGridCompact: {
      fontSize: typography.body,
      lineHeight: 20,
      minHeight: 40,
    },
    nameGridWeb: {
      fontSize: isWideWeb ? typography.body + 2 : typography.body + 1,
      lineHeight: isWideWeb ? 23 : 22,
      minHeight: isWideWeb ? 46 : 44,
    },
    description: {
      marginTop: 4,
      fontSize: typography.bodySmall,
      lineHeight: isWideWeb ? 19 : 17,
    },
    descriptionListCompact: {
      marginTop: 3,
      lineHeight: 16,
    },
    metaRowList: {
      marginTop: 2,
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      flexWrap: "wrap",
    },
    metaPillList: {
      borderWidth: StyleSheet.hairlineWidth,
      borderRadius: radius.pill,
      paddingHorizontal: 9,
      paddingVertical: 5,
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      maxWidth: "100%",
    },
    metaPillTextList: {
      fontSize: 11,
      flexShrink: 1,
      letterSpacing: 0.15,
    },
    unit: {
      marginTop: 4,
      fontSize: typography.caption,
    },
    unitGridCompact: {
      marginTop: 3,
    },
    unitGridWeb: {
      marginTop: 5,
    },
    bottomRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginTop: isWideWeb ? spacing.md + 2 : spacing.md,
      gap: spacing.sm,
    },
    bottomRowGridCompact: {
      marginTop: spacing.sm,
    },
    bottomRowGridWeb: {
      marginTop: spacing.sm + 2,
      alignItems: "flex-end",
    },
    price: {
      fontSize: Platform.select({
        web: isWideWeb ? typography.h3 : typography.body + 2,
        default: typography.body + 2,
      }),
      color: isDark ? c.textPrimary : "#111827",
    },
    priceGridCompact: {
      fontSize: typography.body + 1,
    },
    priceGridWeb: {
      fontSize: isWideWeb ? typography.h3 + 1 : typography.h3,
    },
    priceList: {
      fontSize: Platform.select({
        web: isWideWeb ? 22 : 20,
        default: 20,
      }),
    },
    priceListCompact: {
      fontSize: 18,
    },
    button: {
      borderRadius: semanticRadius.control + 2,
      minWidth: Platform.select({ web: isWideWeb ? 92 : 72, default: 84 }),
      paddingHorizontal: Platform.select({ web: isWideWeb ? spacing.md + 2 : spacing.md, default: spacing.md + 2 }),
      paddingVertical: Platform.select({ web: isWideWeb ? 11 : 10, default: 11 }),
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 6,
      ...Platform.select({
        web: {
          boxShadow: isDark
            ? "0 6px 14px rgba(0,0,0,0.28)"
            : "0 4px 10px rgba(62, 40, 12, 0.1), inset 0 1px 0 rgba(255,255,255,0.15)",
        },
        default: {},
      }),
    },
    buttonListCompact: {
      minWidth: 72,
      paddingHorizontal: spacing.sm + 2,
      paddingVertical: 9,
    },
    buttonGridCompact: {
      minWidth: 72,
      paddingHorizontal: spacing.sm + 2,
      paddingVertical: 9,
    },
    buttonGridWeb: {
      minWidth: isWideWeb ? 92 : 84,
      paddingHorizontal: isWideWeb ? spacing.md + 2 : spacing.md,
      paddingVertical: 10,
    },
    buttonDisabled: {},
    buttonText: {
      fontSize: typography.bodySmall,
      letterSpacing: isWideWeb ? 0.22 : 0.15,
    },
    stepper: {
      flexDirection: "row",
      alignItems: "center",
      borderRadius: semanticRadius.control,
      paddingHorizontal: 4,
      height: 34,
      minWidth: 78,
      justifyContent: "space-between",
      ...Platform.select({
        web: { boxShadow: "0 3px 8px rgba(15, 23, 42, 0.08)" },
        default: {},
      }),
    },
    stepperListCompact: {
      minWidth: 72,
      height: 32,
    },
    stepperGridCompact: {
      minWidth: 74,
      height: 32,
    },
    stepperGridWeb: {
      minWidth: isWideWeb ? 94 : 84,
      height: 36,
    },
    stepButton: {
      width: 26,
      alignItems: "center",
      justifyContent: "center",
    },
    quantityText: {
      fontSize: typography.bodySmall,
    },
    buttonEditorialListCompact: {
      minWidth: 82,
    },
  });
}

export default createStyles;
