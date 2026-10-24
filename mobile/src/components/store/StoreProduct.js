import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { FlatList, ScrollView, Share, StyleSheet, Text, TextInput, View, useWindowDimensions } from "react-native";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, { FadeIn, FadeOut, LinearTransition, useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";
import { EASE_OUT, motionTiming, panelIn } from "../../theme/motion";
import { useCart } from "../../context/CartContext";
import { useDeliveryLocation } from "../../hooks/useDeliveryLocation";
import { etaFromQuote } from "../../services/deliveryService";
import { useWishlist } from "../../context/WishlistContext";
import { DELIVERY_NOT_POSSIBLE, STORE_FREE_DELIVERY, STORE_PRODUCT } from "../../content/storefrontContent";
import { STORE_NAV_HEIGHT, useStoreTheme, withAlpha } from "../../theme/storefront";
import { fonts } from "../../theme/tokens";
import { formatINRWhole } from "../../utils/currency";
import { hapticSuccess, hapticTap, hapticTick } from "../../utils/haptics";
import { getProductHeroImageUri, getProductThumbImageUri } from "../../utils/image";
import { getStockHint } from "../../utils/storefront";
import { resolveProductPageContent } from "../../utils/resolveProductPageContent";
import SkeletonBlock from "../ui/SkeletonBlock";
import PressableScale from "./PressableScale";
import ProductCard from "./ProductCard";
import ScreenHeader from "./ScreenHeader";
import ScrollEdgeFade from "./ScrollEdgeFade";
import { SectionHeader } from "./SectionTitle";
import { VariantSheetProvider } from "./VariantSheet";

const HEADER_PAD = 64;
const OFFER_INK = "#3A2A0C";

/* ---- small building blocks ---- */

function RoundButton({ icon, label, onPress, active = false, badge = 0 }) {
  const { c, shadow } = useStoreTheme();
  return (
    <PressableScale
      onPress={onPress}
      scaleTo={0.9}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={[styles.round, shadow.soft, { backgroundColor: c.card, borderColor: c.line }]}
    >
      <Ionicons name={icon} size={20} color={active ? c.danger : c.ink} />
      {badge > 0 ? (
        <View style={[styles.roundBadge, { backgroundColor: c.gold, borderColor: c.card }]}>
          <Text style={styles.roundBadgeText}>{badge > 9 ? "9+" : badge}</Text>
        </View>
      ) : null}
    </PressableScale>
  );
}

function Pill({ icon, mci, label, tone = "soft", style }) {
  const { c, type } = useStoreTheme();
  const palette =
    tone === "gold"
      ? { bg: c.goldSoft, fg: c.goldText, border: withAlpha(c.gold, 0.45) }
      : tone === "danger"
        ? { bg: c.dangerSoft, fg: c.danger, border: withAlpha(c.danger, 0.3) }
        : tone === "brand"
          ? { bg: c.brandSoft, fg: c.brand, border: withAlpha(c.brand, 0.2) }
          : { bg: c.soft, fg: c.inkSoft, border: c.line };
  return (
    <View style={[styles.pill, { backgroundColor: palette.bg, borderColor: palette.border }, style]}>
      {icon ? <Ionicons name={icon} size={13} color={palette.fg} /> : null}
      {mci ? <MaterialCommunityIcons name={mci} size={14} color={palette.fg} /> : null}
      <Text style={type.ui(12, "bold", palette.fg)} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

function Surface({ children, style, ...rest }) {
  const { c, r, shadow } = useStoreTheme();
  return (
    <View
      {...rest}
      style={[styles.surface, shadow.soft, { backgroundColor: c.card, borderColor: c.line, borderRadius: r.xxl }, style]}
    >
      {children}
    </View>
  );
}

function Stars({ value, size = 14 }) {
  const { c } = useStoreTheme();
  const full = Math.round(Number(value) || 0);
  return (
    <View style={styles.stars}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Ionicons key={n} name={n <= full ? "star" : "star-outline"} size={size} color={n <= full ? c.gold : c.lineStrong} />
      ))}
    </View>
  );
}

/* ---- gallery ---- */

function Gallery({ uris, thumbs, size, index, onIndex, badge, soldTag, dim }) {
  const { c, r, shadow, type, isDark } = useStoreTheme();
  const listRef = useRef(null);
  const [failed, setFailed] = useState({});

  const onEnd = useCallback(
    (e) => {
      const next = Math.round(e.nativeEvent.contentOffset.x / Math.max(size, 1));
      if (next !== index) onIndex(next);
    },
    [index, onIndex, size]
  );

  const jump = (i) => {
    hapticTick();
    listRef.current?.scrollToIndex?.({ index: i, animated: true });
    onIndex(i);
  };

  return (
    <View>
      <View style={[styles.hero, shadow.card, { width: size, height: size, backgroundColor: c.well, borderRadius: r.xxl, borderColor: c.line }]}>
        {uris.length ? (
          <FlatList
            ref={listRef}
            data={uris}
            horizontal
            pagingEnabled
            nestedScrollEnabled
            showsHorizontalScrollIndicator={false}
            keyExtractor={(uri, i) => `${i}-${uri}`}
            initialScrollIndex={Math.min(index, uris.length - 1)}
            onMomentumScrollEnd={onEnd}
            getItemLayout={(_, i) => ({ length: size, offset: size * i, index: i })}
            renderItem={({ item, index: i }) => (
              <View style={{ width: size, height: size }}>
                {failed[i] ? (
                  <View style={styles.heroFallback}>
                    <MaterialCommunityIcons name="image-outline" size={46} color={c.inkMute} />
                  </View>
                ) : (
                  <Image
                    source={{ uri: item }}
                    style={[StyleSheet.absoluteFill, dim && { opacity: 0.4 }]}
                    contentFit="contain"
                    transition={200}
                    cachePolicy="memory-disk"
                    onError={() => setFailed((f) => ({ ...f, [i]: true }))}
                  />
                )}
              </View>
            )}
          />
        ) : (
          <View style={styles.heroFallback}>
            <MaterialCommunityIcons name="image-outline" size={46} color={c.inkMute} />
          </View>
        )}

        {badge ? (
          <View style={[styles.heroBadge, { backgroundColor: badge.bg }]}>
            <Text style={type.ui(11, "extrabold", badge.fg, { letterSpacing: 0.5 })}>{badge.text}</Text>
          </View>
        ) : null}

        {soldTag ? (
          <View style={styles.soldWrap} pointerEvents="none">
            <View style={[styles.soldTag, { backgroundColor: c.glassStrong, borderColor: c.line }]}>
              <Text style={type.ui(13, "bold", c.inkSoft, { letterSpacing: 0.3 })}>{soldTag}</Text>
            </View>
          </View>
        ) : null}

        {uris.length > 1 ? (
          <View style={[styles.counter, { backgroundColor: isDark ? "rgba(0,0,0,0.55)" : "rgba(255,255,255,0.82)" }]}>
            <Text style={type.ui(11.5, "bold", c.ink)}>
              {index + 1} / {uris.length}
            </Text>
          </View>
        ) : null}
      </View>

      {thumbs.length > 1 ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.thumbs}>
          {thumbs.map((uri, i) => {
            const active = i === index;
            return (
              <PressableScale
                key={`${i}-${uri}`}
                onPress={() => jump(i)}
                scaleTo={0.92}
                lite
                accessibilityRole="button"
                accessibilityLabel={`Photo ${i + 1}`}
                accessibilityState={{ selected: active }}
                style={[
                  styles.thumb,
                  { backgroundColor: c.well, borderColor: active ? c.brand : c.line, borderWidth: active ? 2 : 1, opacity: active ? 1 : 0.85 },
                ]}
              >
                <Image source={{ uri }} style={StyleSheet.absoluteFill} contentFit="contain" transition={120} />
              </PressableScale>
            );
          })}
        </ScrollView>
      ) : null}
    </View>
  );
}

