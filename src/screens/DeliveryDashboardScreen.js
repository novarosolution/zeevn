import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Linking,
  Platform,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";
import * as Location from "expo-location";
import { useFocusEffect } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import AuthGateShell from "../components/AuthGateShell";
import BottomNavBar from "../components/BottomNavBar";
import OpsLayout from "../components/ops/OpsLayout";
import OpsStatCard from "../components/ops/OpsStatCard";
import DeliveryActiveCard from "../components/ops/DeliveryActiveCard";
import DeliveryOrderTimer from "../components/ops/DeliveryOrderTimer";
import OrderStatusBadge from "../components/ops/OrderStatusBadge";
import OrderLiveMapCard from "../components/orders/OrderLiveMapCard";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import EmptyState from "../components/ui/EmptyState";
import Skeleton from "../components/ui/Skeleton";
import Switch from "../components/ui/Switch";
import ConfirmDialog from "../components/ui/ConfirmDialog";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import {
  fetchMyDeliveryOrders,
  markDeliveryOrderDelivered,
  updateDeliveryLocation,
} from "../services/deliveryService";
import { openNavigateToDropoff } from "../components/orders/orderLiveMapShared";
import { fetchUserProfile } from "../services/userService";
import { fonts, icon } from "../theme/tokens";
import { formatINR } from "../utils/currency";
import { DELIVERY_DASHBOARD_COPY, DELIVERY_LIVE_SHARE, OPS_UI } from "../content/appContent";
import { customerScrollPaddingBottom } from "../theme/screenLayout";

