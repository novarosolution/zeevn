import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useFocusEffect } from "@react-navigation/native";
import { Platform, RefreshControl, StyleSheet, Text, View } from "react-native";
import CustomerScreenShell from "../components/CustomerScreenShell";
import BottomNavBar from "../components/BottomNavBar";
import KankregScrollPage from "../components/kankreg/KankregScrollPage";
import {
  HomeCategoryCards,
  HomeFeaturedEditorial,
  HomeMarqueeTicker,
} from "../components/home/HomeKankregSections";
import WebPremiumHero from "../components/home/WebPremiumHero";
import WebHomeIntroBand from "../components/home/WebHomeIntroBand";
import {
  WebTimelineSection,
  WebProcessSection,
  WebAboutSection,
  WebCommunitySection,
} from "../components/home/homeWebSections";
import DeferredMount from "../components/ui/DeferredMount";
import {
  normalizeAboutSection,
  normalizeCommunitySection,
  resolveProcessDisplay,
} from "../utils/homeViewMedia";
import { buildProcessSectionDefaults } from "../content/processHomeContent";
import HomeStatsStrip from "../components/home/HomeStatsStrip";
import HomeTestimonials from "../components/home/HomeTestimonials";
import HomeComingSoonStrip from "../components/home/HomeComingSoonStrip";
import { HomeCatalogGridCard, HomeCatalogViewAllLink } from "../components/home/HomeCatalogProductViews";
import { SectionHeader, ScrollFadeUp } from "../components/home/editorial";
import { KankregPageWrap } from "../components/kankreg/KankregPageChrome";
import KankregTrustStrip from "../components/kankreg/KankregTrustStrip";
import CatalogGridReveal from "../components/kankreg/CatalogGridReveal";
import PremiumEmptyState from "../components/ui/PremiumEmptyState";
import PremiumErrorBanner from "../components/ui/PremiumErrorBanner";
import { useKankregLayout } from "../theme/kankregBreakpoints";
import { KANKREG_CHROME } from "../theme/kankregWeb";
import { HOME_SECTION_GAP, HOME_SPACE } from "../theme/homeEditorial";
import { useCart } from "../context/CartContext";
import { useTheme } from "../context/ThemeContext";
import { DEFAULT_HOME_VIEW_CONFIG, getHomeViewConfig, getProducts, invalidateProductsCache } from "../services/productService";
import { getHomeCatalogProducts, getShopCatalogProducts } from "../utils/productAvailability";
import { HOME_SCREEN_UI, SHOP_SCREEN_UI } from "../content/appContent";
import { getProductCardFlags } from "../utils/productAvailability";
import { getScrollTrigger } from "../utils/loadGsap";
import { createQuoteBlockStyles } from "../theme/screenThemes";
import { productToCartLine } from "../utils/productCart";
import NativeHomeHeader from "../components/native/NativeHomeHeader";
import NativeHomeHeroSlider from "../components/home/NativeHomeHeroSlider";
import NativeSectionHeader from "../components/native/NativeSectionHeader";
import NativeCategoryRow from "../components/native/NativeCategoryRow";
import NativeBestsellersGrid from "../components/native/NativeBestsellersGrid";
import { HomePageSkeleton } from "../components/loading";
import { FIGMA } from "../theme/figmaApp";
import { useAuth } from "../context/AuthContext";
import { fetchMyNotifications } from "../services/userService";
import { spacing } from "../theme/tokens";
import { useDeliveryLocation } from "../hooks/useDeliveryLocation";
import { getShopNavParamsForLabel } from "../utils/homeCategories";

function useRedirectToFindLocationWhenNeeded(navigation, isAuthenticated) {
  const { bootstrapped, needsFindScreen } = useDeliveryLocation();

  useFocusEffect(
    useCallback(() => {
      if (Platform.OS === "web" || !bootstrapped || !isAuthenticated || !needsFindScreen) {
        return undefined;
      }
      const task = setTimeout(() => {
        navigation.reset({
          index: 0,
          routes: [{ name: "FindLocation" }],
        });
      }, 0);
      return () => clearTimeout(task);
    }, [bootstrapped, isAuthenticated, needsFindScreen, navigation])
  );
}

