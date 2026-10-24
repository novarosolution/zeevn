import React, { useCallback, useMemo } from "react";
import { ActivityIndicator, StyleSheet, Text, TextInput, View } from "react-native";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, { LinearTransition, useAnimatedScrollHandler, useSharedValue } from "react-native-reanimated";
import { stateIn } from "../../theme/motion";
import { STORE_CART } from "../../content/storefrontContent";
import { STORE_NAV_HEIGHT, useStoreTheme, withAlpha } from "../../theme/storefront";
import { formatINR, formatINRWhole } from "../../utils/currency";
import { hapticTick } from "../../utils/haptics";
import { cartLineKey } from "../../utils/productCart";
import { productImageSource } from "../../utils/storefront";
import AddControl from "./AddControl";
import FloatingNav from "./FloatingNav";
import PressableScale from "./PressableScale";
import ScreenHeader, { SCREEN_HEADER_PAD } from "./ScreenHeader";
import ScrollEdgeFade from "./ScrollEdgeFade";
import StoreBanner from "./StoreBanner";
import StoreField from "./StoreField";
import CheckoutPlacingOverlay from "../loading/CheckoutPlacingOverlay";

const PAY_DOCK_HEIGHT = 78;
const SUCCESS_INK = "#2F5A22";

/* ---- shared bits ---- */

function Card({ children, style, ...rest }) {
  const { c, r, shadow } = useStoreTheme();
  return (
    <View {...rest} style={[styles.card, shadow.soft, { backgroundColor: c.card, borderColor: c.line, borderRadius: r.xxl }, style]}>
      {children}
    </View>
  );
}

function CardTitle({ icon, title, caption, right }) {
  const { c, type } = useStoreTheme();
  return (
    <View style={styles.cardTitle}>
      {icon ? (
        <View style={[styles.titleIcon, { backgroundColor: c.brandSoft }]}>
          <Ionicons name={icon} size={18} color={c.brand} />
        </View>
      ) : null}
      <View style={styles.flex}>
        <Text style={type.display(19, { semi: true, ls: -0.3, lh: 24 })}>{title}</Text>
        {caption ? <Text style={type.ui(12.5, "medium", c.inkMute)}>{caption}</Text> : null}
      </View>
      {right}
    </View>
  );
}

function Heading({ title, caption }) {
  const { c, type } = useStoreTheme();
  return (
    <View style={styles.heading}>
      <Text style={type.display(34, { ls: -0.8, lh: 40 })} accessibilityRole="header" numberOfLines={1}>
        {title}
      </Text>
      {caption ? <Text style={type.ui(14.5, "medium", c.inkSoft)}>{caption}</Text> : null}
    </View>
  );
}

/* ---- free delivery progress ---- */

function FreeDeliveryStrip({ subtotal }) {
  const { c, r, type } = useStoreTheme();
  const { threshold, progress, unlocked } = STORE_CART.freeDelivery;
  const left = Math.max(0, threshold - subtotal);
  const done = left <= 0;
  const pct = Math.min(1, subtotal / threshold);

  return (
    <View style={[styles.free, { backgroundColor: done ? c.brandSoft : c.goldSoft, borderColor: done ? withAlpha(c.brand, 0.25) : withAlpha(c.gold, 0.45), borderRadius: r.xl }]}>
      <View style={styles.freeTop}>
        <View style={[styles.freeIcon, { backgroundColor: c.card }]}>
          <MaterialCommunityIcons name={done ? "check-decagram" : "truck-fast-outline"} size={20} color={done ? c.brand : c.goldText} />
        </View>
        <Text style={[type.ui(13.5, "bold", c.ink), styles.flex]}>{done ? unlocked : progress(formatINRWhole(left))}</Text>
      </View>
      <View style={[styles.track, { backgroundColor: withAlpha(c.ink, 0.08) }]}>
        <LinearGradient
          colors={done ? [c.brandBright, c.brand] : [c.goldBright, c.gold]}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={[styles.fill, { width: `${Math.max(6, pct * 100)}%` }]}
        />
      </View>
    </View>
  );
}

/* ---- cart line ---- */

