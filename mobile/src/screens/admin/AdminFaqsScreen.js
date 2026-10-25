import React, { useCallback, useEffect, useMemo, useState } from "react";
import { KeyboardAvoidingView, Platform, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ADMIN_GATE, ADMIN_SCREEN_COPY } from "../../content/adminContent";
import SectionReveal from "../../components/motion/SectionReveal";
import KankregScrollPage from "../../components/kankreg/KankregScrollPage";
import KankregAdminShell from "../../components/kankreg/KankregAdminShell";
import AdminScreenShell from "../../components/admin/AdminScreenShell";
import AdminAlerts from "../../components/admin/AdminAlerts";
import AdminButton from "../../components/admin/AdminButton";
import AdminInput from "../../components/admin/AdminInput";
import AdminToggleRow from "../../components/admin/AdminToggleRow";
import PremiumErrorBanner from "../../components/ui/PremiumErrorBanner";
import PremiumLoader from "../../components/ui/PremiumLoader";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";
import { fetchAdminFaqs, updateAdminFaqs } from "../../services/adminService";
import { ADMIN_FONT, adminGatePanel, adminShellContent, useAdminChrome, useAdminCompactLayout } from "../../theme/adminLayout";
import { customerScrollFill } from "../../theme/screenLayout";
import { radius, spacing } from "../../theme/tokens";
import { navigateCustomerRoute } from "../../navigation/customerNavigate";

const COPY = ADMIN_SCREEN_COPY.faqs;
const QUESTION_MAX = 160;
const ANSWER_MAX = 800;

