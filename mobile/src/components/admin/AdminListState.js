import React, { useMemo } from "react";
import { StyleSheet, View } from "react-native";
import { ADMIN_LIST_UI } from "../../content/adminContent";
import { spacing } from "../../theme/tokens";
import AdminEmptyState from "./AdminEmptyState";
import AdminLoader from "./AdminLoader";
import SkeletonBlock from "../ui/SkeletonBlock";

/** Consistent loading / empty for admin list screens. */
export default function AdminListState({
  loading = false,
  empty = false,
  emptyTitle = "Nothing here yet",
  emptyDescription,
  emptyIcon = "leaf-outline",
  ctaLabel,
  onCtaPress,
  skeletonRows = 3,
  caption = ADMIN_LIST_UI.loading,
}) {
  const styles = useMemo(
    () =>
      StyleSheet.create({
        load: {
          paddingVertical: spacing.lg,
          gap: spacing.sm + 2,
          paddingHorizontal: spacing.xs,
        },
        skel: {
          borderRadius: 14,
          overflow: "hidden",
        },
      }),
    []
  );

  if (loading) {
    return (
      <View style={styles.load}>
        <AdminLoader caption={caption} />
        {Array.from({ length: skeletonRows }).map((_, i) => (
          <View key={i} style={styles.skel}>
            <SkeletonBlock width="100%" height={78} rounded="lg" />
          </View>
        ))}
      </View>
    );
  }

  if (empty) {
    return (
      <AdminEmptyState
        iconName={emptyIcon}
        title={emptyTitle}
        description={emptyDescription}
        ctaLabel={ctaLabel}
        onCtaPress={onCtaPress}
        compact
      />
    );
  }

  return null;
}
