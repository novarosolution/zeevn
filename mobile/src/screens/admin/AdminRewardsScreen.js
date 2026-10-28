import React, { useCallback, useEffect, useMemo, useState } from "react";
import { KeyboardAvoidingView, Platform, RefreshControl, StyleSheet, Text, View } from "react-native";
import { ADMIN_GATE, ADMIN_SCREEN_COPY } from "../../content/adminContent";
import SectionReveal from "../../components/motion/SectionReveal";
import KankregScrollPage from "../../components/kankreg/KankregScrollPage";
import KankregAdminShell from "../../components/kankreg/KankregAdminShell";
import AdminScreenShell from "../../components/admin/AdminScreenShell";
import AdminAlerts from "../../components/admin/AdminAlerts";
import AdminButton from "../../components/admin/AdminButton";
import AdminInput from "../../components/admin/AdminInput";
import AdminPanel from "../../components/admin/AdminPanel";
import AdminRewardTicket from "../../components/admin/AdminRewardTicket";
import AdminToggleRow from "../../components/admin/AdminToggleRow";
import AdminFilterTabs from "../../components/admin/AdminFilterTabs";
import AdminEmptyState from "../../components/admin/AdminEmptyState";
import AdminNotice from "../../components/admin/AdminNotice";
import AdminLoader from "../../components/admin/AdminLoader";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";
import { createAdminReward, fetchAdminRewards, updateAdminReward } from "../../services/adminService";
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

const COPY = ADMIN_SCREEN_COPY.rewards;

const EMPTY = {
  title: "",
  description: "",
  pointsCost: "",
  discountType: "percent",
  discountValue: "",
  minOrderAmount: "0",
  maxDiscountAmount: "",
  totalRedemptionLimit: "",
  perUserLimit: "1",
  issuedCouponValidDays: "90",
  expiresAt: "",
  isActive: true,
  isVisibleToUsers: true,
};

function expiryInput(value) {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });
}

function formFromReward(reward) {
  return {
    title: reward.title || "",
    description: reward.description || "",
    pointsCost: reward.pointsCost == null ? "" : String(reward.pointsCost),
    discountType: reward.discountType === "flat" ? "flat" : "percent",
    discountValue: reward.discountValue == null ? "" : String(reward.discountValue),
    minOrderAmount: String(Number(reward.minOrderAmount || 0)),
    maxDiscountAmount: reward.maxDiscountAmount == null || reward.maxDiscountAmount === "" ? "" : String(reward.maxDiscountAmount),
    totalRedemptionLimit: reward.totalRedemptionLimit == null || reward.totalRedemptionLimit === "" ? "" : String(reward.totalRedemptionLimit),
    perUserLimit: String(Number(reward.perUserLimit || 1)),
    issuedCouponValidDays: String(Number(reward.issuedCouponValidDays || 90)),
    expiresAt: expiryInput(reward.expiresAt),
    isActive: reward.isActive !== false,
    isVisibleToUsers: reward.isVisibleToUsers !== false,
  };
}

function payloadFromForm(form) {
  return {
    title: String(form.title || "").trim(),
    description: String(form.description || "").trim(),
    pointsCost: Number(form.pointsCost),
    discountType: form.discountType === "flat" ? "flat" : "percent",
    discountValue: Number(form.discountValue),
    minOrderAmount: form.minOrderAmount === "" ? 0 : Number(form.minOrderAmount),
    maxDiscountAmount: form.maxDiscountAmount === "" ? null : Number(form.maxDiscountAmount),
    totalRedemptionLimit: form.totalRedemptionLimit === "" ? null : Number(form.totalRedemptionLimit),
    perUserLimit: form.perUserLimit === "" ? 1 : Number(form.perUserLimit),
    issuedCouponValidDays: form.issuedCouponValidDays === "" ? 90 : Number(form.issuedCouponValidDays),
    expiresAt: String(form.expiresAt || "").trim() ? String(form.expiresAt).trim() : null,
    isActive: form.isActive !== false,
    isVisibleToUsers: form.isVisibleToUsers !== false,
  };
}

