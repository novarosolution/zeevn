/* @refresh reset */
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useFocusEffect, useRoute } from "@react-navigation/native";
import {
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Haptics from "expo-haptics";
import MotionScrollView from "../../components/motion/MotionScrollView";
import { LinearGradient } from "expo-linear-gradient";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import Animated, {
  Easing,
  FadeInDown,
  FadeOutDown,
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import { loadGsap } from "../../utils/loadGsap";
import AppFooter from "../../components/AppFooter";
import HomeCategoryGrid from "../../components/home/HomeCategoryGrid";
import HomeReorderStrip from "../../components/home/HomeReorderStrip";
import HomeLiveOrderPinnedCard from "../../components/home/HomeLiveOrderPinnedCard";
import HomeSectionHeader from "../../components/home/HomeSectionHeader";
import HomeStatsStrip from "../../components/home/HomeStatsStrip";
import HomeTestimonials from "../../components/home/HomeTestimonials";
import BottomNavBar from "../../components/BottomNavBar";
import HomeSearchHeader from "../../components/home/HomeSearchHeader";
import BrandWordmark from "../../components/BrandWordmark";
import SkeletonBlock from "../../components/ui/SkeletonBlock";
import EmptyState from "../../components/ui/EmptyState";
import NetworkErrorState from "../../components/utility/NetworkErrorState";
import useReducedMotion from "../../hooks/useReducedMotion";
import useRecentSearches from "../../hooks/useRecentSearches";
import { getHomeViewConfig, getProducts } from "../../services/productService";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useCart } from "../../context/CartContext";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";
import { fonts, icon, layout, lineHeight, radius, semanticRadius, spacing, typography } from "../../theme/tokens";
import {
  HOME_HERO_BANNER,
  HOME_CATALOG_INTRO,
  HOME_CATEGORY_QUICK_NAV,
  HOME_CATEGORY_UI,
  HOME_MENU_LINKS,
  HOME_REORDER_STRIP,
  HOME_SEARCH_UI,
  HOME_EMPTY_STATES,
  HOME_TOAST,
  HOME_VIEW_DEFAULTS,
  HOME_WORDMARK_TAGLINE,
  fillPlaceholders,
} from "../../content/appContent";
import {
  BRAND_HOME_TOP_BAR_LAYOUT_HEIGHT,
} from "../../constants/brand";
import {
  HOME_HERO_MOBILE_SLIDER_SLIDES,
  HOME_HERO_WEB_SLIDER_SLIDES,
} from "../../constants/marketingAssets";
import { HOME_CATALOG_ALL, matchesShelfProduct } from "../../utils/shelfMatch";
import { productToCartLine } from "../../utils/productCart";
import { formatINRWhole } from "../../utils/currency";
import {
  ALCHEMY,
  CUSTOMER_SHELL_GRADIENT_LOCATIONS,
  FONT_DISPLAY,
  FONT_DISPLAY_SEMI,
  HERITAGE,
  getCustomerShellGradient,
} from "../../theme/customerAlchemy";
import {
  CUSTOMER_BOTTOM_NAV_BAR_HEIGHT,
  customerPageScrollBase,
  customerScrollPaddingTop,
} from "../../theme/screenLayout";
import { WEB_HEADER_HEIGHT, WEB_Z_INDEX } from "../../theme/web";
import GoldHairline from "../../components/ui/GoldHairline";
import HomeMarketingHero from "../../components/home/HomeMarketingHero";
import HomeTrustStrip from "../../components/home/HomeTrustStrip";
import { HomeCatalogResponsiveGrid } from "../../components/home/HomeCatalogProductViews";
import ProgressRing from "../../components/feedback/ProgressRing";
import SectionEnter from "../../components/motion/SectionEnter";
import { fetchMyNotifications, fetchMyOrders } from "../../services/userService";
import { ACCOUNT_NESTED } from "../../navigation/accountRoutes";
import { spacing as homeSpacing } from "../../styles/spacing";
import { applyRouteMeta } from "../../utils/webMeta";
import { preloadHomeHeroLcp } from "../../utils/webHead";
import { refreshScrollTrigger } from "../../utils/refreshScrollTrigger";

/** Room for optional tagline under home wordmark (keeps hamburger & cart aligned). */
const HOME_TOPBAR_TAGLINE_ROOM = 4;
/** Distance from top of screen to first row of menu (below home bar + gap). */
const HOME_MENU_TOP_OFFSET =
  BRAND_HOME_TOP_BAR_LAYOUT_HEIGHT + HOME_TOPBAR_TAGLINE_ROOM + spacing.sm * 2 + spacing.xs;
const HOME_HEADER_BG_LIGHT = "#FAFAF7";
const HOME_CACHE_KEY = "@zeevan/home/cache-v1";

import { createHomeStyles, HOME_HEADER_INK } from "./homeScreenStyles";
import CatalogViewToggleButton from "../../components/home/HomeCatalogViewToggle";
import HomeMicroBar from "../../components/home/HomeMicroBar";

/** Home lists the full catalog; `showOnHome` on each product still controls visibility. */
function matchesHomeShelf(product) {
  return matchesShelfProduct(product, HOME_CATALOG_ALL);
}


export default function HomeScreenBody({ navigation }) {
  const route = useRoute();
  const { colors: c, shadowLift, shadowPremium, isDark } = useTheme();
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const safeWindowWidth = Number.isFinite(Number(windowWidth)) ? Number(windowWidth) : 390;
  const safeWindowHeight = Number.isFinite(Number(windowHeight)) ? Number(windowHeight) : 844;
  const insets = useSafeAreaInsets();
  const safeTopInset = Number(insets?.top || 0);
  const safeBottomInset = Number(insets?.bottom || 0);
  const styles = useMemo(
    () => createHomeStyles(c, shadowLift, shadowPremium, isDark, safeWindowWidth, insets),
    [c, shadowLift, shadowPremium, isDark, safeWindowWidth, insets]
  );
  const scrollRef = useRef(null);
  const featuredYRef = useRef(0);
  const heroSliderRef = useRef(null);
  const webRootRef = useRef(null);
  const webHeaderRef = useRef(null);
  const webHeroRef = useRef(null);
  const webTrustRef = useRef(null);
  const webCatalogRefs = useRef([]);
  const webFooterRef = useRef(null);
  const toastIdSeqRef = useRef(0);
  const toastTimersRef = useRef(new Map());
  const heroAutoResumeTimerRef = useRef(null);
  const menuOpenedAtRef = useRef(0);

  useFocusEffect(
    useCallback(() => {
      if (Platform.OS === "web") {
        applyRouteMeta("home");
        preloadHomeHeroLcp();
      }
      return undefined;
    }, [])
  );

  const { addToCart, removeFromCart, getItemQuantity, totalItems, totalAmount } = useCart();
  const { isAuthenticated, token, user, refreshProfile } = useAuth();
  const [query, setQuery] = useState("");
  const [unreadNotificationCount, setUnreadNotificationCount] = useState(0);
  const [viewToggleTooltip, setViewToggleTooltip] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showingCachedItems, setShowingCachedItems] = useState(false);
  const [sectionFilter, setSectionFilter] = useState(null);
  const [categoryFilter, setCategoryFilter] = useState(null);
  const [pastOrders, setPastOrders] = useState([]);
  const [toastQueue, setToastQueue] = useState([]);
  const [homeViewConfig, setHomeViewConfig] = useState({ ...HOME_VIEW_DEFAULTS });
  const [heroSlideIndex, setHeroSlideIndex] = useState(0);
  const [heroAutoPaused, setHeroAutoPaused] = useState(false);
  const [heroSliderWidth, setHeroSliderWidth] = useState(0);
  const [deliveryLine1, setDeliveryLine1] = useState("");
  const [deliveryCity, setDeliveryCity] = useState("");
  const [outOfAreaNotifyOpen, setOutOfAreaNotifyOpen] = useState(false);
  const [outOfAreaEmail, setOutOfAreaEmail] = useState("");
  const [outOfAreaNotifySubmitted, setOutOfAreaNotifySubmitted] = useState(false);
  const [liveOrder, setLiveOrder] = useState(null);
  const [headerScrolled, setHeaderScrolled] = useState(false);
  const [scrollY, setScrollY] = useState(0);
  const [pullProgress, setPullProgress] = useState(0);
  const [showPullCheck, setShowPullCheck] = useState(false);
  const [isPullRefreshing, setIsPullRefreshing] = useState(false);
  const [flyGhost, setFlyGhost] = useState(null);
  const flyX = useSharedValue(0);
  const flyY = useSharedValue(0);
  const flyScale = useSharedValue(1);
  const flyOpacity = useSharedValue(0);
  const homeContentBottomPadding = useMemo(() => {
    if (Platform.OS === "web") return 40;
    return safeBottomInset + CUSTOMER_BOTTOM_NAV_BAR_HEIGHT + 24;
  }, [safeBottomInset]);
  const homeCarouselBottomPadding = useMemo(() => {
    if (Platform.OS === "web") return 40;
    return Math.max(24, safeBottomInset + 24);
  }, [safeBottomInset]);
  const homeOuterHorizontalPadding = useMemo(() => {
    if (safeWindowWidth >= 1024) return homeSpacing["4xl"];
    if (safeWindowWidth >= 600) return homeSpacing["2xl"];
    return homeSpacing.lg;
  }, [safeWindowWidth]);
  const toastStackBottomOffset = useMemo(() => {
    if (Platform.OS === "web") return 24;
    return safeBottomInset + CUSTOMER_BOTTOM_NAV_BAR_HEIGHT + 16;
  }, [safeBottomInset]);
  const showMarketing = !query.trim();
  const reducedMotion = useReducedMotion();
  const { add: addRecentSearch } = useRecentSearches();
  const cartBounceScale = useSharedValue(1);
  const cartBounceStyle = useAnimatedStyle(() => ({
    transform: [{ scale: cartBounceScale.value }],
  }));
  const flyGhostStyle = useAnimatedStyle(() => ({
    opacity: flyOpacity.value,
    transform: [{ translateX: flyX.value }, { translateY: flyY.value }, { scale: flyScale.value }],
  }));
  const onSearchSubmit = useCallback(
    (value) => {
      const normalized = String(value || "").trim();
      setQuery(normalized);
      if (!normalized) return;
      addRecentSearch(normalized);
      navigation.navigate({
        name: "Search",
        params: { q: normalized, category: "", categoryLabel: "" },
      });
    },
    [addRecentSearch, navigation]
  );

  const openMenu = useCallback(() => {
    menuOpenedAtRef.current = Date.now();
    // Defer one frame to avoid iOS modal-backdrop tap race.
    requestAnimationFrame(() => setMenuOpen(true));
  }, []);

  const closeMenu = useCallback(() => {
    if (Date.now() - menuOpenedAtRef.current < 180) return;
    setMenuOpen(false);
  }, []);

  useEffect(
    () => () => {
      toastTimersRef.current.forEach((meta) => {
        if (meta?.timer) clearTimeout(meta.timer);
      });
      toastTimersRef.current.clear();
      if (heroAutoResumeTimerRef.current) {
        clearTimeout(heroAutoResumeTimerRef.current);
        heroAutoResumeTimerRef.current = null;
      }
    },
    []
  );

  const deliveryAddress = useMemo(() => {
    const line = String(deliveryLine1 || "").trim();
    const city = String(deliveryCity || "").trim();
    if (line && city) return `${line}, ${city}`;
    return line || city || null;
  }, [deliveryCity, deliveryLine1]);
  const isOutOfArea = useMemo(() => {
    const a = user?.defaultAddress || {};
    return Boolean(
      a &&
      (a.isServiceable === false || a.serviceable === false || a.inServiceArea === false || a.outOfArea === true)
    );
  }, [user?.defaultAddress]);

  const openAddressSelector = useCallback(() => {
    navigation.navigate("Profile", { screen: ACCOUNT_NESTED.Addresses });
  }, [navigation]);

  const openNotifications = useCallback(() => {
    navigation.navigate("Notifications");
  }, [navigation]);
  const openOutOfAreaNotify = useCallback(() => {
    setOutOfAreaNotifySubmitted(false);
    setOutOfAreaEmail("");
    setOutOfAreaNotifyOpen(true);
  }, []);
  const submitOutOfAreaNotify = useCallback(() => {
    const normalized = String(outOfAreaEmail || "").trim();
    if (!normalized || !normalized.includes("@")) {
      return;
    }
    setOutOfAreaNotifySubmitted(true);
  }, [outOfAreaEmail]);

  const refreshDeliverySnippet = useCallback(async () => {
    if (!isAuthenticated || !token) {
      setDeliveryLine1("");
      setDeliveryCity("");
      return;
    }
    const cachedAddress = user?.defaultAddress;
    if (cachedAddress?.line1 || cachedAddress?.city) {
      setDeliveryLine1(String(cachedAddress?.line1 || "").trim());
      setDeliveryCity(String(cachedAddress?.city || "").trim());
      return;
    }
    try {
      const profile = await refreshProfile();
      const a = profile?.defaultAddress;
      setDeliveryLine1(String(a?.line1 || "").trim());
      setDeliveryCity(String(a?.city || "").trim());
    } catch {
      setDeliveryLine1("");
      setDeliveryCity("");
    }
  }, [isAuthenticated, token, user?.defaultAddress, refreshProfile]);

  useFocusEffect(
    useCallback(() => {
      refreshDeliverySnippet();
      let cancelled = false;
      (async () => {
        if (!isAuthenticated || !token) {
          if (!cancelled) setLiveOrder(null);
          if (!cancelled) setUnreadNotificationCount(0);
          if (!cancelled) setPastOrders([]);
          return;
        }
        try {
          const [data, notifications] = await Promise.all([fetchMyOrders(token), fetchMyNotifications(token)]);
          const orders = Array.isArray(data) ? data : [];
          const userNotifications = Array.isArray(notifications) ? notifications : [];
          const pick =
            orders.find((o) => String(o?.status || "") === "out_for_delivery") ||
            orders.find((o) =>
              ["ready_for_pickup", "shipped", "preparing", "confirmed"].includes(String(o?.status || ""))
            ) ||
            null;
          if (!cancelled) {
            setLiveOrder(pick);
            setPastOrders(orders);
            setUnreadNotificationCount(userNotifications.filter((item) => !item?.isRead && !item?.isArchived).length);
          }
        } catch {
          if (!cancelled) {
            setLiveOrder(null);
            setPastOrders([]);
            setUnreadNotificationCount(0);
          }
        }
      })();
      return () => {
        cancelled = true;
      };
    }, [isAuthenticated, refreshDeliverySnippet, token])
  );

  /** Width-derived hero height: web = wide band; phone = height from reference 1023×1537 JPEG aspect (+ screen cap). */
  const heroSlideHeight = useMemo(() => {
    const w = heroSliderWidth > 0 ? heroSliderWidth : Math.min(safeWindowWidth, layout.maxContentWidth);
    if (Platform.OS === "web") {
      return Math.min(420, Math.max(320, Math.round(w * 0.32)));
    }
    const ideal = Math.round(w * 0.78);
    const maxFromScreen = Math.round(safeWindowHeight * 0.52);
    return Math.max(280, Math.min(ideal, 430, maxFromScreen));
  }, [heroSliderWidth, safeWindowWidth, safeWindowHeight]);

  const loadHomeData = useCallback(async ({ isPullRefresh = false } = {}) => {
    if (isPullRefresh) {
      setIsPullRefreshing(true);
    } else {
      setLoading(true);
    }
    setError("");
    setShowingCachedItems(false);
    try {
      const [data, viewConfig] = await Promise.all([getProducts(), getHomeViewConfig()]);
      setProducts(data);
      setHomeViewConfig(viewConfig);
      try {
        await AsyncStorage.setItem(
          HOME_CACHE_KEY,
          JSON.stringify({
            products: Array.isArray(data) ? data : [],
            viewConfig: viewConfig && typeof viewConfig === "object" ? viewConfig : {},
            updatedAt: Date.now(),
          })
        );
      } catch {
        // non-blocking cache write
      }
    } catch (err) {
      const nextError = err?.message || HOME_SEARCH_UI.loadErrorFallback;
      setError(nextError);
      try {
        const rawCache = await AsyncStorage.getItem(HOME_CACHE_KEY);
        const parsed = rawCache ? JSON.parse(rawCache) : null;
        const cachedProducts = Array.isArray(parsed?.products) ? parsed.products : [];
        const cachedViewConfig =
          parsed?.viewConfig && typeof parsed.viewConfig === "object" ? parsed.viewConfig : null;
        if (cachedProducts.length > 0) {
          setProducts(cachedProducts);
          if (cachedViewConfig) {
            setHomeViewConfig((prev) => ({ ...prev, ...cachedViewConfig }));
          }
          setShowingCachedItems(true);
        }
      } catch {
        // no cache available
      }
    } finally {
      if (isPullRefresh) {
        setIsPullRefreshing(false);
      } else {
        setLoading(false);
      }
      if (Platform.OS === "web") {
        refreshScrollTrigger();
      }
    }
  }, []);

  useEffect(() => {
    loadHomeData();
  }, [loadHomeData]);

  useEffect(() => {
    const raw = route.params?.filterHomeSection;
    if (raw != null && String(raw).trim()) {
      setSectionFilter(String(raw).trim());
    } else {
      setSectionFilter(null);
    }
  }, [route.params?.filterHomeSection]);

  useEffect(() => {
    const raw = route.params?.filterHomeCategory;
    if (raw != null && String(raw).trim()) {
      setQuery("");
      setCategoryFilter(String(raw).trim());
    } else {
      setCategoryFilter(null);
    }
  }, [route.params?.filterHomeCategory]);

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      if (!matchesHomeShelf(product)) return false;
      const productName = String(product?.name || "");
      const productDescription = String(product?.description || "");
      const productCategory = String(product?.category || "").toLowerCase();
      const productType = String(product?.productType || "").toLowerCase();
      const searchTerm = query.trim().toLowerCase();
      const categoryTerm = String(categoryFilter || "").trim().toLowerCase();
      const matchesSearch =
        searchTerm.length === 0 ||
        productName.toLowerCase().includes(searchTerm) ||
        productDescription.toLowerCase().includes(searchTerm);
      const matchesCategory =
        categoryTerm.length === 0 || productCategory.includes(categoryTerm) || productType.includes(categoryTerm);
      return matchesSearch && matchesCategory;
    });
  }, [products, query, categoryFilter]);

  const homeVisibleProducts = useMemo(() => {
    return filteredProducts
      .filter((item) => item.showOnHome !== false)
      .sort((a, b) => {
        const orderA = Number.isFinite(Number(a.homeOrder)) ? Number(a.homeOrder) : 0;
        const orderB = Number.isFinite(Number(b.homeOrder)) ? Number(b.homeOrder) : 0;
        if (orderA !== orderB) return orderA - orderB;
        return String(a.name || "").localeCompare(String(b.name || ""));
      });
  }, [filteredProducts]);

  const productsForHome = useMemo(() => homeVisibleProducts, [homeVisibleProducts]);

  const totalMatches = productsForHome.length;
  const hasTypedQuery = query.trim().length > 0;
  const noSearchResults = !loading && hasTypedQuery && totalMatches === 0;
  const hasNetworkErrorWithoutCache = !loading && Boolean(error) && !showingCachedItems;
  const bestSellersFallback = useMemo(() => {
    return products
      .filter((product) => matchesHomeShelf(product) && product.showOnHome !== false)
      .sort((a, b) => {
        const orderA = Number.isFinite(Number(a.homeOrder)) ? Number(a.homeOrder) : 0;
        const orderB = Number.isFinite(Number(b.homeOrder)) ? Number(b.homeOrder) : 0;
        if (orderA !== orderB) return orderA - orderB;
        return String(a.name || "").localeCompare(String(b.name || ""));
      })
      .slice(0, 8);
  }, [products]);
  const homeGridNumColumns = useMemo(() => {
    if (safeWindowWidth < 640) return 2;
    if (safeWindowWidth < 1024) return 3;
    return 4;
  }, [safeWindowWidth]);
  const homeGridGap = safeWindowWidth >= 600 ? homeSpacing.base : homeSpacing.md;
  const homeGridHorizontalPadding = useMemo(() => {
    const pagePad = Platform.select({ web: spacing.sm, default: customerPageScrollBase.paddingHorizontal });
    const surfacePad = Platform.select({ web: homeSpacing["3xl"], default: homeSpacing.xl });
    return pagePad + surfacePad;
  }, []);
  const homeGridCardWidth = useMemo(() => {
    const safeScreenWidth = Math.max(320, Math.floor(safeWindowWidth));
    const totalGap = homeGridGap * Math.max(0, homeGridNumColumns - 1);
    return Math.floor((safeScreenWidth - homeGridHorizontalPadding * 2 - totalGap) / homeGridNumColumns);
  }, [safeWindowWidth, homeGridGap, homeGridHorizontalPadding, homeGridNumColumns]);

  const adminManagedSections = useMemo(() => {
    const grouped = productsForHome.reduce((acc, item) => {
      const key = String(item.homeSection || "Prime Products").trim() || "Prime Products";
      if (!acc[key]) {
        acc[key] = [];
      }
      acc[key].push(item);
      return acc;
    }, {});

    return Object.entries(grouped)
      .map(([title, items]) => ({ title, items }))
      .sort((a, b) => a.title.localeCompare(b.title));
  }, [productsForHome]);

  const visibleHomeSections = useMemo(() => {
    if (!homeViewConfig.showPrimeSection) return adminManagedSections;
    const primeKey = String(homeViewConfig.primeSectionTitle || "Prime Products")
      .trim()
      .toLowerCase();
    return adminManagedSections.filter(
      (section) => String(section.title || "").trim().toLowerCase() !== primeKey
    );
  }, [adminManagedSections, homeViewConfig.showPrimeSection, homeViewConfig.primeSectionTitle]);

  const sectionsForRender = useMemo(() => {
    if (!sectionFilter) return visibleHomeSections;
    return visibleHomeSections.filter((s) => String(s.title).trim() === sectionFilter);
  }, [visibleHomeSections, sectionFilter]);

  const clearSectionFilter = useCallback(() => {
    setSectionFilter(null);
    navigation.setParams({ filterHomeSection: undefined });
  }, [navigation]);

  const clearCategoryFilter = useCallback(() => {
    setCategoryFilter(null);
    navigation.setParams({ filterHomeCategory: undefined });
  }, [navigation]);

  const reorderItems = useMemo(() => {
    if (!isAuthenticated || !Array.isArray(pastOrders) || pastOrders.length === 0) return [];
    const sortedOrders = [...pastOrders].sort(
      (a, b) => new Date(b?.createdAt || 0).getTime() - new Date(a?.createdAt || 0).getTime()
    );
    const seen = new Set();
    const entries = [];
    sortedOrders.forEach((order) => {
      (order?.products || []).forEach((item, idx) => {
        const productId = String(item?.product || item?.externalProductId || "").trim();
        if (!productId) return;
        const variantLabel = String(item?.variantLabel || "").trim();
        const dedupeKey = `${productId}::${variantLabel}`;
        if (seen.has(dedupeKey)) return;
        seen.add(dedupeKey);
        entries.push({
          key: `${order?._id || "order"}-${idx}-${dedupeKey}`,
          id: productId,
          product: productId,
          name: String(item?.name || "Product").trim() || "Product",
          price: Number(item?.price || 0),
          image: String(item?.image || "").trim(),
          variantLabel,
        });
      });
    });
    return entries.slice(0, 8);
  }, [isAuthenticated, pastOrders]);

  const triggerCartIconBounce = useCallback(() => {
    if (Platform.OS === "web") return;
    cartBounceScale.value = withSequence(
      withTiming(0.92, { duration: 80 }),
      withTiming(1.08, { duration: 120 }),
      withTiming(1, { duration: 120 })
    );
  }, [cartBounceScale]);

  const removeToast = useCallback((toastId) => {
    const meta = toastTimersRef.current.get(toastId);
    if (meta?.timer) {
      clearTimeout(meta.timer);
    }
    toastTimersRef.current.delete(toastId);
    setToastQueue((prev) => prev.filter((item) => item.id !== toastId));
  }, []);

  const scheduleToastDismiss = useCallback(
    (toastId, durationMs) => {
      const nextDelay = Math.max(1, Number(durationMs) || 1);
      const prevMeta = toastTimersRef.current.get(toastId);
      if (prevMeta?.timer) clearTimeout(prevMeta.timer);
      const meta = {
        remaining: nextDelay,
        startedAt: Date.now(),
        paused: false,
        timer: setTimeout(() => {
          removeToast(toastId);
        }, nextDelay),
      };
      toastTimersRef.current.set(toastId, meta);
    },
    [removeToast]
  );

  const pauseToastDismiss = useCallback((toastId) => {
    const meta = toastTimersRef.current.get(toastId);
    if (!meta || meta.paused) return;
    if (meta.timer) clearTimeout(meta.timer);
    const elapsed = Date.now() - meta.startedAt;
    meta.remaining = Math.max(1, meta.remaining - elapsed);
    meta.paused = true;
    meta.timer = null;
    toastTimersRef.current.set(toastId, meta);
  }, []);

  const resumeToastDismiss = useCallback(
    (toastId) => {
      const meta = toastTimersRef.current.get(toastId);
      if (!meta || !meta.paused) return;
      scheduleToastDismiss(toastId, meta.remaining);
    },
    [scheduleToastDismiss]
  );

  const showAddedToBagToast = useCallback(() => {
    const toastId = `home-toast-${Date.now()}-${toastIdSeqRef.current++}`;
    setToastQueue((prev) => [
      ...prev,
      {
        id: toastId,
        message: HOME_TOAST.addedToBag,
        actionLabel: HOME_TOAST.viewBag,
      },
    ]);
    scheduleToastDismiss(toastId, 3000);
  }, [scheduleToastDismiss]);

  const triggerAddToCartFeedback = useCallback(() => {
    if (Platform.OS === "ios") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    }
    triggerCartIconBounce();
  }, [triggerCartIconBounce]);

  const triggerFlyToCart = useCallback(
    (meta) => {
      if (reducedMotion || !meta?.sourceRect) {
        triggerCartIconBounce();
        return;
      }
      const fromX = Number(meta.sourceRect.x || 0);
      const fromY = Number(meta.sourceRect.y || 0);
      const fromW = Number(meta.sourceRect.width || 48);
      const fromH = Number(meta.sourceRect.height || 60);
      const startX = fromX + fromW * 0.5 - 24;
      const startY = fromY + fromH * 0.5 - 30;
      const targetX = safeWindowWidth * 0.5 - 20;
      const targetY = safeWindowHeight - safeBottomInset - CUSTOMER_BOTTOM_NAV_BAR_HEIGHT - 8;

      setFlyGhost({
        imageUri: meta.imageUri || "",
      });
      flyX.value = startX;
      flyY.value = startY;
      flyScale.value = 1;
      flyOpacity.value = 0.98;

      const midX = (startX + targetX) / 2 + 18;
      const midY = Math.min(startY, targetY) - 76;
      flyX.value = withSequence(
        withTiming(midX, { duration: 280, easing: Easing.bezier(0.2, 0.8, 0.2, 1) }),
        withTiming(targetX, { duration: 200, easing: Easing.bezier(0.2, 0.8, 0.2, 1) })
      );
      flyY.value = withSequence(
        withTiming(midY, { duration: 280, easing: Easing.bezier(0.2, 0.8, 0.2, 1) }),
        withTiming(targetY, { duration: 200, easing: Easing.bezier(0.2, 0.8, 0.2, 1) })
      );
      flyScale.value = withSequence(
        withTiming(0.92, { duration: 380, easing: Easing.out(Easing.cubic) }),
        withTiming(0, { duration: 100, easing: Easing.in(Easing.cubic) })
      );
      flyOpacity.value = withSequence(withTiming(1, { duration: 380 }), withTiming(0, { duration: 100 }));
      setTimeout(() => setFlyGhost(null), 520);
      triggerCartIconBounce();
    },
    [
      flyOpacity,
      flyScale,
      flyX,
      flyY,
      safeBottomInset,
      reducedMotion,
      triggerCartIconBounce,
      safeWindowHeight,
      safeWindowWidth,
    ]
  );

  const handleReorderAdd = useCallback(
    (item) => {
      if (!isAuthenticated) {
        navigation.navigate("Login");
        return;
      }
      addToCart({
        id: item.id,
        product: item.product,
        name: item.name,
        price: Number(item.price || 0),
        image: item.image || "",
        quantity: 1,
        variantLabel: item.variantLabel || "",
      });
      showAddedToBagToast();
      triggerAddToCartFeedback();
    },
    [addToCart, isAuthenticated, navigation, showAddedToBagToast, triggerAddToCartFeedback]
  );

  const handleCatalogAddToCart = useCallback(
    (product, interactionMeta) => {
      if (product.inStock === false || Number(product.stockQty || 0) <= 0) return;
      if (!isAuthenticated) {
        navigation.navigate("Login");
        return;
      }
      addToCart(productToCartLine(product));
      showAddedToBagToast();
      triggerAddToCartFeedback();
      triggerFlyToCart(interactionMeta);
    },
    [addToCart, isAuthenticated, navigation, showAddedToBagToast, triggerAddToCartFeedback, triggerFlyToCart]
  );

  const handleCatalogRemoveFromCart = useCallback(
    (productId) => {
      if (!isAuthenticated) {
        navigation.navigate("Login");
        return;
      }
      if (Platform.OS === "ios") {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
      }
      removeFromCart(productId);
    },
    [isAuthenticated, navigation, removeFromCart]
  );

  const shellColors = useMemo(
    () =>
      isDark
        ? getCustomerShellGradient(isDark, c)
        : [HOME_HEADER_BG_LIGHT, HOME_HEADER_BG_LIGHT, HOME_HEADER_BG_LIGHT, HOME_HEADER_BG_LIGHT],
    [isDark, c]
  );
  const handleHomeScroll = useCallback((offsetY) => {
    setScrollY(Number(offsetY || 0));
    if (!isPullRefreshing) {
      const progress = Math.max(0, Math.min(1, Math.abs(Math.min(0, Number(offsetY || 0))) / 74));
      setPullProgress(progress);
    }
    const next = Number(offsetY || 0) > 8;
    setHeaderScrolled((prev) => (prev === next ? prev : next));
  }, [isPullRefreshing]);
  const heroSlides = useMemo(() => {
    const source = Platform.OS === "web" ? HOME_HERO_WEB_SLIDER_SLIDES : HOME_HERO_MOBILE_SLIDER_SLIDES;
    return source.map((slide, index) => ({
      ...slide,
      title: index === 0 ? homeViewConfig.heroTitle : slide.title,
      subtitle: slide.subtitle,
      cta: index === 0 ? HOME_HERO_BANNER.cta : slide.cta,
    }));
  }, [homeViewConfig.heroTitle]);
  const safeHeroSlideHeight = Number.isFinite(Number(heroSlideHeight)) ? Number(heroSlideHeight) : 320;
  const safeHomeGridGap = Number.isFinite(Number(homeGridGap)) ? Number(homeGridGap) : 12;
  const safeHomeGridCardWidth = Number.isFinite(Number(homeGridCardWidth)) ? Number(homeGridCardWidth) : 140;

  const performPullRefresh = useCallback(async () => {
    if (isPullRefreshing) return;
    setIsPullRefreshing(true);
    setShowPullCheck(false);
    setPullProgress(1);
    try {
      await loadHomeData({ isPullRefresh: true });
      await refreshDeliverySnippet();
      setShowPullCheck(true);
      setTimeout(() => setShowPullCheck(false), 400);
    } finally {
      setIsPullRefreshing(false);
      setPullProgress(0);
    }
  }, [isPullRefreshing, loadHomeData, refreshDeliverySnippet]);

  const scrollToFeatured = useCallback(() => {
    const y = Math.max(0, featuredYRef.current - 12);
    scrollRef.current?.scrollTo({ y, animated: true });
  }, []);

  const pauseHeroAutoAdvance = useCallback(() => {
    if (heroAutoResumeTimerRef.current) {
      clearTimeout(heroAutoResumeTimerRef.current);
      heroAutoResumeTimerRef.current = null;
    }
    setHeroAutoPaused(true);
  }, []);

  const resumeHeroAutoAdvance = useCallback(() => {
    if (heroAutoResumeTimerRef.current) {
      clearTimeout(heroAutoResumeTimerRef.current);
    }
    heroAutoResumeTimerRef.current = setTimeout(() => {
      setHeroAutoPaused(false);
      heroAutoResumeTimerRef.current = null;
    }, 4000);
  }, []);

  const goToHeroSlide = useCallback((index, options = {}) => {
    const w = heroSliderWidth;
    if (w <= 0 || heroSlides.length === 0) return;
    const next = Math.max(0, Math.min(index, heroSlides.length - 1));
    const animated = options?.animated ?? !reducedMotion;
    heroSliderRef.current?.scrollTo({ x: next * w, animated });
    setHeroSlideIndex(next);
  }, [heroSliderWidth, heroSlides.length, reducedMotion]);

  const focusCatalog = useCallback(() => {
    requestAnimationFrame(() => scrollToFeatured());
  }, [scrollToFeatured]);

  const onCategoryPress = useCallback(
    (category) => {
      const nextFilter = String(category?.filter || category?.label || "").trim();
      if (!nextFilter) return;
      setQuery("");
      setSectionFilter(null);
      setCategoryFilter(nextFilter);
      navigation.navigate({
        name: "Home",
        merge: true,
        params: { filterHomeSection: undefined, filterHomeCategory: nextFilter },
      });
      focusCatalog();
    },
    [focusCatalog, navigation]
  );

  const openAllCategories = useCallback(() => {
    navigation.navigate("Categories");
  }, [navigation]);

  const setCatalogCardStyle = useCallback((nextStyle) => {
    setHomeViewConfig((prev) => ({
      ...prev,
      productCardStyle: nextStyle === "comfortable" ? "comfortable" : "compact",
    }));
  }, []);

  useEffect(() => {
    if (reducedMotion || !showMarketing || heroAutoPaused || heroSlides.length < 2 || heroSliderWidth <= 0) {
      return undefined;
    }
    const timer = setInterval(() => {
      setHeroSlideIndex((prev) => {
        const next = (prev + 1) % heroSlides.length;
        heroSliderRef.current?.scrollTo({ x: next * heroSliderWidth, animated: true });
        return next;
      });
    }, 6000);
    return () => clearInterval(timer);
  }, [reducedMotion, showMarketing, heroAutoPaused, heroSlides.length, heroSliderWidth]);

  const handleHeroSlideAction = useCallback(
    (action) => {
      if (action === "catalog") {
        focusCatalog();
        return;
      }
      scrollToFeatured();
    },
    [focusCatalog, scrollToFeatured]
  );

  const setWebCatalogRef = useCallback((idx, node) => {
    webCatalogRefs.current[idx] = node;
  }, []);

  useEffect(() => {
    if (Platform.OS !== "web" || reducedMotion || !showMarketing) return undefined;
    const root = webRootRef.current;
    if (!root) return undefined;
    let cancelled = false;
    let ctx;

    (async () => {
      const gsap = await loadGsap();
      if (cancelled || !gsap) return;
      ctx = gsap.context(() => {
        const intro = gsap.timeline({ defaults: { ease: "power3.out" } });
        if (webHeaderRef.current) {
          intro.fromTo(webHeaderRef.current, { y: 16 }, { y: 0, duration: 0.45 });
        }
        if (webHeroRef.current) {
          intro.fromTo(webHeroRef.current, { y: 18 }, { y: 0, duration: 0.52 }, "-=0.28");
        }

        const revealNodes = [
          webTrustRef.current,
          ...webCatalogRefs.current.filter(Boolean),
          webFooterRef.current,
        ].filter(Boolean);

        revealNodes.forEach((node, idx) => {
          gsap.fromTo(
            node,
            { y: 28 },
            {
              y: 0,
              duration: 0.58,
              ease: "power2.out",
              delay: idx === 0 ? 0.04 : 0,
              scrollTrigger: {
                trigger: node,
                start: "top 88%",
                toggleActions: "play none none reverse",
              },
            }
          );
        });

        if (webTrustRef.current) {
          gsap.fromTo(
            webTrustRef.current,
            { y: 20 },
            {
              y: 0,
              duration: 0.65,
              ease: "power2.out",
              scrollTrigger: {
                trigger: webTrustRef.current,
                start: "top 92%",
                end: "bottom 72%",
                scrub: 0.35,
              },
            }
          );
        }

        if (webHeroRef.current) {
          gsap.to(webHeroRef.current, {
            y: -18,
            ease: "none",
            scrollTrigger: {
              trigger: webHeroRef.current,
              start: "top top",
              end: "bottom top",
              scrub: 0.6,
            },
          });
        }
      }, root);
    })();

    return () => {
      cancelled = true;
      ctx?.revert?.();
    };
  }, [reducedMotion, showMarketing]);

  useEffect(() => {
    if (Platform.OS !== "web" || reducedMotion) return;
    const frame = requestAnimationFrame(() => {
      refreshScrollTrigger();
    });
    return () => cancelAnimationFrame(frame);
  }, [reducedMotion, sectionsForRender.length, totalMatches, loading]);

  const renderCatalogItems = (items, listKeyPrefix = "cat") => {
    const outOfStock = (p) => p.inStock === false || Number(p.stockQty || 0) <= 0;
    if (!Array.isArray(items) || items.length === 0) {
      return (
        <View style={styles.inlineSectionEmpty}>
          <Text style={styles.inlineSectionEmptyTitle}>{HOME_SEARCH_UI.inlineSectionEmptyTitle}</Text>
          <View style={styles.inlineSectionCategoryRow}>
            {HOME_CATEGORY_QUICK_NAV.slice(0, 4).map((cat) => (
              <Pressable
                key={`${listKeyPrefix}-${cat.key}`}
                onPress={() => onCategoryPress(cat)}
                style={({ pressed }) => [styles.inlineSectionCategoryChip, pressed ? styles.inlineSectionCategoryChipPressed : null]}
                accessibilityRole="button"
                  accessibilityLabel={`${HOME_SEARCH_UI.filterByCategoryA11yPrefix} ${cat.label}`}
              >
                <Text style={styles.inlineSectionCategoryChipText}>{cat.label}</Text>
              </Pressable>
            ))}
          </View>
        </View>
      );
    }
    return (
      <HomeCatalogResponsiveGrid
        items={items}
        styles={styles}
        navigation={navigation}
        getItemQuantity={getItemQuantity}
        onAddToCart={handleCatalogAddToCart}
        onRemoveFromCart={handleCatalogRemoveFromCart}
        isOutOfStock={outOfStock}
        cardStyle={homeViewConfig.productCardStyle}
        numColumns={homeGridNumColumns}
        gridGap={safeHomeGridGap}
        cardWidth={safeHomeGridCardWidth}
        listKeyPrefix={listKeyPrefix}
      />
    );
  };
  return (
    <View ref={webRootRef} style={styles.screen}>
      <View style={[styles.gradientFill, Platform.OS !== "web" ? { backgroundColor: shellColors[0] || HOME_HEADER_BG_LIGHT } : null]}>
        {Platform.OS === "web" ? (
          <LinearGradient
            colors={shellColors}
            locations={CUSTOMER_SHELL_GRADIENT_LOCATIONS}
            start={{ x: 0.06, y: 0 }}
            end={{ x: 0.94, y: 1 }}
            style={StyleSheet.absoluteFillObject}
          />
        ) : null}
        {Platform.OS === "web" ? (
          <LinearGradient
            colors={
              isDark
                ? ["rgba(0,0,0,0.2)", "transparent", "transparent", "rgba(0,0,0,0.48)"]
                : ["rgba(63, 63, 70, 0.035)", "transparent", "transparent", "rgba(63, 63, 70, 0.075)"]
            }
            locations={[0, 0.18, 0.65, 1]}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 1 }}
            style={[StyleSheet.absoluteFillObject, styles.peNone]}
          />
        ) : null}
        {Platform.OS !== "web" ? (
          <View style={styles.pullRefreshOverlay} pointerEvents="none">
            {showPullCheck ? (
              <Ionicons name="checkmark" size={16} color={c.accent || "#C8A97E"} />
            ) : (
              <ProgressRing
                size={20}
                reducedMotion={reducedMotion}
                progress={isPullRefreshing ? 1 : pullProgress}
                spinning={isPullRefreshing}
                accessible={false}
                style={{ opacity: isPullRefreshing || pullProgress > 0.02 ? 1 : 0 }}
              />
            )}
          </View>
        ) : null}
        <MotionScrollView
        ref={scrollRef}
        style={styles.scrollMain}
        scrollEventThrottle={16}
        onScrollJS={handleHomeScroll}
        onScrollEndDrag={(event) => {
          const y = Number(event?.nativeEvent?.contentOffset?.y || 0);
          if (y < -74 && !isPullRefreshing) {
            performPullRefresh();
          }
        }}
        contentContainerStyle={[
          customerPageScrollBase,
          {
            paddingTop:
              Platform.OS === "web"
                ? customerScrollPaddingTop(insets, { webMin: spacing.md })
                : homeSpacing["3xl"],
            paddingBottom: homeContentBottomPadding,
            paddingHorizontal: homeOuterHorizontalPadding,
            maxWidth: safeWindowWidth >= 1024 ? 1200 : undefined,
            alignSelf: "center",
            width: "100%",
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View
          ref={webHeaderRef}
          nativeID="home-hero"
          style={[styles.headerWrap, { paddingTop: Platform.OS === "web" ? 0 : Math.max(safeTopInset, spacing.md) }]}
        >
          {Platform.OS !== "web" ? (
            <View
              style={[
                styles.headerAmbientCard,
                headerScrolled ? styles.headerAmbientCardScrolled : null,
                isDark ? styles.headerAmbientCardDark : styles.headerAmbientCardLight,
              ]}
            >
                <View style={styles.topBarShellNested}>
                  <View style={styles.alchemyTopBar}>
                    <Pressable
                      onPress={openMenu}
                      style={({ pressed }) => [styles.alchemyIconBtn, pressed && { opacity: 0.75 }]}
                      hitSlop={10}
                      accessibilityRole="button"
                      accessibilityLabel={HOME_SEARCH_UI.openMenuA11y}
                    >
                      <Ionicons name="menu-outline" size={22} color={HOME_HEADER_INK} />
                    </Pressable>
                    <View style={styles.wordmarkBlock}>
                      <BrandWordmark sizeKey="homeTopBar" style={styles.topBarLogo} color={HOME_HEADER_INK} />
                      {HOME_WORDMARK_TAGLINE ? (
                        <Text
                          style={styles.topBarTagline}
                          numberOfLines={2}
                          ellipsizeMode="tail"
                        >
                          {HOME_WORDMARK_TAGLINE}
                        </Text>
                      ) : null}
                    </View>
                    <Pressable
                      onPress={() => navigation.navigate("Cart")}
                      style={({ pressed }) => [styles.alchemyIconBtn, pressed && { opacity: 0.75 }]}
                      hitSlop={10}
                      accessibilityRole="button"
                      accessibilityLabel={
                        totalItems > 0
                          ? `${HOME_SEARCH_UI.cartA11yLabel}, ${totalItems} ${HOME_SEARCH_UI.cartA11yItemsSuffix}`
                          : HOME_SEARCH_UI.cartA11yLabel
                      }
                    >
                      <Animated.View style={[styles.cartBtnInner, cartBounceStyle]}>
                        <Ionicons name="bag-outline" size={22} color={HOME_HEADER_INK} />
                        {totalItems > 0 ? (
                          <View
                            style={[
                              styles.cartBadge,
                              {
                                backgroundColor: c.primary,
                                borderColor: isDark ? c.background : c.surface,
                              },
                            ]}
                          >
                            <Text style={styles.cartBadgeText}>{totalItems > 99 ? "99+" : String(totalItems)}</Text>
                          </View>
                        ) : null}
                      </Animated.View>
                    </Pressable>
                  </View>
                </View>
                <View style={[styles.headerInnerDivider, isDark ? styles.headerInnerDividerDark : null]} />
                <View style={styles.searchWrap}>
                  <HomeSearchHeader
                    colors={c}
                    isDark={isDark}
                    deliveryAddress={deliveryAddress}
                    unreadCount={unreadNotificationCount}
                    onPressAddress={openAddressSelector}
                    onPressBell={openNotifications}
                    onSubmitSearch={onSearchSubmit}
                    value={query}
                    onChangeSearch={setQuery}
                  />
                </View>
            </View>
          ) : null}
          {showMarketing && isOutOfArea ? (
            <View
              style={[
                styles.outOfAreaBanner,
                {
                  borderColor: c.accent || "#C8A97E",
                  backgroundColor: c.accentSoft || "rgba(200,169,126,0.14)",
                },
              ]}
            >
              <Ionicons
                name={HOME_EMPTY_STATES.outOfArea.icon}
                size={18}
                color={c.accent || "#C8A97E"}
                style={styles.outOfAreaIcon}
              />
              <Text style={[styles.outOfAreaText, { color: c.textPrimary }]}>
                {HOME_EMPTY_STATES.outOfArea.message}
              </Text>
              <Pressable
                onPress={openOutOfAreaNotify}
                style={({ pressed }) => [styles.outOfAreaLinkBtn, pressed ? styles.outOfAreaLinkBtnPressed : null]}
                accessibilityRole="button"
                accessibilityLabel={HOME_EMPTY_STATES.outOfArea.notifyCta}
              >
                <Text style={[styles.outOfAreaLinkText, { color: c.accent || "#C8A97E" }]}>
                  {HOME_EMPTY_STATES.outOfArea.notifyCta}
                </Text>
              </Pressable>
            </View>
          ) : null}

          <SectionEnter sectionKey="home-hero" scrollY={scrollY} windowHeight={safeWindowHeight}>
            <HomeMarketingHero
              onHeroPressIn={pauseHeroAutoAdvance}
              onHeroPressOut={resumeHeroAutoAdvance}
              goToHeroSlide={goToHeroSlide}
              handleHeroSlideAction={handleHeroSlideAction}
              heroSlideHeight={safeHeroSlideHeight}
              heroSlideIndex={heroSlideIndex}
              heroSliderRef={heroSliderRef}
              heroSliderWidth={heroSliderWidth}
              heroSlides={heroSlides}
              homeViewConfig={homeViewConfig}
              isDark={isDark}
              windowWidth={safeWindowWidth}
              reducedMotion={reducedMotion}
              setHeroSlideIndex={setHeroSlideIndex}
              setHeroSliderWidth={setHeroSliderWidth}
              showMarketing={showMarketing}
              styles={styles}
              webHeroRef={webHeroRef}
            />
          </SectionEnter>

          {showMarketing && !query.trim() ? (
            <SectionEnter sectionKey="home-categories" scrollY={scrollY} windowHeight={safeWindowHeight} style={styles.categoryQuickNavWrap}>
              <HomeCategoryGrid
                categories={HOME_CATEGORY_QUICK_NAV}
                overline={HOME_CATEGORY_UI.overline}
                title={HOME_CATEGORY_UI.title}
                viewAllLabel={HOME_CATEGORY_UI.viewAllLabel}
                onPressCategory={onCategoryPress}
                onPressViewAll={openAllCategories}
              />
            </SectionEnter>
          ) : null}
          {isAuthenticated && showMarketing && !query.trim() && reorderItems.length > 0 ? (
            <SectionEnter sectionKey="home-reorder" scrollY={scrollY} windowHeight={safeWindowHeight}>
              <HomeReorderStrip
                items={reorderItems}
                overline={HOME_REORDER_STRIP.overline}
                title={HOME_REORDER_STRIP.title}
                onAdd={handleReorderAdd}
                carouselBottomPadding={homeCarouselBottomPadding}
              />
            </SectionEnter>
          ) : null}
          {isAuthenticated && liveOrder ? (
            <SectionEnter sectionKey="home-live-order" scrollY={scrollY} windowHeight={safeWindowHeight}>
              <View style={styles.liveOrderPinnedWrap}>
                <HomeLiveOrderPinnedCard order={liveOrder} onPress={() => navigation.navigate("Profile", { screen: ACCOUNT_NESTED.Orders })} />
              </View>
            </SectionEnter>
          ) : null}

          {query.trim() ? (
            <TouchableOpacity
              style={styles.activeFilterBar}
              onPress={() => setQuery("")}
              activeOpacity={0.85}
              accessibilityRole="button"
              accessibilityLabel={HOME_SEARCH_UI.clearSearchCta}
            >
              <Ionicons name="search-outline" size={icon.xs} color={c.primary} />
              <Text style={styles.activeFilterText} numberOfLines={1}>
                {fillPlaceholders(HOME_SEARCH_UI.catalogResultsTitle, {
                  count: totalMatches,
                  query: query.trim(),
                })}
              </Text>
              <Text style={styles.activeFilterClear}>{HOME_SEARCH_UI.activeFilterClear}</Text>
            </TouchableOpacity>
          ) : null}
          {sectionFilter ? (
            <TouchableOpacity
              style={styles.sectionFilterBar}
              onPress={clearSectionFilter}
              activeOpacity={0.85}
              accessibilityRole="button"
              accessibilityLabel={HOME_SEARCH_UI.sectionEmptyCta}
            >
              <Ionicons name="layers-outline" size={icon.xs} color={c.secondary} />
              <Text style={styles.activeFilterText} numberOfLines={1}>
                {sectionFilter}
              </Text>
              <Text style={styles.sectionFilterClear}>{HOME_SEARCH_UI.activeFilterClear}</Text>
            </TouchableOpacity>
          ) : null}
          {categoryFilter ? (
            <TouchableOpacity
              style={styles.sectionFilterBar}
              onPress={clearCategoryFilter}
              activeOpacity={0.85}
              accessibilityRole="button"
              accessibilityLabel={HOME_SEARCH_UI.sectionEmptyCta}
            >
              <Ionicons name="grid-outline" size={icon.xs} color={c.secondary} />
              <Text style={styles.activeFilterText} numberOfLines={1}>
                {categoryFilter}
              </Text>
              <Text style={styles.sectionFilterClear}>{HOME_SEARCH_UI.activeFilterClear}</Text>
            </TouchableOpacity>
          ) : null}
          {error && showingCachedItems ? (
            <View
              style={[
                styles.homeErrorBanner,
                {
                  borderColor: c.accent || "#C8A97E",
                  backgroundColor: c.accentSoft || "rgba(200,169,126,0.14)",
                },
              ]}
            >
              <Ionicons name={HOME_EMPTY_STATES.networkError.icon} size={icon.md} color={c.textMuted} style={styles.homeErrorIcon} />
              <Text style={[styles.errorText, { color: c.textPrimary }]}>{HOME_EMPTY_STATES.networkError.cachedBanner}</Text>
            </View>
          ) : null}
        </View>

        {loading ? (
          <View
            onLayout={(e) => {
              featuredYRef.current = e.nativeEvent.layout.y;
            }}
          >
            <View style={styles.catalogIntroCard}>
              <View style={styles.catalogIntroBanner}>
                <View style={styles.catalogIntroLeft}>
                  <Text style={styles.catalogIntroEyebrow}>{HOME_SEARCH_UI.catalogOverlineDefault}</Text>
                  <Text style={styles.catalogIntroTitle}>
                    {showMarketing ? HOME_SEARCH_UI.catalogIntroStarterTitle : HOME_CATALOG_INTRO.all}
                  </Text>
                </View>
                <View style={styles.catalogViewToggleWrap}>
                  <CatalogViewToggleButton
                    onPress={() => setCatalogCardStyle("comfortable")}
                    onHoverIn={() =>
                      Platform.OS === "web" ? setViewToggleTooltip(HOME_SEARCH_UI.viewToggle.comfortableTooltip) : null
                    }
                    onHoverOut={() => (Platform.OS === "web" ? setViewToggleTooltip("") : null)}
                    isActive={homeViewConfig.productCardStyle === "comfortable"}
                    accessibilityLabel={HOME_SEARCH_UI.viewToggle.comfortableLabel}
                    iconName="albums-outline"
                    styles={styles}
                    iconSize={icon.sm}
                    c={c}
                  />
                  <CatalogViewToggleButton
                    onPress={() => setCatalogCardStyle("compact")}
                    onHoverIn={() =>
                      Platform.OS === "web" ? setViewToggleTooltip(HOME_SEARCH_UI.viewToggle.compactTooltip) : null
                    }
                    onHoverOut={() => (Platform.OS === "web" ? setViewToggleTooltip("") : null)}
                    isActive={homeViewConfig.productCardStyle === "compact"}
                    accessibilityLabel={HOME_SEARCH_UI.viewToggle.compactLabel}
                    iconName="grid-outline"
                    styles={styles}
                    iconSize={icon.sm}
                    c={c}
                  />
                  {Platform.OS === "web" && viewToggleTooltip ? (
                    <View style={styles.catalogViewToggleTooltip}>
                      <Text style={styles.catalogViewToggleTooltipText}>{viewToggleTooltip}</Text>
                    </View>
                  ) : null}
                </View>
              </View>
            </View>
            <View style={styles.catalogSurface}>
              <HomeSectionHeader
                overline={HOME_SEARCH_UI.catalogOverlineDefault}
                title={HOME_SEARCH_UI.allProductsTitle}
                compact
              />
              <View style={styles.catalogSkeletonGrid}>
                {Array.from({ length: Platform.OS === "web" ? 6 : 4 }).map((_, idx) => (
                  <View key={`home-skeleton-${idx}`} style={styles.catalogSkeletonCard}>
                    <SkeletonBlock height={120} borderRadius={14} />
                    <View style={styles.catalogSkeletonMeta}>
                      <SkeletonBlock height={12} borderRadius={8} width="65%" />
                      <SkeletonBlock height={16} borderRadius={8} width="92%" />
                      <SkeletonBlock height={16} borderRadius={8} width="72%" />
                    </View>
                  </View>
                ))}
              </View>
            </View>
          </View>
        ) : hasNetworkErrorWithoutCache ? (
          <View style={[styles.catalogSurface, styles.emptyWrap, styles.networkErrorWrap]}>
            <NetworkErrorState onRetry={() => loadHomeData()} />
          </View>
        ) : totalMatches > 0 ? (
          <View
            onLayout={(e) => {
              featuredYRef.current = e.nativeEvent.layout.y;
            }}
          >
            <View style={styles.catalogIntroCard}>
              <View style={styles.catalogIntroBanner}>
                <View style={styles.catalogIntroLeft}>
                  <Text style={styles.catalogIntroEyebrow}>{HOME_SEARCH_UI.catalogOverlineDefault}</Text>
                  <Text style={styles.catalogIntroTitle}>
                    {showMarketing ? HOME_SEARCH_UI.catalogIntroStarterTitle : HOME_CATALOG_INTRO.all}
                  </Text>
                </View>
                <View style={styles.catalogViewToggleWrap}>
                  <CatalogViewToggleButton
                    onPress={() => setCatalogCardStyle("comfortable")}
                    onHoverIn={() =>
                      Platform.OS === "web" ? setViewToggleTooltip(HOME_SEARCH_UI.viewToggle.comfortableTooltip) : null
                    }
                    onHoverOut={() => (Platform.OS === "web" ? setViewToggleTooltip("") : null)}
                    isActive={homeViewConfig.productCardStyle === "comfortable"}
                    accessibilityLabel={HOME_SEARCH_UI.viewToggle.comfortableLabel}
                    iconName="albums-outline"
                    styles={styles}
                    iconSize={icon.sm}
                    c={c}
                  />
                  <CatalogViewToggleButton
                    onPress={() => setCatalogCardStyle("compact")}
                    onHoverIn={() =>
                      Platform.OS === "web" ? setViewToggleTooltip(HOME_SEARCH_UI.viewToggle.compactTooltip) : null
                    }
                    onHoverOut={() => (Platform.OS === "web" ? setViewToggleTooltip("") : null)}
                    isActive={homeViewConfig.productCardStyle === "compact"}
                    accessibilityLabel={HOME_SEARCH_UI.viewToggle.compactLabel}
                    iconName="grid-outline"
                    styles={styles}
                    iconSize={icon.sm}
                    c={c}
                  />
                  {Platform.OS === "web" && viewToggleTooltip ? (
                    <View style={styles.catalogViewToggleTooltip}>
                      <Text style={styles.catalogViewToggleTooltipText}>{viewToggleTooltip}</Text>
                    </View>
                  ) : null}
                </View>
              </View>
            </View>
            {(sectionFilter || categoryFilter) && sectionsForRender.length === 0 ? (
              <View style={[styles.catalogSurface, styles.emptySectionHint]}>
                <EmptyState
                  iconName="layers-outline"
                  title={fillPlaceholders(
                    sectionFilter ? HOME_SEARCH_UI.sectionEmptyTitle : HOME_SEARCH_UI.categoryEmptyTitle,
                    { section: sectionFilter || categoryFilter }
                  )}
                  description={sectionFilter ? HOME_SEARCH_UI.sectionEmptyDescription : HOME_SEARCH_UI.categoryEmptyDescription}
                  ctaLabel={HOME_SEARCH_UI.sectionEmptyCta}
                  ctaIconLeft="close-circle-outline"
                  onCtaPress={sectionFilter ? clearSectionFilter : clearCategoryFilter}
                  compact
                />
              </View>
            ) : homeViewConfig.showHomeSections && sectionsForRender.length > 0 ? (
              <View nativeID="home-sections">
              {sectionsForRender.map((section, sIdx) => (
                <SectionEnter
                  key={section.title}
                  sectionKey={`home-section-${String(section.title).toLowerCase()}`}
                  scrollY={scrollY}
                  windowHeight={safeWindowHeight}
                  style={styles.listSection}
                >
                  <View
                    ref={(node) => setWebCatalogRef(sIdx, node)}
                    style={styles.catalogSurface}
                  >
                    <HomeSectionHeader
                      overline={sIdx === 0 ? HOME_SEARCH_UI.sectionOverlineFirst : HOME_SEARCH_UI.sectionOverlineOther}
                      title={section.title}
                      count={section.items.length}
                      onSeeAll={
                        section.items.length > 3
                          ? () =>
                              navigation.navigate({
                                name: "Home",
                                merge: true,
                                params: { filterHomeSection: String(section.title).trim() },
                              })
                          : undefined
                      }
                    />
                    {renderCatalogItems(section.items, `sec-${section.title}`)}
                  </View>
                </SectionEnter>
              ))}
              </View>
            ) : (
              <SectionEnter
                nativeID="home-sections"
                collapsable={false}
                sectionKey="home-section-catalog"
                scrollY={scrollY}
                windowHeight={safeWindowHeight}
                style={styles.listSection}
              >
                <View ref={(node) => setWebCatalogRef(0, node)} style={styles.catalogSurface}>
                  <HomeSectionHeader
                    overline={
                      homeViewConfig.showPrimeSection ? HOME_SEARCH_UI.primeOverline : HOME_SEARCH_UI.catalogSectionOverlineDefault
                    }
                    title={homeViewConfig.showPrimeSection ? homeViewConfig.primeSectionTitle : HOME_SEARCH_UI.allProductsTitle}
                    count={productsForHome.length}
                  />
                  {renderCatalogItems(productsForHome, "shop")}
                </View>
              </SectionEnter>
            )}
          </View>
        ) : noSearchResults ? (
          <View
            onLayout={(e) => {
              featuredYRef.current = e.nativeEvent.layout.y;
            }}
          >
            <View style={[styles.catalogSurface, styles.emptyWrap, styles.searchEmptyWrap]}>
              <Ionicons name={HOME_EMPTY_STATES.noSearchResults.icon} size={48} color={c.textMuted} />
              <Text style={[styles.searchEmptyTitle, { color: c.textPrimary }]}>
                {HOME_EMPTY_STATES.noSearchResults.title}
              </Text>
              <Text style={[styles.searchEmptyBody, { color: c.textSecondary }]}>
                {HOME_EMPTY_STATES.noSearchResults.body}
              </Text>
              <Pressable
                onPress={() => setQuery("")}
                style={({ pressed }) => [
                  styles.searchEmptyClearBtn,
                  {
                    borderColor: c.border,
                    backgroundColor: isDark ? "rgba(255,255,255,0.04)" : "rgba(255,255,255,0.9)",
                  },
                  pressed ? styles.searchEmptyClearBtnPressed : null,
                ]}
                accessibilityRole="button"
                accessibilityLabel={HOME_EMPTY_STATES.noSearchResults.clearCta}
              >
                <Text style={[styles.searchEmptyClearBtnText, { color: c.textPrimary }]}>
                  {HOME_EMPTY_STATES.noSearchResults.clearCta}
                </Text>
              </Pressable>
            </View>
            <SectionEnter sectionKey="home-categories-no-search" scrollY={scrollY} windowHeight={safeWindowHeight} style={styles.categoryQuickNavWrap}>
              <HomeCategoryGrid
                categories={HOME_CATEGORY_QUICK_NAV}
                overline={HOME_CATEGORY_UI.overline}
                title={HOME_CATEGORY_UI.title}
                viewAllLabel={HOME_CATEGORY_UI.viewAllLabel}
                onPressCategory={onCategoryPress}
                onPressViewAll={openAllCategories}
              />
            </SectionEnter>
            {bestSellersFallback.length > 0 ? (
              <SectionEnter sectionKey="home-bestsellers-no-search" scrollY={scrollY} windowHeight={safeWindowHeight} style={styles.listSection}>
                <View ref={(node) => setWebCatalogRef(0, node)} style={styles.catalogSurface}>
                  <HomeSectionHeader
                    overline={HOME_EMPTY_STATES.noSearchResults.bestsellersOverline}
                    title={HOME_EMPTY_STATES.noSearchResults.bestsellersTitle}
                    count={bestSellersFallback.length}
                  />
                  {renderCatalogItems(bestSellersFallback, "no-search-bestsellers")}
                </View>
              </SectionEnter>
            ) : null}
          </View>
        ) : (
          <View ref={(node) => setWebCatalogRef(0, node)} style={[styles.catalogSurface, styles.emptyWrap]}>
            <EmptyState
              iconName={query.trim() ? "search-outline" : "cube-outline"}
              title={
                filteredProducts.length > 0 && productsForHome.length === 0
                  ? HOME_SEARCH_UI.emptyHomeCuratedTitle
                  : query.trim()
                    ? HOME_SEARCH_UI.emptySearchTitle
                    : HOME_SEARCH_UI.emptyCatalogTitle
              }
              description={
                filteredProducts.length > 0 && productsForHome.length === 0
                  ? HOME_SEARCH_UI.emptyHomeCuratedDescription
                  : query.trim()
                    ? HOME_SEARCH_UI.emptySearchDescription
                    : HOME_SEARCH_UI.emptyCatalogDescription
              }
              ctaLabel={query.trim() ? HOME_SEARCH_UI.clearSearchCta : undefined}
              ctaIconLeft={query.trim() ? "close-circle-outline" : undefined}
              onCtaPress={query.trim() ? () => setQuery("") : undefined}
            />
          </View>
        )}

        {showMarketing && !query.trim() ? (
          <SectionEnter sectionKey="home-trust" scrollY={scrollY} windowHeight={safeWindowHeight}>
            <HomeTrustStrip
              c={c}
              forwardedRef={webTrustRef}
              isDark={isDark}
              reducedMotion={reducedMotion}
              styles={styles}
            />
          </SectionEnter>
        ) : null}

        {showMarketing && !query.trim() ? (
          <GoldHairline marginVertical={spacing.md} withDot={false} />
        ) : null}

        {showMarketing && !query.trim() ? (
          <SectionEnter sectionKey="home-stats" scrollY={scrollY} windowHeight={safeWindowHeight}>
            <HomeStatsStrip c={c} isDark={isDark} />
          </SectionEnter>
        ) : null}

        {showMarketing && !query.trim() ? (
          <SectionEnter sectionKey="home-testimonials" scrollY={scrollY} windowHeight={safeWindowHeight}>
            <HomeTestimonials c={c} isDark={isDark} carouselBottomPadding={homeCarouselBottomPadding} />
          </SectionEnter>
        ) : null}

        {Platform.OS === "web" ? (
          <View style={[styles.footerFadeBridge, styles.peNone]}>
            <LinearGradient
              colors={[
                "rgba(0,0,0,0)",
                isDark ? "rgba(8, 6, 5, 0.42)" : "rgba(63, 63, 70, 0.04)",
              ]}
              start={{ x: 0.5, y: 0 }}
              end={{ x: 0.5, y: 1 }}
              style={StyleSheet.absoluteFill}
            />
          </View>
        ) : null}

        <View ref={webFooterRef} style={styles.footerWrapper}>
          <AppFooter />
        </View>
        </MotionScrollView>
        <HomeMicroBar
          visible={totalItems > 0 && scrollY > safeHeroSlideHeight}
          totalItems={totalItems}
          totalAmount={totalAmount}
          styles={styles}
          accentColor={c.accent || "#C8A97E"}
          isAuthenticated={isAuthenticated}
          onViewBag={() => (isAuthenticated ? navigation.navigate("Cart") : navigation.navigate("Login"))}
        />
        <BottomNavBar />
        {flyGhost ? (
          <Animated.View pointerEvents="none" style={[styles.flyGhost, flyGhostStyle]}>
            {flyGhost.imageUri ? (
              <Image source={{ uri: flyGhost.imageUri }} style={styles.flyGhostImage} contentFit="cover" transition={0} />
            ) : (
              <View style={[styles.flyGhostImage, { backgroundColor: c.surfaceAlt }]} />
            )}
          </Animated.View>
        ) : null}
        {toastQueue.length > 0 ? (
          <View style={[styles.toastStackRoot, styles.peBoxNone, { bottom: toastStackBottomOffset }]}>
            <View style={[styles.toastStackColumn, styles.peBoxNone]}>
              {toastQueue.map((toastItem) => (
                <Animated.View
                  key={toastItem.id}
                  entering={FadeInDown.duration(240).easing(Easing.bezier(0.2, 0.8, 0.2, 1))}
                  exiting={FadeOutDown.duration(220).easing(Easing.bezier(0.2, 0.8, 0.2, 1))}
                  style={styles.toastCard}
                >
                  <Pressable
                    onHoverIn={() => (Platform.OS === "web" ? pauseToastDismiss(toastItem.id) : null)}
                    onHoverOut={() => (Platform.OS === "web" ? resumeToastDismiss(toastItem.id) : null)}
                    onPressIn={() => (Platform.OS !== "web" ? pauseToastDismiss(toastItem.id) : null)}
                    onPressOut={() => (Platform.OS !== "web" ? resumeToastDismiss(toastItem.id) : null)}
                    style={styles.toastCardInner}
                  >
                    <Ionicons name="checkmark-circle" size={18} color={HERITAGE.amberBright} />
                    <Text style={styles.toastText} numberOfLines={1}>
                      {toastItem.message}
                    </Text>
                    <Pressable
                      onPressIn={() => pauseToastDismiss(toastItem.id)}
                      onPressOut={() => resumeToastDismiss(toastItem.id)}
                      onPress={() => {
                        removeToast(toastItem.id);
                        if (isAuthenticated) {
                          navigation.navigate("Cart");
                        } else {
                          navigation.navigate("Login");
                        }
                      }}
                      accessibilityRole="button"
                      accessibilityLabel={HOME_TOAST.viewBag}
                      style={({ pressed }) => [styles.toastActionBtn, pressed ? styles.toastActionBtnPressed : null]}
                    >
                      <Text style={styles.toastActionText}>{toastItem.actionLabel || HOME_TOAST.viewBag}</Text>
                    </Pressable>
                  </Pressable>
                </Animated.View>
              ))}
            </View>
          </View>
        ) : null}
      </View>

      <Modal
        visible={outOfAreaNotifyOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setOutOfAreaNotifyOpen(false)}
      >
        <View style={styles.notifyModalRoot}>
          <Pressable style={styles.notifyModalBackdrop} onPress={() => setOutOfAreaNotifyOpen(false)} />
          <View style={[styles.notifyModalCard, { backgroundColor: c.surface, borderColor: c.border }]}>
            <Text style={[styles.notifyModalTitle, { color: c.textPrimary }]}>
              {HOME_EMPTY_STATES.outOfArea.modalTitle}
            </Text>
            <Text style={[styles.notifyModalBody, { color: c.textSecondary }]}>
              {HOME_EMPTY_STATES.outOfArea.modalBody}
            </Text>
            {outOfAreaNotifySubmitted ? (
              <Text style={[styles.notifyModalSuccess, { color: c.secondary || c.accent || "#16A34A" }]}>
                {HOME_EMPTY_STATES.outOfArea.success}
              </Text>
            ) : (
              <TextInput
                value={outOfAreaEmail}
                onChangeText={setOutOfAreaEmail}
                placeholder={HOME_EMPTY_STATES.outOfArea.emailPlaceholder}
                placeholderTextColor={c.textMuted}
                autoCapitalize="none"
                keyboardType="email-address"
                style={[
                  styles.notifyModalInput,
                  {
                    color: c.textPrimary,
                    borderColor: c.border,
                    backgroundColor: isDark ? "rgba(255,255,255,0.04)" : "#FFFFFF",
                  },
                ]}
              />
            )}
            <View style={styles.notifyModalActions}>
              {!outOfAreaNotifySubmitted ? (
                <Pressable
                  onPress={submitOutOfAreaNotify}
                  style={({ pressed }) => [
                    styles.notifyModalPrimaryBtn,
                    { backgroundColor: c.ink || "#0E1729" },
                    pressed ? styles.notifyModalBtnPressed : null,
                  ]}
                >
                  <Text style={styles.notifyModalPrimaryText}>{HOME_EMPTY_STATES.outOfArea.submitCta}</Text>
                </Pressable>
              ) : null}
              <Pressable
                onPress={() => setOutOfAreaNotifyOpen(false)}
                style={({ pressed }) => [
                  styles.notifyModalGhostBtn,
                  { borderColor: c.border },
                  pressed ? styles.notifyModalBtnPressed : null,
                ]}
              >
                <Text style={[styles.notifyModalGhostText, { color: c.textPrimary }]}>
                  {HOME_EMPTY_STATES.outOfArea.closeCta}
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        visible={menuOpen}
        transparent
        animationType="fade"
        onRequestClose={closeMenu}
        statusBarTranslucent={Platform.OS === "android"}
        {...(Platform.OS === "ios" ? { presentationStyle: "overFullScreen" } : {})}
      >
        <View style={styles.menuModalRoot}>
          <Pressable
            style={styles.menuBackdrop}
            onPress={closeMenu}
            accessibilityLabel={HOME_TOAST.closeMenu}
          />
          <View style={[styles.menuLayer, styles.peBoxNone]}>
            <View
              style={[
                styles.menuDropdown,
                {
                  top:
                    Math.max(safeTopInset, Platform.OS === "web" ? spacing.md : spacing.sm) + HOME_MENU_TOP_OFFSET,
                  left: spacing.lg,
                  backgroundColor: isDark ? c.surface : ALCHEMY.cardBg,
                  borderColor: isDark ? c.border : ALCHEMY.pillInactive,
                },
              ]}
              collapsable={false}
            >
              {Platform.OS === "web" ? (
                <LinearGradient
                  colors={[ALCHEMY.gold, ALCHEMY.brown]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.menuGoldAccent}
                />
              ) : (
                <View style={[styles.menuGoldAccent, { backgroundColor: ALCHEMY.gold }]} />
              )}
              <View style={styles.menuHeaderRow}>
                <Text style={[styles.menuHeaderTitle, { color: c.textPrimary }]}>{HOME_SEARCH_UI.menuTitle}</Text>
                <Pressable
                  onPress={closeMenu}
                  style={({ pressed }) => [styles.menuCloseBtn, pressed && { opacity: 0.7 }]}
                  hitSlop={12}
                  accessibilityRole="button"
                  accessibilityLabel={HOME_TOAST.closeMenu}
                >
                  <Ionicons name="close" size={icon.lg} color={c.textSecondary} />
                </Pressable>
              </View>
              <Text style={[styles.menuSectionLabel, { color: c.textMuted }]}>{HOME_SEARCH_UI.menuAccountLabel}</Text>
              {HOME_MENU_LINKS.map((item) => (
                <Pressable
                  key={item.key}
                  style={({ pressed, hovered }) => [
                    styles.menuRow,
                    hovered && Platform.OS === "web" ? styles.menuRowHover : null,
                    pressed && styles.menuRowPressed,
                  ]}
                  onPress={() => {
                    closeMenu();
                    if (item.accountScreen) {
                      navigation.navigate(item.route, { screen: item.accountScreen });
                    } else {
                      navigation.navigate(item.route);
                    }
                  }}
                  accessibilityRole="button"
                  accessibilityLabel={item.label}
                >
                  <View style={[styles.menuIconCircle, { backgroundColor: isDark ? c.surfaceMuted : ALCHEMY.creamAlt }]}>
                    <Ionicons name={item.icon} size={icon.md} color={isDark ? c.textPrimary : ALCHEMY.brown} />
                  </View>
                  <View style={styles.menuRowTextCol}>
                    <Text style={[styles.menuRowTitle, { color: c.textPrimary }]}>{item.label}</Text>
                    <Text style={[styles.menuRowValue, { color: c.textMuted }]}>{item.hint}</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={icon.sm} color={c.textMuted} />
                </Pressable>
              ))}
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}
