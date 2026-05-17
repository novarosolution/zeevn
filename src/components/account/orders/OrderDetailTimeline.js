import React, { useEffect } from "react";
import { Text, useWindowDimensions, View } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import Card from "../../ui/Card";
import { ORDER_DETAIL_SCREEN } from "../../../content/appContent";
import { useTheme } from "../../../context/ThemeContext";
import useReducedMotion from "../../../hooks/useReducedMotion";
import { fonts } from "../../../theme/tokens";
import { fulfillmentStepIndex } from "../../../utils/orderPresentation";
import { isCancelledOrder } from "../../../utils/orderStatus";

const copy = ORDER_DETAIL_SCREEN.timeline;

const STEPS = [
  { key: "placed", label: copy.placed, descKey: "placed" },
  { key: "packed", label: copy.packed, descKey: "packed" },
  { key: "out", label: copy.out, descKey: "out" },
  { key: "delivered", label: copy.delivered, descKey: "delivered" },
  { key: "returned", label: copy.returned, descKey: "returned" },
];

function PulseDot({ active }) {
  const { semanticPalette } = useTheme();
  const reducedMotion = useReducedMotion();
  const scale = useSharedValue(1);

  useEffect(() => {
    if (!active || reducedMotion) {
      scale.value = 1;
      return;
    }
    scale.value = withRepeat(
      withSequence(
        withTiming(1.35, { duration: 700, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 700, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      false
    );
  }, [active, reducedMotion, scale]);

  const ringStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: active ? 0.35 : 0,
  }));

  if (!active) {
    return (
      <View
        style={{
          width: 12,
          height: 12,
          borderRadius: 6,
          backgroundColor: semanticPalette.line,
        }}
      />
    );
  }

  if (reducedMotion) {
    return <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: semanticPalette.accent }} />;
  }

  return (
    <View style={{ width: 12, height: 12, alignItems: "center", justifyContent: "center" }}>
      <Animated.View
        style={[
          {
            position: "absolute",
            width: 22,
            height: 22,
            borderRadius: 11,
            backgroundColor: semanticPalette.accent,
          },
          ringStyle,
        ]}
      />
      <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: semanticPalette.accent }} />
    </View>
  );
}

export default function OrderDetailTimeline({ order }) {
  const { width } = useWindowDimensions();
  const horizontal = width >= 768;
  const { semanticPalette, TYPE, SPACING } = useTheme();
  const cancelled = isCancelledOrder(order?.status);
  const activeIdx = fulfillmentStepIndex(order?.status);
  const showReturned = String(order?.status || "").toLowerCase() === "returned" || String(order?.status || "").toLowerCase() === "refunded";
  const steps = showReturned ? STEPS : STEPS.slice(0, 4);

  if (cancelled) {
    return (
      <Card padding="lg">
        <Text style={{ fontFamily: fonts.semibold, fontSize: TYPE.body.fontSize, color: semanticPalette.sale }}>
          This order was cancelled.
        </Text>
      </Card>
    );
  }

  const currentDesc = copy.currentDescriptions[steps[Math.min(activeIdx, steps.length - 1)]?.descKey] || "";

  return (
    <Card padding="lg">
      <View style={horizontal ? { flexDirection: "row", alignItems: "flex-start" } : { gap: 0 }}>
        {steps.map((step, idx) => {
          const done = activeIdx > idx;
          const current = activeIdx === idx;
          const future = activeIdx < idx;
          return (
            <View
              key={step.key}
              style={
                horizontal
                  ? { flex: 1, alignItems: "center", paddingHorizontal: 4 }
                  : { flexDirection: "row", gap: SPACING.md, paddingBottom: SPACING.lg }
              }
            >
              {horizontal ? (
                <>
                  <View style={{ alignItems: "center", width: "100%" }}>
                    <View style={{ flexDirection: "row", alignItems: "center", width: "100%" }}>
                      {idx > 0 ? (
                        <View
                          style={{
                            flex: 1,
                            height: 2,
                            backgroundColor: done || current ? semanticPalette.accent : semanticPalette.lineSoft,
                          }}
                        />
                      ) : (
                        <View style={{ flex: 1 }} />
                      )}
                      {future ? (
                        <View
                          style={{
                            width: 12,
                            height: 12,
                            borderRadius: 6,
                            borderWidth: 2,
                            borderColor: semanticPalette.lineSoft,
                            backgroundColor: "transparent",
                          }}
                        />
                      ) : (
                        <PulseDot active={current} />
                      )}
                      {idx < steps.length - 1 ? (
                        <View
                          style={{
                            flex: 1,
                            height: 2,
                            backgroundColor: done ? semanticPalette.accent : semanticPalette.lineSoft,
                          }}
                        />
                      ) : (
                        <View style={{ flex: 1 }} />
                      )}
                    </View>
                    <Text
                      style={{
                        marginTop: 8,
                        fontFamily: fonts.semibold,
                        fontSize: 11,
                        textAlign: "center",
                        color: done || current ? semanticPalette.ink : semanticPalette.inkMuted,
                      }}
                    >
                      {step.label}
                    </Text>
                    <Text
                      style={{
                        marginTop: 2,
                        fontFamily: fonts.regular,
                        fontSize: 10,
                        textAlign: "center",
                        color: semanticPalette.inkMuted,
                      }}
                    >
                      {done || current ? new Date(order?.createdAt || Date.now()).toLocaleDateString() : "—"}
                    </Text>
                  </View>
                </>
              ) : (
                <>
                  <View style={{ alignItems: "center", width: 22 }}>
                    {future ? (
                      <View
                        style={{
                          width: 12,
                          height: 12,
                          borderRadius: 6,
                          borderWidth: 2,
                          borderColor: semanticPalette.lineSoft,
                        }}
                      />
                    ) : (
                      <PulseDot active={current} />
                    )}
                    {idx < steps.length - 1 ? (
                      <View
                        style={{
                          flex: 1,
                          width: 2,
                          minHeight: 24,
                          marginVertical: 4,
                          backgroundColor: done ? semanticPalette.accent : semanticPalette.lineSoft,
                        }}
                      />
                    ) : null}
                  </View>
                  <View style={{ flex: 1, paddingBottom: idx < steps.length - 1 ? SPACING.sm : 0 }}>
                    <Text
                      style={{
                        fontFamily: fonts.semibold,
                        fontSize: TYPE.body.fontSize,
                        color: done || current ? semanticPalette.ink : semanticPalette.inkMuted,
                      }}
                    >
                      {step.label}
                    </Text>
                    <Text style={{ fontFamily: fonts.regular, fontSize: 12, color: semanticPalette.inkMuted, marginTop: 2 }}>
                      {done || current ? new Date(order?.updatedAt || order?.createdAt).toLocaleString() : "—"}
                    </Text>
                  </View>
                </>
              )}
            </View>
          );
        })}
      </View>
      {currentDesc ? (
        <Text style={{ marginTop: SPACING.md, fontFamily: fonts.regular, fontSize: TYPE.small.fontSize, color: semanticPalette.inkSoft }}>
          {currentDesc}
        </Text>
      ) : null}
    </Card>
  );
}
