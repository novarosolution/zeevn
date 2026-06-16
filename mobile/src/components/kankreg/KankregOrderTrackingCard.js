import React from "react";
import { Linking, Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { MY_ORDERS_UI } from "../../content/appContent";
import {
  FIGMA,
  figmaCardShell,
  figmaDisplayTitle,
  figmaRowBorder,
  figmaTextMuted,
  figmaTextPrimary,
} from "../../theme/figmaApp";
import { useTheme } from "../../context/ThemeContext";
import {
  formatOrderItemsSummary,
  formatOrderShortId,
  formatOrderStatusLabel,
  getOrderStatusTagTone,
  getPartnerInitial,
} from "../../utils/orderDisplay";
import { fonts } from "../../theme/tokens";
import NativeTag from "../native/NativeTag";
import KankregOrderTrack from "./KankregOrderTrack";

function StaticMapHero({ etaLabel }) {
  return (
    <View style={styles.mapShell}>
      <LinearGradient
        colors={["rgba(60,98,72,0.05)", "rgba(60,98,72,0.02)"]}
        style={StyleSheet.absoluteFill}
      />
      <View style={styles.gridH} />
      <View style={styles.gridV} />
      <View style={[styles.mapPin, styles.mapPinStart]} />
      <View style={styles.mapVan}>
        <Ionicons name="bicycle-outline" size={16} color={FIGMA.goldDeep} />
      </View>
      <View style={[styles.mapPin, styles.mapPinEnd]} />
      {etaLabel ? (
        <View style={styles.etaBadge}>
          <Text style={styles.etaText}>
            {MY_ORDERS_UI.etaPrefix}{" "}
            <Text style={styles.etaStrong}>{etaLabel}</Text>
          </Text>
        </View>
      ) : null}
    </View>
  );
}

/**
 * figmaforkankreg.html order tracking card — app + web.
 */
export default function KankregOrderTrackingCard({
  order,
  showLiveMap = false,
  liveMapSlot = null,
  etaLabel,
  style,
  children,
}) {
  const { isDark } = useTheme();
  const shortId = formatOrderShortId(order?._id);
  const summary = formatOrderItemsSummary(order?.products);
  const statusLabel = formatOrderStatusLabel(order?.status);
  const partner = order?.assignedDeliveryUser;
  const showPartner =
    partner?.name &&
    ["out_for_delivery", "shipped", "ready_for_pickup"].includes(String(order?.status || ""));

  const handleCall = () => {
    const phone = String(partner?.phone || "").replace(/\s/g, "");
    if (!phone) return;
    Linking.openURL(`tel:${phone}`);
  };

  return (
    <View style={[figmaCardShell(isDark), styles.card, style]}>
      {showLiveMap && liveMapSlot ? (
        <View style={styles.liveMapWrap}>{liveMapSlot}</View>
      ) : (
        <StaticMapHero etaLabel={etaLabel} />
      )}

      <View style={styles.body}>
        <View style={styles.headRow}>
          <View style={styles.headText}>
            <Text style={[styles.orderKicker, figmaTextMuted(isDark)]}>
              {MY_ORDERS_UI.orderPrefix} #{shortId}
            </Text>
            <Text style={[figmaDisplayTitle(14, isDark), styles.summary]} numberOfLines={2}>
              {summary}
            </Text>
          </View>
          <NativeTag label={statusLabel} tone={getOrderStatusTagTone(order?.status)} />
        </View>

        <KankregOrderTrack status={order?.status} compact showStatusHint={false} />

        {showPartner ? (
          <View
            style={[
              styles.partnerRow,
              figmaRowBorder(isDark),
              { backgroundColor: isDark ? "#181513" : FIGMA.card },
            ]}
          >
            <LinearGradient
              colors={["#DCAC74", "#244424"]}
              style={styles.partnerAvatar}
            >
              <Text style={styles.partnerInitial}>{getPartnerInitial(partner.name)}</Text>
            </LinearGradient>
            <View style={styles.partnerText}>
              <Text style={[styles.partnerName, figmaTextPrimary(isDark)]}>
                {partner.name} · {MY_ORDERS_UI.partnerRole}
              </Text>
              <Text style={[styles.partnerMeta, figmaTextMuted(isDark)]}>{MY_ORDERS_UI.partnerOnWay}</Text>
            </View>
            {partner.phone ? (
              <Pressable style={styles.callBtn} onPress={handleCall} accessibilityLabel="Call partner">
                <Ionicons name="call" size={15} color="#fff" />
              </Pressable>
            ) : null}
          </View>
        ) : null}

        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    overflow: "hidden",
    marginBottom: 12,
    marginHorizontal: FIGMA.gutter,
  },
  liveMapWrap: {
    minHeight: 150,
    overflow: "hidden",
  },
  mapShell: {
    height: 150,
    backgroundColor: "#f3ecdb",
    overflow: "hidden",
    position: "relative",
  },
  gridH: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.35,
    borderTopWidth: 1,
    borderTopColor: "#ece5d4",
  },
  gridV: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.2,
    borderLeftWidth: 1,
    borderLeftColor: "#ece5d4",
  },
  mapPin: {
    position: "absolute",
    width: 18,
    height: 18,
    borderRadius: 9,
    borderTopLeftRadius: 2,
    transform: [{ rotate: "45deg" }],
  },
  mapPinStart: {
    left: "10%",
    top: "74%",
    backgroundColor: FIGMA.green,
  },
  mapPinEnd: {
    right: "8%",
    top: "12%",
    backgroundColor: FIGMA.gold,
  },
  mapVan: {
    position: "absolute",
    left: "46%",
    top: "42%",
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#fff",
    borderWidth: 2,
    borderColor: FIGMA.gold,
    alignItems: "center",
    justifyContent: "center",
  },
  etaBadge: {
    position: "absolute",
    left: 10,
    top: 10,
    backgroundColor: "rgba(25,20,15,0.9)",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 9,
  },
  etaText: {
    fontFamily: fonts.regular,
    fontSize: 10,
    color: "#fff",
  },
  etaStrong: {
    fontFamily: fonts.bold,
    color: FIGMA.goldBright,
  },
  body: {
    padding: 14,
  },
  headRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 10,
  },
  headText: {
    flex: 1,
    minWidth: 0,
  },
  orderKicker: {
    fontFamily: fonts.bold,
    fontSize: 9,
    letterSpacing: 0.5,
  },
  summary: {
    marginTop: 4,
    fontWeight: "500",
  },
  partnerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginTop: 12,
    padding: 12,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
  },
  partnerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  partnerInitial: {
    fontFamily: fonts.semibold,
    fontSize: 16,
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
    marginTop: 2,
  },
  callBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: FIGMA.green,
    alignItems: "center",
    justifyContent: "center",
  },
});
