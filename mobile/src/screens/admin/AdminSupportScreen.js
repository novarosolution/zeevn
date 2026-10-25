import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { KeyboardAvoidingView, Platform, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";
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
import { useAdminConfirm } from "../../components/admin/AdminDialog";
import PremiumEmptyState from "../../components/ui/PremiumEmptyState";
import PremiumErrorBanner from "../../components/ui/PremiumErrorBanner";
import PremiumLoader from "../../components/ui/PremiumLoader";
import { useAuth } from "../../context/AuthContext";
import { useLiveSocket } from "../../context/LiveSocketContext";
import { useTheme } from "../../context/ThemeContext";
import { fetchAdminSupportThreads, replyAdminSupportThread, updateAdminSupportThreadStatus } from "../../services/adminService";
import { adminGatePanel, adminShellContent, useAdminChrome, useAdminCompactLayout } from "../../theme/adminLayout";
import { getAdminTone } from "../../theme/adminTones";
import { customerScrollFill } from "../../theme/screenLayout";
import { fonts, radius, spacing } from "../../theme/tokens";
import { formatShortDateTime, timeAgo } from "../../utils/adminFormat";
import { navigateCustomerRoute } from "../../navigation/customerNavigate";

const COPY = ADMIN_SCREEN_COPY.support;
const TABS = [
  { key: "waiting", label: "Needs a reply" },
  { key: "open", label: "Open" },
  { key: "closed", label: "Closed" },
];

function contactOf(user) {
  return String(user?.email || "").trim() || String(user?.phone || "").trim() || "—";
}

function isWaiting(thread) {
  return Boolean(thread?.waiting);
}

function matchesTab(thread, tab) {
  if (tab === "waiting") return isWaiting(thread);
  if (tab === "open") return thread.status === "open";
  if (tab === "closed") return thread.status === "closed";
  return true;
}

export default function AdminSupportScreen({ navigation, route }) {
  const { user } = useAuth();
  const { colors: c, shadowPremium, isDark } = useTheme();
  const chrome = useAdminChrome();
  const compact = useAdminCompactLayout();
  const insets = useSafeAreaInsets();
  const { confirm, dialog } = useAdminConfirm();
  const { on: onLiveEvent } = useLiveSocket();
  const isAdmin = Boolean(user?.isAdmin);
  const styles = useMemo(() => createStyles(chrome, c, shadowPremium, compact), [chrome, c, shadowPremium, compact]);

  const [threads, setThreads] = useState([]);
  const [tab, setTab] = useState("waiting");
  const [selectedId, setSelectedId] = useState(String(route?.params?.threadId || ""));
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const listRef = useRef(null);

  const load = useCallback(async ({ silent = false } = {}) => {
    if (!silent) setLoading(true);
    try {
      const data = await fetchAdminSupportThreads(null);
      setThreads(Array.isArray(data) ? data : []);
      setError("");
    } catch (err) {
      setError(err.message || "Unable to load support threads.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAdmin) load();
  }, [isAdmin, load]);

  useEffect(() => {
    if (route?.params?.threadId) setSelectedId(String(route.params.threadId));
  }, [route?.params?.threadId]);

  useEffect(() => {
    if (!isAdmin) return undefined;
    return onLiveEvent("support:thread", () => {
      load({ silent: true });
    });
  }, [isAdmin, onLiveEvent, load]);

  const onPull = async () => {
    setRefreshing(true);
    try {
      await load({ silent: true });
    } finally {
      setRefreshing(false);
    }
  };

  const counts = useMemo(
    () => ({
      waiting: threads.filter(isWaiting).length,
      open: threads.filter((row) => row.status === "open").length,
      closed: threads.filter((row) => row.status === "closed").length,
    }),
    [threads]
  );

  const visible = useMemo(() => threads.filter((row) => matchesTab(row, tab)), [threads, tab]);
  const selected = useMemo(
    () => threads.find((row) => String(row._id) === String(selectedId)) || null,
    [threads, selectedId]
  );

  useEffect(() => {
    setDraft("");
    setError("");
  }, [selectedId]);

  useEffect(() => {
    if (!selected || !listRef.current) return;
    const timer = setTimeout(() => listRef.current?.scrollToEnd?.({ animated: true }), 40);
    return () => clearTimeout(timer);
  }, [selected?._id, selected?.messages?.length]);

  const send = async () => {
    const text = draft.trim();
    if (!text || !selected || sending) return;
    setSending(true);
    setError("");
    try {
      const updated = await replyAdminSupportThread(null, selected._id, { message: text });
      setDraft("");
      setThreads((list) => {
        const next = list.map((row) => (String(row._id) === String(updated._id) ? updated : row));
        return next.sort((a, b) => new Date(b.lastMessageAt || 0) - new Date(a.lastMessageAt || 0));
      });
    } catch (err) {
      setError(err.message || "Couldn't send that reply.");
    } finally {
      setSending(false);
    }
  };

  const closeThread = async () => {
    if (!selected) return;
    const ok = await confirm({
      title: COPY.closeAsk,
      confirmLabel: "Close",
    });
    if (!ok) return;
    try {
      const updated = await updateAdminSupportThreadStatus(null, selected._id, "closed");
      setThreads((list) => list.map((row) => (String(row._id) === String(updated._id) ? updated : row)));
    } catch (err) {
      setError(err.message || "Couldn't close this conversation.");
    }
  };

  const reopenThread = async () => {
    if (!selected) return;
    try {
      const updated = await updateAdminSupportThreadStatus(null, selected._id, "open");
      setThreads((list) => list.map((row) => (String(row._id) === String(updated._id) ? updated : row)));
    } catch (err) {
      setError(err.message || "Couldn't reopen this conversation.");
    }
  };

  const openCustomer = (thread) => {
    const id = thread?.user?._id;
    if (id) navigation.navigate("AdminCustomers", { userId: String(id) });
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

  const tabs = TABS.map((item) => ({
    ...item,
    count: counts[item.key],
    tone: item.key === "waiting" ? "gold" : undefined,
  }));

  const renderListRow = (thread) => {
    const waiting = isWaiting(thread);
    const warn = getAdminTone("gold", isDark);
    return (
      <Pressable
        key={String(thread._id)}
        onPress={() => setSelectedId(String(thread._id))}
        style={({ pressed }) => [
          styles.listRow,
          waiting && { backgroundColor: warn.bg, borderColor: warn.border },
          String(thread._id) === String(selectedId) && styles.listRowOn,
          pressed && styles.pressed,
        ]}
        accessibilityRole="button"
        accessibilityLabel={`Open thread with ${thread.user?.name || "customer"}`}
      >
        <View style={styles.listTop}>
          <Text style={styles.listName} numberOfLines={1}>
            {thread.user?.name || "Customer"}
          </Text>
          <AdminBadge label={thread.status === "closed" ? "Closed" : "Open"} tone={thread.status === "closed" ? "neutral" : waiting ? "gold" : "green"} size="sm" />
        </View>
        <Text style={styles.listMeta} numberOfLines={1}>
          {contactOf(thread.user)}
        </Text>
        <Text style={styles.listPreview} numberOfLines={1}>
          {thread.lastMessage || "—"}
        </Text>
        <Text style={styles.listWhen}>{timeAgo(thread.lastMessageAt)}</Text>
      </Pressable>
    );
  };

  const listPanel = (
    <View style={styles.listCol}>
      <AdminFilterTabs
        items={tabs}
        value={tab}
        onChange={(key) => {
          setTab(key);
          if (compact) setSelectedId("");
        }}
      />
      {loading ? <PremiumLoader size="sm" caption="Loading threads…" /> : null}
      {!loading && threads.length === 0 ? <PremiumEmptyState iconName="chatbubbles-outline" title={COPY.empty} compact /> : null}
      {!loading && threads.length > 0 && visible.length === 0 ? <PremiumEmptyState iconName="chatbubbles-outline" title={COPY.emptyTab} compact /> : null}
      {!loading && visible.length > 0 ? (
        compact ? (
          <View style={styles.list}>{visible.map(renderListRow)}</View>
        ) : (
          <ScrollView style={styles.listScroll} contentContainerStyle={styles.list} keyboardShouldPersistTaps="handled">
            {visible.map(renderListRow)}
          </ScrollView>
        )
      ) : null}
    </View>
  );

  const canSend = Boolean(draft.trim()) && !sending && Boolean(selected);
  const threadPanel = selected ? (
    <View style={[styles.threadCol, compact && styles.threadColPhone]}>
      <View style={styles.threadHead}>
        <Pressable onPress={() => openCustomer(selected)} accessibilityRole="button" accessibilityLabel={`Open ${selected.user?.name || "customer"}`}>
          <Text style={styles.threadName}>{selected.user?.name || "Customer"}</Text>
          <Text style={styles.listMeta}>{contactOf(selected.user)}</Text>
        </Pressable>
        <View style={styles.threadActions}>
          <AdminBadge label={selected.status === "closed" ? "Closed" : "Open"} tone={selected.status === "closed" ? "neutral" : isWaiting(selected) ? "gold" : "green"} size="sm" />
          {selected.user?.phone ? (
            <AdminButton
              label="Bill at counter"
              size="sm"
              variant="soft"
              icon="storefront-outline"
              onPress={() => navigation.navigate("AdminCounter", { customer: selected.user })}
            />
          ) : null}
          {selected.status === "closed" ? (
            <AdminButton label="Reopen" size="sm" variant="soft" onPress={reopenThread} />
          ) : (
            <AdminButton label="Close" size="sm" variant="ghost" onPress={closeThread} />
          )}
        </View>
      </View>

      <ScrollView
        ref={listRef}
        style={styles.messages}
        contentContainerStyle={styles.messagesInner}
        keyboardShouldPersistTaps="handled"
        refreshControl={Platform.OS === "web" ? undefined : <RefreshControl refreshing={refreshing} onRefresh={onPull} />}
      >
        {(selected.messages || []).map((item, index) => {
          const admin = item.senderRole === "admin";
          return (
            <View key={`${item.createdAt || index}-${index}`} style={[styles.bubbleWrap, admin ? styles.bubbleAdminWrap : styles.bubbleUserWrap]}>
              <View style={[styles.bubble, admin ? styles.bubbleAdmin : styles.bubbleUser]}>
                <Text style={styles.bubbleMeta}>
                  {item.senderName || (admin ? "Admin" : selected.user?.name || "Customer")} · {formatShortDateTime(item.createdAt)}
                </Text>
                <Text style={styles.bubbleText}>{item.message}</Text>
              </View>
            </View>
          );
        })}
      </ScrollView>

      <View style={[styles.composer, compact && { paddingBottom: Math.max(insets.bottom, 12) }]}>
        <AdminInput
          value={draft}
          onChangeText={setDraft}
          placeholder="Reply"
          multiline
          numberOfLines={3}
          maxLength={2000}
          autoCapitalize="sentences"
        />
        <AdminButton label={sending ? "Sending…" : "Send"} icon="send-outline" variant="primary" size="md" disabled={!canSend} loading={sending} onPress={send} />
      </View>
    </View>
  ) : (
    <View style={styles.threadEmpty}>
      <PremiumEmptyState iconName="chatbubbles-outline" title={COPY.selectThread} compact />
    </View>
  );

  return (
    <AdminScreenShell style={styles.screen}>
      <KeyboardAvoidingView style={customerScrollFill} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        {compact && selected ? (
          <KankregAdminShell
            navigation={navigation}
            route={route}
            title={COPY.title}
            subtitle={COPY.subtitle}
            headerRight={<AdminButton label="Threads" icon="arrow-back" variant="ghost" size="sm" onPress={() => setSelectedId("")} />}
          >
            <View style={styles.phoneThread}>
              <AdminAlerts error={error} onCloseError={() => setError("")} />
              {threadPanel}
            </View>
          </KankregAdminShell>
        ) : (
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
              headerRight={<AdminButton label="Refresh" icon="refresh-outline" variant="ghost" size="sm" onPress={() => load()} />}
            >
              <View style={[styles.panel, !compact && styles.panelSplit]}>
                <AdminAlerts error={error} onCloseError={() => setError("")} />
                {compact ? (
                  listPanel
                ) : (
                  <View style={styles.split}>
                    <View style={styles.left}>{listPanel}</View>
                    <View style={styles.right}>{threadPanel}</View>
                  </View>
                )}
              </View>
            </KankregAdminShell>
          </KankregScrollPage>
        )}
      </KeyboardAvoidingView>
      {dialog}
    </AdminScreenShell>
  );
}

function createStyles(chrome, c, shadowPremium, compact) {
  return StyleSheet.create({
    screen: { flex: 1, width: "100%", alignSelf: "center", maxWidth: "100%" },
    panel: { ...adminShellContent(), gap: spacing.sm },
    panelSplit: { flex: 1, minHeight: 0 },
    gatePanel: adminGatePanel(c, shadowPremium),
    gateCta: { marginTop: spacing.md, alignSelf: "flex-start" },
    split: {
      flexDirection: "row",
      alignItems: "stretch",
      gap: 16,
      flex: 1,
      minHeight: 0,
      ...Platform.select({ web: { height: "calc(100vh - 196px)" }, default: { minHeight: 560 } }),
    },
    left: { width: 360, flexShrink: 0, minHeight: 0, overflow: "hidden" },
    right: { flex: 1, minWidth: 0, minHeight: 0 },
    listCol: { gap: 12, flex: compact ? undefined : 1, minHeight: 0 },
    listScroll: { flex: 1, minHeight: 0 },
    list: {
      backgroundColor: chrome.card,
      borderRadius: radius.lg,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: chrome.line,
      overflow: "hidden",
    },
    listRow: {
      paddingHorizontal: 14,
      paddingVertical: 12,
      gap: 4,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: chrome.lineSoft,
      borderLeftWidth: 3,
      borderLeftColor: "transparent",
      ...Platform.select({ web: { cursor: "pointer" }, default: {} }),
    },
    listRowOn: { backgroundColor: chrome.paper, borderLeftColor: chrome.goldDeep },
    pressed: { opacity: 0.88 },
    listTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8 },
    listName: { flex: 1, fontSize: 14, color: chrome.ink, fontFamily: fonts.semibold },
    listMeta: { fontSize: 12, color: chrome.inkFaint, fontFamily: fonts.regular },
    listPreview: { fontSize: 13, color: chrome.inkSoft, fontFamily: fonts.regular },
    listWhen: { fontSize: 11.5, color: chrome.inkFaint, fontFamily: fonts.medium },
    threadCol: {
      flex: 1,
      minHeight: 520,
      backgroundColor: chrome.card,
      borderRadius: radius.lg,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: chrome.line,
      overflow: "hidden",
    },
    threadColPhone: { minHeight: 0, borderRadius: 0, borderWidth: 0, flex: 1 },
    phoneThread: { flex: 1, minHeight: 0, gap: 8 },
    threadHead: {
      paddingHorizontal: 16,
      paddingVertical: 12,
      gap: 8,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: chrome.line,
    },
    threadName: {
      fontSize: 16,
      color: chrome.ink,
      fontFamily: fonts.bold,
      ...Platform.select({ web: { cursor: "pointer" }, default: {} }),
    },
    threadActions: { flexDirection: "row", alignItems: "center", gap: 8, flexWrap: "wrap" },
    messages: { flex: 1, minHeight: compact ? 0 : 280 },
    messagesInner: { padding: 16, gap: 10 },
    bubbleWrap: { maxWidth: "86%" },
    bubbleUserWrap: { alignSelf: "flex-start" },
    bubbleAdminWrap: { alignSelf: "flex-end" },
    bubble: { padding: 10, borderRadius: 14, borderWidth: StyleSheet.hairlineWidth, gap: 4 },
    bubbleUser: { backgroundColor: chrome.paper, borderColor: chrome.line },
    bubbleAdmin: { backgroundColor: chrome.chipOnBg, borderColor: chrome.chipOnBorder },
    bubbleMeta: { fontSize: 11, color: chrome.inkFaint, fontFamily: fonts.medium },
    bubbleText: { fontSize: 13.5, lineHeight: 19, color: chrome.ink, fontFamily: fonts.regular },
    composer: {
      padding: 12,
      gap: 10,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: chrome.line,
      backgroundColor: chrome.card,
    },
    threadEmpty: {
      flex: 1,
      minHeight: 520,
      justifyContent: "center",
      backgroundColor: chrome.card,
      borderRadius: radius.lg,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: chrome.line,
    },
  });
}
