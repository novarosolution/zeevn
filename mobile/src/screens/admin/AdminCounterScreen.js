import React, { useCallback, useEffect, useMemo, useState } from "react";
import { KeyboardAvoidingView, Platform, StyleSheet, Text, View } from "react-native";
import { ADMIN_GATE } from "../../content/adminContent";
import SectionReveal from "../../components/motion/SectionReveal";
import KankregScrollPage from "../../components/kankreg/KankregScrollPage";
import KankregAdminShell from "../../components/kankreg/KankregAdminShell";
import AdminScreenShell from "../../components/admin/AdminScreenShell";
import AdminAlerts from "../../components/admin/AdminAlerts";
import AdminBadge from "../../components/admin/AdminBadge";
import AdminButton, { AdminButtonRow } from "../../components/admin/AdminButton";
import AdminDeskDock from "../../components/admin/AdminDeskDock";
import AdminFilterTabs from "../../components/admin/AdminFilterTabs";
import AdminHitRow from "../../components/admin/AdminHitRow";
import AdminInput from "../../components/admin/AdminInput";
import AdminLineCard from "../../components/admin/AdminLineCard";
import AdminPanel from "../../components/admin/AdminPanel";
import AdminQtyStepper from "../../components/admin/AdminQtyStepper";
import AdminSwitch from "../../components/admin/AdminSwitch";
import { useAdminConfirm } from "../../components/admin/AdminDialog";
import PremiumEmptyState from "../../components/ui/PremiumEmptyState";
import PremiumErrorBanner from "../../components/ui/PremiumErrorBanner";
import PremiumLoader from "../../components/ui/PremiumLoader";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";
import { useToast } from "../../context/ToastContext";
import { createAdminWalkIn, fetchAdminProducts, fetchAdminUsers, searchAdminOrders, voidAdminWalkIn } from "../../services/adminService";
import AdminOfflineBanner from "../../components/admin/AdminOfflineBanner";
import {
  cacheAdminCatalog,
  enqueueAdminOfflineDraft,
  isLikelyOffline,
  readAdminCatalogCache,
  syncAdminOfflineDrafts,
} from "../../utils/adminOfflineQueue";
import { adminOfflineHandlers } from "../../utils/adminOfflineSync";
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
import { productCoverUri } from "../../utils/adminProductHelpers";
import { formatRupees, formatShortDateTime } from "../../utils/adminFormat";
import { orderRef } from "../../utils/adminOrderUi";
import { buildCounterBillHtml, tillDraftOrder } from "../../utils/orderInvoiceHtml";
import { printAdminHtml } from "../../utils/printAdminHtml";
import { navigateCustomerRoute } from "../../navigation/customerNavigate";

const LOW = 5;

