import { Platform, StyleSheet } from "react-native";
import { adminPanel } from "./adminLayout";
import { ALCHEMY } from "./customerAlchemy";
import { platformElevation, sectionStackGap } from "./platformStyles";
import { layout, semanticRadius, spacing } from "./tokens";
import { getKankregChromeTop } from "../components/kankreg/KankregSiteHeader";
import { WEB_CHROME_TOP } from "./web";

/**
 * Customer-facing panels: warm card in light mode, theme surface in dark — aligned with Home catalog cards.
 * @param {boolean} isDark from `useTheme()`
 */
export function customerPanel(c, shadowPremium, isDark) {
  const admin = adminPanel(c, shadowPremium, isDark);
  return {
    ...admin,
    borderRadius: semanticRadius.panel,
    borderTopWidth: 3,
    padding: Platform.select({
      web: spacing.lg + 10,
      default: spacing.md + 2,
    }),
    ...(isDark
      ? {
          backgroundColor: c.surface,
          borderColor: c.border,
          borderTopColor: "rgba(52, 211, 153, 0.5)",
        }
      : {
          backgroundColor: ALCHEMY.ivory,
          borderColor: ALCHEMY.lineStrong,
          borderTopColor: ALCHEMY.gold,
        }),
    ...Platform.select({
      web: {
        backgroundImage: isDark
          ? undefined
          : "linear-gradient(180deg, rgba(255,255,255,0.86), rgba(255,253,250,0.96))",
        boxShadow: isDark
          ? "0 22px 50px rgba(0,0,0,0.34), inset 0 1px 0 rgba(255,255,255,0.04)"
          : "0 18px 40px rgba(22, 69, 51, 0.09), inset 0 1px 0 rgba(255,255,255,0.92)",
        transition: "box-shadow 0.2s ease, border-color 0.2s ease, background-color 0.2s ease",
      },
      default: {},
    }),
  };
}

export function customerPanelVariant(c, shadowPremium, isDark, variant = "default") {
  const base = customerPanel(c, shadowPremium, isDark);
  if (variant === "soft") {
    return {
      ...base,
      borderTopWidth: 1,
      backgroundColor: isDark ? c.surfaceMuted : ALCHEMY.creamAlt,
    };
  }
  if (variant === "danger") {
    return {
      ...base,
      borderTopColor: isDark ? "rgba(248, 113, 113, 0.55)" : "rgba(220, 38, 38, 0.4)",
      borderColor: isDark ? "rgba(248, 113, 113, 0.32)" : "rgba(220, 38, 38, 0.2)",
      backgroundColor: isDark ? "rgba(127, 29, 29, 0.12)" : "rgba(220, 38, 38, 0.05)",
    };
  }
  if (variant === "interactive") {
    return {
      ...base,
      ...Platform.select({
        web: {
          ...(base.boxShadow ? { boxShadow: base.boxShadow } : {}),
          transition: "transform 0.2s ease, box-shadow 0.2s ease",
        },
        default: {},
      }),
    };
  }
  return base;
}

/**
 * Login / Register card — softer than customerPanel (no heavy gold top bar; clipped shadow on native).
 */
export function authPanel(c, shadowPremium, isDark, opts = {}) {
  const { compact = false } = opts;
  const radius = 20;
  const padH = compact ? spacing.md + 2 : spacing.xl;
  const padV = compact ? spacing.md + 4 : spacing.xl;
  const base = {
    borderRadius: radius,
    overflow: "hidden",
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: padH,
    paddingVertical: padV,
    ...(isDark
      ? {
          backgroundColor: c.surface,
          borderColor: c.border,
        }
      : {
          backgroundColor: ALCHEMY.ivory,
          borderColor: ALCHEMY.lineStrong,
        }),
    ...platformElevation({
      web: {
        boxShadow: isDark
          ? "0 16px 40px rgba(0,0,0,0.28), inset 0 1px 0 rgba(255,255,255,0.04)"
          : "0 12px 32px rgba(22, 69, 51, 0.08), inset 0 1px 0 rgba(255,255,255,0.9)",
      },
      ios: {
        shadowColor: "#3D2A12",
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: isDark ? 0.22 : 0.08,
        shadowRadius: 18,
      },
      android: { elevation: 3 },
    }),
    ...Platform.select({
      web: {
        backgroundImage: isDark
          ? undefined
          : "linear-gradient(180deg, rgba(255,255,255,0.92), rgba(255,253,250,0.98))",
      },
      default: {},
    }),
  };
  return base;
}

/**
 * Shared width constraint for customer screens (matches `ScrollView` content + headers).
 * Merge with `padding`, `paddingTop`, and `paddingBottom` as needed per screen.
 *
 * Premium UI baseline: inner pages use {@link customerInnerPageScrollContent} with `ScreenPageHeader`;
 * Home uses {@link customerPageScrollBase}; auth uses {@link authScrollContent}.
 */
