import React, { useCallback, useMemo, useState } from "react";
import { RefreshControl, StyleSheet, Text, View } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { ADMIN_GATE, ADMIN_SCREEN_COPY } from "../../content/adminContent";
import SectionReveal from "../../components/motion/SectionReveal";
import KankregScrollPage from "../../components/kankreg/KankregScrollPage";
import KankregAdminShell from "../../components/kankreg/KankregAdminShell";
import AdminScreenShell from "../../components/admin/AdminScreenShell";
import AdminAlerts from "../../components/admin/AdminAlerts";
import AdminBadge from "../../components/admin/AdminBadge";
import AdminButton, { AdminButtonRow } from "../../components/admin/AdminButton";
import AdminDeskDock from "../../components/admin/AdminDeskDock";
import AdminFilterTabs from "../../components/admin/AdminFilterTabs";
import AdminInput from "../../components/admin/AdminInput";
import AdminKpiCard, { AdminKpiGrid } from "../../components/admin/AdminKpiCard";
import AdminPanel from "../../components/admin/AdminPanel";
import { useAdminConfirm } from "../../components/admin/AdminDialog";
import AdminOfflineBanner from "../../components/admin/AdminOfflineBanner";
import PremiumEmptyState from "../../components/ui/PremiumEmptyState";
import PremiumErrorBanner from "../../components/ui/PremiumErrorBanner";
import PremiumLoader from "../../components/ui/PremiumLoader";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";
import { useToast } from "../../context/ToastContext";
import { fetchAdminOrder, fetchAdminProducts, searchAdminOrders, voidAdminWalkIn } from "../../services/adminService";
import {
  ADMIN_FONT,
  adminGatePanel,
  adminShellContent,
  adminTwoColAside,
  adminTwoColMain,
  adminTwoColStyle,
  useAdminChrome,
  useAdminCompactLayout,
} from "../../theme/adminLayout";
import { customerScrollFill } from "../../theme/screenLayout";
import { spacing } from "../../theme/tokens";
import { formatRupees, formatShortDateTime } from "../../utils/adminFormat";
import { orderRef } from "../../utils/adminOrderUi";
import { listAdminOfflineDrafts, removeAdminOfflineDraft, syncAdminOfflineDrafts } from "../../utils/adminOfflineQueue";
import { adminOfflineHandlers, buildOfflineDraftHtml } from "../../utils/adminOfflineSync";
import { buildCounterBillHtml, buildStoreDayBookHtml } from "../../utils/orderInvoiceHtml";
import { printAdminHtml } from "../../utils/printAdminHtml";
import { navigateCustomerRoute } from "../../navigation/customerNavigate";

const COPY = ADMIN_SCREEN_COPY.storeSelling;
const LOW = 5;

function draftAmount(row) {
  return (row?.payload?.products || []).reduce((sum, line) => {
    const price = Number(line.price != null ? line.price : 0);
    const qty = Number(line.quantity != null ? line.quantity : 1);
    return sum + price * qty;
  }, 0);
}

function billName(bill) {
  return bill?.shippingAddress?.fullName || bill?.user?.name || "Walk-in";
}

function billPhone(bill) {
  return bill?.shippingAddress?.phone || bill?.user?.phone || "";
}

function billCashier(bill) {
  return (bill?.invoice && bill.invoice.billedBy) || "";
}

function isCashTender(value) {
  return /cash/i.test(String(value || "Cash"));
}

function lineSummary(products) {
  return (products || [])
    .map((line) => `${line.name || "Jar"} ×${Number(line.quantity) || 1}`)
    .join(" · ");
}

function cashReceivedOf(bill) {
  return Math.max(0, Number(bill?.cashReceived != null ? bill.cashReceived : 0));
}