function CartLine({ item, onIncrease, onDecrease, onRemove, compact = false }) {
  const { c, r, type, shadow } = useStoreTheme();
  const qty = Math.max(1, Number(item.quantity) || 1);
  const unit = Number(item.price) || 0;
  const variant = String(item.variantLabel || "").trim();
  const rawName = String(item.name || "").trim();
  const name = variant && rawName.endsWith(` — ${variant}`) ? rawName.slice(0, -(variant.length + 3)) : rawName;
  const source = productImageSource(item, compact ? 64 : 88);
  const thumb = compact ? 62 : 84;

  return (
    <View style={[styles.line, shadow.soft, { backgroundColor: c.card, borderColor: c.line, borderRadius: r.xl }]}>
      <View style={[styles.thumb, { width: thumb, height: thumb, backgroundColor: c.well, borderColor: c.line, borderRadius: r.lg }]}>
        {source ? (
          <Image source={source} style={StyleSheet.absoluteFill} contentFit="contain" transition={150} cachePolicy="memory-disk" />
        ) : (
          <MaterialCommunityIcons name="image-outline" size={26} color={c.inkMute} />
        )}
      </View>
      <View style={styles.lineBody}>
        <View style={styles.lineTop}>
          <Text style={[type.ui(compact ? 14 : 15, "bold", c.ink, { lineHeight: 20 }), styles.flex]} numberOfLines={2}>
            {name}
          </Text>
          {onRemove ? (
            <PressableScale scaleTo={0.88} lite
              onPress={() => {
                hapticTick();
                onRemove(item);
              }}
              hitSlop={10}
              accessibilityRole="button"
              accessibilityLabel={STORE_CART.line.removeA11y(name)}
              style={styles.removeBtn}
            >
              <Ionicons name="trash-outline" size={17} color={c.inkMute} />
            </PressableScale>
          ) : null}
        </View>
        <View style={styles.lineMeta}>
          {variant ? (
            <View style={[styles.variantPill, { backgroundColor: c.soft }]}>
              <Text style={type.ui(11.5, "bold", c.inkSoft)} numberOfLines={1}>
                {variant}
              </Text>
            </View>
          ) : null}
          {!compact ? <Text style={type.ui(12, "medium", c.inkMute)}>{STORE_CART.line.each(formatINRWhole(unit))}</Text> : null}
        </View>
        <View style={styles.lineFoot}>
          <AddControl quantity={qty} compact onAdd={() => onIncrease(item)} onRemove={() => onDecrease(item)} label={name} />
          <Text style={type.display(compact ? 17 : 19, { semi: true, ls: -0.3, lh: 24 })}>{formatINRWhole(unit * qty)}</Text>
        </View>
      </View>
    </View>
  );
}

/* ---- coupon ---- */

function CouponCard({ coupon }) {
  const { c, r, type } = useStoreTheme();
  const applied = Boolean(coupon.appliedText);
  return (
    <Card style={styles.couponCard}>
      <View style={styles.couponRow}>
        <View style={[styles.titleIcon, { backgroundColor: c.goldSoft }]}>
          <MaterialCommunityIcons name="ticket-percent-outline" size={19} color={c.goldText} />
        </View>
        <TextInput
          value={coupon.code}
          onChangeText={coupon.onChange}
          placeholder={STORE_CART.coupon.placeholder}
          placeholderTextColor={c.inkMute}
          selectionColor={c.brand}
          autoCapitalize="characters"
          autoCorrect={false}
          returnKeyType="done"
          onSubmitEditing={coupon.onApply}
          style={[
            coupon.code ? type.ui(15, "bold", c.ink, { letterSpacing: 0.6 }) : type.ui(14.5, "medium", c.ink),
            styles.couponInput,
            { backgroundColor: c.cardSoft, borderColor: c.line, borderRadius: r.md },
          ]}
        />
        <PressableScale
          onPress={coupon.onApply}
          accessibilityRole="button"
          accessibilityLabel={STORE_CART.coupon.apply}
          style={[styles.couponBtn, { backgroundColor: c.brand }]}
        >
          <Text style={type.ui(13.5, "extrabold", c.onBrand)}>{STORE_CART.coupon.apply}</Text>
        </PressableScale>
      </View>
      {applied ? (
        <Animated.View entering={stateIn} style={styles.couponApplied}>
          <Ionicons name="checkmark-circle" size={17} color={c.brandBright} />
          <Text style={type.ui(13, "bold", c.brandAlt)} numberOfLines={1}>
            {STORE_CART.coupon.applied} · {coupon.appliedText}
          </Text>
        </Animated.View>
      ) : null}
    </Card>
  );
}

/* ---- bill ---- */

