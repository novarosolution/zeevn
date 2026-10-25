import React, { memo, useMemo } from "react";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { useAdminChrome } from "../../../theme/adminLayout";
import { getAdminTone } from "../../../theme/adminTones";
import { useTheme } from "../../../context/ThemeContext";
import { fonts } from "../../../theme/tokens";
import { FONT_PRICE } from "../../../theme/typographyRoles";
import {
  adminStatusMeta,
  areaLine,
  customerOf,
  flagMeta,
  isFinalStatus,
  itemCount,
  orderRef,
  paymentMeta,
  paymentShortLabel,
  primaryOrderAction,
} from "../../../utils/adminOrderUi";
import { copyText, formatRupees, mapsHref, openExternal, plural, telHref, timeAgo, whatsappHref } from "../../../utils/adminFormat";
import AdminBadge from "../AdminBadge";
import AdminButton from "../AdminButton";
import AdminCheckbox from "../AdminCheckbox";
import AdminMenu from "../AdminMenu";
import AdminSelect from "../AdminSelect";
import SkeletonBlock from "../../ui/SkeletonBlock";
import { buildRiderOptions } from "./riderOptions";

const W = { select: 28, total: 104, status: 118, rider: 158, actions: 152 };

/* ----------------------------- shared pieces ----------------------------- */

function useRowTone() {
  const { isDark } = useTheme();
  return useMemo(() => ({ gold: getAdminTone("gold", isDark), red: getAdminTone("red", isDark), green: getAdminTone("green", isDark) }), [isDark]);
}

function acceptCaption(order, tones) {
  if (!order.assignedDeliveryUser) return null;
  if (isFinalStatus(order.status)) return null;
  const s = order.deliveryAcceptStatus;
  if (s === "accepted") return { text: "Accepted", color: tones.green.fg };
  if (s === "pending") return { text: "Waiting to accept", color: tones.gold.fg };
  if (s === "declined") return { text: "Declined", color: tones.red.fg };
  return null;
}

function menuItemsFor(order, { onFullOpen, actions }) {
  const customer = customerOf(order);
  const items = [
    { key: "open", label: "Open full order", icon: "open-outline", onPress: () => onFullOpen(order) },
    { key: "copy", label: "Copy order number", icon: "copy-outline", onPress: () => copyText(orderRef(order)) },
  ];
  if (telHref(customer.phone)) items.push({ key: "call", label: "Call customer", icon: "call-outline", onPress: () => openExternal(telHref(customer.phone)) });
  if (whatsappHref(customer.phone)) {
    items.push({
      key: "wa",
      label: "WhatsApp customer",
      icon: "logo-whatsapp",
      onPress: () => openExternal(whatsappHref(customer.phone, `Hi ${customer.name}, about your Zeevan order ${orderRef(order)}: `)),
    });
  }
  if (mapsHref(order.shippingAddress)) items.push({ key: "map", label: "Open in Maps", icon: "navigate-outline", onPress: () => openExternal(mapsHref(order.shippingAddress)) });
  if (!isFinalStatus(order.status)) {
    items.push({ divider: true }, { key: "cancel", label: "Cancel order", icon: "close-circle-outline", danger: true, onPress: () => actions.cancel(order) });
  }
  return items;
}

/* -------------------------------- table row ------------------------------- */

