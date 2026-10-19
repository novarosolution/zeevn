import React, { useCallback, useEffect, useMemo, useState } from "react";
import { ADMIN_GATE, ADMIN_SCREEN_COPY } from "../../content/adminContent";
import { KeyboardAvoidingView, Platform, StyleSheet, Text, View } from "react-native";
import KankregScrollPage from "../../components/kankreg/KankregScrollPage";
import AdminScreenShell from "../../components/admin/AdminScreenShell";
import KankregAdminShell from "../../components/kankreg/KankregAdminShell";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";
import {
  fetchAdminSupportThreads,
  replyAdminSupportThread,
  updateAdminSupportThreadStatus} from "../../services/adminService";
import { adminGatePanel, adminShellContent, adminTwoColAside, adminTwoColMain, adminTwoColStyle, useAdminCompactLayout } from "../../theme/adminLayout";
import AdminPanel from "../../components/admin/AdminPanel";
import AdminAlerts from "../../components/admin/AdminAlerts";
import AdminStatusPill from "../../components/admin/AdminStatusPill";
import SectionReveal from "../../components/motion/SectionReveal";
import { customerScrollFill } from "../../theme/screenLayout";
import { fonts, layout, radius, spacing } from "../../theme/tokens";
import PremiumLoader from "../../components/ui/PremiumLoader";
import PremiumEmptyState from "../../components/ui/PremiumEmptyState";
import PremiumErrorBanner from "../../components/ui/PremiumErrorBanner";
import PremiumInput from "../../components/ui/PremiumInput";
import PremiumButton from "../../components/ui/PremiumButton";
import PremiumCard from "../../components/ui/PremiumCard";
import { navigateCustomerRoute } from "../../navigation/customerNavigate";

export default function AdminSupportScreen({ navigation, route }) {
  const { colors: c, shadowPremium } = useTheme();
  const compact = useAdminCompactLayout();
  const styles = useMemo(() => createAdminSupportStyles(c, shadowPremium), [c, shadowPremium]);
    const { user, token } = useAuth();
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [threads, setThreads] = useState([]);
  const [selectedThreadId, setSelectedThreadId] = useState("");
  const [message, setMessage] = useState("");

  const loadThreads = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const data = await fetchAdminSupportThreads(token);
      setThreads(Array.isArray(data) ? data : []);
      if (!selectedThreadId && Array.isArray(data) && data.length > 0) {
        setSelectedThreadId(data[0]._id);
      }
    } catch (err) {
      setError(err.message || "Unable to load support threads.");
    } finally {
      setLoading(false);
    }
  }, [token, selectedThreadId]);

  useEffect(() => {
    if (!user?.isAdmin) return;
    loadThreads();
  }, [user, loadThreads]);

  const selectedThread = useMemo(
    () => threads.find((item) => item._id === selectedThreadId) || null,
    [threads, selectedThreadId]
  );

  const handleReply = async () => {
    const text = String(message || "").trim();
    if (!text || !selectedThreadId) return;
    try {
      setSending(true);
      setError("");
      await replyAdminSupportThread(token, selectedThreadId, { message: text });
      setMessage("");
      await loadThreads();
    } catch (err) {
      setError(err.message || "Unable to send reply.");
    } finally {
      setSending(false);
    }
  };

  const handleToggleStatus = async () => {
    if (!selectedThread) return;
    try {
      setError("");
      const nextStatus = selectedThread.status === "closed" ? "open" : "closed";
      await updateAdminSupportThreadStatus(token, selectedThread._id, nextStatus);
      await loadThreads();
    } catch (err) {
      setError(err.message || "Unable to update ticket status.");
    }
  };

  if (user && !user.isAdmin) {
    return (
      <AdminScreenShell style={styles.screen}>
        <KankregScrollPage
        scrollVariant="inner"
        showFooter={false}
          style={customerScrollFill}
          showsVerticalScrollIndicator={false}
        >
          <SectionReveal delay={40} preset="fade-up">
            <View style={styles.gatePanel}>
              <PremiumErrorBanner
                severity="warning"
                title={ADMIN_GATE.title}
                message="Sign in with an admin account to view support."
              />
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
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <KankregAdminShell
          navigation={navigation}
          route={route}
          title={ADMIN_SCREEN_COPY.support.title}
          subtitle={ADMIN_SCREEN_COPY.support.subtitle}
          headerRight={
            <PremiumButton label="Refresh" iconLeft="refresh-outline" variant="secondary" size="sm" onPress={loadThreads} />
          }
        >
        <AdminAlerts error={error} onCloseError={() => setError("")} />

        {loading ? (
          <SectionReveal preset="fade-up" delay={40}>
          <View style={styles.panel}>
            <PremiumLoader size="sm" caption="Loading conversations…" />
          </View>
          </SectionReveal>
        ) : (
          <View style={adminTwoColStyle(compact)}>
            <View style={adminTwoColMain(compact)}>
            <SectionReveal preset="fade-up" delay={40}>
            <AdminPanel
              title="Conversations"
              icon="chatbubbles-outline"
              meta={`${(threads || []).length} threads`}
              description="Select a thread to read and reply on the right."
            >
              {(threads || []).length === 0 ? (
                <PremiumEmptyState
                  iconName="chatbubbles-outline"
                  title={ADMIN_SCREEN_COPY.support.empty}
                  description="Customer threads will appear here when they reach out."
                  compact
                />
              ) : (
                (threads || []).map((thread) => (
                  <PremiumCard
                    key={thread._id}
                    padding="md"
                    interactive
                    onPress={() => setSelectedThreadId(thread._id)}
                    goldAccent={selectedThreadId === thread._id}
                    style={styles.threadCard}
                    accessibilityLabel={`Open conversation with ${thread.user?.name || "user"}`}
                  >
                    <Text style={[styles.threadTitle, { color: c.textPrimary }]}>{thread.user?.name || "User"}</Text>
                    <Text style={[styles.threadMeta, { color: c.textSecondary }]}>{thread.user?.email || "N/A"}</Text>
                    <AdminStatusPill
                      label={thread.status === "closed" ? "Closed" : "Open"}
                      tone={thread.status === "closed" ? "cancel" : "ok"}
                    />
                  </PremiumCard>
                ))
              )}
            </AdminPanel>
            </SectionReveal>
            </View>
            <View style={adminTwoColAside(compact)}>
            <SectionReveal preset="fade-up" delay={100}>
            <AdminPanel
              title="Thread details"
              icon="mail-open-outline"
              description="Reply as admin — customers see this in their Support inbox."
              action={selectedThread ? (selectedThread.status === "closed" ? "Mark open" : "Mark closed") : undefined}
              onAction={selectedThread ? handleToggleStatus : undefined}
            >
              <View style={styles.rowBetween}>
                {selectedThread ? (
                  <PremiumButton
                    label={`Mark ${selectedThread.status === "closed" ? "Open" : "Closed"}`}
                    variant="secondary"
                    size="sm"
                    onPress={handleToggleStatus}
                  />
                ) : null}
              </View>
              {!selectedThread ? (
                <PremiumEmptyState
                  iconName="hand-left-outline"
                  title={ADMIN_SCREEN_COPY.support.selectThread}
                  description="Choose a thread from the list to read and reply."
                  compact
                />
              ) : (
                <>
                  <Text style={styles.threadMeta}>
                    User: {selectedThread.user?.name || "User"} ({selectedThread.user?.email || "N/A"})
                  </Text>
                  {(selectedThread.messages || []).map((item, index) => (
                    <View
                      key={`${index}-${item.createdAt || ""}`}
                      style={[
                        styles.messageBubble,
                        item.senderRole === "admin" ? styles.adminBubble : styles.userBubble,
                      ]}
                    >
                      <Text style={styles.messageAuthor}>
                        {item.senderRole === "admin" ? "Admin" : selectedThread.user?.name || "User"} •{" "}
                        {item.createdAt ? new Date(item.createdAt).toLocaleString() : ""}
                      </Text>
                      <Text style={styles.messageText}>{item.message}</Text>
                    </View>
                  ))}
                  <View style={styles.replyInputWrap}>
                    <PremiumInput
                      label="Reply"
                      value={message}
                      onChangeText={setMessage}
                      placeholder="Type your message…"
                      multiline
                      numberOfLines={3}
                      iconLeft="chatbubble-ellipses-outline"
                    />
                  </View>
                  <PremiumButton
                    label={sending ? "Sending..." : "Send Reply"}
                    iconLeft="send-outline"
                    variant="primary"
                    size="md"
                    onPress={handleReply}
                    disabled={sending}
                    loading={sending}
                    fullWidth
                    style={styles.sendBtnMargin}
                  />
                </>
              )}
            </AdminPanel>
            </SectionReveal>
            </View>
          </View>
        )}
        </KankregAdminShell>
</KankregScrollPage>
      </KeyboardAvoidingView>
    </AdminScreenShell>
  );
}

