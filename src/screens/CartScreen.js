import React, { useEffect, useMemo, useState } from "react";
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import AppFooter from "../components/AppFooter";
import BottomNavBar from "../components/BottomNavBar";
import CustomerScreenShell from "../components/CustomerScreenShell";
import ScreenPageHeader from "../components/ScreenPageHeader";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import {
  createOrderRequest,
  fetchAvailableCouponsRequest,
  validateCouponRequest,
} from "../services/orderService";
import { getCurrentAddressFromGPS } from "../services/locationService";
import { useTheme } from "../context/ThemeContext";
import { customerPageScrollBase, customerPanel, customerScrollFill } from "../theme/screenLayout";
import { fonts, layout, radius, spacing, typography } from "../theme/tokens";
import { formatINR } from "../utils/currency";
import { getImageUriCandidates } from "../utils/image";
import { HOME_CATALOG_ALL, matchesShelfProduct } from "../utils/shelfMatch";
import { getProducts } from "../services/productService";
import { BRAND_LOGO_SIZE } from "../constants/brand";
import BrandLogo from "../components/BrandLogo";
import { ALCHEMY, FONT_DISPLAY } from "../theme/customerAlchemy";

/** Same required fields as ManageAddressScreen save. */
function getProfileAddressCompletion(defaultAddress) {
  const a = defaultAddress && typeof defaultAddress === "object" ? defaultAddress : {};
  const line1 = String(a.line1 || "").trim();
  const city = String(a.city || "").trim();
  const state = String(a.state || "").trim();
  const postalCode = String(a.postalCode || "").trim();
  const country = String(a.country || "").trim();
  const complete = Boolean(line1 && city && state && postalCode && country);
  const any = Boolean(line1 || city || state || postalCode || country);
  return { complete, partial: any && !complete };
}

