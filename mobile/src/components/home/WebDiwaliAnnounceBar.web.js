import React from "react";
import { Platform, StyleSheet, Text, View } from "react-native";
import { DIWALI_FESTIVE } from "../../content/diwaliFestiveContent";
import { HOME_SCREEN_UI } from "../../content/appContent";
import { ZEEVAN_GOLD, ZEEVAN_GREEN } from "../../theme/kankregWeb";
import { fonts } from "../../theme/tokens";
import { injectWebCssOnce } from "../../utils/injectWebCssOnce";

const CSS_ID = "zeevan-diwali-announce-v1";
const TRACK = "zeevan-diwali-marquee";

injectWebCssOnce(
  CSS_ID,
  `@keyframes zeevanDiwaliMarquee {
  from { transform: translateX(0); }
  to { transform: translateX(-50%); }
}
.${TRACK} {
  display: flex;
  width: max-content;
  animation: zeevanDiwaliMarquee 28s linear infinite;
}
@media (prefers-reduced-motion: reduce) {
  .${TRACK} { animation: none; }
}`
);

/** Gold Diwali sale ticker — sits above the home hero. */
export default function WebDiwaliAnnounceBar() {
  if (HOME_SCREEN_UI.web?.showDiwaliFestive === false) return null;
  const line = DIWALI_FESTIVE.announce;
  const doubled = `${line}     ${line}`;

  return (
    <View style={styles.shell} accessibilityRole="status" accessibilityLabel={line}>
      <View style={styles.clip}>
        <View className={TRACK} style={styles.track}>
          <Text style={styles.text}>{doubled}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  shell: {
    width: "100%",
    backgroundColor: ZEEVAN_GREEN.deep,
    borderBottomWidth: 2,
    borderBottomColor: ZEEVAN_GOLD.base,
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
  clip: {
    overflow: "hidden",
    paddingVertical: 9,
  },
  track: {
    flexDirection: "row",
  },
  text: {
    fontFamily: fonts.semibold,
    fontSize: 12,
    letterSpacing: 0.6,
    color: ZEEVAN_GOLD.bright,
    whiteSpace: "nowrap",
    ...Platform.select({
      web: { whiteSpace: "nowrap" },
      default: {},
    }),
  },
});
