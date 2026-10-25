import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Platform, Pressable, RefreshControl, StyleSheet, Text, View } from "react-native";
import { ADMIN_GATE, ADMIN_SCREEN_COPY } from "../../content/adminContent";
import SectionReveal from "../../components/motion/SectionReveal";
import KankregScrollPage from "../../components/kankreg/KankregScrollPage";
import KankregAdminShell from "../../components/kankreg/KankregAdminShell";
import AdminScreenShell from "../../components/admin/AdminScreenShell";
import AdminBadge from "../../components/admin/AdminBadge";
import AdminButton from "../../components/admin/AdminButton";
import { AdminSettingRow } from "../../components/admin/AdminSection";
import PremiumErrorBanner from "../../components/ui/PremiumErrorBanner";
import PremiumLoader from "../../components/ui/PremiumLoader";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";
import { fetchApiHealth } from "../../services/apiClient";
import { fetchAdminProducts, searchAdminOrders } from "../../services/adminService";
import { listAdminOfflineDrafts } from "../../utils/adminOfflineQueue";
import { fetchStoreInfo } from "../../services/userService";
import { adminGatePanel, adminShellContent, useAdminChrome } from "../../theme/adminLayout";
import { customerScrollFill } from "../../theme/screenLayout";
import { fonts, spacing } from "../../theme/tokens";
import { timeAgo } from "../../utils/adminFormat";
import { adminStatusMeta, orderRef } from "../../utils/adminOrderUi";
import { navigateCustomerRoute } from "../../navigation/customerNavigate";

const COPY = ADMIN_SCREEN_COPY.health;

