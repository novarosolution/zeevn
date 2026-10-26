import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { KeyboardAvoidingView, Platform, Pressable, RefreshControl, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ADMIN_GATE, ADMIN_SCREEN_COPY } from "../../content/adminContent";
import SectionReveal from "../../components/motion/SectionReveal";
import KankregScrollPage from "../../components/kankreg/KankregScrollPage";
import KankregAdminShell from "../../components/kankreg/KankregAdminShell";
import AdminScreenShell from "../../components/admin/AdminScreenShell";
import AdminAlerts from "../../components/admin/AdminAlerts";
import AdminBadge from "../../components/admin/AdminBadge";
import AdminButton from "../../components/admin/AdminButton";
import AdminFilterTabs from "../../components/admin/AdminFilterTabs";
import AdminHitRow from "../../components/admin/AdminHitRow";
import AdminInput from "../../components/admin/AdminInput";
import AdminPanel from "../../components/admin/AdminPanel";
import AdminProductCell from "../../components/admin/AdminProductCell";
import AdminQtyStepper from "../../components/admin/AdminQtyStepper";
import { useAdminConfirm } from "../../components/admin/AdminDialog";
import PremiumEmptyState from "../../components/ui/PremiumEmptyState";
import PremiumErrorBanner from "../../components/ui/PremiumErrorBanner";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";
import {
  confirmAdminStockIn,
  fetchAdminProducts,
  fetchAdminStockIn,
  fetchAdminSuppliers,
  saveAdminStockInDraft,
  searchAdminStockIn,
} from "../../services/adminService";
import { useToast } from "../../context/ToastContext";
import AdminOfflineBanner from "../../components/admin/AdminOfflineBanner";
import { cacheAdminCatalog, enqueueAdminOfflineDraft, isLikelyOffline, newClientRef, readAdminCatalogCache, syncAdminOfflineDrafts } from "../../utils/adminOfflineQueue";
import { adminOfflineHandlers } from "../../utils/adminOfflineSync";
import { ADMIN_FONT, adminGatePanel, adminShellContent, useAdminChrome, useAdminCompactLayout } from "../../theme/adminLayout";
import { customerScrollFill } from "../../theme/screenLayout";
import { spacing } from "../../theme/tokens";
import { productCoverUri } from "../../utils/adminProductHelpers";
import { formatShortDateTime, plural } from "../../utils/adminFormat";
import { printAdminHtml } from "../../utils/printAdminHtml";
import { buildStockInBillHtml } from "../../utils/stockInBillHtml";

const EMPTY = { items: [], total: 0, page: 1, pages: 1, pageSize: 25, counts: { draft: 0, received: 0 } };
const TABS = [
  { key: "draft", label: "Drafts" },
  { key: "received", label: "Received" },
];
const COPY = ADMIN_SCREEN_COPY.stockIn;

function parseQty(value, fallback = 1) {
  const n = Number.parseInt(String(value ?? "").trim(), 10);
  return Number.isFinite(n) ? Math.max(1, n) : fallback;
}

function lineId(line) {
  return String(line.product?._id || line.product || line.productId || "");
}

function toEditor(doc) {
  return {
    id: doc?._id ? String(doc._id) : "",
    /** A delivery that isn't on the server yet carries one reference for every attempt to save it (see `newClientRef`). */
    clientRef: doc?._id ? "" : newClientRef(),
    note: doc?.note || "",
    supplierName: doc?.supplierName || "",
    destination: doc?.destination || "online",
    status: doc?.status || "draft",
    savedByName: doc?.savedByName || "",
    receivedAt: doc?.receivedAt || null,
    lines: (doc?.lines || []).map((line) => ({
      productId: lineId(line),
      name: line.name || "Jar",
      sku: line.sku || "",
      unit: line.unit || "",
      image: productCoverUri(line),
      quantity: parseQty(line.quantity, 1),
      unitCost: String(line.unitCost || ""),
    })),
  };
}

