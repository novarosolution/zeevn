import React, { useCallback, useEffect, useMemo, useState } from "react";
import { RefreshControl, StyleSheet, Text, View, useWindowDimensions } from "react-native";
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
import { formatDeliveryLocationParts } from "../../utils/deliveryLocationLabel";
import {
  STORE_HEADER,
  STORE_LINE_PAGES,
  STORE_PROMOS,
  STORE_SECTIONS,
  STORE_TABS,
  STORE_TRUST,
  getFestivalCountdown,
  resolveFestivalTheme,
  storeGreeting,
} from "../../content/storefrontContent";
import { STORE_NAV_HEIGHT, useStoreTheme, withAlpha } from "../../theme/storefront";
import {
  buildCategoryTiles,
  getFirstName,
  mostCommonEta,
  productsForLine,
  visibleTabs,
} from "../../utils/storefront";
import BackToTop from "./BackToTop";
import FloatingNav from "./FloatingNav";
import HeroCarousel from "./HeroCarousel";
import { HomeScrollProvider, Reveal } from "./HomeMotion";
import LineLanding from "./LineLanding";
import ProductGrid from "./ProductGrid";
import RangeTiles from "./RangeTiles";
import { SectionHeader } from "./SectionTitle";
import StoreHeader from "./StoreHeader";
import StoreIcon from "./StoreIcon";
import StoreSearchBar from "./StoreSearchBar";
import StoreTabs from "./StoreTabs";
import StoreTracker, { useActiveOrders } from "./StoreTracker";
import { BrandFooter, TrustStrip } from "./TrustFooter";
import PressableScale from "./PressableScale";
import { VariantSheetProvider } from "./VariantSheet";
import { checkDeliveryServiceability } from "../../services/deliveryService";

