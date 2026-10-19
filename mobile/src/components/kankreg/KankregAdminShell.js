import React, { useMemo } from "react";
import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useKankregLayout } from "../../theme/kankregBreakpoints";
import { Ionicons } from "@expo/vector-icons";
import { ADMIN_NAV_FLAT, ADMIN_NAV_GROUPS } from "../../content/adminNav";
import { KANKREG_PALETTE } from "../../theme/kankregWeb";
import { FONT_HEADING } from "../../theme/typographyRoles";
import { platformElevation } from "../../theme/platformStyles";
import { useTheme } from "../../context/ThemeContext";
import { useAuth } from "../../context/AuthContext";
import { fonts, spacing } from "../../theme/tokens";
import { adminShellMainPadding, getAdminChrome } from "../../theme/adminLayout";
import AdminBackLink from "../admin/AdminBackLink";
import AdminMobileNav from "../admin/AdminMobileNav";
import AdminNavIcon from "../admin/AdminNavIcon";
import AdminTopBar from "../admin/AdminTopBar";

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

  const adminInitial = String(user?.name || user?.email || "A")
    .trim()
    .charAt(0)
    .toUpperCase();

  function renderLink(link, row = false) {
    const on = current === link.key;
    return (
      <Pressable
        key={link.key}
        onPress={() => stackNav.navigate(link.key)}
        accessibilityLabel={`${link.label}. ${link.hint || ""}`}
        style={[
          styles.sideLink,
          row && styles.sideLinkRow,
          on && {
            backgroundColor: palette.linkOnBg,
            borderWidth: 1,
            borderColor: palette.linkOnBorder,
            ...platformElevation({
              web: { boxShadow: "0 2px 8px rgba(25, 20, 15, 0.08)" },
              ios: {
                shadowColor: "#19140f",
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.06,
                shadowRadius: 4,
              },
              android: { elevation: 1 },
            }),
          },
        ]}
        accessibilityRole="button"
        accessibilityState={{ selected: on }}
      >
        <AdminNavIcon
          imageKey={link.image}
          icon={link.icon}
          tone={link.tone}
          size={row ? 32 : 38}
          compact={row}
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
      </Pressable>
    );
  }

  const sidebarContent = showSidebar ? (
    <View style={[styles.side, { backgroundColor: palette.sideBg }]}>
      <View style={styles.brandRow}>
        <View style={styles.brandDot} />
        <Text style={[styles.brand, { color: palette.brand }]}>Zeevan</Text>
      </View>
      <Text style={styles.badge}>ADMIN CONSOLE</Text>
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
        style={styles.exitStore}
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
          style={styles.exitStoreRow}
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
            headerRight={headerRight}
            compact={isPhone}
            onNotifications={() => stackNav.navigate("AdminNotifications")}
          />
        </View>

        {showMobileNav ? (
          <View style={isPhone ? { paddingHorizontal: pageGutter } : styles.mobileNavWrap}>
            <AdminMobileNav
              groups={NAV_GROUPS}
              current={current}
              onNavigate={(key) => stackNav.navigate(key)}
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
    overflow: "hidden",
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
    width: Platform.select({ web: 268, default: 224 }),
    paddingVertical: 22,
    paddingHorizontal: 14,
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
    paddingVertical: 11,
    paddingHorizontal: 12,
    marginBottom: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(232,200,90,0.32)",
    backgroundColor: "rgba(232,200,90,0.1)",
    ...Platform.select({
      web: { cursor: "pointer", transition: "background-color 0.12s ease" },
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
    gap: 9,
    paddingHorizontal: 10,
    marginBottom: 4,
  },
  brandDot: {
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: KANKREG_PALETTE.goldBright,
    ...Platform.select({
      web: { boxShadow: "0 0 0 3px rgba(232,200,90,0.18)" },
      default: {},
    }),
  },
  brand: {
    fontFamily: FONT_HEADING,
    fontSize: 22,
    fontWeight: "600",
    letterSpacing: -0.3,
  },
  badge: {
    fontSize: 9,
    letterSpacing: 2.4,
    color: KANKREG_PALETTE.goldBright,
    paddingHorizontal: 10,
    marginBottom: 20,
    fontFamily: fonts.bold,
  },
  grp: {
    fontSize: 9,
    letterSpacing: 1.7,
    textTransform: "uppercase",
    paddingHorizontal: 12,
    paddingTop: 16,
    paddingBottom: 7,
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
    gap: 11,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 14,
    marginVertical: 2,
    ...Platform.select({
      web: { cursor: "pointer", transition: "background-color 0.12s ease, border-color 0.12s ease" },
      default: {},
    }),
  },
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
  sideLinkHint: {
    marginTop: 1,
    fontSize: 10,
    color: "#8a8074",
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
    maxWidth: 1320,
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
