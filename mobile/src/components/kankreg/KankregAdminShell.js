import React, { useEffect, useMemo } from "react";
import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useIsFocused } from "@react-navigation/native";
import { useKankregLayout } from "../../theme/kankregBreakpoints";
import { Ionicons } from "@expo/vector-icons";
import { ADMIN_NAV_FLAT, ADMIN_NAV_GROUPS, openAdminNavLink } from "../../content/adminNav";
import { ADMIN_NEW_ORDER } from "../../content/adminContent";
import { KANKREG_PALETTE } from "../../theme/kankregWeb";
import { useTheme } from "../../context/ThemeContext";
import { useAuth } from "../../context/AuthContext";
import { spacing } from "../../theme/tokens";
import { ADMIN_FONT, adminShellMainPadding, getAdminChrome } from "../../theme/adminLayout";
import AdminBackLink from "../admin/AdminBackLink";
import { AdminDialog } from "../admin/AdminDialog";
import AdminMobileNav from "../admin/AdminMobileNav";
import AdminNavIcon from "../admin/AdminNavIcon";
import AdminStoreStatusChip from "../admin/AdminStoreStatusChip";
import AdminTopBar from "../admin/AdminTopBar";
import { useAdminDesk, useAdminOrderPop } from "../../services/adminDeskStore";
import { unlockAdminNewOrderSound } from "../../utils/adminNewOrderSound";

/** Re-export for screens that import groups from the shell. */
export { ADMIN_NAV_GROUPS };

const NAV_GROUPS = ADMIN_NAV_GROUPS;
const FLAT_LINKS = ADMIN_NAV_FLAT;

