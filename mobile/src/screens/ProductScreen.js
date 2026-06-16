import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Platform, StyleSheet, View } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";
import KankregScrollPage from "../components/kankreg/KankregScrollPage";

import CustomerScreenShell from "../components/CustomerScreenShell";
import BottomNavBar from "../components/BottomNavBar";
import { getProductById, getProductReviews, getProducts, submitProductReview } from "../services/productService";
import useReducedMotion from "../hooks/useReducedMotion";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import {
  customerPanel,
  customerScrollFill,
  WEB_PRODUCT_STICKY_BAR_HEIGHT,
} from "../theme/screenLayout";
import { fonts, layout, lineHeight, radius, semanticRadius, spacing, typography } from "../theme/tokens";
import { platformShadow } from "../theme/shadowPlatform";
import { getImageUriCandidates, getProductHeroImageUri, prefetchProductGalleryImages } from "../utils/image";
import { matchesShelfProduct } from "../utils/shelfMatch";
import { productToCartLine } from "../utils/productCart";
import { ALCHEMY } from "../theme/customerAlchemy";
import { FONT_HEADING, FONT_BODY_SEMIBOLD } from "../theme/typographyRoles";
import { PRODUCT_SCREEN } from "../content/appContent";
import {
  getComingSoonNote,
  getShopCatalogProducts,
  isProductComingSoon,
  isProductOutOfStock,
  isProductPurchasable,
} from "../utils/productAvailability";
import PremiumEmptyState from "../components/ui/PremiumEmptyState";
import KankregBuyBar from "../components/kankreg/KankregBuyBar";
import WebProductView from "../components/kankreg/WebProductView";
import { ProductPageSkeleton } from "../components/loading";
import { useKankregLayout } from "../theme/kankregBreakpoints";
import NativeProductView from "../components/native/NativeProductView";

