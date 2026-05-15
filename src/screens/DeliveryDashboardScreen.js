import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Linking,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import * as Location from "expo-location";
import { useFocusEffect } from "@react-navigation/native";
import Animated, {
  Easing as ReanimatedEasing,
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import MotionScrollView from "../components/motion/MotionScrollView";
import SectionReveal from "../components/motion/SectionReveal";
import useReducedMotion from "../hooks/useReducedMotion";
import { staggerDelay } from "../theme/motion";
import AppFooter from "../components/AppFooter";
import BottomNavBar from "../components/BottomNavBar";
import AuthGateShell from "../components/AuthGateShell";
import CustomerScreenShell from "../components/CustomerScreenShell";
import ScreenPageHeader from "../components/ScreenPageHeader";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import {
  fetchMyDeliveryOrders,
  markDeliveryOrderDelivered,
  updateDeliveryLocation,
} from "../services/deliveryService";
import { openNavigateToDropoff } from "../components/orders/orderLiveMapShared";
import { fetchUserProfile } from "../services/userService";
import {
  customerInnerPageScrollContent,
  customerPanel,
  customerScrollFill,
  customerScrollPaddingTop,
} from "../theme/screenLayout";
import { fonts, icon, layout, semanticRadius, spacing, typography } from "../theme/tokens";
import { formatINR } from "../utils/currency";
import { getOrderStatusLabel } from "../utils/orderStatus";
import PremiumLoader from "../components/ui/PremiumLoader";
import PremiumEmptyState from "../components/ui/PremiumEmptyState";
import PremiumErrorBanner from "../components/ui/PremiumErrorBanner";
import PremiumButton from "../components/ui/PremiumButton";
import PremiumCard from "../components/ui/PremiumCard";
import GoldHairline from "../components/ui/GoldHairline";
import PremiumStatCard from "../components/ui/PremiumStatCard";
import PremiumChip from "../components/ui/PremiumChip";
import PremiumSwitch from "../components/ui/PremiumSwitch";
import { APP_LOADING_UI, DELIVERY_DASHBOARD_COPY, DELIVERY_LIVE_SHARE } from "../content/appContent";

/** Strip weird API payloads so we never paint encoded polylines / blobs as “address”. */
function sanitizeAddressPart(raw, maxLen = 200) {
  const s = typeof raw === "string" ? raw.trim() : String(raw ?? "").trim();
  if (!s) return "";
  const clipped = s.length > maxLen ? `${s.slice(0, maxLen)}…` : s;
  if (clipped.length > 64 && !/\s/.test(clipped) && /^[A-Za-z0-9+/=_-]+$/.test(clipped)) {
    return "";
  }
  return clipped;
}

function formatDeliveryAddressSummary(addr) {
  const line1 = sanitizeAddressPart(addr?.line1);
  const city = sanitizeAddressPart(addr?.city);
  const state = sanitizeAddressPart(addr?.state);
  const cityState = [city, state].filter(Boolean).join(", ");
  const primary = [line1, cityState].filter(Boolean).join(" · ");
  if (primary) return primary;
  if (cityState) return cityState;
  return "";
}

/** Avoid mid-word truncation artifacts in the card meta row. */
function formatEmailForCard(email) {
  const e = String(email ?? "").trim();
  if (!e) return "";
  if (e.length <= 36) return e;
  const at = e.indexOf("@");
  if (at < 1) return `${e.slice(0, 32)}…`;
  const local = e.slice(0, at);
  const domain = e.slice(at + 1);
  if (local.length <= 14) return `${local}@${domain.length > 18 ? `${domain.slice(0, 14)}…` : domain}`;
  return `${local.slice(0, 12)}…@${domain}`;
}

function DeliveryStatusPill({ status, styles, c, reducedMotion }) {
  const isShipping =
    status === "ready_for_pickup" || status === "shipped" || status === "out_for_delivery";
  const targetState = isShipping ? 1 : 0;
  const stateAnim = useSharedValue(targetState);

  useEffect(() => {
    if (reducedMotion) {
      stateAnim.value = targetState;
      return;
    }
    stateAnim.value = withTiming(targetState, {
      duration: 360,
      easing: ReanimatedEasing.bezier(0.22, 1, 0.36, 1),
    });
  }, [targetState, stateAnim, reducedMotion]);

  const animatedPillStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(
      stateAnim.value,
      [0, 1],
      [c.surfaceMuted, c.secondarySoft],
    ),
    borderColor: interpolateColor(
      stateAnim.value,
      [0, 1],
      [c.border, c.secondaryBorder],
    ),
  }));

  return (
    <Animated.View style={[styles.statusPill, animatedPillStyle]}>
      <Text style={styles.statusPillText}>{getOrderStatusLabel(status)}</Text>
    </Animated.View>
  );
}

