import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Platform, Pressable, RefreshControl, ScrollView, StyleSheet, Text, useWindowDimensions, View } from "react-native";
import { useRoute } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import Animated, { FadeInDown, FadeOutDown } from "react-native-reanimated";
import BottomNavBar from "../../components/BottomNavBar";
import HomeSearchHeader from "../../components/home/HomeSearchHeader";
import HomeLiveOrderPinnedCard from "../../components/home/HomeLiveOrderPinnedCard";
import HomeReorderStrip from "../../components/home/HomeReorderStrip";
import HomeCategoryGrid from "../../components/home/HomeCategoryGrid";
import HomeMarketingHero from "../../components/home/HomeMarketingHero";
import HomeDealsRail from "../../components/home/HomeDealsRail";
import HomeCatalogSections from "../../components/home/HomeCatalogSections";
import HomeOffersBand from "../../components/home/HomeOffersBand";
import HomeStickyAddToBagBar from "../../components/home/HomeStickyAddToBagBar";
import HomePageFooter from "../../components/home/HomePageFooter";
import SectionReveal from "../../components/motion/SectionReveal";
import useReducedMotion from "../../hooks/useReducedMotion";
import useWebLiteMode from "../../hooks/useWebLiteMode";
import useRecentSearches from "../../hooks/useRecentSearches";
import { useAuth } from "../../context/AuthContext";
import { useCart } from "../../context/CartContext";
import { useTheme } from "../../context/ThemeContext";
import {
  HOME_CATEGORY_QUICK_NAV,
  HOME_CATEGORY_UI,
  HOME_HERO_BANNER,
  HOME_REORDER_STRIP,
  HOME_TOAST,
} from "../../content/appContent";
import { HOME_HERO_MOBILE_SLIDER_SLIDES, HOME_HERO_WEB_SLIDER_SLIDES } from "../../constants/marketingAssets";
import { CUSTOMER_BOTTOM_NAV_BAR_HEIGHT } from "../../theme/screenLayout";
import { createHomeStyles } from "./homeScreenStyles";
import { checkPincodeServiceability } from "../../services/pincodeService";
import useHomeData from "./hooks/useHomeData";
import useHomeFilters from "./hooks/useHomeFilters";
import useReorderData from "./hooks/useReorderData";
import useLiveOrder from "./hooks/useLiveOrder";
import useHeroSlider from "./hooks/useHeroSlider";
import useCartFeedback from "./hooks/useCartFeedback";
import useNotifications from "./hooks/useNotifications";
import { productToCartLine } from "../../utils/productCart";
import { setScrollY as setScrollYStore } from "../../hooks/useScrollY";
import { invalidateMyOrdersCache } from "../../services/orderCache";

