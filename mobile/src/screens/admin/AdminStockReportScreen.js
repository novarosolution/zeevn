import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Platform, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";
import * as FileSystem from "expo-file-system";
import * as Sharing from "expo-sharing";
import { ADMIN_GATE, ADMIN_SCREEN_COPY } from "../../content/adminContent";
import SectionReveal from "../../components/motion/SectionReveal";
import KankregScrollPage from "../../components/kankreg/KankregScrollPage";
import KankregAdminShell from "../../components/kankreg/KankregAdminShell";
import AdminScreenShell from "../../components/admin/AdminScreenShell";
import AdminAlerts from "../../components/admin/AdminAlerts";
import AdminBadge from "../../components/admin/AdminBadge";
import AdminButton from "../../components/admin/AdminButton";
import AdminFilterTabs from "../../components/admin/AdminFilterTabs";
import AdminInput from "../../components/admin/AdminInput";
import AdminProductCell from "../../components/admin/AdminProductCell";
import AdminStatTile, { AdminStatGrid } from "../../components/admin/AdminStatTile";
import PremiumButton from "../../components/ui/PremiumButton";
import PremiumChip from "../../components/ui/PremiumChip";
import PremiumEmptyState from "../../components/ui/PremiumEmptyState";
import PremiumErrorBanner from "../../components/ui/PremiumErrorBanner";
import PremiumLoader from "../../components/ui/PremiumLoader";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import { useTheme } from "../../context/ThemeContext";
import { fetchAdminStockReport } from "../../services/adminService";
import { adminGatePanel, adminShellContent, useAdminChrome, useAdminCompactLayout } from "../../theme/adminLayout";
import { customerScrollFill } from "../../theme/screenLayout";
import { fonts, radius, spacing } from "../../theme/tokens";
import { formatRupees } from "../../utils/adminFormat";
import { navigateCustomerRoute } from "../../navigation/customerNavigate";

const COPY = ADMIN_SCREEN_COPY.stockReport;

const RANGES = [
  { key: "today", label: "Today" },
  { key: "7d", label: "Last 7 days" },
  { key: "30d", label: "Last 30 days" },
];

const TABS = [
  { key: "all", label: "All" },
  { key: "in", label: "In stock" },
  { key: "low", label: "Low" },
  { key: "out", label: "Out" },
];

const SORTS = [
  { key: "name", label: "Name" },
  { key: "sold", label: "Most sold" },
  { key: "onHand", label: "Lowest on hand" },
  { key: "value", label: "Highest stock value" },
];

function pillOf(status) {
  if (status === "out") return { label: "Out", tone: "red" };
  if (status === "low") return { label: "Low", tone: "gold" };
  return { label: "In stock", tone: "green" };
}

function csvEscape(val) {
  const s = String(val ?? "");
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

async function exportRows(rows) {
  const header = ["name", "SKU", "on hand", "status", "stock value", "sold", "sold ₹"];
  const lines = [header.join(",")];
  for (const row of rows) {
    lines.push(
      [
        csvEscape(row.name),
        csvEscape(row.sku),
        row.onHand,
        pillOf(row.status).label,
        formatRupees(row.stockValue),
        row.sold,
        formatRupees(row.soldRevenue),
      ].join(",")
    );
  }
  const csv = `${lines.join("\r\n")}\r\n`;
  const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-");
  const filename = `zeevan-stock-report-${stamp}.csv`;

  if (Platform.OS === "web") {
    if (typeof globalThis.window === "undefined") return;
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = globalThis.document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
    return;
  }

  const base = FileSystem.cacheDirectory;
  if (!base) throw new Error("Cache directory is not available.");
  const uri = `${base}${filename}`;
  await FileSystem.writeAsStringAsync(uri, csv, { encoding: "utf8" });
  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(uri, { mimeType: "text/csv", dialogTitle: "Export stock report" });
  }
}

