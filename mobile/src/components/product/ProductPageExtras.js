import React from "react";
import { Platform, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { FONT_HEADING } from "../../theme/typographyRoles";
import { KANKREG_PALETTE } from "../../theme/kankregWeb";
import { HOME_SPACE, HOME_TYPE, homeEditorialInk, homeEditorialMuted } from "../../theme/homeEditorial";
import { fonts, icon, radius, spacing } from "../../theme/tokens";

function SectionBlock({ eyebrow, title, children, isDark, style }) {
  const ink = homeEditorialInk(isDark);
  const muted = homeEditorialMuted(isDark);
  return (
    <View style={[styles.block, style]}>
      {eyebrow ? <Text style={[styles.eyebrow, { color: muted }]}>{eyebrow}</Text> : null}
      {title ? <Text style={[styles.title, { color: ink }]}>{title}</Text> : null}
      {children}
    </View>
  );
}

export function ProductSpecsGrid({ specs = [], isDark, eyebrow, title }) {
  if (!specs.length) return null;
  const ink = homeEditorialInk(isDark);
  const muted = homeEditorialMuted(isDark);
  return (
    <SectionBlock eyebrow={eyebrow} title={title} isDark={isDark}>
      <View style={[styles.specGrid, isDark && styles.specGridDark]}>
        {specs.map((row) => (
          <View key={row.key} style={[styles.specRow, isDark && styles.specRowDark]}>
            <Text style={[styles.specLabel, { color: muted }]}>{row.label}</Text>
            <Text style={[styles.specValue, { color: ink }]} numberOfLines={2}>
              {row.value}
            </Text>
          </View>
        ))}
      </View>
    </SectionBlock>
  );
}

export function ProductIngredientsCard({ ingredients, isDark, eyebrow, title }) {
  if (!ingredients?.body) return null;
  const ink = homeEditorialInk(isDark);
  const muted = homeEditorialMuted(isDark);
  return (
    <SectionBlock eyebrow={eyebrow} title={title || ingredients.title} isDark={isDark}>
      <View style={[styles.card, isDark && styles.cardDark]}>
        <Text style={[styles.cardBody, { color: muted }]}>{ingredients.body}</Text>
        {ingredients.tags?.length ? (
          <View style={styles.tagRow}>
            {ingredients.tags.map((tag) => (
              <View key={tag} style={[styles.tag, isDark && styles.tagDark]}>
                <Text style={styles.tagText}>{tag}</Text>
              </View>
            ))}
          </View>
        ) : null}
      </View>
    </SectionBlock>
  );
}

export function ProductStorageCard({ storage, isDark, eyebrow, title }) {
  if (!storage?.body) return null;
  const muted = homeEditorialMuted(isDark);
  return (
    <SectionBlock eyebrow={eyebrow} title={title || storage.title} isDark={isDark}>
      <View style={[styles.card, styles.cardAccent, isDark && styles.cardDark]}>
        <Ionicons name="archive-outline" size={icon.sm} color={KANKREG_PALETTE.green} style={styles.cardIcon} />
        <Text style={[styles.cardBody, { color: muted }]}>{storage.body}</Text>
      </View>
    </SectionBlock>
  );
}

export function ProductShippingCard({ shipping, isDark, eyebrow, title }) {
  if (!shipping?.body) return null;
  const muted = homeEditorialMuted(isDark);
  return (
    <SectionBlock eyebrow={eyebrow} title={title || shipping.title} isDark={isDark}>
      <View style={[styles.card, isDark && styles.cardDark]}>
        <Text style={[styles.cardBody, { color: muted }]}>{shipping.body}</Text>
        {shipping.bullets?.length ? (
          <View style={styles.bulletList}>
            {shipping.bullets.map((line) => (
              <View key={line} style={styles.bulletRow}>
                <Ionicons name="checkmark-circle" size={14} color={KANKREG_PALETTE.green} />
                <Text style={[styles.bulletText, { color: muted }]}>{line}</Text>
              </View>
            ))}
          </View>
        ) : null}
      </View>
    </SectionBlock>
  );
}

export function ProductWhyZeevan({ whyZeevan, isDark, eyebrow, title }) {
  if (!whyZeevan?.body) return null;
  const ink = homeEditorialInk(isDark);
  const muted = homeEditorialMuted(isDark);
  return (
    <SectionBlock eyebrow={eyebrow} title={title || whyZeevan.title} isDark={isDark}>
      <Text style={[styles.cardBody, { color: muted, marginBottom: spacing.sm }]}>{whyZeevan.body}</Text>
      {whyZeevan.chips?.length ? (
        <View style={styles.chipRow}>
          {whyZeevan.chips.map((chip) => (
            <View key={chip.label} style={[styles.chip, isDark && styles.chipDark]}>
              <Ionicons name={chip.icon || "leaf-outline"} size={13} color={KANKREG_PALETTE.green} />
              <Text style={[styles.chipText, { color: ink }]}>{chip.label}</Text>
            </View>
          ))}
        </View>
      ) : null}
    </SectionBlock>
  );
}

export function ProductFaqSection({ faq = [], isDark, eyebrow, title }) {
  if (!faq.length) return null;
  const ink = homeEditorialInk(isDark);
  const muted = homeEditorialMuted(isDark);
  return (
    <SectionBlock eyebrow={eyebrow} title={title} isDark={isDark}>
      <View style={styles.faqList}>
        {faq.map((item) => (
          <View key={item.q} style={[styles.faqItem, isDark && styles.faqItemDark]}>
            <Text style={[styles.faqQ, { color: ink }]}>{item.q}</Text>
            <Text style={[styles.faqA, { color: muted }]}>{item.a}</Text>
          </View>
        ))}
      </View>
    </SectionBlock>
  );
}

export function ProductUsageGrid({ items = [], isDark, eyebrow, title, ink, muted }) {
  if (!items.length) return null;
  const textInk = ink || homeEditorialInk(isDark);
  const textMuted = muted || homeEditorialMuted(isDark);
  return (
    <SectionBlock eyebrow={eyebrow} title={title} isDark={isDark}>
      <View style={styles.usageGrid}>
        {items.map((item, idx) => (
          <View key={`${item.title}-${idx}`} style={[styles.usageCard, isDark && styles.usageCardDark]}>
            <View style={styles.usageIcon}>
              <Ionicons name={item.icon || "sunny-outline"} size={18} color={KANKREG_PALETTE.green} />
            </View>
            <Text style={[styles.usageTitle, { color: textInk }]}>{item.title}</Text>
            <Text style={[styles.usageBody, { color: textMuted }]}>{item.description}</Text>
          </View>
        ))}
      </View>
    </SectionBlock>
  );
}

export function ProductPullQuoteBlock({ quote, isDark }) {
  if (!quote) return null;
  const ink = homeEditorialInk(isDark);
  return (
    <View style={[styles.pullQuote, isDark && styles.pullQuoteDark]}>
      <Text style={[styles.pullQuoteText, { color: ink }]}>{`\u201C${quote}\u201D`}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  block: {
    gap: HOME_SPACE.sm,
  },
  eyebrow: {
    fontFamily: fonts.semibold,
    fontSize: HOME_TYPE.eyebrow,
    letterSpacing: 1.2,
    textTransform: "uppercase",
  },
  title: {
    fontFamily: FONT_HEADING,
    fontSize: HOME_TYPE.sectionTitle.min + 2,
    lineHeight: 30,
    letterSpacing: -0.3,
  },
  specGrid: {
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: KANKREG_PALETTE.lineSoft,
    overflow: "hidden",
    backgroundColor: KANKREG_PALETTE.card,
  },
  specGridDark: {
    backgroundColor: "rgba(255,255,255,0.04)",
    borderColor: "rgba(255,255,255,0.08)",
  },
  specRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: spacing.md,
    paddingVertical: 11,
    paddingHorizontal: HOME_SPACE.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: KANKREG_PALETTE.lineSoft,
  },
  specRowDark: {
    borderBottomColor: "rgba(255,255,255,0.06)",
  },
  specLabel: {
    fontFamily: fonts.regular,
    fontSize: HOME_TYPE.kicker - 1,
    flex: 1,
  },
  specValue: {
    fontFamily: fonts.semibold,
    fontSize: HOME_TYPE.kicker - 1,
    flex: 1.2,
    textAlign: "right",
  },
  card: {
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: KANKREG_PALETTE.lineSoft,
    backgroundColor: KANKREG_PALETTE.card,
    padding: HOME_SPACE.md,
    gap: spacing.sm,
  },
  cardDark: {
    backgroundColor: "rgba(255,255,255,0.04)",
    borderColor: "rgba(255,255,255,0.08)",
  },
  cardAccent: {
    borderColor: "rgba(92, 104, 52, 0.18)",
  },
  cardIcon: {
    marginBottom: 2,
  },
  cardBody: {
    fontFamily: fonts.regular,
    fontSize: HOME_TYPE.kicker,
    lineHeight: 22,
  },
  tagRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.xs,
  },
  tag: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 999,
    backgroundColor: "rgba(92, 104, 52, 0.08)",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(92, 104, 52, 0.14)",
  },
  tagDark: {
    backgroundColor: "rgba(168, 184, 108, 0.1)",
    borderColor: "rgba(168, 184, 108, 0.16)",
  },
  tagText: {
    fontFamily: fonts.semibold,
    fontSize: HOME_TYPE.eyebrow,
    color: KANKREG_PALETTE.green,
  },
  bulletList: {
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  bulletRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
  },
  bulletText: {
    fontFamily: fonts.regular,
    fontSize: HOME_TYPE.kicker - 1,
    lineHeight: 20,
    flex: 1,
  },
  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(92, 104, 52, 0.16)",
    backgroundColor: "rgba(92, 104, 52, 0.06)",
  },
  chipDark: {
    borderColor: "rgba(168, 184, 108, 0.18)",
    backgroundColor: "rgba(168, 184, 108, 0.08)",
  },
  chipText: {
    fontFamily: fonts.semibold,
    fontSize: HOME_TYPE.eyebrow + 1,
  },
  faqList: {
    gap: spacing.sm,
  },
  faqItem: {
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: KANKREG_PALETTE.lineSoft,
    backgroundColor: KANKREG_PALETTE.paper,
    padding: HOME_SPACE.md,
    gap: 6,
  },
  faqItemDark: {
    backgroundColor: "rgba(255,255,255,0.03)",
    borderColor: "rgba(255,255,255,0.07)",
  },
  faqQ: {
    fontFamily: fonts.semibold,
    fontSize: HOME_TYPE.kicker,
    lineHeight: 22,
  },
  faqA: {
    fontFamily: fonts.regular,
    fontSize: HOME_TYPE.kicker - 1,
    lineHeight: 21,
  },
  usageGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  usageCard: {
    width: Platform.OS === "web" ? "31%" : "48%",
    minWidth: 140,
    flexGrow: 1,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: KANKREG_PALETTE.lineSoft,
    backgroundColor: KANKREG_PALETTE.card,
    padding: HOME_SPACE.md,
    gap: 6,
  },
  usageCardDark: {
    backgroundColor: "rgba(255,255,255,0.04)",
    borderColor: "rgba(255,255,255,0.08)",
  },
  usageIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(92, 104, 52, 0.08)",
  },
  usageTitle: {
    fontFamily: fonts.semibold,
    fontSize: HOME_TYPE.kicker - 1,
  },
  usageBody: {
    fontFamily: fonts.regular,
    fontSize: HOME_TYPE.eyebrow + 1,
    lineHeight: 18,
  },
  pullQuote: {
    borderLeftWidth: 3,
    borderLeftColor: KANKREG_PALETTE.gold,
    paddingLeft: HOME_SPACE.md,
    paddingVertical: spacing.xs,
    marginVertical: spacing.sm,
  },
  pullQuoteDark: {
    borderLeftColor: KANKREG_PALETTE.goldBright,
  },
  pullQuoteText: {
    fontFamily: FONT_HEADING,
    fontSize: HOME_TYPE.body.min + 1,
    lineHeight: 26,
    fontStyle: "italic",
  },
});