/* ---- variants ---- */

function VariantPicker({ variants, selected, onSelect }) {
  const { c, r, type } = useStoreTheme();
  return (
    <View style={styles.block}>
      <Text style={type.ui(15.5, "extrabold", c.ink)}>{STORE_PRODUCT.options.title}</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.variantScroll} contentContainerStyle={styles.variantRow}>
        {variants.map((v) => {
          const label = String(v.label || v.name || "");
          const active = selected === label;
          return (
            <PressableScale
              key={label}
              onPress={() => {
                hapticTick();
                onSelect(label);
              }}
              scaleTo={0.96}
              accessibilityRole="radio"
              accessibilityState={{ selected: active }}
              accessibilityLabel={`${label}, ${formatINRWhole(v.price)}`}
              style={[
                styles.variant,
                {
                  backgroundColor: active ? c.brandSoft : c.cardSoft,
                  borderColor: active ? c.brand : c.line,
                  borderWidth: active ? 1.5 : 1,
                  borderRadius: r.lg,
                },
              ]}
            >
              <View style={styles.variantTop}>
                <Text style={type.ui(15, "extrabold", active ? c.brand : c.ink)} numberOfLines={1}>
                  {label}
                </Text>
                {active ? <Ionicons name="checkmark-circle" size={17} color={c.brand} /> : null}
              </View>
              <Text style={type.ui(14, "bold", c.inkSoft)}>{formatINRWhole(v.price)}</Text>
              {v.tag ? (
                <View style={[styles.variantTag, { backgroundColor: c.goldSoft }]}>
                  <Text style={type.ui(10, "extrabold", c.goldText, { letterSpacing: 0.4 })}>{String(v.tag).toUpperCase()}</Text>
                </View>
              ) : null}
            </PressableScale>
          );
        })}
      </ScrollView>
    </View>
  );
}

/* ---- accordion sections ---- */

function Accordion({ icon, title, open, onToggle, last, children }) {
  const { c, type } = useStoreTheme();
  // The chevron turns (a state change on screen) instead of swapping between two glyphs.
  const turn = useSharedValue(open ? 1 : 0);
  useEffect(() => {
    turn.value = withTiming(open ? 1 : 0, { duration: motionTiming.toggle + 20, easing: EASE_OUT });
  }, [open, turn]);
  const chevron = useAnimatedStyle(() => ({ transform: [{ rotate: `${turn.value * 180}deg` }] }));
  return (
    <View style={!last ? { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: c.line } : null}>
      <PressableScale
        onPress={() => {
          hapticTick();
          onToggle();
        }}
        scaleTo={0.99}
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
        accessibilityLabel={title}
        style={styles.accHead}
      >
        <View style={[styles.accIcon, { backgroundColor: c.brandSoft }]}>
          <Ionicons name={icon} size={18} color={c.brand} />
        </View>
        <Text style={[type.ui(15.5, "bold", c.ink), styles.accTitle]}>{title}</Text>
        <Animated.View style={chevron}>
          <Ionicons name="chevron-down" size={18} color={open ? c.brand : c.inkMute} />
        </Animated.View>
      </PressableScale>
      {open ? (
        <Animated.View entering={panelIn} style={styles.accBody}>
          {children}
        </Animated.View>
      ) : null}
    </View>
  );
}

function KeyRows({ rows }) {
  const { c, type } = useStoreTheme();
  return (
    <View>
      {rows.map((row, i) => (
        <View key={`${row.key || row.label}-${i}`} style={[styles.keyRow, i > 0 && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: c.line }]}>
          <Text style={[type.ui(13.5, "medium", c.inkMute), styles.keyLabel]}>{row.label}</Text>
          <Text style={[type.ui(13.5, "bold", c.ink), styles.keyValue]}>{row.value}</Text>
        </View>
      ))}
    </View>
  );
}

function BodyText({ children, style }) {
  const { c, type } = useStoreTheme();
  return <Text style={[type.ui(14, "regular", c.inkSoft, { lineHeight: 21 }), style]}>{children}</Text>;
}

function Label({ children }) {
  const { c, type } = useStoreTheme();
  return <Text style={[type.eyebrow(c.brandAlt, 10.5), styles.subLabel]}>{children}</Text>;
}

function TagRow({ tags }) {
  const { c, type } = useStoreTheme();
  if (!tags?.length) return null;
  return (
    <View style={styles.tagRow}>
      {tags.map((tag) => (
        <View key={String(tag)} style={[styles.tag, { backgroundColor: c.brandSoft }]}>
          <Text style={type.ui(12, "bold", c.brand)}>{String(tag)}</Text>
        </View>
      ))}
    </View>
  );
}

/* ---- reviews ---- */

