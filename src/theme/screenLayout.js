import { Platform } from "react-native";
import { adminPanel } from "./adminLayout";
import { ALCHEMY, HERITAGE } from "./customerAlchemy";
import { container, layout, semanticRadius, spacing } from "./tokens";
import { WEB_HEADER_HEIGHT, WEB_STICKY_TOP_OFFSET } from "./web";

export const CUSTOMER_PAGE_MAX_WIDTH = Platform.select({ web: layout.maxContentWidth + 24, default: "100%" });
export const ADMIN_PAGE_MAX_WIDTH = Platform.select({ web: layout.maxContentWidth + 96, default: "100%" });

/**
 * Customer-facing panels: warm card in light mode, theme surface in dark — aligned with Home catalog cards.
 * @param {boolean} isDark from `useTheme()`
 */
export function customerPanel(c, shadowPremium, isDark) {
  const admin = adminPanel(c, shadowPremium, isDark);
  return {
    ...admin,
    borderRadius: semanticRadius.panel,
    borderTopWidth: 1,
    padding: spacing.md + 2,
    ...(isDark
      ? {
          backgroundColor: c.surfaceElevated || c.surface,
          borderColor: c.border,
          borderTopColor: "rgba(248, 113, 113, 0.4)",
        }
      : {
          backgroundColor: ALCHEMY.ivory,
          borderColor: ALCHEMY.pillInactive,
          borderTopColor: HERITAGE.amberMid,
        }),
    ...Platform.select({
      web: {
        backgroundImage: isDark
          ? undefined
          : "linear-gradient(180deg, rgba(255,255,255,0.98), rgba(250,248,244,0.98))",
        boxShadow: isDark
          ? "0 14px 30px rgba(0,0,0,0.24), inset 0 1px 0 rgba(255,255,255,0.04)"
          : "0 10px 22px rgba(15, 23, 42, 0.06), inset 0 1px 0 rgba(255,255,255,0.94)",
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
 * Shared width constraint for customer screens (matches `ScrollView` content + headers).
 * Merge with `padding`, `paddingTop`, and `paddingBottom` as needed per screen.
 *
 * Premium UI baseline: inner pages use {@link customerInnerPageScrollContent} with `ScreenPageHeader`;
 * Home uses {@link customerPageScrollBase}; auth uses {@link authScrollContent}.
 */
export const customerContentWidth = {
  width: "100%",
  alignSelf: "center",
  maxWidth: CUSTOMER_PAGE_MAX_WIDTH,
};

/** Inner height of floating `BottomNavBar` row (paddingVertical 10×2 + min tab ~44). */
export const CUSTOMER_BOTTOM_NAV_BAR_HEIGHT = 64;

/**
 * Bottom padding for scroll content: clears floating bottom nav + home indicator + breathing room.
 * @param {{ bottom?: number }} [insets] from `useSafeAreaInsets()` (native only)
 */
export function customerScrollPaddingBottom(insets = {}) {
  if (Platform.OS === "web") {
    return spacing.xl + spacing.sm;
  }
  const safeBottom = insets?.bottom ?? 0;
  const dockFromBottom = Math.max(spacing.md, safeBottom + 6);
  return dockFromBottom + CUSTOMER_BOTTOM_NAV_BAR_HEIGHT + spacing.md;
}

/** Distance from screen bottom for fixed/sticky UI (e.g. Product CTA) so it clears the floating bottom nav. */
export function customerFloatingNavOffset(insets = {}) {
  if (Platform.OS === "web") {
    return Math.max(insets?.bottom ?? 0, spacing.md);
  }
  const safeBottom = insets?.bottom ?? 0;
  const dockFromBottom = Math.max(spacing.md, safeBottom + 6);
  return dockFromBottom + CUSTOMER_BOTTOM_NAV_BAR_HEIGHT + spacing.sm;
}

/** Admin / auth flows without floating customer bottom nav — home indicator + comfortable end padding. */
export function adminScrollPaddingBottom(insets = {}) {
  if (Platform.OS === "web") {
    return spacing.xl + spacing.sm;
  }
  return (insets?.bottom ?? 0) + spacing.xl + spacing.md;
}

/**
 * Safe top inset for scroll content under status bar / web chrome.
 * @param {{ top?: number }} insets from `useSafeAreaInsets()`
 * @param {{ nativeMin?: number; webMin?: number }} [opts] override minimum padding below status bar
 */
export function customerScrollPaddingTop(insets, opts = {}) {
  const { nativeMin = spacing.sm, webMin = spacing.md } = opts;
  const floor = Platform.OS === "web" ? webMin : nativeMin;
  if (Platform.OS === "web") {
    return WEB_HEADER_HEIGHT + Math.max(insets?.top ?? 0, floor);
  }
  return Math.max(insets?.top ?? 0, floor);
}

/** Shared sticky-top offset for panels pinned below the fixed web header. */
export function customerWebStickyTop(extra = 0) {
  if (Platform.OS !== "web") return 0;
  return WEB_STICKY_TOP_OFFSET + Math.max(0, extra);
}

/**
 * Standard `ScrollView` content for customer pages (width cap + horizontal padding + bottom inset).
 * Merge with `{ paddingTop: … }` and optional `{ paddingBottom: … }` when a screen needs extra room.
 */
export const customerPageScrollBase = {
  /** Balanced gutters: generous on web for an editorial, premium layout. */
  paddingHorizontal: Platform.select({
    web: Math.max(spacing.md + 4, container.gutter.desktop - 20),
    default: spacing.lg,
  }),
  width: "100%",
  alignSelf: "center",
  maxWidth: CUSTOMER_PAGE_MAX_WIDTH,
};

export const adminPageScrollBase = {
  paddingHorizontal: Platform.select({
    web: Math.max(spacing.md + 6, container.gutter.desktop - 12),
    default: spacing.lg,
  }),
  width: "100%",
  alignSelf: "center",
  maxWidth: ADMIN_PAGE_MAX_WIDTH,
};

/** Vertical rhythm between major blocks on inner pages (pairs with `ScreenPageHeader` flush bottom margin). */
export const CUSTOMER_INNER_PAGE_GAP = spacing.md + 2;

/**
 * Standard `MotionScrollView` / `ScrollView` content for logged-in inner pages: gutters, safe padding,
 * and consistent gaps between header, panels, and footer. Pass `extra` to override (e.g. custom paddingBottom).
 * @param {{ top?: number; bottom?: number }} insets from `useSafeAreaInsets()`
 * @param {object} [extra] merged last (e.g. `{ paddingBottom: … }`, `{ gap: 0 }`)
 */
export function customerInnerPageScrollContent(insets, extra = {}) {
  return [
    customerPageScrollBase,
    {
      paddingTop: customerScrollPaddingTop(insets),
      paddingBottom: customerScrollPaddingBottom(insets),
      gap: CUSTOMER_INNER_PAGE_GAP,
      ...Platform.select({
        web: { flexGrow: 1 },
        default: {},
      }),
      ...extra,
    },
  ];
}

/** Admin tool screens: same gutters + gap as customer inner pages, but bottom padding clears home indicator only (no floating nav). */
export function adminInnerPageScrollContent(insets, extra = {}) {
  return [
    adminPageScrollBase,
    {
      paddingTop: customerScrollPaddingTop(insets),
      paddingBottom: adminScrollPaddingBottom(insets),
      gap: CUSTOMER_INNER_PAGE_GAP,
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
export const authScrollContent = {
  alignItems: "center",
  ...Platform.select({
    web: {
      width: "100%",
      maxWidth: CUSTOMER_PAGE_MAX_WIDTH,
      alignSelf: "center",
      paddingHorizontal: Math.max(spacing.md + 4, container.gutter.desktop - 20),
      paddingTop: spacing.md + 6,
      paddingBottom: spacing.xxl,
      flexGrow: 1,
      minHeight: `calc(100dvh - ${WEB_HEADER_HEIGHT}px)`,
      justifyContent: "center",
    },
    default: {
      padding: spacing.lg + 2,
      paddingBottom: spacing.xxl,
    },
  }),
};

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
