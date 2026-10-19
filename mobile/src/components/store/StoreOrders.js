import React, { memo, useCallback } from "react";
import { Linking, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, { FadeInDown, LinearTransition } from "react-native-reanimated";
import { MY_ORDERS_UI } from "../../content/appContent";
import { STORE_ORDERS } from "../../content/storefrontContent";
import { STORE_NAV_HEIGHT, useStoreTheme, withAlpha } from "../../theme/storefront";
import { formatINR, formatINRCompact } from "../../utils/currency";
import { hapticTick } from "../../utils/haptics";
import { formatOrderShortId, getPartnerInitial } from "../../utils/orderDisplay";
import { formatPaymentStatusLabel, getInvoiceStatusBadge, resolveInvoiceNumber } from "../../utils/orderInvoiceMeta";
import {
  ORDER_PROGRESS_STEPS,
  getActiveProgressStep,
  getOrderStatusHint,
  getOrderStatusLabel,
  isCancelledOrder,
  isDeliveredOrder,
} from "../../utils/orderStatus";
import { formatCompactShippingLine } from "../../utils/shippingAddressFormat";
import { productImageUri } from "../../utils/storefront";
import OrderLiveMapCard from "../orders/OrderLiveMapCard";
import PaymentStatusBanner from "../payments/PaymentStatusBanner";
import SkeletonBlock from "../ui/SkeletonBlock";
import FloatingNav from "./FloatingNav";
import PressableScale from "./PressableScale";
import ScreenHeader, { SCREEN_HEADER_PAD } from "./ScreenHeader";
import StoreBanner from "./StoreBanner";
import StoreField from "./StoreField";

const LIVE_MAP_STATUSES = new Set(["ready_for_pickup", "shipped", "out_for_delivery"]);
const GOOD_INK = "#2F5A22";

function formatPlaced(value) {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  const date = d.toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
  const time = d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
  return `${date} · ${time}`;
}

/* ---- small building blocks ---- */

function StatusChip({ status }) {
  const { c, type, isDark } = useStoreTheme();
  const delivered = isDeliveredOrder(status);
  const cancelled = isCancelledOrder(status);
  const pending = String(status) === "pending_payment";
  const palette = delivered
    ? { bg: c.brandSoft, fg: isDark ? c.brandBright : GOOD_INK, border: withAlpha(c.brand, 0.25), dot: c.brandBright }
    : cancelled
      ? { bg: c.dangerSoft, fg: c.danger, border: withAlpha(c.danger, 0.3), dot: c.danger }
      : { bg: c.goldSoft, fg: c.goldText, border: withAlpha(c.gold, 0.5), dot: c.gold };
  return (
    <View style={[styles.chip, { backgroundColor: palette.bg, borderColor: palette.border }]}>
      <View style={[styles.chipDot, { backgroundColor: palette.dot }]} />
      <Text style={type.ui(11.5, "extrabold", palette.fg, { letterSpacing: 0.2 })} numberOfLines={1}>
        {pending ? STORE_ORDERS.card.paymentPending : getOrderStatusLabel(status)}
      </Text>
    </View>
  );
}

function Thumbs({ products }) {
  const { c, type } = useStoreTheme();
  const shown = products.slice(0, 3);
  const extra = products.length - shown.length;
  return (
    <View style={styles.thumbs}>
      {shown.map((p, i) => {
        const uri = productImageUri({ image: p.image }, 52);
        return (
          <View key={`${p.name}-${i}`} style={[styles.thumb, { backgroundColor: c.well, borderColor: c.card, marginLeft: i ? -14 : 0, zIndex: shown.length - i }]}>
            {uri ? <Image source={{ uri }} style={StyleSheet.absoluteFill} contentFit="cover" cachePolicy="memory-disk" /> : <MaterialCommunityIcons name="image-outline" size={18} color={c.inkMute} />}
          </View>
        );
      })}
      {extra > 0 ? (
        <View style={[styles.thumb, styles.thumbMore, { backgroundColor: c.brandSoft, borderColor: c.card, marginLeft: -14 }]}>
          <Text style={type.ui(11, "extrabold", c.brand)}>{STORE_ORDERS.card.more(extra)}</Text>
        </View>
      ) : null}
    </View>
  );
}

function Progress({ status }) {
  const { c, type } = useStoreTheme();
  const step = getActiveProgressStep(status);
  const hint = getOrderStatusHint(status);
  return (
    <View style={styles.progress}>
      <View style={styles.segments}>
        {ORDER_PROGRESS_STEPS.map((s, i) => (
          <View
            key={s.key}
            style={[styles.segment, { backgroundColor: i < step ? c.brand : i === step ? c.gold : c.softStrong }]}
          />
        ))}
      </View>
      <View style={styles.progressText}>
        <Text style={type.ui(13.5, "extrabold", c.ink)}>{ORDER_PROGRESS_STEPS[step].title}</Text>
        {hint ? <Text style={type.ui(12.5, "medium", c.inkMute)}>{hint}</Text> : null}
      </View>
    </View>
  );
}

function ActionChip({ icon, label, onPress, disabled, active }) {
  const { c, r, type } = useStoreTheme();
  return (
    <PressableScale
      onPress={() => {
        hapticTick();
        onPress?.();
      }}
      disabled={disabled}
      scaleTo={0.96}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={[
        styles.action,
        { backgroundColor: active ? c.brandSoft : c.cardSoft, borderColor: active ? withAlpha(c.brand, 0.35) : c.line, borderRadius: r.lg, opacity: disabled ? 0.5 : 1 },
      ]}
    >
      <Ionicons name={icon} size={18} color={active ? c.brand : c.inkSoft} />
      <Text style={type.ui(12, "bold", active ? c.brand : c.inkSoft)} numberOfLines={1}>
        {label}
      </Text>
    </PressableScale>
  );
}

function DetailRow({ label, value, tone, last }) {
  const { c, type } = useStoreTheme();
  const color = tone === "good" ? GOOD_INK : c.ink;
  return (
    <View style={[styles.detailRow, !last && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: c.line }]}>
      <Text style={[type.ui(13, "medium", c.inkMute), styles.detailLabel]}>{label}</Text>
      <Text style={[type.ui(13, "bold", color), styles.detailValue]} numberOfLines={2}>
        {value}
      </Text>
    </View>
  );
}

