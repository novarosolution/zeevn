import React from "react";
import { Image, Platform, StyleSheet, View } from "react-native";
import { DIWALI_FESTIVE } from "../../content/diwaliFestiveContent";
import { HOME_SCREEN_UI } from "../../content/appContent";
import { injectWebCssOnce } from "../../utils/injectWebCssOnce";

injectWebCssOnce(
  "zeevan-diwali-divider-anim",
  `@keyframes zeevanDividerGlow {
  0%, 100% { filter: brightness(1); transform: scale(1); }
  50% { filter: brightness(1.08); transform: scale(1.02); }
}
.zeevan-diwali-div-img {
  animation: zeevanDividerGlow 4.5s ease-in-out infinite;
}
@media (prefers-reduced-motion: reduce) {
  .zeevan-diwali-div-img { animation: none !important; }
}`
);

/** Marigold + diya divider between home sections. */
export default function WebDiwaliDivider() {
  if (HOME_SCREEN_UI.web?.showDiwaliFestive === false) return null;
  return (
    <View style={styles.wrap} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <Image
        source={DIWALI_FESTIVE.divider}
        className="zeevan-diwali-div-img"
        style={styles.img}
        resizeMode="cover"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: "100%",
    height: 52,
    marginTop: 0,
    marginBottom: 0,
    overflow: "hidden",
    alignSelf: "center",
    ...Platform.select({
      web: {
        width: "100vw",
        maxWidth: "100vw",
        marginLeft: "calc(50% - 50vw)",
        marginRight: "calc(50% - 50vw)",
      },
      default: {},
    }),
  },
  img: {
    width: "100%",
    height: "100%",
  },
});
