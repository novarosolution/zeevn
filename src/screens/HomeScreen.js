/* @refresh reset */
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useFocusEffect, useRoute } from "@react-navigation/native";
import {
  LayoutAnimation,
  Modal,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  UIManager,
  useWindowDimensions,
  View,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import MotionScrollView from "../components/motion/MotionScrollView";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import Animated, { FadeInDown, useAnimatedStyle, useSharedValue, withSequence, withTiming } from "react-native-reanimated";
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
import QCommerceSearchField from "../components/qcommerce/QCommerceSearchField";
import BrandWordmark from "../components/BrandWordmark";
import PremiumErrorBanner from "../components/ui/PremiumErrorBanner";
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
  HOME_VIEW_DEFAULTS,
  HOME_WORDMARK_TAGLINE,
  fillPlaceholders,
} from "../content/appContent";
import {
  BRAND_HOME_TOP_BAR_LAYOUT_HEIGHT,
  SEARCH_PLACEHOLDER,
} from "../constants/brand";
import {
  HOME_HERO_MOBILE_SLIDER_SLIDES,
  HOME_HERO_WEB_SLIDER_SLIDES,
} from "../constants/marketingAssets";
import { HOME_CATALOG_ALL, matchesShelfProduct } from "../utils/shelfMatch";
import { productToCartLine } from "../utils/productCart";
import {
  ALCHEMY,
  CUSTOMER_SHELL_GRADIENT_LOCATIONS,
  FONT_DISPLAY,
  FONT_DISPLAY_SEMI,
  getCustomerShellGradient,
} from "../theme/customerAlchemy";
import { customerPageScrollBase, customerScrollPaddingBottom, customerScrollPaddingTop } from "../theme/screenLayout";
import { WEB_HEADER_HEIGHT, WEB_Z_INDEX } from "../theme/web";
import GoldHairline from "../components/ui/GoldHairline";
import HomeMarketingHero from "../components/home/HomeMarketingHero";
import HomeTrustStrip from "../components/home/HomeTrustStrip";
import { HomeCatalogGridCard, HomeCatalogListRow } from "../components/home/HomeCatalogProductViews";
import ProductCard from "../components/ProductCard";
import { fetchMyNotifications, fetchMyOrders } from "../services/userService";

if (Platform.OS === "web") {
  gsap.registerPlugin(ScrollTrigger);
}

/** Room for optional tagline under home wordmark (keeps hamburger & cart aligned). */
const HOME_TOPBAR_TAGLINE_ROOM = 4;
/** Distance from top of screen to first row of menu (below home bar + gap). */
const HOME_MENU_TOP_OFFSET =
  BRAND_HOME_TOP_BAR_LAYOUT_HEIGHT + HOME_TOPBAR_TAGLINE_ROOM + spacing.sm * 2 + spacing.xs;
const HOME_RECENT_SEARCHES_STORAGE_KEY = "@zeevan/home/recent-searches";

/** Home lists the full catalog; `showOnHome` on each product still controls visibility. */
function matchesHomeShelf(product) {
  return matchesShelfProduct(product, HOME_CATALOG_ALL);
}