export default function AdminCounterScreen({ navigation, route }) {
  const { user } = useAuth();
  const { colors: c, shadowPremium } = useTheme();
  const chrome = useAdminChrome();
  const compact = useAdminCompactLayout();
  const toast = useToast();
  const { confirm, dialog } = useAdminConfirm();
  const styles = useMemo(() => createStyles(chrome, c, shadowPremium), [chrome, c, shadowPremium]);
  const seedCustomer = route?.params?.customer || null;

  const [products, setProducts] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [bills, setBills] = useState([]);
  const [query, setQuery] = useState("");
  const [cart, setCart] = useState([]);
  const [holds, setHolds] = useState([]);
  const [name, setName] = useState(seedCustomer?.name || "");
  const [phone, setPhone] = useState(seedCustomer?.phone || "");
  const [customerId, setCustomerId] = useState(seedCustomer?._id || "");
  const [tender, setTender] = useState("Cash");
  const [upiRef, setUpiRef] = useState("");
  const [cashReceived, setCashReceived] = useState("");
  const [showOut, setShowOut] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [lastBill, setLastBill] = useState(null);
  const [openBill, setOpenBill] = useState(null);
  const [syncing, setSyncing] = useState(false);

  const load = useCallback(async () => {
    try {
      const [list, people, recent] = await Promise.all([
        fetchAdminProducts(null),
        fetchAdminUsers(null, { isAdmin: false }),
        searchAdminOrders(null, { channel: "walk_in", pageSize: 10, sort: "newest" }),
      ]);
      setProducts(Array.isArray(list) ? list : []);
      cacheAdminCatalog(list);
      setCustomers(Array.isArray(people) ? people : []);
      setBills(Array.isArray(recent?.items) ? recent.items : []);
      setError("");
    } catch (err) {
      const cached = await readAdminCatalogCache();
      if (cached.products.length) setProducts(cached.products);
      setError(err.message || "Could not load the till.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!seedCustomer) return;
    setName(seedCustomer.name || "");
    setPhone(seedCustomer.phone || "");
    setCustomerId(seedCustomer._id || "");
  }, [seedCustomer]);

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    return products
      .filter((p) => p.isPublished !== false && !p.comingSoon)
      .filter((p) => {
        const floor = Math.max(0, Number(p.stockCounter) || 0);
        if (!showOut && floor < 1) return false;
        return !q || `${p.name} ${p.sku || ""}`.toLowerCase().includes(q);
      })
      .slice(0, 12);
  }, [products, query, showOut]);

  const peopleHits = useMemo(() => {
    const q = phone.trim().toLowerCase() || name.trim().toLowerCase();
    if (!q || q.length < 2) return [];
    return customers
      .filter((row) => `${row.name} ${row.phone}`.toLowerCase().includes(q))
      .slice(0, 6);
  }, [customers, name, phone]);

  const total = cart.reduce((sum, line) => sum + Number(line.price || 0) * line.quantity, 0);
  const received = Math.max(0, Number(cashReceived) || 0);
  const changeDue = tender === "Cash" && received > 0 ? Math.max(0, received - total) : 0;

  const addLine = (product) => {
    const floor = Math.max(0, Number(product.stockCounter) || 0);
    if (floor < 1) {
      setError(`${product.name} has no shop-floor stock. Transfer jars first.`);
      return;
    }
    setError("");
    setCart((rows) => {
      const id = String(product._id);
      const found = rows.find((row) => row.productId === id);
      if (found) {
        if (found.quantity + 1 > floor) return rows;
        return rows.map((row) => (row.productId === id ? { ...row, quantity: row.quantity + 1 } : row));
      }
      return [
        ...rows,
        {
          productId: id,
          name: product.name,
          price: Number(product.price || 0),
          image: productCoverUri(product),
          stockCounter: floor,
          quantity: 1,
        },
      ];
    });
  };

  const setQty = (productId, quantity) => {
    setCart((rows) =>
      rows
        .map((row) => {
          if (row.productId !== productId) return row;
          return { ...row, quantity: Math.min(row.stockCounter || 99, Math.max(0, quantity)) };
        })
        .filter((row) => row.quantity > 0)
    );
  };

  const snapshot = () => ({
    cart,
    name,
    phone,
    customerId,
    tender,
    upiRef,
    cashReceived,
  });

  const restore = (row) => {
    setCart(row.cart || []);
    setName(row.name || "");
    setPhone(row.phone || "");
    setCustomerId(row.customerId || "");
    setTender(row.tender || "Cash");
    setUpiRef(row.upiRef || "");
    setCashReceived(row.cashReceived || "");
  };

  const syncDrafts = async () => {
    setSyncing(true);
    try {
      const { done, pending } = await syncAdminOfflineDrafts(adminOfflineHandlers());
      if (done.length) toast.toastSuccess(`Synced ${done.length} bill${done.length === 1 ? "" : "s"}.`);
      if (pending[0]?.error) setError(pending[0].error);
      await load();
    } finally {
      setSyncing(false);
    }
  };

  const holdBill = () => {
    if (!cart.length) {
      setError("Add a jar first.");
      return;
    }
    setHolds((rows) => [{ id: `${Date.now()}`, at: new Date().toISOString(), ...snapshot() }, ...rows].slice(0, 8));
    setCart([]);
    setUpiRef("");
    setCashReceived("");
    toast.toastSuccess("Bill held.");
  };

  const charge = async () => {
    if (!cart.length) {
      setError("Add a jar first.");
      return;
    }
    const ok = await confirm({ title: `Charge ${formatRupees(total)}?`, confirmLabel: "Charge", icon: "cash-outline" });
    if (!ok) return;
    setBusy(true);
    setError("");
    try {
      const bill = await createAdminWalkIn(null, {
        products: cart.map((line) => ({ product: line.productId, quantity: line.quantity })),
        customerId: customerId || undefined,
        name,
        phone,
        tender,
        upiRef,
        cashReceived: received || undefined,
        cashierName: user?.name,
      });
      setLastBill(bill);
      setOpenBill(bill);
      setCart([]);
      setUpiRef("");
      setCashReceived("");
      toast.toastSuccess("Bill saved.");
      await printAdminHtml(buildCounterBillHtml(bill));
      await load();
      if (seedCustomer?._id) navigation.navigate("AdminCustomers", { userId: String(seedCustomer._id) });
    } catch (err) {
      if (isLikelyOffline(err)) {
        const draft = tillDraftOrder({
          name,
          phone,
          cart,
          tender,
          upiRef,
          cashReceived: received,
          cashierName: user?.name,
        });
        await enqueueAdminOfflineDraft(
          "walk_in",
          {
            products: cart.map((line) => ({
              product: line.productId,
              productId: line.productId,
              name: line.name,
              price: line.price,
              quantity: line.quantity,
            })),
            customerId: customerId || undefined,
            name,
            phone,
            tender,
            upiRef,
            cashReceived: received || undefined,
            cashierName: user?.name,
          },
          `${name || "Walk-in"} ${formatRupees(total)}`
        );
        setCart([]);
        toast.toastSuccess("Saved on this phone.");
        setError("");
        await printAdminHtml(buildCounterBillHtml(draft));
      } else {
        setError(err.message || "Could not take the bill.");
      }
    } finally {
      setBusy(false);
    }
  };

  const voidBill = async (bill) => {
    if (!bill?._id) return;
    const ok = await confirm({ title: `Void ${orderRef(bill)}?`, confirmLabel: "Void", tone: "danger", icon: "close-outline" });
    if (!ok) return;
    setBusy(true);
    try {
      await voidAdminWalkIn(null, bill._id);
      if (lastBill?._id === bill._id) setLastBill(null);
      if (openBill?._id === bill._id) setOpenBill(null);
      toast.toastSuccess("Bill voided.");
      await load();
    } catch (err) {
      setError(err.message || "Could not void the bill.");
    } finally {
      setBusy(false);
    }
  };

  if (user && !user.isAdmin) {
    return (
      <AdminScreenShell style={styles.screen}>
        <KankregScrollPage scrollVariant="inner" showFooter={false} style={customerScrollFill}>
          <View style={styles.gatePanel}>
            <PremiumErrorBanner severity="warning" title={ADMIN_GATE.title} message={ADMIN_GATE.message} />
            <AdminButton label={ADMIN_GATE.backHome} icon="home-outline" variant="primary" onPress={() => navigateCustomerRoute(navigation, "Home")} />
          </View>
        </KankregScrollPage>
      </AdminScreenShell>
    );
  }

  const printDraftBill = () => {
    if (!cart.length) {
      setError("Add a jar first.");
      return;
    }
    printAdminHtml(
      buildCounterBillHtml(
        tillDraftOrder({
          name,
          phone,
          cart,
          tender,
          upiRef,
          cashReceived: received,
          cashierName: user?.name,
        })
      )
    );
  };

  const chargeBar = (
    <AdminButtonRow>
      <AdminButton label={`Charge ${formatRupees(total)}`} variant="primary" loading={busy} onPress={charge} />
      <AdminButton label="Print bill" variant="soft" disabled={busy || !cart.length} onPress={printDraftBill} />
      <AdminButton label="Hold" variant="soft" disabled={busy || !cart.length} onPress={holdBill} />
      {lastBill?._id ? (
        <AdminButton label="Print last" variant="soft" disabled={busy} onPress={() => printAdminHtml(buildCounterBillHtml(lastBill))} />
      ) : null}
      {lastBill?._id ? <AdminButton label="Void last" variant="danger" disabled={busy} onPress={() => voidBill(lastBill)} /> : null}
    </AdminButtonRow>
  );

  const searchCol = (
    <>
      <AdminPanel title="Customer" icon="person-outline" description="Walk-in guest or pick a saved phone.">
        <AdminInput label="Name" value={name} onChangeText={setName} placeholder="Walk-in" icon="person-outline" />
        <AdminInput label="Phone" value={phone} onChangeText={setPhone} placeholder="98765 43210" icon="call-outline" />
        {customerId ? (
          <AdminButtonRow>
            <AdminBadge label="Saved customer" tone="green" size="sm" />
            <AdminButton
              label="Clear"
              variant="ghost"
              size="xs"
              onPress={() => {
                setCustomerId("");
                setName("");
                setPhone("");
              }}
            />
          </AdminButtonRow>
        ) : (
          <AdminBadge label="Walk-in guest" tone="gold" size="sm" />
        )}
        {peopleHits.map((row) => (
          <AdminHitRow
            key={row._id}
            name={row.name || "Customer"}
            meta={`${row.phone || "No phone"} · ${formatRupees(row.spent || 0)}`}
            selected={String(customerId) === String(row._id)}
            onPress={() => {
              setCustomerId(row._id);
              setName(row.name || "");
              setPhone(row.phone || "");
            }}
          />
        ))}
      </AdminPanel>

      <AdminPanel title="Add a jar" icon="search-outline" meta={showOut ? "Showing out" : "In floor"}>
        <AdminInput value={query} onChangeText={setQuery} placeholder="Name or SKU" icon="search-outline" />
        <View style={styles.switchRow}>
          <Text style={styles.meta}>Show floor 0</Text>
          <AdminSwitch value={showOut} onChange={setShowOut} accessibilityLabel="Show out of floor stock" />
        </View>
        {loading ? <PremiumLoader size="sm" caption="Loading jars…" /> : null}
        {!loading && matches.length === 0 ? <PremiumEmptyState iconName="cube-outline" title="No jar matches." compact /> : null}
        {matches.map((product) => {
          const floor = Math.max(0, Number(product.stockCounter) || 0);
          const low = floor >= 1 && floor <= LOW;
          return (
            <AdminHitRow
              key={product._id}
              name={product.name}
              imageUri={productCoverUri(product)}
              meta={`Floor ${floor} · Online ${Math.max(0, Number(product.stockQty) || 0)} · ${formatRupees(product.price)}`}
              onPress={() => addLine(product)}
            >
              {low ? <AdminBadge label="Floor low" tone="gold" size="sm" /> : null}
              {floor < 1 ? <AdminBadge label="No floor stock" tone="red" size="sm" /> : null}
            </AdminHitRow>
          );
        })}
      </AdminPanel>
    </>
  );

  const billCol = (
    <>
      <AdminPanel title="Bill" icon="receipt-outline" meta={formatRupees(total)}>
        {cart.length === 0 ? <PremiumEmptyState iconName="receipt-outline" title="Nothing on the till yet." compact /> : null}
        {cart.map((line) => (
          <AdminLineCard
            key={line.productId}
            name={line.name}
            meta={`Floor ${line.stockCounter} · ${formatRupees(line.price)}`}
            amount={formatRupees(line.price * line.quantity)}
            onRemove={() => setQty(line.productId, 0)}
          >
            <AdminQtyStepper
              min={1}
              value={String(line.quantity)}
              onMinus={() => setQty(line.productId, line.quantity - 1)}
              onPlus={() => setQty(line.productId, Math.min(line.stockCounter, line.quantity + 1))}
              onChange={(text) => setQty(line.productId, Number.parseInt(text, 10) || 0)}
            />
          </AdminLineCard>
        ))}
        <AdminFilterTabs
          value={tender}
          onChange={setTender}
          items={[
            { key: "Cash", label: "Cash" },
            { key: "UPI", label: "UPI" },
          ]}
        />
        {tender === "UPI" ? <AdminInput label="UPI reference" value={upiRef} onChangeText={setUpiRef} placeholder="Optional" /> : null}
        {tender === "Cash" ? (
          <>
            <AdminInput label="Cash received" value={cashReceived} onChangeText={setCashReceived} numeric prefix="₹" />
            {received > 0 ? <Text style={styles.change}>Change {formatRupees(changeDue)}</Text> : null}
          </>
        ) : null}
        {!compact ? chargeBar : null}
      </AdminPanel>

      {holds.length ? (
        <AdminPanel title="Held" icon="pause-outline">
          {holds.map((row) => (
            <AdminHitRow
              key={row.id}
              name={row.name || "Walk-in"}
              meta={`${row.cart.length} jars · ${formatRupees(row.cart.reduce((n, line) => n + line.price * line.quantity, 0))}`}
              onPress={() => {
                restore(row);
                setHolds((list) => list.filter((item) => item.id !== row.id));
              }}
            />
          ))}
        </AdminPanel>
      ) : null}

      <AdminPanel title="Last bills" icon="time-outline" action="See all" onAction={() => navigation.navigate("AdminStoreSelling")}>
        {bills.length === 0 ? <PremiumEmptyState iconName="receipt-outline" title="No walk-in bills yet." compact /> : null}
        {bills.map((bill) => (
          <AdminHitRow
            key={bill._id}
            name={orderRef(bill)}
            meta={`${bill.shippingAddress?.fullName || "Walk-in"} · ${formatRupees(bill.totalPrice)} · ${formatShortDateTime(bill.createdAt)}`}
            selected={openBill?._id === bill._id}
            onPress={() => setOpenBill(bill)}
          >
            {bill.status === "cancelled" ? <AdminBadge label="Void" tone="red" size="sm" /> : <AdminBadge label={bill.paymentMethod || "Paid"} tone="green" size="sm" />}
          </AdminHitRow>
        ))}
        {openBill?._id ? (
          <AdminButtonRow>
            <AdminButton label="Print" variant="soft" onPress={() => printAdminHtml(buildCounterBillHtml(openBill))} />
            {openBill.status !== "cancelled" ? <AdminButton label="Void" variant="danger" onPress={() => voidBill(openBill)} /> : null}
          </AdminButtonRow>
        ) : null}
      </AdminPanel>
    </>
  );

  return (
    <AdminScreenShell style={styles.screen}>
      <KeyboardAvoidingView style={customerScrollFill} behavior={Platform.OS === "ios" ? "padding" : "height"}>
        <KankregScrollPage scrollVariant="admin" showFooter={false} style={customerScrollFill} keyboardShouldPersistTaps="handled">
          <KankregAdminShell
            navigation={navigation}
            route={route}
            title="Counter"
            subtitle="Walk-in bills sell from shop-floor stock only."
            headerRight={
              <View style={styles.headerActions}>
                <AdminButton label="Store selling" variant="soft" size="sm" onPress={() => navigation.navigate("AdminStoreSelling")} />
                <AdminButton label="Transfers" variant="soft" size="sm" onPress={() => navigation.navigate("AdminTransfers")} />
                <AdminButton label="Refresh" icon="refresh-outline" variant="ghost" size="sm" onPress={load} />
              </View>
            }
          >
            <SectionReveal delay={20} preset="fade-up">
              <View style={styles.panel}>
                <AdminAlerts error={error} onCloseError={() => setError("")} />
                <AdminOfflineBanner kinds={["walk_in"]} syncing={syncing} onSync={syncDrafts} onManage={() => navigation.navigate("AdminStoreSelling", { tab: "waiting" })} />
                <View style={adminTwoColStyle(compact)}>
                  <View style={adminTwoColMain(compact)}>{searchCol}</View>
                  <View style={adminTwoColAside(compact)}>{billCol}</View>
                </View>
              </View>
            </SectionReveal>
          </KankregAdminShell>
        </KankregScrollPage>
        {compact ? <AdminDeskDock>{chargeBar}</AdminDeskDock> : null}
      </KeyboardAvoidingView>
      {dialog}
    </AdminScreenShell>
  );
}

function createStyles(chrome, c, shadowPremium) {
  return StyleSheet.create({
    screen: { flex: 1 },
    panel: { ...adminShellContent(), gap: spacing.md, paddingBottom: spacing.xl },
    gatePanel: adminGatePanel(c, shadowPremium),
    headerActions: { flexDirection: "row", alignItems: "center", gap: 8, flexWrap: "wrap" },
    switchRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
    meta: { fontFamily: ADMIN_FONT.regular, color: chrome.inkFaint, fontSize: 12 },
    change: { fontFamily: ADMIN_FONT.semibold, color: chrome.goldDeep, fontSize: 14 },
  });
}
