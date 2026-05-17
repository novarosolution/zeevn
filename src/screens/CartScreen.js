import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useFocusEffect } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";
import { Image } from "expo-image";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import AppFooter from "../components/AppFooter";
import BottomNavBar from "../components/BottomNavBar";
import MotionScrollView from "../components/motion/MotionScrollView";
import BrandWordmark from "../components/BrandWordmark";
import {
  CheckoutStrippedHeader,
  CollapsibleCheckoutCard,
  DeliveryMethodCards,
  PaymentTabsRow,
  paymentTabToBackend,
} from "../components/cart/CartCheckoutPanels";
import Screen from "../components/ui/Screen";
import SectionHeader from "../components/ui/SectionHeader";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import Input from "../components/ui/Input";
import EmptyState from "../components/ui/EmptyState";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import {
  createOrderRequest,
  fetchAvailableCouponsRequest,
  validateCouponRequest,
} from "../services/orderService";
import { getCurrentAddressFromGPS } from "../services/locationService";
import { useTheme } from "../context/ThemeContext";
import {
  adminScrollPaddingBottom,
  customerInnerPageScrollContent,
  customerScrollPaddingBottom,
  customerScrollPaddingTop,
  customerWebStickyTop,
} from "../theme/screenLayout";
import { fonts, icon, layout } from "../theme/tokens";
import { formatINR } from "../utils/currency";
import { getImageUriCandidates } from "../utils/image";
import { HOME_CATALOG_ALL, matchesShelfProduct } from "../utils/shelfMatch";
import { getProducts } from "../services/productService";
import { ACCOUNT_NESTED } from "../navigation/accountRoutes";
import {
  CART_ADDRESS,
  CART_DRAWER_UI,
  CART_UI,
  CHECKOUT_UI,
  fillPlaceholders,
} from "../content/appContent";
import {
  getPublicRazorpayKeyId,
  loadRazorpayWebSdk,
  openRazorpayCheckout,
  verifyOrderPayment,
} from "../services/paymentService";

const CHECKOUT_MODE_KEY = "@zeevan_cart_checkout_mode_v1";
const CHECKOUT_DRAFT_KEY = "@zeevan_checkout_draft_v1";

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

function phoneOk(p) {
  const digits = String(p || "").replace(/\D/g, "");
  return digits.length >= 10;
}

function postalOk(p) {
  const s = String(p || "").trim();
  return s.length >= 4 && s.length <= 12;
}

function RetryCartImage({ sourceUri, style, placeholderStyle, iconSize, inkMuted }) {
  const candidates = useMemo(() => getImageUriCandidates(sourceUri), [sourceUri]);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    setIndex(0);
  }, [sourceUri]);

  const currentUri = candidates[index] || "";
  if (!currentUri) {
    return (
      <View style={[style, placeholderStyle]}>
        <Ionicons name="image-outline" size={iconSize} color={inkMuted} />
      </View>
    );
  }

  return (
    <Image
      source={{ uri: currentUri }}
      style={style}
      contentFit="cover"
      transition={200}
      recyclingKey={currentUri}
      onError={() => setIndex((prev) => prev + 1)}
    />
  );
}