function BillRow({ label, value, tone, strong = false }) {
  const { c, type } = useStoreTheme();
  const color = tone === "good" ? SUCCESS_INK : tone === "bad" ? c.danger : c.ink;
  return (
    <View style={styles.billRow}>
      <Text style={type.ui(strong ? 16 : 14, strong ? "extrabold" : "medium", strong ? c.ink : c.inkSoft)}>{label}</Text>
      <Text style={strong ? type.display(24, { semi: true, ls: -0.5, lh: 28 }) : type.ui(14, "bold", color)}>{value}</Text>
    </View>
  );
}

function BillCard({ bill }) {
  const { c, r, type, isDark } = useStoreTheme();
  const { subtotal, deliveryFee, deliveryBlocked, deliveryHint, platformFee, discount, total } = bill;
  const good = isDark ? c.brandBright : SUCCESS_INK;
  return (
    <Card>
      <CardTitle icon="receipt-outline" title={STORE_CART.bill.title} />
      <View style={styles.billBody}>
        <BillRow label={STORE_CART.bill.items} value={formatINR(subtotal)} />
        <BillRow
          label={STORE_CART.bill.delivery}
          value={deliveryBlocked ? STORE_CART.bill.unavailable : deliveryFee > 0 ? formatINR(deliveryFee) : STORE_CART.bill.free}
          tone={deliveryBlocked ? "bad" : deliveryFee > 0 ? undefined : "good"}
        />
        {deliveryHint ? (
          <Text style={type.ui(12, "medium", deliveryBlocked ? c.danger : c.inkMute, { marginTop: -4 })}>{deliveryHint}</Text>
        ) : null}
        <BillRow label={STORE_CART.bill.service} value={formatINR(platformFee)} />
        {discount > 0 ? <BillRow label={STORE_CART.bill.discount} value={`− ${formatINR(discount)}`} tone="good" /> : null}
        <View style={[styles.divider, { backgroundColor: c.line }]} />
        <BillRow label={STORE_CART.bill.total} value={formatINR(total)} strong />
        {discount > 0 ? (
          <View style={[styles.saved, { backgroundColor: c.goldSoft, borderRadius: r.md }]}>
            <MaterialCommunityIcons name="party-popper" size={16} color={c.goldText} />
            <Text style={type.ui(12.5, "bold", isDark ? c.goldText : "#7A4F12")}>{STORE_CART.bill.saved(formatINR(discount))}</Text>
          </View>
        ) : null}
        <Text style={[type.ui(11.5, "medium", c.inkMute), styles.billNote]}>
          <Text style={{ color: good }}>●</Text> {STORE_CART.bag.trust}
        </Text>
      </View>
    </Card>
  );
}

/* ---- checkout pieces ---- */

function Steps({ active }) {
  const { c, type } = useStoreTheme();
  return (
    <View style={styles.steps}>
      {STORE_CART.checkout.steps.map((label, i) => {
        const done = i < active;
        const current = i === active;
        return (
          <React.Fragment key={label}>
            {i > 0 ? <View style={[styles.stepLine, { backgroundColor: done || current ? c.brandBright : c.line }]} /> : null}
            <View style={styles.step}>
              <View
                style={[
                  styles.stepDot,
                  done ? { backgroundColor: c.brand } : current ? { backgroundColor: c.gold } : { backgroundColor: c.soft, borderColor: c.line, borderWidth: 1 },
                ]}
              >
                {done ? (
                  <Ionicons name="checkmark" size={14} color={c.onBrand} />
                ) : (
                  <Text style={type.ui(12, "extrabold", current ? "#3A2A0C" : c.inkMute)}>{i + 1}</Text>
                )}
              </View>
              <Text style={type.ui(12, current || done ? "bold" : "semibold", current || done ? c.ink : c.inkMute)}>{label}</Text>
            </View>
          </React.Fragment>
        );
      })}
    </View>
  );
}

function AddressTypeRow({ value, onChange }) {
  const { c, r, type } = useStoreTheme();
  return (
    <View style={styles.typeRow}>
      {STORE_CART.checkout.address.types.map((opt) => {
        const active = value === opt.key;
        return (
          <PressableScale
            key={opt.key}
            onPress={() => {
              hapticTick();
              onChange(opt.key);
            }}
            scaleTo={0.96}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
            accessibilityLabel={`${STORE_CART.checkout.address.typeLabel} ${opt.label}`}
            style={[
              styles.typeChip,
              { backgroundColor: active ? c.brandSoft : c.cardSoft, borderColor: active ? c.brand : c.line, borderWidth: active ? 1.5 : 1, borderRadius: r.lg },
            ]}
          >
            <Ionicons name={active ? opt.icon : `${opt.icon}-outline`} size={17} color={active ? c.brand : c.inkMute} />
            <Text style={type.ui(14, active ? "extrabold" : "semibold", active ? c.brand : c.inkSoft)}>{opt.label}</Text>
          </PressableScale>
        );
      })}
    </View>
  );
}

