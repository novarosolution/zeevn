import React, { useCallback, useEffect, useMemo, useState } from "react";
import { KeyboardAvoidingView, Platform, StyleSheet, Text, View, useWindowDimensions } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import AppFooter from "../../components/AppFooter";
import CustomerScreenShell from "../../components/CustomerScreenShell";
import AdminBackLink from "../../components/admin/AdminBackLink";
import AdminPageHeading from "../../components/admin/AdminPageHeading";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";
import {
  createAdminReward,
  fetchAdminRewards,
  updateAdminReward,
} from "../../services/adminService";
import { adminPanel } from "../../theme/adminLayout";
import MotionScrollView from "../../components/motion/MotionScrollView";
import SectionReveal from "../../components/motion/SectionReveal";
import { adminInnerPageScrollContent, customerScrollFill } from "../../theme/screenLayout";
import { layout, radius, spacing } from "../../theme/tokens";
import PremiumLoader from "../../components/ui/PremiumLoader";
import PremiumEmptyState from "../../components/ui/PremiumEmptyState";
import PremiumErrorBanner from "../../components/ui/PremiumErrorBanner";
import PremiumInput from "../../components/ui/PremiumInput";
import PremiumButton from "../../components/ui/PremiumButton";
import PremiumCard from "../../components/ui/PremiumCard";
import PremiumChip from "../../components/ui/PremiumChip";
import PremiumSwitch from "../../components/ui/PremiumSwitch";
import { ADMIN_SCREEN_COPY, APP_LOADING_UI } from "../../content/appContent";

