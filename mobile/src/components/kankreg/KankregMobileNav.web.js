import React, { useEffect } from "react";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "../../context/ThemeContext";
import { ALCHEMY } from "../../theme/customerAlchemy";
import { FONT_HEADING, FONT_HEADING_SEMI } from "../../theme/typographyRoles";
import { KANKREG_PALETTE } from "../../theme/kankregWeb";
import { fonts, icon, radius, spacing, typography } from "../../theme/tokens";
import { WEB_Z_INDEX } from "../../theme/web";
import { platformShadow } from "../../theme/shadowPlatform";
import GoldHairline from "../ui/GoldHairline";
import KankregBrandMark from "./KankregBrandMark";
import { routeMatchesNav } from "./kankregNav";
import { KANKREG_HEADER } from "../../content/appContent";

const NAV_ICONS = {
  Home: "home-outline",
  Shop: "storefront-outline",
  About: "information-circle-outline",
  Product: "cube-outline",
  Cart: "bag-outline",
  Checkout: "card-outline",
  Orders: "receipt-outline",
  Rewards: "gift-outline",
  Account: "person-outline",
  Admin: "shield-checkmark-outline",
  Delivery: "bicycle-outline",
};

const NAV_HINTS = {
  Home: "Discover Zeevan",
  Shop: "Browse the catalog",
  About: "Our story & craft",
  Product: "Featured item",
  Cart: "Your bag",
  Checkout: "Complete order",
  Orders: "Track deliveries",
  Rewards: "Redeem points",
  Account: "Profile & settings",
  Admin: "Store dashboard",
  Delivery: "Partner runs",
};

