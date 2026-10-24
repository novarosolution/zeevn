import React, { useMemo } from "react";
import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useKankregLayout } from "../../theme/kankregBreakpoints";
import { Ionicons } from "@expo/vector-icons";
import { ADMIN_NAV_FLAT, ADMIN_NAV_GROUPS, openAdminNavLink } from "../../content/adminNav";
import { KANKREG_PALETTE } from "../../theme/kankregWeb";
import { FONT_HEADING } from "../../theme/typographyRoles";
import { useTheme } from "../../context/ThemeContext";
import { useAuth } from "../../context/AuthContext";
import { fonts, spacing } from "../../theme/tokens";
import { adminShellMainPadding, getAdminChrome } from "../../theme/adminLayout";
import AdminBackLink from "../admin/AdminBackLink";
import AdminMobileNav from "../admin/AdminMobileNav";
import AdminNavIcon from "../admin/AdminNavIcon";
import AdminStoreStatusChip from "../admin/AdminStoreStatusChip";
import AdminTopBar from "../admin/AdminTopBar";
import { useAdminDesk } from "../../services/adminDeskStore";

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
        style={({ pressed }) => [
          styles.sideLink,
          row && styles.sideLinkRow,
          on && { backgroundColor: palette.linkOnBg },
          pressed && styles.sideLinkPressed,
        ]}
        accessibilityRole="button"
        accessibilityState={{ selected: on }}
      >
        <AdminNavIcon
          icon={link.icon}
          size={row ? 28 : 32}
          compact
          onInk
          active={on}
        />
        <View style={styles.sideLinkCopy}>
          <Text style={[styles.sideLinkText, { color: palette.linkMuted }, on && styles.sideLinkTextOn]}>
            {link.label}
          </Text>
          {!row && link.hint ? (
            <Text style={styles.sideLinkHint} numberOfLines={1}>
              {link.hint}
            </Text>
          ) : null}
        </View>
        {renderBadge(link)}
      </Pressable>
    );
  }

  const sidebarContent = showSidebar ? (
    <View style={[styles.side, { backgroundColor: palette.sideBg }]}>
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
        <Ionicons name="storefront-outline" size={15} color={KANKREG_PALETTE.goldBright} />
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
          <Ionicons name="storefront-outline" size={14} color={KANKREG_PALETTE.goldBright} />
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
    width: Platform.select({ web: 248, default: 224 }),
    paddingVertical: 20,
    paddingHorizontal: 12,
    flexDirection: "column",
    minHeight: Platform.OS === "web" ? "100vh" : undefined,
    ...Platform.select({
      web: {
        position: "sticky",
        top: 0,
        alignSelf: "flex-start",
        height: "100vh",
        borderRightWidth: 1,
        borderRightColor: "rgba(255,255,255,0.06)",
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
    fontFamily: fonts.semibold,
    color: KANKREG_PALETTE.goldBright,
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
    fontFamily: FONT_HEADING,
    fontSize: 18,
    fontWeight: "600",
    color: "#141810",
    letterSpacing: -0.4,
  },
  brandCopy: { minWidth: 0 },
  brand: {
    fontFamily: FONT_HEADING,
    fontSize: 18,
    fontWeight: "600",
    letterSpacing: -0.35,
    lineHeight: 20,
  },
  badge: {
    fontSize: 11,
    letterSpacing: 0.2,
    color: "rgba(246, 241, 228, 0.42)",
    fontFamily: fonts.medium,
    marginTop: 1,
  },
  grp: {
    fontSize: 10,
    letterSpacing: 0.8,
    textTransform: "uppercase",
    paddingHorizontal: 12,
    paddingTop: 14,
    paddingBottom: 6,
    fontFamily: fonts.semibold,
  },
  brandRowLabel: {
    fontFamily: FONT_HEADING,
    fontSize: 15,
    color: KANKREG_PALETTE.goldBright,
    paddingHorizontal: 10,
    marginRight: 4,
    flexShrink: 0,
  },
  sideLink: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 7,
    paddingHorizontal: 10,
    borderRadius: 11,
    marginVertical: 1,
    ...Platform.select({
      web: { cursor: "pointer", transition: "transform 100ms ease-out, background-color 100ms ease-out" },
      default: {},
    }),
  },
  sideLinkPressed: { transform: [{ scale: 0.97 }] },
  sideLinkRow: { marginVertical: 0, marginHorizontal: 4, paddingVertical: 6 },
  sideLinkCopy: { flex: 1, minWidth: 0 },
  sideLinkText: {
    fontSize: 13.5,
    fontFamily: fonts.medium,
  },
  sideLinkTextOn: {
    color: KANKREG_PALETTE.goldBright,
    fontFamily: fonts.semibold,
  },
  badgeWrap: { flexDirection: "row", alignItems: "center", gap: 5 },
  attentionDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: "#E5604A" },
  navBadge: { minWidth: 20, height: 20, paddingHorizontal: 6, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  navBadgeGold: { backgroundColor: KANKREG_PALETTE.goldBright },
  navBadgeRed: { backgroundColor: "#E5604A" },
  navBadgeText: { fontSize: 11, color: "#1B1608", fontFamily: fonts.bold },
  navBadgeTextRed: { color: "#FFFFFF" },
  sideLinkHint: {
    marginTop: 1,
    fontSize: 10,
    color: "rgba(246, 241, 228, 0.34)",
    fontFamily: fonts.regular,
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
    fontFamily: FONT_HEADING,
    fontSize: 14,
    color: "#fff",
  },
  meText: { flex: 1, minWidth: 0 },
  meName: {
    fontSize: 12.5,
    fontFamily: fonts.semibold,
  },
  meEmail: {
    fontSize: 10,
    fontFamily: fonts.regular,
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
});
