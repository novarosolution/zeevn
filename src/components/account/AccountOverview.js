import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Linking,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import Card from "../ui/Card";
import Button from "../ui/Button";
import Badge from "../ui/Badge";
import SectionHeader from "../ui/SectionHeader";
import ProductCard from "../ProductCard";
import { ACCOUNT_OVERVIEW_SCREEN, fillPlaceholders, SUPPORT_SCREEN } from "../../content/appContent";
import { ACCOUNT_NESTED } from "../../navigation/accountRoutes";
import { useAuth } from "../../context/AuthContext";
import { useCart } from "../../context/CartContext";
import { useWishlist } from "../../context/WishlistContext";
import { useTheme } from "../../context/ThemeContext";
import { FONT_DISPLAY_SEMI } from "../../theme/customerAlchemy";
import { fonts } from "../../theme/tokens";
import { formatINR, formatINRWhole } from "../../utils/currency";
import { getImageUriCandidates } from "../../utils/image";
import { getOrderStatusLabel, isCancelledOrder, isDeliveredOrder } from "../../utils/orderStatus";
import { fetchMyOrders, fetchUserProfile } from "../../services/userService";
import { getProducts } from "../../services/productService";
import { DEMO_SAVED_CARDS_KEY, loadProfilePrefs } from "../../utils/accountProfilePrefs";
import { computeProfileCompleteness } from "../../utils/profileCompleteness";
import { loadSavedAddresses } from "../../utils/savedAddresses";
import ProfileCompletenessMeter from "./ProfileCompletenessMeter";
import { headingA11yProps } from "../../utils/a11y";

const copy = ACCOUNT_OVERVIEW_SCREEN;
const OFFER_DISMISS_KEY = "@zeevan_overview_offer_dismissed_v1";

function firstNameFrom(fullName) {
  const s = String(fullName || "").trim();
  if (!s) return "there";
  return s.split(/\s+/)[0] || "there";
}

function greetingTimeKey() {
  const h = new Date().getHours();
  if (h < 12) return copy.greetingMorning;
  if (h < 17) return copy.greetingAfternoon;
  return copy.greetingEvening;
}

function fulfillmentStep(status) {
  const s = String(status || "");
  if (s === "cancelled") return -1;
  if (s === "delivered") return 3;
  if (s === "shipped" || s === "out_for_delivery") return 2;
  if (["confirmed", "paid", "preparing", "ready_for_pickup"].includes(s)) return 1;
  return 0;
}

function etaLabelForOrder(order) {
  const status = String(order?.status || "");
  if (status === "out_for_delivery" || status === "shipped") {
    const eta = new Date(Date.now() + 2 * 60 * 60 * 1000);
    const time = eta.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
    return fillPlaceholders(copy.activeOrder.etaTemplate, { time });
  }
  if (["preparing", "ready_for_pickup", "confirmed", "paid"].includes(status)) {
    return "Arrives today";
  }
  return "Processing";
}

function savingsThisYear(orders) {
  const year = new Date().getFullYear();
  return orders
    .filter((o) => isDeliveredOrder(o?.status) && new Date(o.createdAt).getFullYear() === year)
    .reduce((sum, o) => {
      const discount =
        Number(o?.priceBreakdown?.discountAmount || 0) + Number(o?.coupon?.discountAmount || 0);
      return sum + (discount > 0 ? discount : Number(o.totalPrice || 0) * 0.05);
    }, 0);
}

function orderSummaryLine(order) {
  const items = order?.products || [];
  const count = items.reduce((n, p) => n + Number(p.quantity || 1), 0);
  return fillPlaceholders(copy.activeOrder.summaryTemplate, {
    count: String(count),
    total: formatINR(order?.totalPrice),
  });
}

function formatAddressOneLiner(addr) {
  if (!addr?.line1) return "No address saved";
  return [addr.line1, addr.city].filter(Boolean).join(", ");
}

