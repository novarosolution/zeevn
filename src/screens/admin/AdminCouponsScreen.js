import React, { useCallback, useEffect, useMemo, useState } from "react";
import { KeyboardAvoidingView, Platform, StyleSheet, Text, View, useWindowDimensions } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "../../context/AuthContext";
import OpsAdminScreen from "../../components/ops/OpsAdminScreen";
import { useTheme } from "../../context/ThemeContext";
import { createAdminCoupon, fetchAdminCoupons, updateAdminCoupon } from "../../services/adminService";
import { adminPanel } from "../../theme/adminLayout";
import MotionScrollView from "../../components/motion/MotionScrollView";
import SectionReveal from "../../components/motion/SectionReveal";
import { adminInnerPageScrollContent, customerScrollFill } from "../../theme/screenLayout";
import { layout, radius, spacing } from "../../theme/tokens";
import Loader from "../../components/ui/Loader";
import EmptyState from "../../components/ui/EmptyState";
import ErrorBanner from "../../components/ui/ErrorBanner";
import Input from "../../components/ui/Input";
import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";
import Chip from "../../components/ui/Chip";
import Switch from "../../components/ui/Switch";
import { ADMIN_SCREEN_COPY, APP_LOADING_UI } from "../../content/appContent";

export default function AdminCouponsScreen({ navigation }) {
  const { width } = useWindowDimensions();
  const isWideWeb = Platform.OS === "web" && width >= 1180;
  const { colors: c, shadowPremium } = useTheme();
  const styles = useMemo(() => createAdminCouponsStyles(c, shadowPremium), [c, shadowPremium]);
  const insets = useSafeAreaInsets();
  const { user, token } = useAuth();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [coupons, setCoupons] = useState([]);
  const [form, setForm] = useState({
    code: "",
    title: "",
    type: "percent",
    value: "",
    minOrderAmount: "",
    maxDiscountAmount: "",
    usageLimit: "",
    expiresAt: "",
    isActive: true,
    isVisibleToUsers: true,
    isOneTimePerUser: false,
  });

  const loadCoupons = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const list = await fetchAdminCoupons(token);
      setCoupons(list);
    } catch (err) {
      setError(err.message || "Unable to load coupons.");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (!user?.isAdmin) return;
    loadCoupons();
  }, [user, loadCoupons]);

  const handleCreate = async () => {
    try {
      setSubmitting(true);
      setError("");
      setSuccess("");
      await createAdminCoupon(token, {
        ...form,
        code: String(form.code || "").trim().toUpperCase(),
        value: Number(form.value || 0),
        minOrderAmount: Number(form.minOrderAmount || 0),
        maxDiscountAmount: form.maxDiscountAmount === "" ? null : Number(form.maxDiscountAmount),
        usageLimit: form.usageLimit === "" ? null : Number(form.usageLimit),
        expiresAt: form.expiresAt ? new Date(form.expiresAt).toISOString() : null,
      });
      setSuccess("Coupon created successfully.");
      setForm({
        code: "",
        title: "",
        type: "percent",
        value: "",
        minOrderAmount: "",
        maxDiscountAmount: "",
        usageLimit: "",
        expiresAt: "",
        isActive: true,
        isVisibleToUsers: true,
        isOneTimePerUser: false,
      });
      await loadCoupons();
    } catch (err) {
      setError(err.message || "Unable to create coupon.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleActive = async (coupon) => {
    try {
      setError("");
      await updateAdminCoupon(token, coupon._id, { isActive: !coupon.isActive });
      await loadCoupons();
    } catch (err) {
      setError(err.message || "Unable to update coupon.");
    }
  };

  const handleToggleVisibility = async (coupon) => {
    try {
      setError("");
      await updateAdminCoupon(token, coupon._id, { isVisibleToUsers: !coupon.isVisibleToUsers });
      await loadCoupons();
    } catch (err) {
      setError(err.message || "Unable to update coupon visibility.");
    }
  };

  const handleToggleOneTime = async (coupon) => {
    try {
      setError("");
      await updateAdminCoupon(token, coupon._id, { isOneTimePerUser: !coupon.isOneTimePerUser });
      await loadCoupons();
    } catch (err) {
      setError(err.message || "Unable to update one-time coupon setting.");
    }
  };

  return (
    <OpsAdminScreen navigation={navigation} activeRoute="AdminCoupons" sectionTitle="Manage coupons">
          {error ? (
            <View style={styles.bannerSpacer}>
              <ErrorBanner severity="error" message={error} onClose={() => setError("")} compact />
            </View>
          ) : null}
          {success ? (
            <View style={styles.bannerSpacer}>
              <ErrorBanner severity="success" message={success} onClose={() => setSuccess("")} compact />
            </View>
          ) : null}
          
          <View style={isWideWeb ? styles.workspaceGrid : null}>
          <View style={isWideWeb ? styles.workspacePrimary : null}>
                    <Card padding="lg" style={styles.formCard}>
            <Text style={[styles.formTitle, { color: c.textPrimary }]}>{ADMIN_SCREEN_COPY.coupons.createTitle}</Text>
            <View style={styles.fieldGap}>
              <Input
                label="Coupon code"
                value={form.code}
                onChangeText={(value) => setForm((current) => ({ ...current, code: value }))}
                placeholder="e.g. SAVE20"
                autoCapitalize="characters"
                iconLeft="pricetag-outline"
              />
            </View>
            <View style={styles.fieldGap}>
              <Input
                label="Title (optional)"
                value={form.title}
                onChangeText={(value) => setForm((current) => ({ ...current, title: value }))}
                iconLeft="text-outline"
              />
            </View>
            <View style={styles.typeRow}>
              <Chip
                label="Percent"
                tone="gold"
                size="md"
                selected={form.type === "percent"}
                onPress={() => setForm((current) => ({ ...current, type: "percent" }))}
                style={styles.typeChipFlex}
              />
              <Chip
                label="Flat"
                tone="gold"
                size="md"
                selected={form.type === "flat"}
                onPress={() => setForm((current) => ({ ...current, type: "flat" }))}
                style={styles.typeChipFlex}
              />
            </View>
            <View style={styles.fieldGap}>
              <Input
                label={form.type === "percent" ? "Discount %" : "Flat discount amount"}
                value={form.value}
                onChangeText={(value) => setForm((current) => ({ ...current, value }))}
                placeholder={form.type === "percent" ? "e.g. 20" : "Amount"}
                keyboardType="decimal-pad"
                iconLeft="calculator-outline"
              />
            </View>
            <View style={styles.fieldGap}>
              <Input
                label="Minimum order amount (optional)"
                value={form.minOrderAmount}
                onChangeText={(value) => setForm((current) => ({ ...current, minOrderAmount: value }))}
                keyboardType="decimal-pad"
                iconLeft="cart-outline"
              />
            </View>
            <View style={styles.fieldGap}>
              <Input
                label="Max discount amount (optional)"
                value={form.maxDiscountAmount}
                onChangeText={(value) => setForm((current) => ({ ...current, maxDiscountAmount: value }))}
                keyboardType="decimal-pad"
                iconLeft="trending-down-outline"
              />
            </View>
            <View style={styles.fieldGap}>
              <Input
                label="Usage limit (optional)"
                value={form.usageLimit}
                onChangeText={(value) => setForm((current) => ({ ...current, usageLimit: value }))}
                keyboardType="number-pad"
                iconLeft="people-outline"
              />
            </View>
            <View style={styles.fieldGap}>
              <Input
                label="Expiry (YYYY-MM-DD, optional)"
                value={form.expiresAt}
                onChangeText={(value) => setForm((current) => ({ ...current, expiresAt: value }))}
                placeholder="2026-12-31"
                autoCapitalize="none"
                iconLeft="calendar-outline"
              />
            </View>
            <View style={styles.toggleRow}>
              <Switch
                label="Active"
                hint="Coupon can be applied at checkout"
                value={Boolean(form.isActive)}
                onChange={(value) => setForm((current) => ({ ...current, isActive: value }))}
              />
            </View>
            <View style={styles.toggleRow}>
              <Switch
                label="Show to users at checkout"
                hint="Visible while browsing offers and checkout"
                value={Boolean(form.isVisibleToUsers)}
                onChange={(value) =>
                  setForm((current) => ({ ...current, isVisibleToUsers: value }))
                }
              />
            </View>
            <View style={styles.toggleRow}>
              <Switch
                label="One time per user"
                hint="Prevent repeat redemption from the same account"
                value={Boolean(form.isOneTimePerUser)}
                onChange={(value) =>
                  setForm((current) => ({ ...current, isOneTimePerUser: value }))
                }
              />
            </View>
            <Button
              label={submitting ? "Creating..." : "Create Coupon"}
              variant="primary"
              size="md"
              onPress={handleCreate}
              disabled={submitting}
              loading={submitting}
              fullWidth
              style={styles.createBtnMargin}
            />
          </Card>
                    </View>

          <View style={isWideWeb ? styles.workspaceSecondary : null}>
                    <Text style={[styles.listTitle, { color: c.textPrimary }]}>{ADMIN_SCREEN_COPY.coupons.listTitle}</Text>
          {loading ? (
            <Loader size="sm" caption={APP_LOADING_UI.inline.admin} />
          ) : coupons.length === 0 ? (
            <EmptyState
              iconName="pricetag-outline"
              title={ADMIN_SCREEN_COPY.coupons.emptyTitle}
              description={ADMIN_SCREEN_COPY.coupons.emptyDescription}
              compact
            />
          ) : (
            coupons.map((coupon) => (
              <Card key={coupon._id} padding="md" style={styles.couponCard}>
                <View style={styles.couponTopRow}>
                  <Text style={[styles.couponCode, { color: c.textPrimary }]}>{coupon.code}</Text>
                  <Chip
                    label={coupon.isActive ? "Active" : "Inactive"}
                    tone={coupon.isActive ? "green" : "neutral"}
                    size="xs"
                  />
                </View>
                <Text style={[styles.couponMeta, { color: c.textSecondary }]}>
                  {coupon.type === "percent" ? `${coupon.value}% off` : `${coupon.value} off`} • Min order: {coupon.minOrderAmount || 0}
                </Text>
                <Text style={[styles.couponMeta, { color: c.textSecondary }]}>
                  Used: {coupon.usedCount || 0}
                  {coupon.usageLimit ? ` / ${coupon.usageLimit}` : ""}
                </Text>
                <Text style={[styles.couponMeta, { color: c.textSecondary }]}>
                  User visibility: {coupon.isVisibleToUsers ? "Shown" : "Hidden"} •
                  One-time per user: {coupon.isOneTimePerUser ? "Yes" : "No"}
                </Text>
                <Text style={[styles.couponMeta, { color: c.textSecondary }]}>
                  Expires: {coupon.expiresAt ? new Date(coupon.expiresAt).toLocaleDateString() : "No expiry"}
                </Text>
                <View style={styles.rowSwitches}>
                  <View style={styles.switchRow}>
                    <Switch
                      label="Active"
                      value={Boolean(coupon.isActive)}
                      onChange={() => handleToggleActive(coupon)}
                    />
                  </View>
                  <View style={styles.switchRow}>
                    <Switch
                      label="Visible"
                      value={Boolean(coupon.isVisibleToUsers)}
                      onChange={() => handleToggleVisibility(coupon)}
                    />
                  </View>
                  <View style={styles.switchRow}>
                    <Switch
                      label="One-Time"
                      value={Boolean(coupon.isOneTimePerUser)}
                      onChange={() => handleToggleOneTime(coupon)}
                    />
                  </View>
                </View>
              </Card>
            ))
          )}
                    </View>
          </View>
                </OpsAdminScreen>
  );
}

function createAdminCouponsStyles(c, shadowPremium) {
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
      color: c.textPrimary,
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
      color: c.textPrimary,
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
    couponCard: {
      marginBottom: spacing.sm,
    },
    couponTopRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: spacing.sm,
    },
    couponCode: {
      fontSize: 14,
      fontWeight: "800",
    },
    couponMeta: {
      marginTop: 4,
      fontSize: 12,
    },
    switchRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
    },
    rowSwitches: {
      marginTop: spacing.xs,
      flexDirection: "row",
      flexWrap: "wrap",
      gap: spacing.sm,
    },
    switchLabel: {
      fontSize: 12,
      fontWeight: "600",
    },
  });
}
