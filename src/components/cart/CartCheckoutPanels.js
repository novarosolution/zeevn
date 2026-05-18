import React from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import BrandWordmark from "../BrandWordmark";
import Card from "../ui/Card";
import { CHECKOUT_UI } from "../../content/appContent";
import { fonts } from "../../theme/tokens";

export function CheckoutStrippedHeader({ onBack, semanticPalette, TYPE, SPACING }) {
  return (
    <View style={{ width: "100%", paddingVertical: SPACING.md }}>
      {onBack ? (
        <Pressable
          onPress={onBack}
          hitSlop={12}
          accessibilityRole="button"
          accessibilityLabel="Back"
          style={({ pressed }) => ({
            position: "absolute",
            left: 0,
            top: SPACING.md - 4,
            zIndex: 2,
            width: 40,
            height: 40,
            alignItems: "center",
            justifyContent: "center",
            opacity: pressed ? 0.75 : 1,
          })}
        >
          <Ionicons name="chevron-back" size={26} color={semanticPalette.ink} />
        </Pressable>
      ) : null}
      <View style={{ alignItems: "center", gap: SPACING.xs }}>
        <BrandWordmark sizeKey="headerCompact" />
        <Text style={{ fontFamily: fonts.medium, fontSize: TYPE.micro.fontSize, letterSpacing: 1.2, color: semanticPalette.inkMuted, textTransform: "uppercase" }}>
          {CHECKOUT_UI.secureLine}
        </Text>
      </View>
    </View>
  );
}

export function CollapsibleCheckoutCard({ title, subtitle, expanded, onToggle, semanticPalette, TYPE, SPACING, children }) {
  return (
    <Card padding="none" contentStyle={{ padding: 0 }}>
      <Pressable
        onPress={onToggle}
        accessibilityRole="button"
        accessibilityState={{ expanded }}
        style={({ pressed }) => ({
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          paddingHorizontal: SPACING.md,
          paddingVertical: SPACING.md,
          borderBottomWidth: expanded ? StyleSheet.hairlineWidth : 0,
          borderBottomColor: semanticPalette.line,
          opacity: pressed ? 0.92 : 1,
        })}
      >
        <View style={{ flex: 1, marginRight: SPACING.sm }}>
          <Text style={{ fontFamily: fonts.semibold, fontSize: TYPE.body.fontSize, color: semanticPalette.ink }}>{title}</Text>
          {subtitle ? (
            <Text style={{ marginTop: 4, fontFamily: fonts.regular, fontSize: TYPE.caption.fontSize, color: semanticPalette.inkMuted }}>{subtitle}</Text>
          ) : null}
        </View>
        <Ionicons name={expanded ? "chevron-up-outline" : "chevron-down-outline"} size={22} color={semanticPalette.inkMuted} />
      </Pressable>
      {expanded ? <View style={{ paddingHorizontal: SPACING.md, paddingBottom: SPACING.md }}>{children}</View> : null}
    </Card>
  );
}

export function DeliveryMethodCards({ value, onChange, semanticPalette, TYPE, SPACING, RADII }) {
  const opts = [
    { key: "standard", title: CHECKOUT_UI.deliveryStandard, sub: CHECKOUT_UI.deliveryStandardSub, icon: "cube-outline" },
    { key: "express", title: CHECKOUT_UI.deliveryExpress, sub: CHECKOUT_UI.deliveryExpressSub, icon: "rocket-outline" },
  ];
  return (
    <View style={{ gap: SPACING.sm }}>
      {opts.map((o) => {
        const selected = value === o.key;
        return (
          <Pressable key={o.key} onPress={() => onChange(o.key)} accessibilityRole="radio" accessibilityState={{ selected }}>
            <Card
              padding="md"
              style={{
                borderWidth: selected ? 2 : StyleSheet.hairlineWidth,
                borderColor: selected ? semanticPalette.accent : semanticPalette.line,
              }}
            >
              <View style={{ flexDirection: "row", gap: SPACING.md, alignItems: "center" }}>
                <View
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: RADII.md,
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: semanticPalette.accentSoft,
                  }}
                >
                  <Ionicons name={o.icon} size={22} color={semanticPalette.accent} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontFamily: fonts.semibold, fontSize: TYPE.body.fontSize, color: semanticPalette.ink }}>{o.title}</Text>
                  <Text style={{ marginTop: 4, fontFamily: fonts.regular, fontSize: TYPE.small.fontSize, color: semanticPalette.inkMuted }}>{o.sub}</Text>
                </View>
                <View
                  style={{
                    width: 22,
                    height: 22,
                    borderRadius: 11,
                    borderWidth: 2,
                    borderColor: selected ? semanticPalette.accent : semanticPalette.line,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {selected ? <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: semanticPalette.accent }} /> : null}
                </View>
              </View>
            </Card>
          </Pressable>
        );
      })}
    </View>
  );
}

const PAYMENT_TABS = [
  { key: "cod", label: CHECKOUT_UI.paymentTabCod, disabled: false },
  {
    key: "online",
    label: CHECKOUT_UI.paymentTabOnline,
    disabled: true,
    badge: CHECKOUT_UI.paymentOnlineComingSoon,
  },
];

export function PaymentTabsRow({ activeTab, onChange, semanticPalette, TYPE, SPACING, RADII }) {
  return (
    <View style={{ marginBottom: SPACING.md }}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: SPACING.sm, paddingVertical: 4 }}>
        {PAYMENT_TABS.map((t) => {
          const on = activeTab === t.key;
          return (
            <Pressable
              key={t.key}
              onPress={() => onChange(t.key)}
              disabled={t.disabled}
              style={{
                paddingHorizontal: SPACING.md,
                paddingVertical: SPACING.sm,
                borderRadius: RADII.pill,
                borderWidth: StyleSheet.hairlineWidth,
                borderColor: on ? semanticPalette.accent : semanticPalette.line,
                backgroundColor: on ? semanticPalette.accentSoft : semanticPalette.surfaceAlt,
                opacity: t.disabled ? 0.72 : 1,
                flexDirection: "row",
                alignItems: "center",
                gap: 8,
              }}
            >
              <Text style={{ fontFamily: fonts.semibold, fontSize: TYPE.caption.fontSize, color: semanticPalette.ink }}>{t.label}</Text>
              {t.badge ? (
                <Text
                  style={{
                    fontFamily: fonts.semibold,
                    fontSize: TYPE.micro.fontSize,
                    color: semanticPalette.accent,
                    textTransform: "uppercase",
                    letterSpacing: 0.5,
                  }}
                >
                  {t.badge}
                </Text>
              ) : null}
            </Pressable>
          );
        })}
      </ScrollView>
      {activeTab !== "cod" ? (
        <Text style={{ marginTop: SPACING.sm, fontFamily: fonts.regular, fontSize: TYPE.small.fontSize, color: semanticPalette.inkMuted }}>
          {CHECKOUT_UI.paymentOnlineHint}
        </Text>
      ) : null}
    </View>
  );
}

export function paymentTabToBackend(tab) {
  return tab === "cod" ? "Cash on Delivery" : "Razorpay";
}
