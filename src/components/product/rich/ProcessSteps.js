import React, { memo, useMemo } from "react";
import { StyleSheet, Text, View, useWindowDimensions } from "react-native";
import ProductImage from "../../ui/ProductImage";
import SectionHeader from "../../ui/SectionHeader";
import { useTheme } from "../../../context/ThemeContext";
import { PRODUCT_SCREEN } from "../../../content/appContent";
import { fonts } from "../../../theme/tokens";

const COPY = PRODUCT_SCREEN.rich;

function ProcessStepsBase({ steps = [], processTitle, processImageUri, gutter = 0 }) {
  const { width } = useWindowDimensions();
  const { semanticPalette, SPACING } = useTheme();
  const list = (steps || []).map((s) => String(s || "").trim()).filter(Boolean);
  const isTablet = width >= 768;
  const title = String(processTitle || "").trim() || COPY.processTitleFallback;
  const imageUri = String(processImageUri || "").trim();

  const styles = useMemo(
    () =>
      StyleSheet.create({
        section: {
          marginHorizontal: gutter ? -gutter : 0,
          backgroundColor: semanticPalette.surface,
          paddingVertical: 56,
          paddingHorizontal: 24,
        },
        row: {
          flexDirection: isTablet ? "row" : "column",
          gap: isTablet ? 32 : SPACING.lg,
          alignItems: isTablet ? "flex-start" : "stretch",
        },
        copyCol: { flex: isTablet ? 0.58 : 1, minWidth: 0 },
        imageCol: {
          flex: isTablet ? 0.42 : undefined,
          width: isTablet ? undefined : "100%",
          borderRadius: isTablet ? 14 : 10,
          overflow: "hidden",
          aspectRatio: isTablet ? 4 / 5 : 16 / 10,
          backgroundColor: semanticPalette.surfaceAlt,
        },
        image: { width: "100%", height: "100%" },
        steps: { marginTop: SPACING.lg, gap: 24 },
        stepRow: { flexDirection: "row", gap: 16 },
        rail: {
          width: 28,
          alignItems: "center",
        },
        numeral: {
          fontFamily: fonts.medium,
          fontSize: 32,
          lineHeight: 36,
          color: semanticPalette.accent,
          fontVariant: ["tabular-nums"],
        },
        guide: {
          flex: 1,
          width: 1,
          backgroundColor: semanticPalette.accent,
          opacity: 0.35,
          marginTop: 4,
          minHeight: 12,
        },
        stepBody: {
          flex: 1,
          fontFamily: fonts.regular,
          fontSize: 14,
          lineHeight: 14 * 1.55,
          color: semanticPalette.ink,
          paddingTop: 6,
        },
      }),
    [SPACING.lg, gutter, isTablet, semanticPalette]
  );

  if (!list.length) return null;

  return (
    <View style={styles.section}>
      <View style={styles.row}>
        <View style={styles.copyCol}>
          <SectionHeader overline={COPY.processOverline} title={title} />
          <View style={styles.steps}>
            {list.map((step, idx) => (
              <View key={`step-${idx}`} style={styles.stepRow}>
                <View style={styles.rail}>
                  <Text style={styles.numeral}>{idx + 1}</Text>
                  {idx < list.length - 1 ? <View style={styles.guide} /> : null}
                </View>
                <Text style={styles.stepBody}>{step}</Text>
              </View>
            ))}
          </View>
        </View>
        {imageUri && isTablet ? (
          <View style={styles.imageCol}>
            <ProductImage uri={imageUri} style={styles.image} contentFit="cover" transition={220} lazy />
          </View>
        ) : null}
      </View>
      {imageUri && !isTablet ? (
        <View style={[styles.imageCol, { marginTop: SPACING.lg }]}>
          <ProductImage uri={imageUri} style={styles.image} contentFit="cover" transition={220} lazy />
        </View>
      ) : null}
    </View>
  );
}

const ProcessSteps = memo(ProcessStepsBase);

export default ProcessSteps;
