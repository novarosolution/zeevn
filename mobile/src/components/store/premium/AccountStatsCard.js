import React, { memo, useEffect, useMemo, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../../../context/AuthContext";
import { fetchMyOrders } from "../../../services/userService";
import { useStoreTheme } from "../../../theme/storefront";
import { formatINRCompact } from "../../../utils/currency";
import { summariseOrders } from "../../../utils/orderInsights";
import PremiumBoundary from "./PremiumBoundary";

function monthYear(ms) {
  if (!ms) return "";
  const d = new Date(ms);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-IN", { month: "short", year: "numeric" });
}

function Stat({ icon, value, label, last }) {
  const { c, type } = useStoreTheme();
  return (
    <View style={[styles.stat, !last && { borderRightColor: c.line, borderRightWidth: StyleSheet.hairlineWidth }]}>
      <Ionicons name={icon} size={18} color={c.brand} />
      <Text style={type.display(22, { semi: true, ls: -0.3, lh: 26 })} numberOfLines={1}>
        {value}
      </Text>
      <Text style={type.ui(11.5, "semibold", c.inkMute, { letterSpacing: 0.3 })} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

/**
 * Lifetime strip for the account page: orders delivered, jars received, total spent, and "with us since". Built from the
 * shopper's own delivered orders, so it is hidden until they have one.
 *
 * props: orders (optional — when omitted the card loads them itself), style
 */
function AccountStatsCardBase({ orders: ordersProp, style }) {
  const { isAuthenticated, token } = useAuth();
  const { c, r, type, shadow } = useStoreTheme();
  const [loaded, setLoaded] = useState(null);

  useEffect(() => {
    if (ordersProp || !isAuthenticated) return undefined;
    let alive = true;
    fetchMyOrders(token)
      .then((list) => alive && setLoaded(Array.isArray(list) ? list : []))
      .catch(() => alive && setLoaded([]));
    return () => {
      alive = false;
    };
  }, [ordersProp, isAuthenticated, token]);

  const stats = useMemo(() => summariseOrders(ordersProp || loaded || []), [ordersProp, loaded]);
  if (!stats.delivered) return null;

  const since = monthYear(stats.memberSince);
  return (
    <View style={[styles.card, shadow.soft, { backgroundColor: c.card, borderColor: c.line, borderRadius: r.xl }, style]}>
      <View style={styles.row}>
        <Stat icon="cube-outline" value={String(stats.delivered)} label="DELIVERED" />
        <Stat icon="flask-outline" value={String(stats.jars)} label="JARS" />
        <Stat icon="wallet-outline" value={formatINRCompact(stats.spent)} label="SPENT" last />
      </View>
      {since ? (
        <Text style={[type.ui(12, "medium", c.inkMute), styles.since]}>With Zeevan since {since}</Text>
      ) : null}
    </View>
  );
}

const Memo = memo(AccountStatsCardBase);

export default function AccountStatsCard(props) {
  return (
    <PremiumBoundary name="AccountStatsCard">
      <Memo {...props} />
    </PremiumBoundary>
  );
}

const styles = StyleSheet.create({
  card: { borderWidth: StyleSheet.hairlineWidth, paddingTop: 14, paddingBottom: 12 },
  row: { flexDirection: "row" },
  stat: { flex: 1, alignItems: "center", gap: 3, paddingHorizontal: 6 },
  since: { textAlign: "center", marginTop: 10 },
});
