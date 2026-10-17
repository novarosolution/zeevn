import React from "react";
import { Image, Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { DIWALI_BRIDGE_SECTION } from "../../content/diwaliBridgeContent";
import { useKankregLayout } from "../../theme/kankregBreakpoints";
import { ZEEVAN_GOLD, ZEEVAN_GREEN } from "../../theme/kankregWeb";
import { FONT_HEADING } from "../../theme/typographyRoles";
import { fonts, spacing } from "../../theme/tokens";
import { injectWebCssOnce } from "../../utils/injectWebCssOnce";
import SectionReveal from "../motion/SectionReveal";
import WebDiwaliFxOverlay from "./WebDiwaliFxOverlay";

const CSS_ID = "zeevan-diwali-sale-v6";
const SHELL_CLASS = "zeevan-diwali-shell";
const CTA_CLASS = "zeevan-diwali-cta";
const PROD_CLASS = "zeevan-diwali-prod";

const GOLD = "#E0B878";
const GOLD_SOFT = "#C9A676";
const CREAM = "#FAF6EE";
const INK_DEEP = "#1A2010";

injectWebCssOnce(
  CSS_ID,
  `.${SHELL_CLASS} .${CTA_CLASS} {
  transition: background-color 0.25s ease, transform 0.25s ease, box-shadow 0.25s ease;
}
.${SHELL_CLASS} .${CTA_CLASS}:hover {
  background-color: ${ZEEVAN_GOLD.bright};
  transform: translateY(-2px);
  box-shadow: 0 16px 32px -12px rgba(0,0,0,0.4);
}
@keyframes zeevanDiwaliProdFloat {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-8px); }
}
.${SHELL_CLASS} .${PROD_CLASS} {
  animation: zeevanDiwaliProdFloat 5.2s ease-in-out infinite;
}
.${SHELL_CLASS} .${PROD_CLASS}:nth-child(2) { animation-delay: 0.55s; }
.${SHELL_CLASS} .${PROD_CLASS}:nth-child(3) { animation-delay: 1.1s; }
.${SHELL_CLASS} .zeevan-diwali-prod-img {
  transition: transform 0.7s cubic-bezier(0.22, 1, 0.36, 1);
}
.${SHELL_CLASS} .${PROD_CLASS}:hover .zeevan-diwali-prod-img {
  transform: scale(1.04);
}
@media (prefers-reduced-motion: reduce) {
  .${SHELL_CLASS} .${CTA_CLASS} { transition: none !important; }
  .${SHELL_CLASS} .${CTA_CLASS}:hover { transform: none; }
  .${SHELL_CLASS} .${PROD_CLASS},
  .${SHELL_CLASS} .zeevan-diwali-prod-img { animation: none !important; transition: none !important; }
}`
);

/** Diwali Craft Sale hero — reference layout + premium product panels. */
export default function WebDiwaliBridgeSection() {
  const navigation = useNavigation();
  const { isMobileWeb, pageGutterClamp } = useKankregLayout();
  const copy = DIWALI_BRIDGE_SECTION;
  const products = copy.products || [];

  return (
    <SectionReveal preset="fade-up" style={styles.reveal}>
      <View
        className={SHELL_CLASS}
        style={[styles.shell, isMobileWeb && styles.shellMobile]}
        accessibilityRole="region"
        accessibilityLabel={`${copy.titleBefore} ${copy.titleHighlight} ${copy.titleAfter}`}
      >
        <Image source={copy.image} style={styles.photo} resizeMode="cover" />
        <View style={[styles.scrim, isMobileWeb && styles.scrimMobile]} pointerEvents="none" />
        <WebDiwaliFxOverlay compact={isMobileWeb} />

        {!isMobileWeb ? (
          <View style={styles.badge} accessibilityElementsHidden>
            <Text style={styles.badgeTitle}>{copy.badgeTitle}</Text>
            <Text style={styles.badgeSub}>{copy.badgeSub}</Text>
            <View style={styles.badgeTag}>
              <Text style={styles.badgeTagText}>{copy.badgeTag}</Text>
            </View>
          </View>
        ) : (
          <View style={styles.salePillMobile} accessibilityElementsHidden>
            <Text style={styles.salePillText}>{copy.badgeTag}</Text>
          </View>
        )}

        <View
          style={[
            styles.row,
            { paddingHorizontal: pageGutterClamp },
            isMobileWeb && styles.rowMobile,
          ]}
        >
          <View style={[styles.inner, isMobileWeb && styles.innerMobile]}>
            <Text style={[styles.eyebrow, isMobileWeb && styles.eyebrowMobile]}>{copy.eyebrow}</Text>
            <Text style={[styles.title, isMobileWeb && styles.titleMobile]}>
              {copy.titleBefore}{" "}
              <Text style={styles.titleHighlight}>{copy.titleHighlight}</Text>
              {isMobileWeb ? `\n${copy.titleAfter}` : ` ${copy.titleAfter}`}
            </Text>
            <Text style={[styles.body, isMobileWeb && styles.bodyMobile]}>{copy.body}</Text>

            <View style={[styles.offerRow, isMobileWeb && styles.offerRowMobile]}>
              <View style={[styles.offerBox, isMobileWeb && styles.offerBoxMobile]}>
                <Text style={styles.offerMain}>{copy.offerMain}</Text>
                <Text style={styles.offerExtra}>{copy.offerExtra}</Text>
              </View>
              <View style={[styles.codeBox, isMobileWeb && styles.codeBoxMobile]}>
                <Text style={styles.codeLine}>
                  {copy.codeLabel} {copy.code}
                </Text>
              </View>
            </View>

            <Pressable
              className={CTA_CLASS}
              onPress={() => navigation.navigate("Shop")}
              accessibilityRole="button"
              accessibilityLabel={copy.cta}
              style={[styles.cta, isMobileWeb && styles.ctaMobile]}
            >
              <Text style={styles.ctaLabel}>{copy.cta}</Text>
            </Pressable>
          </View>

          {!isMobileWeb && products.length ? (
            <View style={styles.productStage} accessibilityLabel="Zeevan products">
              {products.map((p, idx) => (
                <View
                  key={p.key}
                  className={PROD_CLASS}
                  style={[
                    styles.productCard,
                    idx === 0 && styles.productCardMain,
                    idx === 1 && styles.productCardLeft,
                    idx === 2 && styles.productCardRight,
                  ]}
                >
                  <Image
                    source={p.image}
                    className="zeevan-diwali-prod-img"
                    style={styles.productImg}
                    resizeMode="cover"
                    accessibilityLabel={p.label}
                  />
                </View>
              ))}
            </View>
          ) : null}
        </View>

        {isMobileWeb && products.length ? (
          <View style={styles.productRowMobile} accessibilityLabel="Zeevan products">
            {/* Mobile: tel · ghee · honey visual order */}
            {[products[1], products[0], products[2]].filter(Boolean).map((p) => (
              <View key={p.key} style={styles.productCardMobile}>
                <Image
                  source={p.image}
                  style={styles.productImg}
                  resizeMode="cover"
                  accessibilityLabel={p.label}
                />
              </View>
            ))}
          </View>
        ) : null}
      </View>
    </SectionReveal>
  );
}

const styles = StyleSheet.create({
  reveal: { width: "100%" },
  shell: {
    position: "relative",
    overflow: "hidden",
    minHeight: 520,
    backgroundColor: INK_DEEP,
    alignSelf: "center",
    ...Platform.select({
      web: {
        width: "100vw",
        maxWidth: "100vw",
        marginLeft: "calc(50% - 50vw)",
        marginRight: "calc(50% - 50vw)",
      },
      default: { width: "100%" },
    }),
  },
  shellMobile: { minHeight: 0, paddingBottom: spacing.lg },
  salePillMobile: {
    position: "absolute",
    top: 12,
    right: 12,
    zIndex: 3,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: GOLD_SOFT,
  },
  salePillText: {
    fontFamily: fonts.bold,
    fontSize: 10,
    letterSpacing: 1.4,
    color: INK_DEEP,
  },
  photo: {
    ...StyleSheet.absoluteFillObject,
    width: "100%",
    height: "100%",
  },
  scrim: {
    ...StyleSheet.absoluteFillObject,
    ...Platform.select({
      web: {
        backgroundImage:
          "linear-gradient(105deg, rgba(18,22,12,0.82) 0%, rgba(18,22,12,0.45) 38%, rgba(18,22,12,0.18) 62%, rgba(18,22,12,0.35) 100%)",
      },
      default: { backgroundColor: "rgba(18,22,12,0.55)" },
    }),
  },
  scrimMobile: {
    ...Platform.select({
      web: {
        backgroundImage:
          "linear-gradient(180deg, rgba(18,22,12,0.78) 0%, rgba(18,22,12,0.55) 55%, rgba(18,22,12,0.5) 100%)",
      },
      default: {},
    }),
  },
  badge: {
    position: "absolute",
    top: 22,
    right: 36,
    zIndex: 3,
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: ZEEVAN_GREEN.deep,
    borderWidth: 1.5,
    borderColor: GOLD_SOFT,
    alignItems: "center",
    justifyContent: "center",
    paddingBottom: 8,
    ...Platform.select({
      web: { boxShadow: "0 12px 28px -10px rgba(0,0,0,0.45)" },
      default: {},
    }),
  },
  badgeTitle: {
    fontFamily: FONT_HEADING,
    fontSize: 18,
    letterSpacing: 0.5,
    color: CREAM,
  },
  badgeSub: {
    fontFamily: fonts.regular,
    fontSize: 8,
    lineHeight: 11,
    letterSpacing: 0.2,
    color: "rgba(250,246,238,0.88)",
    textAlign: "center",
    paddingHorizontal: 8,
    marginTop: 2,
  },
  badgeTag: {
    position: "absolute",
    bottom: -4,
    backgroundColor: GOLD_SOFT,
    paddingHorizontal: 12,
    paddingVertical: 3,
    borderRadius: 10,
  },
  badgeTagText: {
    fontFamily: fonts.bold,
    fontSize: 9,
    letterSpacing: 1.4,
    color: INK_DEEP,
  },
  row: {
    position: "relative",
    zIndex: 2,
    width: "100%",
    maxWidth: 1320,
    alignSelf: "center",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 28,
    paddingVertical: spacing.xxl + 8,
    minHeight: 520,
  },
  rowMobile: {
    flexDirection: "column",
    alignItems: "center",
    minHeight: 0,
    paddingVertical: spacing.lg,
    paddingTop: spacing.xl + 8,
    gap: 14,
  },
  inner: {
    flex: 1,
    maxWidth: 520,
    gap: 14,
    alignItems: "flex-start",
  },
  innerMobile: {
    maxWidth: "100%",
    width: "100%",
    alignItems: "center",
    gap: 10,
  },
  productStage: {
    position: "relative",
    width: 460,
    height: 380,
    flexShrink: 0,
    marginRight: 8,
  },
  productCard: {
    position: "absolute",
    borderRadius: 18,
    overflow: "hidden",
    borderWidth: 2,
    borderColor: "rgba(250,246,238,0.42)",
    ...Platform.select({
      web: { boxShadow: "0 22px 48px -18px rgba(0,0,0,0.55)" },
      default: {},
    }),
  },
  productCardMain: {
    width: 220,
    height: 300,
    right: 88,
    bottom: 12,
    zIndex: 3,
    borderRadius: 20,
  },
  productCardLeft: {
    width: 148,
    height: 200,
    left: 4,
    bottom: 48,
    zIndex: 2,
    transform: [{ rotate: "-3deg" }],
  },
  productCardRight: {
    width: 138,
    height: 188,
    right: 0,
    top: 18,
    zIndex: 1,
    transform: [{ rotate: "3deg" }],
  },
  productImg: {
    width: "100%",
    height: "100%",
  },
  productRowMobile: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 8,
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
    zIndex: 2,
    width: "100%",
  },
  productCardMobile: {
    flex: 1,
    aspectRatio: 0.78,
    maxHeight: 168,
    borderRadius: 14,
    overflow: "hidden",
    borderWidth: 1.5,
    borderColor: "rgba(250,246,238,0.4)",
    ...Platform.select({
      web: { boxShadow: "0 12px 24px -12px rgba(0,0,0,0.4)" },
      default: {},
    }),
  },
  eyebrow: {
    fontFamily: FONT_HEADING,
    fontSize: 13,
    letterSpacing: 2.6,
    textTransform: "uppercase",
    color: GOLD,
  },
  eyebrowMobile: {
    fontSize: 11,
    letterSpacing: 2,
  },
  title: {
    fontFamily: FONT_HEADING,
    fontSize: 42,
    lineHeight: 48,
    letterSpacing: -0.5,
    color: CREAM,
  },
  titleMobile: {
    fontSize: 26,
    lineHeight: 32,
    textAlign: "center",
    paddingHorizontal: 4,
  },
  titleHighlight: {
    color: GOLD,
  },
  body: {
    fontFamily: fonts.regular,
    fontSize: 16,
    lineHeight: 24,
    color: "rgba(250, 246, 238, 0.88)",
    maxWidth: 420,
  },
  bodyMobile: {
    textAlign: "center",
    fontSize: 14,
    lineHeight: 21,
    maxWidth: 340,
  },
  offerRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "stretch",
    gap: 10,
    marginTop: 6,
  },
  offerRowMobile: {
    flexDirection: "column",
    width: "100%",
    gap: 8,
  },
  offerBox: {
    backgroundColor: CREAM,
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 16,
    gap: 2,
    justifyContent: "center",
  },
  offerBoxMobile: {
    width: "100%",
    alignItems: "center",
    paddingVertical: 14,
  },
  offerMain: {
    fontFamily: fonts.bold,
    fontSize: 16,
    letterSpacing: 0.3,
    color: INK_DEEP,
  },
  offerExtra: {
    fontFamily: fonts.regular,
    fontSize: 11,
    color: "rgba(26,32,16,0.72)",
  },
  codeBox: {
    borderWidth: 1.5,
    borderStyle: "dashed",
    borderColor: GOLD_SOFT,
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: "rgba(0,0,0,0.22)",
    justifyContent: "center",
  },
  codeBoxMobile: {
    width: "100%",
    alignItems: "center",
    paddingVertical: 14,
  },
  codeLine: {
    fontFamily: fonts.bold,
    fontSize: 13,
    letterSpacing: 1.4,
    color: GOLD,
  },
  cta: {
    marginTop: 10,
    paddingVertical: 14,
    paddingHorizontal: 30,
    borderRadius: 12,
    backgroundColor: GOLD_SOFT,
  },
  ctaMobile: {
    width: "100%",
    alignItems: "center",
    marginTop: 6,
    paddingVertical: 15,
  },
  ctaLabel: {
    fontFamily: fonts.semibold,
    fontSize: 15,
    letterSpacing: 0.2,
    color: INK_DEEP,
  },
});