/** kankreg admin design board — ink sidebar + cream main + grouped nav. */
export default function KankregAdminShell({ navigation, route, title, subtitle, headerRight, children }) {
  const { useSidebarLayout, pageGutter, isXs } = useKankregLayout();
  const { colors: c, isDark } = useTheme();
  const { user } = useAuth();
  const stackNav = navigation?.getParent?.() || navigation;
  const current = route?.name || "AdminDashboard";
  const isNative = Platform.OS !== "web";
  const isPhone = isNative || isXs;
  const showSidebar = useSidebarLayout && Platform.OS === "web";
  const showTopNavStrip = !showSidebar && Platform.OS === "web" && !isXs;
  const showMobileNav = !showSidebar && !showTopNavStrip;
  const isDashboard = current === "AdminDashboard";
  const showBackLink = !isDashboard && isPhone && !showMobileNav;
  const focused = useIsFocused();

  const chrome = useMemo(() => getAdminChrome(c, isDark), [c, isDark]);
  const palette = useMemo(
    () => ({
      sideBg: chrome.sidebarBg,
      mainBg: chrome.mainBg,
      shellBg: chrome.shellBg,
      shellBorder: chrome.shellBorder,
      linkMuted: chrome.linkMuted,
      linkOnBg: chrome.linkOnBg,
      linkOnBorder: chrome.linkOnBorder,
      linkOnRail: chrome.linkOnRail,
      linkOnText: chrome.linkOnText,
      linkHover: chrome.linkHover,
      brand: chrome.brand,
      groupLabel: chrome.groupLabel,
      meName: chrome.meName,
      meEmail: chrome.meEmail,
      meBorder: chrome.meBorder,
      shellShadow: chrome.shellShadow,
    }),
    [chrome]
  );

  const { summary } = useAdminDesk();
  const { open: popOpen, waiting: waitingPop, dismiss: dismissPop } = useAdminOrderPop();
  const waiting = Number(summary?.orders?.new || waitingPop || 0);
  const liveOrders = Number(summary?.orders?.active || 0);
  useEffect(() => {
    if (Platform.OS !== "web" || typeof document === "undefined") return undefined;
    const unlock = () => unlockAdminNewOrderSound();
    document.addEventListener("pointerdown", unlock, { once: true });
    return () => document.removeEventListener("pointerdown", unlock);
  }, []);
  /** Counters on nav links: what is waiting on the team right now. */
  const badges = useMemo(() => {
    const map = {};
    if (!summary) return map;
    if (summary.orders?.new > 0) map.AdminOrders = { count: summary.orders.new, tone: "gold", dot: summary.orders.attention > 0 };
    else if (summary.orders?.attention > 0) map.AdminOrders = { count: summary.orders.attention, tone: "red" };
    if (summary.returns?.pending > 0) map.AdminReturns = { count: summary.returns.pending, tone: "gold" };
    if (summary.support?.awaitingReply > 0) map.AdminSupport = { count: summary.support.awaitingReply, tone: "gold" };
    const lowStock = (summary.catalog?.lowStock || 0) + (summary.catalog?.outOfStock || 0);
    if (lowStock > 0) map.AdminInventory = { count: lowStock, tone: summary.catalog?.outOfStock > 0 ? "red" : "gold" };
    return map;
  }, [summary]);

  const adminInitial = String(user?.name || user?.email || "A")
    .trim()
    .charAt(0)
    .toUpperCase();

  function renderBadge(link) {
    const badge = badges[link.key];
    if (!badge) return null;
    const red = badge.tone === "red";
    return (
      <View style={styles.badgeWrap}>
        {badge.dot ? <View style={styles.attentionDot} /> : null}
        <View style={[styles.navBadge, red ? styles.navBadgeRed : styles.navBadgeGold]}>
          <Text style={[styles.navBadgeText, red && styles.navBadgeTextRed]}>{badge.count > 99 ? "99+" : badge.count}</Text>
        </View>
      </View>
    );
  }

  function renderLink(link, row = false) {
    const on = current === link.key;
    return (
      <Pressable
        key={link.key}
        onPress={() => openAdminNavLink(stackNav, link)}
        accessibilityLabel={`${link.label}. ${link.hint || ""}`}
        style={({ pressed, hovered }) => [
          styles.sideLink,
          row && styles.sideLinkRow,
          on && { backgroundColor: palette.linkOnBg },
          !on && hovered && { backgroundColor: palette.linkHover },
          pressed && styles.sideLinkPressed,
        ]}
        accessibilityRole="button"
        accessibilityState={{ selected: on }}
      >
        {on && !row ? <View style={[styles.sideRail, { backgroundColor: palette.linkOnRail }]} /> : null}
        <AdminNavIcon
          icon={link.icon}
          size={row ? 28 : 32}
          compact
          active={on}
        />
        <View style={styles.sideLinkCopy}>
          <Text style={[styles.sideLinkText, { color: on ? palette.linkOnText : palette.linkMuted }]}>
            {link.label}
          </Text>
          {!row && link.hint ? (
            <Text style={[styles.sideLinkHint, on && styles.sideLinkHintOn]} numberOfLines={1}>
              {link.hint}
            </Text>
          ) : null}
        </View>
        {renderBadge(link)}
      </Pressable>
    );
  }

  const sidebarContent = showSidebar ? (
    <View style={[styles.side, { backgroundColor: palette.sideBg, borderRightColor: palette.shellBorder }]}>
      <View style={styles.brandRow}>
        <View style={styles.brandMark}>
          <Text style={styles.brandMarkText}>Z</Text>
        </View>
        <View style={styles.brandCopy}>
          <Text style={[styles.brand, { color: palette.brand }]}>Zeevan</Text>
          <Text style={styles.badge}>Admin</Text>
        </View>
      </View>
      <ScrollView
        style={styles.sideScroll}
        contentContainerStyle={styles.sideScrollInner}
        showsVerticalScrollIndicator={false}
      >
        {NAV_GROUPS.map((group) => (
          <View key={group.key}>
            <Text style={[styles.grp, { color: palette.groupLabel }]}>{group.label}</Text>
            {group.links.map((link) => renderLink(link))}
          </View>
        ))}
      </ScrollView>
      <Pressable
        onPress={() => stackNav.navigate("Home")}
        style={({ pressed }) => [styles.exitStore, pressed && styles.sideLinkPressed]}
        accessibilityRole="button"
        accessibilityLabel="Exit to store"
      >
        <Ionicons name="storefront-outline" size={15} color={KANKREG_PALETTE.goldDeep} />
        <Text style={styles.exitStoreText}>Exit to store</Text>
      </Pressable>
      <View style={[styles.me, { borderTopColor: palette.meBorder }]}>
        <View style={styles.meAv}>
          <Text style={styles.meAvText}>{adminInitial}</Text>
        </View>
        <View style={styles.meText}>
          <Text style={[styles.meName, { color: palette.meName }]} numberOfLines={1}>
            {user?.name || "Admin"}
          </Text>
          <Text style={[styles.meEmail, { color: palette.meEmail }]} numberOfLines={1}>
            {user?.email || "admin@zeevan.com"}
          </Text>
        </View>
      </View>
    </View>
  ) : null;

  const topNavStrip = showTopNavStrip ? (
    <View style={[styles.sideRow, styles.topNavStrip, { backgroundColor: palette.sideBg }]}>
      <Text style={styles.brandRowLabel} numberOfLines={1}>
        Zeevan
      </Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.sideScrollContent}>
        {FLAT_LINKS.map((link) => renderLink(link, true))}
        <Pressable
          onPress={() => stackNav.navigate("Home")}
          style={({ pressed }) => [styles.exitStoreRow, pressed && styles.sideLinkPressed]}
          accessibilityRole="button"
          accessibilityLabel="Exit to store"
        >
          <Ionicons name="storefront-outline" size={14} color={KANKREG_PALETTE.goldDeep} />
          <Text style={styles.exitStoreText}>Store</Text>
        </Pressable>
      </ScrollView>
    </View>
  ) : null;

  return (
    <View
      style={[
        styles.shell,
        !showSidebar && styles.shellStack,
        isPhone && styles.shellPhone,
        { backgroundColor: palette.shellBg },
      ]}
    >
      {sidebarContent}
      {topNavStrip}

      <View style={[styles.main, { backgroundColor: palette.mainBg }]}>
        {showBackLink ? (
          <AdminBackLink navigation={navigation} label="Dashboard" style={styles.backLink} />
        ) : null}

        <View style={isPhone ? { paddingHorizontal: pageGutter } : null}>
          <AdminTopBar
            title={title}
            subtitle={subtitle}
            headerRight={
              <>
                <AdminStoreStatusChip compact={isPhone} onPress={() => stackNav.navigate("AdminShopDesk")} />
                {headerRight}
              </>
            }
            compact={isPhone}
            onNotifications={() => stackNav.navigate("AdminNotifications")}
          />
        </View>

        {showMobileNav ? (
          <View style={isPhone ? { paddingHorizontal: pageGutter } : styles.mobileNavWrap}>
            <AdminMobileNav
              groups={NAV_GROUPS}
              current={current}
              onNavigate={(key) => {
                const link = FLAT_LINKS.find((item) => item.key === key);
                if (link) openAdminNavLink(stackNav, link);
                else stackNav.navigate(key);
              }}
              onExitStore={() => stackNav.navigate("Home")}
            />
          </View>
        ) : null}

        {liveOrders > 0 ? (
          <Pressable
            onPress={() => stackNav.navigate("AdminOrders", { tab: waiting > 0 ? "new" : "active" })}
            style={[
              styles.liveBanner,
              waiting > 0 ? styles.liveBannerNeed : styles.liveBannerGoing,
              isPhone ? { marginHorizontal: pageGutter } : { marginHorizontal: adminShellMainPadding() },
            ]}
            accessibilityRole="button"
            accessibilityLabel={waiting > 0 ? ADMIN_NEW_ORDER.bannerNeed(waiting) : ADMIN_NEW_ORDER.bannerLive(liveOrders)}
          >
            <Ionicons
              name={waiting > 0 ? "notifications" : "bicycle-outline"}
              size={16}
              color={waiting > 0 ? KANKREG_PALETTE.goldDeep : KANKREG_PALETTE.greenDeep}
            />
            <Text style={styles.liveBannerText} numberOfLines={1}>
              {waiting > 0 ? ADMIN_NEW_ORDER.bannerNeed(waiting) : ADMIN_NEW_ORDER.bannerLive(liveOrders)}
              <Text style={styles.liveBannerUntil}> · {ADMIN_NEW_ORDER.bannerUntil}</Text>
            </Text>
            <Ionicons name="chevron-forward" size={14} color={KANKREG_PALETTE.inkFaint} />
          </Pressable>
        ) : null}

        <View
          style={[
            styles.content,
            isPhone ? styles.contentPhone : styles.contentWeb,
            isPhone ? { paddingHorizontal: pageGutter } : null,
          ]}
        >
          {children}
        </View>
      </View>

      <AdminDialog
        visible={focused && popOpen && waiting > 0}
        title={ADMIN_NEW_ORDER.title}
        message={waiting === 1 ? ADMIN_NEW_ORDER.one : ADMIN_NEW_ORDER.many(waiting)}
        icon="notifications-outline"
        confirmLabel={ADMIN_NEW_ORDER.open}
        cancelLabel={ADMIN_NEW_ORDER.dismiss}
        onConfirm={() => {
          dismissPop();
          stackNav.navigate("AdminOrders", { tab: "new" });
        }}
        onCancel={dismissPop}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  shell: {
    flexDirection: "row",
    minHeight: Platform.OS === "web" ? "100vh" : undefined,
    flex: 1,
    borderRadius: 0,
    // `hidden` made the shell its own scroll container, so the sticky sidebar, top bar and map columns never stuck.
    overflow: Platform.select({ web: "visible", default: "hidden" }),
    borderWidth: 0,
    marginHorizontal: 0,
    marginBottom: 0,
    width: "100%",
    alignSelf: "stretch",
  },
  shellPhone: {
    marginHorizontal: 0,
    marginBottom: 0,
    borderRadius: 0,
    borderWidth: 0,
    flex: 1,
  },
  shellStack: { flexDirection: "column" },
  side: {
    width: Platform.select({ web: 240, default: 224 }),
    paddingVertical: 18,
    paddingHorizontal: 10,
    flexDirection: "column",
    minHeight: Platform.OS === "web" ? "100vh" : undefined,
    ...Platform.select({
      web: {
        position: "sticky",
        top: 0,
        alignSelf: "flex-start",
        height: "100vh",
        borderRightWidth: 1,
        borderRightColor: KANKREG_PALETTE.line,
      },
      default: {},
    }),
  },
  exitStore: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginBottom: 8,
    borderRadius: 10,
    ...Platform.select({
      web: { cursor: "pointer", transition: "background-color 100ms ease-out" },
      default: {},
    }),
  },
  exitStoreText: {
    fontSize: 12,
    fontFamily: ADMIN_FONT.semibold,
    color: KANKREG_PALETTE.goldDeep,
  },
  exitStoreRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginHorizontal: 4,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(232,200,90,0.28)",
    backgroundColor: "rgba(232,200,90,0.08)",
  },
  sideScroll: { flex: 1, minHeight: 0 },
  sideScrollInner: { paddingBottom: 12 },
  sideRow: { width: "100%", paddingVertical: 14 },
  topNavStrip: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 8,
  },
  sideScrollContent: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 6,
    gap: 4,
  },
  brandRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 8,
    marginBottom: 18,
  },
  brandMark: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: KANKREG_PALETTE.gold,
    alignItems: "center",
    justifyContent: "center",
  },
  brandMarkText: {
    fontFamily: ADMIN_FONT.semibold,
    fontSize: 18,
    fontWeight: "600",
    color: "#141810",
    letterSpacing: -0.4,
  },
  brandCopy: { minWidth: 0 },
  brand: {
    fontFamily: ADMIN_FONT.semibold,
    fontSize: 17,
    fontWeight: "600",
    letterSpacing: -0.3,
    lineHeight: 20,
  },
  badge: {
    fontSize: 11,
    letterSpacing: 0.2,
    color: KANKREG_PALETTE.inkFaint,
    fontFamily: ADMIN_FONT.medium,
    marginTop: 1,
  },
  grp: {
    fontSize: 10,
    letterSpacing: 0.8,
    textTransform: "uppercase",
    paddingHorizontal: 12,
    paddingTop: 14,
    paddingBottom: 6,
    fontFamily: ADMIN_FONT.semibold,
  },
  brandRowLabel: {
    fontFamily: ADMIN_FONT.semibold,
    fontSize: 15,
    color: KANKREG_PALETTE.greenDeep,
    paddingHorizontal: 10,
    marginRight: 4,
    flexShrink: 0,
  },
  sideLink: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 8,
    paddingHorizontal: 10,
    paddingLeft: 12,
    borderRadius: 12,
    marginVertical: 1,
    overflow: "hidden",
    position: "relative",
    ...Platform.select({
      web: { cursor: "pointer", transition: "transform 100ms ease-out, background-color 100ms ease-out" },
      default: {},
    }),
  },
  sideRail: {
    position: "absolute",
    left: 0,
    top: 7,
    bottom: 7,
    width: 3,
    borderRadius: 2,
  },
  sideLinkPressed: { transform: [{ scale: 0.97 }] },
  sideLinkRow: { marginVertical: 0, marginHorizontal: 4, paddingVertical: 6 },
  sideLinkCopy: { flex: 1, minWidth: 0 },
  sideLinkText: {
    fontSize: 13.5,
    fontFamily: ADMIN_FONT.medium,
  },
  sideLinkTextOn: {
    fontFamily: ADMIN_FONT.semibold,
  },
  badgeWrap: { flexDirection: "row", alignItems: "center", gap: 5 },
  attentionDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: "#E5604A" },
  navBadge: { minWidth: 20, height: 20, paddingHorizontal: 6, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  navBadgeGold: { backgroundColor: KANKREG_PALETTE.goldBright },
  navBadgeRed: { backgroundColor: "#E5604A" },
  navBadgeText: { fontSize: 11, color: "#1B1608", fontFamily: ADMIN_FONT.bold },
  navBadgeTextRed: { color: "#FFFFFF" },
  sideLinkHint: {
    marginTop: 1,
    fontSize: 10.5,
    color: KANKREG_PALETTE.inkFaint,
    fontFamily: ADMIN_FONT.regular,
  },
  sideLinkHintOn: {
    color: KANKREG_PALETTE.inkSoft,
  },
  me: {
    marginTop: "auto",
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 10,
    paddingTop: 18,
    borderTopWidth: 1,
  },
  meAv: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: KANKREG_PALETTE.goldBright,
    alignItems: "center",
    justifyContent: "center",
  },
  meAvText: {
    fontFamily: ADMIN_FONT.semibold,
    fontSize: 14,
    color: "#fff",
  },
  meText: { flex: 1, minWidth: 0 },
  meName: {
    fontSize: 12.5,
    fontFamily: ADMIN_FONT.semibold,
  },
  meEmail: {
    fontSize: 10,
    fontFamily: ADMIN_FONT.regular,
  },
  main: { flex: 1, minWidth: 0 },
  backLink: { marginBottom: spacing.xs, marginTop: spacing.xs },
  content: { flex: 1, width: "100%" },
  contentWeb: {
    paddingHorizontal: adminShellMainPadding(),
    paddingTop: spacing.md + 2,
    paddingBottom: spacing.xl + 8,
    width: "100%",
    alignSelf: "stretch",
  },
  contentPhone: {
    paddingTop: spacing.xs,
    paddingBottom: spacing.md,
  },
  mobileNavWrap: {
    paddingHorizontal: adminShellMainPadding(),
  },
  liveBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 4,
    marginBottom: 2,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    ...Platform.select({ web: { cursor: "pointer" }, default: {} }),
  },
  liveBannerNeed: {
    backgroundColor: "rgba(212, 165, 116, 0.14)",
    borderColor: "rgba(184, 136, 76, 0.32)",
  },
  liveBannerGoing: {
    backgroundColor: "rgba(85, 107, 50, 0.08)",
    borderColor: "rgba(85, 107, 50, 0.2)",
  },
  liveBannerText: {
    flex: 1,
    minWidth: 0,
    fontSize: 13,
    fontFamily: ADMIN_FONT.semibold,
    color: KANKREG_PALETTE.ink,
  },
  liveBannerUntil: {
    fontFamily: ADMIN_FONT.medium,
    color: KANKREG_PALETTE.inkFaint,
  },
});