function payloadOf(editor) {
  return {
    clientRef: editor.clientRef || undefined,
    receiptId: editor.id || undefined,
    note: String(editor.note || "").trim().slice(0, 200),
    supplierName: String(editor.supplierName || "").trim().slice(0, 120),
    destination: editor.destination === "counter" ? "counter" : "online",
    lines: editor.lines
      .filter((line) => line.productId)
      .map((line) => ({
        product: line.productId,
        quantity: parseQty(line.quantity, 1),
        unitCost: Math.max(0, Number(line.unitCost) || 0),
      })),
  };
}

export default function AdminStockInScreen({ navigation, route }) {
  const { user } = useAuth();
  const { colors: c, shadowPremium } = useTheme();
  const chrome = useAdminChrome();
  const compact = useAdminCompactLayout();
  const insets = useSafeAreaInsets();
  const isAdmin = Boolean(user?.isAdmin);
  const styles = useMemo(() => createStyles(chrome, c, shadowPremium), [chrome, c, shadowPremium]);
  const { confirm, dialog } = useAdminConfirm();

  const [tab, setTab] = useState(TABS.some((t) => t.key === route?.params?.tab) ? route.params.tab : "draft");
  const [data, setData] = useState(EMPTY);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [mode, setMode] = useState("list");
  const [editor, setEditor] = useState(() => toEditor());
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState("");
  const [draftQty, setDraftQty] = useState({});
  const [suppliers, setSuppliers] = useState([]);
  const [syncing, setSyncing] = useState(false);
  const toast = useToast();

  const requestRef = useRef(0);
  const locked = editor.status === "received";

  const loadList = useCallback(
    async ({ silent = false } = {}) => {
      const id = ++requestRef.current;
      if (!silent) setLoading(true);
      try {
        const res = await searchAdminStockIn(null, { status: tab, page: 1, pageSize: 50 });
        if (id !== requestRef.current) return;
        setData(res);
        setError("");
      } catch (err) {
        if (id === requestRef.current) setError(err?.message || "Couldn't load stock in.");
      } finally {
        if (id === requestRef.current) setLoading(false);
      }
    },
    [tab]
  );

  useEffect(() => {
    if (isAdmin) loadList();
  }, [isAdmin, loadList]);

  useEffect(() => {
    if (!isAdmin) return undefined;
    fetchAdminProducts()
      .then((list) => {
        setProducts(Array.isArray(list) ? list : []);
        cacheAdminCatalog(list);
      })
      .catch(async () => {
        const cached = await readAdminCatalogCache();
        if (cached.products.length) setProducts(cached.products);
      });
    fetchAdminSuppliers(null)
      .then((res) => setSuppliers(Array.isArray(res) ? res : res?.items || []))
      .catch(() => {});
    if (route?.params?.receiptId) return undefined;
    const seedSupplier = String(route?.params?.supplier || "").trim();
    if (seedSupplier) {
      setEditor((prev) => ({ ...prev, supplierName: seedSupplier }));
    } else {
      searchAdminStockIn(null, { status: "received", page: 1, pageSize: 1 })
        .then((res) => {
          const last = res?.items?.[0];
          if (last?.supplierName) setEditor((prev) => (prev.id || prev.supplierName ? prev : { ...prev, supplierName: last.supplierName }));
        })
        .catch(() => {});
    }
  }, [isAdmin, route?.params?.supplier, route?.params?.receiptId]);

  useEffect(() => {
    const id = route?.params?.receiptId;
    if (!isAdmin || !id) return;
    setMode("edit");
    setSearch("");
    setDraftQty({});
    setError("");
    fetchAdminStockIn(null, id)
      .then((doc) => setEditor(toEditor(doc)))
      .catch((err) => setError(err?.message || "Couldn't open that delivery."));
  }, [isAdmin, route?.params?.receiptId]);

  useEffect(() => {
    const productId = route?.params?.productId;
    if (!isAdmin || !productId || !products.length || route?.params?.receiptId) return;
    const product = products.find((p) => String(p._id) === String(productId));
    if (!product) return;
    setEditor(toEditor());
    setDraftQty({});
    setSearch("");
    setError("");
    setMode("edit");
    setEditor({
      ...toEditor(),
      lines: [
        {
          productId: String(product._id),
          name: product.name || "Jar",
          sku: product.sku || "",
          unit: product.unit || "",
          image: productCoverUri(product),
          quantity: 1,
          unitCost: product.lastCost ? String(product.lastCost) : "",
        },
      ],
    });
    navigation.setParams?.({ productId: undefined });
  }, [isAdmin, route?.params?.productId, route?.params?.receiptId, products, navigation]);

  const onPull = async () => {
    setRefreshing(true);
    try {
      await loadList({ silent: true });
    } finally {
      setRefreshing(false);
    }
  };

  const openNew = () => {
    setEditor(toEditor());
    setDraftQty({});
    setSearch("");
    setError("");
    setMode("edit");
  };

  const openRow = async (row) => {
    setError("");
    setSearch("");
    setDraftQty({});
    if (row.status === "received") {
      setEditor(toEditor(row));
      setMode("view");
      return;
    }
    setMode("edit");
    setEditor(toEditor(row));
    try {
      const fresh = await fetchAdminStockIn(null, row._id);
      setEditor(toEditor(fresh));
    } catch (err) {
      setError(err?.message || "Couldn't open that delivery.");
    }
  };

  const backToList = () => {
    setMode("list");
    setEditor(toEditor());
    setSearch("");
    loadList({ silent: true });
  };

  const hits = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return [];
    const taken = new Set(editor.lines.map((line) => line.productId));
    return products
      .filter((p) => {
        if (taken.has(String(p._id))) return false;
        const name = String(p.name || "").toLowerCase();
        const sku = String(p.sku || "").toLowerCase();
        return name.includes(q) || sku.includes(q);
      })
      .slice(0, 8);
  }, [products, search, editor.lines]);

  const supplierHits = useMemo(() => {
    const q = String(editor.supplierName || "").trim().toLowerCase();
    if (!q) return [];
    return (Array.isArray(suppliers) ? suppliers : [])
      .filter((row) => String(row.name || "").toLowerCase().includes(q) && String(row.name || "").toLowerCase() !== q)
      .slice(0, 5);
  }, [suppliers, editor.supplierName]);

  const addLine = (product) => {
    if (locked) return;
    const id = String(product._id);
    if (editor.lines.some((line) => line.productId === id)) return;
    setEditor((prev) => ({
      ...prev,
      lines: [
        ...prev.lines,
        {
          productId: id,
          name: product.name || "Jar",
          sku: product.sku || "",
          unit: product.unit || "",
          image: productCoverUri(product),
          quantity: 1,
          unitCost: product.lastCost ? String(product.lastCost) : "",
        },
      ],
    }));
    setSearch("");
  };

  const setLineQty = (productId, quantity) => {
    setEditor((prev) => ({
      ...prev,
      lines: prev.lines.map((line) => (line.productId === productId ? { ...line, quantity } : line)),
    }));
  };

  const setLineCost = (productId, unitCost) => {
    setEditor((prev) => ({
      ...prev,
      lines: prev.lines.map((line) => (line.productId === productId ? { ...line, unitCost } : line)),
    }));
  };

  const commitLineQty = (line) => {
    const next = parseQty(draftQty[line.productId] !== undefined ? draftQty[line.productId] : line.quantity, 1);
    setLineQty(line.productId, next);
    setDraftQty((prev) => {
      const copy = { ...prev };
      delete copy[line.productId];
      return copy;
    });
  };

  const removeLine = (productId) => {
    if (locked) return;
    setEditor((prev) => ({ ...prev, lines: prev.lines.filter((line) => line.productId !== productId) }));
  };

  const saveDraft = async () => {
    if (locked || busy) return;
    setBusy(true);
    setError("");
    try {
      const saved = await saveAdminStockInDraft(null, payloadOf(editor), editor.id);
      setEditor(toEditor(saved));
    } catch (err) {
      if (isLikelyOffline(err)) {
        // A saved draft stays a draft when it reaches the server; only Confirm books the stock.
        await enqueueAdminOfflineDraft("stock_in", { ...payloadOf(editor), confirm: false }, `${editor.supplierName || "Stock in"} · draft`);
        toast.toastSuccess("Saved on this phone.");
        setError("");
      } else {
        setError(err?.message || "Couldn't save draft.");
      }
    } finally {
      setBusy(false);
    }
  };

  const printBill = async () => {
    if (!editor.lines.length) {
      setError(COPY.emptyConfirm);
      return;
    }
    try {
      await printAdminHtml(buildStockInBillHtml(editor));
    } catch (err) {
      setError(err?.message || "Couldn't print this bill.");
    }
  };

  const confirmReceipt = async () => {
    if (locked || busy) return;
    if (!editor.lines.length) {
      setError(COPY.emptyConfirm);
      return;
    }
    const ok = await confirm({
      title: COPY.confirm,
      confirmLabel: "Confirm",
      icon: "download-outline",
    });
    if (!ok) return;
    setBusy(true);
    setError("");
    let current = editor;
    try {
      let id = editor.id;
      if (!id) {
        const saved = await saveAdminStockInDraft(null, payloadOf(editor));
        current = toEditor(saved);
        id = current.id;
        setEditor(current);
      }
      const booked = await confirmAdminStockIn(null, id, payloadOf(current));
      setEditor(toEditor(booked));
      setMode("view");
    } catch (err) {
      if (isLikelyOffline(err)) {
        await enqueueAdminOfflineDraft("stock_in", payloadOf(current), current.supplierName || "Stock in");
        toast.toastSuccess("Saved on this phone.");
        setError("");
      } else {
        setError(err?.message || "Couldn't book that delivery.");
      }
    } finally {
      setBusy(false);
    }
  };

  if (user && !user.isAdmin) {
    return (
      <AdminScreenShell style={styles.screen}>
        <KankregScrollPage scrollVariant="inner" showFooter={false} style={customerScrollFill}>
          <SectionReveal delay={40} preset="fade-up">
            <View style={styles.gatePanel}>
              <PremiumErrorBanner severity="warning" title={ADMIN_GATE.title} message="This account does not have admin privileges." />
              <AdminButton label={ADMIN_GATE.backHome} icon="home-outline" variant="primary" size="md" onPress={() => navigation.navigate("Home")} style={styles.gateCta} />
            </View>
          </SectionReveal>
        </KankregScrollPage>
      </AdminScreenShell>
    );
  }

  const counts = data.counts || {};
  const tabs = TABS.map((item) => ({ ...item, count: counts[item.key], tone: item.key === "draft" ? "gold" : undefined }));
  const emptyTitle = tab === "draft" ? COPY.emptyDrafts : COPY.emptyReceived;
  const inForm = mode !== "list";
  const totalJars = editor.lines.reduce((sum, line) => sum + parseQty(line.quantity, 1), 0);

  const syncDrafts = async () => {
    setSyncing(true);
    try {
      const { done, pending } = await syncAdminOfflineDrafts(adminOfflineHandlers());
      if (done.length) toast.toastSuccess(`Synced ${done.length} ${done.length === 1 ? "delivery" : "deliveries"}.`);
      if (pending[0]?.error) setError(pending[0].error);
      await loadList({ silent: true });
    } finally {
      setSyncing(false);
    }
  };

  const actions = !locked ? (
    <View style={[styles.actions, compact && styles.actionsDock]}>
      <AdminButton label="Save draft" icon="save-outline" variant="soft" onPress={saveDraft} loading={busy} style={styles.actionBtn} />
      <AdminButton label="Confirm" icon="checkmark-outline" variant="primary" onPress={confirmReceipt} loading={busy} style={styles.actionBtn} />
    </View>
  ) : null;

  return (
    <AdminScreenShell style={styles.screen}>
      <KeyboardAvoidingView style={customerScrollFill} behavior={Platform.OS === "ios" ? "padding" : "height"}>
        <KankregScrollPage
          scrollVariant="admin"
          showFooter={false}
          style={customerScrollFill}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={compact && inForm && !locked ? { paddingBottom: 88 } : undefined}
          refreshControl={Platform.OS === "web" || inForm ? undefined : <RefreshControl refreshing={refreshing} onRefresh={onPull} />}
        >
          <KankregAdminShell
            navigation={navigation}
            route={route}
            title={COPY.title}
            subtitle={COPY.subtitle}
            headerRight={
              inForm ? (
                <View style={styles.headerActions}>
                  {locked ? <AdminButton label={COPY.printBill} icon="print-outline" variant="gold" size="sm" onPress={printBill} /> : null}
                  <AdminButton label="All bills" icon="chevron-back-outline" variant="ghost" size="sm" onPress={backToList} />
                </View>
              ) : (
                <View style={styles.headerActions}>
                  <AdminButton label="New bill" icon="add-outline" variant="primary" size="sm" onPress={openNew} />
                  <AdminButton label="Refresh" icon="refresh-outline" variant="soft" size="sm" onPress={() => loadList()} />
                </View>
              )
            }
          >
            <View style={styles.panel}>
              <AdminAlerts error={error} onCloseError={() => setError("")} />
              <AdminOfflineBanner kinds={["stock_in"]} syncing={syncing} onSync={syncDrafts} onManage={() => navigation.navigate("AdminOffline")} />

              {mode === "list" ? (
                <>
                  <AdminFilterTabs
                    items={tabs}
                    value={tab}
                    onChange={(key) => {
                      setTab(key);
                    }}
                  />
                  {!loading && data.items.length === 0 ? (
                    <PremiumEmptyState
                      iconName="download-outline"
                      title={emptyTitle}
                      ctaLabel={tab === "draft" ? "New bill" : undefined}
                      ctaIconLeft="add-outline"
                      onCtaPress={tab === "draft" ? openNew : undefined}
                      compact
                    />
                  ) : (
                    <View style={styles.list}>
                      {!compact ? (
                        <View style={styles.head}>
                          <Text style={[styles.headText, { flex: 1.1 }]}>Date</Text>
                          <Text style={[styles.headText, { flex: 1.6 }]}>Note</Text>
                          <Text style={[styles.headText, { width: 72 }]}>Lines</Text>
                          <Text style={[styles.headText, { width: 80 }]}>Jars</Text>
                          <Text style={[styles.headText, { width: 100 }]}>Status</Text>
                        </View>
                      ) : null}
                      {data.items.map((row) => (
                        <Pressable
                          key={row._id}
                          onPress={() => openRow(row)}
                          style={({ pressed }) => [compact ? styles.card : styles.row, pressed && styles.pressed]}
                        >
                          {compact ? (
                            <>
                              <View style={styles.cardTop}>
                                <Text style={styles.strong} numberOfLines={1}>
                                  {row.note || "Delivery"}
                                </Text>
                                <AdminBadge label={row.status === "received" ? "Received" : "Draft"} tone={row.status === "received" ? "green" : "gold"} />
                              </View>
                              <Text style={styles.sub}>
                                {formatShortDateTime(row.receivedAt || row.createdAt)} · {plural(row.lineCount, "line")} · {plural(row.totalJars, "jar")}
                              </Text>
                            </>
                          ) : (
                            <>
                              <Text style={[styles.sub, { flex: 1.1 }]} numberOfLines={1}>
                                {formatShortDateTime(row.receivedAt || row.createdAt)}
                              </Text>
                              <Text style={[styles.strong, { flex: 1.6 }]} numberOfLines={1}>
                                {row.note || "Delivery"}
                              </Text>
                              <Text style={[styles.body, { width: 72 }]}>{row.lineCount}</Text>
                              <Text style={[styles.body, { width: 80 }]}>{row.totalJars}</Text>
                              <View style={{ width: 100 }}>
                                <AdminBadge label={row.status === "received" ? "Received" : "Draft"} tone={row.status === "received" ? "green" : "gold"} />
                              </View>
                            </>
                          )}
                        </Pressable>
                      ))}
                    </View>
                  )}
                </>
              ) : (
                <>
                  <AdminPanel
                    title={locked ? "Received bill" : editor.id ? "Draft bill" : "New bill"}
                    icon="download-outline"
                    meta={locked ? formatShortDateTime(editor.receivedAt) : editor.savedByName || undefined}
                    description={locked ? `${plural(editor.lines.length, "line")} · ${plural(totalJars, "jar")} added` : "Search a jar, set how many arrived, then confirm."}
                  >
                    <AdminFilterTabs
                      value={editor.destination || "online"}
                      onChange={(destination) => !locked && setEditor((prev) => ({ ...prev, destination }))}
                      items={[
                        { key: "online", label: "Online pile" },
                        { key: "counter", label: "Shop floor" },
                      ]}
                    />
                    <AdminInput
                      label="Supplier"
                      value={editor.supplierName}
                      onChangeText={(supplierName) => setEditor((prev) => ({ ...prev, supplierName }))}
                      placeholder="Who delivered this"
                      editable={!locked}
                    />
                    {!locked
                      ? supplierHits.map((row) => (
                          <AdminHitRow
                            key={row._id || row.name}
                            name={row.name}
                            meta={row.phone || "Supplier"}
                            onPress={() => setEditor((prev) => ({ ...prev, supplierName: row.name }))}
                          />
                        ))
                      : null}
                    <AdminInput
                      label="Note"
                      value={editor.note}
                      onChangeText={(note) => setEditor((prev) => ({ ...prev, note }))}
                      placeholder="Batch or invoice no."
                      maxLength={200}
                      editable={!locked}
                    />
                    {locked && editor.savedByName ? <Text style={styles.sub}>Saved by {editor.savedByName}</Text> : null}

                    {!locked ? (
                      <>
                        <AdminInput
                          label="Search products"
                          value={search}
                          onChangeText={setSearch}
                          placeholder="Name or SKU"
                          icon="search-outline"
                          autoCapitalize="none"
                        />
                        {hits.map((p) => (
                          <Pressable key={p._id} onPress={() => addLine(p)} style={({ pressed }) => [styles.hit, pressed && styles.pressed]}>
                            <AdminProductCell name={p.name} imageUri={productCoverUri(p)} />
                            <Text style={styles.sub}>
                              {p.sku || "No SKU"}
                              {p.unit ? ` · ${p.unit}` : ""}
                              {Number(p.lastCost) > 0 ? ` · last ₹${p.lastCost}` : ""}
                            </Text>
                          </Pressable>
                        ))}
                      </>
                    ) : null}

                    {editor.lines.length === 0 ? (
                      <Text style={styles.sub}>No jars on this delivery yet.</Text>
                    ) : (
                      editor.lines.map((line) => (
                        <View key={line.productId} style={compact ? styles.lineCard : styles.lineRow}>
                          <View style={{ flex: 1, minWidth: 0 }}>
                            <Text style={styles.strong} numberOfLines={1}>
                              {line.name}
                            </Text>
                            <Text style={styles.sub} numberOfLines={1}>
                              {line.sku || "No SKU"}
                              {line.unit ? ` · ${line.unit}` : ""}
                            </Text>
                          </View>
                          {locked ? (
                            <Text style={styles.strong}>
                              +{line.quantity}
                              {Number(line.unitCost) > 0 ? ` · ₹${line.unitCost}` : ""}
                            </Text>
                          ) : (
                            <View style={styles.lineActions}>
                              <AdminQtyStepper
                                min={1}
                                value={draftQty[line.productId] !== undefined ? draftQty[line.productId] : String(line.quantity)}
                                busy={busy}
                                onMinus={() => setLineQty(line.productId, Math.max(1, line.quantity - 1))}
                                onPlus={() => setLineQty(line.productId, line.quantity + 1)}
                                onChange={(t) => setDraftQty((prev) => ({ ...prev, [line.productId]: t }))}
                                onCommit={() => commitLineQty(line)}
                              />
                              <AdminInput
                                value={String(line.unitCost || "")}
                                onChangeText={(unitCost) => setLineCost(line.productId, unitCost)}
                                placeholder="Cost"
                                numeric
                                prefix="₹"
                                editable={!locked}
                                style={styles.costField}
                              />
                              <AdminButton label="Remove" icon="trash-outline" variant="ghost" size="xs" onPress={() => removeLine(line.productId)} />
                            </View>
                          )}
                        </View>
                      ))
                    )}
                  </AdminPanel>
                  {locked ? (
                    <AdminButton label={COPY.printBill} icon="print-outline" variant="gold" onPress={printBill} />
                  ) : !compact ? (
                    actions
                  ) : null}
                </>
              )}
            </View>
          </KankregAdminShell>
        </KankregScrollPage>
        {compact && inForm && actions ? (
          <View style={[styles.dock, { paddingBottom: Math.max(insets.bottom, 10) }]}>{actions}</View>
        ) : null}
      </KeyboardAvoidingView>
      {dialog}
    </AdminScreenShell>
  );
}

