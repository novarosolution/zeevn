import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import AppFooter from "../../components/AppFooter";
import CustomerScreenShell from "../../components/CustomerScreenShell";
import AdminBackLink from "../../components/admin/AdminBackLink";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";
import {
  fetchAdminSupportThreads,
  replyAdminSupportThread,
  updateAdminSupportThreadStatus,
} from "../../services/adminService";
import { adminPanel } from "../../theme/adminLayout";
import { customerScrollFill } from "../../theme/screenLayout";
import { fonts, layout, radius, spacing, typography } from "../../theme/tokens";

export default function AdminSupportScreen({ navigation }) {
  const { colors: c, shadowPremium } = useTheme();
  const styles = useMemo(() => createAdminSupportStyles(c, shadowPremium), [c, shadowPremium]);
  const { user, token } = useAuth();
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [threads, setThreads] = useState([]);
  const [selectedThreadId, setSelectedThreadId] = useState("");
  const [message, setMessage] = useState("");

  async function loadThreads() {
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
  }

  useEffect(() => {
    if (!user?.isAdmin) return;
    loadThreads();
  }, [user?.isAdmin]);

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
      <CustomerScreenShell style={styles.screen}>
        <ScrollView style={customerScrollFill} contentContainerStyle={styles.scrollContent}>
          <View style={styles.panel}>
            <Text style={styles.errorText}>Admin access required.</Text>
          </View>
        </ScrollView>
      </CustomerScreenShell>
    );
  }

  return (
    <CustomerScreenShell style={styles.screen}>
      <ScrollView style={customerScrollFill} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.panel}>
          <AdminBackLink navigation={navigation} />
          <View style={styles.headerRow}>
            <Text style={styles.title}>Support Inbox</Text>
            <TouchableOpacity style={styles.refreshBtn} onPress={loadThreads}>
              <Ionicons name="refresh-outline" size={14} color={c.primary} />
              <Text style={styles.refreshBtnText}>Refresh</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.subtitle}>Simple support chat between users and admin.</Text>
          {error ? <Text style={styles.errorText}>{error}</Text> : null}
        </View>

        {loading ? (
          <View style={styles.panel}>
            <ActivityIndicator color={c.primary} />
          </View>
        ) : (
          <>
            <View style={styles.panel}>
              <Text style={styles.sectionTitle}>Conversations</Text>
              {(threads || []).length === 0 ? (
                <Text style={styles.emptyText}>No support messages yet.</Text>
              ) : (
                (threads || []).map((thread) => (
                  <TouchableOpacity
                    key={thread._id}
                    style={[
                      styles.threadItem,
                      selectedThreadId === thread._id ? styles.threadItemActive : null,
                    ]}
                    onPress={() => setSelectedThreadId(thread._id)}
                  >
                    <Text style={styles.threadTitle}>{thread.user?.name || "User"}</Text>
                    <Text style={styles.threadMeta}>{thread.user?.email || "N/A"}</Text>
                    <Text style={styles.threadMeta}>
                      Status: {thread.status} • Messages: {(thread.messages || []).length}
                    </Text>
                  </TouchableOpacity>
                ))
              )}
            </View>
            <View style={styles.panel}>
              <View style={styles.rowBetween}>
                <Text style={styles.sectionTitle}>Thread Details</Text>
                {selectedThread ? (
                  <TouchableOpacity style={styles.statusBtn} onPress={handleToggleStatus}>
                    <Text style={styles.statusBtnText}>
                      Mark {selectedThread.status === "closed" ? "Open" : "Closed"}
                    </Text>
                  </TouchableOpacity>
                ) : null}
              </View>
              {!selectedThread ? (
                <Text style={styles.emptyText}>Select a conversation.</Text>
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
                  <TextInput
                    style={styles.input}
                    placeholder="Type reply..."
                    placeholderTextColor={c.textMuted}
                    value={message}
                    onChangeText={setMessage}
                    multiline
                  />
                  <TouchableOpacity style={styles.sendBtn} onPress={handleReply} disabled={sending}>
                    <Ionicons name="send-outline" size={14} color={c.onPrimary} />
                    <Text style={styles.sendBtnText}>{sending ? "Sending..." : "Send Reply"}</Text>
                  </TouchableOpacity>
                </>
              )}
            </View>
          </>
        )}
        <AppFooter />
      </ScrollView>
    </CustomerScreenShell>
  );
}

