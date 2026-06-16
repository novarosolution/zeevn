import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { FONT_HEADING } from "../../theme/typographyRoles";
import { KANKREG_PALETTE } from "../../theme/kankregWeb";
import { fonts } from "../../theme/tokens";

/** Home view editor — live phone preview from design board */
export default function AdminPhonePreview({
  heroTitle,
  heroSubtitle,
  primeTitle,
  categoryTitle,
  showPrime,
  showCategories,
}) {
  return (
    <View style={styles.wrap}>
      <View style={styles.phone}>
        <View style={styles.screen}>
          <View style={styles.hero}>
            <Text style={styles.heroEyebrow}>New season</Text>
            <Text style={styles.heroTitle} numberOfLines={2}>
              {heroTitle || "Made extraordinary"}
            </Text>
          </View>
          {showCategories !== false ? (
            <>
              <Text style={styles.sectionLabel}>{categoryTitle || "Shop by category"}</Text>
              <View style={styles.catRow}>
                {["#eef0e0", "#e8e4d0", "#e8e4d0"].map((bg) => (
                  <View key={bg} style={[styles.catTile, { backgroundColor: bg }]} />
                ))}
              </View>
            </>
          ) : null}
          {showPrime !== false ? (
            <>
              <Text style={styles.sectionLabel}>{primeTitle || "Bestsellers"}</Text>
              <View style={styles.grid}>
                <View style={[styles.gridTile, { backgroundColor: "#f4ecd8" }]} />
                <View style={[styles.gridTile, { backgroundColor: "#e8e4d0" }]} />
              </View>
            </>
          ) : null}
        </View>
      </View>
      {heroSubtitle ? (
        <Text style={styles.caption} numberOfLines={2}>
          {heroSubtitle}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: "center" },
  phone: {
    width: 220,
    backgroundColor: "#0c0a08",
    borderRadius: 30,
    padding: 7,
  },
  screen: {
    backgroundColor: KANKREG_PALETTE.paper,
    borderRadius: 24,
    overflow: "hidden",
    minHeight: 380,
    padding: 14,
  },
  hero: {
    borderRadius: 12,
    height: 80,
    padding: 12,
    backgroundColor: "#788844",
    justifyContent: "flex-end",
  },
  heroEyebrow: {
    fontSize: 6,
    letterSpacing: 2,
    textTransform: "uppercase",
    color: "rgba(255,255,255,0.8)",
    fontFamily: fonts.bold,
  },
  heroTitle: {
    fontFamily: FONT_HEADING,
    fontSize: 13,
    color: "#fff",
    marginTop: 4,
  },
  sectionLabel: {
    fontSize: 9,
    fontFamily: fonts.semibold,
    color: KANKREG_PALETTE.ink,
    marginTop: 12,
    marginBottom: 7,
  },
  catRow: { flexDirection: "row", gap: 6 },
  catTile: {
    width: 46,
    height: 46,
    borderRadius: 9,
  },
  grid: {
    flexDirection: "row",
    gap: 6,
  },
  gridTile: {
    flex: 1,
    height: 70,
    borderRadius: 9,
  },
  caption: {
    marginTop: 10,
    fontSize: 11,
    color: KANKREG_PALETTE.inkFaint,
    textAlign: "center",
    maxWidth: 220,
  },
});
