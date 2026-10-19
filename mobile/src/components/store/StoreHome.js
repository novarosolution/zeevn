import React, { useCallback, useEffect, useMemo, useState } from "react";
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
  STORE_HOME,
  STORE_LINE_PAGES,
  STORE_PROMOS,
  STORE_SECTIONS,
  STORE_TABS,
  STORE_TRUST,
  getFestivalCountdown,
  resolveFestivalTheme,
} from "../../content/storefrontContent";
import { getProductLineByKey } from "../../content/zeevanCatalogContent";
import { STORE_NAV_HEIGHT, useStoreTheme, withAlpha } from "../../theme/storefront";
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
import Band from "./Band";
import BentoGrid from "./BentoGrid";
import CategoryGrid from "./CategoryGrid";
import FestiveBanner from "./FestiveBanner";
import FestivePicks from "./FestivePicks";
import FloatingNav from "./FloatingNav";
import { HomeScrollProvider, Reveal } from "./HomeMotion";
import LineLanding from "./LineLanding";
import ProductRail from "./ProductRail";
import PromoCarousel from "./PromoCarousel";
import { SectionHeader } from "./SectionTitle";
import StoreHeader from "./StoreHeader";
import StoreIcon from "./StoreIcon";
import StoreSearchBar from "./StoreSearchBar";
import StoreTabs from "./StoreTabs";
import StoreTracker, { useActiveOrders } from "./StoreTracker";
import { BrandFooter, TrustStrip } from "./TrustFooter";
import PressableScale from "./PressableScale";
import { VariantSheetProvider } from "./VariantSheet";

