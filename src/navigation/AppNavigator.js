import React, { useMemo } from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { Platform, StyleSheet, View } from "react-native";
import AppStartupScreen from "../components/AppStartupScreen";
import WebAppHeader from "../components/WebAppHeader";
import { WEB_HEADER_HEIGHT } from "../theme/web";
import HomeScreen from "../screens/HomeScreen";
import ProductScreen from "../screens/ProductScreen";
import CartScreen from "../screens/CartScreen";
import LoginScreen from "../screens/LoginScreen";
import RegisterScreen from "../screens/RegisterScreen";
import ProfileScreen from "../screens/ProfileScreen";
import EditProfileScreen from "../screens/EditProfileScreen";
import MyOrdersScreen from "../screens/MyOrdersScreen";
import NotificationsScreen from "../screens/NotificationsScreen";
import SettingsScreen from "../screens/SettingsScreen";
import ManageAddressScreen from "../screens/ManageAddressScreen";
import SupportScreen from "../screens/SupportScreen";
import AdminDashboardScreen from "../screens/admin/AdminDashboardScreen";
import AdminProductsScreen from "../screens/admin/AdminProductsScreen";
import AdminAddProductScreen from "../screens/admin/AdminAddProductScreen";
import AdminOrdersScreen from "../screens/admin/AdminOrdersScreen";
import AdminUsersScreen from "../screens/admin/AdminUsersScreen";
import AdminNotificationsScreen from "../screens/admin/AdminNotificationsScreen";
import AdminAnalyticsScreen from "../screens/admin/AdminAnalyticsScreen";
import AdminCouponsScreen from "../screens/admin/AdminCouponsScreen";
import AdminSupportScreen from "../screens/admin/AdminSupportScreen";
import AdminHomeViewScreen from "../screens/admin/AdminHomeViewScreen";
import AdminInventoryScreen from "../screens/admin/AdminInventoryScreen";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";

const Stack = createNativeStackNavigator();

export default function AppNavigator({ currentRouteName, navigationRef }) {
  const { isAuthLoading } = useAuth();
  const { colors, isDark } = useTheme();

  const webPad = Platform.OS === "web" ? { paddingTop: WEB_HEADER_HEIGHT } : null;

  const screenOptions = useMemo(
    () => ({
      headerShown: false,
      contentStyle: { backgroundColor: "transparent" },
      animation: Platform.OS === "web" ? "none" : "fade",
      gestureEnabled: true,
      fullScreenGestureEnabled: true,
    }),
    []
  );

  return (
    <View style={styles.navRoot}>
      {Platform.OS === "web" ? (
        <WebAppHeader currentRouteName={currentRouteName} navigationRef={navigationRef} />
      ) : null}
      <View style={[styles.stackFill, webPad]}>
        {isAuthLoading ? (
          <AppStartupScreen colors={colors} isDark={isDark} useAppFonts footnote="Syncing your session…" />
        ) : (
    <Stack.Navigator initialRouteName="Home" screenOptions={screenOptions}>
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
      <Stack.Screen name="Home" component={HomeScreen} />
      <Stack.Screen name="Product" component={ProductScreen} />
      <Stack.Screen name="Cart" component={CartScreen} />
      <Stack.Screen name="Profile" component={ProfileScreen} />
      <Stack.Screen name="EditProfile" component={EditProfileScreen} />
      <Stack.Screen name="MyOrders" component={MyOrdersScreen} />
      <Stack.Screen name="Notifications" component={NotificationsScreen} />
      <Stack.Screen name="Settings" component={SettingsScreen} />
      <Stack.Screen name="ManageAddress" component={ManageAddressScreen} />
      <Stack.Screen name="Support" component={SupportScreen} />
      <Stack.Screen name="AdminDashboard" component={AdminDashboardScreen} />
      <Stack.Screen name="AdminProducts" component={AdminProductsScreen} />
      <Stack.Screen name="AdminInventory" component={AdminInventoryScreen} />
      <Stack.Screen name="AdminAddProduct" component={AdminAddProductScreen} />
      <Stack.Screen name="AdminOrders" component={AdminOrdersScreen} />
      <Stack.Screen name="AdminUsers" component={AdminUsersScreen} />
      <Stack.Screen name="AdminNotifications" component={AdminNotificationsScreen} />
      <Stack.Screen name="AdminAnalytics" component={AdminAnalyticsScreen} />
      <Stack.Screen name="AdminCoupons" component={AdminCouponsScreen} />
      <Stack.Screen name="AdminSupport" component={AdminSupportScreen} />
      <Stack.Screen name="AdminHomeView" component={AdminHomeViewScreen} />
    </Stack.Navigator>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  navRoot: {
    flex: 1,
    width: "100%",
    ...Platform.select({
      web: { minHeight: "100vh", height: "100%" },
      default: {},
    }),
  },
  stackFill: {
    flex: 1,
    width: "100%",
    minHeight: 0,
  },
});
