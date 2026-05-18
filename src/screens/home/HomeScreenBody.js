import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Platform, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";
import { useRoute } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
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
import HomeStickyMicroBar from "../../components/home/HomeStickyMicroBar";
import HomePageFooter from "../../components/home/HomePageFooter";
import useReducedMotion from "../../hooks/useReducedMotion";
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
  HOME_TRUST_BANNER,
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
export default function HomeScreenBody({ navigation }) {
  const route = useRoute();
  const insets = useSafeAreaInsets();
  const { width: windowWidth, height: windowHeight } = useMemo(
    () => ({ width: 390 + Number(insets?.left || 0) + Number(insets?.right || 0), height: 844 }),
    [insets?.left, insets?.right]
  );
  const { colors: c, shadowLift, shadowPremium, isDark } = useTheme();
  const styles = useMemo(
    () => createHomeStyles(c, shadowLift, shadowPremium, isDark, windowWidth, insets),
    [c, insets, isDark, shadowLift, shadowPremium, windowWidth]
  );
  const reducedMotion = useReducedMotion();
  const { add: addRecentSearch } = useRecentSearches();
  const { isAuthenticated, token, user } = useAuth();
  const { addToCart, removeFromCart, getItemQuantity, totalItems, totalAmount } = useCart();
  const [scrollY, setScrollY] = useState(0);
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
  const topOffset = Number(insets?.bottom || 0) + CUSTOMER_BOTTOM_NAV_BAR_HEIGHT + 24;
  const gridColumns = windowWidth < 640 ? 2 : windowWidth < 1024 ? 3 : 4;
  const gridGap = windowWidth >= 600 ? 14 : 10;
  const pageHorizontalPadding = windowWidth >= 1024 ? 56 : windowWidth >= 600 ? 28 : 16;
  const catalogHorizontalPadding = pageHorizontalPadding;
  const gridCardWidth = Math.floor(
    (Math.max(320, windowWidth) - catalogHorizontalPadding * 2 - gridGap * (gridColumns - 1)) / gridColumns
  );
  return (
    <View style={styles.screen}>
      <ScrollView
        ref={scrollRef}
        style={styles.scrollMain}
        contentContainerStyle={[
          styles.scrollMain?.contentContainerStyle,
          { paddingHorizontal: pageHorizontalPadding, paddingBottom: topOffset + 70 },
        ]}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onPullRefresh} />}
        onScroll={(event) => setScrollY(Number(event.nativeEvent.contentOffset.y || 0))}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.headerWrap}>
          <View style={styles.alchemyTopBar}>
            <Pressable style={styles.alchemyIconBtn} onPress={() => navigation.navigate("Profile")} accessibilityLabel="Open account">
              <Ionicons name="person-outline" size={22} color={c.textPrimary} />
            </Pressable>
            <Text style={styles.catalogIntroTitle}>Zeevan</Text>
            <Pressable
              style={styles.alchemyIconBtn}
              onLayout={(e) => cartFx.setCartAnchorRect(e.nativeEvent.layout)}
              onPress={() => navigation.navigate(isAuthenticated ? "Cart" : "Login")}
              accessibilityLabel={isAuthenticated ? "Open cart" : "Sign in to open cart"}
            >
              <Ionicons name="bag-outline" size={22} color={c.textPrimary} />
            </Pressable>
          </View>
          <HomeSearchHeader
            colors={c}
            isDark={isDark}
            deliveryAddress=""
            deliveryPromise={deliveryPromise}
            isScrolled={scrollY > 24}
            unreadCount={notifications.unreadNotificationCount}
            onPressAddress={() => navigation.navigate("Profile")}
            onPressBell={() => navigation.navigate("Notifications")}
            onSubmitSearch={onSearchSubmit}
            value={query}
            onChangeSearch={setQuery}
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
          />
        ) : null}

        <HomeCategoryGrid
          categories={HOME_CATEGORY_QUICK_NAV}
          overline={HOME_CATEGORY_UI.overline}
          title={HOME_CATEGORY_UI.title}
          viewAllLabel={HOME_CATEGORY_UI.viewAllLabel}
          onPressCategory={(category) => setCategoryFilter(String(category?.filter || category?.label || ""))}
          onPressViewAll={() => navigation.navigate("Categories")}
        />

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

        <HomeDealsRail
          products={products}
          homeViewConfig={homeViewConfig}
          getQuantity={getDealQuantity}
          onIncrease={onIncreaseDeal}
          onDecrease={onDecreaseDeal}
          onOpenProduct={(item) => navigation.navigate("Product", { productId: item.id })}
          onSeeAllDeals={goToCatalog}
        />

        <View style={localStyles.trustBannerWrap}>
          <Text style={[localStyles.trustBannerText, { borderColor: c.accent || "#C8A97E", color: c.textSecondary }]}>
            {HOME_TRUST_BANNER}
          </Text>
        </View>

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

        <HomeOffersBand />
        <HomePageFooter colors={c} />
      </ScrollView>
      <HomeStickyMicroBar
        visible={totalItems > 0 && scrollY > heroSlideHeight}
        totalItems={totalItems}
        totalAmount={totalAmount}
        styles={styles}
        accentColor={c.accent || "#C8A97E"}
        isAuthenticated={isAuthenticated}
        onViewBag={() => navigation.navigate(isAuthenticated ? "Cart" : "Login")}
      />
      <BottomNavBar />

      {cartFx.flyGhost ? (
        <Animated.View pointerEvents="none" style={[styles.flyGhost, cartFx.flyGhostStyle]}>
          {cartFx.flyGhost.imageUri ? (
            <Image source={{ uri: cartFx.flyGhost.imageUri }} style={styles.flyGhostImage} contentFit="cover" transition={0} />
          ) : (
            <View style={[styles.flyGhostImage, { backgroundColor: c.surfaceAlt }]} />
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
    </View>
  );
}
const localStyles = StyleSheet.create({
  errorWrap: { position: "absolute", left: 16, right: 16, top: 12, alignItems: "center" },
  errorText: { fontSize: 12, color: "#B23A3A" },
  loadingPad: { height: 1 },
  trustBannerWrap: { marginBottom: 10 },
  trustBannerText: {
    minHeight: 36,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 999,
    paddingHorizontal: 14,
    textAlign: "center",
    textAlignVertical: "center",
    fontSize: 12,
    fontWeight: "600",
  },
});
