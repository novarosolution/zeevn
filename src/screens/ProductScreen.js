import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import AppFooter from "../components/AppFooter";
import CustomerScreenShell from "../components/CustomerScreenShell";
import BottomNavBar from "../components/BottomNavBar";
import { getProductById } from "../services/productService";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { customerPageScrollBase, customerPanel, customerScrollFill } from "../theme/screenLayout";
import { fonts, radius, spacing, typography } from "../theme/tokens";
import { formatINR } from "../utils/currency";
import { getImageUriCandidates } from "../utils/image";
import { matchesShelfProduct } from "../utils/shelfMatch";
import { productToCartLine } from "../utils/productCart";
import { ALCHEMY, FONT_DISPLAY } from "../theme/customerAlchemy";

export default function ProductScreen({ route, navigation }) {
  const { productId } = route.params ?? {};
  const { colors: c, shadowPremium, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => createProductStyles(c, shadowPremium, isDark), [c, shadowPremium, isDark]);
  const { addToCart, removeFromCart, getItemQuantity } = useCart();
  const { isAuthenticated } = useAuth();
  const { width } = useWindowDimensions();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedImage, setSelectedImage] = useState("");
  const [imageCandidateIndex, setImageCandidateIndex] = useState(0);
  const [selectedVariantLabel, setSelectedVariantLabel] = useState("");
  const [showStickyCta, setShowStickyCta] = useState(false);

  useEffect(() => {
    async function loadProduct() {
      try {
        setLoading(true);
        setError("");
        const item = await getProductById(productId);
        setProduct(item);
        setSelectedImage(item?.image || "");
        const vars = Array.isArray(item?.variants) ? item.variants : [];
        setSelectedVariantLabel(vars[0]?.label ? String(vars[0].label) : "");
      } catch (err) {
        setError(err.message || "Unable to load product.");
      } finally {
        setLoading(false);
      }
    }
    loadProduct();
  }, [productId]);

  const productImages = useMemo(() => product?.images || [], [product]);
  const selectedImageUris = useMemo(
    () => getImageUriCandidates(selectedImage || product?.image),
    [selectedImage, product?.image]
  );
  const selectedImageUri = selectedImageUris[imageCandidateIndex] || "";
  const imageFailed = selectedImageUris.length === 0 || imageCandidateIndex >= selectedImageUris.length;

  useEffect(() => {
    setImageCandidateIndex(0);
  }, [selectedImage, product?.image]);

  const shelfMatch = useMemo(
    () => (product ? matchesShelfProduct(product) : false),
    [product]
  );

  const cartLine = useMemo(
    () => (product ? productToCartLine(product, selectedVariantLabel) : null),
    [product, selectedVariantLabel]
  );


  if (loading) {
    return (
      <CustomerScreenShell style={styles.screen}>
        <View style={styles.centered}>
          <Ionicons name="hourglass-outline" size={40} color={c.primaryBorder} />
          <ActivityIndicator size="large" color={c.primary} style={{ marginTop: spacing.md }} />
          <Text style={styles.loadingHint}>Loading product…</Text>
        </View>
      </CustomerScreenShell>
    );
  }

  if (!product) {
    return (
      <CustomerScreenShell style={styles.screen}>
        <View style={styles.centered}>
          <Ionicons name="alert-circle-outline" size={44} color={c.textMuted} />
          <Text style={styles.missingText}>{error || "Product not found."}</Text>
        </View>
      </CustomerScreenShell>
    );
  }

  const handleAddToCart = () => {
    if (product.inStock === false || Number(product.stockQty || 0) <= 0) {
      return;
    }
    if (!isAuthenticated) {
      navigation.navigate("Login");
      return;
    }
    if (!cartLine) return;
    addToCart(cartLine);
  };

  const handleRemoveFromCart = () => {
    if (!isAuthenticated) {
      navigation.navigate("Login");
      return;
    }
    removeFromCart(product.id, cartLine?.variantLabel ?? "");
  };

  const quantity = getItemQuantity(product.id, cartLine?.variantLabel ?? "");
  const heroImageHeight = Math.min(320, Math.max(220, width * 0.65));
  const isOutOfStock = product.inStock === false || Number(product.stockQty || 0) <= 0;
  const stockCount = Math.max(0, Number(product.stockQty) || 0);
  const displayPrice = cartLine ? cartLine.price : product.price;
  const variants = Array.isArray(product.variants) ? product.variants : [];
  const ratingAvg = Number(product.ratingAverage) || 0;
  const reviewCt = Number(product.reviewCount) || 0;
  const showReviews = ratingAvg > 0 && reviewCt > 0;
  const mrp = product.mrp != null ? Number(product.mrp) : null;
  const showMrp = mrp != null && mrp > displayPrice;

  return (
    <CustomerScreenShell style={styles.screen}>
      <ScrollView
        style={customerScrollFill}
        contentContainerStyle={[
          customerPageScrollBase,
          {
            paddingTop: Math.max(insets.top, Platform.OS === "web" ? spacing.md : spacing.xs),
            paddingBottom: Platform.OS === "web" ? spacing.xl : 120,
          },
        ]}
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={16}
        onScroll={(e) => {
          const y = e.nativeEvent.contentOffset.y;
          setShowStickyCta(y > 240);
        }}
      >
        <View style={[styles.container, shelfMatch ? styles.containerShelfMatch : null]}>
        <View style={styles.heroWrap}>
          <TouchableOpacity
            style={[styles.backFab, { top: Math.max(insets.top, spacing.sm) }]}
            onPress={() => navigation.goBack()}
            accessibilityRole="button"
            accessibilityLabel="Back"
          >
            <Ionicons name="chevron-back" size={22} color={isDark ? c.textPrimary : ALCHEMY.brown} />
          </TouchableOpacity>
          {selectedImageUri && !imageFailed ? (
            <Image
              source={{ uri: selectedImageUri }}
              style={[styles.image, { height: heroImageHeight }]}
              contentFit="cover"
              transition={200}
              onError={() => setImageCandidateIndex((index) => index + 1)}
            />
          ) : (
            <View style={[styles.imageFallback, { height: heroImageHeight }]}>
              <Ionicons name="image-outline" size={28} color={c.textMuted} />
              <Text style={styles.imageFallbackText}>Image not available</Text>
            </View>
          )}
          <View style={styles.heroTopRow}>
            {product.category ? (
              <View style={styles.heroChip}>
                <Ionicons name="pricetag-outline" size={13} color={c.primary} />
                <Text style={styles.heroChipText} numberOfLines={1}>
                  {product.category}
                </Text>
              </View>
            ) : (
              <View />
            )}
            <View style={[styles.heroChip, isOutOfStock ? styles.stockChipDanger : styles.stockChipSuccess]}>
              <Ionicons
                name={isOutOfStock ? "close-circle-outline" : "checkmark-circle-outline"}
                size={13}
                color={isOutOfStock ? c.danger : c.success}
              />
              <Text style={[styles.heroChipText, isOutOfStock ? styles.stockTextDanger : styles.stockTextSuccess]}>
                {isOutOfStock ? "Out of stock" : "In stock"}
              </Text>
            </View>
          </View>
          {product.badgeText ? (
            <View style={styles.heroBadge}>
              <Text style={styles.heroBadgeText} numberOfLines={2}>
                {String(product.badgeText).toUpperCase()}
              </Text>
            </View>
          ) : null}
        </View>
        {productImages.length > 1 ? (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.galleryRow}
          >
            {productImages.map((img) => (
              <TouchableOpacity
                key={img}
                style={[
                  styles.thumbWrap,
                  (selectedImage || product.image) === img ? styles.thumbWrapActive : null,
                ]}
                onPress={() => {
                  setSelectedImage(img);
                }}
              >
                <RetryImage sourceUri={img} style={styles.thumbImage} styles={styles} c={c} />
              </TouchableOpacity>
            ))}
          </ScrollView>
        ) : null}
        <View style={styles.content}>
          <Text style={styles.categoryText}>{product.category || "General"}</Text>
          <Text style={styles.name}>{product.name}</Text>

          {showReviews ? (
            <View style={styles.ratingRow}>
              {[0, 1, 2, 3, 4].map((i) => (
                <Ionicons
                  key={i}
                  name={i < Math.round(ratingAvg) ? "star" : "star-outline"}
                  size={16}
                  color={ALCHEMY.gold}
                />
              ))}
              <Text style={styles.ratingMeta}>
                {ratingAvg.toFixed(1)}/5 ({reviewCt.toLocaleString()} reviews)
              </Text>
            </View>
          ) : null}

          <View style={styles.priceRow}>
            <Text style={styles.price}>{formatINR(displayPrice)}</Text>
            {showMrp ? <Text style={styles.mrpStrike}>{formatINR(mrp)}</Text> : null}
            <Text style={styles.unitText}>/{product.unit || "1 pc"}</Text>
          </View>

          <View style={styles.descriptionCard}>
            <Text style={styles.sectionTitle}>About this product</Text>
            <Text style={styles.description}>
              {product.description || "Quality-checked products from KankreG."}
            </Text>
          </View>

          {variants.length > 0 ? (
            <View style={styles.variantBlock}>
              <Text style={styles.sizeSectionTitle}>Select size</Text>
              <View style={styles.variantPills}>
                {variants.map((v) => {
                  const lab = String(v.label || "").trim();
                  const active = lab === selectedVariantLabel;
                  return (
                    <TouchableOpacity
                      key={lab}
                      style={[styles.variantPill, active ? styles.variantPillActive : null]}
                      onPress={() => setSelectedVariantLabel(lab)}
                      activeOpacity={0.85}
                    >
                      <Text style={[styles.variantPillText, active ? styles.variantPillTextActive : null]}>{lab}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          ) : null}

          {quantity > 0 && !isOutOfStock ? (
            <View style={styles.stepper}>
              <TouchableOpacity style={styles.stepButton} activeOpacity={0.85} onPress={handleRemoveFromCart}>
                <Ionicons name="remove" size={20} color={c.onPrimary} />
              </TouchableOpacity>
              <Text style={styles.stepCount}>{quantity} in cart</Text>
              <TouchableOpacity style={styles.stepButton} activeOpacity={0.85} onPress={handleAddToCart}>
                <Ionicons name="add" size={20} color={c.onPrimary} />
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              style={[styles.button, isOutOfStock ? styles.buttonDisabled : null]}
              activeOpacity={0.85}
              onPress={handleAddToCart}
              disabled={isOutOfStock}
            >
              <LinearGradient
                colors={[ALCHEMY.gold, "#B8890F"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.buttonGradient}
              >
                <View style={styles.buttonContent}>
                  <Ionicons
                    name={isOutOfStock ? "close-circle-outline" : "bag-add-outline"}
                    size={16}
                    color="#fff"
                  />
                  <Text style={styles.buttonTextOnGradient}>
                    {isOutOfStock ? "Out of Stock" : "Add to Cart"}
                  </Text>
                </View>
              </LinearGradient>
            </TouchableOpacity>
          )}

          {product.usps && product.usps.length > 0 ? (
            <View style={styles.uspSection}>
              {product.usps.map((u, idx) => (
                <View key={`usp-${idx}`} style={styles.uspCard}>
                  <View style={styles.uspIconWrap}>
                    <Ionicons name={u.icon || "sparkles-outline"} size={22} color={ALCHEMY.brown} />
                  </View>
                  <View style={styles.uspTextCol}>
                    <Text style={styles.uspTitle}>{u.title}</Text>
                    <Text style={styles.uspDesc}>{u.description}</Text>
                  </View>
                </View>
              ))}
            </View>
          ) : null}

          {product.lifestyleImage ? (
            <View style={styles.lifestyleWrap}>
              <Image
                source={{
                  uri: getImageUriCandidates(product.lifestyleImage)[0] || String(product.lifestyleImage || ""),
                }}
                style={styles.lifestyleImage}
                contentFit="cover"
                transition={200}
              />
            </View>
          ) : null}

          {(product.processTitle || (product.processSteps && product.processSteps.length) || product.highlightQuote) ? (
            <View style={styles.processSection}>
              {product.processTitle ? (
                <Text style={styles.processHeading}>{product.processTitle}</Text>
              ) : null}
              {product.processSteps && product.processSteps.length > 0 ? (
                <View style={styles.processStepsCol}>
                  {product.processSteps.map((step, idx) => (
                    <View key={`step-${idx}`} style={styles.processStepRow}>
                      <Text style={styles.processStepNum}>{String(idx + 1).padStart(2, "0")}</Text>
                      <Text style={styles.processStepText}>{step}</Text>
                    </View>
                  ))}
                </View>
              ) : null}
              {product.highlightQuote ? (
                <View style={styles.quoteBox}>
                  <Text style={styles.quoteText}>{product.highlightQuote}</Text>
                </View>
              ) : null}
            </View>
          ) : null}

          {product.usageRituals && product.usageRituals.length > 0 ? (
            <View style={styles.usageSection}>
              <Text style={styles.usageHeading}>Sacred rituals & usage</Text>
              {product.usageRituals.map((r, idx) => (
                <View key={`usage-${idx}`} style={styles.usageCard}>
                  <Ionicons name={r.icon || "flame-outline"} size={20} color={ALCHEMY.gold} />
                  <View style={styles.usageTextCol}>
                    <Text style={styles.usageTitle}>{r.title}</Text>
                    <Text style={styles.usageDesc}>{r.description}</Text>
                  </View>
                </View>
              ))}
            </View>
          ) : null}

          <View style={styles.detailsCard}>
            <Text style={styles.detailsCardTitle}>Quick facts</Text>
            <DetailRow
              icon="layers-outline"
              label="Stock"
              value={isOutOfStock ? "Out of stock" : `${stockCount} available`}
              danger={isOutOfStock}
              styles={styles}
              c={c}
            />
            <DetailRow icon="cube-outline" label="Unit" value={product.unit || "1 pc"} styles={styles} c={c} />
            {product.eta ? (
              <DetailRow icon="information-circle-outline" label="Note" value={String(product.eta)} styles={styles} c={c} />
            ) : null}
            {product.brand ? (
              <DetailRow icon="ribbon-outline" label="Brand" value={product.brand} styles={styles} c={c} />
            ) : null}
            {product.sku ? <DetailRow icon="barcode-outline" label="SKU" value={product.sku} styles={styles} c={c} /> : null}
          </View>

          <TouchableOpacity style={styles.secondaryButton} onPress={() => navigation.navigate("Cart")}>
            <View style={styles.secondaryButtonContent}>
              <Ionicons name="cart-outline" size={15} color={c.textPrimary} />
              <Text style={styles.secondaryButtonText}>Go to Cart</Text>
            </View>
          </TouchableOpacity>

          <View style={styles.trustStrip}>
            <Text style={styles.trustStripText}>Purity focused • Cash on delivery • Trusted checkout</Text>
          </View>
        </View>
        </View>
        <AppFooter />
      </ScrollView>
      {showStickyCta && Platform.OS !== "web" ? (
        <View
          style={[
            styles.stickyCta,
            {
              paddingBottom: Math.max(insets.bottom, spacing.sm),
              paddingHorizontal: spacing.lg,
            },
          ]}
        >
          <View style={[styles.stickyCtaInner, { borderColor: c.border, backgroundColor: c.surface }]}>
            <View>
              <Text style={[styles.stickyPriceLabel, { color: c.textSecondary }]}>Price</Text>
              <Text style={[styles.stickyPrice, { color: c.textPrimary }]}>{formatINR(displayPrice)}</Text>
            </View>
            <TouchableOpacity
              activeOpacity={0.88}
              onPress={handleAddToCart}
              disabled={isOutOfStock}
              style={styles.stickyAddWrap}
            >
              <LinearGradient
                colors={isOutOfStock ? [c.textMuted, c.textMuted] : [ALCHEMY.gold, "#B8890F"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.stickyAddGradient}
              >
                <Text style={styles.stickyAddText}>{isOutOfStock ? "Out of stock" : "Add to cart"}</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      ) : null}
      <BottomNavBar />
    </CustomerScreenShell>
  );
}

function createProductStyles(c, shadowPremium, isDark) {
  return StyleSheet.create({
  screen: {
    flex: 1,
  },
  container: {
    ...customerPanel(c, shadowPremium),
    overflow: "hidden",
    padding: 0,
  },
  /** Accent top edge when product matches home shelf (e.g. Ghee). */
  containerShelfMatch: {
    borderTopColor: c.secondary,
  },
  image: {
    width: "100%",
    height: 320,
    backgroundColor: c.surfaceMuted,
  },
  imageFallback: {
    width: "100%",
    backgroundColor: c.surfaceMuted,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  imageFallbackText: {
    color: c.textSecondary,
    fontSize: typography.bodySmall,
    fontFamily: fonts.semibold,
  },
  heroWrap: {
    position: "relative",
  },
  backFab: {
    position: "absolute",
    left: spacing.sm,
    zIndex: 4,
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: isDark ? c.surfaceMuted : "rgba(255,255,255,0.94)",
    borderWidth: 1,
    borderColor: c.border,
    ...Platform.select({
      web: { boxShadow: "0 4px 12px rgba(0,0,0,0.08)" },
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.12,
        shadowRadius: 6,
      },
      android: { elevation: 3 },
    }),
  },
  heroTopRow: {
    position: "absolute",
    top: spacing.sm,
    left: 52,
    right: spacing.sm,
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
    gap: spacing.xs,
  },
  heroChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: radius.pill,
    backgroundColor: "rgba(255,255,255,0.85)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.95)",
  },
  heroChipText: {
    color: c.textPrimary,
    fontSize: typography.caption,
    fontFamily: fonts.bold,
  },
  stockChipSuccess: {
    backgroundColor: "rgba(236,253,245,0.92)",
    borderColor: "rgba(187,247,208,0.9)",
  },
  stockChipDanger: {
    backgroundColor: "rgba(254,242,242,0.92)",
    borderColor: "rgba(254,202,202,0.9)",
  },
  stockTextSuccess: {
    color: c.success,
  },
  stockTextDanger: {
    color: c.danger,
  },
  galleryRow: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: c.border,
    borderBottomWidth: 1,
    borderBottomColor: c.border,
  },
  thumbWrap: {
    width: 64,
    height: 64,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: c.border,
    overflow: "hidden",
  },
  thumbWrapActive: {
    borderColor: c.primary,
    borderWidth: 2,
  },
  thumbImage: {
    width: "100%",
    height: "100%",
  },
  thumbImageFallback: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: c.surfaceMuted,
  },
  content: {
    padding: spacing.lg,
  },
  name: {
    fontSize: typography.h1,
    fontFamily: FONT_DISPLAY,
    color: c.textPrimary,
    letterSpacing: -0.4,
  },
  categoryText: {
    fontSize: typography.caption,
    fontFamily: fonts.bold,
    color: c.primary,
    marginBottom: spacing.xs,
    textTransform: "uppercase",
  },
  priceRow: {
    marginTop: spacing.sm,
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 6,
  },
  price: {
    fontSize: typography.h2,
    fontFamily: fonts.bold,
    color: c.textPrimary,
  },
  unitText: {
    fontSize: typography.bodySmall,
    fontFamily: fonts.regular,
    color: c.textSecondary,
    marginBottom: 3,
  },
  detailsCard: {
    marginTop: spacing.md,
    borderWidth: 1,
    borderColor: c.primaryBorder,
    borderRadius: radius.lg,
    backgroundColor: c.primarySoft,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  detailsCardTitle: {
    fontSize: typography.caption,
    fontFamily: fonts.extrabold,
    color: c.primaryDark,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: spacing.xs,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 7,
    gap: spacing.sm,
  },
  detailRowLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  detailLabel: {
    color: c.textSecondary,
    fontSize: typography.bodySmall,
    fontFamily: fonts.semibold,
  },
  detailValue: {
    color: c.textPrimary,
    fontSize: typography.bodySmall,
    fontFamily: fonts.bold,
  },
  detailValueDanger: {
    color: c.danger,
  },
  descriptionCard: {
    marginTop: spacing.md,
    borderWidth: 1,
    borderColor: c.border,
    borderRadius: radius.lg,
    backgroundColor: c.surfaceMuted,
    padding: spacing.md,
  },
  sectionTitle: {
    fontSize: typography.body,
    fontFamily: FONT_DISPLAY,
    color: c.textPrimary,
    marginBottom: spacing.xs,
  },
  description: {
    marginBottom: spacing.sm,
    fontSize: typography.body,
    fontFamily: fonts.regular,
    color: c.textSecondary,
    lineHeight: 22,
  },
  button: {
    borderRadius: radius.pill,
    alignItems: "stretch",
    overflow: "hidden",
    padding: 0,
    backgroundColor: "transparent",
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonGradient: {
    borderRadius: radius.pill,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
  },
  buttonContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  buttonText: {
    color: c.onPrimary,
    fontFamily: fonts.bold,
    fontSize: typography.body,
  },
  buttonTextOnGradient: {
    color: "#FFFFFF",
    fontFamily: fonts.bold,
    fontSize: typography.body,
  },
  heroBadge: {
    position: "absolute",
    right: spacing.sm,
    bottom: spacing.sm,
    maxWidth: "46%",
    backgroundColor: ALCHEMY.brownMuted,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.sm,
  },
  heroBadgeText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontFamily: fonts.extrabold,
    letterSpacing: 0.6,
  },
  ratingRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 6,
    marginTop: spacing.sm,
  },
  ratingMeta: {
    marginLeft: spacing.xs,
    fontSize: typography.bodySmall,
    fontFamily: fonts.semibold,
    color: c.textSecondary,
  },
  mrpStrike: {
    fontSize: typography.body,
    fontFamily: fonts.semibold,
    color: c.textMuted,
    textDecorationLine: "line-through",
    marginBottom: 3,
  },
  variantBlock: {
    marginTop: spacing.md,
  },
  sizeSectionTitle: {
    fontSize: 11,
    fontFamily: fonts.extrabold,
    color: c.textSecondary,
    letterSpacing: 1.2,
    marginBottom: spacing.sm,
    textTransform: "uppercase",
  },
  variantPills: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  variantPill: {
    borderWidth: 1,
    borderColor: c.border,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    backgroundColor: c.surfaceMuted,
  },
  variantPillActive: {
    borderColor: ALCHEMY.gold,
    backgroundColor: ALCHEMY.goldSoft,
  },
  variantPillText: {
    fontFamily: fonts.semibold,
    fontSize: typography.bodySmall,
    color: c.textSecondary,
  },
  variantPillTextActive: {
    color: ALCHEMY.brown,
  },
  uspSection: {
    marginTop: spacing.lg,
    gap: spacing.sm,
  },
  uspCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.md,
    borderWidth: 1,
    borderColor: c.border,
    borderRadius: radius.lg,
    padding: spacing.md,
    backgroundColor: c.surface,
    ...Platform.select({
      web: { boxShadow: "0 2px 8px rgba(0,0,0,0.06)" },
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.06,
        shadowRadius: 4,
      },
      android: { elevation: 2 },
    }),
  },
  uspIconWrap: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    backgroundColor: ALCHEMY.goldSoft,
    alignItems: "center",
    justifyContent: "center",
  },
  uspTextCol: {
    flex: 1,
    gap: 4,
  },
  uspTitle: {
    fontFamily: fonts.bold,
    fontSize: typography.body,
    color: c.textPrimary,
  },
  uspDesc: {
    fontFamily: fonts.regular,
    fontSize: typography.bodySmall,
    color: c.textSecondary,
    lineHeight: 20,
  },
  lifestyleWrap: {
    marginTop: spacing.lg,
    borderRadius: radius.lg,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: c.border,
  },
  lifestyleImage: {
    width: "100%",
    height: 200,
    backgroundColor: c.surfaceMuted,
  },
  processSection: {
    marginTop: spacing.lg,
    gap: spacing.md,
  },
  processHeading: {
    fontFamily: FONT_DISPLAY,
    fontSize: typography.h2,
    color: ALCHEMY.brown,
  },
  processStepsCol: {
    gap: spacing.md,
  },
  processStepRow: {
    flexDirection: "row",
    gap: spacing.md,
    alignItems: "flex-start",
  },
  processStepNum: {
    fontFamily: FONT_DISPLAY,
    fontSize: 28,
    color: ALCHEMY.gold,
    opacity: 0.85,
    minWidth: 40,
  },
  processStepText: {
    flex: 1,
    fontFamily: fonts.regular,
    fontSize: typography.body,
    color: c.textSecondary,
    lineHeight: 24,
    paddingTop: 4,
  },
  quoteBox: {
    borderRadius: radius.lg,
    backgroundColor: ALCHEMY.cardBeige,
    borderWidth: 1,
    borderColor: c.border,
    padding: spacing.md,
  },
  quoteText: {
    fontFamily: FONT_DISPLAY,
    fontSize: typography.body,
    color: ALCHEMY.brownMuted,
    lineHeight: 24,
    fontStyle: "italic",
  },
  usageSection: {
    marginTop: spacing.lg,
    gap: spacing.sm,
  },
  usageHeading: {
    fontFamily: FONT_DISPLAY,
    fontSize: typography.h2,
    color: ALCHEMY.brown,
    marginBottom: spacing.xs,
  },
  usageCard: {
    flexDirection: "row",
    gap: spacing.md,
    alignItems: "flex-start",
    borderRadius: radius.lg,
    padding: spacing.md,
    backgroundColor: ALCHEMY.creamAlt,
    borderWidth: 1,
    borderColor: ALCHEMY.line,
  },
  usageTextCol: {
    flex: 1,
    gap: 4,
  },
  usageTitle: {
    fontFamily: fonts.bold,
    fontSize: typography.body,
    color: c.textPrimary,
  },
  usageDesc: {
    fontFamily: fonts.regular,
    fontSize: typography.bodySmall,
    color: c.textSecondary,
    lineHeight: 20,
  },
  stickyCta: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 56,
    zIndex: 20,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
      },
      android: { elevation: 8 },
    }),
  },
  stickyCtaInner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.md,
    borderWidth: 1,
    borderRadius: radius.lg,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  stickyPriceLabel: {
    fontSize: 11,
    fontFamily: fonts.bold,
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  stickyPrice: {
    fontSize: typography.h2,
    fontFamily: fonts.bold,
  },
  stickyAddWrap: {
    borderRadius: radius.pill,
    overflow: "hidden",
    minWidth: 140,
  },
  stickyAddGradient: {
    paddingVertical: 12,
    paddingHorizontal: spacing.lg,
    alignItems: "center",
  },
  stickyAddText: {
    color: "#FFFFFF",
    fontFamily: fonts.extrabold,
    fontSize: 13,
    letterSpacing: 0.6,
    textTransform: "uppercase",
  },
  stepper: {
    backgroundColor: c.primaryDark,
    borderRadius: radius.pill,
    minHeight: 50,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.sm,
  },
  stepButton: {
    width: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  stepCount: {
    color: c.onPrimary,
    fontSize: typography.body,
    fontFamily: fonts.bold,
  },
  secondaryButton: {
    marginTop: spacing.sm,
    borderWidth: 1,
    borderColor: c.border,
    borderRadius: radius.pill,
    paddingVertical: 12,
    alignItems: "center",
    backgroundColor: c.surfaceMuted,
  },
  secondaryButtonText: {
    color: c.textPrimary,
    fontFamily: fonts.semibold,
    fontSize: typography.body,
  },
  secondaryButtonContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  trustStrip: {
    marginTop: spacing.md,
    backgroundColor: c.brandYellowSoft,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: c.primaryBorder,
    paddingVertical: 10,
    paddingHorizontal: spacing.md,
  },
  trustStripText: {
    color: c.navy,
    textAlign: "center",
    fontSize: typography.bodySmall,
    fontFamily: fonts.semibold,
  },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.xl,
  },
  loadingHint: {
    marginTop: spacing.sm,
    fontSize: typography.bodySmall,
    fontFamily: fonts.semibold,
    color: c.textSecondary,
  },
  missingText: {
    marginTop: spacing.md,
    fontSize: typography.body,
    fontFamily: fonts.semibold,
    color: c.textSecondary,
    textAlign: "center",
  },
});
}

function DetailRow({ icon, label, value, danger = false, styles, c }) {
  return (
    <View style={styles.detailRow}>
      <View style={styles.detailRowLeft}>
        <Ionicons name={icon} size={16} color={c.primary} />
        <Text style={styles.detailLabel}>{label}</Text>
      </View>
      <Text style={[styles.detailValue, danger ? styles.detailValueDanger : null]}>{value}</Text>
    </View>
  );
}

function RetryImage({ sourceUri, style, styles, c }) {
  const candidates = useMemo(() => getImageUriCandidates(sourceUri), [sourceUri]);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    setIndex(0);
  }, [sourceUri]);

  const currentUri = candidates[index] || "";
  if (!currentUri) {
    return (
      <View style={[style, styles.thumbImageFallback]}>
        <Ionicons name="image-outline" size={14} color={c.textMuted} />
      </View>
    );
  }

  return (
    <Image
      source={{ uri: currentUri }}
      style={style}
      contentFit="cover"
      transition={200}
      onError={() => setIndex((prev) => prev + 1)}
    />
  );
}