function StatCard({ icon, label, value, onPress, loading }) {
  const { semanticPalette, SPACING } = useTheme();
  const inner = (
    <Card padding="md" style={{ flex: 1, minHeight: 96 }}>
      {icon ? (
        <Ionicons name={icon} size={18} color={semanticPalette.accent} style={{ marginBottom: SPACING.sm }} />
      ) : null}
      <Text
        style={{
          fontFamily: FONT_DISPLAY_SEMI,
          fontSize: 32,
          lineHeight: 36,
          fontWeight: "500",
          color: semanticPalette.ink,
        }}
      >
        {loading ? "—" : value}
      </Text>
      <Text
        style={{
          marginTop: 6,
          fontFamily: fonts.medium,
          fontSize: 12,
          lineHeight: 16,
          letterSpacing: 0.5,
          color: semanticPalette.inkMuted,
        }}
      >
        {label}
      </Text>
    </Card>
  );
  if (onPress) {
    return (
      <Pressable onPress={onPress} style={{ flex: 1, minWidth: 140 }} accessibilityRole="button">
        {inner}
      </Pressable>
    );
  }
  return <View style={{ flex: 1, minWidth: 140 }}>{inner}</View>;
}

function OrderProgressBar({ activeIdx }) {
  const { semanticPalette, SPACING } = useTheme();
  const steps = copy.progressSteps;
  return (
    <View style={{ flexDirection: "row", alignItems: "flex-start", marginTop: SPACING.md }}>
      {steps.map((label, idx) => {
        const done = activeIdx > idx;
        const current = activeIdx === idx;
        return (
          <View key={label} style={{ flex: 1, alignItems: "center" }}>
            <View
              style={{
                width: current ? 12 : 8,
                height: current ? 12 : 8,
                borderRadius: 6,
                backgroundColor: done || current ? semanticPalette.accent : semanticPalette.line,
                borderWidth: current ? 2 : 0,
                borderColor: semanticPalette.surface,
              }}
            />
            <Text
              style={{
                marginTop: 6,
                fontFamily: fonts.medium,
                fontSize: 10,
                textAlign: "center",
                color: done || current ? semanticPalette.ink : semanticPalette.inkMuted,
              }}
            >
              {label}
            </Text>
            {idx < steps.length - 1 ? (
              <View
                style={{
                  position: "absolute",
                  top: 4,
                  left: "55%",
                  right: "-45%",
                  height: 2,
                  backgroundColor: done ? semanticPalette.accent : semanticPalette.lineSoft,
                  zIndex: -1,
                }}
              />
            ) : null}
          </View>
        );
      })}
    </View>
  );
}

function ThumbCollage({ products, size = 52 }) {
  const { semanticPalette, SPACING } = useTheme();
  return (
    <View style={{ flexDirection: "row", gap: 6 }}>
      {(products || []).slice(0, 3).map((p, idx) => {
        const uri = getImageUriCandidates(p.image || "")[0] || "";
        return uri ? (
          <Image
            key={`${p.product || p.name}-${idx}`}
            source={{ uri }}
            style={{ width: size, height: size, borderRadius: 10, backgroundColor: semanticPalette.surfaceAlt }}
            contentFit="cover"
          />
        ) : (
          <View
            key={`ph-${idx}`}
            style={{ width: size, height: size, borderRadius: 10, backgroundColor: semanticPalette.surfaceAlt }}
          />
        );
      })}
    </View>
  );
}

function RecentOrderTile({ order, onPress, width }) {
  const { semanticPalette, TYPE, SPACING } = useTheme();
  return (
    <Pressable onPress={onPress} style={{ width }} accessibilityRole="button">
      <Card padding="md" style={{ height: "100%" }}>
        <ThumbCollage products={order.products} size={48} />
        <Text
          style={{
            marginTop: SPACING.sm,
            fontFamily: fonts.semibold,
            fontSize: TYPE.micro.fontSize,
            letterSpacing: 0.8,
            color: semanticPalette.inkMuted,
            textTransform: "uppercase",
          }}
        >
          #{String(order._id || "").slice(-6).toUpperCase()}
        </Text>
        <View style={{ marginTop: SPACING.xs, alignSelf: "flex-start" }}>
          <Badge variant="navy" size="sm">
            {getOrderStatusLabel(order.status)}
          </Badge>
        </View>
        <Text style={{ marginTop: SPACING.xs, fontFamily: fonts.regular, fontSize: 12, color: semanticPalette.inkMuted }}>
          {new Date(order.createdAt || Date.now()).toLocaleDateString()}
        </Text>
        <Text style={{ marginTop: 4, fontFamily: fonts.semibold, fontSize: TYPE.body.fontSize, color: semanticPalette.ink }}>
          {formatINR(order.totalPrice)}
        </Text>
      </Card>
    </Pressable>
  );
}