export default function HomeScreen({ navigation }) {
  const route = useRoute();
  const { colors: c, shadowLift, shadowPremium, isDark } = useTheme();
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const styles = useMemo(
    () => createHomeStyles(c, shadowLift, shadowPremium, isDark),
    [c, shadowLift, shadowPremium, isDark]
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
  const searchBlurTimeoutRef = useRef(null);
  const reorderToastTimerRef = useRef(null);

  const insets = useSafeAreaInsets();
  const { addToCart, removeFromCart, getItemQuantity, totalItems } = useCart();
  const { isAuthenticated, token, user, refreshProfile } = useAuth();
  const [query, setQuery] = useState("");
  const [searchFocused, setSearchFocused] = useState(false);
  const [searchPlaceholderIndex, setSearchPlaceholderIndex] = useState(0);
  const [recentSearches, setRecentSearches] = useState([]);
  const [unreadNotificationCount, setUnreadNotificationCount] = useState(0);
  const [viewToggleTooltip, setViewToggleTooltip] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [sectionFilter, setSectionFilter] = useState(null);
  const [categoryFilter, setCategoryFilter] = useState(null);
  const [pastOrders, setPastOrders] = useState([]);
  const [reorderToast, setReorderToast] = useState("");
  const [homeViewConfig, setHomeViewConfig] = useState({ ...HOME_VIEW_DEFAULTS });
  const [refreshing, setRefreshing] = useState(false);
  const [heroSlideIndex, setHeroSlideIndex] = useState(0);
  const [heroAutoPaused, setHeroAutoPaused] = useState(false);
  const [heroSliderWidth, setHeroSliderWidth] = useState(0);
  const [deliveryLine1, setDeliveryLine1] = useState("");
  const [deliveryCity, setDeliveryCity] = useState("");
  const [liveOrder, setLiveOrder] = useState(null);
  const showMarketing = !query.trim();
  const reducedMotion = useReducedMotion();
  const cartBounceScale = useSharedValue(1);
  const cartBounceStyle = useAnimatedStyle(() => ({
    transform: [{ scale: cartBounceScale.value }],
  }));
  const searchPlaceholders = useMemo(
    () =>
      Array.isArray(HOME_SEARCH_UI.searchPlaceholders) && HOME_SEARCH_UI.searchPlaceholders.length > 0
        ? HOME_SEARCH_UI.searchPlaceholders
        : [SEARCH_PLACEHOLDER],
    []
  );
  const activeSearchPlaceholder = reducedMotion
    ? searchPlaceholders[0]
    : searchPlaceholders[searchPlaceholderIndex % searchPlaceholders.length];
  const mobilePeekCardWidth = useMemo(() => {
    const inner = Math.max(280, windowWidth - customerPageScrollBase.paddingHorizontal * 2);
    return Math.max(148, Math.floor((inner - spacing.sm * 3) / 3.35));
  }, [windowWidth]);

  useEffect(() => {
    if (Platform.OS === "android" && UIManager.setLayoutAnimationEnabledExperimental) {
      UIManager.setLayoutAnimationEnabledExperimental(true);
    }
  }, []);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(HOME_RECENT_SEARCHES_STORAGE_KEY);
        const parsed = raw ? JSON.parse(raw) : [];
        if (active && Array.isArray(parsed)) {
          setRecentSearches(parsed.filter((item) => typeof item === "string").slice(0, 5));
        }
      } catch {
        if (active) setRecentSearches([]);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (reducedMotion || searchPlaceholders.length < 2 || searchFocused || query.trim().length > 0) {
      return undefined;
    }
    const timer = setInterval(() => {
      setSearchPlaceholderIndex((prev) => (prev + 1) % searchPlaceholders.length);
    }, 4000);
    return () => clearInterval(timer);
  }, [query, reducedMotion, searchFocused, searchPlaceholders.length]);

  useEffect(() => {
    if (reducedMotion) {
      setSearchPlaceholderIndex(0);
    }
  }, [reducedMotion]);

  const saveRecentSearch = useCallback(async (nextQuery) => {
    const normalized = String(nextQuery || "").trim();
    if (!normalized) return;
    setRecentSearches((prev) => {
      const next = [normalized, ...prev.filter((item) => item.toLowerCase() !== normalized.toLowerCase())].slice(0, 5);
      AsyncStorage.setItem(HOME_RECENT_SEARCHES_STORAGE_KEY, JSON.stringify(next)).catch(() => {});
      return next;
    });
  }, []);

  const onSearchFocus = useCallback(() => {
    if (searchBlurTimeoutRef.current) {
      clearTimeout(searchBlurTimeoutRef.current);
      searchBlurTimeoutRef.current = null;
    }
    LayoutAnimation.configureNext({
      duration: 220,
      update: { type: LayoutAnimation.Types.easeInEaseOut },
      create: { type: LayoutAnimation.Types.easeInEaseOut, property: LayoutAnimation.Properties.opacity },
      delete: { type: LayoutAnimation.Types.easeInEaseOut, property: LayoutAnimation.Properties.opacity },
    });
    setSearchFocused(true);
  }, []);

  const onSearchBlur = useCallback(() => {
    if (searchBlurTimeoutRef.current) {
      clearTimeout(searchBlurTimeoutRef.current);
    }
    searchBlurTimeoutRef.current = setTimeout(() => {
      LayoutAnimation.configureNext({
        duration: 220,
        update: { type: LayoutAnimation.Types.easeInEaseOut },
        create: { type: LayoutAnimation.Types.easeInEaseOut, property: LayoutAnimation.Properties.opacity },
        delete: { type: LayoutAnimation.Types.easeInEaseOut, property: LayoutAnimation.Properties.opacity },
      });
      setSearchFocused(false);
      searchBlurTimeoutRef.current = null;
    }, 120);
  }, []);

  const onSearchSubmit = useCallback(() => {
    saveRecentSearch(query);
  }, [query, saveRecentSearch]);

  const onPickRecentSearch = useCallback(
    (value) => {
      setQuery(value);
      saveRecentSearch(value);
      if (searchBlurTimeoutRef.current) {
        clearTimeout(searchBlurTimeoutRef.current);
        searchBlurTimeoutRef.current = null;
      }
      LayoutAnimation.configureNext({
        duration: 220,
        update: { type: LayoutAnimation.Types.easeInEaseOut },
        create: { type: LayoutAnimation.Types.easeInEaseOut, property: LayoutAnimation.Properties.opacity },
        delete: { type: LayoutAnimation.Types.easeInEaseOut, property: LayoutAnimation.Properties.opacity },
      });
      setSearchFocused(false);
    },
    [saveRecentSearch]
  );

  useEffect(
    () => () => {
      if (searchBlurTimeoutRef.current) {
        clearTimeout(searchBlurTimeoutRef.current);
      }
      if (reorderToastTimerRef.current) {
        clearTimeout(reorderToastTimerRef.current);
      }
    },
    []
  );

  const locationChipLabel = useMemo(() => {
    const line = String(deliveryLine1 || "").trim();
    const city = String(deliveryCity || "").trim();
    if (city) return city;
    if (line) return line;
    return HOME_SEARCH_UI.locationEmptyLabel;
  }, [deliveryCity, deliveryLine1]);
  const hasDeliveryAddress = useMemo(
    () => Boolean(String(deliveryLine1 || "").trim() || String(deliveryCity || "").trim()),
    [deliveryCity, deliveryLine1]
  );
  const shouldStackConcierge = Platform.OS !== "web" && windowWidth < 390 && !hasDeliveryAddress;
  const locationChipDisplayLabel = hasDeliveryAddress
    ? locationChipLabel
    : Platform.OS === "web"
      ? HOME_SEARCH_UI.locationEmptyLabel
    : shouldStackConcierge
      ? HOME_SEARCH_UI.locationEmptyLabel
      : HOME_SEARCH_UI.locationCtaShort || HOME_SEARCH_UI.locationEmptyLabel;

  const openAddressSelector = useCallback(() => {
    navigation.navigate("ManageAddress");
  }, [navigation]);

  const openNotifications = useCallback(() => {
    navigation.navigate("Notifications");
  }, [navigation]);

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
    const w = heroSliderWidth > 0 ? heroSliderWidth : Math.min(windowWidth, layout.maxContentWidth);
    if (Platform.OS === "web") {
      return Math.min(420, Math.max(320, Math.round(w * 0.32)));
    }
    const ideal = Math.round(w * 0.78);
    const maxFromScreen = Math.round(windowHeight * 0.52);
    return Math.max(280, Math.min(ideal, 430, maxFromScreen));
  }, [heroSliderWidth, windowWidth, windowHeight]);

  const loadHomeData = useCallback(async ({ isPullRefresh = false } = {}) => {
    if (isPullRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError("");
    try {
      const [data, viewConfig] = await Promise.all([getProducts(), getHomeViewConfig()]);
      setProducts(data);
      setHomeViewConfig(viewConfig);
    } catch (err) {
      setError(err.message || HOME_SEARCH_UI.loadErrorFallback);
    } finally {
      if (isPullRefresh) {
        setRefreshing(false);
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
  /** Two-column tiles on tablets / landscape — list stays for active search (easier to scan). */
  const useProductGridLayout = windowWidth >= 560 && !query.trim();
  const catalogGridMetrics = useMemo(() => {
    if (!useProductGridLayout) return null;
    const surfacePad = Platform.OS === "web" ? spacing.xl + 6 : spacing.md + 8;
    const gap = Platform.OS === "web" ? spacing.lg : spacing.md;
    const desiredColumnCount =
      windowWidth >= 1500 ? 5 : windowWidth >= 1260 ? 4 : windowWidth >= 920 ? 3 : 2;
    const contentW = Math.min(windowWidth, layout.maxContentWidth);
    const innerWidth = Math.max(0, contentW - surfacePad * 2);
    return { gap, desiredColumnCount, innerWidth };
  }, [useProductGridLayout, windowWidth]);
  const getCatalogGridColStyle = useCallback(
    (itemCount = 1) => {
      if (!catalogGridMetrics) return null;
      const effectiveColumnCount = Math.max(1, Math.min(catalogGridMetrics.desiredColumnCount, itemCount));
      const totalGap = catalogGridMetrics.gap * Math.max(0, effectiveColumnCount - 1);
      const rawColumnWidth = Math.max(
        176,
        Math.floor((catalogGridMetrics.innerWidth - totalGap) / effectiveColumnCount)
      );
      const cappedColumnWidth = Platform.select({
        web:
          effectiveColumnCount <= 2
            ? 420
            : effectiveColumnCount === 3
              ? 360
              : 320,
        default: rawColumnWidth,
      });
      const finalColumnWidth = Math.min(rawColumnWidth, cappedColumnWidth);
      return {
        width: finalColumnWidth,
        minWidth: finalColumnWidth,
        maxWidth: finalColumnWidth,
        flexGrow: effectiveColumnCount > 1 ? 1 : 0,
      };
    },
    [catalogGridMetrics]
  );

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

  const showAddedToBagToast = useCallback(() => {
    setReorderToast("Added to bag");
    if (reorderToastTimerRef.current) {
      clearTimeout(reorderToastTimerRef.current);
    }
    reorderToastTimerRef.current = setTimeout(() => {
      setReorderToast("");
      reorderToastTimerRef.current = null;
    }, 1600);
  }, []);

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
      triggerCartIconBounce();
    },
    [addToCart, isAuthenticated, navigation, showAddedToBagToast, triggerCartIconBounce]
  );

  const handleCatalogAddToCart = useCallback(
    (product) => {
      if (product.inStock === false || Number(product.stockQty || 0) <= 0) return;
      if (!isAuthenticated) {
        navigation.navigate("Login");
        return;
      }
      addToCart(productToCartLine(product));
    },
    [addToCart, isAuthenticated, navigation]
  );

  const handleCatalogRemoveFromCart = useCallback(
    (productId) => {
      if (!isAuthenticated) {
        navigation.navigate("Login");
        return;
      }
      removeFromCart(productId);
    },
    [isAuthenticated, navigation, removeFromCart]
  );

  const shellColors = useMemo(() => getCustomerShellGradient(isDark, c), [isDark, c]);
  const heroSlides = useMemo(() => {
    const source = Platform.OS === "web" ? HOME_HERO_WEB_SLIDER_SLIDES : HOME_HERO_MOBILE_SLIDER_SLIDES;
    return source.map((slide, index) => ({
      ...slide,
      title: index === 0 ? homeViewConfig.heroTitle : slide.title,
      subtitle: index === 0 ? homeViewConfig.heroSubtitle || slide.subtitle : slide.subtitle,
      cta: index === 0 ? HOME_HERO_BANNER.cta : slide.cta,
    }));
  }, [homeViewConfig.heroTitle, homeViewConfig.heroSubtitle]);

  const scrollToFeatured = useCallback(() => {
    const y = Math.max(0, featuredYRef.current - 12);
    scrollRef.current?.scrollTo({ y, animated: true });
  }, []);

  const goToHeroSlide = useCallback((index) => {
    const w = heroSliderWidth;
    if (w <= 0 || heroSlides.length === 0) return;
    const next = Math.max(0, Math.min(index, heroSlides.length - 1));
    heroSliderRef.current?.scrollTo({ x: next * w, animated: true });
    setHeroSlideIndex(next);
  }, [heroSliderWidth, heroSlides.length]);

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
    if (!showMarketing || heroAutoPaused || heroSlides.length < 2 || heroSliderWidth <= 0) return undefined;
    const timer = setInterval(() => {
      setHeroSlideIndex((prev) => {
        const next = (prev + 1) % heroSlides.length;
        heroSliderRef.current?.scrollTo({ x: next * heroSliderWidth, animated: true });
        return next;
      });
    }, 6000);
    return () => clearInterval(timer);
  }, [showMarketing, heroAutoPaused, heroSlides.length, heroSliderWidth]);

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
    if (Platform.OS !== "web" || reducedMotion) return undefined;
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
  }, [reducedMotion, showMarketing, sectionsForRender.length, totalMatches, query, loading]);

  const renderCatalogItems = (items, listKeyPrefix = "cat") => {
    const outOfStock = (p) => p.inStock === false || Number(p.stockQty || 0) <= 0;
    if (!Array.isArray(items) || items.length === 0) {
      return (
        <View style={styles.inlineSectionEmpty}>
          <Text style={styles.inlineSectionEmptyTitle}>No products in this section yet.</Text>
          <View style={styles.inlineSectionCategoryRow}>
            {HOME_CATEGORY_QUICK_NAV.slice(0, 4).map((cat) => (
              <Pressable
                key={`${listKeyPrefix}-${cat.key}`}
                onPress={() => onCategoryPress(cat)}
                style={({ pressed }) => [styles.inlineSectionCategoryChip, pressed ? styles.inlineSectionCategoryChipPressed : null]}
                accessibilityRole="button"
                accessibilityLabel={`Filter by ${cat.label}`}
              >
                <Text style={styles.inlineSectionCategoryChipText}>{cat.label}</Text>
              </Pressable>
            ))}
          </View>
        </View>
      );
    }
    const gridCellStyle = getCatalogGridColStyle(items.length);
    if (useProductGridLayout && gridCellStyle && items.length > 0) {
      return (
        <View
          style={[
            styles.productGridWrap,
            items.length < (catalogGridMetrics?.desiredColumnCount || 1) ? styles.productGridWrapCentered : null,
          ]}
        >
          {items.map((item, idx) => (
            <HomeCatalogGridCard
              key={item.id ?? `${listKeyPrefix}-g-${idx}`}
              catalogGridColStyle={gridCellStyle}
              cardStyle={homeViewConfig.productCardStyle}
              idx={idx}
              isOutOfStock={outOfStock(item)}
              item={item}
              navigation={navigation}
              quantity={getItemQuantity(item.id)}
              styles={styles}
              onAddToCart={() => handleCatalogAddToCart(item)}
              onRemoveFromCart={() => handleCatalogRemoveFromCart(item.id)}
            />
          ))}
        </View>
      );
    }
    if (Platform.OS !== "web") {
      return (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.mobilePeekRow}
          style={styles.mobilePeekScroll}
        >
          {items.map((item, idx) => (
            <View
              key={item.id ?? `${listKeyPrefix}-m-${idx}`}
              style={[
                styles.mobilePeekItem,
                {
                  width: mobilePeekCardWidth,
                },
              ]}
            >
              <ProductCard
                index={idx}
                isOutOfStock={outOfStock(item)}
                product={item}
                onPress={() => navigation.navigate("Product", { productId: item.id })}
                quantity={getItemQuantity(item.id)}
                onAddToCart={() => handleCatalogAddToCart(item)}
                onRemoveFromCart={() => handleCatalogRemoveFromCart(item.id)}
                variant="grid"
                compact={homeViewConfig.productCardStyle !== "comfortable"}
                editorial={homeViewConfig.productCardStyle === "comfortable"}
                showEta={homeViewConfig.productCardStyle === "comfortable"}
              />
            </View>
          ))}
        </ScrollView>
      );
    }
    return items.map((item, idx) => (
      <HomeCatalogListRow
        key={item.id ?? `${listKeyPrefix}-r-${idx}`}
        index={idx}
        isOutOfStock={outOfStock(item)}
        item={item}
        navigation={navigation}
        quantity={getItemQuantity(item.id)}
        cardStyle={homeViewConfig.productCardStyle}
        styles={styles}
        totalInGroup={items.length}
        onAddToCart={() => handleCatalogAddToCart(item)}
        onRemoveFromCart={() => handleCatalogRemoveFromCart(item.id)}
      />
    ));
  };
  return (
    <View ref={webRootRef} style={styles.screen}>
      <LinearGradient
        colors={shellColors}
        locations={CUSTOMER_SHELL_GRADIENT_LOCATIONS}
        start={{ x: 0.06, y: 0 }}
        end={{ x: 0.94, y: 1 }}
        style={styles.gradientFill}
      >
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
        <MotionScrollView
        ref={scrollRef}
        style={styles.scrollMain}
        scrollEventThrottle={16}
        contentContainerStyle={[
          customerPageScrollBase,
          {
            paddingTop:
              Platform.OS === "web"
                ? customerScrollPaddingTop(insets, { webMin: spacing.md })
                : spacing.xl + 6,
            paddingBottom: customerScrollPaddingBottom(insets),
            paddingHorizontal:
              Platform.OS === "web"
                ? windowWidth < 720
                  ? spacing.sm
                  : windowWidth < 980
                    ? spacing.md
                    : customerPageScrollBase.paddingHorizontal
                : customerPageScrollBase.paddingHorizontal,
          },
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          Platform.OS === "web" ? undefined : (
            <RefreshControl
              refreshing={refreshing}
              onRefresh={async () => {
                await loadHomeData({ isPullRefresh: true });
                await refreshDeliverySnippet();
              }}
              tintColor={c.primary}
              colors={[c.primary]}
              progressBackgroundColor={c.surface}
            />
          )
        }
      >
        <View
          ref={webHeaderRef}
          nativeID="home-hero"
          style={[styles.headerWrap, { paddingTop: Math.max(insets.top, spacing.md) }]}
        >
          {Platform.OS !== "web" ? (
            <View
              style={[
                styles.headerAmbientCard,
                isDark ? styles.headerAmbientCardDark : styles.headerAmbientCardLight,
              ]}
            >
              <LinearGradient
                colors={[ALCHEMY.gold, "rgba(220, 38, 38, 0.35)", "transparent"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[styles.headerAmbientSheen, styles.peNone]}
              />
              <View style={styles.topBarShellNested}>
                <View style={styles.alchemyTopBar}>
                  <Pressable
                    onPress={() => setMenuOpen(true)}
                    style={({ pressed }) => [styles.alchemyIconBtn, pressed && { opacity: 0.75 }]}
                    hitSlop={10}
                    accessibilityRole="button"
                    accessibilityLabel="Open menu"
                  >
                    <Ionicons name="menu" size={icon.nav} color={isDark ? c.textPrimary : ALCHEMY.brown} />
                  </Pressable>
                  <View style={styles.wordmarkBlock}>
                    <BrandWordmark sizeKey="homeTopBar" style={styles.topBarLogo} />
                    {HOME_WORDMARK_TAGLINE ? (
                      <Text
                        style={[styles.topBarTagline, { color: c.textMuted }]}
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
                    accessibilityLabel={totalItems > 0 ? `Cart, ${totalItems} items` : "Cart"}
                  >
                    <Animated.View style={[styles.cartBtnInner, cartBounceStyle]}>
                      <Ionicons name="bag-handle-outline" size={icon.nav} color={isDark ? c.textPrimary : ALCHEMY.brown} />
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
                <View style={[styles.conciergeBar, shouldStackConcierge ? styles.conciergeBarStacked : null, isDark ? styles.conciergeBarDark : null]}>
                  {shouldStackConcierge ? (
                    <View style={styles.conciergeTopRow}>
                      <Pressable
                        onPress={openAddressSelector}
                        style={({ pressed }) => [
                          styles.conciergeLocationChip,
                          styles.conciergeLocationChipStacked,
                          pressed ? styles.conciergePressed : null,
                        ]}
                        accessibilityRole="button"
                        accessibilityLabel={`${HOME_SEARCH_UI.locationChipA11yPrefix}. ${locationChipLabel}`}
                      >
                        <Ionicons name="location-outline" size={icon.xs + 1} color={c.textSecondary} />
                        <Text style={styles.conciergeLocationText} numberOfLines={1} ellipsizeMode="tail">
                          {locationChipDisplayLabel}
                        </Text>
                        <Ionicons name="chevron-down" size={icon.xs} color={c.textMuted} />
                      </Pressable>
                      <Pressable
                        onPress={openNotifications}
                        style={({ pressed }) => [styles.conciergeIconBtn, pressed ? styles.conciergePressed : null]}
                        accessibilityRole="button"
                        accessibilityLabel={HOME_SEARCH_UI.notificationsA11y}
                      >
                        <Ionicons name="notifications-outline" size={icon.md} color={c.textPrimary} />
                        {unreadNotificationCount > 0 ? <View style={styles.conciergeUnreadDot} /> : null}
                      </Pressable>
                    </View>
                  ) : (
                    <React.Fragment>
                      <Pressable
                        onPress={openAddressSelector}
                        style={({ pressed }) => [styles.conciergeLocationChip, pressed ? styles.conciergePressed : null]}
                        accessibilityRole="button"
                        accessibilityLabel={`${HOME_SEARCH_UI.locationChipA11yPrefix}. ${locationChipLabel}`}
                      >
                        <Ionicons name="location-outline" size={icon.xs + 1} color={c.textSecondary} />
                        <Text style={styles.conciergeLocationText} numberOfLines={1} ellipsizeMode="tail">
                          {locationChipDisplayLabel}
                        </Text>
                        <Ionicons name="chevron-down" size={icon.xs} color={c.textMuted} />
                      </Pressable>
                    </React.Fragment>
                  )}
                  <View
                    style={[
                      styles.conciergeSearchWrap,
                      searchFocused ? styles.conciergeSearchWrapFocused : null,
                      shouldStackConcierge ? styles.conciergeSearchWrapStacked : null,
                    ]}
                  >
                    <QCommerceSearchField
                      premium
                      value={query}
                      onChangeText={setQuery}
                      onClear={() => setQuery("")}
                      placeholder={activeSearchPlaceholder}
                      onFocus={onSearchFocus}
                      onBlur={onSearchBlur}
                      onSubmitEditing={onSearchSubmit}
                      accessibilityLabel="Search products"
                      containerStyle={styles.conciergeSearchInputShell}
                      inputStyle={styles.conciergeSearchInput}
                    />
                    {searchFocused ? (
                      <View style={styles.recentSearchDropdown}>
                        <Text style={styles.recentSearchTitle}>{HOME_SEARCH_UI.recentSearchesTitle}</Text>
                        {recentSearches.length > 0 ? (
                          recentSearches.map((item) => (
                            <Pressable
                              key={item}
                              onPress={() => onPickRecentSearch(item)}
                              style={({ pressed }) => [styles.recentSearchItem, pressed ? styles.conciergePressed : null]}
                              accessibilityRole="button"
                              accessibilityLabel={`Use recent search ${item}`}
                            >
                              <Ionicons name="time-outline" size={icon.xs} color={c.textMuted} />
                              <Text style={styles.recentSearchItemText} numberOfLines={1}>
                                {item}
                              </Text>
                            </Pressable>
                          ))
                        ) : (
                          <Text style={styles.recentSearchEmpty}>{HOME_SEARCH_UI.recentSearchesEmpty}</Text>
                        )}
                      </View>
                    ) : null}
                  </View>
                  {!shouldStackConcierge ? (
                    <Pressable
                      onPress={openNotifications}
                      style={({ pressed }) => [styles.conciergeIconBtn, pressed ? styles.conciergePressed : null]}
                      accessibilityRole="button"
                      accessibilityLabel={HOME_SEARCH_UI.notificationsA11y}
                    >
                      <Ionicons name="notifications-outline" size={icon.md} color={c.textPrimary} />
                      {unreadNotificationCount > 0 ? <View style={styles.conciergeUnreadDot} /> : null}
                    </Pressable>
                  ) : null}
                </View>
              </View>
            </View>
          ) : (
            <View style={[styles.webSearchRail, isDark ? styles.conciergeBarDark : null]}>
              <Pressable
                onPress={openAddressSelector}
                style={({ pressed }) => [styles.conciergeLocationChip, styles.conciergeLocationChipWeb, pressed ? styles.conciergePressed : null]}
                accessibilityRole="button"
                accessibilityLabel={`${HOME_SEARCH_UI.locationChipA11yPrefix}. ${locationChipLabel}`}
              >
                <Ionicons name="location-outline" size={icon.xs + 1} color={c.textSecondary} />
                <Text style={styles.conciergeLocationText} numberOfLines={1} ellipsizeMode="tail">
                  {locationChipDisplayLabel}
                </Text>
                <Ionicons name="chevron-down" size={icon.xs} color={c.textMuted} />
              </Pressable>
              <View style={[styles.searchWrap, styles.searchWrapWeb, styles.conciergeSearchWrap, searchFocused ? styles.conciergeSearchWrapFocused : null]}>
                <QCommerceSearchField
                  premium
                  value={query}
                  onChangeText={setQuery}
                  onClear={() => setQuery("")}
                  placeholder={activeSearchPlaceholder}
                  onFocus={onSearchFocus}
                  onBlur={onSearchBlur}
                  onSubmitEditing={onSearchSubmit}
                  accessibilityLabel="Search products"
                  containerStyle={styles.conciergeSearchInputShell}
                  inputStyle={styles.conciergeSearchInput}
                />
                {searchFocused ? (
                  <View style={styles.recentSearchDropdown}>
                    <Text style={styles.recentSearchTitle}>{HOME_SEARCH_UI.recentSearchesTitle}</Text>
                    {recentSearches.length > 0 ? (
                      recentSearches.map((item) => (
                        <Pressable
                          key={item}
                          onPress={() => onPickRecentSearch(item)}
                          style={({ pressed }) => [styles.recentSearchItem, pressed ? styles.conciergePressed : null]}
                          accessibilityRole="button"
                          accessibilityLabel={`Use recent search ${item}`}
                        >
                          <Ionicons name="time-outline" size={icon.xs} color={c.textMuted} />
                          <Text style={styles.recentSearchItemText} numberOfLines={1}>
                            {item}
                          </Text>
                        </Pressable>
                      ))
                    ) : (
                      <Text style={styles.recentSearchEmpty}>{HOME_SEARCH_UI.recentSearchesEmpty}</Text>
                    )}
                  </View>
                ) : null}
              </View>
              <Pressable
                onPress={openNotifications}
                style={({ pressed }) => [styles.conciergeIconBtn, styles.conciergeIconBtnWeb, pressed ? styles.conciergePressed : null]}
                accessibilityRole="button"
                accessibilityLabel={HOME_SEARCH_UI.notificationsA11y}
              >
                <Ionicons name="notifications-outline" size={icon.md} color={c.textPrimary} />
                {unreadNotificationCount > 0 ? <View style={styles.conciergeUnreadDot} /> : null}
              </Pressable>
            </View>
          )}

          <HomeMarketingHero
            onHeroPressIn={() => setHeroAutoPaused(true)}
            onHeroPressOut={() => setHeroAutoPaused(false)}
            goToHeroSlide={goToHeroSlide}
            handleHeroSlideAction={handleHeroSlideAction}
            heroSlideHeight={heroSlideHeight}
            heroSlideIndex={heroSlideIndex}
            heroSliderRef={heroSliderRef}
            heroSliderWidth={heroSliderWidth}
            heroSlides={heroSlides}
            homeViewConfig={homeViewConfig}
            isDark={isDark}
            reducedMotion={reducedMotion}
            setHeroSlideIndex={setHeroSlideIndex}
            setHeroSliderWidth={setHeroSliderWidth}
            showMarketing={showMarketing}
            styles={styles}
            webHeroRef={webHeroRef}
          />

          {showMarketing && !query.trim() ? (
            <View style={styles.categoryQuickNavWrap}>
              <HomeCategoryGrid
                categories={HOME_CATEGORY_QUICK_NAV}
                overline={HOME_CATEGORY_UI.overline}
                title={HOME_CATEGORY_UI.title}
                viewAllLabel={HOME_CATEGORY_UI.viewAllLabel}
                onPressCategory={onCategoryPress}
                onPressViewAll={openAllCategories}
              />
            </View>
          ) : null}
          {isAuthenticated && showMarketing && !query.trim() ? (
            <HomeReorderStrip
              items={reorderItems}
              overline={HOME_REORDER_STRIP.overline}
              title={HOME_REORDER_STRIP.title}
              onAdd={handleReorderAdd}
            />
          ) : null}
          {reorderToast ? (
            <View style={styles.reorderToastWrap}>
              <PremiumErrorBanner severity="success" message={reorderToast} compact />
            </View>
          ) : null}
          {isAuthenticated && liveOrder ? (
            <View style={styles.liveOrderPinnedWrap}>
              <HomeLiveOrderPinnedCard order={liveOrder} onPress={() => navigation.navigate("MyOrders")} />
            </View>
          ) : null}

          {query.trim() ? (
            <TouchableOpacity style={styles.activeFilterBar} onPress={() => setQuery("")} activeOpacity={0.85}>
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
            <TouchableOpacity style={styles.sectionFilterBar} onPress={clearSectionFilter} activeOpacity={0.85}>
              <Ionicons name="layers-outline" size={icon.xs} color={c.secondary} />
              <Text style={styles.activeFilterText} numberOfLines={1}>
                {sectionFilter}
              </Text>
              <Text style={styles.sectionFilterClear}>{HOME_SEARCH_UI.activeFilterClear}</Text>
            </TouchableOpacity>
          ) : null}
          {categoryFilter ? (
            <TouchableOpacity style={styles.sectionFilterBar} onPress={clearCategoryFilter} activeOpacity={0.85}>
              <Ionicons name="grid-outline" size={icon.xs} color={c.secondary} />
              <Text style={styles.activeFilterText} numberOfLines={1}>
                {categoryFilter}
              </Text>
              <Text style={styles.sectionFilterClear}>{HOME_SEARCH_UI.activeFilterClear}</Text>
            </TouchableOpacity>
          ) : null}
          {error ? (
            <View
              style={[
                styles.homeErrorBanner,
                {
                  borderColor: isDark ? "rgba(248, 113, 113, 0.35)" : "rgba(220, 38, 38, 0.28)",
                  backgroundColor: isDark ? "rgba(220, 38, 38, 0.14)" : "rgba(220, 38, 38, 0.07)",
                },
              ]}
            >
              <Ionicons name="alert-circle-outline" size={icon.md} color={c.danger} style={styles.homeErrorIcon} />
              <Text style={[styles.errorText, { color: c.textPrimary }]}>{error}</Text>
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
                  <Text style={styles.catalogIntroEyebrow}>Signature selection</Text>
                  <Text style={styles.catalogIntroTitle}>
                    {showMarketing ? HOME_CATALOG_INTRO.starter : HOME_CATALOG_INTRO.all}
                  </Text>
                </View>
                <View style={styles.catalogViewToggleWrap}>
                  <Pressable
                    onPress={() => setCatalogCardStyle("comfortable")}
                    onHoverIn={() => (Platform.OS === "web" ? setViewToggleTooltip("Comfortable cards") : null)}
                    onHoverOut={() => (Platform.OS === "web" ? setViewToggleTooltip("") : null)}
                    style={({ pressed }) => [
                      styles.catalogViewToggleBtn,
                      homeViewConfig.productCardStyle === "comfortable" ? styles.catalogViewToggleBtnActive : null,
                      pressed ? styles.catalogViewToggleBtnPressed : null,
                    ]}
                    accessibilityRole="button"
                    accessibilityLabel="Comfortable card view"
                  >
                    <Ionicons name="albums-outline" size={icon.sm} color={c.textPrimary} />
                  </Pressable>
                  <Pressable
                    onPress={() => setCatalogCardStyle("compact")}
                    onHoverIn={() => (Platform.OS === "web" ? setViewToggleTooltip("Compact cards") : null)}
                    onHoverOut={() => (Platform.OS === "web" ? setViewToggleTooltip("") : null)}
                    style={({ pressed }) => [
                      styles.catalogViewToggleBtn,
                      homeViewConfig.productCardStyle === "compact" ? styles.catalogViewToggleBtnActive : null,
                      pressed ? styles.catalogViewToggleBtnPressed : null,
                    ]}
                    accessibilityRole="button"
                    accessibilityLabel="Compact card view"
                  >
                    <Ionicons name="grid-outline" size={icon.sm} color={c.textPrimary} />
                  </Pressable>
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
        ) : totalMatches > 0 ? (
          <View
            onLayout={(e) => {
              featuredYRef.current = e.nativeEvent.layout.y;
            }}
          >
            <View style={styles.catalogIntroCard}>
              <View style={styles.catalogIntroBanner}>
                <View style={styles.catalogIntroLeft}>
                  <Text style={styles.catalogIntroEyebrow}>Signature selection</Text>
                  <Text style={styles.catalogIntroTitle}>
                    {showMarketing ? HOME_CATALOG_INTRO.starter : HOME_CATALOG_INTRO.all}
                  </Text>
                </View>
                <View style={styles.catalogViewToggleWrap}>
                  <Pressable
                    onPress={() => setCatalogCardStyle("comfortable")}
                    onHoverIn={() => (Platform.OS === "web" ? setViewToggleTooltip("Comfortable cards") : null)}
                    onHoverOut={() => (Platform.OS === "web" ? setViewToggleTooltip("") : null)}
                    style={({ pressed }) => [
                      styles.catalogViewToggleBtn,
                      homeViewConfig.productCardStyle === "comfortable" ? styles.catalogViewToggleBtnActive : null,
                      pressed ? styles.catalogViewToggleBtnPressed : null,
                    ]}
                    accessibilityRole="button"
                    accessibilityLabel="Comfortable card view"
                  >
                    <Ionicons name="albums-outline" size={icon.sm} color={c.textPrimary} />
                  </Pressable>
                  <Pressable
                    onPress={() => setCatalogCardStyle("compact")}
                    onHoverIn={() => (Platform.OS === "web" ? setViewToggleTooltip("Compact cards") : null)}
                    onHoverOut={() => (Platform.OS === "web" ? setViewToggleTooltip("") : null)}
                    style={({ pressed }) => [
                      styles.catalogViewToggleBtn,
                      homeViewConfig.productCardStyle === "compact" ? styles.catalogViewToggleBtnActive : null,
                      pressed ? styles.catalogViewToggleBtnPressed : null,
                    ]}
                    accessibilityRole="button"
                    accessibilityLabel="Compact card view"
                  >
                    <Ionicons name="grid-outline" size={icon.sm} color={c.textPrimary} />
                  </Pressable>
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
                <Animated.View
                  key={section.title}
                  style={styles.listSection}
                  entering={
                    Platform.OS === "web" || reducedMotion
                      ? undefined
                      : FadeInDown.delay(Math.min(sIdx * 72, 400)).duration(420)
                  }
                >
                  <View ref={(node) => setWebCatalogRef(sIdx, node)} style={styles.catalogSurface}>
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
                </Animated.View>
              ))}
              </View>
            ) : (
              <Animated.View
                nativeID="home-sections"
                collapsable={false}
                style={styles.listSection}
                entering={Platform.OS === "web" || reducedMotion ? undefined : FadeInDown.delay(80).duration(440)}
              >
                <View ref={(node) => setWebCatalogRef(0, node)} style={styles.catalogSurface}>
                  <HomeSectionHeader
                    overline={homeViewConfig.showPrimeSection ? HOME_SEARCH_UI.primeOverline : HOME_SEARCH_UI.catalogOverlineDefault}
                    title={homeViewConfig.showPrimeSection ? homeViewConfig.primeSectionTitle : HOME_SEARCH_UI.allProductsTitle}
                    count={productsForHome.length}
                  />
                  {renderCatalogItems(productsForHome, "shop")}
                </View>
              </Animated.View>
            )}
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
          <HomeTrustStrip
            c={c}
            forwardedRef={webTrustRef}
            isDark={isDark}
            reducedMotion={reducedMotion}
            styles={styles}
          />
        ) : null}

        {showMarketing && !query.trim() ? (
          <GoldHairline marginVertical={spacing.md} withDot />
        ) : null}

        {showMarketing && !query.trim() ? (
          <HomeStatsStrip c={c} isDark={isDark} />
        ) : null}

        {showMarketing && !query.trim() ? (
          <HomeTestimonials c={c} isDark={isDark} />
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
        <BottomNavBar />
      </LinearGradient>

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
            accessibilityLabel="Close menu"
          />
          <View style={[styles.menuLayer, styles.peBoxNone]}>
            <View
              style={[
                styles.menuDropdown,
                {
                  top:
                    Math.max(insets.top, Platform.OS === "web" ? spacing.md : spacing.sm) + HOME_MENU_TOP_OFFSET,
                  left: spacing.lg,
                  backgroundColor: isDark ? c.surface : ALCHEMY.cardBg,
                  borderColor: isDark ? c.border : ALCHEMY.pillInactive,
                },
              ]}
              collapsable={false}
            >
              <LinearGradient
                colors={[ALCHEMY.gold, ALCHEMY.brown]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.menuGoldAccent}
              />
              <View style={styles.menuHeaderRow}>
                <Text style={[styles.menuHeaderTitle, { color: c.textPrimary }]}>Menu</Text>
                <Pressable
                  onPress={() => setMenuOpen(false)}
                  style={({ pressed }) => [styles.menuCloseBtn, pressed && { opacity: 0.7 }]}
                  hitSlop={12}
                  accessibilityRole="button"
                  accessibilityLabel="Close menu"
                >
                  <Ionicons name="close" size={icon.lg} color={c.textSecondary} />
                </Pressable>
              </View>
              <Text style={[styles.menuSectionLabel, { color: c.textMuted }]}>Account</Text>
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

function createHomeStyles(c, shadowLift, shadowPremium, isDark) {
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
      paddingBottom: Platform.select({ web: spacing.md + 4, default: spacing.sm + 4 }),
    },
    headerAmbientCard: {
      position: "relative",
      borderRadius: radius.xxl,
      overflow: "hidden",
      borderWidth: StyleSheet.hairlineWidth,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: isDark ? "rgba(248, 113, 113, 0.36)" : "rgba(220, 38, 38, 0.3)",
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
      borderColor: "rgba(100, 116, 139, 0.14)",
      backgroundColor: c.frostTint || "rgba(255, 255, 255, 0.95)",
      ...Platform.select({
        web: {
          backdropFilter: "blur(20px)",
        },
        default: {
          backgroundColor: "transparent",
        },
      }),
    },
    headerAmbientCardDark: {
      borderColor: "rgba(185, 28, 28, 0.14)",
      backgroundColor: Platform.OS === "web" ? "rgba(11, 17, 32, 0.62)" : "transparent",
    },
    headerAmbientSheen: {
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      height: 112,
      opacity: isDark ? 0.12 : 0.2,
    },
    topBarShellNested: {
      paddingTop: 4,
      paddingBottom: 2,
      paddingHorizontal: spacing.xs,
    },
    headerInnerDivider: {
      height: StyleSheet.hairlineWidth,
      marginHorizontal: spacing.lg,
      marginTop: spacing.xs,
      marginBottom: spacing.sm,
      backgroundColor: "rgba(63, 63, 70, 0.12)",
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
      paddingHorizontal: 5,
      borderRadius: 9,
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 2,
    },
    cartBadgeText: {
      color: c.onPrimary,
      fontSize: 10,
      fontFamily: fonts.extrabold,
      lineHeight: 12,
    },
    alchemyTopBar: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: spacing.xs + 2,
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
      minHeight: BRAND_HOME_TOP_BAR_LAYOUT_HEIGHT + spacing.sm + 14,
      overflow: "visible",
    },
    topBarTagline: {
      marginTop: -2,
      fontSize: Platform.OS === "web" ? typography.overline : 12,
      fontFamily: fonts.semibold,
      letterSpacing: 0.6,
      textAlign: "center",
      lineHeight: Platform.OS === "web" ? lineHeight.overline : 16,
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
      borderColor: isDark ? "rgba(255,255,255,0.1)" : "rgba(100, 116, 139, 0.16)",
      backgroundColor: isDark ? "rgba(255,255,255,0.06)" : "rgba(255, 255, 255, 0.88)",
      ...Platform.select({
        web: { cursor: "pointer" },
        default: {},
      }),
    },
    searchWrap: {
      marginTop: 0,
      marginBottom: spacing.sm + 2,
      paddingHorizontal: spacing.sm,
    },
    searchWrapWeb: {
      marginBottom: 0,
      paddingHorizontal: 0,
      width: "100%",
      minWidth: 0,
    },
    homeLocationWrap: {
      paddingHorizontal: spacing.sm,
      marginBottom: spacing.sm + 2,
    },
    homeLocationWrapWeb: {
      paddingHorizontal: 0,
      marginBottom: 0,
      marginTop: 0,
      flexBasis: 280,
      flexGrow: 1,
      minWidth: 220,
      maxWidth: 360,
    },
    webSearchRail: {
      flexDirection: "column",
      alignItems: "stretch",
      gap: spacing.sm,
      width: "100%",
      maxWidth: 520,
      marginBottom: spacing.md + 2,
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
      gap: spacing.xs + 2,
      borderRadius: 14,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: isDark ? "rgba(255,255,255,0.12)" : "rgba(63,63,70,0.2)",
      backgroundColor: c.surface,
      padding: spacing.xs + 2,
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
      gap: spacing.xs + 2,
    },
    conciergeLocationChip: {
      minHeight: 44,
      maxWidth: Platform.OS === "web" ? "100%" : "60%",
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.xs - 2,
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
      top: 9,
      right: 9,
      width: 8,
      height: 8,
      borderRadius: 999,
      backgroundColor: "#EF4444",
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
      paddingBottom: spacing.xs - 2,
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
      padding: 2,
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
      marginBottom: Platform.select({ web: spacing.xl, default: spacing.xl + 4 }),
      borderRadius: radius.xxl + 2,
      overflow: "hidden",
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: isDark ? "rgba(255,255,255,0.1)" : "rgba(100, 116, 139, 0.14)",
      borderTopWidth: 3,
      borderTopColor: isDark ? "rgba(248, 113, 113, 0.44)" : "rgba(220, 38, 38, 0.62)",
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
      bottom: Platform.select({ web: 20, default: 16 }),
      left: 0,
      right: 0,
      alignItems: "center",
      zIndex: 4,
    },
    heroDotBackdrop: {
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.xs + 4,
      borderRadius: radius.pill,
      backgroundColor: "rgba(10, 8, 6, 0.42)",
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: "rgba(255, 252, 248, 0.14)",
      ...Platform.select({
        web: {
          backdropFilter: "blur(10px)",
          WebkitBackdropFilter: "blur(10px)",
        },
        default: {},
      }),
    },
    heroDotRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 7,
    },
    heroDotHit: {
      paddingVertical: 6,
      paddingHorizontal: 4,
      ...Platform.select({
        web: { cursor: "pointer" },
        default: {},
      }),
    },
    heroDot: {
      width: 16,
      height: 4,
      borderRadius: 999,
    },
    heroDotIdle: {
      backgroundColor: "rgba(255, 252, 248, 0.26)",
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: "rgba(255, 252, 248, 0.2)",
    },
    heroDotActive: {
      backgroundColor: c.primaryBright,
      width: 34,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: "rgba(255, 252, 248, 0.55)",
      transform: [{ scale: 1 }],
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
      paddingTop: Platform.select({ web: spacing.xxl + 2, default: spacing.xl }),
      paddingHorizontal: Platform.select({ web: 30, default: 26 }),
      paddingBottom: Platform.select({ web: 82, default: 72 }),
    },
    heroOverline: {
      color: "rgba(255, 252, 248, 0.86)",
      fontSize: 11,
      fontFamily: fonts.extrabold,
      letterSpacing: 1.2,
      textTransform: "uppercase",
      marginBottom: spacing.xs,
    },
    heroGoldHairline: {
      position: "absolute",
      bottom: 0,
      left: 0,
      right: 0,
      height: 3,
      opacity: 0.95,
      zIndex: 3,
    },
    heroSlideCounter: {
      position: "absolute",
      top: Platform.select({ web: spacing.lg + 4, default: spacing.md + 4 }),
      right: spacing.md + 4,
      zIndex: 4,
      paddingHorizontal: spacing.sm + 4,
      paddingVertical: spacing.xs + 2,
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
      fontFamily: fonts.extrabold,
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
      marginBottom: spacing.sm + 2,
      maxWidth: 560,
    },
    heroKickerText: {
      color: "rgba(255, 252, 248, 0.92)",
      fontSize: typography.overline + 1,
      fontFamily: fonts.extrabold,
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
      top: Platform.select({ web: spacing.lg + 4, default: spacing.md + 4 }),
      left: spacing.md + 4,
      zIndex: 4,
      flexDirection: "row",
      gap: spacing.xs,
    },
    heroNavButton: {
      width: 38,
      height: 38,
      borderRadius: semanticRadius.full,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: "rgba(8, 6, 4, 0.48)",
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: "rgba(255, 252, 248, 0.18)",
      ...Platform.select({
        web: {
          cursor: "pointer",
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
        },
        default: {},
      }),
    },
    heroNavButtonPressed: {
      opacity: 0.88,
      transform: [{ scale: 0.98 }],
    },
    heroBadgePill: {
      paddingHorizontal: spacing.sm + 2,
      paddingVertical: 5,
      borderRadius: radius.pill,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: isDark ? "rgba(248, 113, 113, 0.45)" : "rgba(220, 38, 38, 0.45)",
      backgroundColor: isDark ? "rgba(239, 68, 68, 0.14)" : "rgba(220, 38, 38, 0.12)",
    },
    heroBadgePillText: {
      color: "#FEF2F2",
      fontSize: typography.overline,
      fontFamily: fonts.extrabold,
      letterSpacing: 1.2,
    },
    heroDisplayTitle: {
      fontFamily: FONT_DISPLAY,
      fontSize: Platform.OS === "web" ? 44 : 34,
      lineHeight: Platform.OS === "web" ? 50 : 40,
      letterSpacing: Platform.OS === "web" ? -0.72 : -0.52,
      marginBottom: spacing.xs + 2,
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
      gap: 6,
      paddingHorizontal: spacing.sm + 2,
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
      marginTop: spacing.lg,
      minHeight: 46,
      borderRadius: 999,
      paddingHorizontal: spacing.lg + 2,
      paddingVertical: spacing.sm,
      backgroundColor: "rgba(15, 23, 42, 0.92)",
      borderWidth: 1,
      borderColor: "rgba(255, 255, 255, 0.16)",
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
      color: "#FFFFFF",
      fontSize: typography.caption,
      fontFamily: fonts.extrabold,
      letterSpacing: 1.4,
      textTransform: "uppercase",
    },
    promoVideoWrap: {
      width: "100%",
      maxWidth: layout.maxContentWidth,
      alignSelf: "center",
      marginBottom: spacing.xl + 8,
      borderRadius: radius.xxl,
      overflow: "hidden",
      borderWidth: 1,
      borderColor: isDark ? "rgba(255,255,255,0.12)" : "rgba(100, 116, 139, 0.14)",
      borderTopWidth: 3,
      borderTopColor: isDark ? "rgba(185, 28, 28, 0.55)" : "rgba(185, 28, 28, 0.75)",
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
      paddingHorizontal: spacing.sm + 2,
      alignItems: "center",
      justifyContent: "center",
      flexDirection: "row",
      gap: 6,
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
      fontFamily: fonts.extrabold,
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
      gap: 6,
      paddingVertical: 6,
      paddingHorizontal: 8,
      borderRadius: 9999,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: isDark ? "rgba(220, 38, 38, 0.22)" : "rgba(63, 63, 70, 0.16)",
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
      gap: 6,
      paddingHorizontal: spacing.md,
      paddingVertical: 7,
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
      backgroundColor: isDark ? "rgba(220, 38, 38, 0.16)" : c.primarySoft,
      borderColor: isDark ? "rgba(220, 38, 38, 0.42)" : c.primaryBorder,
      ...Platform.select({
        web: {
          boxShadow: isDark
            ? "0 6px 14px rgba(220, 38, 38, 0.16)"
            : "0 6px 14px rgba(63, 63, 70, 0.14)",
        },
        default: {},
      }),
    },
    jumpNavDot: {
      width: 6,
      height: 6,
      borderRadius: 3,
      backgroundColor: isDark ? ALCHEMY.goldBright : c.primary,
    },
    jumpNavChipTextActive: {
      color: isDark ? ALCHEMY.goldBright : c.primaryDark,
    },
    jumpNavChipText: {
      fontSize: typography.caption,
      fontFamily: fonts.bold,
      color: isDark ? c.textPrimary : ALCHEMY.brown,
      letterSpacing: 0.4,
    },
    trustSectionWrap: {
      width: "100%",
      marginTop: spacing.md,
      marginBottom: Platform.OS === "web" ? spacing.xl : spacing.xxl,
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
      paddingVertical: spacing.md + 2,
      paddingHorizontal: spacing.lg,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: isDark ? "rgba(220, 38, 38, 0.3)" : "rgba(63, 63, 70, 0.14)",
    },
    liveOrderOverline: {
      fontSize: typography.overline + 1,
      fontFamily: fonts.extrabold,
      letterSpacing: 1.4,
      textTransform: "uppercase",
      color: isDark ? ALCHEMY.goldBright : ALCHEMY.brown,
      marginBottom: 4,
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
      paddingVertical: 6,
      borderRadius: radius.pill,
      borderWidth: StyleSheet.hairlineWidth,
      backgroundColor: c.primarySoft,
    },
    liveOrderStatusText: {
      fontSize: typography.caption,
      fontFamily: fonts.bold,
    },
    liveOrderAmount: {
      fontSize: typography.body,
      fontFamily: fonts.extrabold,
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
      fontFamily: fonts.extrabold,
      letterSpacing: 2,
      textTransform: "uppercase",
      textAlign: "center",
      marginBottom: spacing.sm + 4,
      width: "100%",
    },
    homeSectionOverline: {
      fontSize: typography.overline + 1,
      fontFamily: fonts.extrabold,
      letterSpacing: 1.65,
      textTransform: "uppercase",
      textAlign: "center",
      marginBottom: spacing.sm,
      width: "100%",
    },
    homeShopOverline: {
      marginBottom: spacing.xs + 2,
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
      marginBottom: spacing.md + 2,
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
      marginBottom: spacing.xl + 4,
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
      paddingVertical: spacing.sm + 4,
      paddingHorizontal: spacing.md + 4,
      marginBottom: spacing.md + 2,
      borderRadius: radius.lg + 2,
      borderWidth: StyleSheet.hairlineWidth,
      maxWidth: layout.maxContentWidth,
      width: "100%",
      alignSelf: "center",
    },
    homeErrorIcon: {
      marginTop: 2,
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
      borderColor: isDark ? "rgba(255,255,255,0.14)" : "rgba(63, 63, 70, 0.18)",
      backgroundColor: c.surface,
    },
    trustStripDark: {
      borderColor: "rgba(255,255,255,0.16)",
    },
    trustStripInner: {
      flexDirection: "row",
      alignItems: "stretch",
      justifyContent: "space-between",
      width: "100%",
      zIndex: 1,
    },
    trustDivider: {
      width: StyleSheet.hairlineWidth,
      alignSelf: "stretch",
      marginVertical: 0,
      flexShrink: 0,
      opacity: 1,
    },
    trustDividerLight: {
      backgroundColor: "rgba(63, 63, 70, 0.18)",
    },
    trustDividerDark: {
      backgroundColor: "rgba(255,255,255,0.18)",
    },
    trustCell: {
      flex: 1,
      minWidth: 0,
      alignItems: "flex-start",
      justifyContent: "center",
      gap: 6,
      paddingHorizontal: spacing.sm + 2,
      paddingVertical: spacing.md,
      ...Platform.select({
        web: { cursor: "pointer" },
        default: {},
      }),
    },
    trustCellPressed: {
      opacity: 0.86,
    },
    trustIconBadge: {
      width: 24,
      height: 24,
      borderRadius: 12,
      alignItems: "center",
      justifyContent: "center",
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
      backgroundColor: "rgba(185, 28, 28, 0.12)",
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: "rgba(220, 38, 38, 0.18)",
    },
    trustCellLabel: {
      fontSize: Platform.OS === "web" ? typography.bodySmall : 13,
      fontFamily: fonts.medium,
      textAlign: "left",
      lineHeight: Platform.OS === "web" ? lineHeight.bodySmall : 18,
      letterSpacing: 0.05,
      maxWidth: "100%",
      flexShrink: 1,
    },
    trustCellSupport: {
      fontSize: 11,
      fontFamily: fonts.regular,
      lineHeight: 15,
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
      paddingHorizontal: spacing.xl + 2,
      paddingVertical: spacing.xl + 2,
      marginBottom: spacing.lg + 4,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: c.border,
      borderTopWidth: 3,
      borderTopColor: isDark ? c.primaryBorder : ALCHEMY.gold,
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
      marginTop: 6,
      color: c.textSecondary,
      fontSize: typography.bodySmall,
      fontFamily: fonts.regular,
    },
    categoryQuickNavWrap: {
      marginTop: spacing.md,
      marginBottom: spacing.sm + 2,
    },
    reorderToastWrap: {
      marginBottom: spacing.sm + 2,
    },
    liveOrderPinnedWrap: {
      marginBottom: spacing.sm + 2,
    },
    activeFilterBar: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.sm,
      marginBottom: spacing.md + 2,
      paddingVertical: 13,
      paddingHorizontal: spacing.lg,
      backgroundColor: c.primarySoft,
      borderRadius: radius.xl + 2,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: c.primaryBorder,
      borderTopWidth: 2,
      borderTopColor: c.primary,
      ...shadowLift,
    },
    activeFilterText: {
      flex: 1,
      color: c.textPrimary,
      fontSize: typography.bodySmall,
      fontFamily: fonts.semibold,
    },
    activeFilterClear: {
      color: c.primary,
      fontSize: typography.caption,
      fontFamily: fonts.extrabold,
    },
    sectionFilterBar: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.sm,
      marginBottom: spacing.md + 2,
      paddingVertical: 13,
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
      fontSize: typography.caption,
      fontFamily: fonts.extrabold,
    },
    catalogBrowseBar: {
      flexDirection: "row",
      gap: spacing.sm,
      marginBottom: 0,
      padding: Platform.select({ web: 10, default: 9 }),
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
      paddingVertical: Platform.select({ web: spacing.md + 2, default: spacing.md }),
      paddingHorizontal: spacing.sm,
      borderRadius: radius.lg + 2,
      gap: 5,
    },
    catalogBrowseOptionActive: {
      backgroundColor: isDark ? "rgba(185, 28, 28, 0.16)" : "#FFFFFF",
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: isDark ? c.primaryBorder : ALCHEMY.pillInactive,
      borderTopWidth: 1,
      borderTopColor: isDark ? "rgba(220, 38, 38, 0.65)" : ALCHEMY.gold,
    },
    catalogBrowseOptionHover: {
      backgroundColor: isDark ? "rgba(185, 28, 28, 0.1)" : "rgba(255,255,255,0.75)",
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
      gap: 8,
      paddingHorizontal: 16,
      paddingVertical: 10,
      borderRadius: radius.pill,
      borderWidth: StyleSheet.hairlineWidth,
      ...Platform.select({
        web: { cursor: "pointer" },
        default: {},
      }),
    },
    sectionChipActive: {
      borderColor: c.primaryBorder,
      backgroundColor: c.primarySoft,
      borderTopWidth: 2,
      borderTopColor: c.primary,
    },
    sectionChipLabel: {
      fontFamily: fonts.bold,
      fontSize: 13,
      maxWidth: 168,
    },
    sectionChipCount: {
      fontSize: 11,
      fontFamily: fonts.extrabold,
    },
    catalogIntroCard: {
      marginBottom: spacing.md + 4,
      borderRadius: radius.xl + 2,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: isDark ? "rgba(255,255,255,0.14)" : "rgba(63,63,70,0.18)",
      backgroundColor: c.surface,
      paddingHorizontal: spacing.md,
      paddingVertical: Math.max(8, Math.round((spacing.md + 2) * 0.7)),
      ...Platform.select({
        web: {
          width: "100%",
          maxWidth: layout.maxContentWidth,
          alignSelf: "center",
          boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
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
      gap: 2,
    },
    catalogIntroEyebrow: {
      fontFamily: fonts.extrabold,
      fontSize: typography.overline,
      letterSpacing: 1.2,
      textTransform: "uppercase",
      color: isDark ? c.textMuted : ALCHEMY.brownMuted,
    },
    catalogIntroTitle: {
      color: c.textPrimary,
      fontFamily: fonts.semibold,
      fontSize: Platform.select({ web: typography.h4 + 1, default: typography.h4 }),
      lineHeight: Platform.select({ web: lineHeight.h4 + 2, default: lineHeight.h4 + 2 }),
      letterSpacing: -0.22,
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
      gap: 6,
      flexShrink: 0,
    },
    catalogViewToggleBtn: {
      width: 34,
      height: 34,
      borderRadius: radius.pill,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: isDark ? "rgba(255,255,255,0.16)" : "rgba(100,116,139,0.22)",
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: isDark ? "rgba(255,255,255,0.06)" : "rgba(255,255,255,0.92)",
      ...Platform.select({
        web: { cursor: "pointer" },
        default: {},
      }),
    },
    catalogViewToggleBtnActive: {
      borderColor: isDark ? "rgba(248,113,113,0.45)" : "rgba(220,38,38,0.32)",
      backgroundColor: isDark ? "rgba(220,38,38,0.16)" : "rgba(220,38,38,0.08)",
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
      padding: spacing.xs + 2,
    },
    catalogSkeletonMeta: {
      paddingTop: spacing.xs + 2,
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
      paddingVertical: spacing.sm + 2,
      gap: spacing.xs + 2,
    },
    inlineSectionEmptyTitle: {
      fontSize: typography.bodySmall,
      fontFamily: fonts.medium,
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
      marginBottom: Platform.select({ web: spacing.xl + 8, default: spacing.xxl }),
    },
    catalogSurface: {
      overflow: "hidden",
      backgroundColor: isDark ? c.surface : ALCHEMY.cardBg,
      borderRadius: radius.xxl,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: isDark ? c.border : "rgba(100, 116, 139, 0.12)",
      borderTopWidth: 3,
      borderTopColor: isDark ? "rgba(220, 38, 38, 0.55)" : "rgba(185, 28, 28, 0.72)",
      paddingHorizontal: Platform.select({ web: spacing.xl + 6, default: spacing.md + 8 }),
      paddingTop: Platform.select({ web: spacing.lg + 4, default: spacing.lg + 8 }),
      paddingBottom: Platform.select({ web: spacing.lg + 6, default: spacing.xl + 6 }),
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
      paddingBottom: Platform.select({ web: spacing.md + 4, default: spacing.md + 4 }),
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
      fontFamily: fonts.extrabold,
      paddingHorizontal: 12,
      paddingVertical: 4,
      borderRadius: radius.pill,
      overflow: "hidden",
      backgroundColor: isDark ? "rgba(220, 38, 38, 0.18)" : c.primarySoft,
      color: isDark ? ALCHEMY.goldBright : c.primaryDark,
    },
    sectionSeeAllBtn: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
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
      backgroundColor: isDark ? "rgba(185, 28, 28, 0.16)" : "rgba(255,255,255,0.95)",
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
      fontFamily: fonts.extrabold,
      letterSpacing: 0.2,
    },
    emptyLoader: {
      marginBottom: spacing.md,
    },
    productGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 10,
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
    },
    productGridWrap: {
      flexDirection: "row",
      flexWrap: "wrap",
      justifyContent: "flex-start",
      columnGap: Platform.OS === "web" ? spacing.lg : spacing.md,
      rowGap: Platform.OS === "web" ? spacing.lg + 4 : spacing.md + 4,
      alignItems: "stretch",
    },
    productGridWrapCentered: {
      justifyContent: "center",
    },
    productGridCell: {
      marginBottom: 0,
      alignSelf: "stretch",
    },
    gridCell: {
      marginBottom: 0,
    },
    emptyWrap: {
      paddingVertical: spacing.xxl + 4,
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
    emptyIconCircle: {
      width: 96,
      height: 96,
      borderRadius: radius.xxl,
      backgroundColor: c.primarySoft,
      borderWidth: 1.5,
      borderColor: c.primaryBorder,
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
      fontSize: typography.bodySmall,
      fontFamily: fonts.semibold,
      lineHeight: lineHeight.bodySmall + 2,
    },
    emptySectionHint: {
      alignItems: "center",
      gap: spacing.sm,
      marginBottom: spacing.md + 4,
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
      fontFamily: fonts.extrabold,
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
      paddingHorizontal: spacing.md + 2,
      paddingTop: spacing.sm + 2,
      paddingBottom: spacing.xs + 2,
    },
    menuHeaderTitle: {
      fontFamily: FONT_DISPLAY,
      fontSize: typography.h2,
      letterSpacing: -0.35,
    },
    menuCloseBtn: {
      padding: 4,
      borderRadius: radius.sm,
    },
    menuSectionLabel: {
      fontSize: 11,
      fontFamily: fonts.extrabold,
      letterSpacing: 1.2,
      textTransform: "uppercase",
      paddingHorizontal: spacing.md,
      paddingTop: spacing.xs,
      paddingBottom: 6,
    },
    menuRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.sm,
      marginHorizontal: spacing.sm,
      marginBottom: 4,
      paddingVertical: 12,
      paddingHorizontal: spacing.sm,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: isDark ? "rgba(255,255,255,0.06)" : "rgba(63, 63, 70, 0.08)",
    },
    menuRowHover: {
      backgroundColor: isDark ? "rgba(185, 28, 28, 0.08)" : "rgba(185, 28, 28, 0.1)",
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
      fontSize: typography.bodySmall,
      fontFamily: fonts.bold,
      letterSpacing: 0.1,
    },
    menuRowValue: {
      marginTop: 2,
      fontSize: typography.caption,
      fontFamily: fonts.medium,
      lineHeight: 18,
    },
    menuPillActive: {
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: radius.pill,
      borderWidth: 1,
    },
    menuPillActiveText: {
      fontSize: 10,
      fontFamily: fonts.extrabold,
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
  });
}
