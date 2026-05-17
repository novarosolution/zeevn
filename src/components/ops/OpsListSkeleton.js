import React from "react";
import { View } from "react-native";
import Skeleton from "../ui/Skeleton";
import { useTheme } from "../../context/ThemeContext";

/** Stacked skeleton rows for admin / delivery list loading. */
export default function OpsListSkeleton({ rows = 4 }) {
  const { SPACING } = useTheme();
  return (
    <View style={{ gap: SPACING.sm }}>
      {Array.from({ length: rows }, (_, i) => (
        <Skeleton key={`ops-sk-${i}`} height={88} />
      ))}
    </View>
  );
}
