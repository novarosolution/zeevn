import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useFocusEffect } from "@react-navigation/native";
import {
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import BottomNavBar from "../components/BottomNavBar";
import CustomerScreenShell from "../components/CustomerScreenShell";
import KankregUnifiedPageHeader from "../components/kankreg/KankregUnifiedPageHeader";
import KankregCustomerPageHeader from "../components/kankreg/KankregCustomerPageHeader";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { useOrderCelebration } from "../context/OrderCelebrationContext";
import {
  createOrderRequest,
  validateCouponRequest} from "../services/orderService";
import { getCurrentAddressFromGPS } from "../services/locationService";
import { useTheme } from "../context/ThemeContext";
import {
  customerPanel,
  customerScrollFill,
  FIGMA_STICKY_FOOTER_HEIGHT,
} from "../theme/screenLayout";
import { fonts, layout, radius, semanticRadius, spacing, typography } from "../theme/tokens";
import { formatINR } from "../utils/currency";
import { BRAND_LOGO_SIZE } from "../constants/brand";
import BrandLogo from "../components/BrandLogo";
import { FONT_HEADING, FONT_BODY_SEMIBOLD, FONT_PRICE } from "../theme/typographyRoles";
import { ALCHEMY } from "../theme/customerAlchemy";
import PremiumEmptyState from "../components/ui/PremiumEmptyState";
import PremiumCard from "../components/ui/PremiumCard";
import GoldHairline from "../components/ui/GoldHairline";
import SectionReveal from "../components/motion/SectionReveal";
import { staggerDelay } from "../theme/motion";
import { CART_ADDRESS, CART_UI } from "../content/appContent";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming} from "react-native-reanimated";
import useReducedMotion from "../hooks/useReducedMotion";
import PaymentMethodSelector from "../components/payments/PaymentMethodSelector";
import { useKankregLayout } from "../theme/kankregBreakpoints";
import KankregSplitLayout from "../components/kankreg/KankregSplitLayout";
import KankregScrollPage from "../components/kankreg/KankregScrollPage";
import { getKankregChromeTop } from "../components/kankreg/KankregSiteHeader";
import {
  getPublicRazorpayKeyId,
  loadRazorpayWebSdk,
  openRazorpayCheckout,
  verifyOrderPayment} from "../services/paymentService";
import KankregCartRow from "../components/kankreg/KankregCartRow";
import KankregCartCouponStrip from "../components/kankreg/KankregCartCouponStrip";
import KankregCartPayBar from "../components/kankreg/KankregCartPayBar";
import KankregCartSummaryCard from "../components/kankreg/KankregCartSummaryCard";
import KankregCheckoutForm from "../components/kankreg/KankregCheckoutForm";
import KankregCheckoutSectionCard from "../components/kankreg/KankregCheckoutSectionCard";
import KankregCheckoutSteps from "../components/kankreg/KankregCheckoutSteps";
import { FIGMA } from "../theme/figmaApp";
import { cartLineKey } from "../utils/productCart";

/** Same required fields as ManageAddressScreen save. */
function getProfileAddressCompletion(defaultAddress) {
  const a = defaultAddress && typeof defaultAddress === "object" ? defaultAddress : {};
  const houseNumber = String(a.houseNumber || "").trim();
  const line1 = String(a.line1 || "").trim();
  const city = String(a.city || "").trim();
  const postalCode = String(a.postalCode || "").trim();
  const complete = Boolean(line1 && city && postalCode);
  const any = Boolean(houseNumber || line1 || city || postalCode);
  return { complete, partial: any && !complete };
}

