import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import * as Clipboard from "expo-clipboard";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import AppFooter from "../components/AppFooter";
import BottomNavBar from "../components/BottomNavBar";
import AuthGateShell from "../components/AuthGateShell";
import CustomerScreenShell from "../components/CustomerScreenShell";
import ScreenPageHeader from "../components/ScreenPageHeader";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import { useTheme } from "../context/ThemeContext";
import {
  fetchMyRewardCoupons,
  fetchRewardsCatalog,
  redeemRewardRequest,
} from "../services/userService";
import { customerInnerPageScrollContent, customerScrollFill } from "../theme/screenLayout";
import { ALCHEMY } from "../theme/customerAlchemy";
import { icon, layout, radius, spacing, typography } from "../theme/tokens";
import { formatINR } from "../utils/currency";
import PremiumButton from "../components/ui/PremiumButton";
import PremiumCard from "../components/ui/PremiumCard";
import PremiumChip from "../components/ui/PremiumChip";
import PremiumEmptyState from "../components/ui/PremiumEmptyState";
import PremiumErrorBanner from "../components/ui/PremiumErrorBanner";
import PremiumLoader from "../components/ui/PremiumLoader";
import PremiumSectionHeader from "../components/ui/PremiumSectionHeader";
import GoldHairline from "../components/ui/GoldHairline";
import PremiumStatCard from "../components/ui/PremiumStatCard";
import MotionScrollView from "../components/motion/MotionScrollView";
import SectionReveal from "../components/motion/SectionReveal";
import { REDEEM_REWARDS_SCREEN, fillPlaceholders } from "../content/appContent";

