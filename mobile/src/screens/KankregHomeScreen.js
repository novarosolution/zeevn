import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
import WebHomePromiseBand from "../components/home/WebHomePromiseBand";
import {
  WebTimelineSection,
  WebProcessSection,
  WebAboutSection,
  WebCommunitySection,
} from "../components/home/homeWebSections";
import WebNativeIngredientsSection from "../components/home/WebNativeIngredientsSection";
import WebDiwaliBridgeSection from "../components/home/WebDiwaliBridgeSection";
import WebDiwaliAnnounceBar from "../components/home/WebDiwaliAnnounceBar";
import WebDiwaliDivider from "../components/home/WebDiwaliDivider";
import WebQualityAssuranceSection from "../components/home/WebQualityAssuranceSection";
import WebWhyChooseSection from "../components/home/WebWhyChooseSection";
import WebLineFocusSection from "../components/home/WebLineFocusSection";
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
import { KankregPageWrap } from "../components/kankreg/KankregPageWrap";
import KankregTrustStrip from "../components/kankreg/KankregTrustStrip";
import CatalogGridReveal from "../components/kankreg/CatalogGridReveal";
import PremiumEmptyState from "../components/ui/PremiumEmptyState";
import PremiumErrorBanner from "../components/ui/PremiumErrorBanner";
import { useKankregLayout } from "../theme/kankregBreakpoints";
import { KANKREG_CHROME } from "../theme/kankregWeb";
import { HOME_SECTION_GAP, HOME_SPACE } from "../theme/homeEditorial";
import { useCart } from "../context/CartContext";
import { useTheme } from "../context/ThemeContext";
import { DEFAULT_HOME_VIEW_CONFIG, getHomeViewConfig, getProducts, hydrateCatalogFromDisk } from "../services/productService";
import { getHomeCatalogProducts, getShopCatalogProducts, getProductCardFlags } from "../utils/productAvailability";
import { HOME_SCREEN_UI, SHOP_SCREEN_UI } from "../content/appContent";
import { deferAfterFirstPaint } from "../utils/deferAfterFirstPaint";
import { createQuoteBlockStyles } from "../theme/screenThemes";
import { productToCartLine } from "../utils/productCart";
import WebPhoneCategoryCircles from "../components/home/WebPhoneCategoryCircles";
import { StoreHome } from "../components/store/entry";
import AppStartupScreen from "../components/AppStartupScreen";
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
    paddingBottom: HOME_SPACE.md,
  },
  webSection: {
    width: "100%",
    gap: HOME_SPACE.md,
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
  const hasCachedCatalogRef = useRef(false);
  const skipWebFocusRefreshRef = useRef(Platform.OS === "web");
  useRedirectToFindLocationWhenNeeded(navigation, isAuthenticated);

  const load = useCallback(async (pull = false) => {
    if (pull) setRefreshing(true);
    else setLoading(true);
    setConfigError("");
    try {
      const useCache = !pull && hasCachedCatalogRef.current;
      const [list, config] = await Promise.all([
        getProducts({ preferCache: useCache }).catch(() => []),
        getHomeViewConfig({ preferCache: useCache, force: pull }).catch(() => null),
      ]);
      setProducts(Array.isArray(list) ? list : []);
      setHomeView(config || DEFAULT_HOME_VIEW_CONFIG);
      if (Array.isArray(list) && list.length) {
        hasCachedCatalogRef.current = true;
      }
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
    let cancelled = false;
    (async () => {
      const cached = await hydrateCatalogFromDisk();
      if (cancelled) return;
      if (cached?.products?.length) {
        hasCachedCatalogRef.current = true;
        setProducts(cached.products);
        setHomeView(cached.homeView || DEFAULT_HOME_VIEW_CONFIG);
      }
      if (Platform.OS === "web") {
        deferAfterFirstPaint(() => {
          if (!cancelled) load();
        }, { timeoutMs: isMobileWeb ? 400 : 200 });
        return;
      }
      load();
    })();
    return () => {
      cancelled = true;
    };
  }, [load, isMobileWeb]);

  useFocusEffect(
    useCallback(() => {
      if (skipWebFocusRefreshRef.current) {
        skipWebFocusRefreshRef.current = false;
        return undefined;
      }
      let cancelled = false;
      getProducts({ preferCache: true })
        .then((list) => {
          if (!cancelled && Array.isArray(list) && list.length) {
            setProducts(list);
            hasCachedCatalogRef.current = true;
          }
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
      return undefined;
    }
    let cancelled = false;
    const run = () => {
      fetchMyNotifications(token)
        .then((list) => {
          if (cancelled) return;
          const items = Array.isArray(list) ? list : [];
          setHasUnreadNotifications(items.some((n) => !n.isRead && !n.isArchived));
        })
        .catch(() => {
          if (!cancelled) setHasUnreadNotifications(false);
        });
    };
    if (Platform.OS === "web") {
      const cancelDeferred = deferAfterFirstPaint(run, { timeoutMs: 3000 });
      return () => {
        cancelled = true;
        cancelDeferred();
      };
    }
    run();
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

  const handleAdd = (p) => addToCart(productToCartLine(p));
  const handleRemove = (id) => removeFromCart(id);

  const primeTitle =
    Platform.OS === "web"
      ? HOME_SCREEN_UI.bestsellers.webEyebrow ||
        homeView?.primeSectionTitle ||
        HOME_SCREEN_UI.bestsellers.titleFallback
      : homeView?.primeSectionTitle || HOME_SCREEN_UI.bestsellers.titleFallback;
  const showPrime = homeView?.showPrimeSection !== false;
  const categorySectionEnabled =
    Platform.OS === "web"
      ? HOME_SCREEN_UI.web?.showCategorySection !== false
      : HOME_SCREEN_UI.native?.showCategorySection !== false;
  const showCategories = categorySectionEnabled && homeView?.showProductTypeSections !== false;
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

  if (loading) {
    return (
      <AppStartupScreen
        isDark={isDark}
        coverChrome
        footnote="Curating ghee, tel, masala & honey…"
      />
    );
  }

  if (Platform.OS !== "web") {
    return (
      <StoreHome
        navigation={navigation}
        products={shopCatalog}
        homeProducts={homeCatalog}
        homeView={homeView}
        refreshing={refreshing}
        onRefresh={() => load(true)}
        error={configError}
        onRetry={() => load()}
        hasUnread={hasUnreadNotifications}
      />
    );
  }

  const webCfg = HOME_SCREEN_UI.web || {};
  const webLean = webCfg.leanHome !== false;
  const showWebHero = webCfg.showWebHero !== false;
  const showLegacyTrustStrip = showHomeExtras && webCfg.showTrustStrip && ready;
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
  const showNativeIngredients =
    Platform.OS === "web" && webCfg.showNativeIngredients !== false;
  const showDiwaliBridge =
    Platform.OS === "web" && webCfg.showDiwaliBridge !== false;
  const showDiwaliFestive =
    Platform.OS === "web" && webCfg.showDiwaliFestive !== false;
  const showDiwaliAnnounce =
    Platform.OS === "web" && webCfg.showDiwaliAnnounce === true;
  const showQualityAssurance =
    Platform.OS === "web" && webCfg.showQualityAssurance !== false;
  const showWhyChoose = Platform.OS === "web" && webCfg.showWhyChoose !== false;
  const showLineFocus = Platform.OS === "web" && webCfg.showLineFocus !== false;
  const showPromiseBand = Platform.OS === "web" && webCfg.showPromiseBand !== false;
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
    <CustomerScreenShell
      style={[{ flex: 1 }, webCreamShell]}
      topAccent={!showWebHero && !showDiwaliBridge}
    >
      <KankregScrollPage
        scrollVariant="page"
        flushWebGutter={isMobileWeb}
        contentContainerStyle={[styles.webHomeScroll, isMobileWeb && styles.webHomeScrollClipX]}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => load(true)} tintColor={c.primary} />
        }
      >
        {showDiwaliAnnounce && !isMobileWeb ? <WebDiwaliAnnounceBar /> : null}
        {showDiwaliBridge && !isMobileWeb ? <WebDiwaliBridgeSection /> : null}
        {showWebHero ? (
          <WebPremiumHero
            navigation={navigation}
            heroSlides={homeView?.heroSlides}
            products={homeCatalog}
          />
        ) : null}

        {webCfg.showIntroBand !== false && !isMobileWeb ? (
          <WebHomeIntroBand navigation={navigation} />
        ) : null}

        {isMobileWeb && ready ? (
          <WebPhoneCategoryCircles
            products={shopCatalog}
            onPressShopAll={() => navigation.navigate("Shop")}
            onPressCategory={(label) => navigation.navigate("Shop", getShopNavParamsForLabel(label))}
          />
        ) : null}

        <View
          style={[
            styles.webHomeBody,
            isMobileWeb && styles.webHomeBodyMobile,
            {
              paddingHorizontal: pageGutterClamp,
              paddingTop: HOME_SPACE.xs,
            },
          ]}
        >
          <KankregPageWrap gap={isMobileWeb ? spacing.sm + 2 : HOME_SPACE.md}>
            {configError && !loading ? (
              <PremiumErrorBanner
                severity="error"
                message={configError}
                actionLabel="Retry"
                onActionPress={() => load()}
              />
            ) : null}

            {showCategories && ready && !isMobileWeb ? (
              webLean ? (
                <DeferredMount minHeight={220} rootMargin="280px 0px">
                  <HomeCategoryCards
                    products={shopCatalog}
                    productTypeTitle={homeView?.productTypeTitle}
                    onBrowse={(label) => navigation.navigate("Shop", getShopNavParamsForLabel(label))}
                    onOpenShop={() => navigation.navigate("Shop")}
                  />
                </DeferredMount>
              ) : (
              <ScrollFadeUp index={0}>
                <HomeCategoryCards
                  products={shopCatalog}
                  productTypeTitle={homeView?.productTypeTitle}
                  onBrowse={(label) => navigation.navigate("Shop", getShopNavParamsForLabel(label))}
                  onOpenShop={() => navigation.navigate("Shop")}
                />
              </ScrollFadeUp>
              )
            ) : null}

            {showLegacyTrustStrip ? (
              <ScrollFadeUp index={0}>
                <KankregTrustStrip />
              </ScrollFadeUp>
            ) : null}

            {showPromiseBand && ready ? <WebHomePromiseBand /> : null}

            {showPrime && ready ? (
              webLean ? (
                <DeferredMount minHeight={480} rootMargin="320px 0px">
                  <View style={styles.webSection} nativeID="home-bestsellers">
                    <SectionHeader
                      eyebrow={primeTitle}
                      title={HOME_SCREEN_UI.bestsellers.webSectionTitle}
                      kicker={HOME_SCREEN_UI.bestsellers.webKicker}
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
                </DeferredMount>
              ) : (
              <ScrollFadeUp index={1}>
                <View style={styles.webSection} nativeID="home-bestsellers">
                  <SectionHeader
                    eyebrow={primeTitle}
                    title={HOME_SCREEN_UI.bestsellers.webSectionTitle}
                    kicker={HOME_SCREEN_UI.bestsellers.webKicker}
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
              )
            ) : null}

            {showWhyChoose && ready ? <WebWhyChooseSection /> : null}

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

        {showNativeIngredients ? <WebNativeIngredientsSection /> : null}
        {showDiwaliFestive && !isMobileWeb ? <WebDiwaliDivider /> : null}

        {showLineFocus && ready ? (
          <View
            style={[
              styles.webHomeBody,
              isMobileWeb && styles.webHomeBodyMobile,
              { paddingHorizontal: pageGutterClamp, paddingTop: HOME_SPACE.xs },
            ]}
          >
            <KankregPageWrap gap={HOME_SPACE.md}>
              <WebLineFocusSection
                lineKey="tel"
                title="Cold-pressed Tel"
                kicker="Mustard, groundnut & sesame — pressed slow."
                products={homeCatalog}
                navigation={navigation}
                getItemQuantity={getItemQuantity}
                onAdd={handleAdd}
                onRemove={handleRemove}
                homeGridStyles={homeGridStyles}
                compact={catalogCardCompact}
              />
              <WebLineFocusSection
                lineKey="ghee"
                title="A2 Desi Ghee"
                kicker="Bilona jars for everyday cooking & gifting."
                products={homeCatalog}
                navigation={navigation}
                getItemQuantity={getItemQuantity}
                onAdd={handleAdd}
                onRemove={handleRemove}
                homeGridStyles={homeGridStyles}
                compact={catalogCardCompact}
              />
            </KankregPageWrap>
          </View>
        ) : null}

        {showDiwaliFestive && !isMobileWeb ? <WebDiwaliDivider /> : null}
        {showQualityAssurance ? <WebQualityAssuranceSection /> : null}

        {showBottomBlock ? (
        <View
          style={[
            styles.webHomeBody,
            isMobileWeb && styles.webHomeBodyMobile,
            webCreamShell,
            { paddingHorizontal: pageGutterClamp, paddingTop: HOME_SPACE.sm },
          ]}
        >
          <KankregPageWrap gap={isMobileWeb ? spacing.md : HOME_SPACE.md}>
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
            {showHomeExtras && webCfg.showTestimonials && ready ? (
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
