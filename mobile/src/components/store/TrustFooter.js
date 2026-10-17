import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useStoreTheme, withAlpha } from "../../theme/storefront";
import { STORE_BRAND } from "../../content/storefrontContent";
import { SectionHeader } from "./SectionTitle";
import StoreIcon from "./StoreIcon";

/** “Why Zeevan” — four brand promises in one calm card. */
export function TrustStrip({ title, items }) {
  const { c, r, type, shadow, gutter } = useStoreTheme();
  return (
    <View style={styles.trustWrap}>
      <SectionHeader title={title} />
      <View style={[styles.trustCard, shadow.soft, { marginHorizontal: gutter, backgroundColor: c.card, borderColor: c.line, borderRadius: r.xl }]}>
        {items.map((item, i) => (
          <View key={item.key} style={[styles.trustItem, i > 0 && { borderLeftWidth: StyleSheet.hairlineWidth, borderLeftColor: c.line }]}>
            <View style={[styles.trustIcon, { backgroundColor: c.brandSoft }]}>
              <StoreIcon icon={item.icon} size={22} color={c.brand} />
            </View>
            <Text style={[type.ui(12, "bold", c.inkSoft), styles.trustLabel]}>{item.label}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

/** Quiet brand sign-off: oversized wordmark, tagline and made-in line. */
export function BrandFooter({ version }) {
  const { c, type, gutter } = useStoreTheme();
  return (
    <View style={[styles.footer, { paddingHorizontal: gutter }]}>
      <LinearGradient
        colors={[withAlpha(c.gold, 0), withAlpha(c.gold, 0.7), withAlpha(c.gold, 0)]}
        start={{ x: 0, y: 0.5 }}
        end={{ x: 1, y: 0.5 }}
        style={styles.rule}
      />
      <Text style={type.display(64, { color: withAlpha(c.gold, 0.55), ls: -2, lh: 70 })} allowFontScaling={false}>
        {STORE_BRAND.name}
      </Text>
      <Text style={type.eyebrow(c.goldText, 11)}>{STORE_BRAND.tagline}</Text>
      <Text style={[type.ui(12.5, "medium", c.inkMute), styles.madeIn]}>{STORE_BRAND.madeIn}</Text>
      {version ? <Text style={type.ui(11, "medium", c.inkMute)}>{version}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  trustWrap: { gap: 14 },
  trustCard: { flexDirection: "row", borderWidth: StyleSheet.hairlineWidth, paddingVertical: 16 },
  trustItem: { flex: 1, alignItems: "center", gap: 8, paddingHorizontal: 4 },
  trustIcon: { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center" },
  trustLabel: { textAlign: "center", lineHeight: 16 },
  footer: { alignItems: "center", gap: 6, paddingTop: 8 },
  rule: { alignSelf: "stretch", height: 1.5, marginBottom: 14 },
  madeIn: { marginTop: 2 },
});
