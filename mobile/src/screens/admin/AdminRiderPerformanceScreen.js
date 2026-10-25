import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Linking, Platform, Pressable, RefreshControl, StyleSheet, Text, View } from "react-native";
import { ADMIN_GATE, ADMIN_SCREEN_COPY } from "../../content/adminContent";
import SectionReveal from "../../components/motion/SectionReveal";
import KankregScrollPage from "../../components/kankreg/KankregScrollPage";
import KankregAdminShell from "../../components/kankreg/KankregAdminShell";
import AdminScreenShell from "../../components/admin/AdminScreenShell";
import AdminAlerts from "../../components/admin/AdminAlerts";
import AdminButton from "../../components/admin/AdminButton";
import AdminFilterTabs from "../../components/admin/AdminFilterTabs";
import PremiumEmptyState from "../../components/ui/PremiumEmptyState";
import PremiumErrorBanner from "../../components/ui/PremiumErrorBanner";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";
import { fetchAdminRiderPerformance } from "../../services/adminService";
import { adminGatePanel, adminShellContent, useAdminChrome, useAdminCompactLayout } from "../../theme/adminLayout";
import { customerScrollFill } from "../../theme/screenLayout";
import { fonts, radius, spacing } from "../../theme/tokens";
import { formatRupees, telHref, openExternal } from "../../utils/adminFormat";
import { navigateCustomerRoute } from "../../navigation/customerNavigate";

const COPY = ADMIN_SCREEN_COPY.riderPerformance;
const RANGES = [
  { key: "today", label: "Today" },
  { key: "7d", label: "Last 7 days" },
  { key: "30d", label: "Last 30 days" },
];

function acceptLabel(minutes) {
  return minutes == null ? "—" : `${minutes}`;
}

function callPhone(phone) {
  const href = telHref(phone);
  if (!href) return;
  if (Platform.OS === "web") openExternal(href);
  else Linking.openURL(href).catch(() => {});
}

