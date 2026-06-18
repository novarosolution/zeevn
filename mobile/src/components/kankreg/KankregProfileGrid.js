import React from "react";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { useKankregLayout } from "../../theme/kankregBreakpoints";
import { Ionicons } from "@expo/vector-icons";
import { ALCHEMY } from "../../theme/customerAlchemy";
import { KANKREG_PALETTE } from "../../theme/kankregWeb";
import { FONT_BODY_SEMIBOLD, FONT_HEADING, FONT_HEADING_SEMI } from "../../theme/typographyRoles";
import { fonts, radius, spacing } from "../../theme/tokens";
import { useTheme } from "../../context/ThemeContext";
import { platformShadow } from "../../theme/shadowPlatform";
import GoldHairline from "../ui/GoldHairline";

const sideShadow = platformShadow({
  web: {
    boxShadow:
      "0 18px 44px rgba(22, 69, 51, 0.1), 0 6px 16px rgba(28, 25, 23, 0.05), inset 0 1px 0 rgba(255,255,255,0.92)",
  },
  ios: {
    shadowColor: "#19140f",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 18,
  },
  android: { elevation: 4 },
});

const sideShadowDark = platformShadow({
  web: {
    boxShadow: "0 18px 44px rgba(0,0,0,0.42), inset 0 1px 0 rgba(255,255,255,0.05)",
  },
  ios: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.34,
    shadowRadius: 18,
  },
  android: { elevation: 6 },
});

const MENU = [
  { key: "overview", label: "Account overview", icon: "person-outline", route: null },
  { key: "orders", label: "My orders", icon: "bag-handle-outline", route: "MyOrders" },
  { key: "address", label: "Saved addresses", icon: "location-outline", route: "ManageAddress" },
  { key: "rewards", label: "Rewards", icon: "gift-outline", route: "RedeemRewards" },
  { key: "notifications", label: "Notifications", icon: "notifications-outline", route: "Notifications" },
  { key: "settings", label: "Settings", icon: "settings-outline", route: "Settings" },
  { key: "support", label: "Support", icon: "chatbubbles-outline", route: "Support" },
];

function ProfileAvatar({ avatar, initial, compact }) {
  const size = compact ? 64 : 92;
  const ringSize = size + 6;

  return (
    <View style={[styles.avatarRingWrap, { width: ringSize, height: ringSize }]}>
      <LinearGradient
        colors={[ALCHEMY.goldBright, ALCHEMY.gold, ALCHEMY.goldDeep, KANKREG_PALETTE.greenDeep]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.avatarRing, { width: ringSize, height: ringSize, borderRadius: ringSize / 2 }]}
      >
        {avatar ? (
          <Image
            source={{ uri: avatar }}
            style={[styles.avatarImage, { width: size, height: size, borderRadius: size / 2 }]}
            contentFit="cover"
          />
        ) : (
          <LinearGradient
            colors={[KANKREG_PALETTE.greenBright, KANKREG_PALETTE.greenDeep]}
            style={[styles.avatar, { width: size, height: size, borderRadius: size / 2 }]}
          >
            <Text style={[styles.avatarText, compact && styles.avatarTextCompact]}>{initial}</Text>
          </LinearGradient>
        )}
      </LinearGradient>
    </View>
  );
}

function ProfileMenuItem({ item, on, isDark, onPress, disabled }) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed, hovered }) => [
        styles.menuItem,
        on && (isDark ? styles.menuItemOnDark : styles.menuItemOn),
        (pressed || (Platform.OS === "web" && hovered)) && !disabled
          ? isDark
            ? styles.menuItemHoverDark
            : styles.menuItemHover
          : null,
      ]}
      accessibilityRole="button"
      accessibilityState={{ selected: on, disabled }}
    >
      {on ? (
        <View style={[styles.menuActiveBar, isDark && styles.menuActiveBarDark]} />
      ) : null}
      <View
        style={[
          styles.menuIconWrap,
          on && (isDark ? styles.menuIconWrapOnDark : styles.menuIconWrapOn),
        ]}
      >
        <Ionicons
          name={item.icon}
          size={16}
          color={
            on
              ? isDark
                ? ALCHEMY.goldBright
                : KANKREG_PALETTE.greenDeep
              : isDark
                ? "#c8bdaf"
                : KANKREG_PALETTE.inkSoft
          }
        />
      </View>
      <Text
        style={[
          styles.menuText,
          isDark && styles.menuTextDark,
          on && (isDark ? styles.menuTextOnDark : styles.menuTextOn),
        ]}
      >
        {item.label}
      </Text>
      {item.route ? (
        <Ionicons
          name="chevron-forward"
          size={14}
          color={isDark ? "#78716c" : KANKREG_PALETTE.inkFaint}
          style={styles.menuChevron}
        />
      ) : null}
    </Pressable>
  );
}