export default function AdminStockReportScreen({ navigation, route }) {
  const { user, token } = useAuth();
  const { toastSuccess, toastError } = useToast();
  const { colors: c, shadowPremium } = useTheme();
  const chrome = useAdminChrome();
  const compact = useAdminCompactLayout();
  const styles = useMemo(() => createStyles(chrome, c, shadowPremium, compact), [chrome, c, shadowPremium, compact]);

  const [range, setRange] = useState("7d");
  const [tab, setTab] = useState("all");
  const [sort, setSort] = useState("name");
  const [search, setSearch] = useState("");
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      setError("");
      const data = await fetchAdminStockReport(token, { range });
      setItems(Array.isArray(data?.items) ? data.items : []);
    } catch (err) {
      setError(err.message || "Unable to load the stock report.");
    } finally {
      setLoading(false);
    }
  }, [token, range]);

  useEffect(() => {
    if (user?.isAdmin) load();
  }, [user?.isAdmin, load]);

  const onPull = async () => {
    setRefreshing(true);
    try {
      await load();
    } finally {
      setRefreshing(false);
    }
  };

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    const rows = items.filter((row) => {
      if (tab !== "all" && row.status !== tab) return false;
      if (!q) return true;
      return (
        String(row.name || "")
          .toLowerCase()
          .includes(q) ||
        String(row.sku || "")
          .toLowerCase()
          .includes(q)
      );
    });
    rows.sort((a, b) => {
      if (sort === "sold") return Number(b.sold || 0) - Number(a.sold || 0) || a.name.localeCompare(b.name);
      if (sort === "onHand") return Number(a.onHand || 0) - Number(b.onHand || 0) || a.name.localeCompare(b.name);
      if (sort === "value") return Number(b.stockValue || 0) - Number(a.stockValue || 0) || a.name.localeCompare(b.name);
      return String(a.name || "").localeCompare(String(b.name || ""), "en", { sensitivity: "base" });
    });
    return rows;
  }, [items, search, tab, sort]);

  const totals = useMemo(() => {
    return visible.reduce(
      (acc, row) => {
        acc.products += 1;
        acc.stockValue += Number(row.stockValue || 0);
        acc.sold += Number(row.sold || 0);
        acc.soldRevenue += Number(row.soldRevenue || 0);
        return acc;
      },
      { products: 0, stockValue: 0, sold: 0, soldRevenue: 0 }
    );
  }, [visible]);

  const openRow = (row) => {
    const query = String(row.sku || row.name || "").trim();
    if (query) {
      navigation.navigate("AdminInventory", {
        search: query,
        filter: row.status === "out" ? "out" : row.status === "low" ? "low" : "in_stock",
      });
      return;
    }
    navigation.navigate("AdminAddProduct", { product: { _id: row.id, name: row.name, sku: row.sku } });
  };

  const handleExport = async () => {
    try {
      await exportRows(visible);
      toastSuccess("CSV exported.", { title: "CSV ready" });
    } catch (err) {
      toastError(err.message || "Could not export CSV.", { title: "Export failed" });
    }
  };

  if (user && !user.isAdmin) {
    return (
      <AdminScreenShell style={styles.screen}>
        <KankregScrollPage scrollVariant="inner" showFooter={false} style={customerScrollFill}>
          <SectionReveal delay={40} preset="fade-up">
            <View style={styles.gatePanel}>
              <PremiumErrorBanner severity="warning" title={ADMIN_GATE.title} message={ADMIN_GATE.message} />
              <PremiumButton label={ADMIN_GATE.backHome} variant="primary" onPress={() => navigateCustomerRoute(navigation, "Home")} style={styles.gateCta} />
            </View>
          </SectionReveal>
        </KankregScrollPage>
      </AdminScreenShell>
    );
  }

  const renderRow = (row) => {
    const pill = pillOf(row.status);
    return (
      <Pressable
        key={row.id}
        onPress={() => openRow(row)}
        style={({ pressed }) => [compact ? styles.card : styles.row, pressed && styles.pressed]}
        accessibilityRole="button"
        accessibilityLabel={`Open stock for ${row.name}`}
      >
        <View style={styles.cell}>
          <AdminProductCell name={row.name} imageUri={row.image} />
          <Text style={styles.meta} numberOfLines={1}>
            {row.sku || "No SKU"} · {row.category}
            {row.unit ? ` · ${row.unit}` : ""}
          </Text>
        </View>
        {compact ? (
          <View style={styles.cardStats}>
            <Text style={styles.num}>On hand {row.onHand}</Text>
            <AdminBadge label={pill.label} tone={pill.tone} size="sm" />
            <Text style={styles.num}>{formatRupees(row.stockValue)}</Text>
            <Text style={styles.num}>Sold {row.sold}</Text>
            <Text style={styles.num}>{formatRupees(row.soldRevenue)}</Text>
          </View>
        ) : (
          <View style={styles.cols}>
            <Text style={styles.num}>{row.onHand}</Text>
            <AdminBadge label={pill.label} tone={pill.tone} size="sm" />
            <Text style={styles.num}>{formatRupees(row.stockValue)}</Text>
            <Text style={styles.num}>{row.sold}</Text>
            <Text style={styles.num}>{formatRupees(row.soldRevenue)}</Text>
          </View>
        )}
      </Pressable>
    );
  };

  return (
    <AdminScreenShell style={styles.screen}>
      <KankregScrollPage
        scrollVariant="admin"
        showFooter={false}
        style={customerScrollFill}
        keyboardShouldPersistTaps="handled"
        refreshControl={Platform.OS === "web" ? undefined : <RefreshControl refreshing={refreshing} onRefresh={onPull} />}
      >
        <KankregAdminShell
          navigation={navigation}
          route={route}
          title={COPY.title}
          subtitle={COPY.subtitle}
          headerRight={
            <View style={styles.headerActions}>
              <AdminButton label="CSV" icon="download-outline" variant="ghost" size="sm" onPress={handleExport} disabled={!visible.length} />
              <AdminButton label="Refresh" icon="refresh-outline" variant="ghost" size="sm" onPress={load} />
            </View>
          }
        >
          <View style={styles.panel}>
            <AdminAlerts error={error} onCloseError={() => setError("")} />

            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipScroll}>
              {RANGES.map((item) => (
                <PremiumChip
                  key={item.key}
                  label={item.label}
                  tone="gold"
                  size="sm"
                  selected={range === item.key}
                  onPress={() => setRange(item.key)}
                />
              ))}
            </ScrollView>

            <AdminFilterTabs items={TABS} value={tab} onChange={setTab} />

            <AdminInput
              label="Search"
              value={search}
              onChangeText={setSearch}
              placeholder="Name or SKU"
              icon="search-outline"
            />

            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipScroll}>
              {SORTS.map((item) => (
                <PremiumChip
                  key={item.key}
                  label={item.label}
                  tone="neutral"
                  size="sm"
                  selected={sort === item.key}
                  onPress={() => setSort(item.key)}
                />
              ))}
            </ScrollView>

            <AdminStatGrid min={compact ? 148 : 160}>
              <AdminStatTile icon="cube-outline" label="Products" value={String(totals.products)} style={compact ? styles.tilePhone : undefined} />
              <AdminStatTile icon="cash-outline" label="Stock value" value={formatRupees(totals.stockValue)} tone="gold" style={compact ? styles.tilePhone : undefined} />
              <AdminStatTile icon="file-tray-outline" label="Jars sold" value={String(totals.sold)} style={compact ? styles.tilePhone : undefined} />
              <AdminStatTile icon="pricetag-outline" label="Sold ₹" value={formatRupees(totals.soldRevenue)} style={compact ? styles.tilePhone : undefined} />
            </AdminStatGrid>

            {loading ? <PremiumLoader size="sm" caption="Loading stock report…" /> : null}
            {!loading && items.length === 0 ? (
              <PremiumEmptyState iconName="cube-outline" title={COPY.empty} compact />
            ) : null}
            {!loading && items.length > 0 ? (
              <View style={styles.list}>
                {!compact ? (
                  <View style={styles.head}>
                    <Text style={[styles.headText, styles.cell]}>Product</Text>
                    <Text style={styles.headText}>On hand</Text>
                    <Text style={styles.headText}>Status</Text>
                    <Text style={styles.headText}>Value</Text>
                    <Text style={styles.headText}>Sold</Text>
                    <Text style={styles.headText}>Sold ₹</Text>
                  </View>
                ) : null}
                {visible.map(renderRow)}
              </View>
            ) : null}
          </View>
        </KankregAdminShell>
      </KankregScrollPage>
    </AdminScreenShell>
  );
}