export default function AdminStoreSellingScreen({ navigation, route }) {
  const { user } = useAuth();
  const { colors: c, shadowPremium } = useTheme();
  const chrome = useAdminChrome();
  const compact = useAdminCompactLayout();
  const toast = useToast();
  const { confirm, dialog } = useAdminConfirm();
  const styles = useMemo(() => createStyles(chrome, c, shadowPremium), [chrome, c, shadowPremium]);

  const seedTab = String(route?.params?.tab || "");
  const seedDraft = String(route?.params?.draftId || "");

  const [tab, setTab] = useState(
    ["waiting", "today", "all", "voided"].includes(seedTab) ? seedTab : seedDraft ? "waiting" : "today"
  );
  const [range, setRange] = useState("today");
  const [tender, setTender] = useState("all");
  const [query, setQuery] = useState("");
  const [bills, setBills] = useState([]);
  const [todayBills, setTodayBills] = useState([]);
  const [drafts, setDrafts] = useState([]);
  const [lowFloor, setLowFloor] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [highlight, setHighlight] = useState(seedDraft);

  const load = useCallback(async () => {
    const listRange = tab === "all" || tab === "voided" ? range : "today";
    try {
      const [page, todayPage, queued, products] = await Promise.all([
        searchAdminOrders(null, { channel: "walk_in", range: listRange, pageSize: 100, sort: "newest" }),
        listRange === "today"
          ? Promise.resolve(null)
          : searchAdminOrders(null, { channel: "walk_in", range: "today", pageSize: 100, sort: "newest" }),
        listAdminOfflineDrafts(),
        fetchAdminProducts(null).catch(() => []),
      ]);
      const list = Array.isArray(page?.items) ? page.items : [];
      const todayList = Array.isArray(todayPage?.items) ? todayPage.items : listRange === "today" ? list : [];
      setBills(list);
      setTodayBills(todayList);
      setDrafts((queued || []).filter((row) => row.kind === "walk_in"));
      setLowFloor(
        (Array.isArray(products) ? products : []).filter((product) => {
          const floor = Math.max(0, Number(product.stockCounter) || 0);
          return floor > 0 && floor <= LOW;
        })
      );
      setError("");
    } catch (err) {
      const queued = await listAdminOfflineDrafts();
      setDrafts((queued || []).filter((row) => row.kind === "walk_in"));
      setError(err.message || "Could not load store selling.");
    } finally {
      setLoading(false);
    }
  }, [tab, range]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const liveToday = useMemo(() => todayBills.filter((row) => row.status !== "cancelled"), [todayBills]);
  const cashToday = useMemo(() => liveToday.filter((row) => isCashTender(row.paymentMethod)), [liveToday]);
  const upiToday = useMemo(() => liveToday.filter((row) => !isCashTender(row.paymentMethod)), [liveToday]);
  const todayRupees = liveToday.reduce((n, row) => n + Number(row.totalPrice || 0), 0);
  const cashRupees = cashToday.reduce((n, row) => n + Number(row.totalPrice || 0), 0);
  const upiRupees = upiToday.reduce((n, row) => n + Number(row.totalPrice || 0), 0);
  const waitingRupees = drafts.reduce((n, row) => n + draftAmount(row), 0);

  const shownBills = useMemo(() => {
    const q = query.trim().toLowerCase();
    return bills.filter((bill) => {
      if (tab === "voided" && bill.status !== "cancelled") return false;
      if (tab !== "voided" && bill.status === "cancelled") return false;
      if (tender === "cash" && !isCashTender(bill.paymentMethod)) return false;
      if (tender === "upi" && isCashTender(bill.paymentMethod)) return false;
      if (!q) return true;
      const hay = [orderRef(bill), billName(bill), billPhone(bill), billCashier(bill), bill.paymentMethod, lineSummary(bill.products)]
        .join(" ")
        .toLowerCase();
      return hay.includes(q);
    });
  }, [bills, tab, tender, query]);

  const shownDrafts = useMemo(() => {
    const q = query.trim().toLowerCase();
    return drafts.filter((row) => {
      const p = row.payload || {};
      if (tender === "cash" && !isCashTender(p.tender)) return false;
      if (tender === "upi" && isCashTender(p.tender)) return false;
      if (!q) return true;
      const hay = [p.name, p.phone, p.cashierName, p.tender, lineSummary(p.products), row.label].join(" ").toLowerCase();
      return hay.includes(q);
    });
  }, [drafts, tender, query]);

  const syncStore = async (ids) => {
    setSyncing(true);
    try {
      const { done, pending } = await syncAdminOfflineDrafts(adminOfflineHandlers(), {
        kinds: ["walk_in"],
        ids: ids || undefined,
      });
      if (done.length) {
        toast.toastSuccess(`Synced ${done.length} store sale${done.length === 1 ? "" : "s"}.`);
        const last = done[done.length - 1]?.result;
        if (last && last.products) {
          await printAdminHtml(buildCounterBillHtml(last));
        }
      }
      const firstErr = (pending || []).find((row) => row.kind === "walk_in" && row.error);
      setError(firstErr ? firstErr.error : "");
      await load();
    } finally {
      setSyncing(false);
    }
  };

  const printLive = async (bill) => {
    try {
      let full = bill;
      if ((!bill?.products || !bill.products.length) && bill?._id) {
        full = await fetchAdminOrder(null, bill._id);
      }
      await printAdminHtml(buildCounterBillHtml(full));
      toast.toastSuccess("Printing bill.");
    } catch (err) {
      setError(err.message || "Could not print the bill.");
    }
  };

  const voidLive = async (bill) => {
    if (!bill?._id) return;
    const ok = await confirm({ title: `Void ${orderRef(bill)}?`, confirmLabel: "Void", tone: "danger", icon: "close-outline" });
    if (!ok) return;
    setBusy(true);
    try {
      await voidAdminWalkIn(null, bill._id);
      toast.toastSuccess("Bill voided.");
      await load();
    } catch (err) {
      setError(err.message || "Could not void the bill.");
    } finally {
      setBusy(false);
    }
  };

  const printDayBook = async () => {
    try {
      await printAdminHtml(
        buildStoreDayBookHtml({
          title: "Store selling",
          rangeLabel: tab === "waiting" ? "Waiting on this phone" : range === "yesterday" ? "Yesterday" : range === "7d" ? "Last 7 days" : "Today",
          bills: tab === "waiting" ? todayBills : shownBills,
          drafts: shownDrafts,
        })
      );
      toast.toastSuccess("Printing day book.");
    } catch (err) {
      setError(err.message || "Could not print the day book.");
    }
  };

  const removeDraft = async (row) => {
    const ok = await confirm({ title: "Remove this store sale from this phone?", confirmLabel: "Remove", tone: "danger" });
    if (!ok) return;
    await removeAdminOfflineDraft(row.id);
    toast.toastSuccess("Draft removed.");
    await load();
  };

  if (user && !user.isAdmin) {
    return (
      <AdminScreenShell style={styles.screen}>
        <KankregScrollPage scrollVariant="inner" showFooter={false} style={customerScrollFill}>
          <View style={styles.gatePanel}>
            <PremiumErrorBanner severity="warning" title={ADMIN_GATE.title} message={ADMIN_GATE.message} />
            <AdminButton label={ADMIN_GATE.backHome} variant="primary" onPress={() => navigateCustomerRoute(navigation, "Home")} />
          </View>
        </KankregScrollPage>
      </AdminScreenShell>
    );
  }

  const dock = (
    <AdminButtonRow>
      <AdminButton label="Open till" icon="storefront-outline" variant="primary" onPress={() => navigation.navigate("AdminCounter")} />
      <AdminButton label="Sync" icon="cloud-upload-outline" variant="soft" loading={syncing} disabled={!drafts.length} onPress={() => syncStore()} />
      <AdminButton label="Print day book" icon="print-outline" variant="ghost" onPress={printDayBook} />
    </AdminButtonRow>
  );

  const waitingList = (
    <AdminPanel title="Waiting on this phone" icon="cloud-offline-outline" meta={`${shownDrafts.length}`} description="Floor stock changes only after Sync.">
      {!shownDrafts.length ? <PremiumEmptyState iconName="cloud-done-outline" title="No store drafts waiting." compact /> : null}
      {shownDrafts.map((row) => {
        const p = row.payload || {};
        const amount = draftAmount(row);
        const cash = cashReceivedOf(p);
        const change = cash > 0 ? Math.max(0, cash - amount) : 0;
        return (
          <View key={row.id} style={[styles.card, highlight === row.id && styles.cardOn]}>
            <View style={styles.cardTop}>
              <Text style={styles.name}>{p.name || row.label || "Walk-in"}</Text>
              <AdminBadge label="Waiting" tone={row.error ? "red" : "gold"} size="sm" />
            </View>
            <Text style={styles.meta}>
              {[p.phone, formatRupees(amount), p.tender || "Cash", p.cashierName ? `By ${p.cashierName}` : "", formatShortDateTime(row.at)]
                .filter(Boolean)
                .join(" · ")}
            </Text>
            {lineSummary(p.products) ? <Text style={styles.lines}>{lineSummary(p.products)}</Text> : null}
            {isCashTender(p.tender) && cash > 0 ? (
              <Text style={styles.meta}>Received {formatRupees(cash)}{change > 0 ? ` · Change ${formatRupees(change)}` : ""}</Text>
            ) : null}
            {!isCashTender(p.tender) && p.upiRef ? <Text style={styles.meta}>UPI {p.upiRef}</Text> : null}
            {row.error ? <Text style={styles.err}>{row.error}</Text> : null}
            <AdminButtonRow>
              <AdminButton label="Print" size="sm" variant="soft" onPress={() => printAdminHtml(buildOfflineDraftHtml(row))} />
              <AdminButton
                label="Sync"
                size="sm"
                variant="primary"
                loading={syncing}
                onPress={() => syncStore([row.id])}
              />
              <AdminButton label="Open till" size="sm" variant="ghost" onPress={() => navigation.navigate("AdminCounter")} />
              <AdminButton label="Remove" size="sm" variant="danger" onPress={() => removeDraft(row)} />
            </AdminButtonRow>
          </View>
        );
      })}
    </AdminPanel>
  );

  const liveList = (
    <AdminPanel
      title={tab === "voided" ? "Voided store bills" : tab === "all" ? "Store bills" : "Today’s store bills"}
      icon="receipt-outline"
      meta={`${shownBills.length}`}
      description="Live walk-in bills. Floor stock already moved."
    >
      {loading ? <PremiumLoader size="sm" caption="Loading store bills…" /> : null}
      {!loading && !shownBills.length ? <PremiumEmptyState iconName="receipt-outline" title="No store bills in this view." compact /> : null}
      {shownBills.map((bill) => {
        const amount = Number(bill.totalPrice || 0);
        const cash = cashReceivedOf(bill);
        const change = cash > 0 ? Math.max(0, cash - amount) : 0;
        const voided = bill.status === "cancelled";
        return (
          <View key={bill._id} style={styles.card}>
            <View style={styles.cardTop}>
              <Text style={styles.name}>{orderRef(bill) || "DRAFT"}</Text>
              <AdminBadge label={voided ? "Voided" : bill.paymentMethod || "Paid"} tone={voided ? "red" : "green"} size="sm" />
            </View>
            <Text style={styles.meta}>
              {[billName(bill), billPhone(bill), formatRupees(amount), billCashier(bill) ? `By ${billCashier(bill)}` : "", formatShortDateTime(bill.createdAt)]
                .filter(Boolean)
                .join(" · ")}
            </Text>
            {lineSummary(bill.products) ? <Text style={styles.lines}>{lineSummary(bill.products)}</Text> : null}
            {isCashTender(bill.paymentMethod) && cash > 0 ? (
              <Text style={styles.meta}>Received {formatRupees(cash)}{change > 0 ? ` · Change ${formatRupees(change)}` : ""}</Text>
            ) : null}
            {!isCashTender(bill.paymentMethod) && (bill.invoice?.notes || bill.upiRef) ? (
              <Text style={styles.meta}>{bill.invoice?.notes || `UPI ${bill.upiRef}`}</Text>
            ) : null}
            <AdminButtonRow>
              <AdminButton label="Reprint" size="sm" variant="soft" onPress={() => printLive(bill)} />
              <AdminButton label="Open" size="sm" variant="ghost" onPress={() => navigation.navigate("AdminOrderDetail", { orderId: String(bill._id) })} />
              {!voided ? <AdminButton label="Void" size="sm" variant="danger" disabled={busy} onPress={() => voidLive(bill)} /> : null}
            </AdminButtonRow>
          </View>
        );
      })}
    </AdminPanel>
  );

  return (
    <AdminScreenShell style={styles.screen}>
      <KankregScrollPage
        scrollVariant="admin"
        showFooter={false}
        style={customerScrollFill}
        refreshControl={<RefreshControl refreshing={false} onRefresh={load} />}
      >
        <KankregAdminShell
          navigation={navigation}
          route={route || { name: "AdminStoreSelling" }}
          title={COPY.title}
          subtitle={COPY.subtitle}
          headerRight={
            <View style={styles.headerActions}>
              <AdminButton label="Open till" variant="primary" size="sm" onPress={() => navigation.navigate("AdminCounter")} />
              <AdminButton label="Refresh" icon="refresh-outline" variant="ghost" size="sm" onPress={load} />
            </View>
          }
        >
          <SectionReveal delay={20} preset="fade-up">
            <View style={styles.panel}>
              <AdminAlerts error={error} onCloseError={() => setError("")} />
              <AdminOfflineBanner
                kinds={["walk_in"]}
                syncing={syncing}
                onSync={() => syncStore()}
                onManage={() => setTab("waiting")}
              />

              <AdminKpiGrid compact={compact}>
                <AdminKpiCard icon="receipt-outline" label="Today’s bills" hint="Live, not voided" value={String(liveToday.length)} onPress={() => setTab("today")} />
                <AdminKpiCard icon="cash-outline" label="Taken today" hint="Shop floor" value={formatRupees(todayRupees)} tone="gold" onPress={() => setTab("today")} />
                <AdminKpiCard icon="wallet-outline" label="Cash" hint={`${cashToday.length} bills`} value={formatRupees(cashRupees)} onPress={() => setTender("cash")} />
                <AdminKpiCard icon="phone-portrait-outline" label="UPI" hint={`${upiToday.length} bills`} value={formatRupees(upiRupees)} onPress={() => setTender("upi")} />
                <AdminKpiCard
                  icon="cloud-offline-outline"
                  label="Waiting"
                  hint={drafts.length ? formatRupees(waitingRupees) : "None on this phone"}
                  value={String(drafts.length)}
                  tone={drafts.length ? "warn" : "default"}
                  onPress={() => setTab("waiting")}
                />
              </AdminKpiGrid>

              {lowFloor.length ? (
                <AdminPanel title="Floor running low" icon="alert-circle-outline" meta={`${lowFloor.length}`} action="Transfer" onAction={() => navigation.navigate("AdminTransfers")}>
                  <Text style={styles.meta}>{lowFloor.slice(0, 6).map((p) => `${p.name} · ${p.stockCounter}`).join(" · ")}</Text>
                </AdminPanel>
              ) : null}

              <AdminFilterTabs
                value={tab}
                onChange={(next) => {
                  setTab(next);
                  setHighlight("");
                }}
                items={[
                  { key: "waiting", label: "Waiting", count: drafts.length, tone: "gold" },
                  { key: "today", label: "Today", count: liveToday.length },
                  { key: "all", label: "All" },
                  { key: "voided", label: "Voided" },
                ]}
              />

              {tab === "all" || tab === "voided" ? (
                <AdminFilterTabs
                  value={range}
                  onChange={setRange}
                  items={[
                    { key: "today", label: "Today" },
                    { key: "yesterday", label: "Yesterday" },
                    { key: "7d", label: "Week" },
                  ]}
                />
              ) : null}

              <AdminFilterTabs
                value={tender}
                onChange={setTender}
                items={[
                  { key: "all", label: "All tenders" },
                  { key: "cash", label: "Cash" },
                  { key: "upi", label: "UPI" },
                ]}
              />

              <AdminInput value={query} onChangeText={setQuery} placeholder="Name, phone, bill #, cashier" icon="search-outline" />

              <View style={adminTwoColStyle(compact)}>
                <View style={adminTwoColMain(compact)}>{tab === "waiting" ? waitingList : liveList}</View>
                <View style={adminTwoColAside(compact)}>{tab === "waiting" ? liveList : waitingList}</View>
              </View>

              {!compact ? dock : null}
            </View>
          </SectionReveal>
        </KankregAdminShell>
      </KankregScrollPage>
      {compact ? <AdminDeskDock>{dock}</AdminDeskDock> : null}
      {dialog}
    </AdminScreenShell>
  );
}

function createStyles(chrome, c, shadowPremium) {
  return StyleSheet.create({
    screen: { flex: 1, backgroundColor: chrome.page },
    panel: { ...adminShellContent(), gap: spacing.md, paddingBottom: spacing.xl },
    gatePanel: adminGatePanel(c, shadowPremium),
    headerActions: { flexDirection: "row", alignItems: "center", gap: 8, flexWrap: "wrap" },
    card: {
      backgroundColor: chrome.card,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: chrome.line,
      borderRadius: 14,
      padding: 14,
      gap: 6,
    },
    cardOn: { borderColor: chrome.gold || "#c9a227" },
    cardTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8 },
    name: { flex: 1, fontFamily: ADMIN_FONT.semibold, fontSize: 15, color: chrome.ink },
    meta: { fontFamily: ADMIN_FONT.regular, fontSize: 12, color: chrome.inkSoft },
    lines: { fontFamily: ADMIN_FONT.regular, fontSize: 12, color: chrome.ink },
    err: { fontFamily: ADMIN_FONT.regular, fontSize: 12, color: c.danger || "#8a4b32" },
  });
}
