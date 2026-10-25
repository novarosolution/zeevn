import React, { useCallback, useEffect, useMemo, useState } from "react";
import { KeyboardAvoidingView, Platform, RefreshControl, StyleSheet, Text, View } from "react-native";
import { ADMIN_GATE, ADMIN_SCREEN_COPY } from "../../content/adminContent";
import SectionReveal from "../../components/motion/SectionReveal";
import KankregScrollPage from "../../components/kankreg/KankregScrollPage";
import KankregAdminShell from "../../components/kankreg/KankregAdminShell";
import AdminScreenShell from "../../components/admin/AdminScreenShell";
import AdminAlerts from "../../components/admin/AdminAlerts";
import AdminButton from "../../components/admin/AdminButton";
import AdminCouponTicket from "../../components/admin/AdminCouponTicket";
import AdminInput from "../../components/admin/AdminInput";
import AdminPanel from "../../components/admin/AdminPanel";
import AdminToggleRow from "../../components/admin/AdminToggleRow";
import AdminFilterTabs from "../../components/admin/AdminFilterTabs";
import PremiumEmptyState from "../../components/ui/PremiumEmptyState";
import PremiumErrorBanner from "../../components/ui/PremiumErrorBanner";
import PremiumLoader from "../../components/ui/PremiumLoader";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";
import { createAdminCoupon, fetchAdminCoupons, updateAdminCoupon } from "../../services/adminService";
import {
  adminGatePanel,
  adminShellContent,
  adminTwoColAside,
  adminTwoColMain,
  adminTwoColStyle,
  useAdminChrome,
  useAdminCompactLayout,
} from "../../theme/adminLayout";
import { customerScrollFill } from "../../theme/screenLayout";
import { fonts, spacing } from "../../theme/tokens";
import { navigateCustomerRoute } from "../../navigation/customerNavigate";

const COPY = ADMIN_SCREEN_COPY.coupons;

const EMPTY = {
  code: "",
  title: "",
  type: "percent",
  value: "",
  minOrderAmount: "0",
  maxDiscountAmount: "",
  usageLimit: "",
  expiresAt: "",
  isActive: true,
  isVisibleToUsers: true,
  isOneTimePerUser: false,
};

function expiryInput(value) {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });
}

function formFromCoupon(coupon) {
  return {
    code: coupon.code || "",
    title: coupon.title || "",
    type: coupon.type === "flat" ? "flat" : "percent",
    value: coupon.value == null ? "" : String(coupon.value),
    minOrderAmount: String(Number(coupon.minOrderAmount || 0)),
    maxDiscountAmount: coupon.maxDiscountAmount == null || coupon.maxDiscountAmount === "" ? "" : String(coupon.maxDiscountAmount),
    usageLimit: coupon.usageLimit == null || coupon.usageLimit === "" ? "" : String(coupon.usageLimit),
    expiresAt: expiryInput(coupon.expiresAt),
    isActive: coupon.isActive !== false,
    isVisibleToUsers: coupon.isVisibleToUsers !== false,
    isOneTimePerUser: Boolean(coupon.isOneTimePerUser),
  };
}

function payloadFromForm(form) {
  return {
    code: String(form.code || "").replace(/\s+/g, "").toUpperCase(),
    title: String(form.title || "").trim(),
    type: form.type === "flat" ? "flat" : "percent",
    value: Number(form.value),
    minOrderAmount: form.minOrderAmount === "" ? 0 : Number(form.minOrderAmount),
    maxDiscountAmount: form.maxDiscountAmount === "" ? null : Number(form.maxDiscountAmount),
    usageLimit: form.usageLimit === "" ? null : Number(form.usageLimit),
    expiresAt: form.expiresAt.trim() ? form.expiresAt.trim() : null,
    isActive: form.isActive !== false,
    isVisibleToUsers: form.isVisibleToUsers !== false,
    isOneTimePerUser: Boolean(form.isOneTimePerUser),
  };
}

