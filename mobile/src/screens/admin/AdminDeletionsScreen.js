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
import AdminInput from "../../components/admin/AdminInput";
import AdminPagination from "../../components/admin/AdminPagination";
import AdminPanel from "../../components/admin/AdminPanel";
import { useAdminConfirm } from "../../components/admin/AdminDialog";
import AdminEmptyState from "../../components/admin/AdminEmptyState";
import AdminNotice from "../../components/admin/AdminNotice";
import AdminLoader from "../../components/admin/AdminLoader";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";
import {
  approveAdminDeletion,
  fetchAdminDeletion,
  rejectAdminDeletion,
  searchAdminDeletions,
} from "../../services/adminService";
import { ADMIN_FONT, adminGatePanel, adminShellContent, useAdminChrome, useAdminCompactLayout } from "../../theme/adminLayout";
import { customerScrollFill } from "../../theme/screenLayout";
import { spacing } from "../../theme/tokens";
import { timeAgo } from "../../utils/adminFormat";

const COPY = ADMIN_SCREEN_COPY.deletions;
const EMPTY = { items: [], total: 0, page: 1, pages: 1, pageSize: 25, counts: { pending: 0, approved: 0, rejected: 0 } };
const TABS = [
  { key: "pending", label: "Pending" },
  { key: "approved", label: "Approved" },
  { key: "rejected", label: "Rejected" },
];

function statusTone(status) {
  if (status === "approved") return "green";
  if (status === "rejected") return "red";
  return "gold";
}

function emptyTitle(tab) {
  if (tab === "approved") return COPY.emptyApproved;
  if (tab === "rejected") return COPY.emptyRejected;
  return COPY.emptyPending;
}

function contactLine(row) {
  return [row.email, row.phone].map((part) => String(part || "").trim()).filter(Boolean).join(" · ") || "—";
}