const GRADIENT_OVERSCROLL = 800;
const GRADIENT_HEIGHT = 620;
const BACK_TO_TOP_AT = 1100;
/** The header is fully faded once the page has scrolled this far. */
const HEADER_FADE_AT = 130;

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
 * Native Home — quick-commerce layout in the Zeevan look: a short festival-gradient header (location, rewards,
 * a row of chips), rotating search, category tabs that pin on scroll, then the sections listed in
 * `STORE_HOME.layout` (or the festival theme's own order) rising into view as you scroll, and the floating
 * bottom nav. Picture-led on purpose: long copy lives on the About page and the website.
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
  const { width, height: windowH } = useWindowDimensions();
  const { user, isAuthenticated } = useAuth();
  const { displayLabel, savedLabel, snippet } = useDeliveryLocation();

  const festival = useMemo(() => resolveFestivalTheme({ remoteKey: homeView?.festivalKey }), [homeView?.festivalKey]);
  const tabs = useMemo(() => visibleTabs(STORE_TABS, products), [products]);
  const [requestedTab, setActiveTab] = useState("all");
  const activeTab = tabs.some((t) => t.key === requestedTab) ? requestedTab : "all";
  const activeTabDef = tabs.find((t) => t.key === activeTab) || tabs[0];
  const [pickKey, setPickKey] = useState(null);
  const activeOrders = useActiveOrders();

  /* ---- scroll-driven pinned header + section reveals ---- */
  const scrollRef = useAnimatedRef();
  const scrollY = useSharedValue(0);
  const searchY = useSharedValue(260);
  const sectionsY = useSharedValue(0);
  const viewportH = useSharedValue(windowH);
  const [compactVisible, setCompactVisible] = useState(false);
  const [topVisible, setTopVisible] = useState(false);
  const [compactH, setCompactH] = useState(150);

  useEffect(() => {
    viewportH.value = windowH;
  }, [viewportH, windowH]);

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

  // The header drifts up a touch faster than the page and fades, so it hands over to the pinned bar.
  const headerStyle = useAnimatedStyle(() => ({
    opacity: interpolate(scrollY.value, [0, HEADER_FADE_AT], [1, 0], Extrapolation.CLAMP),
    transform: [{ translateY: -interpolate(scrollY.value, [0, HEADER_FADE_AT], [0, 16], Extrapolation.CLAMP) }],
  }));

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
  const etaLabel = useMemo(() => (STORE_HEADER.showDeliveryPromise ? mostCommonEta(products) : ""), [products]);
  const points = Math.max(0, Number(user?.rewardPoints) || 0);

  const chips = useMemo(() => {
    const list = [];
    const festivalLabel = festival.greeting ? getFestivalCountdown(festival) || festival.greeting : "";
    if (festivalLabel) list.push({ key: "festival", kind: "festival", label: festivalLabel });
    if (etaLabel) list.push({ key: "eta", icon: "clock-fast", label: STORE_HEADER.etaChip(etaLabel) });
    list.push({ key: "delivery", icon: "truck-fast-outline", label: STORE_HEADER.deliveryChip });
    const from = homeView?.shopLocation;
    const to = snippet?.latitude != null ? snippet : user?.defaultAddress;
    const km = distanceKm(from, to);
    if (km != null && km < 1500) {
      list.push({ key: "distance", icon: "map-marker-distance", label: `${formatDistanceKm(km)} ${STORE_HEADER.distanceSuffix}` });
    }
    return list;
  }, [festival, etaLabel, homeView?.shopLocation, snippet, user?.defaultAddress]);

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

  // The product whose photo the hero shows (the theme says which; falls back to a featured product).
  const spotlight = useMemo(
    () =>
      pickTileProduct(products, festival.banner.spotlight?.match || { featured: true }) ||
      pickTileProduct(products, { featured: true }),
    [festival, products]
  );

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
      subtitle: slide.subtitle,
      cta: slide.cta || STORE_SECTIONS.promoCta,
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

  /* ---- sections, in the order the content layout asks for ---- */
  const layout = Array.isArray(festival.layout) ? festival.layout : STORE_HOME.layout;
  const blocks = [];
  layout.forEach((key) => {
    switch (key) {
      case "tracker":
        if (!activeOrders.length) break;
        blocks.push({ key, node: <StoreTracker orders={activeOrders} onPress={() => navigation.navigate("MyOrders")} /> });
        break;
      case "banner":
        blocks.push({ key, node: <FestiveBanner theme={festival} product={spotlight} onPress={() => go(festival.banner.route)} /> });
        break;
      case "promos":
        blocks.push({
          key,
          node: <PromoCarousel items={promos} signedIn={Boolean(isAuthenticated)} points={points} onPressItem={(item) => go(item.route)} />,
        });
        break;
      case "categories":
        if (!categoryTiles.length) break;
        blocks.push({
          key,
          staggered: true,
          node: (
            <View style={styles.block}>
              <SectionHeader
                title={homeView?.productTypeTitle || STORE_SECTIONS.categories.title}
                action={STORE_SECTIONS.categories.action}
                onAction={() => openShop()}
              />
              <CategoryGrid
                tiles={categoryTiles}
                moreSuffix={STORE_SECTIONS.categories.moreSuffix}
                allLabel={STORE_SECTIONS.categories.allTile}
                onPressTile={(tile) => openShop({ category: tile.label })}
                onPressAll={() => openShop()}
              />
            </View>
          ),
        });
        break;
      case "bento":
        blocks.push({
          key,
          staggered: true,
          node: (
            <View style={styles.block}>
              {festival.bento.title ? (
                <SectionHeader
                  title={festival.bento.title}
                  action={festival.bento.action}
                  onAction={() => go(festival.bento.route)}
                />
              ) : null}
              <BentoGrid tall={bento.tall} tiles={bento.tiles} colors={festival.bento.colors} onPressItem={onBentoPress} />
            </View>
          ),
        });
        break;
      case "bestsellers":
        if (!bestsellers.length) break;
        blocks.push({
          key,
          node: (
            <Band tone="olive" style={styles.band}>
              <SectionHeader
                title={homeView?.primeSectionTitle || STORE_SECTIONS.bestsellers.title}
                action={STORE_SECTIONS.bestsellers.action}
                onAction={() => openShop()}
              />
              <ProductRail
                products={bestsellers}
                rankTop={STORE_SECTIONS.bestsellers.rankTop}
                seeAllLabel={STORE_SECTIONS.bestsellers.action}
                hideEta={etaLabel}
                onProductPress={openProduct}
                onSeeAll={() => openShop()}
              />
            </Band>
          ),
        });
        break;
      case "picks":
        if (!picks.length) break;
        blocks.push({
          key,
          node: (
            <Band tone="gold">
              <FestivePicks
                title={festival.picks.title}
                picks={picks}
                activeKey={activePickKey}
                onChange={setPickKey}
                onProductPress={openProduct}
                onSeeAll={(pick) => go(pick.route)}
                hideEta={etaLabel}
              />
            </Band>
          ),
        });
        break;
      case "lines":
        lineRails.forEach((line) => {
          const page = STORE_LINE_PAGES[line.key] || {};
          blocks.push({
            key: `line-${line.key}`,
            node: (
              <View style={styles.block}>
                <SectionHeader
                  icon={STORE_TABS.find((tab) => tab.lineKey === line.key)?.icon}
                  title={page.title || line.key}
                  action={STORE_SECTIONS.lineRail.action}
                  onAction={() => openShop(page.shopPill ? { pill: page.shopPill } : page.category ? { category: page.category } : undefined)}
                />
                <ProductRail products={line.list} seeAllLabel={STORE_SECTIONS.lineRail.action} hideEta={etaLabel} onProductPress={openProduct} />
              </View>
            ),
          });
        });
        break;
      case "trust":
        blocks.push({
          key,
          staggered: true,
          node: <TrustStrip items={STORE_TRUST} />,
        });
        break;
      case "footer":
        blocks.push({ key, node: <BrandFooter /> });
        break;
      default:
        break;
    }
  });

  const bottomPad = STORE_NAV_HEIGHT + Math.max(16, insets.bottom + 6) + 28;
  const gradient = isDark ? festival.header.gradientDark : festival.header.gradient;
  const gradTotal = GRADIENT_OVERSCROLL + GRADIENT_HEIGHT;
  const gradLocations = [0, GRADIENT_OVERSCROLL / gradTotal, ...c.headerLocations.slice(1).map((l) => (GRADIENT_OVERSCROLL + l * GRADIENT_HEIGHT) / gradTotal)];

  return (
    <VariantSheetProvider>
      <HomeScrollProvider scrollY={scrollY} viewportH={viewportH} originY={sectionsY}>
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

            <Animated.View style={[{ paddingTop: insets.top + 8 }, headerStyle]}>
              <StoreHeader
                signedIn={Boolean(isAuthenticated)}
                firstName={firstName}
                avatarUrl={user?.avatar}
                hasUnread={hasUnread}
                points={points}
                ornament={festival.ornament}
                accent={isDark ? festival.header.accent?.dark : festival.header.accent?.light}
                chips={chips}
                locationLabel={STORE_HEADER.locationLabel}
                locationKind={locationKind}
                locationText={locationText}
                signInLabel={STORE_HEADER.signIn}
                extendTop={insets.top + 8}
                onPressLocation={onLocationPress}
                onPressRewards={() => navigation.navigate("RedeemRewards")}
                onPressProfile={() => navigation.navigate(isAuthenticated ? "Profile" : "Login")}
                onPressSignIn={() => navigation.navigate("Login")}
              />
            </Animated.View>

            <View
              style={styles.pinBlock}
              onLayout={(e) => {
                searchY.value = e.nativeEvent.layout.y;
              }}
            >
              <View style={{ paddingHorizontal: gutter }}>
                <StoreSearchBar onPress={openSearch} hints={STORE_HEADER.searchHints} prefix={STORE_HEADER.searchPrefix} />
              </View>
              <StoreTabs tabs={tabs} activeKey={activeTab} onChange={changeTab} badges={festival.tabBadges} style={styles.tabs} />
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
              <View
                style={styles.sections}
                onLayout={(e) => {
                  sectionsY.value = e.nativeEvent.layout.y;
                }}
              >
                {blocks.map((block, i) => (
                  <Reveal key={block.key} index={i} staggered={block.staggered}>
                    {block.node}
                  </Reveal>
                ))}
              </View>
            )}
          </Animated.ScrollView>

          <Animated.View
            style={[styles.compact, { paddingTop: insets.top, borderBottomColor: c.line }, compactStyle]}
            pointerEvents={compactVisible ? "auto" : "none"}
            onLayout={(e) => setCompactH(e.nativeEvent.layout.height)}
          >
            <BlurView intensity={isDark ? 40 : 70} tint={isDark ? "dark" : "light"} style={StyleSheet.absoluteFill} />
            <View style={[StyleSheet.absoluteFill, { backgroundColor: c.glassStrong }]} />
            <View style={{ paddingHorizontal: gutter, paddingTop: 8, paddingBottom: 6 }}>
              <StoreSearchBar compact onPress={openSearch} hints={STORE_HEADER.searchHints} prefix={STORE_HEADER.searchPrefix} />
            </View>
            <StoreTabs compact tabs={tabs} activeKey={activeTab} onChange={changeTab} badges={festival.tabBadges} />
            <LinearGradient
              colors={[withAlpha(c.gold, 0), withAlpha(c.gold, isDark ? 0.55 : 0.7), withAlpha(c.gold, 0)]}
              start={{ x: 0, y: 0.5 }}
              end={{ x: 1, y: 0.5 }}
              style={styles.compactRule}
              pointerEvents="none"
            />
          </Animated.View>

          <BackToTop visible={compactVisible && topVisible} top={compactH + 10} onPress={scrollToTop} label={STORE_HEADER.backToTop} />
          <FloatingNav />
        </View>
      </HomeScrollProvider>
    </VariantSheetProvider>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  backdrop: { position: "absolute", left: 0, right: 0 },
  pinBlock: { marginTop: 12 },
  tabs: { marginTop: 6 },
  sections: { gap: 24, paddingTop: 12 },
  block: { gap: 14 },
  band: { gap: 14 },
  compact: { position: "absolute", top: 0, left: 0, right: 0, zIndex: 30, overflow: "hidden", borderBottomWidth: StyleSheet.hairlineWidth },
  compactRule: { position: "absolute", left: 0, right: 0, bottom: 0, height: 1.5 },
  empty: { alignItems: "center", gap: 10, padding: 28, borderWidth: StyleSheet.hairlineWidth, marginTop: 24 },
  emptyIcon: { width: 64, height: 64, borderRadius: 32, alignItems: "center", justifyContent: "center", marginBottom: 4 },
  emptyBody: { textAlign: "center" },
  emptyBtn: { marginTop: 8, height: 46, paddingHorizontal: 26, borderRadius: 23, alignItems: "center", justifyContent: "center" },
});
