import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import Card from "../../ui/Card";
import HoverLiftCard from "../interactions/HoverLiftCard";
import Badge from "../../ui/Badge";
import Button from "../../ui/Button";
import { MY_ORDERS_SCREEN, fillPlaceholders } from "../../../content/appContent";
import { useTheme } from "../../../context/ThemeContext";
import { fonts } from "../../../theme/tokens";
import { formatINR } from "../../../utils/currency";
import { getImageUriCandidates } from "../../../utils/image";
import { headingA11yProps } from "../../../utils/a11y";
import {
  formatOrderDateLong,
  formatOrderDisplayId,
  formatOrderDateWithWeekday,
  formatOrderTime,
  getOrderStatusBucket,
  getStatusBadgeVariant,
  getStatusDisplayLabel,
  productsSummaryLine,
} from "../../../utils/orderPresentation";

const copy = MY_ORDERS_SCREEN;

function ThumbnailStrip({ products }) {
  const { semanticPalette } = useTheme();
  const items = (products || []).slice(0, 4);
  const extra = Math.max(0, (products || []).length - 4);

  return (
    <View style={{ flexDirection: "row", gap: 6 }}>
      {items.map((p, idx) => {
        const uri = getImageUriCandidates(p.image || "")[0] || "";
        const isLast = idx === 3 && extra > 0;
        return (
          <View key={`${p.product || p.name}-${idx}`} style={{ position: "relative" }}>
            {uri ? (
              <Image
                source={{ uri }}
                style={{
                  width: 48,
                  height: 60,
                  borderRadius: 8,
                  borderWidth: 1,
                  borderColor: semanticPalette.line,
                  backgroundColor: semanticPalette.surfaceAlt,
                }}
                contentFit="cover"
                accessibilityLabel={String(p.name || "Product")}
              />
            ) : (
              <View
                style={{
                  width: 48,
                  height: 60,
                  borderRadius: 8,
                  borderWidth: 1,
                  borderColor: semanticPalette.line,
                  backgroundColor: semanticPalette.surfaceAlt,
                }}
              />
            )}
            {isLast ? (
              <View
                style={{
                  ...StyleSheet.absoluteFillObject,
                  borderRadius: 8,
                  backgroundColor: "rgba(14,14,14,0.52)",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Text style={{ fontFamily: fonts.bold, fontSize: 12, color: "#fff" }}>+{extra}</Text>
              </View>
            ) : null}
          </View>
        );
      })}
    </View>
  );
}

function deliveryLine(order) {
  const bucket = getOrderStatusBucket(order?.status);
  const updated = order?.updatedAt || order?.createdAt;
  if (bucket === "active") {
    const eta = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000);
    return {
      text: fillPlaceholders(copy.delivery.arrivingTemplate, {
        date: formatOrderDateWithWeekday(eta),
        time: formatOrderTime(eta),
      }),
      icon: "time-outline",
      colorKey: "accent",
    };
  }
  if (bucket === "delivered") {
    return {
      text: fillPlaceholders(copy.delivery.deliveredTemplate, { date: formatOrderDateLong(updated) }),
      icon: "checkmark-circle-outline",
      colorKey: "success",
    };
  }
  if (bucket === "cancelled") {
    return {
      text: fillPlaceholders(copy.delivery.cancelledTemplate, { date: formatOrderDateLong(updated) }),
      icon: "information-circle-outline",
      colorKey: "muted",
    };
  }
  return null;
}

export default function OrderListCard({ order, onView, onTrack, onReorder, onReturn }) {
  const { semanticPalette, TYPE, SPACING } = useTheme();
  const bucket = getOrderStatusBucket(order?.status);
  const delivery = deliveryLine(order);
  const summary = productsSummaryLine(order?.products || [], copy.moreItemsTemplate, fillPlaceholders);

  return (
    <HoverLiftCard>
    <Card padding="lg" style={{ marginBottom: 0 }}>
      <View style={{ gap: SPACING.md }}>
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", gap: SPACING.sm }}>
          <Text
            {...headingA11yProps(3)}
            style={{
              fontFamily: fonts.semibold,
              fontSize: 12,
              letterSpacing: 0.8,
              textTransform: "uppercase",
              color: semanticPalette.inkMuted,
            }}
          >
            {fillPlaceholders(copy.orderIdTemplate, { id: formatOrderDisplayId(order) })}
          </Text>
          <Badge variant={getStatusBadgeVariant(order?.status)} size="sm">
            {getStatusDisplayLabel(order?.status)}
          </Badge>
        </View>

        <Text style={{ fontFamily: fonts.regular, fontSize: TYPE.small.fontSize, color: semanticPalette.inkMuted }}>
          {fillPlaceholders(copy.placedOnTemplate, { date: formatOrderDateLong(order?.createdAt) })}
          {" · "}
          {fillPlaceholders(copy.totalTemplate, { amount: formatINR(order?.totalPrice) })}
        </Text>

        <ThumbnailStrip products={order?.products} />
        {summary ? (
          <Text style={{ fontFamily: fonts.regular, fontSize: TYPE.small.fontSize, lineHeight: TYPE.small.lineHeight, color: semanticPalette.ink }}>
            {summary}
          </Text>
        ) : null}

        {delivery ? (
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
            <Ionicons
              name={delivery.icon}
              size={16}
              color={
                delivery.colorKey === "success"
                  ? semanticPalette.success
                  : delivery.colorKey === "accent"
                    ? semanticPalette.accent
                    : semanticPalette.inkMuted
              }
            />
            <Text
              style={{
                fontFamily: fonts.medium,
                fontSize: TYPE.small.fontSize,
                color: delivery.colorKey === "accent" ? semanticPalette.accent : semanticPalette.inkSoft,
              }}
            >
              {delivery.text}
            </Text>
          </View>
        ) : null}

        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: SPACING.sm }}>
          <Button label={copy.actions.viewOrder} variant="secondary" size="sm" onPress={onView} />
          <View style={{ flexDirection: "row", gap: SPACING.xs, flexWrap: "wrap" }}>
            {bucket === "active" ? (
              <Button label={copy.actions.track} variant="ghost" size="sm" onPress={onTrack} />
            ) : null}
            {bucket === "delivered" ? (
              <>
                <Button label={copy.actions.reorder} variant="ghost" size="sm" onPress={onReorder} />
                <Button label={copy.actions.returnItem} variant="ghost" size="sm" onPress={onReturn} />
              </>
            ) : null}
            {bucket === "cancelled" ? <Button label={copy.actions.reorder} variant="ghost" size="sm" onPress={onReorder} /> : null}
          </View>
        </View>
      </View>
    </Card>
    </HoverLiftCard>
  );
}
