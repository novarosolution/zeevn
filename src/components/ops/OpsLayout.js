import React, { useMemo, useState } from "react";
import {
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Screen from "../ui/Screen";
import Button from "../ui/Button";
import AccountSidebarNavItem from "../account/interactions/AccountSidebarNavItem";
import { useTheme } from "../../context/ThemeContext";
import {
  OPS_ADMIN_KICKER,
  OPS_DELIVERY_KICKER,
  getOpsAdminSidebarSections,
  OPS_DELIVERY_NAV,
} from "../../constants/opsNav";
import { fonts, icon } from "../../theme/tokens";
import { CUSTOMER_PAGE_MAX_WIDTH } from "../../theme/screenLayout";
import { FONT_DISPLAY_SEMI } from "../../theme/customerAlchemy";
import { headingA11yProps } from "../../utils/a11y";
import { APP_VIEWPORT_MIN_HEIGHT } from "../../utils/webViewport";

const SIDEBAR_WIDTH = 240;

function toNavItem(item) {
  return { key: item.route, label: item.label, icon: item.icon, route: item.route };
}

/**
 * Admin / delivery shell — AccountShell pattern: sticky sidebar, breadcrumb + ink title, dense content.
 */
export default function OpsLayout({
  navigation,
  mode = "admin",
  sectionTitle,
  activeRoute,
  headerRight,
  children,
  refreshControl,
  scrollContentStyle,
}) {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const { semanticPalette, TYPE, SPACING } = useTheme();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [hoveredKey, setHoveredKey] = useState(null);

  const isDesktop = Platform.OS === "web" && width >= 1024;
  const isTablet = width >= 768 && width < 1024;
  const kicker = mode === "delivery" ? OPS_DELIVERY_KICKER : OPS_ADMIN_KICKER;
  const flatItems = useMemo(
    () => (mode === "delivery" ? OPS_DELIVERY_NAV : getOpsAdminSidebarSections()[0]?.items || []),
    [mode]
  );

  const navigateTo = (route) => {
    setDrawerOpen(false);
    navigation.navigate(route);
  };

  const menuBtn =
    !isDesktop ? (
      <Button
        variant="ghost"
        size="sm"
        label=""
        iconLeft={<Ionicons name="menu-outline" size={icon.md} color={semanticPalette.ink} />}
        onPress={() => setDrawerOpen(true)}
        accessibilityLabel="Open navigation"
      />
    ) : null;

  const mergedHeaderRight = (
    <View style={{ flexDirection: "row", alignItems: "center", gap: SPACING.sm }}>
      {headerRight}
      {menuBtn}
    </View>
  );

  const renderSidebarItem = (item, navIndex = 0) => {
    const navItem = toNavItem(item);
    const active = activeRoute === item.route;
    return (
      <AccountSidebarNavItem
        key={item.route}
        item={navItem}
        active={active}
        hovered={hoveredKey === item.route || (Platform.OS === "web" && false)}
        onPress={() => navigateTo(item.route)}
        onHoverIn={() => Platform.OS === "web" && setHoveredKey(item.route)}
        onHoverOut={() => Platform.OS === "web" && setHoveredKey(null)}
      />
    );
  };

  const sidebar = (
    <View style={{ marginLeft: -14 }}>
      {flatItems.map((item, index) => renderSidebarItem(item, index))}
    </View>
  );

  const pillNav = (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={{ marginHorizontal: -SPACING.lg, paddingHorizontal: SPACING.lg }}
      contentContainerStyle={{ flexDirection: "row", gap: 8, paddingVertical: SPACING.xs }}
    >
      {flatItems.map((item) => {
        const active = activeRoute === item.route;
        return (
          <Pressable
            key={item.route}
            onPress={() => navigateTo(item.route)}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
            style={[
              {
                paddingVertical: 8,
                paddingHorizontal: 16,
                borderRadius: 999,
                borderWidth: 1,
                flexDirection: "row",
                alignItems: "center",
                gap: 6,
                flexShrink: 0,
                borderColor: active ? semanticPalette.ink : semanticPalette.line,
                backgroundColor: active ? semanticPalette.ink : semanticPalette.surface,
              },
              Platform.OS === "web" ? { cursor: "pointer" } : null,
            ]}
          >
            <Ionicons
              name={item.icon}
              size={16}
              color={active ? semanticPalette.inkInverse : semanticPalette.inkSoft}
            />
            <Text
              style={{
                fontFamily: fonts.medium,
                fontSize: 14,
                color: active ? semanticPalette.inkInverse : semanticPalette.ink,
              }}
            >
              {item.label}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );

  return (
    <>
      <Screen
        navigation={navigation}
        breadcrumbLabel={kicker}
        headerRight={mergedHeaderRight}
        refreshControl={refreshControl}
        contentContainerStyle={{
          maxWidth: CUSTOMER_PAGE_MAX_WIDTH + 160,
          paddingBottom: insets.bottom + SPACING["2xl"],
          ...scrollContentStyle,
        }}
      >
        <View style={{ flexDirection: isDesktop ? "row" : "column", gap: SPACING.xl, alignItems: "flex-start" }}>
          {isDesktop ? (
            <View
              style={{
                width: SIDEBAR_WIDTH,
                flexShrink: 0,
                ...Platform.select({
                  web: {
                    position: "sticky",
                    top: 96,
                    alignSelf: "flex-start",
                    maxHeight: `calc(${APP_VIEWPORT_MIN_HEIGHT} - 120px)`,
                  },
                  default: {},
                }),
              }}
              accessibilityRole="navigation"
              accessibilityLabel={kicker}
            >
              {sidebar}
            </View>
          ) : null}

          <View style={{ flex: 1, minWidth: 0, width: "100%" }}>
            {isTablet ? <View style={{ marginBottom: SPACING.md }}>{pillNav}</View> : null}

            <View style={{ marginBottom: SPACING.lg }}>
              <Text
                style={{
                  fontFamily: fonts.medium,
                  fontSize: 12,
                  lineHeight: 16,
                  letterSpacing: 0.6,
                  textTransform: "uppercase",
                  color: semanticPalette.inkMuted,
                  marginBottom: SPACING.xs,
                }}
              >
                {kicker} › {sectionTitle || "Overview"}
              </Text>
              <View style={{ flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", gap: SPACING.sm }}>
                <Text
                  style={{
                    fontFamily: FONT_DISPLAY_SEMI,
                    fontSize: TYPE.h1.fontSize,
                    lineHeight: TYPE.h1.lineHeight,
                    color: semanticPalette.ink,
                    flex: 1,
                  }}
                  {...headingA11yProps(1)}
                >
                  {sectionTitle || "Overview"}
                </Text>
              </View>
            </View>

            {children}
          </View>
        </View>
      </Screen>

      {!isDesktop ? (
        <Modal visible={drawerOpen} animationType="slide" transparent onRequestClose={() => setDrawerOpen(false)}>
          <Pressable style={styles.drawerScrim} onPress={() => setDrawerOpen(false)} />
          <View
            style={[
              styles.drawerPanel,
              { backgroundColor: semanticPalette.surface, paddingTop: insets.top + SPACING.md },
            ]}
          >
            <View style={{ flexDirection: "row", justifyContent: "flex-end", paddingHorizontal: SPACING.md }}>
              <Pressable onPress={() => setDrawerOpen(false)} hitSlop={12} accessibilityLabel="Close menu">
                <Ionicons name="close" size={icon.lg} color={semanticPalette.ink} />
              </Pressable>
            </View>
            <ScrollView contentContainerStyle={{ padding: SPACING.md }}>{sidebar}</ScrollView>
          </View>
        </Modal>
      ) : null}
    </>
  );
}

const styles = StyleSheet.create({
  drawerScrim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(14, 23, 41, 0.45)",
  },
  drawerPanel: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    width: 288,
    maxWidth: "88%",
    borderRightWidth: StyleSheet.hairlineWidth,
    borderRightColor: "rgba(148,163,184,0.35)",
  },
});
