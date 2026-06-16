import React from "react";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { useKankregLayout } from "../../theme/kankregBreakpoints";
import { Ionicons } from "@expo/vector-icons";
import { KANKREG_PALETTE } from "../../theme/kankregWeb";
import { FONT_BODY_SEMIBOLD } from "../../theme/typographyRoles";
import { fonts, spacing } from "../../theme/tokens";
import { useTheme } from "../../context/ThemeContext";
import { platformShadow } from "../../theme/shadowPlatform";

const sideShadow = platformShadow({
  web: { boxShadow: "0 12px 32px rgba(25, 20, 15, 0.07)" },
  ios: {
    shadowColor: "#19140f",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 14,
  },
  android: { elevation: 3 },
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

/** kankreg.html `.prof-grid` + `.prof-side` + `.prof-menu` */
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
  const { useSidebarLayout } = useKankregLayout();
  const { colors: c, isDark } = useTheme();
  const stack = !useSidebarLayout;
  const initial = String(user?.name || user?.email || "K").trim().charAt(0).toUpperCase();
  const avatar = (avatarUrl || user?.avatar || "").trim();

  return (
    <View style={[styles.grid, stack && styles.gridStack]}>
      <View
        style={[
          styles.side,
          stack && styles.sideStack,
          isDark && styles.sideDark,
          sideShadow,
        ]}
      >
        {avatar ? (
          <Image source={{ uri: avatar }} style={styles.avatarImage} contentFit="cover" />
        ) : (
          <LinearGradient colors={["#DCAC74", "#244424"]} style={styles.avatar}>
            <Text style={styles.avatarText}>{initial}</Text>
          </LinearGradient>
        )}
        <Text style={[styles.name, isDark && styles.nameDark]} numberOfLines={2}>
          {user?.name || "Member"}
        </Text>
        <Text style={[styles.email, isDark && styles.emailDark]} numberOfLines={1}>
          {user?.email || ""}
        </Text>
        {memberTag ? (
          <View style={styles.memberTag}>
            <Text style={styles.memberTagText}>{memberTag}</Text>
          </View>
        ) : null}
        <View style={styles.menu}>
          {MENU.map((item) => {
            const on = item.key === activeKey;
            return (
              <Pressable
                key={item.key}
                onPress={() => {
                  if (item.route) navigation.navigate(item.route);
                }}
                disabled={!item.route}
                style={({ pressed, hovered }) => [
                  styles.menuItem,
                  on && (isDark ? styles.menuItemOnDark : styles.menuItemOn),
                  (pressed || (Platform.OS === "web" && hovered)) && item.route
                    ? isDark
                      ? styles.menuItemHoverDark
                      : styles.menuItemHover
                    : null,
                ]}
                accessibilityRole="button"
                accessibilityState={{ selected: on }}
              >
                <Ionicons
                  name={item.icon}
                  size={17}
                  color={on ? (isDark ? KANKREG_PALETTE.paper : KANKREG_PALETTE.ink) : c.primary}
                />
                <Text
                  style={[
                    styles.menuText,
                    isDark && styles.menuTextDark,
                    on && (isDark ? styles.menuTextOnDark : styles.menuTextOn),
                  ]}
                >
                  {item.label}
                </Text>
              </Pressable>
            );
          })}
          {onSignOut ? (
            <Pressable
              onPress={onSignOut}
              disabled={signingOut}
              style={({ pressed }) => [
                styles.menuItem,
                styles.menuItemSignOut,
                isDark && styles.menuItemSignOutDark,
                pressed && { opacity: 0.85 },
              ]}
              accessibilityRole="button"
              accessibilityLabel="Sign out"
            >
              <Ionicons name="log-out-outline" size={17} color={KANKREG_PALETTE.danger || "#b91c1c"} />
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
    gap: spacing.xl,
  },
  side: {
    width: 300,
    maxWidth: "100%",
    flexShrink: 0,
    padding: 26,
    borderWidth: 1,
    borderColor: KANKREG_PALETTE.line,
    borderRadius: 20,
    backgroundColor: KANKREG_PALETTE.card,
    alignItems: "center",
  },
  sideStack: {
    width: "100%",
    padding: spacing.md + 4,
  },
  sideDark: {
    backgroundColor: "#1a1714",
    borderColor: "rgba(255,255,255,0.08)",
  },
  avatar: {
    width: 88,
    height: 88,
    borderRadius: 44,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },
  avatarImage: {
    width: 88,
    height: 88,
    borderRadius: 44,
    marginBottom: 14,
    borderWidth: 2,
    borderColor: "rgba(42, 117, 89, 0.45)",
  },
  avatarText: {
    fontFamily: FONT_BODY_SEMIBOLD,
    fontSize: 34,
    color: "#fff",
  },
  name: {
    fontFamily: FONT_BODY_SEMIBOLD,
    fontSize: 20,
    color: KANKREG_PALETTE.ink,
    textAlign: "center",
  },
  nameDark: {
    color: KANKREG_PALETTE.paper,
  },
  email: {
    fontSize: 13,
    color: KANKREG_PALETTE.inkFaint,
    marginTop: 4,
    textAlign: "center",
  },
  emailDark: {
    color: "#a8a29e",
  },
  memberTag: {
    marginTop: 12,
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderRadius: 999,
    backgroundColor: "rgba(42, 117, 89, 0.18)",
    borderWidth: 1,
    borderColor: "rgba(42, 117, 89, 0.35)",
  },
  memberTagText: {
    fontSize: 11,
    fontFamily: fonts.semibold,
    color: KANKREG_PALETTE.gold,
    letterSpacing: 0.02,
  },
  menu: {
    marginTop: 22,
    alignSelf: "stretch",
    width: "100%",
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 11,
  },
  menuItemOn: {
    backgroundColor: KANKREG_PALETTE.paper2,
  },
  menuItemOnDark: {
    backgroundColor: "rgba(255,255,255,0.08)",
  },
  menuItemHover: {
    backgroundColor: "rgba(31, 92, 71, 0.08)",
  },
  menuItemHoverDark: {
    backgroundColor: "rgba(52, 211, 153, 0.1)",
  },
  menuText: {
    fontSize: 14,
    fontFamily: fonts.medium,
    color: KANKREG_PALETTE.inkSoft,
  },
  menuTextDark: {
    color: "rgba(245, 239, 228, 0.72)",
  },
  menuTextOn: {
    fontFamily: fonts.semibold,
    color: KANKREG_PALETTE.ink,
  },
  menuTextOnDark: {
    fontFamily: fonts.semibold,
    color: KANKREG_PALETTE.paper,
  },
  menuItemSignOut: {
    marginTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: KANKREG_PALETTE.line,
    paddingTop: spacing.md,
  },
  menuItemSignOutDark: {
    borderTopColor: "rgba(255,255,255,0.08)",
  },
  menuTextSignOut: {
    fontSize: 14,
    fontFamily: fonts.semibold,
    color: "#b91c1c",
  },
  main: {
    flex: 1,
    minWidth: 0,
  },
  mainStack: {
    width: "100%",
    flexGrow: 0,
    flexShrink: 0,
    alignSelf: "stretch",
  },
});