function AddressCard({ form, onChange, errors, detecting, onUseGps, hasSaved, onUseSaved, bill }) {
  const { c, r, type } = useStoreTheme();
  const copy = STORE_CART.checkout.address;
  const zoneHint =
    bill.deliveryHint && !bill.deliveryBlocked && bill.deliveryFee > 0
      ? `${bill.deliveryHint} · ${formatINR(bill.deliveryFee)} delivery`
      : bill.deliveryHint;
  const field = (key, extra) => ({
    label: copy.fields[key],
    value: form[key],
    onChangeText: (value) => onChange(key, value),
    error: errors?.[key] || "",
    placeholder: copy.placeholders?.[key],
    ...extra,
  });

  return (
    <Card style={styles.formCard}>
      <CardTitle
        icon="location-outline"
        title={copy.title}
        caption={copy.subtitle}
        right={
          hasSaved ? (
            <PressableScale scaleTo={0.97} lite onPress={onUseSaved} hitSlop={8} accessibilityRole="button" style={[styles.savedBtn, { backgroundColor: c.brandSoft }]}>
              <Text style={type.ui(12.5, "extrabold", c.brand)}>{copy.useSaved}</Text>
            </PressableScale>
          ) : null
        }
      />

      <PressableScale
        onPress={onUseGps}
        disabled={detecting}
        accessibilityRole="button"
        accessibilityLabel={copy.useGps}
        style={[styles.gps, { backgroundColor: c.goldSoft, borderColor: withAlpha(c.gold, 0.5), borderRadius: r.lg }]}
      >
        {detecting ? <ActivityIndicator size="small" color={c.goldText} /> : <MaterialCommunityIcons name="crosshairs-gps" size={19} color={c.goldText} />}
        <Text style={[type.ui(14, "bold", c.ink), styles.flex]}>{detecting ? copy.locating : copy.useGps}</Text>
        <Ionicons name="chevron-forward" size={16} color={c.inkMute} />
      </PressableScale>

      <Text style={[type.eyebrow(c.brandAlt, 10.5), styles.groupLabel]}>{copy.contact}</Text>
      <View style={styles.fields}>
        <StoreField {...field("fullName", { icon: "person-outline", autoCapitalize: "words", autoComplete: "name", textContentType: "name" })} />
        <StoreField {...field("phone", { icon: "call-outline", keyboardType: "phone-pad", autoComplete: "tel", textContentType: "telephoneNumber" })} />
      </View>

      <Text style={[type.eyebrow(c.brandAlt, 10.5), styles.groupLabel]}>{copy.where}</Text>
      <View style={styles.fields}>
        <AddressTypeRow value={form.addressType} onChange={(v) => onChange("addressType", v)} />
        <StoreField {...field("houseNumber", { icon: "business-outline", autoCapitalize: "characters" })} />
        <StoreField {...field("line1", { icon: "map-outline", autoCapitalize: "sentences", autoComplete: "street-address", textContentType: "streetAddressLine1" })} />
        <StoreField {...field("landmark", { icon: "navigate-outline" })} />
        <View style={styles.pair}>
          <StoreField style={styles.flex} {...field("city", { icon: "business-outline", autoCapitalize: "words", autoComplete: "address-level2", textContentType: "addressCity" })} />
          <StoreField style={styles.flex} {...field("postalCode", { icon: "pin-outline", keyboardType: "number-pad", autoComplete: "postal-code", textContentType: "postalCode" })} />
        </View>
        {zoneHint ? (
          <Animated.View
            entering={stateIn}
            style={[
              styles.serviceable,
              { backgroundColor: bill.deliveryBlocked ? c.dangerSoft : c.brandSoft, borderColor: bill.deliveryBlocked ? withAlpha(c.danger, 0.3) : withAlpha(c.brand, 0.2), borderRadius: r.md },
            ]}
          >
            <Ionicons name={bill.deliveryBlocked ? "close-circle" : "checkmark-circle"} size={17} color={bill.deliveryBlocked ? c.danger : c.brand} />
            <Text style={[type.ui(13, "bold", bill.deliveryBlocked ? c.danger : c.brandAlt), styles.flex]}>{zoneHint}</Text>
          </Animated.View>
        ) : null}
        <StoreField {...field("country", { icon: "flag-outline", autoCapitalize: "words" })} />
      </View>

      <Text style={[type.eyebrow(c.brandAlt, 10.5), styles.groupLabel]}>{copy.note}</Text>
      <StoreField {...field("note", { icon: "chatbubbles-outline", multiline: true })} />
    </Card>
  );
}