function Breakdown({ order }) {
  const { c, r, type, isDark } = useStoreTheme();
  const d = STORE_ORDERS.detail;
  const b = order.priceBreakdown || {};
  const a = order.shippingAddress || {};
  const lines = [a.fullName, [a.houseNumber, a.line1].filter(Boolean).join(", "), [a.city, a.state].filter(Boolean).join(", "), [a.postalCode, a.country].filter(Boolean).join(" ")].filter((l) => String(l || "").trim());
  const badge = getInvoiceStatusBadge(order);
  const good = isDark ? c.brandBright : GOOD_INK;

  return (
    <Animated.View entering={FadeInDown.duration(180)} style={[styles.breakdown, { backgroundColor: c.cardSoft, borderColor: c.line, borderRadius: r.xl }]}>
      <Text style={type.display(17, { semi: true, ls: -0.2, lh: 22 })}>{d.title}</Text>

      <View style={styles.lineItems}>
        {(order.products || []).map((p, i) => {
          const uri = productImageUri({ image: p.image }, 48);
          return (
            <View key={`${p.name}-${i}`} style={styles.lineItem}>
              <View style={[styles.lineThumb, { backgroundColor: c.well, borderColor: c.line }]}>
                {uri ? <Image source={{ uri }} style={StyleSheet.absoluteFill} contentFit="cover" cachePolicy="memory-disk" /> : null}
              </View>
              <Text style={[type.ui(13.5, "semibold", c.ink, { lineHeight: 18 }), styles.flex]} numberOfLines={2}>
                {p.name}
              </Text>
              <Text style={type.ui(13, "bold", c.inkMute)}>× {p.quantity}</Text>
              <Text style={type.ui(13.5, "extrabold", c.ink)}>{formatINR(Number(p.price || 0) * Number(p.quantity || 1))}</Text>
            </View>
          );
        })}
      </View>

      <View>
        <DetailRow label={d.items} value={formatINR(b.itemsTotal || 0)} />
        <DetailRow label={d.delivery} value={Number(b.deliveryFee || 0) > 0 ? formatINR(b.deliveryFee) : d.free} tone={Number(b.deliveryFee || 0) > 0 ? undefined : "good"} />
        <DetailRow label={d.platform} value={formatINR(b.platformFee || 0)} />
        {Number(b.discountAmount || 0) > 0 ? <DetailRow label={d.discount} value={`− ${formatINR(b.discountAmount)}`} tone="good" /> : null}
        {order.coupon?.code ? <DetailRow label={d.coupon} value={order.coupon.code} /> : null}
        <DetailRow label={d.paymentMethod} value={order.paymentMethod || "Cash on Delivery"} />
        <DetailRow label={d.paymentStatus} value={formatPaymentStatusLabel(order.paymentStatus)} />
        {order.razorpay?.paymentId ? <DetailRow label={d.paymentId} value={order.razorpay.paymentId} /> : null}
        {Number(order.invoice?.taxAmount || 0) > 0 ? <DetailRow label={d.tax} value={formatINR(order.invoice.taxAmount)} /> : null}
        <DetailRow label={d.invoice} value={`${resolveInvoiceNumber(order)} · ${badge.label}`} last />
      </View>

      <View style={[styles.totalBand, { backgroundColor: c.goldSoft, borderColor: withAlpha(c.gold, 0.45), borderRadius: r.lg }]}>
        <Text style={type.ui(12, "extrabold", c.goldText, { letterSpacing: 0.8, textTransform: "uppercase" })}>{d.total}</Text>
        <Text style={type.display(24, { semi: true, ls: -0.5, lh: 28, color: isDark ? c.ink : "#3A2A0C" })}>{formatINR(order.totalPrice)}</Text>
      </View>

      {lines.length ? (
        <View style={[styles.addressBox, { backgroundColor: c.card, borderColor: c.line, borderRadius: r.lg }]}>
          <View style={styles.addressHead}>
            <Ionicons name="location-outline" size={16} color={good} />
            <Text style={type.ui(12, "extrabold", c.inkMute, { letterSpacing: 0.6, textTransform: "uppercase" })}>{d.address}</Text>
          </View>
          {lines.map((line) => (
            <Text key={line} style={type.ui(13.5, "medium", c.inkSoft, { lineHeight: 20 })}>
              {line}
            </Text>
          ))}
        </View>
      ) : null}
    </Animated.View>
  );
}

