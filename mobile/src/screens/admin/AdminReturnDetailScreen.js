import React, { useCallback, useEffect, useMemo, useState } from "react";
import { KeyboardAvoidingView, Platform, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ADMIN_SCREEN_COPY } from "../../content/adminContent";
import KankregScrollPage from "../../components/kankreg/KankregScrollPage";
import AdminScreenShell from "../../components/admin/AdminScreenShell";
import KankregAdminShell from "../../components/kankreg/KankregAdminShell";
import AdminBackLink from "../../components/admin/AdminBackLink";
import AdminAlerts from "../../components/admin/AdminAlerts";
import AdminBadge from "../../components/admin/AdminBadge";
import AdminButton from "../../components/admin/AdminButton";
import AdminInput from "../../components/admin/AdminInput";
import AdminPanel from "../../components/admin/AdminPanel";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import { approveAdminReturn, fetchAdminReturn, rejectAdminReturn } from "../../services/adminService";
import { adminShellContent, useAdminChrome, useAdminCompactLayout } from "../../theme/adminLayout";
import { customerScrollFill } from "../../theme/screenLayout";
import { fonts, spacing } from "../../theme/tokens";
import { formatRupees, timeAgo } from "../../utils/adminFormat";
import { paymentShortLabel } from "../../utils/adminOrderUi";
import AdminLoader from "../../components/admin/AdminLoader";
import AdminNotice from "../../components/admin/AdminNotice";

function statusTone(status) {
  if (status === "approved") return "green";
  if (status === "rejected") return "red";
  return "gold";
}

function LineRow({ name, variant, qty, price, styles, chrome }) {
  return (
    <View style={styles.line}>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={styles.strong} numberOfLines={2}>
          {name || "Jar"}
        </Text>
        {variant ? <Text style={styles.sub}>{variant}</Text> : null}
      </View>
      <Text style={styles.body}>
        {qty} × {formatRupees(price)}
      </Text>
    </View>
  );
}

