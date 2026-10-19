import React, { useCallback, useEffect, useMemo, useState } from "react";
import { ADMIN_GATE, ADMIN_SCREEN_COPY } from "../../content/adminContent";
import { KeyboardAvoidingView, Platform, StyleSheet, View } from "react-native";
import KankregScrollPage from "../../components/kankreg/KankregScrollPage";
import AdminScreenShell from "../../components/admin/AdminScreenShell";
import KankregAdminShell from "../../components/kankreg/KankregAdminShell";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";
import {
  fetchAdminNotifications,
  sendAdminBroadcastNotification} from "../../services/adminService";
import {
  adminGatePanel,
  adminShellContent,
  adminTwoColAside,
  adminTwoColMain,
  adminTwoColStyle,
  useAdminCompactLayout,
} from "../../theme/adminLayout";
import AdminPanel from "../../components/admin/AdminPanel";
import AdminAlerts from "../../components/admin/AdminAlerts";
import AdminDataTable from "../../components/admin/AdminDataTable";
import { customerScrollFill } from "../../theme/screenLayout";
import { spacing, typography } from "../../theme/tokens";
import PremiumLoader from "../../components/ui/PremiumLoader";
import PremiumEmptyState from "../../components/ui/PremiumEmptyState";
import PremiumErrorBanner from "../../components/ui/PremiumErrorBanner";
import PremiumInput from "../../components/ui/PremiumInput";
import PremiumButton from "../../components/ui/PremiumButton";
import SectionReveal from "../../components/motion/SectionReveal";
import { navigateCustomerRoute } from "../../navigation/customerNavigate";

export default function AdminNotificationsScreen({ navigation, route }) {
  const { colors: c, shadowPremium } = useTheme();
  const compact = useAdminCompactLayout();
  const styles = useMemo(() => createAdminNotificationsStyles(c, shadowPremium), [c, shadowPremium]);
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
        message: message.trim()});
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
                message="This account does not have admin privileges."
              />
              <PremiumButton
                label={ADMIN_GATE.backHome}
                iconLeft="home-outline"
                variant="primary"
                size="md"
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
            title={ADMIN_SCREEN_COPY.notifications.title}
            subtitle={ADMIN_SCREEN_COPY.notifications.subtitle}
            headerRight={
              <PremiumButton
                label="Refresh"
                variant="secondary"
                size="sm"
                iconLeft="refresh-outline"
                onPress={loadNotifications}
                disabled={loading}
                loading={loading}
              />
            }
          >
          <View style={styles.panel}>
          <AdminAlerts error={error} success={success} onCloseError={() => setError("")} onCloseSuccess={() => setSuccess("")} />

          <View style={adminTwoColStyle(compact)}>
            <View style={adminTwoColMain(compact, 1.1)}>
            <AdminPanel
              title="Compose broadcast"
              icon="megaphone-outline"
              meta="Push to all customers"
              description="Title + message go to every signed-in customer."
            >
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
                  placeholder="Write message for all users…"
                  multiline
                  numberOfLines={4}
                  iconLeft="document-text-outline"
                />
              </View>

              <PremiumButton
                label={sending ? "Sending…" : "Send to all users"}
                iconLeft="megaphone-outline"
                variant="primary"
                size="md"
                loading={sending}
                disabled={sending}
                onPress={handleSend}
                fullWidth
              />
            </AdminPanel>
            </View>
            <View style={adminTwoColAside(compact)}>
          <AdminPanel
            title="Sent notifications"
            icon="time-outline"
            meta={`${items.length} broadcasts`}
            description="History of broadcasts sent from this desk."
            noPadding
          >
            {loading ? (
              <View style={styles.loaderWrap}>
                <PremiumLoader size="sm" caption="Loading sent notifications…" />
              </View>
            ) : items.length === 0 ? (
              <PremiumEmptyState
                iconName="notifications-outline"
                title={ADMIN_SCREEN_COPY.notifications.empty}
                description="Compose a message above to reach everyone."
                compact
              />
            ) : (
              <AdminDataTable
                rows={items}
                keyExtractor={(row) => row._id}
                columns={[
                  { key: "title", label: "Title", flex: 1.2, strong: true, render: (r) => r.title },
                  { key: "message", label: "Message", flex: 1.6, render: (r) => r.message },
                  {
                    key: "sent",
                    label: "Sent",
                    flex: 0.9,
                    render: (r) => (r.createdAt ? new Date(r.createdAt).toLocaleString() : "—"),
                  },
                ]}
              />
            )}
          </AdminPanel>
            </View>
          </View>
          </View>
          </KankregAdminShell>
</KankregScrollPage>
      </KeyboardAvoidingView>
    </AdminScreenShell>
  );
}

function createAdminNotificationsStyles(c, shadowPremium) {
  return StyleSheet.create({
    screen: {
      flex: 1},
    panel: adminShellContent(),
    gatePanel: adminGatePanel(c, shadowPremium),
    gateCta: {
      marginTop: spacing.md,
      alignSelf: "flex-start"},
    composeCard: {
      marginTop: spacing.xs},
    composeLabel: {
      fontSize: typography.bodySmall,
      fontWeight: "800",
      marginBottom: spacing.sm,
      letterSpacing: 0.2},
    sectionTitle: {
      fontSize: typography.h3,
      fontWeight: "700",
      marginBottom: spacing.sm},
    bannerSpacer: {
      marginBottom: spacing.sm},
    fieldGap: {
      marginBottom: spacing.sm},
    refreshBelowSend: {
      marginTop: spacing.sm},
    sentCard: {
      marginBottom: spacing.sm},
    itemTitle: {
      fontSize: typography.body,
      fontWeight: "700"},
    itemMessage: {
      marginTop: 4,
      fontSize: typography.bodySmall,
      lineHeight: 18},
    itemMeta: {
      marginTop: spacing.xs,
      fontSize: typography.caption},
    loaderWrap: {
      paddingVertical: spacing.md}});
}
