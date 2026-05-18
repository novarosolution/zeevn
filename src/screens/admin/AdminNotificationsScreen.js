import React, { useCallback, useEffect, useMemo, useState } from "react";
import { KeyboardAvoidingView, Platform, StyleSheet, Text, View } from "react-native";
import { useAuth } from "../../context/AuthContext";
import OpsAdminScreen from "../../components/ops/OpsAdminScreen";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "../../context/ThemeContext";
import {
  fetchAdminNotifications,
  sendAdminBroadcastNotification,
} from "../../services/adminService";
import { adminPanel } from "../../theme/adminLayout";
import { adminInnerPageScrollContent, customerScrollFill } from "../../theme/screenLayout";
import { spacing, typography } from "../../theme/tokens";
import Loader from "../../components/ui/Loader";
import EmptyState from "../../components/ui/EmptyState";
import ErrorBanner from "../../components/ui/ErrorBanner";
import Input from "../../components/ui/Input";
import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";
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

  return (
    <OpsAdminScreen navigation={navigation} activeRoute="AdminNotifications" sectionTitle="Send notification">
            {error ? (
              <View style={styles.bannerSpacer}>
                <ErrorBanner severity="error" message={error} onClose={() => setError("")} compact />
              </View>
            ) : null}
            {success ? (
              <View style={styles.bannerSpacer}>
                <ErrorBanner severity="success" message={success} onClose={() => setSuccess("")} compact />
              </View>
            ) : null}

            <Card padding="lg" goldAccent style={styles.composeCard}>
              <Text style={[styles.composeLabel, { color: c.textPrimary }]}>Compose broadcast</Text>
              <View style={styles.fieldGap}>
                <Input
                  label="Notification title"
                  value={title}
                  onChangeText={setTitle}
                  iconLeft="megaphone-outline"
                />
              </View>
              <View style={styles.fieldGap}>
                <Input
                  label="Message"
                  value={message}
                  onChangeText={setMessage}
                  placeholder="Write your message…"
                  multiline
                  numberOfLines={4}
                  iconLeft="document-text-outline"
                />
              </View>

              <Button
                label={sending ? "Sending..." : "Send to all users"}
                iconLeft="megaphone-outline"
                variant="primary"
                size="md"
                loading={sending}
                disabled={sending}
                onPress={handleSend}
                fullWidth
              />

              <Button
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
            </Card>

          <View style={styles.panel}>
            <Text style={[styles.sectionTitle, { color: c.textPrimary }]}>Sent notifications</Text>
            {loading ? (
              <View style={styles.loaderWrap}>
                <Loader size="sm" caption={APP_LOADING_UI.inline.admin} />
              </View>
            ) : items.length === 0 ? (
              <EmptyState
                iconName="notifications-outline"
                title="No notifications sent yet"
                description="Send a message above to reach users."
                compact
              />
            ) : (
              items.map((item, index) => (
                <Card
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
                </Card>
              ))
            )}
          </View>
    </OpsAdminScreen>
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
