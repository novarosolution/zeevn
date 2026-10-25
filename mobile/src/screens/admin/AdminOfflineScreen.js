import React, { useCallback, useEffect, useMemo, useState } from "react";
import { RefreshControl, StyleSheet, Text, View } from "react-native";
import { ADMIN_GATE } from "../../content/adminContent";
import SectionReveal from "../../components/motion/SectionReveal";
import KankregScrollPage from "../../components/kankreg/KankregScrollPage";
import KankregAdminShell from "../../components/kankreg/KankregAdminShell";
import AdminScreenShell from "../../components/admin/AdminScreenShell";
import AdminAlerts from "../../components/admin/AdminAlerts";
import AdminBadge from "../../components/admin/AdminBadge";
import AdminButton, { AdminButtonRow } from "../../components/admin/AdminButton";
import AdminPanel from "../../components/admin/AdminPanel";
import { useAdminConfirm } from "../../components/admin/AdminDialog";
import PremiumEmptyState from "../../components/ui/PremiumEmptyState";
import PremiumErrorBanner from "../../components/ui/PremiumErrorBanner";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";
import { useToast } from "../../context/ToastContext";
import { ADMIN_FONT, adminGatePanel, adminShellContent, useAdminChrome } from "../../theme/adminLayout";
import { customerScrollFill } from "../../theme/screenLayout";
import { spacing } from "../../theme/tokens";
import { formatShortDateTime } from "../../utils/adminFormat";
import { listAdminOfflineDrafts, removeAdminOfflineDraft, syncAdminOfflineDrafts } from "../../utils/adminOfflineQueue";
import { adminOfflineHandlers, buildOfflineDraftHtml, draftDesk, draftKindLabel } from "../../utils/adminOfflineSync";
import { printAdminHtml } from "../../utils/printAdminHtml";
import { navigateCustomerRoute } from "../../navigation/customerNavigate";

export default function AdminOfflineScreen({ navigation, route }) {
  const { user } = useAuth();
  const { colors: c, shadowPremium } = useTheme();
  const chrome = useAdminChrome();
  const toast = useToast();
  const { confirm, dialog } = useAdminConfirm();
  const styles = useMemo(() => createStyles(chrome, c, shadowPremium), [chrome, c, shadowPremium]);
  const [rows, setRows] = useState([]);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setRows(await listAdminOfflineDrafts());
  }, []);

  useEffect(() => {
    if (user?.isAdmin) load();
  }, [user?.isAdmin, load]);

  const syncAll = async () => {
    setBusy(true);
    try {
      const { done, pending } = await syncAdminOfflineDrafts(adminOfflineHandlers());
      if (done.length) toast.toastSuccess(`Synced ${done.length}.`);
      if (pending[0]?.error) setError(pending[0].error);
      else setError("");
      await load();
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
          title="Offline drafts"
          subtitle="Bills and stock moves saved on this phone. Live pile counts change only after Sync."
          headerRight={<AdminButton label="Sync all" icon="cloud-upload-outline" variant="primary" size="sm" loading={busy} onPress={syncAll} />}
        >
          <SectionReveal delay={20} preset="fade-up">
            <View style={styles.panel}>
              <AdminAlerts error={error} onCloseError={() => setError("")} />
              <AdminPanel title="On this phone" icon="cloud-offline-outline" meta={`${rows.length}`}>
                {!rows.length ? (
                  <PremiumEmptyState iconName="cloud-done-outline" title="Nothing waiting." compact />
                ) : null}
                {rows.map((row) => {
                  const payload = row.payload || {};
                  const who = payload.name || payload.supplierName || payload.cashierName || "";
                  const phone = payload.phone || "";
                  return (
                    <View key={row.id} style={styles.card}>
                      <View style={styles.cardTop}>
                        <Text style={styles.name}>{row.label || draftKindLabel(row.kind)}</Text>
                        <AdminBadge label={draftKindLabel(row.kind)} tone={row.error ? "red" : "gold"} size="sm" />
                      </View>
                      <Text style={styles.meta}>
                        {[who, phone, formatShortDateTime(row.at)].filter(Boolean).join(" · ")}
                      </Text>
                      {row.error ? <Text style={styles.err}>{row.error}</Text> : null}
                      <AdminButtonRow>
                        <AdminButton
                          label="Print"
                          size="sm"
                          variant="soft"
                          onPress={() => printAdminHtml(buildOfflineDraftHtml(row))}
                        />
                        <AdminButton
                          label="Open desk"
                          size="sm"
                          variant="ghost"
                          onPress={() => navigation.navigate(draftDesk(row.kind))}
                        />
                        <AdminButton
                          label="Remove"
                          size="sm"
                          variant="danger"
                          onPress={async () => {
                            const ok = await confirm({ title: "Remove this draft from this phone?", confirmLabel: "Remove", tone: "danger" });
                            if (!ok) return;
                            await removeAdminOfflineDraft(row.id);
                            await load();
                          }}
                        />
                      </AdminButtonRow>
                    </View>
                  );
                })}
              </AdminPanel>
            </View>
          </SectionReveal>
        </KankregAdminShell>
      </KankregScrollPage>
      {dialog}
    </AdminScreenShell>
  );
}

function createStyles(chrome, c, shadowPremium) {
  return StyleSheet.create({
    screen: { flex: 1, backgroundColor: chrome.page },
    panel: { ...adminShellContent(), gap: spacing.md },
    gatePanel: adminGatePanel(c, shadowPremium),
    card: {
      backgroundColor: chrome.card,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: chrome.line,
      borderRadius: 14,
      padding: 14,
      gap: 6,
    },
    cardTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8 },
    name: { flex: 1, fontFamily: ADMIN_FONT.semibold, fontSize: 15, color: chrome.ink },
    meta: { fontFamily: ADMIN_FONT.regular, fontSize: 12, color: chrome.inkSoft },
    err: { fontFamily: ADMIN_FONT.regular, fontSize: 12, color: c.danger || "#8a4b32" },
  });
}
