import React from "react";
import { Platform, StyleSheet, View } from "react-native";
import SkeletonBlock from "../ui/SkeletonBlock";

const GRID = Platform.OS === "web" ? { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(148px, 1fr))", gap: 10 } : { flexDirection: "row", flexWrap: "wrap", gap: 10 };

/** Dashboard-shaped placeholder: greeting band, then two rows of metric tiles. Matches the real layout so nothing jumps. */
export default function AdminDashboardSkeleton() {
  return (
    <View style={styles.wrap} accessibilityLabel="Loading overview" accessibilityRole="progressbar">
      <SkeletonBlock width="100%" height={112} rounded="lg" />
      {[0, 1].map((row) => (
        <View key={row} style={styles.panel}>
          <SkeletonBlock width={160} height={18} rounded="md" />
          <View style={GRID}>
            {Array.from({ length: 6 }).map((_, i) => (
              <View key={i} style={Platform.OS === "web" ? null : styles.tileNative}>
                <SkeletonBlock width="100%" height={104} rounded="lg" />
              </View>
            ))}
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 16 },
  panel: { gap: 14, padding: 18, borderRadius: 16 },
  tileNative: { flexBasis: "47%", flexGrow: 1 },
});