function createAdminSupportStyles(c, shadowPremium) {
  return StyleSheet.create({
    screen: {
      flex: 1,
      width: "100%",
      alignSelf: "center",
      maxWidth: Platform.select({ web: layout.maxContentWidth, default: "100%" }),
    },
    scrollContent: {
      padding: spacing.lg,
      paddingBottom: spacing.xxl,
    },
    panel: {
      ...adminPanel(c, shadowPremium),
      marginBottom: spacing.md,
    },
    headerRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: spacing.sm,
    },
    title: {
      color: c.textPrimary,
      fontSize: typography.h2,
      fontFamily: fonts.extrabold,
      letterSpacing: -0.35,
    },
    subtitle: {
      marginTop: spacing.xs,
      color: c.textSecondary,
      fontSize: 13,
    },
    refreshBtn: {
      flexDirection: "row",
      alignItems: "center",
      gap: 5,
      borderWidth: 1,
      borderColor: c.primaryBorder,
      backgroundColor: c.primarySoft,
      borderRadius: radius.pill,
      paddingHorizontal: spacing.sm,
      paddingVertical: 7,
    },
    refreshBtnText: {
      color: c.primary,
      fontSize: 12,
      fontWeight: "700",
    },
    sectionTitle: {
      color: c.textPrimary,
      fontSize: 15,
      fontWeight: "800",
      marginBottom: spacing.xs,
    },
    threadItem: {
      borderWidth: 1,
      borderColor: c.border,
      borderRadius: radius.md,
      backgroundColor: c.surfaceMuted,
      padding: spacing.sm,
      marginBottom: spacing.xs,
    },
    threadItemActive: {
      borderColor: c.primaryBorder,
      backgroundColor: c.primarySoft,
    },
    threadTitle: {
      color: c.textPrimary,
      fontSize: 13,
      fontWeight: "700",
    },
    threadMeta: {
      marginTop: 3,
      color: c.textSecondary,
      fontSize: 11,
    },
    rowBetween: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: spacing.sm,
      marginBottom: spacing.xs,
    },
    statusBtn: {
      borderWidth: 1,
      borderColor: c.border,
      borderRadius: radius.pill,
      backgroundColor: c.surfaceMuted,
      paddingHorizontal: spacing.md,
      paddingVertical: 7,
    },
    statusBtnText: {
      color: c.textPrimary,
      fontSize: 11,
      fontWeight: "700",
    },
    messageBubble: {
      borderWidth: 1,
      borderRadius: radius.md,
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
    input: {
      marginTop: spacing.sm,
      borderWidth: 1,
      borderColor: c.border,
      borderRadius: radius.md,
      backgroundColor: c.surface,
      color: c.textPrimary,
      paddingHorizontal: spacing.sm,
      paddingVertical: 10,
      minHeight: 64,
      textAlignVertical: "top",
    },
    sendBtn: {
      marginTop: spacing.sm,
      borderWidth: 1,
      borderColor: c.primary,
      borderRadius: radius.pill,
      backgroundColor: c.primary,
      alignItems: "center",
      justifyContent: "center",
      flexDirection: "row",
      gap: 7,
      paddingVertical: 10,
    },
    sendBtnText: {
      color: c.onPrimary,
      fontSize: 12,
      fontWeight: "700",
    },
    emptyText: {
      color: c.textSecondary,
      fontSize: 12,
      textAlign: "center",
      paddingVertical: spacing.md,
    },
    errorText: {
      color: c.danger,
      fontSize: 12,
      fontWeight: "700",
    },
  });
}
