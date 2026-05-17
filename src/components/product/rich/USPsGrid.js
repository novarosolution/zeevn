import React, { memo, useMemo } from "react";
import { StyleSheet, Text, View, useWindowDimensions } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import SectionHeader from "../../ui/SectionHeader";
import { useTheme } from "../../../context/ThemeContext";
import { PRODUCT_SCREEN } from "../../../content/appContent";
import { fonts } from "../../../theme/tokens";
import { headingA11yProps } from "../../../utils/a11y";

const COPY = PRODUCT_SCREEN.rich;

function USPCard({ icon, title, description, semanticPalette }) {
  return (
    <View
      style={{
        flex: 1,
        minWidth: 0,
        borderWidth: 1,
        borderColor: semanticPalette.line,
        borderRadius: 14,
        padding: 20,
        backgroundColor: semanticPalette.surface,
      }}
    >
      <View
        style={{
          width: 56,
          height: 56,
          borderRadius: 28,
          backgroundColor: semanticPalette.accentSoft,
          alignItems: "center",
          justifyContent: "center",
          marginBottom: 16,
        }}
      >
        <Ionicons name={icon || "sparkles-outline"} size={32} color={semanticPalette.accent} />
      </View>
      <Text
        style={{ fontFamily: fonts.medium, fontSize: 17, color: semanticPalette.ink, marginBottom: 4 }}
        {...headingA11yProps(3)}
      >
        {title}
      </Text>
      {description ? (
        <Text
          style={{
            fontFamily: fonts.regular,
            fontSize: 14,
            lineHeight: 14 * 1.55,
            color: semanticPalette.inkSoft,
          }}
        >
          {description}
        </Text>
      ) : null}
    </View>
  );
}

function USPsGridBase({ usps = [], gutter = 0 }) {
  const { width } = useWindowDimensions();
  const { semanticPalette } = useTheme();
  const list = (usps || []).filter((u) => u?.title || u?.description);
  const isTablet = width >= 768;
  const gap = isTablet ? 20 : 16;

  const styles = useMemo(
    () =>
      StyleSheet.create({
        section: {
          marginHorizontal: gutter ? -gutter : 0,
          backgroundColor: semanticPalette.surface,
          paddingVertical: 40,
          paddingHorizontal: 24,
        },
        grid: {
          flexDirection: "row",
          flexWrap: "wrap",
          gap,
        },
        cell: {
          width: isTablet ? "48%" : "100%",
          minWidth: 0,
        },
      }),
    [gap, gutter, isTablet, semanticPalette.surface]
  );

  if (!list.length) return null;

  return (
    <View style={styles.section}>
      <SectionHeader overline={COPY.uspsOverline} title={COPY.uspsTitle} subtitle={COPY.uspsSubtitle || undefined} />
      <View style={styles.grid}>
        {list.map((usp, idx) => (
          <View key={`${usp.title}-${idx}`} style={styles.cell}>
            <USPCard icon={usp.icon} title={usp.title} description={usp.description} semanticPalette={semanticPalette} />
          </View>
        ))}
      </View>
    </View>
  );
}

const USPsGrid = memo(USPsGridBase);

export default USPsGrid;
