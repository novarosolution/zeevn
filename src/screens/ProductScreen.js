import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import AppFooter from "../components/AppFooter";
import BottomNavBar from "../components/BottomNavBar";
import MotionScrollView from "../components/motion/MotionScrollView";
import ProductGallery from "../components/product/ProductGallery";
import GalleryScrollFab from "../components/product/GalleryScrollFab";
import MobileStickyDock from "../components/product/MobileStickyDock";
import ProductPurchaseColumn from "../components/product/ProductPurchaseColumn";
import ProductReviews from "../components/product/ProductReviews";
import ProductRichDetails, { hasRichProductContent } from "../components/product/ProductRichDetails";
import ProductCard from "../components/ProductCard";
import Card from "../components/ui/Card";
import EmptyState from "../components/ui/EmptyState";
import Screen from "../components/ui/Screen";
import SectionHeader from "../components/ui/SectionHeader";
import SkeletonBlock from "../components/ui/SkeletonBlock";
import Toast from "../components/ui/Toast";
import { getProductById, getProductReviews, getProducts } from "../services/productService";
import { useCart } from "../context/CartContext";
import { hapticImpactLight, hapticSuccess } from "../utils/haptics";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import {
  CUSTOMER_BOTTOM_NAV_BAR_HEIGHT,
  customerFloatingNavOffset,
  customerInnerPageScrollContent,
  customerScrollPaddingBottom,
  customerScrollPaddingTop,
  customerWebStickyTop,
} from "../theme/screenLayout";
import { fonts, icon as sz } from "../theme/tokens";
import { formatINR } from "../utils/currency";
import { getImageUriCandidates } from "../utils/image";
import { matchesShelfProduct } from "../utils/shelfMatch";
import { productToCartLine } from "../utils/productCart";
import { APP_LOADING_UI, PRODUCT_SCREEN, fillProductScreen } from "../content/appContent";
import useReducedMotion from "../hooks/useReducedMotion";
import useRouteMeta from "../hooks/useRouteMeta";
import { buildProductRouteMetaOverrides } from "../utils/productMeta";
import LiveRegion from "../components/a11y/LiveRegion";
import { injectProductPrintStyles } from "../styles/productPrint.web";
import { navigateToLogin } from "../components/auth/authNavigation";

const RECENT_PRODUCT_IDS_KEY = "@zeevan_recent_product_ids";
const RECENT_PRODUCT_VIEWS_KEY = "@zeevan_recent_product_views";
const VIEWED_RECENTLY_MS = 7 * 24 * 60 * 60 * 1000;
const DOCK_HEIGHT_ESTIMATE = 64;
const FLY_MS = 480;
const FLY_EASE = Easing.bezier(0.4, 0, 0.2, 1);