export default function AdminRewardsScreen({ navigation }) {
  const { width } = useWindowDimensions();
  const isWideWeb = Platform.OS === "web" && width >= 1180;
  const { colors: c, shadowPremium } = useTheme();
  const styles = useMemo(() => createStyles(c, shadowPremium), [c, shadowPremium]);
  const insets = useSafeAreaInsets();
  const { user, token } = useAuth();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [rewards, setRewards] = useState([]);
  const [form, setForm] = useState({
    title: "",
    description: "",
    pointsCost: "",
    discountType: "percent",
    discountValue: "",
    minOrderAmount: "",
    maxDiscountAmount: "",
    totalRedemptionLimit: "",
    perUserLimit: "1",
    issuedCouponValidDays: "90",
    expiresAt: "",
    isActive: true,
    isVisibleToUsers: true,
  });

  const loadRewards = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const list = await fetchAdminRewards(token);
      setRewards(list);
    } catch (err) {
      setError(err.message || "Unable to load rewards.");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (!user?.isAdmin) return;
    loadRewards();
  }, [user, loadRewards]);

  const handleCreate = async () => {
    try {
      setSubmitting(true);
      setError("");
      setSuccess("");
      await createAdminReward(token, {
        title: form.title,
        description: form.description,
        pointsCost: Number(form.pointsCost || 0),
        discountType: form.discountType,
        discountValue: Number(form.discountValue || 0),
        minOrderAmount: Number(form.minOrderAmount || 0),
        maxDiscountAmount: form.maxDiscountAmount === "" ? null : Number(form.maxDiscountAmount),
        totalRedemptionLimit: form.totalRedemptionLimit === "" ? null : Number(form.totalRedemptionLimit),
        perUserLimit: Number(form.perUserLimit || 1),
        issuedCouponValidDays: Number(form.issuedCouponValidDays || 90),
        expiresAt: form.expiresAt ? new Date(form.expiresAt).toISOString() : null,
        isActive: form.isActive,
        isVisibleToUsers: form.isVisibleToUsers,
      });
      setSuccess("Reward created. Customers can redeem it for points in the Rewards screen.");
      setForm({
        title: "",
        description: "",
        pointsCost: "",
        discountType: "percent",
        discountValue: "",
        minOrderAmount: "",
        maxDiscountAmount: "",
        totalRedemptionLimit: "",
        perUserLimit: "1",
        issuedCouponValidDays: "90",
        expiresAt: "",
        isActive: true,
        isVisibleToUsers: true,
      });
      await loadRewards();
    } catch (err) {
      setError(err.message || "Unable to create reward.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleActive = async (reward) => {
    try {
      setError("");
      await updateAdminReward(token, reward._id, { isActive: !reward.isActive });
      await loadRewards();
    } catch (err) {
      setError(err.message || "Unable to update reward.");
    }
  };

  const handleToggleVisibility = async (reward) => {
    try {
      setError("");
      await updateAdminReward(token, reward._id, { isVisibleToUsers: !reward.isVisibleToUsers });
      await loadRewards();
    } catch (err) {
      setError(err.message || "Unable to update visibility.");
    }
  };

  if (user && !user.isAdmin) {
    return (
      <CustomerScreenShell style={styles.screen} variant="admin">
        <MotionScrollView
          style={customerScrollFill}
          contentContainerStyle={adminInnerPageScrollContent(insets)}
          showsVerticalScrollIndicator={false}
        >
          <SectionReveal delay={40} preset="fade-up">
            <View style={styles.panel}>
              <PremiumErrorBanner
                severity="warning"
                title="Admin access required"
                message="Sign in with an admin account to manage rewards."
              />
              <PremiumButton
                label="Back to Home"
                variant="primary"
                onPress={() => navigation.navigate("Home")}
                style={styles.gateCta}
              />
            </View>
          </SectionReveal>
        </MotionScrollView>
      </CustomerScreenShell>
    );
  }

  return (
    <CustomerScreenShell style={styles.screen} variant="admin">
      <KeyboardAvoidingView style={customerScrollFill} behavior={Platform.OS === "ios" ? "padding" : "height"}>
        <MotionScrollView
          style={customerScrollFill}
          contentContainerStyle={adminInnerPageScrollContent(insets)}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.panel}>
            <SectionReveal preset="fade-up" delay={0}>
              <AdminBackLink navigation={navigation} />
              <AdminPageHeading
                title={ADMIN_SCREEN_COPY.rewards.title}
                subtitle={ADMIN_SCREEN_COPY.rewards.subtitle}
              />

              {error ? (
                <View style={styles.bannerSpacer}>
                  <PremiumErrorBanner severity="error" message={error} onClose={() => setError("")} compact />
                </View>
              ) : null}
              {success ? (
                <View style={styles.bannerSpacer}>
                  <PremiumErrorBanner severity="success" message={success} onClose={() => setSuccess("")} compact />
                </View>
              ) : null}
            </SectionReveal>
              <View style={isWideWeb ? styles.workspaceGrid : null}>
              <View style={isWideWeb ? styles.workspacePrimary : null}>
              <SectionReveal preset="fade-up" delay={20}>
              <PremiumCard padding="lg" style={styles.formCard}>
                <Text style={[styles.formTitle, { color: c.textPrimary }]}>{ADMIN_SCREEN_COPY.rewards.createTitle}</Text>
                <View style={styles.fieldGap}>
                  <PremiumInput
                    label="Title"
                    value={form.title}
                    onChangeText={(value) => setForm((cur) => ({ ...cur, title: value }))}
                    iconLeft="gift-outline"
                  />
                </View>
                <View style={styles.fieldGap}>
                  <PremiumInput
                    label="Description"
                    value={form.description}
                    onChangeText={(value) => setForm((cur) => ({ ...cur, description: value }))}
                    multiline
                    numberOfLines={3}
                    iconLeft="document-text-outline"
                  />
                </View>
                <View style={styles.fieldGap}>
                  <PremiumInput
                    label="Points cost"
                    value={form.pointsCost}
                    onChangeText={(value) => setForm((cur) => ({ ...cur, pointsCost: value }))}
                    keyboardType="number-pad"
                    iconLeft="star-outline"
                  />
                </View>
                <View style={styles.typeRow}>
                  <PremiumChip
                    label="Percent off"
                    tone="gold"
                    size="md"
                    selected={form.discountType === "percent"}
                    onPress={() => setForm((cur) => ({ ...cur, discountType: "percent" }))}
                    style={styles.typeChipFlex}
                  />
                  <PremiumChip
                    label="Flat ₹ off"
                    tone="gold"
                    size="md"
                    selected={form.discountType === "flat"}
                    onPress={() => setForm((cur) => ({ ...cur, discountType: "flat" }))}
                    style={styles.typeChipFlex}
                  />
                </View>
                <View style={styles.fieldGap}>
                  <PremiumInput
                    label={form.discountType === "percent" ? "Discount %" : "Discount amount (₹)"}
                    value={form.discountValue}
                    onChangeText={(value) => setForm((cur) => ({ ...cur, discountValue: value }))}
                    keyboardType="decimal-pad"
                    iconLeft="pricetag-outline"
                  />
                </View>
                <View style={styles.fieldGap}>
                  <PremiumInput
                    label="Minimum order amount"
                    value={form.minOrderAmount}
                    onChangeText={(value) => setForm((cur) => ({ ...cur, minOrderAmount: value }))}
                    keyboardType="decimal-pad"
                    iconLeft="cart-outline"
                  />
                </View>
                <View style={styles.fieldGap}>
                  <PremiumInput
                    label="Max discount (optional, for %)"
                    value={form.maxDiscountAmount}
                    onChangeText={(value) => setForm((cur) => ({ ...cur, maxDiscountAmount: value }))}
                    keyboardType="decimal-pad"
                  />
                </View>
                <View style={styles.fieldGap}>
                  <PremiumInput
                    label="Global redemption cap (optional)"
                    value={form.totalRedemptionLimit}
                    onChangeText={(value) => setForm((cur) => ({ ...cur, totalRedemptionLimit: value }))}
                    keyboardType="number-pad"
                    helperText="Leave blank for unlimited total redeems"
                  />
                </View>
                <View style={styles.fieldGap}>
                  <PremiumInput
                    label="Max redeems per customer"
                    value={form.perUserLimit}
                    onChangeText={(value) => setForm((cur) => ({ ...cur, perUserLimit: value }))}
                    keyboardType="number-pad"
                  />
                </View>
                <View style={styles.fieldGap}>
                  <PremiumInput
                    label="Issued coupon valid (days)"
                    value={form.issuedCouponValidDays}
                    onChangeText={(value) => setForm((cur) => ({ ...cur, issuedCouponValidDays: value }))}
                    keyboardType="number-pad"
                  />
                </View>
                <View style={styles.fieldGap}>
                  <PremiumInput
                    label="Reward visible until (YYYY-MM-DD, optional)"
                    value={form.expiresAt}
                    onChangeText={(value) => setForm((cur) => ({ ...cur, expiresAt: value }))}
                    autoCapitalize="none"
                    iconLeft="calendar-outline"
                  />
                </View>
                <View style={styles.toggleRow}>
                  <PremiumSwitch
                    label="Active"
                    hint="Reward can be redeemed by customers"
                    value={Boolean(form.isActive)}
                    onChange={(value) => setForm((cur) => ({ ...cur, isActive: value }))}
                  />
                </View>
                <View style={styles.toggleRow}>
                  <PremiumSwitch
                    label="Show in customer Rewards shop"
                    hint="Controls storefront visibility in the rewards catalog"
                    value={Boolean(form.isVisibleToUsers)}
                    onChange={(value) => setForm((cur) => ({ ...cur, isVisibleToUsers: value }))}
                  />
                </View>
                <PremiumButton
                  label={submitting ? "Creating…" : "Create reward"}
                  variant="primary"
                  size="md"
                  onPress={handleCreate}
                  disabled={submitting}
                  loading={submitting}
                  fullWidth
                  style={styles.createBtnMargin}
                />
              </PremiumCard>
              </SectionReveal>
              </View>

            <View style={isWideWeb ? styles.workspaceSecondary : null}>
            <SectionReveal preset="fade-up" delay={60}>
              <Text style={[styles.listTitle, { color: c.textPrimary }]}>{ADMIN_SCREEN_COPY.rewards.listTitle}</Text>
              {loading ? (
                <PremiumLoader size="sm" caption={APP_LOADING_UI.inline.admin} />
              ) : rewards.length === 0 ? (
                <PremiumEmptyState
                  iconName="gift-outline"
                  title={ADMIN_SCREEN_COPY.rewards.emptyTitle}
                  description={ADMIN_SCREEN_COPY.rewards.emptyDescription}
                  compact
                />
              ) : (
                rewards.map((reward) => (
                  <PremiumCard key={reward._id} padding="md" style={styles.card}>
                    <View style={styles.cardTop}>
                      <Text style={[styles.cardTitle, { color: c.textPrimary }]}>{reward.title}</Text>
                      <PremiumChip
                        label={reward.isActive ? "Active" : "Inactive"}
                        tone={reward.isActive ? "green" : "neutral"}
                        size="xs"
                      />
                    </View>
                    <Text style={[styles.meta, { color: c.textSecondary }]}>
                      {reward.pointsCost} pts •{" "}
                      {reward.discountType === "percent"
                        ? `${reward.discountValue}% off`
                        : `₹${reward.discountValue} off`}
                      {" • "}Min order ₹{reward.minOrderAmount || 0}
                    </Text>
                    <Text style={[styles.meta, { color: c.textSecondary }]}>
                      Redeemed: {reward.redemptionCount || 0}
                      {reward.totalRedemptionLimit != null ? ` / ${reward.totalRedemptionLimit}` : ""} • Per user:{" "}
                      {reward.perUserLimit || 1}
                    </Text>
                    <Text style={[styles.meta, { color: c.textSecondary }]}>
                      Shop visibility: {reward.isVisibleToUsers ? "Shown" : "Hidden"} • Coupon validity:{" "}
                      {reward.issuedCouponValidDays || 90} days after redeem
                    </Text>
                    <Text style={[styles.meta, { color: c.textSecondary }]}>
                      Offer ends:{" "}
                      {reward.expiresAt ? new Date(reward.expiresAt).toLocaleDateString() : "No end date"}
                    </Text>
                    <View style={styles.rowSwitches}>
                      <View style={styles.switchRow}>
                        <PremiumSwitch
                          label="Active"
                          value={Boolean(reward.isActive)}
                          onChange={() => handleToggleActive(reward)}
                        />
                      </View>
                      <View style={styles.switchRow}>
                        <PremiumSwitch
                          label="Visible"
                          value={Boolean(reward.isVisibleToUsers)}
                          onChange={() => handleToggleVisibility(reward)}
                        />
                      </View>
                    </View>
                  </PremiumCard>
                ))
              )}
            </SectionReveal>
            </View>
            </View>
          </View>
          <AppFooter />
        </MotionScrollView>
      </KeyboardAvoidingView>
    </CustomerScreenShell>
  );
}

