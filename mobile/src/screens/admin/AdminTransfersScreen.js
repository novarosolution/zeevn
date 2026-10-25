import React, { useCallback, useEffect, useMemo, useState } from "react";
import { KeyboardAvoidingView, Platform, StyleSheet, Text, View } from "react-native";
import { ADMIN_GATE } from "../../content/adminContent";
import SectionReveal from "../../components/motion/SectionReveal";
import KankregScrollPage from "../../components/kankreg/KankregScrollPage";
import KankregAdminShell from "../../components/kankreg/KankregAdminShell";
import AdminScreenShell from "../../components/admin/AdminScreenShell";
import AdminAlerts from "../../components/admin/AdminAlerts";
import AdminBadge from "../../components/admin/AdminBadge";
import AdminButton, { AdminButtonRow } from "../../components/admin/AdminButton";
import AdminDeskDock from "../../components/admin/AdminDeskDock";
import AdminFilterTabs from "../../components/admin/AdminFilterTabs";
import AdminHitRow from "../../components/admin/AdminHitRow";
import AdminInput from "../../components/admin/AdminInput";
import AdminLineCard from "../../components/admin/AdminLineCard";
import AdminPanel from "../../components/admin/AdminPanel";
import AdminQtyStepper from "../../components/admin/AdminQtyStepper";
import { useAdminConfirm } from "../../components/admin/AdminDialog";
import PremiumEmptyState from "../../components/ui/PremiumEmptyState";
import PremiumErrorBanner from "../../components/ui/PremiumErrorBanner";
import PremiumLoader from "../../components/ui/PremiumLoader";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";
import { useToast } from "../../context/ToastContext";
import { confirmAdminTransfer, fetchAdminProducts, fetchAdminTransfer, saveAdminTransferDraft, searchAdminTransfers } from "../../services/adminService";
import AdminOfflineBanner from "../../components/admin/AdminOfflineBanner";
import { cacheAdminCatalog, enqueueAdminOfflineDraft, isLikelyOffline, readAdminCatalogCache, syncAdminOfflineDrafts } from "../../utils/adminOfflineQueue";
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
import { formatShortDateTime } from "../../utils/adminFormat";
import { navigateCustomerRoute } from "../../navigation/customerNavigate";

