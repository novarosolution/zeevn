import React, { memo } from "react";
import { Linking, Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { MY_ORDERS_UI } from "../../content/appContent";
import { useTheme } from "../../context/ThemeContext";
import {
  FIGMA,
  figmaCardShell,
  figmaDisplayTitle,
  figmaRowBorder,
  figmaTextMuted,
  figmaTextPrimary,
} from "../../theme/figmaApp";
import { ALCHEMY } from "../../theme/customerAlchemy";
import { FONT_BODY_SEMIBOLD } from "../../theme/typographyRoles";
import { fonts, radius } from "../../theme/tokens";
import { formatINR } from "../../utils/currency";
import { platformShadow } from "../../theme/shadowPlatform";
import {
  formatOrderItemsSummary,
  formatOrderShortId,
  getPartnerInitial,
} from "../../utils/orderDisplay";
import { getOrderStatusLabel, isCancelledOrder, isDeliveredOrder } from "../../utils/orderStatus";
import { formatCompactShippingLine } from "../../utils/shippingAddressFormat";
import OrderProgressStrip from "./OrderProgressStrip";
import KankregOrderTrack from "../kankreg/KankregOrderTrack";
import InvoiceMetaRow from "./InvoiceMetaRow";

const { icons: I } = MY_ORDERS_UI;

const cardShadow = platformShadow({
  web: { boxShadow: "0 16px 36px -24px rgba(25,20,15,.2)" },
  ios: {
    shadowColor: "#19140f",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
  },
  android: { elevation: 3 },
});

function StatusBand({ status, isDark }) {
  const isDel = isDeliveredOrder(status);
  const isCan = isCancelledOrder(status);
  const label = getOrderStatusLabel(status);
  const icon = isDel ? I.statusDelivered : isCan ? I.statusCancelled : I.statusPending;
  const colors = isDel
    ? isDark ? ["#14532d", "#166534"] : ["#ecfdf5", "#d1fae5"]
    : isCan
      ? isDark ? ["#450a0a", "#7f1d1d"] : ["#fef2f2", "#fee2e2"]
      : isDark ? ["#292524", "#1c1917"] : ["#faf5ec", "#f3ecdb"];

  return (
    <LinearGradient colors={colors} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.statusBand}>
      <Ionicons name={icon} size={18} color={isDel ? FIGMA.green : isCan ? "#dc2626" : FIGMA.goldDeep} />
      <Text style={[styles.statusBandText, { color: isDark ? FIGMA.paper : FIGMA.ink }]}>{label}</Text>
    </LinearGradient>
  );
}

function isActiveTransitStatus(status) {
  const s = String(status || "");
  return !isDeliveredOrder(s) && !isCancelledOrder(s) && s !== "pending_payment";
}

function StatusChip({ status, c, isDark }) {
  const label = getOrderStatusLabel(status);
  const isDel = isDeliveredOrder(status);
  const isCan = isCancelledOrder(status);
  return (
    <View
      style={[
        styles.statusChip,
        isDel && { borderColor: c.secondaryBorder, backgroundColor: c.secondarySoft },
        isCan && { borderColor: c.danger, backgroundColor: "rgba(220, 38, 38, 0.08)" },
        !isDel && !isCan && { borderColor: c.primaryBorder, backgroundColor: c.primarySoft },
      ]}
    >
      <Text style={[styles.statusChipText, { color: isDark ? c.textPrimary : FIGMA.ink }]}>{label}</Text>
    </View>
  );
}

