import React, { useCallback, useEffect, useMemo, useState } from "react";
import { KeyboardAvoidingView, Platform, StyleSheet, Text, View } from "react-native";
import { ADMIN_GATE } from "../../content/adminContent";
import SectionReveal from "../../components/motion/SectionReveal";
import KankregScrollPage from "../../components/kankreg/KankregScrollPage";
import KankregAdminShell from "../../components/kankreg/KankregAdminShell";
import AdminScreenShell from "../../components/admin/AdminScreenShell";
import AdminAlerts from "../../components/admin/AdminAlerts";
import AdminButton from "../../components/admin/AdminButton";
import AdminDeskDock from "../../components/admin/AdminDeskDock";
import AdminFilterTabs from "../../components/admin/AdminFilterTabs";
import AdminHitRow from "../../components/admin/AdminHitRow";
import AdminInput from "../../components/admin/AdminInput";
import AdminPanel from "../../components/admin/AdminPanel";
import { useAdminConfirm } from "../../components/admin/AdminDialog";
import PremiumEmptyState from "../../components/ui/PremiumEmptyState";
import PremiumErrorBanner from "../../components/ui/PremiumErrorBanner";
import PremiumLoader from "../../components/ui/PremiumLoader";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";
import { useToast } from "../../context/ToastContext";
import { createAdminStockOut, fetchAdminProducts } from "../../services/adminService";
import {
  ADMIN_FONT,
  adminGatePanel,
  adminShellContent,
  adminTwoColAside,
  adminTwoColMain,
  adminTwoColStyle,
  useAdminChrome,
  useAdminCompactLayout,
} from "../../theme/adminLayout";
import { customerScrollFill } from "../../theme/screenLayout";
import { spacing } from "../../theme/tokens";
import { productCoverUri } from "../../utils/adminProductHelpers";
import { navigateCustomerRoute } from "../../navigation/customerNavigate";

const REASONS = [
  { key: "waste", label: "Waste" },
  { key: "damage", label: "Damage" },
  { key: "sample", label: "Sample" },
  { key: "staff", label: "Staff" },
];