/**
 * Account overview dashboard body — used inside `AccountLayout` / `AccountShell`.
 */
export default function AccountOverview({ navigation }) {
  const { width } = useWindowDimensions();
  const isDesktop = width >= 1024;
  const isPhone = width < 768;

  const { token, user } = useAuth();
  const { ids: wishlistIds, count: wishlistCount } = useWishlist();
  const { addToCart, removeFromCart, cartItems } = useCart();
  const { semanticPalette, TYPE, SPACING, RADII } = useTheme();

  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState([]);
  const [catalog, setCatalog] = useState([]);
  const [defaultAddress, setDefaultAddress] = useState(null);
  const [defaultPayment, setDefaultPayment] = useState(null);
  const [offerDismissed, setOfferDismissed] = useState(true);
  const [loyaltyOpen, setLoyaltyOpen] = useState(false);
  const [profilePrefs, setProfilePrefs] = useState(null);
  const [hasSavedAddress, setHasSavedAddress] = useState(false);

  const load = useCallback(async () => {
    if (!token) return;
    try {
      setLoading(true);
      const [orderData, products, profile, rawCards, dismissed, prefs, addresses] = await Promise.all([
        fetchMyOrders(token),
        getProducts().catch(() => []),
        fetchUserProfile(token).catch(() => null),
        AsyncStorage.getItem(DEMO_SAVED_CARDS_KEY),
        AsyncStorage.getItem(OFFER_DISMISS_KEY),
        loadProfilePrefs(),
        loadSavedAddresses(token),
      ]);
      setProfilePrefs(prefs);
      setHasSavedAddress(Array.isArray(addresses) && addresses.length > 0);
      setOrders(Array.isArray(orderData) ? orderData : []);
      setCatalog(Array.isArray(products) ? products : []);
      setDefaultAddress(profile?.defaultAddress || null);
      setOfferDismissed(dismissed === "1");
      try {
        const cards = JSON.parse(rawCards || "[]");
        setDefaultPayment(Array.isArray(cards) && cards[0] ? cards[0] : null);
      } catch {
        setDefaultPayment(null);
      }
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    load();
  }, [load]);

  const activeOrders = useMemo(
    () => orders.filter((o) => !isDeliveredOrder(o?.status) && !isCancelledOrder(o?.status)),
    [orders]
  );

  const activeOrder = activeOrders[0] || null;

  const recentOrders = useMemo(() => {
    const sorted = [...orders].sort(
      (a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
    );
    return sorted.slice(0, isDesktop ? 3 : 6);
  }, [orders, isDesktop]);

  const wishPreviewProducts = useMemo(() => {
    const idSet = new Set(wishlistIds.slice(0, 12));
    return catalog.filter((p) => p?.id && idSet.has(String(p.id))).slice(0, 4);
  }, [catalog, wishlistIds]);

  const loyaltyPts = Math.max(0, Number(user?.rewardPoints ?? 0));
  const savedYear = useMemo(() => savingsThisYear(orders), [orders]);

  const completeness = useMemo(
    () => computeProfileCompleteness({ user, prefs: profilePrefs, hasSavedAddress }),
    [hasSavedAddress, profilePrefs, user]
  );

  const getQty = useCallback(
    (productId) => {
      const row = cartItems.find((i) => String(i.id) === String(productId));
      return row ? Number(row.quantity || 0) : 0;
    },
    [cartItems]
  );

  const dismissOffer = async () => {
    setOfferDismissed(true);
    await AsyncStorage.setItem(OFFER_DISMISS_KEY, "1");
  };

  const openWhatsApp = () => {
    const url = SUPPORT_SCREEN.whatsappUrl;
    if (url) Linking.openURL(url).catch(() => {});
    else navigation.navigate("Support");
  };

  const openEmail = () => {
    Linking.openURL(`mailto:${SUPPORT_SCREEN.contactEmailSub}`).catch(() => navigation.navigate("Support"));
  };

  const productColWidth = isPhone ? Math.min(280, width * 0.72) : isDesktop ? "23%" : "48%";
  const recentTileWidth = isPhone ? 220 : undefined;
  const recentTileFlex = isDesktop ? { flex: 1, minWidth: 0 } : { width: recentTileWidth };

  return (
    <View style={{ gap: SPACING.xl, width: "100%" }}>
      <Modal visible={loyaltyOpen} transparent animationType="fade" onRequestClose={() => setLoyaltyOpen(false)}>
        <View style={{ flex: 1, justifyContent: "center", padding: SPACING.lg, backgroundColor: "rgba(14,14,14,0.4)" }}>
          <Card padding="lg" style={{ maxWidth: 400, width: "100%", alignSelf: "center" }}>
            <Text style={{ fontFamily: FONT_DISPLAY_SEMI, fontSize: TYPE.h3.fontSize, color: semanticPalette.ink }}>
              {copy.loyaltyModal.title}
            </Text>
            <Text style={{ marginTop: SPACING.sm, fontFamily: fonts.regular, fontSize: TYPE.body.fontSize, color: semanticPalette.inkSoft }}>
              {fillPlaceholders(copy.loyaltyModal.bodyTemplate, { points: String(loyaltyPts) })}
            </Text>
            <View style={{ marginTop: SPACING.lg, gap: SPACING.sm }}>
              <Button
                label={copy.loyaltyModal.redeemCta}
                variant="primary"
                size="md"
                fullWidth
                onPress={() => {
                  setLoyaltyOpen(false);
                  navigation.navigate("RedeemRewards");
                }}
              />
              <Button label={copy.loyaltyModal.closeCta} variant="ghost" size="md" fullWidth onPress={() => setLoyaltyOpen(false)} />
            </View>
          </Card>
        </View>
      </Modal>

      <View style={{ gap: SPACING.md }}>
        <Text
          style={{
            fontFamily: TYPE.serifFamily,
            ...TYPE.h1,
            color: semanticPalette.ink,
          }}
          {...headingA11yProps(1)}
        >
          {fillPlaceholders(copy.greetingTemplate, {
            time: greetingTimeKey(),
            firstName: firstNameFrom(user?.name),
          })}
        </Text>
        <Text style={{ fontFamily: fonts.regular, fontSize: TYPE.body.fontSize, lineHeight: TYPE.body.lineHeight, color: semanticPalette.inkSoft }}>
          {copy.subline}
        </Text>
        <ProfileCompletenessMeter
          percent={completeness.percent}
          missing={completeness.missing}
          navigation={navigation}
        />
      </View>

      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 16 }}>
        <StatCard
          icon="cube-outline"
          label={copy.stats.activeOrders}
          value={activeOrders.length}
          loading={loading}
          onPress={() => navigation.navigate(ACCOUNT_NESTED.Orders, { filter: "active" })}
        />
        <StatCard
          icon="heart-outline"
          label={copy.stats.wishlist}
          value={wishlistCount}
          loading={loading}
          onPress={() => navigation.navigate(ACCOUNT_NESTED.Wishlist)}
        />
        <StatCard
          icon="star-outline"
          label={copy.stats.loyalty}
          value={loyaltyPts}
          loading={loading}
          onPress={() => setLoyaltyOpen(true)}
        />
        <StatCard
          icon="pricetag-outline"
          label={copy.stats.saved}
          value={formatINRWhole(savedYear)}
          loading={loading}
        />
      </View>

      {activeOrder ? (
        <Card
          padding="lg"
          style={{
            backgroundColor: semanticPalette.accentSoft,
            borderWidth: 1,
            borderColor: semanticPalette.accent,
          }}
        >
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", gap: SPACING.md }}>
            <Badge variant="brass" size="sm">
              {getOrderStatusLabel(activeOrder.status)}
            </Badge>
            <Text style={{ fontFamily: fonts.medium, fontSize: TYPE.small.fontSize, color: semanticPalette.ink }}>
              {etaLabelForOrder(activeOrder)}
            </Text>
          </View>
          <OrderProgressBar activeIdx={fulfillmentStep(activeOrder.status)} />
          <Text style={{ marginTop: SPACING.md, fontFamily: fonts.regular, fontSize: TYPE.body.fontSize, color: semanticPalette.inkSoft }}>
            {orderSummaryLine(activeOrder)}
          </Text>
          <View style={{ marginTop: SPACING.md, alignSelf: "flex-start" }}>
            <Button
              label={copy.activeOrder.trackCta}
              variant="secondary"
              size="md"
              onPress={() => navigation.navigate(ACCOUNT_NESTED.OrderDetail, { order: activeOrder })}
            />
          </View>
        </Card>
      ) : null}

      {recentOrders.length > 0 ? (
        <View>
          <SectionHeader
            overline={copy.sections.recentOrders.overline}
            title={copy.sections.recentOrders.title}
            actionLabel={copy.sections.recentOrders.trailing}
            onActionPress={() => navigation.navigate(ACCOUNT_NESTED.Orders)}
          />
          {isPhone ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: SPACING.md, paddingBottom: 4 }}>
              {recentOrders.map((order) => (
                <RecentOrderTile
                  key={String(order._id)}
                  order={order}
                  width={recentTileWidth}
                  onPress={() => navigation.navigate(ACCOUNT_NESTED.OrderDetail, { order })}
                />
              ))}
            </ScrollView>
          ) : (
            <View style={{ flexDirection: "row", gap: SPACING.md }}>
              {recentOrders.map((order) => (
                <View key={String(order._id)} style={recentTileFlex}>
                  <RecentOrderTile order={order} onPress={() => navigation.navigate(ACCOUNT_NESTED.OrderDetail, { order })} />
                </View>
              ))}
            </View>
          )}
        </View>
      ) : !loading ? (
        <Card padding="md">
          <Text style={{ fontFamily: fonts.regular, fontSize: TYPE.body.fontSize, color: semanticPalette.inkSoft }}>
            {copy.empty.recentOrders.body}{" "}
            <Text
              onPress={() => navigation.navigate("Home")}
              style={{ fontFamily: fonts.semibold, color: semanticPalette.accent, textDecorationLine: "underline" }}
            >
              {copy.empty.recentOrders.link} →
            </Text>
          </Text>
        </Card>
      ) : null}

      {wishPreviewProducts.length > 0 ? (
        <View>
          <SectionHeader
            overline={copy.sections.wishlist.overline}
            title={copy.sections.wishlist.title}
            actionLabel={copy.sections.wishlist.trailing}
            onActionPress={() => navigation.navigate(ACCOUNT_NESTED.Wishlist)}
          />
          {isPhone ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: SPACING.md }}>
              {wishPreviewProducts.map((product, index) => (
                <View key={String(product.id)} style={{ width: productColWidth }}>
                  <ProductCard
                    product={product}
                    index={index}
                    onPress={() => navigation.navigate("Product", { productId: String(product.id) })}
                    quantity={getQty(product.id)}
                    onAddToCart={() => addToCart(product)}
                    onRemoveFromCart={() => removeFromCart(product.id)}
                  />
                </View>
              ))}
            </ScrollView>
          ) : (
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: SPACING.md }}>
              {wishPreviewProducts.map((product, index) => (
                <View
                  key={String(product.id)}
                  style={{
                    width: productColWidth,
                    flexGrow: 1,
                    maxWidth: Platform.OS === "web" ? 280 : "48%",
                  }}
                >
                  <ProductCard
                    product={product}
                    index={index}
                    onPress={() => navigation.navigate("Product", { productId: String(product.id) })}
                    quantity={getQty(product.id)}
                    onAddToCart={() => addToCart(product)}
                    onRemoveFromCart={() => removeFromCart(product.id)}
                  />
                </View>
              ))}
            </View>
          )}
        </View>
      ) : null}

      <Card padding="md">
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            paddingBottom: SPACING.md,
            borderBottomWidth: StyleSheet.hairlineWidth,
            borderBottomColor: semanticPalette.lineSoft,
          }}
        >
          <View style={{ flex: 1, minWidth: 0, paddingRight: SPACING.md }}>
            <Text style={{ fontFamily: fonts.medium, fontSize: 12, color: semanticPalette.inkMuted }}>
              {copy.sections.quickAccess.addressLabel}
            </Text>
            <Text style={{ marginTop: 4, fontFamily: fonts.regular, fontSize: TYPE.body.fontSize, color: semanticPalette.ink }} numberOfLines={2}>
              {formatAddressOneLiner(defaultAddress)}
            </Text>
          </View>
          <Pressable onPress={() => navigation.navigate(ACCOUNT_NESTED.Addresses)} hitSlop={8}>
            <Text style={{ fontFamily: fonts.semibold, fontSize: 14, color: semanticPalette.accent }}>{copy.sections.quickAccess.change}</Text>
          </Pressable>
        </View>
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingTop: SPACING.md }}>
          <View style={{ flex: 1, minWidth: 0, paddingRight: SPACING.md }}>
            <Text style={{ fontFamily: fonts.medium, fontSize: 12, color: semanticPalette.inkMuted }}>
              {copy.sections.quickAccess.paymentLabel}
            </Text>
            <Text style={{ marginTop: 4, fontFamily: fonts.regular, fontSize: TYPE.body.fontSize, color: semanticPalette.ink }}>
              {defaultPayment
                ? `${defaultPayment.brand || "Card"} •••• ${defaultPayment.last4 || "····"}`
                : "No payment method saved"}
            </Text>
          </View>
          <Pressable onPress={() => navigation.navigate(ACCOUNT_NESTED.Payment)} hitSlop={8}>
            <Text style={{ fontFamily: fonts.semibold, fontSize: 14, color: semanticPalette.accent }}>{copy.sections.quickAccess.change}</Text>
          </Pressable>
        </View>
      </Card>

      {!offerDismissed ? (
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: SPACING.md,
            padding: SPACING.lg,
            borderRadius: RADII.md,
            backgroundColor: semanticPalette.accentSoft,
            borderWidth: 1,
            borderColor: semanticPalette.accent,
          }}
        >
          <Ionicons name="gift-outline" size={28} color={semanticPalette.accent} />
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={{ fontFamily: fonts.semibold, fontSize: TYPE.body.fontSize, color: semanticPalette.ink }}>{copy.offer.headline}</Text>
            <View style={{ marginTop: SPACING.sm, alignSelf: "flex-start" }}>
              <Button label={copy.offer.cta} variant="secondary" size="sm" onPress={() => navigation.navigate("Home")} />
            </View>
          </View>
          <Pressable
            onPress={dismissOffer}
            accessibilityLabel={copy.offer.dismissA11y}
            hitSlop={12}
            style={{ position: "absolute", top: 8, right: 8 }}
          >
            <Ionicons name="close" size={18} color={semanticPalette.inkMuted} />
          </Pressable>
        </View>
      ) : null}

      <Card padding="md">
        <Text style={{ fontFamily: FONT_DISPLAY_SEMI, fontSize: TYPE.h3.fontSize, color: semanticPalette.ink }}>{copy.sections.support.title}</Text>
        <Text style={{ marginTop: SPACING.xs, fontFamily: fonts.regular, fontSize: TYPE.small.fontSize, color: semanticPalette.inkSoft }}>
          {copy.sections.support.body}
        </Text>
        <View style={{ flexDirection: isPhone ? "column" : "row", gap: SPACING.sm, marginTop: SPACING.md }}>
          <Button label={copy.sections.support.whatsapp} variant="secondary" size="md" style={{ flex: 1 }} onPress={openWhatsApp} />
          <Button label={copy.sections.support.email} variant="secondary" size="md" style={{ flex: 1 }} onPress={openEmail} />
        </View>
      </Card>
    </View>
  );
}