export default function CartScreen({ navigation, route }) {
  const { cartItems, totalAmount, totalItems, addToCart, removeFromCart, removeLineFromCart, clearCart } = useCart();
  const { isAuthenticated, token, user } = useAuth();
  const { showOrderConfirmed } = useOrderCelebration();
  const { toastSuccess } = useToast();
  const isCheckoutFlow = route?.name === "Checkout" || route?.params?.flow === "checkout";
  const { useSplitLayout, isXs } = useKankregLayout();
  const kankregWebSplit = useSplitLayout;
  const isCompact = isXs;
  const isDesktop = useSplitLayout;
  const reducedMotion = useReducedMotion();
  const isNativeApp = Platform.OS !== "web";
  const isCartBagView = !isCheckoutFlow && (isNativeApp || kankregWebSplit);
  const showCheckoutDetails = isCheckoutFlow || (!kankregWebSplit && !isNativeApp);
  const figmaStickyPay = cartItems.length > 0 && (isNativeApp || !kankregWebSplit);
  const checkoutPulse = useSharedValue(0);
  const checkoutPulseStyle = useAnimatedStyle(() => ({
    opacity: 0.18 + checkoutPulse.value * 0.55,
    transform: [{ scale: 1 + checkoutPulse.value * 0.04 }]}));
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [addressType, setAddressType] = useState("Home");
  const [houseNumber, setHouseNumber] = useState("");
  const [line1, setLine1] = useState("");
  const [landmark, setLandmark] = useState("");
  const [city, setCity] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [country, setCountry] = useState("");
  const [latitude, setLatitude] = useState(null);
  const [longitude, setLongitude] = useState(null);
  const [note, setNote] = useState("");
  const [error, setError] = useState("");
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  /** `"Razorpay"` | `"Cash on Delivery"` — must match backend `Order.paymentMethod`. */
  const [paymentMethod, setPaymentMethod] = useState("Razorpay");
  const [fieldErrors, setFieldErrors] = useState({});

  useEffect(() => {
    if (reducedMotion || cartItems.length === 0 || isPlacingOrder) {
      checkoutPulse.value = 0;
      return undefined;
    }
    checkoutPulse.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 1100, easing: Easing.bezier(0.22, 1, 0.36, 1) }),
        withTiming(0, { duration: 1100, easing: Easing.bezier(0.65, 0, 0.35, 1) }),
      ),
      -1,
      false,
    );
  }, [reducedMotion, cartItems.length, isPlacingOrder, checkoutPulse]);

  useEffect(() => {
    setFullName(user?.name || "");
    setPhone(user?.phone || "");
    setAddressType(user?.defaultAddress?.addressType || "Home");
    setHouseNumber(user?.defaultAddress?.houseNumber || "");
    setLine1(user?.defaultAddress?.line1 || "");
    setLandmark(user?.defaultAddress?.landmark || "");
    setCity(user?.defaultAddress?.city || "");
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
    if (!appliedCoupon) return;
    const minSubtotal = Number(appliedCoupon.minSubtotal || 0);
    if (minSubtotal > 0 && totalAmount < minSubtotal) {
      setAppliedCoupon(null);
    }
  }, [appliedCoupon, totalAmount]);

  useFocusEffect(
    useCallback(() => {
      const raw = route?.params?.prefillCoupon;
      if (!raw || !isAuthenticated || !token) {
        return undefined;
      }
      const normalized = String(raw).trim().toUpperCase();
      let cancelled = false;
      (async () => {
        try {
          setError("");
          const result = await validateCouponRequest(token, normalized, totalAmount);
          if (cancelled) return;
          setAppliedCoupon(result.coupon || null);
          setCouponCode(normalized);
          toastSuccess(result.message || "Coupon applied.", { title: "Coupon applied" });
          navigation.setParams({ prefillCoupon: undefined });
        } catch (err) {
          if (!cancelled) {
            setCouponCode(normalized);
            setAppliedCoupon(null);
            setError(err.message || "Unable to apply coupon.");
            navigation.setParams({ prefillCoupon: undefined });
          }
        }
      })();
      return () => {
        cancelled = true;
      };
    }, [route?.params?.prefillCoupon, isAuthenticated, token, totalAmount, navigation, toastSuccess])
  );

  const { colors: c, shadowLift, shadowPremium, isDark } = useTheme();
  const styles = useMemo(() => createCartStyles(c, shadowLift, shadowPremium, isDark), [c, shadowLift, shadowPremium, isDark]);

  const profileAddress = useMemo(() => getProfileAddressCompletion(user?.defaultAddress), [user?.defaultAddress]);

  if (!isAuthenticated) {
    return (
      <CustomerScreenShell style={styles.screen}>
        <KankregScrollPage
          scrollVariant="inner"
          style={customerScrollFill}
          showFooter={false}
          stickyFooterExtra={figmaStickyPay ? FIGMA_STICKY_FOOTER_HEIGHT : 0}
        >
          <KankregCustomerPageHeader
            navigation={navigation}
            eyebrow={CART_UI.pageEyebrow}
            title={CART_UI.pageTitle}
            showBack={false}
            figmaOnWeb
          />
          <View style={styles.loginCard}>
            <BrandLogo height={BRAND_LOGO_SIZE.footerCompact} style={styles.loginBrandLogo} />
            <PremiumEmptyState
              iconName="bag-handle-outline"
              title={CART_UI.loginTitle}
              description={CART_UI.loginDescription}
              ctaLabel={CART_UI.loginCta}
              ctaIconLeft="log-in-outline"
              onCtaPress={() => navigation.navigate("Login")}
              secondaryCtaLabel={CART_UI.browseGuestCta}
              onSecondaryCtaPress={() => navigation.navigate("Home")}
            />
          </View>
        </KankregScrollPage>
        <BottomNavBar />
      </CustomerScreenShell>
    );
  }

  const renderCartItem = (item, index = 0) => {
    const lineKey = cartLineKey(item);
    const row = (
      <KankregCartRow
        item={item}
        index={index}
        onDecrease={() => removeFromCart(item.id, item.variantLabel)}
        onIncrease={() => addToCart(item)}
        onRemove={() => removeLineFromCart(item.id, item.variantLabel)}
      />
    );

    if (Platform.OS === "web" && !reducedMotion) {
      return (
        <SectionReveal key={lineKey} delay={staggerDelay(index)}>
          {row}
        </SectionReveal>
      );
    }

    return <React.Fragment key={lineKey}>{row}</React.Fragment>;
  };

  const validateAddress = () => {
    const nextErrors = {
      fullName: fullName.trim() ? "" : "Full name is required.",
      phone: phone.trim() ? "" : "Mobile number is required.",
      houseNumber: houseNumber.trim() ? "" : "House / flat number is required.",
      line1: line1.trim() ? "" : "Street / area is required.",
      city: city.trim() ? "" : "City is required.",
      postalCode: postalCode.trim() ? "" : "Pincode is required.",
    };
    setFieldErrors(nextErrors);
    if (Object.values(nextErrors).some(Boolean)) {
      setError("Please complete the required delivery fields.");
      return false;
    }
    setError("");
    return true;
  };

  const handleUseSavedAddress = () => {
    const a = user?.defaultAddress;
    if (!a) return;
    setAddressType(a.addressType || "Home");
    setHouseNumber(a.houseNumber || "");
    setLine1(a.line1 || "");
    setLandmark(a.landmark || "");
    setCity(a.city || "");
    setPostalCode(a.postalCode || "");
    setCountry(a.country || "India");
    setLatitude(Number.isFinite(Number(a.latitude)) ? Number(a.latitude) : null);
    setLongitude(Number.isFinite(Number(a.longitude)) ? Number(a.longitude) : null);
    setFieldErrors({});
    toastSuccess("Saved address applied.", { title: "Address loaded" });
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

      const created = await createOrderRequest(token, {
        products: cartItems.map((item) => ({
          product: item.id,
          id: item.id,
          name: item.name,
          price: item.price,
          image: item.image || "",
          quantity: item.quantity,
          variantLabel: item.variantLabel || ""})),
        shippingAddress: {
          fullName: fullName.trim(),
          phone: phone.trim(),
          addressType: addressType || "Home",
          houseNumber: houseNumber.trim(),
          line1: line1.trim(),
          landmark: landmark.trim(),
          city: city.trim(),
          postalCode: postalCode.trim(),
          country: country.trim() || "India",
          latitude,
          longitude,
          note: note.trim()},
        paymentMethod,
        couponCode: appliedCoupon?.code || ""});

      clearCart();

      if (paymentMethod === "Cash on Delivery") {
        showOrderConfirmed(created);
        return;
      }

      const orderId = created?._id || created?.id;
      const keyId = created?.razorpayKeyId || getPublicRazorpayKeyId();
      if (!orderId) {
        throw new Error("Order created but response was incomplete. Check My Orders.");
      }
      if (Platform.OS === "web") {
        await loadRazorpayWebSdk();
      }

      const checkout = await openRazorpayCheckout({
        order: created,
        razorpayKeyId: keyId,
        user,
        themeColor: c.primary});

      if (checkout.status === "success" && checkout.payload) {
        const p = checkout.payload;
        const verified = await verifyOrderPayment(token, orderId, {
          razorpay_order_id: p.razorpay_order_id,
          razorpay_payment_id: p.razorpay_payment_id,
          razorpay_signature: p.razorpay_signature});
        showOrderConfirmed(verified || created);
        return;
      }

      if (checkout.status === "fallback") {
        toastSuccess("Finish payment to confirm your order—then check My Orders.", { title: "Almost done" });
      } else {
        toastSuccess("Resume payment from My Orders within 30 minutes.", { title: "Payment pending" });
      }
      navigation.navigate("MyOrders");
    } catch (err) {
      setError(err.message || "Unable to place order.");
    } finally {
      setIsPlacingOrder(false);
    }
  };

  const handleApplyCoupon = async () => {
    try {
      setError("");
      const normalized = String(couponCode || "").trim().toUpperCase();
      if (!normalized) {
        setError("Enter coupon code.");
        return;
      }
      const result = await validateCouponRequest(token, normalized, totalAmount);
      setAppliedCoupon(result.coupon || null);
      setCouponCode(normalized);
      toastSuccess(result.message || "Coupon applied.", { title: "Coupon applied" });
    } catch (err) {
      setAppliedCoupon(null);
      setError(err.message || "Unable to apply coupon.");
    }
  };

  const deliveryFee = 0;
  const platformFee = 1.2;
  const discountAmount = Number(appliedCoupon?.discountAmount || 0);
  const payableAmount = Math.max(0, totalAmount + deliveryFee + platformFee - discountAmount);
  const isRazorpayMethod = paymentMethod === "Razorpay";
  const primaryCtaLabel = isCartBagView
    ? CART_UI.checkoutCtaArrow
    : isRazorpayMethod
      ? `${CART_UI.payCta} · ${formatINR(payableAmount)}`
      : CART_UI.placeOrderCta;

  const handlePrimaryCta = () => {
    if (isCartBagView) {
      navigation.navigate("Checkout");
      return;
    }
    handlePlaceOrder();
  };

  const cartEyebrow =
    cartItems.length > 0
      ? `Your bag · ${totalItems} item${totalItems === 1 ? "" : "s"}`
      : CART_UI.pageEyebrow;

  const appliedCouponText = appliedCoupon
    ? `−${formatINR(appliedCoupon.discountAmount || 0)}`
    : "";

  const handleUseCurrentLocation = async () => {
    try {
      setIsDetectingLocation(true);
      setError("");
      const address = await getCurrentAddressFromGPS();
      if (address.line1) setLine1(address.line1);
      if (address.city) setCity(address.city);
      if (address.postalCode) setPostalCode(address.postalCode);
      if (address.country) setCountry(address.country);
      if (Number.isFinite(Number(address.latitude))) setLatitude(Number(address.latitude));
      if (Number.isFinite(Number(address.longitude))) setLongitude(Number(address.longitude));
      toastSuccess(CART_ADDRESS.gpsFillSuccess, { title: "Location added" });
    } catch (err) {
      setError(err.message || "Unable to get current location.");
    } finally {
      setIsDetectingLocation(false);
    }
  };

  return (
    <CustomerScreenShell style={styles.screen}>
      <KankregScrollPage
        scrollVariant="inner"
        style={styles.scrollFill}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        stickyFooterExtra={figmaStickyPay ? FIGMA_STICKY_FOOTER_HEIGHT : 0}
      >
        {isCheckoutFlow && kankregWebSplit ? (
          <KankregUnifiedPageHeader
            navigation={navigation}
            title={CART_UI.checkoutTitle}
            showBack
            onBack={() => navigation.navigate("Cart")}
            showBrand={false}
            showLocation={false}
          />
        ) : (
          <KankregCustomerPageHeader
            eyebrow={isCheckoutFlow ? undefined : cartEyebrow}
            title={isCheckoutFlow ? CART_UI.checkoutTitle : CART_UI.pageTitle}
            navigation={navigation}
            showBack={false}
            figmaOnWeb
          />
        )}
        {isCheckoutFlow ? <KankregCheckoutSteps active={2} /> : null}

        <KankregSplitLayout
          asideStyle={isDesktop ? styles.cartRightCol : undefined}
          main={
        <>

        {(!kankregWebSplit || !isCheckoutFlow) && cartItems.length === 0 ? (
          <SectionReveal index={0} preset="scale-in">
          <View style={styles.emptyCard}>
            <BrandLogo height={BRAND_LOGO_SIZE.footerCompact} style={styles.emptyBrandLogo} />
            <PremiumEmptyState
              iconName="cart-outline"
              title={CART_UI.emptyTitle}
              description={CART_UI.emptyDescription}
              ctaLabel={CART_UI.browseCta}
              ctaIconLeft="storefront-outline"
              onCtaPress={() => navigation.navigate(Platform.OS === "web" ? "Shop" : "Home")}
            />
          </View>
          </SectionReveal>
        ) : (!kankregWebSplit || !isCheckoutFlow) ? (
          <>
            <View style={styles.bagHeader}>
              <View style={styles.bagHeaderTop}>
                <Text style={styles.itemsSectionLabel}>{CART_UI.itemsSectionLabel}</Text>
                <Text style={styles.bagSubtotalPreview}>{formatINR(totalAmount)}</Text>
              </View>
              <View style={styles.trustStripInline}>
                <Ionicons name="shield-checkmark-outline" size={14} color={isDark ? c.primaryBright : "#3C6248"} />
                <Text style={styles.trustStripText}>{CART_UI.trustLine}</Text>
              </View>
            </View>
            <View style={[styles.listSection, styles.figmaListSection]}>
              {cartItems.map((item, idx) => renderCartItem(item, idx))}
            </View>
            {isCartBagView ? (
              <View style={styles.figmaCouponWrap}>
                <KankregCartCouponStrip
                  value={couponCode}
                  onChangeText={setCouponCode}
                  onApply={handleApplyCoupon}
                  appliedLabel={appliedCouponText}
                />
              </View>
            ) : null}
          </>
        ) : null}

        {cartItems.length > 0 && isCheckoutFlow && kankregWebSplit ? <GoldHairline marginVertical={spacing.md} /> : null}

        {showCheckoutDetails && (!kankregWebSplit || isCheckoutFlow) ? (
          <KankregCheckoutForm
            fullName={fullName}
            onFullNameChange={setFullName}
            phone={phone}
            onPhoneChange={setPhone}
            addressType={addressType}
            onAddressTypeChange={setAddressType}
            houseNumber={houseNumber}
            onHouseNumberChange={setHouseNumber}
            line1={line1}
            onLine1Change={setLine1}
            landmark={landmark}
            onLandmarkChange={setLandmark}
            city={city}
            onCityChange={setCity}
            postalCode={postalCode}
            onPostalCodeChange={setPostalCode}
            country={country}
            onCountryChange={setCountry}
            note={note}
            onNoteChange={setNote}
            error={error}
            onDismissError={() => setError("")}
            fieldErrors={fieldErrors}
            isDetectingLocation={isDetectingLocation}
            onUseGps={handleUseCurrentLocation}
            onUseSavedAddress={handleUseSavedAddress}
            hasSavedAddress={profileAddress.complete}
            isCompact={isCompact}
          />
        ) : null}

        {showCheckoutDetails && (!kankregWebSplit || isCheckoutFlow) && cartItems.length > 0 ? (
          <KankregCheckoutSectionCard title="Payment">
            <PaymentMethodSelector
              value={paymentMethod}
              onChange={setPaymentMethod}
              disabled={isPlacingOrder}
              embedded
              compact
            />
          </KankregCheckoutSectionCard>
        ) : null}

        </>
          }
          aside={
        <>
        {kankregWebSplit && !isCheckoutFlow ? (
          <KankregCartSummaryCard
            subtotal={totalAmount}
            discount={discountAmount}
            discountLabel={appliedCoupon?.code ? `Coupon ${appliedCoupon.code}` : undefined}
            platformFee={platformFee}
            total={payableAmount}
            ctaLabel={primaryCtaLabel}
            onPress={handlePrimaryCta}
            disabled={cartItems.length === 0}
            loading={isPlacingOrder}
            showCoupon
            couponCode={couponCode}
            onCouponChange={setCouponCode}
            onApplyCoupon={handleApplyCoupon}
            appliedCouponText={appliedCouponText}
            itemCount={totalItems}
          />
        ) : !figmaStickyPay ? (
        <PremiumCard variant="muted" padding="md" style={styles.summaryCardWrap}>
          {kankregWebSplit ? (
            <Text style={styles.summarySerifTitle}>
              {isCheckoutFlow ? "Order total" : "Order summary"}
            </Text>
          ) : null}
          <View style={styles.summaryInner}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>{CART_UI.stickySubtotalLabel}</Text>
              <Text style={styles.summaryValue}>{formatINR(totalAmount)}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>{CART_UI.shippingLabel}</Text>
              <Text style={styles.shippingFree}>{CART_UI.shippingFree}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>{CART_UI.serviceFeeLabel}</Text>
              <Text style={styles.summaryValue}>{formatINR(platformFee)}</Text>
            </View>
            {discountAmount > 0 ? (
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Discount</Text>
                <Text style={styles.summaryDiscountValue}>- {formatINR(discountAmount)}</Text>
              </View>
            ) : null}
            <View style={[styles.summaryDivider, { backgroundColor: c.border }]} />
            <Text style={styles.totalAmountLabel}>{CART_UI.totalLabel}</Text>
            <View style={styles.totalAmountRow}>
              <Text style={[styles.totalAmountSerif, { color: isDark ? c.textPrimary : ALCHEMY.brown }]}>{formatINR(payableAmount)}</Text>
              <View style={styles.inrBadge}>
                <Text style={styles.inrBadgeText}>INR</Text>
              </View>
            </View>
          </View>
        </PremiumCard>
        ) : null}

        {!figmaStickyPay && !(kankregWebSplit && !isCheckoutFlow) ? (
        <View style={styles.cartCtaDock}>
          <View style={styles.checkoutCtaWrap}>
            {cartItems.length > 0 && !isPlacingOrder && !reducedMotion ? (
              <Animated.View style={[styles.checkoutPulseGlow, checkoutPulseStyle, styles.peNone]} />
            ) : null}
            <TouchableOpacity
              activeOpacity={0.92}
              onPress={handlePrimaryCta}
              disabled={cartItems.length === 0 || isPlacingOrder}
              style={styles.checkoutGradientWrap}
              accessibilityRole="button"
              accessibilityLabel={primaryCtaLabel}
            >
              {cartItems.length === 0 || isPlacingOrder ? (
                <View style={[styles.checkoutGradientBtn, styles.checkoutGradientMuted]}>
                  <Text style={styles.checkoutGradientText}>
                    {cartItems.length === 0 ? "ADD ITEMS TO CONTINUE" : "PLACING ORDER…"}
                  </Text>
                </View>
              ) : (
                <LinearGradient
                  colors={["#788844", "#244424", "#244424"]}
                  locations={[0, 0.45, 1]}
                  start={{ x: 0, y: 0.5 }}
                  end={{ x: 1, y: 0.5 }}
                  style={styles.checkoutGradientBtn}
                >
                  <View style={styles.checkoutCtaInner}>
                    <Text style={[styles.checkoutGradientText, styles.checkoutGradientTextShrink]}>{primaryCtaLabel}</Text>
                    <View style={styles.checkoutArrowCircle}>
                      <Ionicons name="arrow-forward" size={17} color="#5C3D12" />
                    </View>
                  </View>
                </LinearGradient>
              )}
            </TouchableOpacity>
          </View>
        </View>
        ) : null}
        </>
          }
        />
</KankregScrollPage>
      {figmaStickyPay ? (
        <KankregCartPayBar
          mode="sticky"
          subtotal={totalAmount}
          discount={discountAmount}
          discountLabel={appliedCoupon?.code ? `Coupon ${appliedCoupon.code}` : undefined}
          total={payableAmount}
          ctaLabel={primaryCtaLabel}
          onPress={handlePrimaryCta}
          disabled={cartItems.length === 0}
          loading={isPlacingOrder}
          itemCount={totalItems}
        />
      ) : null}
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
    maxWidth: Platform.select({ web: layout.maxContentWidth + 96, default: "100%" })},
  scrollFill: {
    flex: 1,
    width: "100%"},
  cartGridRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.xl + 4},
  cartLeftCol: {
    flex: 1,
    minWidth: 0},
  cartRightCol: {
    width: 360,
    flexShrink: 0,
    ...Platform.select({
      web: {
        position: "sticky",
        top: getKankregChromeTop() + spacing.xl + 2,
        alignSelf: "flex-start"},
      default: {}})},
  addressBoxInner: {
    gap: spacing.sm},
  summaryMetaLine: {
    fontSize: typography.bodySmall,
    fontFamily: fonts.medium,
    marginBottom: spacing.sm},
  stickyPayBar: {
    position: "absolute",
    left: spacing.md,
    right: spacing.md,
    zIndex: 40,
    padding: spacing.sm,
    borderRadius: radius.lg,
    backgroundColor: isDark ? "rgba(28, 25, 23, 0.94)" : "rgba(255, 252, 248, 0.96)",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: c.border,
    ...shadowPremium},
  selectionCard: {
    backgroundColor: isDark ? c.surface : ALCHEMY.cardBg,
    borderRadius: radius.xxl,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: isDark ? "rgba(52, 211, 153, 0.14)" : ALCHEMY.pillInactive,
    borderTopWidth: 3,
    borderTopColor: isDark ? c.primaryBorder : ALCHEMY.gold,
    marginBottom: spacing.md,
    overflow: "hidden",
    ...shadowPremium,
    ...Platform.select({
      ios: {
        shadowColor: isDark ? "#E8C85A" : "#3D2A12",
        shadowOpacity: isDark ? 0.12 : 0.08,
        shadowRadius: isDark ? 16 : 14},
      android: { elevation: isDark ? 4 : 3 },
      default: {}})},
  selectionCardRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.sm,
    padding: spacing.md},
  selectionCardRowStack: {
    flexDirection: "column",
    gap: 0,
    padding: 0},
  selectionThumb: {
    width: 100,
    height: 100,
    borderRadius: radius.lg,
    backgroundColor: isDark ? c.surfaceMuted : "#FFFFFF",
    overflow: "hidden"},
  selectionThumbStack: {
    width: "100%",
    height: 148,
    borderRadius: 0,
    borderTopLeftRadius: radius.xxl,
    borderTopRightRadius: radius.xxl},
  selectionImagePlaceholder: {
    alignItems: "center",
    justifyContent: "center"},
  selectionBody: {
    flex: 1,
    minWidth: 0,
    paddingVertical: spacing.xs,
    paddingRight: spacing.sm,
    paddingLeft: 0},
  selectionBodyStack: {
    paddingLeft: spacing.md,
    paddingRight: spacing.md,
    paddingBottom: spacing.md,
    paddingTop: spacing.sm},
  selectionTitleRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: spacing.md,
    marginBottom: spacing.xs},
  selectionName: {
    flex: 1,
    fontFamily: FONT_BODY_SEMIBOLD,
    fontSize: typography.h3,
    color: c.textPrimary,
    lineHeight: 26},
  selectionPrice: {
    fontFamily: FONT_PRICE,
    fontSize: typography.h3,
    color: isDark ? c.textPrimary : ALCHEMY.brown,
    fontVariant: ["tabular-nums"]},
  selectionDesc: {
    fontSize: typography.caption,
    fontFamily: fonts.regular,
    color: c.textSecondary,
    lineHeight: 18,
    marginBottom: spacing.sm},
  sizeBadge: {
    alignSelf: "flex-start",
    backgroundColor: isDark ? c.surfaceMuted : "#FFF",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.pill,
    marginBottom: spacing.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: c.border},
  sizeBadgeText: {
    fontSize: 10,
    fontFamily: fonts.bold,
    color: c.textMuted,
    letterSpacing: 0.6},
  selectionActionsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between"},
  qtyPillBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: isDark ? c.surfaceMuted : "#FFF",
    borderRadius: semanticRadius.full,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: c.border,
    paddingHorizontal: 4},
  qtyPillHit: {
    width: 38,
    height: 38,
    alignItems: "center",
    justifyContent: "center"},
  qtyPillNum: {
    minWidth: 28,
    textAlign: "center",
    fontFamily: fonts.bold,
    fontSize: typography.body,
    color: c.textPrimary},
  removeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 8,
    paddingLeft: 8},
  removeRowText: {
    fontSize: 11,
    fontFamily: fonts.bold,
    letterSpacing: 0.8,
    color: isDark ? c.textMuted : ALCHEMY.brownMuted},
  upsellSection: {
    backgroundColor: isDark ? c.surface : ALCHEMY.cardBg,
    borderRadius: radius.xl,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: isDark ? c.border : ALCHEMY.pillInactive,
    borderTopWidth: 2,
    borderTopColor: isDark ? c.primaryBorder : ALCHEMY.gold,
    padding: spacing.md,
    marginBottom: spacing.lg,
    ...shadowLift},
  upsellRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    backgroundColor: isDark ? c.surfaceMuted : "#FFFFFF",
    borderRadius: radius.lg,
    padding: spacing.sm,
    marginBottom: spacing.sm,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: isDark ? c.border : ALCHEMY.pillInactive},
  upsellThumb: {
    width: 72,
    height: 72,
    borderRadius: 12,
    backgroundColor: c.surfaceMuted},
  upsellMeta: {
    flex: 1,
    minWidth: 0},
  upsellName: {
    fontFamily: FONT_BODY_SEMIBOLD,
    fontSize: typography.bodySmall,
    color: c.textPrimary,
    lineHeight: 20},
  upsellPrice: {
    marginTop: 4,
    fontFamily: fonts.bold,
    fontSize: typography.bodySmall,
    color: c.textPrimary},
  upsellAdd: {
    marginTop: spacing.sm,
    alignSelf: "flex-start"},
  upsellAddText: {
    fontSize: 11,
    fontFamily: fonts.extrabold,
    letterSpacing: 1,
    color: isDark ? c.primaryBright : ALCHEMY.brown,
    textDecorationLine: "underline"},
  summaryCardWrap: {
    marginBottom: spacing.lg,
    alignSelf: "stretch"},
  summarySerifTitle: {
    fontFamily: FONT_HEADING,
    fontSize: 22,
    color: isDark ? c.textPrimary : ALCHEMY.brown,
    marginBottom: spacing.md},
  shippingFree: {
    fontFamily: fonts.bold,
    fontSize: typography.bodySmall,
    color: isDark ? c.primaryBright : "#C9A227"},
  totalAmountLabel: {
    fontSize: 10,
    fontFamily: fonts.bold,
    letterSpacing: 1.2,
    color: c.textMuted,
    marginTop: spacing.sm,
    marginBottom: spacing.xs},
  totalAmountRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginBottom: spacing.md},
  totalAmountSerif: {
    fontFamily: FONT_PRICE,
    fontSize: 28,
    letterSpacing: -0.3,
    fontVariant: ["tabular-nums"]},
  inrBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: c.border,
    backgroundColor: isDark ? c.surfaceMuted : "#FFF"},
  inrBadgeText: {
    fontSize: 10,
    fontFamily: fonts.bold,
    color: c.textMuted,
    letterSpacing: 0.5},
  summaryPaymentHint: {
    marginTop: spacing.sm,
    fontFamily: fonts.semibold,
    fontSize: typography.caption,
    lineHeight: 18},
  summaryPaymentHintOnline: {
    color: c.primary},
  summaryPaymentHintCod: {
    color: c.secondaryDark},
  summaryTrustRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: c.border},
  summaryTrustItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4},
  summaryTrustText: {
    fontSize: 9,
    fontFamily: fonts.bold,
    letterSpacing: 0.5,
    color: c.textMuted},
  cartCtaDock: {
    marginTop: spacing.md,
    paddingTop: spacing.lg + 4,
    paddingBottom: spacing.lg,
    paddingHorizontal: spacing.md,
    borderRadius: radius.xxl,
    overflow: "hidden",
    borderWidth: isDark ? StyleSheet.hairlineWidth : StyleSheet.hairlineWidth * 2,
    borderTopWidth: isDark ? StyleSheet.hairlineWidth : 3,
    borderColor: isDark ? "rgba(52, 211, 153, 0.18)" : "rgba(138, 90, 18, 0.18)",
    borderTopColor: isDark ? "rgba(52, 211, 153, 0.18)" : ALCHEMY.gold,
    backgroundColor: isDark ? "rgba(14, 12, 10, 0.88)" : "rgba(255, 251, 244, 0.96)",
    ...Platform.select({
      ios: {
        shadowColor: isDark ? "#000" : "#3D2A12",
        shadowOffset: { width: 0, height: 14 },
        shadowOpacity: isDark ? 0.4 : 0.12,
        shadowRadius: 22},
      android: { elevation: isDark ? 10 : 6 },
      web: {
        boxShadow: isDark
          ? "0 24px 48px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255, 230, 170, 0.08)"
          : "0 24px 48px rgba(22, 69, 51, 0.14), inset 0 1px 0 rgba(255, 253, 251, 0.9)"},
      default: {}}),
    gap: spacing.sm + 4},
  checkoutCtaWrap: {
    position: "relative",
    marginTop: 0},
  checkoutPulseGlow: {
    position: "absolute",
    top: -8,
    left: -4,
    right: -4,
    bottom: -8,
    borderRadius: semanticRadius.full,
    backgroundColor: isDark ? "rgba(52, 211, 153, 0.42)" : "rgba(199, 154, 58, 0.4)",
    ...Platform.select({
      web: { filter: "blur(22px)" },
      default: {}}),
    zIndex: -1},
  checkoutGradientWrap: {
    marginBottom: 0,
    borderRadius: semanticRadius.full,
    overflow: "hidden",
    ...Platform.select({
      web: {
        boxShadow: isDark
          ? "0 16px 36px rgba(0,0,0,0.55), 0 4px 12px rgba(52, 211, 153, 0.12)"
          : "0 14px 28px rgba(22, 69, 51, 0.22)"},
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: isDark ? 0.4 : 0.18,
        shadowRadius: 18},
      android: { elevation: isDark ? 8 : 6 },
      default: {}})},
  checkoutGradientBtn: {
    minHeight: 54,
    paddingVertical: 16,
    paddingHorizontal: spacing.lg + 2,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: semanticRadius.full,
    borderWidth: 1,
    borderColor: isDark ? "rgba(255, 240, 200, 0.35)" : "rgba(255, 252, 248, 0.5)"},
  checkoutCtaInner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    width: "100%",
    paddingHorizontal: 4},
  checkoutArrowCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: c.onPrimary,
    alignItems: "center",
    justifyContent: "center",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.15,
        shadowRadius: 2},
      android: { elevation: 2 },
      default: {}})},
  checkoutGradientMuted: {
    backgroundColor: c.textMuted},
  checkoutGradientText: {
    color: c.onPrimary,
    fontFamily: fonts.extrabold,
    fontSize: typography.bodySmall + 1,
    letterSpacing: 1.35},
  checkoutGradientTextShrink: {
    flexShrink: 1,
    textAlign: "center",
    fontSize: typography.bodySmall,
    letterSpacing: 0.8},
  continueExploreWrap: {
    alignSelf: "stretch",
    alignItems: "center",
    marginBottom: 0,
    paddingVertical: 2},
  continueExploreWrapPressed: {
    opacity: 0.88,
    transform: [{ scale: 0.992 }]},
  continueExploreInner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    minHeight: 48,
    paddingHorizontal: spacing.lg,
    paddingVertical: 12,
    alignSelf: "stretch",
    borderRadius: semanticRadius.full,
    borderWidth: StyleSheet.hairlineWidth * 2,
    borderColor: isDark ? "rgba(52, 211, 153, 0.62)" : "rgba(138, 90, 18, 0.5)",
    backgroundColor: isDark ? "rgba(52, 211, 153, 0.08)" : "rgba(255, 251, 244, 1)"},
  continueExploreInnerHover: Platform.select({
    web: {
      backgroundColor: isDark ? "rgba(52, 211, 153, 0.14)" : "rgba(255, 244, 224, 1)"},
    default: {}}),
  continueExploreText: {
    fontSize: 12,
    fontFamily: fonts.extrabold,
    letterSpacing: 1.35,
    color: isDark ? ALCHEMY.gold : ALCHEMY.brown,
    textDecorationLine: "none"},
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
    ...shadowLift},
  progressStep: {
    flex: 1,
    alignItems: "center",
    gap: 6},
  progressTrackSeg: {
    width: "100%",
    height: 4,
    borderRadius: radius.pill,
    backgroundColor: c.border,
    maxWidth: 72},
  progressTrackSegActive: {
    backgroundColor: c.primary},
  progressLabel: {
    fontSize: 10,
    fontFamily: fonts.semibold,
    color: c.textMuted,
    textAlign: "center"},
  progressLabelActive: {
    color: c.primaryDark,
    fontFamily: fonts.bold},
  trustStrip: {
    marginBottom: spacing.md,
    borderRadius: radius.xxl,
    borderWidth: 1,
    borderColor: c.border,
    backgroundColor: c.surfaceMuted,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm},
  trustRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: spacing.md,
    paddingVertical: spacing.xs},
  trustItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6},
  trustText: {
    fontSize: 12,
    fontFamily: fonts.medium,
    color: c.textSecondary},
  loginCard: {
    ...customerPanel(c, shadowPremium, isDark),
    padding: spacing.xl,
    alignItems: "center"},
  loginBrandLogo: {
    marginBottom: spacing.sm},
  loginIconWrap: {
    width: 56,
    height: 56,
    borderRadius: radius.pill,
    backgroundColor: c.primarySoft,
    borderWidth: 1,
    borderColor: c.primaryBorder,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.md},
  cartHeroIcon: {
    width: 44,
    height: 44,
    borderRadius: radius.pill,
    backgroundColor: c.surface,
    borderWidth: 1,
    borderColor: c.primaryBorder,
    alignItems: "center",
    justifyContent: "center"},
  cartHero: {
    ...customerPanel(c, shadowPremium, isDark),
    marginBottom: spacing.md,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.md},
  cartHeroTextBlock: {
    flex: 1},
  cartHeroEyebrow: {
    fontSize: typography.overline,
    fontFamily: fonts.semibold,
    color: c.textMuted,
    letterSpacing: 1,
    textTransform: "uppercase",
    marginBottom: 4},
  cartHeroTitle: {
    color: c.primaryDark,
    fontSize: typography.h3,
    fontFamily: fonts.extrabold},
  cartHeroAccent: {
    width: 44,
    height: 3,
    borderRadius: radius.pill,
    marginTop: spacing.sm,
    marginBottom: spacing.xs},
  cartHeroSubtitle: {
    marginTop: 0,
    color: c.textSecondary,
    fontSize: typography.bodySmall,
    fontFamily: fonts.semibold,
    lineHeight: 20},
  itemsSectionLabel: {
    fontSize: typography.overline,
    fontFamily: fonts.bold,
    color: c.textMuted,
    letterSpacing: 0.6,
    textTransform: "uppercase",
    marginBottom: spacing.sm},
  listSection: {
    marginBottom: spacing.md},
  nativeListSection: {
    paddingHorizontal: FIGMA.gutter,
    paddingBottom: spacing.xl * 3,
  },
  figmaListSection: {
    paddingHorizontal: FIGMA.gutter,
  },
  bagHeader: {
    marginHorizontal: FIGMA.gutter,
    marginBottom: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.xl,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: isDark ? c.border : ALCHEMY.pillInactive,
    borderTopWidth: 2,
    borderTopColor: isDark ? c.primaryBorder : ALCHEMY.gold,
    backgroundColor: isDark ? c.surfaceMuted : "rgba(255, 253, 249, 0.96)",
    ...shadowPremium,
  },
  bagHeaderTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.sm,
  },
  itemsSectionLabel: {
    fontFamily: FONT_HEADING,
    fontSize: typography.body + 1,
    color: c.textPrimary,
    letterSpacing: -0.2,
  },
  bagSubtotalPreview: {
    fontFamily: fonts.bold,
    fontSize: typography.bodySmall,
    color: isDark ? c.primaryBright : ALCHEMY.brown,
  },
  trustStripInline: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  trustStripText: {
    flex: 1,
    fontFamily: fonts.medium,
    fontSize: typography.caption,
    color: c.textSecondary,
    lineHeight: 16,
  },
  figmaCouponWrap: {
    paddingHorizontal: FIGMA.gutter,
    marginBottom: spacing.md,
  },
  listContent: {
    gap: spacing.sm},
  cartItemCard: {
    backgroundColor: c.surface,
    borderWidth: 1,
    borderColor: c.border,
    borderTopWidth: 3,
    borderTopColor: c.primaryBorder,
    borderRadius: radius.xxl,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    ...shadowPremium},
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: spacing.xs,
    gap: spacing.sm},
  info: {
    flex: 1},
  name: {
    fontSize: typography.body,
    fontFamily: fonts.semibold,
    color: c.textPrimary},
  meta: {
    marginTop: 5,
    fontSize: 13,
    color: c.textSecondary},
  actions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8},
  smallButton: {
    backgroundColor: c.primarySoft,
    width: 36,
    height: 36,
    borderRadius: radius.pill,
    alignItems: "center",
    justifyContent: "center"},
  smallButtonText: {
    color: c.primary,
    fontSize: 18,
    fontFamily: fonts.bold,
    marginTop: -1},
  quantityPill: {
    minWidth: 34,
    height: 34,
    paddingHorizontal: 10,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: c.border,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: c.surfaceMuted},
  quantityPillText: {
    color: c.textPrimary,
    fontFamily: fonts.bold,
    fontSize: typography.bodySmall},
  emptyCard: {
    ...customerPanel(c, shadowPremium, isDark),
    marginBottom: spacing.md,
    padding: spacing.xl,
    alignItems: "center"},
  emptyBrandLogo: {
    marginBottom: spacing.xs},
  emptyIconWrap: {
    width: 64,
    height: 64,
    borderRadius: radius.pill,
    backgroundColor: c.primarySoft,
    borderWidth: 1,
    borderColor: c.primaryBorder,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.sm},
  emptyTitle: {
    fontSize: typography.h3,
    fontFamily: FONT_HEADING,
    color: c.textPrimary,
    textAlign: "center",
    letterSpacing: -0.3},
  emptyText: {
    marginTop: spacing.sm,
    textAlign: "center",
    color: c.textSecondary,
    fontSize: typography.bodySmall,
    fontFamily: fonts.regular,
    lineHeight: 22,
    maxWidth: 320},
  browseHomeBtn: {
    marginTop: spacing.lg,
    gap: 8,
    backgroundColor: c.secondary,
    borderColor: c.secondary},
  browseHomeBtnText: {
    color: c.onSecondary,
    fontFamily: fonts.bold,
    fontSize: typography.body},
  footer: {
    ...customerPanel(c, shadowPremium, isDark),
    marginBottom: spacing.md,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center"},
  footerEyebrow: {
    fontSize: typography.overline,
    fontFamily: fonts.semibold,
    color: c.textMuted,
    letterSpacing: 0.5,
    textTransform: "uppercase",
    marginBottom: 2},
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
    ...shadowPremium},
  summaryBoxHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginBottom: spacing.xs,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: c.primaryBorder},
  summaryBoxTitle: {
    fontSize: typography.body,
    fontFamily: fonts.extrabold,
    color: c.primaryDark},
  summaryInner: {
    marginTop: spacing.sm,
    gap: spacing.xs},
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 2},
  summaryLabel: {
    color: c.textSecondary,
    fontSize: typography.bodySmall,
    fontFamily: fonts.regular},
  summaryValue: {
    color: c.textPrimary,
    fontSize: typography.bodySmall,
    fontFamily: fonts.semibold,
    fontVariant: ["tabular-nums"]},
  summaryDiscountValue: {
    color: c.success,
    fontSize: typography.bodySmall,
    fontFamily: fonts.bold,
    fontVariant: ["tabular-nums"]},
  summaryDivider: {
    height: StyleSheet.hairlineWidth,
    marginVertical: spacing.sm,
    opacity: 0.85},
  summaryRowFinal: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: spacing.xs},
  summaryFinalLabel: {
    color: c.textPrimary,
    fontSize: typography.body,
    fontFamily: fonts.bold},
  summaryFinalValue: {
    color: c.primary,
    fontSize: typography.h3,
    fontFamily: fonts.extrabold,
    fontVariant: ["tabular-nums"]},
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
    backgroundColor: c.secondarySoft},
  addressProfileBannerIconWrap: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    backgroundColor: c.surface,
    borderWidth: 1,
    borderColor: c.secondaryBorder,
    alignItems: "center",
    justifyContent: "center"},
  addressProfileBannerTextCol: {
    flex: 1,
    minWidth: 0},
  addressProfileBannerTitle: {
    fontSize: typography.bodySmall,
    fontFamily: fonts.bold,
    color: c.textPrimary},
  addressProfileBannerSub: {
    marginTop: 4,
    fontSize: typography.caption,
    fontFamily: fonts.regular,
    color: c.textSecondary,
    lineHeight: 18},
  addressProfileBannerCta: {
    fontSize: typography.bodySmall,
    fontFamily: fonts.extrabold,
    color: c.secondaryDark},
  addressBox: {
    ...customerPanel(c, shadowPremium, isDark),
    marginBottom: spacing.md},
  couponBox: {
    ...customerPanel(c, shadowPremium, isDark),
    marginBottom: spacing.md},
  couponRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: spacing.sm},
  couponInputWrap: {
    flex: 1,
    minWidth: 0},
  bannerSpacer: {
    marginBottom: spacing.sm},
  addressFieldGap: {
    marginBottom: spacing.sm},
  halfField: {
    flex: 1,
    minWidth: 0},
  availableCouponsWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.xs,
    marginBottom: spacing.sm},
  availableCouponChip: {
    borderWidth: 1,
    borderColor: c.primaryBorder,
    borderRadius: radius.md,
    backgroundColor: c.primarySoft,
    paddingHorizontal: spacing.sm,
    paddingVertical: 8},
  availableCouponCode: {
    color: c.primary,
    fontSize: typography.caption,
    fontFamily: fonts.extrabold},
  availableCouponMeta: {
    marginTop: 1,
    color: c.textSecondary,
    fontSize: typography.overline,
    fontFamily: fonts.semibold},
  noCouponText: {
    color: c.textMuted,
    fontSize: 11,
    marginBottom: spacing.sm},
  couponInput: {
    flex: 1,
    marginBottom: 0},
  applyCouponBtn: {
    backgroundColor: c.secondary,
    borderColor: c.secondaryBorder},
  applyCouponBtnText: {
    color: c.onSecondary,
    fontFamily: fonts.bold,
    fontSize: typography.caption},
  couponSuccessText: {
    marginTop: spacing.xs,
    color: c.success,
    fontSize: typography.caption,
    fontFamily: fonts.bold},
  savedAddressBtn: {
    alignSelf: "flex-start",
    gap: 6,
    backgroundColor: c.primarySoft,
    borderColor: c.primaryBorder,
    marginBottom: spacing.sm},
  savedAddressBtnText: {
    color: c.primary,
    fontSize: typography.caption,
    fontFamily: fonts.bold},
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
    minHeight: 44},
  addressRow: {
    flexDirection: "row",
    gap: spacing.sm},
  addressRowCompact: {
    flexDirection: "column",
    gap: 0},
  halfInput: {
    flex: 1},
  noteInput: {
    minHeight: 70,
    textAlignVertical: "top"},
  errorText: {
    color: c.danger,
    marginBottom: spacing.sm,
    fontFamily: fonts.semibold,
    fontSize: typography.caption},
  successText: {
    color: c.success,
    marginBottom: spacing.sm,
    fontFamily: fonts.semibold,
    fontSize: typography.caption},
  totalLabel: {
    fontSize: typography.body,
    color: c.textPrimary,
    fontFamily: fonts.bold},
  totalValue: {
    fontSize: typography.h1,
    color: c.primaryDark,
    fontFamily: FONT_PRICE,
    letterSpacing: -0.4},
  checkoutButton: {
    marginBottom: spacing.lg},
  checkoutButtonDisabled: {
    backgroundColor: c.textMuted},
  checkoutButtonText: {
    color: c.onPrimary,
    fontFamily: fonts.bold,
    fontSize: typography.body},
  checkoutContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8},
  loginPrompt: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.xl},
  loginPromptTitle: {
    fontSize: typography.h2,
    fontFamily: FONT_HEADING,
    color: c.textPrimary,
    textAlign: "center",
    letterSpacing: -0.35},
  loginPromptText: {
    marginTop: spacing.sm,
    textAlign: "center",
    color: c.textSecondary,
    fontSize: typography.body,
    fontFamily: fonts.regular,
    lineHeight: 22,
    marginBottom: spacing.lg},
  peNone: {
    pointerEvents: "none"}});
}
