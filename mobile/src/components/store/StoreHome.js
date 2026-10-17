import React, { useCallback, useMemo, useState } from "react";
import { RefreshControl, StyleSheet, Text, View, useWindowDimensions } from "react-native";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, {
  Extrapolation,
  interpolate,
  runOnJS,
  useAnimatedReaction,
  useAnimatedRef,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
} from "react-native-reanimated";
import { useAuth } from "../../context/AuthContext";
import { useDeliveryLocation } from "../../hooks/useDeliveryLocation";
import {
  STORE_HEADER,
  STORE_LINE_PAGES,
  STORE_PROMOS,
  STORE_SECTIONS,
  STORE_TABS,
  STORE_TRUST,
  resolveFestivalTheme,
} from "../../content/storefrontContent";
import { getProductLineByKey } from "../../content/zeevanCatalogContent";
import { STORE_NAV_HEIGHT, useStoreTheme } from "../../theme/storefront";
import { getHeroSlideImageUri } from "../../utils/image";
import { getAppHeroSlides } from "../../utils/homeViewMedia";
import {
  STORE_LINE_ORDER,
  buildCategoryTiles,
  distanceKm,
  formatDistanceKm,
  getFirstName,
  mostCommonEta,
  pickTileProduct,
  productImageUri,
  productsForLine,
  resolveMatchProducts,
  visibleTabs,
} from "../../utils/storefront";
import BackToTop from "./BackToTop";
import BentoGrid from "./BentoGrid";
import CategoryGrid, { SeeAllBar } from "./CategoryGrid";
import FestiveBanner from "./FestiveBanner";
import FestivePicks from "./FestivePicks";
import FloatingNav from "./FloatingNav";
import LineLanding from "./LineLanding";
import ProductRail from "./ProductRail";
import PromoCarousel from "./PromoCarousel";
import { SectionHeader } from "./SectionTitle";
import StoreHeader from "./StoreHeader";
import StoreIcon from "./StoreIcon";
import StoreSearchBar from "./StoreSearchBar";
import StoreTabs from "./StoreTabs";
import { BrandFooter, TrustStrip } from "./TrustFooter";
import PressableScale from "./PressableScale";
import { VariantSheetProvider } from "./VariantSheet";

const GRADIENT_OVERSCROLL = 800;
const GRADIENT_HEIGHT = 620;
const BACK_TO_TOP_AT = 1100;

function EmptyState({ icon, title, body, cta, onPress }) {
  const { c, r, type, gutter } = useStoreTheme();
  return (
    <View style={[styles.empty, { marginHorizontal: gutter, backgroundColor: c.card, borderColor: c.line, borderRadius: r.xl }]}>
      <View style={[styles.emptyIcon, { backgroundColor: c.brandSoft }]}>
        <StoreIcon icon={icon} size={30} color={c.brand} />
      </View>
      <Text style={type.display(21, { semi: true })}>{title}</Text>
      <Text style={[type.ui(14, "medium", c.inkMute), styles.emptyBody]}>{body}</Text>
      {cta ? (
        <PressableScale onPress={onPress} style={[styles.emptyBtn, { backgroundColor: c.brand }]} accessibilityRole="button" accessibilityLabel={cta}>
          <Text style={type.ui(14.5, "extrabold", c.onBrand)}>{cta}</Text>
        </PressableScale>
      ) : null}
    </View>
  );
}

/**
 * Native Home — quick-commerce layout in the Zeevan look: festival-gradient header with greeting,
 * rotating search, category tabs that pin on scroll, festive band + bento, picks, promos,
 * category grid, product rails, trust strip, and the floating bottom nav.
 */
