import React, { useCallback, useEffect, useMemo, useState } from "react";
import { KeyboardAvoidingView, Platform, StyleSheet, Text, View, useWindowDimensions } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "../../context/AuthContext";
import OpsAdminScreen from "../../components/ops/OpsAdminScreen";
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
import Loader from "../../components/ui/Loader";
import EmptyState from "../../components/ui/EmptyState";
import ErrorBanner from "../../components/ui/ErrorBanner";
import Input from "../../components/ui/Input";
import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";
import { APP_LOADING_UI } from "../../content/appContent";

export default function AdminSupportScreen({ navigation }) {
  const { width } = useWindowDimensions();
  const isWideWeb = Platform.OS === "web" && width >= 1120;
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

  return (
    <OpsAdminScreen navigation={navigation} activeRoute="AdminSupport" sectionTitle="Support inbox">
      {error ? (
        <View style={styles.bannerSpacer}>
          <ErrorBanner severity="error" message={error} onClose={() => setError("")} compact />
        </View>
      ) : null}

      {loading ? (
                    <View style={styles.panel}>
            <Loader size="sm" caption={APP_LOADING_UI.inline.admin} />
          </View>
                  ) : (
          <View style={isWideWeb ? styles.workspaceGrid : null}>
            <View style={isWideWeb ? styles.workspaceRail : null}>
                              <View style={styles.panel}>
                  <Text style={styles.sectionTitle}>Conversations</Text>
                  {(threads || []).length === 0 ? (
                    <EmptyState
                      iconName="chatbubbles-outline"
                      title="No support messages yet"
                      description="Customer threads will appear here."
                      compact
                    />
                  ) : (
                    (threads || []).map((thread) => (
                      <Card
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
                      </Card>
                    ))
                  )}
                </View>
                          </View>
            <View style={isWideWeb ? styles.workspaceMain : null}>
                              <View style={styles.panel}>
                  <View style={styles.rowBetween}>
                    <Text style={styles.sectionTitle}>Thread Details</Text>
                    {selectedThread ? (
                      <Button
                        label={`Mark ${selectedThread.status === "closed" ? "Open" : "Closed"}`}
                        variant="secondary"
                        size="sm"
                        onPress={handleToggleStatus}
                      />
                    ) : null}
                  </View>
                  {!selectedThread ? (
                    <EmptyState
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
                        <Input
                          label="Reply"
                          value={message}
                          onChangeText={setMessage}
                          placeholder="Type your message…"
                          multiline
                          numberOfLines={3}
                          iconLeft="chatbubble-ellipses-outline"
                        />
                      </View>
                      <Button
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
                          </View>
          </View>
        )}
    </OpsAdminScreen>
  );
}

function createAdminSupportStyles(c, shadowPremium) {
  return StyleSheet.create({
    screen: {
      flex: 1,
      width: "100%",
      alignSelf: "center",
      maxWidth: Platform.select({ web: layout.maxContentWidth + 96, default: "100%" }),
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
    workspaceGrid: {
      flexDirection: "row",
      alignItems: "flex-start",
      gap: spacing.md,
    },
    workspaceRail: {
      flex: 0.92,
      minWidth: 280,
    },
    workspaceMain: {
      flex: 1.4,
      minWidth: 0,
    },
  });
}