function formatIst(value) {
  const d = value ? new Date(value) : null;
  if (!d || Number.isNaN(d.getTime())) return "";
  return d.toLocaleString("en-IN", {
    timeZone: "Asia/Kolkata",
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

function checkoutCopy(store) {
  if (!store) return { label: "—", detail: "", tone: "neutral" };
  if (store.open) return { label: "Open", detail: "", tone: "green" };
  const reason = store.reason === "paused" || store.reason === "hours" ? store.reason : "";
  return {
    label: reason ? `Closed · ${reason}` : "Closed",
    detail: String(store.message || "").trim(),
    tone: "neutral",
  };
}

export default function AdminHealthScreen({ navigation, route }) {
  const { user } = useAuth();
  const { colors: c, shadowPremium } = useTheme();
  const chrome = useAdminChrome();
  const isAdmin = Boolean(user?.isAdmin);
  const styles = useMemo(() => createStyles(chrome, c, shadowPremium), [chrome, c, shadowPremium]);

  const [health, setHealth] = useState(null);
  const [store, setStore] = useState(null);
  const [order, setOrder] = useState(null);
  const [ordersKnown, setOrdersKnown] = useState(false);
  const [stockNote, setStockNote] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [unreachable, setUnreachable] = useState(false);
  const [queueCount, setQueueCount] = useState(0);

  const load = useCallback(async ({ silent = false } = {}) => {
    if (!silent) setLoading(true);
    try {
      const queued = await listAdminOfflineDrafts();
      setQueueCount(queued.length);
      const next = await fetchApiHealth();
      setHealth(next);
      setUnreachable(false);
      const [storeRes, orderRes, productRes] = await Promise.allSettled([
        fetchStoreInfo(),
        searchAdminOrders(null, { page: 1, pageSize: 5, sort: "newest" }),
        fetchAdminProducts(),
      ]);
      setStore(storeRes.status === "fulfilled" ? storeRes.value : null);
      if (productRes.status === "fulfilled") {
        const list = Array.isArray(productRes.value) ? productRes.value : [];
        const lowOnline = list.filter((p) => {
          const q = Math.max(0, Number(p?.stockQty) || 0);
          return p?.inStock !== false && q >= 1 && q <= 5;
        }).length;
        const lowFloor = list.filter((p) => {
          const f = Math.max(0, Number(p?.stockCounter) || 0);
          return f >= 1 && f <= 5;
        }).length;
        if (!lowOnline && !lowFloor) setStockNote("Online and floor piles look healthy.");
        else {
          setStockNote(
            [lowOnline ? `${lowOnline} jars low online` : "", lowFloor ? `${lowFloor} jars low on the floor` : ""]
              .filter(Boolean)
              .join(" · ")
          );
        }
      } else {
        setStockNote("");
      }
      if (orderRes.status === "fulfilled") {
        setOrder(orderRes.value?.items?.[0] || null);
        setOrdersKnown(true);
      } else {
        setOrder(null);
        setOrdersKnown(false);
      }
    } catch {
      setHealth(null);
      setStore(null);
      setOrder(null);
      setOrdersKnown(false);
      setUnreachable(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAdmin) load();
  }, [isAdmin, load]);

  const onPull = async () => {
    setRefreshing(true);
    try {
      await load({ silent: true });
    } finally {
      setRefreshing(false);
    }
  };

  if (user && !user.isAdmin) {
    return (
      <AdminScreenShell style={styles.screen}>
        <KankregScrollPage scrollVariant="inner" showFooter={false} style={customerScrollFill}>
          <SectionReveal delay={40} preset="fade-up">
            <View style={styles.gatePanel}>
              <PremiumErrorBanner severity="warning" title={ADMIN_GATE.title} message={ADMIN_GATE.message} />
              <AdminButton label={ADMIN_GATE.backHome} variant="primary" onPress={() => navigateCustomerRoute(navigation, "Home")} style={styles.gateCta} />
            </View>
          </SectionReveal>
        </KankregScrollPage>
      </AdminScreenShell>
    );
  }

  const title = unreachable ? COPY.title : health ? (health.ok ? COPY.up : COPY.down) : COPY.title;
  const checkout = checkoutCopy(store);
  const apiUp = Boolean(health);
  const dbOn = health?.db === "connected";
  const socketOn = health?.socket === "ready";
  const lastStatus = order ? adminStatusMeta(order.status) : null;

  return (
    <AdminScreenShell style={styles.screen}>
      <KankregScrollPage
        scrollVariant="admin"
        showFooter={false}
        style={customerScrollFill}
        refreshControl={Platform.OS === "web" ? undefined : <RefreshControl refreshing={refreshing} onRefresh={onPull} />}
      >
        <KankregAdminShell
          navigation={navigation}
          route={route}
          title={title}
          subtitle={COPY.subtitle}
          headerRight={<AdminButton label="Refresh" icon="refresh-outline" variant="ghost" size="sm" onPress={() => load()} />}
        >
          <View style={styles.panel}>
            {loading && !health && !unreachable ? <PremiumLoader size="sm" caption="Checking…" /> : null}

            {unreachable && !loading ? (
              <View style={styles.fail}>
                <Text style={styles.failTitle}>{COPY.unreachable}</Text>
                <AdminButton label={COPY.retry} icon="refresh-outline" variant="primary" size="md" onPress={() => load()} />
              </View>
            ) : null}

            {health ? (
              <>
                <View style={styles.card}>
                  <AdminSettingRow
                    title="API"
                    description={formatIst(health.ts) || undefined}
                    right={<AdminBadge label={apiUp ? "Up" : "Down"} tone={apiUp ? "green" : "red"} size="sm" />}
                  />
                  <AdminSettingRow
                    title="Database"
                    description={dbOn ? undefined : "The shop cannot take an order."}
                    right={<AdminBadge label={dbOn ? "Connected" : "Disconnected"} tone={dbOn ? "green" : "red"} size="sm" />}
                  />
                  <AdminSettingRow
                    title="Live updates"
                    description={socketOn ? undefined : "Orders still save. The admin desk just will not refresh on its own."}
                    right={<AdminBadge label={socketOn ? "Ready" : "Not ready"} tone={socketOn ? "green" : "gold"} size="sm" />}
                  />
                  <AdminSettingRow
                    title="Checkout"
                    description={checkout.detail || undefined}
                    right={
                      <View style={styles.checkoutRight}>
                        <AdminBadge label={checkout.label} tone={checkout.tone} size="sm" />
                        <AdminButton label="Edit" variant="ghost" size="sm" onPress={() => navigation.navigate("AdminSettings")} />
                      </View>
                    }
                  />
                  <AdminSettingRow
                    title="Stock piles"
                    description={stockNote || "Online delivery stock and shop-floor jars."}
                    right={
                      <AdminBadge
                        label={stockNote.includes("low") ? "Low" : "OK"}
                        tone={stockNote.includes("low") ? "gold" : "green"}
                        size="sm"
                      />
                    }
                  />
                  <AdminSettingRow
                    title="Store selling drafts"
                    description={queueCount ? "Shop bills and stock moves waiting on this phone. Open Store selling for bills, Offline drafts for stock moves." : "Nothing queued on this phone."}
                    last
                    right={
                      <AdminButton
                        label={queueCount ? String(queueCount) : "Open"}
                        variant="ghost"
                        size="sm"
                        onPress={() => navigation.navigate("AdminStoreSelling", { tab: "waiting" })}
                      />
                    }
                  />
                </View>

                {ordersKnown && !order ? <Text style={styles.last}>{COPY.noOrders}</Text> : null}
                {order ? (
                  <Pressable
                    onPress={() => navigation.navigate("AdminOrderDetail", { orderId: String(order._id) })}
                    style={({ pressed }) => [styles.lastRow, pressed && styles.pressed]}
                    accessibilityRole="button"
                    accessibilityLabel={`Open ${orderRef(order)}`}
                  >
                    <Text style={styles.last}>
                      {orderRef(order)} · {lastStatus?.label || order.status} · {timeAgo(order.createdAt) || "just now"}
                    </Text>
                  </Pressable>
                ) : null}
              </>
            ) : null}
          </View>
        </KankregAdminShell>
      </KankregScrollPage>
    </AdminScreenShell>
  );
}

function createStyles(chrome, c, shadowPremium) {
  return StyleSheet.create({
    screen: { flex: 1, width: "100%", alignSelf: "center", maxWidth: "100%" },
    panel: { ...adminShellContent(), gap: spacing.md },
    gatePanel: adminGatePanel(c, shadowPremium),
    gateCta: { marginTop: spacing.md, alignSelf: "flex-start" },
    card: {
      backgroundColor: chrome.card,
      borderRadius: 16,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: chrome.line,
      overflow: "hidden",
      paddingHorizontal: 18,
    },
    fail: { gap: 14, paddingVertical: 12 },
    failTitle: { fontSize: 18, color: chrome.ink, fontFamily: fonts.semibold },
    checkoutRight: { flexDirection: "row", alignItems: "center", gap: 8 },
    last: { fontSize: 13.5, color: chrome.inkSoft, fontFamily: fonts.medium },
    lastRow: { alignSelf: "flex-start", ...Platform.select({ web: { cursor: "pointer" }, default: {} }) },
    pressed: { opacity: 0.7 },
  });
}