export default function AdminStockOutScreen({ navigation, route }) {
  const { user } = useAuth();
  const { colors: c, shadowPremium } = useTheme();
  const chrome = useAdminChrome();
  const compact = useAdminCompactLayout();
  const toast = useToast();
  const { confirm, dialog } = useAdminConfirm();
  const styles = useMemo(() => createStyles(chrome, c, shadowPremium), [chrome, c, shadowPremium]);
  const seedSearch = String(route?.params?.search || route?.params?.sku || "").trim();

  const [products, setProducts] = useState([]);
  const [query, setQuery] = useState(seedSearch);
  const [picked, setPicked] = useState(null);
  const [quantity, setQuantity] = useState("1");
  const [location, setLocation] = useState("online");
  const [reason, setReason] = useState("waste");
  const [note, setNote] = useState("");
  const [last, setLast] = useState(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const list = await fetchAdminProducts(null);
      setProducts(Array.isArray(list) ? list : []);
      setError("");
    } catch (err) {
      setError(err.message || "Could not load products.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (seedSearch) setQuery(seedSearch);
  }, [seedSearch]);

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (products || [])
      .filter((p) => !q || `${p.name} ${p.sku || ""}`.toLowerCase().includes(q))
      .slice(0, 10);
  }, [products, query]);

  useEffect(() => {
    if (!seedSearch || picked || !products.length) return;
    const hit = products.find((p) => `${p.sku || ""} ${p.name || ""}`.toLowerCase().includes(seedSearch.toLowerCase()));
    if (hit) setPicked(hit);
  }, [seedSearch, products, picked]);

  const submit = async () => {
    if (!picked) {
      setError("Pick a jar.");
      return;
    }
    const qty = Math.max(1, Number.parseInt(quantity, 10) || 1);
    const ok = await confirm({
      title: `Remove ${qty} from ${location === "counter" ? "shop floor" : "online"}?`,
      confirmLabel: "Remove",
      tone: "danger",
      icon: "trash-outline",
    });
    if (!ok) return;
    setBusy(true);
    setError("");
    try {
      const res = await createAdminStockOut(null, {
        product: picked._id,
        quantity: qty,
        location,
        reason,
        note,
      });
      setLast(res);
      setQuantity("1");
      setNote("");
      toast.toastSuccess("Written off.");
      await load();
      if (res?.product) setPicked(res.product);
    } catch (err) {
      setError(err.message || "Could not write stock out.");
    } finally {
      setBusy(false);
    }
  };

  if (user && !user.isAdmin) {
    return (
      <AdminScreenShell style={styles.screen}>
        <KankregScrollPage scrollVariant="inner" showFooter={false} style={customerScrollFill}>
          <View style={styles.gatePanel}>
            <PremiumErrorBanner severity="warning" title={ADMIN_GATE.title} message={ADMIN_GATE.message} />
            <AdminButton label={ADMIN_GATE.backHome} icon="home-outline" variant="primary" onPress={() => navigateCustomerRoute(navigation, "Home")} />
          </View>
        </KankregScrollPage>
      </AdminScreenShell>
    );
  }

  const actions = <AdminButton label="Remove from stock" variant="danger" loading={busy} onPress={submit} />;

  return (
    <AdminScreenShell style={styles.screen}>
      <KeyboardAvoidingView style={customerScrollFill} behavior={Platform.OS === "ios" ? "padding" : "height"}>
        <KankregScrollPage scrollVariant="admin" showFooter={false} style={customerScrollFill} keyboardShouldPersistTaps="handled">
          <KankregAdminShell
            navigation={navigation}
            route={route}
            title="Stock out"
            subtitle="Waste, damage, sample, or staff use. Picks one pile."
            headerRight={<AdminButton label="Refresh" icon="refresh-outline" variant="ghost" size="sm" onPress={load} />}
          >
            <SectionReveal delay={20} preset="fade-up">
              <View style={styles.panel}>
                <AdminAlerts error={error} onCloseError={() => setError("")} />
                <View style={adminTwoColStyle(compact)}>
                  <View style={adminTwoColMain(compact)}>
                    <AdminPanel title="Jar" icon="cube-outline">
                      <AdminInput value={query} onChangeText={setQuery} placeholder="Find a jar" icon="search-outline" />
                      {loading ? <PremiumLoader size="sm" caption="Loading…" /> : null}
                      {!loading && matches.length === 0 ? <PremiumEmptyState iconName="cube-outline" title="No jar matches." compact /> : null}
                      {matches.map((product) => (
                        <AdminHitRow
                          key={product._id}
                          name={product.name}
                          imageUri={productCoverUri(product)}
                          meta={`Online ${Math.max(0, Number(product.stockQty) || 0)} · Floor ${Math.max(0, Number(product.stockCounter) || 0)}`}
                          selected={String(picked?._id) === String(product._id)}
                          onPress={() => setPicked(product)}
                        />
                      ))}
                    </AdminPanel>
                  </View>
                  <View style={adminTwoColAside(compact)}>
                    <AdminPanel title="Write off" icon="trash-outline" meta={picked?.name}>
                      <AdminFilterTabs
                        value={location}
                        onChange={setLocation}
                        items={[
                          { key: "online", label: "Online" },
                          { key: "counter", label: "Shop floor" },
                        ]}
                      />
                      <AdminFilterTabs value={reason} onChange={setReason} items={REASONS} />
                      <AdminInput label="Quantity" value={quantity} onChangeText={setQuantity} integer />
                      <AdminInput label="Note" value={note} onChangeText={setNote} placeholder="Optional" />
                      {!compact ? actions : null}
                    </AdminPanel>
                    {last?.product ? (
                      <AdminPanel title="Last write-off" icon="checkmark-outline">
                        <Text style={styles.strong}>{last.product.name}</Text>
                        <Text style={styles.meta}>
                          Online {last.product.stockQty} · Floor {last.product.stockCounter} · {last.reason} ×{last.quantity}
                        </Text>
                      </AdminPanel>
                    ) : null}
                  </View>
                </View>
              </View>
            </SectionReveal>
          </KankregAdminShell>
        </KankregScrollPage>
        {compact ? <AdminDeskDock>{actions}</AdminDeskDock> : null}
      </KeyboardAvoidingView>
      {dialog}
    </AdminScreenShell>
  );
}

function createStyles(chrome, c, shadowPremium) {
  return StyleSheet.create({
    screen: { flex: 1 },
    panel: { ...adminShellContent(), gap: spacing.md, paddingBottom: spacing.xl },
    gatePanel: adminGatePanel(c, shadowPremium),
    strong: { fontFamily: ADMIN_FONT.semibold, color: chrome.ink, fontSize: 14 },
    meta: { fontFamily: ADMIN_FONT.regular, color: chrome.inkFaint, fontSize: 12, marginTop: 4 },
  });
}