function EditAddress({ form, onChange, onSave, onCancel, saving }) {
  const { c, r, type } = useStoreTheme();
  const { addressFields, addressFieldRows } = MY_ORDERS_UI;
  return (
    <Animated.View entering={FadeInDown.duration(180)} style={[styles.edit, { backgroundColor: c.cardSoft, borderColor: c.line, borderRadius: r.xl }]}>
      <View>
        <Text style={type.display(17, { semi: true, ls: -0.2, lh: 22 })}>{STORE_ORDERS.edit.title}</Text>
        <Text style={type.ui(12.5, "medium", c.inkMute)}>{STORE_ORDERS.edit.subtitle}</Text>
      </View>
      {addressFieldRows.map((keys) => (
        <View key={keys.join("-")} style={keys.length > 1 ? styles.pair : null}>
          {keys.map((key) => {
            const field = addressFields[key];
            if (!field) return null;
            return (
              <StoreField
                key={key}
                style={keys.length > 1 ? styles.flex : null}
                label={field.label}
                icon={field.icon}
                value={form[key] || ""}
                onChangeText={(value) => onChange(key, value)}
                keyboardType={field.keyboardType}
                autoCapitalize={field.autoCapitalize}
              />
            );
          })}
        </View>
      ))}
      <View style={styles.editActions}>
        <PressableScale
          onPress={onSave}
          disabled={saving}
          accessibilityRole="button"
          accessibilityLabel={STORE_ORDERS.edit.save}
          style={[styles.editSave, { backgroundColor: saving ? c.softStrong : c.brand }]}
        >
          <Text style={type.ui(14, "extrabold", saving ? c.inkMute : c.onBrand)}>{saving ? STORE_ORDERS.edit.saving : STORE_ORDERS.edit.save}</Text>
        </PressableScale>
        <Pressable onPress={onCancel} hitSlop={8} accessibilityRole="button" style={styles.editCancel}>
          <Text style={type.ui(14, "bold", c.inkSoft)}>{STORE_ORDERS.edit.cancel}</Text>
        </Pressable>
      </View>
    </Animated.View>
  );
}

/* ---- order card ---- */