function formatExpiryShort(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

export default function RedeemRewardsScreen({ navigation }) {
  const { colors: c, isDark, shadowPremium } = useTheme();
  const styles = useMemo(() => createStyles(c, isDark, shadowPremium), [c, isDark, shadowPremium]);
  const insets = useSafeAreaInsets();
  const { isAuthenticated, isAuthLoading, token, user, refreshProfile } = useAuth();
  const { totalAmount } = useCart();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");
  const [catalog, setCatalog] = useState([]);
  const [wallet, setWallet] = useState([]);
  const [balance, setBalance] = useState(Number(user?.rewardPoints || 0));
  const [catalogSubtotal, setCatalogSubtotal] = useState(null);
  const [busyId, setBusyId] = useState("");
  const [lastRedeem, setLastRedeem] = useState(null);

  const load = useCallback(async () => {
    if (!token) return;
    try {
      setLoading(true);
      setError("");
      const [catalogData, walletData] = await Promise.all([
        fetchRewardsCatalog(totalAmount),
        fetchMyRewardCoupons(),
      ]);
      setCatalog(Array.isArray(catalogData?.rewards) ? catalogData.rewards : []);
      setBalance(Number(catalogData?.rewardPoints ?? user?.rewardPoints ?? 0));
      setCatalogSubtotal(
        catalogData?.catalogSubtotal !== undefined && catalogData?.catalogSubtotal !== null
          ? Number(catalogData.catalogSubtotal)
          : null
      );
      setWallet(Array.isArray(walletData?.coupons) ? walletData.coupons : []);
    } catch (err) {
      setError(err.message || REDEEM_REWARDS_SCREEN.loadErrorFallback);
    } finally {
      setLoading(false);
    }
  }, [token, totalAmount, user?.rewardPoints]);

  useEffect(() => {
    setBalance(Number(user?.rewardPoints || 0));
  }, [user?.rewardPoints]);

  useEffect(() => {
    if (!isAuthenticated || !token) return;
    load();
  }, [isAuthenticated, token, load]);

  const copyCode = useCallback(async (code, label) => {
    const s = String(code || "").trim();
    if (!s) return;
    try {
      await Clipboard.setStringAsync(s);
      setToast(label ? `${label} copied` : "Code copied");
    } catch {
      setToast("Could not copy");
    }
  }, []);

  const handleRedeem = async (rewardId) => {
    if (!rewardId || busyId) return;
    try {
      setBusyId(rewardId);
      setError("");
      setToast("");
      setLastRedeem(null);
      const result = await redeemRewardRequest(rewardId);
      setLastRedeem({
        code: result.couponCode,
        expiresAt: result.couponExpiresAt || null,
      });
      setBalance(Number(result?.rewardPoints ?? 0));
      setToast("Reward unlocked — your code is ready below.");
      await refreshProfile({ force: true });
      await load();
    } catch (err) {
      setError(err.message || "Could not redeem.");
    } finally {
      setBusyId("");
    }
  };

  const goToCartWithCode = (code) => {
    navigation.navigate("Cart", { prefillCoupon: String(code || "").trim().toUpperCase() });
  };

  const heroColors = useMemo(
    () => (isDark ? [c.background, c.surfaceMuted] : [ALCHEMY.creamAlt, c.surface]),
    [isDark, c]
  );

  if (isAuthLoading || !isAuthenticated) {
    return <AuthGateShell />;
  }

  return (
    <CustomerScreenShell style={styles.screen}>
      <MotionScrollView
        style={customerScrollFill}
        contentContainerStyle={customerInnerPageScrollContent(insets)}
        showsVerticalScrollIndicator={false}
      >
        <LinearGradient colors={heroColors} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.hero}>
          {!isDark ? <View style={styles.heroHairline} /> : null}
          <ScreenPageHeader
            navigation={navigation}
            title={REDEEM_REWARDS_SCREEN.pageTitle}
            subtitle={REDEEM_REWARDS_SCREEN.pageSubtitle}
          />
        </LinearGradient>
        <GoldHairline marginVertical={spacing.sm} />

        <SectionReveal delay={40} preset="fade-up">
          <PremiumStatCard
            compact
            align="center"
            iconName="sparkles-outline"
            label={REDEEM_REWARDS_SCREEN.balanceLabel}
            value={`${balance} pts`}
            tone="gold"
            style={styles.balanceCard}
          />
          <Text style={[styles.howItWorks, { color: c.textSecondary }]}>{REDEEM_REWARDS_SCREEN.howItWorks}</Text>
          {Number(totalAmount) > 0 ? (
            <Text style={[styles.subtotalHint, { color: c.textMuted }]}>
              {fillPlaceholders(REDEEM_REWARDS_SCREEN.subtotalHintWithCart, {
                amount: formatINR(totalAmount),
              })}
            </Text>
          ) : (
            <Text style={[styles.subtotalHint, { color: c.textMuted }]}>
              {REDEEM_REWARDS_SCREEN.subtotalHintEmpty}
            </Text>
          )}
        </SectionReveal>

        {error ? (
          <PremiumErrorBanner severity="error" message={error} onClose={() => setError("")} compact />
        ) : null}
        {toast ? (
          <PremiumErrorBanner severity="success" message={toast} onClose={() => setToast("")} compact />
        ) : null}

        {lastRedeem?.code ? (
          <PremiumCard padding="lg" goldAccent variant="hero" style={styles.successCard}>
            <Text style={[styles.successTitle, { color: c.textPrimary }]}>
              {REDEEM_REWARDS_SCREEN.successCouponTitle}
            </Text>
            <Pressable
              onPress={() => copyCode(lastRedeem.code, "Code")}
              style={[styles.codeBox, { borderColor: c.primaryBorder, backgroundColor: c.primarySoft }]}
            >
              <Text style={[styles.codeText, { color: c.textPrimary }]} selectable>
                {lastRedeem.code}
              </Text>
              <Ionicons name="copy-outline" size={icon.sm} color={c.primary} />
            </Pressable>
            {lastRedeem.expiresAt ? (
              <Text style={[styles.expiryLine, { color: c.textSecondary }]}>
                {REDEEM_REWARDS_SCREEN.useBeforePrefix} {formatExpiryShort(lastRedeem.expiresAt)}
              </Text>
            ) : null}
            <View style={styles.successRow}>
              <PremiumButton
                label={REDEEM_REWARDS_SCREEN.successCopyCta}
                iconLeft="copy-outline"
                variant="secondary"
                size="sm"
                onPress={() => copyCode(lastRedeem.code, "Code")}
                style={styles.successBtn}
              />
              <PremiumButton
                label={REDEEM_REWARDS_SCREEN.successCartCta}
                iconLeft="cart-outline"
                variant="primary"
                size="sm"
                onPress={() => goToCartWithCode(lastRedeem.code)}
                style={styles.successBtn}
              />
            </View>
          </PremiumCard>
        ) : null}

        <PremiumSectionHeader
          title={REDEEM_REWARDS_SCREEN.codesSectionTitle}
          subtitle={REDEEM_REWARDS_SCREEN.codesSectionSubtitle}
          compact
        />
        {loading ? (
          <PremiumLoader size="sm" caption={REDEEM_REWARDS_SCREEN.loadingCodesCaption} />
        ) : wallet.length === 0 ? (
          <Text style={[styles.walletEmpty, { color: c.textMuted }]}>{REDEEM_REWARDS_SCREEN.walletEmpty}</Text>
        ) : (
          wallet.map((w) => (
            <PremiumCard key={String(w._id || w.code)} padding="md" variant="panel" style={styles.walletCard}>
              <View style={styles.walletRow}>
                <View style={styles.walletLeft}>
                  <Text style={[styles.walletCode, { color: c.textPrimary }]}>{w.code}</Text>
                  <Text style={[styles.walletMeta, { color: c.textSecondary }]}>
                    {w.benefitSummary}
                    {w.minOrderAmount > 0 ? ` · Min ${formatINR(w.minOrderAmount)}` : ""}
                  </Text>
                  <Text style={[styles.walletExpiry, { color: c.textMuted }]}>
                    Expires {formatExpiryShort(w.expiresAt)}
                  </Text>
                </View>
                <View style={styles.walletActions}>
                  <PremiumButton
                    label="Copy"
                    variant="ghost"
                    size="sm"
                    onPress={() => copyCode(w.code, "Code")}
                  />
                  <PremiumButton
                    label="Cart"
                    variant="secondary"
                    size="sm"
                    onPress={() => goToCartWithCode(w.code)}
                  />
                </View>
              </View>
            </PremiumCard>
          ))
        )}

        <PremiumSectionHeader
          title={REDEEM_REWARDS_SCREEN.catalogSectionTitle}
          subtitle={REDEEM_REWARDS_SCREEN.catalogSectionSubtitle}
          compact
        />

        {loading ? (
          <PremiumLoader size="sm" caption={REDEEM_REWARDS_SCREEN.loadingCatalogCaption} />
        ) : catalog.length === 0 ? (
          <PremiumEmptyState
            iconName="gift-outline"
            title={REDEEM_REWARDS_SCREEN.emptyCatalogTitle}
            description={REDEEM_REWARDS_SCREEN.emptyCatalogDescription}
            compact
          />
        ) : (
          catalog.map((item) => (
            <PremiumCard key={item._id} padding="md" variant="panel" style={styles.rewardCard}>
              <View style={styles.rewardTop}>
                <Text style={[styles.rewardTitle, { color: c.textPrimary }]}>{item.title}</Text>
                <Text style={[styles.costPill, { color: c.primary, borderColor: c.primaryBorder }]}>
                  {item.pointsCost} pts
                </Text>
              </View>
              {item.description ? (
                <Text style={[styles.desc, { color: c.textSecondary }]}>{item.description}</Text>
              ) : null}
              <Text style={[styles.benefit, { color: c.textPrimary }]}>
                {item.benefitSummary}
                {item.minOrderAmount > 0 ? ` · Min order ${formatINR(item.minOrderAmount)}` : ""}
              </Text>
              {item.expiresAt ? (
                <Text style={[styles.offerEnd, { color: c.textMuted }]}>
                  Offer ends {formatExpiryShort(item.expiresAt)}
                </Text>
              ) : null}
              {catalogSubtotal != null &&
              item.estimatedDiscount != null &&
              Number(item.estimatedDiscount) > 0 &&
              item.eligibleForSubtotal ? (
                <Text style={[styles.estSave, { color: c.secondaryDark }]}>
                  ≈ Save {formatINR(item.estimatedDiscount)} on current cart
                </Text>
              ) : null}
              {catalogSubtotal != null && item.eligibleForSubtotal === false && Number(totalAmount) > 0 ? (
                <Text style={[styles.estBlocked, { color: c.textMuted }]}>
                  Cart below minimum for this offer — add more to qualify.
                </Text>
              ) : null}
              <View style={styles.chipRow}>
                {typeof item.pointsNeeded === "number" && item.pointsNeeded > 0 ? (
                  <PremiumChip
                    label={`Need ${item.pointsNeeded} more pts`}
                    tone="neutral"
                    size="xs"
                  />
                ) : null}
                {item.disabledReason && !item.canRedeem ? (
                  <PremiumChip label={item.disabledReason} tone="neutral" size="xs" />
                ) : null}
              </View>
              <PremiumButton
                label={busyId === item._id ? "Redeeming…" : "Redeem"}
                iconLeft="gift-outline"
                variant={item.canRedeem ? "primary" : "subtle"}
                size="sm"
                disabled={!item.canRedeem || busyId === item._id}
                loading={busyId === item._id}
                onPress={() => handleRedeem(item._id)}
                fullWidth
                style={styles.redeemBtn}
              />
            </PremiumCard>
          ))
        )}

        <PremiumButton
          label="Open cart"
          iconLeft="cart-outline"
          variant="ghost"
          size="sm"
          onPress={() => navigation.navigate("Cart")}
          style={styles.cartLink}
        />

        <AppFooter />
      </MotionScrollView>
      <BottomNavBar navigation={navigation} />
    </CustomerScreenShell>
  );
}

