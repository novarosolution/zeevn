import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Alert, Linking, Pressable, StyleSheet, Text, View } from "react-native";
import useFlyToCart from "../../hooks/useFlyToCart";
import { Image } from "expo-image";
import AccountLayout from "../../components/account/AccountLayout";
import OrderDetailTimeline from "../../components/account/orders/OrderDetailTimeline";
import ReorderConfirmModal from "../../components/account/orders/ReorderConfirmModal";
import Card from "../../components/ui/Card";
import Button from "../../components/ui/Button";
import Badge from "../../components/ui/Badge";
import SectionHeader from "../../components/ui/SectionHeader";
import { ORDER_DETAIL_SCREEN, SUPPORT_SCREEN, fillPlaceholders } from "../../content/appContent";
import { ACCOUNT_NESTED } from "../../navigation/accountRoutes";
import { reorderMyOrderRequest } from "../../services/orderService";
import { fetchMyOrders } from "../../services/userService";
import { useAuth } from "../../context/AuthContext";
import { useCart } from "../../context/CartContext";
import { useTheme } from "../../context/ThemeContext";
import { fonts } from "../../theme/tokens";
import { formatINR } from "../../utils/currency";
import { getImageUriCandidates } from "../../utils/image";
import {
  canEditOrderAddress,
  formatOrderDisplayId,
  getOrderStatusBucket,
  getStatusBadgeVariant,
  getStatusDisplayLabel,
} from "../../utils/orderPresentation";
import { isCancelledOrder } from "../../utils/orderStatus";

const copy = ORDER_DETAIL_SCREEN;

