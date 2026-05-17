import React, { useMemo, useState } from "react";
import { Modal, Platform, Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Screen from "../ui/Screen";
import Button from "../ui/Button";
import { useTheme } from "../../context/ThemeContext";
import {
  OPS_ADMIN_KICKER,
  OPS_DELIVERY_KICKER,
  getOpsAdminSidebarSections,
  OPS_DELIVERY_NAV,
} from "../../constants/opsNav";
import { fonts, icon } from "../../theme/tokens";
import { CUSTOMER_PAGE_MAX_WIDTH } from "../../theme/screenLayout";

function NavItem({ item, active, onPress, onNavigate }) {
  const { semanticPalette, TYPE, SPACING, RADII } = useTheme();

  const go = () => {
    onPress?.();
    if (item.route === "Home") {
      onNavigate("Home");
    } else {
      onNavigate(item.route);
    }
  };

  return (
    <Pressable
      onPress={go}
      style={({ pressed, hovered }) => [
        {
          flexDirection: "row",
          alignItems: "center",
          gap: SPACING.sm,
          paddingVertical: SPACING.sm,
          paddingHorizontal: SPACING.md,
          borderRadius: RADII.md,
          marginBottom: 4,
          borderLeftWidth: 3,
          borderLeftColor: active ? semanticPalette.accent : "transparent",
          backgroundColor: active ? semanticPalette.surfaceAlt : "transparent",
        },
        hovered && Platform.OS === "web" && !active ? { backgroundColor: semanticPalette.surfaceAlt } : null,
        pressed ? { opacity: 0.88 } : null,
      ]}
      accessibilityRole="button"
      accessibilityLabel={item.label}
      accessibilityState={{ selected: active }}
    >
      <Ionicons name={item.icon} size={icon.sm} color={active ? semanticPalette.accent : semanticPalette.inkMuted} />
      <Text
        style={{
          fontFamily: fonts.medium,
          fontSize: TYPE.small.fontSize,
          color: active ? semanticPalette.ink : semanticPalette.inkSoft,
          flex: 1,
        }}
        numberOfLines={1}
      >
        {item.label}
      </Text>
    </Pressable>
  );
}

function SidebarNav({ sections, activeRoute, onNavigate, onItemPress }) {
  const { semanticPalette, TYPE, SPACING } = useTheme();

  return (
    <View>
      {sections.map((section) => (
        <View key={section.id} style={{ marginBottom: SPACING.lg }}>
          {section.label ? (
            <Text
              style={{
                fontFamily: fonts.semibold,
                fontSize: TYPE.micro.fontSize,
                letterSpacing: 1.2,
                textTransform: "uppercase",
                color: semanticPalette.inkMuted,
                marginBottom: SPACING.sm,
                paddingHorizontal: SPACING.md,
              }}
            >
              {section.label}
            </Text>
          ) : null}
          {section.items.map((item) => (
            <NavItem
              key={item.route}
              item={item}
              active={activeRoute === item.route}
              onNavigate={onNavigate}
              onPress={onItemPress}
            />
          ))}
        </View>
      ))}
    </View>
  );
}

/**
 * Admin / delivery operations shell: Screen + sidebar (240px desktop) or drawer (phone).
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
  const { semanticPalette, SPACING } = useTheme();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const desktopSidebar = Platform.OS === "web" && width >= 1024;
  const kicker = mode === "delivery" ? OPS_DELIVERY_KICKER : OPS_ADMIN_KICKER;
  const sections = useMemo(
    () => (mode === "delivery" ? [{ id: "delivery", items: OPS_DELIVERY_NAV }] : getOpsAdminSidebarSections()),
    [mode]
  );

  const navigateTo = (route) => {
    setDrawerOpen(false);
    navigation.navigate(route);
  };

  const menuBtn =
    !desktopSidebar ? (
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

  const sidebar = (
    <SidebarNav
      sections={sections}
      activeRoute={activeRoute}
      onNavigate={navigateTo}
      onItemPress={() => setDrawerOpen(false)}
    />
  );

  return (
    <>
      <Screen
        navigation={navigation}
        title={sectionTitle}
        kicker={kicker}
        breadcrumbLabel={kicker}
        headerRight={mergedHeaderRight}
        refreshControl={refreshControl}
        contentContainerStyle={{
          maxWidth: CUSTOMER_PAGE_MAX_WIDTH + 120,
          paddingBottom: insets.bottom + SPACING["2xl"],
          ...scrollContentStyle,
        }}
      >
        <View style={{ flexDirection: desktopSidebar ? "row" : "column", gap: SPACING.xl, alignItems: "flex-start" }}>
          {desktopSidebar ? (
            <View
              style={{
                width: 240,
                flexShrink: 0,
                ...Platform.select({
                  web: { position: "sticky", top: 96, alignSelf: "flex-start" },
                  default: {},
                }),
              }}
            >
              {sidebar}
            </View>
          ) : null}
          <View style={{ flex: 1, minWidth: 0, width: "100%" }}>{children}</View>
        </View>
      </Screen>

      {!desktopSidebar ? (
        <Modal visible={drawerOpen} animationType="slide" transparent onRequestClose={() => setDrawerOpen(false)}>
          <Pressable style={styles.drawerScrim} onPress={() => setDrawerOpen(false)} />
          <View style={[styles.drawerPanel, { backgroundColor: semanticPalette.surface, paddingTop: insets.top + SPACING.md }]}>
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