const nativeHomeStyles = StyleSheet.create({
  shell: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: spacing.xs,
    paddingHorizontal: 0,
    gap: spacing.md,
    width: "100%",
    maxWidth: "100%",
  },
  bannerWrap: {
    paddingHorizontal: FIGMA.gutter,
    marginBottom: spacing.xs,
  },
  emptyWrap: {
    paddingHorizontal: FIGMA.gutter,
  },
  divider: {
    marginHorizontal: FIGMA.gutter,
    marginTop: spacing.xs,
    marginBottom: spacing.xs,
  },
});

const homeGridStyles = StyleSheet.create({
  productGridWrap: {},
  productGridCell: {},
  productListRow: {},
});

const styles = StyleSheet.create({
  webHomeScroll: Platform.select({
    web: {
      paddingHorizontal: 0,
      overflow: "visible",
      width: "100%",
      maxWidth: "100%",
      alignSelf: "stretch",
    },
    default: {},
  }),
  webHomeScrollClipX: Platform.select({
    web: { overflowX: "clip", width: "100%", maxWidth: "100%" },
    default: {},
  }),
  webHomeBodyMobile: {
    width: "100%",
    maxWidth: "100%",
    alignSelf: "stretch",
  },
  webHomeBody: {
    width: "100%",
    maxWidth: 1280,
    alignSelf: "center",
  },
  webSection: {
    width: "100%",
  },
});

function HomeQuote({ isDark }) {
  const { isXs } = useKankregLayout();
  const quoteStyles = createQuoteBlockStyles(isDark);
  return (
    <View style={[quoteStyles.wrap, isXs && quoteStyles.wrapXs]}>
      <Text style={quoteStyles.mark} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
        “
      </Text>
      <View style={quoteStyles.block}>
        <Text style={[quoteStyles.text, isXs && quoteStyles.textXs]}>{HOME_SCREEN_UI.quote.text}</Text>
        <Text style={quoteStyles.who}>{HOME_SCREEN_UI.quote.attribution}</Text>
      </View>
    </View>
  );
}