export default function DeliveryDashboardScreen({ navigation }) {
  const { colors: c, shadowPremium, isDark } = useTheme();
  const styles = useMemo(() => createStyles(c, isDark), [c, isDark]);
  const insets = useSafeAreaInsets();
  const reducedMotion = useReducedMotion();
  const { isAuthenticated, token, user, isAuthLoading, updateStoredUser } = useAuth();
  const [profileHydrated, setProfileHydrated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [orders, setOrders] = useState([]);
  const [renderCount, setRenderCount] = useState(20);
  const [busyOrderId, setBusyOrderId] = useState("");
  const [expandedId, setExpandedId] = useState("");
  const [shareLiveLocation, setShareLiveLocation] = useState(false);
  const [locError, setLocError] = useState("");
  const [locPingAt, setLocPingAt] = useState("");
  /** Handles both expo-location subscriptions and browser `watchPosition` ids. */
  const watchRef = useRef(null);

  const stopWatching = useCallback(() => {
    const w = watchRef.current;
    if (w != null) {
      w.remove();
      watchRef.current = null;
    }
  }, []);

  const pushLocation = useCallback(
    async (coords) => {
      if (!token) return;
      try {
        await updateDeliveryLocation(token, {
          latitude: coords.latitude,
          longitude: coords.longitude,
          accuracyMeters: coords.accuracy != null ? coords.accuracy : undefined,
        });
        setLocPingAt(new Date().toISOString());
        setLocError("");
      } catch (e) {
        setLocError(e.message || "Could not update location.");
      }
    },
    [token]
  );

  const startWatching = useCallback(async () => {
    stopWatching();
    try {
      if (Platform.OS === "web") {
        if (typeof globalThis !== "undefined" && globalThis.isSecureContext === false) {
          setLocError("Live location on the web requires HTTPS (or localhost for development).");
          setShareLiveLocation(false);
          return;
        }
        if (typeof navigator === "undefined" || !navigator.geolocation) {
          setLocError("Geolocation is not available in this browser.");
          setShareLiveLocation(false);
          return;
        }
        const watchId = navigator.geolocation.watchPosition(
          (pos) => {
            pushLocation({
              latitude: pos.coords.latitude,
              longitude: pos.coords.longitude,
              accuracy: pos.coords.accuracy ?? undefined,
            });
          },
          (geoErr) => {
            const msg =
              geoErr.code === 1
                ? "Location denied. Allow it for this site in browser settings."
                : geoErr.message || "Could not read location.";
            setLocError(msg);
            setShareLiveLocation(false);
          },
          {
            enableHighAccuracy: false,
            maximumAge: 12000,
            timeout: 25000,
          }
        );
        watchRef.current = {
          remove: () => navigator.geolocation.clearWatch(watchId),
        };
        return;
      }

      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        setLocError("Location denied. Enable it in system settings.");
        setShareLiveLocation(false);
        return;
      }
      const subscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.Balanced,
          timeInterval: 15000,
          distanceInterval: 35,
        },
        (loc) => {
          pushLocation(loc.coords);
        }
      );
      watchRef.current = {
        remove: () => subscription.remove(),
      };
    } catch (e) {
      setLocError(e.message || "Could not start live location.");
      setShareLiveLocation(false);
    }
  }, [stopWatching, pushLocation]);

  useFocusEffect(
    useCallback(() => {
      if (!shareLiveLocation || !user?.isDeliveryPartner || !token) {
        stopWatching();
        return () => stopWatching();
      }
      startWatching();
      return () => {
        stopWatching();
      };
    }, [shareLiveLocation, user?.isDeliveryPartner, token, startWatching, stopWatching])
  );

  useEffect(() => {
    if (isAuthLoading) return;
    if (!isAuthenticated) {
      navigation.navigate("Login");
    }
  }, [isAuthLoading, isAuthenticated, navigation]);

  useEffect(() => {
    if (!isAuthenticated) {
      setProfileHydrated(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (isAuthLoading || !isAuthenticated || !token) return;
    let cancelled = false;
    setProfileHydrated(false);
    (async () => {
      try {
        const fresh = await fetchUserProfile(token);
        if (!cancelled) {
          await updateStoredUser(fresh);
        }
      } catch {
        // Keep cached user; screen still works if token is valid.
      } finally {
        if (!cancelled) {
          setProfileHydrated(true);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
    // Intentionally omit updateStoredUser: it changes when `user` updates and would retrigger this effect in a loop.
  }, [isAuthLoading, isAuthenticated, token, updateStoredUser]);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const data = await fetchMyDeliveryOrders(token);
      setOrders(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || "Unable to load assigned orders.");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (!profileHydrated || isAuthLoading || !isAuthenticated || !user?.isDeliveryPartner) return;
    load();
  }, [profileHydrated, isAuthLoading, isAuthenticated, user?.isDeliveryPartner, load]);

  useEffect(() => {
    setRenderCount(20);
  }, [orders.length]);

  const deliveryStats = useMemo(() => {
    const list = Array.isArray(orders) ? orders : [];
    const canComplete = (st) =>
      st === "ready_for_pickup" || st === "shipped" || st === "out_for_delivery";
    return {
      total: list.length,
      actionable: list.filter((o) => canComplete(o.status)).length,
    };
  }, [orders]);

  const renderedOrders = useMemo(
    () => (Array.isArray(orders) ? orders.slice(0, renderCount) : []),
    [orders, renderCount]
  );

  const handleMarkDelivered = async (orderId) => {
    try {
      setBusyOrderId(orderId);
      setError("");
      setSuccess("");
      await markDeliveryOrderDelivered(token, orderId);
      setSuccess("Order marked as delivered.");
      await load();
    } catch (err) {
      setError(err.message || "Could not update order.");
    } finally {
      setBusyOrderId("");
    }
  };

  if (isAuthLoading || !isAuthenticated) {
    return <AuthGateShell />;
  }

  if (!profileHydrated) {
    return (
      <CustomerScreenShell
        style={[styles.screen, Platform.OS === "web" ? { paddingTop: customerScrollPaddingTop(insets) } : null]}
        variant="admin"
      >
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center", padding: spacing.lg }}>
          <PremiumLoader size="md" caption={APP_LOADING_UI.inline.admin} />
        </View>
      </CustomerScreenShell>
    );
  }

  if (!user?.isDeliveryPartner) {
    return (
      <CustomerScreenShell style={styles.screen} variant="admin">
        <MotionScrollView
          style={customerScrollFill}
          contentContainerStyle={customerInnerPageScrollContent(insets)}
          showsVerticalScrollIndicator={false}
        >
          <ScreenPageHeader
            navigation={navigation}
            title={DELIVERY_DASHBOARD_COPY.pageTitle}
            subtitle={DELIVERY_DASHBOARD_COPY.noAccessSubtitle}
          />
          <View style={[styles.panel, customerPanel(c, shadowPremium, isDark)]}>
            <PremiumEmptyState
              iconName="bicycle-outline"
              title={DELIVERY_DASHBOARD_COPY.noAccessTitle}
              description={DELIVERY_DASHBOARD_COPY.noAccessDescription}
              ctaLabel={DELIVERY_DASHBOARD_COPY.backHomeCta}
              ctaIconLeft="arrow-back-outline"
              onCtaPress={() => navigation.navigate("Home")}
            />
          </View>
          <AppFooter />
        </MotionScrollView>
      </CustomerScreenShell>
    );
  }

  return (
    <CustomerScreenShell style={styles.screen} variant="admin">
      <MotionScrollView
        style={customerScrollFill}
        contentContainerStyle={customerInnerPageScrollContent(insets)}
        showsVerticalScrollIndicator={false}
      >
        <ScreenPageHeader
          navigation={navigation}
          title={DELIVERY_DASHBOARD_COPY.pageTitle}
          subtitle={DELIVERY_DASHBOARD_COPY.pageSubtitle}
        />
        <GoldHairline marginVertical={spacing.sm} />

        <SectionReveal preset="fade-up" delay={40}>
        <View style={[styles.panel, customerPanel(c, shadowPremium, isDark)]}>
          <PremiumCard variant="muted" padding="md" style={styles.liveLocationCard}>
            <View style={styles.liveLocationRow}>
              <View style={styles.liveLocationCopy}>
                <View style={styles.liveLocationTitleRow}>
                  <Text style={styles.liveLocationTitle}>{DELIVERY_LIVE_SHARE.title}</Text>
                  {shareLiveLocation ? (
                    <PremiumChip label={DELIVERY_LIVE_SHARE.sharingActive} tone="green" size="sm" selected />
                  ) : null}
                </View>
                <Text style={styles.liveLocationHint}>
                  {DELIVERY_LIVE_SHARE.hintBeforeBold}
                  <Text style={styles.liveLocationHintBold}>{DELIVERY_LIVE_SHARE.hintBold}</Text>
                  {DELIVERY_LIVE_SHARE.hintAfterBold}
                </Text>
              </View>
            </View>
            <PremiumSwitch
              label={DELIVERY_LIVE_SHARE.switchA11yLabel}
              hint="Share location while delivering so customers and admin can see live progress."
              value={shareLiveLocation}
              onChange={(on) => {
                setLocError("");
                setShareLiveLocation(on);
              }}
            />
            {Platform.OS === "web" ? (
              <Text style={styles.liveLocationWebHint}>{DELIVERY_LIVE_SHARE.webHint}</Text>
            ) : null}
            {locError ? (
              <View style={styles.bannerWrap}>
                <PremiumErrorBanner severity="warning" message={locError} compact />
              </View>
            ) : null}
            {locPingAt ? (
              <Text style={styles.livePingText}>
                {DELIVERY_LIVE_SHARE.lastSentPrefix}{" "}
                {new Date(locPingAt).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })}
              </Text>
            ) : null}
          </PremiumCard>

          {!loading && orders.length > 0 ? (
            <View style={styles.summaryRow}>
              <PremiumStatCard
                value={String(deliveryStats.total)}
                label="Assigned"
                iconName="bicycle-outline"
                tone="gold"
                compact
                style={styles.summaryStat}
              />
              <PremiumStatCard
                value={String(deliveryStats.actionable)}
                label="Ready to complete"
                iconName="checkmark-done-outline"
                tone={deliveryStats.actionable > 0 ? "green" : "neutral"}
                compact
                style={styles.summaryStat}
              />
            </View>
          ) : null}
          <View style={styles.hintCard}>
            <Ionicons name="map-outline" size={icon.md} color={c.primary} />
            <Text style={styles.hint}>
              Admin assigns you in Manage Orders. Once the order is <Text style={styles.hintBold}>Ready for pickup</Text>,{" "}
              <Text style={styles.hintBold}>Out for delivery</Text>, or <Text style={styles.hintBold}>Shipped</Text>, tap Mark
              delivered when the customer receives it.
            </Text>
          </View>
          {error ? (
            <View style={styles.bannerWrap}>
              <PremiumErrorBanner severity="error" message={error} compact />
            </View>
          ) : null}
          {success ? (
            <View style={styles.bannerWrap}>
              <PremiumErrorBanner severity="success" message={success} compact />
            </View>
          ) : null}

          <View style={styles.actionsRow}>
            <PremiumButton
              label={loading ? "Refreshing…" : "Refresh"}
              iconLeft="refresh-outline"
              variant="ghost"
              size="sm"
              loading={loading}
              disabled={loading}
              onPress={load}
            />
          </View>

          {loading && orders.length === 0 ? (
            <View style={{ paddingVertical: spacing.lg }}>
              <PremiumLoader size="sm" caption={APP_LOADING_UI.inline.admin} />
            </View>
          ) : null}

          {!loading && orders.length === 0 ? (
            <PremiumEmptyState
              iconName="bicycle-outline"
              title="No active deliveries"
              description="Assigned active orders will appear here."
              compact
            />
          ) : null}

          {renderedOrders.map((item, idx) => {
            const addr = item.shippingAddress || {};
            const phone = String(addr.phone || "").trim();
            const expanded = expandedId === item._id;
            const canComplete =
              item.status === "ready_for_pickup" ||
              item.status === "shipped" ||
              item.status === "out_for_delivery";
            const lat = Number(addr.latitude);
            const lng = Number(addr.longitude);
            const hasCoords = Number.isFinite(lat) && Number.isFinite(lng);
            const addressQuery = [addr.line1, addr.city, addr.state, addr.postalCode, addr.country]
              .filter((x) => String(x || "").trim())
              .join(", ");
            const hasNavTarget = hasCoords || Boolean(addressQuery);
            const addrSummary =
              formatDeliveryAddressSummary(addr) ||
              [sanitizeAddressPart(addr?.city), sanitizeAddressPart(addr?.state)].filter(Boolean).join(", ") ||
              DELIVERY_DASHBOARD_COPY.addressUnavailable;
            const customerDisplayName =
              String(addr.fullName || item.user?.name || "").trim() || "Customer";
            return (
              <SectionReveal
                key={item._id}
                preset="fade-up"
                index={idx}
                delay={staggerDelay(idx, { initialDelay: 60, gap: 70 })}
              >
              <PremiumCard padding="lg" style={styles.orderCard}>
                <View style={styles.cardTop}>
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <Text style={styles.orderId}>#{String(item._id).slice(-6).toUpperCase()}</Text>
                    <Text style={styles.customerName} numberOfLines={1}>
                      {addr.fullName || item.user?.name || "Customer"}
                    </Text>
                    <Text style={styles.meta} numberOfLines={2}>
                      {formatEmailForCard(item.user?.email)}
                    </Text>
                  </View>
                  <DeliveryStatusPill status={item.status} styles={styles} c={c} reducedMotion={reducedMotion} />
                </View>

                <View
                  style={[
                    styles.dropoffStrip,
                    {
                      borderColor: c.border,
                      backgroundColor: isDark ? c.surfaceMuted : c.primarySoft,
                    },
                  ]}
                >
                  <View style={styles.dropoffStripHeader}>
                    <View style={styles.dropoffStripLead}>
                      <Ionicons name="navigate-circle-outline" size={icon.md} color={c.primary} />
                      <Text style={[styles.dropoffEyebrow, { color: c.textMuted }]} numberOfLines={1}>
                        {DELIVERY_DASHBOARD_COPY.dropoffEyebrow}
                      </Text>
                    </View>
                    {hasNavTarget ? (
                      <View style={styles.navigateBtnWrap}>
                        <PremiumButton
                          label={DELIVERY_DASHBOARD_COPY.navigateDropoff}
                          iconLeft="navigate-outline"
                          variant="ghost"
                          size="sm"
                          onPress={() =>
                            openNavigateToDropoff({
                              latitude: addr.latitude,
                              longitude: addr.longitude,
                              addressQuery,
                            })
                          }
                        />
                      </View>
                    ) : null}
                  </View>
                  <Text style={[styles.dropoffCustomer, { color: c.textPrimary }]} numberOfLines={1}>
                    {customerDisplayName}
                  </Text>
                  <Text style={[styles.dropoffAddr, { color: c.textPrimary }]} numberOfLines={4}>
                    {addrSummary}
                  </Text>
                  {phone ? (
                    <TouchableOpacity
                      style={styles.dropoffPhoneRow}
                      onPress={() => Linking.openURL(`tel:${phone.replace(/\s/g, "")}`)}
                      accessibilityRole="button"
                      accessibilityLabel={DELIVERY_DASHBOARD_COPY.customerCallA11y}
                      hitSlop={8}
                    >
                      <Ionicons name="call-outline" size={icon.sm} color={c.secondary} />
                      <Text style={[styles.dropoffPhone, { color: c.secondary }]}>{phone}</Text>
                    </TouchableOpacity>
                  ) : null}
                </View>

                <Text style={styles.amount}>{formatINR(Number(item.totalPrice || 0))}</Text>
                <Text style={styles.itemCountMeta}>
                  {(item.products || []).reduce((s, p) => s + Number(p.quantity || 0), 0)} items
                </Text>

                <View style={styles.rowBtns}>
                  {canComplete ? (
                    <PremiumButton
                      label={busyOrderId === item._id ? "Saving…" : "Mark delivered"}
                      iconLeft="checkmark-circle-outline"
                      variant="secondary"
                      size="md"
                      fullWidth
                      loading={busyOrderId === item._id}
                      disabled={busyOrderId === item._id}
                      onPress={() => handleMarkDelivered(item._id)}
                    />
                  ) : (
                    <View style={styles.waitingBanner}>
                      <Ionicons name="hourglass-outline" size={icon.sm} color={c.primary} />
                      <Text style={styles.waitingText}>
                        Waiting for admin to advance order to Ready for pickup (or Out for delivery / Shipped) before you
                        can complete delivery.
                      </Text>
                    </View>
                  )}
                  <PremiumButton
                    label={expanded ? "Hide" : "Address & items"}
                    iconRight={expanded ? "chevron-up-outline" : "chevron-down-outline"}
                    variant="subtle"
                    size="sm"
                    fullWidth
                    onPress={() => setExpandedId(expanded ? "" : item._id)}
                  />
                </View>

                {expanded ? (
                  <View style={styles.detailBlock}>
                    <Text style={styles.detailHeading}>Drop-off</Text>
                    <Text style={styles.detailLine}>
                      {[
                        sanitizeAddressPart(addr?.line1),
                        sanitizeAddressPart(addr?.city),
                        sanitizeAddressPart(addr?.state),
                        sanitizeAddressPart(addr?.postalCode),
                      ]
                        .filter(Boolean)
                        .join(", ")}
                    </Text>
                    <Text style={styles.detailLine}>{sanitizeAddressPart(addr?.country)}</Text>
                    {phone ? (
                      <TouchableOpacity
                        style={styles.phoneRow}
                        onPress={() => Linking.openURL(`tel:${phone.replace(/\s/g, "")}`)}
                      >
                        <Ionicons name="call-outline" size={icon.sm} color={c.secondary} />
                        <Text style={styles.phoneText}>{phone}</Text>
                      </TouchableOpacity>
                    ) : null}
                    {String(addr.note || "").trim() ? (
                      <Text style={styles.noteText}>Note: {String(addr.note).trim()}</Text>
                    ) : null}

                    <Text style={[styles.detailHeading, { marginTop: spacing.md }]}>Items</Text>
                    {(item.products || []).map((line, lineIdx) => (
                      <Text key={`${item._id}-p-${lineIdx}`} style={styles.lineItem}>
                        {line.name} × {line.quantity}
                      </Text>
                    ))}
                  </View>
                ) : null}
              </PremiumCard>
              </SectionReveal>
            );
          })}
          {renderedOrders.length < orders.length ? (
            <View style={styles.loadMoreWrap}>
              <PremiumButton
                label={`Load more (${orders.length - renderedOrders.length} remaining)`}
                iconLeft="chevron-down-outline"
                variant="subtle"
                size="md"
                fullWidth
                onPress={() => setRenderCount((prev) => prev + 20)}
              />
            </View>
          ) : null}
        </View>
        </SectionReveal>

        <AppFooter />
      </MotionScrollView>
      {Platform.OS !== "web" ? <BottomNavBar /> : null}
    </CustomerScreenShell>
  );
}

function createStyles(c, isDark) {
  return StyleSheet.create({
    screen: {
      flex: 1,
      width: "100%",
      alignSelf: "center",
      maxWidth: Platform.select({ web: layout.maxContentWidth + 96, default: "100%" }),
    },
    panel: {
      marginBottom: spacing.xl,
    },
    liveLocationCard: {
      marginBottom: spacing.md,
    },
    liveLocationRow: {
      marginBottom: spacing.sm,
    },
    liveLocationCopy: {
      width: "100%",
    },
    liveLocationTitleRow: {
      flexDirection: "row",
      alignItems: "center",
      flexWrap: "wrap",
      gap: spacing.sm,
      marginBottom: 4,
    },
    liveLocationTitle: {
      fontFamily: fonts.bold,
      fontSize: typography.body,
      color: c.textPrimary,
    },
    liveLocationHint: {
      fontSize: typography.caption,
      color: c.textSecondary,
      lineHeight: 18,
      fontFamily: fonts.regular,
    },
    liveLocationHintBold: {
      fontFamily: fonts.bold,
      color: c.textPrimary,
    },
    liveLocationWebHint: {
      marginTop: spacing.sm,
      fontSize: typography.caption,
      color: c.textMuted,
      fontFamily: fonts.medium,
    },
    livePingText: {
      marginTop: spacing.sm,
      fontSize: typography.caption,
      color: c.textMuted,
      fontFamily: fonts.regular,
    },
    summaryRow: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: spacing.sm,
      marginBottom: spacing.md,
    },
    summaryStat: {
      flex: 1,
      minWidth: 200,
    },
    hintCard: {
      flexDirection: "row",
      alignItems: "flex-start",
      flexWrap: "wrap",
      gap: spacing.sm,
      marginBottom: spacing.md,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm + 2,
      borderRadius: semanticRadius.card,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: isDark ? c.border : "rgba(63, 63, 70, 0.12)",
      backgroundColor: isDark ? "rgba(255,255,255,0.03)" : "rgba(255,255,255,0.62)",
    },
    hint: {
      color: c.textSecondary,
      fontSize: typography.bodySmall,
      lineHeight: 20,
      fontFamily: fonts.regular,
      flex: 1,
      minWidth: 0,
      maxWidth: Platform.select({ web: 760, default: "100%" }),
    },
    bannerWrap: {
      marginBottom: spacing.sm,
    },
    hintBold: {
      fontFamily: fonts.bold,
      color: c.textPrimary,
    },
    errorText: {
      color: c.danger,
      fontFamily: fonts.semibold,
      marginBottom: spacing.sm,
    },
    successText: {
      color: c.success,
      fontFamily: fonts.semibold,
      marginBottom: spacing.sm,
    },
    actionsRow: {
      flexDirection: "row",
      flexWrap: "wrap",
      marginBottom: spacing.md,
    },
    loadMoreWrap: {
      marginTop: spacing.sm,
      alignItems: "center",
    },
    refreshBtn: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.md,
      borderRadius: semanticRadius.full,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: c.primaryBorder,
      backgroundColor: c.primarySoft,
    },
    refreshBtnText: {
      color: c.primary,
      fontFamily: fonts.bold,
      fontSize: typography.bodySmall,
    },
    emptyBox: {
      alignItems: "center",
      paddingVertical: spacing.xl,
      gap: spacing.sm,
    },
    emptyTitle: {
      fontFamily: fonts.bold,
      fontSize: typography.h3,
      color: c.textPrimary,
    },
    emptySub: {
      textAlign: "center",
      color: c.textSecondary,
      fontSize: typography.bodySmall,
      paddingHorizontal: spacing.md,
    },
    orderCard: {
      marginBottom: spacing.sm,
    },
    cardTop: {
      flexDirection: "row",
      alignItems: "flex-start",
      gap: spacing.sm,
    },
    dropoffStrip: {
      marginTop: spacing.sm,
      flexDirection: "column",
      alignItems: "stretch",
      gap: spacing.xs,
      padding: spacing.sm,
      borderRadius: semanticRadius.control,
      borderWidth: StyleSheet.hairlineWidth,
    },
    dropoffStripHeader: {
      flexDirection: "row",
      alignItems: "flex-start",
      justifyContent: "space-between",
      flexWrap: "wrap",
      gap: spacing.sm,
    },
    dropoffStripLead: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.sm,
      flex: 1,
      minWidth: 0,
    },
    dropoffEyebrow: {
      fontFamily: fonts.bold,
      fontSize: typography.caption,
      letterSpacing: 0.6,
      textTransform: "uppercase",
    },
    dropoffCustomer: {
      fontFamily: fonts.bold,
      fontSize: typography.bodySmall,
      marginTop: 2,
    },
    dropoffAddr: {
      marginTop: 2,
      fontSize: typography.bodySmall,
      lineHeight: 20,
      fontFamily: fonts.regular,
    },
    dropoffPhoneRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      marginTop: spacing.xs,
    },
    dropoffPhone: {
      fontFamily: fonts.bold,
      fontSize: typography.bodySmall,
    },
    navigateBtnWrap: {
      flexShrink: 0,
      alignSelf: "flex-start",
      ...Platform.select({
        web: { marginLeft: "auto" },
        default: {},
      }),
    },
    orderId: {
      fontFamily: fonts.extrabold,
      color: c.primary,
      fontSize: typography.caption,
      letterSpacing: 0.5,
    },
    customerName: {
      fontFamily: fonts.bold,
      fontSize: typography.body,
      color: c.textPrimary,
      marginTop: 2,
    },
    meta: {
      fontSize: typography.caption,
      color: c.textSecondary,
      marginTop: 2,
    },
    amount: {
      marginTop: spacing.md,
      fontFamily: fonts.extrabold,
      fontSize: typography.h3,
      color: c.textPrimary,
    },
    itemCountMeta: {
      fontSize: typography.caption,
      color: c.textSecondary,
      marginTop: spacing.xs + 2,
    },
    statusPill: {
      paddingHorizontal: spacing.sm,
      paddingVertical: 4,
      borderRadius: semanticRadius.full,
      backgroundColor: c.surfaceMuted,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: c.border,
    },
    statusPillShipped: {
      borderColor: c.secondaryBorder,
      backgroundColor: c.secondarySoft,
    },
    statusPillText: {
      fontFamily: fonts.bold,
      fontSize: typography.caption,
      color: c.textPrimary,
      textTransform: "capitalize",
    },
    rowBtns: {
      marginTop: spacing.md,
      gap: spacing.sm,
    },
    deliveredBtn: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      backgroundColor: c.secondary,
      paddingVertical: spacing.sm + 2,
      borderRadius: semanticRadius.control,
    },
    deliveredBtnText: {
      color: c.onSecondary,
      fontFamily: fonts.bold,
      fontSize: typography.body,
    },
    waitingBanner: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.sm,
      padding: spacing.sm,
      borderRadius: semanticRadius.control,
      backgroundColor: c.primarySoft,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: c.primaryBorder,
    },
    waitingText: {
      flex: 1,
      color: c.textSecondary,
      fontSize: typography.caption,
      fontFamily: fonts.medium,
    },
    detailBlock: {
      marginTop: spacing.md,
      paddingTop: spacing.md,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: c.border,
    },
    detailHeading: {
      fontFamily: fonts.bold,
      color: c.textPrimary,
      fontSize: typography.bodySmall,
      marginBottom: 4,
    },
    detailLine: {
      color: c.textSecondary,
      fontSize: typography.bodySmall,
      lineHeight: 20,
    },
    phoneRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      marginTop: spacing.sm,
    },
    phoneText: {
      color: c.secondary,
      fontFamily: fonts.bold,
      fontSize: typography.body,
    },
    noteText: {
      marginTop: spacing.sm,
      fontSize: typography.caption,
      color: c.textMuted,
      fontFamily: fonts.medium,
    },
    lineItem: {
      fontSize: typography.bodySmall,
      color: c.textPrimary,
      marginTop: 4,
      fontFamily: fonts.regular,
    },
    deniedTitle: {
      fontFamily: fonts.bold,
      fontSize: typography.h3,
      color: c.textPrimary,
      marginBottom: spacing.sm,
    },
    deniedSub: {
      color: c.textSecondary,
      fontSize: typography.bodySmall,
      lineHeight: 20,
      marginBottom: spacing.lg,
    },
    primaryBtn: {
      alignSelf: "flex-start",
      backgroundColor: c.primary,
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.lg,
      borderRadius: semanticRadius.full,
    },
    primaryBtnText: {
      color: c.onPrimary,
      fontFamily: fonts.bold,
    },
  });
}
