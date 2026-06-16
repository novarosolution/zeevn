/**
 * Responsive breakpoints aligned with kankreg.html media queries.
 * @see kankreg.html @media (max-width: 1080|900|560|420)
 */
import { useMemo } from "react";
import { Platform, useWindowDimensions } from "react-native";

export const KANKREG_BP = {
  xs: 420,
  sm: 560,
  news: 760,
  md: 900,
  heroStack: 1100,
  lg: 1080,
  xl: 1200,
  profileSticky: 1320,
};

export function getKankregBreakpoint(width) {
  if (width >= KANKREG_BP.xl) return "xl";
  if (width >= KANKREG_BP.lg) return "lg";
  if (width >= KANKREG_BP.md) return "md";
  if (width >= KANKREG_BP.sm) return "sm";
  return "xs";
}

/** Product/catalog grid column width style for flex-wrap grids */
export function getCatalogGridColStyle(width) {
  const pad = width < KANKREG_BP.xs ? 5 : width < KANKREG_BP.sm ? 7 : 9;
  if (width >= KANKREG_BP.xl) {
    return { width: "25%", maxWidth: "25%", paddingHorizontal: pad, flexGrow: 0, flexShrink: 0 };
  }
  if (width >= KANKREG_BP.lg) {
    return { width: "33.333%", maxWidth: "33.333%", paddingHorizontal: pad, flexGrow: 0, flexShrink: 0 };
  }
  /** Phone & narrow tablet: 2-up grid (kankreg.html mobile catalog) */
  return { width: "50%", maxWidth: "50%", paddingHorizontal: pad, flexGrow: 0, flexShrink: 0 };
}

export function useKankregLayout() {
  const { width, height } = useWindowDimensions();
  return useMemo(() => {
    const bp = getKankregBreakpoint(width);
    return {
      width,
      height,
      bp,
      isXs: width < KANKREG_BP.sm,
      isSm: width >= KANKREG_BP.sm && width < KANKREG_BP.md,
      isMd: width >= KANKREG_BP.md && width < KANKREG_BP.lg,
      isLg: width >= KANKREG_BP.lg,
      isXl: width >= KANKREG_BP.xl,
      /** HTML: nav hidden below 1080 */
      showDesktopNav: width >= KANKREG_BP.lg,
      /** Narrow web — aligned figma gutters (kankreg.html ≤1080); no bottom tab bar on web */
      isMobileWeb: Platform.OS === "web" && width < KANKREG_BP.lg,
      showMobileWebTabBar: false,
      /** HTML: compact topbar below 560 */
      compactHeader: width < KANKREG_BP.sm,
      /** HTML: `.announce .hide-sm` */
      hideAnnounceSecondary: width < KANKREG_BP.sm,
      /** HTML: `.news` stacks below 760 */
      stackFooterNewsletter: width < KANKREG_BP.news,
      /** `.shop-grid` sidebar */
      showShopSidebar: width >= KANKREG_BP.md,
      /** `.split` cart/checkout */
      useSplitLayout: width >= KANKREG_BP.md,
      /** `.pdp` two-column product (HTML stacks below 980px) */
      useProductSplit: width >= 980,
      /** `.prof-grid` / `.admin` */
      useSidebarLayout: width >= KANKREG_BP.md,
      /** `.deliv-grid` */
      useDeliverySplit: width >= KANKREG_BP.md,
      catalogGridCol: getCatalogGridColStyle(width),
      /** Home category grid — 4 lines on desktop, 2-up on phone web. */
      categoryCols: width >= KANKREG_BP.lg ? 4 : 2,
      categoryCompact: width < KANKREG_BP.md,
      footerCols: width >= KANKREG_BP.md ? 4 : width >= KANKREG_BP.sm ? 2 : 1,
      pageGutter: width < KANKREG_BP.xs ? 14 : width < KANKREG_BP.sm ? 16 : width < KANKREG_BP.md ? 18 : 24,
      pageGutterClamp: width < KANKREG_BP.xs ? 14 : width < KANKREG_BP.sm ? 16 : Math.min(40, Math.max(18, width * 0.04)),
      /** Dense product tiles in 2-col phone grid */
      catalogCardCompact: width < KANKREG_BP.md,
      /** Home editorial hero (`.hero-grid`) */
      showEditorialHero: width >= KANKREG_BP.md,
      stackEditorialHero: width < KANKREG_BP.heroStack,
      /** Profile sticky hero column */
      useStickyProfileCol: width >= KANKREG_BP.profileSticky,
      /** Auth / feature side-by-side panels */
      useAuthSplit: width >= KANKREG_BP.md,
      /** Admin module tiles */
      adminModuleCols: width >= KANKREG_BP.md ? 2 : 1,
      /** KPI / stat rows: 4 → 2 → 1 */
      statCols: width >= KANKREG_BP.lg ? 4 : width >= KANKREG_BP.sm ? 2 : 1,
      statCellMinWidth: width < KANKREG_BP.sm ? "100%" : width < KANKREG_BP.md ? "46%" : 200,
    };
  }, [width, height]);
}

/** Flex row grid cell width for `flexWrap` product/reward grids */
export function getFlexGridCellStyle(colCount) {
  const pct = `${100 / Math.max(1, colCount)}%`;
  return { width: pct, maxWidth: pct, minWidth: colCount === 1 ? "100%" : 140, paddingHorizontal: 11 };
}

/** Home category tile width — flex-wrap row; percentages leave room for gap. */
export function getCategoryGridCellStyle(colCount) {
  if (colCount >= 4) {
    return { width: "23.5%", maxWidth: "23.5%", flexGrow: 0, flexShrink: 0, minWidth: 0 };
  }
  if (colCount === 3) {
    return { width: "31%", maxWidth: "31%", flexGrow: 0, flexShrink: 0, minWidth: 0 };
  }
  return { width: "48%", maxWidth: "48%", flexGrow: 0, flexShrink: 0, minWidth: 0 };
}
