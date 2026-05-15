import React, { useCallback, useEffect, useMemo, useState } from "react";
import { KeyboardAvoidingView, Platform, StyleSheet, Text, View } from "react-native";
import AppFooter from "../../components/AppFooter";
import CustomerScreenShell from "../../components/CustomerScreenShell";
import AdminBackLink from "../../components/admin/AdminBackLink";
import AdminPageHeading from "../../components/admin/AdminPageHeading";
import { useAuth } from "../../context/AuthContext";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "../../context/ThemeContext";
import {
  fetchAdminNotifications,
  sendAdminBroadcastNotification,
} from "../../services/adminService";
import { adminPanel } from "../../theme/adminLayout";
import { adminInnerPageScrollContent, customerScrollFill } from "../../theme/screenLayout";
import { spacing, typography } from "../../theme/tokens";
import PremiumLoader from "../../components/ui/PremiumLoader";
import PremiumEmptyState from "../../components/ui/PremiumEmptyState";
import PremiumErrorBanner from "../../components/ui/PremiumErrorBanner";
import PremiumInput from "../../components/ui/PremiumInput";
import PremiumButton from "../../components/ui/PremiumButton";
import PremiumCard from "../../components/ui/PremiumCard";
import MotionScrollView from "../../components/motion/MotionScrollView";
import SectionReveal from "../../components/motion/SectionReveal";
import { APP_LOADING_UI } from "../../content/appContent";

export default function AdminNotificationsScreen({ navigation }) {
  const { colors: c, shadowPremium } = useTheme();
  const styles = useMemo(() => createAdminNotificationsStyles(c, shadowPremium), [c, shadowPremium]);
  const insets = useSafeAreaInsets();
  const { user, token } = useAuth();
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [items, setItems] = useState([]);

  const loadNotifications = useCallback(async () => {
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
  }, [token]);

  useEffect(() => {
    if (!user?.isAdmin) return;
    loadNotifications();
  }, [user, loadNotifications]);

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
                message="This account does not have admin privileges."
              />
              <PremiumButton
                label="Back to home"
                iconLeft="home-outline"
                variant="primary"
                size="md"
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
          <View style={styles.panel}>
            <AdminBackLink navigation={navigation} />
            <AdminPageHeading
              title="Broadcast Notifications"
              subtitle="Send updates to all users."
            />
            {error ? (
              <View style={styles.bannerSpacer}>
                <PremiumErrorBanner severity="error" message={error} onClose={() => setError("")} compact />
              </View>
            ) : null}
            {success ? (
              <View style={styles.bannerSpacer}>
                <PremiumErrorBanner severity="success" message={success} onClose={() => setSuccess("")} compact />
              </View>
            ) : null}

            <PremiumCard padding="lg" goldAccent style={styles.composeCard}>
              <Text style={[styles.composeLabel, { color: c.textPrimary }]}>Compose broadcast</Text>
              <View style={styles.fieldGap}>
                <PremiumInput
                  label="Notification title"
                  value={title}
                  onChangeText={setTitle}
                  iconLeft="megaphone-outline"
                />
              </View>
              <View style={styles.fieldGap}>
                <PremiumInput
                  label="Message"
                  value={message}
                  onChangeText={setMessage}
                  placeholder="Write your message…"
                  multiline
                  numberOfLines={4}
                  iconLeft="document-text-outline"
                />
              </View>

              <PremiumButton
                label={sending ? "Sending..." : "Send to all users"}
                iconLeft="megaphone-outline"
                variant="primary"
                size="md"
                loading={sending}
                disabled={sending}
                onPress={handleSend}
                fullWidth
              />

              <PremiumButton
                label={loading ? "Refreshing…" : "Refresh list"}
                iconLeft="refresh-outline"
                variant="secondary"
                size="sm"
                disabled={loading}
                loading={loading}
                onPress={loadNotifications}
                fullWidth
                style={styles.refreshBelowSend}
              />
            </PremiumCard>
          </View>

          <View style={styles.panel}>
            <Text style={[styles.sectionTitle, { color: c.textPrimary }]}>Sent notifications</Text>
            {loading ? (
              <View style={styles.loaderWrap}>
                <PremiumLoader size="sm" caption={APP_LOADING_UI.inline.admin} />
              </View>
            ) : items.length === 0 ? (
              <PremiumEmptyState
                iconName="notifications-outline"
                title="No notifications sent yet"
                description="Send a message above to reach users."
                compact
              />
            ) : (
              items.map((item, index) => (
                <PremiumCard
                  key={item._id}
                  padding="md"
                  goldAccent={index === 0}
                  style={styles.sentCard}
                >
                  <Text style={[styles.itemTitle, { color: c.textPrimary }]}>{item.title}</Text>
                  <Text style={[styles.itemMessage, { color: c.textSecondary }]}>{item.message}</Text>
                  <Text style={[styles.itemMeta, { color: c.textMuted }]}>
                    Sent: {new Date(item.createdAt).toLocaleString()}
                  </Text>
                </PremiumCard>
              ))
            )}
          </View>
          <AppFooter />
        </MotionScrollView>
      </KeyboardAvoidingView>
    </CustomerScreenShell>
  );
}

function createAdminNotificationsStyles(c, shadowPremium) {
  return StyleSheet.create({
    screen: {
      flex: 1,
    },
    panel: {
      ...adminPanel(c, shadowPremium),
      marginBottom: spacing.md,
    },
    gateCta: {
      marginTop: spacing.md,
      alignSelf: "flex-start",
    },
    composeCard: {
      marginTop: spacing.xs,
    },
    composeLabel: {
      fontSize: typography.bodySmall,
      fontWeight: "800",
      marginBottom: spacing.sm,
      letterSpacing: 0.2,
    },
    sectionTitle: {
      fontSize: typography.h3,
      fontWeight: "700",
      marginBottom: spacing.sm,
    },
    bannerSpacer: {
      marginBottom: spacing.sm,
    },
    fieldGap: {
      marginBottom: spacing.sm,
    },
    refreshBelowSend: {
      marginTop: spacing.sm,
    },
    sentCard: {
      marginBottom: spacing.sm,
    },
    itemTitle: {
      fontSize: typography.body,
      fontWeight: "700",
    },
    itemMessage: {
      marginTop: 4,
      fontSize: typography.bodySmall,
      lineHeight: 18,
    },
    itemMeta: {
      marginTop: spacing.xs,
      fontSize: typography.caption,
    },
    loaderWrap: {
      paddingVertical: spacing.md,
    },
  });
}
