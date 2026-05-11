import React, { useCallback, useEffect, useMemo, useState } from "react";
import { KeyboardAvoidingView, Platform, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import AppFooter from "../../components/AppFooter";
import CustomerScreenShell from "../../components/CustomerScreenShell";
import AdminBackLink from "../../components/admin/AdminBackLink";
import AdminPageHeading from "../../components/admin/AdminPageHeading";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";
import {
  fetchAdminSupportThreads,
  replyAdminSupportThread,
  updateAdminSupportThreadStatus,
} from "../../services/adminService";
import { adminPanel } from "../../theme/adminLayout";
import MotionScrollView from "../../components/motion/MotionScrollView";
import SectionReveal from "../../components/motion/SectionReveal";
import { adminInnerPageScrollContent, customerScrollFill } from "../../theme/screenLayout";
import { layout, radius, spacing } from "../../theme/tokens";
import PremiumLoader from "../../components/ui/PremiumLoader";
import PremiumEmptyState from "../../components/ui/PremiumEmptyState";
import PremiumErrorBanner from "../../components/ui/PremiumErrorBanner";
import PremiumInput from "../../components/ui/PremiumInput";
import PremiumButton from "../../components/ui/PremiumButton";
import PremiumCard from "../../components/ui/PremiumCard";

export default function AdminSupportScreen({ navigation }) {
  const { colors: c, shadowPremium } = useTheme();
  const styles = useMemo(() => createAdminSupportStyles(c, shadowPremium), [c, shadowPremium]);
  const insets = useSafeAreaInsets();
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
      <CustomerScreenShell style={styles.screen} variant="admin">
        <MotionScrollView
          style={customerScrollFill}
          contentContainerStyle={adminInnerPageScrollContent(insets)}
          showsVerticalScrollIndicator={false}
        >
          <SectionReveal delay={40} preset="fade-up">
            <View style={styles.panel}>
              <PremiumErrorBanner
                severity="warning"
                title="Admin access required"
                message="Sign in with an admin account to view support."
              />
              <PremiumButton
                label="Back to Home"
                variant="primary"
                onPress={() => navigation.navigate("Home")}
                style={styles.gateCta}
              />
            </View>
          </SectionReveal>
        </MotionScrollView>
      </CustomerScreenShell>
    );
  }

  return (
    <CustomerScreenShell style={styles.screen} variant="admin">
      <KeyboardAvoidingView style={customerScrollFill} behavior={Platform.OS === "ios" ? "padding" : "height"}>
      <MotionScrollView
        style={customerScrollFill}
        contentContainerStyle={adminInnerPageScrollContent(insets)}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <SectionReveal preset="fade-up" delay={0}>
        <View style={styles.panel}>
          <AdminBackLink navigation={navigation} />
          <AdminPageHeading
            title="Support Inbox"
            subtitle="Customer conversations and replies."
            right={
              <PremiumButton label="Refresh" iconLeft="refresh-outline" variant="secondary" size="sm" onPress={loadThreads} />
            }
          />
          {error ? (
            <View style={styles.bannerSpacer}>
              <PremiumErrorBanner severity="error" message={error} onClose={() => setError("")} compact />
            </View>
          ) : null}
        </View>
        </SectionReveal>

        {loading ? (
          <SectionReveal preset="fade-up" delay={40}>
          <View style={styles.panel}>
            <PremiumLoader size="sm" caption="Loading conversations…" />
          </View>
          </SectionReveal>
        ) : (
          <>
            <SectionReveal preset="fade-up" delay={40}>
            <View style={styles.panel}>
              <Text style={styles.sectionTitle}>Conversations</Text>
              {(threads || []).length === 0 ? (
                <PremiumEmptyState
                  iconName="chatbubbles-outline"
                  title="No support messages yet"
                  description="Customer threads will appear here."
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
                    <Text style={[styles.threadMeta, { color: c.textSecondary }]}>
                      Status: {thread.status} • Messages: {(thread.messages || []).length}
                    </Text>
                  </PremiumCard>
                ))
              )}
            </View>
            </SectionReveal>
            <SectionReveal preset="fade-up" delay={100}>
            <View style={styles.panel}>
              <View style={styles.rowBetween}>
                <Text style={styles.sectionTitle}>Thread Details</Text>
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
                  title="Select a conversation"
                  description="Choose a thread to read and reply."
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
            </View>
            </SectionReveal>
          </>
        )}
        <AppFooter />
      </MotionScrollView>
      </KeyboardAvoidingView>
    </CustomerScreenShell>
  );
}

function createAdminSupportStyles(c, shadowPremium) {
  return StyleSheet.create({
    screen: {
      flex: 1,
      width: "100%",
      alignSelf: "center",
      maxWidth: Platform.select({ web: layout.maxContentWidth + 72, default: "100%" }),
    },
    panel: {
      ...adminPanel(c, shadowPremium),
      marginBottom: spacing.md,
    },
    gateCta: {
      marginTop: spacing.md,
      alignSelf: "flex-start",
    },
    sectionTitle: {
      color: c.textPrimary,
      fontSize: 15,
      fontWeight: "800",
      marginBottom: spacing.xs,
    },
    threadCard: {
      marginBottom: spacing.xs,
    },
    threadTitle: {
      fontSize: 13,
      fontWeight: "700",
    },
    threadMeta: {
      marginTop: 3,
      fontSize: 11,
    },
    rowBetween: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: spacing.sm,
      marginBottom: spacing.xs,
    },
    messageBubble: {
      borderWidth: 1,
      borderRadius: radius.lg,
      padding: spacing.sm,
      marginBottom: spacing.xs,
    },
    adminBubble: {
      borderColor: c.primaryBorder,
      backgroundColor: c.primarySoft,
    },
    userBubble: {
      borderColor: c.border,
      backgroundColor: c.surfaceMuted,
    },
    messageAuthor: {
      color: c.textSecondary,
      fontSize: 10,
      fontWeight: "700",
      marginBottom: 2,
    },
    messageText: {
      color: c.textPrimary,
      fontSize: 12,
      lineHeight: 18,
    },
    bannerSpacer: {
      marginBottom: spacing.sm,
    },
    replyInputWrap: {
      marginTop: spacing.sm,
    },
    sendBtnMargin: {
      marginTop: spacing.sm,
    },
  });
}
