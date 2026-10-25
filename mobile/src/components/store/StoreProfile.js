import React, { useState } from "react";
import { RefreshControl, StyleSheet, Text, View } from "react-native";
import Constants from "expo-constants";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, { LinearTransition, useAnimatedScrollHandler, useSharedValue } from "react-native-reanimated";
import { panelIn, panelOut } from "../../theme/motion";
import { useTheme } from "../../context/ThemeContext";
import { useWishlist } from "../../context/WishlistContext";
import { STORE_PROFILE } from "../../content/storefrontContent";
import { useStoreTheme, withAlpha } from "../../theme/storefront";
import { hapticTick } from "../../utils/haptics";
import { formatPhone } from "../../utils/storefront";
import DeleteAccountAction from "./DeleteAccountAction";
import FloatingNav from "./FloatingNav";
import { useStoreNavPad } from "./StoreTracker";
import { CoinArt } from "./PromoCarousel";
import PressableScale from "./PressableScale";
import ScreenHeader, { SCREEN_HEADER_PAD } from "./ScreenHeader";
import StoreIcon from "./StoreIcon";

function SectionLabel({ children }) {
  const { c, type } = useStoreTheme();
  return <Text style={[type.ui(12.5, "bold", c.inkMute, { letterSpacing: 1.1 }), styles.sectionLabel]}>{children}</Text>;
}