export default function AccountOrderDetailScreen({ navigation, route }) {
  const { token } = useAuth();
  const { refreshCartFromServer } = useCart();
  const { semanticPalette, TYPE, SPACING, RADII } = useTheme();
  const [order, setOrder] = useState(route?.params?.order || null);
  const [reorderOpen, setReorderOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  const { triggerFlyToCart, FlyGhostLayer } = useFlyToCart({
    onComplete: () => navigation.navigate("Cart"),
  });

  useEffect(() => {
    const incoming = route?.params?.order;
    const oid = route?.params?.orderId;
    if (incoming) {
      setOrder(incoming);
      return;
    }
    if (!oid || !token) return;
    let cancelled = false;
    (async () => {
      try {
        const list = await fetchMyOrders(token);
        const found = (Array.isArray(list) ? list : []).find((o) => String(o._id) === String(oid));
        if (!cancelled) setOrder(found || null);
      } catch {
        if (!cancelled) setOrder(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [route?.params?.order, route?.params?.orderId, token]);

  const orderId = formatOrderDisplayId(order);
  const bucket = getOrderStatusBucket(order?.status);
  const cancelled = isCancelledOrder(order?.status);

  const breakdown = useMemo(() => {
    const pb = order?.priceBreakdown || {};
    const itemsTotal = Number(pb.itemsTotal ?? 0) || (order?.products || []).reduce(
      (s, p) => s + Number(p.price || 0) * Number(p.quantity || 1),
      0
    );
    const deliveryFee = Number(pb.deliveryFee ?? 0);
    const discount = Number(pb.discountAmount ?? 0) + Number(order?.coupon?.discountAmount ?? 0);
    const tax = Number(pb.platformFee ?? 0) + Number(order?.invoice?.taxAmount ?? 0);
    return { itemsTotal, deliveryFee, discount, tax };
  }, [order]);

  const confirmReorder = useCallback(
    async (flyMeta) => {
      if (!token || !order?._id) return;
      try {
        setBusy(true);
        await reorderMyOrderRequest(token, order._id);
        await refreshCartFromServer?.();
        setReorderOpen(false);
        if (flyMeta?.sourceRect) {
          triggerFlyToCart(flyMeta);
        } else {
          navigation.navigate("Cart");
        }
      } catch {
        /* noop */
      } finally {
        setBusy(false);
      }
    },
    [navigation, order?._id, refreshCartFromServer, token, triggerFlyToCart]
  );

  const addr = order?.shippingAddress;

  if (!order) {
    return (
      <AccountLayout navigation={navigation} activeKey={ACCOUNT_NESTED.Orders} activeSection="orders" pageTitle={copy.notFound}>
        <Text style={{ fontFamily: fonts.regular, color: semanticPalette.inkMuted }}>{copy.notFound}</Text>
        <Button label={copy.backToOrders} variant="secondary" size="sm" onPress={() => navigation.navigate(ACCOUNT_NESTED.Orders)} />
      </AccountLayout>
    );
  }

  return (
    <AccountLayout
      navigation={navigation}
      activeKey={ACCOUNT_NESTED.Orders}
      activeSection="orders"
      pageTitle={fillPlaceholders(copy.orderTitleTemplate, { id: orderId })}
      pageSubtitle={`${getStatusDisplayLabel(order.status)} · ${new Date(order.createdAt || Date.now()).toLocaleDateString()}`}
    >
      <ReorderConfirmModal
        visible={reorderOpen}
        items={order.products}
        busy={busy}
        onCancel={() => !busy && setReorderOpen(false)}
        onConfirm={confirmReorder}
      />
      <FlyGhostLayer />

      <Text
        style={{
          fontFamily: fonts.medium,
          fontSize: 12,
          letterSpacing: 0.6,
          textTransform: "uppercase",
          color: semanticPalette.inkMuted,
          marginBottom: SPACING.md,
        }}
      >
        Account › {copy.breadcrumbOrders} › {orderId}
      </Text>

      <View style={{ marginBottom: SPACING.lg }}>
        <Badge variant={getStatusBadgeVariant(order.status)} size="sm">
          {getStatusDisplayLabel(order.status)}
        </Badge>
      </View>

      <View style={{ gap: SPACING.xl }}>
        <OrderDetailTimeline order={order} />

        <View>
          <Card padding="lg">
            {(order.products || []).map((line, idx) => {
              const uri = getImageUriCandidates(line.image || "")[0] || "";
              const qty = Number(line.quantity || 1);
              const price = Number(line.price || 0);
              return (
                <View
                  key={`${line.product || line.name}-${idx}`}
                  style={{
                    flexDirection: "row",
                    gap: SPACING.md,
                    paddingVertical: SPACING.md,
                    borderTopWidth: idx > 0 ? StyleSheet.hairlineWidth : 0,
                    borderTopColor: semanticPalette.lineSoft,
                  }}
                >
                  {uri ? (
                    <Image
                      source={{ uri }}
                      style={{ width: 64, height: 80, borderRadius: 8 }}
                      contentFit="cover"
                      accessibilityLabel={String(line.name || "Product")}
                    />
                  ) : (
                    <View style={{ width: 64, height: 80, borderRadius: 8, backgroundColor: semanticPalette.surfaceAlt }} />
                  )}
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontFamily: fonts.semibold, fontSize: TYPE.body.fontSize, color: semanticPalette.ink }}>{line.name}</Text>
                    {line.variantLabel ? (
                      <Text style={{ fontFamily: fonts.regular, fontSize: 12, color: semanticPalette.inkMuted, marginTop: 2 }}>
                        {line.variantLabel}
                      </Text>
                    ) : null}
                    <Text style={{ fontFamily: fonts.regular, fontSize: 12, color: semanticPalette.inkMuted, marginTop: 4 }}>
                      Qty {qty}
                    </Text>
                  </View>
                  <Text style={{ fontFamily: fonts.semibold, fontSize: TYPE.body.fontSize, color: semanticPalette.ink }}>
                    {formatINR(price * qty)}
                  </Text>
                </View>
              );
            })}
            <View
              style={{
                marginTop: SPACING.md,
                paddingTop: SPACING.md,
                borderTopWidth: StyleSheet.hairlineWidth,
                borderTopColor: semanticPalette.line,
                flexDirection: "row",
                justifyContent: "space-between",
              }}
            >
              <Text style={{ fontFamily: fonts.semibold, fontSize: TYPE.body.fontSize, color: semanticPalette.ink }}>Items total</Text>
              <Text style={{ fontFamily: fonts.semibold, fontSize: TYPE.body.fontSize, color: semanticPalette.ink }}>
                {formatINR(breakdown.itemsTotal)}
              </Text>
            </View>
          </Card>
        </View>

        <View>
          <SectionHeader overline={copy.sections.shipping.overline} title={copy.sections.shipping.title} />
          <Card padding="lg">
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", gap: SPACING.md }}>
              <View style={{ flex: 1 }}>
                <Text style={{ fontFamily: fonts.semibold, fontSize: TYPE.body.fontSize, color: semanticPalette.ink }}>{addr?.fullName}</Text>
                <Text style={{ marginTop: 4, fontFamily: fonts.regular, fontSize: TYPE.body.fontSize, color: semanticPalette.inkSoft }}>
                  {[addr?.line1, addr?.city, addr?.state, addr?.postalCode].filter(Boolean).join(", ")}
                </Text>
                <Text style={{ marginTop: 4, fontFamily: fonts.regular, fontSize: TYPE.small.fontSize, color: semanticPalette.inkMuted }}>
                  {addr?.phone}
                </Text>
              </View>
              {canEditOrderAddress(order.status) ? (
                <Pressable onPress={() => navigation.navigate(ACCOUNT_NESTED.Addresses)} hitSlop={8}>
                  <Text style={{ fontFamily: fonts.semibold, fontSize: 14, color: semanticPalette.accent }}>{copy.actions.changeAddress}</Text>
                </Pressable>
              ) : null}
            </View>
          </Card>
        </View>

        <View>
          <SectionHeader overline={copy.sections.payment.overline} title={copy.sections.payment.title} />
          <Card padding="lg" contentStyle={{ gap: SPACING.sm }}>
            <Row label={copy.payment.subtotal} value={formatINR(breakdown.itemsTotal)} />
            <Row
              label={copy.payment.shipping}
              value={breakdown.deliveryFee <= 0 ? copy.payment.shippingFree : formatINR(breakdown.deliveryFee)}
            />
            {breakdown.discount > 0 ? (
              <Row label={copy.payment.discount} value={`−${formatINR(breakdown.discount)}`} valueColor={semanticPalette.accent} />
            ) : null}
            {breakdown.tax > 0 ? <Row label={copy.payment.tax} value={formatINR(breakdown.tax)} /> : null}
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                marginTop: SPACING.sm,
                paddingTop: SPACING.sm,
                borderTopWidth: StyleSheet.hairlineWidth,
                borderTopColor: semanticPalette.line,
              }}
            >
              <Text style={{ fontFamily: fonts.bold, fontSize: TYPE.h3.fontSize, color: semanticPalette.ink }}>{copy.payment.total}</Text>
              <Text style={{ fontFamily: fonts.bold, fontSize: TYPE.h3.fontSize, color: semanticPalette.ink }}>{formatINR(order.totalPrice)}</Text>
            </View>
            <Text style={{ fontFamily: fonts.regular, fontSize: 12, color: semanticPalette.inkMuted, marginTop: SPACING.xs }}>
              {fillPlaceholders(copy.payment.paidWithTemplate, {
                method: order.paymentMethod || "Cash on Delivery",
              })}
            </Text>
          </Card>
        </View>

        <Card padding="lg">
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: SPACING.sm }}>
            <Button
              label={copy.actions.downloadInvoice}
              variant="secondary"
              size="md"
              style={{ flexGrow: 1, minWidth: 140 }}
              onPress={() => Alert.alert(copy.actions.downloadInvoice, copy.invoiceSoon)}
            />
            {bucket === "active" ? (
              <Button label={copy.actions.track} variant="primary" size="md" style={{ flexGrow: 1, minWidth: 140 }} onPress={() => {}} />
            ) : (
              <Button
                label={copy.actions.reorder}
                variant="primary"
                size="md"
                style={{ flexGrow: 1, minWidth: 140 }}
                onPress={() => setReorderOpen(true)}
              />
            )}
            {bucket === "delivered" && !cancelled ? (
              <Button
                label={copy.actions.returnItem}
                variant="ghost"
                size="md"
                style={{ flexGrow: 1, minWidth: 140 }}
                onPress={() => navigation.navigate("Support")}
              />
            ) : null}
            <Button
              label={copy.actions.getHelp}
              variant="ghost"
              size="md"
              style={{ flexGrow: 1, minWidth: 140 }}
              onPress={() => navigation.navigate("Support")}
            />
          </View>
        </Card>

        <View>
          <SectionHeader overline={copy.sections.help.overline} title={copy.sections.help.title} />
          <Card padding="md">
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: SPACING.sm }}>
              <Button
                label={copy.actions.whatsapp}
                variant="secondary"
                size="sm"
                style={{ flex: 1, minWidth: 120 }}
                onPress={() => SUPPORT_SCREEN.whatsappUrl && Linking.openURL(SUPPORT_SCREEN.whatsappUrl)}
              />
              <Button
                label={copy.actions.email}
                variant="secondary"
                size="sm"
                style={{ flex: 1, minWidth: 120 }}
                onPress={() => Linking.openURL(`mailto:${SUPPORT_SCREEN.contactEmailSub}`)}
              />
              <Button
                label={copy.actions.call}
                variant="secondary"
                size="sm"
                style={{ flex: 1, minWidth: 120 }}
                onPress={() => Linking.openURL(`tel:${SUPPORT_SCREEN.contactEmailSub}`)}
              />
            </View>
          </Card>
        </View>
      </View>
    </AccountLayout>
  );
}

function Row({ label, value, valueColor }) {
  const { semanticPalette, TYPE } = useTheme();
  return (
    <View style={{ flexDirection: "row", justifyContent: "space-between", gap: 12 }}>
      <Text style={{ fontFamily: fonts.regular, fontSize: TYPE.body.fontSize, color: semanticPalette.inkSoft }}>{label}</Text>
      <Text style={{ fontFamily: fonts.medium, fontSize: TYPE.body.fontSize, color: valueColor || semanticPalette.ink }}>{value}</Text>
    </View>
  );
}