function OrdersPremiumCardBase({
  order,
  showLiveMap = false,
  liveMapSlot = null,
  style,
  compact = false,
  children,
}) {
  const { colors: c, isDark } = useTheme();
  const shortId = formatOrderShortId(order?._id);
  const statusStr = String(order?.status || "");
  const isActive = isActiveTransitStatus(statusStr);
  const isPast = isDeliveredOrder(statusStr) || isCancelledOrder(statusStr);
  const createdLabel = order?.createdAt
    ? new Date(order.createdAt).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" })
    : "";
  const itemsSummary = formatOrderItemsSummary(order?.products);
  const itemCount = (order?.products || []).reduce((sum, p) => sum + Number(p.quantity || 0), 0);
  const compactShipLine = formatCompactShippingLine(order?.shippingAddress);
  const partner = order?.assignedDeliveryUser;
  const showPartner =
    partner?.name && ["out_for_delivery", "shipped", "ready_for_pickup"].includes(statusStr);

  const handleCall = () => {
    const phone = String(partner?.phone || "").replace(/\s/g, "");
    if (phone) Linking.openURL(`tel:${phone}`);
  };

  return (
    <View
      style={[
        figmaCardShell(isDark),
        styles.card,
        cardShadow,
        isActive && !compact && styles.cardActive,
        compact && styles.cardCompact,
        style,
      ]}
    >
      {showLiveMap && liveMapSlot ? <View style={styles.liveMapWrap}>{liveMapSlot}</View> : null}
      {!showLiveMap && isPast ? <StatusBand status={statusStr} isDark={isDark} /> : null}
      {isActive && !showLiveMap ? (
        <LinearGradient
          colors={isDark ? ["#BC905C", "#8a5a12"] : ["#DCAC74", "#244424"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.activeBar}
        />
      ) : null}

      <View style={[styles.body, compact && styles.bodyCompact]}>
        <View style={styles.headRow}>
          <View style={styles.headText}>
            <Text style={[styles.orderKicker, figmaTextMuted(isDark)]}>
              {MY_ORDERS_UI.orderPrefix} #{shortId}
            </Text>
            <Text style={[figmaDisplayTitle(compact ? 17 : 20, isDark), styles.orderTitle]}>
              {formatINR(order?.totalPrice)}
            </Text>
          </View>
          <StatusChip status={statusStr} c={c} isDark={isDark} />
        </View>

        <View style={[styles.summaryRow, { backgroundColor: isDark ? "rgba(255,255,255,0.04)" : "rgba(250,245,236,0.8)" }]}>
          <Ionicons name={I.items} size={14} color={FIGMA.goldDeep} />
          <Text style={[styles.summaryText, figmaTextPrimary(isDark)]} numberOfLines={1}>
            {itemsSummary}
          </Text>
          <Text style={[styles.summaryMeta, figmaTextMuted(isDark)]}>
            · {itemCount} {MY_ORDERS_UI.itemsLabel}
          </Text>
        </View>

        {createdLabel ? (
          <View style={styles.dateRow}>
            <Ionicons name={I.date} size={12} color={isDark ? "rgba(245,239,228,0.5)" : FIGMA.inkSoft} />
            <Text style={[styles.dateText, figmaTextMuted(isDark)]}>{createdLabel}</Text>
          </View>
        ) : null}

        <InvoiceMetaRow order={order} />

        {isActive ? (
          showLiveMap && compact ? (
            <KankregOrderTrack status={statusStr} compact showStatusHint={false} />
          ) : (
            <OrderProgressStrip status={statusStr} c={c} isDark={isDark} compact={compact} />
          )
        ) : null}

        {compact && compactShipLine ? (
          <View style={styles.shipRow}>
            <Ionicons name={I.ship} size={14} color={FIGMA.goldDeep} />
            <Text style={[styles.shipText, figmaTextMuted(isDark)]} numberOfLines={1}>
              {compactShipLine}
            </Text>
          </View>
        ) : null}

        {showPartner ? (
          <View style={[styles.partnerRow, figmaRowBorder(isDark), { backgroundColor: isDark ? "#181513" : FIGMA.card }]}>
            <LinearGradient colors={["#DCAC74", "#244424"]} style={styles.partnerAvatar}>
              <Text style={styles.partnerInitial}>{getPartnerInitial(partner.name)}</Text>
            </LinearGradient>
            <View style={styles.partnerText}>
              <Text style={[styles.partnerName, figmaTextPrimary(isDark)]} numberOfLines={1}>
                {partner.name}
              </Text>
              <Text style={[styles.partnerMeta, figmaTextMuted(isDark)]}>{MY_ORDERS_UI.partnerOnWay}</Text>
            </View>
            {partner.phone ? (
              <Pressable style={styles.callBtn} onPress={handleCall} accessibilityLabel={MY_ORDERS_UI.callPartner}>
                <Ionicons name={I.call} size={15} color="#fff" />
              </Pressable>
            ) : null}
          </View>
        ) : null}

        {children}
      </View>
    </View>
  );
}

const OrdersPremiumCard = memo(OrdersPremiumCardBase);
export default OrdersPremiumCard;

const styles = StyleSheet.create({
  card: {
    borderRadius: 18,
    overflow: "hidden",
    marginBottom: 12,
    marginHorizontal: FIGMA.gutter,
  },
  cardActive: {
    borderLeftWidth: 3,
    borderLeftColor: FIGMA.goldDeep,
  },
  cardCompact: {
    marginBottom: 8,
    borderRadius: 14,
  },
  activeBar: {
    height: 3,
    width: "100%",
  },
  statusBand: {
    minHeight: 44,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingHorizontal: 14,
  },
  statusBandText: {
    fontFamily: FONT_BODY_SEMIBOLD,
    fontSize: 14,
    letterSpacing: -0.2,
  },
  bodyCompact: {
    padding: 12,
    paddingTop: 10,
  },
  liveMapWrap: {
    minHeight: 148,
    overflow: "hidden",
  },
  body: {
    padding: 14,
    paddingTop: 12,
    gap: 2,
  },
  headRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 10,
    marginBottom: 8,
  },
  headText: {
    flex: 1,
    minWidth: 0,
  },
  orderKicker: {
    fontFamily: fonts.bold,
    fontSize: 9,
    letterSpacing: 1.2,
    textTransform: "uppercase",
  },
  orderTitle: {
    marginTop: 2,
    letterSpacing: -0.5,
  },
  summaryRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 10,
    marginBottom: 6,
  },
  summaryText: {
    flex: 1,
    fontFamily: fonts.semibold,
    fontSize: 12,
    minWidth: 0,
  },
  summaryMeta: {
    fontFamily: fonts.medium,
    fontSize: 10,
  },
  dateRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginBottom: 8,
  },
  dateText: {
    fontFamily: fonts.regular,
    fontSize: 11,
  },
  statusChip: {
    borderRadius: radius.md,
    borderWidth: 1,
    paddingHorizontal: 9,
    paddingVertical: 4,
    alignSelf: "flex-start",
  },
  statusChipText: {
    fontFamily: fonts.bold,
    fontSize: 9,
    letterSpacing: 0.2,
  },
  shipRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 6,
  },
  shipText: {
    flex: 1,
    fontFamily: fonts.medium,
    fontSize: 11,
  },
  partnerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: 4,
    marginBottom: 4,
    padding: 10,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
  },
  partnerAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  partnerInitial: {
    fontFamily: fonts.semibold,
    fontSize: 14,
    color: "#fff",
  },
  partnerText: {
    flex: 1,
    minWidth: 0,
  },
  partnerName: {
    fontFamily: fonts.semibold,
    fontSize: 12,
  },
  partnerMeta: {
    fontFamily: fonts.regular,
    fontSize: 10,
    marginTop: 1,
  },
  callBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: FIGMA.green,
    alignItems: "center",
    justifyContent: "center",
  },
});