const OrderRow = memo(function OrderRow({ order, selected, busy, riders, actions, onToggle, onOpen, onFullOpen }) {
  const chrome = useAdminChrome();
  const tones = useRowTone();
  const styles = useMemo(() => createStyles(chrome), [chrome]);
  const customer = customerOf(order);
  const meta = adminStatusMeta(order.status);
  const flag = flagMeta(order.flag);
  const pay = paymentMeta(order);
  const action = primaryOrderAction(order);
  const final = isFinalStatus(order.status);
  const caption = acceptCaption(order, tones);
  const riderId = order.assignedDeliveryUser?._id ? String(order.assignedDeliveryUser._id) : null;
  const riderOptions = useMemo(() => buildRiderOptions(riders, order.deliveryZone), [riders, order.deliveryZone]);

  return (
    <Pressable
      onPress={() => onOpen(order)}
      accessibilityRole="button"
      accessibilityLabel={`Open order ${orderRef(order)}`}
      style={({ hovered, pressed }) => [styles.row, hovered && styles.rowHover, pressed && styles.rowPressed, selected && styles.rowSelected]}
    >
      <View style={styles.cellSelect}>
        <AdminCheckbox checked={selected} onChange={() => onToggle(order._id)} accessibilityLabel={`Select ${orderRef(order)}`} />
      </View>

      <View style={[styles.cellFlex, { flex: 0.9, minWidth: 108 }]}>
        <Text style={styles.ref} numberOfLines={1}>
          {orderRef(order)}
        </Text>
        <Text style={styles.sub} numberOfLines={1}>
          {order.channel === "walk_in" ? "Counter · " : ""}
          {timeAgo(order.createdAt)}
        </Text>
      </View>

      <View style={[styles.cellFlex, { flex: 1.15, minWidth: 132 }]}>
        <Text style={styles.strong} numberOfLines={1}>
          {customer.name}
        </Text>
        <Text style={styles.sub} numberOfLines={1}>
          {areaLine(order) || "—"}
          {order.noteCount > 0 ? ` · ${order.noteCount} ${order.noteCount === 1 ? "note" : "notes"}` : ""}
        </Text>
      </View>

      <View style={styles.cellQty}>
        <Text style={styles.body} numberOfLines={1}>
          {itemCount(order)}
        </Text>
      </View>

      <View style={styles.cellTotal}>
        <Text style={styles.total} numberOfLines={1}>
          {formatRupees(order.totalPrice)}
        </Text>
        <View style={styles.subRow}>
          <Text style={styles.sub}>{paymentShortLabel(order)}</Text>
          <AdminBadge label={pay.label} tone={pay.tone} size="sm" />
        </View>
      </View>

      <View style={styles.cellStatus}>
        <AdminBadge label={meta.label} tone={meta.tone} dot />
        {flag ? <AdminBadge label={flag.label} tone={flag.tone} icon={flag.icon} size="sm" /> : null}
      </View>

      <View style={styles.cellRider}>
        {final || order.status === "pending_payment" ? (
          <Text style={styles.sub} numberOfLines={1}>
            {order.assignedDeliveryUser?.name || "No rider"}
          </Text>
        ) : (
          <>
            <AdminSelect
              compact
              value={riderId}
              valueLabel={order.assignedDeliveryUser?.name}
              placeholder="Assign rider"
              options={riderOptions}
              clearLabel="Unassigned"
              searchable={riders.length > 6}
              disabled={busy}
              minMenuWidth={250}
              onChange={(id) => actions.assignRider(order, id, riders.find((r) => String(r._id) === String(id))?.name)}
              icon={riderId ? undefined : "person-add-outline"}
            />
            {caption ? <Text style={[styles.caption, { color: caption.color }]}>{caption.text}</Text> : null}
          </>
        )}
      </View>

      <View style={styles.cellActions}>
        {action ? (
          <AdminButton
            label={action.label}
            icon={action.icon}
            size="xs"
            variant={action.tone === "primary" ? "primary" : "tint"}
            tone={action.tone === "primary" ? undefined : action.tone}
            loading={busy}
            onPress={() => actions.runPrimary(order)}
          />
        ) : null}
        <AdminMenu items={menuItemsFor(order, { onFullOpen, actions })} />
      </View>
    </Pressable>
  );
});

/* ------------------------------- phone card ------------------------------- */

const OrderCard = memo(function OrderCard({ order, selected, busy, actions, onToggle, onOpen, onFullOpen }) {
  const chrome = useAdminChrome();
  const styles = useMemo(() => createStyles(chrome), [chrome]);
  const customer = customerOf(order);
  const meta = adminStatusMeta(order.status);
  const flag = flagMeta(order.flag);
  const pay = paymentMeta(order);
  const action = primaryOrderAction(order);

  return (
    <Pressable onPress={() => onOpen(order)} style={({ pressed }) => [styles.card, selected && styles.rowSelected, pressed && styles.rowPressed]}>
      <View style={styles.cardTop}>
        <AdminCheckbox checked={selected} onChange={() => onToggle(order._id)} accessibilityLabel={`Select ${orderRef(order)}`} />
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={styles.ref} numberOfLines={1}>
            {orderRef(order)} <Text style={styles.sub}>· {timeAgo(order.createdAt)}</Text>
          </Text>
          <Text style={styles.strong} numberOfLines={1}>
            {customer.name}
          </Text>
        </View>
        <Text style={styles.total}>{formatRupees(order.totalPrice)}</Text>
      </View>
      <Text style={styles.body} numberOfLines={1}>
        {plural(itemCount(order), "item")} · {paymentShortLabel(order)}
      </Text>
      <Text style={styles.sub} numberOfLines={1}>
        {order.assignedDeliveryUser?.name || "No rider"}
        {areaLine(order) ? ` · ${areaLine(order)}` : ""}
      </Text>
      <View style={styles.cardBadges}>
        <AdminBadge label={order.channel === "walk_in" ? "Counter" : "Online"} tone={order.channel === "walk_in" ? "gold" : "green"} size="sm" />
        <AdminBadge label={meta.label} tone={meta.tone} dot />
        <AdminBadge label={pay.label} tone={pay.tone} size="sm" />
        {flag ? <AdminBadge label={flag.label} tone={flag.tone} icon={flag.icon} size="sm" /> : null}
      </View>
      <View style={styles.cardActions}>
        {action ? (
          <AdminButton
            label={action.label}
            icon={action.icon}
            size="sm"
            variant={action.tone === "primary" ? "primary" : "tint"}
            tone={action.tone === "primary" ? undefined : action.tone}
            loading={busy}
            onPress={() => actions.runPrimary(order)}
          />
        ) : null}
        <AdminButton label="Open" icon="open-outline" size="sm" variant="soft" onPress={() => onOpen(order)} />
        <View style={{ marginLeft: "auto" }}>
          <AdminMenu items={menuItemsFor(order, { onFullOpen, actions })} />
        </View>
      </View>
    </Pressable>
  );
});

