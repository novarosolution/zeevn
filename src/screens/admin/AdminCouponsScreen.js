import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import AppFooter from "../../components/AppFooter";
import CustomerScreenShell from "../../components/CustomerScreenShell";
import AdminBackLink from "../../components/admin/AdminBackLink";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";
import { createAdminCoupon, fetchAdminCoupons, updateAdminCoupon } from "../../services/adminService";
import { adminPanel } from "../../theme/adminLayout";
import { customerScrollFill } from "../../theme/screenLayout";
import { fonts, layout, radius, spacing, typography } from "../../theme/tokens";

export default function AdminCouponsScreen({ navigation }) {
  const { colors: c, shadowPremium } = useTheme();
  const styles = useMemo(() => createAdminCouponsStyles(c, shadowPremium), [c, shadowPremium]);
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

  async function loadCoupons() {
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
  }

  useEffect(() => {
    if (!user?.isAdmin) return;
    loadCoupons();
  }, [user?.isAdmin]);

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

  if (user && !user.isAdmin) {
    return (
      <CustomerScreenShell style={styles.screen}>
        <ScrollView style={customerScrollFill} contentContainerStyle={styles.scrollContent}>
          <Text style={styles.errorText}>Admin access required.</Text>
        </ScrollView>
      </CustomerScreenShell>
    );
  }

  return (
    <CustomerScreenShell style={styles.screen}>
      <ScrollView style={customerScrollFill} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.panel}>
          <AdminBackLink navigation={navigation} />
          <Text style={styles.title}>Manage Coupons</Text>
          <Text style={styles.subtitle}>Create discount offers and control coupon availability.</Text>

          {error ? <Text style={styles.errorText}>{error}</Text> : null}
          {success ? <Text style={styles.successText}>{success}</Text> : null}

          <View style={styles.formCard}>
            <Text style={styles.formTitle}>Create Coupon</Text>
            <TextInput
              style={styles.input}
              placeholder="Coupon code (e.g. SAVE20)"
              placeholderTextColor={c.textMuted}
              value={form.code}
              onChangeText={(value) => setForm((current) => ({ ...current, code: value }))}
              autoCapitalize="characters"
            />
            <TextInput
              style={styles.input}
              placeholder="Coupon title (optional)"
              placeholderTextColor={c.textMuted}
              value={form.title}
              onChangeText={(value) => setForm((current) => ({ ...current, title: value }))}
            />
            <View style={styles.typeRow}>
              <TouchableOpacity
                style={[styles.typeBtn, form.type === "percent" ? styles.typeBtnActive : null]}
                onPress={() => setForm((current) => ({ ...current, type: "percent" }))}
              >
                <Text style={[styles.typeBtnText, form.type === "percent" ? styles.typeBtnTextActive : null]}>Percent</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.typeBtn, form.type === "flat" ? styles.typeBtnActive : null]}
                onPress={() => setForm((current) => ({ ...current, type: "flat" }))}
              >
                <Text style={[styles.typeBtnText, form.type === "flat" ? styles.typeBtnTextActive : null]}>Flat</Text>
              </TouchableOpacity>
            </View>
            <TextInput
              style={styles.input}
              placeholder={form.type === "percent" ? "Discount % (e.g. 20)" : "Flat discount amount"}
              placeholderTextColor={c.textMuted}
              keyboardType="numeric"
              value={form.value}
              onChangeText={(value) => setForm((current) => ({ ...current, value }))}
            />
            <TextInput
              style={styles.input}
              placeholder="Minimum order amount (optional)"
              placeholderTextColor={c.textMuted}
              keyboardType="numeric"
              value={form.minOrderAmount}
              onChangeText={(value) => setForm((current) => ({ ...current, minOrderAmount: value }))}
            />
            <TextInput
              style={styles.input}
              placeholder="Max discount amount (optional)"
              placeholderTextColor={c.textMuted}
              keyboardType="numeric"
              value={form.maxDiscountAmount}
              onChangeText={(value) => setForm((current) => ({ ...current, maxDiscountAmount: value }))}
            />
            <TextInput
              style={styles.input}
              placeholder="Usage limit (optional)"
              placeholderTextColor={c.textMuted}
              keyboardType="numeric"
              value={form.usageLimit}
              onChangeText={(value) => setForm((current) => ({ ...current, usageLimit: value }))}
            />
            <TextInput
              style={styles.input}
              placeholder="Expiry date (YYYY-MM-DD, optional)"
              placeholderTextColor={c.textMuted}
              value={form.expiresAt}
              onChangeText={(value) => setForm((current) => ({ ...current, expiresAt: value }))}
            />
            <View style={styles.toggleRow}>
              <Text style={styles.toggleLabel}>Active</Text>
              <Switch
                value={Boolean(form.isActive)}
                onValueChange={(value) => setForm((current) => ({ ...current, isActive: value }))}
              />
            </View>
            <View style={styles.toggleRow}>
              <Text style={styles.toggleLabel}>Show to users at checkout</Text>
              <Switch
                value={Boolean(form.isVisibleToUsers)}
                onValueChange={(value) =>
                  setForm((current) => ({ ...current, isVisibleToUsers: value }))
                }
              />
            </View>
            <View style={styles.toggleRow}>
              <Text style={styles.toggleLabel}>One time per user</Text>
              <Switch
                value={Boolean(form.isOneTimePerUser)}
                onValueChange={(value) =>
                  setForm((current) => ({ ...current, isOneTimePerUser: value }))
                }
              />
            </View>
            <TouchableOpacity style={styles.createBtn} onPress={handleCreate} disabled={submitting}>
              <Text style={styles.createBtnText}>{submitting ? "Creating..." : "Create Coupon"}</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.listTitle}>All Coupons</Text>
          {loading ? (
            <ActivityIndicator color={c.primary} />
          ) : coupons.length === 0 ? (
            <Text style={styles.emptyText}>No coupons yet.</Text>
          ) : (
            coupons.map((coupon) => (
              <View key={coupon._id} style={styles.couponCard}>
                <View style={styles.couponTopRow}>
                  <Text style={styles.couponCode}>{coupon.code}</Text>
                  <Text style={styles.switchLabel}>{coupon.isActive ? "Active" : "Inactive"}</Text>
                </View>
                <Text style={styles.couponMeta}>
                  {coupon.type === "percent" ? `${coupon.value}% off` : `${coupon.value} off`} • Min order: {coupon.minOrderAmount || 0}
                </Text>
                <Text style={styles.couponMeta}>
                  Used: {coupon.usedCount || 0}
                  {coupon.usageLimit ? ` / ${coupon.usageLimit}` : ""}
                </Text>
                <Text style={styles.couponMeta}>
                  User visibility: {coupon.isVisibleToUsers ? "Shown" : "Hidden"} •
                  One-time per user: {coupon.isOneTimePerUser ? "Yes" : "No"}
                </Text>
                <Text style={styles.couponMeta}>
                  Expires: {coupon.expiresAt ? new Date(coupon.expiresAt).toLocaleDateString() : "No expiry"}
                </Text>
                <View style={styles.rowSwitches}>
                  <View style={styles.switchRow}>
                    <Text style={styles.switchLabel}>Active</Text>
                    <Switch
                      value={Boolean(coupon.isActive)}
                      onValueChange={() => handleToggleActive(coupon)}
                    />
                  </View>
                  <View style={styles.switchRow}>
                    <Text style={styles.switchLabel}>Visible</Text>
                    <Switch
                      value={Boolean(coupon.isVisibleToUsers)}
                      onValueChange={() => handleToggleVisibility(coupon)}
                    />
                  </View>
                  <View style={styles.switchRow}>
                    <Text style={styles.switchLabel}>One-Time</Text>
                    <Switch
                      value={Boolean(coupon.isOneTimePerUser)}
                      onValueChange={() => handleToggleOneTime(coupon)}
                    />
                  </View>
                </View>
              </View>
            ))
          )}
        </View>
        <AppFooter />
      </ScrollView>
    </CustomerScreenShell>
  );
}