function sanitizeAddressPart(raw, maxLen = 200) {
  const s = typeof raw === "string" ? raw.trim() : String(raw ?? "").trim();
  if (!s) return "";
  const clipped = s.length > maxLen ? `${s.slice(0, maxLen)}…` : s;
  if (clipped.length > 64 && !/\s/.test(clipped) && /^[A-Za-z0-9+/=_-]+$/.test(clipped)) return "";
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

const ACTIVE_STATUSES = new Set(["ready_for_pickup", "shipped", "out_for_delivery"]);

export default function DeliveryDashboardScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { semanticPalette, TYPE, SPACING, RADII } = useTheme();
  const { isAuthenticated, token, user, isAuthLoading, updateStoredUser } = useAuth();
  const [profileHydrated, setProfileHydrated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [orders, setOrders] = useState([]);
  const [renderCount, setRenderCount] = useState(20);
  const [busyOrderId, setBusyOrderId] = useState("");
  const [confirmDeliverId, setConfirmDeliverId] = useState("");
  const [expandedId, setExpandedId] = useState("");
  const [shareLiveLocation, setShareLiveLocation] = useState(false);
  const [locError, setLocError] = useState("");
  const [locPingAt, setLocPingAt] = useState("");
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
          setLocError("Live location on the web requires HTTPS (or localhost).");
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
          { enableHighAccuracy: false, maximumAge: 12000, timeout: 25000 }
        );
        watchRef.current = { remove: () => navigator.geolocation.clearWatch(watchId) };
        return;
      }
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        setLocError("Location denied. Enable it in system settings.");
        setShareLiveLocation(false);
        return;
      }
      const subscription = await Location.watchPositionAsync(
        { accuracy: Location.Accuracy.Balanced, timeInterval: 15000, distanceInterval: 35 },
        (loc) => pushLocation(loc.coords)
      );
      watchRef.current = { remove: () => subscription.remove() };
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
      return () => stopWatching();
    }, [shareLiveLocation, user?.isDeliveryPartner, token, startWatching, stopWatching])
  );

  useEffect(() => {
    if (isAuthLoading) return;
    if (!isAuthenticated) navigation.navigate("Login");
  }, [isAuthLoading, isAuthenticated, navigation]);

  useEffect(() => {
    if (!isAuthenticated) setProfileHydrated(false);
  }, [isAuthenticated]);

  useEffect(() => {
    if (isAuthLoading || !isAuthenticated || !token) return;
    let cancelled = false;
    setProfileHydrated(false);
    (async () => {
      try {
        const fresh = await fetchUserProfile(token);
        if (!cancelled) await updateStoredUser(fresh);
      } catch {
        /* cached user ok */
      } finally {
        if (!cancelled) setProfileHydrated(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isAuthLoading, isAuthenticated, token, updateStoredUser]);

  const load = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      setError("");
      const data = await fetchMyDeliveryOrders(token);
      setOrders(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || "Unable to load assigned orders.");
    } finally {
      setLoading(false);
      setRefreshing(false);
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
    return {
      total: list.length,
      actionable: list.filter((o) => ACTIVE_STATUSES.has(o.status)).length,
    };
  }, [orders]);

  const activeOrder = useMemo(
    () => (Array.isArray(orders) ? orders.find((o) => ACTIVE_STATUSES.has(o.status)) : null),
    [orders]
  );

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

  const refreshControl =
    Platform.OS === "web" ? undefined : (
      <RefreshControl refreshing={refreshing} onRefresh={() => load(true)} tintColor={semanticPalette.ink} />
    );

  if (isAuthLoading || !isAuthenticated) return <AuthGateShell />;

  if (!profileHydrated) {
    return (
      <OpsLayout navigation={navigation} mode="delivery" activeRoute="DeliveryDashboard" sectionTitle="Dashboard">
        <Skeleton height={120} />
      </OpsLayout>
    );
  }

  if (!user?.isDeliveryPartner) {
    return (
      <OpsLayout navigation={navigation} mode="delivery" activeRoute="DeliveryDashboard" sectionTitle="Access">
        <EmptyState
          iconName="bicycle-outline"
          title={DELIVERY_DASHBOARD_COPY.noAccessTitle}
          description={DELIVERY_DASHBOARD_COPY.noAccessDescription}
          ctaLabel={DELIVERY_DASHBOARD_COPY.backHomeCta}
          onCtaPress={() => navigation.navigate("Home")}
        />
      </OpsLayout>
    );
  }

  return (
    <>
      <OpsLayout
        navigation={navigation}
        mode="delivery"
        activeRoute="DeliveryDashboard"
        sectionTitle="Dashboard"
        scrollContentStyle={
          Platform.OS !== "web" ? { paddingBottom: customerScrollPaddingBottom(insets) } : undefined
        }
        refreshControl={refreshControl}
        headerRight={
          <Button
            variant="ghost"
            size="sm"
            label="Refresh"
            loading={loading}
            iconLeft={<Ionicons name="refresh-outline" size={icon.sm} color={semanticPalette.ink} />}
            onPress={() => load(true)}
          />
        }
      >
        {activeOrder ? <DeliveryActiveCard order={activeOrder} /> : null}

        {activeOrder?._id ? (
          <View style={{ marginBottom: SPACING.md }}>
            <Text
              style={{
                fontFamily: fonts.semibold,
                fontSize: TYPE.micro.fontSize,
                letterSpacing: 1.1,
                textTransform: "uppercase",
                color: semanticPalette.inkMuted,
                marginBottom: SPACING.sm,
              }}
            >
              {OPS_UI.delivery.routeMap}
            </Text>
            <OrderLiveMapCard orderId={activeOrder._id} />
          </View>
        ) : null}

        <Card padding="md" style={{ marginBottom: SPACING.md }}>
          <Text style={{ fontFamily: fonts.semibold, fontSize: TYPE.body.fontSize, color: semanticPalette.ink }}>
            {DELIVERY_LIVE_SHARE.title}
          </Text>
          <Text style={{ fontFamily: fonts.regular, fontSize: TYPE.caption.fontSize, color: semanticPalette.inkSoft, marginTop: 4 }}>
            {DELIVERY_LIVE_SHARE.hintBeforeBold}
            <Text style={{ fontFamily: fonts.semibold, color: semanticPalette.ink }}>{DELIVERY_LIVE_SHARE.hintBold}</Text>
            {DELIVERY_LIVE_SHARE.hintAfterBold}
          </Text>
          <Switch
            label={DELIVERY_LIVE_SHARE.switchA11yLabel}
            value={shareLiveLocation}
            onChange={(on) => {
              setLocError("");
              setShareLiveLocation(on);
            }}
          />
          {shareLiveLocation ? (
            <Text style={{ fontFamily: fonts.medium, fontSize: TYPE.caption.fontSize, color: semanticPalette.accent, marginTop: SPACING.sm }}>
              {DELIVERY_LIVE_SHARE.sharingActive}
            </Text>
          ) : null}
          {locError ? (
            <Text style={{ color: semanticPalette.sale, marginTop: SPACING.sm, fontFamily: fonts.medium, fontSize: TYPE.caption.fontSize }}>
              {locError}
            </Text>
          ) : null}
          {locPingAt ? (
            <Text style={{ color: semanticPalette.inkSoft, marginTop: SPACING.xs, fontSize: TYPE.caption.fontSize }}>
              {DELIVERY_LIVE_SHARE.lastSentPrefix}{" "}
              {new Date(locPingAt).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })}
            </Text>
          ) : null}
        </Card>

        {!loading && orders.length > 0 ? (
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: SPACING.sm, marginBottom: SPACING.md }}>
            <OpsStatCard label="Assigned" value={String(deliveryStats.total)} caption="Active queue" style={{ flex: 1, minWidth: 140 }} />
            <OpsStatCard
              label="In progress"
              value={String(deliveryStats.actionable)}
              caption="Ready to complete"
              style={{ flex: 1, minWidth: 140 }}
            />
          </View>
        ) : null}

        {error ? (
          <Text style={{ color: semanticPalette.sale, marginBottom: SPACING.sm, fontFamily: fonts.medium }}>{error}</Text>
        ) : null}
        {success ? (
          <Text style={{ color: semanticPalette.success, marginBottom: SPACING.sm, fontFamily: fonts.medium }}>{success}</Text>
        ) : null}

        <Text
          style={{
            fontFamily: fonts.semibold,
            fontSize: TYPE.micro.fontSize,
            letterSpacing: 1.1,
            textTransform: "uppercase",
            color: semanticPalette.inkMuted,
            marginBottom: SPACING.sm,
          }}
        >
          {OPS_UI.delivery.assignedOrders}
        </Text>

        {loading && orders.length === 0 ? <Skeleton height={160} /> : null}

        {!loading && orders.length === 0 ? (
          <EmptyState
            iconName="bicycle-outline"
            title={OPS_UI.delivery.noDeliveriesTitle}
            description={OPS_UI.delivery.noDeliveriesDescription}
          />
        ) : null}

        {renderedOrders.map((item) => {
          const addr = item.shippingAddress || {};
          const phone = String(addr.phone || "").trim();
          const expanded = expandedId === item._id;
          const canComplete = ACTIVE_STATUSES.has(item.status);
          const addressQuery = [addr.line1, addr.city, addr.state, addr.postalCode, addr.country]
            .filter((x) => String(x || "").trim())
            .join(", ");
          const lat = Number(addr.latitude);
          const lng = Number(addr.longitude);
          const hasNavTarget = (Number.isFinite(lat) && Number.isFinite(lng)) || Boolean(addressQuery);
          const addrSummary = formatDeliveryAddressSummary(addr) || DELIVERY_DASHBOARD_COPY.addressUnavailable;
          const customerDisplayName = String(addr.fullName || item.user?.name || "").trim() || "Customer";
          const isActive = item._id === activeOrder?._id;

          return (
            <Card
              key={item._id}
              padding="md"
              style={{
                marginBottom: SPACING.sm,
                ...(isActive
                  ? { borderColor: semanticPalette.accent, borderWidth: 2, backgroundColor: semanticPalette.accentSoft }
                  : {}),
              }}
            >
              <View style={{ flexDirection: "row", alignItems: "flex-start", gap: SPACING.sm }}>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text style={{ fontFamily: fonts.semibold, fontSize: TYPE.caption.fontSize, color: semanticPalette.inkMuted }}>
                    #{String(item._id).slice(-6).toUpperCase()}
                  </Text>
                  <Text style={{ fontFamily: fonts.semibold, fontSize: TYPE.body.fontSize, color: semanticPalette.ink }} numberOfLines={1}>
                    {customerDisplayName}
                  </Text>
                  <Text style={{ fontFamily: fonts.regular, fontSize: TYPE.caption.fontSize, color: semanticPalette.inkSoft }} numberOfLines={2}>
                    {formatEmailForCard(item.user?.email)}
                  </Text>
                </View>
                <OrderStatusBadge status={item.status} context="delivery" />
              </View>

              {canComplete ? (
                <View style={{ flexDirection: "row", alignItems: "center", gap: SPACING.sm, marginTop: SPACING.xs }}>
                  <Text style={{ fontFamily: fonts.semibold, fontSize: TYPE.caption.fontSize, color: semanticPalette.inkMuted, textTransform: "uppercase" }}>
                    {OPS_UI.delivery.elapsed}
                  </Text>
                  <DeliveryOrderTimer startedAt={item.updatedAt || item.createdAt} />
                </View>
              ) : null}

              <View
                style={{
                  marginTop: SPACING.sm,
                  padding: SPACING.sm,
                  borderRadius: RADII.sm,
                  backgroundColor: semanticPalette.surfaceAlt,
                  borderWidth: StyleSheet.hairlineWidth,
                  borderColor: semanticPalette.line,
                }}
              >
                <Text style={{ fontFamily: fonts.semibold, fontSize: TYPE.caption.fontSize, color: semanticPalette.inkMuted, textTransform: "uppercase" }}>
                  {DELIVERY_DASHBOARD_COPY.dropoffEyebrow}
                </Text>
                <Text style={{ fontFamily: fonts.regular, fontSize: TYPE.small.fontSize, color: semanticPalette.ink, marginTop: 4 }} numberOfLines={4}>
                  {addrSummary}
                </Text>
                {phone ? (
                  <Button
                    variant="ghost"
                    size="sm"
                    label={phone}
                    iconLeft={<Ionicons name="call-outline" size={icon.sm} color={semanticPalette.accent} />}
                    onPress={() => Linking.openURL(`tel:${phone.replace(/\s/g, "")}`)}
                    style={{ marginTop: SPACING.xs, alignSelf: "flex-start" }}
                  />
                ) : null}
                {hasNavTarget ? (
                  <Button
                    variant="ghost"
                    size="sm"
                    label={DELIVERY_DASHBOARD_COPY.navigateDropoff}
                    iconLeft={<Ionicons name="navigate-outline" size={icon.sm} color={semanticPalette.ink} />}
                    onPress={() =>
                      openNavigateToDropoff({ latitude: addr.latitude, longitude: addr.longitude, addressQuery })
                    }
                    style={{ marginTop: SPACING.xs, alignSelf: "flex-start" }}
                  />
                ) : null}
              </View>

              <Text style={{ fontFamily: TYPE.serifFamily, fontSize: TYPE.h3.fontSize, color: semanticPalette.ink, marginTop: SPACING.md }}>
                {formatINR(Number(item.totalPrice || 0))}
              </Text>

              <View style={{ marginTop: SPACING.md, gap: SPACING.sm }}>
                {canComplete ? (
                  <Button
                    variant="secondary"
                    size="md"
                    label={busyOrderId === item._id ? "Saving…" : "Mark delivered"}
                    loading={busyOrderId === item._id}
                    disabled={busyOrderId === item._id}
                    onPress={() => setConfirmDeliverId(item._id)}
                    fullWidth
                  />
                ) : (
                  <Text style={{ fontFamily: fonts.regular, fontSize: TYPE.caption.fontSize, color: semanticPalette.inkSoft }}>
                    {OPS_UI.delivery.waitingAdvance}
                  </Text>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  label={expanded ? "Hide details" : "Address & items"}
                  onPress={() => setExpandedId(expanded ? "" : item._id)}
                  fullWidth
                />
              </View>

              {expanded ? (
                <View style={{ marginTop: SPACING.md, paddingTop: SPACING.md, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: semanticPalette.line }}>
                  {(item.products || []).map((line, lineIdx) => (
                    <Text key={`${item._id}-p-${lineIdx}`} style={{ fontFamily: fonts.regular, fontSize: TYPE.small.fontSize, color: semanticPalette.ink, marginTop: 4 }}>
                      {line.name} × {line.quantity}
                    </Text>
                  ))}
                </View>
              ) : null}
            </Card>
          );
        })}

        {renderedOrders.length < orders.length ? (
          <Button
            variant="ghost"
            size="md"
            label={`Load more (${orders.length - renderedOrders.length} remaining)`}
            onPress={() => setRenderCount((prev) => prev + 20)}
            fullWidth
            style={{ marginTop: SPACING.sm }}
          />
        ) : null}
      </OpsLayout>
      <ConfirmDialog
        visible={Boolean(confirmDeliverId)}
        title="Mark as delivered?"
        message="Confirm the customer received this order. This updates the order status permanently."
        confirmLabel="Mark delivered"
        confirmVariant="primary"
        busy={busyOrderId === confirmDeliverId}
        onCancel={() => setConfirmDeliverId("")}
        onConfirm={() => {
          const id = confirmDeliverId;
          setConfirmDeliverId("");
          handleMarkDelivered(id);
        }}
      />
      {Platform.OS !== "web" ? <BottomNavBar /> : null}
    </>
  );
}
