import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Platform, Pressable, RefreshControl, StyleSheet, Text, View } from "react-native";
import { ADMIN_GATE, ADMIN_SCREEN_COPY } from "../../content/adminContent";
import SectionReveal from "../../components/motion/SectionReveal";
import KankregScrollPage from "../../components/kankreg/KankregScrollPage";
import KankregAdminShell from "../../components/kankreg/KankregAdminShell";
import AdminScreenShell from "../../components/admin/AdminScreenShell";
import AdminAlerts from "../../components/admin/AdminAlerts";
import AdminBadge from "../../components/admin/AdminBadge";
import AdminButton from "../../components/admin/AdminButton";
import AdminInput from "../../components/admin/AdminInput";
import AdminProductCell from "../../components/admin/AdminProductCell";
import AdminToggleRow from "../../components/admin/AdminToggleRow";
import PremiumButton from "../../components/ui/PremiumButton";
import PremiumEmptyState from "../../components/ui/PremiumEmptyState";
import PremiumErrorBanner from "../../components/ui/PremiumErrorBanner";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";
import {
  fetchAdminHomeView,
  fetchAdminProducts,
  saveAdminProductHomeFlag,
  saveAdminProductHomeOrder,
  saveAdminProductHomeSection,
} from "../../services/adminService";
import { adminGatePanel, adminShellContent, useAdminChrome, useAdminCompactLayout } from "../../theme/adminLayout";
import { customerScrollFill } from "../../theme/screenLayout";
import { fonts, radius, spacing } from "../../theme/tokens";
import { formatRupees } from "../../utils/adminFormat";
import { productCoverUri } from "../../utils/adminProductHelpers";
import { navigateCustomerRoute } from "../../navigation/customerNavigate";

const COPY = ADMIN_SCREEN_COPY.homeSections;
const PRIME = "Prime Products";

function sectionKey(product) {
  return String(product?.homeSection || "").trim() || PRIME;
}

function sortJars(a, b) {
  const oa = Number(a.homeOrder) || 0;
  const ob = Number(b.homeOrder) || 0;
  if (oa !== ob) return oa - ob;
  return String(a.name || "").localeCompare(String(b.name || ""), "en", { sensitivity: "base" });
}

function railPill(product) {
  if (product?.isPublished === false) return { label: "Draft", tone: "gold" };
  if (product?.comingSoon) return { label: "Coming soon", tone: "purple" };
  if (product?.showOnHome === false) return { label: "Hidden", tone: "neutral" };
  return { label: "On home", tone: "green" };
}

function mergeRows(prev, rows) {
  const map = new Map(rows.map((row) => [String(row._id || row.id), row]));
  return prev.map((item) => map.get(String(item._id || item.id)) || item);
}