export default function CartScreen({ navigation, route }) {
  const checkoutMode = route.params?.checkout === true;
  const { cartItems, totalAmount, totalItems, addToCart, removeFromCart, removeLineFromCart, clearCart } = useCart();
  const { isAuthenticated, token, user } = useAuth();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const isCompact = width < 480;
  const isDesktop = Platform.OS === "web" && width >= 1160;
  const stackCouponRow = width < 720;

  const { colors: c, semanticPalette, TYPE, SPACING, RADII } = useTheme();

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
  const [fieldErrors, setFieldErrors] = useState({});
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [availableCoupons, setAvailableCoupons] = useState([]);
  const [catalogProducts, setCatalogProducts] = useState([]);
  const [paymentTab, setPaymentTab] = useState("upi");
  const [deliveryMethod, setDeliveryMethod] = useState("standard");
  const [openSteps, setOpenSteps] = useState({ contact: true, delivery: false, payment: false });
  const [orderSuccess, setOrderSuccess] = useState(null);

  const draftLoadedRef = useRef(false);
  const placingFlowRef = useRef(false);

  const paymentMethodForOrder = useMemo(() => paymentTabToBackend(paymentTab), [paymentTab]);

  const deliveryFee = 0;
  const platformFee = 1.2;
  const discountAmount = Number(appliedCoupon?.discountAmount || 0);
  const payableAmount = Math.max(0, totalAmount + deliveryFee + platformFee - discountAmount);

  const profileAddress = useMemo(() => getProfileAddressCompletion(user?.defaultAddress), [user?.defaultAddress]);

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
      Number.isFinite(Number(user?.defaultAddress?.latitude)) ? Number(user.defaultAddress.latitude) : null
    );
    setLongitude(
      Number.isFinite(Number(user?.defaultAddress?.longitude)) ? Number(user.defaultAddress.longitude) : null
    );
  }, [user]);

  useEffect(() => {
    if (!appliedCoupon) return;
    const minSubtotal = Number(appliedCoupon.minSubtotal || 0);
    if (minSubtotal > 0 && totalAmount < minSubtotal) {
      setAppliedCoupon(null);
    }
  }, [appliedCoupon, totalAmount]);

  useEffect(() => {
    AsyncStorage.setItem(CHECKOUT_MODE_KEY, checkoutMode ? "1" : "0").catch(() => {});
  }, [checkoutMode]);

  useFocusEffect(
    useCallback(() => {
      if (route.params?.checkout !== undefined) return undefined;
      let cancelled = false;
      (async () => {
        try {
          const v = await AsyncStorage.getItem(CHECKOUT_MODE_KEY);
          if (!cancelled && v === "1" && cartItems.length > 0) {
            navigation.setParams({ checkout: true });
          }
        } catch {
          /* noop */
        }
      })();
      return () => {
        cancelled = true;
      };
    }, [cartItems.length, navigation, route.params?.checkout])
  );

  useEffect(() => {
    if (!checkoutMode) {
      draftLoadedRef.current = false;
      return;
    }
    if (draftLoadedRef.current) return;
    draftLoadedRef.current = true;
    let cancelled = false;
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(CHECKOUT_DRAFT_KEY);
        if (!raw || cancelled) return;
        const d = JSON.parse(raw);
        if (!d || typeof d !== "object") return;
        if (d.fullName != null) setFullName(String(d.fullName));
        if (d.phone != null) setPhone(String(d.phone));
        if (d.line1 != null) setLine1(String(d.line1));
        if (d.city != null) setCity(String(d.city));
        if (d.state != null) setState(String(d.state));
        if (d.postalCode != null) setPostalCode(String(d.postalCode));
        if (d.country != null) setCountry(String(d.country));
        if (d.note != null) setNote(String(d.note));
        if (d.paymentTab != null) setPaymentTab(String(d.paymentTab));
        if (d.deliveryMethod != null) setDeliveryMethod(String(d.deliveryMethod));
      } catch {
        /* noop */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [checkoutMode]);

  useEffect(() => {
    if (!checkoutMode) return undefined;
    const t = setTimeout(() => {
      AsyncStorage.setItem(
        CHECKOUT_DRAFT_KEY,
        JSON.stringify({
          fullName,
          phone,
          line1,
          city,
          state,
          postalCode,
          country,
          note,
          paymentTab,
          deliveryMethod,
        })
      ).catch(() => {});
    }, 450);
    return () => clearTimeout(t);
  }, [checkoutMode, fullName, phone, line1, city, state, postalCode, country, note, paymentTab, deliveryMethod]);

  useEffect(() => {
    if (placingFlowRef.current) return;
    if (checkoutMode && cartItems.length === 0) {
      navigation.setParams({ checkout: false });
      AsyncStorage.setItem(CHECKOUT_MODE_KEY, "0").catch(() => {});
    }
  }, [cartItems.length, checkoutMode, navigation]);

  useEffect(() => {
    if (!isAuthenticated || !token) return;
    let cancelled = false;
    const timer = setTimeout(async () => {
      try {
        const data = await fetchAvailableCouponsRequest(token, totalAmount);
        if (!cancelled) {
          setAvailableCoupons(Array.isArray(data?.coupons) ? data.coupons : []);
        }
      } catch {
        if (!cancelled) setAvailableCoupons([]);
      }
    }, 350);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [isAuthenticated, token, totalAmount]);

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
          setSuccess(result.message || "Coupon applied.");
          setAvailableCoupons((current) => current.filter((coupon) => coupon.code !== normalized));
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
    }, [route?.params?.prefillCoupon, isAuthenticated, token, totalAmount, navigation])
  );

  const cartIdSet = useMemo(() => new Set(cartItems.map((i) => i.id)), [cartItems]);
  const upsellProducts = useMemo(() => {
    return catalogProducts
      .filter((p) => matchesShelfProduct(p, HOME_CATALOG_ALL) && !cartIdSet.has(p.id) && p.inStock !== false)
      .slice(0, 12);
  }, [catalogProducts, cartIdSet]);

  const clearField = (key) => {
    setFieldErrors((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  const validateCheckoutFields = () => {
    const errs = {};
    if (!fullName.trim()) errs.fullName = CHECKOUT_UI.validationRequired;
    if (!phone.trim()) errs.phone = CHECKOUT_UI.validationRequired;
    else if (!phoneOk(phone)) errs.phone = CHECKOUT_UI.invalidPhone;
    if (!line1.trim()) errs.line1 = CHECKOUT_UI.validationRequired;
    if (!city.trim()) errs.city = CHECKOUT_UI.validationRequired;
    if (!state.trim()) errs.state = CHECKOUT_UI.validationRequired;
    if (!postalCode.trim()) errs.postalCode = CHECKOUT_UI.validationRequired;
    else if (!postalOk(postalCode)) errs.postalCode = CHECKOUT_UI.invalidPostal;
    if (!country.trim()) errs.country = CHECKOUT_UI.validationRequired;
    setFieldErrors(errs);
    if (Object.keys(errs).length > 0) {
      setOpenSteps({ contact: true, delivery: true, payment: true });
      return false;
    }
    return true;
  };

  const handlePlaceOrder = async () => {
    if (cartItems.length === 0) return;
    if (!validateCheckoutFields()) return;

    try {
      setIsPlacingOrder(true);
      placingFlowRef.current = true;
      setError("");
      setSuccess("");

      const created = await createOrderRequest(token, {
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
        paymentMethod: paymentMethodForOrder,
        couponCode: appliedCoupon?.code || "",
      });

      clearCart();

      const etaCopy = deliveryMethod === "express" ? CHECKOUT_UI.deliveryExpressSub : CHECKOUT_UI.deliveryStandardSub;

      if (paymentMethodForOrder === "Cash on Delivery") {
        const oid = created?._id || created?.id;
        setOrderSuccess({ id: String(oid || "—"), eta: etaCopy });
        navigation.setParams({ checkout: false });
        await AsyncStorage.setItem(CHECKOUT_MODE_KEY, "0").catch(() => {});
        return;
      }

      const orderId = created?._id || created?.id;
      const keyId = created?.razorpayKeyId || getPublicRazorpayKeyId();
      if (!orderId) {
        throw new Error(CART_UI.orderIncompleteError);
      }
      if (Platform.OS === "web") {
        await loadRazorpayWebSdk();
      }

      const checkout = await openRazorpayCheckout({
        order: created,
        razorpayKeyId: keyId,
        user,
        themeColor: semanticPalette.accent || c.primary,
      });

      if (checkout.status === "success" && checkout.payload) {
        const p = checkout.payload;
        await verifyOrderPayment(token, orderId, {
          razorpay_order_id: p.razorpay_order_id,
          razorpay_payment_id: p.razorpay_payment_id,
          razorpay_signature: p.razorpay_signature,
        });
        setOrderSuccess({ id: String(orderId), eta: etaCopy });
        navigation.setParams({ checkout: false });
        await AsyncStorage.setItem(CHECKOUT_MODE_KEY, "0").catch(() => {});
        return;
      }

      if (checkout.status === "fallback") {
        setSuccess(CART_UI.paymentFallback);
      } else {
        setSuccess(CART_UI.paymentResume);
      }
      navigation.navigate("Profile", { screen: ACCOUNT_NESTED.Orders });
    } catch (err) {
      setError(err.message || CART_UI.placeOrderError);
    } finally {
      placingFlowRef.current = false;
      setIsPlacingOrder(false);
    }
  };

  const handleApplyCoupon = async () => {
    try {
      setError("");
      setSuccess("");
      const normalized = String(couponCode || "").trim().toUpperCase();
      if (!normalized) {
        setError(CART_UI.couponRequired);
        return;
      }
      const result = await validateCouponRequest(token, normalized, totalAmount);
      setAppliedCoupon(result.coupon || null);
      setCouponCode(normalized);
      setSuccess(result.message || "Coupon applied.");
      setAvailableCoupons((current) => current.filter((coupon) => coupon.code !== normalized));
    } catch (err) {
      setAppliedCoupon(null);
      setError(err.message || CART_UI.couponApplyError);
    }
  };

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
      setSuccess(CART_ADDRESS.gpsFillSuccess);
    } catch (err) {
      setError(err.message || CART_UI.locationError);
    } finally {
      setIsDetectingLocation(false);
    }
  };

  const toggleStep = (key) => {
    setOpenSteps((s) => ({ ...s, [key]: !s[key] }));
  };

  const exitCheckout = useCallback(() => {
    navigation.setParams({ checkout: false });
  }, [navigation]);

  const scrollBottomPad = checkoutMode || orderSuccess ? adminScrollPaddingBottom(insets) : customerScrollPaddingBottom(insets);

  const summaryRows = (
    <>
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
        <Text style={{ fontFamily: fonts.medium, color: semanticPalette.inkSoft, ...TYPE.bodyLg }}>{CHECKOUT_UI.summarySubtotal}</Text>
        <Text style={{ fontFamily: fonts.medium, color: semanticPalette.ink, ...TYPE.bodyLg }}>{formatINR(totalAmount)}</Text>
      </View>
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
        <Text style={{ fontFamily: fonts.medium, color: semanticPalette.inkSoft, ...TYPE.bodyLg }}>{CHECKOUT_UI.summaryTaxes}</Text>
        <Text style={{ fontFamily: fonts.medium, color: semanticPalette.ink, ...TYPE.bodyLg }}>{formatINR(platformFee)}</Text>
      </View>
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
        <Text style={{ fontFamily: fonts.medium, color: semanticPalette.inkSoft, ...TYPE.bodyLg }}>{CHECKOUT_UI.summaryShipping}</Text>
        <Text style={{ fontFamily: fonts.semibold, color: semanticPalette.accent, ...TYPE.bodyLg }}>FREE</Text>
      </View>
      {discountAmount > 0 ? (
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
          <Text style={{ fontFamily: fonts.medium, color: semanticPalette.inkSoft, ...TYPE.bodyLg }}>{CHECKOUT_UI.summaryDiscount}</Text>
          <Text style={{ fontFamily: fonts.medium, color: semanticPalette.success, ...TYPE.bodyLg }}>- {formatINR(discountAmount)}</Text>
        </View>
      ) : null}
      <View style={{ height: StyleSheet.hairlineWidth, backgroundColor: semanticPalette.line, marginVertical: SPACING.sm }} />
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
        <Text style={{ fontFamily: fonts.semibold, color: semanticPalette.ink, ...TYPE.bodyLg }}>{CHECKOUT_UI.summaryTotal}</Text>
        <Text style={{ fontFamily: fonts.semibold, color: semanticPalette.ink, ...TYPE.bodyLg }}>{formatINR(payableAmount)}</Text>
      </View>
    </>
  );

  const renderCartLine = (item) => (
    <Card key={`${item.id}-${item.variantLabel || ""}`} padding="md" style={{ marginBottom: SPACING.md }}>
      <View style={{ flexDirection: "row", gap: SPACING.md }}>
        <RetryCartImage
          sourceUri={item.image || ""}
          style={{
            width: 80,
            height: 100,
            borderRadius: RADII.sm,
            backgroundColor: semanticPalette.surfaceAlt,
            borderWidth: StyleSheet.hairlineWidth,
            borderColor: semanticPalette.line,
          }}
          placeholderStyle={{ alignItems: "center", justifyContent: "center" }}
          iconSize={icon.lg}
          inkMuted={semanticPalette.inkMuted}
        />
        <View style={{ flex: 1, minWidth: 0 }}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", gap: SPACING.sm }}>
            <Text style={{ fontFamily: fonts.semibold, fontSize: TYPE.body.fontSize, color: semanticPalette.ink, flex: 1 }} numberOfLines={2}>
              {item.name}
            </Text>
            <Text style={{ fontFamily: fonts.semibold, fontSize: TYPE.body.fontSize, color: semanticPalette.ink }}>
              {formatINR(item.price * item.quantity)}
            </Text>
          </View>
          {item.variantLabel ? (
            <Text style={{ marginTop: 4, fontFamily: fonts.medium, fontSize: TYPE.caption.fontSize, color: semanticPalette.inkMuted }}>
              {item.variantLabel}
            </Text>
          ) : null}
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: SPACING.sm }}>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                borderWidth: StyleSheet.hairlineWidth,
                borderColor: semanticPalette.line,
                borderRadius: RADII.pill,
              }}
            >
              <Pressable
                style={{ paddingHorizontal: 12, paddingVertical: 8 }}
                onPress={() => removeFromCart(item.id, item.variantLabel)}
                accessibilityRole="button"
                accessibilityLabel="Decrease quantity"
              >
                <Ionicons name="remove" size={18} color={semanticPalette.ink} />
              </Pressable>
              <Text style={{ fontFamily: fonts.semibold, minWidth: 24, textAlign: "center", color: semanticPalette.ink }}>{item.quantity}</Text>
              <Pressable
                style={{ paddingHorizontal: 12, paddingVertical: 8 }}
                onPress={() => addToCart(item)}
                accessibilityRole="button"
                accessibilityLabel="Increase quantity"
              >
                <Ionicons name="add" size={18} color={semanticPalette.ink} />
              </Pressable>
            </View>
            <Pressable
              onPress={() => removeLineFromCart(item.id, item.variantLabel)}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel={CART_DRAWER_UI.removeLineA11y}
            >
              <Ionicons name="trash-outline" size={20} color={semanticPalette.inkMuted} />
            </Pressable>
          </View>
        </View>
      </View>
    </Card>
  );

  const renderAddonsStrip = () => {
    if (upsellProducts.length === 0) return null;
    return (
      <View style={{ marginTop: SPACING.lg }}>
        <SectionHeader overline={CHECKOUT_UI.addonsOverline} title={CHECKOUT_UI.addonsTitle} />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: SPACING.md, paddingVertical: 4 }}>
          {upsellProducts.map((p) => (
            <Card key={p.id} padding="md" style={{ width: isCompact ? 240 : 260 }}>
              <View style={{ flexDirection: "row", gap: SPACING.sm }}>
                <RetryCartImage
                  sourceUri={p.image || ""}
                  style={{
                    width: 72,
                    height: 72,
                    borderRadius: RADII.sm,
                    backgroundColor: semanticPalette.surfaceAlt,
                  }}
                  placeholderStyle={{ alignItems: "center", justifyContent: "center" }}
                  iconSize={icon.md}
                  inkMuted={semanticPalette.inkMuted}
                />
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text style={{ fontFamily: fonts.semibold, fontSize: TYPE.small.fontSize, color: semanticPalette.ink }} numberOfLines={2}>
                    {p.name}
                  </Text>
                  <Text style={{ marginTop: 4, fontFamily: fonts.medium, fontSize: TYPE.caption.fontSize, color: semanticPalette.inkMuted }}>
                    {formatINR(p.price)}
                  </Text>
                  <View style={{ marginTop: SPACING.sm }}>
                    <Button label={CART_UI.addUpsellCta} variant="secondary" size="sm" onPress={() => addToCart(p)} />
                  </View>
                </View>
              </View>
            </Card>
          ))}
        </ScrollView>
      </View>
    );
  };

  const renderCouponBlock = () => (
    <View style={{ gap: SPACING.sm }}>
      {availableCoupons.length > 0 ? (
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: SPACING.sm }}>
          {availableCoupons.slice(0, 6).map((coupon) => (
            <TouchableOpacity
              key={coupon.code}
              style={{
                borderWidth: StyleSheet.hairlineWidth,
                borderColor: semanticPalette.line,
                borderRadius: RADII.md,
                paddingHorizontal: SPACING.sm,
                paddingVertical: SPACING.sm,
                backgroundColor: semanticPalette.surfaceAlt,
              }}
              onPress={() => setCouponCode(coupon.code)}
            >
              <Text style={{ fontFamily: fonts.bold, fontSize: TYPE.caption.fontSize, color: semanticPalette.accent }}>{coupon.code}</Text>
              <Text style={{ fontFamily: fonts.medium, fontSize: TYPE.micro.fontSize, color: semanticPalette.inkMuted, marginTop: 2 }}>
                Save {formatINR(coupon.estimatedDiscount || 0)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      ) : (
        <Text style={{ fontFamily: fonts.regular, fontSize: TYPE.caption.fontSize, color: semanticPalette.inkMuted }}>No eligible coupons right now.</Text>
      )}
      <View style={[stackCouponRow ? { flexDirection: "column", gap: SPACING.sm } : { flexDirection: "row", gap: SPACING.sm, alignItems: "flex-start" }]}>
        <View style={{ flex: 1 }}>
          <Input
            label={CART_UI.couponCodeLabel}
            value={couponCode}
            onChangeText={setCouponCode}
            autoCapitalize="characters"
            iconLeft="pricetag-outline"
            returnKeyType="done"
            onSubmitEditing={handleApplyCoupon}
          />
        </View>
        <Button label={CART_UI.applyCouponCta} variant="secondary" size="md" fullWidth={stackCouponRow} onPress={handleApplyCoupon} />
      </View>
      {appliedCoupon ? (
        <Text style={{ fontFamily: fonts.medium, fontSize: TYPE.caption.fontSize, color: semanticPalette.success }}>
          {appliedCoupon.code} applied — saved {formatINR(appliedCoupon.discountAmount || 0)}.
        </Text>
      ) : null}
    </View>
  );

  const summaryCardShell = (opts = {}) => (
    <Card padding="md" style={opts.style}>
      <Text style={{ fontFamily: fonts.semibold, fontSize: TYPE.small.fontSize, color: semanticPalette.inkMuted, textTransform: "uppercase", letterSpacing: 1.2 }}>
        {CART_UI.summaryTitle}
      </Text>
      <View style={{ marginTop: SPACING.md, gap: SPACING.xs }}>{summaryRows}</View>
      {!checkoutMode ? (
        <View style={{ marginTop: SPACING.lg }}>
          <Text style={{ fontFamily: fonts.semibold, marginBottom: SPACING.sm, color: semanticPalette.ink }}>{CART_UI.couponTitle}</Text>
          {renderCouponBlock()}
        </View>
      ) : appliedCoupon ? (
        <Text style={{ marginTop: SPACING.md, fontFamily: fonts.medium, fontSize: TYPE.caption.fontSize, color: semanticPalette.success }}>
          {appliedCoupon.code} applied — saved {formatINR(appliedCoupon.discountAmount || 0)}.
        </Text>
      ) : null}
      {!checkoutMode ? (
        <View style={{ marginTop: SPACING.lg }}>
          <Button
            label={CART_DRAWER_UI.checkoutCta}
            variant="primary"
            size="lg"
            fullWidth
            disabled={cartItems.length === 0}
            onPress={() => navigation.setParams({ checkout: true })}
          />
        </View>
      ) : null}
    </Card>
  );

  const placeOrderLabel = fillPlaceholders(CHECKOUT_UI.placeOrderTemplate, { total: formatINR(payableAmount) });

  if (!isAuthenticated) {
    return (
      <View style={{ flex: 1, width: "100%", alignSelf: "center", maxWidth: Platform.select({ web: layout.maxContentWidth + 24, default: "100%" }) }}>
        <Screen navigation={navigation} title={CART_UI.pageTitle} breadcrumbLabel="Shop › Bag" kicker={CART_UI.pageEyebrow}>
          <Card padding="lg" style={{ marginTop: SPACING.md }}>
            <View style={{ alignItems: "center", marginBottom: SPACING.md }}>
              <BrandWordmark sizeKey="footerCompact" />
            </View>
            <EmptyState
              iconName="bag-handle-outline"
              title={CART_UI.signInTitle}
              description={CART_UI.signInDescription}
              ctaLabel={CART_UI.signInCta}
              onCtaPress={() => navigation.navigate("Login", { returnTo: { name: "Cart" } })}
              secondaryCtaLabel={CART_UI.browseStoreCta}
              onSecondaryCtaPress={() => navigation.navigate("Home")}
            />
          </Card>
          <AppFooter />
        </Screen>
        <BottomNavBar />
      </View>
    );
  }

  if (orderSuccess) {
    const desc = fillPlaceholders(CHECKOUT_UI.successBody, { id: orderSuccess.id, eta: orderSuccess.eta });
    return (
      <View style={{ flex: 1, width: "100%", alignSelf: "center", maxWidth: Platform.select({ web: layout.maxContentWidth + 24, default: "100%" }) }}>
        <Screen navigation={navigation} noScroll contentContainerStyle={{ flex: 1, justifyContent: "center", paddingVertical: SPACING["2xl"] }}>
          <EmptyState
            iconName="checkmark-circle"
            iconColor={semanticPalette.accent}
            title={CHECKOUT_UI.successTitle}
            description={desc}
            ctaLabel={CHECKOUT_UI.trackOrderCta}
            onCtaPress={() => {
              setOrderSuccess(null);
              navigation.navigate("Profile", { screen: ACCOUNT_NESTED.Orders });
            }}
            secondaryCtaLabel={CHECKOUT_UI.continueShoppingCta}
            onSecondaryCtaPress={() => {
              setOrderSuccess(null);
              navigation.navigate("Home");
            }}
          />
        </Screen>
      </View>
    );
  }

  const contactSubtitle = [fullName.trim(), city.trim()].filter(Boolean).join(" · ");

  return (
    <View style={{ flex: 1, width: "100%", alignSelf: "center", maxWidth: Platform.select({ web: layout.maxContentWidth + 24, default: "100%" }) }}>
      <Screen
        navigation={navigation}
        title={checkoutMode ? undefined : CART_UI.pageTitle}
        breadcrumbLabel={checkoutMode ? undefined : "Shop › Bag"}
        kicker={checkoutMode ? undefined : CART_UI.pageEyebrow}
        hideHeaderBackButton={checkoutMode}
        noScroll
        contentContainerStyle={{ flex: 1, paddingHorizontal: 0 }}
      >
        <MotionScrollView
          style={{ flex: 1 }}
          contentContainerStyle={customerInnerPageScrollContent(insets, {
            paddingHorizontal: SPACING.lg,
            paddingBottom: scrollBottomPad,
            paddingTop: customerScrollPaddingTop(insets, { nativeMin: SPACING.xs, webMin: SPACING.sm }),
            gap: SPACING.lg,
          })}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {checkoutMode ? (
            <>
              <CheckoutStrippedHeader
                onBack={exitCheckout}
                semanticPalette={semanticPalette}
                TYPE={TYPE}
                SPACING={SPACING}
              />
              {error ? (
                <View
                  style={{
                    padding: SPACING.md,
                    borderRadius: RADII.md,
                    borderWidth: 1,
                    borderColor: semanticPalette.sale,
                    backgroundColor: semanticPalette.surfaceAlt,
                  }}
                >
                  <Text style={{ fontFamily: fonts.medium, color: semanticPalette.sale, fontSize: TYPE.small.fontSize }}>{error}</Text>
                </View>
              ) : null}
              {success ? (
                <View
                  style={{
                    padding: SPACING.md,
                    borderRadius: RADII.md,
                    borderWidth: 1,
                    borderColor: semanticPalette.success,
                    backgroundColor: semanticPalette.surfaceAlt,
                  }}
                >
                  <Text style={{ fontFamily: fonts.medium, color: semanticPalette.success, fontSize: TYPE.small.fontSize }}>{success}</Text>
                </View>
              ) : null}

              <View style={{ flexDirection: isDesktop ? "row" : "column", alignItems: "flex-start", gap: SPACING.xl }}>
                <View style={{ flex: 1, minWidth: 0, gap: SPACING.md, width: "100%" }}>
                  <CollapsibleCheckoutCard
                    title={CHECKOUT_UI.stepContact}
                    subtitle={contactSubtitle}
                    expanded={openSteps.contact}
                    onToggle={() => toggleStep("contact")}
                    semanticPalette={semanticPalette}
                    TYPE={TYPE}
                    SPACING={SPACING}
                  >
                    {!profileAddress.complete ? (
                      <Pressable
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                          gap: SPACING.md,
                          padding: SPACING.md,
                          borderRadius: RADII.md,
                          borderWidth: StyleSheet.hairlineWidth,
                          borderColor: semanticPalette.line,
                          backgroundColor: semanticPalette.surfaceAlt,
                          marginBottom: SPACING.md,
                        }}
                        onPress={() => navigation.navigate("Profile", { screen: ACCOUNT_NESTED.Addresses })}
                      >
                        <Ionicons name="location-outline" size={icon.lg} color={semanticPalette.accent} />
                        <View style={{ flex: 1 }}>
                          <Text style={{ fontFamily: fonts.semibold, color: semanticPalette.ink }}>
                            {profileAddress.partial ? CART_ADDRESS.profileIncompleteTitle : CART_ADDRESS.profileEmptyTitle}
                          </Text>
                          <Text style={{ fontFamily: fonts.regular, fontSize: TYPE.caption.fontSize, color: semanticPalette.inkMuted, marginTop: 4 }}>
                            {profileAddress.partial ? CART_ADDRESS.profileIncompleteSub : CART_ADDRESS.profileEmptySub}
                          </Text>
                        </View>
                        <Text style={{ fontFamily: fonts.semibold, color: semanticPalette.accent }}>Add</Text>
                      </Pressable>
                    ) : null}
                    <Button
                      label={isDetectingLocation ? CART_ADDRESS.useGpsLoading : CART_ADDRESS.useGps}
                      variant="ghost"
                      size="sm"
                      loading={isDetectingLocation}
                      disabled={isDetectingLocation}
                      onPress={handleUseCurrentLocation}
                      style={{ alignSelf: "flex-start", marginBottom: SPACING.sm }}
                    />
                    <Input
                      label={CART_ADDRESS.fullNameLabel}
                      value={fullName}
                      onChangeText={(t) => {
                        setFullName(t);
                        clearField("fullName");
                      }}
                      errorText={fieldErrors.fullName}
                      iconLeft="person-outline"
                      autoCapitalize="words"
                      autoComplete="name"
                      textContentType="name"
                    />
                    <View style={{ height: SPACING.sm }} />
                    <Input
                      label={CART_ADDRESS.phoneLabel}
                      value={phone}
                      onChangeText={(t) => {
                        setPhone(t);
                        clearField("phone");
                      }}
                      errorText={fieldErrors.phone}
                      iconLeft="call-outline"
                      keyboardType="phone-pad"
                      autoComplete="tel"
                      textContentType="telephoneNumber"
                    />
                    <View style={{ height: SPACING.sm }} />
                    <Input
                      label={CART_ADDRESS.line1Label}
                      value={line1}
                      onChangeText={(t) => {
                        setLine1(t);
                        clearField("line1");
                      }}
                      errorText={fieldErrors.line1}
                      iconLeft="home-outline"
                      autoCapitalize="sentences"
                      autoComplete="street-address"
                      textContentType="streetAddressLine1"
                    />
                    <View style={{ height: SPACING.sm }} />
                    <View style={[isCompact ? { flexDirection: "column", gap: SPACING.sm } : { flexDirection: "row", gap: SPACING.sm }]}>
                      <View style={{ flex: 1 }}>
                        <Input
                          label={CART_ADDRESS.cityLabel}
                          value={city}
                          onChangeText={(t) => {
                            setCity(t);
                            clearField("city");
                          }}
                          errorText={fieldErrors.city}
                          autoCapitalize="words"
                          autoComplete="address-level2"
                          textContentType="addressCity"
                        />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Input
                          label={CART_ADDRESS.stateLabel}
                          value={state}
                          onChangeText={(t) => {
                            setState(t);
                            clearField("state");
                          }}
                          errorText={fieldErrors.state}
                          autoCapitalize="words"
                          autoComplete="address-level1"
                          textContentType="addressState"
                        />
                      </View>
                    </View>
                    <View style={{ height: SPACING.sm }} />
                    <View style={[isCompact ? { flexDirection: "column", gap: SPACING.sm } : { flexDirection: "row", gap: SPACING.sm }]}>
                      <View style={{ flex: 1 }}>
                        <Input
                          label={CART_ADDRESS.postalCodeLabel}
                          value={postalCode}
                          onChangeText={(t) => {
                            setPostalCode(t);
                            clearField("postalCode");
                          }}
                          errorText={fieldErrors.postalCode}
                          keyboardType="number-pad"
                          autoComplete="postal-code"
                          textContentType="postalCode"
                        />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Input
                          label={CART_ADDRESS.countryLabel}
                          value={country}
                          onChangeText={(t) => {
                            setCountry(t);
                            clearField("country");
                          }}
                          errorText={fieldErrors.country}
                          autoCapitalize="words"
                          autoComplete="country"
                          textContentType="countryName"
                        />
                      </View>
                    </View>
                    <View style={{ height: SPACING.sm }} />
                    <Input
                      label={CART_ADDRESS.noteLabel}
                      value={note}
                      onChangeText={setNote}
                      multiline
                      iconLeft="chatbubbles-outline"
                    />
                  </CollapsibleCheckoutCard>

                  <CollapsibleCheckoutCard
                    title={CHECKOUT_UI.stepDelivery}
                    subtitle={deliveryMethod === "express" ? CHECKOUT_UI.deliveryExpress : CHECKOUT_UI.deliveryStandard}
                    expanded={openSteps.delivery}
                    onToggle={() => toggleStep("delivery")}
                    semanticPalette={semanticPalette}
                    TYPE={TYPE}
                    SPACING={SPACING}
                  >
                    <DeliveryMethodCards
                      value={deliveryMethod}
                      onChange={setDeliveryMethod}
                      semanticPalette={semanticPalette}
                      TYPE={TYPE}
                      SPACING={SPACING}
                      RADII={RADII}
                    />
                  </CollapsibleCheckoutCard>

                  <CollapsibleCheckoutCard
                    title={CHECKOUT_UI.stepPayment}
                    subtitle={
                      paymentTab === "cod"
                        ? CHECKOUT_UI.paymentTabCod
                        : `${CHECKOUT_UI.paymentTabUpi} · ${CHECKOUT_UI.paymentTabCards}`
                    }
                    expanded={openSteps.payment}
                    onToggle={() => toggleStep("payment")}
                    semanticPalette={semanticPalette}
                    TYPE={TYPE}
                    SPACING={SPACING}
                  >
                    <PaymentTabsRow
                      activeTab={paymentTab}
                      onChange={setPaymentTab}
                      semanticPalette={semanticPalette}
                      TYPE={TYPE}
                      SPACING={SPACING}
                      RADII={RADII}
                    />
                  </CollapsibleCheckoutCard>

                  {!isDesktop ? (
                    <View style={{ gap: SPACING.md }}>
                      <Button label={CHECKOUT_UI.editBag} variant="ghost" size="md" fullWidth onPress={exitCheckout} />
                      {summaryCardShell({})}
                      <Button
                        label={placeOrderLabel}
                        variant="primary"
                        size="lg"
                        fullWidth
                        loading={isPlacingOrder}
                        disabled={cartItems.length === 0 || isPlacingOrder}
                        onPress={handlePlaceOrder}
                      />
                    </View>
                  ) : null}
                </View>

                {isDesktop ? (
                  <View
                    style={{
                      width: 380,
                      flexShrink: 0,
                      gap: SPACING.md,
                      ...Platform.select({
                        web: {
                          position: "sticky",
                          top: customerWebStickyTop(SPACING.sm),
                          alignSelf: "flex-start",
                        },
                        default: {},
                      }),
                    }}
                  >
                    <Button label={CHECKOUT_UI.editBag} variant="ghost" size="md" fullWidth onPress={exitCheckout} />
                    {summaryCardShell({})}
                    <Button
                      label={placeOrderLabel}
                      variant="primary"
                      size="lg"
                      fullWidth
                      loading={isPlacingOrder}
                      disabled={cartItems.length === 0 || isPlacingOrder}
                      onPress={handlePlaceOrder}
                    />
                  </View>
                ) : null}
              </View>
            </>
          ) : (
            <>
              <SectionHeader
                title={CART_UI.itemsTitle}
                overline={CART_UI.itemsOverline}
                subtitle={
                  cartItems.length === 0
                    ? CART_UI.pageSubtitleEmpty
                    : fillPlaceholders(CART_UI.pageSubtitleCount, {
                        count: `${totalItems} item${totalItems === 1 ? "" : "s"}`,
                      })
                }
              />

              {error ? (
                <View
                  style={{
                    padding: SPACING.md,
                    borderRadius: RADII.md,
                    borderWidth: 1,
                    borderColor: semanticPalette.sale,
                    backgroundColor: semanticPalette.surfaceAlt,
                  }}
                >
                  <Text style={{ fontFamily: fonts.medium, color: semanticPalette.sale, fontSize: TYPE.small.fontSize }}>{error}</Text>
                </View>
              ) : null}
              {success ? (
                <View
                  style={{
                    padding: SPACING.md,
                    borderRadius: RADII.md,
                    borderWidth: 1,
                    borderColor: semanticPalette.success,
                    backgroundColor: semanticPalette.surfaceAlt,
                  }}
                >
                  <Text style={{ fontFamily: fonts.medium, color: semanticPalette.success, fontSize: TYPE.small.fontSize }}>{success}</Text>
                </View>
              ) : null}

              <View style={{ flexDirection: isDesktop ? "row" : "column", gap: SPACING.xl, alignItems: "flex-start" }}>
                <View style={{ flex: 1, minWidth: 0, width: "100%" }}>
                  {cartItems.length === 0 ? (
                    <EmptyState
                      iconName="cart-outline"
                      title={CART_UI.emptyTitle}
                      description={CART_UI.emptyDescription}
                      ctaLabel={CART_UI.browseCta}
                      onCtaPress={() => navigation.navigate("Home")}
                    />
                  ) : (
                    cartItems.map((item) => renderCartLine(item))
                  )}
                  {cartItems.length > 0 ? renderAddonsStrip() : null}
                </View>

                <View
                  style={
                    isDesktop
                      ? {
                          width: 380,
                          flexShrink: 0,
                          ...Platform.select({
                            web: {
                              position: "sticky",
                              top: customerWebStickyTop(SPACING.sm),
                              alignSelf: "flex-start",
                            },
                            default: {},
                          }),
                        }
                      : { width: "100%" }
                  }
                >
                  {cartItems.length > 0 ? summaryCardShell({}) : null}
                </View>
              </View>
            </>
          )}

          <AppFooter />
        </MotionScrollView>
      </Screen>

      {!checkoutMode ? <BottomNavBar /> : null}
    </View>
  );
}
