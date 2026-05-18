import React, { useEffect, useMemo, useState } from "react";
import { StyleSheet, View } from "react-native";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { icon } from "../../theme/tokens";
import { getImageUriCandidates } from "../../utils/image";

/**
 * Product thumbnail with URI fallback chain (cart screen + drawer).
 */
export default function CartItemThumb({ uri, width, height, borderRadius = 10, semanticPalette }) {
  const candidates = useMemo(() => getImageUriCandidates(uri), [uri]);
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    setIdx(0);
  }, [uri]);

  const current = candidates[idx] || "";

  if (!current) {
    return (
      <View
        style={[
          styles.placeholder,
          {
            width,
            height,
            borderRadius,
            borderColor: semanticPalette.line,
            backgroundColor: semanticPalette.surfaceAlt,
          },
        ]}
      >
        <Ionicons name="image-outline" size={icon.lg} color={semanticPalette.inkMuted} />
      </View>
    );
  }

  return (
    <Image
      source={{ uri: current }}
      style={{ width, height, borderRadius }}
      contentFit="cover"
      onError={() => setIdx((i) => (i + 1 < candidates.length ? i + 1 : i))}
    />
  );
}

const styles = StyleSheet.create({
  placeholder: {
    alignItems: "center",
    justifyContent: "center",
    borderWidth: StyleSheet.hairlineWidth,
  },
});
