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
import MotionScrollView from "../components/motion/MotionScrollView";
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
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import HomePageFooter from "../components/home/HomePageFooter";
import HomeCategoryGrid from "../components/home/HomeCategoryGrid";
import HomeReorderStrip from "../components/home/HomeReorderStrip";
import HomeLiveOrderPinnedCard from "../components/home/HomeLiveOrderPinnedCard";
import HomeSectionHeader from "../components/home/HomeSectionHeader";
import HomeStatsStrip from "../components/home/HomeStatsStrip";
import HomeTestimonials from "../components/home/HomeTestimonials";
import BottomNavBar from "../components/BottomNavBar";
import HomeSearchHeader from "../components/home/HomeSearchHeader";
import BrandWordmark from "../components/BrandWordmark";
import SkeletonBlock from "../components/ui/SkeletonBlock";
import PremiumEmptyState from "../components/ui/PremiumEmptyState";
import useReducedMotion from "../hooks/useReducedMotion";
import { getHomeViewConfig, getProducts } from "../services/productService";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { fonts, icon, layout, lineHeight, radius, semanticRadius, spacing, typography } from "../theme/tokens";
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
} from "../content/appContent";
import {
  BRAND_HOME_TOP_BAR_LAYOUT_HEIGHT,
} from "../constants/brand";
import {
  HOME_HERO_MOBILE_SLIDER_SLIDES,
  HOME_HERO_WEB_SLIDER_SLIDES,
} from "../constants/marketingAssets";
import { HOME_CATALOG_ALL, matchesShelfProduct } from "../utils/shelfMatch";
import { productToCartLine } from "../utils/productCart";
import { formatINRWhole } from "../utils/currency";
import {
  ALCHEMY,
  CUSTOMER_SHELL_GRADIENT_LOCATIONS,
  FONT_DISPLAY,
  FONT_DISPLAY_SEMI,
  HERITAGE,
  getCustomerShellGradient,
} from "../theme/customerAlchemy";
import {
  CUSTOMER_BOTTOM_NAV_BAR_HEIGHT,
  customerPageScrollBase,
  customerScrollPaddingTop,
} from "../theme/screenLayout";
import { WEB_HEADER_HEIGHT, WEB_Z_INDEX } from "../theme/web";
import GoldHairline from "../components/ui/GoldHairline";
import HomeMarketingHero from "../components/home/HomeMarketingHero";
import HomeTrustStrip from "../components/home/HomeTrustStrip";
import { HomeCatalogResponsiveGrid } from "../components/home/HomeCatalogProductViews";
import ProgressRing from "../components/feedback/ProgressRing";
import SectionEnter from "../components/motion/SectionEnter";
import { fetchMyNotifications, fetchMyOrders } from "../services/userService";
import { spacing as homeSpacing } from "../styles/spacing";
import { applyRouteMeta } from "../utils/webMeta";

if (Platform.OS === "web") {
  gsap.registerPlugin(ScrollTrigger);
}

/** Room for optional tagline under home wordmark (keeps hamburger & cart aligned). */
const HOME_TOPBAR_TAGLINE_ROOM = 4;
/** Distance from top of screen to first row of menu (below home bar + gap). */
const HOME_MENU_TOP_OFFSET =
  BRAND_HOME_TOP_BAR_LAYOUT_HEIGHT + HOME_TOPBAR_TAGLINE_ROOM + spacing.sm * 2 + spacing.xs;
const HOME_HEADER_BG_LIGHT = "#FAFAF7";
const HOME_HEADER_INK = "#0E0E0E";
const HOME_LINE = "#E8E6E1";
const HOME_CACHE_KEY = "@zeevan/home/cache-v1";

/** Home lists the full catalog; `showOnHome` on each product still controls visibility. */
function matchesHomeShelf(product) {
  return matchesShelfProduct(product, HOME_CATALOG_ALL);
}

function CatalogViewToggleButton({
  isActive,
  onPress,
  onHoverIn,
  onHoverOut,
  accessibilityLabel,
  iconName,
  styles,
  iconSize,
  c,
}) {
  const progress = useSharedValue(isActive ? 1 : 0);

  useEffect(() => {
    progress.value = withTiming(isActive ? 1 : 0, { duration: 180 });
  }, [isActive, progress]);

  const animatedButtonStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(progress.value, [0, 1], [c.surface, HOME_HEADER_INK]),
    borderColor: interpolateColor(progress.value, [0, 1], [c.border, HOME_HEADER_INK]),
  }));

  const activeIconStyle = useAnimatedStyle(() => ({
    opacity: progress.value,
  }));

  const inactiveIconStyle = useAnimatedStyle(() => ({
    opacity: 1 - progress.value,
  }));

  return (
    <Pressable
      onPress={onPress}
      onHoverIn={onHoverIn}
      onHoverOut={onHoverOut}
      style={({ pressed }) => [styles.catalogViewToggleBtnTouch, pressed ? styles.catalogViewToggleBtnPressed : null]}
      accessibilityRole="button"
      accessibilityState={{ selected: isActive }}
      accessibilityLabel={accessibilityLabel}
    >
      <Animated.View style={[styles.catalogViewToggleBtn, animatedButtonStyle]}>
        <Animated.View style={[styles.catalogViewToggleIconLayer, inactiveIconStyle]}>
          <Ionicons name={iconName} size={iconSize} color={c.textSecondary} />
        </Animated.View>
        <Animated.View style={[styles.catalogViewToggleIconLayer, activeIconStyle]}>
          <Ionicons name={iconName} size={iconSize} color="#FFFFFF" />
        </Animated.View>
      </Animated.View>
    </Pressable>
  );
}

