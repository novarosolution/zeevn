import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { useAdminChrome } from "../../../theme/adminLayout";
import { getAdminTone } from "../../../theme/adminTones";
import { useTheme } from "../../../context/ThemeContext";
import { useLiveSocket } from "../../../context/LiveSocketContext";
import { useToast } from "../../../context/ToastContext";
import { fonts } from "../../../theme/tokens";
import { FONT_PRICE } from "../../../theme/typographyRoles";
import {
  addAdminOrderNote,
  deleteAdminOrderNote,
  fetchAdminOrder,
} from "../../../services/adminService";
import {
  adminStatusMeta,
  customerOf,
  flagMeta,
  fullAddress,
  isCod,
  isFinalStatus,
  itemCount,
  orderRef,
  paymentMeta,
  paymentMethodLabel,
  primaryOrderAction,
} from "../../../utils/adminOrderUi";
import {
  copyText,
  formatClock,
  formatRupees,
  formatShortDateTime,
  mapsHref,
  openExternal,
  plural,
  telHref,
  timeAgo,
  whatsappHref,
} from "../../../utils/adminFormat";
import AdminAvatar from "../AdminAvatar";
import AdminBadge from "../AdminBadge";
import AdminButton from "../AdminButton";
import AdminCard from "../AdminCard";
import AdminDrawer from "../AdminDrawer";
import AdminInput from "../AdminInput";
import AdminSelect from "../AdminSelect";
import AdminTimeline from "../AdminTimeline";
import { useAdminConfirm } from "../AdminDialog";
import SkeletonBlock from "../../ui/SkeletonBlock";
import { buildRiderOptions } from "./riderOptions";
import useOrderActions from "./useOrderActions";

const ACTOR_LABEL = { customer: "Customer", admin: "Admin", delivery: "Rider", system: "System" };

/**
 * Quick view of one order beside the list — everything needed to run it (customer, items, payment, rider, history,
 * private notes) without leaving the page. `seed` is the list row, shown instantly while the full order loads.
 */