function PaymentCard({ value, onChange, disabled }) {
  const { c, r, type } = useStoreTheme();
  const copy = STORE_CART.checkout.payment;
  const options = [
    { id: "Razorpay", ...copy.online },
    { id: "Cash on Delivery", ...copy.cod },
  ];
  return (
    <Card>
      <CardTitle icon="wallet-outline" title={copy.title} caption={copy.subtitle} />
      <View style={styles.payOptions} accessibilityRole="radiogroup">
        {options.map((opt) => {
          const active = value === opt.id;
          return (
            <PressableScale
              key={opt.id}
              onPress={() => {
                hapticTick();
                onChange(opt.id);
              }}
              disabled={disabled}
              scaleTo={0.985}
              accessibilityRole="radio"
              accessibilityState={{ selected: active, disabled }}
              accessibilityLabel={`${opt.title}. ${opt.caption}`}
              style={[
                styles.payOption,
                { backgroundColor: active ? c.brandSoft : c.cardSoft, borderColor: active ? c.brand : c.line, borderWidth: active ? 1.5 : 1, borderRadius: r.xl, opacity: disabled ? 0.55 : 1 },
              ]}
            >
              <View style={[styles.payIcon, { backgroundColor: active ? c.card : c.soft }]}>
                <Ionicons name={opt.icon} size={21} color={active ? c.brand : c.inkSoft} />
              </View>
              <View style={styles.flex}>
                <Text style={type.ui(15.5, "extrabold", c.ink)}>{opt.title}</Text>
                <Text style={type.ui(12.5, "medium", c.inkMute)}>{opt.caption}</Text>
              </View>
              <Ionicons name={active ? "radio-button-on" : "radio-button-off"} size={22} color={active ? c.brand : c.lineStrong} />
            </PressableScale>
          );
        })}
      </View>
      <View style={styles.secure}>
        <Ionicons name="shield-checkmark-outline" size={15} color={c.inkMute} />
        <Text style={type.ui(12, "medium", c.inkMute)}>{copy.secure}</Text>
      </View>
    </Card>
  );
}

/* ---- docked pay bar ---- */

function PayDock({ bottom, total, meta, label, disabled, loading, onPress }) {
  const { c, type, shadow, isDark, gutter } = useStoreTheme();
  const inactive = disabled || loading;
  const colors = inactive ? [c.softStrong, c.softStrong] : isDark ? ["#C9DA8C", "#9DB45B"] : ["#3F6231", "#244424"];
  const ink = inactive ? c.inkMute : isDark ? "#18200C" : "#FFFFFF";

  return (
    <View style={[styles.payWrap, { bottom, left: gutter, right: gutter }]} pointerEvents="box-none">
      <View style={[styles.payShadow, shadow.lift, { borderColor: isDark ? c.line : withAlpha("#FFFFFF", 0.85) }]}>
        <View style={styles.payClip}>
          <View style={[StyleSheet.absoluteFill, { backgroundColor: c.glassStrong }]} />
          <View style={styles.payRow}>
            <View style={styles.flex}>
              <Text style={type.ui(11, "bold", c.inkMute, { letterSpacing: 0.4 })} numberOfLines={1}>
                {STORE_CART.cta.total} · {meta}
              </Text>
              <Text style={type.display(25, { ls: -0.6, lh: 30, semi: true })} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8}>
                {formatINR(total)}
              </Text>
            </View>
            <PressableScale
              onPress={onPress}
              disabled={inactive}
              scaleTo={0.97}
              accessibilityRole="button"
              accessibilityLabel={label}
              accessibilityState={{ disabled: inactive }}
              style={styles.payBtn}
            >
              <LinearGradient colors={colors} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[StyleSheet.absoluteFill, styles.payBtnFill]} />
              {loading ? (
                <ActivityIndicator size="small" color={ink} />
              ) : (
                <>
                  <Text style={type.ui(15, "extrabold", ink, { letterSpacing: 0.2 })} numberOfLines={1}>
                    {label}
                  </Text>
                  {!disabled ? <Ionicons name="arrow-forward" size={17} color={ink} /> : null}
                </>
              )}
            </PressableScale>
          </View>
        </View>
      </View>
    </View>
  );
}

