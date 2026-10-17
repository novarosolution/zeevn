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

const CSS_ID = "zeevan-diwali-sale-v5";
const SHELL_CLASS = "zeevan-diwali-shell";
const CTA_CLASS = "zeevan-diwali-cta";

injectWebCssOnce(
  CSS_ID,
  `.${SHELL_CLASS} .${CTA_CLASS} {
  transition: background-color 0.25s ease, transform 0.25s ease, box-shadow 0.25s ease;
}
.${SHELL_CLASS} .${CTA_CLASS}:hover {
  background-color: ${ZEEVAN_GOLD.bright};
  transform: translateY(-2px);
  box-shadow: 0 14px 28px -12px rgba(0,0,0,0.35);
}
@keyframes zeevanHeroProductFloat {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-10px); }
}
@keyframes zeevanHeroSheen {
  0% { background-position: 0% 50%; }
  100% { background-position: 200% 50%; }
}
.${SHELL_CLASS} .zeevan-diwali-prod {
  animation: zeevanHeroProductFloat 4.8s ease-in-out infinite;
}
.${SHELL_CLASS} .zeevan-diwali-prod:nth-child(2) { animation-delay: 0.6s; }
.${SHELL_CLASS} .zeevan-diwali-prod:nth-child(3) { animation-delay: 1.2s; }
.${SHELL_CLASS}::after {
  content: "";
  position: absolute;
  inset: 0;
  pointer-events: none;
  background: linear-gradient(110deg, transparent 40%, rgba(245,215,142,0.08) 50%, transparent 60%);
  background-size: 200% 100%;
  animation: zeevanHeroSheen 9s linear infinite;
  z-index: 2;
}
@media (prefers-reduced-motion: reduce) {
  .${SHELL_CLASS} .${CTA_CLASS} { transition: none !important; }
  .${SHELL_CLASS} .${CTA_CLASS}:hover { transform: none; }
  .${SHELL_CLASS} .zeevan-diwali-prod,
  .${SHELL_CLASS}::after { animation: none !important; }
}`
);

