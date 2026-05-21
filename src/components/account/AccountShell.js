import React, { useCallback, useMemo, useRef, useState } from "react";
import {
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../context/ThemeContext";
import { useAuth } from "../../context/AuthContext";
import Badge from "../ui/Badge";
import Button from "../ui/Button";
import Card from "../ui/Card";
import {
  ACCOUNT_NAV,
  ACCOUNT_UI,
  APP_DISPLAY_NAME,
  fillPlaceholders,
} from "../../content/appContent";
import { ACCOUNT_NESTED } from "../../navigation/accountRoutes";
import { resetNavigationToHome } from "../../navigation/resetToHome";
import { FONT_DISPLAY_SEMI } from "../../theme/customerAlchemy";
import { fonts } from "../../theme/tokens";
import { headingA11yProps, srOnlyStyle } from "../../utils/a11y";
import AccountSidebarNavItem from "./interactions/AccountSidebarNavItem";
import AccountSignOutDialog from "./shared/AccountSignOutDialog";
import AccountSectionReveal from "./interactions/AccountSectionReveal";
import { APP_VIEWPORT_MIN_HEIGHT } from "../../utils/webViewport";

const TABLET_COMPACT_KEYS = new Set(["help", "notifications", "payment"]);
const SIDEBAR_WIDTH = 240;
const CONTENT_MAX_WIDTH = 880;

function initialsFromName(name) {
  const parts = String(name || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (!parts.length) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0] || ""}${parts[parts.length - 1][0] || ""}`.toUpperCase();
}

function AccountAvatarCard({ user, onEdit, compact = false }) {
  const { semanticPalette, TYPE, SPACING } = useTheme();
  const avatarUri = String(user?.avatar || "").trim();
  const displayName = String(user?.name || "Guest").trim() || "Guest";
  const email = String(user?.email || "").trim();
  const showVerified =
    user?.emailVerified === true ||
    user?.isEmailVerified === true ||
    user?.email_verified === true;

  const size = compact ? 48 : 64;

  return (
    <View style={{ marginBottom: compact ? SPACING.md : 24 }}>
      <Pressable
        onPress={onEdit}
        accessibilityRole="button"
        accessibilityLabel={ACCOUNT_UI.editProfileA11y}
        style={({ pressed }) => ({ opacity: pressed ? 0.88 : 1 })}
      >
        <View style={{ flexDirection: compact ? "row" : "column", alignItems: compact ? "center" : "flex-start", gap: compact ? SPACING.md : 12 }}>
          <View
            style={{
              width: size,
              height: size,
              borderRadius: size / 2,
              overflow: "hidden",
              backgroundColor: semanticPalette.accentSoft,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {avatarUri ? (
              <Image source={{ uri: avatarUri }} style={{ width: size, height: size }} contentFit="cover" accessibilityIgnoresInvertColors />
            ) : (
              <Text
                style={{
                  fontFamily: FONT_DISPLAY_SEMI,
                  fontSize: compact ? 16 : 20,
                  color: semanticPalette.accent,
                }}
              >
                {initialsFromName(displayName)}
              </Text>
            )}
          </View>

          <View style={{ flex: compact ? 1 : undefined, minWidth: 0 }}>
            <Text
              style={{
                fontFamily: FONT_DISPLAY_SEMI,
                fontSize: compact ? 18 : 20,
                lineHeight: compact ? 24 : 26,
                color: semanticPalette.ink,
              }}
            >
              {displayName}
            </Text>
            {email ? (
              <Text
                style={{
                  marginTop: 2,
                  fontFamily: fonts.regular,
                  fontSize: TYPE.small.fontSize,
                  lineHeight: TYPE.small.lineHeight,
                  color: semanticPalette.inkSoft,
                }}
              >
                {email}
              </Text>
            ) : null}
            {showVerified ? (
              <View style={{ marginTop: 4 }}>
                <Badge variant="brass" size="sm">
                  {ACCOUNT_UI.verifiedBadge}
                </Badge>
              </View>
            ) : null}
          </View>

          {compact ? (
            <Ionicons name="chevron-forward" size={18} color={semanticPalette.inkMuted} />
          ) : null}
        </View>
      </Pressable>
    </View>
  );
}

/**
 * Shared account chrome — sidebar (desktop), pill nav (tablet), tile hub (phone).
 *
 * @param {object} props
 * @param {import("@react-navigation/native").NavigationProp<any>} props.navigation
 * @param {string} props.activeSection — `ACCOUNT_NAV` key (e.g. `profile`)
 * @param {string} [props.pageTitle]
 * @param {string} [props.pageSubtitle]
 * @param {React.ReactNode} [props.headerRight]
 * @param {React.ReactNode} props.children
 */
export default function AccountShell({
  navigation,
  activeSection = "overview",
  pageTitle,
  pageSubtitle,
  headerRight,
  hidePageHeader = false,
  children,
}) {
  const { width } = useWindowDimensions();
  const { semanticPalette, TYPE, SPACING } = useTheme();
  const { user, logout } = useAuth();
  const [hoveredKey, setHoveredKey] = useState(null);
  const [signOutOpen, setSignOutOpen] = useState(false);
  const [signOutBusy, setSignOutBusy] = useState(false);
  const [focusedNavIndex, setFocusedNavIndex] = useState(0);
  const contentFocusRef = useRef(null);

  const isDesktop = width >= 1024;
  const isTablet = width >= 768 && width < 1024;
  const isPhone = width < 768;

  const activeItem = useMemo(
    () => ACCOUNT_NAV.find((item) => item.key === activeSection) || ACCOUNT_NAV[0],
    [activeSection]
  );

  const resolvedTitle = pageTitle || activeItem.label;
  const resolvedSubtitle =
    pageSubtitle || ACCOUNT_UI.sectionSubtitles?.[activeSection] || "";

  const goSection = useCallback(
    (item) => {
      if (item.key === activeSection && item.screen) return;
      if (item.rootRoute) {
        const parent = navigation.getParent?.();
        if (parent?.navigate) parent.navigate(item.rootRoute);
        else navigation.navigate(item.rootRoute);
        return;
      }
      if (item.screen) navigation.navigate(item.screen);
    },
    [activeSection, navigation]
  );

  const goProfile = useCallback(() => {
    navigation.navigate(ACCOUNT_NESTED.AccountProfile);
  }, [navigation]);

  const confirmSignOut = useCallback(async () => {
    try {
      setSignOutBusy(true);
      await logout();
      setSignOutOpen(false);
      const rootNav = navigation.getParent?.() || navigation;
      resetNavigationToHome(rootNav);
    } finally {
      setSignOutBusy(false);
    }
  }, [logout, navigation]);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        row: {
          flexDirection: isDesktop ? "row" : "column",
          alignItems: "flex-start",
          width: "100%",
          flex: 1,
          gap: isDesktop ? SPACING.xl : SPACING.md,
        },
        sidebar: {
          width: SIDEBAR_WIDTH,
          flexShrink: 0,
          ...Platform.select({
            web: isDesktop
              ? {
                  position: "sticky",
                  top: 96,
                  alignSelf: "flex-start",
                  maxHeight: `calc(${APP_VIEWPORT_MIN_HEIGHT} - 120px)`,
                }
              : {},
            default: {},
          }),
        },
        sidebarNav: {
          marginLeft: -14,
        },
        navItem: {
          height: 40,
          flexDirection: "row",
          alignItems: "center",
          gap: 12,
          paddingHorizontal: 14,
          marginBottom: 4,
          borderLeftWidth: 3,
          borderLeftColor: "transparent",
          ...Platform.select({
            web: { cursor: "pointer", transition: "background-color 160ms ease" },
            default: {},
          }),
        },
        navItemActive: {
          backgroundColor: semanticPalette.surfaceAlt,
          borderLeftColor: semanticPalette.accent,
        },
        navItemHover: {
          backgroundColor: semanticPalette.surfaceAlt,
        },
        navLabel: {
          fontFamily: fonts.medium,
          fontSize: 14,
          lineHeight: 20,
          color: semanticPalette.inkSoft,
          flex: 1,
        },
        navLabelActive: {
          fontFamily: fonts.semibold,
          fontWeight: "600",
          color: semanticPalette.ink,
        },
        navDivider: {
          height: StyleSheet.hairlineWidth,
          backgroundColor: semanticPalette.line,
          marginVertical: SPACING.sm,
          marginHorizontal: 14,
        },
        pillScroll: {
          marginHorizontal: -SPACING.lg,
          paddingHorizontal: SPACING.lg,
        },
        pillRow: {
          flexDirection: "row",
          gap: 8,
          paddingVertical: SPACING.xs,
        },
        pill: {
          paddingVertical: 8,
          paddingHorizontal: 16,
          borderRadius: 999,
          borderWidth: 1,
          flexDirection: "row",
          alignItems: "center",
          gap: 6,
          flexShrink: 0,
        },
        pillIdle: {
          borderColor: semanticPalette.line,
          backgroundColor: semanticPalette.surface,
        },
        pillActive: {
          borderColor: semanticPalette.ink,
          backgroundColor: semanticPalette.ink,
        },
        pillLabel: {
          fontFamily: fonts.medium,
          fontSize: 14,
          lineHeight: 20,
        },
        content: {
          flex: 1,
          minWidth: 0,
          width: isDesktop ? undefined : "100%",
          maxWidth: isDesktop ? CONTENT_MAX_WIDTH : undefined,
        },
        breadcrumb: {
          fontFamily: fonts.medium,
          fontSize: 12,
          lineHeight: 16,
          letterSpacing: 0.6,
          textTransform: "uppercase",
          color: semanticPalette.inkMuted,
          marginBottom: SPACING.xs,
        },
        pageTitle: {
          fontFamily: FONT_DISPLAY_SEMI,
          fontSize: TYPE.h1.fontSize,
          lineHeight: TYPE.h1.lineHeight,
          color: semanticPalette.ink,
        },
        pageSubtitle: {
          marginTop: 4,
          fontFamily: fonts.regular,
          fontSize: TYPE.body.fontSize,
          lineHeight: TYPE.body.lineHeight,
          color: semanticPalette.inkSoft,
        },
        contentHeader: {
          marginBottom: SPACING.lg,
        },
        mobileTile: {
          flexDirection: "row",
          alignItems: "center",
          paddingVertical: SPACING.md,
          paddingHorizontal: SPACING.md,
          borderRadius: 12,
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: semanticPalette.line,
          backgroundColor: semanticPalette.surface,
          marginBottom: SPACING.sm,
        },
        mobileTileLabel: {
          flex: 1,
          marginLeft: SPACING.md,
          fontFamily: fonts.medium,
          fontSize: TYPE.body.fontSize,
          color: semanticPalette.ink,
        },
        phoneBackRow: {
          flexDirection: "row",
          alignItems: "center",
          gap: SPACING.xs,
          marginBottom: SPACING.md,
        },
      }),
    [TYPE, isDesktop, semanticPalette, SPACING]
  );

  const renderNavItem = (item, variant = "sidebar", navIndex = 0) => {
    const active = item.key === activeSection;
    const hovered = hoveredKey === item.key;
    const iconColor = active || hovered ? semanticPalette.ink : semanticPalette.inkSoft;

    if (variant === "sidebar") {
      return (
        <AccountSidebarNavItem
          key={item.key}
          item={item}
          active={active}
          hovered={hovered || (Platform.OS === "web" && focusedNavIndex === navIndex)}
          onPress={() => goSection(item)}
          onHoverIn={() => Platform.OS === "web" && setHoveredKey(item.key)}
          onHoverOut={() => Platform.OS === "web" && setHoveredKey(null)}
        />
      );
    }

    const compact = isTablet && TABLET_COMPACT_KEYS.has(item.key);
    return (
      <Pressable
        key={item.key}
        onPress={() => goSection(item)}
        accessibilityRole="tab"
        accessibilityState={{ selected: active }}
        style={[styles.pill, active ? styles.pillActive : styles.pillIdle]}
      >
        <Ionicons name={item.icon} size={16} color={active ? semanticPalette.inkInverse : semanticPalette.inkSoft} />
        {!compact ? (
          <Text style={[styles.pillLabel, { color: active ? semanticPalette.inkInverse : semanticPalette.ink }]}>
            {item.label}
          </Text>
        ) : null}
      </Pressable>
    );
  };

  const showPhoneHub = isPhone && activeSection === "overview";
  const showPhoneSubpage = isPhone && activeSection !== "overview";

  return (
    <View style={styles.row}>
      <AccountSignOutDialog
        visible={signOutOpen}
        busy={signOutBusy}
        onCancel={() => !signOutBusy && setSignOutOpen(false)}
        onConfirm={confirmSignOut}
      />

      {isDesktop ? (
        <View
          style={styles.sidebar}
          accessibilityRole="navigation"
          accessibilityLabel="Account"
          {...(Platform.OS === "web"
            ? {
                onKeyDown: (e) => {
                  const max = ACCOUNT_NAV.length - 1;
                  if (e.key === "ArrowDown") {
                    e.preventDefault();
                    setFocusedNavIndex((i) => Math.min(max, i + 1));
                  } else if (e.key === "ArrowUp") {
                    e.preventDefault();
                    setFocusedNavIndex((i) => Math.max(0, i - 1));
                  } else if (e.key === "Enter") {
                    const item = ACCOUNT_NAV[focusedNavIndex];
                    if (item) goSection(item);
                  }
                },
              }
            : {})}
        >
          <AccountAvatarCard user={user} onEdit={goProfile} />
          <View style={styles.sidebarNav}>
            {ACCOUNT_NAV.map((item, index) => renderNavItem(item, "sidebar", index))}
            <View style={styles.navDivider} />
            <View style={{ paddingHorizontal: 6 }}>
              <Button
                variant="ghost"
                size="md"
                fullWidth
                label={ACCOUNT_UI.navSignOut}
                iconLeft={<Ionicons name="log-out-outline" size={18} color={semanticPalette.inkSoft} />}
                onPress={() => setSignOutOpen(true)}
                accessibilityHint="Sign out of your account"
              />
            </View>
          </View>
        </View>
      ) : null}

      <View style={styles.content}>
        {isDesktop || isTablet ? (
          <Pressable
            onPress={() => contentFocusRef.current?.focus?.()}
            accessibilityRole="link"
            accessibilityLabel={ACCOUNT_UI.skipToContent}
            style={srOnlyStyle}
            {...(Platform.OS === "web"
              ? {
                  onFocus: (e) => {
                    e.target.style.position = "static";
                    e.target.style.width = "auto";
                    e.target.style.height = "auto";
                  },
                }
              : {})}
          >
            <Text>{ACCOUNT_UI.skipToContent}</Text>
          </Pressable>
        ) : null}
        <View ref={contentFocusRef} accessible tabIndex={Platform.OS === "web" ? 0 : undefined}>
        {isPhone && activeSection !== "profile" ? (
          <AccountAvatarCard user={user} onEdit={goProfile} compact={!showPhoneHub} />
        ) : null}

        {isTablet ? (
          <View style={{ marginBottom: SPACING.md }}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.pillScroll}
              contentContainerStyle={styles.pillRow}
              accessibilityRole="tablist"
              {...Platform.select({
                web: { style: [styles.pillScroll, { scrollSnapType: "x mandatory" }] },
                default: {},
              })}
            >
              {ACCOUNT_NAV.map((item) => renderNavItem(item, "pill"))}
            </ScrollView>
            <Button
              variant="ghost"
              size="sm"
              label={ACCOUNT_UI.navSignOut}
              iconLeft={<Ionicons name="log-out-outline" size={18} color={semanticPalette.inkSoft} />}
              onPress={() => setSignOutOpen(true)}
              style={{ alignSelf: "flex-start", marginTop: SPACING.xs, marginLeft: SPACING.lg }}
            />
          </View>
        ) : null}

        {showPhoneSubpage ? (
          <Pressable
            onPress={() => navigation.navigate(ACCOUNT_NESTED.Overview)}
            accessibilityRole="button"
            style={styles.phoneBackRow}
          >
            <Ionicons name="chevron-back" size={20} color={semanticPalette.inkMuted} />
            <Text style={{ fontFamily: fonts.medium, fontSize: TYPE.small.fontSize, color: semanticPalette.inkMuted }}>
              {ACCOUNT_UI.kicker}
            </Text>
          </Pressable>
        ) : null}

        {!showPhoneHub && !hidePageHeader ? (
          <View style={styles.contentHeader}>
            {isDesktop || isTablet ? (
              <Text style={styles.breadcrumb} accessibilityRole="text">
                {ACCOUNT_UI.kicker} › {activeItem.label}
              </Text>
            ) : null}
            <View style={{ flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", gap: SPACING.sm }}>
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={styles.pageTitle} {...headingA11yProps(1)}>
                  {resolvedTitle}
                </Text>
                {resolvedSubtitle ? <Text style={styles.pageSubtitle}>{resolvedSubtitle}</Text> : null}
              </View>
              {headerRight ? <View style={{ flexShrink: 0 }}>{headerRight}</View> : null}
            </View>
          </View>
        ) : !hidePageHeader ? (
          <View style={[styles.contentHeader, { marginBottom: SPACING.md }]}>
            <Text {...headingA11yProps(1)} style={styles.pageTitle}>
              {resolvedTitle}
            </Text>
            {resolvedSubtitle ? <Text style={styles.pageSubtitle}>{resolvedSubtitle}</Text> : null}
          </View>
        ) : null}

        {showPhoneHub ? (
          <View style={{ marginBottom: SPACING.lg }}>
            {ACCOUNT_NAV.map((item) => (
              <Pressable
                key={item.key}
                onPress={() => goSection(item)}
                accessibilityRole="button"
                style={({ pressed }) => [styles.mobileTile, pressed ? { opacity: 0.9 } : null]}
              >
                <Ionicons name={item.icon} size={20} color={semanticPalette.inkSoft} />
                <Text style={styles.mobileTileLabel}>{item.label}</Text>
                <Ionicons name="chevron-forward" size={18} color={semanticPalette.inkMuted} />
              </Pressable>
            ))}
            <Pressable
              onPress={() => setSignOutOpen(true)}
              accessibilityRole="button"
              style={({ pressed }) => [styles.mobileTile, pressed ? { opacity: 0.9 } : null]}
            >
              <Ionicons name="log-out-outline" size={20} color={semanticPalette.inkSoft} />
              <Text style={styles.mobileTileLabel}>{ACCOUNT_UI.navSignOut}</Text>
              <Ionicons name="chevron-forward" size={18} color={semanticPalette.inkMuted} />
            </Pressable>
          </View>
        ) : null}

        <AccountSectionReveal sectionKey={activeSection} enabled={isDesktop}>
          {children}
        </AccountSectionReveal>
        </View>
      </View>
    </View>
  );
}