export const customerContentWidth = {
  width: "100%",
  alignSelf: "center",
  maxWidth: Platform.select({ web: 1280, default: "100%" }),
};

/** Native tab bar body height (figmaforkankreg.html `.tabbar` = 66px). */
export const CUSTOMER_BOTTOM_NAV_BAR_HEIGHT = 66;

/** Bottom scroll inset when the fixed mobile-web tab bar is visible. */
export function mobileWebTabBarScrollPadding(insets = {}) {
  const safeBottom = Math.max(insets?.bottom ?? 0, 8);
  return CUSTOMER_BOTTOM_NAV_BAR_HEIGHT + spacing.lg + safeBottom;
}

/** Approximate height of figma sticky pay / buy bars above the tab bar. */
export const FIGMA_STICKY_FOOTER_HEIGHT = 140;

/** Native product sticky buy bar (single-row layout, no tab bar). */
export const NATIVE_PRODUCT_STICKY_BAR_HEIGHT = 118;

/** Web/mobile-web product sticky buy bar height. */
export const WEB_PRODUCT_STICKY_BAR_HEIGHT = 88;

/**
 * Bottom padding for scroll content: clears floating bottom nav + home indicator + breathing room.
 * @param {{ bottom?: number }} [insets] from `useSafeAreaInsets()` (native only)
 */
export function customerScrollPaddingBottom(insets = {}) {
  if (Platform.OS === "web") {
    return spacing.xl;
  }
  const safeBottom = insets?.bottom ?? 0;
  const dockFromBottom = Math.max(spacing.md, safeBottom + 6);
  return dockFromBottom + CUSTOMER_BOTTOM_NAV_BAR_HEIGHT + spacing.md;
}

/** Distance from screen bottom for fixed/sticky UI (e.g. Product CTA) so it clears the floating bottom nav. */
export function customerFloatingNavOffset(insets = {}, { mobileWebTabBar = false } = {}) {
  const safeBottom = Math.max(insets?.bottom ?? 0, 8);
  if (Platform.OS === "web") {
    if (mobileWebTabBar) {
      return safeBottom + CUSTOMER_BOTTOM_NAV_BAR_HEIGHT + spacing.sm;
    }
    return Math.max(safeBottom, spacing.md);
  }
  const dockFromBottom = Math.max(spacing.md, safeBottom + 6);
  return dockFromBottom + CUSTOMER_BOTTOM_NAV_BAR_HEIGHT + spacing.sm;
}

/** Scroll bottom inset: sticky pay bar + optional mobile-web tab bar (web checkout/cart). */
export function customerWebScrollBottomInset(insets = {}, { stickyFooter = 0, mobileWebTabBar = false } = {}) {
  let pad = spacing.xl;
  if (stickyFooter > 0) pad += stickyFooter + spacing.sm;
  if (mobileWebTabBar) pad += CUSTOMER_BOTTOM_NAV_BAR_HEIGHT + Math.max(insets?.bottom ?? 0, 8);
  return pad;
}

/** Admin / auth flows without floating customer bottom nav — home indicator + comfortable end padding. */
export function adminScrollPaddingBottom(insets = {}) {
  if (Platform.OS === "web") {
    return spacing.xl;
  }
  return (insets?.bottom ?? 0) + spacing.xl + spacing.md;
}

/**
 * Safe top inset for scroll content under status bar / web chrome.
 * @param {{ top?: number }} insets from `useSafeAreaInsets()`
 * @param {{ nativeMin?: number; webMin?: number }} [opts] override minimum padding below status bar
 */
export function customerScrollPaddingTop(insets, opts = {}) {
  const { nativeMin = spacing.md, webMin = spacing.md, owner = "scroll" } = opts;
  if (Platform.OS === "web") {
    return getKankregChromeTop(insets) + Math.max(insets?.top ?? 0, webMin);
  }
  /** External header (e.g. home) already applied safe-area — scroll only needs a breath. */
  if (owner === "external") {
    return spacing.xs;
  }
  return (insets?.top ?? 0) + nativeMin;
}

/** Bottom scroll inset when a sticky pay/buy bar floats above the tab bar. */
export function customerScrollPaddingBottomWithSticky(insets = {}, footerHeight = FIGMA_STICKY_FOOTER_HEIGHT) {
  return customerScrollPaddingBottom(insets) + Math.max(0, footerHeight);
}

/**
 * Product detail scroll padding — no floating tab bar; only sticky buy bar + safe area.
 * @param {{ bottom?: number }} [insets]
 */
export function customerProductScrollPaddingBottom(
  insets = {},
  footerHeight = NATIVE_PRODUCT_STICKY_BAR_HEIGHT
) {
  const safeBottom = Math.max(insets?.bottom ?? 0, 8);
  return safeBottom + Math.max(0, footerHeight) + spacing.lg;
}