/** Diwali hero — festive bg + real catalog product photos (same as shop). */
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
                <Text style={styles.codeLabel}>{copy.codeLabel}</Text>
                <Text style={styles.codeValue}>{copy.code}</Text>
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
                  className="zeevan-diwali-prod"
                  style={[
                    styles.productCard,
                    idx === 0 && styles.productCardMain,
                    idx === 1 && styles.productCardLeft,
                    idx === 2 && styles.productCardRight,
                  ]}
                >
                  <Image source={p.image} style={styles.productImg} resizeMode="cover" />
                </View>
              ))}
            </View>
          ) : null}
        </View>

        {isMobileWeb && products.length ? (
          <View style={styles.productRowMobile} accessibilityLabel="Zeevan products">
            {products.map((p) => (
              <View key={p.key} style={styles.productCardMobile}>
                <Image source={p.image} style={styles.productImg} resizeMode="cover" />
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
    minHeight: 440,
    backgroundColor: ZEEVAN_GREEN.deep,
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
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: ZEEVAN_GOLD.base,
  },
  salePillText: {
    fontFamily: fonts.bold,
    fontSize: 10,
    letterSpacing: 1.2,
    color: ZEEVAN_GREEN.deep,
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
          "linear-gradient(100deg, rgba(24,32,18,0.78) 0%, rgba(24,32,18,0.35) 42%, rgba(24,32,18,0.12) 100%)",
      },
      default: { backgroundColor: "rgba(24,32,18,0.55)" },
    }),
  },
  scrimMobile: {
    ...Platform.select({
      web: {
        backgroundImage:
          "linear-gradient(180deg, rgba(24,32,18,0.7) 0%, rgba(24,32,18,0.5) 60%, rgba(24,32,18,0.4) 100%)",
      },
      default: {},
    }),
  },
  badge: {
    position: "absolute",
    top: 18,
    right: 28,
    zIndex: 3,
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: ZEEVAN_GREEN.base,
    borderWidth: 2,
    borderColor: ZEEVAN_GOLD.base,
    alignItems: "center",
    justifyContent: "center",
    paddingBottom: 6,
  },
  badgeTitle: {
    fontFamily: FONT_HEADING,
    fontSize: 16,
    color: "#FAF8F4",
  },
  badgeSub: {
    fontFamily: fonts.regular,
    fontSize: 7,
    lineHeight: 9,
    color: "rgba(250,248,244,0.85)",
    textAlign: "center",
    paddingHorizontal: 6,
  },
  badgeTag: {
    position: "absolute",
    bottom: -2,
    backgroundColor: ZEEVAN_GOLD.base,
    paddingHorizontal: 10,
    paddingVertical: 2,
    borderRadius: 8,
  },
  badgeTagText: {
    fontFamily: fonts.bold,
    fontSize: 9,
    letterSpacing: 1,
    color: ZEEVAN_GREEN.deep,
  },
  row: {
    position: "relative",
    zIndex: 2,
    width: "100%",
    maxWidth: 1280,
    alignSelf: "center",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 24,
    paddingVertical: spacing.xxl,
    minHeight: 440,
  },
  rowMobile: {
    flexDirection: "column",
    alignItems: "center",
    minHeight: 0,
    paddingVertical: spacing.lg,
    paddingTop: spacing.xl + 4,
    gap: 14,
  },
  inner: {
    flex: 1,
    maxWidth: 480,
    gap: 12,
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
    width: 420,
    height: 340,
    flexShrink: 0,
  },
  productCard: {
    position: "absolute",
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 2,
    borderColor: "rgba(250,248,244,0.35)",
    ...Platform.select({
      web: { boxShadow: "0 18px 40px -16px rgba(0,0,0,0.45)" },
      default: {},
    }),
  },
  productCardMain: {
    width: 200,
    height: 260,
    right: 90,
    bottom: 20,
    zIndex: 3,
  },
  productCardLeft: {
    width: 140,
    height: 180,
    left: 8,
    bottom: 40,
    zIndex: 2,
  },
  productCardRight: {
    width: 130,
    height: 170,
    right: 0,
    top: 24,
    zIndex: 1,
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
    aspectRatio: 0.82,
    maxHeight: 148,
    borderRadius: 14,
    overflow: "hidden",
    borderWidth: 1.5,
    borderColor: "rgba(250,248,244,0.35)",
  },
  eyebrow: {
    fontFamily: fonts.semibold,
    fontSize: 11,
    letterSpacing: 2.2,
    textTransform: "uppercase",
    color: ZEEVAN_GOLD.bright,
  },
  eyebrowMobile: {
    fontSize: 10,
    letterSpacing: 1.8,
  },
  title: {
    fontFamily: FONT_HEADING,
    fontSize: 36,
    lineHeight: 42,
    letterSpacing: -0.4,
    color: "#FAF8F4",
  },
  titleMobile: {
    fontSize: 24,
    lineHeight: 30,
    textAlign: "center",
    paddingHorizontal: 4,
  },
  titleHighlight: {
    color: ZEEVAN_GOLD.bright,
  },
  body: {
    fontFamily: fonts.regular,
    fontSize: 15,
    lineHeight: 22,
    color: "rgba(250, 248, 244, 0.88)",
    maxWidth: 400,
  },
  bodyMobile: {
    textAlign: "center",
    fontSize: 14,
    lineHeight: 20,
    maxWidth: 340,
  },
  offerRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginTop: 4,
  },
  offerRowMobile: {
    flexDirection: "column",
    width: "100%",
    gap: 8,
  },
  offerBox: {
    backgroundColor: "rgba(250,248,244,0.96)",
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 14,
    gap: 2,
  },
  offerBoxMobile: {
    width: "100%",
    alignItems: "center",
    paddingVertical: 12,
  },
  offerMain: {
    fontFamily: fonts.bold,
    fontSize: 15,
    color: ZEEVAN_GREEN.deep,
  },
  offerExtra: {
    fontFamily: fonts.regular,
    fontSize: 11,
    color: "rgba(36,68,36,0.75)",
  },
  codeBox: {
    borderWidth: 1.5,
    borderStyle: "dashed",
    borderColor: "rgba(250,248,244,0.7)",
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 14,
    backgroundColor: "rgba(0,0,0,0.18)",
    gap: 2,
  },
  codeBoxMobile: {
    width: "100%",
    alignItems: "center",
    paddingVertical: 12,
  },
  codeLabel: {
    fontFamily: fonts.regular,
    fontSize: 10,
    letterSpacing: 1,
    color: "rgba(250,248,244,0.7)",
  },
  codeValue: {
    fontFamily: fonts.bold,
    fontSize: 15,
    letterSpacing: 1.2,
    color: ZEEVAN_GOLD.bright,
  },
  cta: {
    marginTop: 6,
    paddingVertical: 13,
    paddingHorizontal: 26,
    borderRadius: 12,
    backgroundColor: ZEEVAN_GOLD.base,
  },
  ctaMobile: {
    width: "100%",
    alignItems: "center",
    marginTop: 4,
    paddingVertical: 14,
  },
  ctaLabel: {
    fontFamily: fonts.semibold,
    fontSize: 14,
    color: ZEEVAN_GREEN.deep,
  },
});