function OrderCardBase({
  order,
  compact,
  token,
  user,
  expanded,
  editing,
  addressForm,
  canEdit,
  busy,
  handlers,
}) {
  const { c, r, type, shadow, isDark } = useStoreTheme();
  const status = String(order.status || "");
  const delivered = isDeliveredOrder(status);
  const cancelled = isCancelledOrder(status);
  const inFlight = !delivered && !cancelled && status !== "pending_payment";
  const showMap = LIVE_MAP_STATUSES.has(status);
  const products = Array.isArray(order.products) ? order.products : [];
  const itemCount = products.reduce((sum, p) => sum + Number(p.quantity || 0), 0);
  const first = String(products[0]?.name || "").trim() || "Your order";
  const more = products.length - 1;
  const ship = formatCompactShippingLine(order.shippingAddress);
  const partner = order.assignedDeliveryUser;
  const showPartner = partner?.name && ["out_for_delivery", "shipped", "ready_for_pickup"].includes(status);
  const rewardClaimed = Boolean(order.reward?.claimedAt);
  const id = order._id;
  const a = STORE_ORDERS.actions;

  const call = useCallback(() => {
    const phone = String(partner?.phone || "").replace(/\s/g, "");
    if (phone) Linking.openURL(`tel:${phone}`);
  }, [partner?.phone]);

  const colors = isDark ? ["#C9DA8C", "#9DB45B"] : ["#3F6231", "#244424"];
  const ink = isDark ? "#18200C" : "#FFFFFF";

  return (
    <Animated.View
      layout={LinearTransition.duration(200)}
      style={[styles.card, shadow.card, { backgroundColor: c.card, borderColor: c.line, borderRadius: r.xxl }]}
    >
      {showMap ? (
        <View style={styles.map}>
          <OrderLiveMapCard orderId={id} />
        </View>
      ) : null}
      {inFlight && !showMap ? (
        <LinearGradient colors={[c.gold, c.brandBright]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.accentBar} />
      ) : null}

      <View style={styles.cardBody}>
        <View style={styles.headRow}>
          <View style={styles.flex}>
            <Text style={type.ui(11.5, "extrabold", c.inkMute, { letterSpacing: 0.9, textTransform: "uppercase" })}>
              {STORE_ORDERS.card.order(formatOrderShortId(id))}
            </Text>
            <Text style={type.ui(12, "medium", c.inkMute)}>{formatPlaced(order.createdAt)}</Text>
          </View>
          <StatusChip status={status} />
        </View>

        <View style={styles.itemsRow}>
          <Thumbs products={products} />
          <View style={styles.flex}>
            <Text style={type.ui(14.5, "bold", c.ink, { lineHeight: 19 })} numberOfLines={2}>
              {first}
              {more > 0 ? ` + ${more} more` : ""}
            </Text>
            <Text style={type.ui(12.5, "medium", c.inkMute)}>{STORE_ORDERS.card.items(itemCount)}</Text>
          </View>
          <Text style={type.display(compact ? 19 : 22, { semi: true, ls: -0.4, lh: 26 })}>{formatINR(order.totalPrice)}</Text>
        </View>

        {inFlight ? <Progress status={status} /> : null}

        {!compact && ship ? (
          <View style={[styles.shipRow, { backgroundColor: c.soft, borderRadius: r.md }]}>
            <Ionicons name="navigate-outline" size={15} color={c.brandAlt} />
            <Text style={[type.ui(12.5, "medium", c.inkSoft), styles.flex]} numberOfLines={1}>
              {STORE_ORDERS.card.deliverTo} · {ship}
            </Text>
          </View>
        ) : null}

        {showPartner ? (
          <View style={[styles.partner, { backgroundColor: c.cardSoft, borderColor: c.line, borderRadius: r.lg }]}>
            <LinearGradient colors={[c.gold, c.brand]} style={styles.partnerAvatar}>
              <Text style={type.ui(15, "extrabold", "#FFFFFF")}>{getPartnerInitial(partner.name)}</Text>
            </LinearGradient>
            <View style={styles.flex}>
              <Text style={type.ui(14, "bold", c.ink)} numberOfLines={1}>
                {partner.name}
              </Text>
              <Text style={type.ui(12, "medium", c.inkMute)}>{STORE_ORDERS.card.partnerOnWay}</Text>
            </View>
            {partner.phone ? (
              <Pressable
                onPress={call}
                accessibilityRole="button"
                accessibilityLabel={STORE_ORDERS.card.callPartner}
                style={[styles.callBtn, { backgroundColor: c.brand }]}
              >
                <Ionicons name="call" size={16} color={c.onBrand} />
              </Pressable>
            ) : null}
          </View>
        ) : null}

        {status === "pending_payment" && order.paymentStatus === "pending" ? (
          <PaymentStatusBanner order={order} token={token} user={user} onRefresh={handlers.onReload} />
        ) : null}

        <View style={styles.actions}>
          <ActionChip
            icon={expanded ? "chevron-up" : "reader-outline"}
            label={expanded ? a.hideDetails : a.details}
            onPress={() => handlers.onToggleDetails(id)}
            active={expanded}
          />
          <ActionChip
            icon="download-outline"
            label={busy.downloading ? a.invoiceBusy : a.invoice}
            onPress={() => handlers.onDownloadInvoice(order)}
            disabled={busy.downloading}
          />
          {canEdit ? <ActionChip icon="create-outline" label={a.editAddress} onPress={() => handlers.onOpenEdit(order)} active={editing} /> : null}
          {delivered ? (
            <ActionChip
              icon={rewardClaimed ? "sparkles" : "sparkles-outline"}
              label={rewardClaimed ? a.rewardDone : busy.claiming ? a.rewardBusy : a.reward}
              onPress={() => handlers.onClaimReward(id)}
              disabled={rewardClaimed || busy.claiming}
              active={rewardClaimed}
            />
          ) : null}
        </View>

        {expanded ? <Breakdown order={order} /> : null}
        {editing ? (
          <EditAddress
            form={addressForm}
            onChange={handlers.onAddressChange}
            onSave={() => handlers.onSaveAddress(id)}
            onCancel={handlers.onCancelEdit}
            saving={busy.saving}
          />
        ) : null}

        <PressableScale
          onPress={() => handlers.onReorder(id)}
          disabled={busy.reordering}
          accessibilityRole="button"
          accessibilityLabel={a.reorder}
          style={styles.reorder}
        >
          <LinearGradient colors={colors} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[StyleSheet.absoluteFill, styles.reorderFill, busy.reordering && { opacity: 0.7 }]} />
          <MaterialCommunityIcons name="repeat" size={19} color={ink} />
          <Text style={type.ui(14.5, "extrabold", ink, { letterSpacing: 0.2 })}>{busy.reordering ? a.reordering : a.reorder}</Text>
        </PressableScale>
      </View>
    </Animated.View>
  );
}