function createStyles(c, isDark, shadowPremium) {
  return StyleSheet.create({
    screen: {
      flex: 1,
      width: "100%",
      alignSelf: "center",
      maxWidth: Platform.select({ web: layout.maxContentWidth + 72, default: "100%" }),
    },
    hero: {
      borderRadius: radius.xxl,
      padding: spacing.md,
      marginBottom: spacing.md,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: isDark ? c.border : ALCHEMY.pillInactive,
      overflow: "hidden",
      ...Platform.select({
        web: shadowPremium,
        default: {},
      }),
    },
    heroHairline: {
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      height: 3,
      backgroundColor: ALCHEMY.gold,
      opacity: 0.95,
    },
    balanceCard: {
      marginBottom: spacing.xs,
      ...Platform.select({
        web: shadowPremium,
        default: {},
      }),
    },
    howItWorks: {
      fontSize: typography.bodySmall,
      lineHeight: 20,
      marginTop: spacing.sm,
    },
    subtotalHint: {
      fontSize: typography.caption,
      marginTop: spacing.xs,
      marginBottom: spacing.md,
    },
    successCard: {
      marginBottom: spacing.md,
    },
    successTitle: {
      fontWeight: "800",
      fontSize: typography.bodySmall,
      marginBottom: spacing.sm,
      letterSpacing: 0.3,
    },
    codeBox: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.md,
      borderRadius: radius.md,
      borderWidth: 1,
      gap: spacing.sm,
    },
    codeText: {
      fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
      fontSize: typography.body,
      fontWeight: "800",
      letterSpacing: 0.5,
      flex: 1,
    },
    expiryLine: {
      marginTop: spacing.sm,
      fontSize: typography.caption,
    },
    successRow: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: spacing.sm,
      marginTop: spacing.md,
    },
    successBtn: {
      flex: 1,
      minWidth: 120,
    },
    walletEmpty: {
      fontSize: typography.caption,
      marginBottom: spacing.md,
    },
    walletCard: {
      marginBottom: spacing.sm,
    },
    walletRow: {
      flexDirection: "row",
      alignItems: "flex-start",
      justifyContent: "space-between",
      gap: spacing.sm,
    },
    walletLeft: {
      flex: 1,
      minWidth: 0,
    },
    walletCode: {
      fontWeight: "800",
      fontSize: typography.bodySmall,
      fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
    },
    walletMeta: {
      marginTop: 4,
      fontSize: typography.caption,
    },
    walletExpiry: {
      marginTop: 4,
      fontSize: typography.caption,
    },
    walletActions: {
      flexShrink: 0,
      gap: spacing.xs,
    },
    rewardCard: {
      marginBottom: spacing.sm,
    },
    rewardTop: {
      flexDirection: "row",
      alignItems: "flex-start",
      justifyContent: "space-between",
      gap: spacing.sm,
    },
    rewardTitle: {
      flex: 1,
      fontWeight: "800",
      fontSize: typography.body,
    },
    costPill: {
      fontWeight: "800",
      fontSize: typography.caption,
      paddingHorizontal: spacing.sm,
      paddingVertical: 4,
      borderRadius: 999,
      borderWidth: 1,
      overflow: "hidden",
    },
    desc: {
      marginTop: spacing.xs,
      fontSize: typography.bodySmall,
      lineHeight: 18,
    },
    benefit: {
      marginTop: spacing.sm,
      fontSize: typography.bodySmall,
      fontWeight: "700",
    },
    offerEnd: {
      marginTop: 4,
      fontSize: typography.caption,
    },
    estSave: {
      marginTop: spacing.xs,
      fontSize: typography.caption,
      fontWeight: "700",
    },
    estBlocked: {
      marginTop: spacing.xs,
      fontSize: typography.caption,
    },
    chipRow: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: spacing.xs,
      marginTop: spacing.sm,
    },
    redeemBtn: {
      marginTop: spacing.sm,
    },
    cartLink: {
      marginTop: spacing.md,
      alignSelf: "flex-start",
    },
  });
}