export default function ProductScreen({ route, navigation }) {
  const { productId } = route.params ?? {};
  const { colors: c, shadowPremium, isDark } = useTheme();
  const styles = useMemo(() => createProductStyles(c, shadowPremium, isDark), [c, shadowPremium, isDark]);
  const { addToCart, removeFromCart, getItemQuantity } = useCart();
  const { isAuthenticated, token } = useAuth();
  const { width, useProductSplit } = useKankregLayout();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedImage, setSelectedImage] = useState("");
  const [imageCandidateIndex, setImageCandidateIndex] = useState(0);
  const [selectedVariantLabel, setSelectedVariantLabel] = useState("");
  const [reviews, setReviews] = useState([]);
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewComment, setReviewComment] = useState("");
  const [reviewBusy, setReviewBusy] = useState(false);
  const [reviewSuccess, setReviewSuccess] = useState("");
  const [catalog, setCatalog] = useState([]);
  const reducedMotion = useReducedMotion();
  const heroFade = useSharedValue(1);

  const loadProduct = useCallback(
    async ({ fresh = false, silent = false } = {}) => {
      try {
        if (!silent) {
          setLoading(true);
          setError("");
        }
        let item = null;
        let resolvedId = productId;
        if (productId) {
          item = await getProductById(productId, { fresh });
        } else {
          const list = await getProducts().catch(() => []);
          item = Array.isArray(list) && list.length ? list[0] : null;
          resolvedId = item?.id;
        }
        if (!item) {
          setError(PRODUCT_SCREEN.loadErrorFallback);
          return;
        }
        setProduct(item);
        if (Platform.OS === "web" && resolvedId && typeof globalThis.sessionStorage !== "undefined") {
          globalThis.sessionStorage.setItem("kankreg:lastProductId", String(resolvedId));
        }
        try {
          const reviewPayload = await getProductReviews(resolvedId);
          setReviews(reviewPayload.reviews || []);
        } catch {
          setReviews([]);
        }
        setSelectedImage((current) => current || item?.image || "");
        const vars = Array.isArray(item?.variants) ? item.variants : [];
        setSelectedVariantLabel((current) => current || (vars[0]?.label ? String(vars[0].label) : ""));
      } catch (err) {
        setError(err.message || PRODUCT_SCREEN.loadErrorFallback);
      } finally {
        if (!silent) setLoading(false);
      }
    },
    [productId]
  );

  useEffect(() => {
    loadProduct({ fresh: true });
  }, [loadProduct]);

  useFocusEffect(
    useCallback(() => {
      if (!productId) return undefined;
      loadProduct({ fresh: true, silent: Boolean(product) });
      return undefined;
    }, [productId, loadProduct, product])
  );

  // Reveal motion now lives on `SectionReveal` blocks below; this effect was a bespoke
  // GSAP intro that is replaced by the unified motion primitives.

  /** Prefer `images[]`; always include primary `image` so gallery + hero URLs stay in sync. */
  const galleryImages = useMemo(() => {
    const imgs = Array.isArray(product?.images) ? product.images.map((u) => String(u || "").trim()).filter(Boolean) : [];
    const primary = product?.image ? String(product.image).trim() : "";
    if (primary && !imgs.includes(primary)) imgs.unshift(primary);
    return imgs;
  }, [product]);
  const selectedImageUris = useMemo(
    () => getImageUriCandidates(selectedImage || product?.image, { width: 840, quality: "auto:good" }),
    [selectedImage, product?.image]
  );
  const selectedImageUri =
    selectedImageUris[imageCandidateIndex] ||
    getProductHeroImageUri(selectedImage || product?.image) ||
    "";
  const imageFailed = selectedImageUris.length === 0 || imageCandidateIndex >= selectedImageUris.length;

  useEffect(() => {
    setImageCandidateIndex(0);
  }, [selectedImage, product?.image]);

  useEffect(() => {
    if (!galleryImages.length) return;
    prefetchProductGalleryImages(galleryImages, { heroCount: Math.min(3, galleryImages.length) });
  }, [galleryImages]);

  useEffect(() => {
    if (!product?.id) return;
    getProducts()
      .then((list) => setCatalog(Array.isArray(list) ? list : []))
      .catch(() => setCatalog([]));
  }, [product?.id]);

  useEffect(() => {
    if (reducedMotion) {
      heroFade.value = 1;
      return;
    }
    heroFade.value = 0.65;
    heroFade.value = withTiming(1, { duration: 260 });
  }, [selectedVariantLabel, selectedImage, reducedMotion, heroFade]);

  const heroFadeStyle = useAnimatedStyle(() => ({ opacity: heroFade.value }));

  const relatedProducts = useMemo(() => {
    if (!product?.id) return [];
    const cat = String(product.category || "").trim().toLowerCase();
    if (!cat) return [];
    return getShopCatalogProducts(catalog)
      .filter(
        (p) =>
          p.id !== product.id &&
          String(p.category || "").trim().toLowerCase() === cat
      )
      .slice(0, 4);
  }, [catalog, product]);

  const shelfMatch = useMemo(
    () => (product ? matchesShelfProduct(product) : false),
    [product]
  );

  const cartLine = useMemo(
    () => (product ? productToCartLine(product, selectedVariantLabel) : null),
    [product, selectedVariantLabel]
  );

  const heroImageHeight = useMemo(() => {
    if (Platform.OS === "web") {
      if (width >= 1080) return Math.min(420, Math.round(width * 0.34));
      if (width >= 768) return Math.min(360, Math.round(width * 0.42));
      return Math.min(300, Math.max(240, Math.round(width * 0.52)));
    }
    return Math.min(320, Math.max(220, Math.round(width * 0.55)));
  }, [width]);

  if (loading) {
    return (
      <CustomerScreenShell style={styles.screen}>
        <ProductPageSkeleton showBuyBar={Platform.OS !== "web"} />
        {Platform.OS === "web" ? <BottomNavBar /> : null}
      </CustomerScreenShell>
    );
  }

  if (!product) {
    return (
      <CustomerScreenShell style={styles.screen}>
        <View style={styles.centered}>
          <PremiumEmptyState
            iconName="alert-circle-outline"
            title={PRODUCT_SCREEN.notFoundTitle}
            description={error || PRODUCT_SCREEN.notFoundDescriptionFallback}
            ctaLabel={PRODUCT_SCREEN.backToHomeCta}
            ctaIconLeft="arrow-back-outline"
            onCtaPress={() => navigation.navigate("Home")}
          />
        </View>
      </CustomerScreenShell>
    );
  }

  const handleAddToCart = () => {
    if (!isProductPurchasable(product)) {
      return;
    }
    if (!isAuthenticated) {
      navigation.navigate("Login");
      return;
    }
    if (!cartLine) return;
    addToCart(cartLine);
  };

  const handleRemoveFromCart = () => {
    if (!isAuthenticated) {
      navigation.navigate("Login");
      return;
    }
    removeFromCart(product.id, cartLine?.variantLabel ?? "");
  };

  const quantity = getItemQuantity(product.id, cartLine?.variantLabel ?? "");
  const isComingSoon = isProductComingSoon(product);
  const isOutOfStock = isProductOutOfStock(product);
  const comingSoonNote = getComingSoonNote(product, PRODUCT_SCREEN.comingSoonNoteFallback);
  const displayPrice = cartLine ? cartLine.price : product.price;
  const variants = Array.isArray(product.variants) ? product.variants : [];
  const ratingAvg = Number(product.ratingAverage) || 0;
  const reviewCt = Number(product.reviewCount) || 0;
  const liveReviewCount = reviews.length > 0 ? reviews.length : reviewCt;
  const liveRatingAvg =
    reviews.length > 0
      ? reviews.reduce((acc, r) => acc + Number(r.rating || 0), 0) / Math.max(1, reviews.length)
      : ratingAvg;
  const reviewCountDisplay = Math.max(liveReviewCount, (reviews || []).length);
  const mrp = product.mrp != null ? Number(product.mrp) : null;
  const showMrp = mrp != null && mrp > displayPrice;
  const offPct =
    showMrp && mrp > 0 ? Math.max(0, Math.round((1 - Number(displayPrice) / mrp) * 100)) : null;
  /** Stacked product layout — matches HTML `.mbar` (always visible below 980px). */
  const stickyBarVisible = isProductPurchasable(product) && !useProductSplit;
  const stickyFooterExtra = stickyBarVisible ? WEB_PRODUCT_STICKY_BAR_HEIGHT : 0;

  const handleSubmitReview = async () => {
    if (!isAuthenticated) {
      navigation.navigate("Login");
      return;
    }
    if (!token) return;
    if (reviewRating < 1 || reviewRating > 5) {
      setError(PRODUCT_SCREEN.reviewRatingError);
      return;
    }
    try {
      setReviewBusy(true);
      setError("");
      setReviewSuccess("");
      const payload = await submitProductReview(token, product.id, {
        rating: reviewRating,
        comment: reviewComment});
      setReviews(payload.reviews || []);
      setReviewComment("");
      setReviewRating(0);
      setReviewSuccess(PRODUCT_SCREEN.reviewSubmitSuccess);
      setProduct((current) =>
        current
          ? {
              ...current,
              ratingAverage: payload.ratingAverage,
              reviewCount: payload.reviewCount}
          : current
      );
    } catch (err) {
      setError(err.message || PRODUCT_SCREEN.reviewSubmitErrorFallback);
    } finally {
      setReviewBusy(false);
    }
  };

  if (Platform.OS !== "web") {
    return (
      <CustomerScreenShell style={styles.screen}>
        <NativeProductView
          product={product}
          navigation={navigation}
          heroImageUri={selectedImageUri}
          imageFailed={imageFailed}
          galleryImages={galleryImages}
          selectedImage={selectedImage}
          onSelectImage={setSelectedImage}
          variants={variants}
          selectedVariantLabel={selectedVariantLabel}
          onSelectVariant={setSelectedVariantLabel}
          displayPrice={displayPrice}
          showMrp={showMrp}
          mrp={mrp}
          offPct={offPct}
          liveRatingAvg={liveRatingAvg}
          reviewCountDisplay={reviewCountDisplay}
          isOutOfStock={isOutOfStock}
          isComingSoon={isComingSoon}
          comingSoonNote={comingSoonNote}
          quantity={quantity}
          onAddToCart={handleAddToCart}
          onRemoveFromCart={handleRemoveFromCart}
          onBuyNow={() => {
            handleAddToCart();
            if (isAuthenticated) navigation.navigate("Checkout");
            else navigation.navigate("Login");
          }}
          relatedProducts={relatedProducts}
          onRelatedPress={(p) => navigation.push("Product", { productId: p.id })}
          onAddRelated={(p) => {
            if (!isAuthenticated) {
              navigation.navigate("Login");
              return;
            }
            addToCart(productToCartLine(p, ""));
          }}
          reviews={reviews}
          reviewRating={reviewRating}
          onReviewRatingChange={setReviewRating}
          reviewComment={reviewComment}
          onReviewCommentChange={setReviewComment}
          reviewBusy={reviewBusy}
          reviewSuccess={reviewSuccess}
          reviewError={error}
          onSubmitReview={handleSubmitReview}
          isAuthenticated={isAuthenticated}
          shelfMatch={shelfMatch}
        />
      </CustomerScreenShell>
    );
  }

  return (
    <CustomerScreenShell style={styles.screen}>
      <KankregScrollPage
        scrollVariant="inner"
        style={customerScrollFill}
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={16}
        stickyFooterExtra={stickyFooterExtra}
      >
        <WebProductView
          product={product}
          navigation={navigation}
          heroImageUri={selectedImageUri}
          imageFailed={imageFailed}
          onHeroImageError={() => setImageCandidateIndex((index) => index + 1)}
          galleryImages={galleryImages}
          selectedImage={selectedImage}
          onSelectImage={setSelectedImage}
          heroFadeStyle={heroFadeStyle}
          heroImageHeight={heroImageHeight}
          variants={variants}
          selectedVariantLabel={selectedVariantLabel}
          onSelectVariant={setSelectedVariantLabel}
          displayPrice={displayPrice}
          showMrp={showMrp}
          mrp={mrp}
          offPct={offPct}
          liveRatingAvg={liveRatingAvg}
          reviewCountDisplay={reviewCountDisplay}
          isOutOfStock={isOutOfStock}
          isComingSoon={isComingSoon}
          comingSoonNote={comingSoonNote}
          quantity={quantity}
          onAddToCart={handleAddToCart}
          onRemoveFromCart={handleRemoveFromCart}
          onBuyNow={() => {
            handleAddToCart();
            if (isAuthenticated) navigation.navigate("Checkout");
            else navigation.navigate("Login");
          }}
          stickyBarVisible={stickyBarVisible}
          relatedProducts={relatedProducts}
          getItemQuantity={getItemQuantity}
          onAddRelated={(item) => {
            if (!isAuthenticated) {
              navigation.navigate("Login");
              return;
            }
            addToCart(productToCartLine(item));
          }}
          onRemoveRelated={removeFromCart}
          reviews={reviews}
          reviewRating={reviewRating}
          onReviewRatingChange={setReviewRating}
          reviewComment={reviewComment}
          onReviewCommentChange={setReviewComment}
          reviewBusy={reviewBusy}
          reviewSuccess={reviewSuccess}
          reviewError={error}
          onSubmitReview={handleSubmitReview}
          isAuthenticated={isAuthenticated}
          shelfMatch={shelfMatch}
        />
</KankregScrollPage>
      <KankregBuyBar
        visible={stickyBarVisible}
        productName={product.name}
        price={displayPrice}
        quantity={quantity}
        onAddToCart={handleAddToCart}
        onRemoveFromCart={handleRemoveFromCart}
        onBuyNow={() => {
          handleAddToCart();
          if (isAuthenticated) navigation.navigate("Checkout");
          else navigation.navigate("Login");
        }}
      />
      <BottomNavBar />
    </CustomerScreenShell>
  );
}

