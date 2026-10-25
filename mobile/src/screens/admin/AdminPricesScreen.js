import React, { useCallback, useEffect, useMemo, useState } from "react";
import { KeyboardAvoidingView, Platform, Pressable, RefreshControl, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
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
import PremiumEmptyState from "../../components/ui/PremiumEmptyState";
import PremiumErrorBanner from "../../components/ui/PremiumErrorBanner";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";
import { fetchAdminProducts, saveAdminProductPrices } from "../../services/adminService";
import { adminGatePanel, adminShellContent, useAdminChrome, useAdminCompactLayout } from "../../theme/adminLayout";
import { customerScrollFill } from "../../theme/screenLayout";
import { fonts, radius, spacing } from "../../theme/tokens";
import { productCoverUri } from "../../utils/adminProductHelpers";
import { formatRupees } from "../../utils/adminFormat";
import { getProductPricing } from "../../utils/storefront";
import { navigateCustomerRoute } from "../../navigation/customerNavigate";

const COPY = ADMIN_SCREEN_COPY.prices;
const TABS = [
  { key: "all", label: "All" },
  { key: "offer", label: "On offer" },
  { key: "sizes", label: "Has sizes" },
];

function rupees(value) {
  const n = Number.parseInt(String(value ?? "").trim(), 10);
  return Number.isFinite(n) ? Math.max(0, n) : 0;
}

function sizeRows(p) {
  return (Array.isArray(p?.variants) ? p.variants : [])
    .map((v) => ({
      label: String(v?.label || "").trim(),
      price: String(rupees(v?.price)),
      tag: String(v?.tag || "").trim(),
    }))
    .filter((v) => v.label);
}

function draftFrom(p) {
  const sizes = sizeRows(p);
  const price = sizes.length ? Math.min(...sizes.map((s) => rupees(s.price))) : rupees(p?.price);
  const mrpNum = p?.mrp == null || p?.mrp === "" ? NaN : Number(p.mrp);
  return {
    price: String(price),
    mrp: Number.isFinite(mrpNum) && mrpNum > 0 ? String(Math.round(mrpNum)) : "",
    sizes,
    open: false,
  };
}

function asPriced(p, draft) {
  return {
    ...p,
    price: rupees(draft.price),
    mrp: draft.mrp === "" ? null : rupees(draft.mrp),
    variants: draft.sizes.map((s) => ({ label: s.label, price: rupees(s.price), tag: s.tag })),
  };
}

function offerOf(p, draft) {
  const pricing = getProductPricing(asPriced(p, draft));
  if (pricing.from) return { label: `From ${formatRupees(pricing.price)}`, tone: "gold" };
  if (pricing.discountPct) return { label: `${pricing.discountPct}% off`, tone: "green" };
  return { label: "—", tone: "neutral" };
}

function isOnOffer(p, draft) {
  return Boolean(getProductPricing(asPriced(p, draft)).discountPct);
}

function isDirty(p, draft) {
  const start = draftFrom(p);
  if (start.price !== draft.price || start.mrp !== draft.mrp) return true;
  if (start.sizes.length !== draft.sizes.length) return true;
  return start.sizes.some((s, i) => s.price !== draft.sizes[i]?.price);
}

export default function AdminPricesScreen({ navigation, route }) {
  const { user, token } = useAuth();
  const { colors: c, shadowPremium } = useTheme();
  const chrome = useAdminChrome();
  const compact = useAdminCompactLayout();
  const styles = useMemo(() => createStyles(chrome, c, shadowPremium, compact), [chrome, c, shadowPremium, compact]);

  const [products, setProducts] = useState([]);
  const [drafts, setDrafts] = useState({});
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState("all");
  const [error, setError] = useState("");
  const [rowError, setRowError] = useState({});
  const [busyId, setBusyId] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      setError("");
      const list = await fetchAdminProducts(token);
      setProducts(list);
      setDrafts((prev) => {
        const next = {};
        for (const p of list) {
          next[p._id] = prev[p._id] && isDirty(p, prev[p._id]) ? prev[p._id] : draftFrom(p);
        }
        return next;
      });
    } catch (err) {
      setError(err.message || "Failed to load products.");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (!user?.isAdmin) return;
    load();
  }, [user, load]);

  const onPull = async () => {
    setRefreshing(true);
    try {
      await load();
    } finally {
      setRefreshing(false);
    }
  };

  const patchDraft = (id, patch) => {
    setDrafts((prev) => ({ ...prev, [id]: { ...prev[id], ...patch } }));
    setRowError((prev) => {
      if (!prev[id]) return prev;
      const next = { ...prev };
      delete next[id];
      return next;
    });
  };

  const setSizePrice = (id, index, text) => {
    setDrafts((prev) => {
      const d = prev[id];
      if (!d) return prev;
      const sizes = d.sizes.map((s, i) => (i === index ? { ...s, price: text } : s));
      const low = sizes.length ? String(Math.min(...sizes.map((s) => rupees(s.price)))) : d.price;
      return { ...prev, [id]: { ...d, sizes, price: low } };
    });
    setRowError((prev) => {
      if (!prev[id]) return prev;
      const next = { ...prev };
      delete next[id];
      return next;
    });
  };

  const saveRow = async (p) => {
    const id = p._id;
    const draft = drafts[id] || draftFrom(p);
    const price = draft.sizes.length ? Math.min(...draft.sizes.map((s) => rupees(s.price))) : rupees(draft.price);
    const mrpText = String(draft.mrp || "").trim();
    if (mrpText !== "") {
      const mrp = rupees(mrpText);
      if (mrp <= price) {
        setRowError((prev) => ({ ...prev, [id]: COPY.mrpError }));
        return;
      }
    }
    setBusyId(id);
    setRowError((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
    try {
      const row = await saveAdminProductPrices(token, id, {
        price,
        mrp: mrpText === "" ? null : rupees(mrpText),
        variants: draft.sizes.map((s) => ({ label: s.label, price: rupees(s.price), tag: s.tag })),
      });
      setProducts((prev) => prev.map((item) => (String(item._id) === String(id) ? row : item)));
      setDrafts((prev) => ({ ...prev, [id]: { ...draftFrom(row), open: prev[id]?.open } }));
    } catch (err) {
      setRowError((prev) => ({ ...prev, [id]: err.message || "Couldn't save this price." }));
    } finally {
      setBusyId("");
    }
  };

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    return products.filter((p) => {
      const draft = drafts[p._id] || draftFrom(p);
      if (tab === "offer" && !isOnOffer(p, draft)) return false;
      if (tab === "sizes" && !draft.sizes.length) return false;
      if (!q) return true;
      return [p.name, p.sku].some((v) => String(v || "").toLowerCase().includes(q));
    });
  }, [products, drafts, search, tab]);

  const tabItems = TABS.map((item) => ({
    ...item,
    count:
      item.key === "all"
        ? products.length
        : products.filter((p) => {
            const draft = drafts[p._id] || draftFrom(p);
            return item.key === "offer" ? isOnOffer(p, draft) : draft.sizes.length > 0;
          }).length,
  }));

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

  const renderSizes = (p, draft, id) =>
    draft.sizes.map((size, idx) => (
      <View key={`${id}-${size.label}-${idx}`} style={styles.sizeRow}>
        <Text style={styles.sizeLabel} numberOfLines={1}>
          {size.label}
        </Text>
        <AdminInput
          label="Price"
          value={size.price}
          onChangeText={(t) => setSizePrice(id, idx, t)}
          integer
          prefix="₹"
          editable={busyId !== id}
          style={styles.priceField}
        />
      </View>
    ));

  const renderRow = (p) => {
    const id = p._id;
    const draft = drafts[id] || draftFrom(p);
    const offer = offerOf(p, draft);
    const hasSizes = draft.sizes.length > 0;
    const busy = busyId === id;
    const dirty = isDirty(p, draft);
    const err = rowError[id];

    if (compact) {
      return (
        <View key={id} style={styles.card}>
          <View style={styles.cardTop}>
            <View style={styles.cardHead}>
              <AdminProductCell
                name={p.name}
                imageUri={productCoverUri(p)}
                meta={`Floor ${Math.max(0, Number(p.stockCounter) || 0)}`}
              />
              <Text style={styles.sku}>{p.sku || "No SKU"}</Text>
            </View>
            <AdminBadge label={offer.label} tone={offer.tone} size="sm" />
          </View>
          <View style={styles.stack}>
            <AdminInput
              label="Selling price"
              value={draft.price}
              onChangeText={hasSizes ? undefined : (t) => patchDraft(id, { price: t })}
              integer
              prefix="₹"
              editable={!hasSizes && !busy}
              style={styles.stackField}
            />
            <AdminInput
              label="MRP"
              value={draft.mrp}
              onChangeText={(t) => patchDraft(id, { mrp: t })}
              integer
              prefix="₹"
              placeholder="Optional"
              editable={!busy}
              error={err === COPY.mrpError ? err : undefined}
              style={styles.stackField}
            />
          </View>
          {hasSizes ? (
            <View style={styles.disclose}>
              <Pressable
                onPress={() => patchDraft(id, { open: !draft.open })}
                style={({ pressed }) => [styles.discloseBtn, pressed && styles.pressed]}
                accessibilityRole="button"
              >
                <Text style={styles.discloseLabel}>
                  {draft.sizes.length} {draft.sizes.length === 1 ? "size" : "sizes"}
                </Text>
                <Ionicons name={draft.open ? "chevron-up" : "chevron-down"} size={16} color={c.textMuted} />
              </Pressable>
              {draft.open ? renderSizes(p, draft, id) : null}
            </View>
          ) : (
            <Text style={styles.muted}>No sizes</Text>
          )}
          {err && err !== COPY.mrpError ? <Text style={styles.rowErr}>{err}</Text> : null}
          <AdminButton
            label={busy ? "Saving…" : "Save"}
            variant="primary"
            onPress={() => saveRow(p)}
            loading={busy}
            disabled={busy || !dirty}
            fullWidth
          />
        </View>
      );
    }

    return (
      <View key={id} style={styles.block}>
        <View style={styles.row}>
          <View style={styles.nameCol}>
            <AdminProductCell
              name={p.name}
              imageUri={productCoverUri(p)}
              meta={`Floor ${Math.max(0, Number(p.stockCounter) || 0)}`}
            />
          </View>
          <Text style={styles.skuCol} numberOfLines={1}>
            {p.sku || "—"}
          </Text>
          <AdminInput
            label="Selling"
            value={draft.price}
            onChangeText={hasSizes ? undefined : (t) => patchDraft(id, { price: t })}
            integer
            prefix="₹"
            editable={!hasSizes && !busy}
            style={styles.colPrice}
          />
          <AdminInput
            label="MRP"
            value={draft.mrp}
            onChangeText={(t) => patchDraft(id, { mrp: t })}
            integer
            prefix="₹"
            placeholder="—"
            editable={!busy}
            error={err === COPY.mrpError ? err : undefined}
            style={styles.colPrice}
          />
          <Pressable
            onPress={hasSizes ? () => patchDraft(id, { open: !draft.open }) : undefined}
            style={styles.colSizes}
            accessibilityRole={hasSizes ? "button" : undefined}
          >
            <Text style={styles.sizesText}>{hasSizes ? `${draft.sizes.length}` : "—"}</Text>
          </Pressable>
          <View style={styles.colOffer}>
            <AdminBadge label={offer.label} tone={offer.tone} size="sm" />
          </View>
          <AdminButton
            label={busy ? "Saving…" : "Save"}
            variant="primary"
            size="sm"
            onPress={() => saveRow(p)}
            loading={busy}
            disabled={busy || !dirty}
          />
        </View>
        {hasSizes && draft.open ? <View style={styles.sizeBox}>{renderSizes(p, draft, id)}</View> : null}
        {err && err !== COPY.mrpError ? <Text style={styles.rowErr}>{err}</Text> : null}
      </View>
    );
  };

  return (
    <AdminScreenShell style={styles.screen}>
      <KeyboardAvoidingView style={customerScrollFill} behavior={Platform.OS === "ios" ? "padding" : "height"}>
        <KankregScrollPage
          scrollVariant="admin"
          showFooter={false}
          style={customerScrollFill}
          keyboardShouldPersistTaps="handled"
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
              <AdminFilterTabs items={tabItems} value={tab} onChange={setTab} />
              <AdminInput
                label="Search"
                value={search}
                onChangeText={setSearch}
                placeholder="Name or SKU"
                icon="search-outline"
              />

              {loading ? <Text style={styles.muted}>Loading…</Text> : null}

              {!loading && products.length === 0 ? (
                <PremiumEmptyState
                  iconName="pricetag-outline"
                  title={COPY.empty}
                  ctaLabel="Add product"
                  ctaIconLeft="add-outline"
                  onCtaPress={() => navigation.navigate("AdminAddProduct", { product: null })}
                  compact
                />
              ) : null}

              {!loading && products.length > 0 && visible.length === 0 ? (
                <PremiumEmptyState iconName="search-outline" title="No products match that search" compact />
              ) : null}

              {!loading && visible.length > 0 && !compact ? (
                <View style={styles.head}>
                  <Text style={[styles.headText, styles.nameCol]}>Product</Text>
                  <Text style={[styles.headText, styles.skuCol]}>SKU</Text>
                  <Text style={[styles.headText, styles.colPrice]}>Selling price</Text>
                  <Text style={[styles.headText, styles.colPrice]}>MRP</Text>
                  <Text style={[styles.headText, styles.colSizes]}>Sizes</Text>
                  <Text style={[styles.headText, styles.colOffer]}>Offer</Text>
                  <Text style={[styles.headText, { width: 72 }]} />
                </View>
              ) : null}

              {!loading ? visible.map(renderRow) : null}
            </View>
          </KankregAdminShell>
        </KankregScrollPage>
      </KeyboardAvoidingView>
    </AdminScreenShell>
  );
}