/* ---- empty + sign-in states ---- */

function CenterCard({ icon, title, body, primary, onPrimary, secondary, onSecondary }) {
  const { c, r, type } = useStoreTheme();
  return (
    <Card style={styles.center}>
      <View style={[styles.bigIcon, { backgroundColor: c.brandSoft }]}>
        <Ionicons name={icon} size={36} color={c.brand} />
      </View>
      <Text style={type.display(24, { semi: true, lh: 30, ls: -0.4 })}>{title}</Text>
      <Text style={[type.ui(14.5, "medium", c.inkMute, { lineHeight: 21 }), styles.centerText]}>{body}</Text>
      <PressableScale onPress={onPrimary} accessibilityRole="button" accessibilityLabel={primary} style={[styles.bigBtn, { backgroundColor: c.brand, borderRadius: r.pill }]}>
        <Text style={type.ui(15, "extrabold", c.onBrand)}>{primary}</Text>
      </PressableScale>
      {secondary ? (
        <PressableScale scaleTo={0.97} lite onPress={onSecondary} hitSlop={8} accessibilityRole="button" accessibilityLabel={secondary}>
          <Text style={type.ui(14, "bold", c.brandAlt)}>{secondary}</Text>
        </PressableScale>
      ) : null}
    </Card>
  );
}

/* ---- screen ---- */

const EMPTY_FORM = {};

/**
 * Native bag + checkout. One component for the three states of `CartScreen`:
 *  - `bag`      items, free-delivery progress, coupon, bill, pay dock → Checkout
 *  - `checkout` order summary, delivery address, payment method, bill, pay dock → place order
 *  - `gate`     signed-out guest reaching checkout
 * All state and side effects (coupon, delivery quote, Razorpay / COD) stay in `CartScreen`.
 */