function ReviewComposer({ rating, onRating, comment, onComment, busy, success, error, isAuthenticated, onSubmit, navigation }) {
  const { c, r, type } = useStoreTheme();
  return (
    <View style={[styles.composer, { backgroundColor: c.cardSoft, borderColor: c.line, borderRadius: r.xl }]}>
      <Text style={type.ui(15, "extrabold", c.ink)}>{STORE_PRODUCT.reviews.composerTitle}</Text>
      <View style={styles.pickStars}>
        {[1, 2, 3, 4, 5].map((n) => (
          <PressableScale
            key={n}
            onPress={() => {
              hapticTick();
              onRating?.(n);
            }}
            scaleTo={0.8}
            lite
            hitSlop={6}
            accessibilityRole="button"
            accessibilityLabel={`${n} star${n === 1 ? "" : "s"}`}
          >
            <Ionicons name={n <= rating ? "star" : "star-outline"} size={30} color={n <= rating ? c.gold : c.lineStrong} />
          </PressableScale>
        ))}
      </View>
      <TextInput
        value={comment}
        onChangeText={onComment}
        placeholder={STORE_PRODUCT.reviews.placeholder}
        placeholderTextColor={c.inkMute}
        selectionColor={c.brand}
        multiline
        style={[type.ui(14.5, "medium", c.ink), styles.composerInput, { backgroundColor: c.card, borderColor: c.line, borderRadius: r.md }]}
      />
      {error ? <Text style={type.ui(12.5, "medium", c.danger)}>{error}</Text> : null}
      {success ? <Text style={type.ui(12.5, "bold", c.brand)}>{success}</Text> : null}
      <PressableScale
        disabled={busy}
        onPress={() => {
          if (!isAuthenticated) {
            navigation.navigate("Login");
            return;
          }
          onSubmit?.();
        }}
        accessibilityRole="button"
        accessibilityLabel={STORE_PRODUCT.reviews.post}
        style={[styles.composerBtn, { backgroundColor: busy ? c.softStrong : c.brand }]}
      >
        <Text style={type.ui(14.5, "extrabold", busy ? c.inkMute : c.onBrand)}>
          {busy ? STORE_PRODUCT.reviews.posting : isAuthenticated ? STORE_PRODUCT.reviews.post : STORE_PRODUCT.reviews.signIn}
        </Text>
      </PressableScale>
    </View>
  );
}

/* ---- sticky buy dock ---- */

function BuyDock({ bottom, price, quantity, unavailable, onAdd, onRemove, onBuyNow }) {
  const { c, type, shadow, isDark, gutter } = useStoreTheme();
  const inBag = quantity > 0;
  const colors = isDark ? ["#C9DA8C", "#9DB45B"] : ["#3F6231", "#244424"];
  const ink = isDark ? "#18200C" : "#FFFFFF";

  return (
    <View style={[styles.dockWrap, { bottom, left: gutter, right: gutter }]} pointerEvents="box-none">
      <View style={[styles.dockShadow, shadow.float, { borderColor: isDark ? c.line : withAlpha("#FFFFFF", 0.85) }]}>
        <View style={styles.dockClip}>
          <View style={[StyleSheet.absoluteFill, { backgroundColor: c.glass }]} />
          <View style={styles.dockRow}>
            <View style={styles.dockPrice}>
              <Text style={type.ui(11, "bold", c.inkMute, { letterSpacing: 0.4 })} numberOfLines={1}>
                {inBag ? STORE_PRODUCT.dock.inBag(quantity) : STORE_PRODUCT.dock.price}
              </Text>
              <Text style={type.display(22, { ls: -0.5, lh: 26, semi: true })} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8}>
                {formatINRWhole(price * Math.max(1, quantity))}
              </Text>
            </View>

            {unavailable ? (
              <View style={[styles.dockUnavailable, { backgroundColor: c.soft }]}>
                <Text style={type.ui(14, "extrabold", c.inkMute)}>{unavailable}</Text>
              </View>
            ) : (
              <>
                {inBag ? (
                  <View style={[styles.dockStepper, { backgroundColor: c.brand }]}>
                    <PressableScale
                      onPress={() => {
                        hapticTap();
                        onRemove?.();
                      }}
                      scaleTo={0.82}
                      lite
                      hitSlop={6}
                      style={styles.dockStepBtn}
                      accessibilityRole="button"
                      accessibilityLabel={STORE_PRODUCT.dock.lessA11y}
                    >
                      <Ionicons name="remove" size={20} color={c.onBrand} />
                    </PressableScale>
                    <Text style={[type.ui(16, "extrabold", c.onBrand), styles.dockQty]}>{quantity}</Text>
                    <PressableScale
                      onPress={() => {
                        hapticTap();
                        onAdd?.();
                      }}
                      scaleTo={0.82}
                      lite
                      hitSlop={6}
                      style={styles.dockStepBtn}
                      accessibilityRole="button"
                      accessibilityLabel={STORE_PRODUCT.dock.moreA11y}
                    >
                      <Ionicons name="add" size={20} color={c.onBrand} />
                    </PressableScale>
                  </View>
                ) : (
                  <PressableScale
                    onPress={() => {
                      hapticSuccess();
                      onAdd?.();
                    }}
                    accessibilityRole="button"
                    accessibilityLabel={STORE_PRODUCT.dock.add}
                    style={styles.dockAdd}
                  >
                    <LinearGradient colors={colors} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[StyleSheet.absoluteFill, styles.dockBtnFill]} />
                    <Text style={type.ui(14, "extrabold", ink, { letterSpacing: 0.2 })} numberOfLines={1}>
                      {STORE_PRODUCT.dock.add}
                    </Text>
                  </PressableScale>
                )}
                <PressableScale
                  onPress={onBuyNow}
                  accessibilityRole="button"
                  accessibilityLabel={STORE_PRODUCT.dock.buyNow}
                  style={[styles.dockBuy, { backgroundColor: c.goldSoft, borderColor: withAlpha(c.gold, 0.6) }]}
                >
                  <Text style={type.ui(14, "extrabold", c.goldText)} numberOfLines={1}>
                    {STORE_PRODUCT.dock.buyNow}
                  </Text>
                </PressableScale>
              </>
            )}
          </View>
        </View>
      </View>
    </View>
  );
}

/* ---- loading + empty states ---- */

export function StoreProductSkeleton({ navigation }) {
  const { c, gutter } = useStoreTheme();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const size = width - gutter * 2;
  return (
    <View style={[styles.screen, { backgroundColor: c.page }]}>
      <View style={{ paddingTop: insets.top + HEADER_PAD, paddingHorizontal: gutter, gap: 14 }}>
        <SkeletonBlock width={size} height={size} rounded={30} />
        <SkeletonBlock width={90} height={14} rounded={7} />
        <SkeletonBlock width={size * 0.8} height={30} rounded={10} />
        <SkeletonBlock width={size * 0.5} height={22} rounded={10} />
        <SkeletonBlock width={size} height={110} rounded={24} />
      </View>
      <ScreenHeader title="" onBack={() => (navigation?.canGoBack?.() ? navigation.goBack() : navigation?.navigate("Home"))} backLabel={STORE_PRODUCT.back} />
    </View>
  );
}

