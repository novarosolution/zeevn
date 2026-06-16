import React, { memo } from "react";
import { StyleSheet, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { MY_ORDERS_UI } from "../../content/appContent";
import { ALCHEMY } from "../../theme/customerAlchemy";
import { FONT_HEADING, FONT_HEADING_SEMI, FONT_BODY_SEMIBOLD, FONT_PRICE } from "../../theme/typographyRoles";
import { semanticRadius } from "../../theme/tokens";
import {
  ORDER_PROGRESS_STEPS,
  getActiveProgressStep,
  isCancelledOrder,
  isDeliveredOrder,
} from "../../utils/orderStatus";

const TRACK_STEP_ICONS = {
  placed: "time-outline",
  confirmed: "checkmark-done-outline",
  preparing: "cube-outline",
  ready: "bag-check-outline",
  out: "car-outline",
  done: "gift-outline",
};

/** Premium vertical order progress timeline. */
function OrderProgressStripBase({ status, c, isDark, compact = false }) {
  if (String(status || "") === "pending_payment") {
    return null;
  }

  if (isCancelledOrder(status)) {
    return (
      <View style={[styles.trackShell, styles.trackShellCancelled, isDark && styles.trackShellCancelledDark]}>
        <View style={styles.trackCancelledInner}>
          <View style={[styles.trackCancelledIcon, { borderColor: c.danger }]}>
            <Ionicons name="close-circle-outline" size={22} color={c.danger} />
          </View>
          <View style={styles.trackCancelledText}>
            <Text style={[styles.trackCancelledTitle, { color: c.textPrimary }]}>{MY_ORDERS_UI.trackCancelledTitle}</Text>
            <Text style={[styles.trackCancelledSub, { color: c.textSecondary }]}>{MY_ORDERS_UI.trackCancelledSub}</Text>
          </View>
        </View>
      </View>
    );
  }

  const delivered = isDeliveredOrder(status);
  const activeIdx = getActiveProgressStep(status);
  const totalSteps = ORDER_PROGRESS_STEPS.length;
  const stepLabel = delivered ? totalSteps : Math.min(activeIdx + 1, totalSteps);
  const progressLabel = delivered ? "Delivered" : `Step ${stepLabel} of ${totalSteps}`;
  const pct = delivered ? 100 : Math.round((activeIdx / (totalSteps - 1)) * 100);

  const shellGradient = isDark
    ? ["rgba(20, 83, 45, 0.22)", "rgba(15, 23, 42, 0.5)", "rgba(15, 23, 42, 0.35)"]
    : ["rgba(255, 251, 235, 0.95)", "rgba(255, 253, 248, 0.98)", "rgba(237, 228, 212, 0.55)"];

  return (
    <View style={[styles.trackShell, compact && styles.trackShellCompact]}>
      <LinearGradient colors={shellGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.trackGradient}>
        <View style={[styles.trackGoldLine, { backgroundColor: isDark ? "rgba(52, 211, 153, 0.55)" : ALCHEMY.gold }]} />
        <View style={styles.trackHeadRow}>
          <View style={styles.trackHeadLeft}>
            <Ionicons name="locate-outline" size={compact ? 18 : 20} color={isDark ? c.primaryBright : ALCHEMY.brown} />
            <View>
              <Text style={[styles.trackHeadTitle, isDark ? { color: "#f8fafc" } : styles.trackHeadTitleLight]}>
                {MY_ORDERS_UI.trackTitle}
              </Text>
              <Text style={[styles.trackHeadSub, { color: isDark ? "rgba(248,250,252,0.72)" : ALCHEMY.brownMuted }]}>
                {progressLabel}
              </Text>
            </View>
          </View>
          <View style={[styles.trackPctPill, { borderColor: c.primaryBorder, backgroundColor: c.primarySoft }]}>
            <Text style={[styles.trackPctText, { color: c.primaryDark }]}>{delivered ? "100%" : `${pct}%`}</Text>
          </View>
        </View>
        <View style={styles.trackList}>
          {ORDER_PROGRESS_STEPS.map((step, idx) => {
            const done = delivered || idx < activeIdx;
            const current = !delivered && idx === activeIdx;
            const barDone = delivered || activeIdx > idx;
            const stepIcon = TRACK_STEP_ICONS[step.key] || "ellipse-outline";
            return (
              <View key={step.key} style={[styles.trackRow, compact && styles.trackRowCompact]}>
                <View style={styles.trackLeftCol}>
                  <View
                    style={[
                      styles.trackDot,
                      compact && styles.trackDotCompact,
                      done && [styles.trackDotDone, { borderColor: c.secondary, backgroundColor: c.secondary }],
                      current && [styles.trackDotCurrent, { borderColor: c.primary, backgroundColor: c.primarySoft }],
                      !done && !current && [styles.trackDotUpcoming, { borderColor: c.border, backgroundColor: c.surface }],
                    ]}
                  >
                    {done ? (
                      <Ionicons name="checkmark" size={compact ? 11 : 13} color={c.onSecondary} />
                    ) : (
                      <Ionicons name={stepIcon} size={compact ? 12 : 14} color={current ? c.primary : c.textMuted} />
                    )}
                  </View>
                  {idx < ORDER_PROGRESS_STEPS.length - 1 ? (
                    <View style={styles.trackBarWrap}>
                      <View
                        style={[
                          styles.trackBar,
                          { backgroundColor: c.border },
                          barDone && [styles.trackBarDone, { backgroundColor: c.secondary }],
                        ]}
                      />
                    </View>
                  ) : null}
                </View>
                <View style={styles.trackTextCol}>
                  <Text
                    style={[
                      styles.trackTitle,
                      { color: c.textMuted },
                      done && { color: c.textSecondary },
                      current && [styles.trackTitleCurrent, { color: c.textPrimary }],
                    ]}
                  >
                    {step.title}
                  </Text>
                  {!compact ? (
                    <Text style={[styles.trackSub, { color: c.textMuted }, current && { color: c.textSecondary }]}>
                      {step.subtitle}
                    </Text>
                  ) : null}
                </View>
              </View>
            );
          })}
        </View>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  trackShell: {
    borderRadius: semanticRadius.card,
    overflow: "hidden",
    marginBottom: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(31, 92, 71, 0.22)",
  },
  trackShellCompact: {
    marginBottom: 10,
  },
  trackShellCancelled: {
    borderColor: "rgba(220,38,38,0.25)",
    backgroundColor: "rgba(254,242,242,0.85)",
  },
  trackShellCancelledDark: {
    borderColor: "rgba(248,113,113,0.35)",
    backgroundColor: "rgba(127,29,29,0.12)",
  },
  trackCancelledInner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
  },
  trackCancelledIcon: {
    width: 44,
    height: 44,
    borderRadius: semanticRadius.control,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
  },
  trackCancelledText: {
    flex: 1,
    minWidth: 0,
  },
  trackCancelledTitle: {
    fontFamily: FONT_HEADING_SEMI,
    fontSize: 15,
  },
  trackCancelledSub: {
    marginTop: 4,
    fontSize: 12,
    lineHeight: 17,
  },
  trackGradient: {
    paddingBottom: 6,
  },
  trackGoldLine: {
    height: 2,
    width: "100%",
    opacity: 0.9,
  },
  trackHeadRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 8,
    gap: 10,
  },
  trackHeadLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flex: 1,
    minWidth: 0,
  },
  trackHeadTitle: {
    fontFamily: FONT_HEADING_SEMI,
    fontSize: 14,
  },
  trackHeadTitleLight: {
    color: ALCHEMY.brown,
    fontFamily: FONT_HEADING,
  },
  trackHeadSub: {
    marginTop: 2,
    fontSize: 11,
  },
  trackPctPill: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    borderWidth: 1,
  },
  trackPctText: {
    fontFamily: FONT_PRICE,
    fontSize: 11,
  },
  trackList: {
    paddingHorizontal: 14,
    paddingBottom: 8,
  },
  trackRow: {
    flexDirection: "row",
    alignItems: "stretch",
    minHeight: 44,
  },
  trackRowCompact: {
    minHeight: 36,
  },
  trackLeftCol: {
    width: 28,
    alignItems: "center",
  },
  trackDot: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  trackDotCompact: {
    width: 22,
    height: 22,
    borderRadius: 11,
  },
  trackDotUpcoming: {},
  trackDotDone: {},
  trackDotCurrent: {},
  trackBarWrap: {
    width: 2,
    flex: 1,
    alignItems: "center",
    marginVertical: 2,
    minHeight: 10,
  },
  trackBar: {
    width: 2,
    flex: 1,
    borderRadius: 1,
    minHeight: 6,
  },
  trackBarDone: {},
  trackTextCol: {
    flex: 1,
    paddingLeft: 12,
    paddingBottom: 8,
    justifyContent: "center",
  },
  trackTitle: {
    fontFamily: FONT_HEADING_SEMI,
    fontSize: 13,
  },
  trackTitleCurrent: {
    fontSize: 14,
  },
  trackSub: {
    fontSize: 11,
    marginTop: 2,
    lineHeight: 15,
  },
});

const OrderProgressStrip = memo(OrderProgressStripBase);
export default OrderProgressStrip;