/** Full-screen mobile menu on web — no Reanimated (lean web bundle). */
export default function KankregMobileNav({
  open,
  items,
  currentRouteName,
  onClose,
  isDark: isDarkProp,
  isAuthenticated,
  user,
  onSignIn,
  onAccount,
  onLogoPress,
  totalItems = 0,
}) {
  const { isDark: themeDark, colors: c } = useTheme();
  const isDark = isDarkProp ?? themeDark;
  const insets = useSafeAreaInsets();

  useEffect(() => {
    if (!open || typeof document === "undefined") return undefined;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  if (!open) return null;

  const displayName = String(user?.name || user?.email || "").trim();
  const panelShadow = platformShadow({
    web: {
      boxShadow: isDark
        ? "0 0 80px rgba(0,0,0,0.55)"
        : "0 0 60px rgba(22, 69, 51, 0.12)",
    },
    ios: { shadowOpacity: 0 },
    android: { elevation: 0 },
  });

  return (
    <View style={styles.portal} pointerEvents="box-none">
      <View style={styles.backdrop} pointerEvents="auto">
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel={KANKREG_HEADER.menuCloseA11y}
        />
      </View>

      <View
        style={[
          styles.sheet,
          panelShadow,
          {
            paddingTop: Math.max(insets.top, spacing.sm) + spacing.sm,
            paddingBottom: Math.max(insets.bottom, spacing.md) + spacing.md,
          },
          isDark ? styles.sheetDark : styles.sheetLight,
        ]}
      >
        <LinearGradient
          colors={[ALCHEMY.goldBright, ALCHEMY.gold, ALCHEMY.goldDeep]}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={styles.topAccent}
          pointerEvents="none"
        />

        <LinearGradient
          colors={
            isDark
              ? ["rgba(52, 211, 153, 0.08)", "rgba(15, 13, 11, 0)", "rgba(15, 13, 11, 0)"]
              : ["rgba(255,255,255,0.55)", "rgba(255,252,246,0.12)", "rgba(255,248,234,0.28)"]
          }
          style={StyleSheet.absoluteFillObject}
          pointerEvents="none"
        />

        <View style={styles.headerRow}>
          <KankregBrandMark
            onPress={() => {
              onLogoPress?.();
              onClose?.();
            }}
            compact
          />
          <Pressable
            onPress={onClose}
            style={({ pressed, hovered }) => [
              styles.closeBtn,
              isDark && styles.closeBtnDark,
              (pressed || (Platform.OS === "web" && hovered)) && styles.closeBtnPressed,
            ]}
            accessibilityRole="button"
            accessibilityLabel={KANKREG_HEADER.menuCloseA11y}
          >
            <Ionicons name="close" size={22} color={isDark ? KANKREG_PALETTE.paper : KANKREG_PALETTE.ink} />
          </Pressable>
        </View>

        <View style={styles.identityBlock}>
          {isAuthenticated && displayName ? (
            <>
              <Text style={[styles.greeting, { color: isDark ? c.textMuted : KANKREG_PALETTE.inkFaint }]}>
                Welcome back
              </Text>
              <Text style={[styles.userName, { color: isDark ? c.textPrimary : KANKREG_PALETTE.ink }]} numberOfLines={1}>
                {displayName}
              </Text>
            </>
          ) : (
            <Text style={[styles.guestTitle, { color: isDark ? c.textPrimary : KANKREG_PALETTE.ink }]}>
              Explore Zeevan
            </Text>
          )}
          <Text style={[styles.guestSub, { color: isDark ? c.textSecondary : KANKREG_PALETTE.inkSoft }]}>
            Premium A2 ghee & pantry — delivered fresh.
          </Text>
        </View>

        <GoldHairline marginVertical={spacing.md} withDot={false} variant="subtle" />

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {items.map((item) => {
            const active = routeMatchesNav(item.key, currentRouteName);
            const navIcon = NAV_ICONS[item.key] || "ellipse-outline";
            const hint = NAV_HINTS[item.key] || "";
            const showCartBadge = item.key === "Cart" && totalItems > 0;

            return (
              <View key={item.key}>
                <Pressable
                  onPress={() => {
                    item.onPress();
                    onClose?.();
                  }}
                  style={({ pressed, hovered }) => [
                    styles.navCard,
                    isDark ? styles.navCardDark : styles.navCardLight,
                    active && (isDark ? styles.navCardActiveDark : styles.navCardActive),
                    (pressed || (Platform.OS === "web" && hovered)) && styles.navCardPressed,
                  ]}
                  accessibilityRole="button"
                  accessibilityState={{ selected: active }}
                >
                  {active ? <View style={[styles.activeBar, isDark && styles.activeBarDark]} /> : null}
                  <View
                    style={[
                      styles.navIconWrap,
                      active && (isDark ? styles.navIconWrapActiveDark : styles.navIconWrapActive),
                    ]}
                  >
                    <Ionicons
                      name={navIcon}
                      size={icon.md}
                      color={
                        active
                          ? isDark
                            ? ALCHEMY.goldBright
                            : KANKREG_PALETTE.greenDeep
                          : isDark
                            ? "#c8bdaf"
                            : KANKREG_PALETTE.inkSoft
                      }
                    />
                  </View>
                  <View style={styles.navCopy}>
                    <Text
                      style={[
                        styles.navLabel,
                        isDark && styles.navLabelDark,
                        active && (isDark ? styles.navLabelActiveDark : styles.navLabelActive),
                      ]}
                    >
                      {item.label}
                    </Text>
                    {hint ? (
                      <Text style={[styles.navHint, { color: isDark ? c.textMuted : KANKREG_PALETTE.inkFaint }]}>
                        {hint}
                      </Text>
                    ) : null}
                  </View>
                  {showCartBadge ? (
                    <View style={styles.cartBadge}>
                      <Text style={styles.cartBadgeText}>{totalItems > 9 ? "9+" : String(totalItems)}</Text>
                    </View>
                  ) : (
                    <Ionicons
                      name="chevron-forward"
                      size={16}
                      color={isDark ? "#78716c" : KANKREG_PALETTE.inkFaint}
                    />
                  )}
                </Pressable>
              </View>
            );
          })}
        </ScrollView>

        <View style={styles.footer}>
          <Pressable
            onPress={() => {
              if (isAuthenticated) onAccount?.();
              else onSignIn?.();
              onClose?.();
            }}
            style={({ pressed, hovered }) => [
              styles.ctaBtn,
              (pressed || (Platform.OS === "web" && hovered)) && { opacity: 0.92 },
            ]}
            accessibilityRole="button"
            accessibilityLabel={isAuthenticated ? KANKREG_HEADER.accountLabel : KANKREG_HEADER.signInLabel}
          >
            <LinearGradient
              colors={[KANKREG_PALETTE.greenDeep, "#1a2820"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.ctaGrad}
            >
              <Ionicons
                name={isAuthenticated ? "person" : "log-in-outline"}
                size={icon.sm}
                color={KANKREG_PALETTE.paper}
              />
              <Text style={styles.ctaText}>
                {isAuthenticated ? KANKREG_HEADER.accountLabel : KANKREG_HEADER.signInLabel}
              </Text>
            </LinearGradient>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  portal: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: WEB_Z_INDEX.dropdown,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(15, 13, 11, 0.52)",
    backdropFilter: "blur(6px)",
    WebkitBackdropFilter: "blur(6px)",
  },
  sheet: {
    flex: 1,
    width: "100%",
    paddingHorizontal: spacing.md + 4,
    overflow: "hidden",
  },
  sheetLight: {
    backgroundColor: KANKREG_PALETTE.paper,
  },
  sheetDark: {
    backgroundColor: "#0f0d0b",
  },
  topAccent: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 2.5,
    zIndex: 2,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    zIndex: 1,
    marginBottom: spacing.lg,
  },
  closeBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(31, 92, 71, 0.14)",
    backgroundColor: KANKREG_PALETTE.card,
    cursor: "pointer",
  },
  closeBtnDark: {
    backgroundColor: "rgba(255,255,255,0.06)",
    borderColor: "rgba(255,255,255,0.1)",
  },
  closeBtnPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.96 }],
  },
  identityBlock: {
    zIndex: 1,
    gap: 4,
    paddingHorizontal: 2,
  },
  greeting: {
    fontFamily: fonts.semibold,
    fontSize: typography.caption,
    letterSpacing: 0.6,
    textTransform: "uppercase",
  },
  userName: {
    fontFamily: FONT_HEADING,
    fontSize: typography.h2,
    letterSpacing: -0.4,
  },
  guestTitle: {
    fontFamily: FONT_HEADING,
    fontSize: typography.h2,
    letterSpacing: -0.35,
  },
  guestSub: {
    fontFamily: fonts.medium,
    fontSize: typography.bodySmall,
    lineHeight: 22,
    marginTop: 2,
    maxWidth: 320,
  },
  scroll: {
    flex: 1,
    zIndex: 1,
  },
  scrollContent: {
    gap: spacing.sm,
    paddingBottom: spacing.md,
  },
  navCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm + 2,
    paddingVertical: spacing.sm + 4,
    paddingHorizontal: spacing.sm + 2,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: "hidden",
    position: "relative",
    cursor: "pointer",
  },
  navCardLight: {
    backgroundColor: "rgba(255, 253, 249, 0.88)",
    borderColor: "rgba(22, 69, 51, 0.08)",
  },
  navCardDark: {
    backgroundColor: "rgba(255,255,255,0.04)",
    borderColor: "rgba(255,255,255,0.07)",
  },
  navCardActive: {
    backgroundColor: "rgba(31, 92, 71, 0.07)",
    borderColor: "rgba(31, 92, 71, 0.18)",
  },
  navCardActiveDark: {
    backgroundColor: "rgba(52, 211, 153, 0.1)",
    borderColor: "rgba(52, 211, 153, 0.22)",
  },
  navCardPressed: {
    opacity: 0.92,
    transform: [{ scale: 0.99 }],
  },
  activeBar: {
    position: "absolute",
    left: 0,
    top: 10,
    bottom: 10,
    width: 3,
    borderRadius: 2,
    backgroundColor: ALCHEMY.gold,
  },
  activeBarDark: {
    backgroundColor: ALCHEMY.goldBright,
  },
  navIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(31, 92, 71, 0.07)",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(31, 92, 71, 0.1)",
  },
  navIconWrapActive: {
    backgroundColor: "rgba(31, 92, 71, 0.12)",
    borderColor: "rgba(31, 92, 71, 0.2)",
  },
  navIconWrapActiveDark: {
    backgroundColor: "rgba(52, 211, 153, 0.12)",
    borderColor: "rgba(52, 211, 153, 0.22)",
  },
  navCopy: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  navLabel: {
    fontFamily: FONT_HEADING_SEMI,
    fontSize: typography.body,
    color: KANKREG_PALETTE.ink,
  },
  navLabelDark: {
    color: KANKREG_PALETTE.paper,
  },
  navLabelActive: {
    color: KANKREG_PALETTE.greenDeep,
  },
  navLabelActiveDark: {
    color: ALCHEMY.goldBright,
  },
  navHint: {
    fontFamily: fonts.medium,
    fontSize: typography.caption,
  },
  cartBadge: {
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    paddingHorizontal: 6,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: KANKREG_PALETTE.greenDeep,
  },
  cartBadgeText: {
    fontFamily: fonts.bold,
    fontSize: 11,
    color: "#fff",
  },
  footer: {
    zIndex: 1,
    paddingTop: spacing.sm,
  },
  ctaBtn: {
    borderRadius: radius.pill,
    overflow: "hidden",
    boxShadow: "0 12px 28px rgba(22, 69, 51, 0.28)",
    cursor: "pointer",
  },
  ctaGrad: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    paddingVertical: spacing.sm + 6,
    paddingHorizontal: spacing.lg,
  },
  ctaText: {
    fontFamily: fonts.bold,
    fontSize: typography.bodySmall,
    color: KANKREG_PALETTE.paper,
    letterSpacing: 0.3,
  },
});
