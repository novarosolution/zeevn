import React, { memo } from "react";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { MY_ORDERS_UI } from "../../content/appContent";
import { useTheme } from "../../context/ThemeContext";
import { FONT_BODY_SEMIBOLD } from "../../theme/typographyRoles";
import { FIGMA } from "../../theme/figmaApp";
import { fonts } from "../../theme/tokens";

const { icons: I } = MY_ORDERS_UI;

function ActionTile({ icon, label, onPress, disabled, active, isDark }) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed, hovered }) => [
        styles.tile,
        {
          borderColor: active
            ? isDark ? "rgba(232,200,90,0.45)" : "rgba(169,119,46,0.42)"
            : isDark ? "#3f3933" : FIGMA.line,
          backgroundColor: active
            ? isDark ? "rgba(232,200,90,0.1)" : "rgba(255,251,235,0.95)"
            : isDark ? "#14110e" : FIGMA.card,
        },
        Platform.OS === "web" && hovered && !disabled ? styles.tileHover : null,
        pressed && !disabled ? styles.tilePressed : null,
        disabled && styles.tileDisabled,
      ]}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      <Ionicons
        name={icon}
        size={20}
        color={active ? FIGMA.goldDeep : isDark ? "rgba(245,239,228,0.72)" : FIGMA.inkSoft}
      />
      <Text
        style={[
          styles.tileLabel,
          { color: active ? (isDark ? FIGMA.goldBright : FIGMA.goldDeep) : isDark ? "rgba(245,239,228,0.62)" : FIGMA.inkSoft },
        ]}
        numberOfLines={1}
      >
        {label}
      </Text>
    </Pressable>
  );
}

function OrderCardActionsBase({
  expanded,
  onToggleDetails,
  onChangeAddress,
  canEditAddress,
  onDownloadInvoice,
  downloading,
  onClaimReward,
  claimingReward,
  rewardClaimed,
  showReward,
  onReorder,
  reordering,
}) {
  const { isDark } = useTheme();

  return (
    <View style={styles.wrap}>
      <View style={styles.grid}>
        <ActionTile
          icon={expanded ? I.detailsCollapse : I.details}
          label={expanded ? MY_ORDERS_UI.detailsCollapse : MY_ORDERS_UI.detailsExpand}
          onPress={onToggleDetails}
          active={expanded}
          isDark={isDark}
        />
        {canEditAddress ? (
          <ActionTile icon={I.address} label={MY_ORDERS_UI.changeAddress} onPress={onChangeAddress} isDark={isDark} />
        ) : null}
        <ActionTile
          icon={I.invoice}
          label={downloading ? MY_ORDERS_UI.invoiceGenerating : MY_ORDERS_UI.invoiceDownload}
          onPress={onDownloadInvoice}
          disabled={downloading}
          isDark={isDark}
        />
        {showReward ? (
          <ActionTile
            icon={rewardClaimed ? I.rewardDone : I.reward}
            label={
              rewardClaimed
                ? MY_ORDERS_UI.claimedReward
                : claimingReward
                  ? MY_ORDERS_UI.claimRewardLoading
                  : MY_ORDERS_UI.claimReward
            }
            onPress={onClaimReward}
            disabled={rewardClaimed || claimingReward}
            isDark={isDark}
          />
        ) : null}
      </View>

      <Pressable
        onPress={onReorder}
        disabled={reordering}
        style={({ pressed }) => [styles.reorderWrap, pressed && !reordering && styles.reorderPressed]}
        accessibilityRole="button"
        accessibilityLabel={MY_ORDERS_UI.reorder}
      >
        <LinearGradient
          colors={isDark ? ["#BC905C", "#8a5a12"] : ["#DCAC74", "#244424"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.reorderGradient}
        >
          <Ionicons name={I.reorder} size={18} color="#fff" />
          <Text style={styles.reorderText}>
            {reordering ? MY_ORDERS_UI.reorderLoading : MY_ORDERS_UI.reorder}
          </Text>
        </LinearGradient>
      </Pressable>
    </View>
  );
}

const OrderCardActions = memo(OrderCardActionsBase);
export default OrderCardActions;

const styles = StyleSheet.create({
  wrap: {
    marginTop: 8,
    gap: 8,
  },
  grid: {
    flexDirection: "row",
    gap: 8,
  },
  tile: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    paddingHorizontal: 4,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    gap: 4,
    minHeight: 58,
  },
  tileHover: {
    ...Platform.select({ web: { transform: [{ translateY: -1 }] }, default: {} }),
  },
  tilePressed: { opacity: 0.88 },
  tileDisabled: { opacity: 0.45 },
  tileLabel: {
    fontFamily: fonts.semibold,
    fontSize: 9,
    letterSpacing: 0.15,
    textAlign: "center",
  },
  reorderWrap: {
    borderRadius: 999,
    overflow: "hidden",
    ...Platform.select({
      ios: { shadowColor: "#19140f", shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.18, shadowRadius: 12 },
      android: { elevation: 3 },
      web: { boxShadow: "0 10px 24px -12px rgba(25,20,15,.4)" },
      default: {},
    }),
  },
  reorderPressed: { opacity: 0.92, transform: [{ scale: 0.99 }] },
  reorderGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 13,
    paddingHorizontal: 18,
  },
  reorderText: {
    fontFamily: FONT_BODY_SEMIBOLD,
    fontSize: 14,
    color: "#fff",
    letterSpacing: 0.15,
  },
});