function createAdminSupportStyles(c, shadowPremium) {
  return StyleSheet.create({
    screen: {
      flex: 1,
      width: "100%",
      alignSelf: "center",
      maxWidth: "100%"},
    panel: adminShellContent(),
    gatePanel: adminGatePanel(c, shadowPremium),
    gateCta: {
      marginTop: spacing.md,
      alignSelf: "flex-start"},
    sectionTitle: {
      color: c.textPrimary,
      fontSize: 15,
      fontWeight: "800",
      marginBottom: spacing.xs},
    threadCard: {
      marginBottom: spacing.sm,
      borderRadius: 14,
    },
    threadTitle: {
      fontSize: 14,
      fontWeight: "700",
      fontFamily: fonts.semibold,
    },
    threadMeta: {
      marginTop: 3,
      fontSize: 12,
      lineHeight: 16,
    },
    rowBetween: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: spacing.sm,
      marginBottom: spacing.sm,
    },
    messageBubble: {
      borderWidth: 1,
      borderRadius: 14,
      padding: spacing.sm + 2,
      marginBottom: spacing.sm,
    },
    adminBubble: {
      borderColor: c.primaryBorder,
      backgroundColor: c.primarySoft,
      marginLeft: spacing.md,
    },
    userBubble: {
      borderColor: c.border,
      backgroundColor: c.surfaceMuted,
      marginRight: spacing.md,
    },
    messageAuthor: {
      color: c.textSecondary,
      fontSize: 10,
      fontWeight: "700",
      marginBottom: 4,
      letterSpacing: 0.2,
      textTransform: "uppercase",
    },
    messageText: {
      color: c.textPrimary,
      fontSize: 12,
      lineHeight: 18},
    bannerSpacer: {
      marginBottom: spacing.sm},
    replyInputWrap: {
      marginTop: spacing.sm},
    sendBtnMargin: {
      marginTop: spacing.sm}});
}
