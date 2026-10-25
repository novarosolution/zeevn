import React, { useCallback, useEffect, useMemo, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { ADMIN_GATE } from "../../content/adminContent";
import SectionReveal from "../../components/motion/SectionReveal";
import KankregScrollPage from "../../components/kankreg/KankregScrollPage";
import KankregAdminShell from "../../components/kankreg/KankregAdminShell";
import AdminScreenShell from "../../components/admin/AdminScreenShell";
import AdminAlerts from "../../components/admin/AdminAlerts";
import AdminButton from "../../components/admin/AdminButton";
import AdminDeskDock from "../../components/admin/AdminDeskDock";
import AdminFilterTabs from "../../components/admin/AdminFilterTabs";
import AdminInput from "../../components/admin/AdminInput";
import AdminLineCard from "../../components/admin/AdminLineCard";
import AdminPanel from "../../components/admin/AdminPanel";
import { useAdminConfirm } from "../../components/admin/AdminDialog";
import PremiumEmptyState from "../../components/ui/PremiumEmptyState";
import PremiumErrorBanner from "../../components/ui/PremiumErrorBanner";
import PremiumLoader from "../../components/ui/PremiumLoader";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";
import { useToast } from "../../context/ToastContext";
import { applyAdminCycleCount, fetchAdminProducts } from "../../services/adminService";
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
import { navigateCustomerRoute } from "../../navigation/customerNavigate";

export default function AdminCycleCountScreen({ navigation, route }) {
  const { user } = useAuth();
  const { colors: c, shadowPremium } = useTheme();
  const chrome = useAdminChrome();
  const compact = useAdminCompactLayout();
  const toast = useToast();
  const { confirm, dialog } = useAdminConfirm();
  const styles = useMemo(() => createStyles(chrome, c, shadowPremium), [chrome, c, shadowPremium]);
  const seed = String(route?.params?.search || "").trim();

  const [products, setProducts] = useState([]);
  const [location, setLocation] = useState("counter");
  const [query, setQuery] = useState(seed);
  const [counts, setCounts] = useState({});
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      setProducts(await fetchAdminProducts());
      setError("");
    } catch (err) {
      setError(err.message || "Could not load jars.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user?.isAdmin) load();
  }, [user, load]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return products
      .filter((p) => p.isPublished !== false && !p.comingSoon)
      .filter((p) => !q || `${p.name} ${p.sku || ""}`.toLowerCase().includes(q))
      .slice(0, 40);
  }, [products, query]);

  const lines = visible
    .map((p) => {
      const expected = location === "online" ? Number(p.stockQty) || 0 : Number(p.stockCounter) || 0;
      const raw = counts[p._id];
      if (raw === undefined || raw === "") return null;
      const counted = Math.max(0, Number.parseInt(String(raw), 10) || 0);
      return { product: p._id, name: p.name, expected, counted };
    })
    .filter(Boolean);

  const apply = async () => {
    if (!lines.length) {
      setError("Count at least one jar.");
      return;
    }
    const ok = await confirm({
      title: `Apply ${lines.length} count${lines.length === 1 ? "" : "s"} on ${location === "online" ? "online" : "floor"}?`,
      confirmLabel: "Apply now",
    });
    if (!ok) return;
    setBusy(true);
    try {
      await applyAdminCycleCount(null, { location, lines });
      toast.toastSuccess("Count applied.");
      setCounts({});
      await load();
    } catch (err) {
      setError(err.message || "Could not apply.");
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

  const actions = <AdminButton label="Apply now" variant="primary" loading={busy} onPress={apply} />;

  return (
    <AdminScreenShell style={styles.screen}>
      <KankregScrollPage scrollVariant="admin" showFooter={false} style={customerScrollFill}>
        <KankregAdminShell
          navigation={navigation}
          route={route}
          title="Cycle count"
          subtitle="Mid-day check. Closing is still the night snapshot."
          headerRight={<AdminButton label="Refresh" icon="refresh-outline" variant="ghost" size="sm" onPress={load} />}
        >
          <SectionReveal delay={20} preset="fade-up">
            <View style={styles.panel}>
              <AdminAlerts error={error} onCloseError={() => setError("")} />
              <View style={adminTwoColStyle(compact)}>
                <View style={adminTwoColMain(compact)}>
                  <AdminPanel title="Pile" icon="layers-outline">
                    <AdminFilterTabs
                      value={location}
                      onChange={setLocation}
                      items={[
                        { key: "counter", label: "Floor" },
                        { key: "online", label: "Online" },
                      ]}
                    />
                    <AdminInput value={query} onChangeText={setQuery} placeholder="Find a jar" icon="search-outline" />
                  </AdminPanel>
                  {loading ? <PremiumLoader size="sm" caption="Loading…" /> : null}
                  {!loading && visible.length === 0 ? <PremiumEmptyState iconName="cube-outline" title="No jar matches." compact /> : null}
                  {visible.map((p) => {
                    const expected = location === "online" ? Number(p.stockQty) || 0 : Number(p.stockCounter) || 0;
                    return (
                      <AdminLineCard key={p._id} name={p.name} meta={`App says ${expected}`} amount="">
                        <AdminInput
                          value={counts[p._id] ?? ""}
                          onChangeText={(t) => setCounts((prev) => ({ ...prev, [p._id]: t }))}
                          placeholder="Count"
                          integer
                        />
                      </AdminLineCard>
                    );
                  })}
                </View>
                <View style={adminTwoColAside(compact)}>
                  <AdminPanel title="To apply" icon="checkmark-outline">
                    <Text style={styles.body}>{lines.length ? `${lines.length} counted` : "Enter a count to compare."}</Text>
                    {!compact ? actions : null}
                  </AdminPanel>
                </View>
              </View>
            </View>
          </SectionReveal>
        </KankregAdminShell>
      </KankregScrollPage>
      {compact ? <AdminDeskDock>{actions}</AdminDeskDock> : null}
      {dialog}
    </AdminScreenShell>
  );
}

function createStyles(chrome, c, shadowPremium) {
  return StyleSheet.create({
    screen: { flex: 1, backgroundColor: chrome.page },
    panel: { ...adminShellContent, gap: spacing.md },
    gatePanel: adminGatePanel,
    body: { fontFamily: ADMIN_FONT.regular, fontSize: 13, color: chrome.ink },
  });
}