const OrderCard = memo(OrderCardBase);

/* ---- page pieces ---- */

function StatsCard({ stats }) {
  const { c, r, type, shadow } = useStoreTheme();
  const items = [
    { key: "total", label: STORE_ORDERS.stats.total, value: String(stats.total) },
    { key: "active", label: STORE_ORDERS.stats.active, value: String(stats.inFlight), live: stats.inFlight > 0 },
    { key: "delivered", label: STORE_ORDERS.stats.delivered, value: String(stats.delivered) },
    { key: "spent", label: STORE_ORDERS.stats.spent, value: formatINRCompact(stats.totalSpent) },
  ];
  return (
    <View style={[styles.stats, shadow.soft, { backgroundColor: c.card, borderColor: c.line, borderRadius: r.xxl }]}>
      {items.map((it, i) => (
        <View key={it.key} style={[styles.stat, i > 0 && { borderLeftWidth: StyleSheet.hairlineWidth, borderLeftColor: c.line }]}>
          <View style={styles.statValue}>
            <Text style={type.display(22, { semi: true, ls: -0.5, lh: 28 })} numberOfLines={1}>
              {it.value}
            </Text>
            {it.live ? <View style={[styles.liveDot, { backgroundColor: c.brandBright }]} /> : null}
          </View>
          <Text style={type.ui(11.5, "bold", c.inkMute)} numberOfLines={1}>
            {it.label}
          </Text>
        </View>
      ))}
    </View>
  );
}