export default function ProductScreen({ route, navigation }) {
  const { productId } = route.params ?? {};
  const loginReturnTo = useMemo(
    () => (productId ? { name: "Product", params: { productId } } : undefined),
    [productId]
  );
  const goLogin = useCallback(() => {
    navigateToLogin(navigation, { returnTo: loginReturnTo });
  }, [loginReturnTo, navigation]);
  const { semanticPalette, TYPE, SPACING, RADII, SHADOWS } = useTheme();
  const insets = useSafeAreaInsets();
  const reducedMotion = useReducedMotion();
  const { width, height: windowHeight } = useWindowDimensions();
  const isTwoColumn = width >= 768;
  const { addToCart, removeFromCart, getItemQuantity, bumpCartBadge } = useCart();
  const { isAuthenticated, token } = useAuth();

  const [product, setProduct] = useState(null);
  const [catalog, setCatalog] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedImage, setSelectedImage] = useState("");
  const [imageCandidateIndex, setImageCandidateIndex] = useState(0);
  const [selectedVariantLabel, setSelectedVariantLabel] = useState("");
  const [showStickyCta, setShowStickyCta] = useState(false);
  const [showGalleryFab, setShowGalleryFab] = useState(false);
  const [viewedRecently, setViewedRecently] = useState(false);
  const [bagToastVisible, setBagToastVisible] = useState(false);
  const [wishlistToastVisible, setWishlistToastVisible] = useState(false);
  const [purchaseElevated, setPurchaseElevated] = useState(false);
  const [reviews, setReviews] = useState([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const reviewsFetchedRef = useRef(false);
  const [recentIds, setRecentIds] = useState([]);
  const [accordionOpen, setAccordionOpen] = useState(() => ({ description: true, material: false, shipping: false, faq: false }));
  const [reviewsFlash, setReviewsFlash] = useState(false);
  const [flyGhost, setFlyGhost] = useState(null);
  const [bagLiveMessage, setBagLiveMessage] = useState("");

  const mainCtaRef = useRef(null);
  const scrollRef = useRef(null);
  const reviewsScrollY = useRef(0);
  const scrollYRef = useRef(0);
  const galleryWrapRef = useRef(null);
  const richContentAnchorRef = useRef(null);
  const reviewsSectionRef = useRef(null);
  const scrollRaf = useRef(null);
  const flyX = useSharedValue(0);
  const flyY = useSharedValue(0);
  const flyScale = useSharedValue(1);
  const flyOpacity = useSharedValue(0);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await getProducts();
        if (!cancelled) setCatalog(Array.isArray(data) ? data : []);
      } catch {
        if (!cancelled) setCatalog([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    async function loadProduct() {
      try {
        setLoading(true);
        setError("");
        reviewsFetchedRef.current = false;
        setReviews([]);
        setReviewsLoading(false);
        const item = await getProductById(productId);
        setProduct(item);
        setSelectedImage(item?.image || "");
        const vars = Array.isArray(item?.variants) ? item.variants : [];
        setSelectedVariantLabel(vars[0]?.label ? String(vars[0].label) : "");
      } catch (err) {
        setError(err.message || PRODUCT_SCREEN.loadErrorFallback);
      } finally {
        setLoading(false);
      }
    }
    loadProduct();
  }, [productId]);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const rawIds = await AsyncStorage.getItem(RECENT_PRODUCT_IDS_KEY);
        let ids = rawIds ? JSON.parse(rawIds) : [];
        if (!Array.isArray(ids)) ids = [];
        ids = ids.filter((x) => String(x) !== String(productId));
        ids.unshift(productId);
        ids = ids.slice(0, 16);
        await AsyncStorage.setItem(RECENT_PRODUCT_IDS_KEY, JSON.stringify(ids));

        const rawViews = await AsyncStorage.getItem(RECENT_PRODUCT_VIEWS_KEY);
        let views = rawViews ? JSON.parse(rawViews) : [];
        if (!Array.isArray(views)) views = [];
        const prior = views.find((v) => String(v?.id) === String(productId));
        const hadRecentView =
          prior?.at && Number.isFinite(Number(prior.at)) && Date.now() - Number(prior.at) < VIEWED_RECENTLY_MS;
        views = views.filter((v) => String(v?.id) !== String(productId));
        views.unshift({ id: productId, at: Date.now() });
        views = views.slice(0, 32);
        await AsyncStorage.setItem(RECENT_PRODUCT_VIEWS_KEY, JSON.stringify(views));

        if (!alive) return;
        setViewedRecently(Boolean(hadRecentView));
        setRecentIds(ids.filter((id) => String(id) !== String(productId)));
      } catch {
        if (alive) {
          setRecentIds([]);
          setViewedRecently(false);
        }
      }
    })();
    return () => {
      alive = false;
    };
  }, [productId]);

  const galleryImages = useMemo(() => {
    const imgs = Array.isArray(product?.images) ? product.images.map((u) => String(u || "").trim()).filter(Boolean) : [];
    const primary = product?.image ? String(product.image).trim() : "";
    if (primary && !imgs.includes(primary)) imgs.unshift(primary);
    return imgs;
  }, [product]);

  const selectedImageUris = useMemo(() => getImageUriCandidates(selectedImage || product?.image), [selectedImage, product?.image]);
  const selectedImageUri = selectedImageUris[imageCandidateIndex] || "";

  useEffect(() => {
    setImageCandidateIndex(0);
  }, [selectedImage, product?.image]);

  const shelfMatch = useMemo(() => (product ? matchesShelfProduct(product) : false), [product]);

  const cartLine = useMemo(() => (product ? productToCartLine(product, selectedVariantLabel) : null), [product, selectedVariantLabel]);

  const loadReviewsDeferred = useCallback(async () => {
    if (reviewsFetchedRef.current || !productId) return;
    reviewsFetchedRef.current = true;
    setReviewsLoading(true);
    try {
      const reviewPayload = await getProductReviews(productId);
      setReviews(reviewPayload.reviews || []);
      setProduct((current) =>
        current
          ? {
              ...current,
              ratingAverage: reviewPayload.ratingAverage,
              reviewCount: reviewPayload.reviewCount,
            }
          : current
      );
    } catch {
      setReviews([]);
    } finally {
      setReviewsLoading(false);
    }
  }, [productId]);

  useEffect(() => {
    if (!product?.id) return undefined;
    const timer = setTimeout(() => {
      loadReviewsDeferred();
    }, 1500);
    return () => clearTimeout(timer);
  }, [loadReviewsDeferred, product?.id]);

  const productMetaOverrides = useMemo(
    () =>
      buildProductRouteMetaOverrides({
        product,
        productId,
        selectedVariantLabel,
        cartLine,
        reviews,
      }),
    [cartLine, product, productId, reviews, selectedVariantLabel]
  );

  useRouteMeta("product", productMetaOverrides);

  const completeLookItems = useMemo(() => {
    if (!product) return [];
    const cat = String(product.category || "").trim().toLowerCase();
    return catalog
      .filter((p) => p && String(p.id) !== String(product.id) && String(p.category || "").trim().toLowerCase() === cat)
      .slice(0, 4);
  }, [catalog, product]);

  const youMayAlsoLikeItems = useMemo(() => {
    if (!product) return [];
    const block = new Set(completeLookItems.map((p) => String(p.id)));
    block.add(String(product.id));
    return catalog.filter((p) => p && !block.has(String(p.id))).slice(0, 8);
  }, [catalog, completeLookItems, product]);

  const recentlyViewedProducts = useMemo(() => {
    const map = new Map(catalog.map((p) => [String(p.id), p]));
    return recentIds.map((id) => map.get(String(id))).filter(Boolean).slice(0, 8);
  }, [catalog, recentIds]);

  const checkStickyDock = useCallback(
    (scrollY = scrollYRef.current) => {
      if (width >= 768) {
        setShowStickyCta(false);
        setShowGalleryFab(false);
        return;
      }
      const atTop = scrollY < 32;

      const finishDock = (pastGallery, railsVisible, pastRich) => {
        setShowGalleryFab(!atTop && pastRich);
        mainCtaRef.current?.measureInWindow((_, y, __, h) => {
          const ctaOffScreen = y + h < 88;
          setShowStickyCta(!atTop && pastGallery && ctaOffScreen && !railsVisible);
        });
      };

      galleryWrapRef.current?.measureInWindow((_, galleryY, __, galleryH) => {
        const pastGallery = galleryY + galleryH < 72;
        reviewsSectionRef.current?.measureInWindow((_, reviewsY) => {
          const railsVisible = reviewsY < windowHeight - 100;
          richContentAnchorRef.current?.measureInWindow((_, anchorY) => {
            const pastRich = anchorY < windowHeight - 64;
            finishDock(pastGallery, railsVisible, pastRich);
          });
        });
      });
    },
    [width, windowHeight]
  );

  const onScrollJS = useCallback(
    (scrollY = 0) => {
      scrollYRef.current = scrollY;
      if (isTwoColumn) setPurchaseElevated(scrollY > 48);
      if (bagToastVisible) setBagToastVisible(false);
      reviewsSectionRef.current?.measureInWindow((_, reviewsY) => {
        if (reviewsY < windowHeight + 240) {
          loadReviewsDeferred();
        }
      });
      if (scrollRaf.current != null) return;
      scrollRaf.current = requestAnimationFrame(() => {
        scrollRaf.current = null;
        checkStickyDock(scrollY);
      });
    },
    [bagToastVisible, checkStickyDock, isTwoColumn, loadReviewsDeferred, windowHeight]
  );

  useEffect(() => {
    const t = setTimeout(() => checkStickyDock(scrollYRef.current), 120);
    return () => clearTimeout(t);
  }, [checkStickyDock, product?.id, isTwoColumn]);

  useEffect(() => {
    if (Platform.OS !== "web") return undefined;
    return injectProductPrintStyles();
  }, []);

  const flyGhostStyle = useAnimatedStyle(() => ({
    opacity: flyOpacity.value,
    transform: [{ translateX: flyX.value }, { translateY: flyY.value }, { scale: flyScale.value }],
  }));

  const purchaseStickyStyle = useMemo(
    () =>
      Platform.select({
        web: isTwoColumn
          ? {
              position: "sticky",
              top: customerWebStickyTop(24),
              alignSelf: "flex-start",
              maxHeight: "calc(100vh - 160px)",
              overflowY: "auto",
            }
          : {},
        default: {},
      }),
    [isTwoColumn]
  );

  const triggerFlyToCart = useCallback(() => {
    if (reducedMotion) {
      bumpCartBadge();
      hapticSuccess();
      return;
    }
    galleryWrapRef.current?.measureInWindow((x, y, w, h) => {
      const startX = x + w * 0.5 - 24;
      const startY = y + h * 0.22;
      const targetX = width * 0.5 - 24;
      const targetY = windowHeight - insets.bottom - CUSTOMER_BOTTOM_NAV_BAR_HEIGHT - 8;

      setFlyGhost({ imageUri: selectedImageUri || "" });
      flyX.value = startX;
      flyY.value = startY;
      flyScale.value = 1;
      flyOpacity.value = 0.98;
      hapticImpactLight();

      const midY = Math.min(startY, targetY) - 76;
      flyX.value = withTiming(targetX, { duration: FLY_MS, easing: FLY_EASE });
      flyY.value = withSequence(
        withTiming(midY, { duration: Math.round(FLY_MS * 0.58), easing: FLY_EASE }),
        withTiming(targetY, { duration: Math.round(FLY_MS * 0.42), easing: FLY_EASE })
      );
      flyScale.value = withSequence(
        withTiming(0.92, { duration: FLY_MS - 80, easing: Easing.out(Easing.cubic) }),
        withTiming(0, { duration: 80, easing: Easing.in(Easing.cubic) })
      );
      flyOpacity.value = withSequence(withTiming(1, { duration: FLY_MS - 60 }), withTiming(0, { duration: 80 }));
      setTimeout(() => {
        setFlyGhost(null);
        bumpCartBadge();
        hapticSuccess();
      }, FLY_MS + 24);
    });
  }, [
    bumpCartBadge,
    flyOpacity,
    flyScale,
    flyX,
    flyY,
    insets.bottom,
    reducedMotion,
    selectedImageUri,
    width,
    windowHeight,
  ]);

  const onScrollToReviews = useCallback(() => {
    scrollRef.current?.scrollTo({ y: Math.max(0, reviewsScrollY.current - 20), animated: true });
    setReviewsFlash(true);
    setTimeout(() => setReviewsFlash(false), 1200);
  }, []);

  const heroMainHeight = useMemo(() => {
    if (isTwoColumn) return Math.min(520, Math.max(340, Math.round(width * 0.38)));
    return Math.min(420, Math.max(280, Math.round(width * 0.72)));
  }, [isTwoColumn, width]);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        shell: { flex: 1, backgroundColor: semanticPalette.bg },
        rowMain: {
          flexDirection: isTwoColumn ? "row" : "column",
          gap: SPACING.xl,
          alignItems: "flex-start",
          width: "100%",
        },
        galleryCol: {
          flex: isTwoColumn ? 3 : undefined,
          width: isTwoColumn ? undefined : "100%",
          minWidth: 0,
        },
        purchaseCol: {
          flex: isTwoColumn ? 2 : undefined,
          width: isTwoColumn ? undefined : "100%",
          minWidth: 0,
          gap: SPACING.md,
          ...Platform.select({
            web:
              isTwoColumn
                ? {
                    position: "sticky",
                    top: customerWebStickyTop(16),
                    alignSelf: "flex-start",
                  }
                : {},
            default: {},
          }),
        },
        galleryRow: {
          flexDirection: isTwoColumn ? "row" : "column-reverse",
          gap: SPACING.md,
          width: "100%",
        },
        thumbRail: {
          width: isTwoColumn ? 72 : undefined,
          maxHeight: isTwoColumn ? heroMainHeight : undefined,
        },
        thumbScrollContent: {
          gap: SPACING.sm,
          paddingBottom: SPACING.xs,
          ...(isTwoColumn ? { flexDirection: "column" } : { flexDirection: "row" }),
        },
        thumbCell: {
          width: isTwoColumn ? 72 : 64,
          height: isTwoColumn ? 72 : 64,
          borderRadius: RADII.md,
          borderWidth: StyleSheet.hairlineWidth,
          overflow: "hidden",
          backgroundColor: semanticPalette.surfaceAlt,
        },
        thumbCellActive: {
          borderColor: semanticPalette.accent,
          borderWidth: 2,
        },
        heroStage: {
          flex: 1,
          minHeight: heroMainHeight,
          borderRadius: RADII.lg,
          backgroundColor: semanticPalette.surfaceAlt,
          overflow: "hidden",
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: semanticPalette.line,
          ...SHADOWS.soft,
        },
        heroImage: { width: "100%", height: "100%" },
        brandOverline: {
          fontFamily: fonts.semibold,
          fontSize: TYPE.micro.fontSize,
          lineHeight: TYPE.micro.lineHeight,
          letterSpacing: 1.8,
          textTransform: "uppercase",
          color: semanticPalette.accent,
          marginBottom: SPACING.xs,
        },
        titleSerif: {
          fontFamily: TYPE.serifFamily,
          ...TYPE.h1,
          color: semanticPalette.ink,
          marginBottom: SPACING.sm,
        },
        priceRow: {
          flexDirection: "row",
          flexWrap: "wrap",
          alignItems: "flex-end",
          gap: SPACING.sm,
          marginBottom: SPACING.sm,
        },
        priceMain: {
          fontFamily: fonts.bold,
          fontSize: TYPE.h2.fontSize,
          lineHeight: TYPE.h2.lineHeight,
          color: semanticPalette.ink,
          fontVariant: ["tabular-nums"],
        },
        mrpStrike: {
          fontFamily: fonts.medium,
          fontSize: TYPE.body.fontSize,
          color: semanticPalette.inkMuted,
          textDecorationLine: "line-through",
        },
        unitTiny: {
          fontFamily: fonts.regular,
          fontSize: TYPE.caption.fontSize,
          color: semanticPalette.inkMuted,
          marginBottom: 2,
        },
        shortDesc: {
          fontFamily: fonts.regular,
          fontSize: TYPE.body.fontSize,
          lineHeight: TYPE.body.lineHeight + 4,
          color: semanticPalette.inkSoft,
          marginBottom: SPACING.sm,
        },
        metaFactRow: {
          flexDirection: "row",
          flexWrap: "wrap",
          gap: SPACING.sm,
          marginBottom: SPACING.sm,
        },
        heroBadge: {
          position: "absolute",
          top: SPACING.md,
          left: SPACING.md,
          zIndex: 3,
          paddingHorizontal: 12,
          paddingVertical: 6,
          borderRadius: RADII.pill,
          backgroundColor: semanticPalette.ink,
          maxWidth: "72%",
        },
        heroBadgeText: {
          fontFamily: fonts.semibold,
          fontSize: TYPE.micro.fontSize,
          letterSpacing: 1.2,
          textTransform: "uppercase",
          color: semanticPalette.inkInverse,
        },
        variantRow: { flexDirection: "row", flexWrap: "wrap", gap: SPACING.sm },
        stepper: {
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          borderRadius: RADII.pill,
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: semanticPalette.line,
          backgroundColor: semanticPalette.surface,
          paddingHorizontal: SPACING.sm,
          paddingVertical: SPACING.xs,
          ...SHADOWS.soft,
        },
        stepHit: {
          width: 44,
          height: 44,
          borderRadius: 22,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: semanticPalette.surfaceAlt,
        },
        stepCount: {
          fontFamily: fonts.semibold,
          fontSize: TYPE.body.fontSize,
          color: semanticPalette.ink,
        },
        trustRow: {
          flexDirection: "row",
          justifyContent: "space-between",
          gap: SPACING.sm,
          marginTop: SPACING.sm,
        },
        trustCell: { flex: 1, alignItems: "center", gap: 6 },
        trustLabel: {
          fontFamily: fonts.medium,
          fontSize: 10,
          lineHeight: 13,
          letterSpacing: 0.4,
          color: semanticPalette.inkMuted,
          textAlign: "center",
        },
        pinRow: {
          flexDirection: "row",
          alignItems: "flex-end",
          gap: SPACING.sm,
          marginTop: SPACING.md,
        },
        pinInputWrap: { flex: 1, minWidth: 0 },
        shelfAccent: {
          height: 2,
          width: "100%",
          backgroundColor: shelfMatch ? semanticPalette.accent : "transparent",
          marginBottom: SPACING.sm,
          borderRadius: 1,
        },
        bannerSoft: {
          padding: SPACING.sm,
          borderRadius: RADII.sm,
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: semanticPalette.line,
          backgroundColor: semanticPalette.surfaceAlt,
          marginBottom: SPACING.sm,
        },
        bannerErrText: { fontFamily: fonts.medium, fontSize: TYPE.small.fontSize, color: semanticPalette.sale },
        bannerOkText: { fontFamily: fonts.medium, fontSize: TYPE.small.fontSize, color: semanticPalette.success },
        productRail: { paddingVertical: SPACING.sm },
        railGap: { width: SPACING.md },
        modalBackdrop: {
          flex: 1,
          backgroundColor: "rgba(14,23,41,0.92)",
          justifyContent: "center",
          alignItems: "center",
          padding: SPACING.lg,
        },
        zoomClose: {
          position: "absolute",
          top: SPACING["2xl"],
          right: SPACING.lg,
          zIndex: 2,
          padding: SPACING.sm,
        },
        skeletonBlock: { gap: SPACING.md, paddingVertical: SPACING.lg },
        flyGhost: {
          position: "absolute",
          left: 0,
          top: 0,
          width: 48,
          height: 60,
          zIndex: 200,
          borderRadius: RADII.md,
          overflow: "hidden",
          ...SHADOWS.soft,
        },
        flyGhostImage: { width: "100%", height: "100%" },
      }),
    [
      TYPE,
      SPACING,
      RADII,
      SHADOWS,
      heroMainHeight,
      isTwoColumn,
      semanticPalette,
      shelfMatch,
    ]
  );

  if (loading) {
    return (
      <View style={styles.shell}>
        <Screen navigation={navigation} title={APP_LOADING_UI.inline.products} breadcrumbLabel="" contentContainerStyle={{ flex: 1, paddingHorizontal: 0 }}>
          <View style={[styles.skeletonBlock, { paddingHorizontal: SPACING.lg }]}>
            <SkeletonBlock height={heroMainHeight} rounded="lg" />
            <SkeletonBlock height={22} width="40%" rounded="sm" />
            <SkeletonBlock height={32} width="85%" rounded="sm" />
            <SkeletonBlock height={120} rounded="md" />
          </View>
        </Screen>
        <View {...(Platform.OS === "web" ? { "data-print-hide": "true" } : {})}>
        <BottomNavBar />
      </View>
      </View>
    );
  }

  if (!product) {
    return (
      <View style={styles.shell}>
        <Screen navigation={navigation} title={PRODUCT_SCREEN.notFoundTitle} breadcrumbLabel="" contentContainerStyle={{ flex: 1 }}>
          <EmptyState
            iconName="alert-circle-outline"
            title={PRODUCT_SCREEN.notFoundTitle}
            description={error || PRODUCT_SCREEN.notFoundDescriptionFallback}
            ctaLabel={PRODUCT_SCREEN.backToHomeCta}
            onCtaPress={() => navigation.navigate("Home")}
          />
        </Screen>
        <View {...(Platform.OS === "web" ? { "data-print-hide": "true" } : {})}>
        <BottomNavBar />
      </View>
      </View>
    );
  }

  const handleAddToCart = () => {
    if (product.inStock === false || Number(product.stockQty || 0) <= 0) return;
    if (!isAuthenticated) {
      goLogin();
      return;
    }
    if (!cartLine) return;
    addToCart(cartLine);
    setBagLiveMessage(
      fillProductScreen(PRODUCT_SCREEN.addedToBagLive, {
        name: String(product?.name || "").trim(),
        variant: String(selectedVariantLabel || product?.unit || "").trim(),
      })
    );
    if (width < 768) setBagToastVisible(true);
  };

  const handleRemoveFromCart = () => {
    if (!isAuthenticated) {
      goLogin();
      return;
    }
    removeFromCart(product.id, cartLine?.variantLabel ?? "");
  };

  const quantity = getItemQuantity(product.id, cartLine?.variantLabel ?? "");
  const isOutOfStock = product.inStock === false || Number(product.stockQty || 0) <= 0;
  const displayPrice = cartLine ? cartLine.price : product.price;
  const mrp = product.mrp != null ? Number(product.mrp) : null;
  const showMrp = mrp != null && mrp > displayPrice;
  const offPct = showMrp && mrp > 0 ? Math.max(0, Math.round((1 - Number(displayPrice) / mrp) * 100)) : null;

  const dockBottomOffset = customerFloatingNavOffset(insets);
  const bagToastMessage = fillProductScreen(PRODUCT_SCREEN.addedToBagToast, {
    price: formatINR(displayPrice),
  });
  const scrollToPageTop = () => scrollRef.current?.scrollTo({ y: 0, animated: true });
  const scrollToGallery = () => scrollRef.current?.scrollTo({ y: 0, animated: true });

  const descriptionBody = String(product.description || "").trim();
  const showRichDetails = hasRichProductContent(product);
  const materialAccordionBody =
    Array.isArray(product.usps) && product.usps.length
      ? product.usps.map((u) => [u.title, u.description].filter(Boolean).join(" — ")).join("\n\n")
      : PRODUCT_SCREEN.accordionMaterialBody;

  const breadcrumbLabel = fillProductScreen(PRODUCT_SCREEN.detailBreadcrumb, {
    category: product.category || PRODUCT_SCREEN.categoryFallback,
  });

  const handleReviewsUpdate = (payload) => {
    setReviews(payload.reviews || []);
    setProduct((current) =>
      current
        ? {
            ...current,
            ratingAverage: payload.ratingAverage,
            reviewCount: payload.reviewCount,
          }
        : current
    );
  };

  const toggleAccordion = (key) => {
    setAccordionOpen((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const renderProductRail = (items) => {
    if (!items || items.length === 0) return null;
    const cardW = Math.max(148, Math.floor(width / 1.2));
    return (
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        decelerationRate="fast"
        snapToInterval={cardW + SPACING.md}
        snapToAlignment="start"
        contentContainerStyle={styles.productRail}
      >
        {items.map((item, idx) => (
          <View key={String(item.id)} style={{ width: cardW, marginRight: idx === items.length - 1 ? 0 : SPACING.md }}>
            <ProductCard
              index={idx}
              product={item}
              variant="grid"
              compact
              railHover
              isOutOfStock={item.inStock === false || Number(item.stockQty || 0) <= 0}
              quantity={getItemQuantity(item.id)}
              onPress={() => navigation.push("Product", { productId: item.id })}
              onAddToCart={() => {
                if (!isAuthenticated) goLogin();
                else addToCart(productToCartLine(item));
              }}
              onRemoveFromCart={() => removeFromCart(item.id)}
            />
          </View>
        ))}
      </ScrollView>
    );
  };

  const galleryBlock = (
    <View ref={galleryWrapRef} style={styles.galleryCol} collapsable={false}>
      <ProductGallery
        images={galleryImages}
        media={product.media}
        badgeText={product.badgeText}
        selectedImage={selectedImage || product.image}
        onSelectImage={setSelectedImage}
        isOutOfStock={isOutOfStock}
      />
    </View>
  );

  const purchaseBlock = (
    <ProductPurchaseColumn
      product={product}
      selectedVariantLabel={selectedVariantLabel}
      onSelectVariant={setSelectedVariantLabel}
      quantity={quantity}
      isOutOfStock={isOutOfStock}
      displayPrice={displayPrice}
      mrp={mrp}
      showMrp={showMrp}
      offPct={offPct}
      reviews={reviews}
      shelfMatch={shelfMatch}
      isTwoColumn={isTwoColumn}
      mainCtaRef={mainCtaRef}
      descriptionBody={descriptionBody}
      materialAccordionBody={materialAccordionBody}
      accordionOpen={accordionOpen}
      onToggleAccordion={toggleAccordion}
      onAddToCart={handleAddToCart}
      onRemoveFromCart={handleRemoveFromCart}
      onNavigateLogin={goLogin}
      isAuthenticated={isAuthenticated}
      onScrollToReviews={onScrollToReviews}
      onFlyToCart={triggerFlyToCart}
      onAddToCartComplete={() => {
        if (width < 768) setBagToastVisible(true);
      }}
      onWishlistSaved={() => setWishlistToastVisible(true)}
      productImageUri={selectedImageUri}
      stickyStyle={purchaseStickyStyle}
      stickyElevated={purchaseElevated}
      viewedRecently={viewedRecently}
    />
  );

  return (
    <View style={styles.shell}>
      <Screen
        navigation={navigation}
        title={product.name}
        breadcrumbLabel={breadcrumbLabel}
        noScroll
        contentContainerStyle={{ flex: 1, paddingHorizontal: 0 }}
      >
        <LiveRegion message={bagLiveMessage} />
        <MotionScrollView
          ref={scrollRef}
          style={{ flex: 1 }}
          {...(Platform.OS === "web" ? { "data-print-pdp": "true" } : {})}
          contentContainerStyle={customerInnerPageScrollContent(insets, {
            paddingHorizontal: SPACING.lg,
            paddingBottom: customerScrollPaddingBottom(insets) + (width < 768 ? 96 : 0),
            paddingTop: customerScrollPaddingTop(insets, { nativeMin: SPACING.xs, webMin: SPACING.sm }),
            gap: SPACING["2xl"],
          })}
          scrollEventThrottle={16}
          onScrollJS={onScrollJS}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.rowMain}>
            {galleryBlock}
            {purchaseBlock}
          </View>

          {showRichDetails ? <ProductRichDetails product={product} /> : null}

          {!showRichDetails && (product.brand || product.sku || product.productType) ? (
            <View style={{ width: "100%", gap: SPACING.md }}>
              <SectionHeader overline={PRODUCT_SCREEN.detailsOverline} title={PRODUCT_SCREEN.detailsTitle} headingLevel={2} />
              <Card padding="md" contentStyle={{ gap: SPACING.sm }}>
                {product.brand ? (
                  <Text style={{ fontFamily: fonts.regular, fontSize: TYPE.body.fontSize, color: semanticPalette.inkSoft }}>
                    {`Brand: ${String(product.brand).trim()}`}
                  </Text>
                ) : null}
                {product.productType ? (
                  <Text style={{ fontFamily: fonts.regular, fontSize: TYPE.body.fontSize, color: semanticPalette.inkSoft }}>
                    {`Type: ${String(product.productType).trim()}`}
                  </Text>
                ) : null}
                {product.sku ? (
                  <Text style={{ fontFamily: fonts.regular, fontSize: TYPE.body.fontSize, color: semanticPalette.inkSoft }}>
                    {`SKU: ${String(product.sku).trim()}`}
                  </Text>
                ) : null}
                {product.unit ? (
                  <Text style={{ fontFamily: fonts.regular, fontSize: TYPE.body.fontSize, color: semanticPalette.inkSoft }}>
                    {`Unit: ${String(product.unit).trim()}`}
                  </Text>
                ) : null}
              </Card>
            </View>
          ) : null}

          <View ref={richContentAnchorRef} collapsable={false} style={{ height: 1, width: "100%" }} />

          <View
            ref={reviewsSectionRef}
            collapsable={false}
            style={[
              { width: "100%", gap: SPACING.lg },
              reviewsFlash ? { backgroundColor: semanticPalette.accentSoft, borderRadius: RADII.md, padding: SPACING.sm } : null,
            ]}
            onLayout={(e) => {
              reviewsScrollY.current = e.nativeEvent.layout.y;
            }}
          >
            <ProductReviews
              reviews={reviews}
              reviewsLoading={reviewsLoading}
              ratingAverage={Number(product.ratingAverage || 0)}
              reviewCount={Number(product.reviewCount || reviews.length || 0)}
              productId={product.id}
              isAuthenticated={isAuthenticated}
              token={token}
              onReviewsUpdate={handleReviewsUpdate}
              onNavigateLogin={goLogin}
            />
          </View>

          <View style={{ gap: SPACING.lg }}>
            <SectionHeader overline={PRODUCT_SCREEN.completeLookOverline} title={PRODUCT_SCREEN.completeLookTitle} headingLevel={2} />
            {renderProductRail(completeLookItems)}
          </View>

          <View style={{ gap: SPACING.lg }}>
            <SectionHeader overline={PRODUCT_SCREEN.youMayAlsoLikeOverline} title={PRODUCT_SCREEN.youMayAlsoLikeTitle} headingLevel={2} />
            {renderProductRail(youMayAlsoLikeItems)}
          </View>

          <View style={{ gap: SPACING.lg }}>
            <SectionHeader overline={PRODUCT_SCREEN.recentlyViewedOverline} title={PRODUCT_SCREEN.recentlyViewedTitle} headingLevel={2} />
            {renderProductRail(recentlyViewedProducts)}
          </View>

          <AppFooter />
        </MotionScrollView>
      </Screen>

      {width < 768 ? (
        <>
          <View {...(Platform.OS === "web" ? { "data-print-hide": "true" } : {})}>
          <GalleryScrollFab
            visible={showGalleryFab}
            bottomOffset={dockBottomOffset + (showStickyCta ? DOCK_HEIGHT_ESTIMATE : 0) + 12}
            onPress={scrollToGallery}
          />
          <MobileStickyDock
            visible={showStickyCta}
            bottomOffset={dockBottomOffset}
            imageUri={selectedImageUri}
            displayPrice={displayPrice}
            mrp={mrp}
            showMrp={showMrp}
            variantLabel={selectedVariantLabel || product.unit}
            quantity={quantity}
            isOutOfStock={isOutOfStock}
            onScrollToTop={scrollToPageTop}
            onAddToCart={handleAddToCart}
            onRemoveFromCart={handleRemoveFromCart}
          />
          </View>
          <Toast
            visible={bagToastVisible}
            message={bagToastMessage}
            actionLabel={PRODUCT_SCREEN.addedToBagToastAction}
            onAction={() => {
              setBagToastVisible(false);
              navigation.navigate("Cart");
            }}
            onDismiss={() => setBagToastVisible(false)}
            durationMs={4000}
            enableSwipeDismiss
          />
          <Toast
            visible={wishlistToastVisible}
            message={PRODUCT_SCREEN.wishlistSavedToast}
            actionLabel={PRODUCT_SCREEN.wishlistSavedToastAction}
            onAction={() => {
              setWishlistToastVisible(false);
              navigation.navigate("Account", { screen: "Wishlist" });
            }}
            onDismiss={() => setWishlistToastVisible(false)}
            durationMs={4000}
            enableSwipeDismiss
          />
        </>
      ) : null}

      {flyGhost ? (
        <Animated.View pointerEvents="none" style={[styles.flyGhost, flyGhostStyle]}>
          {flyGhost.imageUri ? (
            <Image source={{ uri: flyGhost.imageUri }} style={styles.flyGhostImage} contentFit="cover" transition={0} />
          ) : (
            <View style={[styles.flyGhostImage, { backgroundColor: semanticPalette.surfaceAlt }]} />
          )}
        </Animated.View>
      ) : null}

      <View {...(Platform.OS === "web" ? { "data-print-hide": "true" } : {})}>
        <BottomNavBar />
      </View>
    </View>
  );
}