export default function StoreHome({
  navigation,
  products,
  homeProducts,
  homeView,
  refreshing,
  onRefresh,
  error,
  onRetry,
  hasUnread = false,
}) {
  const { c, isDark, gutter } = useStoreTheme();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const { user, isAuthenticated } = useAuth();
  const { displayLabel, savedLabel, snippet } = useDeliveryLocation();

  const festival = useMemo(() => resolveFestivalTheme({ remoteKey: homeView?.festivalKey }), [homeView?.festivalKey]);
  const tabs = useMemo(() => visibleTabs(STORE_TABS, products), [products]);
  const [requestedTab, setActiveTab] = useState("all");
  const activeTab = tabs.some((t) => t.key === requestedTab) ? requestedTab : "all";
  const activeTabDef = tabs.find((t) => t.key === activeTab) || tabs[0];
  const [pickKey, setPickKey] = useState(null);

  /* ---- scroll-driven pinned header ---- */
  const scrollRef = useAnimatedRef();
  const scrollY = useSharedValue(0);
  const searchY = useSharedValue(260);
  const [compactVisible, setCompactVisible] = useState(false);
  const [topVisible, setTopVisible] = useState(false);
  const [compactH, setCompactH] = useState(150);

  const onScroll = useAnimatedScrollHandler((e) => {
    scrollY.value = e.contentOffset.y;
  });

  useAnimatedReaction(
    () => scrollY.value >= searchY.value - insets.top - 4,
    (now, prev) => {
      if (now !== prev) runOnJS(setCompactVisible)(now);
    }
  );
  useAnimatedReaction(
    () => scrollY.value >= BACK_TO_TOP_AT,
    (now, prev) => {
      if (now !== prev) runOnJS(setTopVisible)(now);
    }
  );

  const compactStyle = useAnimatedStyle(() => {
    const start = searchY.value - insets.top - 4;
    return {
      opacity: interpolate(scrollY.value, [start - 26, start], [0, 1], Extrapolation.CLAMP),
      transform: [{ translateY: interpolate(scrollY.value, [start - 26, start], [-14, 0], Extrapolation.CLAMP) }],
    };
  });

  const scrollToTop = useCallback(() => scrollRef.current?.scrollTo?.({ y: 0, animated: true }), [scrollRef]);

  const changeTab = useCallback(
    (key) => {
      setActiveTab(key);
      const pinAt = searchY.value - insets.top - 4;
      if (scrollY.value > pinAt) scrollRef.current?.scrollTo?.({ y: Math.max(0, pinAt), animated: false });
    },
    [insets.top, scrollRef, scrollY, searchY]
  );

  /* ---- navigation helpers ---- */
  const go = useCallback(
    (route) => {
      if (!route) {
        navigation.navigate("Shop");
        return;
      }
      if (route.requiresAuth && !isAuthenticated) {
        navigation.navigate("Login");
        return;
      }
      navigation.navigate(route.name, route.params);
    },
    [isAuthenticated, navigation]
  );
  const openProduct = useCallback((product) => navigation.navigate("Product", { productId: product.id }), [navigation]);
  const openSearch = useCallback(() => navigation.navigate("Shop", { focusSearch: true }), [navigation]);
  const openShop = useCallback((params) => navigation.navigate("Shop", params), [navigation]);

  /* ---- header content ---- */
  const firstName = getFirstName(user);
  const signedInName = isAuthenticated && firstName;
  const etaLabel = useMemo(() => (STORE_HEADER.showDeliveryPromise ? mostCommonEta(products) : ""), [products]);
  const eyebrow = etaLabel
    ? STORE_HEADER.promiseEyebrow
    : signedInName
      ? festival.greeting
        ? `${festival.greeting},`
        : STORE_HEADER.greetingEyebrow
      : STORE_HEADER.guestEyebrow;
  const title = etaLabel || (signedInName ? firstName : STORE_HEADER.guestTitle);
  const points = Math.max(0, Number(user?.rewardPoints) || 0).toLocaleString("en-IN");

  const chips = useMemo(() => {
    const list = [{ key: "delivery", icon: "truck-fast-outline", label: STORE_HEADER.deliveryChip }];
    const from = homeView?.shopLocation;
    const to = snippet?.latitude != null ? snippet : user?.defaultAddress;
    const km = distanceKm(from, to);
    if (km != null && km < 1500) {
      list.push({ key: "distance", icon: "map-marker-distance", label: `${formatDistanceKm(km)} ${STORE_HEADER.distanceSuffix}` });
    }
    return list;
  }, [homeView?.shopLocation, snippet, user?.defaultAddress]);

  const locationText = displayLabel || STORE_HEADER.locationFallback;
  const locationKind = savedLabel && displayLabel === savedLabel ? user?.defaultAddress?.addressType : "";
  const onLocationPress = () => navigation.navigate(isAuthenticated ? "ManageAddress" : "Login");

  /* ---- section data ---- */
  const hasProducts = products.length > 0;

  const bento = useMemo(() => {
    const featured = pickTileProduct(products, { featured: true });
    const tallDef = festival.bento.tall;
    const tallProduct = pickTileProduct(products, tallDef.match) || featured;
    return {
      tall: tallDef ? { ...tallDef, product: tallProduct } : null,
      tiles: festival.bento.tiles.map((tile, i) => ({
        ...tile,
        product: pickTileProduct(products, tile.match) || pickTileProduct(products, { featured: true, index: i }),
        icon: getProductLineByKey(tile.match?.lineKey)?.icon ? { ion: getProductLineByKey(tile.match.lineKey).icon } : undefined,
      })),
    };
  }, [festival, products]);

  const picks = useMemo(
    () =>
      festival.picks.items
        .map((pick) => {
          const list = resolveMatchProducts(products, pick.match);
          return { ...pick, products: list, product: list.find((p) => productImageUri(p)) || null };
        })
        .filter((pick) => pick.products.length > 0),
    [festival, products]
  );
  const activePickKey = picks.some((p) => p.key === pickKey) ? pickKey : picks[0]?.key;

  const promos = useMemo(() => {
    const slides = getAppHeroSlides(homeView?.heroSlides);
    if (!slides.length) return STORE_PROMOS;
    const rewards = STORE_PROMOS.find((p) => p.kind === "rewards");
    const fromAdmin = slides.map((slide, i) => ({
      key: `slide-${slide.id || i}`,
      kind: "image",
      image: getHeroSlideImageUri(slide.url, { layoutWidth: width }),
      title: slide.title,
      cta: slide.cta || "Shop now",
      route: { name: "Shop" },
    }));
    return [...(rewards ? [rewards] : []), ...fromAdmin].slice(0, 5);
  }, [homeView?.heroSlides, width]);

  const categoryTiles = useMemo(() => buildCategoryTiles(products, { max: 8 }), [products]);

  const bestsellers = useMemo(
    () => [...homeProducts].sort((a, b) => (Number(b.reviewCount) || 0) - (Number(a.reviewCount) || 0)).slice(0, 8),
    [homeProducts]
  );

  const lineRails = useMemo(
    () =>
      STORE_LINE_ORDER.map((key) => ({ key, list: productsForLine(homeProducts, key) })).filter((line) => line.list.length > 0),
    [homeProducts]
  );

  const lineProducts = useMemo(
    () => (activeTabDef?.lineKey ? productsForLine(products, activeTabDef.lineKey) : []),
    [activeTabDef?.lineKey, products]
  );

  const onBentoPress = useCallback(
    (item) => {
      if (item.showPrice && item.product) openProduct(item.product);
      else go(item.route);
    },
    [go, openProduct]
  );

  const bottomPad = STORE_NAV_HEIGHT + Math.max(16, insets.bottom + 6) + 28;
  const gradient = isDark ? festival.header.gradientDark : festival.header.gradient;
  const gradTotal = GRADIENT_OVERSCROLL + GRADIENT_HEIGHT;
  const gradLocations = [0, GRADIENT_OVERSCROLL / gradTotal, ...c.headerLocations.slice(1).map((l) => (GRADIENT_OVERSCROLL + l * GRADIENT_HEIGHT) / gradTotal)];

  return (
    <VariantSheetProvider>
      <View style={[styles.screen, { backgroundColor: c.page }]}>
        <Animated.ScrollView
          ref={scrollRef}
          onScroll={onScroll}
          scrollEventThrottle={16}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: bottomPad }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={c.brand} />}
        >
          <LinearGradient
            colors={[gradient[0], ...gradient]}
            locations={gradLocations}
            style={[styles.backdrop, { top: -GRADIENT_OVERSCROLL, height: gradTotal }]}
            pointerEvents="none"
          />

          <View style={{ paddingTop: insets.top + 8 }}>
            <StoreHeader
              signedIn={Boolean(isAuthenticated)}
              firstName={firstName}
              avatarUrl={user?.avatar}
              hasUnread={hasUnread}
              points={points}
              eyebrow={eyebrow}
              title={title}
              chips={chips}
              locationKind={locationKind}
              locationText={locationText}
              onPressLocation={onLocationPress}
              onPressRewards={() => navigation.navigate("RedeemRewards")}
              onPressProfile={() => navigation.navigate(isAuthenticated ? "Profile" : "Login")}
              onPressSignIn={() => navigation.navigate("Login")}
            />
          </View>

          <View
            style={styles.pinBlock}
            onLayout={(e) => {
              searchY.value = e.nativeEvent.layout.y;
            }}
          >
            <View style={{ paddingHorizontal: gutter }}>
              <StoreSearchBar onPress={openSearch} hints={STORE_HEADER.searchHints} prefix={STORE_HEADER.searchPrefix} />
            </View>
            <StoreTabs tabs={tabs} activeKey={activeTab} onChange={changeTab} style={styles.tabs} />
          </View>

          {!hasProducts ? (
            <View style={styles.sections}>
              <EmptyState
                icon={{ mci: error ? "cloud-off-outline" : "package-variant-closed" }}
                title={error ? STORE_SECTIONS.error.title : STORE_SECTIONS.empty.title}
                body={error || STORE_SECTIONS.empty.body}
                cta={error ? STORE_SECTIONS.error.cta : STORE_SECTIONS.empty.cta}
                onPress={error ? onRetry : () => openShop()}
              />
            </View>
          ) : activeTab !== "all" && activeTabDef ? (
            <LineLanding
              tab={activeTabDef}
              products={lineProducts}
              onProductPress={openProduct}
              onCategoryPress={(tile) => openShop({ category: tile.label })}
              onSeeAll={() => {
                const page = STORE_LINE_PAGES[activeTabDef.key] || {};
                openShop(page.shopPill ? { pill: page.shopPill } : page.category ? { category: page.category } : undefined);
              }}
            />
          ) : (
            <View style={styles.sections}>
              <FestiveBanner theme={festival} onPress={() => openShop()} />

              <PromoCarousel items={promos} onPressItem={(item) => go(item.route)} />

              {categoryTiles.length ? (
                <View style={styles.block}>
                  <SectionHeader
                    title={homeView?.productTypeTitle || STORE_SECTIONS.categories.title}
                    action={STORE_SECTIONS.categories.action}
                    onAction={() => openShop()}
                  />
                  <CategoryGrid
                    tiles={categoryTiles}
                    moreSuffix={STORE_SECTIONS.categories.moreSuffix}
                    onPressTile={(tile) => openShop({ category: tile.label })}
                  />
                  <SeeAllBar images={categoryTiles.map((t) => t.image)} label={STORE_SECTIONS.seeAllProducts} onPress={() => openShop()} />
                </View>
              ) : null}

              <BentoGrid tall={bento.tall} tiles={bento.tiles} onPressItem={onBentoPress} />

              {bestsellers.length ? (
                <View style={styles.block}>
                  <SectionHeader
                    title={homeView?.primeSectionTitle || STORE_SECTIONS.bestsellers.title}
                    action={STORE_SECTIONS.bestsellers.action}
                    onAction={() => openShop()}
                  />
                  <ProductRail products={bestsellers} onProductPress={openProduct} onSeeAll={() => openShop()} />
                </View>
              ) : null}

              {picks.length ? (
                <FestivePicks
                  title={festival.picks.title}
                  picks={picks}
                  activeKey={activePickKey}
                  onChange={setPickKey}
                  onProductPress={openProduct}
                  onSeeAll={(pick) => go(pick.route)}
                />
              ) : null}

              {lineRails.map((line) => {
                const page = STORE_LINE_PAGES[line.key] || {};
                return (
                  <View key={line.key} style={styles.block}>
                    <SectionHeader
                      title={page.title || line.key}
                      caption={page.subtitle}
                      action={STORE_SECTIONS.lineRail.action}
                      onAction={() => openShop(page.shopPill ? { pill: page.shopPill } : page.category ? { category: page.category } : undefined)}
                    />
                    <ProductRail products={line.list} onProductPress={openProduct} />
                  </View>
                );
              })}

              <TrustStrip title={STORE_SECTIONS.trustTitle} items={STORE_TRUST} />
              <BrandFooter />
            </View>
          )}
        </Animated.ScrollView>

        <Animated.View
          style={[styles.compact, { paddingTop: insets.top }, compactStyle]}
          pointerEvents={compactVisible ? "auto" : "none"}
          onLayout={(e) => setCompactH(e.nativeEvent.layout.height)}
        >
          <BlurView intensity={isDark ? 40 : 70} tint={isDark ? "dark" : "light"} style={StyleSheet.absoluteFill} />
          <View style={[StyleSheet.absoluteFill, { backgroundColor: c.glassStrong }]} />
          <View style={{ paddingHorizontal: gutter, paddingTop: 8, paddingBottom: 6 }}>
            <StoreSearchBar compact onPress={openSearch} hints={STORE_HEADER.searchHints} prefix={STORE_HEADER.searchPrefix} />
          </View>
          <StoreTabs compact tabs={tabs} activeKey={activeTab} onChange={changeTab} />
        </Animated.View>

        <BackToTop visible={compactVisible && topVisible} top={compactH + 10} onPress={scrollToTop} label={STORE_HEADER.backToTop} />
        <FloatingNav />
      </View>
    </VariantSheetProvider>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  backdrop: { position: "absolute", left: 0, right: 0 },
  pinBlock: { marginTop: 12 },
  tabs: { marginTop: 6 },
  sections: { gap: 20, paddingTop: 8 },
  block: { gap: 12 },
  compact: { position: "absolute", top: 0, left: 0, right: 0, zIndex: 30, overflow: "hidden" },
  empty: { alignItems: "center", gap: 10, padding: 28, borderWidth: StyleSheet.hairlineWidth, marginTop: 24 },
  emptyIcon: { width: 64, height: 64, borderRadius: 32, alignItems: "center", justifyContent: "center", marginBottom: 4 },
  emptyBody: { textAlign: "center" },
  emptyBtn: { marginTop: 8, height: 46, paddingHorizontal: 26, borderRadius: 23, alignItems: "center", justifyContent: "center" },
});