function createAdminCouponsStyles(c, shadowPremium) {
  return StyleSheet.create({
    screen: {
      flex: 1,
      width: "100%",
      alignSelf: "center",
      maxWidth: Platform.select({ web: layout.maxContentWidth, default: "100%" }),
    },
    scrollContent: {
      padding: spacing.lg,
      paddingBottom: spacing.xxl,
    },
    panel: {
      ...adminPanel(c, shadowPremium),
    },
    title: {
      color: c.textPrimary,
      fontSize: typography.h2,
      fontFamily: fonts.extrabold,
      letterSpacing: -0.35,
    },
    subtitle: {
      color: c.textSecondary,
      fontSize: 13,
      marginTop: spacing.xs,
      marginBottom: spacing.md,
    },
    formCard: {
      borderWidth: 1,
      borderColor: c.border,
      borderRadius: radius.md,
      backgroundColor: c.surfaceMuted,
      padding: spacing.md,
    },
    formTitle: {
      color: c.textPrimary,
      fontWeight: "800",
      fontSize: 14,
      marginBottom: spacing.sm,
    },
    input: {
      borderWidth: 1,
      borderColor: c.border,
      borderRadius: radius.md,
      backgroundColor: c.surface,
      color: c.textPrimary,
      paddingHorizontal: spacing.sm,
      paddingVertical: 10,
      fontSize: 13,
      marginBottom: spacing.sm,
    },
    typeRow: {
      flexDirection: "row",
      gap: spacing.sm,
      marginBottom: spacing.sm,
    },
    typeBtn: {
      flex: 1,
      borderWidth: 1,
      borderColor: c.border,
      borderRadius: radius.pill,
      backgroundColor: c.surface,
      alignItems: "center",
      paddingVertical: 9,
    },
    typeBtnActive: {
      borderColor: c.primaryBorder,
      backgroundColor: c.primarySoft,
    },
    typeBtnText: {
      color: c.textPrimary,
      fontSize: 12,
      fontWeight: "700",
    },
    typeBtnTextActive: {
      color: c.primary,
    },
    createBtn: {
      marginTop: spacing.xs,
      backgroundColor: c.primary,
      borderRadius: radius.pill,
      alignItems: "center",
      paddingVertical: 12,
    },
    createBtnText: {
      color: c.onPrimary,
      fontWeight: "700",
      fontSize: 13,
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
      color: c.textPrimary,
      fontSize: 16,
      fontWeight: "800",
    },
    couponCard: {
      borderWidth: 1,
      borderColor: c.border,
      borderRadius: radius.md,
      backgroundColor: c.surfaceMuted,
      padding: spacing.md,
      marginBottom: spacing.sm,
    },
    couponTopRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: spacing.sm,
    },
    couponCode: {
      color: c.textPrimary,
      fontSize: 14,
      fontWeight: "800",
    },
    couponMeta: {
      marginTop: 4,
      color: c.textSecondary,
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
      color: c.textSecondary,
      fontSize: 12,
      fontWeight: "600",
    },
    emptyText: {
      color: c.textSecondary,
      fontSize: 13,
    },
    errorText: {
      color: c.danger,
      fontWeight: "600",
      marginBottom: spacing.sm,
    },
    successText: {
      color: c.success,
      fontWeight: "600",
      marginBottom: spacing.sm,
    },
  });
}