export default function CartScreen({ navigation }) {
  const { cartItems, totalAmount, totalItems, addToCart, removeFromCart, removeLineFromCart, clearCart } = useCart();
  const { isAuthenticated, token, user } = useAuth();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const isCompact = width < 420;
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [line1, setLine1] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [country, setCountry] = useState("");
  const [latitude, setLatitude] = useState(null);
  const [longitude, setLongitude] = useState(null);
  const [note, setNote] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [availableCoupons, setAvailableCoupons] = useState([]);
  const [catalogProducts, setCatalogProducts] = useState([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await getProducts();
        if (!cancelled) setCatalogProducts(Array.isArray(data) ? data : []);
      } catch {
        if (!cancelled) setCatalogProducts([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    setFullName(user?.name || "");
    setPhone(user?.phone || "");
    setLine1(user?.defaultAddress?.line1 || "");
    setCity(user?.defaultAddress?.city || "");
    setState(user?.defaultAddress?.state || "");
    setPostalCode(user?.defaultAddress?.postalCode || "");
    setCountry(user?.defaultAddress?.country || "");
    setLatitude(
      Number.isFinite(Number(user?.defaultAddress?.latitude))
        ? Number(user.defaultAddress.latitude)
        : null
    );
    setLongitude(
      Number.isFinite(Number(user?.defaultAddress?.longitude))
        ? Number(user.defaultAddress.longitude)
        : null
    );
  }, [user]);

  useEffect(() => {
    setAppliedCoupon(null);
  }, [totalAmount, cartItems.length]);

  useEffect(() => {
    if (!isAuthenticated || !token) return;
    async function loadCoupons() {
      try {
        const data = await fetchAvailableCouponsRequest(token);
        setAvailableCoupons(Array.isArray(data?.coupons) ? data.coupons : []);
      } catch {
        setAvailableCoupons([]);
      }
    }
    loadCoupons();
  }, [isAuthenticated, token, totalAmount, cartItems.length]);

  const { colors: c, shadowLift, shadowPremium, isDark } = useTheme();
  const styles = useMemo(() => createCartStyles(c, shadowLift, shadowPremium, isDark), [c, shadowLift, shadowPremium, isDark]);

  const cartIdSet = useMemo(() => new Set(cartItems.map((i) => i.id)), [cartItems]);
  const upsellProducts = useMemo(() => {
    return catalogProducts
      .filter((p) => matchesShelfProduct(p, HOME_CATALOG_ALL) && !cartIdSet.has(p.id) && p.inStock !== false)
      .slice(0, 2);
  }, [catalogProducts, cartIdSet]);

  const profileAddress = useMemo(() => getProfileAddressCompletion(user?.defaultAddress), [user?.defaultAddress]);

  if (!isAuthenticated) {
    return (
      <CustomerScreenShell style={styles.screen}>
        <ScrollView
          style={customerScrollFill}
          contentContainerStyle={[
            customerPageScrollBase,
            { paddingTop: Math.max(insets.top, Platform.OS === "web" ? spacing.md : spacing.sm) },
          ]}
          showsVerticalScrollIndicator={false}
        >
          <ScreenPageHeader navigation={navigation} title="Cart" subtitle="Sign in to checkout" showBack={false} />
          <View style={styles.loginCard}>
            <BrandLogo width={BRAND_LOGO_SIZE.footerCompact} height={BRAND_LOGO_SIZE.footerCompact} style={styles.loginBrandLogo} />
            <View style={styles.loginIconWrap}>
              <Ionicons name="bag-handle-outline" size={26} color={c.primary} />
            </View>
            <Text style={styles.loginPromptTitle}>Sign in to continue</Text>
            <Text style={styles.loginPromptText}>Sign in to shop and checkout.</Text>
            <TouchableOpacity style={styles.checkoutButton} onPress={() => navigation.navigate("Login")}>
              <View style={styles.checkoutContent}>
                <Ionicons name="log-in-outline" size={18} color={c.onPrimary} />
                <Text style={styles.checkoutButtonText}>Go to login</Text>
              </View>
            </TouchableOpacity>
          </View>
          <AppFooter />
        </ScrollView>
        <BottomNavBar />
      </CustomerScreenShell>
    );
  }

  const goBackOrHome = () => {
    if (navigation.canGoBack?.()) {
      navigation.goBack();
    } else {
      navigation.navigate("Home");
    }
  };

  const renderCartItem = (item) => {
    const uris = getImageUriCandidates(item.image || "");
    const src = uris[0] || "";
    const lineTotal = item.price * item.quantity;
    return (
      <View key={item.id} style={styles.selectionCard}>
        <View style={[styles.selectionCardRow, isCompact ? styles.selectionCardRowStack : null]}>
          {src ? (
            <Image
              source={{ uri: src }}
              style={[styles.selectionThumb, isCompact ? styles.selectionThumbStack : null]}
              contentFit="cover"
              transition={200}
            />
          ) : (
            <View style={[styles.selectionThumb, styles.selectionImagePlaceholder, isCompact ? styles.selectionThumbStack : null]}>
              <Ionicons name="image-outline" size={26} color={c.textMuted} />
            </View>
          )}
          <View style={[styles.selectionBody, isCompact ? styles.selectionBodyStack : null]}>
            <View style={styles.selectionTitleRow}>
            <Text style={styles.selectionName} numberOfLines={2}>
              {item.name}
            </Text>
            <Text style={styles.selectionPrice}>{formatINR(lineTotal)}</Text>
            </View>
            {String(item.description || "").trim() ? (
              <Text style={styles.selectionDesc} numberOfLines={2}>
                {String(item.description).trim()}
              </Text>
            ) : null}
            {item.unit ? (
              <View style={styles.sizeBadge}>
                <Text style={styles.sizeBadgeText}>{String(item.unit).toUpperCase()}</Text>
              </View>
            ) : null}
            <View style={styles.selectionActionsRow}>
              <View style={styles.qtyPillBar}>
                <TouchableOpacity
                  style={styles.qtyPillHit}
                  onPress={() => removeFromCart(item.id, item.variantLabel)}
                  accessibilityLabel="Decrease quantity"
                >
                  <Ionicons name="remove" size={18} color={isDark ? c.textPrimary : ALCHEMY.brown} />
                </TouchableOpacity>
                <Text style={styles.qtyPillNum}>{item.quantity}</Text>
                <TouchableOpacity
                  style={styles.qtyPillHit}
                  onPress={() => addToCart(item)}
                  accessibilityLabel="Increase quantity"
                >
                  <Ionicons name="add" size={18} color={isDark ? c.textPrimary : ALCHEMY.brown} />
                </TouchableOpacity>
              </View>
              <TouchableOpacity
                style={styles.removeRow}
                onPress={() => removeLineFromCart(item.id, item.variantLabel)}
                activeOpacity={0.75}
              >
                <Ionicons name="trash-outline" size={17} color={isDark ? c.textMuted : ALCHEMY.brownMuted} />
                <Text style={styles.removeRowText}>REMOVE</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    );
  };

  const validateAddress = () => {
    if (
      !fullName.trim() ||
      !phone.trim() ||
      !line1.trim() ||
      !city.trim() ||
      !state.trim() ||
      !postalCode.trim() ||
      !country.trim()
    ) {
      setError("Please complete delivery address details.");
      return false;
    }
    return true;
  };

  const handlePlaceOrder = async () => {
    if (cartItems.length === 0) {
      return;
    }

    if (!validateAddress()) {
      return;
    }

    try {
      setIsPlacingOrder(true);
      setError("");
      setSuccess("");

      await createOrderRequest(token, {
        products: cartItems.map((item) => ({
          product: item.id,
          id: item.id,
          name: item.name,
          price: item.price,
          image: item.image || "",
          quantity: item.quantity,
          variantLabel: item.variantLabel || "",
        })),
        shippingAddress: {
          fullName: fullName.trim(),
          phone: phone.trim(),
          line1: line1.trim(),
          city: city.trim(),
          state: state.trim(),
          postalCode: postalCode.trim(),
          country: country.trim(),
          latitude,
          longitude,
          note: note.trim(),
        },
        paymentMethod: "Cash on Delivery",
        couponCode: appliedCoupon?.code || "",
      });

      clearCart();
      setSuccess("Order placed successfully. You can track it in your profile.");
      navigation.navigate("Profile");
    } catch (err) {
      setError(err.message || "Unable to place order.");
    } finally {
      setIsPlacingOrder(false);
    }
  };

  const handleApplyCoupon = async () => {
    try {
      setError("");
      setSuccess("");
      const normalized = String(couponCode || "").trim().toUpperCase();
      if (!normalized) {
        setError("Enter coupon code.");
        return;
      }
      const result = await validateCouponRequest(token, normalized);
      setAppliedCoupon(result.coupon || null);
      setCouponCode(normalized);
      setSuccess(result.message || "Coupon applied.");
      setAvailableCoupons((current) => current.filter((coupon) => coupon.code !== normalized));
    } catch (err) {
      setAppliedCoupon(null);
      setError(err.message || "Unable to apply coupon.");
    }
  };

  const deliveryFee = 0;
  const platformFee = 1.2;
  const discountAmount = Number(appliedCoupon?.discountAmount || 0);
  const payableAmount = Math.max(0, totalAmount + deliveryFee + platformFee - discountAmount);

  const handleUseCurrentLocation = async () => {
    try {
      setIsDetectingLocation(true);
      setError("");
      const address = await getCurrentAddressFromGPS();
      if (address.line1) setLine1(address.line1);
      if (address.city) setCity(address.city);
      if (address.state) setState(address.state);
      if (address.postalCode) setPostalCode(address.postalCode);
      if (address.country) setCountry(address.country);
      if (Number.isFinite(Number(address.latitude))) setLatitude(Number(address.latitude));
      if (Number.isFinite(Number(address.longitude))) setLongitude(Number(address.longitude));
      setSuccess("Current location detected and address auto-filled.");
    } catch (err) {
      setError(err.message || "Unable to get current location.");
    } finally {
      setIsDetectingLocation(false);
    }
  };

  return (
    <CustomerScreenShell style={styles.screen}>
      <ScrollView
        style={styles.scrollFill}
        contentContainerStyle={[
          customerPageScrollBase,
          { paddingTop: Math.max(insets.top, Platform.OS === "web" ? spacing.md : spacing.sm) },
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View
          style={[
            styles.cartTopShell,
            isDark
              ? { backgroundColor: "rgba(28, 25, 23, 0.52)", borderColor: c.border, borderTopColor: c.primaryBorder }
              : { backgroundColor: "rgba(255, 252, 248, 0.92)", borderColor: ALCHEMY.pillInactive, borderTopColor: ALCHEMY.gold },
          ]}
        >
          <View style={styles.cartTopBar}>
            <Pressable onPress={goBackOrHome} style={styles.cartTopIcon} hitSlop={10} accessibilityRole="button" accessibilityLabel="Back">
              <Ionicons name="chevron-back" size={22} color={isDark ? c.textPrimary : ALCHEMY.brown} />
            </Pressable>
            <View style={styles.cartLogoWrap}>
              <BrandLogo width={BRAND_LOGO_SIZE.headerCompact} height={BRAND_LOGO_SIZE.headerCompact} />
            </View>
            <Pressable onPress={() => navigation.navigate("Home")} style={styles.cartTopIcon} hitSlop={10} accessibilityLabel="Shop">
              <Ionicons name="bag-handle-outline" size={22} color={isDark ? c.textPrimary : ALCHEMY.brown} />
            </Pressable>
          </View>
        </View>

        <Text style={[styles.pageTitle, { color: isDark ? c.textPrimary : ALCHEMY.brown }]}>Your Selection</Text>
        <Text style={styles.pageSubtitle}>
          {cartItems.length === 0
            ? "Add treasures from the boutique to begin."
            : `${totalItems} artisanal treasure${totalItems === 1 ? "" : "s"} curated for your kitchen.`}
        </Text>

        {cartItems.length === 0 ? (
          <View style={styles.emptyCard}>
            <BrandLogo width={BRAND_LOGO_SIZE.footerCompact} height={BRAND_LOGO_SIZE.footerCompact} style={styles.emptyBrandLogo} />
            <View style={styles.emptyIconWrap}>
              <Ionicons name="cart-outline" size={30} color={isDark ? c.primary : ALCHEMY.brown} />
            </View>
            <Text style={styles.emptyTitle}>Your cart is empty</Text>
            <Text style={styles.emptyText}>Browse the collection and tap Add on items you love — they will appear here.</Text>
            <TouchableOpacity style={styles.browseHomeBtn} onPress={() => navigation.navigate("Home")}>
              <Ionicons name="storefront-outline" size={18} color={c.onSecondary} />
              <Text style={styles.browseHomeBtnText}>Browse products</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.listSection}>{cartItems.map(renderCartItem)}</View>
        )}

        {cartItems.length > 0 && upsellProducts.length > 0 ? (
          <View style={styles.upsellSection}>
            <Text style={[styles.upsellTitle, { color: isDark ? c.textPrimary : ALCHEMY.brown }]}>Enhance Your Ritual</Text>
            {upsellProducts.map((p) => {
              const uris = getImageUriCandidates(p.image || "");
              const src = uris[0] || "";
              return (
                <View key={p.id} style={styles.upsellRow}>
                  {src ? (
                    <Image source={{ uri: src }} style={styles.upsellThumb} contentFit="cover" />
                  ) : (
                    <View style={[styles.upsellThumb, styles.selectionImagePlaceholder]}>
                      <Ionicons name="image-outline" size={20} color={c.textMuted} />
                    </View>
                  )}
                  <View style={styles.upsellMeta}>
                    <Text style={styles.upsellName} numberOfLines={2}>
                      {p.name}
                    </Text>
                    <Text style={styles.upsellPrice}>{formatINR(p.price)}</Text>
                    <TouchableOpacity onPress={() => addToCart(p)} style={styles.upsellAdd} activeOpacity={0.85}>
                      <Text style={styles.upsellAddText}>ADD TO CART</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })}
          </View>
        ) : null}

        <View style={styles.couponBox}>
          <View style={styles.panelSectionHeader}>
            <View style={[styles.panelSectionIcon, { backgroundColor: c.primarySoft, borderColor: c.primaryBorder }]}>
              <Ionicons name="pricetag-outline" size={18} color={c.primaryDark} />
            </View>
            <Text style={styles.panelSectionTitle}>Coupon</Text>
          </View>
          {availableCoupons.length > 0 ? (
            <View style={styles.availableCouponsWrap}>
              {availableCoupons.slice(0, 6).map((coupon) => (
                <TouchableOpacity
                  key={coupon.code}
                  style={styles.availableCouponChip}
                  onPress={() => setCouponCode(coupon.code)}
                >
                  <Text style={styles.availableCouponCode}>{coupon.code}</Text>
                  <Text style={styles.availableCouponMeta}>
                    Save {formatINR(coupon.estimatedDiscount || 0)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          ) : (
            <Text style={styles.noCouponText}>No eligible coupons for current cart.</Text>
          )}
          <View style={styles.couponRow}>
            <TextInput
              style={[styles.input, styles.couponInput]}
              placeholder="Enter coupon code"
              placeholderTextColor={c.textMuted}
              value={couponCode}
              onChangeText={setCouponCode}
              autoCapitalize="characters"
            />
            <TouchableOpacity style={styles.applyCouponBtn} onPress={handleApplyCoupon}>
              <Text style={styles.applyCouponBtnText}>Apply</Text>
            </TouchableOpacity>
          </View>
          {appliedCoupon ? (
            <Text style={styles.couponSuccessText}>
              {appliedCoupon.code} applied. You saved {formatINR(appliedCoupon.discountAmount || 0)}.
            </Text>
          ) : null}
        </View>

        {!profileAddress.complete ? (
          <TouchableOpacity
            style={styles.addressProfileBanner}
            onPress={() => navigation.navigate("ManageAddress")}
            activeOpacity={0.88}
            accessibilityRole="button"
            accessibilityLabel="Open delivery address settings"
          >
            <View style={styles.addressProfileBannerIconWrap}>
              <Ionicons name="location-outline" size={22} color={c.secondary} />
            </View>
            <View style={styles.addressProfileBannerTextCol}>
              <Text style={styles.addressProfileBannerTitle}>
                {profileAddress.partial ? "Saved address incomplete" : "Save your delivery address"}
              </Text>
              <Text style={styles.addressProfileBannerSub}>
                {profileAddress.partial
                  ? "Finish line, city, state, postal code, and country in your profile—we’ll pre-fill checkout."
                  : "Add your address once on your profile for faster checkout next time."}
              </Text>
            </View>
            <Text style={styles.addressProfileBannerCta}>Add</Text>
          </TouchableOpacity>
        ) : null}

        <View style={styles.addressBox}>
          <View style={styles.panelSectionHeader}>
            <View style={[styles.panelSectionIcon, { backgroundColor: c.secondarySoft, borderColor: c.secondaryBorder }]}>
              <Ionicons name="location-outline" size={18} color={c.secondaryDark} />
            </View>
            <Text style={styles.panelSectionTitle}>Deliver to</Text>
          </View>
          <Text style={styles.addressHint}>We’ll ship to this address for this order.</Text>
          {error ? <Text style={styles.errorText}>{error}</Text> : null}
          {success ? <Text style={styles.successText}>{success}</Text> : null}
          <TouchableOpacity style={styles.savedAddressBtn} onPress={handleUseCurrentLocation}>
            <Ionicons name="locate-outline" size={14} color={c.primary} />
            <Text style={styles.savedAddressBtnText}>
              {isDetectingLocation ? "Detecting location..." : "Use Current GPS Location"}
            </Text>
          </TouchableOpacity>
          <TextInput
            style={styles.input}
            placeholder="Full Name"
            placeholderTextColor={c.textMuted}
            value={fullName}
            onChangeText={setFullName}
          />
          <TextInput
            style={styles.input}
            placeholder="Phone"
            placeholderTextColor={c.textMuted}
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
          />
          <TextInput
            style={styles.input}
            placeholder="Address Line"
            placeholderTextColor={c.textMuted}
            value={line1}
            onChangeText={setLine1}
          />
          <View style={[styles.addressRow, isCompact ? styles.addressRowCompact : null]}>
            <TextInput
              style={[styles.input, styles.halfInput]}
              placeholder="City"
              placeholderTextColor={c.textMuted}
              value={city}
              onChangeText={setCity}
            />
            <TextInput
              style={[styles.input, styles.halfInput]}
              placeholder="State"
              placeholderTextColor={c.textMuted}
              value={state}
              onChangeText={setState}
            />
          </View>
          <View style={[styles.addressRow, isCompact ? styles.addressRowCompact : null]}>
            <TextInput
              style={[styles.input, styles.halfInput]}
              placeholder="Postal Code"
              placeholderTextColor={c.textMuted}
              value={postalCode}
              onChangeText={setPostalCode}
            />
            <TextInput
              style={[styles.input, styles.halfInput]}
              placeholder="Country"
              placeholderTextColor={c.textMuted}
              value={country}
              onChangeText={setCountry}
            />
          </View>
          <TextInput
            style={[styles.input, styles.noteInput]}
            placeholder="Delivery note (optional)"
            placeholderTextColor={c.textMuted}
            value={note}
            onChangeText={setNote}
            multiline
          />

        </View>

        <View style={styles.summaryAlchemy}>
          <Text style={[styles.summaryAlchemyTitle, { color: isDark ? c.textPrimary : ALCHEMY.brown }]}>Summary</Text>
          <View style={styles.summaryInner}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Subtotal</Text>
              <Text style={styles.summaryValue}>{formatINR(totalAmount)}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Shipping</Text>
              <Text style={styles.shippingFree}>FREE</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Estimated taxes</Text>
              <Text style={styles.summaryValue}>{formatINR(platformFee)}</Text>
            </View>
            {discountAmount > 0 ? (
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Discount</Text>
                <Text style={styles.summaryDiscountValue}>- {formatINR(discountAmount)}</Text>
              </View>
            ) : null}
            <View style={[styles.summaryDivider, { backgroundColor: c.border }]} />
            <Text style={styles.totalAmountLabel}>TOTAL AMOUNT</Text>
            <View style={styles.totalAmountRow}>
              <Text style={[styles.totalAmountSerif, { color: isDark ? c.textPrimary : ALCHEMY.brown }]}>{formatINR(payableAmount)}</Text>
              <View style={styles.inrBadge}>
                <Text style={styles.inrBadgeText}>INR</Text>
              </View>
            </View>
            <View style={styles.summaryTrustRow}>
              <View style={styles.summaryTrustItem}>
                <Ionicons name="flame-outline" size={14} color={ALCHEMY.brownMuted} />
                <Text style={styles.summaryTrustText}>100% PURE</Text>
              </View>
              <View style={styles.summaryTrustItem}>
                <Ionicons name="shield-checkmark-outline" size={14} color={ALCHEMY.brownMuted} />
                <Text style={styles.summaryTrustText}>SECURE PAY</Text>
              </View>
              <View style={styles.summaryTrustItem}>
                <Ionicons name="leaf-outline" size={14} color={ALCHEMY.brownMuted} />
                <Text style={styles.summaryTrustText}>ORGANIC</Text>
              </View>
            </View>
          </View>
        </View>

        <TouchableOpacity
          activeOpacity={0.92}
          onPress={handlePlaceOrder}
          disabled={cartItems.length === 0 || isPlacingOrder}
          style={styles.checkoutGradientWrap}
        >
          {cartItems.length === 0 || isPlacingOrder ? (
            <View style={[styles.checkoutGradientBtn, styles.checkoutGradientMuted]}>
              <Text style={styles.checkoutGradientText}>
                {cartItems.length === 0 ? "ADD ITEMS TO CONTINUE" : "PLACING ORDER…"}
              </Text>
            </View>
          ) : (
            <LinearGradient
              colors={["#D4A84B", "#744F1C"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.checkoutGradientBtn}
            >
              <Text style={styles.checkoutGradientText}>PROCEED TO CHECKOUT</Text>
            </LinearGradient>
          )}
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.navigate("Home")} style={styles.continueExploreWrap} activeOpacity={0.8}>
          <Text style={styles.continueExploreText}>CONTINUE EXPLORING</Text>
        </TouchableOpacity>

        <AppFooter />
      </ScrollView>
      <BottomNavBar />
    </CustomerScreenShell>
  );
}

function createCartStyles(c, shadowLift, shadowPremium, isDark) {
  return StyleSheet.create({
  screen: {
    flex: 1,
    width: "100%",
    alignSelf: "center",
    maxWidth: Platform.select({ web: layout.maxContentWidth, default: "100%" }),
  },
  scrollFill: {
    flex: 1,
    width: "100%",
  },
  cartTopShell: {
    borderRadius: radius.xl,
    borderWidth: StyleSheet.hairlineWidth,
    borderTopWidth: 2,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.xs,
    marginBottom: spacing.md,
    ...Platform.select({
      ios: {
        shadowColor: "#3D2A12",
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: isDark ? 0.22 : 0.08,
        shadowRadius: 14,
      },
      android: { elevation: isDark ? 3 : 2 },
      web: {
        boxShadow: isDark
          ? "0 8px 28px rgba(0,0,0,0.28), inset 0 1px 0 rgba(255,255,255,0.04)"
          : "0 10px 28px rgba(61, 42, 18, 0.08), inset 0 1px 0 rgba(255, 253, 251, 0.9)",
      },
      default: {},
    }),
  },
  cartTopBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.xs,
  },
  cartTopIcon: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radius.md,
    ...Platform.select({ web: { cursor: "pointer" }, default: {} }),
  },
  cartLogoWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    minHeight: BRAND_LOGO_SIZE.headerCompact,
  },
  pageTitle: {
    fontFamily: FONT_DISPLAY,
    fontSize: 28,
    lineHeight: 34,
    letterSpacing: -0.4,
    marginBottom: spacing.xs,
  },
  pageSubtitle: {
    fontSize: typography.bodySmall,
    fontFamily: fonts.regular,
    color: c.textSecondary,
    lineHeight: 20,
    marginBottom: spacing.lg,
    maxWidth: 400,
  },
  selectionCard: {
    backgroundColor: isDark ? c.surface : ALCHEMY.cardBg,
    borderRadius: radius.xl,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: isDark ? c.border : ALCHEMY.pillInactive,
    borderTopWidth: 2,
    borderTopColor: isDark ? c.primaryBorder : ALCHEMY.gold,
    marginBottom: spacing.md,
    overflow: "hidden",
    ...shadowPremium,
  },
  selectionCardRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.sm,
    padding: spacing.sm,
  },
  selectionCardRowStack: {
    flexDirection: "column",
    gap: 0,
    padding: 0,
  },
  selectionThumb: {
    width: 100,
    height: 100,
    borderRadius: radius.lg,
    backgroundColor: isDark ? c.surfaceMuted : "#FFFFFF",
    overflow: "hidden",
  },
  selectionThumbStack: {
    width: "100%",
    height: 148,
    borderRadius: 0,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
  },
  selectionImagePlaceholder: {
    alignItems: "center",
    justifyContent: "center",
  },
  selectionBody: {
    flex: 1,
    minWidth: 0,
    paddingVertical: spacing.xs,
    paddingRight: spacing.sm,
    paddingLeft: 0,
  },
  selectionBodyStack: {
    paddingLeft: spacing.md,
    paddingRight: spacing.md,
    paddingBottom: spacing.md,
    paddingTop: spacing.sm,
  },
  selectionTitleRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: spacing.md,
    marginBottom: spacing.xs,
  },
  selectionName: {
    flex: 1,
    fontFamily: FONT_DISPLAY,
    fontSize: typography.body,
    color: c.textPrimary,
    lineHeight: 22,
  },
  selectionPrice: {
    fontFamily: FONT_DISPLAY,
    fontSize: typography.body,
    color: isDark ? c.textPrimary : ALCHEMY.brown,
  },
  selectionDesc: {
    fontSize: typography.caption,
    fontFamily: fonts.regular,
    color: c.textSecondary,
    lineHeight: 18,
    marginBottom: spacing.sm,
  },
  sizeBadge: {
    alignSelf: "flex-start",
    backgroundColor: isDark ? c.surfaceMuted : "#FFF",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.pill,
    marginBottom: spacing.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: c.border,
  },
  sizeBadgeText: {
    fontSize: 10,
    fontFamily: fonts.bold,
    color: c.textMuted,
    letterSpacing: 0.6,
  },
  selectionActionsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  qtyPillBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: isDark ? c.surfaceMuted : "#FFF",
    borderRadius: radius.pill,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: c.border,
    paddingHorizontal: 4,
  },
  qtyPillHit: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  qtyPillNum: {
    minWidth: 28,
    textAlign: "center",
    fontFamily: fonts.bold,
    fontSize: typography.body,
    color: c.textPrimary,
  },
  removeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 8,
    paddingLeft: 8,
  },
  removeRowText: {
    fontSize: 11,
    fontFamily: fonts.bold,
    letterSpacing: 0.8,
    color: isDark ? c.textMuted : ALCHEMY.brownMuted,
  },
  upsellSection: {
    backgroundColor: isDark ? c.surface : ALCHEMY.cardBg,
    borderRadius: radius.xl,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: isDark ? c.border : ALCHEMY.pillInactive,
    borderTopWidth: 2,
    borderTopColor: isDark ? c.primaryBorder : ALCHEMY.gold,
    padding: spacing.md,
    marginBottom: spacing.lg,
    ...shadowLift,
  },
  upsellTitle: {
    fontFamily: FONT_DISPLAY,
    fontSize: typography.h3,
    marginBottom: spacing.md,
    letterSpacing: -0.2,
  },
  upsellRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    backgroundColor: isDark ? c.surfaceMuted : "#FFFFFF",
    borderRadius: radius.lg,
    padding: spacing.sm,
    marginBottom: spacing.sm,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: isDark ? c.border : ALCHEMY.pillInactive,
  },
  upsellThumb: {
    width: 72,
    height: 72,
    borderRadius: 12,
    backgroundColor: c.surfaceMuted,
  },
  upsellMeta: {
    flex: 1,
    minWidth: 0,
  },
  upsellName: {
    fontFamily: FONT_DISPLAY,
    fontSize: typography.bodySmall,
    color: c.textPrimary,
    lineHeight: 20,
  },
  upsellPrice: {
    marginTop: 4,
    fontFamily: fonts.bold,
    fontSize: typography.bodySmall,
    color: c.textPrimary,
  },
  upsellAdd: {
    marginTop: spacing.sm,
    alignSelf: "flex-start",
  },
  upsellAddText: {
    fontSize: 11,
    fontFamily: fonts.extrabold,
    letterSpacing: 1,
    color: isDark ? c.primaryBright : ALCHEMY.brown,
    textDecorationLine: "underline",
  },
  summaryAlchemy: {
    backgroundColor: isDark ? c.surface : ALCHEMY.cardBg,
    borderRadius: radius.xl,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: isDark ? c.border : ALCHEMY.pillInactive,
    borderTopWidth: 2,
    borderTopColor: isDark ? c.primaryBorder : ALCHEMY.gold,
    padding: spacing.md,
    marginBottom: spacing.lg,
    ...shadowPremium,
  },
  summaryAlchemyTitle: {
    fontFamily: FONT_DISPLAY,
    fontSize: typography.h3,
    marginBottom: spacing.md,
  },
  shippingFree: {
    fontFamily: fonts.bold,
    fontSize: typography.bodySmall,
    color: isDark ? c.primaryBright : "#C9A227",
  },
  totalAmountLabel: {
    fontSize: 10,
    fontFamily: fonts.bold,
    letterSpacing: 1.2,
    color: c.textMuted,
    marginTop: spacing.sm,
    marginBottom: spacing.xs,
  },
  totalAmountRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  totalAmountSerif: {
    fontFamily: FONT_DISPLAY,
    fontSize: 28,
    letterSpacing: -0.3,
  },
  inrBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: c.border,
    backgroundColor: isDark ? c.surfaceMuted : "#FFF",
  },
  inrBadgeText: {
    fontSize: 10,
    fontFamily: fonts.bold,
    color: c.textMuted,
    letterSpacing: 0.5,
  },
  summaryTrustRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: c.border,
  },
  summaryTrustItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  summaryTrustText: {
    fontSize: 9,
    fontFamily: fonts.bold,
    letterSpacing: 0.5,
    color: c.textMuted,
  },
  checkoutGradientWrap: {
    marginBottom: spacing.md,
    borderRadius: 14,
    overflow: "hidden",
  },
  checkoutGradientBtn: {
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 14,
  },
  checkoutGradientMuted: {
    backgroundColor: c.textMuted,
  },
  checkoutGradientText: {
    color: "#FFFCF8",
    fontFamily: fonts.extrabold,
    fontSize: typography.bodySmall,
    letterSpacing: 1.2,
  },
  continueExploreWrap: {
    alignItems: "center",
    marginBottom: spacing.xl,
    paddingVertical: spacing.sm,
  },
  continueExploreText: {
    fontSize: 11,
    fontFamily: fonts.bold,
    letterSpacing: 1.2,
    color: isDark ? c.primaryBright : ALCHEMY.brownMuted,
    textDecorationLine: "underline",
  },
  checkoutProgress: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderRadius: radius.xxl,
    borderWidth: 1,
    borderColor: c.border,
    borderTopWidth: 2,
    borderTopColor: c.primaryBorder,
    backgroundColor: c.surface,
    gap: spacing.xs,
    ...shadowLift,
  },
  progressStep: {
    flex: 1,
    alignItems: "center",
    gap: 6,
  },
  progressTrackSeg: {
    width: "100%",
    height: 4,
    borderRadius: radius.pill,
    backgroundColor: c.border,
    maxWidth: 72,
  },
  progressTrackSegActive: {
    backgroundColor: c.primary,
  },
  progressLabel: {
    fontSize: 10,
    fontFamily: fonts.semibold,
    color: c.textMuted,
    textAlign: "center",
  },
  progressLabelActive: {
    color: c.primaryDark,
    fontFamily: fonts.bold,
  },
  trustStrip: {
    marginBottom: spacing.md,
    borderRadius: radius.xxl,
    borderWidth: 1,
    borderColor: c.border,
    backgroundColor: c.surfaceMuted,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
  },
  trustRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: spacing.md,
    paddingVertical: spacing.xs,
  },
  trustItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  trustText: {
    fontSize: 12,
    fontFamily: fonts.medium,
    color: c.textSecondary,
  },
  loginCard: {
    ...customerPanel(c, shadowPremium),
    padding: spacing.xl,
    alignItems: "center",
  },
  loginBrandLogo: {
    marginBottom: spacing.sm,
  },
  loginIconWrap: {
    width: 56,
    height: 56,
    borderRadius: radius.pill,
    backgroundColor: c.primarySoft,
    borderWidth: 1,
    borderColor: c.primaryBorder,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.md,
  },
  cartHeroIcon: {
    width: 44,
    height: 44,
    borderRadius: radius.pill,
    backgroundColor: c.surface,
    borderWidth: 1,
    borderColor: c.primaryBorder,
    alignItems: "center",
    justifyContent: "center",
  },
  cartHero: {
    ...customerPanel(c, shadowPremium),
    marginBottom: spacing.md,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.md,
  },
  cartHeroTextBlock: {
    flex: 1,
  },
  cartHeroEyebrow: {
    fontSize: typography.overline,
    fontFamily: fonts.semibold,
    color: c.textMuted,
    letterSpacing: 1,
    textTransform: "uppercase",
    marginBottom: 4,
  },
  cartHeroTitle: {
    color: c.primaryDark,
    fontSize: typography.h3,
    fontFamily: fonts.extrabold,
  },
  cartHeroAccent: {
    width: 44,
    height: 3,
    borderRadius: radius.pill,
    marginTop: spacing.sm,
    marginBottom: spacing.xs,
  },
  cartHeroSubtitle: {
    marginTop: 0,
    color: c.textSecondary,
    fontSize: typography.bodySmall,
    fontFamily: fonts.semibold,
    lineHeight: 20,
  },
  itemsSectionLabel: {
    fontSize: typography.overline,
    fontFamily: fonts.bold,
    color: c.textMuted,
    letterSpacing: 0.6,
    textTransform: "uppercase",
    marginBottom: spacing.sm,
  },
  listSection: {
    marginBottom: spacing.md,
  },
  listContent: {
    gap: spacing.sm,
  },
  cartItemCard: {
    backgroundColor: c.surface,
    borderWidth: 1,
    borderColor: c.border,
    borderTopWidth: 2,
    borderTopColor: c.primaryBorder,
    borderRadius: radius.xl,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    ...shadowPremium,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: spacing.xs,
    gap: spacing.sm,
  },
  info: {
    flex: 1,
  },
  name: {
    fontSize: typography.body,
    fontFamily: fonts.semibold,
    color: c.textPrimary,
  },
  meta: {
    marginTop: 5,
    fontSize: 13,
    color: c.textSecondary,
  },
  actions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  smallButton: {
    backgroundColor: c.primarySoft,
    width: 36,
    height: 36,
    borderRadius: radius.pill,
    alignItems: "center",
    justifyContent: "center",
  },
  smallButtonText: {
    color: c.primary,
    fontSize: 18,
    fontFamily: fonts.bold,
    marginTop: -1,
  },
  quantityPill: {
    minWidth: 34,
    height: 34,
    paddingHorizontal: 10,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: c.border,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: c.surfaceMuted,
  },
  quantityPillText: {
    color: c.textPrimary,
    fontFamily: fonts.bold,
    fontSize: typography.bodySmall,
  },
  emptyCard: {
    ...customerPanel(c, shadowPremium),
    marginBottom: spacing.md,
    padding: spacing.xl,
    alignItems: "center",
  },
  emptyBrandLogo: {
    marginBottom: spacing.xs,
  },
  emptyIconWrap: {
    width: 64,
    height: 64,
    borderRadius: radius.pill,
    backgroundColor: c.primarySoft,
    borderWidth: 1,
    borderColor: c.primaryBorder,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.sm,
  },
  emptyTitle: {
    fontSize: typography.h3,
    fontFamily: fonts.extrabold,
    color: c.textPrimary,
    textAlign: "center",
  },
  emptyText: {
    marginTop: spacing.sm,
    textAlign: "center",
    color: c.textSecondary,
    fontSize: typography.bodySmall,
    fontFamily: fonts.regular,
    lineHeight: 22,
    maxWidth: 320,
  },
  browseHomeBtn: {
    marginTop: spacing.lg,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: c.secondary,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.xl,
    paddingVertical: 12,
  },
  browseHomeBtnText: {
    color: c.onSecondary,
    fontFamily: fonts.bold,
    fontSize: typography.body,
  },
  footer: {
    ...customerPanel(c, shadowPremium),
    marginBottom: spacing.md,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  footerEyebrow: {
    fontSize: typography.overline,
    fontFamily: fonts.semibold,
    color: c.textMuted,
    letterSpacing: 0.5,
    textTransform: "uppercase",
    marginBottom: 2,
  },
  summaryBox: {
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: c.primaryBorder,
    borderTopWidth: 2,
    borderTopColor: c.primary,
    borderRadius: radius.xxl,
    backgroundColor: c.primarySoft,
    padding: spacing.lg,
    gap: spacing.sm,
    ...shadowPremium,
  },
  summaryBoxHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginBottom: spacing.xs,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: c.primaryBorder,
  },
  summaryBoxTitle: {
    fontSize: typography.body,
    fontFamily: fonts.extrabold,
    color: c.primaryDark,
  },
  summaryInner: {
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 2,
  },
  summaryLabel: {
    color: c.textSecondary,
    fontSize: typography.bodySmall,
    fontFamily: fonts.regular,
  },
  summaryValue: {
    color: c.textPrimary,
    fontSize: typography.bodySmall,
    fontFamily: fonts.semibold,
  },
  summaryDiscountValue: {
    color: c.success,
    fontSize: typography.bodySmall,
    fontFamily: fonts.bold,
  },
  summaryDivider: {
    height: StyleSheet.hairlineWidth,
    marginVertical: spacing.sm,
    opacity: 0.85,
  },
  summaryRowFinal: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: spacing.xs,
  },
  summaryFinalLabel: {
    color: c.textPrimary,
    fontSize: typography.body,
    fontFamily: fonts.bold,
  },
  summaryFinalValue: {
    color: c.primary,
    fontSize: typography.h3,
    fontFamily: fonts.extrabold,
  },
  addressProfileBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginBottom: spacing.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: c.secondaryBorder,
    backgroundColor: c.secondarySoft,
  },
  addressProfileBannerIconWrap: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    backgroundColor: c.surface,
    borderWidth: 1,
    borderColor: c.secondaryBorder,
    alignItems: "center",
    justifyContent: "center",
  },
  addressProfileBannerTextCol: {
    flex: 1,
    minWidth: 0,
  },
  addressProfileBannerTitle: {
    fontSize: typography.bodySmall,
    fontFamily: fonts.bold,
    color: c.textPrimary,
  },
  addressProfileBannerSub: {
    marginTop: 4,
    fontSize: typography.caption,
    fontFamily: fonts.regular,
    color: c.textSecondary,
    lineHeight: 18,
  },
  addressProfileBannerCta: {
    fontSize: typography.bodySmall,
    fontFamily: fonts.extrabold,
    color: c.secondaryDark,
  },
  addressBox: {
    ...customerPanel(c, shadowPremium),
    marginBottom: spacing.md,
  },
  panelSectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  panelSectionIcon: {
    width: 36,
    height: 36,
    borderRadius: radius.pill,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  panelSectionTitle: {
    flex: 1,
    fontSize: typography.body,
    fontFamily: fonts.extrabold,
    color: c.textPrimary,
  },
  addressHint: {
    fontSize: typography.caption,
    fontFamily: fonts.regular,
    color: c.textSecondary,
    marginBottom: spacing.md,
    lineHeight: 18,
  },
  couponBox: {
    ...customerPanel(c, shadowPremium),
    marginBottom: spacing.md,
  },
  couponRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  availableCouponsWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
  availableCouponChip: {
    borderWidth: 1,
    borderColor: c.primaryBorder,
    borderRadius: radius.md,
    backgroundColor: c.primarySoft,
    paddingHorizontal: spacing.sm,
    paddingVertical: 8,
  },
  availableCouponCode: {
    color: c.primary,
    fontSize: typography.caption,
    fontFamily: fonts.extrabold,
  },
  availableCouponMeta: {
    marginTop: 1,
    color: c.textSecondary,
    fontSize: typography.overline,
    fontFamily: fonts.semibold,
  },
  noCouponText: {
    color: c.textMuted,
    fontSize: 11,
    marginBottom: spacing.sm,
  },
  couponInput: {
    flex: 1,
    marginBottom: 0,
  },
  applyCouponBtn: {
    backgroundColor: c.secondary,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
  },
  applyCouponBtnText: {
    color: c.onSecondary,
    fontFamily: fonts.bold,
    fontSize: typography.caption,
  },
  couponSuccessText: {
    marginTop: spacing.xs,
    color: c.success,
    fontSize: typography.caption,
    fontFamily: fonts.bold,
  },
  savedAddressBtn: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: c.primarySoft,
    borderWidth: 1,
    borderColor: c.primaryBorder,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: 7,
    marginBottom: spacing.sm,
  },
  savedAddressBtnText: {
    color: c.primary,
    fontSize: typography.caption,
    fontFamily: fonts.bold,
  },
  input: {
    borderWidth: 1,
    borderColor: c.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.sm,
    paddingVertical: 10,
    marginBottom: spacing.sm,
    backgroundColor: c.surface,
    fontSize: typography.bodySmall,
    fontFamily: fonts.regular,
    color: c.textPrimary,
    minHeight: 44,
  },
  addressRow: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  addressRowCompact: {
    flexDirection: "column",
    gap: 0,
  },
  halfInput: {
    flex: 1,
  },
  noteInput: {
    minHeight: 70,
    textAlignVertical: "top",
  },
  errorText: {
    color: c.danger,
    marginBottom: spacing.sm,
    fontFamily: fonts.semibold,
    fontSize: typography.caption,
  },
  successText: {
    color: c.success,
    marginBottom: spacing.sm,
    fontFamily: fonts.semibold,
    fontSize: typography.caption,
  },
  totalLabel: {
    fontSize: typography.body,
    color: c.textPrimary,
    fontFamily: fonts.bold,
  },
  totalValue: {
    fontSize: 28,
    color: c.primaryDark,
    fontFamily: fonts.extrabold,
  },
  checkoutButton: {
    marginBottom: spacing.lg,
    backgroundColor: c.primary,
    borderRadius: radius.pill,
    alignItems: "center",
    paddingVertical: 16,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.2,
        shadowRadius: 12,
      },
      android: {
        elevation: 6,
      },
      web: {
        boxShadow: "0 8px 24px rgba(184, 134, 11, 0.35)",
      },
    }),
  },
  checkoutButtonDisabled: {
    backgroundColor: c.textMuted,
  },
  checkoutButtonText: {
    color: c.onPrimary,
    fontFamily: fonts.bold,
    fontSize: typography.body,
  },
  checkoutContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  loginPrompt: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.xl,
  },
  loginPromptTitle: {
    fontSize: typography.h2,
    fontFamily: fonts.extrabold,
    color: c.textPrimary,
    textAlign: "center",
  },
  loginPromptText: {
    marginTop: spacing.sm,
    textAlign: "center",
    color: c.textSecondary,
    fontSize: typography.body,
    fontFamily: fonts.regular,
    lineHeight: 22,
    marginBottom: spacing.lg,
  },
});
}
