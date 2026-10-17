import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useStoreTheme, withAlpha } from "../../theme/storefront";
import { STORE_BRAND } from "../../content/storefrontContent";
import { SectionHeader } from "./SectionTitle";
import StoreIcon from "./StoreIcon";

/** “Why Zeevan” — four brand promises in a 2×2 premium card. */
export function TrustStrip({ title, items }) {
  const { c, r, type, shadow, gutter, isDark } = useStoreTheme();
  return (
    <View style={styles.trustWrap}>
      <SectionHeader title={title} />
      <View
        style={[
          styles.trustCard,
          shadow.card,
          {
            marginHorizontal: gutter,
            backgroundColor: c.card,
            borderColor: c.line,
            borderRadius: r.xxl,
          },
        ]}
      >
        {items.map((item, i) => (
          <View
            key={item.key}
            style={[
              styles.trustItem,
              i % 2 === 1 && { borderLeftWidth: StyleSheet.hairlineWidth, borderLeftColor: c.line },
              i >= 2 && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: c.line },
            ]}
          >
            <View
              style={[
                styles.trustIcon,
                {
                  backgroundColor: isDark ? withAlpha(c.gold, 0.14) : c.goldSoft,
                  borderColor: withAlpha(c.gold, 0.28),
                },
              ]}
            >
              <StoreIcon icon={item.icon} size={20} color={c.goldText} />
            </View>
            <Text style={[type.ui(13, "bold", c.ink), styles.trustLabel]}>{item.label}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

/** Quiet brand sign-off: wordmark, tagline and made-in line. */
export function BrandFooter({ version }) {
  const { c, type, gutter } = useStoreTheme();
  return (
    <View style={[styles.footer, { paddingHorizontal: gutter }]}>
      <LinearGradient
        colors={[withAlpha(c.gold, 0), withAlpha(c.gold, 0.65), withAlpha(c.gold, 0)]}
        start={{ x: 0, y: 0.5 }}
        end={{ x: 1, y: 0.5 }}
        style={styles.rule}
      />
      <Text style={type.display(48, { color: withAlpha(c.gold, 0.5), ls: -1.4, lh: 54 })} allowFontScaling={false}>
        {STORE_BRAND.name}
      </Text>
      <Text style={type.eyebrow(c.goldText, 10.5)}>{STORE_BRAND.tagline}</Text>
      <Text style={[type.ui(12.5, "medium", c.inkMute), styles.madeIn]}>{STORE_BRAND.madeIn}</Text>
      {version ? <Text style={type.ui(11, "medium", c.inkMute)}>{version}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  trustWrap: { gap: 12 },
  trustCard: {
    flexDirection: "row",
    flexWrap: "wrap",
    borderWidth: StyleSheet.hairlineWidth,
    overflow: "hidden",
  },
  trustItem: {
    width: "50%",
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 16,
    paddingHorizontal: 14,
  },
  trustIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: StyleSheet.hairlineWidth,
  },
  trustLabel: { flex: 1, lineHeight: 17 },
  footer: { alignItems: "center", gap: 6, paddingTop: 4, paddingBottom: 8 },
  rule: { alignSelf: "stretch", height: 1.5, marginBottom: 12 },
  madeIn: { marginTop: 2 },
});