/* -------------------------------- container -------------------------------- */

export default function AdminOrdersTable({ orders, loading, compact, selected, onToggle, onToggleAll, onOpen, onFullOpen, riders, busyId, actions }) {
  const chrome = useAdminChrome();
  const styles = useMemo(() => createStyles(chrome), [chrome]);
  const allOn = orders.length > 0 && orders.every((o) => selected.has(String(o._id)));
  const someOn = !allOn && orders.some((o) => selected.has(String(o._id)));

  if (loading && !orders.length) {
    return (
      <View style={styles.skeletonWrap}>
        {Array.from({ length: 7 }).map((_, i) => (
          <SkeletonBlock key={i} width="100%" height={compact ? 120 : 58} rounded="lg" />
        ))}
      </View>
    );
  }

  if (compact) {
    return (
      <View style={styles.cardList}>
        {orders.map((order) => (
          <OrderCard
            key={order._id}
            order={order}
            selected={selected.has(String(order._id))}
            busy={busyId === String(order._id)}
            actions={actions}
            onToggle={onToggle}
            onOpen={onOpen}
            onFullOpen={onFullOpen}
          />
        ))}
      </View>
    );
  }

  return (
    <View style={styles.table}>
      <View style={styles.headRow}>
        <View style={styles.cellSelect}>
          <AdminCheckbox checked={allOn} indeterminate={someOn} onChange={() => onToggleAll(!allOn)} accessibilityLabel="Select all orders on this page" />
        </View>
        <Text style={[styles.headText, { flex: 0.9, minWidth: 108 }]}>Ref</Text>
        <Text style={[styles.headText, { flex: 1.15, minWidth: 132 }]}>Customer</Text>
        <Text style={[styles.headText, { width: 48 }]}>Qty</Text>
        <Text style={[styles.headText, { width: W.total }]}>Total</Text>
        <Text style={[styles.headText, { width: W.status }]}>Status</Text>
        <Text style={[styles.headText, { width: W.rider }]}>Rider</Text>
        <Text style={[styles.headText, { width: W.actions, textAlign: "right" }]}>Next step</Text>
      </View>
      {orders.map((order) => (
        <OrderRow
          key={order._id}
          order={order}
          selected={selected.has(String(order._id))}
          busy={busyId === String(order._id)}
          riders={riders}
          actions={actions}
          onToggle={onToggle}
          onOpen={onOpen}
          onFullOpen={onFullOpen}
        />
      ))}
    </View>
  );
}

function createStyles(chrome) {
  return StyleSheet.create({
    skeletonWrap: { gap: 8, padding: 4 },
    table: {
      backgroundColor: chrome.card,
      borderRadius: 16,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: chrome.line,
      overflow: "hidden",
      ...Platform.select({ web: { boxShadow: "0 1px 1px rgba(31,51,31,0.03), 0 12px 30px -22px rgba(31,51,31,0.16)" }, default: {} }),
    },
    headRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
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
      gap: 12,
      paddingHorizontal: 16,
      paddingVertical: 11,
      minHeight: 62,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: chrome.lineSoft,
      ...Platform.select({ web: { cursor: "pointer", transition: "background-color 90ms ease-out" }, default: {} }),
    },
    rowHover: { backgroundColor: chrome.rowHover },
    rowPressed: { backgroundColor: chrome.paper },
    rowSelected: { backgroundColor: chrome.chipOnBg },
    cellSelect: { width: W.select, alignItems: "flex-start", justifyContent: "center" },
    cellFlex: { gap: 2, minWidth: 0 },
    cellQty: { width: 48 },
    cellTotal: { width: W.total, gap: 4 },
    cellStatus: { width: W.status, gap: 5, alignItems: "flex-start" },
    cellRider: { width: W.rider, gap: 3 },
    cellActions: { width: W.actions, flexDirection: "row", alignItems: "center", justifyContent: "flex-end", gap: 6 },
    ref: { fontSize: 13, color: chrome.ink, fontFamily: fonts.bold, letterSpacing: 0.2 },
    strong: { fontSize: 13.5, color: chrome.ink, fontFamily: fonts.semibold },
    body: { fontSize: 13, color: chrome.ink, fontFamily: fonts.regular },
    sub: { fontSize: 11.5, color: chrome.inkFaint, fontFamily: fonts.regular },
    caption: { fontSize: 11, fontFamily: fonts.medium },
    total: { fontFamily: FONT_PRICE, fontSize: 14.5, color: chrome.ink, letterSpacing: -0.2, fontWeight: "600" },
    subRow: { flexDirection: "row", alignItems: "center", gap: 6, flexWrap: "wrap" },
    cardList: { gap: 10 },
    card: {
      backgroundColor: chrome.card,
      borderRadius: 14,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: chrome.line,
      padding: 14,
      gap: 6,
    },
    cardTop: { flexDirection: "row", alignItems: "center", gap: 10 },
    cardBadges: { flexDirection: "row", flexWrap: "wrap", alignItems: "center", gap: 6, marginTop: 4 },
    cardActions: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 6 },
  });
}
