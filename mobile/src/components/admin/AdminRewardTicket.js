import React, { useMemo } from "react";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { useTheme } from "../../context/ThemeContext";
import { getAdminChrome } from "../../theme/adminLayout";
import { fonts } from "../../theme/tokens";
import { FONT_HEADING } from "../../theme/typographyRoles";
import { formatRupees } from "../../utils/adminFormat";
import AdminBadge from "./AdminBadge";

function discountLabel(reward) {
  if (reward.discountType === "flat") return `${formatRupees(reward.discountValue)} off`;
  return `${Number(reward.discountValue || 0)}% off`;
}

function redeemedLabel(reward) {
  const used = Number(reward.redemptionCount || 0);
  const limit = Number(reward.totalRedemptionLimit);
  if (Number.isFinite(limit) && limit >= 1) return `${used} / ${limit} redeemed`;
  return `${used} / unlimited`;
}

export default function AdminRewardTicket({ reward, onPress }) {
  const { colors: c, isDark } = useTheme();
  const chrome = useMemo(() => getAdminChrome(c, isDark), [c, isDark]);
  const styles = useMemo(() => createStyles(chrome, Boolean(onPress)), [chrome, onPress]);

  return (
    <Pressable
      onPress={onPress}
      style={styles.ticket}
      accessibilityRole="button"
      accessibilityLabel={`Edit ${reward.title || "reward"}`}
    >
      <Text style={styles.title}>{reward.title || "Reward"}</Text>
      <Text style={styles.points}>{Number(reward.pointsCost || 0)} points</Text>
      <Text style={styles.meta}>{discountLabel(reward)}</Text>
      <Text style={styles.meta}>{redeemedLabel(reward)}</Text>
      <Text style={styles.meta}>{Number(reward.perUserLimit || 1)} per customer</Text>
      <View style={styles.pills}>
        <AdminBadge label={reward.isActive === false ? "Off" : "Active"} tone={reward.isActive === false ? "neutral" : "green"} size="sm" />
        {reward.isVisibleToUsers === false ? <AdminBadge label="Hidden" tone="gold" size="sm" /> : null}
      </View>
    </Pressable>
  );
}

function createStyles(chrome, clickable) {
  return StyleSheet.create({
    ticket: {
      backgroundColor: chrome.card,
      borderWidth: 1,
      borderColor: chrome.line,
      borderRadius: 16,
      padding: 16,
      gap: 4,
      ...Platform.select({
        web: clickable ? { cursor: "pointer" } : {},
        default: {},
      }),
    },
    title: {
      fontFamily: FONT_HEADING,
      fontSize: 17,
      color: chrome.ink,
    },
    points: { fontSize: 13.5, color: chrome.ink, fontFamily: fonts.semibold },
    meta: { fontSize: 12.5, color: chrome.inkSoft, fontFamily: fonts.regular },
    pills: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 8 },
  });
}