export default function HomeScreen({ navigation }) {
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

  useFocusEffect(
    useCallback(() => {
      if (Platform.OS === "web") {
        applyRouteMeta("home");
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
  const cartBounceScale = useSharedValue(1);
  const cartBounceStyle = useAnimatedStyle(() => ({
    transform: [{ scale: cartBounceScale.value }],
  }));
  const flyGhostStyle = useAnimatedStyle(() => ({
    opacity: flyOpacity.value,
    transform: [{ translateX: flyX.value }, { translateY: flyY.value }, { scale: flyScale.value }],
  }));
  const saveRecentSearch = useCallback(async (nextQuery) => {
    const normalized = String(nextQuery || "").trim();
    if (!normalized) return;
    try {
      const raw = await AsyncStorage.getItem("@zeevan/home/recent-searches");
      const parsed = raw ? JSON.parse(raw) : [];
      const prev = Array.isArray(parsed) ? parsed.filter((item) => typeof item === "string") : [];
      const next = [normalized, ...prev.filter((item) => item.toLowerCase() !== normalized.toLowerCase())].slice(0, 5);
      await AsyncStorage.setItem("@zeevan/home/recent-searches", JSON.stringify(next));
    } catch {
      // non-blocking persistence only
    }
  }, []);

  const onSearchSubmit = useCallback(
    (value) => {
      const normalized = String(value || "").trim();
      setQuery(normalized);
      if (!normalized) return;
      saveRecentSearch(normalized);
      if (Platform.OS === "web" && typeof window !== "undefined") {
        const url = `/search?q=${encodeURIComponent(normalized)}`;
        window.history.replaceState({}, "", url);
      }
    },
    [saveRecentSearch]
  );

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
    navigation.navigate("ManageAddress");
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
      if (Platform.OS === "web" && typeof ScrollTrigger.refresh === "function") {
        ScrollTrigger.refresh();
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
    const ctx = gsap.context(() => {
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

    return () => {
      ctx.revert();
    };
  }, [reducedMotion, showMarketing]);

  useEffect(() => {
    if (Platform.OS !== "web" || reducedMotion || typeof ScrollTrigger.refresh !== "function") return;
    const frame = requestAnimationFrame(() => {
      ScrollTrigger.refresh();
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
          style={[styles.headerWrap, { paddingTop: Math.max(safeTopInset, spacing.md) }]}
        >
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
                    onPress={() => setMenuOpen(true)}
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
                <HomeLiveOrderPinnedCard order={liveOrder} onPress={() => navigation.navigate("MyOrders")} />
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
            <Ionicons
              name={HOME_EMPTY_STATES.networkError.icon}
              size={48}
              color={c.textMuted}
              style={styles.networkErrorIcon}
            />
            <Text style={[styles.networkErrorTitle, { color: c.textPrimary }]}>
              {HOME_EMPTY_STATES.networkError.title}
            </Text>
            <Text style={[styles.networkErrorBody, { color: c.textSecondary }]}>
              {HOME_EMPTY_STATES.networkError.body}
            </Text>
            <Pressable
              onPress={() => loadHomeData()}
              style={({ pressed }) => [
                styles.networkRetryBtn,
                { backgroundColor: c.ink || "#0E1729" },
                pressed ? styles.networkRetryBtnPressed : null,
              ]}
              accessibilityRole="button"
              accessibilityLabel={HOME_EMPTY_STATES.networkError.retryCta}
            >
              <Text style={styles.networkRetryBtnText}>{HOME_EMPTY_STATES.networkError.retryCta}</Text>
            </Pressable>
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
                <PremiumEmptyState
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
            <PremiumEmptyState
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
          <HomePageFooter colors={c} />
        </View>
        </MotionScrollView>
        {totalItems > 0 && scrollY > safeHeroSlideHeight ? (
          <Animated.View entering={FadeInDown.duration(260)} exiting={FadeOutDown.duration(220)} style={styles.stickyBagBar}>
            <Text style={styles.stickyBagText}>{`${totalItems} items · ${formatINRWhole(totalAmount)}`}</Text>
            <Pressable
              onPress={() => (isAuthenticated ? navigation.navigate("Cart") : navigation.navigate("Login"))}
              style={({ pressed }) => [styles.stickyBagCta, pressed ? styles.stickyBagCtaPressed : null]}
              accessibilityRole="button"
              accessibilityLabel="View bag"
            >
              <Text style={styles.stickyBagCtaText}>View Bag</Text>
              <Ionicons name="arrow-forward" size={14} color={c.accent || "#C8A97E"} />
            </Pressable>
          </Animated.View>
        ) : null}
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
          <View style={[styles.toastStackRoot, { bottom: toastStackBottomOffset }]} pointerEvents="box-none">
            <View style={styles.toastStackColumn} pointerEvents="box-none">
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
        onRequestClose={() => setMenuOpen(false)}
        statusBarTranslucent={Platform.OS === "android"}
        {...(Platform.OS === "ios" ? { presentationStyle: "overFullScreen" } : {})}
      >
        <View style={styles.menuModalRoot}>
          <Pressable
            style={styles.menuBackdrop}
            onPress={() => setMenuOpen(false)}
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
                  onPress={() => setMenuOpen(false)}
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
                    setMenuOpen(false);
                    navigation.navigate(item.route);
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

function createHomeStyles(c, shadowLift, shadowPremium, isDark, windowWidth = 0, insets = { top: 0, bottom: 0 }) {
  const sectionGap = windowWidth >= 600 ? homeSpacing["5xl"] : homeSpacing["4xl"];
  const cardPadding = windowWidth >= 600 ? homeSpacing.lg : homeSpacing.base;
  const productGridGap = windowWidth >= 600 ? homeSpacing.base : homeSpacing.md;
  const safeTopInset = Number(insets?.top || 0);
  const safeBottomInset = Number(insets?.bottom || 0);
  return StyleSheet.create({
    screen: {
      flex: 1,
      width: "100%",
      alignSelf: "stretch",
      maxWidth: "100%",
    },
    gradientFill: {
      flex: 1,
      width: "100%",
    },
    scrollMain: {
      flex: 1,
      width: "100%",
    },
    headerWrap: {
      paddingBottom: Platform.select({ web: homeSpacing.lg, default: homeSpacing.base }),
    },
    headerAmbientCard: {
      position: "relative",
      borderRadius: radius.xxl,
      overflow: "hidden",
      borderWidth: 0,
      marginBottom: spacing.md,
      ...Platform.select({
        ios: {
          shadowColor: "#18181B",
          shadowOffset: { width: 0, height: 10 },
          shadowOpacity: isDark ? 0.22 : 0.09,
          shadowRadius: 20,
        },
        android: { elevation: isDark ? 5 : 4 },
        web: {
          boxShadow: isDark
            ? "0 16px 44px rgba(0,0,0,0.32), inset 0 1px 0 rgba(255,255,255,0.05)"
            : "0 18px 48px rgba(9, 9, 11, 0.09), 0 5px 16px rgba(24, 24, 27, 0.04), inset 0 1px 0 rgba(255, 253, 251, 0.95), inset 0 0 0 1px rgba(255,255,255,0.45)",
        },
        default: {
          borderRadius: 0,
          borderWidth: 0,
          borderTopWidth: 0,
          marginBottom: spacing.sm,
        },
      }),
    },
    headerAmbientCardLight: {
      borderColor: HOME_LINE,
      backgroundColor: HOME_HEADER_BG_LIGHT,
      ...Platform.select({
        web: {
          backdropFilter: "none",
        },
        default: {
          backgroundColor: HOME_HEADER_BG_LIGHT,
        },
      }),
    },
    headerAmbientCardScrolled: {
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: HOME_LINE,
    },
    headerAmbientCardDark: {
      borderColor: HOME_LINE,
      backgroundColor: HOME_HEADER_BG_LIGHT,
    },
    topBarShellNested: {
      paddingTop: 4,
      paddingBottom: 4,
      paddingHorizontal: spacing.xs,
    },
    headerInnerDivider: {
      height: StyleSheet.hairlineWidth,
      marginHorizontal: spacing.lg,
      marginTop: spacing.xs,
      marginBottom: spacing.sm,
      backgroundColor: HOME_LINE,
    },
    headerInnerDividerDark: {
      backgroundColor: "rgba(255, 255, 255, 0.1)",
    },
    cartBtnInner: {
      width: 44,
      minHeight: 40,
      alignItems: "center",
      justifyContent: "center",
      position: "relative",
    },
    cartBadge: {
      position: "absolute",
      top: 2,
      right: 0,
      minWidth: 18,
      height: 18,
      paddingHorizontal: 4,
      borderRadius: 9,
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 2,
    },
    cartBadgeText: {
      color: c.onPrimary,
      fontSize: 10,
      fontFamily: fonts.semibold,
      lineHeight: 12,
    },
    alchemyTopBar: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: homeSpacing.md,
      minHeight: BRAND_HOME_TOP_BAR_LAYOUT_HEIGHT + spacing.sm,
    },
    wordmarkBlock: {
      flex: 1,
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      alignSelf: "stretch",
      paddingHorizontal: spacing.xs,
      minWidth: 0,
      minHeight: BRAND_HOME_TOP_BAR_LAYOUT_HEIGHT + spacing.sm + homeSpacing.md,
      overflow: "visible",
    },
    topBarTagline: {
      marginTop: -2,
      fontSize: Platform.OS === "web" ? typography.overline : 12,
      fontFamily: fonts.regular,
      letterSpacing: 0.6,
      textAlign: "center",
      lineHeight: Platform.OS === "web" ? lineHeight.overline : 16,
      color: c.textMuted,
    },
    topBarLogo: {
      flexShrink: 1,
      maxWidth: "100%",
      alignSelf: "center",
      textAlign: "center",
      ...Platform.select({
        ios: {
          shadowColor: "#18181B",
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.08,
          shadowRadius: 2,
        },
        web: {
          boxShadow: "0 1px 4px rgba(24, 24, 27, 0.06)",
        },
        default: {},
      }),
    },
    alchemyIconBtn: {
      width: 44,
      minHeight: 42,
      alignItems: "center",
      justifyContent: "center",
      alignSelf: "center",
      borderRadius: radius.md,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: "rgba(100, 116, 139, 0.16)",
      backgroundColor: "rgba(255, 255, 255, 0.88)",
      ...Platform.select({
        web: { cursor: "pointer" },
        default: {},
      }),
    },
    searchWrap: {
      marginTop: 16,
      marginBottom: homeSpacing.md,
      paddingHorizontal: spacing.sm,
    },
    webSearchRail: {
      flexDirection: "column",
      alignItems: "stretch",
      gap: spacing.sm,
      width: "100%",
      maxWidth: 520,
      marginBottom: homeSpacing.lg,
      padding: spacing.sm,
      borderRadius: 14,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: isDark ? "rgba(255,255,255,0.12)" : "rgba(63,63,70,0.2)",
      backgroundColor: c.surface,
      ...Platform.select({
        web: { boxShadow: "0 2px 8px rgba(0,0,0,0.04)" },
        default: {},
      }),
    },
    webSearchRailWithLocation: {
      alignItems: "stretch",
    },
    conciergeBar: {
      flexDirection: "row",
      alignItems: "center",
      flexWrap: "nowrap",
      gap: homeSpacing.md,
      borderRadius: 14,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: isDark ? "rgba(255,255,255,0.12)" : "rgba(63,63,70,0.2)",
      backgroundColor: c.surface,
      padding: homeSpacing.md,
      ...Platform.select({
        web: { boxShadow: "0 2px 8px rgba(0,0,0,0.04)" },
        ios: {
          shadowColor: "#000000",
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.04,
          shadowRadius: 8,
        },
        android: { elevation: 1 },
      }),
    },
    conciergeBarDark: {
      borderColor: "rgba(255,255,255,0.14)",
    },
    conciergeBarStacked: {
      alignItems: "stretch",
      gap: spacing.xs,
    },
    conciergeTopRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: homeSpacing.md,
    },
    conciergeLocationChip: {
      minHeight: 44,
      maxWidth: Platform.OS === "web" ? "100%" : "60%",
      flexDirection: "row",
      alignItems: "center",
      gap: homeSpacing.xs,
      borderRadius: radius.pill,
      paddingHorizontal: spacing.sm,
      backgroundColor: isDark ? "rgba(255,255,255,0.08)" : "rgba(248,250,252,0.92)",
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: isDark ? "rgba(255,255,255,0.16)" : "rgba(100,116,139,0.2)",
    },
    conciergeLocationChipWeb: {
      maxWidth: "100%",
      justifyContent: "flex-start",
    },
    conciergeLocationChipStacked: {
      maxWidth: "100%",
      flex: 1,
    },
    conciergeLocationText: {
      flex: 1,
      fontFamily: fonts.semibold,
      fontSize: typography.bodySmall,
      color: c.textPrimary,
    },
    conciergeSearchWrap: {
      position: "relative",
      flex: 1,
      minWidth: 0,
    },
    conciergeSearchWrapFocused: {
      ...Platform.select({
        web: { width: "100%" },
        default: {},
      }),
    },
    conciergeSearchWrapStacked: {
      width: "100%",
      flexBasis: "100%",
      flexGrow: 0,
    },
    conciergeSearchInputShell: {
      minHeight: 44,
      borderRadius: radius.pill,
      borderColor: isDark ? "rgba(255,255,255,0.16)" : "rgba(100,116,139,0.2)",
      backgroundColor: isDark ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.98)",
      ...Platform.select({
        web: { transition: "all 220ms ease" },
        default: {},
      }),
    },
    conciergeSearchInput: {
      minHeight: 24,
      paddingVertical: Platform.OS === "web" ? 6 : 4,
      fontSize: typography.bodySmall + 1,
    },
    conciergeIconBtn: {
      width: 44,
      minHeight: 44,
      borderRadius: radius.pill,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: isDark ? "rgba(255,255,255,0.16)" : "rgba(100,116,139,0.2)",
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: isDark ? "rgba(255,255,255,0.08)" : "rgba(248,250,252,0.92)",
    },
    conciergeIconBtnWeb: {
      alignSelf: "flex-start",
    },
    conciergeUnreadDot: {
      position: "absolute",
      top: 10,
      right: 10,
      width: 6,
      height: 6,
      borderRadius: 999,
      backgroundColor: c.rating,
      borderWidth: 1,
      borderColor: c.surface,
    },
    conciergePressed: {
      opacity: 0.78,
    },
    recentSearchDropdown: {
      position: "absolute",
      top: 48,
      left: 0,
      right: 0,
      zIndex: 10,
      borderRadius: radius.lg,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: isDark ? "rgba(255,255,255,0.14)" : "rgba(100,116,139,0.2)",
      backgroundColor: c.surface,
      paddingVertical: spacing.xs,
      ...Platform.select({
        web: { boxShadow: "0 8px 24px rgba(15,23,42,0.08)" },
        ios: {
          shadowColor: "#0F172A",
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: 0.08,
          shadowRadius: 16,
        },
        android: { elevation: 3 },
      }),
    },
    recentSearchTitle: {
      paddingHorizontal: spacing.sm,
      paddingBottom: homeSpacing.xs,
      fontSize: typography.caption,
      fontFamily: fonts.semibold,
      color: c.textMuted,
    },
    recentSearchItem: {
      minHeight: 44,
      paddingHorizontal: spacing.sm,
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.xs,
    },
    recentSearchItemText: {
      flex: 1,
      fontSize: typography.bodySmall,
      color: c.textPrimary,
      fontFamily: fonts.medium,
    },
    recentSearchEmpty: {
      minHeight: 44,
      paddingHorizontal: spacing.sm,
      textAlignVertical: "center",
      fontSize: typography.bodySmall,
      color: c.textMuted,
      fontFamily: fonts.regular,
    },
    searchGradientFrame: {
      borderRadius: 999,
      padding: 4,
      ...Platform.select({
        ios: {
          shadowColor: ALCHEMY.brown,
          shadowOffset: { width: 0, height: 6 },
          shadowOpacity: isDark ? 0.2 : 0.14,
          shadowRadius: 16,
        },
        android: { elevation: isDark ? 5 : 4 },
        web: {
          boxShadow: isDark
            ? "0 12px 40px rgba(0,0,0,0.35)"
            : "0 8px 24px rgba(15, 23, 42, 0.08), 0 2px 8px rgba(15, 23, 42, 0.05)",
        },
        default: {
          padding: 0,
        },
      }),
    },
    searchInner: {
      borderRadius: 999,
      overflow: "hidden",
    },
    heroImageOuter: {
      marginBottom: 32,
      borderRadius: radius.xxl + 2,
      overflow: "hidden",
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: isDark ? "rgba(255,255,255,0.1)" : "rgba(100, 116, 139, 0.14)",
      ...Platform.select({
        web: {
          width: "100%",
          maxWidth: layout.maxContentWidth,
          alignSelf: "center",
          boxShadow: isDark
            ? "0 24px 64px rgba(0,0,0,0.45), 0 8px 24px rgba(0,0,0,0.25)"
            : "0 20px 42px rgba(15, 23, 42, 0.11), 0 6px 14px rgba(15, 23, 42, 0.06)",
        },
        ios: {
          shadowColor: "#09090B",
          shadowOffset: { width: 0, height: 14 },
          shadowOpacity: isDark ? 0.4 : 0.2,
          shadowRadius: 24,
        },
        android: { elevation: isDark ? 8 : 5 },
        default: {},
      }),
    },
    heroSlider: {
      width: "100%",
    },
    heroPremiumFill: {
      position: "relative",
      width: "100%",
      justifyContent: "flex-end",
      backgroundColor: isDark ? "#0B1120" : "#111827",
      overflow: "hidden",
      padding: Platform.select({ web: spacing.md, default: spacing.sm }),
    },
    heroSlideFrame: {
      flex: 1,
      borderRadius: radius.xxl,
      overflow: "hidden",
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: "rgba(255, 252, 248, 0.12)",
      backgroundColor: "#120D0A",
    },
    heroSlideMedia: {
      ...StyleSheet.absoluteFillObject,
    },
    heroDotsPill: {
      position: "absolute",
      bottom: 16,
      left: 0,
      right: 0,
      alignItems: "center",
      zIndex: 4,
    },
    heroDotBackdrop: {
      paddingHorizontal: 4,
      paddingVertical: 4,
      borderRadius: radius.pill,
      backgroundColor: "transparent",
      borderWidth: 0,
      borderColor: "transparent",
      ...Platform.select({
        web: {
          backdropFilter: "none",
          WebkitBackdropFilter: "none",
        },
        default: {},
      }),
    },
    heroDotRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
    },
    heroDotHit: {
      minHeight: 12,
      paddingVertical: 4,
      paddingHorizontal: 4,
      ...Platform.select({
        web: { cursor: "pointer" },
        default: {},
      }),
    },
    heroDot: {
      height: 4,
      borderRadius: 9999,
    },
    heroDotIdle: {
      backgroundColor: "rgba(255,255,255,0.32)",
    },
    heroDotActive: {
      backgroundColor: "rgba(255,255,255,0.95)",
    },
    heroBrandLogo: {
      alignSelf: "flex-start",
      maxWidth: "100%",
      marginBottom: spacing.sm,
    },
    heroBrandLogoOnPhoto: {
      opacity: 0.98,
    },
    heroImageInner: {
      position: "relative",
      zIndex: 2,
      paddingTop: Platform.select({ web: homeSpacing["2xl"], default: homeSpacing.xl }),
      paddingHorizontal: Platform.select({ web: 30, default: 26 }),
      paddingBottom: Platform.select({ web: 66, default: 60 }),
    },
    heroOverline: {
      color: "rgba(255,255,255,0.65)",
      fontSize: 11,
      fontFamily: fonts.semibold,
      letterSpacing: 1.8,
      textTransform: "uppercase",
      marginBottom: spacing.xs,
    },
    heroSlideCounter: {
      position: "absolute",
      top: 16,
      right: 16,
      zIndex: 4,
      paddingHorizontal: spacing.sm,
      paddingVertical: homeSpacing.xs,
      borderRadius: radius.pill,
      backgroundColor: "rgba(8, 6, 4, 0.52)",
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: "rgba(255, 252, 248, 0.22)",
      ...Platform.select({
        web: {
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
        },
        default: {},
      }),
    },
    heroSlideCounterText: {
      color: c.heroForeground,
      fontSize: typography.caption,
      fontFamily: fonts.semibold,
      letterSpacing: 1.2,
      fontVariant: ["tabular-nums"],
    },
    heroSlideCounterSep: {
      color: "rgba(255, 252, 248, 0.55)",
      fontFamily: fonts.semibold,
      letterSpacing: 0,
    },
    heroEditorialRow: {
      flexDirection: "row",
      alignItems: "center",
      flexWrap: "wrap",
      gap: spacing.sm,
      marginBottom: homeSpacing.md,
      maxWidth: 560,
    },
    heroKickerText: {
      color: "rgba(255, 252, 248, 0.92)",
      fontSize: typography.overline + 1,
      fontFamily: fonts.semibold,
      letterSpacing: 2,
      textTransform: "uppercase",
      ...Platform.select({
        web: { textShadow: "0 1px 12px rgba(8, 6, 4, 0.55)" },
        default: {
          textShadowColor: "rgba(8, 6, 4, 0.55)",
          textShadowOffset: { width: 0, height: 1 },
          textShadowRadius: 10,
        },
      }),
    },
    heroNavRail: {
      position: "absolute",
      top: "50%",
      left: 12,
      right: 12,
      marginTop: -20,
      zIndex: 4,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    heroNavButton: {
      width: 40,
      height: 40,
      borderRadius: semanticRadius.full,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: "rgba(255,255,255,0.10)",
      borderWidth: 1,
      borderColor: "rgba(255,255,255,0.16)",
      ...Platform.select({
        web: {
          cursor: "pointer",
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
        },
        default: {},
      }),
    },
    heroNavButtonHover: {
      backgroundColor: "rgba(255,255,255,0.18)",
    },
    heroNavButtonPressed: {
      opacity: 1,
      backgroundColor: "rgba(255,255,255,0.18)",
      transform: [{ scale: 0.98 }],
    },
    heroBadgePill: {
      paddingHorizontal: homeSpacing.md,
      paddingVertical: homeSpacing.xs,
      borderRadius: radius.pill,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: isDark ? "rgba(255,255,255,0.24)" : "rgba(255,255,255,0.28)",
      backgroundColor: "rgba(8, 6, 4, 0.34)",
    },
    heroBadgePillText: {
      color: "#FEF2F2",
      fontSize: typography.overline,
      fontFamily: fonts.semibold,
      letterSpacing: 1.2,
    },
    heroDisplayTitle: {
      fontFamily: FONT_DISPLAY,
      fontSize: Platform.OS === "web" ? 36 : 32,
      lineHeight: Platform.OS === "web" ? 42 : 37,
      letterSpacing: Platform.OS === "web" ? -0.55 : -0.4,
      marginBottom: 0,
      maxWidth: 640,
      ...Platform.select({
        web: {
          textShadow: isDark
            ? "0 2px 28px rgba(8, 6, 4, 0.45)"
            : "0 2px 14px rgba(255, 255, 255, 0.6)",
        },
        default: {
          textShadowColor: isDark ? "rgba(8, 6, 4, 0.45)" : "rgba(255, 255, 255, 0.6)",
          textShadowOffset: { width: 0, height: 2 },
          textShadowRadius: isDark ? 18 : 10,
        },
      }),
    },
    heroDisplayOnPhoto: {
      color: c.heroForeground,
      ...Platform.select({
        web: { textShadow: "0 2px 22px rgba(8, 6, 4, 0.65)" },
        default: {
          textShadowColor: "rgba(8, 6, 4, 0.65)",
          textShadowOffset: { width: 0, height: 2 },
          textShadowRadius: 16,
        },
      }),
    },
    heroDisplaySub: {
      marginTop: spacing.xs,
      fontSize: Platform.OS === "web" ? typography.body + 1 : typography.body,
      fontFamily: fonts.medium,
      lineHeight: Platform.OS === "web" ? 25 : 24,
      maxWidth: 560,
      opacity: 0.96,
      ...Platform.select({
        web: { textShadow: "0 1px 10px rgba(8, 6, 4, 0.35)" },
        default: {
          textShadowColor: "rgba(8, 6, 4, 0.35)",
          textShadowOffset: { width: 0, height: 1 },
          textShadowRadius: 10,
        },
      }),
    },
    heroDisplaySubOnPhoto: {
      color: "rgba(255, 252, 248, 0.86)",
      ...Platform.select({
        web: { textShadow: "0 1px 12px rgba(8, 6, 4, 0.55)" },
        default: {
          textShadowColor: "rgba(8, 6, 4, 0.55)",
          textShadowOffset: { width: 0, height: 1 },
          textShadowRadius: 12,
        },
      }),
    },
    heroEditorialNote: {
      marginTop: spacing.sm,
      maxWidth: 520,
      color: "rgba(255, 252, 248, 0.84)",
      fontSize: typography.caption,
      fontFamily: fonts.medium,
      lineHeight: lineHeight.caption + 4,
      ...Platform.select({
        web: { textShadow: "0 1px 10px rgba(8, 6, 4, 0.45)" },
        default: {
          textShadowColor: "rgba(8, 6, 4, 0.45)",
          textShadowOffset: { width: 0, height: 1 },
          textShadowRadius: 10,
        },
      }),
    },
    heroPromiseRow: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: spacing.sm,
      marginTop: spacing.md,
      maxWidth: 620,
    },
    heroPromiseChip: {
      flexDirection: "row",
      alignItems: "center",
      gap: homeSpacing.sm,
      paddingHorizontal: homeSpacing.md,
      paddingVertical: 8,
      borderRadius: radius.pill,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: "rgba(255, 252, 248, 0.22)",
      backgroundColor: "rgba(8, 6, 4, 0.34)",
      ...Platform.select({
        web: {
          backdropFilter: "blur(10px)",
          WebkitBackdropFilter: "blur(10px)",
        },
        default: {},
      }),
    },
    heroPromiseChipText: {
      color: c.heroForeground,
      fontSize: typography.caption,
      fontFamily: fonts.semibold,
      letterSpacing: 0.2,
    },
    heroCtaButton: {
      marginTop: spacing.lg,
    },
    heroEditorialCta: {
      alignSelf: "flex-start",
      marginTop: 12,
      minHeight: 46,
      borderRadius: 999,
      paddingHorizontal: homeSpacing.xl,
      paddingVertical: spacing.sm,
      backgroundColor: "rgba(255,255,255,0.98)",
      borderWidth: 0,
      borderColor: "transparent",
      ...Platform.select({
        web: {
          cursor: "pointer",
          transition: "transform 0.18s ease, opacity 0.18s ease, box-shadow 0.18s ease",
          boxShadow: "inset 0 1px 0 rgba(255,255,255,0.2), 0 10px 24px rgba(8, 6, 4, 0.34)",
        },
        default: {},
      }),
    },
    heroEditorialCtaPressed: {
      opacity: 0.92,
      transform: [{ scale: 0.99 }],
    },
    heroEditorialCtaText: {
      color: "#0E1729",
      fontSize: 14,
      fontFamily: fonts.semibold,
      letterSpacing: 1.1,
      textTransform: "uppercase",
    },
    promoVideoWrap: {
      width: "100%",
      maxWidth: layout.maxContentWidth,
      alignSelf: "center",
      marginBottom: homeSpacing["3xl"],
      borderRadius: radius.xxl,
      overflow: "hidden",
      borderWidth: 1,
      borderColor: isDark ? "rgba(255,255,255,0.12)" : "rgba(100, 116, 139, 0.14)",
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: isDark ? "rgba(255,255,255,0.12)" : "#E8E6E1",
      backgroundColor: "#110B07",
      padding: Platform.OS === "web" ? 10 : 8,
      ...Platform.select({
        web: {
          boxShadow: isDark
            ? "0 28px 72px rgba(0,0,0,0.56), 0 8px 26px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.08)"
            : "0 20px 48px rgba(15, 23, 42, 0.14), 0 7px 18px rgba(15, 23, 42, 0.08), inset 0 1px 0 rgba(255,255,255,0.76)",
        },
        ios: {
          shadowColor: "#09090B",
          shadowOffset: { width: 0, height: 10 },
          shadowOpacity: isDark ? 0.36 : 0.18,
          shadowRadius: 18,
        },
        android: { elevation: isDark ? 6 : 4 },
        default: {},
      }),
    },
    promoVideoFrame: {
      borderRadius: radius.xl + 2,
      overflow: "hidden",
      backgroundColor: "#0A0705",
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: isDark ? "rgba(255, 252, 248, 0.14)" : "rgba(255, 252, 248, 0.24)",
      ...Platform.select({
        web: {
          boxShadow: isDark
            ? "inset 0 0 0 1px rgba(255, 252, 248, 0.08)"
            : "inset 0 0 0 1px rgba(255, 252, 248, 0.4)",
        },
        default: {},
      }),
    },
    promoVideo: {
      width: "100%",
      height: Platform.OS === "web" ? 400 : 260,
      backgroundColor: "#120D08",
    },
    promoSheen: {
      ...StyleSheet.absoluteFillObject,
    },
    promoMuteBtn: {
      position: "absolute",
      right: spacing.md,
      bottom: spacing.md,
      zIndex: 3,
      minHeight: 44,
      paddingHorizontal: homeSpacing.md,
      alignItems: "center",
      justifyContent: "center",
      flexDirection: "row",
      gap: homeSpacing.sm,
      borderRadius: 22,
      borderWidth: 1,
      borderColor: "rgba(255, 252, 248, 0.48)",
      backgroundColor: "rgba(12, 9, 7, 0.66)",
      ...Platform.select({
        web: {
          cursor: "pointer",
          boxShadow: "0 8px 20px rgba(8, 6, 4, 0.5), inset 0 1px 0 rgba(255, 252, 248, 0.28)",
          backdropFilter: "blur(10px)",
          WebkitBackdropFilter: "blur(10px)",
        },
        default: {},
      }),
    },
    promoMuteText: {
      color: c.heroForeground,
      fontSize: typography.overline + 1,
      fontFamily: fonts.semibold,
      letterSpacing: 0.35,
      textTransform: "uppercase",
    },
    promoMuteBtnAttention: {
      borderColor: "rgba(255, 252, 248, 0.76)",
      backgroundColor: "rgba(12, 9, 7, 0.78)",
      ...Platform.select({
        web: {
          boxShadow: "0 10px 24px rgba(8, 6, 4, 0.56), inset 0 1px 0 rgba(255, 252, 248, 0.4)",
        },
        default: {},
      }),
    },
    jumpNavSticky: {
      alignSelf: "center",
      marginBottom: spacing.md,
      ...Platform.select({
        web: {
          position: "sticky",
          top: WEB_HEADER_HEIGHT + 8,
          zIndex: 11,
        },
        default: {},
      }),
    },
    jumpNavInner: {
      flexDirection: "row",
      alignItems: "center",
      gap: homeSpacing.sm,
      paddingVertical: homeSpacing.sm,
      paddingHorizontal: 8,
      borderRadius: 9999,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: isDark ? "rgba(255,255,255,0.22)" : "rgba(63, 63, 70, 0.16)",
      backgroundColor: isDark ? "rgba(15, 12, 10, 0.72)" : "rgba(255, 252, 247, 0.86)",
      ...Platform.select({
        web: {
          backdropFilter: "saturate(160%) blur(14px)",
          WebkitBackdropFilter: "saturate(160%) blur(14px)",
          boxShadow: isDark
            ? "0 12px 28px rgba(0,0,0,0.42), inset 0 1px 0 rgba(255,255,255,0.04)"
            : "0 10px 24px rgba(63, 63, 70, 0.12), inset 0 1px 0 rgba(255,255,255,0.7)",
        },
        default: {},
      }),
    },
    jumpNavChip: {
      flexDirection: "row",
      alignItems: "center",
      gap: homeSpacing.sm,
      paddingHorizontal: spacing.md,
      paddingVertical: homeSpacing.sm,
      borderRadius: 9999,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: "transparent",
      backgroundColor: "transparent",
      ...Platform.select({
        web: {
          cursor: "pointer",
          transitionProperty: "transform, background-color, color, border-color",
          transitionDuration: "180ms",
        },
        default: {},
      }),
    },
    jumpNavChipActive: {
      backgroundColor: isDark ? "rgba(148,163,184,0.16)" : c.secondarySoft,
      borderColor: isDark ? "rgba(148,163,184,0.42)" : c.secondaryBorder,
      ...Platform.select({
        web: {
          boxShadow: isDark
            ? "0 6px 14px rgba(148,163,184,0.16)"
            : "0 6px 14px rgba(63, 63, 70, 0.14)",
        },
        default: {},
      }),
    },
    jumpNavDot: {
      width: 6,
      height: 6,
      borderRadius: 3,
      backgroundColor: c.accentGreen || c.secondary,
    },
    jumpNavChipTextActive: {
      color: c.accentGreen || c.secondaryDark,
    },
    jumpNavChipText: {
      fontSize: typography.caption,
      fontFamily: fonts.bold,
      color: isDark ? c.textPrimary : ALCHEMY.brown,
      letterSpacing: 0.4,
    },
    trustSectionWrap: {
      width: "100%",
      marginTop: 0,
      marginBottom: sectionGap,
      alignItems: "stretch",
      ...Platform.select({
        web: {
          maxWidth: layout.maxContentWidth,
          alignSelf: "center",
        },
        default: {},
      }),
    },
    liveOrderWrap: {
      width: "100%",
      marginBottom: spacing.lg,
      ...Platform.select({
        web: {
          maxWidth: layout.maxContentWidth,
          alignSelf: "center",
        },
        default: {},
      }),
    },
    liveOrderCard: {
      borderRadius: radius.xxl,
      paddingVertical: homeSpacing.lg,
      paddingHorizontal: spacing.lg,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: isDark ? "rgba(255,255,255,0.2)" : "rgba(63, 63, 70, 0.14)",
    },
    liveOrderOverline: {
      fontSize: typography.overline + 1,
      fontFamily: fonts.semibold,
      letterSpacing: 1.4,
      textTransform: "uppercase",
      color: isDark ? ALCHEMY.goldBright : ALCHEMY.brown,
      marginBottom: homeSpacing.xs,
    },
    liveOrderTitle: {
      fontSize: typography.body,
      fontFamily: fonts.bold,
      color: c.textPrimary,
      marginBottom: spacing.sm,
    },
    liveOrderMetaRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: spacing.sm,
      marginBottom: spacing.sm,
    },
    liveOrderStatusPill: {
      paddingHorizontal: spacing.sm,
      paddingVertical: homeSpacing.sm,
      borderRadius: radius.pill,
      borderWidth: StyleSheet.hairlineWidth,
      backgroundColor: c.secondarySoft,
    },
    liveOrderStatusText: {
      fontSize: typography.caption,
      fontFamily: fonts.bold,
    },
    liveOrderAmount: {
      fontSize: typography.body,
      fontFamily: fonts.semibold,
      color: c.textPrimary,
    },
    liveOrderActions: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.sm,
    },
    liveOrderBtn: {
      flex: 1,
      borderRadius: radius.lg,
      paddingVertical: spacing.sm,
      alignItems: "center",
      justifyContent: "center",
    },
    liveOrderBtnPrimary: {
      backgroundColor: c.primary,
    },
    liveOrderBtnPrimaryText: {
      color: c.onPrimary,
      fontSize: typography.bodySmall,
      fontFamily: fonts.bold,
    },
    liveOrderBtnGhost: {
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: isDark ? c.border : "rgba(63, 63, 70, 0.2)",
      backgroundColor: isDark ? "rgba(255,255,255,0.04)" : "rgba(255,255,255,0.64)",
    },
    liveOrderBtnGhostText: {
      fontSize: typography.bodySmall,
      fontFamily: fonts.semibold,
    },
    trustSectionEyebrow: {
      fontSize: typography.overline + 1,
      fontFamily: fonts.semibold,
      letterSpacing: 2,
      textTransform: "uppercase",
      textAlign: "center",
      marginBottom: homeSpacing.base,
      width: "100%",
    },
    homeSectionOverline: {
      fontSize: typography.overline + 1,
      fontFamily: fonts.semibold,
      letterSpacing: 1.65,
      textTransform: "uppercase",
      textAlign: "center",
      marginBottom: spacing.sm,
      width: "100%",
    },
    homeShopOverline: {
      marginBottom: homeSpacing.md,
    },
    shopDiscoveryHint: {
      fontSize: typography.caption,
      fontFamily: fonts.regular,
      lineHeight: lineHeight.caption + 4,
      textAlign: "center",
      marginBottom: spacing.sm,
      paddingHorizontal: spacing.md,
      opacity: 0.92,
    },
    shopDiscoveryIntro: {
      fontSize: typography.body,
      fontFamily: FONT_DISPLAY_SEMI,
      lineHeight: lineHeight.body + 4,
      textAlign: "center",
      marginBottom: homeSpacing.lg,
      paddingHorizontal: spacing.sm,
      letterSpacing: -0.2,
    },
    shopDiscoverySection: {
      width: "100%",
      ...Platform.select({
        web: {
          maxWidth: layout.maxContentWidth,
          alignSelf: "center",
        },
        default: {},
      }),
      marginBottom: homeSpacing["3xl"],
    },
    trustStripAmbient: {
      ...StyleSheet.absoluteFillObject,
      borderRadius: 14,
      opacity: Platform.OS === "web" ? 0.7 : 1,
    },
    homeErrorBanner: {
      flexDirection: "row",
      alignItems: "flex-start",
      gap: spacing.sm,
      paddingVertical: homeSpacing.base,
      paddingHorizontal: homeSpacing.lg,
      marginBottom: homeSpacing.lg,
      borderRadius: radius.lg + 2,
      borderWidth: StyleSheet.hairlineWidth,
      maxWidth: layout.maxContentWidth,
      width: "100%",
      alignSelf: "center",
    },
    outOfAreaBanner: {
      width: "100%",
      maxWidth: layout.maxContentWidth,
      alignSelf: "center",
      flexDirection: "row",
      alignItems: "center",
      gap: homeSpacing.sm,
      borderWidth: 1,
      borderRadius: 12,
      paddingVertical: homeSpacing.md,
      paddingHorizontal: homeSpacing.base,
      marginBottom: homeSpacing.base,
    },
    outOfAreaIcon: {
      flexShrink: 0,
    },
    outOfAreaText: {
      flex: 1,
      fontFamily: fonts.regular,
      fontSize: 14,
      lineHeight: Math.round(14 * 1.45),
    },
    outOfAreaLinkBtn: {
      paddingVertical: homeSpacing.xs,
      paddingHorizontal: homeSpacing.sm,
      borderRadius: radius.pill,
    },
    outOfAreaLinkBtnPressed: {
      opacity: 0.8,
    },
    outOfAreaLinkText: {
      fontSize: 13,
      fontFamily: fonts.semibold,
      lineHeight: Math.round(13 * 1.4),
    },
    homeErrorIcon: {
      marginTop: homeSpacing.xs,
      flexShrink: 0,
    },
    trustStrip: {
      position: "relative",
      overflow: "hidden",
      borderRadius: 14,
      ...Platform.select({
        web: {
          width: "100%",
          maxWidth: layout.maxContentWidth,
          alignSelf: "center",
        },
        default: {},
      }),
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: c.border,
      backgroundColor: c.surface,
    },
    trustStripDark: {
      borderColor: c.border,
    },
    trustStripInner: {
      flexDirection: "row",
      alignItems: "stretch",
      justifyContent: "space-between",
      width: "100%",
      zIndex: 1,
    },
    trustStripInnerStacked: {
      flexDirection: "column",
    },
    trustDivider: {
      width: StyleSheet.hairlineWidth,
      alignSelf: "stretch",
      marginVertical: 0,
      flexShrink: 0,
      opacity: 1,
    },
    trustDividerStacked: {
      width: "100%",
      height: StyleSheet.hairlineWidth,
    },
    trustDividerLight: {
      backgroundColor: c.border,
    },
    trustDividerDark: {
      backgroundColor: c.border,
    },
    trustCell: {
      flex: 1,
      minWidth: 0,
      alignItems: "flex-start",
      justifyContent: "flex-start",
      paddingHorizontal: 16,
      paddingVertical: 16,
      ...Platform.select({
        web: { cursor: "pointer" },
        default: {},
      }),
    },
    trustCellStacked: {
      width: "100%",
    },
    trustCellPressed: {
      opacity: 0.86,
    },
    trustIconBadge: {
      width: 22,
      height: 22,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 8,
    },
    trustIconBadgeLight: {
      backgroundColor: ALCHEMY.goldSoft,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: "rgba(63, 63, 70, 0.1)",
      ...Platform.select({
        ios: {
          shadowColor: ALCHEMY.brown,
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.06,
          shadowRadius: 4,
        },
        default: {},
      }),
    },
    trustIconBadgeDark: {
      backgroundColor: "rgba(134, 239, 172, 0.12)",
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: "rgba(134, 239, 172, 0.24)",
    },
    trustCellLabel: {
      fontSize: 14,
      fontFamily: fonts.semibold,
      textAlign: "left",
      lineHeight: 19,
      letterSpacing: 0,
      maxWidth: "100%",
      flexShrink: 1,
      marginBottom: homeSpacing.xs,
    },
    trustCellSupport: {
      fontSize: 12,
      fontFamily: fonts.regular,
      lineHeight: 17,
      textAlign: "left",
      maxWidth: "100%",
    },
    trustCellLabelDense: {
      fontSize: typography.overline + 1,
      lineHeight: lineHeight.overline + 2,
      letterSpacing: 0.08,
    },
    productListRow: {
      marginBottom: spacing.md,
      borderRadius: radius.xl + 4,
      overflow: "hidden",
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: isDark ? "rgba(255,255,255,0.08)" : "rgba(63, 63, 70, 0.1)",
      backgroundColor: isDark ? "rgba(255,255,255,0.03)" : "rgba(255, 255, 255, 0.55)",
      ...Platform.select({
        ios: {
          shadowColor: "#18181B",
          shadowOffset: { width: 0, height: 3 },
          shadowOpacity: isDark ? 0.14 : 0.05,
          shadowRadius: 10,
        },
        android: { elevation: isDark ? 2 : 1 },
        web: {
          boxShadow: isDark
            ? "0 8px 24px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.04)"
            : "0 6px 18px rgba(28, 25, 23, 0.05), inset 0 1px 0 rgba(255,255,255,0.88)",
        },
        default: {},
      }),
    },
    productListRowDivider: {
      marginBottom: spacing.lg,
    },
    productListRowLast: {
      marginBottom: 0,
    },
    heroCardCompact: {
      borderRadius: radius.xxl,
      paddingHorizontal: homeSpacing["2xl"],
      paddingVertical: homeSpacing["2xl"],
      marginBottom: homeSpacing.xl,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: c.border,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: isDark ? c.border : "#E8E6E1",
      backgroundColor: isDark ? c.surface : ALCHEMY.cardBg,
      ...shadowPremium,
    },
    heroTitle: {
      color: c.textPrimary,
      fontSize: typography.h2,
      fontFamily: FONT_DISPLAY,
      letterSpacing: -0.35,
    },
    heroSubtext: {
      marginTop: homeSpacing.sm,
      color: c.textSecondary,
      fontSize: typography.bodySmall,
      fontFamily: fonts.regular,
    },
    categoryQuickNavWrap: {
      marginTop: 0,
      marginBottom: sectionGap,
    },
    toastStackRoot: {
      position: "absolute",
      left: spacing.md,
      right: spacing.md,
      alignItems: "center",
      zIndex: WEB_Z_INDEX.overlay + 10,
      elevation: 24,
    },
    toastStackColumn: {
      width: "100%",
      maxWidth: 520,
      alignItems: "stretch",
      gap: 8,
    },
    toastCard: {
      width: "100%",
      borderRadius: 14,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: "rgba(255,255,255,0.2)",
      backgroundColor: ALCHEMY.brownInk,
      ...Platform.select({
        web: {
          boxShadow: "0 12px 24px rgba(15,23,42,0.28)",
        },
        ios: {
          shadowColor: "#000000",
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: 0.24,
          shadowRadius: 16,
        },
        android: {
          elevation: 10,
        },
        default: {},
      }),
    },
    toastCardInner: {
      flexDirection: "row",
      alignItems: "center",
      gap: homeSpacing.md,
      paddingHorizontal: 16,
      paddingVertical: 12,
    },
    toastText: {
      flex: 1,
      color: "#FFFFFF",
      fontFamily: fonts.regular,
      fontSize: 13,
      lineHeight: Math.round(13 * 1.5),
    },
    toastActionBtn: {
      borderRadius: 8,
      paddingHorizontal: homeSpacing.xs,
      paddingVertical: homeSpacing.xs,
    },
    toastActionBtnPressed: {
      opacity: 0.72,
    },
    toastActionText: {
      color: HERITAGE.amberBright,
      fontFamily: fonts.semibold,
      fontSize: 13,
      lineHeight: Math.round(13 * 1.4),
    },
    liveOrderPinnedWrap: {
      marginBottom: sectionGap,
    },
    activeFilterBar: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.sm,
      marginBottom: homeSpacing.lg,
      paddingVertical: homeSpacing.md,
      paddingHorizontal: spacing.lg,
      backgroundColor: c.secondarySoft,
      borderRadius: radius.xl + 2,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: c.secondaryBorder,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: c.secondaryBorder,
      ...shadowLift,
    },
    activeFilterText: {
      flex: 1,
      color: c.textPrimary,
      fontSize: 13,
      lineHeight: Math.round(13 * 1.5),
      fontFamily: fonts.regular,
    },
    activeFilterClear: {
      color: c.secondaryDark,
      fontSize: 12,
      lineHeight: Math.round(12 * 1.4),
      fontFamily: fonts.semibold,
    },
    sectionFilterBar: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.sm,
      marginBottom: homeSpacing.lg,
      paddingVertical: homeSpacing.md,
      paddingHorizontal: spacing.lg,
      backgroundColor: c.secondarySoft,
      borderRadius: radius.xl + 2,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: c.secondaryBorder,
      borderTopWidth: 2,
      borderTopColor: c.secondary,
      ...shadowLift,
    },
    sectionFilterClear: {
      color: c.secondary,
      fontSize: 12,
      lineHeight: Math.round(12 * 1.4),
      fontFamily: fonts.semibold,
    },
    catalogBrowseBar: {
      flexDirection: "row",
      gap: spacing.sm,
      marginBottom: 0,
      padding: Platform.select({ web: homeSpacing.md, default: homeSpacing.sm }),
      borderRadius: radius.xl + 6,
      borderWidth: StyleSheet.hairlineWidth,
      ...shadowLift,
      ...Platform.select({
        web: {
          width: "100%",
          maxWidth: layout.maxContentWidth,
          alignSelf: "center",
          userSelect: "none",
          boxShadow: isDark
            ? "0 14px 34px rgba(0,0,0,0.28), inset 0 1px 0 rgba(255,255,255,0.04)"
            : "0 12px 28px rgba(24, 24, 27, 0.08), inset 0 1px 0 rgba(255,255,255,0.86)",
        },
        default: {},
      }),
    },
    catalogBrowseBarLight: {
      borderColor: "rgba(63, 63, 70, 0.12)",
      backgroundColor: "rgba(255, 253, 249, 0.94)",
    },
    catalogBrowseBarDark: {
      borderColor: c.border,
      backgroundColor: c.surfaceMuted,
    },
    catalogBrowseOption: {
      flex: 1,
      minWidth: 0,
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: Platform.select({ web: homeSpacing.lg, default: homeSpacing.base }),
      paddingHorizontal: spacing.sm,
      borderRadius: radius.lg + 2,
      gap: homeSpacing.sm,
    },
    catalogBrowseOptionActive: {
      backgroundColor: isDark ? "rgba(148,163,184,0.16)" : "#FFFFFF",
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: c.secondaryBorder,
      borderTopWidth: 1,
      borderTopColor: c.secondaryBorder,
    },
    catalogBrowseOptionHover: {
      backgroundColor: isDark ? "rgba(148,163,184,0.1)" : "rgba(255,255,255,0.75)",
      ...Platform.select({
        web: {
          boxShadow: isDark
            ? "0 8px 18px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.04)"
            : "0 8px 16px rgba(24, 24, 27, 0.08), inset 0 1px 0 rgba(255,255,255,0.9)",
        },
        default: {},
      }),
    },
    catalogBrowseOptionPressed: {
      opacity: 0.88,
    },
    catalogBrowseTitle: {
      fontFamily: FONT_DISPLAY_SEMI,
      fontSize: 15,
      letterSpacing: 0.06,
      textAlign: "center",
    },
    catalogBrowseSub: {
      fontSize: 12,
      fontFamily: fonts.medium,
      textAlign: "center",
    },
    sectionChipsScroll: {
      marginBottom: spacing.xl,
      flexGrow: 0,
    },
    sectionChipsContent: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.sm,
      paddingBottom: spacing.xs,
      paddingRight: spacing.lg,
    },
    sectionChip: {
      flexDirection: "row",
      alignItems: "center",
      gap: homeSpacing.sm,
      paddingHorizontal: 16,
      paddingVertical: homeSpacing.sm,
      borderRadius: radius.pill,
      borderWidth: StyleSheet.hairlineWidth,
      ...Platform.select({
        web: { cursor: "pointer" },
        default: {},
      }),
    },
    sectionChipActive: {
      borderColor: c.secondaryBorder,
      backgroundColor: c.secondarySoft,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: c.secondaryBorder,
    },
    sectionChipLabel: {
      fontFamily: fonts.bold,
      fontSize: 13,
      maxWidth: 168,
    },
    sectionChipCount: {
      fontSize: 11,
      fontFamily: fonts.semibold,
    },
    catalogIntroCard: {
      marginBottom: homeSpacing.lg,
      borderRadius: 14,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: c.border,
      backgroundColor: c.surface,
      paddingHorizontal: cardPadding,
      paddingVertical: cardPadding,
      ...Platform.select({
        web: {
          width: "100%",
          maxWidth: layout.maxContentWidth,
          alignSelf: "center",
        },
        default: {},
      }),
    },
    catalogIntroBanner: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: spacing.sm,
      minHeight: 52,
    },
    catalogIntroLeft: {
      flex: 1,
      minWidth: 0,
      gap: homeSpacing.xs,
    },
    catalogIntroEyebrow: {
      fontFamily: fonts.semibold,
      fontSize: 11,
      letterSpacing: 1.4,
      textTransform: "uppercase",
      color: isDark ? c.textMuted : ALCHEMY.brownMuted,
    },
    catalogIntroTitle: {
      color: c.textPrimary,
      fontFamily: FONT_DISPLAY,
      fontSize: windowWidth >= 1024 ? 40 : windowWidth >= 768 ? 32 : 28,
      lineHeight: Math.round((windowWidth >= 1024 ? 40 : windowWidth >= 768 ? 32 : 28) * 1.1),
      letterSpacing: -0.7,
      fontWeight: "500",
    },
    catalogIntroSubtitle: {
      color: c.textSecondary,
      fontFamily: fonts.medium,
      fontSize: typography.bodySmall,
      lineHeight: lineHeight.bodySmall + 3,
      maxWidth: 720,
    },
    catalogViewToggleWrap: {
      position: "relative",
      flexDirection: "row",
      alignItems: "center",
      gap: homeSpacing.sm,
      flexShrink: 0,
    },
    catalogViewToggleBtnTouch: {
      borderRadius: 10,
      ...Platform.select({
        web: { cursor: "pointer" },
        default: {},
      }),
    },
    catalogViewToggleBtn: {
      width: 36,
      height: 36,
      borderRadius: 10,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: c.border,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: c.surface,
      overflow: "hidden",
    },
    catalogViewToggleIconLayer: {
      position: "absolute",
      top: 0,
      right: 0,
      bottom: 0,
      left: 0,
      alignItems: "center",
      justifyContent: "center",
    },
    catalogViewToggleBtnPressed: {
      opacity: 0.82,
      transform: [{ scale: 0.96 }],
    },
    catalogViewToggleTooltip: {
      position: "absolute",
      top: -28,
      right: 0,
      borderRadius: radius.md,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: isDark ? "rgba(255,255,255,0.16)" : "rgba(100,116,139,0.2)",
      backgroundColor: isDark ? "rgba(24,24,27,0.98)" : "#FFFFFF",
      paddingHorizontal: 8,
      paddingVertical: 4,
      ...Platform.select({
        web: { boxShadow: "0 4px 12px rgba(15,23,42,0.08)" },
        default: {},
      }),
    },
    catalogViewToggleTooltipText: {
      fontSize: typography.caption,
      fontFamily: fonts.medium,
      color: c.textPrimary,
    },
    catalogSkeletonGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: spacing.sm,
    },
    catalogSkeletonCard: {
      width: Platform.OS === "web" ? "calc(33.333% - 10px)" : "48%",
      borderRadius: radius.lg,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: isDark ? "rgba(255,255,255,0.1)" : "rgba(100,116,139,0.18)",
      backgroundColor: c.surface,
      padding: homeSpacing.md,
    },
    catalogSkeletonMeta: {
      paddingTop: homeSpacing.md,
      gap: spacing.xs,
    },
    mobilePeekScroll: {
      marginHorizontal: -2,
    },
    mobilePeekRow: {
      paddingRight: spacing.md,
      gap: spacing.sm,
    },
    mobilePeekItem: {
      minWidth: 148,
      maxWidth: 236,
    },
    inlineSectionEmpty: {
      borderRadius: radius.lg,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: isDark ? "rgba(255,255,255,0.14)" : "rgba(100,116,139,0.2)",
      backgroundColor: isDark ? "rgba(255,255,255,0.03)" : "rgba(248,250,252,0.72)",
      paddingHorizontal: spacing.md,
      paddingVertical: homeSpacing.md,
      gap: homeSpacing.md,
    },
    inlineSectionEmptyTitle: {
      fontSize: 14,
      lineHeight: Math.round(14 * 1.5),
      fontFamily: fonts.regular,
      color: c.textSecondary,
    },
    inlineSectionCategoryRow: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: spacing.xs,
    },
    inlineSectionCategoryChip: {
      minHeight: 30,
      borderRadius: radius.pill,
      paddingHorizontal: spacing.sm,
      alignItems: "center",
      justifyContent: "center",
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: isDark ? "rgba(248,113,113,0.35)" : "rgba(220,38,38,0.22)",
      backgroundColor: isDark ? "rgba(220,38,38,0.1)" : "rgba(220,38,38,0.06)",
      ...Platform.select({
        web: { cursor: "pointer" },
        default: {},
      }),
    },
    inlineSectionCategoryChipPressed: {
      opacity: 0.82,
    },
    inlineSectionCategoryChipText: {
      fontSize: typography.caption,
      fontFamily: fonts.semibold,
      color: c.textPrimary,
    },
    listSection: {
      marginBottom: sectionGap,
    },
    catalogSurface: {
      overflow: "hidden",
      backgroundColor: isDark ? c.surface : ALCHEMY.cardBg,
      borderRadius: radius.xxl,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: isDark ? c.border : "#E8E6E1",
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: isDark ? c.border : "#E8E6E1",
      paddingHorizontal: Platform.select({ web: homeSpacing["3xl"], default: homeSpacing.xl }),
      paddingTop: Platform.select({ web: homeSpacing.xl, default: homeSpacing["2xl"] }),
      paddingBottom: Platform.select({ web: homeSpacing["2xl"], default: homeSpacing["3xl"] }),
      ...Platform.select({
        web: {
          width: "100%",
          maxWidth: layout.maxContentWidth,
          alignSelf: "center",
        },
        default: {},
      }),
      ...Platform.select({
        ios: {
          shadowColor: "#18181B",
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: isDark ? 0.2 : 0.08,
          shadowRadius: 18,
        },
        android: { elevation: isDark ? 4 : 3 },
        web: {
          boxShadow: isDark
            ? "0 16px 42px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.06)"
            : "0 12px 32px rgba(15, 23, 42, 0.07), 0 4px 12px rgba(24, 24, 27, 0.04), inset 0 1px 0 rgba(255,255,255,0.94)",
        },
        default: {},
      }),
    },
    sectionHeaderRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: spacing.md,
      marginBottom: spacing.md,
      paddingTop: 0,
      paddingBottom: Platform.select({ web: homeSpacing.lg, default: homeSpacing.lg }),
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: isDark ? "rgba(255,255,255,0.1)" : "rgba(63, 63, 70, 0.08)",
    },
    sectionHeaderBlock: {
      flex: 1,
      minWidth: 0,
    },
    sectionTitleRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.sm,
      flex: 1,
      minWidth: 0,
    },
    sectionHeadingFlex: {
      flex: 1,
      minWidth: 0,
    },
    sectionHeading: {
      fontSize: Platform.OS === "web" ? typography.h2 : typography.h2,
      lineHeight: Platform.OS === "web" ? 30 : 31,
      fontFamily: FONT_DISPLAY,
      color: c.textPrimary,
      letterSpacing: Platform.OS === "web" ? -0.45 : -0.32,
    },
    sectionCountInline: {
      fontSize: typography.caption,
      fontFamily: fonts.semibold,
      paddingHorizontal: homeSpacing.md,
      paddingVertical: 4,
      borderRadius: radius.pill,
      overflow: "hidden",
      backgroundColor: isDark ? "rgba(148,163,184,0.18)" : c.secondarySoft,
      color: c.secondaryDark,
    },
    sectionSeeAllBtn: {
      flexDirection: "row",
      alignItems: "center",
      gap: homeSpacing.sm,
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderRadius: radius.pill,
      borderWidth: StyleSheet.hairlineWidth,
      ...Platform.select({
        ios: {
          shadowColor: "#18181B",
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.06,
          shadowRadius: 6,
        },
        android: { elevation: 2 },
        web: {
          boxShadow: "0 6px 16px rgba(24, 24, 27, 0.09)",
          transition: "background-color 0.18s ease, border-color 0.18s ease, box-shadow 0.18s ease, transform 0.18s ease",
        },
        default: {},
      }),
    },
    sectionSeeAllBtnHover: {
      backgroundColor: isDark ? "rgba(148,163,184,0.16)" : "rgba(255,255,255,0.95)",
      ...Platform.select({
        web: {
          boxShadow: "0 10px 22px rgba(24, 24, 27, 0.12)",
          transform: [{ translateY: -1 }],
        },
        default: {},
      }),
    },
    sectionSeeAll: {
      fontSize: typography.caption,
      fontFamily: fonts.semibold,
      letterSpacing: 0.2,
    },
    emptyLoader: {
      marginBottom: spacing.md,
    },
    productGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: homeSpacing.md,
      alignItems: "flex-start",
      alignContent: "flex-start",
      justifyContent: "flex-start",
    },
    footerFadeBridge: {
      width: "100%",
      maxWidth: layout.maxContentWidth,
      alignSelf: "center",
      height: 64,
      marginTop: -spacing.sm,
    },
    footerWrapper: {
      marginTop: spacing.lg,
      marginBottom: homeSpacing["3xl"],
    },
    pullRefreshOverlay: {
      position: "absolute",
      top: Math.max(safeTopInset, spacing.md) - 10,
      alignSelf: "center",
      width: 28,
      height: 28,
      borderRadius: 999,
      alignItems: "center",
      justifyContent: "center",
      zIndex: WEB_Z_INDEX.sticky + 5,
      backgroundColor: isDark ? "rgba(10,10,10,0.55)" : "rgba(255,255,255,0.85)",
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: HOME_LINE,
    },
    stickyBagBar: {
      position: "absolute",
      left: spacing.md,
      right: spacing.md,
      bottom: CUSTOMER_BOTTOM_NAV_BAR_HEIGHT + Math.max(safeBottomInset, 10) + 16,
      borderRadius: 12,
      backgroundColor: c.ink || "#0E1729",
      paddingVertical: 8,
      paddingHorizontal: 16,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      zIndex: WEB_Z_INDEX.sticky + 8,
    },
    stickyBagText: {
      color: "#FFFFFF",
      fontSize: 13,
      lineHeight: Math.round(13 * 1.4),
      fontFamily: fonts.regular,
    },
    stickyBagCta: {
      flexDirection: "row",
      alignItems: "center",
      gap: homeSpacing.xs,
      paddingVertical: homeSpacing.xs,
    },
    stickyBagCtaPressed: {
      opacity: 0.84,
    },
    stickyBagCtaText: {
      color: c.accent || "#C8A97E",
      fontSize: 13,
      lineHeight: Math.round(13 * 1.4),
      fontFamily: fonts.semibold,
    },
    flyGhost: {
      position: "absolute",
      top: 0,
      left: 0,
      width: 48,
      height: 60,
      borderRadius: 8,
      overflow: "hidden",
      zIndex: WEB_Z_INDEX.sticky + 12,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: "rgba(255,255,255,0.55)",
    },
    flyGhostImage: {
      width: "100%",
      height: "100%",
    },
    productGridWrap: {
      flexDirection: "row",
      flexWrap: "wrap",
      justifyContent: "flex-start",
      columnGap: productGridGap,
      rowGap: productGridGap,
      alignItems: "stretch",
    },
    productGridWrapCentered: {
      justifyContent: "center",
    },
    productGridCell: {
      marginBottom: 0,
      alignSelf: "stretch",
    },
    productGridListContent: {
      paddingBottom: homeSpacing.sm,
    },
    gridCell: {
      marginBottom: 0,
    },
    emptyWrap: {
      paddingVertical: homeSpacing["3xl"],
      alignItems: "center",
      paddingHorizontal: spacing.lg,
      ...Platform.select({
        web: {
          maxWidth: layout.maxContentWidth,
          alignSelf: "center",
          width: "100%",
        },
        default: {},
      }),
    },
    networkErrorWrap: {
      minHeight: 280,
      justifyContent: "center",
      gap: homeSpacing.sm,
    },
    networkErrorIcon: {
      marginBottom: homeSpacing.xs,
    },
    networkErrorTitle: {
      fontFamily: FONT_DISPLAY_SEMI,
      fontSize: 20,
      lineHeight: 24,
      textAlign: "center",
    },
    networkErrorBody: {
      fontFamily: fonts.regular,
      fontSize: 14,
      lineHeight: Math.round(14 * 1.45),
      textAlign: "center",
      maxWidth: 360,
    },
    networkRetryBtn: {
      marginTop: homeSpacing.sm,
      borderRadius: radius.pill,
      minHeight: 44,
      paddingHorizontal: homeSpacing.lg,
      alignItems: "center",
      justifyContent: "center",
    },
    networkRetryBtnPressed: {
      opacity: 0.9,
      transform: [{ scale: 0.98 }],
    },
    networkRetryBtnText: {
      color: "#FFFFFF",
      fontFamily: fonts.semibold,
      fontSize: 14,
      lineHeight: Math.round(14 * 1.4),
    },
    searchEmptyWrap: {
      gap: homeSpacing.sm,
      marginBottom: sectionGap,
    },
    searchEmptyTitle: {
      fontFamily: FONT_DISPLAY_SEMI,
      fontSize: 20,
      lineHeight: 24,
      textAlign: "center",
    },
    searchEmptyBody: {
      fontFamily: fonts.regular,
      fontSize: 14,
      lineHeight: Math.round(14 * 1.45),
      textAlign: "center",
      maxWidth: 380,
    },
    searchEmptyClearBtn: {
      marginTop: homeSpacing.sm,
      borderRadius: radius.pill,
      borderWidth: StyleSheet.hairlineWidth,
      minHeight: 42,
      paddingHorizontal: homeSpacing.lg,
      alignItems: "center",
      justifyContent: "center",
    },
    searchEmptyClearBtnPressed: {
      opacity: 0.85,
    },
    searchEmptyClearBtnText: {
      fontFamily: fonts.semibold,
      fontSize: 13,
      lineHeight: Math.round(13 * 1.4),
      letterSpacing: 0.2,
    },
    emptyIconCircle: {
      width: 96,
      height: 96,
      borderRadius: radius.xxl,
      backgroundColor: c.secondarySoft,
      borderWidth: 1.5,
      borderColor: c.secondaryBorder,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: spacing.lg,
      ...shadowLift,
    },
    emptyText: {
      textAlign: "center",
      color: c.textSecondary,
      fontSize: typography.bodySmall + 1,
      lineHeight: lineHeight.bodySmall + 4,
      fontFamily: fonts.medium,
      maxWidth: 340,
    },
    errorText: {
      flex: 1,
      fontSize: 14,
      lineHeight: Math.round(14 * 1.5),
      fontFamily: fonts.semibold,
    },
    emptySectionHint: {
      alignItems: "center",
      gap: spacing.sm,
      marginBottom: homeSpacing.lg,
      paddingVertical: spacing.md,
    },
    emptySectionText: {
      fontSize: typography.bodySmall,
      fontFamily: fonts.medium,
      color: c.textSecondary,
      textAlign: "center",
    },
    emptySectionClear: {
      fontSize: typography.bodySmall,
      fontFamily: fonts.semibold,
      color: c.secondary,
    },
    menuModalRoot: {
      flex: 1,
      backgroundColor: "transparent",
    },
    menuBackdrop: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: "rgba(12, 10, 8, 0.5)",
      zIndex: 0,
    },
    menuLayer: {
      ...StyleSheet.absoluteFillObject,
      zIndex: 1,
    },
    menuDropdown: {
      position: "absolute",
      minWidth: 288,
      maxWidth: "92%",
      borderRadius: radius.xxl + 2,
      borderWidth: StyleSheet.hairlineWidth,
      paddingBottom: spacing.lg,
      overflow: "hidden",
      ...Platform.select({
        ios: {
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 14 },
          shadowOpacity: 0.28,
          shadowRadius: 24,
        },
        android: { elevation: 14 },
        web: {
          boxShadow: "0 20px 50px rgba(12, 10, 8, 0.28)",
          zIndex: WEB_Z_INDEX.dropdown,
        },
        default: {},
      }),
    },
    menuGoldAccent: {
      height: 3,
      width: "100%",
      opacity: 0.95,
    },
    menuHeaderRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: homeSpacing.lg,
      paddingTop: homeSpacing.md,
      paddingBottom: homeSpacing.md,
    },
    menuHeaderTitle: {
      fontFamily: FONT_DISPLAY,
      fontSize: typography.h2,
      lineHeight: Math.round(typography.h2 * 1.1),
      letterSpacing: -(typography.h2 * 0.025),
      fontWeight: "500",
    },
    menuCloseBtn: {
      padding: homeSpacing.xs,
      borderRadius: radius.sm,
    },
    menuSectionLabel: {
      fontSize: 11,
      fontFamily: fonts.semibold,
      letterSpacing: 1.4,
      textTransform: "uppercase",
      paddingHorizontal: spacing.md,
      paddingTop: spacing.xs,
      paddingBottom: homeSpacing.sm,
    },
    menuRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.sm,
      marginHorizontal: spacing.sm,
      marginBottom: homeSpacing.xs,
      paddingVertical: 12,
      paddingHorizontal: spacing.sm,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: isDark ? "rgba(255,255,255,0.06)" : "rgba(63, 63, 70, 0.08)",
    },
    menuRowHover: {
      backgroundColor: isDark ? "rgba(148,163,184,0.08)" : "rgba(100, 116, 139, 0.08)",
    },
    menuRowSelected: {
      borderWidth: 1,
    },
    menuRowPressed: {
      opacity: 0.88,
    },
    menuIconCircle: {
      width: 40,
      height: 40,
      borderRadius: 12,
      alignItems: "center",
      justifyContent: "center",
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: isDark ? "rgba(255,255,255,0.1)" : "rgba(63, 63, 70, 0.16)",
    },
    menuRowTextCol: {
      flex: 1,
      minWidth: 0,
    },
    menuRowTitle: {
      fontSize: 14,
      lineHeight: Math.round(14 * 1.5),
      fontFamily: fonts.medium,
      letterSpacing: 0.1,
    },
    menuRowValue: {
      marginTop: homeSpacing.xs,
      fontSize: typography.caption,
      fontFamily: fonts.regular,
      lineHeight: Math.round(12 * 1.4),
    },
    menuPillActive: {
      paddingHorizontal: 8,
      paddingVertical: homeSpacing.xs,
      borderRadius: radius.pill,
      borderWidth: 1,
    },
    menuPillActiveText: {
      fontSize: 10,
      fontFamily: fonts.semibold,
      letterSpacing: 0.4,
      textTransform: "uppercase",
    },
    menuCheckPlaceholder: {
      width: 56,
      height: 24,
    },
    peNone: {
      pointerEvents: "none",
    },
    peBoxNone: {
      pointerEvents: "box-none",
    },
    notifyModalRoot: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: homeSpacing.lg,
      paddingVertical: homeSpacing["2xl"],
    },
    notifyModalBackdrop: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: "rgba(0,0,0,0.4)",
    },
    notifyModalCard: {
      width: "100%",
      maxWidth: 420,
      borderRadius: radius.xl,
      borderWidth: StyleSheet.hairlineWidth,
      paddingHorizontal: homeSpacing.lg,
      paddingVertical: homeSpacing.lg,
      gap: homeSpacing.sm,
    },
    notifyModalTitle: {
      fontFamily: FONT_DISPLAY_SEMI,
      fontSize: 22,
      lineHeight: 26,
    },
    notifyModalBody: {
      fontFamily: fonts.regular,
      fontSize: 14,
      lineHeight: Math.round(14 * 1.45),
    },
    notifyModalInput: {
      minHeight: 44,
      borderRadius: radius.md,
      borderWidth: StyleSheet.hairlineWidth,
      paddingHorizontal: homeSpacing.md,
      fontFamily: fonts.regular,
      fontSize: 14,
    },
    notifyModalSuccess: {
      fontFamily: fonts.medium,
      fontSize: 14,
      lineHeight: Math.round(14 * 1.4),
    },
    notifyModalActions: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "flex-end",
      gap: homeSpacing.sm,
      marginTop: homeSpacing.xs,
    },
    notifyModalPrimaryBtn: {
      borderRadius: radius.pill,
      minHeight: 40,
      paddingHorizontal: homeSpacing.base,
      alignItems: "center",
      justifyContent: "center",
    },
    notifyModalPrimaryText: {
      color: "#FFFFFF",
      fontFamily: fonts.semibold,
      fontSize: 13,
      lineHeight: Math.round(13 * 1.4),
    },
    notifyModalGhostBtn: {
      borderRadius: radius.pill,
      borderWidth: StyleSheet.hairlineWidth,
      minHeight: 40,
      paddingHorizontal: homeSpacing.base,
      alignItems: "center",
      justifyContent: "center",
    },
    notifyModalGhostText: {
      fontFamily: fonts.semibold,
      fontSize: 13,
      lineHeight: Math.round(13 * 1.4),
    },
    notifyModalBtnPressed: {
      opacity: 0.85,
    },
  });
}
