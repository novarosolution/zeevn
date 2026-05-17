import React, { useEffect } from "react";
import { Animated, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { CUSTOMER_NAV_LINKS } from "../../content/appContent";
import { navigateCustomerNav } from "../../navigation/accountRoutes";
import { fonts, icon, semanticRadius, spacing, typography } from "../../theme/tokens";
import { HERITAGE } from "../../theme/customerAlchemy";
import { WEB_Z_INDEX } from "../../theme/web";

const BASE_DRAWER = [
  { route: "Home", label: CUSTOMER_NAV_LINKS.home.label, icon: "home-outline", auth: false },
  { route: "Categories", label: "Categories", icon: "apps-outline", auth: false },
  { route: "Cart", label: CUSTOMER_NAV_LINKS.cart.label, icon: "bag-outline", auth: true },
  { ...CUSTOMER_NAV_LINKS.orders, icon: "receipt-outline", auth: true },
  { route: "Profile", label: CUSTOMER_NAV_LINKS.profile.label, icon: "person-outline", auth: true },
  { route: "Support", label: CUSTOMER_NAV_LINKS.support.label, icon: "chatbubble-ellipses-outline", auth: false },
  { ...CUSTOMER_NAV_LINKS.settings, icon: "settings-outline", auth: true },
];

function buildLoginReturnTo(item) {
  if (item.accountScreen) {
    return { name: item.route, params: { screen: item.accountScreen } };
  }
  if (item.params) {
    return { name: item.route, params: item.params };
  }
  return { name: item.route };
}

/**
 * Narrow-web navigation drawer (<768px header).
 */
export default function WebHeaderDrawer({
  visible,
  onClose,
  navigationRef,
  colors,
  isDark,
  isAuthenticated,
  user,
  onOpenSearch,
}) {
  const slide = React.useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!visible) {
      slide.setValue(0);
      return;
    }
    slide.setValue(0);
    Animated.timing(slide, {
      toValue: 1,
      duration: 220,
      useNativeDriver: Platform.OS !== "web",
    }).start();
  }, [slide, visible]);

  useEffect(() => {
    if (!visible || Platform.OS !== "web" || typeof window === "undefined") return undefined;
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [onClose, visible]);

  const go = (item) => {
    onClose();
    if (!navigationRef?.isReady?.()) return;
    if (item.auth && !isAuthenticated) {
      navigationRef.navigate("Login", { returnTo: buildLoginReturnTo(item) });
      return;
    }
    navigateCustomerNav(navigationRef, item);
  };

  const border = isDark ? "rgba(255,255,255,0.12)" : "rgba(148,163,184,0.28)";

  const links = [...BASE_DRAWER];
  if (user?.isDeliveryPartner) {
    links.push({
      route: "DeliveryDashboard",
      label: CUSTOMER_NAV_LINKS.delivery.label,
      icon: "bicycle-outline",
      auth: true,
    });
  }
  if (user?.isAdmin) {
    links.push({
      route: "AdminDashboard",
      label: CUSTOMER_NAV_LINKS.admin.label,
      icon: "shield-checkmark-outline",
      auth: true,
    });
  }

  const translateX = slide.interpolate({
    inputRange: [0, 1],
    outputRange: [-300, 0],
  });

  const panel = (
    <Animated.View
      pointerEvents="auto"
      style={[
        styles.panel,
        {
          transform: [{ translateX }],
          backgroundColor: colors.surface,
          borderRightColor: border,
        },
      ]}
    >
      <View style={[styles.panelHeader, { borderBottomColor: border }]}>
        <Text style={[styles.menuTitle, { color: colors.textPrimary, fontFamily: fonts.semibold }]}>Menu</Text>
        <Pressable onPress={onClose} hitSlop={10} accessibilityRole="button" accessibilityLabel="Close menu">
          <Ionicons name="close" size={26} color={colors.textSecondary} />
        </Pressable>
      </View>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <Pressable
          onPress={() => {
            onClose();
            onOpenSearch?.();
          }}
          style={({ pressed, hovered }) => [
            styles.row,
            { borderColor: border },
            hovered && Platform.OS === "web" ? { backgroundColor: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.03)" } : null,
            pressed && { opacity: 0.9 },
          ]}
          accessibilityRole="button"
        >
          <Ionicons name="search-outline" size={icon.md} color={colors.textPrimary} />
          <Text style={[styles.rowLabel, { color: colors.textPrimary, fontFamily: fonts.semibold }]}>Search</Text>
        </Pressable>
        {links.map((item) => (
          <Pressable
            key={`${item.route}-${item.label}`}
            onPress={() => go(item)}
            style={({ pressed, hovered }) => [
              styles.row,
              { borderColor: border },
              hovered && Platform.OS === "web" ? { backgroundColor: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.03)" } : null,
              pressed && { opacity: 0.9 },
            ]}
            accessibilityRole="button"
          >
            <Ionicons name={item.icon} size={icon.md} color={colors.textPrimary} />
            <Text style={[styles.rowLabel, { color: colors.textPrimary, fontFamily: fonts.medium }]}>{item.label}</Text>
          </Pressable>
        ))}
      </ScrollView>
      <View style={[styles.accentLine, { backgroundColor: HERITAGE.brass }]} />
    </Animated.View>
  );

  if (!visible) return null;

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose} statusBarTranslucent>
      <View style={styles.root} pointerEvents="box-none">
        <Pressable
          style={styles.scrim}
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel="Close menu"
        />
        {panel}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    position: "relative",
    zIndex: WEB_Z_INDEX.overlay,
    ...Platform.select({
      web: { minHeight: "100vh" },
      default: {},
    }),
  },
  scrim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(6, 10, 18, 0.45)",
    zIndex: 1,
    ...Platform.select({
      web: { cursor: "pointer" },
      default: {},
    }),
  },
  panel: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    width: 288,
    maxWidth: "88%",
    borderRightWidth: StyleSheet.hairlineWidth,
    zIndex: 10,
    ...Platform.select({
      web: { maxHeight: "100vh", boxShadow: "8px 0 32px rgba(15, 23, 42, 0.18)" },
      default: { maxHeight: "100%" },
    }),
  },
  panelHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  menuTitle: {
    fontSize: typography.h4,
  },
  scroll: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
    gap: spacing.xs,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderRadius: semanticRadius.panel,
    borderWidth: StyleSheet.hairlineWidth,
    ...Platform.select({
      web: { cursor: "pointer" },
      default: {},
    }),
  },
  rowLabel: {
    fontSize: typography.body,
  },
  accentLine: {
    height: 3,
    width: "100%",
    opacity: 0.9,
  },
});
