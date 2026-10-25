import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Linking, RefreshControl, StyleSheet, Text, View } from "react-native";
import { ADMIN_GATE } from "../../content/adminContent";
import SectionReveal from "../../components/motion/SectionReveal";
import KankregScrollPage from "../../components/kankreg/KankregScrollPage";
import KankregAdminShell from "../../components/kankreg/KankregAdminShell";
import AdminScreenShell from "../../components/admin/AdminScreenShell";
import AdminAlerts from "../../components/admin/AdminAlerts";
import AdminButton from "../../components/admin/AdminButton";
import AdminInput from "../../components/admin/AdminInput";
import AdminPanel from "../../components/admin/AdminPanel";
import PremiumEmptyState from "../../components/ui/PremiumEmptyState";
import PremiumErrorBanner from "../../components/ui/PremiumErrorBanner";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";
import { useToast } from "../../context/ToastContext";
import { fetchAdminSuppliers, saveAdminSupplier } from "../../services/adminService";
import { ADMIN_FONT, adminGatePanel, adminShellContent, useAdminChrome, useAdminCompactLayout } from "../../theme/adminLayout";
import { customerScrollFill } from "../../theme/screenLayout";
import { spacing } from "../../theme/tokens";
import { navigateCustomerRoute } from "../../navigation/customerNavigate";

function waLink(phone) {
  const n = String(phone || "").replace(/\D/g, "");
  if (n.length < 10) return "";
  return `https://wa.me/${n.length === 10 ? `91${n}` : n}`;
}

export default function AdminSuppliersScreen({ navigation, route }) {
  const { user } = useAuth();
  const { colors: c, shadowPremium } = useTheme();
  const chrome = useAdminChrome();
  const compact = useAdminCompactLayout();
  const toast = useToast();
  const styles = useMemo(() => createStyles(chrome, c, shadowPremium), [chrome, c, shadowPremium]);
  const [rows, setRows] = useState([]);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      setRows(await fetchAdminSuppliers());
      setError("");
    } catch (err) {
      setError(err.message || "Could not load suppliers.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user?.isAdmin) load();
  }, [user, load]);

  const save = async () => {
    if (!name.trim()) {
      setError("Name is required.");
      return;
    }
    setBusy(true);
    try {
      await saveAdminSupplier(null, { name, phone, note });
      setName("");
      setPhone("");
      setNote("");
      toast.toastSuccess("Supplier saved.");
      await load();
    } catch (err) {
      setError(err.message || "Could not save.");
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
            <AdminButton label={ADMIN_GATE.backHome} variant="primary" onPress={() => navigateCustomerRoute(navigation, "Home")} />
          </View>
        </KankregScrollPage>
      </AdminScreenShell>
    );
  }

  return (
    <AdminScreenShell style={styles.screen}>
      <KankregScrollPage
        scrollVariant="admin"
        showFooter={false}
        style={customerScrollFill}
        refreshControl={<RefreshControl refreshing={false} onRefresh={load} />}
      >
        <KankregAdminShell
          navigation={navigation}
          route={route}
          title="Suppliers"
          subtitle="Names on stock-in bills. One shop — not a vendor portal."
          headerRight={<AdminButton label="Refresh" icon="refresh-outline" variant="ghost" size="sm" onPress={load} />}
        >
          <SectionReveal delay={20} preset="fade-up">
            <View style={styles.panel}>
              <AdminAlerts error={error} onCloseError={() => setError("")} />
              <AdminPanel title="Add or update" icon="person-add-outline">
                <AdminInput label="Name" value={name} onChangeText={setName} placeholder="Dairy, mill, farm" />
                <AdminInput label="Phone" value={phone} onChangeText={setPhone} placeholder="Optional" />
                <AdminInput label="Note" value={note} onChangeText={setNote} placeholder="Optional" />
                <AdminButton label="Save" variant="primary" loading={busy} onPress={save} />
              </AdminPanel>
              {!loading && rows.length === 0 ? <PremiumEmptyState iconName="people-outline" title="No suppliers yet" compact /> : null}
              {rows.map((row) => {
                const wa = waLink(row.phone);
                return (
                  <View key={String(row._id)} style={styles.card}>
                    <Text style={styles.name}>{row.name}</Text>
                    <Text style={styles.meta}>
                      {row.phone || "No phone"}
                      {row.lastBillAt ? ` · last bill ${new Date(row.lastBillAt).toLocaleDateString("en-IN")}` : ""}
                    </Text>
                    {row.note ? <Text style={styles.meta}>{row.note}</Text> : null}
                    <View style={styles.row}>
                      {wa ? <AdminButton label="WhatsApp" size="sm" variant="ghost" onPress={() => Linking.openURL(wa)} /> : null}
                      <AdminButton
                        label="Stock in"
                        size="sm"
                        variant="soft"
                        onPress={() => navigation.navigate("AdminStockIn", { supplier: row.name })}
                      />
                    </View>
                  </View>
                );
              })}
            </View>
          </SectionReveal>
        </KankregAdminShell>
      </KankregScrollPage>
    </AdminScreenShell>
  );
}

function createStyles(chrome, c, shadowPremium) {
  return StyleSheet.create({
    screen: { flex: 1, backgroundColor: chrome.page },
    panel: { ...adminShellContent, gap: spacing.md },
    gatePanel: adminGatePanel,
    card: {
      backgroundColor: chrome.card,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: chrome.line,
      borderRadius: 14,
      padding: 14,
      gap: 6,
    },
    name: { fontFamily: ADMIN_FONT.semibold, fontSize: 15, color: chrome.ink },
    meta: { fontFamily: ADMIN_FONT.regular, fontSize: 12, color: chrome.inkSoft },
    row: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 4 },
  });
}
