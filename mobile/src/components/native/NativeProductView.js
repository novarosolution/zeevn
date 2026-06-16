import React, { useMemo } from "react";
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { ALCHEMY } from "../../theme/customerAlchemy";
import { FONT_HEADING, FONT_PRICE } from "../../theme/typographyRoles";
import { KANKREG_PALETTE } from "../../theme/kankregWeb";
import { useTheme } from "../../context/ThemeContext";
import { formatINR } from "../../utils/currency";
import { getProductThumbImageUri } from "../../utils/image";
import { getComingSoonImageBlurStyle } from "../../utils/comingSoonImageStyle";
import ComingSoonProductOverlay from "../product/ComingSoonProductOverlay";
import ProgressiveProductImage from "../ui/ProgressiveProductImage";
import {
  customerProductScrollPaddingBottom,
  NATIVE_PRODUCT_STICKY_BAR_HEIGHT,
} from "../../theme/screenLayout";
import { fonts, radius, spacing } from "../../theme/tokens";
import { PRODUCT_SCREEN, fillProductScreen } from "../../content/appContent";
import { resolveProductPageContent } from "../../utils/resolveProductPageContent";
import {
  ProductFaqSection,
  ProductIngredientsCard,
  ProductPullQuoteBlock,
  ProductShippingCard,
  ProductSpecsGrid,
  ProductStorageCard,
  ProductUsageGrid,
  ProductWhyZeevan,
} from "../product/ProductPageExtras";
import NativeStickyBuyBar from "./NativeStickyBuyBar";
import NativeProductCard from "./NativeProductCard";
import GoldHairline from "../ui/GoldHairline";

function StarRow({ rating, size = 11 }) {
  const filled = Math.min(5, Math.max(0, Math.round(Number(rating) || 0)));
  return (
    <Text style={[styles.stars, { fontSize: size }]}>
      {"★".repeat(filled)}
      {"☆".repeat(5 - filled)}
    </Text>
  );
}

function SectionHeader({ eyebrow, title, isDark, c }) {
  return (
    <View style={styles.sectionHead}>
      <Text style={styles.sectionEyebrow}>{eyebrow}</Text>
      <Text style={[styles.sectionTitle, { color: isDark ? c.textPrimary : KANKREG_PALETTE.ink }]}>
        {title}
      </Text>
      <View style={styles.sectionRule} />
    </View>
  );
}

function FeatureCard({ icon, title, subtitle, isDark, c }) {
  return (
    <View
      style={[
        styles.featureCard,
        {
          backgroundColor: isDark ? c.surfaceMuted : KANKREG_PALETTE.card,
          borderColor: isDark ? c.border : KANKREG_PALETTE.line,
        },
      ]}
    >
      <View style={styles.featureIcon}>
        <Ionicons name={icon} size={17} color={KANKREG_PALETTE.goldDeep} />
      </View>
      <View style={styles.featureCopy}>
        <Text style={[styles.featureTitle, { color: isDark ? c.textPrimary : KANKREG_PALETTE.ink }]}>
          {title}
        </Text>
        <Text style={styles.featureSub}>{subtitle}</Text>
      </View>
    </View>
  );
}

