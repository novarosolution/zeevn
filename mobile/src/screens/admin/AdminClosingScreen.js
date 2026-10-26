import React, { useCallback, useEffect, useMemo, useState } from "react";
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
import AdminInput from "../../components/admin/AdminInput";
import AdminStatTile, { AdminStatGrid } from "../../components/admin/AdminStatTile";
import { useAdminConfirm } from "../../components/admin/AdminDialog";
import PremiumEmptyState from "../../components/ui/PremiumEmptyState";
import PremiumErrorBanner from "../../components/ui/PremiumErrorBanner";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";
import {
  fetchAdminClosing,
  fetchAdminClosingToday,
  reopenAdminClosing,
  saveAdminClosingDraft,
  searchAdminClosings,
  submitAdminClosing,
  applyAdminClosing,
} from "../../services/adminService";
import { ADMIN_FONT, adminGatePanel, adminShellContent, useAdminChrome, useAdminCompactLayout } from "../../theme/adminLayout";
import { printAdminHtml } from "../../utils/printAdminHtml";
import { formatRupees } from "../../utils/adminFormat";
import { htmlEscape } from "../../utils/orderInvoiceMeta";
import { customerScrollFill } from "../../theme/screenLayout";
import { spacing } from "../../theme/tokens";
function formatDateKey(key) {
  const [y, m, d] = String(key || "").split("-").map(Number);
  if (!y || !m || !d) return key || "";
  return new Date(y, m - 1, d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

const COPY = ADMIN_SCREEN_COPY.closing;
const FILTERS = [
  { key: "all", label: "All" },
  { key: "shortage", label: "Shortage" },
  { key: "surplus", label: "Surplus" },
  { key: "uncounted", label: "Not counted yet" },
];

function countedText(value) {
  if (value === null || value === undefined || value === "") return "";
  return String(value);
}

/**
 * What was counted against what the shelf held, from the boxes as they are typed right now (the server's `counted`
 * only catches up after a save). An empty box means "not counted", never "zero", so only the piles somebody counted
 * are compared. Sheets saved before the floor pile existed carry one `counted`, which was the online count.
 */
function compareLine(line) {
  const onlineRaw = countedText(line.countedOnline);
  const floorRaw = countedText(line.countedCounter);
  const legacyRaw = countedText(line.counted);
  const online = onlineRaw !== "" ? Number(onlineRaw) : floorRaw === "" && legacyRaw !== "" ? Number(legacyRaw) : null;
  const floor = floorRaw !== "" ? Number(floorRaw) : null;
  if (online === null && floor === null) return null;
  const expectedOnline = Number(line.expectedOnline ?? line.expected ?? 0);
  const expectedFloor = Number(line.expectedCounter || 0);
  const counted = (online ?? 0) + (floor ?? 0);
  const expected = (online === null ? 0 : expectedOnline) + (floor === null ? 0 : expectedFloor);
  return { counted, expected, variance: counted - expected };
}

function lineKind(line) {
  const compared = compareLine(line);
  if (!compared) return "uncounted";
  if (compared.variance < 0) return "shortage";
  if (compared.variance > 0) return "surplus";
  return "match";
}

function payloadOf(sheet) {
  return {
    cashCounted: sheet?.cashCounted === "" || sheet?.cashCounted == null ? undefined : Math.max(0, Number(sheet.cashCounted) || 0),
    cashNote: String(sheet?.cashNote || "").trim().slice(0, 160),
    lines: (sheet?.lines || []).map((line) => ({
      product: line.product,
      counted: countedText(line.counted) === "" ? null : Math.max(0, Number.parseInt(String(line.counted), 10) || 0),
      countedOnline: countedText(line.countedOnline) === "" ? null : Math.max(0, Number.parseInt(String(line.countedOnline), 10) || 0),
      countedCounter: countedText(line.countedCounter) === "" ? null : Math.max(0, Number.parseInt(String(line.countedCounter), 10) || 0),
      note: String(line.note || "").slice(0, 120),
    })),
  };
}

function varianceLabel(line) {
  const compared = compareLine(line);
  if (!compared) return "";
  if (compared.variance === 0) return "Match";
  return compared.variance > 0 ? `+${compared.variance}` : String(compared.variance);
}

function formatAppliedAt(value) {
  const at = value ? new Date(value) : null;
  if (!at || Number.isNaN(at.getTime())) return "";
  return at.toLocaleString("en-IN", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" });
}

export default function AdminClosingScreen({ navigation, route }) {
  const { user } = useAuth();
  const { colors: c, shadowPremium } = useTheme();
  const chrome = useAdminChrome();
  const compact = useAdminCompactLayout();
  const insets = useSafeAreaInsets();
  const isAdmin = Boolean(user?.isAdmin);
  const styles = useMemo(() => createStyles(chrome, c, shadowPremium, compact), [chrome, c, shadowPremium, compact]);
  const { confirm, dialog } = useAdminConfirm();

  const [mode, setMode] = useState("sheet");
  const [past, setPast] = useState([]);
  const [sheet, setSheet] = useState(null);
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const locked = sheet?.status === "submitted";

  const loadPast = useCallback(async () => {
    const res = await searchAdminClosings();
    setPast(Array.isArray(res.items) ? res.items : []);
  }, []);

  const openDate = useCallback(async (date) => {
    setError("");
    setFilter("all");
    const doc = date ? await fetchAdminClosing(null, date) : await fetchAdminClosingToday();
    setSheet(doc);
    setMode("sheet");
  }, []);

  const boot = useCallback(async () => {
    setLoading(true);
    try {
      await Promise.all([loadPast(), openDate(route?.params?.date)]);
    } catch (err) {
      setError(err?.message || "Couldn't load the closing.");
    } finally {
      setLoading(false);
    }
  }, [loadPast, openDate, route?.params?.date]);

  useEffect(() => {
    if (isAdmin) boot();
  }, [isAdmin, boot]);

  const onPull = async () => {
    setRefreshing(true);
    try {
      if (mode === "list") await loadPast();
      else if (sheet?.date) await openDate(sheet.date);
    } catch (err) {
      setError(err?.message || "Couldn't refresh.");
    } finally {
      setRefreshing(false);
    }
  };

  const setLine = (product, patch) => {
    if (locked) return;
    setSheet((prev) => ({
      ...prev,
      lines: (prev.lines || []).map((line) => (String(line.product) === String(product) ? { ...line, ...patch } : line)),
    }));
  };

  const saveDraft = async () => {
    if (!sheet || locked || busy) return;
    setBusy(true);
    setError("");
    try {
      const saved = await saveAdminClosingDraft(null, sheet.date, payloadOf(sheet));
      setSheet(saved);
      await loadPast();
    } catch (err) {
      setError(err?.message || "Couldn't save the draft.");
    } finally {
      setBusy(false);
    }
  };

  const submit = async () => {
    if (!sheet || locked || busy) return;
    const missing = (sheet.lines || []).some(
      (line) => countedText(line.countedOnline) === "" && countedText(line.countedCounter) === "" && countedText(line.counted) === ""
    );
    if (missing) {
      setError(COPY.submitBlocked);
      return;
    }
    const ok = await confirm({ title: COPY.confirm, confirmLabel: "Submit", icon: "clipboard-outline" });
    if (!ok) return;
    setBusy(true);
    setError("");
    try {
      const saved = await submitAdminClosing(null, sheet.date, payloadOf(sheet));
      setSheet(saved);
      await loadPast();
    } catch (err) {
      setError(err?.message || "Couldn't submit the count.");
    } finally {
      setBusy(false);
    }
  };

  const reopen = async () => {
    if (!sheet || busy) return;
    setBusy(true);
    setError("");
    try {
      const saved = await reopenAdminClosing(null, sheet.date);
      setSheet(saved);
      await loadPast();
    } catch (err) {
      setError(err?.message || "Couldn't reopen the count.");
    } finally {
      setBusy(false);
    }
  };

  const apply = async () => {
    if (!sheet || busy || sheet.appliedAt) return;
    const ok = await confirm({
      title: `Write ${formatDateKey(sheet.date)} counts onto stock?`,
      message: sheet.today
        ? "Stock will be set to these counts."
        : "This count is from an earlier day. Anything sold or received since then will be overwritten.",
      confirmLabel: "Apply",
      tone: sheet.today ? "default" : "danger",
      icon: "save-outline",
    });
    if (!ok) return;
    setBusy(true);
    setError("");
    try {
      const saved = await applyAdminClosing(null, sheet.date);
      setSheet(saved);
      await loadPast();
    } catch (err) {
      setError(err?.message || "Couldn't apply the count.");
    } finally {
      setBusy(false);
    }
  };

  const goStock = (line) => {
    navigation.navigate("AdminInventory", { search: line.sku || line.name || "" });
  };

  const counts = useMemo(() => {
    const next = { shortage: 0, surplus: 0, match: 0, uncounted: 0 };
    for (const line of sheet?.lines || []) next[lineKind(line)] += 1;
    return next;
  }, [sheet]);

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

  const lines = (sheet?.lines || []).filter((line) => filter === "all" || lineKind(line) === filter);
  const canSubmit = !locked && (sheet?.lines || []).every(
    (line) => countedText(line.countedOnline) !== "" || countedText(line.countedCounter) !== "" || countedText(line.counted) !== ""
  );

  const actions = sheet ? (
    <View style={[styles.actions, compact && styles.actionsDock]}>
      {locked ? (
        <>
          <AdminButton label="Reopen" icon="create-outline" variant="soft" onPress={reopen} loading={busy} style={styles.actionBtn} />
          {sheet.appliedAt ? (
            <AdminButton label="On stock" icon="checkmark-done-outline" variant="soft" disabled style={styles.actionBtn} />
          ) : (
            <AdminButton label="Apply to stock" icon="save-outline" variant="gold" onPress={apply} loading={busy} style={styles.actionBtn} />
          )}
        </>
      ) : (
        <>
          <AdminButton label="Save draft" icon="save-outline" variant="soft" onPress={saveDraft} loading={busy} style={styles.actionBtn} />
          <AdminButton label="Submit" icon="checkmark-outline" variant="primary" onPress={submit} loading={busy} disabled={!canSubmit} style={styles.actionBtn} />
        </>
      )}
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
          contentContainerStyle={compact && mode === "sheet" ? { paddingBottom: 88 } : undefined}
          refreshControl={Platform.OS === "web" ? undefined : <RefreshControl refreshing={refreshing} onRefresh={onPull} />}
        >
          <KankregAdminShell
            navigation={navigation}
            route={route}
            title={COPY.title}
            subtitle={COPY.subtitle}
            headerRight={
              <View style={styles.headerActions}>
                {mode === "sheet" ? (
                  <AdminButton label="Past" icon="calendar-outline" variant="ghost" size="sm" onPress={() => { setMode("list"); loadPast().catch(() => {}); }} />
                ) : (
                  <AdminButton label="Today" icon="clipboard-outline" variant="primary" size="sm" onPress={() => openDate()} />
                )}
                <AdminButton label="Refresh" icon="refresh-outline" variant="soft" size="sm" onPress={onPull} />
              </View>
            }
          >
            <View style={styles.panel}>
              <AdminAlerts error={error} onCloseError={() => setError("")} />

              {mode === "list" ? (
                !loading && past.length === 0 ? (
                  <PremiumEmptyState iconName="clipboard-outline" title={COPY.emptyPast} compact />
                ) : (
                  <View style={styles.list}>
                    {!compact ? (
                      <View style={styles.head}>
                        <Text style={[styles.headText, { flex: 1.2 }]}>Date</Text>
                        <Text style={[styles.headText, { width: 100 }]}>Status</Text>
                        <Text style={[styles.headText, { width: 88 }]}>Shortage</Text>
                        <Text style={[styles.headText, { width: 80 }]}>Surplus</Text>
                      </View>
                    ) : null}
                    {past.map((row) => (
                      <Pressable
                        key={row.date}
                        onPress={() => openDate(row.date)}
                        style={({ pressed }) => [compact ? styles.card : styles.row, pressed && styles.pressed]}
                      >
                        {compact ? (
                          <>
                            <View style={styles.cardTop}>
                              <Text style={styles.strong}>{formatDateKey(row.date)}</Text>
                              <AdminBadge label={row.applied ? "On stock" : row.status === "submitted" ? "Submitted" : "Draft"} tone={row.status === "submitted" ? "green" : "gold"} />
                            </View>
                            <Text style={styles.sub}>
                              {row.shortage} shortage · {row.surplus} surplus
                            </Text>
                          </>
                        ) : (
                          <>
                            <Text style={[styles.strong, { flex: 1.2 }]}>{formatDateKey(row.date)}</Text>
                            <View style={{ width: 100 }}>
                              <AdminBadge label={row.applied ? "On stock" : row.status === "submitted" ? "Submitted" : "Draft"} tone={row.status === "submitted" ? "green" : "gold"} />
                            </View>
                            <Text style={[styles.body, { width: 88 }]}>{row.shortage}</Text>
                            <Text style={[styles.body, { width: 80 }]}>{row.surplus}</Text>
                          </>
                        )}
                      </Pressable>
                    ))}
                  </View>
                )
              ) : sheet ? (
                <>
                  <View style={styles.sheetHead}>
                    <View style={styles.sheetTitle}>
                      <Text style={styles.date}>{formatDateKey(sheet.date)}</Text>
                      <AdminBadge label={sheet.appliedAt ? "On stock" : locked ? "Submitted" : "Draft"} tone={locked ? "green" : "gold"} />
                    </View>
                    {sheet.appliedAt ? (
                      <Text style={styles.sub}>
                        {`Written onto stock ${formatAppliedAt(sheet.appliedAt)}${sheet.appliedByName ? ` by ${sheet.appliedByName}` : ""}. Reopen to count again.`}
                      </Text>
                    ) : null}
                    <AdminStatGrid min={compact ? 96 : 120}>
                      <AdminStatTile
                        label="Shortage"
                        value={String(counts.shortage)}
                        tone={counts.shortage ? "red" : "neutral"}
                        selected={filter === "shortage"}
                        onPress={() => setFilter("shortage")}
                        style={compact ? styles.tilePhone : undefined}
                      />
                      <AdminStatTile
                        label="Surplus"
                        value={String(counts.surplus)}
                        tone={counts.surplus ? "gold" : "neutral"}
                        selected={filter === "surplus"}
                        onPress={() => setFilter("surplus")}
                        style={compact ? styles.tilePhone : undefined}
                      />
                      <AdminStatTile
                        label="Match"
                        value={String(counts.match)}
                        tone="green"
                        style={compact ? styles.tilePhone : undefined}
                      />
                    </AdminStatGrid>
                    <AdminInput
                      label="Cash counted"
                      value={countedText(sheet.cashCounted)}
                      onChangeText={(cashCounted) => !locked && setSheet((prev) => ({ ...prev, cashCounted }))}
                      numeric
                      prefix="₹"
                      editable={!locked}
                    />
                    <AdminInput
                      label="Cash note"
                      value={sheet.cashNote || ""}
                      onChangeText={(cashNote) => !locked && setSheet((prev) => ({ ...prev, cashNote }))}
                      placeholder="Optional"
                      editable={!locked}
                    />
                    <AdminButton
                      label="Print count"
                      variant="soft"
                      icon="print-outline"
                      onPress={() => {
                        const html = `<!doctype html><html><head><meta charset="utf-8"><title>Closing ${sheet.date}</title>
                          <style>body{font-family:system-ui,sans-serif;padding:24px;color:#1a2118}h1{font-size:20px;margin:0 0 8px}p{color:#5c6658}table{width:100%;border-collapse:collapse}th,td{text-align:left;padding:6px 0;border-bottom:1px solid #e6e3d8}</style></head>
                          <body><h1>Closing ${formatDateKey(sheet.date)}</h1>
                          <p>Cash counted ${sheet.cashCounted != null && sheet.cashCounted !== "" ? formatRupees(sheet.cashCounted) : "—"} ${sheet.cashNote ? `· ${htmlEscape(sheet.cashNote)}` : ""}</p>
                          <table><thead><tr><th>Jar</th><th>Online</th><th>Floor</th></tr></thead><tbody>
                          ${(sheet.lines || []).map((line) => `<tr><td>${htmlEscape(line.name)}</td><td>${countedText(line.countedOnline) || countedText(line.counted) || "—"}</td><td>${countedText(line.countedCounter) || "—"}</td></tr>`).join("")}
                          </tbody></table></body></html>`;
                        printAdminHtml(html);
                      }}
                    />
                  </View>

                  <AdminFilterTabs items={FILTERS} value={filter} onChange={setFilter} />

                  <View style={styles.list}>
                    {lines.map((line) => {
                      const kind = lineKind(line);
                      const showLink = kind === "shortage" || kind === "surplus";
                      return (
                        <View key={String(line.product)} style={compact ? styles.lineCard : styles.lineRow}>
                          <View style={{ flex: 1, minWidth: 0 }}>
                            <Text style={styles.strong} numberOfLines={1}>
                              {line.name}
                            </Text>
                            <Text style={styles.sub} numberOfLines={1}>
                              {line.sku || "No SKU"}
                              {line.unit ? ` · ${line.unit}` : ""}
                              {` · online ${line.expectedOnline ?? line.expected} · floor ${line.expectedCounter || 0}`}
                            </Text>
                          </View>
                          {locked ? (
                            <Text style={styles.strong}>
                              {`web ${countedText(line.countedOnline) || countedText(line.counted) || "—"} · floor ${countedText(line.countedCounter) || "—"}`}
                            </Text>
                          ) : (
                            <View style={styles.countPair}>
                              <AdminInput
                                value={countedText(line.countedOnline)}
                                onChangeText={(countedOnline) => setLine(line.product, { countedOnline })}
                                placeholder="Online"
                                integer
                                style={styles.countField}
                              />
                              <AdminInput
                                value={countedText(line.countedCounter)}
                                onChangeText={(countedCounter) => setLine(line.product, { countedCounter })}
                                placeholder="Floor"
                                integer
                                style={styles.countField}
                              />
                            </View>
                          )}
                          {kind !== "uncounted" ? (
                            <AdminBadge
                              label={varianceLabel(line)}
                              tone={kind === "shortage" ? "red" : kind === "surplus" ? "gold" : "green"}
                              size="sm"
                            />
                          ) : null}
                          {locked ? null : (
                            <AdminInput
                              value={line.note || ""}
                              onChangeText={(note) => setLine(line.product, { note })}
                              placeholder="Note"
                              maxLength={120}
                              style={styles.noteField}
                            />
                          )}
                          {locked && line.note ? <Text style={styles.sub}>{line.note}</Text> : null}
                          {showLink ? (
                            <Pressable onPress={() => goStock(line)} accessibilityRole="button">
                              <Text style={styles.link}>Manage stock</Text>
                            </Pressable>
                          ) : null}
                        </View>
                      );
                    })}
                  </View>
                  {!compact ? actions : null}
                </>
              ) : loading ? null : (
                <PremiumEmptyState iconName="clipboard-outline" title={COPY.emptyPast} compact />
              )}
            </View>
          </KankregAdminShell>
        </KankregScrollPage>
        {compact && mode === "sheet" && actions ? (
          <View style={[styles.dock, { paddingBottom: Math.max(insets.bottom, 10) }]}>{actions}</View>
        ) : null}
      </KeyboardAvoidingView>
      {dialog}
    </AdminScreenShell>
  );
}

function createStyles(chrome, c, shadowPremium, compact) {
  return StyleSheet.create({
    screen: { flex: 1, width: "100%", alignSelf: "center", maxWidth: "100%" },
    panel: { ...adminShellContent(), gap: spacing.sm + 2 },
    gatePanel: adminGatePanel(c, shadowPremium),
    gateCta: { marginTop: spacing.md, alignSelf: "flex-start" },
    headerActions: { flexDirection: "row", alignItems: "center", gap: 8 },
    sheetHead: { gap: 10 },
    sheetTitle: { flexDirection: "row", alignItems: "center", gap: 10 },
    date: { fontSize: 22, letterSpacing: -0.4, color: chrome.ink, fontFamily: ADMIN_FONT.semibold },
    tilePhone: { flexBasis: "30%", flexGrow: 1, maxWidth: "32%" },
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
    lineRow: {
      flexDirection: "row",
      alignItems: "center",
      flexWrap: "wrap",
      gap: 10,
      paddingHorizontal: 16,
      paddingVertical: 10,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: chrome.lineSoft,
    },
    lineCard: {
      gap: 8,
      padding: 14,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: chrome.lineSoft,
    },
    countPair: { flexDirection: compact ? "column" : "row", alignItems: compact ? "stretch" : "center", gap: 8, minWidth: compact ? "100%" : 184 },
    countField: { width: compact ? "100%" : 88 },
    noteField: { flexGrow: 1, minWidth: 140 },
    link: { fontSize: 12.5, color: chrome.goldDeep, fontFamily: ADMIN_FONT.semibold },
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
