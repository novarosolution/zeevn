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
import { useAdminConfirm } from "../../components/admin/AdminDialog";
import PremiumButton from "../../components/ui/PremiumButton";
import PremiumEmptyState from "../../components/ui/PremiumEmptyState";
import PremiumErrorBanner from "../../components/ui/PremiumErrorBanner";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";
import {
  fetchAdminRiderNotifications,
  fetchAdminRiders,
  sendAdminRiderNotification,
} from "../../services/adminService";
import { adminGatePanel, adminShellContent, useAdminChrome, useAdminCompactLayout } from "../../theme/adminLayout";
import { customerScrollFill } from "../../theme/screenLayout";
import { fonts, radius, spacing } from "../../theme/tokens";
import { formatShortDateTime } from "../../utils/adminFormat";
import { navigateCustomerRoute } from "../../navigation/customerNavigate";

const COPY = ADMIN_SCREEN_COPY.riderMessages;

export default function AdminRiderMessagesScreen({ navigation, route }) {
  const { user } = useAuth();
  const { colors: c, shadowPremium } = useTheme();
  const chrome = useAdminChrome();
  const compact = useAdminCompactLayout();
  const isAdmin = Boolean(user?.isAdmin);
  const styles = useMemo(() => createStyles(chrome, c, shadowPremium), [chrome, c, shadowPremium]);
  const { confirm, dialog } = useAdminConfirm();

  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [riders, setRiders] = useState(0);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      setError("");
      const [list, history] = await Promise.all([
        fetchAdminRiders().catch(() => []),
        fetchAdminRiderNotifications(),
      ]);
      setRiders(Array.isArray(list) ? list.length : 0);
      setItems(Array.isArray(history) ? history : []);
    } catch (err) {
      setError(err.message || "Couldn't load rider messages.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isAdmin) return;
    load();
  }, [isAdmin, load]);

  const onPull = async () => {
    setRefreshing(true);
    try {
      await load();
    } finally {
      setRefreshing(false);
    }
  };

  const canSend = riders > 0 && title.trim() && message.trim() && !sending;
  const handleSend = async () => {
    if (!canSend) return;
    const ok = await confirm({
      title: COPY.confirm.replace("{n}", String(riders)),
      confirmLabel: "Send",
    });
    if (!ok) return;
    setSending(true);
    try {
      await sendAdminRiderNotification(null, { title: title.trim(), message: message.trim() });
      setTitle("");
      setMessage("");
      await load();
    } catch (err) {
      setError(err.message || "Couldn't send this message.");
    } finally {
      setSending(false);
    }
  };

  if (user && !user.isAdmin) {
    return (
      <AdminScreenShell style={styles.screen}>
        <KankregScrollPage scrollVariant="inner" showFooter={false} style={customerScrollFill}>
          <SectionReveal delay={40} preset="fade-up">
            <View style={styles.gatePanel}>
              <PremiumErrorBanner severity="warning" title={ADMIN_GATE.title} message={ADMIN_GATE.message} />
              <PremiumButton
                label={ADMIN_GATE.backHome}
                variant="primary"
                onPress={() => navigateCustomerRoute(navigation, "Home")}
                style={styles.gateCta}
              />
            </View>
          </SectionReveal>
        </KankregScrollPage>
      </AdminScreenShell>
    );
  }

  return (
    <AdminScreenShell style={styles.screen}>
      <KeyboardAvoidingView style={customerScrollFill} behavior={Platform.OS === "ios" ? "padding" : "height"}>
        <KankregScrollPage
          scrollVariant="admin"
          showFooter={false}
          style={customerScrollFill}
          keyboardShouldPersistTaps="handled"
          refreshControl={
            Platform.OS === "web" ? undefined : (
              <RefreshControl refreshing={refreshing} onRefresh={onPull} tintColor={c.primary} colors={[c.primary]} />
            )
          }
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

              <View style={styles.form}>
                <AdminInput
                  label="Title"
                  value={title}
                  onChangeText={setTitle}
                  placeholder="What riders should see first"
                  maxLength={120}
                  icon="chatbubble-outline"
                />
                <AdminInput
                  label="Message"
                  value={message}
                  onChangeText={setMessage}
                  placeholder="One note for every rider"
                  maxLength={1000}
                  multiline
                  numberOfLines={5}
                  icon="document-text-outline"
                />
                {riders < 1 && !loading ? <Text style={styles.muted}>{COPY.noRiders}</Text> : null}
                <AdminButton
                  label={sending ? "Sending…" : riders ? `Send to ${riders} rider${riders === 1 ? "" : "s"}` : "Send"}
                  icon="send-outline"
                  variant="primary"
                  disabled={!canSend}
                  onPress={handleSend}
                />
              </View>

              <View style={styles.list}>
                {loading ? <Text style={styles.muted}>Loading…</Text> : null}
                {!loading && items.length === 0 ? (
                  <PremiumEmptyState iconName="chatbubble-ellipses-outline" title={COPY.empty} compact />
                ) : null}
                {items.map((row) => (
                  <View key={row._id} style={[styles.card, compact && styles.cardPhone]}>
                    <Text style={styles.title}>{row.title}</Text>
                    <Text style={styles.body}>{row.message}</Text>
                    <Text style={styles.muted}>
                      {row.createdBy?.name || "Admin"}
                      {row.createdAt ? ` · ${formatShortDateTime(row.createdAt)}` : ""}
                      {` · ${row.pushSent || 0} push${row.pushSent === 1 ? "" : "es"}`}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          </KankregAdminShell>
        </KankregScrollPage>
      </KeyboardAvoidingView>
      {dialog}
    </AdminScreenShell>
  );
}

function createStyles(chrome, c, shadowPremium) {
  return StyleSheet.create({
    screen: { flex: 1, width: "100%" },
    panel: { ...adminShellContent(), gap: spacing.md },
    gatePanel: adminGatePanel(c, shadowPremium),
    gateCta: { marginTop: spacing.md, alignSelf: "flex-start" },
    form: {
      gap: spacing.sm,
      padding: spacing.md,
      borderRadius: radius.lg,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: chrome.line,
      backgroundColor: chrome.card,
    },
    list: { gap: spacing.sm },
    card: {
      gap: 4,
      padding: spacing.md,
      borderRadius: radius.lg,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: chrome.line,
      backgroundColor: chrome.card,
    },
    cardPhone: { borderRadius: radius.lg },
    title: { color: chrome.ink, fontFamily: fonts.semibold, fontSize: 15 },
    body: { color: chrome.inkSoft, fontFamily: fonts.regular, fontSize: 13, lineHeight: 19 },
    muted: { color: chrome.inkFaint, fontFamily: fonts.medium, fontSize: 12 },
  });
}
