import React, { memo, useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Badge from "../../ui/Badge";
import SectionHeader from "../../ui/SectionHeader";
import { useTheme } from "../../../context/ThemeContext";
import { PRODUCT_SCREEN, fillProductScreen } from "../../../content/appContent";
import { fonts } from "../../../theme/tokens";

const COPY = PRODUCT_SCREEN.rich;

export function hasSourcingData(sourcing) {
  if (!sourcing || typeof sourcing !== "object") return false;
  const region = String(sourcing.originRegion || "").trim();
  const harvest = String(sourcing.harvestDate || "").trim();
  const certs = Array.isArray(sourcing.certifications) ? sourcing.certifications.filter(Boolean) : [];
  return Boolean(region || harvest || certs.length);
}

function SourcingBlockBase({ sourcing, gutter = 0 }) {
  const { semanticPalette, SPACING } = useTheme();
  const region = String(sourcing?.originRegion || "").trim();
  const harvest = String(sourcing?.harvestDate || "").trim();
  const certs = (Array.isArray(sourcing?.certifications) ? sourcing.certifications : [])
    .map((c) => String(c || "").trim())
    .filter(Boolean)
    .slice(0, 6);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        section: {
          marginHorizontal: gutter ? -gutter : 0,
          backgroundColor: semanticPalette.surfaceAlt,
          paddingVertical: 48,
          paddingHorizontal: 24,
          borderTopWidth: StyleSheet.hairlineWidth,
          borderTopColor: semanticPalette.line,
        },
        body: {
          flexDirection: "row",
          flexWrap: "wrap",
          gap: SPACING.xl,
          alignItems: "center",
        },
        mapPanel: {
          flex: 1,
          minWidth: 240,
          borderRadius: 14,
          borderWidth: 1,
          borderColor: semanticPalette.line,
          backgroundColor: semanticPalette.surface,
          padding: SPACING.lg,
          alignItems: "center",
          justifyContent: "center",
          gap: SPACING.md,
        },
        globeRing: {
          width: 120,
          height: 120,
          borderRadius: 60,
          borderWidth: 1,
          borderColor: semanticPalette.accent,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: semanticPalette.accentSoft,
        },
        origin: {
          fontFamily: fonts.semibold,
          fontSize: 16,
          color: semanticPalette.ink,
          textAlign: "center",
        },
        harvest: {
          fontFamily: fonts.regular,
          fontSize: 13,
          color: semanticPalette.inkMuted,
          textAlign: "center",
        },
        pills: {
          flex: 1,
          minWidth: 200,
          gap: 12,
        },
        pillRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
      }),
    [SPACING, gutter, semanticPalette]
  );

  if (!hasSourcingData(sourcing)) return null;

  return (
    <View style={styles.section}>
      <SectionHeader overline={COPY.sourcingOverline} title={COPY.sourcingTitle} subtitle={COPY.sourcingSubtitle} />
      <View style={styles.body}>
        <View style={styles.mapPanel}>
          <View style={styles.globeRing}>
            <Ionicons name="earth-outline" size={48} color={semanticPalette.accent} />
            <Ionicons
              name="location"
              size={18}
              color={semanticPalette.accent}
              style={{ position: "absolute", bottom: 28, right: 32 }}
            />
          </View>
          {region ? <Text style={styles.origin}>{fillProductScreen(COPY.sourcingOrigin, { region })}</Text> : null}
          {harvest ? <Text style={styles.harvest}>{fillProductScreen(COPY.sourcingHarvest, { date: harvest })}</Text> : null}
        </View>
        {certs.length > 0 ? (
          <View style={styles.pills}>
            <Text style={{ fontFamily: fonts.medium, fontSize: 13, color: semanticPalette.inkSoft }}>{COPY.sourcingCertsLabel}</Text>
            <View style={styles.pillRow}>
              {certs.map((label) => (
                <Badge key={label} variant="brass" size="sm">
                  {label}
                </Badge>
              ))}
            </View>
          </View>
        ) : null}
      </View>
    </View>
  );
}

const SourcingBlock = memo(SourcingBlockBase);

export default SourcingBlock;
