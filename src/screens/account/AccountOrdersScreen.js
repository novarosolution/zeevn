import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Text, View } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import useFlyToCart from "../../hooks/useFlyToCart";
import { Image } from "expo-image";
import AccountLayout from "../../components/account/AccountLayout";
import OrdersFilterBar from "../../components/account/orders/OrdersFilterBar";
import OrderListCard from "../../components/account/orders/OrderListCard";
import Button from "../../components/ui/Button";
import EmptyState from "../../components/ui/EmptyState";
import ReorderConfirmModal from "../../components/account/orders/ReorderConfirmModal";
import { MY_ORDERS_SCREEN } from "../../content/appContent";
import { ACCOUNT_NESTED } from "../../navigation/accountRoutes";
import { fetchMyOrders } from "../../services/userService";
import { getProducts } from "../../services/productService";
import { reorderMyOrderRequest } from "../../services/orderService";
import { useAuth } from "../../context/AuthContext";
import { useCart } from "../../context/CartContext";
import { useTheme } from "../../context/ThemeContext";
import { fonts } from "../../theme/tokens";
import { getImageUriCandidates } from "../../utils/image";
import { getOrderStatusBucket, orderMatchesSearch, sortOrders } from "../../utils/orderPresentation";

const copy = MY_ORDERS_SCREEN;
const PAGE_SIZE = 8;

export default function AccountOrdersScreen({ navigation, route }) {
  const { token } = useAuth();
  const { refreshCartFromServer } = useCart();
  const { semanticPalette, SPACING } = useTheme();

  const [orders, setOrders] = useState([]);
  const [catalog, setCatalog] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState(route?.params?.filter === "active" ? "active" : "all");
  const [sort, setSort] = useState("newest");
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [reorderOrder, setReorderOrder] = useState(null);
  const [reorderBusy, setReorderBusy] = useState(false);

  const { triggerFlyToCart, FlyGhostLayer } = useFlyToCart({
    onComplete: () => navigation.navigate("Cart"),
  });

  const load = useCallback(async () => {
    if (!token) return;
    try {
      setLoading(true);
      const [orderData, products] = await Promise.all([
        fetchMyOrders(token),
        getProducts().catch(() => []),
      ]);
      setOrders(Array.isArray(orderData) ? orderData : []);
      setCatalog(Array.isArray(products) ? products.slice(0, 4) : []);
    } catch {
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  useEffect(() => {
    const hasActive = orders.some((o) => getOrderStatusBucket(o?.status) === "active");
    if (!hasActive || !token) return undefined;
    const id = setInterval(() => {
      fetchMyOrders(token)
        .then((data) => setOrders(Array.isArray(data) ? data : []))
        .catch(() => {});
    }, 30000);
    return () => clearInterval(id);
  }, [orders, token]);

  useEffect(() => {
    if (route?.params?.filter) setFilter(route.params.filter);
  }, [route?.params?.filter]);

  const processed = useMemo(() => {
    let list = orders.filter((o) => orderMatchesSearch(o, search));
    if (filter !== "all") {
      list = list.filter((o) => getOrderStatusBucket(o?.status) === filter);
    }
    return sortOrders(list, sort);
  }, [orders, search, filter, sort]);

  const visible = processed.slice(0, visibleCount);
  const hasMore = visibleCount < processed.length;

  const confirmReorder = useCallback(
    async (flyMeta) => {
      if (!token || !reorderOrder?._id) return;
      try {
        setReorderBusy(true);
        await reorderMyOrderRequest(token, reorderOrder._id);
        await refreshCartFromServer?.();
        setReorderOrder(null);
        if (flyMeta?.sourceRect) {
          triggerFlyToCart(flyMeta);
        } else {
          navigation.navigate("Cart");
        }
      } catch {
        /* noop */
      } finally {
        setReorderBusy(false);
      }
    },
    [navigation, refreshCartFromServer, reorderOrder, token, triggerFlyToCart]
  );

  return (
    <AccountLayout
      navigation={navigation}
      activeKey={ACCOUNT_NESTED.Orders}
      activeSection="orders"
      pageTitle={copy.pageTitle}
      pageSubtitle={copy.pageSubtitle}
    >
      <ReorderConfirmModal
        visible={Boolean(reorderOrder)}
        items={reorderOrder?.products}
        busy={reorderBusy}
        onCancel={() => !reorderBusy && setReorderOrder(null)}
        onConfirm={confirmReorder}
      />
      <FlyGhostLayer />

      <OrdersFilterBar
        search={search}
        onSearchChange={(t) => {
          setSearch(t);
          setVisibleCount(PAGE_SIZE);
        }}
        filter={filter}
        onFilterChange={(f) => {
          setFilter(f);
          setVisibleCount(PAGE_SIZE);
        }}
        sort={sort}
        onSortChange={(s) => {
          setSort(s);
          setVisibleCount(PAGE_SIZE);
        }}
      />

      {!loading && processed.length === 0 ? (
        <View style={{ gap: SPACING.xl }}>
          <EmptyState
            iconName="receipt-outline"
            title={copy.empty.title}
            description={copy.empty.description}
            ctaLabel={copy.empty.cta}
            onCtaPress={() => navigation.navigate("Home")}
          />
          {catalog.length > 0 ? (
            <View>
              <Text
                style={{
                  fontFamily: fonts.regular,
                  fontSize: 14,
                  color: semanticPalette.inkMuted,
                  marginBottom: SPACING.md,
                  textAlign: "center",
                }}
              >
                {copy.empty.whileHere}
              </Text>
              <View style={{ flexDirection: "row", justifyContent: "center", gap: SPACING.sm, flexWrap: "wrap" }}>
                {catalog.map((p) => {
                  const uri = getImageUriCandidates(p.image || "")[0] || "";
                  return uri ? (
                    <Image
                      key={String(p.id)}
                      source={{ uri }}
                      style={{ width: 72, height: 72, borderRadius: 12, backgroundColor: semanticPalette.surfaceAlt }}
                      contentFit="cover"
                    />
                  ) : null;
                })}
              </View>
            </View>
          ) : null}
        </View>
      ) : (
        <View style={{ gap: 16, marginTop: SPACING.md }}>
          {visible.map((order) => (
            <OrderListCard
              key={String(order._id)}
              order={order}
              onView={() => navigation.navigate(ACCOUNT_NESTED.OrderDetail, { order })}
              onTrack={() => navigation.navigate(ACCOUNT_NESTED.OrderDetail, { order })}
              onReorder={() => setReorderOrder(order)}
              onReturn={() => navigation.navigate("Support")}
            />
          ))}
          {hasMore ? (
            <Button
              label={copy.actions.loadMore}
              variant="ghost"
              size="md"
              fullWidth
              onPress={() => setVisibleCount((c) => c + PAGE_SIZE)}
            />
          ) : null}
        </View>
      )}
    </AccountLayout>
  );
}