export default function StoreCart({
  mode = "bag",
  navigation,
  isAuthenticated = false,
  items = [],
  totalItems = 0,
  onIncrease,
  onDecrease,
  onRemove,
  coupon,
  bill,
  form = EMPTY_FORM,
  onFormChange,
  fieldErrors,
  error = "",
  onDismissError,
  detectingLocation = false,
  onUseGps,
  hasSavedAddress = false,
  onUseSaved,
  paymentMethod = "Razorpay",
  onPaymentChange,
  placing = false,
  ctaDisabled = false,
  onPrimary,
}) {
  const { c, type, gutter } = useStoreTheme();
  const insets = useSafeAreaInsets();
  const scrollY = useSharedValue(0);
  const onScroll = useAnimatedScrollHandler((event) => {
    scrollY.value = event.contentOffset.y;
  });
  const navDock = Math.max(16, insets.bottom + 6);
  const payBottom = navDock + STORE_NAV_HEIGHT + 10;
  const isCheckout = mode === "checkout";
  const hasItems = items.length > 0;
  const showDock = mode !== "gate" && hasItems;
  const scrollPad = showDock ? payBottom + PAY_DOCK_HEIGHT + 28 : navDock + STORE_NAV_HEIGHT + 28;

  const goBack = useCallback(() => {
    if (isCheckout) navigation.navigate("Cart");
    else if (navigation.canGoBack?.()) navigation.goBack();
    else navigation.navigate("Home");
  }, [isCheckout, navigation]);

  const addressDone = Boolean(form.fullName && form.phone && form.houseNumber && form.line1 && form.city && form.postalCode);
  const deliverTo = [form.city, form.postalCode].filter(Boolean).join(" ");
  const caption = hasItems ? `${STORE_CART.bag.count(totalItems)}${deliverTo && !isCheckout ? ` · ${deliverTo}` : ""}` : "";

  const ctaLabel = isCheckout
    ? paymentMethod === "Razorpay"
      ? STORE_CART.cta.pay
      : STORE_CART.cta.place
    : isAuthenticated
      ? STORE_CART.cta.checkout
      : STORE_CART.cta.signIn;

  const meta = useMemo(() => {
    const parts = [STORE_CART.bag.count(totalItems)];
    if (bill?.deliveryBlocked) parts.push(STORE_CART.bill.unavailable);
    else if (bill && !bill.deliveryFee) parts.push(STORE_CART.freeDelivery.pill);
    return parts.join(" · ");
  }, [bill, totalItems]);

  const renderItems = (compact) =>
    items.map((item) => (
      <CartLine key={cartLineKey(item)} item={item} compact={compact} onIncrease={onIncrease} onDecrease={onDecrease} onRemove={onRemove} />
    ));

  let body;
  if (mode === "gate") {
    body = (
      <View style={{ paddingHorizontal: gutter, gap: 16 }}>
        <CenterCard
          icon="lock-closed-outline"
          title={STORE_CART.gate.title}
          body={STORE_CART.gate.body}
          primary={STORE_CART.gate.cta}
          onPrimary={() => navigation.navigate("Login")}
          secondary={STORE_CART.gate.secondary}
          onSecondary={() => navigation.navigate("Cart")}
        />
      </View>
    );
  } else if (!hasItems) {
    body = (
      <View style={{ paddingHorizontal: gutter, gap: 16 }}>
        <Heading title={isCheckout ? STORE_CART.checkout.heading : STORE_CART.bag.title} />
        <CenterCard
          icon="bag-handle-outline"
          title={STORE_CART.empty.title}
          body={STORE_CART.empty.body}
          primary={STORE_CART.empty.cta}
          onPrimary={() => navigation.navigate("Home")}
        />
      </View>
    );
  } else if (isCheckout) {
    body = (
      <View style={{ paddingHorizontal: gutter, gap: 16 }}>
        <Heading title={STORE_CART.checkout.heading} caption={caption} />
        <Steps active={addressDone ? 2 : 1} />
        {error ? <StoreBanner message={error} onClose={onDismissError} /> : null}
        <AddressCard
          form={form}
          onChange={onFormChange}
          errors={fieldErrors}
          detecting={detectingLocation}
          onUseGps={onUseGps}
          hasSaved={hasSavedAddress}
          onUseSaved={onUseSaved}
          bill={bill}
        />
        <PaymentCard value={paymentMethod} onChange={onPaymentChange} disabled={placing} />
        <Card>
          <CardTitle
            icon="bag-check-outline"
            title={STORE_CART.checkout.summaryTitle}
            caption={STORE_CART.bag.count(totalItems)}
            right={
              <PressableScale scaleTo={0.97} lite onPress={() => navigation.navigate("Cart")} hitSlop={8} accessibilityRole="button">
                <Text style={type.ui(13.5, "extrabold", c.brand)}>{STORE_CART.checkout.editBag}</Text>
              </PressableScale>
            }
          />
          <View style={styles.summaryList}>{renderItems(true)}</View>
        </Card>
        <BillCard bill={bill} />
      </View>
    );
  } else {
    body = (
      <View style={{ paddingHorizontal: gutter, gap: 16 }}>
        <Heading title={STORE_CART.bag.title} caption={caption} />
        {error ? <StoreBanner message={error} onClose={onDismissError} /> : null}
        <FreeDeliveryStrip subtotal={bill.subtotal} />
        <Animated.View layout={LinearTransition.duration(200)} style={styles.lines}>
          {renderItems(false)}
        </Animated.View>
        {coupon ? <CouponCard coupon={coupon} /> : null}
        <BillCard bill={bill} />
      </View>
    );
  }

  return (
    <View style={[styles.screen, { backgroundColor: c.page }]}>
      <Animated.ScrollView
        onScroll={onScroll}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
        automaticallyAdjustKeyboardInsets
        contentContainerStyle={{ paddingTop: insets.top + SCREEN_HEADER_PAD, paddingBottom: scrollPad }}
      >
        {body}
      </Animated.ScrollView>

      <ScreenHeader
        title={isCheckout || mode === "gate" ? STORE_CART.checkout.title : STORE_CART.bag.navTitle}
        onBack={goBack}
        backLabel={STORE_CART.back}
        scrollY={scrollY}
      />

      {showDock && bill ? <ScrollEdgeFade height={payBottom + PAY_DOCK_HEIGHT + 22} /> : null}
      {showDock && bill ? (
        <PayDock bottom={payBottom} total={bill.total} meta={meta} label={ctaLabel} disabled={ctaDisabled} loading={placing} onPress={onPrimary} />
      ) : null}

      <FloatingNav />
      <CheckoutPlacingOverlay visible={placing} />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  flex: { flex: 1, minWidth: 0 },
  card: { borderWidth: StyleSheet.hairlineWidth, padding: 18, gap: 14 },
  cardTitle: { flexDirection: "row", alignItems: "center", gap: 12 },
  titleIcon: { width: 38, height: 38, borderRadius: 19, alignItems: "center", justifyContent: "center" },
  heading: { gap: 5, paddingTop: 4 },
  banner: { flexDirection: "row", alignItems: "center", gap: 9, padding: 13, borderWidth: 1 },
  free: { padding: 14, gap: 11, borderWidth: 1 },
  freeTop: { flexDirection: "row", alignItems: "center", gap: 11 },
  freeIcon: { width: 34, height: 34, borderRadius: 17, alignItems: "center", justifyContent: "center" },
  track: { height: 7, borderRadius: 4, overflow: "hidden" },
  fill: { height: "100%", borderRadius: 4 },
  lines: { gap: 12 },
  line: { flexDirection: "row", gap: 13, padding: 12, borderWidth: StyleSheet.hairlineWidth },
  thumb: { overflow: "hidden", borderWidth: StyleSheet.hairlineWidth, alignItems: "center", justifyContent: "center" },
  lineBody: { flex: 1, minWidth: 0, gap: 6 },
  lineTop: { flexDirection: "row", alignItems: "flex-start", gap: 8 },
  removeBtn: { width: 26, height: 26, alignItems: "center", justifyContent: "center", marginTop: -2, marginRight: -4 },
  lineMeta: { flexDirection: "row", alignItems: "center", gap: 8, flexWrap: "wrap" },
  variantPill: { paddingHorizontal: 9, paddingVertical: 3, borderRadius: 9 },
  lineFoot: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 10, marginTop: 2 },
  couponCard: { gap: 10, padding: 14 },
  couponRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  couponInput: { flex: 1, minWidth: 0, height: 44, paddingHorizontal: 13, borderWidth: 1 },
  couponBtn: { height: 44, paddingHorizontal: 18, borderRadius: 22, alignItems: "center", justifyContent: "center" },
  couponApplied: { flexDirection: "row", alignItems: "center", gap: 6, paddingLeft: 4 },
  billBody: { gap: 12 },
  billRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12 },
  divider: { height: StyleSheet.hairlineWidth, marginVertical: 2 },
  saved: { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 12, paddingVertical: 10 },
  billNote: { marginTop: 2 },
  steps: { flexDirection: "row", alignItems: "center", paddingHorizontal: 6 },
  step: { alignItems: "center", gap: 6 },
  stepDot: { width: 28, height: 28, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  stepLine: { flex: 1, height: 2, borderRadius: 1, marginHorizontal: 8, marginBottom: 20 },
  formCard: { gap: 12 },
  savedBtn: { height: 30, paddingHorizontal: 12, borderRadius: 15, alignItems: "center", justifyContent: "center" },
  gps: { flexDirection: "row", alignItems: "center", gap: 11, height: 50, paddingHorizontal: 14, borderWidth: 1 },
  groupLabel: { marginTop: 6 },
  fields: { gap: 12 },
  typeRow: { flexDirection: "row", gap: 10 },
  typeChip: { flex: 1, height: 46, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 7 },
  pair: { flexDirection: "row", gap: 10 },
  serviceable: { flexDirection: "row", alignItems: "center", gap: 8, padding: 11, borderWidth: 1 },
  payOptions: { gap: 10 },
  payOption: { flexDirection: "row", alignItems: "center", gap: 13, padding: 14 },
  payIcon: { width: 42, height: 42, borderRadius: 21, alignItems: "center", justifyContent: "center" },
  secure: { flexDirection: "row", alignItems: "center", gap: 7, paddingLeft: 2 },
  summaryList: { gap: 10 },
  payWrap: { position: "absolute", zIndex: 90 },
  payShadow: { height: PAY_DOCK_HEIGHT, borderRadius: 28, borderWidth: 1 },
  payClip: { flex: 1, borderRadius: 28, overflow: "hidden" },
  payRow: { flex: 1, flexDirection: "row", alignItems: "center", gap: 12, paddingLeft: 20, paddingRight: 12 },
  payBtn: { minWidth: 148, height: 54, borderRadius: 27, overflow: "hidden", flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingHorizontal: 20 },
  payBtnFill: { borderRadius: 27 },
  center: { alignItems: "center", gap: 12, paddingVertical: 32, paddingHorizontal: 24 },
  centerText: { textAlign: "center" },
  bigIcon: { width: 76, height: 76, borderRadius: 38, alignItems: "center", justifyContent: "center", marginBottom: 2 },
  bigBtn: { height: 52, paddingHorizontal: 30, alignItems: "center", justifyContent: "center", marginTop: 6 },
});