function nextId() {
  return `faq-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

function rewrite(rows) {
  return rows.map((row, order) => ({ ...row, order }));
}

function rowsFromPayload(data) {
  const items = Array.isArray(data?.items) ? data.items : [];
  return rewrite(
    items.map((item) => ({
      id: nextId(),
      question: String(item.question || ""),
      answer: String(item.answer || ""),
      order: Number.isFinite(Number(item.order)) ? Number(item.order) : 0,
      enabled: item.enabled !== false,
    }))
  );
}

export default function AdminFaqsScreen({ navigation, route }) {
  const { user, token } = useAuth();
  const { colors: c, shadowPremium } = useTheme();
  const chrome = useAdminChrome();
  const compact = useAdminCompactLayout();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => createStyles(chrome, c, shadowPremium), [chrome, c, shadowPremium]);

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      setError("");
      const data = await fetchAdminFaqs(token);
      setRows(rowsFromPayload(data));
    } catch (err) {
      setError(err.message || "Unable to load FAQs.");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (user?.isAdmin) load();
  }, [user?.isAdmin, load]);

  const patchRow = (index, patch) => {
    setRows((prev) => prev.map((row, i) => (i === index ? { ...row, ...patch } : row)));
  };

  const moveRow = (index, delta) => {
    setRows((prev) => {
      const next = prev.slice();
      const target = index + delta;
      if (target < 0 || target >= next.length) return prev;
      const [row] = next.splice(index, 1);
      next.splice(target, 0, row);
      return rewrite(next);
    });
  };

  const setOrderNumber = (index, value) => {
    setRows((prev) => {
      const next = prev.map((row, i) => {
        if (i !== index) return row;
        const n = Math.floor(Number(value));
        return { ...row, order: Number.isFinite(n) ? n : i };
      });
      next.sort((a, b) => Number(a.order) - Number(b.order));
      return rewrite(next);
    });
  };

  const addRow = () => {
    setRows((prev) =>
      rewrite([
        ...prev,
        { id: nextId(), question: "", answer: "", order: prev.length, enabled: true },
      ])
    );
  };

  const removeRow = (index) => {
    setRows((prev) => rewrite(prev.filter((_, i) => i !== index)));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError("");
      const saved = await updateAdminFaqs(token, {
        items: rows.map((row, order) => ({
          question: String(row.question || "").trim(),
          answer: String(row.answer || "").trim(),
          order,
          enabled: row.enabled !== false,
        })),
      });
      setRows(rowsFromPayload(saved));
    } catch (err) {
      setError(err.message || "Unable to save FAQs.");
    } finally {
      setSaving(false);
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

  const saveBar = (
    <View style={[styles.saveBar, compact && styles.saveDock, compact && { paddingBottom: Math.max(insets.bottom, 10) }]}>
      <AdminButton
        label={saving ? "Saving…" : "Save"}
        icon="save-outline"
        variant="primary"
        size="md"
        loading={saving}
        disabled={saving}
        fullWidth={compact}
        onPress={handleSave}
      />
    </View>
  );

  return (
    <AdminScreenShell style={styles.screen}>
      <KeyboardAvoidingView style={customerScrollFill} behavior={Platform.OS === "ios" ? "padding" : "height"}>
        <KankregScrollPage
          scrollVariant="admin"
          showFooter={false}
          style={customerScrollFill}
          keyboardShouldPersistTaps="handled"
          stickyFooterExtra={compact ? 72 : 0}
        >
          <KankregAdminShell
            navigation={navigation}
            route={route}
            title={COPY.title}
            subtitle={COPY.subtitle}
            headerRight={
              compact ? null : (
                <AdminButton
                  label={saving ? "Saving…" : "Save"}
                  icon="save-outline"
                  variant="primary"
                  size="sm"
                  loading={saving}
                  disabled={saving}
                  onPress={handleSave}
                />
              )
            }
          >
            <View style={styles.panel}>
              <AdminAlerts error={error} onCloseError={() => setError("")} />
              <Text style={styles.hint}>
                These show under live chat on Help. Product-page questions stay on the product.
              </Text>
              {loading ? <PremiumLoader size="sm" caption="Loading FAQs…" /> : null}
              {!loading
                ? rows.map((row, index) => (
                    <View key={row.id} style={styles.card}>
                      <View style={styles.cardHead}>
                        <Text style={styles.cardTitle}>Question {index + 1}</Text>
                        <View style={styles.cardActions}>
                          <AdminButton
                            icon="chevron-up-outline"
                            title="Move up"
                            variant="soft"
                            size="sm"
                            disabled={index === 0 || saving}
                            onPress={() => moveRow(index, -1)}
                          />
                          <AdminButton
                            icon="chevron-down-outline"
                            title="Move down"
                            variant="soft"
                            size="sm"
                            disabled={index === rows.length - 1 || saving}
                            onPress={() => moveRow(index, 1)}
                          />
                          <AdminButton
                            icon="trash-outline"
                            title="Remove"
                            variant="ghost"
                            size="sm"
                            disabled={saving}
                            onPress={() => removeRow(index)}
                          />
                        </View>
                      </View>
                      <AdminInput
                        label="Question"
                        value={row.question}
                        onChangeText={(value) => patchRow(index, { question: value })}
                        maxLength={QUESTION_MAX}
                        placeholder="Required"
                        autoCapitalize="sentences"
                      />
                      <AdminInput
                        label="Answer"
                        value={row.answer}
                        onChangeText={(value) => patchRow(index, { answer: value })}
                        maxLength={ANSWER_MAX}
                        placeholder="Required"
                        multiline
                        numberOfLines={4}
                        autoCapitalize="sentences"
                      />
                      <AdminInput
                        label="Order"
                        value={String(row.order)}
                        onChangeText={(value) => setOrderNumber(index, value)}
                        integer
                      />
                      <AdminToggleRow
                        title="Enabled"
                        subtitle="Off stays saved and does not show on Help"
                        value={row.enabled !== false}
                        onValueChange={(value) => patchRow(index, { enabled: value })}
                        isLast
                      />
                    </View>
                  ))
                : null}
              {!loading && rows.length === 0 ? <Text style={styles.empty}>{COPY.empty}</Text> : null}
              {!loading ? (
                <AdminButton label="Add" icon="add-outline" variant="soft" onPress={addRow} disabled={saving} />
              ) : null}
              {!compact && !loading ? saveBar : null}
            </View>
          </KankregAdminShell>
        </KankregScrollPage>
        {compact ? saveBar : null}
      </KeyboardAvoidingView>
    </AdminScreenShell>
  );
}

function createStyles(chrome, c, shadowPremium) {
  return StyleSheet.create({
    screen: { flex: 1, width: "100%", alignSelf: "center", maxWidth: "100%" },
    panel: { ...adminShellContent(), gap: spacing.sm },
    gatePanel: adminGatePanel(c, shadowPremium),
    gateCta: { marginTop: spacing.md, alignSelf: "flex-start" },
    hint: { fontSize: 13, lineHeight: 18, color: chrome.inkFaint, fontFamily: ADMIN_FONT.regular },
    empty: { fontSize: 13.5, color: chrome.inkSoft, fontFamily: ADMIN_FONT.medium },
    card: {
      backgroundColor: chrome.card,
      borderWidth: 1,
      borderColor: chrome.line,
      borderRadius: radius.lg,
      padding: 16,
      gap: 10,
    },
    cardHead: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 8,
    },
    cardTitle: {
      fontSize: 13,
      color: chrome.inkFaint,
      fontFamily: ADMIN_FONT.semibold,
      letterSpacing: 0.3,
      textTransform: "uppercase",
    },
    cardActions: { flexDirection: "row", gap: 6 },
    saveBar: { marginTop: 4 },
    saveDock: {
      marginTop: 0,
      paddingHorizontal: 16,
      paddingTop: 12,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: chrome.line,
      backgroundColor: chrome.card,
    },
  });
}