export default function AdminCouponsScreen({ navigation, route }) {
  const { user, token } = useAuth();
  const { colors: c, shadowPremium } = useTheme();
  const chrome = useAdminChrome();
  const compact = useAdminCompactLayout();
  const styles = useMemo(() => createStyles(chrome, c, shadowPremium), [chrome, c, shadowPremium]);

  const [coupons, setCoupons] = useState([]);
  const [form, setForm] = useState(EMPTY);
  const [editingId, setEditingId] = useState("");
  const [usedCount, setUsedCount] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      setError("");
      const list = await fetchAdminCoupons(token);
      setCoupons(Array.isArray(list) ? list : []);
    } catch (err) {
      setError(err.message || "Unable to load coupons.");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (user?.isAdmin) load();
  }, [user?.isAdmin, load]);

  const onPull = async () => {
    setRefreshing(true);
    try {
      await load();
    } finally {
      setRefreshing(false);
    }
  };

  const startEdit = (coupon) => {
    if (coupon.issuedForUser) return;
    setEditingId(String(coupon._id));
    setUsedCount(Number(coupon.usedCount || 0));
    setForm(formFromCoupon(coupon));
    setError("");
  };

  const startCreate = () => {
    setEditingId("");
    setUsedCount(null);
    setForm(EMPTY);
    setError("");
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError("");
      const payload = payloadFromForm(form);
      if (editingId) {
        const saved = await updateAdminCoupon(token, editingId, payload);
        setCoupons((prev) => prev.map((row) => (String(row._id) === String(saved._id) ? saved : row)));
        setForm(formFromCoupon(saved));
        setUsedCount(Number(saved.usedCount || 0));
      } else {
        await createAdminCoupon(token, payload);
        setForm(EMPTY);
        await load();
      }
    } catch (err) {
      setError(err.message || "Unable to save coupon.");
    } finally {
      setSaving(false);
    }
  };

  if (user && !user.isAdmin) {
    return (
      <AdminScreenShell style={styles.screen}>
        <KankregScrollPage scrollVariant="inner" showFooter={false} style={customerScrollFill}>
          <SectionReveal delay={40} preset="fade-up">
            <View style={styles.gatePanel}>
              <PremiumErrorBanner severity="warning" title={ADMIN_GATE.title} message={ADMIN_GATE.message} />
              <AdminButton label={ADMIN_GATE.backHome} variant="primary" onPress={() => navigateCustomerRoute(navigation, "Home")} style={styles.gateCta} />
            </View>
          </SectionReveal>
        </KankregScrollPage>
      </AdminScreenShell>
    );
  }

  const formPanel = (
    <AdminPanel
      title={editingId ? "Edit coupon" : "Create coupon"}
      icon="pricetag-outline"
      description="A code for web checkout only. Walk-in bills at the counter do not use coupons."
    >
      <AdminInput
        label="Code"
        value={form.code}
        onChangeText={(value) => setForm((current) => ({ ...current, code: value }))}
        placeholder="SAVE20"
        autoCapitalize="characters"
        icon="pricetag-outline"
      />
      <AdminInput
        label="Title"
        value={form.title}
        onChangeText={(value) => setForm((current) => ({ ...current, title: value }))}
        placeholder="Shown to the customer (optional)"
        icon="text-outline"
      />
      <Text style={styles.fieldLabel}>Type</Text>
      <AdminFilterTabs
        value={form.type}
        onChange={(type) => setForm((current) => ({ ...current, type }))}
        items={[
          { key: "percent", label: "Percent" },
          { key: "flat", label: "Flat ₹" },
        ]}
      />
      <AdminInput
        label={form.type === "percent" ? "Value (%)" : "Value (₹)"}
        value={form.value}
        onChangeText={(value) => setForm((current) => ({ ...current, value }))}
        placeholder={form.type === "percent" ? "20" : "100"}
        numeric
        icon="calculator-outline"
      />
      <AdminInput
        label="Minimum order (₹)"
        value={form.minOrderAmount}
        onChangeText={(value) => setForm((current) => ({ ...current, minOrderAmount: value }))}
        numeric
        icon="cart-outline"
      />
      <AdminInput
        label="Max discount (₹)"
        value={form.maxDiscountAmount}
        onChangeText={(value) => setForm((current) => ({ ...current, maxDiscountAmount: value }))}
        placeholder="No cap"
        numeric
        icon="trending-down-outline"
      />
      <AdminInput
        label="Usage limit"
        value={form.usageLimit}
        onChangeText={(value) => setForm((current) => ({ ...current, usageLimit: value }))}
        placeholder="Unlimited"
        integer
        icon="people-outline"
      />
      {editingId ? <Text style={styles.used}>Used {usedCount ?? 0} times — not editable</Text> : null}
      <AdminInput
        label="Expiry"
        value={form.expiresAt}
        onChangeText={(value) => setForm((current) => ({ ...current, expiresAt: value }))}
        placeholder="YYYY-MM-DD"
        icon="calendar-outline"
      />
      <AdminToggleRow title="Active" subtitle="Off sets the code inactive" value={form.isActive} onValueChange={(value) => setForm((current) => ({ ...current, isActive: value }))} />
      <AdminToggleRow
        title="Visible to customers"
        subtitle="A hidden code still works if they type it"
        value={form.isVisibleToUsers}
        onValueChange={(value) => setForm((current) => ({ ...current, isVisibleToUsers: value }))}
      />
      <AdminToggleRow
        title="One time per customer"
        value={form.isOneTimePerUser}
        onValueChange={(value) => setForm((current) => ({ ...current, isOneTimePerUser: value }))}
        isLast
      />
      <View style={styles.formActions}>
        {editingId ? <AdminButton label="New code" variant="soft" onPress={startCreate} disabled={saving} /> : null}
        <AdminButton
          label={saving ? "Saving…" : editingId ? "Save" : "Create coupon"}
          icon="save-outline"
          variant="primary"
          loading={saving}
          disabled={saving}
          onPress={handleSave}
        />
      </View>
    </AdminPanel>
  );

  return (
    <AdminScreenShell style={styles.screen}>
      <KeyboardAvoidingView style={customerScrollFill} behavior={Platform.OS === "ios" ? "padding" : "height"}>
        <KankregScrollPage
          scrollVariant="admin"
          showFooter={false}
          style={customerScrollFill}
          keyboardShouldPersistTaps="handled"
          refreshControl={Platform.OS === "web" ? undefined : <RefreshControl refreshing={refreshing} onRefresh={onPull} />}
        >
          <KankregAdminShell
            navigation={navigation}
            route={route}
            title={COPY.title}
            subtitle={COPY.subtitle}
            headerRight={<AdminButton label="Refresh" icon="refresh-outline" variant="ghost" size="sm" onPress={load} />}
          >
            <View style={styles.panel}>
              <AdminAlerts error={error} onCloseError={() => setError("")} />
              <View style={adminTwoColStyle(compact)}>
                <View style={adminTwoColMain(compact, 1.15)}>{formPanel}</View>
                <View style={[adminTwoColAside(compact), styles.listCol]}>
                  <Text style={styles.listTitle}>Codes</Text>
                  {loading ? <PremiumLoader size="sm" caption="Loading coupons…" /> : null}
                  {!loading && coupons.length === 0 ? <PremiumEmptyState iconName="pricetag-outline" title={COPY.empty} compact /> : null}
                  {!loading
                    ? coupons.map((coupon) => (
                        <AdminCouponTicket key={coupon._id} coupon={coupon} onPress={() => startEdit(coupon)} />
                      ))
                    : null}
                </View>
              </View>
            </View>
          </KankregAdminShell>
        </KankregScrollPage>
      </KeyboardAvoidingView>
    </AdminScreenShell>
  );
}

function createStyles(chrome, c, shadowPremium) {
  return StyleSheet.create({
    screen: { flex: 1, width: "100%", alignSelf: "center", maxWidth: "100%" },
    panel: { ...adminShellContent(), gap: spacing.sm },
    gatePanel: adminGatePanel(c, shadowPremium),
    gateCta: { marginTop: spacing.md, alignSelf: "flex-start" },
    fieldLabel: {
      marginTop: 4,
      marginBottom: 6,
      fontSize: 11.5,
      letterSpacing: 0.4,
      textTransform: "uppercase",
      color: chrome.inkFaint,
      fontFamily: fonts.semibold,
    },
    used: { fontSize: 12.5, color: chrome.inkFaint, fontFamily: fonts.regular, marginBottom: 4 },
    formActions: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 8 },
    listCol: { gap: 10 },
    listTitle: { fontSize: 13, color: chrome.inkFaint, fontFamily: fonts.semibold, letterSpacing: 0.4, textTransform: "uppercase" },
  });
}
