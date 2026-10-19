import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { useKankregLayout } from "../../theme/kankregBreakpoints";
import { KANKREG_PALETTE, ZEEVAN_GREEN } from "../../theme/kankregWeb";
import { FONT_HEADING_ITALIC } from "../../theme/typographyRoles";
import { fonts, spacing } from "../../theme/tokens";
import SectionReveal from "../motion/SectionReveal";

/** Soft brand quote between product rails on phone home. */
export default function WebPhoneQuoteBand({
  quote = "Nothing rushed. Nothing added. Pure craft.",
  attribution = "Zeevan kitchen standard",
}) {
  const { pageGutterClamp } = useKankregLayout();

  return (
    <SectionReveal preset="fade-up" delay={40} style={styles.reveal}>
      <View style={[styles.wrap, { paddingHorizontal: pageGutterClamp }]}>
        <View style={styles.rule} />
        <Text style={styles.quote}>{quote}</Text>
        {attribution ? <Text style={styles.attr}>{attribution}</Text> : null}
      </View>
    </SectionReveal>
  );
}

const styles = StyleSheet.create({
  reveal: { width: "100%" },
  wrap: {
    alignItems: "center",
    gap: 8,
    paddingVertical: spacing.lg,
  },
  rule: {
    width: 36,
    height: 2,
    borderRadius: 1,
    backgroundColor: ZEEVAN_GREEN.base,
    opacity: 0.75,
  },
  quote: {
    fontFamily: FONT_HEADING_ITALIC,
    fontStyle: "italic",
    fontSize: 20,
    lineHeight: 28,
    textAlign: "center",
    color: KANKREG_PALETTE.ink,
    maxWidth: 320,
    letterSpacing: -0.2,
  },
  attr: {
    fontFamily: fonts.medium,
    fontSize: 11,
    letterSpacing: 1.2,
    textTransform: "uppercase",
    color: KANKREG_PALETTE.inkFaint,
  },
});
