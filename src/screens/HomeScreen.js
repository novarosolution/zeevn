/* @refresh reset */
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRoute } from "@react-navigation/native";
import {
  ActivityIndicator,
  Modal,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import Animated, { FadeInDown } from "react-native-reanimated";
import HomePageFooter from "../components/home/HomePageFooter";
import BottomNavBar from "../components/BottomNavBar";
import ProductCard from "../components/ProductCard";
import QCommerceSearchField from "../components/qcommerce/QCommerceSearchField";
import BrandLogo from "../components/BrandLogo";
import { getHomeViewConfig, getProducts } from "../services/productService";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { fonts, layout, radius, spacing, typography } from "../theme/tokens";
import {
  HOME_CATALOG_INTRO,
  HOME_HERO_BANNER,
  HOME_MENU_STARTER_TAG,
  HOME_TRUST_STRIP,
  HOME_VIEW_DEFAULTS,
  HOME_WORDMARK_TAGLINE,
} from "../content/appContent";
import { BRAND_LOGO_SIZE, SEARCH_PLACEHOLDER } from "../constants/brand";
import { HOME_CATALOG_ALL, matchesShelfProduct } from "../utils/shelfMatch";
import { productToCartLine } from "../utils/productCart";
import {
  ALCHEMY,
  CUSTOMER_SHELL_GRADIENT_LOCATIONS,
  FONT_DISPLAY,
  FONT_DISPLAY_SEMI,
  getCustomerShellGradient,
} from "../theme/customerAlchemy";
import { customerPageScrollBase } from "../theme/screenLayout";

/** Room for optional tagline under home wordmark (keeps hamburger & cart aligned). */
const HOME_TOPBAR_TAGLINE_ROOM = 14;
/** Distance from top of screen to first row of menu (below home bar + gap). */
const HOME_MENU_TOP_OFFSET = BRAND_LOGO_SIZE.homeTopBar + HOME_TOPBAR_TAGLINE_ROOM + spacing.sm * 2 + spacing.xs;

/** Home lists the full catalog; `showOnHome` on each product still controls visibility. */
function matchesHomeShelf(product) {
  return matchesShelfProduct(product, HOME_CATALOG_ALL);
}

function SectionHeading({ title, count, styles, c, onSeeAll, isDark }) {
  return (
    <View style={styles.sectionHeaderRow}>
      <View style={styles.sectionHeaderBlock}>
        <View style={styles.sectionTitleRow}>
          <View style={[styles.sectionAccentBar, isDark ? styles.sectionAccentBarDark : styles.sectionAccentBarLight]} />
          <View style={styles.sectionTitleStack}>
            <Text style={styles.sectionHeading}>{title}</Text>
            {count != null && count > 0 ? (
              <Text style={styles.sectionSub}>
                {count} {count === 1 ? "product" : "products"}
              </Text>
            ) : null}
          </View>
        </View>
      </View>
      {onSeeAll ? (
        <TouchableOpacity
          onPress={onSeeAll}
          hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}
          activeOpacity={0.82}
          style={[styles.sectionSeeAllBtn, { borderColor: c.primaryBorder, backgroundColor: c.primarySoft }]}
        >
          <Text style={[styles.sectionSeeAll, { color: c.primaryDark }]}>See all</Text>
          <Ionicons name="chevron-forward" size={14} color={c.primaryDark} />
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

export default function HomeScreen({ navigation }) {
  const route = useRoute();
  const { colors: c, shadowLift, shadowPremium, isDark } = useTheme();
  const styles = useMemo(() => createHomeStyles(c, shadowLift, shadowPremium, isDark), [c, shadowLift, shadowPremium, isDark]);
  const scrollRef = useRef(null);
  const featuredYRef = useRef(0);

  const insets = useSafeAreaInsets();
  const { addToCart, removeFromCart, getItemQuantity, totalItems } = useCart();
  const { isAuthenticated } = useAuth();
  const [query, setQuery] = useState("");
  /** From menu: full catalog vs curated starter picks */
  const [collectionTab, setCollectionTab] = useState("all");
  const [menuOpen, setMenuOpen] = useState(false);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [sectionFilter, setSectionFilter] = useState(null);
  const [homeViewConfig, setHomeViewConfig] = useState({ ...HOME_VIEW_DEFAULTS });
  const [refreshing, setRefreshing] = useState(false);

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
      setError(err.message || "Unable to load products.");
    } finally {
      if (isPullRefresh) {
        setRefreshing(false);
      } else {
        setLoading(false);
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

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      if (!matchesHomeShelf(product)) return false;
      const productName = String(product?.name || "");
      const productDescription = String(product?.description || "");
      const searchTerm = query.trim().toLowerCase();
      const matchesSearch =
        searchTerm.length === 0 ||
        productName.toLowerCase().includes(searchTerm) ||
        productDescription.toLowerCase().includes(searchTerm);
      return matchesSearch;
    });
  }, [products, query]);

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

  const productsForHome = useMemo(() => {
    if (query.trim()) return homeVisibleProducts;
    if (collectionTab === "starter") return homeVisibleProducts.slice(0, 4);
    return homeVisibleProducts;
  }, [homeVisibleProducts, collectionTab, query]);

  const totalMatches = productsForHome.length;
  const showMarketing = !query.trim();
  const homeCatalogCount = homeVisibleProducts.length;
  const starterShownCount = Math.min(4, homeCatalogCount);

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

  const shellColors = useMemo(() => getCustomerShellGradient(isDark, c), [isDark, c]);

  const scrollToFeatured = useCallback(() => {
    const y = Math.max(0, featuredYRef.current - 12);
    scrollRef.current?.scrollTo({ y, animated: true });
  }, []);

  const renderProductListCard = (item, index = 0, totalInGroup = 1) => (
    <View
      style={[
        styles.productListRow,
        index < totalInGroup - 1 ? styles.productListRowDivider : styles.productListRowLast,
      ]}
    >
      <ProductCard
        variant="list"
        editorial
        compact={homeViewConfig.productCardStyle === "compact"}
        showCategory={false}
        index={index}
        isOutOfStock={item.inStock === false || Number(item.stockQty || 0) <= 0}
        product={item}
        onPress={() => navigation.navigate("Product", { productId: item.id })}
        quantity={getItemQuantity(item.id)}
        onAddToCart={() => {
          if (item.inStock === false || Number(item.stockQty || 0) <= 0) {
            return;
          }
          if (!isAuthenticated) {
            navigation.navigate("Login");
            return;
          }
          addToCart(productToCartLine(item));
        }}
        onRemoveFromCart={() => {
          if (!isAuthenticated) {
            navigation.navigate("Login");
            return;
          }
          removeFromCart(item.id);
        }}
      />
    </View>
  );
  return (
    <View style={styles.screen}>
      <LinearGradient
        colors={shellColors}
        locations={CUSTOMER_SHELL_GRADIENT_LOCATIONS}
        start={{ x: 0.06, y: 0 }}
        end={{ x: 0.94, y: 1 }}
        style={styles.gradientFill}
      >
        <ScrollView
        ref={scrollRef}
        style={styles.scrollMain}
        contentContainerStyle={[
          customerPageScrollBase,
          { paddingTop: spacing.lg, paddingBottom: Platform.OS === "web" ? spacing.xxl : 100 },
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          Platform.OS === "web" ? undefined : (
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => loadHomeData({ isPullRefresh: true })}
              tintColor={c.primary}
              colors={[c.primary]}
              progressBackgroundColor={c.surface}
            />
          )
        }
      >
        <View style={[styles.headerWrap, { paddingTop: Math.max(insets.top, spacing.sm) }]}>
          <View
            style={[
              styles.headerAmbientCard,
              isDark ? styles.headerAmbientCardDark : styles.headerAmbientCardLight,
            ]}
          >
            <LinearGradient
              colors={[ALCHEMY.gold, "rgba(212, 175, 55, 0.35)", "transparent"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.headerAmbientSheen}
              pointerEvents="none"
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
                  <Ionicons name="menu" size={26} color={isDark ? c.textPrimary : ALCHEMY.brown} />
                </Pressable>
                <View style={styles.wordmarkBlock}>
                  <BrandLogo
                    width={BRAND_LOGO_SIZE.homeTopBar}
                    height={BRAND_LOGO_SIZE.homeTopBar}
                    style={styles.topBarLogo}
                  />
                  <Text style={styles.wordmarkTagline} numberOfLines={1} ellipsizeMode="tail">
                    {HOME_WORDMARK_TAGLINE}
                  </Text>
                </View>
                <Pressable
                  onPress={() => navigation.navigate("Cart")}
                  style={({ pressed }) => [styles.alchemyIconBtn, pressed && { opacity: 0.75 }]}
                  hitSlop={10}
                  accessibilityRole="button"
                  accessibilityLabel={totalItems > 0 ? `Cart, ${totalItems} items` : "Cart"}
                >
                  <View style={styles.cartBtnInner}>
                    <Ionicons name="bag-handle-outline" size={26} color={isDark ? c.textPrimary : ALCHEMY.brown} />
                    {totalItems > 0 ? (
                      <View
                        style={[
                          styles.cartBadge,
                          {
                            backgroundColor: c.primary,
                            borderColor: isDark ? "rgba(28, 25, 23, 0.95)" : "#FFFCF8",
                          },
                        ]}
                      >
                        <Text style={styles.cartBadgeText}>{totalItems > 99 ? "99+" : String(totalItems)}</Text>
                      </View>
                    ) : null}
                  </View>
                </Pressable>
              </View>
            </View>
            <View style={[styles.headerInnerDivider, isDark ? styles.headerInnerDividerDark : null]} />
            <View style={styles.searchWrap}>
              <LinearGradient
                colors={["rgba(201, 162, 39, 0.65)", "rgba(116, 79, 28, 0.45)", "rgba(201, 162, 39, 0.4)"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.searchGradientFrame}
              >
                <View style={[styles.searchInner, { backgroundColor: isDark ? c.surface : ALCHEMY.cardBg }]}>
                  <QCommerceSearchField
                    premium
                    value={query}
                    onChangeText={setQuery}
                    onClear={() => setQuery("")}
                    placeholder={SEARCH_PLACEHOLDER}
                  />
                </View>
              </LinearGradient>
            </View>
          </View>

          {showMarketing ? (
            <React.Fragment>
              <Animated.View entering={FadeInDown.duration(520)} style={styles.heroImageOuter}>
                <LinearGradient
                  colors={
                    isDark
                      ? ["#221C18", "#162820", "#0C100E"]
                      : ["#322314", "#4A3218", "#1C1208"]
                  }
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.heroPremiumFill}
                >
                  <LinearGradient
                    colors={["rgba(212,175,55,0.28)", "rgba(61,42,18,0.08)", "rgba(6,4,2,0.65)"]}
                    locations={[0, 0.42, 1]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={StyleSheet.absoluteFill}
                    pointerEvents="none"
                  />
                  <LinearGradient
                    colors={
                      isDark
                        ? ["transparent", "rgba(12, 10, 8, 0.2)", "rgba(28, 25, 23, 0.88)"]
                        : ["transparent", "rgba(28, 22, 14, 0.12)", "rgba(20, 14, 8, 0.82)"]
                    }
                    locations={[0.35, 0.72, 1]}
                    start={{ x: 0.5, y: 0 }}
                    end={{ x: 0.5, y: 1 }}
                    style={styles.heroBottomFade}
                    pointerEvents="none"
                  />
                  <View style={styles.heroOrbs} pointerEvents="none">
                    <View style={styles.heroOrb1} />
                    <View style={styles.heroOrb2} />
                    <View style={styles.heroOrb3} />
                  </View>
                  <View style={styles.heroImageInner}>
                    <BrandLogo
                      width={BRAND_LOGO_SIZE.homeHero}
                      height={BRAND_LOGO_SIZE.homeHero}
                      style={styles.heroBrandLogo}
                    />
                    <Text style={styles.heroKicker}>{HOME_HERO_BANNER.kicker}</Text>
                    <View style={styles.heroBadge}>
                      <Text style={styles.heroBadgeText}>{HOME_HERO_BANNER.badge}</Text>
                    </View>
                    <Text style={[styles.heroDisplayTitle, { color: "#FFFCF8" }]}>{homeViewConfig.heroTitle}</Text>
                    <Text style={[styles.heroDisplaySub, { color: "rgba(255,252,248,0.9)" }]}>{homeViewConfig.heroSubtitle}</Text>
                    <Pressable
                      style={({ pressed }) => [
                        styles.heroCtaWrap,
                        pressed && { opacity: 0.94 },
                        Platform.OS !== "web" && pressed ? { transform: [{ scale: 0.99 }] } : null,
                      ]}
                      onPress={scrollToFeatured}
                    >
                      <LinearGradient
                        colors={[ALCHEMY.gold, "#A67C1A", ALCHEMY.brown]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.heroCtaGradient}
                      >
                        <Text style={styles.heroBrownCtaText}>{HOME_HERO_BANNER.cta}</Text>
                        <Ionicons name="arrow-forward" size={18} color="#FFFCF8" />
                      </LinearGradient>
                    </Pressable>
                  </View>
                  <LinearGradient
                    colors={[ALCHEMY.gold, ALCHEMY.brown]}
                    start={{ x: 0, y: 0.5 }}
                    end={{ x: 1, y: 0.5 }}
                    style={styles.heroGoldHairline}
                  />
                </LinearGradient>
              </Animated.View>
              <View style={[styles.trustStrip, isDark ? styles.trustStripDark : null]}>
                {HOME_TRUST_STRIP.map((item) => (
                  <View
                    key={item.key}
                    style={[
                      styles.trustPill,
                      isDark
                        ? { backgroundColor: "rgba(201, 162, 39, 0.08)", borderColor: "rgba(201, 162, 39, 0.2)" }
                        : { backgroundColor: "rgba(255, 252, 248, 0.98)", borderColor: "rgba(116, 79, 28, 0.1)" },
                    ]}
                  >
                    <View
                      style={[
                        styles.trustIconCircle,
                        isDark ? styles.trustIconCircleDark : styles.trustIconCircleLight,
                      ]}
                    >
                      <Ionicons name={item.icon} size={16} color={ALCHEMY.gold} />
                    </View>
                    <Text
                      style={[styles.trustText, { color: isDark ? c.textSecondary : ALCHEMY.brownMuted }]}
                      numberOfLines={1}
                    >
                      {item.label}
                    </Text>
                  </View>
                ))}
              </View>
              <View style={styles.collectionChipsBlock}>
                <View style={styles.collectionChipsHeaderRow}>
                  <View style={[styles.collectionChipsDecorLine, isDark ? styles.collectionChipsDecorLineDark : null]} />
                  <Text style={[styles.collectionChipsLabel, { color: c.textMuted }]}>Collection</Text>
                  <View style={[styles.collectionChipsDecorLine, isDark ? styles.collectionChipsDecorLineDark : null]} />
                </View>
                <View style={styles.collectionChipsRow}>
                  <Pressable
                    onPress={() => {
                      setCollectionTab("all");
                      requestAnimationFrame(() => scrollToFeatured());
                    }}
                    style={({ pressed }) => [
                      styles.collectionChip,
                      collectionTab === "all" ? styles.collectionChipActive : styles.collectionChipIdle,
                      isDark ? styles.collectionChipIdleDark : null,
                      isDark && collectionTab === "all" ? styles.collectionChipActiveDark : null,
                      pressed && { opacity: 0.88 },
                    ]}
                    accessibilityRole="button"
                    accessibilityState={{ selected: collectionTab === "all" }}
                    accessibilityLabel="Full catalog, all ghee"
                  >
                    <Ionicons
                      name="flame-outline"
                      size={18}
                      color={collectionTab === "all" ? ALCHEMY.brown : isDark ? c.textSecondary : ALCHEMY.brownMuted}
                    />
                    <View style={styles.collectionChipTextCol}>
                      <Text
                        style={[
                          styles.collectionChipTitle,
                          { color: collectionTab === "all" ? c.textPrimary : c.textSecondary },
                        ]}
                      >
                        All Ghee
                      </Text>
                      <Text style={[styles.collectionChipSub, { color: c.textMuted }]} numberOfLines={1}>
                        {homeCatalogCount} {homeCatalogCount === 1 ? "item" : "items"}
                      </Text>
                    </View>
                  </Pressable>
                  <Pressable
                    onPress={() => {
                      setCollectionTab("starter");
                      requestAnimationFrame(() => scrollToFeatured());
                    }}
                    style={({ pressed }) => [
                      styles.collectionChip,
                      collectionTab === "starter" ? styles.collectionChipActive : styles.collectionChipIdle,
                      isDark ? styles.collectionChipIdleDark : null,
                      isDark && collectionTab === "starter" ? styles.collectionChipActiveDark : null,
                      pressed && { opacity: 0.88 },
                    ]}
                    accessibilityRole="button"
                    accessibilityState={{ selected: collectionTab === "starter" }}
                    accessibilityLabel="Starter picks, first items"
                  >
                    <Ionicons
                      name="water-outline"
                      size={18}
                      color={collectionTab === "starter" ? ALCHEMY.brown : isDark ? c.textSecondary : ALCHEMY.brownMuted}
                    />
                    <View style={styles.collectionChipTextCol}>
                      <Text
                        style={[
                          styles.collectionChipTitle,
                          { color: collectionTab === "starter" ? c.textPrimary : c.textSecondary },
                        ]}
                      >
                        My First Drop
                      </Text>
                      <Text style={[styles.collectionChipSub, { color: c.textMuted }]} numberOfLines={1}>
                        {starterShownCount} picks · {HOME_MENU_STARTER_TAG}
                      </Text>
                    </View>
                  </Pressable>
                </View>
              </View>
            </React.Fragment>
          ) : (
            <View style={[styles.heroCardCompact, isDark ? null : { backgroundColor: ALCHEMY.cardBg, borderColor: ALCHEMY.pillInactive }]}>
              <Text style={[styles.heroTitle, { fontFamily: FONT_DISPLAY }]}>{homeViewConfig.heroTitle}</Text>
              <Text style={styles.heroSubtext}>{homeViewConfig.heroSubtitle}</Text>
            </View>
          )}

          {query.trim() ? (
            <TouchableOpacity style={styles.activeFilterBar} onPress={() => setQuery("")} activeOpacity={0.85}>
              <Ionicons name="search-outline" size={16} color={c.primary} />
              <Text style={styles.activeFilterText} numberOfLines={1}>
                “{query.trim()}”
              </Text>
              <Text style={styles.activeFilterClear}>Clear</Text>
            </TouchableOpacity>
          ) : null}
          {sectionFilter ? (
            <TouchableOpacity style={styles.sectionFilterBar} onPress={clearSectionFilter} activeOpacity={0.85}>
              <Ionicons name="layers-outline" size={16} color={c.secondary} />
              <Text style={styles.activeFilterText} numberOfLines={1}>
                Section: {sectionFilter}
              </Text>
              <Text style={styles.sectionFilterClear}>Clear</Text>
            </TouchableOpacity>
          ) : null}
          {error ? <Text style={styles.errorText}>{error}</Text> : null}
        </View>

        {totalMatches > 0 ? (
          <View
            onLayout={(e) => {
              featuredYRef.current = e.nativeEvent.layout.y;
            }}
          >
            {showMarketing && !sectionFilter && !loading ? (
              <View style={styles.catalogIntro}>
                <View
                  style={[
                    styles.catalogIntroPill,
                    {
                      borderColor: isDark ? c.border : ALCHEMY.pillInactive,
                      backgroundColor: isDark ? c.surfaceMuted : ALCHEMY.creamAlt,
                    },
                  ]}
                >
                  <Ionicons name="diamond-outline" size={15} color={ALCHEMY.gold} />
                  <Text style={[styles.catalogIntroText, { color: c.textSecondary }]}>
                    {collectionTab === "starter" ? HOME_CATALOG_INTRO.starter : HOME_CATALOG_INTRO.all}
                  </Text>
                </View>
              </View>
            ) : null}
            {sectionFilter && sectionsForRender.length === 0 ? (
              <View style={[styles.catalogSurface, styles.emptySectionHint]}>
                <Text style={styles.emptySectionText}>No section named “{sectionFilter}”.</Text>
                <TouchableOpacity onPress={clearSectionFilter} activeOpacity={0.85}>
                  <Text style={styles.emptySectionClear}>Clear filter</Text>
                </TouchableOpacity>
              </View>
            ) : homeViewConfig.showHomeSections && sectionsForRender.length > 0 ? (
              sectionsForRender.map((section, sIdx) => (
                <Animated.View
                  key={section.title}
                  style={styles.listSection}
                  entering={
                    Platform.OS === "web" ? undefined : FadeInDown.delay(Math.min(sIdx * 72, 400)).duration(420)
                  }
                >
                  <View style={styles.catalogSurface}>
                    <LinearGradient
                      colors={[ALCHEMY.gold, "#D4AF37", ALCHEMY.brown]}
                      start={{ x: 0, y: 0.5 }}
                      end={{ x: 1, y: 0.5 }}
                      style={styles.catalogTopAccent}
                    />
                    <SectionHeading
                      title={section.title}
                      count={section.items.length}
                      styles={styles}
                      c={c}
                      isDark={isDark}
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
                    {section.items.map((item, idx) => (
                      <React.Fragment key={item.id ?? `sec-${section.title}-${idx}`}>
                        {renderProductListCard(item, idx, section.items.length)}
                      </React.Fragment>
                    ))}
                  </View>
                </Animated.View>
              ))
            ) : (
              <Animated.View
                style={styles.listSection}
                entering={Platform.OS === "web" ? undefined : FadeInDown.delay(80).duration(440)}
              >
                <View style={styles.catalogSurface}>
                  <LinearGradient
                    colors={[ALCHEMY.gold, "#D4AF37", ALCHEMY.brown]}
                    start={{ x: 0, y: 0.5 }}
                    end={{ x: 1, y: 0.5 }}
                    style={styles.catalogTopAccent}
                  />
                  <SectionHeading
                    title={homeViewConfig.showPrimeSection ? homeViewConfig.primeSectionTitle : "Shop"}
                    count={productsForHome.length}
                    styles={styles}
                    c={c}
                    isDark={isDark}
                  />
                  {productsForHome.map((item, idx) => (
                    <React.Fragment key={item.id ?? `shop-${idx}`}>
                      {renderProductListCard(item, idx, productsForHome.length)}
                    </React.Fragment>
                  ))}
                </View>
              </Animated.View>
            )}
          </View>
        ) : (
          <View style={[styles.catalogSurface, styles.emptyWrap]}>
            {loading ? (
              <ActivityIndicator size="large" color={c.primary} style={styles.emptyLoader} />
            ) : (
              <View style={styles.emptyIconCircle}>
                <Ionicons name="cube-outline" size={34} color={c.primaryDark} />
              </View>
            )}
            <Text style={styles.emptyText}>
              {loading
                ? "Loading catalog…"
                : filteredProducts.length > 0 && productsForHome.length === 0
                  ? "No items are set to show on Home. Ask admin to enable “Show on Home” for products."
                  : query.trim()
                    ? "No products match your search."
                    : "No products in this catalog yet. Add items or adjust filters."}
            </Text>
          </View>
        )}

        <HomePageFooter colors={c} shadowLift={shadowLift} />
        </ScrollView>
        <BottomNavBar />
      </LinearGradient>

      <Modal
        visible={menuOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setMenuOpen(false)}
        {...(Platform.OS === "ios" ? { presentationStyle: "overFullScreen" } : {})}
      >
        <View style={styles.menuModalRoot}>
          <Pressable
            style={styles.menuBackdrop}
            onPress={() => setMenuOpen(false)}
            accessibilityLabel="Close menu"
          />
          <View style={styles.menuLayer} pointerEvents="box-none">
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
                  <Ionicons name="close" size={22} color={c.textSecondary} />
                </Pressable>
              </View>
              <Text style={[styles.menuSectionLabel, { color: c.textMuted }]}>Shop</Text>
              <Pressable
                style={({ pressed }) => [
                  styles.menuRow,
                  ...(collectionTab === "all"
                    ? [
                        styles.menuRowSelected,
                        { backgroundColor: isDark ? "rgba(201, 162, 39, 0.12)" : ALCHEMY.creamDeep },
                        { borderColor: isDark ? c.primaryBorder : ALCHEMY.pillInactive },
                      ]
                    : []),
                  pressed && styles.menuRowPressed,
                ]}
                onPress={() => {
                  setCollectionTab("all");
                  setMenuOpen(false);
                  requestAnimationFrame(() => scrollToFeatured());
                }}
              >
                <View style={[styles.menuIconCircle, { backgroundColor: isDark ? c.surfaceMuted : ALCHEMY.creamAlt }]}>
                  <Ionicons name="flame-outline" size={20} color={isDark ? c.textPrimary : ALCHEMY.brown} />
                </View>
                <View style={styles.menuRowTextCol}>
                  <Text style={[styles.menuRowTitle, { color: c.textPrimary }]}>All Ghee</Text>
                  <Text style={[styles.menuRowValue, { color: c.textSecondary }]}>
                    {homeCatalogCount} {homeCatalogCount === 1 ? "product" : "products"} · Full catalog
                  </Text>
                </View>
                {collectionTab === "all" ? (
                  <View style={[styles.menuPillActive, { backgroundColor: c.secondarySoft, borderColor: c.secondaryBorder }]}>
                    <Text style={[styles.menuPillActiveText, { color: c.secondaryDark }]}>Active</Text>
                  </View>
                ) : (
                  <View style={styles.menuCheckPlaceholder} />
                )}
              </Pressable>
              <Pressable
                style={({ pressed }) => [
                  styles.menuRow,
                  ...(collectionTab === "starter"
                    ? [
                        styles.menuRowSelected,
                        { backgroundColor: isDark ? "rgba(201, 162, 39, 0.12)" : ALCHEMY.creamDeep },
                        { borderColor: isDark ? c.primaryBorder : ALCHEMY.pillInactive },
                      ]
                    : []),
                  pressed && styles.menuRowPressed,
                ]}
                onPress={() => {
                  setCollectionTab("starter");
                  setMenuOpen(false);
                  requestAnimationFrame(() => scrollToFeatured());
                }}
              >
                <View style={[styles.menuIconCircle, { backgroundColor: isDark ? c.surfaceMuted : ALCHEMY.creamAlt }]}>
                  <Ionicons name="water-outline" size={20} color={isDark ? c.textPrimary : ALCHEMY.brown} />
                </View>
                <View style={styles.menuRowTextCol}>
                  <Text style={[styles.menuRowTitle, { color: c.textPrimary }]}>My First Drop</Text>
                  <Text style={[styles.menuRowValue, { color: c.textSecondary }]}>
                    Shows {starterShownCount} of {homeCatalogCount} · {HOME_MENU_STARTER_TAG}
                  </Text>
                </View>
                {collectionTab === "starter" ? (
                  <View style={[styles.menuPillActive, { backgroundColor: c.secondarySoft, borderColor: c.secondaryBorder }]}>
                    <Text style={[styles.menuPillActiveText, { color: c.secondaryDark }]}>Active</Text>
                  </View>
                ) : (
                  <View style={styles.menuCheckPlaceholder} />
                )}
              </Pressable>
              <View style={[styles.menuDivider, { backgroundColor: c.border }]} />
              <Text style={[styles.menuSectionLabel, { color: c.textMuted }]}>Account</Text>
              <Pressable
                style={({ pressed }) => [styles.menuRow, pressed && styles.menuRowPressed]}
                onPress={() => {
                  setMenuOpen(false);
                  navigation.navigate("Profile");
                }}
              >
                <View style={[styles.menuIconCircle, { backgroundColor: isDark ? c.surfaceMuted : ALCHEMY.creamAlt }]}>
                  <Ionicons name="person-outline" size={20} color={isDark ? c.textPrimary : ALCHEMY.brown} />
                </View>
                <View style={styles.menuRowTextCol}>
                  <Text style={[styles.menuRowTitle, { color: c.textPrimary }]}>Profile</Text>
                  <Text style={[styles.menuRowValue, { color: c.textSecondary }]}>Account & preferences</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={c.textMuted} />
              </Pressable>
              <Pressable
                style={({ pressed }) => [styles.menuRow, pressed && styles.menuRowPressed]}
                onPress={() => {
                  setMenuOpen(false);
                  navigation.navigate("MyOrders");
                }}
              >
                <View style={[styles.menuIconCircle, { backgroundColor: isDark ? c.surfaceMuted : ALCHEMY.creamAlt }]}>
                  <Ionicons name="receipt-outline" size={20} color={isDark ? c.textPrimary : ALCHEMY.brown} />
                </View>
                <View style={styles.menuRowTextCol}>
                  <Text style={[styles.menuRowTitle, { color: c.textPrimary }]}>My orders</Text>
                  <Text style={[styles.menuRowValue, { color: c.textSecondary }]}>Track deliveries</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={c.textMuted} />
              </Pressable>
              <Pressable
                style={({ pressed }) => [styles.menuRow, pressed && styles.menuRowPressed]}
                onPress={() => {
                  setMenuOpen(false);
                  navigation.navigate("Support");
                }}
              >
                <View style={[styles.menuIconCircle, { backgroundColor: isDark ? c.surfaceMuted : ALCHEMY.creamAlt }]}>
                  <Ionicons name="help-circle-outline" size={20} color={isDark ? c.textPrimary : ALCHEMY.brown} />
                </View>
                <View style={styles.menuRowTextCol}>
                  <Text style={[styles.menuRowTitle, { color: c.textPrimary }]}>Support</Text>
                  <Text style={[styles.menuRowValue, { color: c.textSecondary }]}>Help & contact</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={c.textMuted} />
              </Pressable>
              <Pressable
                style={({ pressed }) => [styles.menuRow, pressed && styles.menuRowPressed]}
                onPress={() => {
                  setMenuOpen(false);
                  navigation.navigate("Settings");
                }}
              >
                <View style={[styles.menuIconCircle, { backgroundColor: isDark ? c.surfaceMuted : ALCHEMY.creamAlt }]}>
                  <Ionicons name="settings-outline" size={20} color={isDark ? c.textPrimary : ALCHEMY.brown} />
                </View>
                <View style={styles.menuRowTextCol}>
                  <Text style={[styles.menuRowTitle, { color: c.textPrimary }]}>Settings</Text>
                  <Text style={[styles.menuRowValue, { color: c.textSecondary }]}>App & notifications</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={c.textMuted} />
              </Pressable>
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
      alignSelf: "center",
      maxWidth: Platform.select({ web: layout.maxContentWidth, default: "100%" }),
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
      paddingBottom: spacing.sm,
    },
    headerAmbientCard: {
      position: "relative",
      borderRadius: radius.xxl,
      overflow: "hidden",
      borderWidth: StyleSheet.hairlineWidth,
      borderTopWidth: 2,
      borderTopColor: isDark ? "rgba(201, 162, 39, 0.5)" : ALCHEMY.gold,
      marginBottom: spacing.lg,
      ...Platform.select({
        ios: {
          shadowColor: "#3D2A12",
          shadowOffset: { width: 0, height: 10 },
          shadowOpacity: isDark ? 0.22 : 0.09,
          shadowRadius: 20,
        },
        android: { elevation: isDark ? 5 : 4 },
        web: {
          boxShadow: isDark
            ? "0 12px 36px rgba(0,0,0,0.28), inset 0 1px 0 rgba(255,255,255,0.04)"
            : "0 14px 40px rgba(61, 42, 18, 0.1), 0 4px 12px rgba(28, 25, 23, 0.04), inset 0 1px 0 rgba(255, 253, 251, 0.9)",
        },
        default: {},
      }),
    },
    headerAmbientCardLight: {
      borderColor: "rgba(116, 79, 28, 0.12)",
      backgroundColor: "rgba(255, 252, 248, 0.9)",
    },
    headerAmbientCardDark: {
      borderColor: "rgba(201, 162, 39, 0.2)",
      backgroundColor: "rgba(28, 25, 23, 0.58)",
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
      paddingTop: 6,
      paddingBottom: 2,
      paddingHorizontal: spacing.xs,
    },
    headerInnerDivider: {
      height: StyleSheet.hairlineWidth,
      marginHorizontal: spacing.lg,
      marginTop: spacing.xs,
      marginBottom: spacing.sm,
      backgroundColor: "rgba(116, 79, 28, 0.12)",
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
      color: "#FFFCF8",
      fontSize: 10,
      fontFamily: fonts.extrabold,
      lineHeight: 12,
    },
    alchemyTopBar: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: spacing.xs,
      minHeight: BRAND_LOGO_SIZE.homeTopBar + HOME_TOPBAR_TAGLINE_ROOM,
    },
    wordmarkBlock: {
      flex: 1,
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      alignSelf: "stretch",
      paddingHorizontal: spacing.xs,
      minWidth: 0,
      minHeight: BRAND_LOGO_SIZE.homeTopBar + HOME_TOPBAR_TAGLINE_ROOM,
      overflow: "visible",
    },
    topBarLogo: {
      flexShrink: 0,
      alignSelf: "center",
      ...Platform.select({
        ios: {
          shadowColor: "#3D2A12",
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.1,
          shadowRadius: 3,
        },
        web: {
          boxShadow: "0 2px 8px rgba(61, 42, 18, 0.08)",
        },
        default: {},
      }),
    },
    wordmarkTagline: {
      marginTop: 1,
      fontSize: 11,
      lineHeight: 14,
      fontFamily: fonts.semibold,
      textAlign: "center",
      letterSpacing: 0.3,
      color: c.textMuted,
      maxWidth: 280,
    },
    alchemyIconBtn: {
      width: 44,
      minHeight: BRAND_LOGO_SIZE.homeTopBar + HOME_TOPBAR_TAGLINE_ROOM,
      alignItems: "center",
      justifyContent: "center",
      alignSelf: "center",
      borderRadius: radius.md,
      ...Platform.select({
        web: { cursor: "pointer" },
        default: {},
      }),
    },
    searchWrap: {
      marginTop: 0,
      marginBottom: spacing.sm,
      paddingHorizontal: spacing.sm,
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
            : "0 14px 44px rgba(61, 42, 18, 0.11), 0 4px 14px rgba(116, 79, 28, 0.06)",
        },
        default: {},
      }),
    },
    searchInner: {
      borderRadius: 999,
      overflow: "hidden",
    },
    heroImageOuter: {
      marginBottom: spacing.xl,
      borderRadius: radius.xxl,
      overflow: "hidden",
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: isDark ? "rgba(255,255,255,0.1)" : "rgba(116, 79, 28, 0.14)",
      ...Platform.select({
        ios: {
          shadowColor: "#1a1208",
          shadowOffset: { width: 0, height: 14 },
          shadowOpacity: isDark ? 0.4 : 0.2,
          shadowRadius: 24,
        },
        android: { elevation: isDark ? 8 : 5 },
        web: {
          boxShadow: isDark
            ? "0 24px 64px rgba(0,0,0,0.45), 0 8px 24px rgba(0,0,0,0.25)"
            : "0 24px 56px rgba(61, 42, 18, 0.14), 0 8px 20px rgba(28, 25, 23, 0.06)",
        },
        default: {},
      }),
    },
    heroPremiumFill: {
      position: "relative",
      width: "100%",
      minHeight: Platform.OS === "web" ? 340 : 300,
      justifyContent: "flex-end",
    },
    heroBottomFade: {
      ...StyleSheet.absoluteFillObject,
    },
    heroOrbs: {
      ...StyleSheet.absoluteFillObject,
    },
    heroOrb1: {
      position: "absolute",
      width: 200,
      height: 200,
      borderRadius: 100,
      right: -48,
      top: -64,
      backgroundColor: "rgba(212, 175, 55, 0.12)",
    },
    heroOrb2: {
      position: "absolute",
      width: 120,
      height: 120,
      borderRadius: 60,
      left: -36,
      top: "22%",
      backgroundColor: "rgba(255, 252, 248, 0.06)",
    },
    heroOrb3: {
      position: "absolute",
      width: 90,
      height: 90,
      borderRadius: 45,
      right: "8%",
      bottom: "12%",
      backgroundColor: "rgba(201, 162, 39, 0.1)",
    },
    heroBrandLogo: {
      alignSelf: "flex-start",
      marginBottom: spacing.sm,
    },
    heroImageInner: {
      paddingTop: spacing.lg,
      paddingHorizontal: spacing.xl,
      paddingBottom: 44,
    },
    heroGoldHairline: {
      position: "absolute",
      bottom: 0,
      left: 0,
      right: 0,
      height: 3,
      opacity: 0.95,
    },
    heroKicker: {
      marginTop: 4,
      fontFamily: FONT_DISPLAY_SEMI,
      fontSize: 12,
      letterSpacing: 1.35,
      textTransform: "uppercase",
      color: "rgba(255,252,248,0.82)",
      marginBottom: spacing.xs,
    },
    heroBadge: {
      alignSelf: "flex-start",
      backgroundColor: ALCHEMY.brown,
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 12,
      marginBottom: spacing.sm,
      borderWidth: 1,
      borderColor: "rgba(255,252,248,0.28)",
    },
    heroBadgeText: {
      color: "#FFFCF8",
      fontSize: 10,
      fontFamily: fonts.extrabold,
      letterSpacing: 0.8,
    },
    heroDisplayTitle: {
      fontFamily: FONT_DISPLAY,
      fontSize: Platform.OS === "web" ? 38 : 32,
      lineHeight: Platform.OS === "web" ? 44 : 38,
      letterSpacing: -0.55,
      marginBottom: spacing.sm,
      maxWidth: 580,
    },
    heroDisplaySub: {
      marginTop: spacing.xs,
      fontSize: typography.body,
      fontFamily: fonts.medium,
      lineHeight: 24,
      maxWidth: 520,
      opacity: 0.92,
    },
    heroCtaWrap: {
      marginTop: spacing.xl,
      alignSelf: "flex-start",
      borderRadius: radius.lg,
      overflow: "hidden",
      borderWidth: 1,
      borderColor: "rgba(255, 252, 248, 0.22)",
      ...Platform.select({
        ios: {
          shadowColor: "#1a1208",
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: 0.4,
          shadowRadius: 14,
        },
        android: { elevation: 6 },
        web: { boxShadow: "0 14px 36px rgba(26, 18, 8, 0.38)" },
        default: {},
      }),
    },
    heroCtaGradient: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      paddingVertical: 15,
      paddingHorizontal: spacing.xxl,
      borderRadius: radius.lg,
    },
    heroBrownCtaText: {
      color: "#FFFCF8",
      fontFamily: fonts.bold,
      fontSize: typography.body,
      letterSpacing: 0.35,
    },
    trustStrip: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      flexWrap: "wrap",
      gap: spacing.md,
      rowGap: spacing.sm,
      marginBottom: spacing.lg,
      paddingVertical: spacing.lg,
      paddingHorizontal: spacing.lg,
      borderRadius: radius.xxl,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: "rgba(201, 162, 39, 0.2)",
      borderTopWidth: 2,
      borderTopColor: ALCHEMY.gold,
      backgroundColor: "rgba(255, 252, 248, 0.96)",
      ...shadowLift,
    },
    trustStripDark: {
      backgroundColor: "rgba(28, 25, 23, 0.62)",
      borderColor: "rgba(201, 162, 39, 0.2)",
      borderTopColor: "rgba(201, 162, 39, 0.55)",
    },
    trustPill: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      paddingVertical: 10,
      paddingHorizontal: 14,
      borderRadius: radius.lg,
      borderWidth: StyleSheet.hairlineWidth,
    },
    trustIconCircle: {
      width: 34,
      height: 34,
      borderRadius: 17,
      alignItems: "center",
      justifyContent: "center",
    },
    trustIconCircleLight: {
      backgroundColor: "rgba(201, 162, 39, 0.14)",
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: "rgba(201, 162, 39, 0.22)",
    },
    trustIconCircleDark: {
      backgroundColor: "rgba(201, 162, 39, 0.1)",
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: "rgba(201, 162, 39, 0.22)",
    },
    trustText: {
      fontSize: 12,
      fontFamily: fonts.semibold,
      letterSpacing: 0.25,
      maxWidth: Platform.OS === "web" ? 200 : 160,
    },
    collectionChipsBlock: {
      marginBottom: spacing.xl,
    },
    collectionChipsHeaderRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.sm,
      marginBottom: spacing.md,
    },
    collectionChipsDecorLine: {
      flex: 1,
      height: StyleSheet.hairlineWidth,
      minHeight: 1,
      maxHeight: 1,
      backgroundColor: ALCHEMY.pillInactive,
    },
    collectionChipsDecorLineDark: {
      backgroundColor: "rgba(255, 255, 255, 0.12)",
    },
    collectionChipsLabel: {
      fontSize: typography.overline,
      fontFamily: fonts.extrabold,
      letterSpacing: 1.45,
      textTransform: "uppercase",
      flexShrink: 0,
    },
    collectionChipsRow: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: spacing.sm,
    },
    collectionChip: {
      flexDirection: "row",
      alignItems: "center",
      flexGrow: 1,
      minWidth: Platform.select({ web: 200, default: 148 }),
      flex: 1,
      gap: spacing.sm,
      paddingVertical: 16,
      paddingHorizontal: spacing.md,
      borderRadius: radius.xxl,
      borderWidth: 1.5,
      ...Platform.select({
        ios: {
          shadowColor: "#3D2A12",
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.06,
          shadowRadius: 6,
        },
        android: { elevation: 1 },
        web: { cursor: "pointer", transition: "border-color 0.15s ease, background 0.15s ease" },
        default: {},
      }),
    },
    collectionChipTextCol: {
      flex: 1,
      minWidth: 0,
    },
    collectionChipTitle: {
      fontSize: typography.bodySmall,
      fontFamily: fonts.extrabold,
      letterSpacing: 0.1,
    },
    collectionChipSub: {
      marginTop: 3,
      fontSize: typography.caption,
      fontFamily: fonts.medium,
      lineHeight: 16,
    },
    collectionChipIdle: {
      borderColor: ALCHEMY.pillInactive,
      backgroundColor: ALCHEMY.creamAlt,
    },
    collectionChipIdleDark: {
      borderColor: "rgba(255,255,255,0.08)",
      backgroundColor: "rgba(20, 18, 16, 0.55)",
    },
    collectionChipActive: {
      borderColor: ALCHEMY.gold,
      backgroundColor: ALCHEMY.goldSoft,
      ...Platform.select({
        ios: {
          shadowColor: ALCHEMY.brown,
          shadowOffset: { width: 0, height: 3 },
          shadowOpacity: 0.12,
          shadowRadius: 8,
        },
        android: { elevation: 2 },
        default: {},
      }),
    },
    collectionChipActiveDark: {
      backgroundColor: "rgba(201, 162, 39, 0.16)",
      borderColor: "rgba(201, 162, 39, 0.5)",
    },
    productListRow: {
      marginBottom: spacing.sm,
    },
    productListRowDivider: {
      paddingBottom: spacing.lg,
      marginBottom: spacing.lg,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: isDark ? "rgba(255,255,255,0.08)" : "rgba(116, 79, 28, 0.1)",
    },
    productListRowLast: {
      paddingBottom: 0,
      marginBottom: 0,
    },
    heroCardCompact: {
      borderRadius: radius.xxl,
      paddingHorizontal: spacing.xl,
      paddingVertical: spacing.xl,
      marginBottom: spacing.xl,
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
      fontFamily: fonts.extrabold,
    },
    heroSubtext: {
      marginTop: 6,
      color: c.textSecondary,
      fontSize: typography.bodySmall,
      fontFamily: fonts.regular,
    },
    activeFilterBar: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.sm,
      marginBottom: spacing.md,
      paddingVertical: 14,
      paddingHorizontal: spacing.lg,
      backgroundColor: c.primarySoft,
      borderRadius: radius.xxl,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: c.primaryBorder,
      borderTopWidth: 3,
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
      marginBottom: spacing.md,
      paddingVertical: 14,
      paddingHorizontal: spacing.lg,
      backgroundColor: c.secondarySoft,
      borderRadius: radius.xxl,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: c.secondaryBorder,
      borderTopWidth: 3,
      borderTopColor: c.secondary,
      ...shadowLift,
    },
    sectionFilterClear: {
      color: c.secondary,
      fontSize: typography.caption,
      fontFamily: fonts.extrabold,
    },
    catalogIntro: {
      alignItems: "center",
      marginBottom: spacing.xl,
      marginTop: spacing.sm,
      paddingHorizontal: spacing.xs,
    },
    catalogIntroPill: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      flexWrap: "wrap",
      gap: 10,
      paddingVertical: 14,
      paddingHorizontal: spacing.xl,
      maxWidth: "100%",
      borderRadius: radius.pill,
      borderWidth: StyleSheet.hairlineWidth,
      ...Platform.select({
        ios: {
          shadowColor: "#3D2A12",
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: isDark ? 0.15 : 0.05,
          shadowRadius: 8,
        },
        default: {},
      }),
    },
    catalogIntroText: {
      flexShrink: 1,
      fontSize: typography.bodySmall,
      fontFamily: FONT_DISPLAY_SEMI,
      letterSpacing: 0.35,
      textAlign: "center",
    },
    listSection: {
      marginBottom: spacing.xxl,
    },
    catalogSurface: {
      overflow: "hidden",
      backgroundColor: isDark ? c.surface : ALCHEMY.cardBg,
      borderRadius: 28,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: isDark ? c.border : "rgba(116, 79, 28, 0.12)",
      borderTopWidth: 3,
      borderTopColor: isDark ? c.primaryBorder : ALCHEMY.gold,
      paddingHorizontal: spacing.lg,
      paddingTop: 22,
      paddingBottom: spacing.xl,
      ...Platform.select({
        ios: {
          shadowColor: "#3D2A12",
          shadowOffset: { width: 0, height: 10 },
          shadowOpacity: isDark ? 0.26 : 0.1,
          shadowRadius: 22,
        },
        android: { elevation: isDark ? 5 : 4 },
        web: {
          boxShadow: isDark
            ? "0 16px 48px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.04)"
            : "0 18px 48px rgba(61, 42, 18, 0.09), 0 4px 14px rgba(28, 25, 23, 0.04), inset 0 1px 0 rgba(255, 253, 251, 0.85)",
        },
        default: {},
      }),
    },
    catalogTopAccent: {
      alignSelf: "center",
      width: "100%",
      maxWidth: 280,
      height: 3,
      borderRadius: 2,
      marginBottom: spacing.lg,
      opacity: 0.9,
    },
    sectionHeaderRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: spacing.md,
      marginBottom: spacing.md,
      paddingBottom: spacing.lg,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: isDark ? "rgba(255,255,255,0.12)" : "rgba(116, 79, 28, 0.1)",
    },
    sectionHeaderBlock: {
      flex: 1,
      minWidth: 0,
    },
    sectionTitleRow: {
      flexDirection: "row",
      alignItems: "flex-start",
      gap: 0,
    },
    sectionTitleStack: {
      flex: 1,
      minWidth: 0,
    },
    sectionAccentBar: {
      width: 3,
      borderRadius: 2,
      marginRight: spacing.sm,
      marginTop: 3,
    },
    sectionAccentBarLight: {
      minHeight: 40,
      backgroundColor: ALCHEMY.gold,
    },
    sectionAccentBarDark: {
      minHeight: 40,
      backgroundColor: "rgba(201, 162, 39, 0.55)",
    },
    sectionHeading: {
      fontSize: Platform.OS === "web" ? 26 : 24,
      lineHeight: Platform.OS === "web" ? 30 : 28,
      fontFamily: FONT_DISPLAY,
      color: c.textPrimary,
      letterSpacing: -0.5,
    },
    sectionSub: {
      marginTop: 5,
      fontSize: typography.caption,
      fontFamily: fonts.semibold,
      color: c.textSecondary,
      letterSpacing: 0.2,
    },
    sectionSeeAllBtn: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      paddingVertical: 11,
      paddingHorizontal: 18,
      borderRadius: radius.lg,
      borderWidth: StyleSheet.hairlineWidth,
      ...Platform.select({
        ios: {
          shadowColor: "#3D2A12",
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.06,
          shadowRadius: 6,
        },
        android: { elevation: 2 },
        web: { boxShadow: "0 4px 14px rgba(61, 42, 18, 0.08)" },
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
    gridCell: {
      marginBottom: 0,
    },
    emptyWrap: {
      paddingVertical: spacing.xxl,
      alignItems: "center",
      paddingHorizontal: spacing.md,
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
      fontSize: typography.body,
      lineHeight: 22,
      fontFamily: fonts.medium,
    },
    errorText: {
      color: c.danger,
      fontSize: typography.bodySmall,
      fontFamily: fonts.semibold,
      marginBottom: spacing.sm,
    },
    emptySectionHint: {
      alignItems: "flex-start",
      gap: spacing.sm,
      marginBottom: spacing.md,
    },
    emptySectionText: {
      fontSize: typography.bodySmall,
      fontFamily: fonts.medium,
      color: c.textSecondary,
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
      borderRadius: radius.xxl,
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
          zIndex: 1000,
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
      paddingHorizontal: spacing.md,
      paddingTop: spacing.sm,
      paddingBottom: spacing.xs,
    },
    menuHeaderTitle: {
      fontFamily: FONT_DISPLAY,
      fontSize: typography.h3,
      letterSpacing: -0.2,
    },
    menuCloseBtn: {
      padding: 4,
      borderRadius: radius.sm,
    },
    menuSectionLabel: {
      fontSize: 10,
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
      paddingVertical: 11,
      paddingHorizontal: spacing.sm,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: "transparent",
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
      lineHeight: 16,
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
    menuDivider: {
      height: StyleSheet.hairlineWidth,
      marginVertical: spacing.sm,
      marginHorizontal: spacing.md,
    },
    menuCheckPlaceholder: {
      width: 56,
      height: 24,
    },
  });
}
