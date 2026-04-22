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
  fetchAdminNotifications,
  sendAdminBroadcastNotification,
} from "../../services/adminService";
import { adminPanel } from "../../theme/adminLayout";
import { customerScrollFill } from "../../theme/screenLayout";
import { fonts, layout, radius, spacing, typography } from "../../theme/tokens";

export default function AdminNotificationsScreen({ navigation }) {
  const { colors: c, shadowPremium } = useTheme();
  const styles = useMemo(() => createAdminNotificationsStyles(c, shadowPremium), [c, shadowPremium]);
  const { user, token } = useAuth();
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [items, setItems] = useState([]);

  async function loadNotifications() {
    try {
      setLoading(true);
      setError("");
      const data = await fetchAdminNotifications(token);
      setItems(data);
    } catch (err) {
      setError(err.message || "Unable to load notifications.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!user?.isAdmin) return;
    loadNotifications();
  }, [user?.isAdmin]);

  const handleSend = async () => {
    if (!title.trim() || !message.trim()) {
      setError("Title and message are required.");
      return;
    }
    try {
      setSending(true);
      setError("");
      setSuccess("");
      await sendAdminBroadcastNotification(token, {
        title: title.trim(),
        message: message.trim(),
      });
      setTitle("");
      setMessage("");
      setSuccess("Notification sent to all users.");
      await loadNotifications();
    } catch (err) {
      setError(err.message || "Unable to send notification.");
    } finally {
      setSending(false);
    }
  };

  if (user && !user.isAdmin) {
    return (
      <CustomerScreenShell style={styles.screen}>
        <View style={[styles.panel, { margin: spacing.lg }]}>
          <Text style={styles.title}>Admin Access Required</Text>
          <Text style={styles.subtitle}>This account does not have admin privileges.</Text>
          <TouchableOpacity style={styles.primaryBtn} onPress={() => navigation.navigate("Home")}>
            <Text style={styles.primaryBtnText}>Back to Home</Text>
          </TouchableOpacity>
        </View>
      </CustomerScreenShell>
    );
  }

  return (
    <CustomerScreenShell style={styles.screen}>
    <ScrollView style={customerScrollFill} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
      <View style={styles.panel}>
        <AdminBackLink navigation={navigation} />
        <Text style={styles.title}>Broadcast Notifications</Text>
        <Text style={styles.subtitle}>Send important updates to all users.</Text>
        {error ? <Text style={styles.errorText}>{error}</Text> : null}
        {success ? <Text style={styles.successText}>{success}</Text> : null}

        <TextInput
          style={styles.input}
          placeholder="Notification title"
          placeholderTextColor={c.textMuted}
          value={title}
          onChangeText={setTitle}
        />
        <TextInput
          style={[styles.input, styles.multiline]}
          placeholder="Write message for all users..."
          placeholderTextColor={c.textMuted}
          value={message}
          onChangeText={setMessage}
          multiline
        />

        <TouchableOpacity style={styles.primaryBtn} onPress={handleSend} disabled={sending}>
          <View style={styles.buttonContent}>
            <Ionicons name="megaphone-outline" size={16} color={c.onPrimary} />
            <Text style={styles.primaryBtnText}>{sending ? "Sending..." : "Send to All Users"}</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity style={styles.refreshBtn} onPress={loadNotifications} disabled={loading}>
          <Text style={styles.refreshBtnText}>{loading ? "Loading..." : "Refresh Notifications"}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.panel}>
        <Text style={styles.sectionTitle}>Sent Notifications</Text>
        {loading ? (
          <View style={styles.loaderWrap}>
            <ActivityIndicator color={c.primary} />
          </View>
        ) : items.length === 0 ? (
          <Text style={styles.emptyText}>No notifications sent yet.</Text>
        ) : (
          items.map((item) => (
            <View key={item._id} style={styles.itemCard}>
              <Text style={styles.itemTitle}>{item.title}</Text>
              <Text style={styles.itemMessage}>{item.message}</Text>
              <Text style={styles.itemMeta}>
                Sent: {new Date(item.createdAt).toLocaleString()}
              </Text>
            </View>
          ))
        )}
      </View>
      <AppFooter />
    </ScrollView>
    </CustomerScreenShell>
  );
}

function createAdminNotificationsStyles(c, shadowPremium) {
  return StyleSheet.create({
    screen: {
      flex: 1,
    },
    scrollContent: {
      padding: spacing.lg,
      width: "100%",
      alignSelf: "center",
      maxWidth: Platform.select({ web: layout.maxContentWidth, default: "100%" }),
      paddingBottom: spacing.xxl,
    },
    panel: {
      ...adminPanel(c, shadowPremium),
      marginBottom: spacing.md,
    },
    title: {
      color: c.textPrimary,
      fontSize: typography.h2,
      fontFamily: fonts.extrabold,
      letterSpacing: -0.35,
    },
    subtitle: {
      marginTop: spacing.xs,
      marginBottom: spacing.md,
      color: c.textSecondary,
      fontSize: typography.body,
    },
    sectionTitle: {
      color: c.textPrimary,
      fontSize: typography.h3,
      fontWeight: "700",
      marginBottom: spacing.sm,
    },
    input: {
      borderWidth: 1,
      borderColor: c.border,
      borderRadius: radius.md,
      backgroundColor: c.surfaceMuted,
      paddingHorizontal: spacing.md,
      paddingVertical: 11,
      marginBottom: spacing.sm,
      color: c.textPrimary,
    },
    multiline: {
      minHeight: 100,
      textAlignVertical: "top",
    },
    primaryBtn: {
      backgroundColor: c.primary,
      borderRadius: radius.pill,
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: 12,
    },
    primaryBtnText: {
      color: c.onPrimary,
      fontSize: typography.body,
      fontWeight: "700",
    },
    buttonContent: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
    },
    refreshBtn: {
      marginTop: spacing.sm,
      borderRadius: radius.pill,
      borderWidth: 1,
      borderColor: c.primaryBorder,
      backgroundColor: c.primarySoft,
      alignItems: "center",
      paddingVertical: 11,
    },
    refreshBtnText: {
      color: c.primary,
      fontSize: typography.bodySmall,
      fontWeight: "700",
    },
    itemCard: {
      borderWidth: 1,
      borderColor: c.border,
      borderRadius: radius.md,
      backgroundColor: c.surfaceMuted,
      padding: spacing.md,
      marginBottom: spacing.sm,
    },
    itemTitle: {
      color: c.textPrimary,
      fontSize: typography.body,
      fontWeight: "700",
    },
    itemMessage: {
      marginTop: 4,
      color: c.textSecondary,
      fontSize: typography.bodySmall,
      lineHeight: 18,
    },
    itemMeta: {
      marginTop: spacing.xs,
      color: c.textMuted,
      fontSize: typography.caption,
    },
    emptyText: {
      color: c.textSecondary,
      fontSize: typography.body,
    },
    loaderWrap: {
      paddingVertical: spacing.md,
    },
    errorText: {
      color: c.danger,
      fontWeight: "600",
      marginBottom: spacing.sm,
    },
    successText: {
      color: c.success,
      fontWeight: "600",
      marginBottom: spacing.sm,
    },
  });
}
