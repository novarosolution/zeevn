import React, { memo } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { MY_ORDERS_UI } from "../../content/appContent";
import { ALCHEMY } from "../../theme/customerAlchemy";
import { FONT_PRICE } from "../../theme/typographyRoles";
import { useTheme } from "../../context/ThemeContext";
import { FIGMA } from "../../theme/figmaApp";
import { fonts, spacing } from "../../theme/tokens";
import { formatINR } from "../../utils/currency";

const { icons: I } = MY_ORDERS_UI;

function StatPill({ icon, label, value, accent, isDark }) {
  return (
    <View style={[styles.pill, { borderColor: isDark ? "#3f3933" : FIGMA.line, backgroundColor: isDark ? "#181513" : "#fffefb" }]}>
      <View style={[styles.pillIcon, { backgroundColor: `${accent}18` }]}>
        <Ionicons name={icon} size={15} color={accent} />
      </View>
      <Text style={[styles.pillValue, { color: isDark ? FIGMA.paper : FIGMA.ink }]} numberOfLines={1}>
        {value}
      </Text>
      <Text style={[styles.pillLabel, { color: isDark ? "rgba(245,239,228,0.55)" : FIGMA.inkSoft }]} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

function OrdersPageSummaryBase({ stats, active = true }) {
  const { isDark } = useTheme();
  if (!active) return null;

  const tiles = [
    { icon: I.statTotal, label: MY_ORDERS_UI.statTotal, value: String(stats.total), accent: FIGMA.goldDeep },
    { icon: I.statActive, label: MY_ORDERS_UI.statInFlight, value: String(stats.inFlight), accent: FIGMA.green },
    { icon: I.statDelivered, label: MY_ORDERS_UI.statDelivered, value: String(stats.delivered), accent: isDark ? "#C4D088" : "#5C6834" },
    { icon: I.statSpend, label: MY_ORDERS_UI.statSpend, value: formatINR(stats.totalSpent), accent: isDark ? "#93c5fd" : "#1e40af" },
  ];

  return (
    <View style={styles.wrap}>
      <View style={styles.head}>
        <Text style={[styles.kicker, { color: isDark ? FIGMA.goldBright : FIGMA.goldDeep }]}>
          {MY_ORDERS_UI.summaryKicker}
        </Text>
        {stats.inFlight > 0 ? (
          <View style={[styles.livePill, { backgroundColor: isDark ? "rgba(34,197,94,0.14)" : "rgba(236,253,245,0.95)" }]}>
            <View style={styles.liveDot} />
            <Text style={[styles.liveText, { color: isDark ? "#C4D088" : "#5C6834" }]}>
              {stats.inFlight} live
            </Text>
          </View>
        ) : null}
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
        {tiles.map((tile) => (
          <StatPill key={tile.label} {...tile} isDark={isDark} />
        ))}
      </ScrollView>
    </View>
  );
}

const OrdersPageSummary = memo(OrdersPageSummaryBase);
export default OrdersPageSummary;

const styles = StyleSheet.create({
  wrap: {
    marginBottom: spacing.sm,
    paddingHorizontal: FIGMA.gutter,
    gap: 10,
  },
  head: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  kicker: {
    fontFamily: fonts.bold,
    fontSize: 9,
    letterSpacing: 1.6,
    textTransform: "uppercase",
  },
  livePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 999,
  },
  liveDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: "#22c55e",
  },
  liveText: {
    fontFamily: fonts.semibold,
    fontSize: 10,
  },
  row: {
    flexDirection: "row",
    gap: 8,
    paddingRight: 4,
  },
  pill: {
    width: 108,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 12,
    gap: 4,
  },
  pillIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  pillValue: {
    fontFamily: FONT_PRICE,
    fontSize: 20,
    letterSpacing: -0.4,
    marginTop: 2,
  },
  pillLabel: {
    fontFamily: fonts.semibold,
    fontSize: 9,
    letterSpacing: 0.3,
    textTransform: "uppercase",
  },
});