export default function AdminHomeSectionsScreen({ navigation, route }) {
  const { user, token } = useAuth();
  const { colors: c, shadowPremium } = useTheme();
  const chrome = useAdminChrome();
  const compact = useAdminCompactLayout();
  const styles = useMemo(() => createStyles(chrome, c, shadowPremium), [chrome, c, shadowPremium]);

  const [products, setProducts] = useState([]);
  const [primeTitle, setPrimeTitle] = useState("");
  const [draftName, setDraftName] = useState({});
  const [error, setError] = useState("");
  const [rowError, setRowError] = useState({});
  const [busyKey, setBusyKey] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      setError("");
      const [list, home] = await Promise.all([
        fetchAdminProducts(token),
        fetchAdminHomeView(token).catch(() => null),
      ]);
      setProducts(Array.isArray(list) ? list : []);
      setPrimeTitle(String(home?.primeSectionTitle || "").trim());
    } catch (err) {
      setError(err.message || "Couldn't load home sections.");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (user?.isAdmin) load();
  }, [user?.isAdmin, load]);

  const groups = useMemo(() => {
    const buckets = new Map();
    for (const product of products) {
      const key = sectionKey(product);
      if (!buckets.has(key)) buckets.set(key, []);
      buckets.get(key).push(product);
    }
    const keys = [...buckets.keys()].sort((a, b) => {
      if (a === PRIME) return -1;
      if (b === PRIME) return 1;
      return a.localeCompare(b, "en", { sensitivity: "base" });
    });
    return keys.map((key) => ({
      key,
      heading: key === PRIME && primeTitle ? primeTitle : key,
      jars: buckets.get(key).slice().sort(sortJars),
    }));
  }, [products, primeTitle]);

  const onPull = async () => {
    setRefreshing(true);
    try {
      await load();
    } finally {
      setRefreshing(false);
    }
  };

  const setErr = (id, message) => {
    setRowError((prev) => {
      const next = { ...prev };
      if (message) next[id] = message;
      else delete next[id];
      return next;
    });
  };

  const moveJar = async (group, index, dir) => {
    if (busyKey) return;
    const nextIndex = index + dir;
    if (nextIndex < 0 || nextIndex >= group.jars.length) return;
    const ordered = [...group.jars];
    const [item] = ordered.splice(index, 1);
    ordered.splice(nextIndex, 0, item);
    const writes = ordered
      .map((jar, homeOrder) => ({ jar, homeOrder }))
      .filter(({ jar, homeOrder }) => Number(jar.homeOrder) !== homeOrder);
    if (!writes.length) return;
    setBusyKey(group.key);
    setErr(group.key, "");
    try {
      const rows = [];
      for (const { jar, homeOrder } of writes) {
        rows.push(await saveAdminProductHomeOrder(token, jar._id, homeOrder));
      }
      setProducts((prev) => mergeRows(prev, rows));
    } catch (err) {
      setErr(group.key, err.message || "Couldn't reorder this rail.");
    } finally {
      setBusyKey("");
    }
  };

  const toggleHome = async (product) => {
    if (busyKey) return;
    const id = String(product._id);
    setBusyKey(id);
    setErr(id, "");
    try {
      const row = await saveAdminProductHomeFlag(token, id, product.showOnHome === false);
      setProducts((prev) => mergeRows(prev, [row]));
    } catch (err) {
      setErr(id, err.message || "Couldn't update this jar.");
    } finally {
      setBusyKey("");
    }
  };

  const renameGroup = async (group) => {
    if (busyKey) return;
    const next = String(draftName[group.key] ?? group.key).trim().slice(0, 40) || PRIME;
    if (next === group.key) return;
    setBusyKey(group.key);
    setErr(group.key, "");
    try {
      const rows = [];
      for (const jar of group.jars) {
        rows.push(await saveAdminProductHomeSection(token, jar._id, next));
      }
      setProducts((prev) => mergeRows(prev, rows));
      setDraftName((prev) => {
        const copy = { ...prev };
        delete copy[group.key];
        copy[next] = next;
        return copy;
      });
    } catch (err) {
      setErr(group.key, err.message || "Couldn't rename this rail.");
    } finally {
      setBusyKey("");
    }
  };

  const openEditor = (product) => navigation.navigate("AdminAddProduct", { product });

  if (user && !user.isAdmin) {
    return (
      <AdminScreenShell style={styles.screen}>
        <KankregScrollPage scrollVariant="inner" showFooter={false} style={customerScrollFill}>
          <SectionReveal delay={40} preset="fade-up">
            <View style={styles.gatePanel}>
              <PremiumErrorBanner severity="warning" title={ADMIN_GATE.title} message={ADMIN_GATE.message} />
              <PremiumButton
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

  const renderJar = (group, product, index) => {
    const id = String(product._id);
    const pill = railPill(product);
    const busy = Boolean(busyKey);
    const err = rowError[id];
    return (
      <View key={id} style={compact ? styles.card : styles.row}>
        <Pressable
          onPress={() => openEditor(product)}
          style={({ pressed }) => [styles.jarMain, pressed && styles.pressed]}
          accessibilityRole="button"
          accessibilityLabel={`Edit ${product.name || "product"}`}
        >
          <View style={styles.cell}>
            <AdminProductCell name={product.name || "Jar"} imageUri={productCoverUri(product)} />
          </View>
          <Text style={styles.price}>{formatRupees(product.price)}</Text>
          <AdminBadge label={pill.label} tone={pill.tone} size="sm" />
        </Pressable>
        <View style={styles.actions}>
          <AdminButton
            icon="chevron-up-outline"
            title="Move up"
            variant="soft"
            size="sm"
            disabled={busy || index === 0}
            onPress={() => moveJar(group, index, -1)}
          />
          <AdminButton
            icon="chevron-down-outline"
            title="Move down"
            variant="soft"
            size="sm"
            disabled={busy || index === group.jars.length - 1}
            onPress={() => moveJar(group, index, 1)}
          />
        </View>
        <AdminToggleRow
          title="Show on home"
          subtitle={product.isPublished === false ? "Saves now. The shop waits until this jar is published." : undefined}
          value={product.showOnHome !== false}
          onValueChange={() => toggleHome(product)}
          isLast
        />
        {err ? <Text style={styles.rowErr}>{err}</Text> : null}
      </View>
    );
  };

  const renderGroup = (group) => {
    const allHidden = group.jars.every((jar) => jar.showOnHome === false);
    const name = draftName[group.key] ?? group.key;
    const canRename = String(name).trim().slice(0, 40) && String(name).trim().slice(0, 40) !== group.key;
    return (
      <View key={group.key} style={compact ? styles.blockCard : styles.block}>
        <Text style={styles.heading}>{group.heading}</Text>
        {allHidden ? <Text style={styles.hint}>{COPY.hiddenRail}</Text> : null}
        <View style={styles.rename}>
          <AdminInput
            label="Section name"
            value={name}
            onChangeText={(value) => setDraftName((prev) => ({ ...prev, [group.key]: value.slice(0, 40) }))}
            maxLength={40}
            style={styles.renameField}
          />
          <AdminButton
            label="Rename"
            variant="soft"
            size="sm"
            disabled={Boolean(busyKey) || !canRename}
            loading={busyKey === group.key}
            onPress={() => renameGroup(group)}
          />
        </View>
        {rowError[group.key] ? <Text style={styles.rowErr}>{rowError[group.key]}</Text> : null}
        <View style={styles.jars}>{group.jars.map((product, index) => renderJar(group, product, index))}</View>
      </View>
    );
  };

  return (
    <AdminScreenShell style={styles.screen}>
      <KankregScrollPage
        scrollVariant="admin"
        showFooter={false}
        style={customerScrollFill}
        refreshControl={
          Platform.OS === "web" ? undefined : <RefreshControl refreshing={refreshing} onRefresh={onPull} />
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
            {loading ? <Text style={styles.muted}>Loading…</Text> : null}
            {!loading && products.length === 0 ? (
              <PremiumEmptyState
                iconName="cube-outline"
                title={COPY.empty}
                compact
                ctaLabel="Add product"
                onCtaPress={() => navigation.navigate("AdminAddProduct", { product: null })}
              />
            ) : null}
            {!loading ? groups.map(renderGroup) : null}
          </View>
        </KankregAdminShell>
      </KankregScrollPage>
    </AdminScreenShell>
  );
}

function createStyles(chrome, c, shadowPremium) {
  return StyleSheet.create({
    screen: { flex: 1, width: "100%", alignSelf: "center", maxWidth: "100%" },
    panel: { ...adminShellContent(), gap: spacing.md, paddingBottom: spacing.xl },
    gatePanel: adminGatePanel(c, shadowPremium),
    gateCta: { marginTop: spacing.md, alignSelf: "flex-start" },
    muted: { color: chrome.inkFaint, fontFamily: fonts.medium, fontSize: 13 },
    block: {
      gap: 10,
      paddingBottom: spacing.md,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: chrome.lineSoft,
    },
    blockCard: {
      gap: 10,
      padding: 12,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: chrome.line,
      borderRadius: radius.lg,
      backgroundColor: chrome.card,
    },
    heading: { fontSize: 17, color: chrome.ink, fontFamily: fonts.semibold },
    hint: { fontSize: 12.5, color: chrome.inkFaint, fontFamily: fonts.regular },
    rename: { flexDirection: "row", alignItems: "flex-end", gap: 8 },
    renameField: { flex: 1, minWidth: 0 },
    jars: { gap: 8 },
    row: {
      gap: 8,
      paddingVertical: 8,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: chrome.lineSoft,
    },
    card: {
      gap: 8,
      padding: 10,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: chrome.lineSoft,
      borderRadius: radius.md,
      backgroundColor: chrome.paper,
    },
    jarMain: { flexDirection: "row", flexWrap: "wrap", alignItems: "center", gap: 10 },
    cell: { flex: 1, minWidth: 140 },
    price: { fontSize: 13.5, color: chrome.ink, fontFamily: fonts.semibold },
    actions: { flexDirection: "row", gap: 8 },
    rowErr: { color: "#A8402C", fontFamily: fonts.medium, fontSize: 12 },
    pressed: { opacity: 0.82 },
  });
}