/** kankreg.html `.prof-grid` + `.prof-side` + `.prof-menu` — premium editorial account shell. */
export default function KankregProfileGrid({
  navigation,
  user,
  avatarUrl = "",
  memberTag = "",
  activeKey = "overview",
  onSignOut,
  signingOut = false,
  children,
}) {
  const { useSidebarLayout, isXs, isMobileWeb } = useKankregLayout();
  const { isDark } = useTheme();
  const stack = !useSidebarLayout;
  const compactHero = stack && (isXs || isMobileWeb);
  const initial = String(user?.name || user?.email || "K").trim().charAt(0).toUpperCase();
  const avatar = (avatarUrl || user?.avatar || "").trim();
  const panelShadow = isDark ? sideShadowDark : sideShadow;

  return (
    <View style={[styles.grid, stack && styles.gridStack]}>
      <View
        style={[
          styles.side,
          stack && styles.sideStack,
          compactHero && styles.sideHero,
          isDark && styles.sideDark,
          panelShadow,
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
              ? ["rgba(52, 211, 153, 0.07)", "rgba(28, 25, 23, 0)", "rgba(28, 25, 23, 0)"]
              : ["rgba(255, 255, 255, 0.65)", "rgba(255, 252, 246, 0.15)", "rgba(255, 248, 234, 0.35)"]
          }
          locations={[0, 0.45, 1]}
          style={styles.sideSheen}
          pointerEvents="none"
        />

        <View style={[styles.identityBlock, compactHero && styles.identityBlockHero]}>
          <ProfileAvatar avatar={avatar} initial={initial} compact={compactHero} />
          <View style={[styles.identityCopy, compactHero && styles.identityCopyHero]}>
            <Text
              style={[styles.name, isDark && styles.nameDark, compactHero && styles.nameHero]}
              numberOfLines={2}
            >
              {user?.name || "Member"}
            </Text>
            <Text
              style={[styles.email, isDark && styles.emailDark]}
              numberOfLines={1}
            >
              {user?.email || ""}
            </Text>
            {memberTag ? (
              <LinearGradient
                colors={
                  isDark
                    ? ["rgba(31, 92, 71, 0.35)", "rgba(201, 162, 39, 0.22)"]
                    : ["rgba(255, 252, 248, 0.95)", "rgba(220, 172, 116, 0.22)"]
                }
                start={{ x: 0, y: 0.5 }}
                end={{ x: 1, y: 0.5 }}
                style={[styles.memberTag, isDark && styles.memberTagDark]}
              >
                <Ionicons name="sparkles" size={11} color={isDark ? ALCHEMY.goldBright : ALCHEMY.goldDeep} />
                <Text style={[styles.memberTagText, isDark && styles.memberTagTextDark]} numberOfLines={2}>
                  {memberTag}
                </Text>
              </LinearGradient>
            ) : null}
          </View>
        </View>

        {!compactHero ? <GoldHairline marginVertical={spacing.md} withDot={false} variant="subtle" /> : null}

        <View style={[styles.menu, compactHero && styles.menuCompact]}>
          {MENU.map((item) => {
            const on = item.key === activeKey;
            return (
              <ProfileMenuItem
                key={item.key}
                item={item}
                on={on}
                isDark={isDark}
                disabled={!item.route}
                onPress={() => {
                  if (item.route) navigation.navigate(item.route);
                }}
              />
            );
          })}
          {onSignOut ? (
            <Pressable
              onPress={onSignOut}
              disabled={signingOut}
              style={({ pressed, hovered }) => [
                styles.menuItem,
                styles.menuItemSignOut,
                isDark && styles.menuItemSignOutDark,
                (pressed || (Platform.OS === "web" && hovered)) && { opacity: 0.88 },
              ]}
              accessibilityRole="button"
              accessibilityLabel="Sign out"
            >
              <View style={[styles.menuIconWrap, styles.menuIconWrapSignOut]}>
                <Ionicons name="log-out-outline" size={16} color={KANKREG_PALETTE.danger} />
              </View>
              <Text style={styles.menuTextSignOut}>{signingOut ? "Signing out…" : "Sign out"}</Text>
            </Pressable>
          ) : null}
        </View>
      </View>

      <View style={[styles.main, stack && styles.mainStack]}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: "row",
    gap: 32,
    alignItems: "flex-start",
  },
  gridStack: {
    flexDirection: "column",
    gap: spacing.lg,
  },
  side: {
    width: 300,
    maxWidth: "100%",
    flexShrink: 0,
    paddingTop: spacing.lg + 4,
    paddingBottom: spacing.lg,
    paddingHorizontal: spacing.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: KANKREG_PALETTE.line,
    borderRadius: radius.xl,
    backgroundColor: KANKREG_PALETTE.card,
    overflow: "hidden",
  },
  sideStack: {
    width: "100%",
  },
  sideHero: {
    paddingTop: spacing.md + 4,
    paddingBottom: spacing.md,
    paddingHorizontal: spacing.md + 2,
  },
  sideDark: {
    backgroundColor: "rgba(22, 20, 18, 0.96)",
    borderColor: "rgba(255,255,255,0.08)",
  },
  topAccent: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 2.5,
    opacity: 0.95,
    zIndex: 2,
  },
  sideSheen: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.85,
  },
  identityBlock: {
    alignItems: "center",
    zIndex: 1,
  },
  identityBlockHero: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    width: "100%",
  },
  identityCopy: {
    alignItems: "center",
    width: "100%",
  },
  identityCopyHero: {
    flex: 1,
    alignItems: "flex-start",
    minWidth: 0,
  },
  avatarRingWrap: {
    marginBottom: spacing.sm + 2,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarRing: {
    padding: 3,
    alignItems: "center",
    justifyContent: "center",
  },
  avatar: {
    alignItems: "center",
    justifyContent: "center",
  },
  avatarImage: {
    borderWidth: 2,
    borderColor: "rgba(255, 252, 248, 0.85)",
  },
  avatarText: {
    fontFamily: FONT_HEADING_SEMI,
    fontSize: 36,
    color: "#fff",
  },
  avatarTextCompact: {
    fontSize: 26,
  },
  name: {
    fontFamily: FONT_HEADING,
    fontSize: 22,
    color: KANKREG_PALETTE.ink,
    textAlign: "center",
    letterSpacing: -0.3,
  },
  nameHero: {
    fontSize: 19,
    textAlign: "left",
  },
  nameDark: {
    color: KANKREG_PALETTE.paper,
  },
  email: {
    fontSize: 12.5,
    fontFamily: fonts.medium,
    color: KANKREG_PALETTE.inkFaint,
    marginTop: 4,
    textAlign: "center",
  },
  emailDark: {
    color: "#a8a29e",
  },
  memberTag: {
    marginTop: spacing.sm + 2,
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: radius.pill,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(201, 162, 39, 0.35)",
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    maxWidth: "100%",
  },
  memberTagDark: {
    borderColor: "rgba(201, 162, 39, 0.28)",
  },
  memberTagText: {
    fontSize: 10.5,
    fontFamily: fonts.bold,
    color: ALCHEMY.brownInk,
    letterSpacing: 0.3,
    textTransform: "uppercase",
    flexShrink: 1,
  },
  memberTagTextDark: {
    color: ALCHEMY.goldBright,
  },
  menu: {
    marginTop: spacing.sm,
    alignSelf: "stretch",
    width: "100%",
    zIndex: 1,
  },
  menuCompact: {
    marginTop: spacing.md,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingVertical: 10,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.md,
    position: "relative",
    overflow: "hidden",
    ...Platform.select({ web: { cursor: "pointer" }, default: {} }),
  },
  menuItemOn: {
    backgroundColor: "rgba(31, 92, 71, 0.07)",
  },
  menuItemOnDark: {
    backgroundColor: "rgba(52, 211, 153, 0.1)",
  },
  menuItemHover: {
    backgroundColor: "rgba(31, 92, 71, 0.06)",
  },
  menuItemHoverDark: {
    backgroundColor: "rgba(52, 211, 153, 0.08)",
  },
  menuActiveBar: {
    position: "absolute",
    left: 0,
    top: 8,
    bottom: 8,
    width: 3,
    borderRadius: 2,
    backgroundColor: ALCHEMY.gold,
  },
  menuActiveBarDark: {
    backgroundColor: ALCHEMY.goldBright,
  },
  menuIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(31, 92, 71, 0.06)",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(31, 92, 71, 0.1)",
  },
  menuIconWrapOn: {
    backgroundColor: "rgba(31, 92, 71, 0.12)",
    borderColor: "rgba(31, 92, 71, 0.22)",
  },
  menuIconWrapOnDark: {
    backgroundColor: "rgba(52, 211, 153, 0.12)",
    borderColor: "rgba(52, 211, 153, 0.22)",
  },
  menuIconWrapSignOut: {
    backgroundColor: "rgba(184, 68, 47, 0.08)",
    borderColor: "rgba(184, 68, 47, 0.18)",
  },
  menuText: {
    flex: 1,
    fontSize: 13.5,
    fontFamily: fonts.medium,
    color: KANKREG_PALETTE.inkSoft,
  },
  menuTextDark: {
    color: "rgba(245, 239, 228, 0.72)",
  },
  menuTextOn: {
    fontFamily: FONT_BODY_SEMIBOLD,
    color: KANKREG_PALETTE.ink,
  },
  menuTextOnDark: {
    fontFamily: FONT_BODY_SEMIBOLD,
    color: KANKREG_PALETTE.paper,
  },
  menuChevron: {
    opacity: 0.55,
  },
  menuItemSignOut: {
    marginTop: spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: KANKREG_PALETTE.line,
    paddingTop: spacing.md,
  },
  menuItemSignOutDark: {
    borderTopColor: "rgba(255,255,255,0.08)",
  },
  menuTextSignOut: {
    flex: 1,
    fontSize: 13.5,
    fontFamily: fonts.semibold,
    color: KANKREG_PALETTE.danger,
  },
  main: {
    flex: 1,
    minWidth: 0,
    gap: spacing.xs,
  },
  mainStack: {
    width: "100%",
    flexGrow: 0,
    flexShrink: 0,
    alignSelf: "stretch",
  },
});
