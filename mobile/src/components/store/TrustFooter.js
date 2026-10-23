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
  const { c, r, type, gutter, shadow, isDark } = useStoreTheme();
  return (
    <View style={{ paddingHorizontal: gutter }}>
      <View style={[styles.card, shadow.soft, { backgroundColor: c.card, borderColor: c.goldLine, borderRadius: r.xl }]}>
        {items.map((item, i) => (
          <React.Fragment key={item.key}>
            {i > 0 ? <View style={[styles.divider, { backgroundColor: c.goldLine }]} /> : null}
            <View style={styles.item}>
              {item.image && !isDark ? (
                <Image source={item.image} style={styles.image} resizeMode="cover" accessibilityIgnoresInvertColors />
              ) : (
                <View style={[styles.icon, { backgroundColor: isDark ? withAlpha(c.gold, 0.14) : c.goldSoft, borderColor: withAlpha(c.gold, isDark ? 0.34 : 0.5) }]}>
                  <StoreIcon icon={item.icon} size={24} color={c.goldText} />
                </View>
              )}
              <Text style={[type.ui(11.5, "bold", c.inkSoft), styles.label]}>{item.label}</Text>
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
  card: { flexDirection: "row", alignItems: "stretch", borderWidth: 1, paddingVertical: 16, paddingHorizontal: 6 },
  item: { flex: 1, alignItems: "center", gap: 8, paddingHorizontal: 2 },
  divider: { width: StyleSheet.hairlineWidth, marginVertical: 8 },
  /** 1024px source assets — rendered large enough for crisp @3x. */
  image: { width: 50, height: 50, borderRadius: 25 },
  icon: { width: 50, height: 50, borderRadius: 25, alignItems: "center", justifyContent: "center", borderWidth: 1 },
  label: { textAlign: "center", lineHeight: 15, minHeight: 30 },
  footer: { alignItems: "center", gap: 8, paddingTop: 6, paddingBottom: 8 },
  footerRule: { width: "56%", marginBottom: 10 },
});