function createStyles(chrome, c, shadowPremium) {
  return StyleSheet.create({
    screen: { flex: 1, width: "100%", alignSelf: "center", maxWidth: "100%" },
    panel: { ...adminShellContent(), gap: spacing.sm + 2 },
    gatePanel: adminGatePanel(c, shadowPremium),
    gateCta: { marginTop: spacing.md, alignSelf: "flex-start" },
    headerActions: { flexDirection: "row", alignItems: "center", gap: 8 },
    list: {
      backgroundColor: chrome.card,
      borderRadius: 16,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: chrome.line,
      overflow: "hidden",
    },
    head: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      paddingHorizontal: 16,
      paddingVertical: 11,
      backgroundColor: chrome.paper,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: chrome.line,
    },
    headText: {
      fontSize: 10.5,
      letterSpacing: 0.7,
      textTransform: "uppercase",
      color: chrome.inkFaint,
      fontFamily: ADMIN_FONT.semibold,
    },
    row: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: chrome.lineSoft,
      ...Platform.select({ web: { cursor: "pointer" }, default: {} }),
    },
    card: { padding: 14, gap: 6, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: chrome.lineSoft },
    cardTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 10 },
    pressed: { backgroundColor: chrome.paper },
    strong: { fontSize: 13.5, color: chrome.ink, fontFamily: ADMIN_FONT.semibold },
    body: { fontSize: 13, color: chrome.ink, fontFamily: ADMIN_FONT.regular },
    sub: { fontSize: 11.5, color: chrome.inkFaint, fontFamily: ADMIN_FONT.regular },
    hit: { paddingVertical: 8, gap: 2, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: chrome.lineSoft },
    lineRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      paddingVertical: 8,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: chrome.lineSoft,
    },
    lineCard: {
      gap: 10,
      paddingVertical: 12,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: chrome.lineSoft,
    },
    lineActions: { flexDirection: "row", alignItems: "center", flexWrap: "wrap", gap: 8 },
    costField: { width: 88 },
    actions: { flexDirection: "row", gap: 8 },
    actionsDock: { width: "100%" },
    actionBtn: { flex: 1 },
    dock: {
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: chrome.line,
      backgroundColor: chrome.paper,
      paddingHorizontal: 12,
      paddingTop: 8,
    },
  });
}