export default function AdminTransfersScreen({ navigation, route }) {
  const { user } = useAuth();
  const { colors: c, shadowPremium } = useTheme();
  const chrome = useAdminChrome();
  const compact = useAdminCompactLayout();
  const toast = useToast();
  const { confirm, dialog } = useAdminConfirm();
  const styles = useMemo(() => createStyles(chrome, c, shadowPremium), [chrome, c, shadowPremium]);
  const seedSearch = String(route?.params?.search || route?.params?.sku || "").trim();
  const openId = String(route?.params?.transferId || "");

  const [from, setFrom] = useState("online");
  const [note, setNote] = useState("");
  const [query, setQuery] = useState(seedSearch);
  const [lines, setLines] = useState([]);
  const [history, setHistory] = useState([]);
  const [opened, setOpened] = useState(null);
  const [products, setProducts] = useState([]);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);

  const to = from === "online" ? "counter" : "online";

  const load = useCallback(async () => {
    try {
      const [list, moves] = await Promise.all([fetchAdminProducts(null), searchAdminTransfers(null, { status: "done", pageSize: 10 })]);
      setProducts(Array.isArray(list) ? list : []);
      cacheAdminCatalog(list);
      setHistory(moves?.items || []);
      setError("");
    } catch (err) {
      const cached = await readAdminCatalogCache();
      if (cached.products.length) setProducts(cached.products);
      setError(err.message || "Could not load transfers.");
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

  useEffect(() => {
    if (!openId) return undefined;
    let alive = true;
    fetchAdminTransfer(null, openId)
      .then((doc) => {
        if (alive) setOpened(doc);
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [openId]);

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    return products
      .filter((p) => !q || `${p.name} ${p.sku || ""}`.toLowerCase().includes(q))
      .slice(0, 10);
  }, [products, query]);

  const flipFrom = (next) => {
    setFrom(next);
    setLines((rows) =>
      rows
        .map((row) => {
          const product = products.find((p) => String(p._id) === row.productId);
          const available = next === "online" ? Number(product?.stockQty) || 0 : Number(product?.stockCounter) || 0;
          return { ...row, available, quantity: Math.min(row.quantity, available) };
        })
        .filter((row) => row.available > 0 && row.quantity > 0)
    );
  };

  const add = (product) => {
    const id = String(product._id);
    const available = from === "online" ? Number(product.stockQty) || 0 : Number(product.stockCounter) || 0;
    if (available < 1) {
      setError(`No stock in ${from === "online" ? "online" : "shop floor"} for ${product.name}.`);
      return;
    }
    setError("");
    setLines((rows) => {
      if (rows.some((row) => row.productId === id)) return rows;
      return [...rows, { productId: id, name: product.name, quantity: 1, available }];
    });
  };

  const setQty = (productId, quantity) => {
    setLines((rows) =>
      rows
        .map((row) =>
          row.productId === productId ? { ...row, quantity: Math.min(row.available || 1, Math.max(1, quantity)) } : row
        )
        .filter((row) => row.quantity > 0)
    );
  };

  const reverseOpened = () => {
    if (!opened?.lines?.length) return;
    const nextFrom = opened.to === "online" ? "online" : "counter";
    setFrom(nextFrom);
    setNote(`Reverse of ${opened.note || "transfer"}`.slice(0, 80));
    setLines(
      opened.lines
        .map((line) => {
          const id = String(line.product?._id || line.product);
          const product = products.find((p) => String(p._id) === id);
          const available = nextFrom === "online" ? Number(product?.stockQty) || 0 : Number(product?.stockCounter) || 0;
          return { productId: id, name: line.name || product?.name || "Jar", quantity: Math.min(Number(line.quantity) || 1, available || 1), available };
        })
        .filter((row) => row.productId)
    );
  };

  const syncDrafts = async () => {
    setSyncing(true);
    try {
      const { done, pending } = await syncAdminOfflineDrafts({
        transfer: async (payload) => {
          const draft = await saveAdminTransferDraft(null, payload);
          await confirmAdminTransfer(null, draft._id);
        },
      });
      if (done.length) toast.toastSuccess(`Synced ${done.length} move${done.length === 1 ? "" : "s"}.`);
      if (pending[0]?.error) setError(pending[0].error);
      await load();
    } finally {
      setSyncing(false);
    }
  };

  const move = async () => {
    if (!lines.length) {
      setError("Add at least one jar.");
      return;
    }
    const over = lines.find((line) => line.quantity > (line.available || 0));
    if (over) {
      setError(`${over.name} only has ${over.available} in that pile.`);
      return;
    }
    const ok = await confirm({ title: `Move ${lines.length} line${lines.length === 1 ? "" : "s"} ${from === "online" ? "online → floor" : "floor → online"}?`, confirmLabel: "Move now", icon: "swap-horizontal-outline" });
    if (!ok) return;
    setBusy(true);
    setError("");
    try {
      const draft = await saveAdminTransferDraft(null, {
        from,
        to,
        note,
        lines: lines.map((line) => ({ product: line.productId, quantity: line.quantity })),
      });
      await confirmAdminTransfer(null, draft._id);
      setLines([]);
      setNote("");
      toast.toastSuccess("Moved.");
      await load();
    } catch (err) {
      if (isLikelyOffline(err)) {
        await enqueueAdminOfflineDraft(
          "transfer",
          { from, to, note, lines: lines.map((line) => ({ product: line.productId, quantity: line.quantity })) },
          `${from} → ${to}`
        );
        setLines([]);
        toast.toastSuccess("Saved on this phone.");
        setError("");
      } else {
        setError(err.message || "Transfer failed.");
      }
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

  const actions = <AdminButton label="Move now" variant="primary" loading={busy} onPress={move} />;

  return (
    <AdminScreenShell style={styles.screen}>
      <KeyboardAvoidingView style={customerScrollFill} behavior={Platform.OS === "ios" ? "padding" : "height"}>
        <KankregScrollPage scrollVariant="admin" showFooter={false} style={customerScrollFill} keyboardShouldPersistTaps="handled">
          <KankregAdminShell
            navigation={navigation}
            route={route}
            title="Transfers"
            subtitle="Move jars between the delivery pile and the shop floor."
            headerRight={<AdminButton label="Refresh" icon="refresh-outline" variant="ghost" size="sm" onPress={load} />}
          >
            <SectionReveal delay={20} preset="fade-up">
              <View style={styles.panel}>
                <AdminAlerts error={error} onCloseError={() => setError("")} />
                <AdminOfflineBanner kinds={["transfer"]} syncing={syncing} onSync={syncDrafts} />
                <View style={adminTwoColStyle(compact)}>
                  <View style={adminTwoColMain(compact)}>
                    <AdminPanel title="Direction" icon="swap-horizontal-outline">
                      <AdminFilterTabs
                        value={from}
                        onChange={flipFrom}
                        items={[
                          { key: "online", label: "Online → Floor" },
                          { key: "counter", label: "Floor → Online" },
                        ]}
                      />
                      <AdminInput label="Note" value={note} onChangeText={setNote} placeholder="Optional" />
                    </AdminPanel>
                    <AdminPanel title="Jars" icon="cube-outline">
                      <AdminInput value={query} onChangeText={setQuery} placeholder="Find a jar" icon="search-outline" />
                      {loading ? <PremiumLoader size="sm" caption="Loading…" /> : null}
                      {!loading && matches.length === 0 ? <PremiumEmptyState iconName="cube-outline" title="No jar matches." compact /> : null}
                      {matches.map((product) => (
                        <AdminHitRow
                          key={product._id}
                          name={product.name}
                          imageUri={productCoverUri(product)}
                          meta={`Online ${Math.max(0, Number(product.stockQty) || 0)} · Floor ${Math.max(0, Number(product.stockCounter) || 0)}`}
                          onPress={() => add(product)}
                        />
                      ))}
                    </AdminPanel>
                  </View>
                  <View style={adminTwoColAside(compact)}>
                    <AdminPanel title="To move" icon="swap-horizontal-outline" meta={`${lines.length}`}>
                      {lines.length === 0 ? <PremiumEmptyState iconName="swap-horizontal-outline" title="Nothing to move yet." compact /> : null}
                      {lines.map((line) => (
                        <AdminLineCard
                          key={line.productId}
                          name={line.name}
                          meta={`${line.available} available`}
                          onRemove={() => setLines((rows) => rows.filter((row) => row.productId !== line.productId))}
                        >
                          <AdminQtyStepper
                            min={1}
                            value={String(line.quantity)}
                            onMinus={() => setQty(line.productId, line.quantity - 1)}
                            onPlus={() => setQty(line.productId, line.quantity + 1)}
                            onChange={(text) => setQty(line.productId, Number.parseInt(text, 10) || 1)}
                          />
                        </AdminLineCard>
                      ))}
                      {!compact ? actions : null}
                    </AdminPanel>
                    <AdminPanel title="Recent" icon="time-outline">
                      {history.length === 0 ? <PremiumEmptyState iconName="swap-horizontal-outline" title="No transfers yet." compact /> : null}
                      {history.map((row) => (
                        <AdminHitRow
                          key={row._id}
                          name={`${row.from === "online" ? "Online" : "Floor"} → ${row.to === "online" ? "Online" : "Floor"}`}
                          meta={`${row.totalJars} jars · ${row.savedByName || "Admin"} · ${formatShortDateTime(row.doneAt || row.createdAt)}`}
                          selected={opened && String(opened._id) === String(row._id)}
                          onPress={() => {
                            setOpened(row);
                            navigation.setParams?.({ transferId: String(row._id) });
                          }}
                        />
                      ))}
                      {opened?.lines?.length ? (
                        <View style={styles.opened}>
                          {opened.lines.map((line) => (
                            <Text key={String(line.product)} style={styles.meta}>
                              {line.name} ×{line.quantity}
                            </Text>
                          ))}
                          {opened.note ? <Text style={styles.meta}>{opened.note}</Text> : null}
                          <AdminBadge label={opened.status === "done" ? "Done" : "Draft"} tone={opened.status === "done" ? "green" : "gold"} size="sm" />
                          {opened.status === "done" ? (
                            <AdminButton label="Reverse this" variant="soft" onPress={reverseOpened} />
                          ) : null}
                        </View>
                      ) : null}
                    </AdminPanel>
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
    opened: { gap: 4, paddingTop: 8 },
    meta: { fontFamily: ADMIN_FONT.regular, color: chrome.inkFaint, fontSize: 12 },
  });
}