export default function AdminDeletionsScreen({ navigation, route }) {
  const { user } = useAuth();
  const { colors: c, shadowPremium } = useTheme();
  const chrome = useAdminChrome();
  const compact = useAdminCompactLayout();
  const insets = useSafeAreaInsets();
  const isAdmin = Boolean(user?.isAdmin);
  const styles = useMemo(() => createStyles(chrome, c, shadowPremium), [chrome, c, shadowPremium]);
  const { confirm, dialog } = useAdminConfirm();

  const [tab, setTab] = useState(TABS.some((item) => item.key === route?.params?.tab) ? route.params.tab : "pending");
  const [page, setPage] = useState(1);
  const [data, setData] = useState(EMPTY);
  const [selectedId, setSelectedId] = useState(String(route?.params?.requestId || ""));
  const [detail, setDetail] = useState(null);
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");

  const query = useMemo(() => ({ status: tab, page, pageSize: 25 }), [tab, page]);
  const requestRef = useRef(0);

  const load = useCallback(
    async ({ silent = false } = {}) => {
      const id = ++requestRef.current;
      if (!silent) setLoading(true);
      try {
        const res = await searchAdminDeletions(null, query);
        if (id !== requestRef.current) return;
        setData(res);
        setError("");
      } catch (err) {
        if (id === requestRef.current) setError(err?.message || "Couldn't load deletion requests.");
      } finally {
        if (id === requestRef.current) setLoading(false);
      }
    },
    [query]
  );

  useEffect(() => {
    if (isAdmin) load();
  }, [isAdmin, load]);

  useEffect(() => {
    if (route?.params?.requestId) setSelectedId(String(route.params.requestId));
    if (route?.params?.tab && TABS.some((item) => item.key === route.params.tab)) {
      setTab(route.params.tab);
      setPage(1);
    }
  }, [route?.params?.requestId, route?.params?.tab]);

  useEffect(() => {
    if (!selectedId) {
      setDetail(null);
      setNote("");
      return undefined;
    }
    let alive = true;
    setDetailLoading(true);
    fetchAdminDeletion(null, selectedId)
      .then((row) => {
        if (!alive) return;
        setDetail(row);
        setNote(row.adminNote || "");
        setError("");
      })
      .catch((err) => {
        if (alive) {
          setDetail(null);
          setError(err?.message || "Couldn't load this request.");
        }
      })
      .finally(() => {
        if (alive) setDetailLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [selectedId]);

  const onPull = async () => {
    setRefreshing(true);
    try {
      await load({ silent: true });
      if (selectedId) {
        const row = await fetchAdminDeletion(null, selectedId);
        setDetail(row);
        setNote(row.adminNote || "");
      }
    } catch (err) {
      setError(err?.message || "Couldn't load deletion requests.");
    } finally {
      setRefreshing(false);
    }
  };

  const closeDetail = () => {
    setSelectedId("");
    setDetail(null);
    setNote("");
    if (route?.params?.requestId) navigation.setParams({ requestId: undefined });
  };

  const decide = async (kind) => {
    if (!detail || detail.status !== "pending") return;
    if (kind === "reject" && !note.trim()) {
      setError("A note is required to reject.");
      return;
    }
    if (kind === "approve") {
      const ok = await confirm({
        title: COPY.confirm(detail.name || "this user"),
        confirmLabel: "Wipe profile",
        tone: "danger",
      });
      if (!ok) return;
    }
    setBusy(kind);
    setError("");
    try {
      const row =
        kind === "approve"
          ? await approveAdminDeletion(null, detail._id, note.trim())
          : await rejectAdminDeletion(null, detail._id, note.trim());
      setDetail(row);
      setNote(row.adminNote || "");
      await load({ silent: true });
    } catch (err) {
      setError(err?.message || "Couldn't update this request.");
    } finally {
      setBusy("");
    }
  };

  if (user && !user.isAdmin) {
    return (
      <AdminScreenShell style={styles.screen}>
        <KankregScrollPage scrollVariant="inner" showFooter={false} style={customerScrollFill}>
          <SectionReveal delay={40} preset="fade-up">
            <View style={styles.gatePanel}>
              <AdminNotice severity="warning" title={ADMIN_GATE.title} message="This account does not have admin privileges." />
              <AdminButton label={ADMIN_GATE.backHome} icon="home-outline" variant="primary" size="md" onPress={() => navigation.navigate("Home")} style={styles.gateCta} />
            </View>
          </SectionReveal>
        </KankregScrollPage>
      </AdminScreenShell>
    );
  }

  const counts = data.counts || {};
  const tabs = TABS.map((item) => ({
    ...item,
    count: counts[item.key],
    tone: item.key === "pending" ? "gold" : undefined,
  }));
  const pending = detail?.status === "pending";
  const showingDetail = Boolean(selectedId);

  const actions = pending ? (
    <View style={[styles.actions, compact && styles.actionsDock, compact && { paddingBottom: Math.max(insets.bottom, 10) }]}>
      <AdminInput
        value={note}
        onChangeText={(value) => setNote(value.slice(0, 300))}
        placeholder="Note (required to reject)"
        multiline
        numberOfLines={2}
        maxLength={300}
      />
      <View style={styles.actionRow}>
        <AdminButton
          label="Approve"
          icon="checkmark-circle-outline"
          variant="primary"
          size="md"
          loading={busy === "approve"}
          disabled={Boolean(busy)}
          onPress={() => decide("approve")}
        />
        <AdminButton
          label="Reject"
          icon="close-circle-outline"
          variant="danger"
          size="md"
          loading={busy === "reject"}
          disabled={Boolean(busy)}
          onPress={() => decide("reject")}
        />
      </View>
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
          refreshControl={Platform.OS === "web" ? undefined : <RefreshControl refreshing={refreshing} onRefresh={onPull} />}
          stickyFooterExtra={compact && pending ? 168 : 0}
        >
          <KankregAdminShell
            navigation={navigation}
            route={route}
            title={showingDetail ? detail?.name || COPY.title : COPY.title}
            subtitle={COPY.subtitle}
            headerRight={
              showingDetail ? null : <AdminButton label="Refresh" icon="refresh-outline" variant="primary" size="sm" onPress={() => load()} />
            }
          >
            <View style={styles.panel}>
              <AdminAlerts error={error} onCloseError={() => setError("")} />

              {showingDetail ? (
                <>
                  <AdminButton label="Deletion requests" icon="chevron-back-outline" variant="soft" size="sm" onPress={closeDetail} />
                  {detailLoading ? (
                    <AdminLoader caption="Loading request…" />
                  ) : !detail ? (
                    <AdminNotice severity="error" title="Request not found" message={error || "This request may have been removed."} />
                  ) : (
                    <AdminPanel
                      title={detail.name || "Request"}
                      icon="person-remove-outline"
                      meta={detail.role}
                      description={contactLine(detail)}
                    >
                      <View style={styles.badges}>
                        <AdminBadge label={detail.status} tone={statusTone(detail.status)} />
                        <AdminBadge label={detail.role} tone={detail.wasRider ? "gold" : "green"} />
                      </View>
                      <Text style={styles.body}>{detail.reason || "No reason given."}</Text>
                      <Text style={styles.sub}>Waiting {timeAgo(detail.createdAt)}</Text>
                      {detail.adminNote ? <Text style={styles.body}>Note: {detail.adminNote}</Text> : null}
                      {detail.decidedByName ? (
                        <Text style={styles.sub}>
                          {detail.status} by {detail.decidedByName}
                          {detail.decidedAt ? ` · ${timeAgo(detail.decidedAt)}` : ""}
                        </Text>
                      ) : null}
                      {!compact ? actions : null}
                    </AdminPanel>
                  )}
                </>
              ) : (
                <>
                  <AdminFilterTabs
                    items={tabs}
                    value={tab}
                    onChange={(key) => {
                      setTab(key);
                      setPage(1);
                    }}
                  />

                  {loading && !data.items.length ? <AdminLoader caption="Loading requests…" /> : null}
                  {!loading && data.items.length === 0 ? (
                    <AdminEmptyState iconName="person-remove-outline" title={emptyTitle(tab)} compact />
                  ) : (
                    <View style={styles.list}>
                      {!compact ? (
                        <View style={styles.head}>
                          <Text style={[styles.headText, { flex: 1.2 }]}>Name</Text>
                          <Text style={[styles.headText, { flex: 1.6 }]}>Contact</Text>
                          <Text style={[styles.headText, { width: 80 }]}>Role</Text>
                          <Text style={[styles.headText, { flex: 1.4 }]}>Reason</Text>
                          <Text style={[styles.headText, { width: 92 }]}>Waiting</Text>
                        </View>
                      ) : null}
                      {data.items.map((row) => (
                        <Pressable
                          key={row._id}
                          onPress={() => setSelectedId(String(row._id))}
                          style={({ pressed }) => [compact ? styles.card : styles.row, pressed && styles.pressed]}
                          accessibilityRole="button"
                          accessibilityLabel={`Open ${row.name || "deletion request"}`}
                        >
                          {compact ? (
                            <>
                              <View style={styles.cardTop}>
                                <Text style={styles.strong} numberOfLines={1}>
                                  {row.name || "—"}
                                </Text>
                                <AdminBadge label={row.role} tone={row.wasRider ? "gold" : "green"} />
                              </View>
                              <Text style={styles.body} numberOfLines={1}>
                                {contactLine(row)}
                              </Text>
                              <Text style={styles.body} numberOfLines={2}>
                                {row.reason || "No reason given."}
                              </Text>
                              <Text style={styles.sub}>Waiting {timeAgo(row.createdAt)}</Text>
                            </>
                          ) : (
                            <>
                              <Text style={[styles.strong, { flex: 1.2 }]} numberOfLines={1}>
                                {row.name || "—"}
                              </Text>
                              <Text style={[styles.body, { flex: 1.6 }]} numberOfLines={2}>
                                {contactLine(row)}
                              </Text>
                              <View style={{ width: 80 }}>
                                <AdminBadge label={row.role} tone={row.wasRider ? "gold" : "green"} />
                              </View>
                              <Text style={[styles.body, { flex: 1.4 }]} numberOfLines={2}>
                                {row.reason || "No reason given."}
                              </Text>
                              <Text style={[styles.sub, { width: 92 }]}>{timeAgo(row.createdAt)}</Text>
                            </>
                          )}
                        </Pressable>
                      ))}
                    </View>
                  )}

                  {data.total > 0 ? (
                    <AdminPagination page={data.page} pages={data.pages} total={data.total} pageSize={data.pageSize} onPage={setPage} noun="requests" />
                  ) : null}
                </>
              )}
            </View>
          </KankregAdminShell>
        </KankregScrollPage>
        {compact && showingDetail ? actions : null}
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
    badges: { flexDirection: "row", alignItems: "center", gap: 8, flexWrap: "wrap" },
    actions: { gap: 10, marginTop: 12 },
    actionsDock: {
      marginTop: 0,
      paddingHorizontal: 16,
      paddingTop: 12,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: chrome.line,
      backgroundColor: chrome.card,
    },
    actionRow: { flexDirection: "row", gap: 10, flexWrap: "wrap" },
  });
}