export default function AdminOrderDrawer({ orderId, seed, riders, onClose, onChanged, onFullOpen }) {
  const chrome = useAdminChrome();
  const { isDark } = useTheme();
  const toast = useToast();
  const { confirm, dialog } = useAdminConfirm();
  const { on: onLiveEvent } = useLiveSocket();
  const styles = useMemo(() => createStyles(chrome), [chrome]);
  const red = getAdminTone("red", isDark);

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [noteText, setNoteText] = useState("");
  const [noteBusy, setNoteBusy] = useState(false);
  const shownId = useRef(null);

  const load = useCallback(
    async ({ silent = false } = {}) => {
      if (!orderId) return;
      if (!silent) setLoading(true);
      try {
        const next = await fetchAdminOrder(null, orderId);
        setOrder(next);
        setError("");
      } catch (err) {
        setError(err?.message || "Couldn't load this order.");
      } finally {
        setLoading(false);
      }
    },
    [orderId]
  );

  useEffect(() => {
    if (!orderId) return;
    if (shownId.current !== orderId) {
      shownId.current = orderId;
      setOrder(null);
      setNoteText("");
    }
    load();
  }, [orderId, load]);

  // Keep the open order in step with changes made elsewhere (rider accepted, another admin moved it…).
  useEffect(() => {
    if (!orderId) return undefined;
    return onLiveEvent("orders:updated", ({ order: pushed }) => {
      if (String(pushed?._id) === String(orderId)) load({ silent: true });
    });
  }, [orderId, onLiveEvent, load]);

  const afterChange = useCallback(async () => {
    await load({ silent: true });
    onChanged?.();
  }, [load, onChanged]);

  const actions = useOrderActions({ toast, confirm, onChanged: afterChange });

  const current = order || seed || null;
  const visible = Boolean(orderId);
  const meta = adminStatusMeta(current?.status);
  const customer = customerOf(current);
  const pay = current ? paymentMeta(current) : null;
  const flag = flagMeta(seed?.flag);
  const primary = primaryOrderAction(current);
  const final = isFinalStatus(current?.status);
  const busy = actions.busyId === String(orderId);
  const riderId = current?.assignedDeliveryUser?._id ? String(current.assignedDeliveryUser._id) : null;
  const riderOptions = useMemo(() => buildRiderOptions(riders, current?.deliveryZone), [riders, current?.deliveryZone]);

  const addNote = async () => {
    const text = noteText.trim();
    if (!text || noteBusy) return;
    setNoteBusy(true);
    try {
      const res = await addAdminOrderNote(null, orderId, text);
      setOrder((prev) => (prev ? { ...prev, adminNotes: res.notes } : prev));
      setNoteText("");
      onChanged?.();
    } catch (err) {
      toast.toastError(err?.message || "Couldn't save the note.");
    } finally {
      setNoteBusy(false);
    }
  };

  const removeNote = async (noteId) => {
    try {
      const res = await deleteAdminOrderNote(null, orderId, noteId);
      setOrder((prev) => (prev ? { ...prev, adminNotes: res.notes } : prev));
      onChanged?.();
    } catch (err) {
      toast.toastError(err?.message || "Couldn't delete the note.");
    }
  };

  const timeline = useMemo(
    () =>
      (order?.statusHistory || []).map((event, index) => {
        const m = adminStatusMeta(event.status);
        const who = ACTOR_LABEL[event.byRole] || "System";
        return {
          key: `${event.status}-${index}`,
          title: m.label,
          meta: formatShortDateTime(event.at),
          note: event.note ? `${who} — ${event.note}` : who,
          tone: m.tone,
          icon: m.icon,
        };
      }),
    [order?.statusHistory]
  );

  const footer = current ? (
    <View style={styles.footer}>
      {!final ? <AdminButton label="Cancel order" icon="close-circle-outline" variant="danger" size="md" onPress={() => actions.cancel(current)} disabled={busy} /> : null}
      <AdminButton label="Full page" icon="open-outline" variant="soft" size="md" onPress={() => onFullOpen?.(current)} />
      <View style={{ flex: 1 }} />
      {primary ? (
        <AdminButton
          label={primary.label}
          icon={primary.icon}
          size="md"
          variant={primary.tone === "primary" ? "primary" : "gold"}
          loading={busy}
          onPress={() => actions.runPrimary(current)}
        />
      ) : null}
    </View>
  ) : null;

  return (
    <>
      <AdminDrawer
        visible={visible}
        onClose={onClose}
        eyebrow="Order"
        title={current ? orderRef(current) : "Order"}
        subtitle={
          current
            ? `${timeAgo(current.createdAt)} · ${plural(itemCount(current), "item")} · ${formatRupees(current.totalPrice)}`
            : undefined
        }
        headerRight={current ? <AdminBadge label={meta.label} tone={meta.tone} dot /> : null}
        footer={footer}
        width={600}
      >
        {error && !order ? (
          <View style={[styles.banner, { backgroundColor: red.bg, borderColor: red.border }]}>
            <Ionicons name="alert-circle-outline" size={16} color={red.fg} />
            <Text style={[styles.bannerText, { color: red.fg }]}>{error}</Text>
            <AdminButton label="Retry" size="xs" variant="soft" onPress={() => load()} />
          </View>
        ) : null}

        {flag ? (
          <View style={[styles.banner, { backgroundColor: getAdminTone(flag.tone, isDark).bg, borderColor: getAdminTone(flag.tone, isDark).border }]}>
            <Ionicons name={flag.icon} size={16} color={getAdminTone(flag.tone, isDark).fg} />
            <Text style={[styles.bannerText, { color: getAdminTone(flag.tone, isDark).fg }]}>{flag.label}</Text>
          </View>
        ) : null}

        {!current ? (
          <SkeletonBlock width="100%" height={160} rounded="lg" />
        ) : (
          <>
            {/* customer + address */}
            <AdminCard title="Customer" icon="person-outline">
              <View style={styles.personRow}>
                <AdminAvatar name={customer.name} size={40} />
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text style={styles.strong} numberOfLines={1}>
                    {customer.name}
                  </Text>
                  <Text style={styles.sub} numberOfLines={1}>
                    {customer.email || "No email on file"}
                  </Text>
                </View>
                {telHref(customer.phone) ? <AdminButton icon="call-outline" variant="soft" size="sm" title="Call" onPress={() => openExternal(telHref(customer.phone))} /> : null}
                {whatsappHref(customer.phone) ? (
                  <AdminButton
                    icon="logo-whatsapp"
                    variant="tint"
                    tone="green"
                    size="sm"
                    title="WhatsApp"
                    onPress={() => openExternal(whatsappHref(customer.phone, `Hi ${customer.name}, about your Zeevan order ${orderRef(current)}: `))}
                  />
                ) : null}
              </View>
              <View style={styles.addressBox}>
                <Ionicons name="location-outline" size={16} color={chrome.inkFaint} style={{ marginTop: 1 }} />
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text style={styles.body}>{fullAddress(current) || "No address"}</Text>
                  {current.shippingAddress?.phone ? <Text style={styles.sub}>{current.shippingAddress.phone}</Text> : null}
                  {current.shippingAddress?.note ? <Text style={styles.note}>“{current.shippingAddress.note}”</Text> : null}
                </View>
              </View>
              <View style={styles.rowButtons}>
                {mapsHref(current.shippingAddress) ? (
                  <AdminButton label="Open in Maps" icon="navigate-outline" size="xs" variant="soft" onPress={() => openExternal(mapsHref(current.shippingAddress))} />
                ) : null}
                <AdminButton
                  label="Copy address"
                  icon="copy-outline"
                  size="xs"
                  variant="soft"
                  onPress={async () => ((await copyText(fullAddress(current))) ? toast.toastSuccess("Address copied.") : toast.toastError("Couldn't copy."))}
                />
              </View>
            </AdminCard>

            {/* items */}
            <AdminCard title="Items" icon="cube-outline" subtitle={plural(itemCount(current), "item")} flush>
              {(current.products || []).map((line, index) => (
                <View key={`${line.name}-${index}`} style={[styles.line, index > 0 && styles.lineBorder]}>
                  {line.image || line.product?.image ? (
                    <Image source={{ uri: line.image || line.product?.image }} style={styles.thumb} contentFit="cover" />
                  ) : (
                    <View style={[styles.thumb, styles.thumbEmpty]}>
                      <Ionicons name="cube-outline" size={16} color={chrome.inkFaint} />
                    </View>
                  )}
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <Text style={styles.strong} numberOfLines={2}>
                      {line.name || line.product?.name || "Item"}
                    </Text>
                    <Text style={styles.sub}>
                      {line.variantLabel ? `${line.variantLabel} · ` : ""}
                      {formatRupees(line.price)} × {line.quantity}
                    </Text>
                  </View>
                  <Text style={styles.lineTotal}>{formatRupees(Number(line.price || 0) * Number(line.quantity || 1))}</Text>
                </View>
              ))}
              <View style={styles.sums}>
                <SumRow styles={styles} label="Items" value={formatRupees(current.priceBreakdown?.itemsTotal)} />
                <SumRow styles={styles} label="Delivery" value={Number(current.priceBreakdown?.deliveryFee) ? formatRupees(current.priceBreakdown.deliveryFee) : "Free"} />
                {Number(current.priceBreakdown?.platformFee) ? <SumRow styles={styles} label="Platform fee" value={formatRupees(current.priceBreakdown.platformFee)} /> : null}
                {Number(current.priceBreakdown?.discountAmount) ? (
                  <SumRow styles={styles} label={`Discount${current.coupon?.code ? ` (${current.coupon.code})` : ""}`} value={`− ${formatRupees(current.priceBreakdown.discountAmount)}`} />
                ) : null}
                <View style={styles.sumTotal}>
                  <Text style={styles.strong}>Total</Text>
                  <Text style={styles.grand}>{formatRupees(current.totalPrice)}</Text>
                </View>
              </View>
            </AdminCard>

            {/* payment */}
            <AdminCard
              title="Payment"
              icon="card-outline"
              right={pay ? <AdminBadge label={pay.label} tone={pay.tone} /> : null}
              subtitle={`${paymentMethodLabel(current)}${current.youpi?.utr ? ` · UTR ${current.youpi.utr}` : ""}`}
            >
              <View style={styles.rowButtons}>
                {current.paymentStatus === "pending" ? (
                  <AdminButton
                    label={isCod(current) ? "Mark cash collected" : "Mark paid"}
                    icon="checkmark-circle-outline"
                    size="sm"
                    variant="primary"
                    loading={busy}
                    onPress={() => actions.setPayment(current, "paid", { note: isCod(current) ? "Cash collected" : "Payment confirmed by admin" })}
                  />
                ) : null}
                {current.paymentStatus === "pending" && current.status === "pending_payment" ? (
                  <AdminButton
                    label="Mark failed"
                    icon="close-circle-outline"
                    size="sm"
                    variant="danger"
                    disabled={busy}
                    onPress={() =>
                      actions.setPayment(current, "failed", {
                        confirmFirst: { title: "Mark this payment failed?", message: "The order is cancelled because it was never paid.", tone: "danger", confirmLabel: "Mark failed" },
                      })
                    }
                  />
                ) : null}
                {current.paymentStatus === "paid" ? (
                  <>
                    <AdminButton
                      label="Undo paid"
                      icon="arrow-undo-outline"
                      size="sm"
                      variant="soft"
                      disabled={busy}
                      onPress={() =>
                        actions.setPayment(current, "pending", {
                          confirmFirst: { title: "Set back to unpaid?", message: "Use this if it was marked paid by mistake.", confirmLabel: "Set unpaid" },
                        })
                      }
                    />
                    <AdminButton
                      label="Record refund"
                      icon="return-down-back-outline"
                      size="sm"
                      variant="danger"
                      disabled={busy}
                      onPress={() =>
                        actions.setPayment(current, "refunded", {
                          confirmFirst: {
                            title: "Record a refund?",
                            message: "This only records the refund here — send the money back through your payment provider or in cash.",
                            tone: "danger",
                            confirmLabel: "Record refund",
                          },
                        })
                      }
                    />
                  </>
                ) : null}
                {current.paymentStatus === "refunded" || current.paymentStatus === "failed" ? <Text style={styles.sub}>No further payment actions.</Text> : null}
              </View>
            </AdminCard>

            {/* delivery */}
            <AdminCard title="Delivery" icon="bicycle-outline" subtitle={current.deliveryZoneName ? `Zone: ${current.deliveryZoneName}` : "Outside every drawn zone"}>
              {current.tracking?.promisedAt ? (
                <View style={styles.kv}>
                  <Text style={styles.sub}>Promised by</Text>
                  <Text style={styles.strong}>{formatClock(current.tracking.promisedAt)}</Text>
                </View>
              ) : null}
              {final ? (
                <View style={styles.kv}>
                  <Text style={styles.sub}>Rider</Text>
                  <Text style={styles.strong}>{current.assignedDeliveryUser?.name || "—"}</Text>
                </View>
              ) : current.status === "pending_payment" ? (
                <Text style={styles.sub}>A rider can be assigned once the order is paid.</Text>
              ) : (
                <>
                  <AdminSelect
                    label="Rider"
                    value={riderId}
                    valueLabel={current.assignedDeliveryUser?.name}
                    placeholder="Assign a rider"
                    options={riderOptions}
                    clearLabel="Unassigned"
                    searchable={riders.length > 6}
                    disabled={busy}
                    minMenuWidth={280}
                    icon="person-add-outline"
                    onChange={(id) => actions.assignRider(current, id, riders.find((r) => String(r._id) === String(id))?.name)}
                  />
                  {current.assignedDeliveryUser ? (
                    <View style={styles.rowButtons}>
                      <AdminBadge
                        size="sm"
                        label={
                          current.deliveryAcceptStatus === "accepted"
                            ? "Rider accepted"
                            : current.deliveryAcceptStatus === "declined"
                              ? "Rider declined"
                              : "Waiting for rider to accept"
                        }
                        tone={current.deliveryAcceptStatus === "accepted" ? "green" : current.deliveryAcceptStatus === "declined" ? "red" : "gold"}
                      />
                      {current.assignedDeliveryUser.phone ? (
                        <AdminButton label="Call rider" icon="call-outline" size="xs" variant="soft" onPress={() => openExternal(telHref(current.assignedDeliveryUser.phone))} />
                      ) : null}
                    </View>
                  ) : null}
                  {current.deliveryDeclineReason ? <Text style={styles.note}>Declined: “{current.deliveryDeclineReason}”</Text> : null}
                </>
              )}
            </AdminCard>

            {/* history */}
            <AdminCard title="History" icon="time-outline">
              {order ? <AdminTimeline items={timeline} emptyText="No history yet." /> : <SkeletonBlock width="100%" height={70} rounded="md" />}
            </AdminCard>

            {/* private notes */}
            <AdminCard title="Private notes" icon="lock-closed-outline" subtitle="Only your team sees these — never the customer or riders.">
              <AdminInput
                value={noteText}
                onChangeText={setNoteText}
                placeholder="e.g. Customer will be home after 6 pm"
                multiline
                numberOfLines={2}
                maxLength={500}
                autoCapitalize="sentences"
              />
              <View style={styles.rowButtons}>
                <AdminButton label="Add note" icon="add" size="sm" variant="primary" loading={noteBusy} disabled={!noteText.trim()} onPress={addNote} />
              </View>
              {(order?.adminNotes || []).map((entry) => (
                  <View key={entry._id} style={styles.noteRow}>
                    <View style={{ flex: 1, minWidth: 0 }}>
                      <Text style={styles.body}>{entry.text}</Text>
                      <Text style={styles.sub}>
                        {entry.byName || "Admin"} · {timeAgo(entry.at)}
                      </Text>
                    </View>
                    <AdminButton icon="trash-outline" size="xs" variant="ghost" title="Delete note" onPress={() => removeNote(entry._id)} />
                  </View>
                ))}
            </AdminCard>
          </>
        )}
        {loading && current ? <Text style={styles.refreshing}>Refreshing…</Text> : null}
      </AdminDrawer>
      {dialog}
    </>
  );
}