export function StoreProductNotFound({ navigation, message }) {
  const { c, r, type, gutter } = useStoreTheme();
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.screen, { backgroundColor: c.page }]}>
      <View style={[styles.notFound, { paddingTop: insets.top + HEADER_PAD, paddingHorizontal: gutter }]}>
        <View style={[styles.notFoundCard, { backgroundColor: c.card, borderColor: c.line, borderRadius: r.xxl }]}>
          <View style={[styles.notFoundIcon, { backgroundColor: c.brandSoft }]}>
            <Ionicons name="leaf-outline" size={32} color={c.brand} />
          </View>
          <Text style={type.display(22, { semi: true, lh: 28 })}>{STORE_PRODUCT.state.notFoundTitle}</Text>
          <Text style={[type.ui(14, "medium", c.inkMute), styles.center]}>{message || STORE_PRODUCT.state.notFoundBody}</Text>
          <PressableScale
            onPress={() => navigation.navigate("Home")}
            accessibilityRole="button"
            accessibilityLabel={STORE_PRODUCT.state.notFoundCta}
            style={[styles.notFoundBtn, { backgroundColor: c.brand }]}
          >
            <Text style={type.ui(14.5, "extrabold", c.onBrand)}>{STORE_PRODUCT.state.notFoundCta}</Text>
          </PressableScale>
        </View>
      </View>
      <ScreenHeader title="" onBack={() => (navigation.canGoBack?.() ? navigation.goBack() : navigation.navigate("Home"))} backLabel={STORE_PRODUCT.back} />
    </View>
  );
}

/* ---- screen ---- */

/**
 * Native product detail — gallery with thumbnails, price + size picker, delivery promise, expandable
 * details, reviews, related products and a glass buy dock. State lives in `ProductScreen`.
 */