/** Shared sticky-top offset for panels pinned below the fixed web header. */
export function customerWebStickyTop(insets, extra = 0) {
  if (Platform.OS !== "web") return 0;
  return getKankregChromeTop(insets) + 12 + Math.max(0, extra);
}

/**
 * Standard `ScrollView` content for customer pages (width cap + horizontal padding + bottom inset).
 * Merge with `{ paddingTop: … }` and optional `{ paddingBottom: … }` when a screen needs extra room.
 */
export const customerPageScrollBase = {
  /** Horizontal gutters on web are set in `KankregScrollPage` via `pageGutterClamp`. */
  paddingHorizontal: Platform.select({
    web: 0,
    default: spacing.md + 2,
  }),
  width: "100%",
  alignSelf: "center",
  maxWidth: Platform.select({ web: 1280, default: "100%" }),
};

/** Vertical rhythm between major blocks on inner pages (pairs with `ScreenPageHeader` flush bottom margin). */
export const CUSTOMER_INNER_PAGE_GAP = spacing.lg;

/**
 * Standard `MotionScrollView` / `ScrollView` content for logged-in inner pages: gutters, safe padding,
 * and consistent gaps between header, panels, and footer. Pass `extra` to override (e.g. custom paddingBottom).
 * @param {{ top?: number; bottom?: number }} insets from `useSafeAreaInsets()`
 * @param {object} [extra] merged last (e.g. `{ paddingBottom: … }`, `{ gap: 0 }`)
 */
export function customerInnerPageScrollContent(insets, extra = {}) {
  const {
    topInsetOwner = "scroll",
    topInsetMin = spacing.xs,
    flushNativeGutter = Platform.OS !== "web",
    stickyFooterExtra = 0,
    compactWebGap = false,
    ...rest
  } = extra;
  const bottomPad =
    stickyFooterExtra > 0
      ? Platform.OS === "web"
        ? customerWebScrollBottomInset(insets, { stickyFooter: stickyFooterExtra })
        : customerScrollPaddingBottomWithSticky(insets, stickyFooterExtra)
      : customerScrollPaddingBottom(insets);

  return [
    customerPageScrollBase,
    Platform.OS !== "web" && flushNativeGutter ? { paddingHorizontal: 0 } : null,
    {
      paddingTop: customerScrollPaddingTop(insets, {
        nativeMin: topInsetMin,
        owner: topInsetOwner,
      }),
      paddingBottom: bottomPad,
      gap: Platform.select({
        web: compactWebGap ? CUSTOMER_INNER_PAGE_GAP : sectionStackGap,
        default: CUSTOMER_INNER_PAGE_GAP,
      }),
      ...Platform.select({
        web: { flexGrow: 1 },
        default: {},
      }),
      ...rest,
    },
  ];
}

/** Admin tool screens: same gutters + gap as customer inner pages, but bottom padding clears home indicator only (no floating nav). */
export function adminInnerPageScrollContent(insets, extra = {}) {
  return [
    customerPageScrollBase,
    {
      paddingTop: customerScrollPaddingTop(insets),
      paddingBottom: adminScrollPaddingBottom(insets),
      gap: Platform.select({ web: CUSTOMER_INNER_PAGE_GAP, default: spacing.md }),
      ...Platform.select({
        web: { flexGrow: 1 },
        default: {},
      }),
      ...extra,
    },
  ];
}

/**
 * Scroll content for Login / Register: centered column on web with vertical breathing room below header.
 */
/** Auth scroll padding — pass `pageGutter` from `useKankregLayout().pageGutterClamp` on native. */
export function getAuthScrollContent(pageGutter = spacing.md + 2) {
  return {
    alignItems: "center",
    width: "100%",
    ...Platform.select({
      web: {
        maxWidth: layout.maxContentWidth + 72,
        alignSelf: "center",
        paddingHorizontal: pageGutter,
        paddingTop: spacing.lg,
        paddingBottom: spacing.xxl + 8,
        flexGrow: 1,
        minHeight: `calc(100dvh - ${WEB_CHROME_TOP}px)`,
        justifyContent: "flex-start",
      },
      default: {
        paddingHorizontal: pageGutter,
        paddingTop: spacing.sm + 4,
        paddingBottom: spacing.xl,
      },
    }),
  };
}

/** @deprecated Use getAuthScrollContent(pageGutter) */
export const authScrollContent = getAuthScrollContent();

/** Removes default browser focus ring on web inputs (custom borders remain). */
export const inputOutlineWeb = Platform.select({
  web: { outlineStyle: "none", outlineWidth: 0 },
  default: {},
});

/** ScrollView / KeyboardAvoidingView on top of `CustomerScreenShell` (no flat background). */
export const customerScrollFill = {
  flex: 1,
  width: "100%",
};

export { sectionStackGap };
