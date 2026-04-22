import React, { useCallback, useEffect, useMemo, useState } from "react";
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
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import AppFooter from "../components/AppFooter";
import BottomNavBar from "../components/BottomNavBar";
import AuthGateShell from "../components/AuthGateShell";
import CustomerScreenShell from "../components/CustomerScreenShell";
import ScreenPageHeader from "../components/ScreenPageHeader";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { fetchMySupportThread, sendMySupportMessage } from "../services/userService";
import { customerPageScrollBase, customerPanel, customerScrollFill } from "../theme/screenLayout";
import { SUPPORT_SCREEN } from "../content/appContent";
import { ALCHEMY } from "../theme/customerAlchemy";
import { fonts, radius, spacing, typography } from "../theme/tokens";

export default function SupportScreen({ navigation }) {
  const { colors: c, shadowPremium, isDark } = useTheme();
  const styles = useMemo(() => createSupportStyles(c, shadowPremium, isDark), [c, shadowPremium, isDark]);
  const insets = useSafeAreaInsets();
  const { isAuthenticated, token, isAuthLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [thread, setThread] = useState(null);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (isAuthLoading) return;
    if (!isAuthenticated) {
      navigation.navigate("Login");
    }
  }, [isAuthLoading, isAuthenticated, navigation]);

  const loadThread = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const data = await fetchMySupportThread(token);
      setThread(data || null);
    } catch (err) {
      setError(err.message || "Unable to load support chat.");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (isAuthLoading || !isAuthenticated) return;
    loadThread();
  }, [isAuthLoading, isAuthenticated, loadThread]);

  const handleSend = async () => {
    const text = String(message || "").trim();
    if (!text) return;
    try {
      setSending(true);
      setError("");
      const updated = await sendMySupportMessage(token, text);
      setThread(updated || null);
      setMessage("");
    } catch (err) {
      setError(err.message || "Unable to send message.");
    } finally {
      setSending(false);
    }
  };

  if (isAuthLoading || !isAuthenticated) {
    return <AuthGateShell />;
  }

  return (
    <CustomerScreenShell style={styles.screen}>
      <ScrollView
        style={customerScrollFill}
        contentContainerStyle={[
          customerPageScrollBase,
          { paddingTop: Math.max(insets.top, Platform.OS === "web" ? spacing.md : spacing.sm) },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <ScreenPageHeader navigation={navigation} title="Support" subtitle={SUPPORT_SCREEN.pageSubtitle} />
        <View style={styles.panel}>
          <View style={styles.headerRow}>
            <View style={styles.titleRow}>
              <View style={styles.titleIconWrap}>
                <Ionicons name="headset-outline" size={22} color={c.secondary} />
              </View>
              <Text style={styles.title}>{SUPPORT_SCREEN.liveChatTitle}</Text>
            </View>
            <TouchableOpacity style={styles.refreshBtn} onPress={loadThread}>
              <Ionicons name="refresh" size={16} color={c.secondary} />
              <Text style={styles.refreshBtnText}>Refresh</Text>
            </TouchableOpacity>
          </View>
          {error ? <Text style={styles.errorText}>{error}</Text> : null}
          {thread ? (
            <Text style={styles.metaText}>
              Ticket status: {thread.status || "open"} • Last update:{" "}
              {thread.lastMessageAt ? new Date(thread.lastMessageAt).toLocaleString() : "N/A"}
            </Text>
          ) : null}
        </View>
        {loading ? (
          <View style={styles.loaderWrap}>
            <ActivityIndicator color={c.primary} />
          </View>
        ) : (
          <View style={styles.panel}>
            {(thread?.messages || []).length === 0 ? (
              <Text style={styles.emptyText}>No messages yet. Start the conversation.</Text>
            ) : (
              (thread?.messages || []).map((item, index) => (
                <View
                  key={`${index}-${item.createdAt || ""}`}
                  style={[styles.messageBubble, item.senderRole === "admin" ? styles.adminBubble : styles.userBubble]}
                >
                  <Text style={styles.messageAuthor}>
                    {item.senderRole === "admin" ? "Admin" : "You"} •{" "}
                    {item.createdAt ? new Date(item.createdAt).toLocaleString() : ""}
                  </Text>
                  <Text style={styles.messageText}>{item.message}</Text>
                </View>
              ))
            )}
            <TextInput
              style={[styles.input, { fontFamily: fonts.regular }]}
              placeholder="Type your message..."
              placeholderTextColor={c.textMuted}
              value={message}
              onChangeText={setMessage}
              multiline
            />
            <TouchableOpacity style={styles.sendBtn} onPress={handleSend} disabled={sending}>
              <Ionicons name="paper-plane" size={16} color={c.onPrimary} />
              <Text style={styles.sendBtnText}>{sending ? "Sending…" : "Send message"}</Text>
            </TouchableOpacity>
          </View>
        )}
        <AppFooter />
      </ScrollView>
      <BottomNavBar />
    </CustomerScreenShell>
  );
}

function createSupportStyles(c, shadowPremium, isDark) {
  return StyleSheet.create({
  screen: {
    flex: 1,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flex: 1,
  },
  titleIconWrap: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    backgroundColor: c.primarySoft,
    borderWidth: 1,
    borderColor: c.primaryBorder,
    alignItems: "center",
    justifyContent: "center",
  },
  panel: {
    ...customerPanel(c, shadowPremium),
    marginBottom: spacing.md,
    overflow: "hidden",
  },
  loaderWrap: {
    paddingVertical: spacing.xl,
    alignItems: "center",
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.sm,
  },
  title: {
    color: c.textPrimary,
    fontSize: typography.h3,
    fontFamily: fonts.extrabold,
  },
  metaText: {
    marginTop: spacing.xs,
    color: c.textSecondary,
    fontSize: typography.overline + 1,
    fontFamily: fonts.bold,
  },
  refreshBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    borderWidth: 1,
    borderColor: c.primaryBorder,
    backgroundColor: c.primarySoft,
    borderRadius: radius.md,
    paddingHorizontal: spacing.sm,
    paddingVertical: 8,
  },
  refreshBtnText: {
    color: c.primary,
    fontSize: typography.caption,
    fontFamily: fonts.bold,
  },
  messageBubble: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: radius.lg,
    padding: spacing.sm,
    marginBottom: spacing.xs,
  },
  adminBubble: {
    borderColor: c.primaryBorder,
    backgroundColor: c.primarySoft,
  },
  userBubble: {
    borderColor: isDark ? c.border : ALCHEMY.pillInactive,
    backgroundColor: isDark ? c.surfaceMuted : ALCHEMY.cardBg,
  },
  messageAuthor: {
    color: c.textSecondary,
    fontSize: typography.overline,
    fontFamily: fonts.bold,
    marginBottom: 2,
  },
  messageText: {
    color: c.textPrimary,
    fontSize: typography.caption,
    fontFamily: fonts.regular,
    lineHeight: 18,
  },
  input: {
    marginTop: spacing.sm,
    borderWidth: 1,
    borderColor: c.border,
    borderRadius: radius.lg,
    backgroundColor: c.surface,
    color: c.textPrimary,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    minHeight: 72,
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
    paddingVertical: 13,
    paddingHorizontal: spacing.md,
  },
  sendBtnText: {
    color: c.onPrimary,
    fontSize: typography.caption,
    fontFamily: fonts.bold,
  },
  emptyText: {
    color: c.textSecondary,
    fontSize: typography.caption,
    fontFamily: fonts.regular,
    textAlign: "center",
    paddingVertical: spacing.md,
  },
  errorText: {
    marginTop: spacing.xs,
    color: c.danger,
    fontSize: typography.caption,
    fontFamily: fonts.bold,
  },
  });
}
