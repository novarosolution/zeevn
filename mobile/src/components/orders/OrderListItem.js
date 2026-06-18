import React, { memo } from "react";
import { Platform, StyleSheet, Text, View } from "react-native";
import { MY_ORDERS_UI } from "../../content/appContent";
import PaymentStatusBanner from "../payments/PaymentStatusBanner";
import OrderLiveMapCard from "./OrderLiveMapCard";
import OrdersPremiumCard from "./OrdersPremiumCard";
import OrderDetailPanel from "./OrderDetailPanel";
import OrderCardActions from "./OrderCardActions";
import PremiumInput from "../ui/PremiumInput";
import PremiumButton from "../ui/PremiumButton";
import { isDeliveredOrder } from "../../utils/orderStatus";
import { fonts, spacing } from "../../theme/tokens";
import { useTheme } from "../../context/ThemeContext";

const ORDER_STATUSES_WITH_LIVE_MAP = new Set(["ready_for_pickup", "shipped", "out_for_delivery"]);
const { addressFields, addressFieldRows } = MY_ORDERS_UI;

function OrderListItem({
  order,
  compact,
  expanded,
  editing,
  addressForm,
  onAddressChange,
  onToggleDetails,
  onOpenEditAddress,
  onSaveAddress,
  onCancelEdit,
  onDownloadInvoice,
  onClaimReward,
  onReorder,
  canEditAddress,
  downloading,
  claimingReward,
  saving,
  reordering,
  token,
  user,
  onRefreshOrders,
}) {
  const { colors: c } = useTheme();
  const statusStr = String(order?.status || "");
  const showLiveMap = ORDER_STATUSES_WITH_LIVE_MAP.has(statusStr);

  return (
    <OrdersPremiumCard
      order={order}
      compact={compact}
      showLiveMap={showLiveMap}
      liveMapSlot={showLiveMap ? <OrderLiveMapCard orderId={order._id} /> : null}
    >
      {statusStr === "pending_payment" && order.paymentStatus === "pending" ? (
        <PaymentStatusBanner order={order} token={token} user={user} onRefresh={onRefreshOrders} />
      ) : null}

      <OrderCardActions
        expanded={expanded}
        onToggleDetails={onToggleDetails}
        onChangeAddress={onOpenEditAddress}
        canEditAddress={canEditAddress}
        onDownloadInvoice={onDownloadInvoice}
        downloading={downloading}
        invoiceReady={Boolean(order)}
        onClaimReward={onClaimReward}
        claimingReward={claimingReward}
        rewardClaimed={Boolean(order.reward?.claimedAt)}
        showReward={isDeliveredOrder(statusStr)}
        onReorder={onReorder}
        reordering={reordering}
      />

      {expanded ? <OrderDetailPanel order={order} /> : null}

      {editing ? (
        <View style={styles.editBox}>
          <Text style={[styles.editTitle, { color: c.textPrimary }]}>{MY_ORDERS_UI.editAddressTitle}</Text>
          {addressFieldRows.map((rowKeys) => (
            <View key={rowKeys.join("-")} style={rowKeys.length > 1 ? styles.splitRow : null}>
              {rowKeys.map((key) => {
                const field = addressFields[key];
                if (!field) return null;
                return (
                  <View key={key} style={rowKeys.length > 1 ? styles.halfField : styles.fieldWrap}>
                    <PremiumInput
                      label={field.label}
                      value={addressForm[key] || ""}
                      onChangeText={(value) => onAddressChange(key, value)}
                      iconLeft={field.icon}
                      keyboardType={field.keyboardType}
                      autoCapitalize={field.autoCapitalize}
                    />
                  </View>
                );
              })}
            </View>
          ))}
          <View style={styles.editActions}>
            <PremiumButton
              label={saving ? MY_ORDERS_UI.savingAddress : MY_ORDERS_UI.saveAddress}
              size="sm"
              variant="primary"
              onPress={onSaveAddress}
              disabled={saving}
            />
            <PremiumButton label={MY_ORDERS_UI.cancel} size="sm" variant="ghost" onPress={onCancelEdit} />
          </View>
        </View>
      ) : null}
    </OrdersPremiumCard>
  );
}

const styles = StyleSheet.create({
  editBox: {
    marginTop: spacing.sm,
  },
  editTitle: {
    fontFamily: fonts.extrabold,
    fontSize: 13,
    marginBottom: spacing.xs,
  },
  fieldWrap: {
    marginBottom: spacing.xs,
  },
  splitRow: {
    flexDirection: "row",
    gap: spacing.sm,
    flexWrap: Platform.OS === "web" ? "nowrap" : "wrap",
  },
  halfField: {
    flex: 1,
    minWidth: Platform.OS === "web" ? 120 : "45%",
    marginBottom: spacing.xs,
  },
  editActions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
});

export default memo(OrderListItem);