function createStyles(chrome, c, shadowPremium, compact) {
  return StyleSheet.create({
    screen: { flex: 1, width: "100%", alignSelf: "center", maxWidth: "100%" },
    panel: { ...adminShellContent(), gap: spacing.sm },
    gatePanel: adminGatePanel(c, shadowPremium),
    gateCta: { marginTop: spacing.md, alignSelf: "flex-start" },
    headerActions: { flexDirection: "row", gap: 8 },
    chipScroll: { flexDirection: "row", gap: 8, paddingRight: 8 },
    tilePhone: { flexBasis: "47%", flexGrow: 1, maxWidth: "48%" },
    list: {
      backgroundColor: chrome.card,
      borderRadius: radius.lg,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: chrome.line,
      overflow: "hidden",
    },
    head: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      paddingHorizontal: 16,
      paddingVertical: 10,
      backgroundColor: chrome.paper,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: chrome.line,
    },
    headText: {
      width: 72,
      fontSize: 10.5,
      letterSpacing: 0.4,
      textTransform: "uppercase",
      color: chrome.inkFaint,
      fontFamily: fonts.semibold,
    },
    row: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: chrome.lineSoft,
      ...Platform.select({ web: { cursor: "pointer" }, default: {} }),
    },
    card: {
      paddingHorizontal: 16,
      paddingVertical: 14,
      gap: 10,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: chrome.lineSoft,
    },
    pressed: { opacity: 0.86 },
    cell: { flex: 1.6, minWidth: 0 },
    meta: { marginTop: 4, fontSize: 12, color: chrome.inkFaint, fontFamily: fonts.regular },
    cols: { flexDirection: "row", alignItems: "center", gap: 12 },
    cardStats: { flexDirection: "row", flexWrap: "wrap", gap: 8, alignItems: "center" },
    num: { width: compact ? undefined : 72, fontSize: 13.5, color: chrome.ink, fontFamily: fonts.semibold },
  });
}