export default function AdminRiderPerformanceScreen({ navigation, route }) {
  const { user } = useAuth();
  const { colors: c, shadowPremium } = useTheme();
  const chrome = useAdminChrome();
  const compact = useAdminCompactLayout();
  const isAdmin = Boolean(user?.isAdmin);
  const styles = useMemo(() => createStyles(chrome, c, shadowPremium), [chrome, c, shadowPremium]);

  const [range, setRange] = useState(RANGES.some((r) => r.key === route?.params?.range) ? route.params.range : "today");
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      setError("");
      const res = await fetchAdminRiderPerformance(null, { range });
      setItems(Array.isArray(res?.items) ? res.items : []);
    } catch (err) {
      setError(err.message || "Couldn't load rider performance.");
    } finally {
      setLoading(false);
    }
  }, [range]);

  useEffect(() => {
    if (!isAdmin) return;
    setLoading(true);
    load();
  }, [isAdmin, load]);

  const onPull = async () => {
    setRefreshing(true);
    try {
      await load();
    } finally {
      setRefreshing(false);
    }
  };

  const openOrders = (row) => navigation.navigate("AdminOrders", { rider: String(row._id), range });

  if (user && !user.isAdmin) {
    return (
      <AdminScreenShell style={styles.screen}>
        <KankregScrollPage scrollVariant="inner" showFooter={false} style={customerScrollFill}>
          <SectionReveal delay={40} preset="fade-up">
            <View style={styles.gatePanel}>
              <PremiumErrorBanner severity="warning" title={ADMIN_GATE.title} message={ADMIN_GATE.message} />
              <AdminButton
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
      <KankregScrollPage
        scrollVariant="admin"
        showFooter={false}
        style={customerScrollFill}
        refreshControl={
          Platform.OS === "web" ? undefined : (
            <RefreshControl refreshing={refreshing} onRefresh={onPull} tintColor={c.primary} colors={[c.primary]} />
          )
        }
      >
        <KankregAdminShell
          navigation={navigation}
          route={route}
          title={COPY.title}
          subtitle={COPY.subtitle}
          headerRight={<AdminButton label="Refresh" icon="refresh-outline" variant="ghost" size="sm" onPress={load} />}
        >
          <View style={styles.panel}>
            <AdminAlerts error={error} onCloseError={() => setError("")} />
            <AdminFilterTabs items={RANGES} value={range} onChange={setRange} />

            {loading ? <Text style={styles.muted}>Loading…</Text> : null}
            {!loading && items.length === 0 ? <PremiumEmptyState iconName="bicycle-outline" title={COPY.empty} compact /> : null}

            {!loading && items.length > 0 && !compact ? (
              <View style={styles.list}>
                <View style={styles.head}>
                  <Text style={[styles.headText, styles.colName]}>Rider</Text>
                  <Text style={[styles.headText, styles.colNum]}>Delivered</Text>
                  <Text style={[styles.headText, styles.colAmt]}>₹ delivered</Text>
                  <Text style={[styles.headText, styles.colNum]}>On time</Text>
                  <Text style={[styles.headText, styles.colNum]}>Late</Text>
                  <Text style={[styles.headText, styles.colNum]}>Accept</Text>
                  <Text style={[styles.headText, styles.colNum]}>Declined</Text>
                  <Text style={[styles.headText, styles.colAmt]}>Cash in</Text>
                  <Text style={[styles.headText, styles.colAmt]}>Cash due</Text>
                </View>
                {items.map((row) => (
                  <Pressable
                    key={row._id}
                    onPress={() => openOrders(row)}
                    style={({ pressed }) => [styles.row, pressed && styles.pressed]}
                    accessibilityRole="button"
                    accessibilityLabel={`Orders for ${row.name}`}
                  >
                    <View style={styles.colName}>
                      <Text style={styles.name}>{row.name}</Text>
                      {row.phone ? (
                        <Pressable onPress={() => callPhone(row.phone)} accessibilityRole="link" accessibilityLabel={`Call ${row.phone}`}>
                          <Text style={styles.phone}>{row.phone}</Text>
                        </Pressable>
                      ) : (
                        <Text style={styles.muted}>No phone</Text>
                      )}
                    </View>
                    <Text style={styles.colNum}>{row.delivered}</Text>
                    <Text style={styles.colAmt}>{formatRupees(row.deliveredAmount)}</Text>
                    <Text style={styles.colNum}>{row.onTime}</Text>
                    <Text style={styles.colNum}>{row.late}</Text>
                    <Text style={styles.colNum}>{acceptLabel(row.acceptMinutes)}</Text>
                    <Text style={styles.colNum}>{row.declined}</Text>
                    <Text style={styles.colAmt}>{formatRupees(row.cashCollected)}</Text>
                    <Text style={styles.colAmt}>{formatRupees(row.cashDue)}</Text>
                  </Pressable>
                ))}
              </View>
            ) : null}

            {!loading && compact
              ? items.map((row) => (
                  <Pressable
                    key={row._id}
                    onPress={() => openOrders(row)}
                    style={({ pressed }) => [styles.card, pressed && styles.pressed]}
                    accessibilityRole="button"
                    accessibilityLabel={`Orders for ${row.name}`}
                  >
                    <View style={styles.cardTop}>
                      <Text style={styles.name}>{row.name}</Text>
                      {row.phone ? (
                        <Pressable onPress={() => callPhone(row.phone)} accessibilityRole="link" accessibilityLabel={`Call ${row.phone}`}>
                          <Text style={styles.phone}>{row.phone}</Text>
                        </Pressable>
                      ) : null}
                    </View>
                    <Text style={styles.meta}>
                      Delivered {row.delivered} · {formatRupees(row.deliveredAmount)}
                    </Text>
                    <Text style={styles.meta}>
                      On time {row.onTime} · Late {row.late}
                    </Text>
                    <Text style={styles.meta}>Accept {row.acceptMinutes == null ? "—" : `${row.acceptMinutes} min`}</Text>
                    <Text style={styles.meta}>Declined {row.declined}</Text>
                    <Text style={styles.meta}>
                      Cash collected {formatRupees(row.cashCollected)} · still due {formatRupees(row.cashDue)}
                    </Text>
                  </Pressable>
                ))
              : null}
          </View>
        </KankregAdminShell>
      </KankregScrollPage>
    </AdminScreenShell>
  );
}

function createStyles(chrome, c, shadowPremium) {
  return StyleSheet.create({
    screen: { flex: 1, width: "100%" },
    panel: { ...adminShellContent(), gap: spacing.sm },
    gatePanel: adminGatePanel(c, shadowPremium),
    gateCta: { marginTop: spacing.md, alignSelf: "flex-start" },
    list: {
      backgroundColor: chrome.card,
      borderRadius: 16,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: chrome.line,
      overflow: "hidden",
    },
    head: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      paddingHorizontal: 16,
      paddingVertical: 11,
      backgroundColor: chrome.paper,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: chrome.line,
    },
    headText: {
      fontSize: 10.5,
      letterSpacing: 0.7,
      textTransform: "uppercase",
      color: chrome.inkFaint,
      fontFamily: fonts.semibold,
    },
    row: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: chrome.lineSoft,
    },
    card: {
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: c.border,
      borderRadius: radius.lg,
      padding: spacing.md,
      backgroundColor: c.surface,
      gap: 4,
    },
    cardTop: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", gap: spacing.sm },
    pressed: { opacity: 0.72 },
    name: { color: chrome.ink, fontFamily: fonts.semibold, fontSize: 15 },
    phone: { marginTop: 2, color: chrome.inkSoft, fontFamily: fonts.medium, fontSize: 13, textDecorationLine: "underline" },
    meta: { color: chrome.inkSoft, fontFamily: fonts.regular, fontSize: 12 },
    muted: { color: chrome.inkFaint, fontFamily: fonts.medium, fontSize: 12 },
    colName: { flex: 1.3, minWidth: 140 },
    colNum: { width: 64, color: chrome.ink, fontFamily: fonts.semibold, fontSize: 13, textAlign: "right" },
    colAmt: { width: 88, color: chrome.ink, fontFamily: fonts.semibold, fontSize: 13, textAlign: "right" },
  });
}