function createStyles(c, shadowPremium) {
  return StyleSheet.create({
    screen: {
      flex: 1,
      width: "100%",
      alignSelf: "center",
      maxWidth: Platform.select({ web: layout.maxContentWidth + 96, default: "100%" }),
    },
    panel: {
      ...adminPanel(c, shadowPremium),
    },
    gateCta: {
      marginTop: spacing.md,
      alignSelf: "flex-start",
    },
    formCard: {
      marginBottom: spacing.md,
    },
    formTitle: {
      fontWeight: "800",
      fontSize: 14,
      marginBottom: spacing.sm,
    },
    bannerSpacer: {
      marginBottom: spacing.sm,
    },
    fieldGap: {
      marginBottom: spacing.sm,
    },
    typeRow: {
      flexDirection: "row",
      gap: spacing.sm,
      marginBottom: spacing.sm,
    },
    typeChipFlex: {
      flex: 1,
    },
    createBtnMargin: {
      marginTop: spacing.sm,
    },
    toggleRow: {
      marginBottom: spacing.xs,
      borderWidth: 1,
      borderColor: c.border,
      borderRadius: radius.md,
      backgroundColor: c.surface,
      paddingHorizontal: spacing.sm,
      paddingVertical: 7,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    toggleLabel: {
      fontSize: 12,
      fontWeight: "700",
    },
    listTitle: {
      marginTop: spacing.md,
      marginBottom: spacing.sm,
      fontSize: 16,
      fontWeight: "800",
    },
    workspaceGrid: {
      flexDirection: "row",
      alignItems: "flex-start",
      gap: spacing.md,
    },
    workspacePrimary: {
      flex: 0.96,
      minWidth: 0,
    },
    workspaceSecondary: {
      flex: 1.04,
      minWidth: 0,
    },
    card: {
      marginBottom: spacing.sm,
    },
    cardTop: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: spacing.sm,
    },
    cardTitle: {
      fontSize: 14,
      fontWeight: "800",
      flex: 1,
    },
    meta: {
      marginTop: 4,
      fontSize: 12,
    },
    rowSwitches: {
      marginTop: spacing.xs,
      flexDirection: "row",
      flexWrap: "wrap",
      gap: spacing.md,
    },
    switchRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
    },
    switchLabel: {
      fontSize: 12,
      fontWeight: "600",
    },
  });
}