/** kankreg design board screen 08 — premium product detail */
export default function NativeProductView({
  product,
  navigation,
  heroImageUri,
  imageFailed,
  galleryImages,
  selectedImage,
  onSelectImage,
  variants,
  selectedVariantLabel,
  onSelectVariant,
  displayPrice,
  showMrp,
  mrp,
  offPct,
  liveRatingAvg,
  reviewCountDisplay,
  isOutOfStock,
  isComingSoon = false,
  comingSoonNote = "",
  onAddToCart,
  onRemoveFromCart,
  onBuyNow,
  quantity = 0,
  relatedProducts,
  onRelatedPress,
  onAddRelated,
  reviews = [],
  reviewRating = 0,
  onReviewRatingChange,
  reviewComment = "",
  onReviewCommentChange,
  reviewBusy = false,
  reviewSuccess = "",
  reviewError = "",
  onSubmitReview,
  isAuthenticated = false,
  shelfMatch = false,
}) {
  const insets = useSafeAreaInsets();
  const { colors: c, isDark } = useTheme();

  const pageContent = useMemo(
    () => resolveProductPageContent(product, { shelfMatch }),
    [product, shelfMatch]
  );

  if (Platform.OS === "web") return null;

  const pageBg = isDark ? c.background : KANKREG_PALETTE.paper;
  const sheetBg = isDark ? c.surface : KANKREG_PALETTE.card;
  const iconColor = isDark ? c.textSecondary : KANKREG_PALETTE.inkSoft;
  const unit = product?.unit || PRODUCT_SCREEN.unitFallback;
  const leadText = pageContent.lead || PRODUCT_SCREEN.defaultDescription;
  const featureCards = pageContent.featureCards;
  const highlights = pageContent.highlights;
  const deliveryNote = pageContent.delivery;
  const { story, showStoryLegend, trustChips, showStorySection } = pageContent;
  const pageUi = pageContent.ui;

  const ratingSummary =
    liveRatingAvg > 0
      ? fillProductScreen(PRODUCT_SCREEN.metaRatingSummary, {
          rating: liveRatingAvg.toFixed(1),
          count: String(reviewCountDisplay),
        })
      : PRODUCT_SCREEN.metaNoRatings;

  return (
    <View style={[styles.root, { backgroundColor: pageBg }]}>
      <LinearGradient
        colors={
          isDark
            ? ["rgba(201,162,39,0.14)", "rgba(28,25,23,0.35)", c.background]
            : ["#f5ead0", "#ebe2d0", KANKREG_PALETTE.paper]
        }
        locations={[0, 0.5, 1]}
        style={styles.heroBg}
      />

      <View style={[styles.topBar, { paddingTop: Math.max(insets.top, 10) }]}>
        <Pressable
          style={[styles.circleBtn, isDark && styles.circleBtnDark]}
          onPress={() => {
            if (typeof navigation?.canGoBack === "function" && navigation.canGoBack()) {
              navigation.goBack();
              return;
            }
            navigation.navigate("Shop");
          }}
          accessibilityLabel="Back"
        >
          <Ionicons name="chevron-back" size={18} color={iconColor} />
        </Pressable>
        <Pressable style={[styles.circleBtn, isDark && styles.circleBtnDark]} accessibilityLabel="Wishlist">
          <Ionicons name="heart-outline" size={17} color={iconColor} />
        </Pressable>
      </View>

      <View style={[styles.heroStage, isDark && styles.heroStageDark]}>
        <View style={styles.heroGoldLineTop} pointerEvents="none" />
        <View style={styles.heroGoldLineBottom} pointerEvents="none" />
        {heroImageUri && !imageFailed ? (
          <ProgressiveProductImage
            uri={heroImageUri}
            previewUri={getProductThumbImageUri(selectedImage || product?.image)}
            style={[styles.heroImage, isComingSoon && getComingSoonImageBlurStyle()]}
            contentFit="contain"
            priority="high"
            rounded={0}
          />
        ) : (
          <View style={styles.heroFallback}>
            <Ionicons name="cube-outline" size={72} color={KANKREG_PALETTE.goldDeep} />
          </View>
        )}
        {isComingSoon ? (
          <ComingSoonProductOverlay note={comingSoonNote} isDark={isDark} variant="hero" />
        ) : null}
        <View style={styles.heroShadow} />
        <LinearGradient
          colors={["transparent", isDark ? "rgba(28,25,23,0.5)" : "rgba(255,253,248,0.85)"]}
          style={styles.heroVignette}
          pointerEvents="none"
        />
      </View>

      {galleryImages.length > 1 ? (
        <View style={[styles.galleryDock, { backgroundColor: isDark ? "rgba(28,25,23,0.72)" : "rgba(255,253,248,0.9)" }]}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.galleryRow}>
            {galleryImages.map((uri) => {
              const thumbUri = getProductThumbImageUri(uri) || uri;
              const isActive = selectedImage === uri;
              return (
              <Pressable
                key={uri}
                onPress={() => onSelectImage(uri)}
                style={[
                  styles.thumb,
                  { backgroundColor: isDark ? c.surfaceMuted : KANKREG_PALETTE.paper2 },
                  isActive && styles.thumbOn,
                ]}
              >
                <ProgressiveProductImage
                  uri={thumbUri}
                  style={styles.thumbImage}
                  contentFit="cover"
                  priority={isActive ? "high" : "normal"}
                  rounded={10}
                />
              </Pressable>
            );
            })}
          </ScrollView>
        </View>
      ) : null}

      <ScrollView
        style={styles.sheetScroll}
        contentContainerStyle={[
          styles.sheetContent,
          { paddingBottom: customerProductScrollPaddingBottom(insets, NATIVE_PRODUCT_STICKY_BAR_HEIGHT) },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.sheet, { backgroundColor: sheetBg }]}>
          <View style={[styles.sheetAccent, { backgroundColor: isDark ? ALCHEMY.goldBright : ALCHEMY.gold }]} />
          <View style={styles.sheetHandleWrap}>
            <View
              style={[styles.sheetHandle, { backgroundColor: isDark ? "rgba(255,255,255,0.2)" : "rgba(25,20,15,0.14)" }]}
            />
          </View>

          <Text style={styles.breadcrumb} numberOfLines={1}>
            Shop · {String(product?.category || PRODUCT_SCREEN.categoryFallback).trim()} · {product?.name}
          </Text>

          {pageContent.eyebrow ? (
            <Text style={styles.pageEyebrow}>{pageContent.eyebrow}</Text>
          ) : null}

          <Text style={[styles.title, { color: isDark ? c.textPrimary : KANKREG_PALETTE.ink }]}>
            {product?.name}
          </Text>

          <View style={styles.ratingRow}>
            <StarRow rating={liveRatingAvg} size={12} />
            <Text style={styles.ratingMeta}>{ratingSummary}</Text>
          </View>

          <View
            style={[
              styles.pricePanel,
              {
                backgroundColor: isDark ? "rgba(255,255,255,0.04)" : "rgba(169,119,46,0.06)",
                borderColor: isDark ? c.border : "rgba(169,119,46,0.18)",
              },
            ]}
          >
            <View style={styles.priceBand}>
              <Text style={[styles.price, { color: isDark ? c.textPrimary : KANKREG_PALETTE.ink }]}>
                {formatINR(displayPrice)}
              </Text>
              {showMrp && mrp ? <Text style={styles.mrp}>{formatINR(mrp)}</Text> : null}
              <Text style={styles.unit}>/{unit}</Text>
            </View>
            {offPct != null && offPct > 0 ? (
              <View style={styles.saveChip}>
                <Ionicons name="pricetag" size={11} color={KANKREG_PALETTE.green} />
                <Text style={styles.saveChipText}>
                  {fillProductScreen(PRODUCT_SCREEN.savePctChip, { pct: String(offPct) })}
                </Text>
              </View>
            ) : null}
            {quantity > 0 ? (
              <View style={styles.inBagPill}>
                <Ionicons name="bag-check-outline" size={12} color={KANKREG_PALETTE.green} />
                <Text style={styles.inBagPillText}>
                  {fillProductScreen(PRODUCT_SCREEN.inCartCount, { count: String(quantity) })}
                </Text>
              </View>
            ) : null}
          </View>

          {leadText ? (
            <Text style={[styles.lead, { color: isDark ? c.textSecondary : KANKREG_PALETTE.inkSoft }]}>
              {leadText}
            </Text>
          ) : null}

          {variants.length > 0 ? (
            <View style={styles.block}>
              <Text style={styles.blockLabel}>{PRODUCT_SCREEN.variantOverline}</Text>
              <Text style={[styles.blockTitle, { color: isDark ? c.textPrimary : KANKREG_PALETTE.ink }]}>
                {PRODUCT_SCREEN.variantTitle}
              </Text>
              <View style={styles.variantRow}>
                {variants.map((v) => {
                  const label = String(v.label || v.name || "");
                  const active = selectedVariantLabel === label;
                  return (
                    <Pressable
                      key={label}
                      onPress={() => onSelectVariant(label)}
                      style={[
                        styles.variantPill,
                        active
                          ? {
                              backgroundColor: isDark ? c.primaryDark : KANKREG_PALETTE.ink,
                              borderColor: isDark ? c.primary : KANKREG_PALETTE.ink,
                            }
                          : {
                              backgroundColor: isDark ? c.surfaceMuted : KANKREG_PALETTE.card,
                              borderColor: isDark ? c.border : KANKREG_PALETTE.line,
                            },
                      ]}
                    >
                      <Text
                        style={[
                          styles.variantText,
                          {
                            color: active
                              ? c.onPrimary
                              : isDark
                                ? c.textSecondary
                                : KANKREG_PALETTE.inkSoft,
                          },
                          active && styles.variantTextOn,
                        ]}
                      >
                        {label}
                      </Text>
                      {v.tag ? <Text style={styles.variantTag}>{String(v.tag)}</Text> : null}
                    </Pressable>
                  );
                })}
              </View>
            </View>
          ) : null}

          {deliveryNote ? (
            <View style={[styles.delivBox, isDark && styles.delivBoxDark]}>
              <Ionicons name="car-outline" size={16} color={KANKREG_PALETTE.green} />
              <Text style={[styles.delivText, { color: isDark ? c.textSecondary : KANKREG_PALETTE.inkSoft }]}>
                {deliveryNote.title ? `${deliveryNote.title} ` : ""}
                {deliveryNote.body}
              </Text>
            </View>
          ) : null}

          {highlights.length > 0 ? (
            <View style={styles.hlList}>
              {highlights.map((line) => (
                <View key={line} style={styles.hlRow}>
                  <Ionicons name="checkmark" size={14} color={KANKREG_PALETTE.green} />
                  <Text style={[styles.hlText, { color: isDark ? c.textSecondary : KANKREG_PALETTE.inkSoft }]}>
                    {line}
                  </Text>
                </View>
              ))}
            </View>
          ) : null}

          {trustChips.length > 0 ? (
            <View style={styles.trustChipRow}>
              {trustChips.map((chip) => (
                <View key={chip.label} style={[styles.trustChip, isDark && styles.trustChipDark]}>
                  <Ionicons name={chip.icon} size={13} color={KANKREG_PALETTE.green} />
                  <Text style={[styles.trustChipText, { color: isDark ? c.textSecondary : KANKREG_PALETTE.inkSoft }]}>
                    {chip.label}
                  </Text>
                </View>
              ))}
            </View>
          ) : null}

          <GoldHairline marginVertical={spacing.md} />

          {pageContent.showSpecs ? (
            <View style={styles.block}>
              <ProductSpecsGrid
                specs={pageContent.specs}
                isDark={isDark}
                eyebrow={pageUi.specsEyebrow}
                title={pageUi.specsTitle}
              />
            </View>
          ) : null}

          {showStorySection ? (
            <>
          <SectionHeader
            eyebrow={story.kick || PRODUCT_SCREEN.storyOverline}
            title={story.title || PRODUCT_SCREEN.storyTitle}
            isDark={isDark}
            c={c}
          />
          {showStoryLegend ? (
            <Text style={[styles.desc, { color: isDark ? c.textSecondary : KANKREG_PALETTE.inkSoft }]}>
              {story.legend}
            </Text>
          ) : null}

          <ProductPullQuoteBlock
            quote={pageContent.highlightQuote || product?.highlightQuote}
            isDark={isDark}
          />

          {(pageContent.processSteps?.length || (product?.richProductPage && product?.processSteps?.length)) ? (
            <View style={styles.processWrap}>
              {(pageContent.processTitle || product?.processTitle) ? (
                <Text style={styles.processEyebrow}>{pageContent.processTitle || product.processTitle}</Text>
              ) : null}
              {(pageContent.processSteps?.length ? pageContent.processSteps : product.processSteps).map((step, idx) => (
                <View key={`${step}-${idx}`} style={[styles.processRow, isDark && styles.processRowDark]}>
                  <View style={styles.processNum}>
                    <Text style={styles.processNumText}>{String(idx + 1).padStart(2, "0")}</Text>
                  </View>
                  <Text style={[styles.processText, { color: isDark ? c.textSecondary : KANKREG_PALETTE.inkSoft }]}>
                    {String(step)}
                  </Text>
                </View>
              ))}
            </View>
          ) : null}

          {featureCards.length > 0 ? (
            <View style={styles.uspsWrap}>
              {featureCards.map((feat, idx) => (
                <FeatureCard key={`${feat.title}-${idx}`} {...feat} isDark={isDark} c={c} />
              ))}
            </View>
          ) : null}
            </>
          ) : null}

          {pageContent.showNutritionSection && pageContent.nutrition ? (
            <View style={styles.block}>
              <SectionHeader
                eyebrow={pageContent.nutrition.kick}
                title={pageContent.nutrition.title}
                isDark={isDark}
                c={c}
              />
              {pageContent.nutrition.rows?.map((row) => (
                <View key={row.label} style={[styles.nutriRow, isDark && styles.nutriRowDark]}>
                  <Text style={[styles.nutriLabel, { color: isDark ? c.textSecondary : KANKREG_PALETTE.inkSoft }]}>
                    {row.label}
                  </Text>
                  <Text style={[styles.nutriValue, { color: isDark ? c.textPrimary : KANKREG_PALETTE.ink }]}>
                    {row.value}
                  </Text>
                </View>
              ))}
              {pageContent.nutrition.card?.body ? (
                <Text style={[styles.desc, { color: isDark ? c.textSecondary : KANKREG_PALETTE.inkSoft, marginTop: spacing.sm }]}>
                  {pageContent.nutrition.card.body}
                </Text>
              ) : null}
            </View>
          ) : null}

          {pageContent.showIngredients ? (
            <View style={styles.block}>
              <ProductIngredientsCard
                ingredients={pageContent.ingredients}
                isDark={isDark}
                eyebrow={pageUi.ingredientsEyebrow}
                title={pageUi.ingredientsTitle}
              />
            </View>
          ) : null}

          {pageContent.usageRituals?.length ? (
            <View style={styles.block}>
              <ProductUsageGrid
                items={pageContent.usageRituals}
                isDark={isDark}
                eyebrow={pageUi.usageEyebrow}
                title={pageUi.usageTitle}
              />
            </View>
          ) : null}

          {pageContent.showStorage ? (
            <View style={styles.block}>
              <ProductStorageCard
                storage={pageContent.storage}
                isDark={isDark}
                eyebrow={pageUi.storageEyebrow}
                title={pageUi.storageTitle}
              />
            </View>
          ) : null}

          {pageContent.showShipping ? (
            <View style={styles.block}>
              <ProductShippingCard
                shipping={pageContent.shipping}
                isDark={isDark}
                eyebrow={pageUi.shippingEyebrow}
                title={pageUi.shippingTitle}
              />
            </View>
          ) : null}

          {pageContent.showWhyZeevan ? (
            <View style={styles.block}>
              <ProductWhyZeevan
                whyZeevan={pageContent.whyZeevan}
                isDark={isDark}
                eyebrow={pageUi.whyEyebrow}
                title={pageUi.whyTitle}
              />
            </View>
          ) : null}

          {pageContent.showFaq ? (
            <View style={styles.block}>
              <ProductFaqSection
                faq={pageContent.faq}
                isDark={isDark}
                eyebrow={pageUi.faqEyebrow}
                title={pageUi.faqTitle}
              />
            </View>
          ) : null}
        </View>

        <View style={[styles.reviewsBlock, { backgroundColor: isDark ? c.surface : KANKREG_PALETTE.paper2 }]}>
          <SectionHeader
            eyebrow={pageContent.reviewsSection.kick}
            title={
              reviewCountDisplay > 0
                ? `${pageContent.reviewsSection.title} · ${liveRatingAvg.toFixed(1)}`
                : pageContent.reviewsSection.title
            }
            isDark={isDark}
            c={c}
          />
          {reviewCountDisplay === 0 ? (
            <Text style={[styles.reviewsEmpty, { color: isDark ? c.textMuted : KANKREG_PALETTE.inkFaint }]}>
              {PRODUCT_SCREEN.reviewsEmptySubtitle}
            </Text>
          ) : null}

          {(reviews || []).slice(0, 3).map((r, idx) => {
            const name = String(r.userName || "Customer").trim() || "Customer";
            const initial = name.charAt(0).toUpperCase();
            const comment = String(r.comment || "").trim();
            const rt = Number(r.rating || 0);
            return (
              <View
                key={`${r._id || idx}`}
                style={[
                  styles.reviewItem,
                  { borderColor: isDark ? c.border : KANKREG_PALETTE.line, backgroundColor: sheetBg },
                ]}
              >
                <View style={[styles.reviewAvatar, { backgroundColor: "rgba(169,119,46,0.12)" }]}>
                  <Text style={styles.reviewAvatarText}>{initial}</Text>
                </View>
                <View style={styles.reviewBody}>
                  <View style={styles.reviewTop}>
                    <Text style={[styles.reviewName, { color: isDark ? c.textPrimary : KANKREG_PALETTE.ink }]}>
                      {name}
                    </Text>
                    <View style={styles.reviewPill}>
                      <Ionicons name="star" size={10} color={KANKREG_PALETTE.goldBright} />
                      <Text style={styles.reviewPillText}>{rt}</Text>
                    </View>
                  </View>
                  <Text style={[styles.reviewComment, { color: isDark ? c.textSecondary : KANKREG_PALETTE.inkSoft }]}>
                    {comment || PRODUCT_SCREEN.reviewNoWrittenNote}
                  </Text>
                </View>
              </View>
            );
          })}

          <View
            style={[
              styles.reviewComposer,
              {
                backgroundColor: sheetBg,
                borderColor: isDark ? c.border : KANKREG_PALETTE.line,
              },
            ]}
          >
            <View style={styles.reviewStarsPick}>
              {[1, 2, 3, 4, 5].map((value) => (
                <Pressable key={value} onPress={() => onReviewRatingChange?.(value)} hitSlop={8}>
                  <Ionicons
                    name={value <= reviewRating ? "star" : "star-outline"}
                    size={22}
                    color={value <= reviewRating ? KANKREG_PALETTE.goldBright : KANKREG_PALETTE.inkFaint}
                  />
                </Pressable>
              ))}
            </View>
            <TextInput
              value={reviewComment}
              onChangeText={onReviewCommentChange}
              placeholder={PRODUCT_SCREEN.reviewComposerPlaceholder}
              placeholderTextColor={KANKREG_PALETTE.inkFaint}
              multiline
              numberOfLines={3}
              style={[
                styles.reviewInput,
                {
                  color: isDark ? c.textPrimary : KANKREG_PALETTE.ink,
                  borderColor: isDark ? c.border : KANKREG_PALETTE.line,
                },
              ]}
            />
            {reviewError ? <Text style={styles.reviewError}>{reviewError}</Text> : null}
            {reviewSuccess ? <Text style={styles.reviewSuccess}>{reviewSuccess}</Text> : null}
            <Pressable
              onPress={() => {
                if (!isAuthenticated) {
                  navigation.navigate("Login");
                  return;
                }
                onSubmitReview?.();
              }}
              disabled={reviewBusy}
              style={({ pressed }) => [
                styles.reviewSubmit,
                (pressed || reviewBusy) && { opacity: 0.88 },
              ]}
            >
              <LinearGradient
                colors={reviewBusy ? ["#9a9a9a", "#7a7a7a"] : ["#788844", "#244424"]}
                start={{ x: 0, y: 0.5 }}
                end={{ x: 1, y: 0.5 }}
                style={styles.reviewSubmitGrad}
              >
                <Text style={styles.reviewSubmitText}>
                  {reviewBusy ? PRODUCT_SCREEN.reviewPosting : PRODUCT_SCREEN.reviewPost}
                </Text>
              </LinearGradient>
            </Pressable>
          </View>
        </View>

        {relatedProducts.length > 0 ? (
          <View style={styles.related}>
            <SectionHeader eyebrow="Catalog" title="You may also like" isDark={isDark} c={c} />
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.relatedRail}
            >
              {relatedProducts.map((p, idx) => (
                <View key={p.id} style={styles.relatedCard}>
                  <NativeProductCard
                    product={p}
                    index={idx + 1}
                    onPress={() => onRelatedPress(p)}
                    onAddToCart={() => onAddRelated(p)}
                  />
                </View>
              ))}
            </ScrollView>
          </View>
        ) : null}
      </ScrollView>

      <NativeStickyBuyBar
        visible
        productName={product?.name}
        price={displayPrice}
        quantity={quantity}
        onAddToCart={onAddToCart}
        onRemoveFromCart={onRemoveFromCart}
        onBuyNow={onBuyNow}
        disabled={isOutOfStock || isComingSoon}
        dockedAboveTabBar={false}
        ctaLabel={
          isComingSoon
            ? PRODUCT_SCREEN.comingSoonTitle
            : isOutOfStock
              ? PRODUCT_SCREEN.outOfStock
              : PRODUCT_SCREEN.addToCart
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  heroBg: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: "44%",
  },
  topBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 18,
    zIndex: 8,
  },
  circleBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "rgba(255,255,255,0.92)",
    alignItems: "center",
    justifyContent: "center",
    ...Platform.select({
      ios: {
        shadowColor: "#3D2A12",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 6,
      },
      android: { elevation: 2 },
      default: {},
    }),
  },
  circleBtnDark: {
    backgroundColor: "rgba(40,36,32,0.78)",
  },
  heroStage: {
    height: "36%",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: "12%",
    zIndex: 3,
    marginTop: 8,
    position: "relative",
    backgroundColor: "#f3ead8",
    borderRadius: radius.xl,
    marginHorizontal: spacing.md,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(120, 136, 68, 0.22)",
  },
  heroStageDark: {
    backgroundColor: "#1a1410",
    borderColor: "rgba(120, 136, 68, 0.12)",
  },
  heroGoldLineTop: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 1,
    zIndex: 4,
    backgroundColor: "rgba(120, 136, 68, 0.55)",
  },
  heroGoldLineBottom: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 1,
    zIndex: 4,
    backgroundColor: "rgba(120, 136, 68, 0.55)",
  },
  heroImage: {
    width: "100%",
    height: "100%",
  },
  heroFallback: {
    alignItems: "center",
    justifyContent: "center",
  },
  heroShadow: {
    position: "absolute",
    left: "20%",
    right: "20%",
    bottom: 8,
    height: 14,
    borderRadius: 999,
    backgroundColor: "rgba(25,20,15,0.12)",
    transform: [{ scaleX: 1.15 }],
  },
  heroVignette: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: 48,
  },
  galleryDock: {
    marginHorizontal: 16,
    marginTop: -10,
    marginBottom: 4,
    borderRadius: 16,
    paddingVertical: 10,
    paddingHorizontal: 8,
    zIndex: 6,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(169,119,46,0.15)",
    ...Platform.select({
      ios: {
        shadowColor: "#3D2A12",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.06,
        shadowRadius: 10,
      },
      android: { elevation: 3 },
      default: {},
    }),
  },
  galleryRow: {
    gap: 10,
    paddingHorizontal: 4,
  },
  sheetScroll: {
    flex: 1,
    marginTop: -12,
    zIndex: 5,
  },
  sheetContent: {},
  sheetHandleWrap: {
    alignItems: "center",
    marginTop: -4,
    marginBottom: 12,
  },
  sheetHandle: {
    width: 40,
    height: 4,
    borderRadius: 999,
  },
  sheet: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: spacing.lg,
    overflow: "hidden",
    ...Platform.select({
      ios: {
        shadowColor: "#3D2A12",
        shadowOffset: { width: 0, height: -6 },
        shadowOpacity: 0.07,
        shadowRadius: 16,
      },
      android: { elevation: 5 },
      default: {},
    }),
  },
  sheetAccent: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 2,
  },
  breadcrumb: {
    fontFamily: fonts.medium,
    fontSize: 11,
    color: KANKREG_PALETTE.inkFaint,
    marginBottom: 10,
  },
  pageEyebrow: {
    fontFamily: fonts.bold,
    fontSize: 12,
    letterSpacing: 2.5,
    textTransform: "uppercase",
    color: KANKREG_PALETTE.green,
    marginBottom: 8,
  },
  lead: {
    fontSize: 15,
    lineHeight: 24,
    fontFamily: fonts.regular,
    marginTop: 12,
    marginBottom: 8,
  },
  trustChipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 14,
  },
  trustChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 99,
    borderWidth: 1,
    borderColor: KANKREG_PALETTE.line,
    backgroundColor: "#FFFEFA",
  },
  trustChipDark: {
    backgroundColor: "rgba(255,255,255,0.03)",
    borderColor: "rgba(255,255,255,0.1)",
  },
  trustChipText: {
    fontFamily: fonts.semibold,
    fontSize: 12,
  },
  delivBox: {
    flexDirection: "row",
    gap: 10,
    marginTop: 14,
    padding: 12,
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: KANKREG_PALETTE.line,
    borderRadius: 12,
    backgroundColor: "#F3EBD8",
    alignItems: "flex-start",
  },
  delivBoxDark: {
    backgroundColor: "rgba(255,255,255,0.03)",
    borderColor: "rgba(255,255,255,0.12)",
  },
  delivText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 18,
    fontFamily: fonts.regular,
  },
  hlList: {
    marginTop: 12,
    gap: 8,
  },
  hlRow: {
    flexDirection: "row",
    gap: 8,
    alignItems: "flex-start",
  },
  hlText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 19,
    fontFamily: fonts.regular,
  },
  variantTag: {
    fontFamily: fonts.bold,
    fontSize: 9,
    color: KANKREG_PALETTE.goldDeep,
    marginTop: 2,
  },
  tagRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    alignItems: "center",
  },
  tagGold: {
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: "rgba(169,119,46,0.14)",
  },
  tagGoldText: {
    fontFamily: fonts.bold,
    fontSize: 9,
    letterSpacing: 0.9,
    color: KANKREG_PALETTE.goldDeep,
  },
  tagOk: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: "rgba(60,98,72,0.1)",
  },
  tagOkText: {
    fontFamily: fonts.semibold,
    fontSize: 9,
    color: KANKREG_PALETTE.green,
  },
  tagMuted: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: "rgba(168,68,47,0.1)",
  },
  tagMutedText: {
    fontFamily: fonts.semibold,
    fontSize: 9,
    color: KANKREG_PALETTE.danger,
  },
  tagStock: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: "rgba(25,20,15,0.05)",
  },
  tagStockText: {
    fontFamily: fonts.medium,
    fontSize: 9,
    color: KANKREG_PALETTE.inkSoft,
  },
  title: {
    fontFamily: FONT_HEADING,
    fontSize: 24,
    fontWeight: "500",
    lineHeight: 30,
    marginTop: 12,
    letterSpacing: -0.4,
  },
  ratingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 8,
  },
  stars: {
    color: KANKREG_PALETTE.goldBright,
    letterSpacing: 1.2,
  },
  ratingMeta: {
    fontFamily: fonts.regular,
    fontSize: 12,
    color: KANKREG_PALETTE.inkFaint,
  },
  pricePanel: {
    marginTop: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    flexWrap: "wrap",
    gap: 8,
  },
  priceBand: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "baseline",
    gap: 8,
  },
  price: {
    fontFamily: FONT_PRICE,
    fontSize: 28,
    fontWeight: "600",
    letterSpacing: -0.5,
  },
  mrp: {
    fontFamily: fonts.regular,
    fontSize: 14,
    color: KANKREG_PALETTE.inkFaint,
    textDecorationLine: "line-through",
  },
  unit: {
    fontFamily: fonts.medium,
    fontSize: 12,
    color: KANKREG_PALETTE.inkFaint,
  },
  saveChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: "rgba(60,98,72,0.12)",
  },
  saveChipText: {
    fontFamily: fonts.semibold,
    fontSize: 11,
    color: KANKREG_PALETTE.green,
  },
  inBagPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: "rgba(60,98,72,0.1)",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(60,98,72,0.18)",
    marginTop: 8,
    alignSelf: "flex-start",
  },
  inBagPillText: {
    fontFamily: fonts.semibold,
    fontSize: 11,
    color: KANKREG_PALETTE.green,
  },
  block: {
    marginTop: spacing.md,
  },
  blockLabel: {
    fontFamily: fonts.bold,
    fontSize: 9,
    letterSpacing: 1.2,
    textTransform: "uppercase",
    color: KANKREG_PALETTE.inkFaint,
    marginBottom: 4,
  },
  blockTitle: {
    fontFamily: FONT_HEADING,
    fontSize: 16,
    fontWeight: "500",
    marginBottom: 10,
  },
  variantRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  variantPill: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
  },
  variantPillOn: {
    backgroundColor: KANKREG_PALETTE.ink,
    borderColor: KANKREG_PALETTE.ink,
  },
  variantPillOff: {
    backgroundColor: KANKREG_PALETTE.card,
    borderColor: KANKREG_PALETTE.line,
  },
  variantText: {
    fontFamily: fonts.medium,
    fontSize: 12,
    color: KANKREG_PALETTE.inkSoft,
  },
  variantTextOn: {
    color: KANKREG_PALETTE.paper,
    fontFamily: fonts.semibold,
  },
  featureGrid: {
    gap: 8,
    marginTop: spacing.md,
  },
  featureCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 12,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
  },
  featureIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "rgba(169,119,46,0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  featureCopy: { flex: 1, minWidth: 0 },
  featureTitle: {
    fontFamily: fonts.semibold,
    fontSize: 13,
  },
  featureSub: {
    fontFamily: fonts.regular,
    fontSize: 10,
    color: KANKREG_PALETTE.inkFaint,
    lineHeight: 14,
  },
  sectionHead: {
    marginBottom: spacing.sm,
  },
  sectionEyebrow: {
    fontFamily: fonts.bold,
    fontSize: 9,
    letterSpacing: 1.4,
    textTransform: "uppercase",
    color: KANKREG_PALETTE.gold,
    marginBottom: 4,
  },
  sectionTitle: {
    fontFamily: FONT_HEADING,
    fontSize: 20,
    fontWeight: "500",
    letterSpacing: -0.2,
  },
  sectionRule: {
    width: 32,
    height: 2,
    borderRadius: 1,
    backgroundColor: KANKREG_PALETTE.gold,
    marginTop: 8,
    opacity: 0.7,
  },
  desc: {
    fontFamily: fonts.regular,
    fontSize: 14,
    lineHeight: 22,
    marginTop: 4,
  },
  pullQuote: {
    marginTop: spacing.md,
    paddingLeft: spacing.md,
    borderLeftWidth: 2,
    borderLeftColor: KANKREG_PALETTE.gold,
  },
  pullQuoteDark: {
    borderLeftColor: ALCHEMY.goldBright,
  },
  pullQuoteText: {
    fontFamily: FONT_HEADING,
    fontSize: 18,
    lineHeight: 26,
    fontStyle: "italic",
  },
  processWrap: {
    marginTop: spacing.md,
    gap: 8,
  },
  processEyebrow: {
    fontFamily: fonts.bold,
    fontSize: 10,
    letterSpacing: 1,
    textTransform: "uppercase",
    color: KANKREG_PALETTE.inkFaint,
    marginBottom: 4,
  },
  processRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    padding: 12,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: KANKREG_PALETTE.line,
    backgroundColor: KANKREG_PALETTE.card,
  },
  processRowDark: {
    backgroundColor: "rgba(255,255,255,0.04)",
    borderColor: "rgba(255,255,255,0.1)",
  },
  processNum: {
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: radius.pill,
    backgroundColor: "rgba(120, 136, 68, 0.14)",
  },
  processNumText: {
    fontFamily: fonts.bold,
    fontSize: 10,
    color: KANKREG_PALETTE.goldDeep,
  },
  processText: {
    flex: 1,
    fontFamily: fonts.regular,
    fontSize: 14,
    lineHeight: 21,
  },
  nutriRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: KANKREG_PALETTE.lineSoft,
  },
  nutriRowDark: {
    borderBottomColor: "rgba(255,255,255,0.08)",
  },
  nutriLabel: {
    fontFamily: fonts.regular,
    fontSize: 14,
    flex: 1,
  },
  nutriValue: {
    fontFamily: fonts.semibold,
    fontSize: 14,
    textAlign: "right",
  },
  uspsWrap: {
    marginTop: spacing.md,
    gap: 10,
  },
  uspCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    padding: 12,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: KANKREG_PALETTE.line,
    backgroundColor: KANKREG_PALETTE.paper2,
  },
  uspCardDark: {
    backgroundColor: "rgba(255,255,255,0.04)",
    borderColor: "rgba(255,255,255,0.1)",
  },
  uspDot: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "rgba(169,119,46,0.1)",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 1,
  },
  uspText: {
    flex: 1,
    fontFamily: fonts.regular,
    fontSize: 13,
    lineHeight: 20,
  },
  thumb: {
    width: 60,
    height: 60,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "transparent",
    overflow: "hidden",
    backgroundColor: KANKREG_PALETTE.paper2,
  },
  thumbOn: { borderColor: KANKREG_PALETTE.gold },
  thumbImage: { width: "100%", height: "100%" },
  reviewsBlock: {
    marginTop: spacing.md,
    paddingHorizontal: 18,
    paddingVertical: spacing.md,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  reviewsEmpty: {
    fontFamily: fonts.regular,
    fontSize: 13,
    color: KANKREG_PALETTE.inkFaint,
    marginBottom: spacing.sm,
  },
  reviewItem: {
    flexDirection: "row",
    gap: 10,
    padding: 12,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    marginBottom: 10,
  },
  reviewAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  reviewAvatarText: {
    fontFamily: fonts.bold,
    fontSize: 14,
    color: KANKREG_PALETTE.goldDeep,
  },
  reviewBody: { flex: 1, minWidth: 0 },
  reviewTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  reviewName: {
    fontFamily: fonts.semibold,
    fontSize: 13,
    flex: 1,
  },
  reviewPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: radius.pill,
    backgroundColor: "rgba(169,119,46,0.1)",
  },
  reviewPillText: {
    fontFamily: fonts.bold,
    fontSize: 11,
    color: KANKREG_PALETTE.goldDeep,
  },
  reviewComment: {
    fontFamily: fonts.regular,
    fontSize: 12,
    lineHeight: 18,
    marginTop: 4,
  },
  reviewComposer: {
    marginTop: spacing.sm,
    padding: 14,
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    gap: 10,
  },
  reviewStarsPick: {
    flexDirection: "row",
    gap: 6,
  },
  reviewInput: {
    fontFamily: fonts.regular,
    fontSize: 14,
    lineHeight: 20,
    minHeight: 72,
    textAlignVertical: "top",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
  },
  reviewError: {
    fontFamily: fonts.medium,
    fontSize: 12,
    color: KANKREG_PALETTE.danger,
  },
  reviewSuccess: {
    fontFamily: fonts.medium,
    fontSize: 12,
    color: KANKREG_PALETTE.green,
  },
  reviewSubmit: {
    borderRadius: 999,
    overflow: "hidden",
    alignSelf: "flex-start",
  },
  reviewSubmitGrad: {
    paddingHorizontal: 20,
    paddingVertical: 11,
    borderRadius: 999,
  },
  reviewSubmitText: {
    fontFamily: fonts.semibold,
    fontSize: 13,
    color: "#fff",
  },
  related: {
    paddingHorizontal: 18,
    marginTop: spacing.lg,
    paddingBottom: spacing.sm,
  },
  relatedRail: {
    gap: 12,
    paddingRight: 18,
  },
  relatedCard: {
    width: 172,
  },
});