function FilterPills({ filter, counts, onChange }) {
  const { c, type } = useStoreTheme();
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.pills}>
      {STORE_ORDERS.filters.map((f) => {
        const active = filter === f.key;
        return (
          <Pressable
            key={f.key}
            onPress={() => {
              hapticTick();
              onChange(f.key);
            }}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
            style={[styles.pill, { backgroundColor: active ? c.brand : c.card, borderColor: active ? c.brand : c.line }]}
          >
            <Text style={type.ui(13.5, active ? "extrabold" : "semibold", active ? c.onBrand : c.ink)}>{f.label}</Text>
            <View style={[styles.pillCount, { backgroundColor: active ? withAlpha(c.onBrand, 0.2) : c.soft }]}>
              <Text style={type.ui(11, "extrabold", active ? c.onBrand : c.inkSoft)}>{counts[f.key] ?? 0}</Text>
            </View>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

function SectionLabel({ title, caption, count, live }) {
  const { c, type } = useStoreTheme();
  return (
    <View style={styles.sectionHead}>
      <View style={[styles.sectionBar, { backgroundColor: c.gold }]} />
      <View style={styles.flex}>
        <View style={styles.sectionTitleRow}>
          <Text style={type.display(21, { ls: -0.4, lh: 26 })} accessibilityRole="header">
            {title}
          </Text>
          {live ? (
            <View style={[styles.livePill, { backgroundColor: c.brandSoft }]}>
              <View style={[styles.liveDot, { backgroundColor: c.brandBright }]} />
              <Text style={type.ui(11, "extrabold", c.brand)}>{STORE_ORDERS.card.live}</Text>
            </View>
          ) : null}
        </View>
        {caption ? <Text style={type.ui(12.5, "medium", c.inkMute)}>{caption}</Text> : null}
      </View>
      {count != null ? <Text style={type.ui(13, "bold", c.inkMute)}>{count}</Text> : null}
    </View>
  );
}

function EmptyOrders({ onShop }) {
  const { c, r, type, shadow } = useStoreTheme();
  return (
    <View style={[styles.empty, shadow.soft, { backgroundColor: c.card, borderColor: c.line, borderRadius: r.xxl }]}>
      <View style={[styles.emptyIcon, { backgroundColor: c.brandSoft }]}>
        <MaterialCommunityIcons name="repeat" size={34} color={c.brand} />
      </View>
      <Text style={type.display(23, { semi: true, ls: -0.4, lh: 29 })}>{STORE_ORDERS.empty.title}</Text>
      <Text style={[type.ui(14, "medium", c.inkMute, { lineHeight: 20 }), styles.centerText]}>{STORE_ORDERS.empty.body}</Text>
      <PressableScale onPress={onShop} accessibilityRole="button" accessibilityLabel={STORE_ORDERS.empty.cta} style={[styles.emptyBtn, { backgroundColor: c.brand }]}>
        <Text style={type.ui(14.5, "extrabold", c.onBrand)}>{STORE_ORDERS.empty.cta}</Text>
      </PressableScale>
    </View>
  );
}

function LoadingOrders() {
  return (
    <View style={styles.loading}>
      <SkeletonBlock width="100%" height={84} rounded={30} />
      <SkeletonBlock width="70%" height={38} rounded={19} />
      <SkeletonBlock width="100%" height={210} rounded={30} />
      <SkeletonBlock width="100%" height={210} rounded={30} />
    </View>
  );
}

/* ---- screen ---- */

/**
 * Native “Your orders” (Order Again tab): live + past orders as cards with tracking, reorder, invoice,
 * address edit and rewards. All data and actions are owned by `MyOrdersScreen`; this only renders.
 */
export default function StoreOrders({
  navigation,
  user,
  token,
  loading,
  refreshing,
  onRefresh,
  onReload,
  error,
  onDismissError,
  success,
  onDismissSuccess,
  orders,
  stats,
  eyebrow,
  filter,
  onFilterChange,
  counts,
  activeOrders,
  historyOrders,
  visibleOrders,
  renderCount,
  onLoadMore,
  expandedOrderId,
  onToggleDetails,
  editingOrderId,
  addressForm,
  onAddressChange,
  onOpenEdit,
  onSaveAddress,
  onCancelEdit,
  savingOrderId,
  canEditAddress,
  onDownloadInvoice,
  downloadingOrderId,
  onClaimReward,
  claimingRewardOrderId,
  onReorder,
  reorderingOrderId,
}) {
  const { c, type, gutter } = useStoreTheme();
  const insets = useSafeAreaInsets();
  const navPad = STORE_NAV_HEIGHT + Math.max(16, insets.bottom + 6) + 28;

  const handlers = {
    onToggleDetails,
    onOpenEdit,
    onSaveAddress,
    onCancelEdit,
    onAddressChange,
    onDownloadInvoice,
    onClaimReward,
    onReorder,
    onReload,
  };

  const goBack = () => (navigation.canGoBack?.() ? navigation.goBack() : navigation.navigate("Home"));

  const renderCard = (order, compact) => {
    const id = order._id;
    return (
      <OrderCard
        key={id}
        order={order}
        compact={compact}
        token={token}
        user={user}
        expanded={expandedOrderId === id}
        editing={editingOrderId === id}
        addressForm={addressForm}
        canEdit={Boolean(canEditAddress?.(order))}
        busy={{
          downloading: downloadingOrderId === id,
          claiming: claimingRewardOrderId === id,
          saving: savingOrderId === id,
          reordering: reorderingOrderId === id,
        }}
        handlers={handlers}
      />
    );
  };

  const sectioned = filter === "all";
  const historyShown = historyOrders.slice(0, renderCount);
  const flatShown = visibleOrders.slice(0, renderCount);
  const moreAvailable = sectioned ? historyOrders.length > renderCount : visibleOrders.length > renderCount;

  let content;
  if (loading) {
    content = <LoadingOrders />;
  } else if (!orders.length) {
    content = <EmptyOrders onShop={() => navigation.navigate("Home")} />;
  } else {
    content = (
      <>
        <StatsCard stats={stats} />
        <View style={styles.pillsWrap}>
          <FilterPills filter={filter} counts={counts} onChange={onFilterChange} />
        </View>
        <View style={styles.list}>
          {sectioned ? (
            <>
              {activeOrders.length ? (
                <>
                  <SectionLabel title={STORE_ORDERS.sections.active.title} caption={STORE_ORDERS.sections.active.caption} count={activeOrders.length} live />
                  {activeOrders.map((o) => renderCard(o, false))}
                </>
              ) : null}
              {historyOrders.length ? (
                <>
                  <SectionLabel title={STORE_ORDERS.sections.history.title} caption={STORE_ORDERS.sections.history.caption} count={historyOrders.length} />
                  {historyShown.map((o) => renderCard(o, true))}
                </>
              ) : null}
            </>
          ) : (
            flatShown.map((o) => renderCard(o, filter === "delivered" || filter === "cancelled" || isDeliveredOrder(o.status) || isCancelledOrder(o.status)))
          )}
          {!sectioned && !flatShown.length ? (
            <Text style={[type.ui(14, "medium", c.inkMute), styles.centerText]}>{STORE_ORDERS.empty.title}</Text>
          ) : null}
          {moreAvailable ? (
            <PressableScale
              onPress={onLoadMore}
              accessibilityRole="button"
              accessibilityLabel={STORE_ORDERS.loadMore}
              style={[styles.more, { borderColor: c.line, backgroundColor: c.card }]}
            >
              <Text style={type.ui(14, "extrabold", c.brand)}>{STORE_ORDERS.loadMore}</Text>
            </PressableScale>
          ) : null}
        </View>
      </>
    );
  }

  return (
    <View style={[styles.screen, { backgroundColor: c.page }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
        automaticallyAdjustKeyboardInsets
        contentContainerStyle={{ paddingTop: insets.top + SCREEN_HEADER_PAD, paddingBottom: navPad }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={c.brand} progressViewOffset={insets.top + 60} />}
      >
        <View style={{ paddingHorizontal: gutter, gap: 16 }}>
          <View style={styles.heading}>
            <Text style={type.eyebrow(c.brandAlt, 11)}>{eyebrow || STORE_ORDERS.eyebrow}</Text>
            <Text style={type.display(34, { ls: -0.8, lh: 40 })} accessibilityRole="header" numberOfLines={1}>
              {STORE_ORDERS.title}
            </Text>
            <Text style={type.ui(14.5, "medium", c.inkSoft)}>{STORE_ORDERS.subtitle}</Text>
          </View>
          {error ? <StoreBanner message={error} onClose={onDismissError} /> : null}
          {success ? <StoreBanner tone="success" message={success} onClose={onDismissSuccess} /> : null}
          {content}
        </View>
      </ScrollView>

      <ScreenHeader
        title={STORE_ORDERS.navTitle}
        onBack={goBack}
        backLabel={STORE_ORDERS.back}
        right={
          <PressableScale
            onPress={() => {
              hapticTick();
              onReload?.();
            }}
            scaleTo={0.9}
            accessibilityRole="button"
            accessibilityLabel={STORE_ORDERS.refresh}
            style={[styles.round, { backgroundColor: c.card, borderColor: c.line }]}
          >
            <Ionicons name="refresh-outline" size={20} color={c.ink} />
          </PressableScale>
        }
      />

      <FloatingNav />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  flex: { flex: 1, minWidth: 0 },
  centerText: { textAlign: "center" },
  round: { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center", borderWidth: StyleSheet.hairlineWidth },
  heading: { gap: 5, paddingTop: 4 },
  stats: { flexDirection: "row", borderWidth: StyleSheet.hairlineWidth, paddingVertical: 14 },
  stat: { flex: 1, alignItems: "center", gap: 3, paddingHorizontal: 4 },
  statValue: { flexDirection: "row", alignItems: "center", gap: 5 },
  liveDot: { width: 7, height: 7, borderRadius: 4 },
  pillsWrap: { marginHorizontal: -16 },
  pills: { gap: 8, paddingHorizontal: 16 },
  pill: { height: 40, flexDirection: "row", alignItems: "center", gap: 8, paddingLeft: 15, paddingRight: 8, borderRadius: 20, borderWidth: 1 },
  pillCount: { minWidth: 24, height: 24, paddingHorizontal: 7, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  list: { gap: 14 },
  sectionHead: { flexDirection: "row", alignItems: "center", gap: 10, marginTop: 6 },
  sectionBar: { width: 3, height: 34, borderRadius: 2 },
  sectionTitleRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  livePill: { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 9, height: 22, borderRadius: 11 },
  card: { borderWidth: StyleSheet.hairlineWidth, overflow: "hidden" },
  map: { minHeight: 148, overflow: "hidden" },
  accentBar: { height: 4 },
  cardBody: { padding: 16, gap: 13 },
  headRow: { flexDirection: "row", alignItems: "flex-start", gap: 10 },
  chip: { flexDirection: "row", alignItems: "center", gap: 6, height: 28, paddingHorizontal: 11, borderRadius: 14, borderWidth: 1 },
  chipDot: { width: 7, height: 7, borderRadius: 4 },
  itemsRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  thumbs: { flexDirection: "row", alignItems: "center" },
  thumb: { width: 46, height: 46, borderRadius: 15, borderWidth: 2.5, overflow: "hidden", alignItems: "center", justifyContent: "center" },
  thumbMore: { alignItems: "center", justifyContent: "center" },
  progress: { gap: 9 },
  segments: { flexDirection: "row", gap: 4 },
  segment: { flex: 1, height: 6, borderRadius: 3 },
  progressText: { gap: 1 },
  shipRow: { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 12, paddingVertical: 9 },
  partner: { flexDirection: "row", alignItems: "center", gap: 11, padding: 11, borderWidth: StyleSheet.hairlineWidth },
  partnerAvatar: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  callBtn: { width: 38, height: 38, borderRadius: 19, alignItems: "center", justifyContent: "center" },
  actions: { flexDirection: "row", gap: 8 },
  action: { flex: 1, minHeight: 56, alignItems: "center", justifyContent: "center", gap: 4, paddingHorizontal: 4, borderWidth: 1 },
  breakdown: { gap: 14, padding: 16, borderWidth: StyleSheet.hairlineWidth },
  lineItems: { gap: 10 },
  lineItem: { flexDirection: "row", alignItems: "center", gap: 10 },
  lineThumb: { width: 38, height: 38, borderRadius: 12, borderWidth: StyleSheet.hairlineWidth, overflow: "hidden" },
  detailRow: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", gap: 14, paddingVertical: 10 },
  detailLabel: { flexShrink: 0 },
  detailValue: { flex: 1, textAlign: "right" },
  totalBand: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 13, borderWidth: 1 },
  addressBox: { gap: 4, padding: 14, borderWidth: StyleSheet.hairlineWidth },
  addressHead: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 2 },
  edit: { gap: 12, padding: 16, borderWidth: StyleSheet.hairlineWidth },
  pair: { flexDirection: "row", gap: 10 },
  editActions: { flexDirection: "row", alignItems: "center", gap: 14 },
  editSave: { height: 46, paddingHorizontal: 22, borderRadius: 23, alignItems: "center", justifyContent: "center" },
  editCancel: { height: 46, paddingHorizontal: 8, alignItems: "center", justifyContent: "center" },
  reorder: { height: 52, borderRadius: 26, overflow: "hidden", flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 9 },
  reorderFill: { borderRadius: 26 },
  more: { height: 50, borderRadius: 25, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  loading: { gap: 14 },
  empty: { alignItems: "center", gap: 11, paddingVertical: 34, paddingHorizontal: 24, borderWidth: StyleSheet.hairlineWidth },
  emptyIcon: { width: 72, height: 72, borderRadius: 36, alignItems: "center", justifyContent: "center", marginBottom: 2 },
  emptyBtn: { height: 50, paddingHorizontal: 28, borderRadius: 25, alignItems: "center", justifyContent: "center", marginTop: 6 },
});