export default function HomeScreenBody({ navigation }) {
  const route = useRoute();
  const insets = useSafeAreaInsets();
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const { colors: c, shadowLift, shadowPremium, isDark } = useTheme();
  const styles = useMemo(
    () => createHomeStyles(c, shadowLift, shadowPremium, isDark, windowWidth, insets),
    [c, insets, isDark, shadowLift, shadowPremium, windowWidth]
  );
  const reducedMotion = useReducedMotion();
  const webLite = useWebLiteMode();
  const { add: addRecentSearch } = useRecentSearches();
  const { isAuthenticated, token, user } = useAuth();
  const { addToCart, removeFromCart, getItemQuantity, totalItems, totalAmount } = useCart();
  const [scrollY, setScrollY] = useState(0);
  const scrollRafRef = useRef(null);
  const pendingScrollYRef = useRef(0);
  const [deliveryPromise, setDeliveryPromise] = useState("Reliable doorstep delivery");
  const catalogYRef = useRef(0);
  const scrollRef = useRef(null);
  const { products, homeViewConfig, loading, error, refreshing, showingCachedItems, refresh } = useHomeData();
  const filters = useHomeFilters({ products, homeViewConfig });
  const reorder = useReorderData({ isAuthenticated, token });
  const liveOrder = useLiveOrder({ isAuthenticated, token });
  const notifications = useNotifications({ isAuthenticated, token });
  const heroSlides = useMemo(() => {
    const source = Platform.OS === "web" ? HOME_HERO_WEB_SLIDER_SLIDES : HOME_HERO_MOBILE_SLIDER_SLIDES;
    return source.map((slide, index) => ({
      ...slide,
      title: index === 0 ? homeViewConfig.heroTitle : slide.title,
      cta: index === 0 ? HOME_HERO_BANNER.cta : slide.cta,
    }));
  }, [homeViewConfig.heroTitle]);
  const hero = useHeroSlider(heroSlides, { reducedMotion, autoplayMs: 6500 });
  const safeWindowHeight = Number(windowHeight || 844);
  const heroSlideHeight = useMemo(() => {
    if (Platform.OS === "web") {
      return Math.max(240, Math.min(360, Math.round(safeWindowHeight * 0.5)));
    }
    const baseWidth = Math.max(320, Number(windowWidth || 390));
    return Math.max(220, Math.min(340, Math.round((baseWidth * 10) / 16)));
  }, [safeWindowHeight, windowWidth]);
  const cartFx = useCartFeedback({
    addToCart,
    toCartLine: productToCartLine,
    safeWindowWidth: windowWidth,
    safeWindowHeight,
    safeBottomInset: Number(insets?.bottom || 0),
    reducedMotion,
  });
  const { query, setQuery, setSectionFilter, setCategoryFilter, sections } = filters;
  useEffect(() => {
    const section = route.params?.filterHomeSection;
    const category = route.params?.filterHomeCategory;
    setSectionFilter(section ? String(section) : null);
    if (category) {
      setQuery("");
      setCategoryFilter(String(category));
    }
  }, [route.params?.filterHomeCategory, route.params?.filterHomeSection, setCategoryFilter, setQuery, setSectionFilter]);

  useEffect(() => {
    setScrollYStore(scrollY);
  }, [scrollY]);

  useEffect(() => {
    let cancelled = false;
    const rawPin =
      user?.defaultAddress?.postalCode ||
      user?.defaultAddress?.pincode ||
      user?.defaultAddress?.pinCode ||
      "";
    const pincode = String(rawPin || "").replace(/\D/g, "");
    if (pincode.length !== 6) {
      setDeliveryPromise("Reliable doorstep delivery");
      return () => {
        cancelled = true;
      };
    }
    (async () => {
      try {
        const result = await checkPincodeServiceability(pincode);
        if (cancelled) return;
        if (result?.serviceable && Number.isFinite(Number(result?.dispatchHours))) {
          setDeliveryPromise("Order by 4pm for tomorrow");
          return;
        }
        if (result?.serviceable && result?.deliversByLabel) {
          setDeliveryPromise(`Delivery by ${String(result.deliversByLabel)}`);
          return;
        }
        setDeliveryPromise("Reliable doorstep delivery");
      } catch {
        if (!cancelled) setDeliveryPromise("Reliable doorstep delivery");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user?.defaultAddress?.pinCode, user?.defaultAddress?.pincode, user?.defaultAddress?.postalCode]);

  const onSearchSubmit = useCallback(
    (value) => {
      const query = String(value || "").trim();
      setQuery(query);
      if (!query) return;
      addRecentSearch(query);
      navigation.navigate({ name: "Search", params: { q: query, category: "", categoryLabel: "" } });
    },
    [addRecentSearch, navigation, setQuery]
  );

  const onPullRefresh = useCallback(async () => {
    invalidateMyOrdersCache();
    await Promise.all([refresh(), reorder.refresh(), liveOrder.refresh(), notifications.refresh()]);
  }, [liveOrder, notifications, refresh, reorder]);
  const onAddFromReorder = useCallback(
    (item) => {
      if (!isAuthenticated) return navigation.navigate("Login");
      cartFx.addWithFeedback(item);
    },
    [cartFx, isAuthenticated, navigation]
  );
  const onDecreaseFromReorder = useCallback(
    (item) => {
      if (!isAuthenticated) return navigation.navigate("Login");
      removeFromCart(item.id, item.variantLabel || "");
    },
    [isAuthenticated, navigation, removeFromCart]
  );
  const getReorderQuantity = useCallback(
    (item) => getItemQuantity(item.id, item.variantLabel || ""),
    [getItemQuantity]
  );
  const onAddCatalog = useCallback(
    (item, interactionMeta) => {
      if (!isAuthenticated) return navigation.navigate("Login");
      cartFx.addWithFeedback(item, interactionMeta);
    },
    [cartFx, isAuthenticated, navigation]
  );
  const onRemoveCatalog = useCallback(
    (productId) => {
      if (!isAuthenticated) return navigation.navigate("Login");
      removeFromCart(productId);
    },
    [isAuthenticated, navigation, removeFromCart]
  );
  const goToCatalog = useCallback(() => {
    const y = Math.max(0, Number(catalogYRef.current || 0) - 16);
    scrollRef.current?.scrollTo({ y, animated: true });
  }, []);
  const onIncreaseDeal = useCallback(
    (item) => {
      if (!isAuthenticated) return navigation.navigate("Login");
      cartFx.addWithFeedback(item);
    },
    [cartFx, isAuthenticated, navigation]
  );
  const onDecreaseDeal = useCallback(
    (item) => {
      if (!isAuthenticated) return navigation.navigate("Login");
      removeFromCart(item.id, item.variantLabel || "");
    },
    [isAuthenticated, navigation, removeFromCart]
  );
  const getDealQuantity = useCallback((item) => getItemQuantity(item.id, item.variantLabel || ""), [getItemQuantity]);
  const deliveryAddress = useMemo(() => {
    const addr = user?.defaultAddress;
    if (!addr) return "";
    const parts = [addr.line1, addr.city].map((part) => String(part || "").trim()).filter(Boolean);
    if (parts.length) return parts.join(", ");
    return String(addr.label || addr.name || "").trim();
  }, [user?.defaultAddress]);
  const showMobileTopBar = Platform.OS !== "web";
  const topOffset = Number(insets?.bottom || 0) + CUSTOMER_BOTTOM_NAV_BAR_HEIGHT + 24;
  const gridColumns = windowWidth < 640 ? 2 : windowWidth < 1024 ? 3 : 4;
  const gridGap = windowWidth >= 600 ? 14 : 10;
  const pageHorizontalPadding = windowWidth >= 1024 ? 56 : windowWidth >= 600 ? 28 : 16;
  const catalogSurfacePadding = windowWidth >= 600 ? 20 : 16;
  const catalogHorizontalPadding = pageHorizontalPadding;
  const contentMaxWidth = Platform.OS === "web" && windowWidth >= 1200 ? 1280 : undefined;
  const viewportWidth = contentMaxWidth ? Math.min(windowWidth, contentMaxWidth) : windowWidth;
  const usableGridWidth =
    Math.max(320, viewportWidth) -
    catalogHorizontalPadding * 2 -
    catalogSurfacePadding * 2 -
    gridGap * (gridColumns - 1);
  const gridCardWidth = Math.max(132, Math.floor(usableGridWidth / gridColumns));

  useEffect(
    () => () => {
      if (scrollRafRef.current != null) {
        cancelAnimationFrame(scrollRafRef.current);
      }
    },
    []
  );
  return (
    <View style={styles.screen}>
      {!webLite ? (
        <LinearGradient
          colors={[c.background, c.backgroundGradientEnd || c.surfaceMuted, c.background]}
          locations={[0, 0.45, 1]}
          style={StyleSheet.absoluteFillObject}
          pointerEvents="none"
        />
      ) : null}
      <ScrollView
        ref={scrollRef}
        style={styles.scrollMain}
        contentContainerStyle={[
          styles.scrollMain?.contentContainerStyle,
          {
            paddingHorizontal: pageHorizontalPadding,
            paddingBottom: topOffset + 70,
            width: contentMaxWidth ? "100%" : undefined,
            maxWidth: contentMaxWidth,
            alignSelf: contentMaxWidth ? "center" : undefined,
          },
        ]}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onPullRefresh} />}
        onScroll={(event) => {
          pendingScrollYRef.current = Number(event.nativeEvent.contentOffset.y || 0);
          if (scrollRafRef.current != null) return;
          scrollRafRef.current = requestAnimationFrame(() => {
            scrollRafRef.current = null;
            setScrollY(pendingScrollYRef.current);
          });
        }}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={Platform.OS === "web"}
      >
        <View style={styles.headerWrap}>
          {showMobileTopBar ? (
            <View style={styles.alchemyTopBar}>
              <Pressable
                style={[styles.alchemyIconBtn, { borderColor: c.border, backgroundColor: c.surface }]}
                onPress={() => navigation.navigate("Profile")}
                accessibilityLabel="Open account"
              >
                <Ionicons name="person-outline" size={22} color={c.textPrimary} />
              </Pressable>
              <View style={styles.wordmarkBlock}>
                <Text style={styles.catalogIntroTitle}>Zeevan</Text>
                <Text style={styles.topBarTagline}>Heritage pantry</Text>
              </View>
              <Pressable
                style={[styles.alchemyIconBtn, { borderColor: c.border, backgroundColor: c.surface }]}
                onLayout={(e) => cartFx.setCartAnchorRect(e.nativeEvent.layout)}
                onPress={() => navigation.navigate(isAuthenticated ? "Cart" : "Login")}
                accessibilityLabel={isAuthenticated ? "Open cart" : "Sign in to open cart"}
              >
                <Ionicons name="bag-outline" size={22} color={c.textPrimary} />
                {totalItems > 0 ? (
                  <View style={[styles.cartBadge, { backgroundColor: c.primary, borderColor: c.surface }]}>
                    <Text style={styles.cartBadgeText}>{totalItems > 9 ? "9+" : totalItems}</Text>
                  </View>
                ) : null}
              </Pressable>
            </View>
          ) : null}
          <HomeSearchHeader
            colors={c}
            isDark={isDark}
            deliveryAddress={deliveryAddress}
            deliveryPromise={deliveryPromise}
            isScrolled={scrollY > 24}
            unreadCount={notifications.unreadNotificationCount}
            onPressAddress={() => navigation.navigate("Profile")}
            onPressBell={() => navigation.navigate("Notifications")}
            onSubmitSearch={onSearchSubmit}
            value={query}
            onChangeSearch={setQuery}
            compactWeb={Platform.OS === "web"}
          />
        </View>

        {liveOrder.hasLiveOrder ? (
          <View style={styles.liveOrderPinnedWrap}>
            <HomeLiveOrderPinnedCard order={liveOrder.liveOrder} onPress={() => navigation.navigate("Profile")} />
          </View>
        ) : null}

        {reorder.hasReorder ? (
          <HomeReorderStrip
            items={reorder.reorderItems}
            overline={HOME_REORDER_STRIP.overline}
            title={HOME_REORDER_STRIP.title}
            subtitle={HOME_REORDER_STRIP.subtitle}
            onIncrease={onAddFromReorder}
            onDecrease={onDecreaseFromReorder}
            getQuantity={getReorderQuantity}
            onSeeAll={goToCatalog}
          />
        ) : null}

        <HomeMarketingHero
          showMarketing={!query.trim()}
          reducedMotion={reducedMotion}
          styles={styles}
          isDark={isDark}
          homeViewConfig={homeViewConfig}
          heroSlides={heroSlides}
          windowWidth={windowWidth}
          heroSliderRef={hero.sliderRef}
          heroSliderWidth={hero.sliderWidth}
          setHeroSliderWidth={hero.setSliderWidth}
          heroSlideHeight={heroSlideHeight}
          heroSlideIndex={hero.currentIndex}
          setHeroSlideIndex={hero.setCurrentIndex}
          goToHeroSlide={(index, options) => hero.goTo(index, options?.animated)}
          handleHeroSlideAction={(action) => (action === "catalog" ? goToCatalog() : null)}
          onHeroPressIn={() => hero.onUserInteraction(true)}
          onHeroPressOut={() => hero.onUserInteraction(false)}
          onMomentumScrollEnd={hero.onMomentumScrollEnd}
        />

        <HomeCategoryGrid
          categories={HOME_CATEGORY_QUICK_NAV}
          overline=""
          title=""
          viewAllLabel={HOME_CATEGORY_UI.viewAllLabel}
          onPressCategory={(category) => setCategoryFilter(String(category?.filter || category?.label || ""))}
          onPressViewAll={() => navigation.navigate("Categories")}
        />

        <SectionReveal index={1} preset="fade-up">
          <HomeDealsRail
            products={products}
            homeViewConfig={homeViewConfig}
            getQuantity={getDealQuantity}
            onIncrease={onIncreaseDeal}
            onDecrease={onDecreaseDeal}
            onOpenProduct={(item) => navigation.navigate("Product", { productId: item.id })}
            onSeeAllDeals={goToCatalog}
          />
        </SectionReveal>

        <SectionReveal index={2} preset="fade-up">
          <View onLayout={(e) => (catalogYRef.current = e.nativeEvent.layout.y)}>
            <HomeCatalogSections
              sections={sections}
              styles={styles}
              navigation={navigation}
              getItemQuantity={getItemQuantity}
              onAddToCart={onAddCatalog}
              onRemoveFromCart={onRemoveCatalog}
              cardStyle={homeViewConfig.productCardStyle}
              numColumns={gridColumns}
              gridGap={gridGap}
              cardWidth={gridCardWidth}
            />
          </View>
        </SectionReveal>

        <SectionReveal index={3} preset="fade-up">
          <HomeOffersBand />
        </SectionReveal>
        <HomePageFooter colors={c} />
      </ScrollView>
      <HomeStickyAddToBagBar
        visible={totalItems > 0 && scrollY > heroSlideHeight}
        totalItems={totalItems}
        totalAmount={totalAmount}
        styles={styles}
        accentColor={c.bgDeep || "#0E1729"}
        isAuthenticated={isAuthenticated}
        reducedMotion={reducedMotion}
        onViewBag={() => navigation.navigate(isAuthenticated ? "Cart" : "Login")}
      />
      <BottomNavBar />

      {cartFx.flyGhost ? (
        <Animated.View pointerEvents="none" style={[styles.flyGhost, cartFx.flyGhostStyle]}>
          {cartFx.flyGhost.imageUri ? (
            <Image source={{ uri: cartFx.flyGhost.imageUri }} style={styles.flyGhostImage} contentFit="cover" transition={0} />
          ) : (
            <View style={[styles.flyGhostImage, { backgroundColor: c.surfaceMuted || c.surface }]} />
          )}
        </Animated.View>
      ) : null}

      {cartFx.toastQueue.length > 0 ? (
        <View style={[styles.toastStackRoot, { bottom: topOffset }]}>
          {cartFx.toastQueue.map((item) => (
            <Animated.View key={item.id} entering={FadeInDown.duration(220)} exiting={FadeOutDown.duration(180)} style={styles.toastCard}>
              <Pressable
                style={styles.toastCardInner}
                onPress={() => {
                  cartFx.clearToast(item.id);
                  navigation.navigate(isAuthenticated ? "Cart" : "Login");
                }}
                accessibilityRole="button"
                accessibilityLabel={HOME_TOAST.viewBag}
              >
                <Ionicons name="checkmark-circle" size={16} color={c.accent || "#C8A97E"} />
                <Text style={styles.toastText} numberOfLines={1}>
                  {item.message}
                </Text>
              </Pressable>
            </Animated.View>
          ))}
        </View>
      ) : null}

      {error && !showingCachedItems ? (
        <View style={localStyles.errorWrap}>
          <Text style={localStyles.errorText}>{error}</Text>
        </View>
      ) : null}
      {loading ? <View style={localStyles.loadingPad} /> : null}
      {Platform.OS === "web" && __DEV__ ? (
        <View style={localStyles.scrollHud} pointerEvents="none">
          <Text style={localStyles.scrollHudText}>scrollY: {Math.round(scrollY)}</Text>
        </View>
      ) : null}
    </View>
  );
}
const localStyles = StyleSheet.create({
  errorWrap: { position: "absolute", left: 16, right: 16, top: 12, alignItems: "center" },
  errorText: { fontSize: 12, color: "#B23A3A" },
  loadingPad: { height: 1 },
  scrollHud: {
    position: "absolute",
    right: 12,
    bottom: 96,
    borderRadius: 8,
    backgroundColor: "rgba(0,0,0,0.72)",
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  scrollHudText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "600",
  },
});
