import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useStoreTheme, withAlpha } from "../../theme/storefront";
import { STORE_BRAND } from "../../content/storefrontContent";
import { Stagger } from "./HomeMotion";
import StoreIcon from "./StoreIcon";

/** A hairline that fades out at both ends. */
function GoldRule() {
  const { c } = useStoreTheme();
  return (
    <LinearGradient
      colors={[withAlpha(c.gold, 0), withAlpha(c.gold, 0.7), withAlpha(c.gold, 0)]}
      start={{ x: 0, y: 0.5 }}
      end={{ x: 1, y: 0.5 }}
      style={styles.rule}
    />
  );
}

/** The four “Why Zeevan” promises as icons with a two-line label, between two gold hairlines. */
export function TrustStrip({ items }) {
  const { c, type, gutter, isDark } = useStoreTheme();
  return (
    <View style={[styles.trustWrap, { paddingHorizontal: gutter }]}>
      <GoldRule />
      <View style={styles.trustRow}>
        {items.map((item, i) => (
          <Stagger key={item.key} index={i} step={0.1} distance={10} scaleFrom={1} style={styles.trustItem}>
            <View
              style={[
                styles.trustIcon,
                {
                  backgroundColor: isDark ? withAlpha(c.gold, 0.14) : c.goldSoft,
                  borderColor: withAlpha(c.gold, isDark ? 0.34 : 0.5),
                },
              ]}
            >
              <StoreIcon icon={item.icon} size={22} color={c.goldText} />
            </View>
            <Text style={[type.ui(11.5, "bold", c.inkSoft), styles.trustLabel]}>{item.label}</Text>
          </Stagger>
        ))}
      </View>
      <GoldRule />
    </View>
  );
}

/** Quiet brand sign-off: the wordmark and the tagline. */
export function BrandFooter({ version }) {
  const { c, type, gutter } = useStoreTheme();
  return (
    <View style={[styles.footer, { paddingHorizontal: gutter }]}>
      <Text style={type.display(46, { color: withAlpha(c.gold, 0.5), ls: -1.4, lh: 52 })} allowFontScaling={false}>
        {STORE_BRAND.name}
      </Text>
      <Text style={type.eyebrow(c.goldText, 10.5)}>{STORE_BRAND.tagline}</Text>
      {version ? <Text style={type.ui(11, "medium", c.inkMute)}>{version}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  rule: { alignSelf: "stretch", height: 1.5 },
  trustWrap: { gap: 18 },
  trustRow: { flexDirection: "row" },
  trustItem: { flex: 1, alignItems: "center", gap: 8 },
  trustIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  trustLabel: { textAlign: "center", lineHeight: 15, minHeight: 30 },
  footer: { alignItems: "center", gap: 6, paddingTop: 2, paddingBottom: 8 },
});