function createProductStyles(c, shadowPremium, isDark) {
  const panelLift = platformShadow({
    web: {
      boxShadow: isDark
        ? "0 14px 44px rgba(0,0,0,0.34), inset 0 1px 0 rgba(255,255,255,0.05)"
        : "0 12px 36px rgba(22, 69, 51, 0.07), 0 4px 14px rgba(28, 25, 23, 0.04), inset 0 1px 0 rgba(255,253,251,0.92)"},
    ios: {
      shadowColor: "#3D2A12",
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: isDark ? 0.28 : 0.08,
      shadowRadius: 22},
    android: { elevation: isDark ? 6 : 5 }});

  const moduleShadow = platformShadow({
    web: {
      boxShadow: isDark
        ? "0 10px 28px rgba(0,0,0,0.22)"
        : "0 6px 18px rgba(28, 25, 23, 0.06), 0 1px 4px rgba(28, 25, 23, 0.035)"},
    ios: {
      shadowColor: "#3D2A12",
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: isDark ? 0.18 : 0.06,
      shadowRadius: 10},
    android: { elevation: isDark ? 2 : 1 }});

  return StyleSheet.create({
  breadcrumb: {
    fontSize: 13,
    color: c.textMuted,
    marginBottom: spacing.lg,
    fontFamily: fonts.medium},
  screen: {
    flex: 1,
    width: "100%",
    alignSelf: "center",
    maxWidth: Platform.select({ web: layout.maxContentWidth + 96, default: "100%" })},
  container: {
    ...customerPanel(c, shadowPremium, isDark),
    overflow: "hidden",
    padding: 0,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: isDark ? "rgba(52, 211, 153, 0.35)" : "rgba(31, 92, 71, 0.42)",
    ...panelLift},
  /** Accent top edge when product matches home shelf (e.g. Ghee). */
  containerShelfMatch: {
    borderTopColor: c.secondary},
  heroImageStage: {
    width: "100%",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: isDark ? "#1C1917" : ALCHEMY.creamAlt,
    position: "relative",
    ...Platform.select({
      web: {
        minHeight: 360},
      default: {}})},
  heroVignette: {
    ...StyleSheet.absoluteFillObject},
  heroImageAnim: {
    width: "100%",
    height: "100%",
  },
  heroImage: {
    width: "100%",
    height: "100%",
    backgroundColor: "transparent"},
  imageFallback: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: isDark ? "#1C1917" : ALCHEMY.creamAlt,
    alignItems: "center",
    justifyContent: "center",
    gap: 8},
  imageFallbackText: {
    color: c.textSecondary,
    fontSize: typography.bodySmall,
    fontFamily: fonts.semibold},
  pdColLeft: {
    flex: 1,
    minWidth: 280,
    maxWidth: Platform.OS === "web" ? "52%" : "100%",
  },
  pdColRight: {
    flex: 1,
    minWidth: 280,
    maxWidth: Platform.OS === "web" ? "48%" : "100%",
  },
  heroWrap: {
    position: "relative",
    borderBottomLeftRadius: radius.xxl,
    borderBottomRightRadius: radius.xxl,
    overflow: "hidden",
    ...Platform.select({
      web: {
        isolation: "isolate"},
      default: {}})},
  heroTopSpacer: {
    flex: 1},
  backFab: {
    position: "absolute",
    left: spacing.sm,
    zIndex: 4,
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: isDark ? c.surfaceMuted : "rgba(255,255,255,0.94)",
    borderWidth: 1,
    borderColor: c.border,
    ...platformShadow({
      web: { boxShadow: "0 4px 12px rgba(0,0,0,0.08)" },
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.12,
        shadowRadius: 6,
      },
      android: { elevation: 3 },
    })},
  heroTopRow: {
    position: "absolute",
    top: spacing.sm,
    left: 52,
    right: spacing.sm,
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
    gap: spacing.xs,
    zIndex: 3},
  heroChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: radius.pill,
    backgroundColor: isDark ? "rgba(32, 28, 24, 0.88)" : "rgba(255,255,255,0.92)",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: isDark ? "rgba(255,255,255,0.12)" : "rgba(255,255,255,0.95)",
    ...Platform.select({
      web: {
        backdropFilter: "blur(10px)",
        WebkitBackdropFilter: "blur(10px)"},
      default: {}})},
  heroChipText: {
    color: c.textPrimary,
    fontSize: typography.caption,
    fontFamily: fonts.bold},
  stockChipSuccess: {
    backgroundColor: isDark ? "rgba(22, 163, 74, 0.18)" : "rgba(236,253,245,0.94)",
    borderColor: isDark ? "rgba(74, 222, 128, 0.35)" : "rgba(187,247,208,0.95)"},
  stockChipDanger: {
    backgroundColor: isDark ? "rgba(220, 38, 38, 0.2)" : "rgba(254,242,242,0.94)",
    borderColor: isDark ? "rgba(252, 165, 165, 0.45)" : "rgba(254,202,202,0.95)"},
  stockTextSuccess: {
    color: c.success},
  stockTextDanger: {
    color: c.danger},
  galleryStrip: {
    marginTop: -8,
    marginHorizontal: spacing.sm,
    paddingBottom: spacing.sm,
    paddingHorizontal: spacing.xs,
    zIndex: 2,
    borderRadius: radius.xl,
    backgroundColor: isDark ? "rgba(28, 25, 23, 0.72)" : "rgba(255, 253, 248, 0.88)",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: isDark ? "rgba(255,255,255,0.08)" : "rgba(22, 69, 51, 0.12)",
    ...Platform.select({
      web: {
        maxWidth: "100%",
        alignSelf: "center",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)"},
      default: {}})},
  galleryRow: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xs,
    gap: spacing.sm,
    alignItems: "center"},
  thumbWrap: {
    width: 68,
    height: 68,
    borderRadius: radius.lg + 2,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: isDark ? c.border : "rgba(22, 69, 51, 0.22)",
    overflow: "hidden",
    backgroundColor: isDark ? c.surfaceMuted : ALCHEMY.creamAlt},
  thumbWrapActive: {
    borderColor: ALCHEMY.gold,
    borderWidth: 3,
    ...platformShadow({
      web: { boxShadow: "0 4px 12px rgba(31, 92, 71, 0.28)" },
      ios: {
        shadowColor: ALCHEMY.gold,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.35,
        shadowRadius: 5},
      android: { elevation: 3 }})},
  thumbImage: {
    width: "100%",
    height: "100%"},
  thumbImageFallback: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: c.surfaceMuted},
  contentSheetAccent: {
    height: 3,
    width: "100%",
    opacity: 0.9},
  contentSheet: {
    marginTop: -20,
    paddingTop: 0,
    paddingHorizontal: spacing.sm,
    paddingBottom: spacing.xs,
    backgroundColor: isDark ? c.surface : ALCHEMY.pearl,
    borderTopLeftRadius: radius.xxl,
    borderTopRightRadius: radius.xxl,
    ...platformShadow({
      web: {
        boxShadow: isDark
          ? "0 -12px 40px rgba(0,0,0,0.35)"
          : "0 -10px 36px rgba(22, 69, 51, 0.06), 0 -2px 12px rgba(28, 25, 23, 0.04)"},
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: isDark ? 0.35 : 0.06,
        shadowRadius: 14},
      android: { elevation: 0 }}),
    ...Platform.select({
      web: {
        borderTopLeftRadius: radius.xxl,
        borderTopRightRadius: radius.xxl},
      default: {}})},
  content: {
    paddingHorizontal: spacing.md + 2,
    paddingTop: spacing.md + 4,
    paddingBottom: spacing.lg,
    ...Platform.select({
      web: {
        paddingHorizontal: spacing.lg + 6},
      default: {}})},
  contentMax: {
    width: "100%",
    ...Platform.select({
      web: {
        maxWidth: 960,
        alignSelf: "center"},
      default: {}})},
  titleBlock: {
    marginBottom: spacing.xs},
  heroMetaRow: {
    marginTop: spacing.xs,
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: spacing.xs},
  heroMetaPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: spacing.sm,
    paddingVertical: 5,
    borderRadius: radius.pill,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: isDark ? c.border : ALCHEMY.pillInactive,
    backgroundColor: isDark ? c.surfaceMuted : ALCHEMY.creamAlt},
  heroMetaRatingPill: {
    borderColor: isDark ? c.primaryBorder : "rgba(31, 92, 71, 0.3)",
    backgroundColor: isDark ? "rgba(31, 92, 71, 0.12)" : ALCHEMY.goldSoft},
  heroMetaPillOk: {
    borderColor: isDark ? c.secondaryBorder : "rgba(16, 185, 129, 0.28)",
    backgroundColor: isDark ? c.secondarySoft : "rgba(236, 253, 245, 0.9)"},
  heroMetaPillDanger: {
    borderColor: isDark ? c.danger : "rgba(239, 68, 68, 0.35)",
    backgroundColor: isDark ? "rgba(239, 68, 68, 0.18)" : "rgba(254, 242, 242, 0.92)"},
  heroMetaPillText: {
    fontSize: typography.caption,
    fontFamily: fonts.semibold,
    color: c.textSecondary},
  heroMetaPillTextOk: {
    color: c.success,
    fontFamily: fonts.bold},
  heroMetaPillTextDanger: {
    color: c.danger,
    fontFamily: fonts.bold},
  name: {
    fontSize: typography.h1,
    lineHeight: lineHeight.h1,
    fontFamily: FONT_HEADING,
    color: c.textPrimary,
    letterSpacing: Platform.OS === "web" ? -0.55 : -0.42,
    marginTop: 2},
  categoryText: {
    fontSize: typography.overline + 1,
    fontFamily: fonts.extrabold,
    color: isDark ? ALCHEMY.goldBright : ALCHEMY.brown,
    marginBottom: spacing.xs,
    textTransform: "uppercase",
    letterSpacing: 1.4},
  priceBand: {
    marginTop: spacing.md,
    borderRadius: radius.xl + 2,
    padding: spacing.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderTopWidth: 2},
  priceBandLight: {
    backgroundColor: isDark ? c.surfaceMuted : "rgba(255, 253, 249, 0.96)",
    borderColor: isDark ? c.border : ALCHEMY.pillInactive,
    borderLeftWidth: 3,
    borderLeftColor: ALCHEMY.gold,
    borderTopColor: "rgba(31, 92, 71, 0.6)"},
  priceBandDark: {
    backgroundColor: "rgba(255,255,255,0.04)",
    borderColor: c.border,
    borderLeftWidth: 3,
    borderLeftColor: "rgba(52, 211, 153, 0.65)",
    borderTopColor: "rgba(52, 211, 153, 0.38)"},
  priceBlock: {
    marginTop: 0,
    gap: spacing.sm},
  priceRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    flexWrap: "wrap",
    gap: 8},
  saveChip: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: radius.pill,
    borderWidth: StyleSheet.hairlineWidth,
    backgroundColor: isDark ? "rgba(22, 163, 74, 0.12)" : "rgba(236, 253, 245, 0.85)"},
  saveChipText: {
    fontSize: typography.caption,
    fontFamily: fonts.extrabold,
    letterSpacing: 0.25},
  price: {
    fontSize: typography.h2 + 2,
    fontFamily: fonts.extrabold,
    color: c.textPrimary,
    letterSpacing: -0.35},
  unitText: {
    fontSize: typography.bodySmall,
    fontFamily: fonts.regular,
    color: c.textSecondary,
    marginBottom: 3},
  storyCard: {
    marginTop: spacing.lg,
    borderRadius: semanticRadius.card},
  descriptionBelowHeader: {
    marginTop: spacing.sm},
  description: {
    marginBottom: 0,
    fontSize: typography.body,
    fontFamily: fonts.regular,
    color: c.textSecondary,
    lineHeight: 22},
  variantPillsBelowHeader: {
    marginTop: spacing.sm},
  quickFactsWrap: {
    marginTop: spacing.lg,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.xs},
  quickFactPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    maxWidth: "100%",
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: spacing.sm - 1,
    borderRadius: radius.pill,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: isDark ? c.border : ALCHEMY.pillInactive,
    backgroundColor: isDark ? c.surfaceMuted : ALCHEMY.creamAlt},
  quickFactText: {
    fontSize: typography.caption,
    fontFamily: fonts.semibold,
    color: c.textSecondary,
    flexShrink: 1},
  heroBadge: {
    position: "absolute",
    right: spacing.sm,
    bottom: spacing.sm,
    maxWidth: "46%",
    backgroundColor: ALCHEMY.brownMuted,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.md,
    zIndex: 3,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255,252,248,0.25)",
    ...Platform.select({
      web: { boxShadow: "0 8px 20px rgba(45, 29, 11, 0.35)" },
      default: {}})},
  heroBadgeText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontFamily: fonts.extrabold,
    letterSpacing: 0.6},
  mrpStrike: {
    fontSize: typography.body,
    fontFamily: fonts.semibold,
    color: c.textMuted,
    textDecorationLine: "line-through",
    marginBottom: 3},
  variantBlock: {
    marginTop: spacing.lg},
  variantPills: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm},
  stickyCtaShell: {
    position: "absolute",
    left: 0,
    right: 0,
    zIndex: 20,
    ...Platform.select({
      web: {
        alignItems: "center"},
      default: {}})},
  stickyPriceCol: {
    flex: 1,
    minWidth: 0},
  stickyCtaCol: {
    flexShrink: 0,
    minWidth: 160},
  stickyPriceLabel: {
    fontSize: 11,
    fontFamily: fonts.bold,
    textTransform: "uppercase",
    letterSpacing: 0.8},
  stickyPrice: {
    fontSize: typography.h2,
    fontFamily: fonts.bold,
    fontVariant: ["tabular-nums"]},
  stepper: {
    marginTop: spacing.md,
    backgroundColor: isDark ? c.primaryDark : ALCHEMY.brown,
    borderRadius: semanticRadius.full,
    minHeight: 54,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.sm + 2,
    ...Platform.select({
      web: {
        boxShadow: isDark
          ? "0 10px 24px rgba(0,0,0,0.35)"
          : "0 10px 22px rgba(22, 69, 51, 0.22)"},
      ios: {
        shadowColor: "#3D2A12",
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.22,
        shadowRadius: 10},
      android: { elevation: 4 }})},
  stepButton: {
    width: 40,
    alignItems: "center",
    justifyContent: "center"},
  stepCount: {
    color: c.onPrimary,
    fontSize: typography.bodySmall,
    fontFamily: fonts.bold,
    letterSpacing: 0.2},
  reviewCard: {
    marginTop: spacing.md + 2,
    borderRadius: radius.xl + 4,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: isDark ? c.border : ALCHEMY.pillInactive,
    borderLeftWidth: 3,
    borderLeftColor: isDark ? "rgba(52, 211, 153, 0.55)" : ALCHEMY.gold,
    backgroundColor: isDark ? c.surfaceMuted : "rgba(255, 253, 249, 0.92)",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md + 2,
    ...moduleShadow},
  reviewBannerWrap: {
    marginBottom: spacing.sm},
  reviewComposer: {
    borderRadius: radius.lg + 2,
    padding: spacing.md - 2,
    borderWidth: StyleSheet.hairlineWidth,
    marginBottom: spacing.sm},
  reviewComposerLight: {
    backgroundColor: isDark ? c.surface : "#FFFFFF",
    borderColor: isDark ? c.border : "rgba(22, 69, 51, 0.1)"},
  reviewComposerDark: {
    backgroundColor: "rgba(0,0,0,0.12)",
    borderColor: c.border},
  reviewStarsPickRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.sm,
    paddingHorizontal: spacing.xs},
  reviewStarHit: {
    padding: 4,
    borderRadius: radius.md},
  reviewStarHitActive: {
    backgroundColor: isDark ? "rgba(31, 92, 71, 0.12)" : ALCHEMY.goldSoft},
  reviewInputWrap: {
    marginBottom: spacing.sm},
  reviewSubmitBtn: {
    alignSelf: "flex-end"},
  reviewListLabel: {
    fontSize: typography.overline,
    fontFamily: fonts.extrabold,
    letterSpacing: 1,
    color: c.textMuted,
    textTransform: "uppercase",
    marginTop: spacing.sm,
    marginBottom: spacing.sm},
  reviewList: {
    marginTop: spacing.sm,
    gap: spacing.sm},
  reviewItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.lg,
    backgroundColor: isDark ? "rgba(255,255,255,0.04)" : "rgba(255,255,255,0.75)",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: isDark ? c.border : "rgba(22, 69, 51, 0.08)"},
  reviewAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center"},
  reviewAvatarText: {
    fontSize: typography.bodySmall,
    fontFamily: FONT_BODY_SEMIBOLD},
  reviewItemBody: {
    flex: 1,
    minWidth: 0},
  reviewItemTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.sm,
    marginBottom: 4},
  reviewUser: {
    flex: 1,
    color: c.textPrimary,
    fontSize: typography.bodySmall,
    fontFamily: fonts.bold},
  reviewRatingPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.pill,
    backgroundColor: isDark ? "rgba(31, 92, 71, 0.12)" : ALCHEMY.goldSoft,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: isDark ? c.primaryBorder : ALCHEMY.pillInactive},
  reviewRatingPillText: {
    fontSize: typography.overline + 1,
    fontFamily: fonts.extrabold,
    color: c.textPrimary},
  reviewComment: {
    color: c.textSecondary,
    fontSize: typography.caption,
    lineHeight: 19,
    fontFamily: fonts.regular},
  reviewNoComment: {
    fontSize: typography.overline + 1,
    fontFamily: fonts.medium,
    color: c.textMuted,
    fontStyle: "italic"},
  reviewEmptyHint: {
    marginTop: spacing.sm,
    fontSize: typography.caption,
    fontFamily: fonts.medium,
    color: c.textMuted,
    textAlign: "center"},
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.xl},
  loadingHint: {
    marginTop: spacing.sm,
    fontSize: typography.bodySmall,
    fontFamily: fonts.semibold,
    color: c.textSecondary},
  missingText: {
    marginTop: spacing.md,
    fontSize: typography.body,
    fontFamily: fonts.semibold,
    color: c.textSecondary,
    textAlign: "center"}});
}