function SumRow({ styles, label, value }) {
  return (
    <View style={styles.sumRow}>
      <Text style={styles.sub}>{label}</Text>
      <Text style={styles.body}>{value}</Text>
    </View>
  );
}

function createStyles(chrome) {
  return StyleSheet.create({
    footer: { flexDirection: "row", alignItems: "center", gap: 8, flexWrap: "wrap" },
    banner: { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 12, paddingVertical: 10, borderRadius: 12, borderWidth: StyleSheet.hairlineWidth },
    bannerText: { flex: 1, fontSize: 12.5, fontFamily: fonts.semibold },
    personRow: { flexDirection: "row", alignItems: "center", gap: 10 },
    addressBox: {
      flexDirection: "row",
      gap: 8,
      padding: 12,
      borderRadius: 12,
      backgroundColor: chrome.paper,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: chrome.lineSoft,
    },
    rowButtons: { flexDirection: "row", flexWrap: "wrap", alignItems: "center", gap: 8 },
    strong: { fontSize: 13.5, color: chrome.ink, fontFamily: fonts.semibold },
    body: { fontSize: 13, lineHeight: 19, color: chrome.ink, fontFamily: fonts.regular },
    sub: { fontSize: 12, color: chrome.inkFaint, fontFamily: fonts.regular },
    note: { marginTop: 4, fontSize: 12.5, fontStyle: "italic", color: chrome.inkSoft, fontFamily: fonts.regular },
    line: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 16, paddingVertical: 11 },
    lineBorder: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: chrome.lineSoft },
    thumb: { width: 42, height: 42, borderRadius: 10, backgroundColor: chrome.paper },
    thumbEmpty: { alignItems: "center", justifyContent: "center" },
    lineTotal: { fontFamily: FONT_PRICE, fontSize: 13.5, color: chrome.ink, fontWeight: "600" },
    sums: { padding: 16, gap: 6, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: chrome.lineSoft, backgroundColor: chrome.paper },
    sumRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
    sumTotal: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginTop: 6,
      paddingTop: 10,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: chrome.line,
    },
    grand: { fontFamily: FONT_PRICE, fontSize: 18, color: chrome.ink, letterSpacing: -0.3, fontWeight: "700" },
    kv: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
    noteRow: {
      flexDirection: "row",
      gap: 8,
      alignItems: "flex-start",
      padding: 12,
      borderRadius: 12,
      backgroundColor: chrome.paper,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: chrome.lineSoft,
    },
    refreshing: { textAlign: "center", fontSize: 11.5, color: chrome.inkFaint, fontFamily: fonts.regular },
  });
}