function RewardsBanner({ points, onPress }) {
  const { c, r, type, isDark, shadow } = useStoreTheme();
  const banner = STORE_PROFILE.banner;
  return (
    <PressableScale
      onPress={onPress}
      scaleTo={0.985}
      accessibilityRole="button"
      accessibilityLabel={`${banner.title}, ${points} points. ${banner.cta}`}
      style={[styles.banner, shadow.card, { borderRadius: r.xxl }]}
    >
      <LinearGradient
        colors={isDark ? ["#4A3812", "#2E2209"] : ["#FFF1CC", "#F8D68C"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <View style={[StyleSheet.absoluteFill, { borderRadius: r.xxl, borderWidth: 1, borderColor: withAlpha("#FFFFFF", isDark ? 0.08 : 0.6) }]} pointerEvents="none" />
      <View style={styles.bannerCoin} pointerEvents="none">
        <CoinArt size={124} />
      </View>
      <View style={styles.bannerCopy}>
        <Text style={type.display(26, { color: isDark ? c.ink : "#3A2A0C", ls: -0.4, lh: 30 })} numberOfLines={1}>
          {points} points
        </Text>
        <Text style={type.ui(13.5, "medium", isDark ? c.inkSoft : "#6A4A1C")} numberOfLines={2}>
          {banner.caption}
        </Text>
        <View style={styles.bannerCta}>
          <Text style={type.ui(14.5, "extrabold", isDark ? c.goldText : "#2F5A22")}>{banner.cta}</Text>
          <Ionicons name="chevron-forward" size={15} color={isDark ? c.goldText : "#2F5A22"} />
        </View>
      </View>
    </PressableScale>
  );
}

function Tile({ tile, dot, onPress }) {
  const { c, r, type, shadow } = useStoreTheme();
  return (
    <PressableScale
      onPress={onPress}
      scaleTo={0.96}
      accessibilityRole="button"
      accessibilityLabel={tile.label}
      style={[styles.tile, shadow.soft, { backgroundColor: c.card, borderColor: c.line, borderRadius: r.xl }]}
    >
      <View>
        <StoreIcon icon={tile.icon} size={27} color={c.ink} />
        {dot ? <View style={[styles.dot, { backgroundColor: c.danger, borderColor: c.card }]} /> : null}
      </View>
      <Text style={type.ui(14.5, "semibold", c.ink)} numberOfLines={1}>
        {tile.label}
      </Text>
    </PressableScale>
  );
}

function AppearanceRow() {
  const { c, r, type, shadow } = useStoreTheme();
  const { mode, setMode } = useTheme();
  const [open, setOpen] = useState(false);
  const options = STORE_PROFILE.appearance.options;
  const current = options.find((o) => o.key === mode) || options[2];

  return (
    <Animated.View layout={LinearTransition.duration(220)} style={[styles.card, shadow.soft, { backgroundColor: c.card, borderColor: c.line, borderRadius: r.xl }]}>
      <PressableScale scaleTo={0.96} lite
        onPress={() => {
          hapticTick();
          setOpen((v) => !v);
        }}
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
        accessibilityLabel={`${STORE_PROFILE.appearance.label}, ${current.label}`}
        style={styles.rowInner}
      >
        <View style={[styles.rowIcon, { backgroundColor: c.soft }]}>
          <Ionicons name="sunny-outline" size={22} color={c.ink} />
        </View>
        <Text style={[type.ui(17, "medium", c.ink), styles.rowLabel]}>{STORE_PROFILE.appearance.label}</Text>
        <View style={[styles.valuePill, { backgroundColor: c.soft }]}>
          <Text style={type.ui(13.5, "semibold", c.inkSoft)}>{current.label}</Text>
        </View>
        <Ionicons name={open ? "chevron-up" : "chevron-down"} size={20} color={c.ink} />
      </PressableScale>
      {open ? (
        <Animated.View entering={panelIn} exiting={panelOut} style={[styles.segment, { backgroundColor: c.soft }]}>
          {options.map((option) => {
            const active = option.key === mode;
            return (
              <PressableScale scaleTo={0.96} lite
                key={option.key}
                onPress={() => {
                  hapticTick();
                  setMode(option.key);
                }}
                accessibilityRole="radio"
                accessibilityState={{ checked: active }}
                style={[styles.segmentItem, active && { backgroundColor: c.card }, active && shadow.soft]}
              >
                <StoreIcon icon={option.icon} size={17} color={active ? c.brand : c.inkSoft} />
                <Text style={type.ui(13.5, active ? "extrabold" : "semibold", active ? c.brand : c.inkSoft)}>{option.label}</Text>
              </PressableScale>
            );
          })}
        </Animated.View>
      ) : null}
    </Animated.View>
  );
}

function PreferencesRow({ onPress }) {
  const { c, r, type } = useStoreTheme();
  const item = STORE_PROFILE.preferences;
  return (
    <PressableScale
      onPress={onPress}
      scaleTo={0.985}
      accessibilityRole="button"
      accessibilityLabel={item.label}
      style={[
        styles.card,
        styles.rowInner,
        {
          backgroundColor: c.card,
          borderColor: item.highlight ? c.brandAlt : c.line,
          borderWidth: item.highlight ? 1.5 : StyleSheet.hairlineWidth,
          borderRadius: r.xl,
        },
      ]}
    >
      <View style={[styles.rowIcon, { backgroundColor: c.soft }]}>
        <StoreIcon icon={item.icon} size={22} color={c.ink} />
      </View>
      <View style={styles.rowLabel}>
        <Text style={type.ui(17, "medium", c.ink)}>{item.label}</Text>
        {item.caption ? <Text style={type.ui(12.5, "medium", c.inkMute)}>{item.caption}</Text> : null}
      </View>
      {item.badge ? (
        <View style={[styles.badge, { backgroundColor: c.brand }]}>
          <Text style={type.ui(12, "extrabold", c.onBrand)}>{item.badge}</Text>
        </View>
      ) : null}
      <Ionicons name="chevron-forward" size={20} color={c.ink} />
    </PressableScale>
  );
}

function InfoRow({ row, trailing, tone, onPress }) {
  const { c, type } = useStoreTheme();
  const color = tone === "danger" ? c.danger : c.ink;
  return (
    <PressableScale onPress={onPress} scaleTo={0.985} accessibilityRole="button" accessibilityLabel={row.label} style={styles.infoRow}>
      <View style={[styles.rowIcon, { backgroundColor: tone === "danger" ? c.dangerSoft : c.soft }]}>
        <StoreIcon icon={row.icon} size={21} color={color} />
      </View>
      <Text style={[type.ui(17, "medium", color), styles.rowLabel]}>{row.label}</Text>
      {trailing ? (
        <View style={[styles.count, { backgroundColor: c.brandSoft }]}>
          <Text style={type.ui(12.5, "extrabold", c.brand)}>{trailing}</Text>
        </View>
      ) : null}
      <Ionicons name="chevron-forward" size={17} color={c.inkMute} />
    </PressableScale>
  );
}

/**
 * Native “Your account” — big heading with phone, rewards banner, quick tiles, appearance switch,
 * app-preferences row and the information list. Mirrors the Blinkit profile page in Zeevan's look.
 */
export default function StoreProfile({
  navigation,
  user,
  displayName,
  phone,
  avatarUrl,
  rewardPoints,
  orderCount,
  unreadCount,
  loading,
  error,
  refreshing,
  onRefresh,
  onSignOut,
  signingOut,
}) {
  const { c, r, type, isDark, gutter } = useStoreTheme();
  const insets = useSafeAreaInsets();
  const scrollY = useSharedValue(0);
  const onScroll = useAnimatedScrollHandler((event) => {
    scrollY.value = event.contentOffset.y;
  });
  const wishlist = useWishlist();
  const go = (route) => route && navigation.navigate(route.name, route.params);
  const navPad = useStoreNavPad(insets);
  const version = Constants.expoConfig?.version || "1.0.0";
  const contact = formatPhone(phone) || user?.email || "";
  const points = Number(rewardPoints || 0).toLocaleString("en-IN");

  const trailingFor = (key) => {
    if (key === "orders") return orderCount > 0 ? String(orderCount) : "";
    if (key === "wishlist") return wishlist.count > 0 ? String(wishlist.count) : "";
    return "";
  };

  return (
    <View style={[styles.screen, { backgroundColor: c.page }]}>
      <Animated.ScrollView
        onScroll={onScroll}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingTop: insets.top + SCREEN_HEADER_PAD, paddingBottom: navPad }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={c.brand} progressViewOffset={insets.top + 60} />}
      >
        <View style={{ paddingHorizontal: gutter, gap: 18 }}>
          <View style={styles.heading}>
            <View style={styles.headingText}>
              <Text style={type.display(34, { ls: -0.8, lh: 40 })} numberOfLines={1} accessibilityRole="header">
                {STORE_PROFILE.heading}
              </Text>
              <Text style={type.ui(17.5, "extrabold", c.ink)} numberOfLines={1}>
                {displayName}
              </Text>
              {contact ? (
                <View style={styles.contactRow}>
                  <Ionicons name={phone ? "call-outline" : "mail-outline"} size={16} color={c.inkMute} />
                  {/* An email's start and end both identify it, so it is shortened in the middle. */}
                  <Text style={[type.ui(14.5, "medium", c.inkSoft), styles.contactText]} numberOfLines={1} ellipsizeMode="middle">
                    {contact}
                  </Text>
                </View>
              ) : null}
            </View>
            <PressableScale
              onPress={() => navigation.navigate("EditProfile")}
              accessibilityRole="button"
              accessibilityLabel="Edit profile"
              style={[styles.avatar, { backgroundColor: c.card, borderColor: withAlpha(c.brand, 0.16) }]}
            >
              {avatarUrl ? (
                <Image source={{ uri: avatarUrl }} style={StyleSheet.absoluteFill} contentFit="cover" />
              ) : (
                <LinearGradient colors={[c.brandAlt, c.brand]} style={[StyleSheet.absoluteFill, styles.avatarFill]}>
                  <Text style={type.display(24, { color: c.onBrand, ls: 0 })}>{String(displayName || "Z").trim().charAt(0).toUpperCase()}</Text>
                </LinearGradient>
              )}
            </PressableScale>
          </View>

          {error ? (
            <View style={[styles.error, { backgroundColor: c.dangerSoft, borderColor: withAlpha(c.danger, 0.35), borderRadius: r.lg }]}>
              <Ionicons name="alert-circle-outline" size={18} color={c.danger} />
              <Text style={[type.ui(13.5, "medium", c.danger), styles.errorText]}>{error}</Text>
            </View>
          ) : null}

          <RewardsBanner points={loading ? "—" : points} onPress={() => go(STORE_PROFILE.banner.route)} />

          <View style={styles.tiles}>
            {STORE_PROFILE.tiles.map((tile) => (
              <Tile key={tile.key} tile={tile} dot={tile.key === "alerts" && unreadCount > 0} onPress={() => go(tile.route)} />
            ))}
          </View>

          <AppearanceRow />
          <PreferencesRow onPress={() => go(STORE_PROFILE.preferences.route)} />
        </View>

        <View style={{ paddingHorizontal: gutter, marginTop: 26 }}>
          <SectionLabel>{STORE_PROFILE.sectionTitle}</SectionLabel>
          {STORE_PROFILE.rows.map((row) => (
            <InfoRow key={row.key} row={row} trailing={trailingFor(row.key)} onPress={() => go(row.route)} />
          ))}
          {user?.isDeliveryPartner ? <InfoRow row={STORE_PROFILE.deliveryRow} onPress={() => go(STORE_PROFILE.deliveryRow.route)} /> : null}
        </View>

        <View style={{ paddingHorizontal: gutter, marginTop: 22 }}>
          <SectionLabel>{STORE_PROFILE.aboutTitle}</SectionLabel>
          {STORE_PROFILE.aboutRows.map((row) => (
            <InfoRow key={row.key} row={row} onPress={() => go(row.route)} />
          ))}
        </View>

        <View style={{ paddingHorizontal: gutter, marginTop: 26, gap: 14 }}>
          <DeleteAccountAction tone={{ ink: c.ink, mute: c.inkMute, danger: c.danger, line: withAlpha(c.danger, 0.4), paper: c.card }} />
          <PressableScale
            onPress={onSignOut}
            disabled={signingOut}
            accessibilityRole="button"
            accessibilityLabel={STORE_PROFILE.signOut}
            style={[styles.signOut, { borderColor: withAlpha(c.danger, 0.4), borderRadius: r.xl, backgroundColor: c.card }]}
          >
            <Ionicons name="log-out-outline" size={20} color={c.danger} />
            <Text style={type.ui(16, "extrabold", c.danger)}>{signingOut ? STORE_PROFILE.signingOut : STORE_PROFILE.signOut}</Text>
          </PressableScale>
          <Text style={[type.ui(12, "medium", c.inkMute), styles.version]}>{STORE_PROFILE.version(version)}</Text>
        </View>
      </Animated.ScrollView>

      <ScreenHeader
        title={STORE_PROFILE.navTitle}
        onBack={() => (navigation.canGoBack?.() ? navigation.goBack() : navigation.navigate("Home"))}
        scrollY={scrollY}
      />

      <FloatingNav />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  heading: { flexDirection: "row", alignItems: "center", gap: 14, marginTop: 6 },
  headingText: { flex: 1, minWidth: 0, gap: 6 },
  contactRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  contactText: { flexShrink: 1 },
  avatar: { width: 62, height: 62, borderRadius: 31, borderWidth: 1.5, overflow: "hidden", alignItems: "center", justifyContent: "center" },
  avatarFill: { alignItems: "center", justifyContent: "center" },
  error: { flexDirection: "row", alignItems: "center", gap: 8, padding: 12, borderWidth: 1 },
  errorText: { flex: 1 },
  banner: { minHeight: 132, overflow: "hidden", justifyContent: "center" },
  bannerCoin: { position: "absolute", right: -10, bottom: -8 },
  bannerCopy: { padding: 20, gap: 5, maxWidth: "66%" },
  bannerCta: { flexDirection: "row", alignItems: "center", gap: 2, marginTop: 4 },
  tiles: { flexDirection: "row", gap: 10 },
  tile: { flex: 1, height: 96, alignItems: "center", justifyContent: "center", gap: 10, borderWidth: StyleSheet.hairlineWidth },
  dot: { position: "absolute", top: -2, right: -4, width: 11, height: 11, borderRadius: 6, borderWidth: 2 },
  card: { borderWidth: StyleSheet.hairlineWidth, overflow: "hidden" },
  rowInner: { flexDirection: "row", alignItems: "center", gap: 14, paddingHorizontal: 14, minHeight: 66 },
  rowIcon: { width: 42, height: 42, borderRadius: 21, alignItems: "center", justifyContent: "center" },
  rowLabel: { flex: 1, minWidth: 0 },
  valuePill: { paddingHorizontal: 12, height: 30, borderRadius: 15, alignItems: "center", justifyContent: "center" },
  segment: { flexDirection: "row", gap: 4, margin: 12, marginTop: 0, padding: 4, borderRadius: 16 },
  segmentItem: { flex: 1, height: 42, borderRadius: 13, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6 },
  badge: { paddingHorizontal: 10, height: 24, borderRadius: 8, alignItems: "center", justifyContent: "center" },
  sectionLabel: { marginBottom: 6 },
  infoRow: { flexDirection: "row", alignItems: "center", gap: 14, minHeight: 62 },
  count: { minWidth: 26, height: 24, paddingHorizontal: 8, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  signOut: { height: 54, borderWidth: 1.2, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8 },
  version: { textAlign: "center" },
});