export default function StoreProduct({
  product,
  navigation,
  galleryImages = [],
  selectedImage,
  onSelectImage,
  variants = [],
  selectedVariantLabel,
  onSelectVariant,
  displayPrice,
  showMrp,
  mrp,
  offPct,
  liveRatingAvg = 0,
  reviewCountDisplay = 0,
  isOutOfStock,
  isComingSoon,
  comingSoonNote,
  quantity = 0,
  onAddToCart,
  onRemoveFromCart,
  onBuyNow,
  relatedProducts = [],
  onRelatedPress,
  reviews = [],
  reviewRating = 0,
  onReviewRatingChange,
  reviewComment = "",
  onReviewCommentChange,
  reviewBusy = false,
  reviewSuccess = "",
  reviewError = "",
  onSubmitReview,
  isAuthenticated = false,
  shelfMatch = false,
}) {
  const { c, r, type, isDark, gutter } = useStoreTheme();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const { totalItems } = useCart();
  const { quote } = useDeliveryLocation();
  const wishlist = useWishlist();

  const pageContent = useMemo(() => resolveProductPageContent(product, { shelfMatch }), [product, shelfMatch]);
  const heroUris = useMemo(() => galleryImages.map((raw) => getProductHeroImageUri(raw) || raw), [galleryImages]);
  const thumbUris = useMemo(() => galleryImages.map((raw) => getProductThumbImageUri(raw) || raw), [galleryImages]);
  const startIndex = Math.max(0, galleryImages.indexOf(selectedImage));

  const [index, setIndex] = useState(startIndex);
  const [aboutOpen, setAboutOpen] = useState(false);
  const [openSection, setOpenSection] = useState("details");
  const [solid, setSolid] = useState(false);
  const solidRef = useRef(false);

  const heroSize = width - gutter * 2;
  const heroBottom = insets.top + HEADER_PAD + heroSize;
  const dockBottom = Math.max(16, insets.bottom + 6);
  const dockPad = STORE_NAV_HEIGHT + dockBottom + 28;

  const wished = wishlist.has(product.id);
  const unavailable = isComingSoon ? STORE_PRODUCT.unavailable.soon : isOutOfStock ? STORE_PRODUCT.unavailable.sold : "";
  const stockHint = getStockHint(product);
  const rating = Number(liveRatingAvg) || 0;
  const hasVariants = variants.length > 0;
  /** MRP and % off are per product, so they only make sense when there is no size picker. */
  const discountPct = !hasVariants && showMrp && mrp && offPct != null && offPct > 0 ? offPct : null;
  const unit = String((hasVariants && selectedVariantLabel) || product?.unit || "").trim();
  const liveEta = etaFromQuote(quote);
  const eta =
    liveEta ||
    (quote?.serviceable === false ? quote.message || DELIVERY_NOT_POSSIBLE : "");
  const lead = String(pageContent.lead || "").trim();
  const longLead = lead.length > 190;

  const badge = useMemo(() => {
    if (isComingSoon) return { text: "COMING SOON", bg: "#FBEFD6", fg: "#8A5A12" };
    if (discountPct) return { text: `${discountPct}% OFF`, bg: c.gold, fg: OFFER_INK };
    if (product?.badgeText) return { text: String(product.badgeText).toUpperCase(), bg: c.brand, fg: c.onBrand };
    return null;
  }, [isComingSoon, discountPct, product?.badgeText, c.gold, c.brand, c.onBrand]);

  const goBack = useCallback(() => {
    if (navigation.canGoBack?.()) navigation.goBack();
    else navigation.navigate("Shop");
  }, [navigation]);

  const share = useCallback(() => {
    Share.share({ message: STORE_PRODUCT.shareMessage(product.name) }).catch(() => {});
  }, [product.name]);

  const onScroll = useCallback(
    (e) => {
      const next = e.nativeEvent.contentOffset.y > heroBottom - 90;
      if (next !== solidRef.current) {
        solidRef.current = next;
        setSolid(next);
      }
    },
    [heroBottom]
  );

  const handleIndex = useCallback(
    (i) => {
      setIndex(i);
      if (galleryImages[i]) onSelectImage?.(galleryImages[i]);
    },
    [galleryImages, onSelectImage]
  );

  const delivery = pageContent.delivery;
  const deliveryTitle = delivery?.title || STORE_PRODUCT.delivery.fallbackTitle;
  const deliveryBody = delivery?.body || STORE_PRODUCT.delivery.fallbackBody;
  const trustChips = Array.isArray(pageContent.trustChips) ? pageContent.trustChips : [];
  const highlights = Array.isArray(pageContent.highlights) ? pageContent.highlights : [];
  const sameText = (a, b) => String(a || "").replace(/\s+/g, " ").trim().toLowerCase() === String(b || "").replace(/\s+/g, " ").trim().toLowerCase();
  // A bullet that repeats the description word for word adds nothing.
  const shownHighlights = highlights.filter((line) => !lead || !sameText(line, lead));

  /** Expandable sections — only the ones this product actually has content for. */
  const sections = useMemo(() => {
    const out = [];
    if (pageContent.showSpecs) {
      out.push({
        key: "details",
        icon: "reader-outline",
        title: STORE_PRODUCT.sections.details,
        body: <KeyRows rows={pageContent.specs} />,
      });
    }
    const nutrition = pageContent.showNutritionSection ? pageContent.nutrition : null;
    if (pageContent.showIngredients || nutrition?.rows?.length) {
      out.push({
        key: "nutrition",
        icon: "nutrition-outline",
        title: STORE_PRODUCT.sections.nutrition,
        body: (
          <View style={styles.stack}>
            {pageContent.showIngredients ? (
              <View style={styles.stack}>
                <Label>{STORE_PRODUCT.labels.ingredients}</Label>
                <BodyText>{pageContent.ingredients.body}</BodyText>
                <TagRow tags={pageContent.ingredients.tags} />
              </View>
            ) : null}
            {nutrition?.rows?.length ? (
              <View style={styles.stack}>
                <Label>{nutrition.tableHead ? `${STORE_PRODUCT.labels.nutrition} · ${nutrition.tableHead}` : STORE_PRODUCT.labels.nutrition}</Label>
                <KeyRows rows={nutrition.rows} />
              </View>
            ) : null}
          </View>
        ),
      });
    }
    if (pageContent.usageRituals?.length) {
      out.push({
        key: "usage",
        icon: "restaurant-outline",
        title: STORE_PRODUCT.sections.usage,
        body: (
          <View style={styles.stack}>
            {pageContent.usageRituals.map((item, i) => (
              <View key={`${item.title}-${i}`} style={styles.iconRow}>
                <View style={[styles.rowIcon, { backgroundColor: c.goldSoft }]}>
                  <Ionicons name={item.icon || "sunny-outline"} size={17} color={c.goldText} />
                </View>
                <View style={styles.rowText}>
                  <Text style={type.ui(14.5, "bold", c.ink)}>{item.title}</Text>
                  <BodyText>{item.description}</BodyText>
                </View>
              </View>
            ))}
          </View>
        ),
      });
    }
    if (pageContent.showStorySection || pageContent.showWhyZeevan) {
      const steps = pageContent.processSteps || [];
      out.push({
        key: "story",
        icon: "leaf-outline",
        title: STORE_PRODUCT.sections.story,
        body: (
          <View style={styles.stack}>
            {pageContent.showStoryLegend ? <BodyText>{pageContent.story.legend}</BodyText> : null}
            {pageContent.highlightQuote ? (
              <View style={[styles.quote, { borderLeftColor: c.gold }]}>
                <Text style={type.display(17, { semi: true, ls: -0.2, lh: 24, color: c.ink })}>{`“${pageContent.highlightQuote}”`}</Text>
              </View>
            ) : null}
            {steps.length ? (
              <View style={styles.stack}>
                {pageContent.processTitle ? <Label>{pageContent.processTitle}</Label> : null}
                {steps.map((step, i) => (
                  <View key={`${step}-${i}`} style={styles.iconRow}>
                    <View style={[styles.stepNum, { backgroundColor: c.brandSoft }]}>
                      <Text style={type.ui(12, "extrabold", c.brand)}>{i + 1}</Text>
                    </View>
                    <Text style={[type.ui(14, "regular", c.inkSoft, { lineHeight: 21 }), styles.rowText]}>{String(step)}</Text>
                  </View>
                ))}
              </View>
            ) : null}
            {pageContent.featureCards?.length ? (
              <View style={styles.stack}>
                {pageContent.featureCards.map((feat, i) => (
                  <View key={`${feat.title}-${i}`} style={styles.iconRow}>
                    <View style={[styles.rowIcon, { backgroundColor: c.brandSoft }]}>
                      <Ionicons name={feat.icon || "sparkles-outline"} size={17} color={c.brand} />
                    </View>
                    <View style={styles.rowText}>
                      <Text style={type.ui(14.5, "bold", c.ink)}>{feat.title}</Text>
                      {feat.subtitle ? <BodyText>{feat.subtitle}</BodyText> : null}
                    </View>
                  </View>
                ))}
              </View>
            ) : null}
            {pageContent.showWhyZeevan ? (
              <View style={styles.stack}>
                <Label>{STORE_PRODUCT.labels.why}</Label>
                <BodyText>{pageContent.whyZeevan.body}</BodyText>
                {pageContent.whyZeevan.chips?.length ? <TagRow tags={pageContent.whyZeevan.chips.map((chip) => chip.label)} /> : null}
              </View>
            ) : null}
          </View>
        ),
      });
    }
    if (pageContent.showStorage || pageContent.showShipping) {
      out.push({
        key: "care",
        icon: "cube-outline",
        title: STORE_PRODUCT.sections.care,
        body: (
          <View style={styles.stack}>
            {pageContent.showStorage ? (
              <View style={styles.stack}>
                <Label>{STORE_PRODUCT.labels.storage}</Label>
                <BodyText>{pageContent.storage.body}</BodyText>
              </View>
            ) : null}
            {pageContent.showShipping ? (
              <View style={styles.stack}>
                <Label>{STORE_PRODUCT.labels.shipping}</Label>
                <BodyText>{pageContent.shipping.body}</BodyText>
                {pageContent.shipping.bullets?.map((line) => (
                  <View key={line} style={styles.iconRow}>
                    <Ionicons name="checkmark-circle" size={16} color={c.brandBright} style={styles.bulletIcon} />
                    <Text style={[type.ui(13.5, "medium", c.inkSoft, { lineHeight: 20 }), styles.rowText]}>{line}</Text>
                  </View>
                ))}
              </View>
            ) : null}
          </View>
        ),
      });
    }
    if (pageContent.showFaq) {
      out.push({
        key: "faq",
        icon: "help-circle-outline",
        title: STORE_PRODUCT.sections.faq,
        body: (
          <View style={styles.stack}>
            {pageContent.faq.map((item) => (
              <View key={item.q} style={styles.stack}>
                <Text style={type.ui(14.5, "bold", c.ink)}>{item.q}</Text>
                <BodyText>{item.a}</BodyText>
              </View>
            ))}
          </View>
        ),
      });
    }
    return out;
  }, [pageContent, c, type]);

  const shownReviews = (reviews || []).slice(0, 3);

  return (
    <VariantSheetProvider>
      <View style={[styles.screen, { backgroundColor: c.page }]}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          automaticallyAdjustKeyboardInsets
          scrollEventThrottle={32}
          onScroll={onScroll}
          contentContainerStyle={{ paddingTop: insets.top + HEADER_PAD, paddingBottom: dockPad }}
        >
          <LinearGradient
            colors={c.headerGradient}
            locations={c.headerLocations}
            style={[styles.wash, { height: insets.top + HEADER_PAD + heroSize * 0.7 }]}
            pointerEvents="none"
          />

          <View style={{ paddingHorizontal: gutter, gap: 16 }}>
            <Gallery
              uris={heroUris}
              thumbs={thumbUris}
              size={heroSize}
              index={index}
              onIndex={handleIndex}
              badge={badge}
              soldTag={isComingSoon ? comingSoonNote || STORE_PRODUCT.unavailable.soon : isOutOfStock ? STORE_PRODUCT.unavailable.sold : ""}
              dim={Boolean(unavailable)}
            />

            <View style={styles.titleBlock}>
              <Text style={type.eyebrow(c.brandAlt, 11)} numberOfLines={1}>
                {pageContent.eyebrow || product.category}
              </Text>
              <Text style={type.display(29, { ls: -0.7, lh: 34 })} accessibilityRole="header">
                {product.name}
              </Text>
              <View style={styles.pillRow}>
                {rating > 0 ? (
                  <View style={[styles.rating, { backgroundColor: c.goldSoft, borderColor: withAlpha(c.gold, 0.5) }]}>
                    <Ionicons name="star" size={13} color={c.gold} />
                    <Text style={type.ui(13, "extrabold", c.goldText)}>{rating.toFixed(1)}</Text>
                    <Text style={type.ui(12, "semibold", c.inkMute)}>· {STORE_PRODUCT.ratingCount(reviewCountDisplay)}</Text>
                  </View>
                ) : (
                  <Pill icon="sparkles-outline" label={STORE_PRODUCT.newBadge} tone="gold" />
                )}
                {unit ? <Pill icon="scale-outline" label={unit} /> : null}
                {eta ? <Pill icon="time-outline" label={eta.charAt(0).toUpperCase() + eta.slice(1).toLowerCase()} tone="brand" /> : null}
                {stockHint ? <Pill label={stockHint} tone="danger" /> : null}
              </View>
            </View>

            <Surface style={styles.priceCard}>
              <View style={styles.priceRow}>
                <Text style={type.display(36, { ls: -1, lh: 40 })} accessibilityLabel={`Price ${formatINRWhole(displayPrice)}`}>
                  {formatINRWhole(displayPrice)}
                </Text>
                {discountPct ? <Text style={[type.ui(17, "medium", c.inkMute), styles.strike]}>{formatINRWhole(mrp)}</Text> : null}
                {discountPct ? (
                  <View style={[styles.save, { backgroundColor: c.gold }]}>
                    <Text style={type.ui(11.5, "extrabold", OFFER_INK, { letterSpacing: 0.3 })}>{STORE_PRODUCT.savePct(discountPct)}</Text>
                  </View>
                ) : null}
              </View>
              <Text style={type.ui(12.5, "medium", c.inkMute)}>
                {STORE_PRODUCT.inclusiveTax}
                {selectedVariantLabel && variants.length > 0 ? ` · ${selectedVariantLabel}` : ""}
              </Text>

              {variants.length > 0 ? <VariantPicker variants={variants} selected={selectedVariantLabel} onSelect={onSelectVariant} /> : null}

              <View style={[styles.delivery, { backgroundColor: c.brandSoft, borderRadius: r.lg }]}>
                <View style={[styles.deliveryIcon, { backgroundColor: c.card }]}>
                  <MaterialCommunityIcons name="truck-fast-outline" size={22} color={c.brand} />
                </View>
                <View style={styles.rowText}>
                  <Text style={type.ui(14, "extrabold", c.ink)}>{deliveryTitle}</Text>
                  <Text style={type.ui(12.5, "medium", c.inkSoft, { lineHeight: 18 })}>{deliveryBody}</Text>
                  {delivery ? null : <Text style={type.ui(12, "bold", c.brandAlt)}>{STORE_FREE_DELIVERY}</Text>}
                </View>
              </View>
            </Surface>

            {trustChips.length ? (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.trustRow}>
                {trustChips.map((chip) => (
                  <View key={chip.label} style={[styles.trust, { backgroundColor: c.card, borderColor: c.line }]}>
                    <Ionicons name={chip.icon || "leaf-outline"} size={15} color={c.brand} />
                    <Text style={type.ui(12.5, "bold", c.inkSoft)}>{chip.label}</Text>
                  </View>
                ))}
              </ScrollView>
            ) : null}

            {lead || shownHighlights.length ? (
              <Surface style={styles.about}>
                <Text style={type.display(19, { semi: true, ls: -0.3, lh: 24 })}>{STORE_PRODUCT.about.title}</Text>
                {lead ? (
                  <View style={styles.stack}>
                    <Text style={type.ui(14.5, "regular", c.inkSoft, { lineHeight: 22 })} numberOfLines={longLead && !aboutOpen ? 4 : undefined}>
                      {lead}
                    </Text>
                    {longLead ? (
                      <PressableScale
                        onPress={() => {
                          hapticTick();
                          setAboutOpen((v) => !v);
                        }}
                        scaleTo={0.96}
                        lite
                        hitSlop={8}
                        accessibilityRole="button"
                      >
                        <Text style={type.ui(13.5, "extrabold", c.brand)}>{aboutOpen ? STORE_PRODUCT.about.less : STORE_PRODUCT.about.more}</Text>
                      </PressableScale>
                    ) : null}
                  </View>
                ) : null}
                {shownHighlights.length ? (
                  <View style={styles.stack}>
                    {shownHighlights.map((line) => (
                      <View key={line} style={styles.iconRow}>
                        <View style={[styles.check, { backgroundColor: c.brandSoft }]}>
                          <Ionicons name="checkmark" size={13} color={c.brand} />
                        </View>
                        <Text style={[type.ui(14, "medium", c.inkSoft, { lineHeight: 20 }), styles.rowText]}>{line}</Text>
                      </View>
                    ))}
                  </View>
                ) : null}
              </Surface>
            ) : null}

            {sections.length ? (
              <Animated.View layout={LinearTransition.duration(220)}>
                <Surface style={styles.accordions}>
                  {sections.map((section, i) => (
                    <Accordion
                      key={section.key}
                      icon={section.icon}
                      title={section.title}
                      open={openSection === section.key}
                      onToggle={() => setOpenSection((cur) => (cur === section.key ? "" : section.key))}
                      last={i === sections.length - 1}
                    >
                      {section.body}
                    </Accordion>
                  ))}
                </Surface>
              </Animated.View>
            ) : null}

            <Surface style={styles.reviews}>
              <View style={styles.reviewHead}>
                <View style={styles.stack}>
                  <Text style={type.display(19, { semi: true, ls: -0.3, lh: 24 })}>{STORE_PRODUCT.reviews.title}</Text>
                  {reviewCountDisplay > 0 ? (
                    <View style={styles.reviewSummary}>
                      <Text style={type.display(34, { ls: -1, lh: 38 })}>{rating.toFixed(1)}</Text>
                      <View style={styles.stack}>
                        <Stars value={rating} size={15} />
                        <Text style={type.ui(12.5, "semibold", c.inkMute)}>{STORE_PRODUCT.ratingCount(reviewCountDisplay)}</Text>
                      </View>
                    </View>
                  ) : (
                    <Text style={type.ui(13.5, "medium", c.inkMute, { lineHeight: 19 })}>{STORE_PRODUCT.reviews.empty}</Text>
                  )}
                </View>
              </View>

              {shownReviews.map((rv, i) => {
                const name = String(rv.userName || "").trim() || STORE_PRODUCT.reviews.customer;
                const comment = String(rv.comment || "").trim();
                return (
                  <View key={`${rv._id || i}`} style={[styles.review, { backgroundColor: c.cardSoft, borderColor: c.line, borderRadius: r.lg }]}>
                    <View style={[styles.avatar, { backgroundColor: c.brandSoft }]}>
                      <Text style={type.display(16, { color: c.brand, ls: 0, semi: true })}>{name.charAt(0).toUpperCase()}</Text>
                    </View>
                    <View style={styles.rowText}>
                      <View style={styles.reviewTop}>
                        <Text style={[type.ui(14, "bold", c.ink), styles.rowText]} numberOfLines={1}>
                          {name}
                        </Text>
                        <Stars value={rv.rating} size={12} />
                      </View>
                      <Text style={type.ui(13.5, comment ? "regular" : "medium", comment ? c.inkSoft : c.inkMute, { lineHeight: 20 })}>
                        {comment || STORE_PRODUCT.reviews.noNote}
                      </Text>
                    </View>
                  </View>
                );
              })}

              <ReviewComposer
                rating={reviewRating}
                onRating={onReviewRatingChange}
                comment={reviewComment}
                onComment={onReviewCommentChange}
                busy={reviewBusy}
                success={reviewSuccess}
                error={reviewError}
                isAuthenticated={isAuthenticated}
                onSubmit={onSubmitReview}
                navigation={navigation}
              />
            </Surface>
          </View>

          {relatedProducts.length ? (
            <View style={styles.related}>
              <SectionHeader title={STORE_PRODUCT.related.title} />
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={[styles.relatedRail, { paddingHorizontal: gutter }]}>
                {relatedProducts.map((p) => (
                  <ProductCard key={p.id} product={p} width={158} hideEta onPress={() => onRelatedPress?.(p)} />
                ))}
              </ScrollView>
            </View>
          ) : null}
        </ScrollView>

        <View style={[styles.topBar, { paddingTop: insets.top + 6 }]} pointerEvents="box-none">
          {solid ? (
            <Animated.View entering={FadeIn.duration(160)} exiting={FadeOut.duration(120)} style={StyleSheet.absoluteFill} pointerEvents="none">
              <View style={[StyleSheet.absoluteFill, { backgroundColor: c.page, borderBottomColor: c.line, borderBottomWidth: StyleSheet.hairlineWidth }]} />
            </Animated.View>
          ) : null}
          <View style={[styles.topRow, { paddingHorizontal: gutter }]} pointerEvents="box-none">
            <RoundButton icon="chevron-back" label={STORE_PRODUCT.back} onPress={goBack} />
            {solid ? (
              <Animated.Text entering={FadeIn.duration(160)} exiting={FadeOut.duration(100)} style={[type.ui(16, "extrabold", c.ink), styles.topTitle]} numberOfLines={1} pointerEvents="none">
                {product.name}
              </Animated.Text>
            ) : (
              <View style={styles.flex} pointerEvents="none" />
            )}
            <View style={styles.topActions}>
              <RoundButton
                icon={wished ? "heart" : "heart-outline"}
                active={wished}
                label={wished ? STORE_PRODUCT.wishlistRemove : STORE_PRODUCT.wishlistAdd}
                onPress={() => {
                  hapticTap();
                  wishlist.toggle(product.id);
                }}
              />
              <RoundButton icon="share-outline" label={STORE_PRODUCT.share} onPress={share} />
              <RoundButton
                icon="bag-handle-outline"
                label={STORE_PRODUCT.bag(totalItems)}
                badge={totalItems}
                onPress={() => navigation.navigate(isAuthenticated ? "Cart" : "Login")}
              />
            </View>
          </View>
        </View>

        <ScrollEdgeFade height={dockBottom + STORE_NAV_HEIGHT + 30} />
        <BuyDock
          bottom={dockBottom}
          price={Number(displayPrice) || 0}
          quantity={quantity}
          unavailable={unavailable}
          onAdd={onAddToCart}
          onRemove={onRemoveFromCart}
          onBuyNow={onBuyNow}
        />
      </View>
    </VariantSheetProvider>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  flex: { flex: 1 },
  center: { textAlign: "center" },
  wash: { position: "absolute", top: 0, left: 0, right: 0 },
  topBar: { position: "absolute", top: 0, left: 0, right: 0, paddingBottom: 10, zIndex: 30 },
  topRow: { flexDirection: "row", alignItems: "center", gap: 10, height: 46 },
  topTitle: { flex: 1, textAlign: "center" },
  topActions: { flexDirection: "row", alignItems: "center", gap: 8 },
  round: { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center", borderWidth: StyleSheet.hairlineWidth },
  roundBadge: { position: "absolute", top: -3, right: -3, minWidth: 19, height: 19, paddingHorizontal: 4, borderRadius: 10, borderWidth: 2, alignItems: "center", justifyContent: "center" },
  roundBadgeText: { fontFamily: fonts.extrabold, fontSize: 10.5, color: "#2A1E08" },
  hero: { overflow: "hidden", borderWidth: StyleSheet.hairlineWidth },
  heroFallback: { flex: 1, alignItems: "center", justifyContent: "center" },
  heroBadge: { position: "absolute", top: 14, left: 14, paddingHorizontal: 11, paddingVertical: 6, borderRadius: 11 },
  soldWrap: { ...StyleSheet.absoluteFillObject, alignItems: "center", justifyContent: "center" },
  soldTag: { paddingHorizontal: 16, paddingVertical: 9, borderRadius: 14, borderWidth: StyleSheet.hairlineWidth },
  counter: { position: "absolute", right: 14, bottom: 14, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  thumbs: { gap: 10, paddingTop: 14, paddingBottom: 2 },
  thumb: { width: 60, height: 60, borderRadius: 18, overflow: "hidden" },
  titleBlock: { gap: 7, paddingTop: 4 },
  pillRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, alignItems: "center", marginTop: 3 },
  pill: { flexDirection: "row", alignItems: "center", gap: 5, height: 28, paddingHorizontal: 10, borderRadius: 14, borderWidth: StyleSheet.hairlineWidth },
  rating: { flexDirection: "row", alignItems: "center", gap: 4, height: 28, paddingHorizontal: 10, borderRadius: 14, borderWidth: StyleSheet.hairlineWidth },
  surface: { borderWidth: StyleSheet.hairlineWidth, padding: 18 },
  priceCard: { gap: 6 },
  priceRow: { flexDirection: "row", alignItems: "baseline", flexWrap: "wrap", gap: 10 },
  strike: { textDecorationLine: "line-through" },
  save: { paddingHorizontal: 9, paddingVertical: 4, borderRadius: 9, alignSelf: "center" },
  block: { gap: 10, marginTop: 14 },
  variantScroll: { marginHorizontal: -18 },
  variantRow: { gap: 10, paddingHorizontal: 18, paddingVertical: 2 },
  variant: { minWidth: 112, paddingHorizontal: 14, paddingVertical: 12, gap: 5 },
  variantTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8 },
  variantTag: { alignSelf: "flex-start", paddingHorizontal: 7, paddingVertical: 2.5, borderRadius: 7 },
  delivery: { flexDirection: "row", alignItems: "center", gap: 12, padding: 14, marginTop: 14 },
  deliveryIcon: { width: 42, height: 42, borderRadius: 21, alignItems: "center", justifyContent: "center" },
  trustRow: { gap: 8, paddingRight: 4 },
  trust: { flexDirection: "row", alignItems: "center", gap: 7, height: 38, paddingHorizontal: 13, borderRadius: 19, borderWidth: StyleSheet.hairlineWidth },
  about: { gap: 12 },
  stack: { gap: 10 },
  iconRow: { flexDirection: "row", alignItems: "flex-start", gap: 12 },
  rowText: { flex: 1, minWidth: 0, gap: 2 },
  rowIcon: { width: 34, height: 34, borderRadius: 17, alignItems: "center", justifyContent: "center" },
  check: { width: 22, height: 22, borderRadius: 11, alignItems: "center", justifyContent: "center", marginTop: 0 },
  bulletIcon: { marginTop: 2 },
  stepNum: { width: 26, height: 26, borderRadius: 13, alignItems: "center", justifyContent: "center" },
  accordions: { paddingVertical: 4, paddingHorizontal: 0, overflow: "hidden" },
  accHead: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 18, minHeight: 62 },
  accIcon: { width: 34, height: 34, borderRadius: 17, alignItems: "center", justifyContent: "center" },
  accTitle: { flex: 1 },
  accBody: { paddingHorizontal: 18, paddingBottom: 18, paddingTop: 2 },
  keyRow: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", gap: 14, paddingVertical: 10 },
  keyLabel: { flexShrink: 0 },
  keyValue: { flex: 1, textAlign: "right" },
  subLabel: { marginTop: 2 },
  tagRow: { flexDirection: "row", flexWrap: "wrap", gap: 7 },
  tag: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 12 },
  quote: { borderLeftWidth: 3, paddingLeft: 14, paddingVertical: 2 },
  reviews: { gap: 14 },
  reviewHead: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  reviewSummary: { flexDirection: "row", alignItems: "center", gap: 12, marginTop: 4 },
  stars: { flexDirection: "row", gap: 2 },
  review: { flexDirection: "row", gap: 12, padding: 14, borderWidth: StyleSheet.hairlineWidth },
  avatar: { width: 38, height: 38, borderRadius: 19, alignItems: "center", justifyContent: "center" },
  reviewTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 10 },
  composer: { gap: 12, padding: 16, borderWidth: StyleSheet.hairlineWidth },
  pickStars: { flexDirection: "row", gap: 8 },
  composerInput: { minHeight: 76, paddingHorizontal: 14, paddingVertical: 12, borderWidth: StyleSheet.hairlineWidth, textAlignVertical: "top" },
  composerBtn: { height: 48, borderRadius: 24, alignItems: "center", justifyContent: "center" },
  related: { marginTop: 26, gap: 14 },
  relatedRail: { gap: 12, paddingBottom: 6 },
  dockWrap: { position: "absolute", zIndex: 100 },
  dockShadow: { height: STORE_NAV_HEIGHT, borderRadius: STORE_NAV_HEIGHT / 2, borderWidth: 1 },
  dockClip: { flex: 1, borderRadius: STORE_NAV_HEIGHT / 2, overflow: "hidden" },
  dockRow: { flex: 1, flexDirection: "row", alignItems: "center", gap: 8, paddingLeft: 20, paddingRight: 8 },
  dockPrice: { flexShrink: 1, minWidth: 66, maxWidth: 104, justifyContent: "center" },
  dockAdd: { flex: 1.1, height: 50, borderRadius: 25, overflow: "hidden", alignItems: "center", justifyContent: "center", paddingHorizontal: 8 },
  dockBtnFill: { borderRadius: 25 },
  dockBuy: { flex: 1, height: 50, borderRadius: 25, borderWidth: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 8 },
  dockStepper: { flex: 1.1, height: 50, borderRadius: 25, flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 4 },
  dockStepBtn: { width: 40, height: 50, alignItems: "center", justifyContent: "center" },
  dockQty: { minWidth: 22, textAlign: "center" },
  dockUnavailable: { flex: 1, height: 50, borderRadius: 25, alignItems: "center", justifyContent: "center" },
  notFound: { flex: 1, justifyContent: "center", paddingBottom: 80 },
  notFoundCard: { alignItems: "center", gap: 10, padding: 28, borderWidth: StyleSheet.hairlineWidth },
  notFoundIcon: { width: 68, height: 68, borderRadius: 34, alignItems: "center", justifyContent: "center", marginBottom: 4 },
  notFoundBtn: { marginTop: 8, height: 46, paddingHorizontal: 26, borderRadius: 23, alignItems: "center", justifyContent: "center" },
});