export default function KankregHomeScreen({ navigation }) {
  const { colors: c, isDark } = useTheme();
  const { catalogCardCompact: layoutCompact, isMobileWeb, pageGutterClamp } = useKankregLayout();
  const { addToCart, removeFromCart, getItemQuantity } = useCart();
  const { isAuthenticated, token } = useAuth();
  const [products, setProducts] = useState([]);
  const [hasUnreadNotifications, setHasUnreadNotifications] = useState(false);
  const [homeView, setHomeView] = useState(DEFAULT_HOME_VIEW_CONFIG);
  const [loading, setLoading] = useState(true);
  const [configError, setConfigError] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const { displayLabel } = useDeliveryLocation();
  useRedirectToFindLocationWhenNeeded(navigation, isAuthenticated);

  const load = useCallback(async (pull = false) => {
    if (pull) setRefreshing(true);
    else setLoading(true);
    setConfigError("");
    try {
      const [list, config] = await Promise.all([
        getProducts().catch(() => []),
        getHomeViewConfig().catch(() => null),
      ]);
      setProducts(Array.isArray(list) ? list : []);
      setHomeView(config || DEFAULT_HOME_VIEW_CONFIG);
      if (!Array.isArray(list) || !list.length) {
        setConfigError("Could not load products. Check your connection and try again.");
      }
    } catch {
      setProducts([]);
      setHomeView(DEFAULT_HOME_VIEW_CONFIG);
      setConfigError("Could not load the store. Try again when the server is online.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      invalidateProductsCache();
      getProducts()
        .then((list) => {
          if (!cancelled) setProducts(Array.isArray(list) ? list : []);
        })
        .catch(() => {});
      return () => {
        cancelled = true;
      };
    }, [])
  );

  useEffect(() => {
    if (!isAuthenticated || !token) {
      setHasUnreadNotifications(false);
      return;
    }
    let cancelled = false;
    fetchMyNotifications(token)
      .then((list) => {
        if (cancelled) return;
        const items = Array.isArray(list) ? list : [];
        setHasUnreadNotifications(items.some((n) => !n.isRead && !n.isArchived));
      })
      .catch(() => {
        if (!cancelled) setHasUnreadNotifications(false);
      });
    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, token]);

  const catalogCardCompact =
    homeView?.productCardStyle === "comfortable" ? false : homeView?.productCardStyle === "compact" ? true : layoutCompact;

  const shopCatalog = useMemo(() => getShopCatalogProducts(products), [products]);
  const homeCatalog = useMemo(() => getHomeCatalogProducts(products), [products]);
  const comingSoonOnHome = useMemo(
    () => homeCatalog.filter((p) => getProductCardFlags(p).isComingSoon),
    [homeCatalog]
  );
  const featuredProduct = homeCatalog[0] || products[0];

  useEffect(() => {
    if (Platform.OS !== "web" || loading || isMobileWeb) return undefined;
    let cancelled = false;
    getScrollTrigger()
      .then((ScrollTrigger) => {
        if (!cancelled && ScrollTrigger) ScrollTrigger.refresh();
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [loading, homeCatalog.length, isMobileWeb]);
  const handleAdd = (p) => addToCart(productToCartLine(p));
  const handleRemove = (id) => removeFromCart(id);

  const primeTitle = homeView?.primeSectionTitle || HOME_SCREEN_UI.bestsellers.titleFallback;
  const showPrime = homeView?.showPrimeSection !== false;
  const showCategories = homeView?.showProductTypeSections !== false;
  const showHomeExtras = homeView?.showHomeSections !== false;
  const ready = !loading;
  const processSection = homeView?.processSection ?? DEFAULT_HOME_VIEW_CONFIG.processSection;
  const showProcessSection = useMemo(() => {
    if (!ready || !showHomeExtras) return false;
    return Boolean(
      resolveProcessDisplay(processSection) ??
        resolveProcessDisplay(buildProcessSectionDefaults())
    );
  }, [ready, showHomeExtras, processSection]);
  if (Platform.OS !== "web") {
    return (
      <CustomerScreenShell style={nativeHomeStyles.shell}>
        <NativeHomeHeader
          navigation={navigation}
          hasNotifications={hasUnreadNotifications}
          locationLabel={displayLabel}
          onRefreshLocation={() => {
            if (!isAuthenticated) {
              navigation.navigate("Login");
              return;
            }
            navigation.navigate("FindLocation", { force: true });
          }}
        />
        <KankregScrollPage
          scrollVariant="inner"
          topInsetOwner="external"
          style={nativeHomeStyles.scroll}
          showFooter={false}
          contentContainerStyle={nativeHomeStyles.scrollContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => load(true)} tintColor={c.primary} />
          }
        >
          {configError && !loading ? (
            <View style={nativeHomeStyles.bannerWrap}>
              <PremiumErrorBanner
                severity="error"
                message={configError}
                actionLabel="Retry"
                onActionPress={() => load()}
              />
            </View>
          ) : null}
          {HOME_SCREEN_UI.native?.showNativeHero !== false ? (
            <NativeHomeHeroSlider
              navigation={navigation}
              heroSlides={homeView?.heroSlides}
              products={homeCatalog}
            />
          ) : null}
          {loading ? <HomePageSkeleton showHeader={false} /> : null}

          {showCategories && ready ? (
            <>
              <NativeSectionHeader
                title={HOME_SCREEN_UI.categories.title}
                actionLabel={HOME_SCREEN_UI.categories.action}
                onAction={() => navigation.navigate("Shop")}
                tight
              />
              <NativeCategoryRow
                products={shopCatalog}
                onPress={(label) => navigation.navigate("Shop", getShopNavParamsForLabel(label))}
              />
            </>
          ) : null}

          {showPrime && ready ? (
            <>
              <NativeSectionHeader
                title={primeTitle}
                actionLabel={HOME_SCREEN_UI.bestsellers.action}
                onAction={() => navigation.navigate("Shop")}
              />
              {homeCatalog.length ? (
                <NativeBestsellersGrid
                  products={homeCatalog}
                  onProductPress={(item) => navigation.navigate("Product", { productId: item.id })}
                  onAddToCart={handleAdd}
                />
              ) : ready ? (
                <View style={nativeHomeStyles.emptyWrap}>
                  <PremiumEmptyState
                    iconName="bag-outline"
                    title={HOME_SCREEN_UI.empty.productsTitle}
                    description={HOME_SCREEN_UI.empty.productsDescription}
                    ctaLabel={HOME_SCREEN_UI.empty.productsCta}
                    onCtaPress={() => navigation.navigate("Shop")}
                  />
                </View>
              ) : null}
            </>
          ) : null}

        </KankregScrollPage>
        <BottomNavBar />
      </CustomerScreenShell>
    );
  }

  const webCfg = HOME_SCREEN_UI.web || {};
  const webLean = webCfg.leanHome !== false;
  const showWebHero = webCfg.showWebHero !== false;
  const showLegacyTrustStrip =
    !webLean && showHomeExtras && webCfg.showTrustStrip && ready && !showWebHero;
  const aboutSection = homeView?.aboutSection ?? DEFAULT_HOME_VIEW_CONFIG.aboutSection;
  const communitySection =
    homeView?.communitySection ?? DEFAULT_HOME_VIEW_CONFIG.communitySection;
  const showAboutStory =
    !webLean && webCfg.showAboutSection !== false && ready && normalizeAboutSection(aboutSection).enabled;
  const showCommunitySection =
    !webLean &&
    webCfg.showCommunitySection !== false &&
    ready &&
    normalizeCommunitySection(communitySection).enabled;
  const showTimelineSection = !webLean && webCfg.showTimelineSection === true && ready;
  const showWebProcess =
    !webLean && webCfg.showProcessSection !== false && showProcessSection;
  const showBottomBlock =
    !webLean &&
    (showAboutStory ||
      showCommunitySection ||
      webCfg.showMarquee ||
      webCfg.showBrandQuote ||
      webCfg.showTestimonials ||
      webCfg.showFeaturedEditorial ||
      webCfg.showStatsStrip);
  const webCreamShell =
    Platform.OS === "web" && !isDark ? { backgroundColor: KANKREG_CHROME.cream } : null;

  return (
    <CustomerScreenShell style={[{ flex: 1 }, webCreamShell]} topAccent={!showWebHero}>
      <KankregScrollPage
        scrollVariant="page"
        flushWebGutter={isMobileWeb}
        contentContainerStyle={[styles.webHomeScroll, isMobileWeb && styles.webHomeScrollClipX]}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => load(true)} tintColor={c.primary} />
        }
      >
        {showWebHero ? (
          <WebPremiumHero
            navigation={navigation}
            heroSlides={homeView?.heroSlides}
            products={homeCatalog}
          />
        ) : null}

        {webCfg.showIntroBand !== false ? (
          <WebHomeIntroBand navigation={navigation} />
        ) : null}

        <View
          style={[
            styles.webHomeBody,
            isMobileWeb && styles.webHomeBodyMobile,
            {
              paddingHorizontal: pageGutterClamp,
              paddingTop: HOME_SPACE.lg,
            },
          ]}
        >
          <KankregPageWrap gap={isMobileWeb ? spacing.lg : HOME_SECTION_GAP}>
            {loading ? <HomePageSkeleton /> : null}

            {configError && !loading ? (
              <PremiumErrorBanner
                severity="error"
                message={configError}
                actionLabel="Retry"
                onActionPress={() => load()}
              />
            ) : null}

            {showLegacyTrustStrip ? (
              <ScrollFadeUp index={0}>
                <KankregTrustStrip />
              </ScrollFadeUp>
            ) : null}

            {showCategories && ready ? (
              <ScrollFadeUp index={0}>
                {isMobileWeb ? (
                  <>
                    <NativeSectionHeader
                      title={HOME_SCREEN_UI.categories.title}
                      actionLabel={HOME_SCREEN_UI.categories.action}
                      onAction={() => navigation.navigate("Shop")}
                      tight
                    />
                    <NativeCategoryRow
                      products={shopCatalog}
                      onPress={(label) => navigation.navigate("Shop", getShopNavParamsForLabel(label))}
                    />
                  </>
                ) : (
                  <HomeCategoryCards
                    products={shopCatalog}
                    productTypeTitle={homeView?.productTypeTitle}
                    onBrowse={(label) => navigation.navigate("Shop", getShopNavParamsForLabel(label))}
                    onOpenShop={() => navigation.navigate("Shop")}
                  />
                )}
              </ScrollFadeUp>
            ) : null}

            {showPrime && ready ? (
              <ScrollFadeUp index={1}>
                <View style={styles.webSection} nativeID="home-bestsellers">
                  <SectionHeader
                    eyebrow={primeTitle}
                    title={HOME_SCREEN_UI.bestsellers.webSectionTitle}
                    right={
                      <HomeCatalogViewAllLink
                        label={HOME_SCREEN_UI.bestsellers.webAction}
                        onPress={() => navigation.navigate("Shop")}
                      />
                    }
                  />
                  {comingSoonOnHome.length ? <HomeComingSoonStrip products={comingSoonOnHome} /> : null}
                  <View nativeID="home-catalog">
                    {homeCatalog.length ? (
                      <CatalogGridReveal
                        immediateFirst={Math.min(homeCatalog.length, isMobileWeb ? 1 : 8)}
                        staggerGap={52}
                        staggerInitialDelay={48}
                      >
                        {homeCatalog.map((item, idx) => {
                          const flags = getProductCardFlags(item, SHOP_SCREEN_UI.card.comingSoonNoteFallback);
                          return (
                          <HomeCatalogGridCard
                            key={item.id}
                            idx={idx}
                            item={item}
                            variant="editorial"
                            compact={catalogCardCompact}
                            navigation={navigation}
                            quantity={getItemQuantity(item.id)}
                            styles={homeGridStyles}
                            isOutOfStock={flags.isOutOfStock}
                            isComingSoon={flags.isComingSoon}
                            comingSoonNote={flags.comingSoonNote}
                            onAddToCart={() => handleAdd(item)}
                            onRemoveFromCart={() => handleRemove(item.id)}
                          />
                        );})}
                      </CatalogGridReveal>
                    ) : (
                      <PremiumEmptyState
                        iconName="bag-outline"
                        title={HOME_SCREEN_UI.empty.productsTitle}
                        description={HOME_SCREEN_UI.empty.productsDescription}
                        ctaLabel={HOME_SCREEN_UI.empty.productsCta}
                        onCtaPress={() => navigation.navigate("Shop")}
                      />
                    )}
                  </View>
                </View>
              </ScrollFadeUp>
            ) : null}

            {showTimelineSection ? (
              <ScrollFadeUp index={2}>
                <DeferredMount minHeight={320} rootMargin="320px 0px">
                  <WebTimelineSection />
                </DeferredMount>
              </ScrollFadeUp>
            ) : null}

            {showWebProcess ? (
              <ScrollFadeUp index={3} immediate>
                <WebProcessSection processSection={processSection} />
              </ScrollFadeUp>
            ) : null}

          </KankregPageWrap>
        </View>

        {showBottomBlock ? (
        <View
          style={[
            styles.webHomeBody,
            isMobileWeb && styles.webHomeBodyMobile,
            webCreamShell,
            { paddingHorizontal: pageGutterClamp, paddingTop: HOME_SECTION_GAP },
          ]}
        >
          <KankregPageWrap gap={isMobileWeb ? spacing.lg : HOME_SECTION_GAP}>
            {showAboutStory ? (
              <ScrollFadeUp index={4}>
                <DeferredMount minHeight={400} rootMargin="280px 0px">
                  <WebAboutSection
                    aboutSection={aboutSection}
                    navigation={navigation}
                    variant="editorial"
                  />
                </DeferredMount>
              </ScrollFadeUp>
            ) : null}

            {showCommunitySection ? (
              <DeferredMount minHeight={280} rootMargin="240px 0px">
                <WebCommunitySection communitySection={communitySection} />
              </DeferredMount>
            ) : null}

            {showHomeExtras && webCfg.showStatsStrip && !isMobileWeb && ready ? (
              <ScrollFadeUp index={5}>
                <HomeStatsStrip c={c} isDark={isDark} />
              </ScrollFadeUp>
            ) : null}
            {showHomeExtras && webCfg.showMarquee && ready ? (
              <ScrollFadeUp index={6}>
                <HomeMarqueeTicker />
              </ScrollFadeUp>
            ) : null}
            {showHomeExtras && webCfg.showFeaturedEditorial && featuredProduct && ready ? (
              <ScrollFadeUp index={7}>
                <HomeFeaturedEditorial product={featuredProduct} navigation={navigation} />
              </ScrollFadeUp>
            ) : null}
            {showHomeExtras && webCfg.showTestimonials && !isMobileWeb && ready ? (
              <ScrollFadeUp index={8}>
                <HomeTestimonials c={c} isDark={isDark} />
              </ScrollFadeUp>
            ) : null}
            {showHomeExtras && webCfg.showBrandQuote && ready ? (
              <ScrollFadeUp index={9} preset="fade-in">
                <HomeQuote isDark={isDark} />
              </ScrollFadeUp>
            ) : null}
          </KankregPageWrap>
        </View>
        ) : null}
      </KankregScrollPage>
      <BottomNavBar />
    </CustomerScreenShell>
  );
}
