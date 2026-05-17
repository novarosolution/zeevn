import React from "react";
import { Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Card from "../ui/Card";
import Button from "../ui/Button";
import OrderStatusBadge from "./OrderStatusBadge";
import useElapsedTimer from "../../hooks/useElapsedTimer";
import { useTheme } from "../../context/ThemeContext";
import { fonts, icon } from "../../theme/tokens";
import { openNavigateToDropoff } from "../orders/orderLiveMapShared";
import { OPS_UI } from "../../content/appContent";

/**
 * Highlight card for the in-progress delivery: brass status + elapsed timer.
 */
export default function DeliveryActiveCard({ order, onNavigate }) {
  const { semanticPalette, TYPE, SPACING } = useTheme();
  const addr = order?.shippingAddress || {};
  const startedAt = order?.updatedAt || order?.createdAt;
  const { label: timerLabel } = useElapsedTimer(startedAt);
  const lat = Number(addr.latitude);
  const lng = Number(addr.longitude);
  const addressQuery = [addr.line1, addr.city, addr.state, addr.postalCode, addr.country]
    .filter((x) => String(x || "").trim())
    .join(", ");
  const hasNav = (Number.isFinite(lat) && Number.isFinite(lng)) || Boolean(addressQuery);

  return (
    <Card padding="md" style={{ marginBottom: SPACING.md, borderWidth: 1, borderColor: semanticPalette.accentSoft }}>
      <View style={{ flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", gap: SPACING.md }}>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text
            style={{
              fontFamily: fonts.semibold,
              fontSize: TYPE.micro.fontSize,
              letterSpacing: 1.1,
              textTransform: "uppercase",
              color: semanticPalette.accent,
            }}
          >
            {OPS_UI.delivery.activeDelivery}
          </Text>
          <Text
            style={{
              fontFamily: TYPE.serifFamily,
              fontSize: TYPE.h3.fontSize,
              color: semanticPalette.ink,
              marginTop: SPACING.xs,
            }}
            numberOfLines={1}
          >
            #{String(order?._id || "").slice(-6).toUpperCase()}
          </Text>
          <Text
            style={{
              fontFamily: fonts.regular,
              fontSize: TYPE.small.fontSize,
              color: semanticPalette.inkSoft,
              marginTop: 4,
            }}
            numberOfLines={2}
          >
            {addr.fullName || order?.user?.name || "Customer"}
            {addr.line1 ? ` · ${addr.line1}` : ""}
          </Text>
        </View>
        <OrderStatusBadge status={order?.status} context="delivery" />
      </View>

      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: SPACING.sm,
          marginTop: SPACING.md,
          paddingTop: SPACING.md,
          borderTopWidth: 1,
          borderTopColor: semanticPalette.line,
        }}
      >
        <Ionicons name="time-outline" size={icon.md} color={semanticPalette.accent} />
        <View>
          <Text
            style={{
              fontFamily: fonts.semibold,
              fontSize: TYPE.micro.fontSize,
              letterSpacing: 0.8,
              textTransform: "uppercase",
              color: semanticPalette.inkMuted,
            }}
          >
            {OPS_UI.delivery.elapsed}
          </Text>
          <Text
            style={{
              fontFamily: TYPE.serifFamily,
              fontSize: TYPE.h2.fontSize,
              color: semanticPalette.ink,
            }}
          >
            {timerLabel}
          </Text>
        </View>
      </View>

      {hasNav ? (
        <Button
          variant="secondary"
          size="sm"
          label={OPS_UI.delivery.openRoute}
          iconLeft={<Ionicons name="navigate-outline" size={icon.sm} color={semanticPalette.ink} />}
          onPress={() => {
            if (onNavigate) {
              onNavigate();
              return;
            }
            openNavigateToDropoff({ latitude: addr.latitude, longitude: addr.longitude, addressQuery });
          }}
          style={{ marginTop: SPACING.md, alignSelf: "flex-start" }}
        />
      ) : null}
    </Card>
  );
}