export default function AdminReturnDetailScreen({ navigation, route }) {
  const returnId = String(route?.params?.returnId || "");
  const { user } = useAuth();
  const toast = useToast();
  const chrome = useAdminChrome();
  const compact = useAdminCompactLayout();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => createStyles(chrome), [chrome]);

  const [row, setRow] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [remarks, setRemarks] = useState("");

  const load = useCallback(async () => {
    if (!returnId) {
      setError("Missing return id.");
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const data = await fetchAdminReturn(null, returnId);
      setRow(data);
      setRemarks(data.remarks || "");
      setError("");
    } catch (err) {
      setError(err.message || "Couldn't load this return.");
      setRow(null);
    } finally {
      setLoading(false);
    }
  }, [returnId]);

  useEffect(() => {
    if (user?.isAdmin) load();
  }, [user?.isAdmin, load]);

  const pending = row?.status === "pending";

  const decide = async (kind) => {
    if (!row) return;
    if (kind === "reject" && !remarks.trim()) {
      setError("Write remarks before rejecting.");
      return;
    }
    setBusy(kind);
    setError("");
    setSuccess("");
    try {
      const data =
        kind === "approve"
          ? await approveAdminReturn(null, row._id, remarks)
          : await rejectAdminReturn(null, row._id, remarks.trim());
      setRow(data);
      setRemarks(data.remarks || remarks);
      if (data.message) {
        setSuccess(data.message);
        toast.toastSuccess(data.message);
      } else {
        toast.toastSuccess("Return rejected.");
      }
    } catch (err) {
      setError(err.message || "Couldn't update this return.");
    } finally {
      setBusy("");
    }
  };

  const actions = pending ? (
    <View style={[styles.actions, compact && styles.actionsDock, compact && { paddingBottom: Math.max(insets.bottom, 10) }]}>
      <AdminInput
        value={remarks}
        onChangeText={setRemarks}
        placeholder={pending ? "Remarks (required to reject)" : ""}
        multiline
        numberOfLines={2}
        maxLength={500}
      />
      <View style={styles.actionRow}>
        <AdminButton
          label="Approve"
          icon="checkmark-circle-outline"
          variant="primary"
          size="md"
          loading={busy === "approve"}
          disabled={Boolean(busy)}
          onPress={() => decide("approve")}
        />
        <AdminButton
          label="Reject"
          icon="close-circle-outline"
          variant="danger"
          size="md"
          loading={busy === "reject"}
          disabled={Boolean(busy)}
          onPress={() => decide("reject")}
        />
      </View>
    </View>
  ) : null;

  return (
    <AdminScreenShell style={styles.screen}>
      <KeyboardAvoidingView style={customerScrollFill} behavior={Platform.OS === "ios" ? "padding" : "height"}>
        <KankregScrollPage
          scrollVariant="admin"
          showFooter={false}
          style={customerScrollFill}
          keyboardShouldPersistTaps="handled"
          stickyFooterExtra={compact && pending ? 160 : 0}
        >
          <KankregAdminShell
            navigation={navigation}
            route={route}
            title={row?.publicRef || "Return"}
            subtitle={ADMIN_SCREEN_COPY.returns.subtitle}
          >
            <View style={styles.panel}>
              <AdminBackLink navigation={navigation} label="All returns" target="AdminReturns" style={styles.back} />
              <AdminAlerts
                error={error}
                success={success}
                onCloseError={() => setError("")}
                onCloseSuccess={() => setSuccess("")}
              />

              {loading ? (
                <AdminLoader caption="Loading return…" />
              ) : !row ? (
                <AdminNotice severity="error" title="Return not found" message={error || "This return may have been removed."} />
              ) : (
                <>
                  <AdminPanel
                    title={row.publicRef || "Return"}
                    icon="return-down-back-outline"
                    meta={formatRupees(row.amount)}
                    description={`${row.customerName} · ${timeAgo(row.createdAt)}`}
                  >
                    <View style={styles.badges}>
                      <AdminBadge label={row.status} tone={statusTone(row.status)} />
                      <AdminBadge
                        label={`${paymentShortLabel(row) || row.paymentMethod || "—"} · ${row.paymentStatus || "pending"}`}
                        tone={row.paymentStatus === "refunded" ? "purple" : row.paymentStatus === "paid" ? "green" : "gold"}
                      />
                    </View>
                    <AdminButton
                      label={`Open ${row.publicRef || "order"}`}
                      icon="open-outline"
                      variant="soft"
                      size="sm"
                      onPress={() => navigation.navigate("AdminOrderDetail", { orderId: String(row.orderId) })}
                    />
                  </AdminPanel>

                  <AdminPanel title="Order lines" icon="basket-outline">
                    {(row.orderLines || []).length ? (
                      (row.orderLines || []).map((line, index) => (
                        <LineRow
                          key={`o-${index}`}
                          name={line.name}
                          variant={line.variantLabel}
                          qty={line.quantity}
                          price={line.price}
                          styles={styles}
                          chrome={chrome}
                        />
                      ))
                    ) : (
                      <Text style={styles.sub}>Order lines load with the return.</Text>
                    )}
                  </AdminPanel>

                  <AdminPanel title="Being returned" icon="cube-outline" meta={formatRupees(row.amount)}>
                    {(row.lines || []).map((line, index) => (
                      <LineRow
                        key={`r-${index}`}
                        name={line.name}
                        variant={line.variantLabel}
                        qty={line.quantity}
                        price={line.price}
                        styles={styles}
                        chrome={chrome}
                      />
                    ))}
                  </AdminPanel>

                  <AdminPanel title="Reason" icon="chatbubble-ellipses-outline">
                    <Text style={styles.body}>{row.reason}</Text>
                    {row.remarks ? (
                      <>
                        <Text style={[styles.sub, { marginTop: 10 }]}>Remarks</Text>
                        <Text style={styles.body}>{row.remarks}</Text>
                      </>
                    ) : null}
                    {row.decidedByName ? (
                      <Text style={styles.sub}>
                        Decided by {row.decidedByName}
                        {row.decidedAt ? ` · ${timeAgo(row.decidedAt)}` : ""}
                      </Text>
                    ) : null}
                  </AdminPanel>

                  {!compact ? actions : null}
                </>
              )}
            </View>
          </KankregAdminShell>
        </KankregScrollPage>
        {compact ? actions : null}
      </KeyboardAvoidingView>
    </AdminScreenShell>
  );
}

function createStyles(chrome) {
  return StyleSheet.create({
    screen: { flex: 1, width: "100%", alignSelf: "center", maxWidth: "100%" },
    panel: { ...adminShellContent(), gap: spacing.sm + 2 },
    back: { marginBottom: spacing.sm },
    badges: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 12 },
    line: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      paddingVertical: 8,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: chrome.lineSoft,
    },
    strong: { fontSize: 13.5, color: chrome.ink, fontFamily: fonts.semibold },
    body: { fontSize: 13.5, color: chrome.ink, fontFamily: fonts.regular, lineHeight: 20 },
    sub: { fontSize: 12, color: chrome.inkFaint, fontFamily: fonts.regular, marginTop: 4 },
    actions: { gap: 10, marginTop: 8 },
    actionsDock: {
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: chrome.line,
      backgroundColor: chrome.paper,
      paddingHorizontal: 12,
      paddingTop: 10,
    },
    actionRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  });
}
