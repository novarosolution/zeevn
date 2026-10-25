import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Image } from "expo-image";
import { Platform, Pressable, RefreshControl, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { ADMIN_GATE, ADMIN_SCREEN_COPY } from "../../content/adminContent";
import SectionReveal from "../../components/motion/SectionReveal";
import KankregScrollPage from "../../components/kankreg/KankregScrollPage";
import KankregAdminShell from "../../components/kankreg/KankregAdminShell";
import AdminScreenShell from "../../components/admin/AdminScreenShell";
import AdminAlerts from "../../components/admin/AdminAlerts";
import AdminButton from "../../components/admin/AdminButton";
import AdminProductCell from "../../components/admin/AdminProductCell";
import AdminSelect from "../../components/admin/AdminSelect";
import PremiumErrorBanner from "../../components/ui/PremiumErrorBanner";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";
import { fetchAdminProducts, saveAdminProductLine } from "../../services/adminService";
import { ADMIN_FONT, adminGatePanel, adminShellContent, useAdminChrome, useAdminCompactLayout } from "../../theme/adminLayout";
import { customerScrollFill } from "../../theme/screenLayout";
import { radius, spacing } from "../../theme/tokens";
import { productCoverUri } from "../../utils/adminProductHelpers";
import { isGiftProduct } from "../../utils/storefront";
import { navigateCustomerRoute } from "../../navigation/customerNavigate";

const COPY = ADMIN_SCREEN_COPY.categories;

const LINES = [
  { key: "ghee", label: "Ghee", aliases: ["ghee", "bilona", "a2"] },
  { key: "tel", label: "Tel", aliases: ["tel", "oil"] },
  { key: "masala", label: "Masala", aliases: ["masala"] },
  { key: "honey", label: "Honey", aliases: ["honey"] },
  { key: "gifts", label: "Gifts", aliases: ["gift", "gifting", "hamper", "combo"] },
];

const MOVE_OPTIONS = LINES.map((line) => ({ value: line.key, label: line.label }));

function haystack(p) {
  return [p?.name, p?.category, p?.productType].map((v) => String(v || "").toLowerCase()).join(" ");
}

function hits(text, alias) {
  const a = String(alias || "").toLowerCase();
  if (!a || !text) return false;
  if (a.length <= 2) return new RegExp(`\\b${a}\\b`, "i").test(text);
  return text.includes(a);
}

/** Gift first, then Ghee → Tel → Masala → Honey. Null is Other. */
function lineOf(p) {
  if (isGiftProduct(p) || LINES.find((l) => l.key === "gifts").aliases.some((a) => hits(haystack(p), a))) {
    return "gifts";
  }
  const text = haystack(p);
  for (const line of LINES) {
    if (line.key === "gifts") continue;
    if (hits(text, line.label) || line.aliases.some((a) => hits(text, a))) return line.key;
  }
  return null;
}

function emptyLine(label) {
  return COPY.emptyLine.replace("{line}", label);
}

export default function AdminCategoriesScreen({ navigation, route }) {
  const { user, token } = useAuth();
  const { colors: c, shadowPremium } = useTheme();
  const chrome = useAdminChrome();
  const compact = useAdminCompactLayout();
  const styles = useMemo(() => createStyles(chrome, c, shadowPremium), [chrome, c, shadowPremium]);

  const [products, setProducts] = useState([]);
  const [open, setOpen] = useState({});
  const [error, setError] = useState("");
  const [rowError, setRowError] = useState({});
  const [busyId, setBusyId] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      setError("");
      setProducts(await fetchAdminProducts(token));
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

  const groups = useMemo(() => {
    const buckets = { ghee: [], tel: [], masala: [], honey: [], gifts: [], other: [] };
    for (const p of products) {
      const key = lineOf(p);
      if (key && buckets[key]) buckets[key].push(p);
      else buckets.other.push(p);
    }
    return buckets;
  }, [products]);

  const moveJar = async (p, nextKey) => {
    const line = LINES.find((l) => l.key === nextKey);
    if (!line) return;
    if (lineOf(p) === nextKey && String(p.productType) === line.label && String(p.category) === line.label) return;
    const id = p._id;
    setBusyId(id);
    setRowError((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
    try {
      const row = await saveAdminProductLine(token, id, line.label);
      setProducts((prev) => prev.map((item) => (String(item._id) === String(id) ? row : item)));
    } catch (err) {
      setRowError((prev) => ({ ...prev, [id]: err.message || "Couldn't move this jar." }));
    } finally {
      setBusyId("");
    }
  };

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

  const renderJar = (p, currentKey) => {
    const id = p._id;
    const err = rowError[id];
    return (
      <View key={id} style={styles.jar}>
        <View style={styles.jarMain}>
          <AdminProductCell name={p.name} imageUri={productCoverUri(p)} />
          {p.sku ? <Text style={styles.sku}>{p.sku}</Text> : null}
        </View>
        <AdminSelect
          label={compact ? "Move" : undefined}
          value={currentKey}
          options={MOVE_OPTIONS}
          placeholder="Move to…"
          compact
          disabled={busyId === id}
          onChange={(key) => moveJar(p, key)}
          style={styles.picker}
        />
        {err ? <Text style={styles.rowErr}>{err}</Text> : null}
      </View>
    );
  };

  const renderLine = (key, label, jars, { hideIfEmpty = false } = {}) => {
    if (hideIfEmpty && !jars.length) return null;
    const expanded = Boolean(open[key]);
    const cover = jars.length ? productCoverUri(jars[0]) : "";
    return (
      <View key={key} style={compact ? styles.card : styles.block}>
        <Pressable
          onPress={() => setOpen((prev) => ({ ...prev, [key]: !prev[key] }))}
          style={({ pressed }) => [styles.head, pressed && styles.pressed]}
          accessibilityRole="button"
          accessibilityState={{ expanded }}
        >
          {cover ? (
            <Image source={{ uri: cover }} style={styles.cover} contentFit="cover" />
          ) : (
            <View style={[styles.cover, styles.coverEmpty]}>
              <Text style={styles.coverGlyph}>∷</Text>
            </View>
          )}
          <View style={styles.headCopy}>
            <Text style={styles.lineName}>{label}</Text>
            <Text style={styles.lineMeta}>
              {jars.length} {jars.length === 1 ? "jar" : "jars"}
            </Text>
          </View>
          <Ionicons name={expanded ? "chevron-up" : "chevron-down"} size={18} color={c.textMuted} />
        </Pressable>
        {expanded ? (
          <View style={styles.body}>
            {jars.length === 0 ? (
              <Text style={styles.empty}>{emptyLine(label)}</Text>
            ) : (
              jars.map((p) => renderJar(p, key === "other" ? null : key))
            )}
          </View>
        ) : null}
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
            {loading ? <Text style={styles.empty}>Loading…</Text> : null}
            {!loading
              ? LINES.map((line) => renderLine(line.key, line.label, groups[line.key] || []))
              : null}
            {!loading ? renderLine("other", "Other", groups.other, { hideIfEmpty: true }) : null}
          </View>
        </KankregAdminShell>
      </KankregScrollPage>
    </AdminScreenShell>
  );
}

function createStyles(chrome, c, shadowPremium) {
  return StyleSheet.create({
    screen: { flex: 1, width: "100%" },
    panel: { ...adminShellContent(), gap: spacing.sm, paddingBottom: spacing.xl },
    gatePanel: adminGatePanel(c, shadowPremium),
    gateCta: { marginTop: spacing.md, alignSelf: "flex-start" },
    block: {
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: chrome.lineSoft,
      paddingVertical: 8,
    },
    card: {
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: c.border,
      borderRadius: radius.lg,
      padding: spacing.sm,
      backgroundColor: c.surface,
    },
    head: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 6 },
    cover: { width: 48, height: 48, borderRadius: 10, backgroundColor: c.surfaceMuted },
    coverEmpty: { alignItems: "center", justifyContent: "center", borderWidth: StyleSheet.hairlineWidth, borderColor: c.border },
    coverGlyph: { color: c.textMuted, fontSize: 16 },
    headCopy: { flex: 1, minWidth: 0 },
    lineName: { color: chrome.ink, fontFamily: ADMIN_FONT.semibold, fontSize: 16 },
    lineMeta: { marginTop: 2, color: chrome.inkFaint, fontFamily: ADMIN_FONT.medium, fontSize: 12 },
    body: { paddingTop: 8, gap: 8 },
    empty: { color: chrome.inkFaint, fontFamily: ADMIN_FONT.medium, fontSize: 13, paddingVertical: 8 },
    jar: {
      flexDirection: "row",
      flexWrap: "wrap",
      alignItems: "center",
      gap: 10,
      paddingVertical: 6,
    },
    jarMain: { flex: 1, minWidth: 160 },
    sku: { marginTop: 2, color: chrome.inkFaint, fontFamily: ADMIN_FONT.regular, fontSize: 11 },
    picker: { width: 160, flexGrow: 0 },
    rowErr: { width: "100%", color: "#A8402C", fontFamily: ADMIN_FONT.medium, fontSize: 12 },
    pressed: { opacity: 0.72 },
  });
}