/** App Home only — website extras (line rails, festive picks, bento) stay on the site. */
const APP_HOME_LAYOUT = ["tracker", "promos", "categories", "catalog", "trust", "footer"];


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
  homeView,
  refreshing,
  onRefresh,
  error,
  onRetry,
  hasUnread = false,
}) {
  const { c, isDark, gutter } = useStoreTheme();
  const insets = useSafeAreaInsets();
  const { height: windowH } = useWindowDimensions();
  const { user, isAuthenticated } = useAuth();
  const { displayLabel, snippet } = useDeliveryLocation();
  const [deliveryQuote, setDeliveryQuote] = useState(null);

  const festival = useMemo(() => resolveFestivalTheme({ remoteKey: homeView?.festivalKey }), [homeView?.festivalKey]);
  const tabs = useMemo(() => visibleTabs(STORE_TABS, products), [products]);
  const [requestedTab, setActiveTab] = useState("all");
  const activeTab = tabs.some((t) => t.key === requestedTab) ? requestedTab : "all";
  const activeTabDef = tabs.find((t) => t.key === activeTab) || tabs[0];
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
      opacity: interpolate(scrollY.value, [start - 20, start], [0, 1], Extrapolation.CLAMP),
    };
  });

  // Fade the header as the compact bar takes over — opacity only (translate was extra scroll work).
  const headerStyle = useAnimatedStyle(() => ({
    opacity: interpolate(scrollY.value, [0, HEADER_FADE_AT], [1, 0], Extrapolation.CLAMP),
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
    const next = [];
    const festivalLabel = festival.greeting ? getFestivalCountdown(festival) || festival.greeting : "";
    if (festivalLabel) next.push({ key: "festival", kind: "festival", label: festivalLabel });
    if (STORE_HEADER.deliveryChip) next.push({ key: "delivery", kind: "perk", icon: "bicycle-outline", label: STORE_HEADER.deliveryChip });
    return next;
  }, [festival]);
  const locationMeta =
    deliveryQuote?.serviceable && deliveryQuote.etaLabel
      ? deliveryQuote.etaLabel
      : deliveryQuote && deliveryQuote.serviceable === false
        ? STORE_HEADER.etaOutside
        : etaLabel
          ? STORE_HEADER.etaShort(etaLabel)
          : "";
  const nearbyLabel = deliveryQuote?.distanceLabel || "";
  const locationParts = useMemo(
    () =>
      formatDeliveryLocationParts(
        snippet?.line1 || snippet?.city ? snippet : user?.defaultAddress,
        displayLabel || STORE_HEADER.locationFallback
      ),
    [snippet, user?.defaultAddress, displayLabel]
  );
  const locationKind = user?.defaultAddress?.addressType || "";
  const onLocationPress = () => navigation.navigate(isAuthenticated ? "ManageAddress" : "Login");

  useEffect(() => {
    const lat = Number(snippet?.latitude ?? snippet?.lat ?? user?.defaultAddress?.latitude);
    const lng = Number(snippet?.longitude ?? snippet?.lng ?? user?.defaultAddress?.longitude);
    const pin = user?.defaultAddress?.postalCode || snippet?.postalCode || "";
    const city = snippet?.city || user?.defaultAddress?.city || "";
    if (!Number.isFinite(lat) && !pin && !city) return undefined;
    let cancelled = false;
    checkDeliveryServiceability({
      latitude: Number.isFinite(lat) ? lat : undefined,
      longitude: Number.isFinite(lng) ? lng : undefined,
      postalCode: pin,
      city,
    })
      .then((res) => {
        if (!cancelled) setDeliveryQuote(res);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [snippet, user?.defaultAddress]);

  /* ---- section data ---- */
  const hasProducts = products.length > 0;
  const promos = STORE_PROMOS;
  const categoryTiles = useMemo(() => buildCategoryTiles(products, { max: 8 }), [products]);
  const catalog = useMemo(
    () => [...products].sort((a, b) => (Number(b.reviewCount) || 0) - (Number(a.reviewCount) || 0)),
    [products]
  );
  const lineProducts = useMemo(
    () => (activeTabDef?.lineKey ? productsForLine(products, activeTabDef.lineKey) : []),
    [activeTabDef?.lineKey, products]
  );

  const openOrders = useCallback(() => navigation.navigate("MyOrders"), [navigation]);
  const openPromo = useCallback((item) => go(item.route), [go]);

  const blocks = useMemo(() => {
    const next = [];
    APP_HOME_LAYOUT.forEach((key) => {
      switch (key) {
        case "tracker":
          if (!activeOrders.length) break;
          next.push({ key, node: <StoreTracker orders={activeOrders} onPress={openOrders} /> });
          break;
        case "promos":
          next.push({
            key,
            node: (
              <HeroCarousel
                items={promos}
                signedIn={Boolean(isAuthenticated)}
                points={points}
                onPressItem={openPromo}
              />
            ),
          });
          break;
        case "categories":
          if (!categoryTiles.length) break;
          next.push({
            key,
            staggered: true,
            node: (
              <View style={styles.block}>
                <SectionHeader
                  eyebrow={STORE_SECTIONS.categories.eyebrow}
                  title={STORE_SECTIONS.categories.title}
                  action={STORE_SECTIONS.categories.action}
                  onAction={() => openShop()}
                />
                <RangeTiles tiles={categoryTiles} onPressTile={(tile) => openShop({ category: tile.label })} />
              </View>
            ),
          });
          break;
        case "catalog":
          if (!catalog.length) break;
          next.push({
            key,
            node: (
              <View style={styles.block}>
                <SectionHeader
                  eyebrow={STORE_SECTIONS.catalog.eyebrow}
                  title={STORE_SECTIONS.catalog.title}
                  caption={STORE_SECTIONS.catalog.count(catalog.length)}
                  action={STORE_SECTIONS.catalog.action}
                  onAction={() => openShop()}
                />
                <ProductGrid
                  products={catalog}
                  rankTop={STORE_SECTIONS.bestsellers.rankTop}
                  hideEta={etaLabel}
                  onProductPress={openProduct}
                />
              </View>
            ),
          });
          break;
        case "trust":
          next.push({ key, staggered: true, node: <TrustStrip items={STORE_TRUST} /> });
          break;
        case "footer":
          next.push({ key, node: <BrandFooter /> });
          break;
        default:
          break;
      }
    });
    return next;
  }, [
    activeOrders,
    openOrders,
    promos,
    isAuthenticated,
    points,
    openPromo,
    categoryTiles,
    openShop,
    catalog,
    etaLabel,
    openProduct,
  ]);

  const bottomPad = STORE_NAV_HEIGHT + Math.max(16, insets.bottom + 6) + 28;
  const gradient = isDark ? festival.header.gradientDark : festival.header.gradient;
  const gradTotal = GRADIENT_OVERSCROLL + GRADIENT_HEIGHT;
  const gradLocations = [0, GRADIENT_OVERSCROLL / gradTotal, ...c.headerLocations.slice(1).map((l) => (GRADIENT_OVERSCROLL + l * GRADIENT_HEIGHT) / gradTotal)];

  return (
    <VariantSheetProvider>
      <HomeScrollProvider scrollY={scrollY} viewportH={viewportH} originY={sectionsY}>
        <View style={[styles.screen, { backgroundColor: c.canvas }]}>
          {/* No removeClippedSubviews: on iOS (New Architecture) it leaves expo-image photos below the fold blank. */}
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
                greeting={storeGreeting()}
                avatarUrl={user?.avatar}
                hasUnread={hasUnread}
                points={points}
                ornament={festival.ornament}
                accent={isDark ? festival.header.accent?.dark : festival.header.accent?.light}
                chips={chips}
                locationLabel={STORE_HEADER.locationLabel}
                locationKind={locationKind}
                locationMeta={locationMeta}
                nearbyLabel={nearbyLabel}
                locationStreet={locationParts.street}
                locationDetail={locationParts.detail}
                locationEmpty={locationParts.empty}
                locationText={locationParts.street}
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
            style={[styles.compact, { paddingTop: insets.top }, compactStyle]}
            pointerEvents={compactVisible ? "auto" : "none"}
            onLayout={(e) => setCompactH(e.nativeEvent.layout.height)}
          >
            <View style={[StyleSheet.absoluteFill, { backgroundColor: isDark ? withAlpha("#0F2418", 0.78) : withAlpha("#FBF6EC", 0.72) }]} />
            <LinearGradient
              colors={[withAlpha("#FFFFFF", isDark ? 0.08 : 0.42), withAlpha("#FFFFFF", 0)]}
              style={styles.compactSheen}
              pointerEvents="none"
            />
            <View style={{ paddingHorizontal: gutter, paddingTop: 8, paddingBottom: 6 }}>
              <StoreSearchBar compact onPress={openSearch} hints={STORE_HEADER.searchHints} prefix={STORE_HEADER.searchPrefix} />
            </View>
            <StoreTabs compact tabs={tabs} activeKey={activeTab} onChange={changeTab} badges={festival.tabBadges} />
            <LinearGradient
              colors={[withAlpha(c.canvas, 0), withAlpha(c.canvas, isDark ? 0.55 : 0.7)]}
              style={styles.compactEdge}
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
  pinBlock: { marginTop: 16 },
  tabs: { marginTop: 8 },
  sections: { gap: 36, paddingTop: 20 },
  block: { gap: 16 },
  compact: { position: "absolute", top: 0, left: 0, right: 0, zIndex: 30, overflow: "hidden" },
  compactSheen: { position: "absolute", top: 0, left: 0, right: 0, height: "42%" },
  compactEdge: { position: "absolute", left: 0, right: 0, bottom: -16, height: 16 },
  empty: { alignItems: "center", gap: 10, padding: 28, borderWidth: StyleSheet.hairlineWidth, marginTop: 24 },
  emptyIcon: { width: 64, height: 64, borderRadius: 32, alignItems: "center", justifyContent: "center", marginBottom: 4 },
  emptyBody: { textAlign: "center" },
  emptyBtn: { marginTop: 8, height: 46, paddingHorizontal: 26, borderRadius: 23, alignItems: "center", justifyContent: "center" },
});
