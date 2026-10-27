import React, { useMemo, useRef, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import Animated, { FadeOut, LinearTransition } from "react-native-reanimated";
import ReanimatedSwipeable from "react-native-gesture-handler/ReanimatedSwipeable";
import { Ionicons } from "@expo/vector-icons";
import { STORE_NOTIFICATIONS } from "../../content/storefrontContent";
import { useStoreTheme, withAlpha } from "../../theme/storefront";
import { hapticTap } from "../../utils/haptics";
import PressableScale from "./PressableScale";
import StoreBanner from "./StoreBanner";
import { Bone, ShimmerProvider } from "./StoreSkeleton";
import StoreScreen from "./StoreScreen";
import { Card, Chip, EmptyState, Group, Rise, SectionLabel } from "./StoreKit";

const DAY = 24 * 60 * 60 * 1000;

function groupByDate(items) {
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const groups = { today: [], week: [], earlier: [] };
  items.forEach((item) => {
    const ts = new Date(item.createdAt || 0).getTime() || 0;
    if (ts >= startOfToday) groups.today.push(item);
    else if (ts >= startOfToday - 7 * DAY) groups.week.push(item);
    else groups.earlier.push(item);
  });
  return groups;
}

function timeAgo(value) {
  const ts = new Date(value || 0).getTime();
  if (!ts) return "";
  const mins = Math.floor((Date.now() - ts) / 60000);
  if (mins < 1) return "now";
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d`;
  return new Date(ts).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

/** Icon + tone per order status. The keys are the backend's `ORDER_STATUS_VALUES`, which is what `orderStatus` carries. */
const ORDER_VISUALS = {
  pending_payment: { icon: "card-outline", tone: "gold" },
  pending: { icon: "receipt-outline", tone: "brand" },
  paid: { icon: "checkmark-circle-outline", tone: "brand" },
  confirmed: { icon: "checkmark-circle-outline", tone: "brand" },
  preparing: { icon: "cube-outline", tone: "brand" },
  ready_for_pickup: { icon: "bag-check-outline", tone: "brand" },
  shipped: { icon: "bicycle-outline", tone: "brand" },
  out_for_delivery: { icon: "bicycle-outline", tone: "brand" },
  delivered: { icon: "checkmark-done-circle-outline", tone: "brand" },
  cancelled: { icon: "close-circle-outline", tone: "danger" },
};

/** Icon + tone for a notification, from its kind and the order status it was sent at. */
function visualFor(item) {
  if (item?.kind === "order") {
    const status = String(item?.orderStatus || "").toLowerCase().trim().replace(/[\s-]+/g, "_");
    if (ORDER_VISUALS[status]) return ORDER_VISUALS[status];
    // Older notifications may carry a human label instead of the enum value.
    const loose = status.replace(/_/g, " ");
    if (loose.includes("cancel")) return ORDER_VISUALS.cancelled;
    if (loose.includes("out for")) return ORDER_VISUALS.out_for_delivery;
    if (loose.includes("deliver")) return ORDER_VISUALS.delivered;
    if (loose.includes("pack") || loose.includes("prepar")) return ORDER_VISUALS.preparing;
    if (loose.includes("confirm")) return ORDER_VISUALS.confirmed;
    return ORDER_VISUALS.pending;
  }
  return { icon: "sparkles-outline", tone: "gold" };
}

function NotificationRow({ item, onOpen, onArchiveToggle }) {
  const { c, type } = useStoreTheme();
  const swipeRef = useRef(null);
  // Only order updates lead somewhere when tapped; an announcement opens in place so the whole text can be read.
  const expandable = item.kind !== "order";
  const [expanded, setExpanded] = useState(false);
  const unread = !item.isRead;
  const { icon, tone } = visualFor(item);
  const tint = tone === "danger" ? c.dangerSoft : tone === "gold" ? c.goldSoft : c.brandSoft;
  const ink = tone === "danger" ? c.danger : tone === "gold" ? c.goldText : c.brand;

  const renderRight = () => (
    <View style={[styles.action, { backgroundColor: c.goldSoft }]}>
      <Ionicons name={item.isArchived ? "arrow-undo-outline" : "archive-outline"} size={22} color={c.goldText} />
      <Text style={type.ui(12, "bold", c.goldText)}>{item.isArchived ? "Restore" : "Archive"}</Text>
    </View>
  );

  return (
    <Animated.View layout={LinearTransition.duration(260)} exiting={FadeOut.duration(160)}>
    <ReanimatedSwipeable
      ref={swipeRef}
      friction={2}
      rightThreshold={56}
      overshootRight={false}
      renderRightActions={renderRight}
      onSwipeableOpen={() => {
        // Only a right-hand action is rendered, so any open event means "archive" (the direction argument means
        // the swipe direction in this library version, not the action side).
        hapticTap();
        swipeRef.current?.close();
        onArchiveToggle(item);
      }}
    >
      <PressableScale
        onPress={() => {
          if (expandable) setExpanded((open) => !open);
          onOpen(item);
        }}
        scaleTo={0.985}
        accessibilityRole="button"
        accessibilityLabel={`${item.title}. ${item.message}`}
        style={[styles.row, { backgroundColor: unread ? c.cardSoft : c.card }]}
      >
        <View style={[styles.bubble, { backgroundColor: tint }]}>
          <Ionicons name={icon} size={21} color={ink} />
          {unread ? <View style={[styles.dot, { backgroundColor: c.gold, borderColor: c.cardSoft }]} /> : null}
        </View>
        <View style={styles.text}>
          <Text style={type.ui(15.5, unread ? "extrabold" : "semibold", c.ink)} numberOfLines={expanded ? 4 : 1}>
            {item.title}
          </Text>
          <Text style={type.ui(13.5, "medium", c.inkMute, { lineHeight: 19 })} numberOfLines={expanded ? undefined : 2}>
            {item.message}
          </Text>
        </View>
        <Text style={type.ui(12, "semibold", unread ? c.goldText : c.inkMute)}>{timeAgo(item.createdAt)}</Text>
      </PressableScale>
    </ReanimatedSwipeable>
    </Animated.View>
  );
}

function InboxSkeleton() {
  const { c, r, shadow } = useStoreTheme();
  return (
    <ShimmerProvider>
      <View style={[styles.skeleton, shadow.soft, { backgroundColor: c.card, borderColor: c.line, borderRadius: r.xl }]}>
        {[0, 1, 2, 3].map((i) => (
          <View key={i} style={styles.skeletonRow}>
            <Bone width={44} height={44} radius={15} />
            <View style={styles.text}>
              <Bone width="55%" height={13} radius={6} />
              <Bone width="90%" height={11} radius={5} />
            </View>
            <Bone width={26} height={10} radius={5} />
          </View>
        ))}
      </View>
    </ShimmerProvider>
  );
}

const FILTER_EMPTY = STORE_NOTIFICATIONS.empty;

/**
 * Native inbox: filter chips, date-grouped cards, swipe a row left to archive / restore, tap to mark read.
 * items — the notifications for the current filter; counts — { all, unread, archived }.
 */
export default function StoreNotifications({
  navigation,
  loading,
  refreshing,
  onRefresh,
  error,
  onDismissError,
  items,
  counts,
  filter,
  onFilter,
  onOpen,
  onArchiveToggle,
}) {
  const { c } = useStoreTheme();
  const groups = useMemo(() => {
    const g = groupByDate(items);
    return [
      { key: "today", label: STORE_NOTIFICATIONS.groups.today, items: g.today },
      { key: "week", label: STORE_NOTIFICATIONS.groups.week, items: g.week },
      { key: "earlier", label: STORE_NOTIFICATIONS.groups.earlier, items: g.earlier },
    ].filter((section) => section.items.length > 0);
  }, [items]);

  const nothingAtAll = counts.all + counts.archived === 0;
  const emptyCopy = FILTER_EMPTY[nothingAtAll ? "all" : filter] || FILTER_EMPTY.all;

  return (
    <StoreScreen title={STORE_NOTIFICATIONS.title} navigation={navigation} refreshing={refreshing} onRefresh={onRefresh}>
      {error ? <StoreBanner message={error} onClose={onDismissError} /> : null}

      {!nothingAtAll || loading ? (
        <Rise>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips} style={styles.chipScroll}>
            <Chip label={STORE_NOTIFICATIONS.filters.all} count={counts.all || undefined} selected={filter === "all"} onPress={() => onFilter("all")} />
            <Chip label={STORE_NOTIFICATIONS.filters.unread} count={counts.unread || undefined} selected={filter === "unread"} onPress={() => onFilter("unread")} />
            <Chip label={STORE_NOTIFICATIONS.filters.archived} count={counts.archived || undefined} selected={filter === "archived"} onPress={() => onFilter("archived")} />
          </ScrollView>
        </Rise>
      ) : null}

      {loading ? (
        <InboxSkeleton />
      ) : items.length === 0 ? (
        <Card padded={false} style={{ borderColor: withAlpha(c.line, 0.6) }}>
          <EmptyState icon={emptyCopy.icon} title={emptyCopy.title} body={emptyCopy.body} />
        </Card>
      ) : (
        <GestureHandlerRootView>
          {groups.map((section, sectionIndex) => (
            <Rise key={section.key} index={sectionIndex + 1} style={styles.section}>
              <SectionLabel>{section.label}</SectionLabel>
              <Group>
                {section.items.map((item) => (
                  <NotificationRow key={item._id} item={item} onOpen={onOpen} onArchiveToggle={onArchiveToggle} />
                ))}
              </Group>
            </Rise>
          ))}
        </GestureHandlerRootView>
      )}
    </StoreScreen>
  );
}

const styles = StyleSheet.create({
  chipScroll: { marginHorizontal: -16 },
  chips: { gap: 10, paddingHorizontal: 16 },
  section: { marginBottom: 6 },
  row: { flexDirection: "row", alignItems: "center", gap: 14, paddingHorizontal: 16, paddingVertical: 14 },
  bubble: { width: 44, height: 44, borderRadius: 15, alignItems: "center", justifyContent: "center" },
  dot: { position: "absolute", top: -2, right: -2, width: 12, height: 12, borderRadius: 6, borderWidth: 2 },
  text: { flex: 1, minWidth: 0, gap: 3 },
  action: { width: 92, alignItems: "center", justifyContent: "center", gap: 4 },
  skeleton: { borderWidth: StyleSheet.hairlineWidth, overflow: "hidden" },
  skeletonRow: { flexDirection: "row", alignItems: "center", gap: 14, paddingHorizontal: 16, paddingVertical: 16 },
});