function createStyles(chrome, c, shadowPremium, compact) {
  return StyleSheet.create({
    screen: { flex: 1, width: "100%" },
    panel: { ...adminShellContent(), gap: spacing.sm, paddingBottom: spacing.xl },
    gatePanel: adminGatePanel(c, shadowPremium),
    gateCta: { marginTop: spacing.md, alignSelf: "flex-start" },
    muted: { color: chrome.inkFaint, fontFamily: fonts.medium, fontSize: 12 },
    sku: { marginTop: 4, color: chrome.inkFaint, fontFamily: fonts.regular, fontSize: 11 },
    head: { flexDirection: "row", alignItems: "center", gap: 10, paddingBottom: 6 },
    headText: {
      fontSize: 10,
      letterSpacing: 0.7,
      textTransform: "uppercase",
      color: chrome.inkFaint,
      fontFamily: fonts.semibold,
    },
    block: {
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: chrome.lineSoft,
      paddingVertical: 10,
    },
    row: { flexDirection: "row", alignItems: "flex-end", gap: 10 },
    nameCol: { flex: 1.3, minWidth: 140 },
    skuCol: { width: 96, color: chrome.inkSoft, fontFamily: fonts.regular, fontSize: 12, paddingBottom: 12 },
    colPrice: { width: 112, flexGrow: 0 },
    colSizes: { width: 56, alignItems: "center", paddingBottom: 10 },
    colOffer: { width: 104, alignItems: "flex-start", paddingBottom: 8 },
    sizesText: { color: chrome.ink, fontFamily: fonts.semibold, fontSize: 13 },
    sizeBox: { marginTop: 8, marginLeft: compact ? 0 : 8, gap: 8 },
    sizeRow: { flexDirection: "row", alignItems: "flex-end", gap: 10 },
    sizeLabel: { flex: 1, minWidth: 80, paddingBottom: 12, color: chrome.ink, fontFamily: fonts.semibold, fontSize: 13 },
    priceField: { width: 120 },
    rowErr: { marginTop: 6, color: "#A8402C", fontFamily: fonts.medium, fontSize: 12 },
    card: {
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: c.border,
      borderRadius: radius.lg,
      padding: spacing.md,
      backgroundColor: c.surface,
      gap: spacing.sm,
    },
    cardTop: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", gap: spacing.sm },
    cardHead: { flex: 1, minWidth: 0 },
    stack: { gap: spacing.sm },
    stackField: { width: "100%" },
    disclose: { gap: 8 },
    discloseBtn: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: 4 },
    discloseLabel: { color: chrome.ink, fontFamily: fonts.semibold, fontSize: 13 },
    pressed: { opacity: 0.72 },
  });
}