export default function AdminRewardsScreen({ navigation, route }) {
  const { user, token } = useAuth();
  const { colors: c, shadowPremium } = useTheme();
  const chrome = useAdminChrome();
  const compact = useAdminCompactLayout();
  const styles = useMemo(() => createStyles(chrome, c, shadowPremium), [chrome, c, shadowPremium]);

  const [rewards, setRewards] = useState([]);
  const [form, setForm] = useState(EMPTY);
  const [editingId, setEditingId] = useState("");
  const [redemptionCount, setRedemptionCount] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      setError("");
      const list = await fetchAdminRewards(token);
      setRewards(Array.isArray(list) ? list : []);
    } catch (err) {
      setError(err.message || "Unable to load rewards.");
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

  const startEdit = (reward) => {
    setEditingId(String(reward._id));
    setRedemptionCount(Number(reward.redemptionCount || 0));
    setForm(formFromReward(reward));
    setError("");
  };

  const startCreate = () => {
    setEditingId("");
    setRedemptionCount(null);
    setForm(EMPTY);
    setError("");
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError("");
      const payload = payloadFromForm(form);
      if (editingId) {
        const saved = await updateAdminReward(token, editingId, payload);
        setRewards((prev) => prev.map((row) => (String(row._id) === String(saved._id) ? saved : row)));
        setForm(formFromReward(saved));
        setRedemptionCount(Number(saved.redemptionCount || 0));
      } else {
        await createAdminReward(token, payload);
        setForm(EMPTY);
        await load();
      }
    } catch (err) {
      setError(err.message || "Unable to save reward.");
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
              <AdminNotice severity="warning" title={ADMIN_GATE.title} message={ADMIN_GATE.message} />
              <AdminButton label={ADMIN_GATE.backHome} variant="primary" onPress={() => navigateCustomerRoute(navigation, "Home")} style={styles.gateCta} />
            </View>
          </SectionReveal>
        </KankregScrollPage>
      </AdminScreenShell>
    );
  }

  const formPanel = (
    <AdminPanel
      title={editingId ? "Edit reward" : "Create reward"}
      icon="gift-outline"
      description="Customers buy this with reward points on the website. Public codes stay on Coupons. Walk-in bills at the counter do not use rewards."
    >
      <AdminInput
        label="Title"
        value={form.title}
        onChangeText={(value) => setForm((current) => ({ ...current, title: value }))}
        placeholder="Reward"
        icon="gift-outline"
      />
      <AdminInput
        label="Description"
        value={form.description}
        onChangeText={(value) => setForm((current) => ({ ...current, description: value }))}
        placeholder="Optional"
        multiline
        numberOfLines={3}
        icon="document-text-outline"
      />
      <AdminInput
        label="Points cost"
        value={form.pointsCost}
        onChangeText={(value) => setForm((current) => ({ ...current, pointsCost: value }))}
        integer
        icon="star-outline"
      />
      <Text style={styles.fieldLabel}>Discount type</Text>
      <AdminFilterTabs
        value={form.discountType}
        onChange={(discountType) => setForm((current) => ({ ...current, discountType }))}
        items={[
          { key: "percent", label: "Percent" },
          { key: "flat", label: "Flat ₹" },
        ]}
      />
      <AdminInput
        label={form.discountType === "percent" ? "Discount value (%)" : "Discount value (₹)"}
        value={form.discountValue}
        onChangeText={(value) => setForm((current) => ({ ...current, discountValue: value }))}
        numeric
        icon="pricetag-outline"
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
        label="Total redemption limit"
        value={form.totalRedemptionLimit}
        onChangeText={(value) => setForm((current) => ({ ...current, totalRedemptionLimit: value }))}
        placeholder="Unlimited"
        integer
        icon="people-outline"
      />
      {editingId ? <Text style={styles.used}>Redeemed {redemptionCount ?? 0} times — not editable</Text> : null}
      <AdminInput
        label="Per customer limit"
        value={form.perUserLimit}
        onChangeText={(value) => setForm((current) => ({ ...current, perUserLimit: value }))}
        integer
      />
      <AdminInput
        label="Issued code lasts (days)"
        value={form.issuedCouponValidDays}
        onChangeText={(value) => setForm((current) => ({ ...current, issuedCouponValidDays: value }))}
        integer
        icon="time-outline"
      />
      <AdminInput
        label="Offer expiry"
        value={form.expiresAt}
        onChangeText={(value) => setForm((current) => ({ ...current, expiresAt: value }))}
        placeholder="YYYY-MM-DD"
        icon="calendar-outline"
      />
      <AdminToggleRow title="Active" subtitle="Off sets the reward inactive" value={form.isActive} onValueChange={(value) => setForm((current) => ({ ...current, isActive: value }))} />
      <AdminToggleRow
        title="Visible in the rewards shop"
        subtitle="A hidden reward cannot be redeemed"
        value={form.isVisibleToUsers}
        onValueChange={(value) => setForm((current) => ({ ...current, isVisibleToUsers: value }))}
        isLast
      />
      <View style={styles.formActions}>
        {editingId ? <AdminButton label="New reward" variant="soft" onPress={startCreate} disabled={saving} /> : null}
        <AdminButton
          label={saving ? "Saving…" : editingId ? "Save" : "Create reward"}
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
                  <Text style={styles.listTitle}>Catalog</Text>
                  {loading ? <AdminLoader size="sm" caption="Loading rewards…" /> : null}
                  {!loading && rewards.length === 0 ? <AdminEmptyState iconName="gift-outline" title={COPY.empty} compact /> : null}
                  {!loading
                    ? rewards.map((reward) => (
                        <AdminRewardTicket key={reward._id} reward={reward} onPress={() => startEdit(reward)} />
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
