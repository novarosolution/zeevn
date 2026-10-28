import React, { memo, useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { ADMIN_FONT, useAdminChrome } from "../../theme/adminLayout";
import AdminButton from "./AdminButton";

/**
 * Admin empty state: calm icon well, plain sans title, one line of guidance and an optional action.
 * Same props as the shop's PremiumEmptyState so screens swap one for the other.
 */
function AdminEmptyStateBase({
  iconName = "file-tray-outline",
  title,
  description,
  ctaLabel,
  onCtaPress,
  ctaVariant = "primary",
  ctaIconLeft,
  secondaryCtaLabel,
  onSecondaryCtaPress,
  compact = false,
  style,
}) {
  const chrome = useAdminChrome();
  const styles = useMemo(() => createStyles(chrome, compact), [chrome, compact]);

  return (
    <View style={[styles.wrap, style]}>
      <View style={styles.well}>
        <View style={styles.wellInner}>
          <Ionicons name={iconName} size={compact ? 22 : 26} color={chrome.goldDeep} />
        </View>
      </View>
      {title ? (
        <Text style={styles.title} numberOfLines={2}>
          {title}
        </Text>
      ) : null}
      {description ? (
        <Text style={styles.description} numberOfLines={4}>
          {description}
        </Text>
      ) : null}
      {ctaLabel || secondaryCtaLabel ? (
        <View style={styles.actions}>
          {ctaLabel ? (
            <AdminButton
              label={ctaLabel}
              icon={ctaIconLeft}
              variant={ctaVariant === "primary" ? "primary" : "secondary"}
              size="md"
              onPress={onCtaPress}
            />
          ) : null}
          {secondaryCtaLabel ? <AdminButton label={secondaryCtaLabel} variant="ghost" size="md" onPress={onSecondaryCtaPress} /> : null}
        </View>
      ) : null}
    </View>
  );
}

function createStyles(chrome, compact) {
  return StyleSheet.create({
    wrap: {
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: compact ? 28 : 48,
      paddingHorizontal: 20,
      gap: 6,
    },
    well: {
      width: compact ? 64 : 76,
      height: compact ? 64 : 76,
      borderRadius: 999,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: chrome.tileOnBg,
      marginBottom: 8,
    },
    wellInner: {
      width: compact ? 46 : 54,
      height: compact ? 46 : 54,
      borderRadius: 999,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: chrome.card,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: chrome.tileOnBorder,
    },
    title: {
      fontSize: compact ? 15 : 17,
      textAlign: "center",
      color: chrome.ink,
      fontFamily: ADMIN_FONT.semibold,
      fontWeight: "600",
      letterSpacing: -0.2,
    },
    description: {
      maxWidth: 380,
      textAlign: "center",
      fontSize: 13,
      lineHeight: 19,
      color: chrome.inkSoft,
      fontFamily: ADMIN_FONT.regular,
    },
    actions: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 12, justifyContent: "center" },
  });
}

export default memo(AdminEmptyStateBase);
