import React from "react";
import { Image, StyleSheet, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useStoreTheme, withAlpha } from "../../theme/storefront";
import { STORE_BRAND } from "../../content/storefrontContent";
import StoreIcon from "./StoreIcon";
import StoreWordmark from "./StoreWordmark";

/** A hairline that fades out at both ends. */
function GoldRule({ style }) {
  const { c } = useStoreTheme();
  return (
    <LinearGradient
      colors={[withAlpha(c.gold, 0), withAlpha(c.gold, 0.75), withAlpha(c.gold, 0)]}
      start={{ x: 0, y: 0.5 }}
      end={{ x: 1, y: 0.5 }}
      style={[styles.rule, style]}
    />
  );
}

/** The four “Why Zeevan” promises as one white card: round icon, two-line label, fine gold dividers between them. */
export function TrustStrip({ items }) {
  const { c, r, type, gutter, isDark } = useStoreTheme();
  return (
    <View style={{ paddingHorizontal: gutter }}>
      <View style={[styles.card, { backgroundColor: withAlpha(c.card, isDark ? 0.55 : 0.72), borderColor: withAlpha(c.gold, isDark ? 0.16 : 0.18), borderRadius: r.xl }]}>
        {items.map((item, i) => (
          <React.Fragment key={item.key}>
            {i > 0 ? <View style={[styles.divider, { backgroundColor: withAlpha(c.gold, 0.22) }]} /> : null}
            <View style={styles.item}>
              {item.image && !isDark ? (
                <Image source={item.image} style={styles.image} resizeMode="cover" accessibilityIgnoresInvertColors />
              ) : (
                <View style={[styles.icon, { backgroundColor: isDark ? withAlpha(c.gold, 0.12) : c.goldSoft }]}>
                  <StoreIcon icon={item.icon} size={20} color={c.goldText} />
                </View>
              )}
              <Text style={[type.ui(11, "semibold", c.inkSoft, { letterSpacing: 0.1 }), styles.label]}>{item.label}</Text>
            </View>
          </React.Fragment>
        ))}
      </View>
    </View>
  );
}

/** Quiet brand sign-off: a gold rule, the sprouting-leaf wordmark and the tagline. */
export function BrandFooter({ version }) {
  const { c, type, gutter } = useStoreTheme();
  return (
    <View style={[styles.footer, { paddingHorizontal: gutter }]}>
      <GoldRule style={styles.footerRule} />
      <StoreWordmark size={46} color={withAlpha(c.gold, 0.9)} leafColor={withAlpha(c.gold, 0.7)} />
      <Text style={type.eyebrow(c.goldText, 10.5)}>{STORE_BRAND.tagline}</Text>
      {version ? <Text style={type.ui(11, "medium", c.inkMute)}>{version}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  rule: { alignSelf: "stretch", height: 1.5 },
  card: { flexDirection: "row", alignItems: "stretch", borderWidth: StyleSheet.hairlineWidth, paddingVertical: 14, paddingHorizontal: 4 },
  item: { flex: 1, alignItems: "center", gap: 6, paddingHorizontal: 2 },
  divider: { width: StyleSheet.hairlineWidth, marginVertical: 10 },
  image: { width: 36, height: 36, borderRadius: 18 },
  icon: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center" },
  label: { textAlign: "center", lineHeight: 15, minHeight: 30 },
  footer: { alignItems: "center", gap: 8, paddingTop: 6, paddingBottom: 8 },
  footerRule: { width: "56%", marginBottom: 10 },
});
