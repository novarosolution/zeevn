import React from "react";
import { StyleSheet, Text, View } from "react-native";
import Svg, { Path } from "react-native-svg";
import { useStoreTheme } from "../../theme/storefront";

/** Zeevan serif wordmark with the sprouting leaf (matches the packaging logo). */
export default function StoreWordmark({ size = 28, color, leafColor, tagline = false, style }) {
  const { c, type } = useStoreTheme();
  const ink = color || c.brand;
  const leaf = leafColor || c.brandBright;
  const leafSize = Math.round(size * 0.46);

  return (
    <View style={style} accessibilityRole="image" accessibilityLabel="Zeevan">
      <View style={styles.row}>
        <Text style={type.display(size, { color: ink, ls: -0.6, lh: Math.round(size * 1.1) })} allowFontScaling={false}>
          Zeevan
        </Text>
        <Svg
          width={leafSize}
          height={leafSize}
          viewBox="0 0 24 24"
          style={[styles.leaf, { marginTop: -Math.round(size * 0.08) }]}
        >
          <Path d="M3 21 C3 11 9 4 21 3 C21 12 14 20 3 21 Z" fill={leaf} />
          <Path d="M3 21 C7 15 11 11 17 7" stroke={ink} strokeOpacity={0.35} strokeWidth={1.2} fill="none" strokeLinecap="round" />
        </Svg>
      </View>
      {tagline ? (
        <Text style={type.eyebrow(c.inkMute, Math.max(8, Math.round(size * 0.3)))} allowFontScaling={false}>
          Taste of Purity
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "flex-start" },
  leaf: { marginLeft: 1 },
});
